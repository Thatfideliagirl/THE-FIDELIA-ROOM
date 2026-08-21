// Sends through EmailJS's REST API directly (no SDK needed). Fire-and-forget:
// a signup or an acceptance should never fail just because an email didn't
// go out, so every call here only ever logs on failure, never throws.
const SERVICE_ID = "service_xmhddto";
const TEMPLATE_WELCOME = "template_e99x71c";
const TEMPLATE_ACCEPTANCE = "template_cjquzwf";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

async function send(templateId, params) {
  if (!PUBLIC_KEY) { console.warn("EmailJS public key not configured -- skipping email send"); return; }
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: SERVICE_ID, template_id: templateId, user_id: PUBLIC_KEY, template_params: params }),
    });
    if (!res.ok) console.error("EmailJS send failed", res.status, await res.text());
  } catch (e) {
    console.error("EmailJS send error", e);
  }
}

export function sendWelcomeEmail({ email, name, courseName }) {
  return send(TEMPLATE_WELCOME, { email, to_name: name, course_name: courseName });
}
export function sendAcceptanceEmail({ email, name, courseName, accessCode, loginUrl }) {
  return send(TEMPLATE_ACCEPTANCE, { email, to_name: name, course_name: courseName, access_code: accessCode, login_url: loginUrl });
}
