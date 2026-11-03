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
// Where "a student did something" notifications go -- already the public
// brand contact address used as the app's own default elsewhere, so this
// isn't a new secret, just a sensible fallback. Override by setting
// ADMIN_NOTIFY_EMAIL in Vercel if that address ever changes.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "fjroomm@gmail.com";
// A fixed, unhashed path in /public (copied from the real logo asset) so
// this still resolves after every future rebuild, unlike the hashed
// filename Vite gives the same image inside the app bundle.
const LOGO_URL = "https://fjroom.com/logo-email.png";
const SITE_URL = "https://fjroom.com";

function firstName(name) {
  return (name || "").trim().split(/\s+/)[0] || "there";
}

const BRAND = { bg: "#FAF6EC", accent: "#1C6FA0", ink: "#262019", muted: "#71675A" };

function wrap(bodyHtml) {
  return `<div style="background:${BRAND.bg};padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:${BRAND.ink};">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 32px;">
      <img src="${LOGO_URL}" alt="FJ Room" width="40" style="display:block;margin:0 0 20px;" />
      ${bodyHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #F0E7D6;font-size:12px;color:${BRAND.muted};">This is more than learning. This is your growth room.</div>
    </div>
  </div>`;
}

function button(label, url) {
  return `<a href="${url}" style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700;">${label}</a>`;
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
      ${loginUrl ? button("Sign in to FJ Room", loginUrl) : ""}
    `),
  };
}

function taskAssignedEmail({ name, taskTitle, courseName, loginUrl }) {
  return {
    subject: `New task: ${taskTitle}`,
    html: wrap(`
      <h1 style="font-size:22px;margin:0 0 14px;">A new task, ${firstName(name)}.</h1>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0 0 14px;"><strong style="color:${BRAND.ink};">${taskTitle}</strong> has just been assigned to you in <strong style="color:${BRAND.ink};">${courseName || "FJ Room"}</strong>.</p>
      ${button("View the task", loginUrl || SITE_URL)}
    `),
  };
}

function taskSubmittedEmail({ studentName, taskTitle, courseName }) {
  return {
    subject: `${studentName} submitted: ${taskTitle}`,
    html: wrap(`
      <h1 style="font-size:22px;margin:0 0 14px;">New submission.</h1>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0 0 14px;"><strong style="color:${BRAND.ink};">${studentName}</strong> just submitted <strong style="color:${BRAND.ink};">${taskTitle}</strong> in <strong style="color:${BRAND.ink};">${courseName || "FJ Room"}</strong>.</p>
      ${button("Review it", SITE_URL)}
    `),
  };
}

function quickCheckSubmittedEmail({ studentName, moduleTitle, courseName }) {
  return {
    subject: `${studentName} submitted a quick check for review`,
    html: wrap(`
      <h1 style="font-size:22px;margin:0 0 14px;">New submission.</h1>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0 0 14px;"><strong style="color:${BRAND.ink};">${studentName}</strong> just submitted the quick check for <strong style="color:${BRAND.ink};">${moduleTitle}</strong> in <strong style="color:${BRAND.ink};">${courseName || "FJ Room"}</strong>, awaiting your review.</p>
      ${button("Review it", SITE_URL)}
    `),
  };
}

function decisionEmail({ name, itemTitle, courseName, approved, loginUrl }) {
  return {
    subject: approved ? `You passed: ${itemTitle}` : `${itemTitle} needs another look`,
    html: wrap(approved ? `
      <h1 style="font-size:22px;margin:0 0 14px;">Nicely done, ${firstName(name)}.</h1>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0 0 14px;"><strong style="color:${BRAND.ink};">${itemTitle}</strong> has been approved in <strong style="color:${BRAND.ink};">${courseName || "FJ Room"}</strong>.</p>
      ${button("Continue", loginUrl || SITE_URL)}
    ` : `
      <h1 style="font-size:22px;margin:0 0 14px;">One more pass, ${firstName(name)}.</h1>
      <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:0 0 14px;"><strong style="color:${BRAND.ink};">${itemTitle}</strong> in <strong style="color:${BRAND.ink};">${courseName || "FJ Room"}</strong> has been sent back for another look.</p>
      ${button("Revise it", loginUrl || SITE_URL)}
    `),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!RESEND_API_KEY || !FROM) { res.status(200).json({ skipped: true, reason: "Email not configured yet" }); return; }

  const { kind, email, name, courseName, accessCode, loginUrl, taskTitle, moduleTitle, studentName, itemTitle, approved } = req.body || {};
  if (!kind) { res.status(400).json({ error: "Missing kind" }); return; }

  // The two "a student did something" kinds always go to the admin, not
  // whatever the caller passed as email -- there's no student-chosen
  // address to trust here anyway, and routing both the same way means a
  // caller can never accidentally send an admin alert to a student.
  const notifiesAdmin = kind === "task-submitted" || kind === "quickcheck-submitted";
  const to = notifiesAdmin ? ADMIN_EMAIL : email;
  if (!to) { res.status(400).json({ error: "Missing email" }); return; }

  let content;
  if (kind === "welcome") content = welcomeEmail({ name, courseName });
  else if (kind === "acceptance") content = acceptanceEmail({ name, courseName, accessCode, loginUrl });
  else if (kind === "task-assigned") content = taskAssignedEmail({ name, taskTitle, courseName, loginUrl });
  else if (kind === "task-submitted") content = taskSubmittedEmail({ studentName, taskTitle, courseName });
  else if (kind === "quickcheck-submitted") content = quickCheckSubmittedEmail({ studentName, moduleTitle, courseName });
  else if (kind === "task-decided" || kind === "quickcheck-decided") content = decisionEmail({ name, itemTitle, courseName, approved, loginUrl });
  else { res.status(400).json({ error: "Unknown kind: " + kind }); return; }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to, subject: content.subject, html: content.html }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("Resend send failed", r.status, data); res.status(r.status).json({ error: data }); return; }
    res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    console.error("Resend send error", e);
    res.status(500).json({ error: String(e) });
  }
}
