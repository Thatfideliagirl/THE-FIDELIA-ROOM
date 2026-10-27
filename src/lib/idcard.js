// Same reasoning as certificate.js for toBlob()+createObjectURL() over
// toDataURL(): a blob: URL downloads reliably on mobile Safari, a data:
// URI often doesn't.
//
// Unlike a certificate (one image + two text overlays), an ID card also
// composites the student's own uploaded photo into a frame -- drawn with
// a simple cover-fit crop (scale to fill the box, centered, clipped to
// its bounds) so a photo of any shape or size fills the frame cleanly
// without stretching, the same way object-fit: cover would in CSS.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load an image for the ID card."));
    img.src = src;
  });
}

export async function renderIdCard(templateDataUrl, photoDataUrl, { name, studentId, programme, cohort, photoBox, namePos, idPos, programmePos, cohortPos, fontSizePct }, color = "#1B2A4A") {
  const template = await loadImage(templateDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0);

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
