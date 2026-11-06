import { uploadFile } from "./storage.js";

// A phone photo or a designer's PNG export is routinely 2-5 MB; shown on a
// card a few hundred pixels wide, almost all of that is wasted download.
// Every picked image is scaled down to `maxDim` on its longest side and
// re-encoded (JPEG, or PNG when it has transparency) before it's stored.

function loadFromUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = src;
  });
}

// Sampled, not exhaustive -- a template with transparent corners or a
// cut-out logo has plenty of see-through pixels, so every 7th is enough.
export function hasTransparency(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 4 * 7) if (data[i] < 250) return true;
  return false;
}

export async function compressImage(file, { maxDim = 1600, quality = 0.86 } = {}) {
  if (!file?.type?.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const src = URL.createObjectURL(file);
  try {
    const img = await loadFromUrl(src);
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    const type = hasTransparency(ctx, w, h) ? "image/png" : "image/jpeg";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.size >= file.size) return file;
    const base = (file.name || "image").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.${type === "image/png" ? "png" : "jpg"}`, { type });
  } finally {
    URL.revokeObjectURL(src);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// Shrinks, then stores as a real file in Storage (a small URL in the
// database instead of megabytes of base64). If the upload itself fails,
// falls back to the shrunk image inline so picking a file still works.
export async function prepareImage(file, opts) {
  const small = await compressImage(file, opts);
  try {
    return await uploadFile(small);
  } catch (e) {
    console.error("image upload failed, keeping it inline", e);
    return blobToDataUrl(small);
  }
}

// For images already saved inline as base64 before this existed.
export async function moveDataUrlToStorage(dataUrl, name, opts) {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], name || "image", { type: blob.type });
  const small = await compressImage(file, opts);
  return uploadFile(small);
}
