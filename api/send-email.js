// Sends through Resend's REST API, server-side only -- unlike EmailJS's
// public key (safe to ship in the browser by design), Resend's key must
// never reach the client, so this exists purely to keep it there. The
// frontend (src/lib/email.js) calls this same-origin endpoint instead of
// an email provider directly.
//
// Both env vars are read fresh on every request, so setting them in
// Vercel just needs a redeploy (any new push, or "Redeploy" in the
// Vercel dashboard) to take effect -- no code change required here.
const FROM = process.env.RESEND_FROM; // e.g. "FJ Room <hello@fjroom.com>" -- must match a verified Resend domain
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function firstName(name) {
  return (name || "").trim().split(/\s+/)[0] || "there";
}

const BRAND = { bg: "#FAF6EC", accent: "#1C6FA0", ink: "#262019", muted: "#71675A" };

function wrap(bodyHtml) {
  return `<div style="background:${BRAND.bg};padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:${BRAND.ink};">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 32px;">
      <div style="font-size:13px;letter-spacing:.06em;color:${BRAND.accent};font-weight:700;margin-bottom:18px;">FJ ROOM</div>
      ${bodyHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #F0E7D6;font-size:12px;color:${BRAND.muted};">This is more than learning. This is your growth room.</div>
    </div>
  </div>`;
}

function welcomeEmail({ name, courseName }) {
  return {
    subject: `You're in review, ${firstName(name)} — FJ Room`,
    html: wrap(`
      <h1 style="font-size:22px;margin:0 0 14px;">Thanks for applying, ${firstName(name)}.</h1>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0 0 14px;">Your application to <strong style="color:${BRAND.ink};">${courseName || "FJ Room"}</strong> is being reviewed by the Room.</p>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0;">Keep an eye on your inbox — including spam, just in case — for your access code.</p>
    `),
  };
}

function acceptanceEmail({ name, courseName, accessCode, loginUrl }) {
  return {
    subject: "You're in! Your FJ Room access code",
    html: wrap(`
      <h1 style="font-size:22px;margin:0 0 14px;">You're in, ${firstName(name)}.</h1>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0 0 20px;">Your application to <strong style="color:${BRAND.ink};">${courseName || "FJ Room"}</strong> has been approved. Use the code below to unlock your course.</p>
      <div style="border:1.5px dashed #E7DEC9;border-radius:12px;padding:18px;text-align:center;margin:0 0 24px;">
        <div style="font-size:11px;letter-spacing:.08em;color:${BRAND.muted};margin-bottom:6px;">ACCESS CODE</div>
        <div style="font-size:22px;font-weight:700;color:${BRAND.accent};letter-spacing:.04em;">${accessCode}</div>
      </div>
      ${loginUrl ? `<a href="${loginUrl}" style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700;">Sign in to FJ Room</a>` : ""}
    `),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!RESEND_API_KEY || !FROM) { res.status(200).json({ skipped: true, reason: "Email not configured yet" }); return; }

  const { kind, email, name, courseName, accessCode, loginUrl } = req.body || {};
  if (!kind || !email) { res.status(400).json({ error: "Missing kind or email" }); return; }

  let content;
  if (kind === "welcome") content = welcomeEmail({ name, courseName });
  else if (kind === "acceptance") content = acceptanceEmail({ name, courseName, accessCode, loginUrl });
  else { res.status(400).json({ error: "Unknown kind: " + kind }); return; }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to: email, subject: content.subject, html: content.html }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("Resend send failed", r.status, data); res.status(r.status).json({ error: data }); return; }
    res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    console.error("Resend send error", e);
    res.status(500).json({ error: String(e) });
  }
}
