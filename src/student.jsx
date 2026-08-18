import React, { useState, useEffect, useRef } from "react";
import {
  Lock, CheckCircle2, Circle, ArrowRight, ArrowLeft, BookOpen, Users,
  MessageCircle, ListChecks, Settings, LogOut, Library, ChevronRight,
  ChevronDown, Sparkles, Plus, Check, Send, X, Heart, MessageSquare,
  FileText, Download, GraduationCap, Mail, Phone, Award,
  UserCircle, FolderPlus, Folder, UploadCloud, ClipboardCheck, HelpCircle as HelpIcon,
  Clock, Trash2, Eye, Star, Pencil, PlayCircle, Bell, Megaphone, Layers, AtSign
} from "lucide-react";
import { pairKey, moduleStatus } from "./lib/data.js";
import { SectionHeader, NotifBell, WelcomeTour, SidebarLink, LogoMark, Spine, TextArea, ProgressBar } from "./components.jsx";

export function LessonView({ course, enrollment, updateEnrollment, onBack, onNext }) {
  const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null); const [proof, setProof] = useState("");
  const idx = course.modules.findIndex((m) => moduleStatus(course, enrollment, m.id) === "current" || moduleStatus(course, enrollment, m.id) === "complete" ? m.id === (course.modules[enrollment.completedModuleIds.length] || course.modules[course.modules.length - 1]).id : false);
  const module = course.modules[Math.min(enrollment.completedModuleIds.length, course.modules.length - 1)];
  const status = moduleStatus(course, enrollment, module.id);
  const [justPassed, setJustPassed] = useState(false);
  const hasNext = enrollment.completedModuleIds.length < course.modules.length;
  function completeModule() { updateEnrollment({ completedModuleIds: [...new Set([...enrollment.completedModuleIds, module.id])] }); setJustPassed(true); }
  function submitQuiz() { let correct = 0; module.quiz.forEach((q, i) => { if (answers[i] === q.correct) correct++; }); const pct = Math.round((correct / module.quiz.length) * 100); setResult(pct); if (pct >= (module.passPct || 70)) completeModule(); }
  function submitOther() { if (proof.trim()) completeModule(); }
  if (justPassed) return (
    <div className="min-h-screen px-10 md:px-16 py-12 max-w-[600px] mx-auto flex flex-col items-center text-center justify-center" style={{ minHeight: "70vh" }}>
      <CheckCircle2 size={48} color="var(--accent)" className="mb-5" />
      <div className="f-display text-[28px] mb-3" style={{ fontWeight: 800 }}>Well done — you passed!</div>
      <div className="text-[15px] mb-8" style={{ color: "#71675A" }}>{hasNext ? "The next module is unlocked." : "That was the last module — nicely done."}</div>
      <div className="flex gap-3">{hasNext && <button onClick={() => { setJustPassed(false); setResult(null); setAnswers({}); setProof(""); }} className="btn-primary rounded-full px-7 py-3.5 text-[15px]" style={{ fontWeight: 700 }}>Continue to next module</button>}<button onClick={onBack} className="btn-ghost rounded-full px-7 py-3.5 text-[15px]">Back to your path</button></div>
    </div>
  );
  return (
    <div className="min-h-screen px-10 md:px-16 py-12 max-w-[760px] mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-8" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to your path</button>
      <div className="f-code text-[12px] mb-2 accent-text">MODULE {String(module.id).padStart(2, "0")}</div>
      <h1 className="f-display text-[30px] mb-6" style={{ fontWeight: 800 }}>{module.title}</h1>
      <div className="card rounded-2xl p-8 mb-6"><div className="f-label text-[11px] mb-3" style={{ color: "#A79B84" }}>LECTURE NOTES</div><p className="text-[15px] leading-relaxed" style={{ color: "#4A4237" }}>{module.notes || "Lecture content coming soon."}</p></div>
      {status === "complete" && <div className="card rounded-2xl p-6 flex items-center gap-3" style={{ background: "color-mix(in srgb, var(--accent) 8%, white)" }}><CheckCircle2 size={20} color="var(--accent)" /><span className="text-[14px]" style={{ fontWeight: 700 }}>You've completed this module.</span></div>}
      {status === "current" && module.testType === "multiple-choice" && (
        <div className="card rounded-2xl p-8">
          <div className="f-display text-[19px] mb-5" style={{ fontWeight: 700 }}>Quick check — {module.passPct}% to pass</div>
          {module.quiz.map((q, qi) => <div key={qi} className="mb-6"><div className="text-[15px] mb-3" style={{ fontWeight: 600 }}>{q.q}</div><div className="flex flex-col gap-2">{q.options.map((o, oi) => <label key={oi} className="flex items-center gap-2.5 text-[14px] rounded-lg px-4 py-2.5" style={{ background: answers[qi] === oi ? "color-mix(in srgb, var(--accent) 10%, white)" : "#FAF6EC", border: answers[qi] === oi ? "1.5px solid var(--accent)" : "1px solid #E7DEC9" }}><input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))} /> {o}</label>)}</div></div>)}
          {result != null && result < (module.passPct || 70) && <div className="text-[14px] mb-4" style={{ color: "#B04A3A", fontWeight: 700 }}>Scored {result}% — try again to unlock the next module.</div>}
          <button onClick={submitQuiz} className="btn-primary rounded-lg px-6 py-3 text-[14px]">Submit answers</button>
        </div>
      )}
      {status === "current" && module.testType === "checklist" && <div className="card rounded-2xl p-8"><div className="f-display text-[19px] mb-3" style={{ fontWeight: 700 }}>Self-check</div><button onClick={completeModule} className="btn-primary rounded-lg px-6 py-3 text-[14px]">I've completed this module</button></div>}
      {status === "current" && (module.testType === "written" || module.testType === "file-upload") && <div className="card rounded-2xl p-8"><div className="f-display text-[19px] mb-3" style={{ fontWeight: 700 }}>{module.testType === "written" ? "Written response" : `Upload your work${module.proofType === "document" ? " (document)" : ""}`}</div><TextArea label={module.testType === "written" ? "Your answer" : "Link to your file"} value={proof} onChange={(e) => setProof(e.target.value)} /><button onClick={submitOther} className="btn-primary rounded-lg px-6 py-3 text-[14px] mt-4">Submit for review</button></div>}
    </div>
  );
}

// =========================================================
// STUDENT: My Courses + per-enrollment dashboard
// =========================================================
export function EnrollmentDashboard({ student, setStudents, course, enrollment, tasks, setTasks, resources, community, setCommunity, notices, directThreads, setDirectThreads, allStudents, onBack, notifItems, notifSeen, onMarkSeen }) {
  const [tab, setTab] = useState("path");
  const [openModuleId, setOpenModuleId] = useState("auto");
  const [openTaskId, setOpenTaskId] = useState(null);
  const [activePeer, setActivePeer] = useState("admin");
  const [msg, setMsg] = useState(""); const [communityMsg, setCommunityMsg] = useState("");
  const myTasks = tasks.filter((t) => t.courseId === course.id && t.assigned.includes(student.id));
  const peers = allStudents.filter((s) => s.id !== student.id);
  const key = pairKey(student.id, activePeer);
  const thread = directThreads[key] || [];

  function updateEnrollment(patch) { setStudents((prev) => prev.map((s) => s.id !== student.id ? s : { ...s, enrollments: s.enrollments.map((e) => e.id !== enrollment.id ? e : { ...e, ...patch }) })); }
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
          <SidebarLink icon={BookOpen} label="Your path" active={tab === "path"} onClick={() => { setTab("path"); setOpenModuleId("auto"); }} />
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

        {tab === "path" && openModuleId === "auto" && (
          <>
            <div className="mb-10"><div className="f-label text-[12px] mb-2 accent-text">{course.title.toUpperCase()}</div><h1 className="f-display text-[34px] mb-2" style={{ fontWeight: 800 }}>Module {enrollment.completedModuleIds.length + 1} of {course.modules.length}.</h1></div>
            <div className="card rounded-2xl p-8 mb-8 flex items-center justify-between flex-wrap gap-4" style={{ background: "var(--accent)" }}><div><div className="f-label text-[11px] mb-2" style={{ color: "#CDE8F5" }}>CONTINUE</div><div className="f-display text-[22px]" style={{ color: "#FAF6EC", fontWeight: 800 }}>{course.modules[Math.min(enrollment.completedModuleIds.length, course.modules.length - 1)]?.title}</div></div><button onClick={() => setOpenModuleId("open")} className="rounded-full px-6 py-3 text-[15px] flex items-center gap-2 shrink-0" style={{ background: "#FAF6EC", color: "var(--accent)", fontWeight: 700 }}>Resume lesson <ArrowRight size={16} /></button></div>
            <div className="card rounded-2xl p-8"><div className="f-label text-[12px] mb-6" style={{ color: "#71675A" }}>YOUR PATH</div><Spine course={course} enrollment={enrollment} onOpen={() => setOpenModuleId("open")} /></div>
          </>
        )}
        {tab === "path" && openModuleId === "open" && <LessonView course={course} enrollment={enrollment} updateEnrollment={updateEnrollment} onBack={() => setOpenModuleId("auto")} />}

        {tab === "library" && <><SectionHeader eyebrow="ALWAYS OPEN" title="Resource library" />{[...new Set(resources.filter((r) => r.courseId === course.id || r.visibility === "all").map((r) => r.folder))].map((folder) => <div key={folder} className="mb-7"><div className="flex items-center gap-2 mb-3"><Folder size={16} color="var(--accent)" /><span className="f-label text-[12px]" style={{ color: "#71675A" }}>{folder.toUpperCase()}</span></div><div className="grid gap-3">{resources.filter((r) => (r.courseId === course.id || r.visibility === "all") && r.folder === folder).map((r) => <div key={r.id} className="card rounded-xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><FileText size={18} color="var(--accent)" /><div><div className="text-[15px]" style={{ fontWeight: 700 }}>{r.title}</div><div className="text-[12px]" style={{ color: "#71675A" }}>{r.description}</div></div></div><a href={r.url} target="_blank" rel="noreferrer" download={r.kind === "file" ? true : undefined} className="btn-soft rounded-full px-4 py-2 text-[12px] flex items-center gap-1.5 shrink-0" style={{ fontWeight: 700 }}>{r.kind === "file" ? <><Download size={13} /> Download</> : <><Eye size={13} /> View</>}</a></div>)}</div></div>)}</>}

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
        {tab === "community" && <CommunityPanel community={community} setCommunity={setCommunity} authorName={student.name} allStudents={allStudents} />}
        {tab === "notice" && <><SectionHeader eyebrow="FROM THE CREATOR" title="Notice Board" /><div className="flex flex-col gap-3">{[...notices].reverse().map((a, i) => <div key={i} className="card rounded-xl p-5"><div className="f-label text-[11px] mb-2 accent-text">THE CREATOR</div><div className="text-[16px]">{a.text}</div></div>)}</div></>}
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
export function CommunityPanel({ community, setCommunity, authorName, allStudents }) {
  const [text, setText] = useState(""); const [showMentions, setShowMentions] = useState(false);
  function post() { if (!text.trim()) return; setCommunity((p) => [...p, { id: Date.now(), author: authorName, text, image: null, likes: 0, liked: false, comments: [] }]); setText(""); }
  function toggleLike(id) { setCommunity((p) => p.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post)); }
  function addComment(id, ctext) { if (!ctext.trim()) return; setCommunity((p) => p.map((post) => post.id === id ? { ...post, comments: [...post.comments, { author: authorName, text: ctext }] } : post)); }
  const names = [{ name: "Fidelia" }, ...allStudents.map((s) => ({ name: s.name }))];
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
      <div className="flex flex-col gap-4">{[...community].reverse().map((p) => <CommunityPost key={p.id} post={p} onLike={() => toggleLike(p.id)} onComment={(t) => addComment(p.id, t)} />)}</div>
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

export function MyCourses({ student, setStudents, courses, cohorts, tasks, setTasks, resources, community, setCommunity, notices, directThreads, setDirectThreads, allStudents, onExit, onApplyMore, notifItems, notifSeen, onMarkSeen }) {
  const [openEnrollmentId, setOpenEnrollmentId] = useState(null);
  const [photo, setPhoto] = useState(student.photo);
  const [showTour, setShowTour] = useState(!student.seenTour);
  const cohort = cohorts.find((c) => c.id === student.cohortId);
  const openEnrollment = openEnrollmentId ? student.enrollments.find((e) => e.id === openEnrollmentId) : null;
  const openCourse = openEnrollment ? courses.find((c) => c.id === openEnrollment.courseId) : null;

  function dismissTour() { setShowTour(false); setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, seenTour: true } : s)); }
  function onPhotoPick(e) { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }

  if (openEnrollment && openCourse) return <EnrollmentDashboard student={student} setStudents={setStudents} course={openCourse} enrollment={openEnrollment} tasks={tasks} setTasks={setTasks} resources={resources} community={community} setCommunity={setCommunity} notices={notices} directThreads={directThreads} setDirectThreads={setDirectThreads} allStudents={allStudents} onBack={() => setOpenEnrollmentId(null)} notifItems={notifItems} notifSeen={notifSeen} onMarkSeen={onMarkSeen} />;

  return (
    <div className="min-h-screen flex">
      {showTour && <WelcomeTour onDone={dismissTour} />}
      <aside className="w-[250px] shrink-0 px-5 py-6 flex flex-col" style={{ borderRight: "1px solid #E7DEC9" }}>
        <div className="flex items-center justify-between mb-8 px-2"><LogoMark height={40} /><button onClick={onExit} title="Sign out"><LogOut size={17} color="#A79B84" /></button></div>
        <div className="flex flex-col gap-1 flex-1">
          <SidebarLink icon={BookOpen} label="My courses" active onClick={() => {}} />
          <SidebarLink icon={UserCircle} label="Profile" active={false} onClick={() => {}} />
          <button onClick={onApplyMore} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] w-full text-left mt-2" style={{ color: "var(--accent)", fontWeight: 700, border: "1.5px dashed color-mix(in srgb, var(--accent) 50%, transparent)" }}><Plus size={16} /> Apply for a New Course</button>
        </div>
        <button onClick={onExit} className="flex items-center gap-2 px-4 py-2.5 text-[14px]" style={{ color: "#A79B84", fontWeight: 600 }}><LogOut size={16} /> Sign out</button>
      </aside>
      <main className="flex-1 px-10 md:px-16 py-10 max-w-[880px]">
        <div className="flex justify-end mb-4"><NotifBell items={notifItems} seen={notifSeen} onMarkSeen={onMarkSeen} /></div>
        <div className="mb-10"><div className="f-label text-[12px] mb-2 accent-text">WELCOME BACK</div><h1 className="f-display text-[34px] mb-2" style={{ fontWeight: 800 }}>{student.name.split(" ")[0]}.</h1>{cohort && <p className="text-[16px]" style={{ color: "#71675A" }}>Your Cohort: {cohort.name}</p>}</div>
        <div className="f-label text-[12px] mb-5" style={{ color: "#71675A" }}>MY COURSES</div>
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {student.enrollments.map((e) => {
            const c = courses.find((x) => x.id === e.courseId);
            if (!c) return null;
            const pct = Math.round((e.completedModuleIds.length / c.modules.length) * 100);
            return (
              <button key={e.id} onClick={() => setOpenEnrollmentId(e.id)} disabled={e.status === "awaiting-code"} className="card card-pop rounded-2xl p-6 text-left" style={{ opacity: e.status === "awaiting-code" ? 0.6 : 1 }}>
                <div className="flex items-center justify-between mb-3"><div className="f-display text-[18px]" style={{ fontWeight: 700 }}>{c.title}</div>{e.status === "awaiting-code" && <span className="f-code text-[9px] px-2 py-1 rounded-full tint-badge">CODE PENDING</span>}</div>
                {e.status !== "awaiting-code" && <>
                  <ProgressBar pct={pct} />
                  <div className="flex items-center justify-between mt-2"><span className="text-[13px]" style={{ color: "#71675A" }}>{pct}% complete</span><span className="text-[13px] accent-text" style={{ fontWeight: 700 }}>{c.modules[Math.min(e.completedModuleIds.length, c.modules.length - 1)]?.title}</span></div>
                </>}
              </button>
            );
          })}
        </div>
        <div className="card rounded-2xl p-8 max-w-[440px]">
          <div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>PROFILE</div>
          <div className="flex items-center gap-5 mb-6"><div className="rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: 68, height: 68, background: "color-mix(in srgb, var(--accent) 14%, white)" }}>{photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle size={32} color="var(--accent)" />}</div><label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}>Change photo<input type="file" accept="image/*" onChange={onPhotoPick} style={{ display: "none" }} /></label></div>
          <div className="f-code text-[11px]" style={{ color: "#A79B84" }}>STUDENT ID: {student.studentId}</div>
        </div>
      </main>
    </div>
  );
}

// =========================================================
// ADMIN
// =========================================================
