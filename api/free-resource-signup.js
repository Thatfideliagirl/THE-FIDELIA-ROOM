// Called (without waiting) whenever someone gives their email to take a free
// resource. It records the visit exactly like the browser used to do on its
// own, and -- ONLY the very first time that email is ever seen, and only if
// it isn't one of her students -- sends the one-time thank-you email.
// If the server key isn't set up yet it says "skipped" and the browser falls
// back to recording the visit itself, so nothing is ever lost or blocked.
import { sendTemplatedEmail } from "./send-email.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const looksLikeEmail = (e) => typeof e === "string" && e.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

async function exists(table, email) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?email=ilike.${encodeURIComponent(email)}&select=email&limit=1`, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
  if (!r.ok) throw new Error(`${table} lookup failed: ${r.status}`);
  return (await r.json()).length > 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!SUPABASE_URL || !ANON || !SERVICE) { res.status(200).json({ skipped: true }); return; }
  const email = String(req.body?.email || "").trim().toLowerCase();
  const resourceTitle = String(req.body?.resourceTitle || "").slice(0, 200);
  if (!looksLikeEmail(email)) { res.status(400).json({ error: "Invalid email" }); return; }
  try {
    const [seenBefore, isStudent] = await Promise.all([exists("free_resource_emails", email), exists("students", email)]);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_free_resource_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ p_email: email, p_resource_title: resourceTitle || null }),
    });
    if (!r.ok) { res.status(200).json({ skipped: true }); return; }
    let emailed = false;
    if (!seenBefore && !isStudent) {
      const sent = await sendTemplatedEmail({ kind: "free-resource-thanks", email, resourceTitle: resourceTitle || "your free resource" });
      emailed = !!sent.ok && !sent.skipped;
    }
    res.status(200).json({ ok: true, firstTime: !seenBefore, emailed });
  } catch (e) {
    console.error("free-resource-signup failed", e);
    res.status(200).json({ skipped: true });
  }
}
