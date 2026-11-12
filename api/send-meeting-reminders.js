// Sends "your class starts in 1 hour" to everyone a meeting is for. Meant to be
// called every 10 minutes by the scheduler set up in supabase-batch-nov12.sql
// (the hosting plan only allows a scheduled job once a day, so this one is
// triggered from the database instead). Safe to call as often as you like:
// each meeting is claimed in the meeting_reminders table before anything is
// sent, so no one is ever emailed twice for the same meeting time.
import { sendTemplatedEmail } from "./send-email.js";
import { allMeetings, meetingReaches } from "../src/lib/data.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// The service key (a server-only secret, never in the website's code) is what
// lets this job read students and write the "already sent" record. The public
// key can't: those tables are private.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Meeting times are typed in as plain local times, so the server has to know
// whose clock they're on. Fidelia's is Nigeria (WAT, UTC+1, no daylight saving).
const MEETING_UTC_OFFSET = "+01:00";
const MEETING_TIMEZONE = "Africa/Lagos";
// A reminder goes out when the class is 45 to 62 minutes away. The window is
// wider than the 10-minute schedule on purpose, so one run always lands in it.
const WINDOW_MIN_FROM = 45, WINDOW_MIN_TO = 62;
const MAX_EMAILS_PER_RUN = 150;

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
async function get(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!r.ok) throw new Error(`${table} fetch failed: ${r.status} ${await r.text().catch(() => "")}`);
  return r.json();
}
// Returns true only if this run is the one that recorded it first.
async function claim(key) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/meeting_reminders`, {
    method: "POST", headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({ key }),
  });
  if (!r.ok) throw new Error(`claim failed: ${r.status} ${await r.text().catch(() => "")}`);
  return (await r.json()).length > 0;
}
async function recordCount(key, n) {
  await fetch(`${SUPABASE_URL}/rest/v1/meeting_reminders?key=eq.${encodeURIComponent(key)}`, { method: "PATCH", headers, body: JSON.stringify({ recipients: n }) }).catch(() => {});
}
const startMs = (date) => new Date(date.length === 16 ? `${date}:00${MEETING_UTC_OFFSET}` : `${date}${MEETING_UTC_OFFSET}`).getTime();

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(200).json({ skipped: true, reason: "SUPABASE_SERVICE_ROLE_KEY is not set on the hosting site yet, so reminders can't run." });
    return;
  }
  let courseRows, studentRows;
  try {
    [courseRows, studentRows] = await Promise.all([get("courses", "select=id,data"), get("students", "select=id,name,email,cohort_id,enrollments")]);
  } catch (e) { console.error("send-meeting-reminders fetch failed", e); res.status(500).json({ error: String(e) }); return; }

  const courses = courseRows.map((r) => ({ ...(r.data || {}), id: r.id, modules: r.data?.modules || [] }));
  const students = studentRows.map((r) => ({ id: r.id, name: r.name, email: r.email, cohortId: r.cohort_id, enrollments: r.enrollments || [] }));
  const now = Date.now();
  let meetings = 0, sent = 0;

  for (const { mt, course } of allMeetings(courses)) {
    if (!mt.date || !mt.label) continue;
    const mins = (startMs(mt.date) - now) / 60000;
    if (isNaN(mins) || mins < WINDOW_MIN_FROM || mins > WINDOW_MIN_TO) continue;
    const key = `${mt.id}|${mt.date}`;
    try { if (!(await claim(key))) continue; } catch (e) { console.error(e); continue; }
    meetings++;
    const time = new Date(startMs(mt.date)).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: MEETING_TIMEZONE });
    let n = 0;
    for (const s of students) {
      if (!s.email || !meetingReaches(mt, course.id, s)) continue;
      if (sent >= MAX_EMAILS_PER_RUN) break;
      const result = await sendTemplatedEmail({ kind: "meeting-reminder", email: s.email, name: s.name, meetingTitle: mt.label, courseName: course.title, meetingTime: time });
      if (result.ok || result.skipped) { n++; sent++; } else console.error("meeting reminder send failed", mt.label, s.id, result.error);
    }
    await recordCount(key, n);
  }
  res.status(200).json({ ok: true, meetings, sent });
}
