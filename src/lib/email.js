// Sends through /api/send-email (a Vercel serverless function), which
// calls Resend server-side -- Resend's key has to stay hidden on a
// server, unlike EmailJS's public key which was safe to ship in the
// browser. Fire-and-forget: a signup or an acceptance should never fail
// just because an email didn't go out, so every call here only ever
// logs on failure, never throws. Resend's own dashboard shows delivery
// status per email, which replaces the diagnostic logging this used to
// need to even tell whether EmailJS had been reached at all.
async function send(kind, params) {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...params }),
      // Every caller fires this right after already switching the screen
      // (to "check your email" or "in review") -- a completely normal
      // moment for someone to immediately close the tab or switch apps,
      // especially on mobile. keepalive lets the request finish in the
      // background even if the page is gone, same as navigator.sendBeacon
      // is built for.
      keepalive: true,
    });
    if (!res.ok) console.error("Email send failed", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("Email send error", e);
  }
}

// Kept as a no-op-safe stub so existing call sites don't need to change --
// Resend's own delivery dashboard now covers what this used to exist to
// diagnose (whether a send was even attempted).
export function logSignupBranch() {}

export function sendWelcomeEmail({ email, name, courseName }) {
  return send("welcome", { email, name, courseName });
}
export function sendAcceptanceEmail({ email, name, courseName, accessCode, loginUrl }) {
  return send("acceptance", { email, name, courseName, accessCode, loginUrl });
}
