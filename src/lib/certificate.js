// Draws a student's name -- and optionally an issue date -- onto the
// admin's uploaded certificate template and hands back a finished PNG as
// a blob: URL, not a data: URI. This is the only place that actually
// "bakes" text into the image, so the admin's drag-to-position preview
// and the student's real downloaded certificate can never drift apart.
//
// toBlob()+createObjectURL() instead of toDataURL() is not a style choice
// -- a data: URI is exactly what this app already avoids for every other
// upload (see storage.js) because most mobile browsers, iPhone Safari
// especially, don't reliably download a data: link at all; tapping
// "Download" would just open or do nothing instead of saving the file.
// A blob: URL downloads the same way a real uploaded file would.
export function renderCertificate(templateDataUrl, { name, namePos, fontSizePct, date, datePos, dateFontSizePct }, color = "#2A2620") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      const nameSize = Math.max(8, Math.round(canvas.width * ((fontSizePct ?? 6) / 100)));
      ctx.font = `600 ${nameSize}px Georgia, 'Times New Roman', serif`;
      ctx.fillText(name, canvas.width * ((namePos?.xPct ?? 50) / 100), canvas.height * ((namePos?.yPct ?? 55) / 100));
      if (date && datePos) {
        const dateSize = Math.max(6, Math.round(canvas.width * ((dateFontSizePct ?? 2.5) / 100)));
        ctx.font = `italic 400 ${dateSize}px Georgia, 'Times New Roman', serif`;
        ctx.fillText(date, canvas.width * (datePos.xPct / 100), canvas.height * (datePos.yPct / 100));
      }
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Couldn't finish building the certificate image.")); return; }
        resolve(URL.createObjectURL(blob));
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Couldn't load the certificate template image."));
    img.src = templateDataUrl;
  });
}

// A long, stylish form ("October 17, 2026") rather than a raw date string
// -- matches the serif, formal tone of a printed certificate.
export function formatIssueDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
