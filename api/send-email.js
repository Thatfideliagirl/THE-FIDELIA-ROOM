// Sends through Resend's REST API, server-side only -- unlike EmailJS's
// public key (safe to ship in the browser by design), Resend's key must
// never reach the client, so this exists purely to keep it there. The
// frontend (src/lib/email.js) calls this same-origin endpoint instead of
// an email provider directly.
//
// Both env vars are read fresh on every request, so setting them in
// Vercel just needs a redeploy (any new push, or "Redeploy" in the
// Vercel dashboard) to take effect -- no code change required here.
import { EMAIL_DEFAULTS, fillTemplate, fillTemplatePlain, firstName } from "../src/lib/emailDefaults.js";

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
// Same values the client already builds with (VITE_-prefixed because Vite
// needs that prefix to inline them into the browser bundle) -- Vercel hands
// every env var to a serverless function regardless of its prefix, so this
// reads the exact same Supabase project with no separate var to set.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// An admin-written override replaces the default body for one template at a
// time -- stored on the same flexible `brand` settings blob the admin's own
// branding/ID-card/testimonial templates already live on, so no migration
// was needed for this. Read with the public anon key, same as the brand
// colors/logo every visitor's browser already fetches on page load.
async function fetchCustomTemplates() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return {};
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.main&select=brand`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const rows = await r.json();
    return rows?.[0]?.brand?.emailTemplates || {};
  } catch (e) {
    console.error("fetchCustomTemplates failed", e);
    return {};
  }
}

// task-decided/quickcheck-decided fan out into an approved and a rejected
// template -- simpler for a non-technical editor to write two plain
// versions than one template with a condition inside it.
function resolveTemplateKey(kind, approved) {
  if (EMAIL_DEFAULTS[kind]) return kind;
  if (kind === "task-decided") return approved ? "task-approved" : "task-rejected";
  if (kind === "quickcheck-decided") return approved ? "quickcheck-approved" : "quickcheck-rejected";
  return null;
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
function accessCodeBox(code) {
  return `<div style="border:1.5px dashed #E7DEC9;border-radius:12px;padding:18px;text-align:center;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:.08em;color:${BRAND.muted};margin-bottom:6px;">ACCESS CODE</div>
    <div style="font-size:22px;font-weight:700;color:${BRAND.accent};letter-spacing:.04em;">${code}</div>
  </div>`;
}
// A one-line "closes <date>" note -- deliberately NOT the task's full
// instructions or a student's full submission text. These notification
// emails are meant to be a quick nudge back into the app, not a substitute
// for actually opening it: she still wants to click through to review and
// grade a submission, not read the whole thing from her inbox.
function deadlineLine(text) {
  if (!text) return "";
  return `<div style="margin:0 0 18px;font-size:13px;color:${BRAND.muted};">Closes ${text}</div>`;
}
// The structural bits every template of a given kind needs -- never part of
// the admin's editable text (see emailDefaults.js), so rewriting the
// message can't delete the one thing that actually shows the access code
// or the button that actually links anywhere.
function extra(templateKey, vars) {
  if (templateKey === "acceptance") return accessCodeBox(vars.accessCode) + (vars.loginUrl ? button("Sign in to FJ Room", vars.loginUrl) : "");
  if (templateKey === "task-assigned") return deadlineLine(vars.deadlineText) + button("View the task", vars.loginUrl || SITE_URL);
  if (templateKey === "task-submitted" || templateKey === "quickcheck-submitted") return button("Review it", SITE_URL);
  if (templateKey === "task-approved" || templateKey === "quickcheck-approved") return button("Continue", vars.loginUrl || SITE_URL);
  if (templateKey === "task-rejected" || templateKey === "quickcheck-rejected") return button("Revise it", vars.loginUrl || SITE_URL);
  if (templateKey === "message-to-admin") return button("Open chat", SITE_URL);
  if (templateKey === "message-to-student") return button("View message", vars.loginUrl || SITE_URL);
  if (templateKey === "community-tagged") return button("View it", vars.loginUrl || SITE_URL);
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!RESEND_API_KEY || !FROM) { res.status(200).json({ skipped: true, reason: "Email not configured yet" }); return; }

  const { kind, email, name, courseName, accessCode, loginUrl, taskTitle, moduleTitle, studentName, itemTitle, approved, deadlineText, fromName } = req.body || {};
  if (!kind) { res.status(400).json({ error: "Missing kind" }); return; }

  const templateKey = resolveTemplateKey(kind, approved);
  if (!templateKey) { res.status(400).json({ error: "Unknown kind: " + kind }); return; }

  // These kinds always go to the admin, not whatever the caller passed as
  // email -- there's no student-chosen address to trust here anyway, and
  // routing them this way means a caller can never accidentally send an
  // admin alert to a student.
  const notifiesAdmin = kind === "task-submitted" || kind === "quickcheck-submitted" || kind === "message-to-admin";
  const to = notifiesAdmin ? ADMIN_EMAIL : email;
  if (!to) { res.status(400).json({ error: "Missing email" }); return; }

  // task-decided/quickcheck-decided send one shared "itemTitle" field --
  // filled into whichever of taskTitle/moduleTitle this template actually
  // uses, so the same payload works for either outcome template.
  // "name" is shortened to a first name once, here -- EMAIL_DEFAULTS below
  // also calls firstName() on it (harmless on an already-short name), but a
  // custom {{name}} template has no such step of its own, so this is what
  // makes {{name}} resolve to "Amaka" rather than "Amaka Obi" either way.
  const vars = { name: firstName(name), studentName, courseName, accessCode, loginUrl, taskTitle: taskTitle || itemTitle, moduleTitle: moduleTitle || itemTitle, deadlineText, fromName };
  const defaults = EMAIL_DEFAULTS[templateKey];
  const custom = (await fetchCustomTemplates())[templateKey];
  const subject = custom?.subject ? fillTemplatePlain(custom.subject, vars) : defaults.subject(vars);
  const messageHtml = custom?.body ? fillTemplate(custom.body, vars) : defaults.body(vars);
  const html = wrap(messageHtml + extra(templateKey, vars));

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("Resend send failed", r.status, data); res.status(r.status).json({ error: data }); return; }
    res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    console.error("Resend send error", e);
    res.status(500).json({ error: String(e) });
  }
}
