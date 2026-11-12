// Sends through /api/send-email (a Vercel serverless function), which
// calls Resend server-side -- Resend's key has to stay hidden on a
// server, unlike EmailJS's public key which was safe to ship in the
// browser. Fire-and-forget: a signup or an acceptance should never fail
// just because an email didn't go out, so every call here only ever
// logs on failure, never throws. Resend's own dashboard shows delivery
// status per email, which replaces the diagnostic logging this used to
// need to even tell whether EmailJS had been reached at all.
// Used by the admin's "Send thank-you" button -- unlike the fire-and-forget
// ones, it reports what happened so she can see whether it really went.
export async function sendFreeResourceThanks({ email, resourceTitle }) {
  try {
    const res = await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "free-resource-thanks", email, resourceTitle: resourceTitle || "your free resource" }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.ok && !j.skipped) return { ok: true };
    if (j.skipped) return { ok: false, message: j.reason || "Emails aren't switched on." };
    return { ok: false, message: "It didn't go through. Check your email settings on Resend." };
  } catch { return { ok: false, message: "Couldn't reach the server — check your connection." }; }
}
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
// Payment details come from her own Branding settings, read server-side --
// only the fee (specific to this course) travels with the request.
export function sendApplicationReviewedEmail({ email, name, courseName, price }) {
  return send("application-reviewed", { email, name, courseName, price });
}
export function sendTaskAssignedEmail({ email, name, taskTitle, courseName, loginUrl, deadlineText }) {
  return send("task-assigned", { email, name, taskTitle, courseName, loginUrl, deadlineText });
}
// No "email" field -- the server always routes these two to the admin's
// own address, never wherever the caller happens to point them. Deliberately
// no submission content either -- a quick nudge back into the app, not a
// substitute for actually opening it to review.
export function notifyAdminTaskSubmitted({ studentName, taskTitle, courseName }) {
  return send("task-submitted", { studentName, taskTitle, courseName });
}
export function notifyAdminQuickCheckSubmitted({ studentName, moduleTitle, courseName }) {
  return send("quickcheck-submitted", { studentName, moduleTitle, courseName });
}
export function sendTaskDecisionEmail({ email, name, taskTitle, courseName, approved, loginUrl }) {
  return send("task-decided", { email, name, itemTitle: taskTitle, courseName, approved, loginUrl });
}
export function sendQuickCheckDecisionEmail({ email, name, moduleTitle, courseName, approved, loginUrl }) {
  return send("quickcheck-decided", { email, name, itemTitle: moduleTitle, courseName, approved, loginUrl });
}
// Deliberately no message text -- a nudge that something's waiting, not a
// copy of the conversation sitting in an inbox.
export function notifyAdminMessageReceived({ studentName }) {
  return send("message-to-admin", { studentName });
}
export function sendMessageReceivedEmail({ email, name }) {
  return send("message-to-student", { email, name });
}
export function sendCommunityTaggedEmail({ email, name, fromName }) {
  return send("community-tagged", { email, name, fromName });
}
export function sendNoticeEmail({ email, name, noticeText, courseName }) {
  return send("notice-posted", { email, name, noticeText, courseName });
}
