// Called (without waiting) whenever someone gives their email to take a free
// resource. One database step records the visit and says whether the email is
// brand new and whether it belongs to one of her students; the one-time thank-you
// goes out ONLY for a brand-new email that isn't a student. If the database helper
// isn't set up yet it answers "skipped" and the browser records the visit itself,
// so nothing is ever lost or blocked.
import { sendTemplatedEmail } from "./send-email.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const looksLikeEmail = (e) => typeof e === "string" && e.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const email = String(req.body?.email || "").trim().toLowerCase();
  const resourceTitle = String(req.body?.resourceTitle || "").slice(0, 200);
  if (!looksLikeEmail(email)) { res.status(400).json({ error: "Invalid email" }); return; }
  if (!SUPABASE_URL || !ANON) { res.status(200).json({ skipped: true, reason: "no database settings" }); return; }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_free_resource_email_v2`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ p_email: email, p_resource_title: resourceTitle || null }),
    });
    if (!r.ok) { console.error("record_free_resource_email_v2 failed", r.status, await r.text().catch(() => "")); res.status(200).json({ skipped: true, reason: "setup file not run yet" }); return; }
    const info = await r.json();
    if (!info?.ok) { res.status(400).json({ error: "Invalid email" }); return; }
    let emailed = false, reason;
    if (info.is_new && !info.is_student) {
      const sent = await sendTemplatedEmail({ kind: "free-resource-thanks", email, resourceTitle: resourceTitle || "your free resource" });
      emailed = !!sent.ok && !sent.skipped;
      if (!emailed) { reason = sent.reason || JSON.stringify(sent.error || sent).slice(0, 200); console.error("thank-you email not sent:", reason); }
    }
    res.status(200).json({ ok: true, firstTime: !!info.is_new, student: !!info.is_student, emailed, ...(reason && { reason }) });
  } catch (e) {
    console.error("free-resource-signup failed", e);
    res.status(200).json({ skipped: true, reason: "error" });
  }
}
