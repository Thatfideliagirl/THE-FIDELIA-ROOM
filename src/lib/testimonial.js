import { loadImage, drawPhotoIntoBox, fitLine, supersampledSize } from "./idcard.js";

// Wraps text onto lines no wider than maxWidth, breaking on spaces.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// The quote is the one field with real variance in length -- a one-line
// blurb and a six-sentence story both have to read well on the same
// template. It shrinks the font (re-wrapping at each size, since a
// smaller font fits more words per line) until the wrapped lines fit
// inside the box's height, down to a floor; past that floor it keeps
// shrinking isn't legible anymore, so it instead keeps as many whole
// lines as fit and marks the cut with a trailing ellipsis, the same
// "never overflow the card" guarantee the other fields already have.
function fitQuote(ctx, text, maxWidth, maxHeight, baseSize, minSize, fontSpec) {
  let size = baseSize;
  let lines, lineHeight;
  for (; size >= minSize; size--) {
    ctx.font = fontSpec(size);
    lineHeight = size * 1.4;
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length * lineHeight <= maxHeight) return { size, lineHeight, lines };
  }
  size = minSize;
  ctx.font = fontSpec(size);
  lineHeight = size * 1.4;
  lines = wrapLines(ctx, text, maxWidth);
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    lines = kept;
  }
  return { size, lineHeight, lines };
}

export async function renderTestimonialCard(templateDataUrl, photoDataUrl, { name, studentId, cohort, quote, photoBox, namePos, idPos, quoteBox, fontSizePct, quoteFontSizePct, photoZoom, photoPanXPct, photoPanYPct }, color = "#1B2A4A") {
  const template = await loadImage(templateDataUrl);
  const canvas = document.createElement("canvas");
  const { width, height } = supersampledSize(template);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  if (photoDataUrl && photoBox) {
    const photo = await loadImage(photoDataUrl);
    drawPhotoIntoBox(ctx, photo, canvas, photoBox, photoZoom, photoPanXPct, photoPanYPct);
  }

  const fontFamily = "Georgia, 'Times New Roman', serif";
  ctx.fillStyle = color;

  if (name && namePos) {
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const baseSize = Math.max(6, Math.round(canvas.width * ((fontSizePct ?? 3) / 100)));
    const startX = canvas.width * (namePos.xPct / 100);
    const maxWidth = canvas.width - startX - canvas.width * 0.03;
    const fit = fitLine(ctx, name, maxWidth, baseSize, Math.max(5, Math.round(baseSize * 0.55)), (s) => `700 ${s}px ${fontFamily}`);
    ctx.font = `700 ${fit.size}px ${fontFamily}`;
    ctx.fillText(fit.text, startX, canvas.height * (namePos.yPct / 100));
  }
  if (studentId && idPos) {
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const baseSize = Math.max(5, Math.round(canvas.width * ((fontSizePct ?? 3) / 100) * 0.7));
    const startX = canvas.width * (idPos.xPct / 100);
    const maxWidth = canvas.width - startX - canvas.width * 0.03;
    const fit = fitLine(ctx, studentId, maxWidth, baseSize, Math.max(4, Math.round(baseSize * 0.55)), (s) => `500 ${s}px ${fontFamily}`);
    ctx.font = `500 ${fit.size}px ${fontFamily}`;
    ctx.fillText(fit.text, startX, canvas.height * (idPos.yPct / 100));
  }
  // cohort is shown alongside the quote only on the expanded landing-page
  // view, not baked into the card image -- see CourseDetail/Landing --
  // it's real data on the testimonial record either way.
  void cohort;

  if (quote && quoteBox) {
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    const bw = canvas.width * (quoteBox.widthPct / 100);
    const bh = canvas.height * (quoteBox.heightPct / 100);
    const bx = canvas.width * (quoteBox.xPct / 100) - bw / 2;
    const by = canvas.height * (quoteBox.yPct / 100) - bh / 2;
    const baseSize = Math.max(6, Math.round(canvas.width * ((quoteFontSizePct ?? 2.2) / 100)));
    // Letting this shrink too far in the name of fitting every word was
    // exactly what made a long quote unreadable -- better to keep it
    // closer to the size actually asked for and truncate the rest with
    // an ellipsis than to shrink it down to illegible.
    const minSize = Math.max(8, Math.round(baseSize * 0.8));
    const { size, lineHeight, lines } = fitQuote(ctx, quote, bw, bh, baseSize, minSize, (s) => `italic 400 ${s}px ${fontFamily}`);
    ctx.font = `italic 400 ${size}px ${fontFamily}`;
    lines.forEach((line, i) => ctx.fillText(line, bx, by + lineHeight * (i + 0.85)));
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Couldn't finish building the testimonial card image.")); return; }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}
