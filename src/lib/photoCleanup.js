import { compressImage } from "./imageCompress.js";
import { uploadFile } from "./storage.js";

// Finds pictures that are heavier than they need to be, and shrinks them.
//   inline  = the picture is stored INSIDE the database as a huge block of
//             text (every visitor downloads it with the page data)
//   stored  = a real file in Storage, but a big one (phone photos, PNG exports)
export const INLINE_MIN_CHARS = 150000;   // ~110 KB of picture
export const STORED_MIN_BYTES = 500000;   // 0.5 MB
const STORED_RE = /\/storage\/v1\/object\/public\/uploads\/[^?#]+\.(jpe?g|png|webp)(\?|#|$)/i;

export function getIn(obj, path) { return path.reduce((o, k) => (o == null ? o : o[k]), obj); }
export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [k, ...rest] = path;
  const copy = Array.isArray(obj) ? obj.slice() : { ...obj };
  copy[k] = setIn(obj?.[k], rest, value);
  return copy;
}

export function walkPictures(value, cb, path = []) {
  if (typeof value === "string") {
    if (value.startsWith("data:image") && value.length > INLINE_MIN_CHARS) cb(path, value, "inline", Math.round(value.length * 0.75));
    else if (STORED_RE.test(value)) cb(path, value, "stored", null);
    return;
  }
  if (Array.isArray(value)) { value.forEach((v, i) => walkPictures(v, cb, [...path, i])); return; }
  if (value && typeof value === "object") for (const k of Object.keys(value)) walkPictures(value[k], cb, [...path, k]);
}

async function sizeOfStored(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    const n = Number(r.headers.get("content-length"));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch { return null; }
}

async function inBatches(list, n, fn) {
  for (let i = 0; i < list.length; i += n) await Promise.all(list.slice(i, i + n).map(fn));
}

// sources: [{ id, label, value, replace(path, oldUrl, newUrl) }]
// Returns the pictures worth cleaning, biggest first.
export async function scanPictures(sources) {
  const found = [];
  for (const s of sources) {
    walkPictures(s.value, (path, url, kind, bytes) => found.push({ source: s, path, url, kind, bytes }));
  }
  const sizes = new Map();
  const toMeasure = [...new Set(found.filter((f) => f.kind === "stored").map((f) => f.url))];
  await inBatches(toMeasure, 6, async (u) => sizes.set(u, await sizeOfStored(u)));
  const items = [];
  for (const f of found) {
    const bytes = f.kind === "stored" ? sizes.get(f.url) : f.bytes;
    if (!bytes || (f.kind === "stored" && bytes < STORED_MIN_BYTES)) continue;
    items.push({ ...f, bytes });
  }
  return items.sort((a, b) => b.bytes - a.bytes);
}

function optionsFor(path) {
  const last = String(path[path.length - 1]);
  const text = path.join(".").toLowerCase();
  if (text.includes("template") || text.includes("certificate")) return { maxDim: 2400, quality: 0.92 };
  if (text.includes("photo") || last === "photo") return { maxDim: 1000, quality: 0.86 };
  return { maxDim: 1600, quality: 0.86 };
}

// Shrinks every item (same picture used in two places is done once).
// onProgress(done, total). Returns { savedBytes, cleaned, alreadySmall, failed }.
export async function cleanPictures(items, onProgress) {
  const byUrl = new Map();
  for (const it of items) { if (!byUrl.has(it.url)) byUrl.set(it.url, []); byUrl.get(it.url).push(it); }
  const groups = [...byUrl.values()];
  let done = 0, savedBytes = 0, cleaned = 0, alreadySmall = 0, failed = 0;
  for (const group of groups) {
    const first = group[0];
    try {
      const blob = await (await fetch(first.url)).blob();
      const file = new File([blob], "picture", { type: blob.type });
      const small = await compressImage(file, optionsFor(first.path));
      if (small === file || small.size > blob.size * 0.85) { alreadySmall += group.length; }
      else {
        const newUrl = await uploadFile(small);
        for (const it of group) it.source.replace(it.path, it.url, newUrl);
        savedBytes += (blob.size - small.size) * group.length;
        cleaned += group.length;
      }
    } catch (e) { console.error("photo cleanup failed for one picture", e); failed += group.length; }
    done += 1; onProgress?.(done, groups.length);
  }
  return { savedBytes, cleaned, alreadySmall, failed };
}

export function formatBytes(n) {
  if (n >= 1048576) return (n / 1048576).toFixed(1).replace(/\.0$/, "") + " MB";
  return Math.max(1, Math.round(n / 1024)) + " KB";
}
