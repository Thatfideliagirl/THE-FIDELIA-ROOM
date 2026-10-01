// Sends through EmailJS's REST API directly (no SDK needed). Fire-and-forget:
// a signup or an acceptance should never fail just because an email didn't
// go out, so every call here only ever logs on failure, never throws.
const SERVICE_ID = "service_xmhddto";
// Confirmed backwards from a real test: signup sent the "you're in" content
// and accept sent the "thanks for applying" content -- swapped from what was
// assumed when these IDs were first given (order they were created in EmailJS
// isn't necessarily the order they were described in).
const TEMPLATE_WELCOME = "template_cjquzwf";
const TEMPLATE_ACCEPTANCE = "template_e99x71c";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Temporary diagnostic trail for the welcome-email bug: writes straight to
// Postgres (not through the supabase-js client) so it gets the same
// keepalive treatment as the EmailJS call itself, and so whether the send
// was even attempted can be checked directly instead of relying on digging
// through a browser's dev tools. One line the instant a send is attempted,
// a second once the outcome is known -- an "attempting" row with no
// matching "sent"/"failed" row means something killed the request before
// it finished; no "attempting" row at all means the code never got here.
// Remove supabase-email-diagnostic-log.sql's table once this is solved.
function logEmailAttempt(kind, email, status, detail) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    fetch(`${SUPABASE_URL}/rest/v1/email_log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ kind, email, status, detail: detail || null }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

async function send(templateId, params, kind) {
  if (!PUBLIC_KEY) { console.warn("EmailJS public key not configured -- skipping email send"); return; }
  logEmailAttempt(kind, params.email, "attempting");
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: SERVICE_ID, template_id: templateId, user_id: PUBLIC_KEY, template_params: params }),
      // Every caller fires this right after already switching the screen
      // (to "check your email" or "in review") -- a completely normal
      // moment for someone to immediately close the tab or switch apps,
      // especially on mobile. Without keepalive, the browser is free to
      // cancel this in-flight request the instant the page unloads, before
      // it ever reaches EmailJS -- which looks exactly like "nothing was
      // ever sent" (confirmed against EmailJS's own history: zero record
      // of the attempt, not even a failed one). keepalive lets the request
      // finish in the background even if the page is gone, same as
      // navigator.sendBeacon is built for.
      keepalive: true,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("EmailJS send failed", res.status, text);
      logEmailAttempt(kind, params.email, "failed", `${res.status} ${text}`.slice(0, 500));
    } else {
      logEmailAttempt(kind, params.email, "sent");
    }
  } catch (e) {
    console.error("EmailJS send error", e);
    logEmailAttempt(kind, params.email, "failed", String(e).slice(0, 500));
  }
}

// The welcome-email investigation so far has ruled out the request dying
// mid-flight (an "attempting" row with no "sent"/"failed" row) -- real
// tests show no "welcome" row at all, meaning sendWelcomeEmail itself
// isn't being reached. This logs which branch of the signup code actually
// ran, so the next real test shows exactly where it diverges instead of
// guessing further. Remove alongside the rest of this diagnostic trail.
export function logSignupBranch(branch, email) {
  logEmailAttempt("signup-branch:" + branch, email, "n/a");
}

export function sendWelcomeEmail({ email, name, courseName }) {
  return send(TEMPLATE_WELCOME, { email, to_name: name, course_name: courseName }, "welcome");
}
export function sendAcceptanceEmail({ email, name, courseName, accessCode, loginUrl }) {
  return send(TEMPLATE_ACCEPTANCE, { email, to_name: name, course_name: courseName, access_code: accessCode, login_url: loginUrl }, "acceptance");
}
