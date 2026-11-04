// Runs once a day on its own (see vercel.json's cron entry) -- no one has
// to open the app for this to fire. Checks every task that has a real,
// specific deadline (not just a "due in N days" countdown, which has no
// fixed date to count down to) for assigned students who haven't submitted
// yet and are within 2 days of that deadline, and reminds each one exactly
// once per task.
import { sendTemplatedEmail } from "./send-email.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const REMINDER_WINDOW_DAYS = 2;

async function supaGet(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!r.ok) throw new Error(`${table} fetch failed: ${r.status}`);
  return r.json();
}
// Writes the task's data blob back with remindedIds added -- same shape
// db.js's own upsertTask already writes, just reached directly over REST
// instead of through the client's supabase-js instance.
async function supaPatchTaskData(id, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) console.error("task reminder-state save failed", id, r.status, await r.text().catch(() => ""));
}

function formatDeadline(iso) {
  const d = new Date(iso);
  return isNaN(d) ? null : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { res.status(200).json({ skipped: true, reason: "Supabase not configured" }); return; }

  let taskRows, studentRows, courseRows;
  try {
    [taskRows, studentRows, courseRows] = await Promise.all([
      supaGet("tasks", "select=id,data"),
      supaGet("students", "select=id,name,email"),
      supaGet("courses", "select=id,data"),
    ]);
  } catch (e) {
    console.error("send-deadline-reminders fetch failed", e);
    res.status(500).json({ error: String(e) });
    return;
  }
  const courseTitleById = Object.fromEntries(courseRows.map((r) => [r.id, r.data?.title]));
  const now = Date.now();

  let sent = 0;
  for (const row of taskRows) {
    const t = row.data || {};
    if (!t.deadlineAt) continue;
    const daysLeft = (new Date(t.deadlineAt).getTime() - now) / 86400000;
    if (daysLeft <= 0 || daysLeft > REMINDER_WINDOW_DAYS) continue;

    const remindedIds = new Set(t.remindedIds || []);
    const submissions = t.submissions || {};
    let changed = false;

    for (const sid of t.assigned || []) {
      if (submissions[sid]) continue; // already submitted -- nothing to remind about
      if (remindedIds.has(sid)) continue; // already reminded for this deadline
      const s = studentRows.find((x) => x.id === sid);
      if (!s?.email) continue;

      const result = await sendTemplatedEmail({
        kind: "task-deadline-reminder",
        email: s.email,
        name: s.name,
        taskTitle: t.title,
        courseName: courseTitleById[t.courseId],
        deadlineText: formatDeadline(t.deadlineAt),
      });
      if (result.ok) { remindedIds.add(sid); changed = true; sent++; }
      else console.error("deadline reminder send failed", t.title, sid, result.error);
    }

    if (changed) await supaPatchTaskData(row.id, { ...t, remindedIds: [...remindedIds] });
  }

  res.status(200).json({ ok: true, sent });
}
