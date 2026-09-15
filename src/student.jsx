import React, { useState, useEffect, useRef } from "react";
import {
  Lock, CheckCircle2, Circle, ArrowRight, ArrowLeft, BookOpen, Users,
  MessageCircle, ListChecks, Settings, LogOut, Library, ChevronRight,
  ChevronDown, Sparkles, Plus, Check, Send, X, Heart, MessageSquare,
  FileText, Download, GraduationCap, Mail, Phone, Award,
  UserCircle, FolderPlus, Folder, UploadCloud, ClipboardCheck, HelpCircle as HelpIcon,
  Clock, Trash2, Eye, Star, Pencil, PlayCircle, Bell, Megaphone, Layers, AtSign, Compass, Home
} from "lucide-react";
import { pairKey, moduleStatus, scoreSubmission, AUTO_APPROVE_THRESHOLD } from "./lib/data.js";
import { SectionHeader, NotifBell, WelcomeTour, SidebarLink, LogoMark, Spine, TextArea, ProgressBar, ResourceDetail, Field, ChangePasswordCard, RichText, RichTextEditor } from "./components.jsx";

export function LessonView({ course, enrollment, updateEnrollment, onBack, onNext, moduleId }) {
  const [view, setView] = useState("lecture"); // "lecture" | "check" | "meetings"
  const [lectureStep, setLectureStep] = useState("brief"); // "brief" | "content"
  const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null); const [proof, setProof] = useState("");
  const currentIndex = Math.min(enrollment.completedModuleIds.length, course.modules.length - 1);
  const requestedIndex = moduleId != null ? course.modules.findIndex((m) => m.id === moduleId) : -1;
  const moduleIndex = requestedIndex >= 0 ? requestedIndex : currentIndex;
  const module = course.modules[moduleIndex];
  const reviewingPast = moduleIndex !== currentIndex;
  const status = moduleStatus(course, enrollment, module.id);
  const [justPassed, setJustPassed] = useState(false);
  const hasNext = enrollment.completedModuleIds.length < course.modules.length;
  const pendingHere = enrollment.pendingReview?.moduleId === module.id;

  useEffect(() => { setView("lecture"); setLectureStep(module.brief ? "brief" : "content"); setAnswers({}); setResult(null); setProof(""); setJustPassed(false); }, [module.id]);

  function completeModule() { updateEnrollment({ completedModuleIds: [...new Set([...enrollment.completedModuleIds, module.id])] }); setJustPassed(true); }
  function submitQuiz() { let correct = 0; module.quiz.forEach((q, i) => { if (answers[i] === q.correct) correct++; }); const pct = Math.round((correct / module.quiz.length) * 100); setResult(pct); if (pct >= (module.passPct || 70)) completeModule(); }
  function submitForReview() {
    if (!proof.trim()) return;
    const { pct } = scoreSubmission(proof, module.markingGuide);
    if (pct >= AUTO_APPROVE_THRESHOLD) completeModule();
    else updateEnrollment({ pendingReview: { moduleId: module.id, proof, submittedAt: Date.now(), autoScore: pct } });
  }
  if (justPassed) return (
    <div className="min-h-screen px-10 md:px-16 py-12 max-w-[600px] mx-auto flex flex-col items-center text-center justify-center" style={{ minHeight: "70vh" }}>
      <CheckCircle2 size={48} color="var(--accent)" className="mb-5" />
      <div className="f-display text-[28px] mb-3" style={{ fontWeight: 800 }}>Well done — you passed!</div>
      <div className="text-[15px] mb-8" style={{ color: "#71675A" }}>{hasNext ? "The next module is unlocked." : "That was the last module — nicely done."}</div>
      <div className="flex gap-3">{hasNext && <button onClick={() => onNext ? onNext() : setJustPassed(false)} className="btn-primary rounded-full px-7 py-3.5 text-[15px]" style={{ fontWeight: 700 }}>Continue to next module</button>}<button onClick={onBack} className="btn-ghost rounded-full px-7 py-3.5 text-[15px]">Back to your path</button></div>
    </div>
  );
  const tabs = [
    { id: "lecture", label: "Lecture" },
    { id: "check", label: module.testType === "milestone" ? "Milestone Project" : "Quick Check" },
    { id: "meetings", label: `Virtual Meetings${module.meetings?.length ? ` (${module.meetings.length})` : ""}` },
  ];
  return (
    <div className="min-h-screen px-10 md:px-16 py-12 max-w-[760px] mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-8" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to your path</button>
      <div className="f-code text-[12px] mb-2 accent-text">{module.testType === "milestone" ? "MILESTONE" : "MODULE"} {String(moduleIndex + 1).padStart(2, "0")}</div>
      <h1 className="f-display text-[30px] mb-6" style={{ fontWeight: 800 }}>{module.title}</h1>
      <div className="flex items-center gap-2 mb-6 flex-wrap">{tabs.map((t) => <button key={t.id} onClick={() => setView(t.id)} className="f-label text-[12px] px-4 py-2 rounded-full" style={{ background: view === t.id ? "var(--accent)" : "#F0E7D6", color: view === t.id ? "#FAF6EC" : "#71675A" }}>{t.label}</button>)}</div>

      {view === "lecture" && lectureStep === "brief" && (
        <div className="card rounded-2xl p-8">
          <div className="f-label text-[11px] mb-3" style={{ color: "#A79B84" }}>BEFORE YOU START</div>
          <RichText html={module.brief} className="rich-content text-[17px] leading-relaxed mb-6" style={{ color: "#4A4237" }} />
          <div className="flex justify-end"><button onClick={() => setLectureStep("content")} className="btn-primary rounded-lg px-6 py-3 text-[14px] flex items-center gap-2">Next <ArrowRight size={15} /></button></div>
        </div>
      )}

      {view === "lecture" && lectureStep === "content" && (
        <div className="card rounded-2xl p-8">
          <div className="f-label text-[11px] mb-3" style={{ color: "#A79B84" }}>{module.testType === "milestone" ? "PROJECT OVERVIEW" : "LECTURE NOTES"}</div>
          <RichText html={module.notes || "Lecture content coming soon."} className="rich-content text-[15px] leading-relaxed mb-5" style={{ color: "#4A4237" }} />
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {module.videoUrl && <a href={module.videoUrl} target="_blank" rel="noreferrer" className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><PlayCircle size={14} /> Watch lecture</a>}
            {module.slideUrl && <a href={module.slideUrl} target="_blank" rel="noreferrer" className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><FileText size={14} /> View slides</a>}
            {module.slideFile && <a href={module.slideFile.dataUrl} download={module.slideFile.name} className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Download size={14} /> {module.slideFile.name}</a>}
          </div>
          <div className="flex items-center justify-between mt-6">
            {module.brief ? <button onClick={() => setLectureStep("brief")} className="text-[13px]" style={{ color: "#A79B84" }}>Back</button> : <span />}
            <button onClick={() => setView("check")} className="btn-primary rounded-lg px-6 py-3 text-[14px] flex items-center gap-2">Next: {module.testType === "milestone" ? "Milestone Project" : "Quick Check"} <ArrowRight size={15} /></button>
          </div>
        </div>
      )}

      {view === "meetings" && (
        <div className="card rounded-2xl p-8">
          <div className="f-display text-[19px] mb-5" style={{ fontWeight: 700 }}>Virtual meetings for this module</div>
          {(!module.meetings || module.meetings.length === 0) && <div className="text-[14px]" style={{ color: "#A79B84" }}>No classes scheduled yet — check back soon.</div>}
          <div className="flex flex-col gap-2">{(module.meetings || []).map((mt) => (
            <div key={mt.id} className="rounded-lg px-4 py-3.5" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
              <div className="flex items-center justify-between">
                <div><div className="text-[14px]" style={{ fontWeight: 700 }}>{mt.label}</div><div className="text-[12px] flex items-center gap-1.5 mt-0.5" style={{ color: "#71675A" }}><Clock size={12} /> {mt.date ? new Date(mt.date).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Date to be confirmed"}</div></div>
                {mt.link ? <a href={mt.link} target="_blank" rel="noreferrer" className="btn-primary rounded-full px-4 py-2 text-[13px]">Join class</a> : <span className="text-[12px]" style={{ color: "#A79B84" }}>Link coming soon</span>}
              </div>
              {(mt.recordingLink || mt.recordingFile) && (
                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px dashed #E7DEC9" }}>
                  <span className="f-label text-[10px]" style={{ color: "#A79B84" }}>RECORDING:</span>
                  {mt.recordingLink && <a href={mt.recordingLink} target="_blank" rel="noreferrer" className="text-[12px] accent-text" style={{ fontWeight: 700 }}>View recording</a>}
                  {mt.recordingFile && <a href={mt.recordingFile.dataUrl} download={mt.recordingFile.name} className="text-[12px] accent-text flex items-center gap-1" style={{ fontWeight: 700 }}><Download size={11} /> {mt.recordingFile.name}</a>}
                </div>
              )}
            </div>
          ))}</div>
        </div>
      )}

      {view === "check" && (
        <div className="card rounded-2xl p-8">
          {status === "complete" && <div className="flex items-center gap-3" style={{ color: "var(--accent)" }}><CheckCircle2 size={20} /><span className="text-[14px]" style={{ fontWeight: 700 }}>You've completed this module's quick check.</span></div>}
          {status !== "complete" && pendingHere && <div className="flex items-center gap-3" style={{ color: "#71675A" }}><Clock size={20} /><span className="text-[14px]" style={{ fontWeight: 700 }}>Submitted — awaiting review. You'll be notified once it's graded.</span></div>}
          {status === "current" && !pendingHere && module.testType === "multiple-choice" && (
            <>
              <div className="f-display text-[19px] mb-5" style={{ fontWeight: 700 }}>Quick check — {module.passPct}% to pass</div>
              {module.quiz.map((q, qi) => <div key={qi} className="mb-6"><div className="text-[15px] mb-3" style={{ fontWeight: 600 }}>{q.q}</div><div className="flex flex-col gap-2">{q.options.map((o, oi) => <label key={oi} className="flex items-center gap-2.5 text-[14px] rounded-lg px-4 py-2.5" style={{ background: answers[qi] === oi ? "color-mix(in srgb, var(--accent) 10%, white)" : "#FAF6EC", border: answers[qi] === oi ? "1.5px solid var(--accent)" : "1px solid #E7DEC9" }}><input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))} /> {o}</label>)}</div></div>)}
              {result != null && result < (module.passPct || 70) && <div className="text-[14px] mb-4" style={{ color: "#B04A3A", fontWeight: 700 }}>Scored {result}% — try again to unlock the next module.</div>}
              <button onClick={submitQuiz} className="btn-primary rounded-lg px-6 py-3 text-[14px]">Submit answers</button>
            </>
          )}
          {status === "current" && !pendingHere && module.testType === "checklist" && <><div className="f-display text-[19px] mb-3" style={{ fontWeight: 700 }}>Self-check</div><button onClick={completeModule} className="btn-primary rounded-lg px-6 py-3 text-[14px]">I've completed this module</button></>}
          {status === "current" && !pendingHere && (module.testType === "written" || module.testType === "file-upload" || module.testType === "milestone") && (
            <>
              <div className="f-display text-[19px] mb-3" style={{ fontWeight: 700 }}>{module.testType === "written" ? "Written response" : module.testType === "milestone" ? "Milestone project" : `Upload your work${module.proofType === "document" ? " (document)" : ""}`}</div>
              {module.questionPrompt && <p className="text-[14px] mb-4 whitespace-pre-wrap" style={{ color: "#4A4237" }}>{module.questionPrompt}</p>}
              {module.testType === "written" ? (
                <div><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Your answer</div><RichTextEditor value={proof} onChange={setProof} minRows={6} /></div>
              ) : (
                <TextArea label="Link to your file" value={proof} onChange={(e) => setProof(e.target.value)} />
              )}
              <button onClick={submitForReview} className="btn-primary rounded-lg px-6 py-3 text-[14px] mt-4">Submit for review</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================
// STUDENT: My Courses + per-enrollment dashboard
// =========================================================
export function EnrollmentDashboard({ student, setStudents, course, enrollment, tasks, setTasks, resources, community, setCommunity, notices, setNotices, directThreads, setDirectThreads, allStudents, onBack, notifItems, notifSeen, onMarkSeen }) {
  const [tab, setTab] = useState("path");
  const [openModuleId, setOpenModuleId] = useState(null);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [activePeer, setActivePeer] = useState("admin");
  const [msg, setMsg] = useState(""); const [communityMsg, setCommunityMsg] = useState("");
  const [viewingResourceId, setViewingResourceId] = useState(null);
  const [meetingsFilter, setMeetingsFilter] = useState("upcoming"); // "upcoming" | "past"
  const [expandedMeetingId, setExpandedMeetingId] = useState(null);
  const myTasks = tasks.filter((t) => t.courseId === course.id && t.assigned.includes(student.id));
  const peers = allStudents.filter((s) => s.id !== student.id && s.cohortId === student.cohortId);
  const key = pairKey(student.id, activePeer);
  const thread = directThreads[key] || [];

  function updateEnrollment(patch) { setStudents((prev) => prev.map((s) => s.id !== student.id ? s : { ...s, enrollments: s.enrollments.map((e) => e.id !== enrollment.id ? e : { ...e, ...patch }) })); }
  function toggleSeenNotice(noticeId) { setNotices((prev) => prev.map((n) => n.id !== noticeId ? n : { ...n, seenBy: (n.seenBy || []).includes(student.id) ? n.seenBy.filter((id) => id !== student.id) : [...(n.seenBy || []), student.id] })); }
  function postCommunity() { if (!communityMsg.trim()) return; setCommunity((p) => [...p, { id: Date.now(), author: student.name, text: communityMsg, image: null, likes: 0, liked: false, comments: [] }]); setCommunityMsg(""); }
  function toggleLike(id) { setCommunity((p) => p.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post)); }
  function sendMsg() { if (!msg.trim()) return; setDirectThreads((p) => ({ ...p, [key]: [...(p[key] || []), { from: student.id, text: msg }] })); setMsg(""); }
  const openTask = openTaskId ? myTasks.find((t) => t.id === openTaskId) : null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-[250px] shrink-0 px-5 py-6 flex flex-col" style={{ borderRight: "1px solid #E7DEC9" }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-6 px-2" style={{ color: "#71675A" }}><ArrowLeft size={14} /> My Courses</button>
        <div className="mb-6 px-2"><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>COURSE</div><div className="f-display text-[16px]" style={{ fontWeight: 700 }}>{course.title}</div></div>
        <div className="flex flex-col gap-1 flex-1">
          <SidebarLink icon={BookOpen} label="Your path" active={tab === "path"} onClick={() => { setTab("path"); setOpenModuleId(null); }} />
          <SidebarLink icon={PlayCircle} label="Virtual Meetings" active={tab === "meetings"} onClick={() => setTab("meetings")} />
          <SidebarLink icon={Library} label="Resource library" active={tab === "library"} onClick={() => setTab("library")} />
          <SidebarLink icon={ListChecks} label="Tasks" active={tab === "tasks"} onClick={() => { setTab("tasks"); setOpenTaskId(null); }} />
          <SidebarLink icon={Award} label="Certificate" active={tab === "certificate"} onClick={() => setTab("certificate")} />
          <SidebarLink icon={MessageCircle} label="Chat" active={tab === "chat"} onClick={() => setTab("chat")} />
          <SidebarLink icon={Users} label="Community" active={tab === "community"} onClick={() => setTab("community")} />
          <SidebarLink icon={Megaphone} label="Notice Board" active={tab === "notice"} onClick={() => setTab("notice")} />
        </div>
      </aside>
      <main className="flex-1 px-10 md:px-16 py-10 max-w-[880px] relative">
        <div className="flex justify-end mb-4"><NotifBell items={notifItems} seen={notifSeen} onMarkSeen={onMarkSeen} /></div>

        {tab === "path" && openModuleId === null && (
          <>
            <div className="mb-10"><div className="f-label text-[12px] mb-2 accent-text">{course.title.toUpperCase()}</div><h1 className="f-display text-[34px] mb-2" style={{ fontWeight: 800 }}>{enrollment.completedModuleIds.length >= course.modules.length ? "All modules complete." : `Module ${enrollment.completedModuleIds.length + 1} of ${course.modules.length}.`}</h1></div>
            <div className="card rounded-2xl p-8 mb-8 flex items-center justify-between flex-wrap gap-4" style={{ background: "var(--accent)" }}><div><div className="f-label text-[11px] mb-2" style={{ color: "#CDE8F5" }}>{enrollment.completedModuleIds.length >= course.modules.length ? "DONE" : "CONTINUE"}</div><div className="f-display text-[22px]" style={{ color: "#FAF6EC", fontWeight: 800 }}>{course.modules[Math.min(enrollment.completedModuleIds.length, course.modules.length - 1)]?.title}</div></div><button onClick={() => setOpenModuleId(course.modules[Math.min(enrollment.completedModuleIds.length, course.modules.length - 1)].id)} className="rounded-full px-6 py-3 text-[15px] flex items-center gap-2 shrink-0" style={{ background: "#FAF6EC", color: "var(--accent)", fontWeight: 700 }}>{enrollment.completedModuleIds.length >= course.modules.length ? "Review" : "Resume lesson"} <ArrowRight size={16} /></button></div>
            <div className="card rounded-2xl p-8"><div className="f-label text-[12px] mb-6" style={{ color: "#71675A" }}>YOUR PATH</div><Spine course={course} enrollment={enrollment} onOpen={(id) => setOpenModuleId(id)} /></div>
          </>
        )}
        {tab === "path" && openModuleId !== null && <LessonView course={course} enrollment={enrollment} updateEnrollment={updateEnrollment} onBack={() => setOpenModuleId(null)} onNext={() => setOpenModuleId(course.modules[enrollment.completedModuleIds.length]?.id ?? null)} moduleId={openModuleId} />}

        {tab === "meetings" && (() => {
          const now = Date.now();
          const grouped = course.modules.map((m, i) => ({
            module: m,
            index: i,
            meetings: (m.meetings || []).filter((mt) => meetingsFilter === "past" ? (mt.date && new Date(mt.date).getTime() < now) : !mt.date || new Date(mt.date).getTime() >= now),
          })).filter((g) => g.meetings.length > 0);
          return (
            <>
              <SectionHeader eyebrow="ALL CLASSES" title="Virtual Meetings" />
              <div className="flex items-center gap-2 mb-8">
                <button onClick={() => setMeetingsFilter("upcoming")} className="f-label text-[11px] px-4 py-2 rounded-full" style={{ background: meetingsFilter === "upcoming" ? "var(--accent)" : "#F0E7D6", color: meetingsFilter === "upcoming" ? "#FAF6EC" : "#71675A" }}>Upcoming</button>
                <button onClick={() => setMeetingsFilter("past")} className="f-label text-[11px] px-4 py-2 rounded-full" style={{ background: meetingsFilter === "past" ? "var(--accent)" : "#F0E7D6", color: meetingsFilter === "past" ? "#FAF6EC" : "#71675A" }}>Past</button>
              </div>
              {grouped.length === 0 && <div className="text-[14px]" style={{ color: "#A79B84" }}>No {meetingsFilter} classes right now.</div>}
              {grouped.map((g) => (
                <div key={g.module.id} className="mb-8">
                  <div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>MODULE {String(g.index + 1).padStart(2, "0")} — {g.module.title.toUpperCase()}</div>
                  <div className="flex flex-col gap-2">{g.meetings.map((mt) => {
                    const expanded = expandedMeetingId === mt.id;
                    const hasRecording = mt.recordingLink || mt.recordingFile;
                    return (
                      <div key={mt.id} className="card rounded-xl overflow-hidden">
                        <button onClick={() => setExpandedMeetingId(expanded ? null : mt.id)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                          <div><div className="text-[14px]" style={{ fontWeight: 700 }}>{mt.label}</div><div className="text-[12px] flex items-center gap-1.5 mt-0.5" style={{ color: "#71675A" }}><Clock size={12} /> {mt.date ? new Date(mt.date).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Date to be confirmed"}</div></div>
                          <div className="flex items-center gap-3">
                            {mt.link && <a href={mt.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="btn-primary rounded-full px-4 py-2 text-[13px]">Join class</a>}
                            {hasRecording && <ChevronDown size={16} color="#A79B84" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />}
                          </div>
                        </button>
                        {expanded && hasRecording && (
                          <div className="px-5 py-4 flex items-center gap-2" style={{ background: "#FAF6EC", borderTop: "1px solid #E7DEC9" }}>
                            <span className="f-label text-[10px]" style={{ color: "#A79B84" }}>RECORDING:</span>
                            {mt.recordingLink && <a href={mt.recordingLink} target="_blank" rel="noreferrer" className="text-[12px] accent-text" style={{ fontWeight: 700 }}>View recording</a>}
                            {mt.recordingFile && <a href={mt.recordingFile.dataUrl} download={mt.recordingFile.name} className="text-[12px] accent-text flex items-center gap-1" style={{ fontWeight: 700 }}><Download size={11} /> {mt.recordingFile.name}</a>}
                          </div>
                        )}
                      </div>
                    );
                  })}</div>
                </div>
              ))}
            </>
          );
        })()}

        {tab === "library" && <><SectionHeader eyebrow="ALWAYS OPEN" title="Resource library" />{[...new Set(resources.filter((r) => r.courseId === course.id || r.visibility === "all").map((r) => r.folder))].map((folder) => <div key={folder} className="mb-7"><div className="flex items-center gap-2 mb-3"><Folder size={16} color="var(--accent)" /><span className="f-label text-[12px]" style={{ color: "#71675A" }}>{folder.toUpperCase()}</span></div><div className="grid gap-3">{resources.filter((r) => (r.courseId === course.id || r.visibility === "all") && r.folder === folder).map((r) => <div key={r.id} className="card rounded-xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><FileText size={18} color="var(--accent)" /><div><div className="text-[15px]" style={{ fontWeight: 700 }}>{r.title}</div><div className="text-[12px]" style={{ color: "#71675A" }}>{r.description.slice(0, 70)}{r.description.length > 70 ? "…" : ""}</div></div></div><button onClick={() => setViewingResourceId(r.id)} className="btn-soft rounded-full px-4 py-2 text-[12px] flex items-center gap-1.5 shrink-0" style={{ fontWeight: 700 }}><Eye size={13} /> View</button></div>)}</div></div>)}
          {viewingResourceId && <ResourceDetail resource={resources.find((r) => r.id === viewingResourceId)} onClose={() => setViewingResourceId(null)} />}
        </>}

        {tab === "tasks" && (openTask ? <TaskDetailStudent task={openTask} student={student} allStudents={allStudents} setTasks={setTasks} onBack={() => setOpenTaskId(null)} /> : <><SectionHeader eyebrow="ASSIGNED TO YOU" title="Tasks" />{myTasks.length === 0 && <div className="text-[15px]" style={{ color: "#A79B84" }}>No tasks assigned yet.</div>}<div className="flex flex-col gap-3">{myTasks.map((t) => { const sub = t.submissions[student.id]; return <button key={t.id} onClick={() => setOpenTaskId(t.id)} className="card card-pop rounded-xl p-5 text-left"><div className="flex items-center justify-between mb-1.5"><div className="text-[16px]" style={{ fontWeight: 700 }}>{t.title}</div>{sub ? <span className="f-code text-[10px] px-2.5 py-1 rounded-full tint-badge">{sub.status.toUpperCase()}</span> : <span className="f-code text-[10px] flex items-center gap-1" style={{ color: "#A79B84" }}><Clock size={11} /> {t.dueInDays}D LEFT</span>}</div><div className="text-[14px]" style={{ color: "#71675A" }}>{t.description}</div></button>; })}</div></>)}

        {tab === "certificate" && <><SectionHeader eyebrow="YOUR ACHIEVEMENT" title="Certificate" />{enrollment.certificateReady && enrollment.certificateFile ? <div className="card rounded-2xl p-10 text-center" style={{ background: "linear-gradient(155deg, color-mix(in srgb, var(--accent) 16%, white), #F0E7D6)" }}><Award size={40} color="var(--accent)" className="mx-auto mb-4" /><div className="f-display text-[22px] mb-2" style={{ fontWeight: 800 }}>Certificate of Completion</div><div className="text-[14px] mb-6" style={{ color: "#4A4237" }}>{course.title} — issued to {student.name}</div><a href={enrollment.certificateFile} download className="btn-primary rounded-full px-6 py-3 text-[14px] inline-block">Download certificate</a></div> : <div className="card rounded-2xl p-10 text-center"><Award size={32} color="#C9BFAE" className="mx-auto mb-3" /><div className="text-[15px]" style={{ color: "#A79B84" }}>Not yet available — finish all modules and it will be issued here.</div></div>}</>}

        {tab === "chat" && (
          <>
            <SectionHeader eyebrow="TALK TO YOUR TUTOR" title="Chat" />
            <div className="card rounded-2xl flex" style={{ height: 480 }}>
              <div className="w-[220px] shrink-0 overflow-y-auto" style={{ borderRight: "1px solid #E7DEC9" }}><button onClick={() => setActivePeer("admin")} className="w-full text-left px-5 py-3.5 text-[14px]" style={{ background: activePeer === "admin" ? "color-mix(in srgb, var(--accent) 14%, white)" : "transparent", fontWeight: 700 }}>Fidelia (Tutor)</button>{peers.map((p) => <button key={p.id} onClick={() => setActivePeer(p.id)} className="w-full text-left px-5 py-3.5 text-[14px]" style={{ background: activePeer === p.id ? "color-mix(in srgb, var(--accent) 14%, white)" : "transparent", fontWeight: 600 }}>{p.name}</button>)}</div>
              <div className="flex-1 flex flex-col"><div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">{thread.length === 0 && <div className="text-[14px]" style={{ color: "#A79B84" }}>No messages yet — say hello.</div>}{thread.map((m, i) => <div key={i} className="max-w-[75%] px-4 py-2.5 rounded-xl text-[14px]" style={{ alignSelf: m.from === student.id ? "flex-end" : "flex-start", background: m.from === student.id ? "var(--accent)" : "#F0E7D6", color: m.from === student.id ? "#FAF6EC" : "#262019" }}>{m.text}</div>)}</div><div className="flex items-center gap-2 p-4" style={{ borderTop: "1px solid #E7DEC9" }}><input className="input-field rounded-full px-4 py-2.5" placeholder="Write a message…" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} /><button onClick={sendMsg} className="btn-primary rounded-full p-2.5 shrink-0"><Send size={16} /></button></div></div>
            </div>
          </>
        )}
        {tab === "community" && <CommunityPanel community={community} setCommunity={setCommunity} authorName={student.name} allStudents={peers} cohortId={student.cohortId} />}
        {tab === "notice" && <><SectionHeader eyebrow="FROM THE CREATOR" title="Notice Board" /><div className="flex flex-col gap-3">{[...notices].reverse().map((a) => { const seen = (a.seenBy || []).includes(student.id); return (
          <div key={a.id} className="card rounded-xl p-5">
            <div className="f-label text-[11px] mb-2 accent-text">THE CREATOR</div>
            <div className="text-[16px] mb-3">{a.text}</div>
            <button onClick={() => toggleSeenNotice(a.id)} className="rounded-full px-3.5 py-1.5 text-[12px] flex items-center gap-1.5" style={{ background: seen ? "var(--accent)" : "#F0E7D6", color: seen ? "#FAF6EC" : "#71675A", fontWeight: 700 }}><Check size={12} /> {seen ? "You've seen this" : "Mark as seen"}</button>
          </div>
        ); })}</div></>}
      </main>
    </div>
  );
}
export function TaskDetailStudent({ task, student, allStudents, setTasks, onBack }) {
  const [note, setNote] = useState(""); const sub = task.submissions[student.id];
  function submit() { if (!note.trim()) return; setTasks((prev) => prev.map((t) => t.id !== task.id ? t : { ...t, submissions: { ...t.submissions, [student.id]: { status: "in review", note, score: null } } })); }
  const others = task.assigned.filter((id) => id !== student.id).map((id) => allStudents.find((s) => s.id === id)?.name).filter(Boolean);
  const proofLabel = { link: "a link", image: "an image link", document: "a document link", text: "a written answer" }[task.proofType] || "your proof";
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to tasks</button>
      <div className="card rounded-2xl p-8">
        <div className="f-display text-[23px] mb-2" style={{ fontWeight: 800 }}>{task.title}</div>
        <div className="text-[15px] mb-4" style={{ color: "#4A4237" }}>{task.description}</div>
        {task.tools && <div className="text-[14px] mb-2" style={{ color: "#71675A" }}><strong>Tools:</strong> {task.tools}</div>}
        <div className="text-[14px] mb-2" style={{ color: "#71675A" }}><strong>Submit:</strong> {proofLabel}</div>
        <div className="f-code text-[11px] mb-1 flex items-center gap-1.5" style={{ color: "#A79B84" }}><Clock size={11} /> DUE IN {task.dueInDays} DAYS</div>
        {others.length > 0 && <div className="text-[13px] mb-6" style={{ color: "#A79B84" }}>Also assigned to: {others.join(", ")}</div>}
        {sub ? <div className="rounded-xl p-4 mt-2" style={{ background: "#FAF6EC" }}><span className="f-code text-[10px] tint-badge px-2.5 py-1 rounded-full">{sub.status.toUpperCase()}{sub.score != null ? ` · ${sub.score}%` : ""}</span><div className="text-[14px] mt-3" style={{ color: "#4A4237" }}>{sub.note}</div></div> : <div className="mt-4"><TextArea label={`Provide ${proofLabel}`} value={note} onChange={(e) => setNote(e.target.value)} /><button onClick={submit} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] mt-3 flex items-center gap-1.5"><UploadCloud size={14} /> Submit</button></div>}
      </div>
    </div>
  );
}
export function CommunityPanel({ community, setCommunity, authorName, allStudents, cohortId = "all" }) {
  const [text, setText] = useState(""); const [showMentions, setShowMentions] = useState(false);
  function post() { if (!text.trim()) return; setCommunity((p) => [...p, { id: Date.now(), author: authorName, text, image: null, likes: 0, liked: false, comments: [], cohortId }]); setText(""); }
  function toggleLike(id) { setCommunity((p) => p.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post)); }
  function addComment(id, ctext) { if (!ctext.trim()) return; setCommunity((p) => p.map((post) => post.id === id ? { ...post, comments: [...post.comments, { author: authorName, text: ctext }] } : post)); }
  const names = [{ name: "Fidelia" }, ...allStudents.map((s) => ({ name: s.name }))];
  const visible = community.filter((p) => cohortId === "all" || (p.cohortId || "all") === "all" || p.cohortId === cohortId);
  return (
    <>
      <SectionHeader eyebrow="OPEN DISCUSSION" title="Community" />
      <div className="card rounded-2xl p-6 mb-5 relative">
        <div className="f-display text-[18px] mb-1" style={{ fontWeight: 700 }}>Welcome to the Room community.</div>
        <div className="text-[14px] mb-4" style={{ color: "#71675A" }}>Drop your thoughts, wins, or questions.</div>
        <div className="flex gap-2 items-start">
          <input className="input-field rounded-lg px-4 py-2.5" placeholder="Share something with the cohort…" value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={() => setShowMentions((s) => !s)} className="btn-soft rounded-lg p-2.5 shrink-0"><AtSign size={16} /></button>
        </div>
        {showMentions && <div className="card rounded-lg p-2 mt-2 absolute z-10" style={{ width: 200 }}>{names.map((n, i) => <button key={i} onClick={() => { setText((t) => t + `@${n.name} `); setShowMentions(false); }} className="block w-full text-left px-3 py-1.5 text-[13px] rounded">{n.name}</button>)}</div>}
        <button onClick={post} className="btn-primary rounded-lg px-5 py-2 text-[14px] mt-3">Post</button>
      </div>
      <div className="flex flex-col gap-4">{[...visible].reverse().map((p) => <CommunityPost key={p.id} post={p} onLike={() => toggleLike(p.id)} onComment={(t) => addComment(p.id, t)} />)}</div>
    </>
  );
}
export function CommunityPost({ post, onLike, onComment }) {
  const [c, setC] = useState("");
  return (
    <div className="card rounded-xl p-5">
      <div className="f-label text-[11px] mb-2 accent-text">{post.author.toUpperCase()}</div>
      <div className="text-[15px] mb-3">{post.text}</div>
      {post.image && <img src={post.image} alt="" className="rounded-lg mb-3" style={{ maxWidth: "100%" }} />}
      <div className="flex items-center gap-4 text-[13px] mb-3" style={{ color: "#A79B84" }}><button onClick={onLike} className="flex items-center gap-1.5"><Heart size={15} fill={post.liked ? "var(--accent)" : "none"} color={post.liked ? "var(--accent)" : "#A79B84"} /> {post.likes}</button><span className="flex items-center gap-1.5"><MessageSquare size={15} /> {post.comments.length}</span></div>
      {post.comments.length > 0 && <div className="flex flex-col gap-2 mb-3">{post.comments.map((c2, i) => <div key={i} className="text-[13px] rounded-lg px-3 py-2" style={{ background: "#FAF6EC" }}><strong>{c2.author}:</strong> {c2.text}</div>)}</div>}
      <div className="flex gap-2"><input className="input-field rounded-lg px-3 py-1.5 text-[13px]" placeholder="Write a comment…" value={c} onChange={(e) => setC(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && c.trim()) { onComment(c); setC(""); } }} /><button onClick={() => { if (c.trim()) { onComment(c); setC(""); } }} className="btn-soft rounded-lg px-3 py-1.5 text-[12px]">Send</button></div>
    </div>
  );
}

const MAX_COURSES_PER_COHORT = 2;
export function MyCourses({ student, setStudents, courses, cohorts, applicants, tasks, setTasks, resources, community, setCommunity, notices, setNotices, directThreads, setDirectThreads, allStudents, onExit, onViewSite, onApplyMore, notifItems, notifSeen, onMarkSeen }) {
  const [tab, setTab] = useState("courses"); // "courses" | "explore" | "profile"
  const [openEnrollmentId, setOpenEnrollmentId] = useState(null);
  const [redeemEnrollmentId, setRedeemEnrollmentId] = useState(null);
  const [redeemCodeInput, setRedeemCodeInput] = useState(""); const [redeemError, setRedeemError] = useState("");
  const [showTour, setShowTour] = useState(!student.seenTour);
  const cohort = cohorts.find((c) => c.id === student.cohortId);
  const openEnrollment = openEnrollmentId ? student.enrollments.find((e) => e.id === openEnrollmentId) : null;
  const openCourse = openEnrollment ? courses.find((c) => c.id === openEnrollment.courseId) : null;
  const redeemEnrollment = redeemEnrollmentId ? student.enrollments.find((e) => e.id === redeemEnrollmentId) : null;
  const redeemCourse = redeemEnrollment ? courses.find((c) => c.id === redeemEnrollment.courseId) : null;
  const pendingApplications = applicants.filter((a) => a.studentRef === student.id && a.status === "pending");
  const usedSlots = student.enrollments.length + pendingApplications.length;
  const atCap = usedSlots >= MAX_COURSES_PER_COHORT;

  function dismissTour() { setShowTour(false); setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, seenTour: true } : s)); }
  function confirmRedeem() {
    if (redeemCodeInput.trim().toLowerCase() !== redeemEnrollment.code.toLowerCase()) { setRedeemError("That code doesn't match."); return; }
    setStudents((prev) => prev.map((s) => s.id !== student.id ? s : { ...s, enrollments: s.enrollments.map((e) => e.id === redeemEnrollmentId ? { ...e, status: "active" } : e) }));
    setRedeemEnrollmentId(null); setRedeemCodeInput(""); setRedeemError("");
  }

  if (openEnrollment && openCourse) return <EnrollmentDashboard student={student} setStudents={setStudents} course={openCourse} enrollment={openEnrollment} tasks={tasks} setTasks={setTasks} resources={resources} community={community} setCommunity={setCommunity} notices={notices} setNotices={setNotices} directThreads={directThreads} setDirectThreads={setDirectThreads} allStudents={allStudents} onBack={() => setOpenEnrollmentId(null)} notifItems={notifItems} notifSeen={notifSeen} onMarkSeen={onMarkSeen} />;
  if (redeemEnrollment && redeemCourse) return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="reveal in max-w-[400px] w-full">
        <LogoMark height={64} /><div className="f-label text-[13px] mt-6 mb-3 accent-text">YOU'RE ACCEPTED</div><h1 className="f-display text-[28px] mb-4" style={{ fontWeight: 800 }}>Enter your code for {redeemCourse.title}.</h1>
        <div className="card rounded-2xl p-6 text-left"><Field label="Access code" placeholder="FJ-XXXXX" value={redeemCodeInput} onChange={(e) => setRedeemCodeInput(e.target.value)} />{redeemError && <div className="text-[12px] mt-2" style={{ color: "#B04A3A" }}>{redeemError}</div>}<button onClick={confirmRedeem} className="btn-primary rounded-lg py-3 text-[15px] w-full mt-4">Unlock this course</button></div>
        <button onClick={() => { setRedeemEnrollmentId(null); setRedeemCodeInput(""); setRedeemError(""); }} className="f-label text-[12px] mt-5 block mx-auto" style={{ color: "#A79B84" }}>BACK TO MY COURSES</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {showTour && <WelcomeTour onDone={dismissTour} />}
      <aside className="w-[250px] shrink-0 px-5 py-6 flex flex-col" style={{ borderRight: "1px solid #E7DEC9" }}>
        <div className="flex items-center justify-between mb-8 px-2"><LogoMark height={40} /><button onClick={onExit} title="Sign out"><LogOut size={17} color="#A79B84" /></button></div>
        <div className="flex flex-col gap-1 flex-1">
          <div data-tour="nav-courses"><SidebarLink icon={BookOpen} label="My courses" active={tab === "courses"} onClick={() => setTab("courses")} /></div>
          <div data-tour="nav-explore"><SidebarLink icon={Compass} label="Explore More Courses" active={tab === "explore"} onClick={() => setTab("explore")} /></div>
          <div data-tour="nav-profile"><SidebarLink icon={UserCircle} label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} /></div>
        </div>
        <button onClick={onViewSite} className="flex items-center gap-2 px-4 py-2.5 text-[14px]" style={{ color: "#A79B84", fontWeight: 600 }}><Home size={16} /> Home page</button>
        <button onClick={onExit} className="flex items-center gap-2 px-4 py-2.5 text-[14px]" style={{ color: "#A79B84", fontWeight: 600 }}><LogOut size={16} /> Sign out</button>
      </aside>
      <main className="flex-1 px-10 md:px-16 py-10 max-w-[880px]">
        <div className="flex justify-end mb-4" data-tour="notif-bell"><NotifBell items={notifItems} seen={notifSeen} onMarkSeen={onMarkSeen} /></div>
        {tab === "courses" && (
          <>
            <div className="mb-10"><div className="f-label text-[12px] mb-2 accent-text">WELCOME BACK</div><h1 className="f-display text-[34px] mb-2" style={{ fontWeight: 800 }}>{student.name.split(" ")[0]}.</h1>{cohort && <p className="text-[16px]" style={{ color: "#71675A" }}>Your Cohort: {cohort.name}</p>}</div>
            <div className="f-label text-[12px] mb-5" style={{ color: "#71675A" }}>MY COURSES</div>
            <div className="grid md:grid-cols-2 gap-5 mb-10">
              {student.enrollments.map((e) => {
                const c = courses.find((x) => x.id === e.courseId);
                if (!c) return null;
                const pct = Math.round((e.completedModuleIds.length / c.modules.length) * 100);
                const locked = e.status === "active" && cohort && !(cohort.unlockedCourseIds || []).includes(e.courseId);
                const awaitingCode = e.status === "awaiting-code";
                const clickable = !locked;
                return (
                  <button key={e.id} onClick={() => { if (!clickable) return; awaitingCode ? setRedeemEnrollmentId(e.id) : setOpenEnrollmentId(e.id); }} disabled={!clickable} className="card card-pop rounded-2xl p-6 text-left" style={{ opacity: clickable ? 1 : 0.6 }}>
                    <div className="flex items-center justify-between mb-3"><div className="f-display text-[18px]" style={{ fontWeight: 700 }}>{c.title}</div>{awaitingCode && <span className="f-code text-[9px] px-2 py-1 rounded-full tint-badge">ACCEPTED — ENTER CODE</span>}{locked && <span className="f-code text-[9px] px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#F0E7D6", color: "#71675A" }}><Lock size={9} /> LOCKED</span>}</div>
                    {locked ? <div className="text-[13px]" style={{ color: "#A79B84" }}>Lectures haven't started yet — you'll be unlocked once your cohort begins.</div> : awaitingCode ? <div className="text-[13px] accent-text" style={{ fontWeight: 700 }}>Click to enter your access code</div> : <>
                      <ProgressBar pct={pct} />
                      <div className="flex items-center justify-between mt-2"><span className="text-[13px]" style={{ color: "#71675A" }}>{pct}% complete</span><span className="text-[13px] accent-text" style={{ fontWeight: 700 }}>{c.modules[Math.min(e.completedModuleIds.length, c.modules.length - 1)]?.title}</span></div>
                    </>}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {tab === "explore" && (
          <>
            <div className="mb-10"><div className="f-label text-[12px] mb-2 accent-text">EXPLORE MORE</div><h1 className="f-display text-[34px] mb-2" style={{ fontWeight: 800 }}>Available courses in your cohort.</h1>{cohort && <p className="text-[16px]" style={{ color: "#71675A" }}>{atCap ? `You've reached the maximum of ${MAX_COURSES_PER_COHORT} courses for ${cohort.name}.` : `You can apply for up to ${MAX_COURSES_PER_COHORT} courses per cohort.`}</p>}</div>
            {pendingApplications.length > 0 && (
              <div className="mb-8">
                <div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>APPLICATIONS IN REVIEW</div>
                <div className="flex flex-col gap-2">{pendingApplications.map((a) => <div key={a.id} className="card rounded-xl p-4 flex items-center justify-between"><span className="text-[14px]" style={{ fontWeight: 700 }}>{courses.find((c) => c.id === a.courseId)?.title}</span><span className="f-code text-[10px] px-2.5 py-1 rounded-full tint-badge">IN REVIEW</span></div>)}</div>
              </div>
            )}
            <div className="f-label text-[12px] mb-5" style={{ color: "#71675A" }}>COURSES</div>
            <div className="grid md:grid-cols-2 gap-5">
              {(cohort ? courses.filter((c) => cohort.courseIds.includes(c.id)) : []).filter((c) => !student.enrollments.some((e) => e.courseId === c.id) && !pendingApplications.some((a) => a.courseId === c.id)).map((c) => (
                <div key={c.id} className="card rounded-2xl p-6">
                  <div className="f-display text-[18px] mb-2" style={{ fontWeight: 700 }}>{c.title}</div>
                  <div className="text-[13px] mb-4" style={{ color: "#71675A" }}>{c.tagline}</div>
                  <button onClick={() => onApplyMore(c.id)} disabled={atCap} className="btn-primary rounded-full px-5 py-2.5 text-[13px]" style={{ opacity: atCap ? 0.5 : 1 }}>Apply</button>
                </div>
              ))}
              {cohort && courses.filter((c) => cohort.courseIds.includes(c.id)).filter((c) => !student.enrollments.some((e) => e.courseId === c.id) && !pendingApplications.some((a) => a.courseId === c.id)).length === 0 && <div className="text-[14px]" style={{ color: "#A79B84" }}>Nothing new to apply for right now.</div>}
            </div>
          </>
        )}
        {tab === "profile" && <ProfilePage student={student} setStudents={setStudents} cohort={cohort} />}
      </main>
    </div>
  );
}

function ProfilePage({ student, setStudents, cohort }) {
  const [photo, setPhoto] = useState(student.photo);
  const [bio, setBio] = useState(student.bio || "");
  const [saved, setSaved] = useState(false);
  function onPhotoPick(e) { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }
  function save() { setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, photo, bio } : s)); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  return (
    <div className="max-w-[520px]">
      <div className="mb-8"><div className="f-label text-[12px] mb-2 accent-text">YOUR PROFILE</div><h1 className="f-display text-[30px]" style={{ fontWeight: 800 }}>Profile details.</h1></div>
      <div className="card rounded-2xl p-8">
        <div className="flex items-center gap-5 mb-6"><div className="rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: 76, height: 76, background: "color-mix(in srgb, var(--accent) 14%, white)" }}>{photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle size={34} color="var(--accent)" />}</div><label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}>Change photo<input type="file" accept="image/*" onChange={onPhotoPick} style={{ display: "none" }} /></label></div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>NAME</div><div className="text-[14px]" style={{ fontWeight: 600 }}>{student.name}</div></div>
          <div><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>STUDENT ID</div><div className="text-[14px] f-code">{student.studentId}</div></div>
          <div><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>EMAIL</div><div className="text-[14px]" style={{ fontWeight: 600 }}>{student.email}</div></div>
          <div><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>COHORT</div><div className="text-[14px]" style={{ fontWeight: 600 }}>{cohort?.name || "—"}</div></div>
        </div>
        <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the Room a bit about yourself…" />
        <div className="flex items-center gap-3 mt-4"><button onClick={save} className="btn-primary rounded-lg px-6 py-2.5 text-[14px]">Save profile</button>{saved && <span className="text-[13px] accent-text" style={{ fontWeight: 700 }}>Saved.</span>}</div>
      </div>
      <ChangePasswordCard email={student.email} />
    </div>
  );
}

// =========================================================
// ADMIN
// =========================================================
