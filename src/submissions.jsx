import React from "react";
import { deriveSubmissionStatus, normalizeQuestions } from "./lib/data.js";
import { RichText } from "./components.jsx";

// Every submission one student has handed in, as plain items: tasks and
// quick checks alike, each with the folder it belongs in right now.
// A quick check that was sent back and then redone has an older attempt that
// no longer needs anything from her -- only the latest attempt per module
// counts toward the folders (older ones still show under "All").
export function buildSubmissionItems(student, tasks, courses) {
  const items = [];
  (tasks || []).forEach((t) => {
    const sub = t.submissions?.[student.id];
    if (!sub) return;
    const status = deriveSubmissionStatus(t, sub);
    const folder = status === "approved" ? "approved" : status === "waiting on student" ? "rework" : "awaiting";
    items.push({ id: `task-${t.id}-${student.id}`, kind: "task", student, title: t.title, courseId: t.courseId, course: courses.find((c) => c.id === t.courseId)?.title, at: sub.lastActivityAt || sub.submittedAt || 0, status, label: status, score: sub.score, folder, task: t, sub, isCapstone: !!t.isCapstone, formerCapstone: !!t.formerCapstone && !t.isCapstone });
  });
  student.enrollments.forEach((e) => {
    const course = courses.find((c) => c.id === e.courseId);
    const log = [...(e.quickChecks || [])];
    // Submitted before attempts were recorded: it's only in pendingReview.
    const pr = e.pendingReview;
    if (pr && !log.some((q) => q.moduleId === pr.moduleId && q.submittedAt === pr.submittedAt)) log.push({ id: "qc" + pr.submittedAt, moduleId: pr.moduleId, proofs: pr.proofs || [pr.proof], submittedAt: pr.submittedAt, score: pr.autoScore, outcome: "pending" });
    const latest = {};
    log.forEach((q) => { if (!latest[q.moduleId] || q.submittedAt > latest[q.moduleId].submittedAt) latest[q.moduleId] = q; });
    log.forEach((q) => {
      const mod = course?.modules.find((m) => m.id === q.moduleId);
      const isLatest = latest[q.moduleId] === q;
      const folder = !isLatest ? null : q.outcome === "pending" ? "awaiting" : q.outcome === "sent back" ? "rework" : q.outcome === "not passed" ? null : "approved";
      items.push({ id: `qc-${e.id}-${q.id}`, kind: "quick", student, title: mod?.title || "Quick check", courseId: e.courseId, course: course?.title, at: q.decidedAt || q.submittedAt, status: q.outcome, label: { pending: "awaiting review", "not passed": "try again", passed: "passed ✓" }[q.outcome] || q.outcome,
        // Quick checks are shown in words only (approved / passed / sent back), never as a percentage. The one number kept is the
        // computer's keyword match against the marking guide (0% when there's no guide or no matching words), and only as an
        // admin-side hint.
        score: null,
        autoCheck: typeof q.score === "number" && q.outcome !== "passed" && q.outcome !== "not passed" ? q.score : null, folder, mod, q, enrollmentId: e.id, awaiting: q.outcome === "pending" && e.pendingReview && e.pendingReview.moduleId === q.moduleId && e.pendingReview.submittedAt === q.submittedAt });
    });
  });
  return items.sort((a, b) => b.at - a.at);
}
export const submissionStatusColor = (st) => st === "approved" || st === "passed" ? "#2F7D4F" : st === "sent back" || st === "not passed" || st === "waiting on student" ? "#B2572B" : "#71675A";
// The answer itself, shared by the per-student list (as a dropdown) and the
// full-page view in the Submissions inbox.
export function SubmissionBody({ it, viewer = "admin" }) {
  if (it.kind === "quick") {
    return it.mod ? <>{normalizeQuestions(it.mod).map((qn, qi) => (
      <div key={qn.id || qi}>
        {qn.prompt && <RichText html={qn.prompt} className="rich-content text-[12px] mb-1.5" style={{ color: "#71675A" }} />}
        <RichText html={(it.q.proofs || [])[qi] || ""} className="rich-content text-[14px] rounded-lg px-3 py-2.5" style={{ background: "#fff", border: "1px solid #E7DEC9", overflowWrap: "anywhere" }} />
      </div>
    ))}{it.q.remark && <div className="text-[13px] rounded-lg px-3 py-2.5" style={{ background: "#FBF3DC", color: "#4A4237", overflowWrap: "anywhere" }}><strong>{viewer === "student" ? "Fidelia's remark" : "Your remark"}:</strong> {it.q.remark}</div>}</> : <div className="text-[13px]" style={{ color: "#A79B84" }}>This module no longer exists, so the questions can't be shown.</div>;
  }
  return (
    <>
      {it.task.requiredLinks?.length > 0 ? it.task.requiredLinks.map((r, i) => {
        const url = it.sub.links?.[i], g = it.sub.linkGrades?.[i];
        return (
          <div key={i} className="rounded-lg px-3 py-2.5" style={{ background: "#fff", border: "1px solid #E7DEC9" }}>
            <div className="text-[13px]" style={{ fontWeight: 700 }}>{r.label || r.type}</div>
            {url ? <a href={url} target="_blank" rel="noreferrer" className="text-[12.5px] accent-text break-all">{url} ↗</a> : <span className="text-[12.5px]" style={{ color: "#A79B84" }}>Not submitted</span>}
            {g?.decision && <div className="text-[12px] mt-1" style={{ color: submissionStatusColor(g.decision === "approved" ? "approved" : "sent back") }}>{g.decision === "approved" ? `Approved${g.score != null ? ` · ${g.score}%` : ""}` : "Sent back for resubmission"}{g.feedback ? ` — ${g.feedback}` : ""}</div>}
          </div>
        );
      }) : <>
        {(it.sub.history || []).map((h, i) => <div key={i} className="text-[13px] rounded-lg px-3 py-2.5 whitespace-pre-wrap" style={{ overflowWrap: "anywhere", background: "#F0E7D6", color: "#71675A" }}><div className="f-label text-[10px] mb-1">EARLIER ANSWER</div>{h.note}{h.feedback && <div className="mt-1.5" style={{ color: "#B2572B" }}>{viewer === "student" ? "Fidelia said" : "You said"}: {h.feedback}</div>}</div>)}
        <div className="text-[14px] rounded-lg px-3 py-2.5 whitespace-pre-wrap" style={{ overflowWrap: "anywhere", background: "#fff", border: "1px solid #E7DEC9" }}>{it.sub.note || "No written answer."}</div>
      </>}
      {it.sub.comment && <div className="text-[13px]" style={{ color: "#4A4237" }}><strong>{viewer === "student" ? "Fidelia's comment" : "Your comment"}:</strong> {it.sub.comment}</div>}
    </>
  );
}
export function SubmissionBadges({ it, viewer = "admin" }) {
  return <>
    <span className="f-code text-[9px] px-2 py-0.5 rounded-full tint-badge" style={{ fontWeight: 700 }}>{it.kind === "task" ? "TASK" : "QUICK CHECK"}</span>
    {it.kind === "quick" && it.q?.outcome === "passed" && viewer !== "student" && <span className="f-code text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#E4F3E9", color: "#2F7D4F", fontWeight: 700 }}>AUTO-PASSED</span>}
    {it.isCapstone && <span className="f-code text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#F3E7C9", color: "#8A6A1F", fontWeight: 700 }}>CAPSTONE</span>}
    {it.formerCapstone && <span className="f-code text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#F0E7D6", color: "#71675A", fontWeight: 700 }}>FORMER CAPSTONE</span>}
  </>;
}
