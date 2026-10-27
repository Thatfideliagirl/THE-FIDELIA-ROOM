// Same reasoning as certificate.js for toBlob()+createObjectURL() over
// toDataURL(): a blob: URL downloads reliably on mobile Safari, a data:
// URI often doesn't.
//
// Unlike a certificate (one image + two text overlays), an ID card also
// composites the student's own uploaded photo into a frame -- drawn with
// a simple cover-fit crop (scale to fill the box, centered, clipped to
// its bounds) so a photo of any shape or size fills the frame cleanly
// without stretching, the same way object-fit: cover would in CSS.
// Every testimonial/ID card on a page shares the same template image, but
// each card decodes it independently -- with several cards on one page
// (the testimonials page, a course page with a few related ones) that's
// the same, often sizeable, image decoded over and over, which is exactly
// the kind of delay that shows up as "it takes time before it displays."
// Caching the decoded Image by its src means only the first card pays
// that cost; every other card reuses the same already-decoded image.
const imageCache = new Map();
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { imageCache.delete(src); reject(new Error("Couldn't load an image.")); };
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

// A template gets uploaded at whatever resolution it happens to be --
// often far smaller than looks sharp once displayed at card size on a
// phone. Every field (photo box, text position, font size) is already
// positioned as a percentage of the canvas, so rendering onto a canvas
// stretched up to a generous minimum width scales the template, the
// photo and all the text up together for free, with zero change to how
// any of those percentages are read. Never downscales an already-large
// upload.
const RENDER_TARGET_WIDTH = 1400;
export function supersampledSize(template) {
  const scale = Math.max(1, RENDER_TARGET_WIDTH / template.naturalWidth);
  return { width: Math.round(template.naturalWidth * scale), height: Math.round(template.naturalHeight * scale) };
}

// Shared by the ID card and the testimonial card -- both composite a
// student's photo into a center-anchored {xPct,yPct,widthPct,heightPct}
// box with a cover-fit crop (scale to fill, centered, clipped to the
// box), the same way object-fit: cover would in CSS. zoom (default 1)
// scales the crop in further around that same center point. On its own
// that's not enough for a photo whose subject isn't centered (a full-
// body shot, say) -- zooming in just crops in on the photo's own middle,
// which for that kind of photo lands on the torso, not the face. panXPct
// and panYPct (0-100, 50 = centered, matching the old behavior exactly)
// shift which part of the zoomed-in photo sits in the box: 0 shows the
// photo's own left/top edge, 100 shows its right/bottom edge.
export function drawPhotoIntoBox(ctx, photo, canvas, box, zoom = 1, panXPct = 50, panYPct = 50) {
  const bw = canvas.width * (box.widthPct / 100);
  const bh = canvas.height * (box.heightPct / 100);
  const bx = canvas.width * (box.xPct / 100) - bw / 2;
  const by = canvas.height * (box.yPct / 100) - bh / 2;
  const scale = Math.max(bw / photo.naturalWidth, bh / photo.naturalHeight) * (zoom || 1);
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  // slack is how much bigger the drawn photo is than its box -- the only
  // room there is to pan it around without opening a gap at an edge.
  const slackX = Math.max(0, dw - bw);
  const slackY = Math.max(0, dh - bh);
  const dx = bx - slackX * (((panXPct ?? 50) / 100));
  const dy = by - slackY * (((panYPct ?? 50) / 100));
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

// Shrinks one line of text to fit within maxWidth, truncating with an
// ellipsis as a last resort if it still doesn't fit at the smallest
// readable size -- used for any single-line field (a name, an ID, a
// title) that has no guarantee of staying short.
export function fitLine(ctx, text, maxWidth, baseSize, minSize, fontSpec) {
  let size = baseSize;
  ctx.font = fontSpec(size);
  while (ctx.measureText(text).width > maxWidth && size > minSize) { size -= 1; ctx.font = fontSpec(size); }
  let out = text;
  if (ctx.measureText(out).width > maxWidth) {
    while (out.length > 1 && ctx.measureText(out + "…").width > maxWidth) out = out.slice(0, -1);
    if (out.length < text.length) out += "…";
  }
  return { size, text: out };
}

export async function renderIdCard(templateDataUrl, photoDataUrl, { name, studentId, programme, cohort, photoBox, namePos, idPos, programmePos, cohortPos, fontSizePct }, color = "#1B2A4A") {
  const template = await loadImage(templateDataUrl);
  const canvas = document.createElement("canvas");
  const { width, height } = supersampledSize(template);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  if (photoDataUrl && photoBox) {
    const photo = await loadImage(photoDataUrl);
    const bx = canvas.width * (photoBox.xPct / 100) - (canvas.width * (photoBox.widthPct / 100)) / 2;
    const by = canvas.height * (photoBox.yPct / 100) - (canvas.height * (photoBox.heightPct / 100)) / 2;
    const bw = canvas.width * (photoBox.widthPct / 100);
    const bh = canvas.height * (photoBox.heightPct / 100);
    const scale = Math.max(bw / photo.naturalWidth, bh / photo.naturalHeight);
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    const dx = bx + (bw - dw) / 2;
    const dy = by + (bh - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.restore();
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  const fontFamily = "Georgia, 'Times New Roman', serif";
  const baseSize = Math.max(6, Math.round(canvas.width * ((fontSizePct ?? 3) / 100)));
  const minSize = Math.max(5, Math.round(baseSize * 0.55));
  const fields = [[name, namePos], [studentId, idPos], [programme, programmePos], [cohort, cohortPos]];
  for (const [rawText, pos] of fields) {
    if (!rawText || !pos) continue;
    const startX = canvas.width * (pos.xPct / 100);
    // A long name or programme has nowhere further right to go than the
    // card's own edge -- shrinking the font to fit is what keeps it inside
    // its field instead of running off the card, same as every other field
    // on the card regardless of how long the text turns out to be.
    const maxWidth = canvas.width - startX - canvas.width * 0.03;
    let size = baseSize;
    ctx.font = `600 ${size}px ${fontFamily}`;
    while (ctx.measureText(rawText).width > maxWidth && size > minSize) { size -= 1; ctx.font = `600 ${size}px ${fontFamily}`; }
    let text = rawText;
    if (ctx.measureText(text).width > maxWidth) {
      while (text.length > 1 && ctx.measureText(text + "…").width > maxWidth) text = text.slice(0, -1);
      if (text.length < rawText.length) text += "…";
    }
    ctx.fillText(text, startX, canvas.height * (pos.yPct / 100));
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Couldn't finish building the ID card image.")); return; }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}
