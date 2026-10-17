// Draws a student's name onto the admin's uploaded certificate template and
// hands back a finished PNG -- this is the only place that actually
// "bakes" a name into the image, so the admin's drag-to-position preview
// and the student's real downloaded certificate can never drift apart.
export function renderCertificate(templateDataUrl, name, namePos, fontSizePct, color = "#2A2620") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const fontSize = Math.max(8, Math.round(canvas.width * ((fontSizePct ?? 6) / 100)));
      ctx.font = `600 ${fontSize}px Georgia, 'Times New Roman', serif`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, canvas.width * ((namePos?.xPct ?? 50) / 100), canvas.height * ((namePos?.yPct ?? 55) / 100));
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Couldn't load the certificate template image."));
    img.src = templateDataUrl;
  });
}
