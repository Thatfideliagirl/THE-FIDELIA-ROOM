// The starting wording for every email the app sends through Resend
// (api/send-email.js reads these as its fallback), and also what the
// admin's Email Templates editor (admin.jsx) shows as a starting point and
// as its placeholder legend. Kept in one place so the two never drift --
// editing a default here changes both the unedited-template fallback and
// the editor's own example text.
export function firstName(name) { return (name || "").trim().split(/\s+/)[0] || "there"; }

export const EMAIL_TEMPLATE_KEYS = [
  { key: "welcome", label: "Application received", to: "student", vars: ["name", "courseName"] },
  { key: "application-reviewed", label: "Application reviewed — payment required", to: "student", vars: ["name", "courseName", "price"] },
  { key: "acceptance", label: "Access code", to: "student", vars: ["name", "courseName", "accessCode"] },
  { key: "task-assigned", label: "Task assigned", to: "student", vars: ["name", "taskTitle", "courseName"] },
  { key: "task-submitted", label: "Task submitted — notifies you", to: "you", vars: ["studentName", "taskTitle", "courseName"] },
  { key: "quickcheck-submitted", label: "Quick check submitted — notifies you", to: "you", vars: ["studentName", "moduleTitle", "courseName"] },
  { key: "task-approved", label: "Task approved", to: "student", vars: ["name", "taskTitle", "courseName"] },
  { key: "task-rejected", label: "Task sent back", to: "student", vars: ["name", "taskTitle", "courseName"] },
  { key: "quickcheck-approved", label: "Quick check approved", to: "student", vars: ["name", "moduleTitle", "courseName"] },
  { key: "quickcheck-rejected", label: "Quick check sent back", to: "student", vars: ["name", "moduleTitle", "courseName"] },
  { key: "message-to-admin", label: "Message received — notifies you", to: "you", vars: ["studentName"] },
  { key: "message-to-student", label: "Message received", to: "student", vars: ["name"] },
  { key: "community-tagged", label: "Tagged in community", to: "student", vars: ["name", "fromName"] },
  { key: "task-deadline-reminder", label: "Task deadline reminder", to: "student", vars: ["name", "taskTitle", "courseName"] },
  { key: "notice-posted", label: "New notice on the Notice Board", to: "student", vars: ["name", "noticeText", "courseName"] },
  { key: "meeting-reminder", label: "Class starts in 1 hour", to: "student", vars: ["name", "meetingTitle", "courseName", "meetingTime"] },
  { key: "free-resource-thanks", label: "Thank-you for a free resource (first time only)", to: "visitor", vars: ["resourceTitle"] },
];

// Shown next to each token button in the editor.
export const VAR_LABELS = {
  name: "Student's name",
  studentName: "Student's name",
  courseName: "Course name",
  taskTitle: "Task title",
  moduleTitle: "Module title",
  accessCode: "Access code",
  fromName: "Who tagged them",
  price: "Training fee",
  noticeText: "The notice you posted",
  meetingTitle: "Meeting title",
  meetingTime: "Start time",
  resourceTitle: "Name of the free resource",
};

// Sample values the admin editor fills in so an unedited template still
// previews with real-looking text instead of empty {{tokens}}.
export const SAMPLE_VARS = {
  name: "Amaka", studentName: "Amaka", courseName: "Voice Acting Mastery",
  taskTitle: "Record a demo reel", moduleTitle: "Finding Your Voice", accessCode: "FJ-7K2QR",
  fromName: "Fidelia", price: "₦50,000",
  noticeText: "Class resumes on Monday at 6pm. Please come ready.", meetingTitle: "Tuesday class", meetingTime: "6:00 PM", resourceTitle: "30 Link-Page Designs",
};

// What the editor actually loads into an UNTOUCHED template's boxes --
// written with real {{tokens}} in it, not rendered sample text. This is the
// fix for the real bug it caused: EMAIL_DEFAULTS below bakes a real name
// and course straight into the HTML (correct for the server's own
// never-customized fallback, since it's given real values at send time),
// but handing that same rendered text to the editor meant opening a
// template and just clicking Save would permanently lock in whatever
// example name happened to be shown -- "Amaka" ends up in every student's
// email, forever, because the literal word was saved, not a placeholder.
// Starting the editor from these instead means Save reproduces the same
// per-student personalization as never touching it at all.
export const EMAIL_STARTERS = {
  welcome: { subject: "You're in review, {{name}} — FJ Room", body: "<h1>Thanks for applying, {{name}}.</h1><p>Your application to <strong>{{courseName}}</strong> is being reviewed by the Room.</p><p>Keep an eye on your inbox — including spam, just in case — for your access code.</p>" },
  "application-reviewed": { subject: "Your application has been reviewed — next step", body: "<h1>Good news, {{name}}.</h1><p>Your application to <strong>{{courseName}}</strong> has been reviewed. To complete your enrollment, please pay the training fee below — once we confirm it, your access code will follow.</p>" },
  acceptance: { subject: "You're in! Your FJ Room access code", body: "<h1>You're in, {{name}}.</h1><p>Your application to <strong>{{courseName}}</strong> has been approved. Use the code below to unlock your course.</p>" },
  "task-assigned": { subject: "New task: {{taskTitle}}", body: "<h1>A new task, {{name}}.</h1><p><strong>{{taskTitle}}</strong> has just been assigned to you in <strong>{{courseName}}</strong>.</p>" },
  "task-submitted": { subject: "{{studentName}} submitted: {{taskTitle}}", body: "<h1>New submission.</h1><p><strong>{{studentName}}</strong> just submitted <strong>{{taskTitle}}</strong> in <strong>{{courseName}}</strong>.</p>" },
  "quickcheck-submitted": { subject: "{{studentName}} submitted a quick check for review", body: "<h1>New submission.</h1><p><strong>{{studentName}}</strong> just submitted the quick check for <strong>{{moduleTitle}}</strong> in <strong>{{courseName}}</strong>, awaiting your review.</p>" },
  "task-approved": { subject: "You passed: {{taskTitle}}", body: "<h1>Nicely done, {{name}}.</h1><p><strong>{{taskTitle}}</strong> has been approved in <strong>{{courseName}}</strong>.</p>" },
  "task-rejected": { subject: "{{taskTitle}} needs another look", body: "<h1>One more pass, {{name}}.</h1><p><strong>{{taskTitle}}</strong> in <strong>{{courseName}}</strong> has been sent back for another look.</p>" },
  "quickcheck-approved": { subject: "You passed: {{moduleTitle}}", body: "<h1>Nicely done, {{name}}.</h1><p><strong>{{moduleTitle}}</strong> has been approved in <strong>{{courseName}}</strong>.</p>" },
  "quickcheck-rejected": { subject: "{{moduleTitle}} needs another look", body: "<h1>One more pass, {{name}}.</h1><p><strong>{{moduleTitle}}</strong> in <strong>{{courseName}}</strong> has been sent back for another look.</p>" },
  "message-to-admin": { subject: "New message from {{studentName}}", body: "<h1>New message.</h1><p><strong>{{studentName}}</strong> sent you a message on FJ Room.</p>" },
  "message-to-student": { subject: "You have a new message on FJ Room", body: "<h1>New message, {{name}}.</h1><p>You've got a new message waiting for you on FJ Room.</p>" },
  "community-tagged": { subject: "{{fromName}} tagged you on FJ Room", body: "<h1>You were tagged, {{name}}.</h1><p><strong>{{fromName}}</strong> tagged you in the community on FJ Room.</p>" },
  "notice-posted": { subject: "A new notice from Fidelia", body: "<h1>A new notice, {{name}}.</h1><p>{{noticeText}}</p>" },
  "free-resource-thanks": { subject: "Thanks for grabbing {{resourceTitle}}", body: "<h1>Thank you for getting {{resourceTitle}}.</h1><p>I'm so glad you picked it up, and I hope it helps you move forward.</p><p>I share free tips and new resources all the time, so follow me on my pages below and stay tuned. Whenever you want something new, the Free Resource Lab is always open for you.</p><p>With love,<br>Fidelia</p>" },
  "meeting-reminder": { subject: "Your class starts in 1 hour: {{meetingTitle}}", body: "<h1>Almost time, {{name}}.</h1><p>It's officially 1 hour to <strong>{{meetingTitle}}</strong> ({{courseName}}), starting at <strong>{{meetingTime}}</strong>. Are you ready?</p><p>Open your Virtual Meetings tab in FJ Room for the join link. See you there!</p>" },
  "task-deadline-reminder": { subject: "Reminder: {{taskTitle}} closes soon", body: "<h1>Don't forget, {{name}}.</h1><p><strong>{{taskTitle}}</strong> in <strong>{{courseName}}</strong> closes soon — you haven't submitted it yet.</p>" },
};

// Every default body is just the headline + message -- the access-code box
// and any "view/continue/revise" button are added separately (see `extra`
// in api/send-email.js) and are never part of the editable text, so an
// admin rewriting the message can't accidentally delete the one thing that
// actually shows the access code.
export const EMAIL_DEFAULTS = {
  welcome: {
    subject: (v) => `You're in review, ${firstName(v.name)} — FJ Room`,
    body: (v) => `<h1>Thanks for applying, ${firstName(v.name)}.</h1><p>Your application to <strong>${v.courseName || "FJ Room"}</strong> is being reviewed by the Room.</p><p>Keep an eye on your inbox — including spam, just in case — for your access code.</p>`,
  },
  "application-reviewed": {
    subject: () => "Your application has been reviewed — next step",
    body: (v) => `<h1>Good news, ${firstName(v.name)}.</h1><p>Your application to <strong>${v.courseName || "FJ Room"}</strong> has been reviewed. To complete your enrollment, please pay the training fee below — once we confirm it, your access code will follow.</p>`,
  },
  acceptance: {
    subject: () => "You're in! Your FJ Room access code",
    body: (v) => `<h1>You're in, ${firstName(v.name)}.</h1><p>Your application to <strong>${v.courseName || "FJ Room"}</strong> has been approved. Use the code below to unlock your course.</p>`,
  },
  "task-assigned": {
    subject: (v) => `New task: ${v.taskTitle}`,
    body: (v) => `<h1>A new task, ${firstName(v.name)}.</h1><p><strong>${v.taskTitle}</strong> has just been assigned to you in <strong>${v.courseName || "FJ Room"}</strong>.</p>`,
  },
  "task-submitted": {
    subject: (v) => `${v.studentName} submitted: ${v.taskTitle}`,
    body: (v) => `<h1>New submission.</h1><p><strong>${v.studentName}</strong> just submitted <strong>${v.taskTitle}</strong> in <strong>${v.courseName || "FJ Room"}</strong>.</p>`,
  },
  "quickcheck-submitted": {
    subject: (v) => `${v.studentName} submitted a quick check for review`,
    body: (v) => `<h1>New submission.</h1><p><strong>${v.studentName}</strong> just submitted the quick check for <strong>${v.moduleTitle}</strong> in <strong>${v.courseName || "FJ Room"}</strong>, awaiting your review.</p>`,
  },
  "task-approved": {
    subject: (v) => `You passed: ${v.taskTitle}`,
    body: (v) => `<h1>Nicely done, ${firstName(v.name)}.</h1><p><strong>${v.taskTitle}</strong> has been approved in <strong>${v.courseName || "FJ Room"}</strong>.</p>`,
  },
  "task-rejected": {
    subject: (v) => `${v.taskTitle} needs another look`,
    body: (v) => `<h1>One more pass, ${firstName(v.name)}.</h1><p><strong>${v.taskTitle}</strong> in <strong>${v.courseName || "FJ Room"}</strong> has been sent back for another look.</p>`,
  },
  "quickcheck-approved": {
    subject: (v) => `You passed: ${v.moduleTitle}`,
    body: (v) => `<h1>Nicely done, ${firstName(v.name)}.</h1><p><strong>${v.moduleTitle}</strong> has been approved in <strong>${v.courseName || "FJ Room"}</strong>.</p>`,
  },
  "quickcheck-rejected": {
    subject: (v) => `${v.moduleTitle} needs another look`,
    body: (v) => `<h1>One more pass, ${firstName(v.name)}.</h1><p><strong>${v.moduleTitle}</strong> in <strong>${v.courseName || "FJ Room"}</strong> has been sent back for another look.</p>`,
  },
  "message-to-admin": {
    subject: (v) => `New message from ${v.studentName}`,
    body: (v) => `<h1>New message.</h1><p><strong>${v.studentName}</strong> sent you a message on FJ Room.</p>`,
  },
  "message-to-student": {
    subject: () => "You have a new message on FJ Room",
    body: (v) => `<h1>New message, ${firstName(v.name)}.</h1><p>You've got a new message waiting for you on FJ Room.</p>`,
  },
  "community-tagged": {
    subject: (v) => `${v.fromName} tagged you on FJ Room`,
    body: (v) => `<h1>You were tagged, ${firstName(v.name)}.</h1><p><strong>${v.fromName}</strong> tagged you in the community on FJ Room.</p>`,
  },
  "notice-posted": {
    subject: () => "A new notice from Fidelia",
    body: (v) => `<h1>A new notice, ${firstName(v.name)}.</h1><p>${escapeHtml(v.noticeText || "")}</p>`,
  },
  "free-resource-thanks": {
    subject: (v) => `Thanks for grabbing ${v.resourceTitle || "your free resource"}`,
    body: (v) => `<h1>Thank you for getting ${escapeHtml(v.resourceTitle || "your free resource")}.</h1><p>I'm so glad you picked it up, and I hope it helps you move forward.</p><p>I share free tips and new resources all the time, so follow me on my pages below and stay tuned. Whenever you want something new, the Free Resource Lab is always open for you.</p><p>With love,<br>Fidelia</p>`,
  },
  "meeting-reminder": {
    subject: (v) => `Your class starts in 1 hour: ${v.meetingTitle}`,
    body: (v) => `<h1>Almost time, ${firstName(v.name)}.</h1><p>It's officially 1 hour to <strong>${escapeHtml(v.meetingTitle || "your class")}</strong> (${escapeHtml(v.courseName || "FJ Room")}), starting at <strong>${escapeHtml(v.meetingTime || "")}</strong>. Are you ready?</p><p>Open your Virtual Meetings tab in FJ Room for the join link. See you there!</p>`,
  },
  "task-deadline-reminder": {
    subject: (v) => `Reminder: ${v.taskTitle} closes soon`,
    body: (v) => `<h1>Don't forget, ${firstName(v.name)}.</h1><p><strong>${v.taskTitle}</strong> in <strong>${v.courseName || "FJ Room"}</strong> closes soon — you haven't submitted it yet.</p>`,
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// Used for the body (real HTML) -- a token's value is escaped, the admin's
// own surrounding markup is left exactly as they wrote it.
export function fillTemplate(html, vars) {
  return (html || "").replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_, token) => escapeHtml(vars[token] ?? ""));
}
// Used for the subject line (plain text, not HTML) -- no escaping, but a
// stray newline in a name could otherwise inject extra email headers.
export function fillTemplatePlain(str, vars) {
  return (str || "").replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_, token) => String(vars[token] ?? "").replace(/[\r\n]/g, " "));
}
