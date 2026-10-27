import React, { useState, useEffect, useRef } from "react";
import {
  Lock, CheckCircle2, Circle, ArrowRight, ArrowLeft, BookOpen, Users,
  MessageCircle, ListChecks, Settings, LogOut, Library, ChevronRight,
  ChevronDown, Sparkles, Plus, Check, Send, X, Heart, MessageSquare,
  FileText, Download, GraduationCap, Mail, Phone, Award,
  UserCircle, FolderPlus, Folder, UploadCloud, ClipboardCheck, HelpCircle as HelpIcon,
  Clock, Trash2, Eye, Star, Pencil, PlayCircle, Bell, Megaphone, Layers, AtSign, Home, UserCog, Repeat, RotateCcw, IdCard
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { genCode, pairKey, ADMIN_EMAIL, TEAM_PERMISSION_TABS, LINK_TYPES, STUDENT_ACCESS_TABS, linkShare, deriveSubmissionStatus, sumLinkScores, capstoneStatus, courseEligibility, formatDateTime, formatRelativeTime, AUTO_APPROVE_THRESHOLD } from "./lib/data.js";
import { renderCertificate, formatIssueDate } from "./lib/certificate.js";
import { renderTestimonialCard } from "./lib/testimonial.js";
import { Field, SectionHeader, NotifBell, SidebarLink, LogoMark, TextArea, SelectF, ImgField, FileField, TaskFileList, ChangePasswordCard, RichTextEditor, RichText, DashboardShell, WelcomeTour, TEAM_TOUR_STEPS } from "./components.jsx";
import { CommunityPanel, SOCIAL_PLATFORMS } from "./student.jsx";
import { fetchTeamMembers, addTeamMember, updateTeamMember, removeTeamMember, fetchTeamActivity, updateMyTeamProfile, markTourSeen } from "./lib/team.js";

export function ApplicantsTab({ applicants, setApplicants, onRemove, students, setStudents, courses, cohorts, onAccept }) {
  const [openId, setOpenId] = useState(null); const [cohortInput, setCohortInput] = useState(cohorts[0]?.id);
  const [accepting, setAccepting] = useState(null);
  const [acceptError, setAcceptError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const course = (id) => courses.find((c) => c.id === id);
  // Cohorts load asynchronously and can still be empty the instant this
  // tab first mounts -- that initial useState above would otherwise lock
  // cohortInput to undefined forever once cohorts actually arrive, since
  // an initializer only ever runs once. This catches it up the first time
  // a real cohort shows up, without stomping on someone's own selection.
  useEffect(() => { if (!cohortInput && cohorts[0]?.id) setCohortInput(cohorts[0].id); }, [cohorts]);
  async function accept(a) {
    setAccepting(a.id); setAcceptError("");
    const err = await onAccept(a, cohortInput);
    setAccepting(null);
    if (err) setAcceptError(err);
  }
  function decline(a) { setApplicants((prev) => prev.map((x) => x.id === a.id ? { ...x, status: "declined" } : x)); }
  function confirmRemove(id) { onRemove(id); setConfirmDeleteId(null); }
  const pending = applicants.filter((a) => a.status === "pending"); const resolved = applicants.filter((a) => a.status !== "pending");
  return (
    <>
      <SectionHeader eyebrow="REVIEW QUEUE" title="Applicants" />
      {pending.length === 0 && <div className="text-[15px] mb-8" style={{ color: "#A79B84" }}>No pending applications.</div>}
      <div className="flex flex-col gap-4 mb-10">{pending.map((a) => (
        <div key={a.id} className="card rounded-2xl p-6">
          <button className="w-full flex items-center justify-between" onClick={() => setOpenId(openId === a.id ? null : a.id)}><div className="text-left"><div className="text-[17px]" style={{ fontWeight: 700 }}>{a.name} {a.studentRef && <span className="f-code text-[10px] tint-badge px-2 py-0.5 rounded-full ml-1">EXISTING STUDENT</span>}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{a.email} · applying to {course(a.courseId)?.title}{a.createdAt && <> · applied {formatDateTime(a.createdAt)}</>}</div></div><ChevronDown size={18} color="#A79B84" style={{ transform: openId === a.id ? "rotate(180deg)" : "none" }} /></button>
          {openId === a.id && <div className="mt-5 pt-5" style={{ borderTop: "1px solid #F0E7D6" }}>{(course(a.courseId)?.applicationQuestions || []).map((q, i) => <div key={i} className="mb-3"><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>{q.toUpperCase()}</div><div className="text-[14px]">{a.answers[i]}</div></div>)}{!a.studentRef && <div className="mt-4 mb-4" style={{ maxWidth: 220 }}><SelectF label="Cohort" value={cohortInput} onChange={(e) => setCohortInput(e.target.value)} options={cohorts.map((c) => ({ value: c.id, label: c.name }))} /></div>}{accepting !== a.id && acceptError && <div className="text-[13px] mb-3" style={{ color: "#B04A3A" }}>{acceptError}</div>}
          <div className="flex items-center justify-between">
            <div className="flex gap-3"><button disabled={accepting === a.id} onClick={() => accept(a)} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">{accepting === a.id ? "Accepting…" : "Accept & generate code"}</button><button onClick={() => decline(a)} className="btn-ghost rounded-lg px-5 py-2.5 text-[14px]">Decline</button></div>
            {confirmDeleteId === a.id ? (
              <div className="flex items-center gap-2 text-[12px]"><span style={{ color: "#B04A3A" }}>Delete this application?</span><button onClick={() => confirmRemove(a.id)} className="f-label" style={{ color: "#B04A3A", fontWeight: 700 }}>YES, DELETE</button><button onClick={() => setConfirmDeleteId(null)} style={{ color: "#A79B84" }}>Cancel</button></div>
            ) : (
              <button onClick={() => setConfirmDeleteId(a.id)} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#B04A3A" }}><Trash2 size={14} /> Delete</button>
            )}
          </div>
          </div>}
        </div>
      ))}</div>
      {resolved.length > 0 && <><div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>DECIDED</div><div className="flex flex-col gap-2">{resolved.map((a) => (
        <div key={a.id} className="flex items-center justify-between px-5 py-3 rounded-lg text-[14px]" style={{ background: "#F0E7D6" }}>
          <span>{a.name} <span className="text-[12px]" style={{ color: "#A79B84" }}>· {a.email}</span></span>
          <div className="flex items-center gap-4">
            <span className="f-code text-[10px]" style={{ color: a.status === "accepted" ? "var(--accent)" : "#A79B84" }}>{a.status.toUpperCase()}</span>
            {confirmDeleteId === a.id ? (
              <div className="flex items-center gap-2 text-[12px]"><span style={{ color: "#B04A3A" }}>Delete?</span><button onClick={() => confirmRemove(a.id)} className="f-label" style={{ color: "#B04A3A", fontWeight: 700 }}>YES</button><button onClick={() => setConfirmDeleteId(null)} style={{ color: "#A79B84" }}>Cancel</button></div>
            ) : (
              <button onClick={() => setConfirmDeleteId(a.id)}><Trash2 size={14} color="#B04A3A" /></button>
            )}
          </div>
        </div>
      ))}</div></>}
    </>
  );
}

export function CohortsTab({ cohorts, setCohorts, courses, students }) {
  const [showAdd, setShowAdd] = useState(false); const [openId, setOpenId] = useState(null); const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [courseIds, setCourseIds] = useState([]);
  function toggleCourse(id) { setCourseIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function add() { if (!name) return; setCohorts((prev) => [...prev, { id: "co" + Date.now(), name, startDate, endDate, status: "active", courseIds, unlockedCourseIds: [] }]); setName(""); setStartDate(""); setEndDate(""); setCourseIds([]); setShowAdd(false); }
  function remove(id) { setCohorts((prev) => prev.filter((c) => c.id !== id)); }
  function startEdit(co) { setEditingId(co.id); setName(co.name); setStartDate(co.startDate); setEndDate(co.endDate); setCourseIds(co.courseIds); }
  function saveEdit() { setCohorts((prev) => prev.map((c) => c.id !== editingId ? c : { ...c, name, startDate, endDate, courseIds })); setEditingId(null); }
  function toggleUnlock(cohortId, courseId) { setCohorts((prev) => prev.map((c) => { if (c.id !== cohortId) return c; const u = c.unlockedCourseIds || []; return { ...c, unlockedCourseIds: u.includes(courseId) ? u.filter((x) => x !== courseId) : [...u, courseId] }; })); }
  return (
    <>
      <SectionHeader eyebrow="MANAGE" title="Cohorts" action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> New cohort</button>} />
      {showAdd && (
        <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
          <Field label="Cohort name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /><Field label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div><div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>COURSES AVAILABLE IN THIS COHORT</div><div className="flex flex-wrap gap-2">{courses.map((c) => <button key={c.id} onClick={() => toggleCourse(c.id)} className="f-label text-[11px] px-3 py-1.5 rounded-full" style={{ background: courseIds.includes(c.id) ? "var(--accent)" : "#F0E7D6", color: courseIds.includes(c.id) ? "#FAF6EC" : "#71675A" }}>{c.title}</button>)}</div></div>
          <button onClick={add} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] self-start">Create cohort</button>
        </div>
      )}
      <div className="flex flex-col gap-4">{cohorts.map((co) => {
        const members = students.filter((s) => s.cohortId === co.id);
        const isEditing = editingId === co.id;
        return (
          <div key={co.id} className="card rounded-2xl p-6">
            <button className="w-full flex items-center justify-between" onClick={() => setOpenId(openId === co.id ? null : co.id)}>
              <div className="text-left"><div className="f-display text-[19px]" style={{ fontWeight: 700 }}>{co.name}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{members.length} students · {co.courseIds.length} courses · {co.startDate} to {co.endDate}</div></div>
              <div className="flex items-center gap-3"><span className="f-code text-[10px] px-2.5 py-1 rounded-full tint-badge">{co.status.toUpperCase()}</span><ChevronDown size={18} color="#A79B84" style={{ transform: openId === co.id ? "rotate(180deg)" : "none" }} /></div>
            </button>
            {openId === co.id && !isEditing && (
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid #F0E7D6" }}>
                <div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>COURSES — CLICK TO LOCK/UNLOCK LECTURES</div>
                <div className="flex flex-wrap gap-2 mb-6">{co.courseIds.map((cid) => { const unlocked = (co.unlockedCourseIds || []).includes(cid); return <button key={cid} onClick={() => toggleUnlock(co.id, cid)} className="f-label text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: unlocked ? "var(--accent)" : "#F0E7D6", color: unlocked ? "#FAF6EC" : "#71675A" }}>{unlocked ? <Eye size={11} /> : <Lock size={11} />} {courses.find((c) => c.id === cid)?.title}</button>; })}</div>
                <div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>CALL SHEET — MEMBERS</div>
                <div className="flex flex-col gap-2 mb-4">{members.map((s) => <div key={s.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[13px]" style={{ background: "#FAF6EC" }}><span style={{ fontWeight: 600 }}>{s.name}</span><span className="f-code text-[11px]" style={{ color: "#71675A" }}>{s.enrollments.length} enrollment{s.enrollments.length !== 1 ? "s" : ""}</span></div>)}{members.length === 0 && <div className="text-[13px]" style={{ color: "#A79B84" }}>No members yet.</div>}</div>
                <div className="flex items-center gap-4"><button onClick={() => startEdit(co)} className="text-[12px] accent-text flex items-center gap-1.5" style={{ fontWeight: 700 }}><Pencil size={12} /> Edit cohort</button><button onClick={() => remove(co.id)} className="text-[12px]" style={{ color: "#B04A3A" }}>Delete cohort</button></div>
              </div>
            )}
            {isEditing && (
              <div className="mt-6 pt-6 flex flex-col gap-3" style={{ borderTop: "1px solid #F0E7D6" }}>
                <Field label="Cohort name" value={name} onChange={(e) => setName(e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /><Field label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                <div><div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>COURSES AVAILABLE IN THIS COHORT</div><div className="flex flex-wrap gap-2">{courses.map((c) => <button key={c.id} onClick={() => toggleCourse(c.id)} className="f-label text-[11px] px-3 py-1.5 rounded-full" style={{ background: courseIds.includes(c.id) ? "var(--accent)" : "#F0E7D6", color: courseIds.includes(c.id) ? "#FAF6EC" : "#71675A" }}>{c.title}</button>)}</div></div>
                <div className="flex items-center gap-3"><button onClick={saveEdit} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">Save changes</button><button onClick={() => setEditingId(null)} className="text-[13px]" style={{ color: "#A79B84" }}>Cancel</button></div>
              </div>
            )}
          </div>
        );
      })}</div>
    </>
  );
}

// Shared meeting add/edit/remove UI, used both inside a module's editor and the cross-course admin Virtual Meetings tab.
function MeetingsEditor({ meetings, setMeetings }) {
  function addMeeting() { setMeetings((m) => [...m, { id: "mt" + Date.now(), label: `Class ${m.length + 1}`, date: "", link: "", recordingLink: "", recordingFile: null }]); }
  function updateMeeting(i, field, value) { setMeetings((m) => m.map((item, idx) => idx !== i ? item : { ...item, [field]: value })); }
  function updateMeetingDatePart(i, part, value) {
    setMeetings((m) => m.map((item, idx) => {
      if (idx !== i) return item;
      const [d, t] = (item.date || "").split("T");
      const next = part === "date" ? [value, t || ""] : [d || "", value];
      return { ...item, date: next[0] || next[1] ? `${next[0]}T${next[1]}` : "" };
    }));
  }
  function removeMeeting(i) { setMeetings((m) => m.filter((_, idx) => idx !== i)); }
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="f-label text-[11px]" style={{ color: "#71675A" }}>VIRTUAL MEETINGS</div>
        <button onClick={addMeeting} className="text-[13px] accent-text flex items-center gap-1.5" style={{ fontWeight: 700 }}><Plus size={14} /> Add meeting</button>
      </div>
      {meetings.length === 0 && <div className="text-[13px]" style={{ color: "#A79B84" }}>No classes scheduled for this module yet.</div>}
      {meetings.map((mt, i) => (
        <div key={mt.id} className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_0.85fr_0.75fr_1.5fr_auto] gap-3 items-end">
            <Field label="Label" value={mt.label} onChange={(e) => updateMeeting(i, "label", e.target.value)} placeholder="e.g. Tuesday class" />
            <Field label="Date" type="date" value={mt.date ? mt.date.split("T")[0] : ""} onChange={(e) => updateMeetingDatePart(i, "date", e.target.value)} />
            <Field label="Time" type="time" value={mt.date && mt.date.includes("T") ? mt.date.split("T")[1] : ""} onChange={(e) => updateMeetingDatePart(i, "time", e.target.value)} />
            <Field label="Meeting link" value={mt.link} onChange={(e) => updateMeeting(i, "link", e.target.value)} placeholder="https://…" />
            <button onClick={() => removeMeeting(i)} className="mb-2.5"><Trash2 size={16} color="#B04A3A" /></button>
          </div>
          <div className="pt-3" style={{ borderTop: "1px dashed #E7DEC9" }}>
            <div className="f-label text-[10px] mb-2" style={{ color: "#A79B84" }}>VIRTUAL RECORDING (after class, if there is one)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <Field label="Recording link" value={mt.recordingLink || ""} onChange={(e) => updateMeeting(i, "recordingLink", e.target.value)} placeholder="https://…" />
              <FileField label="Or upload a document (minutes, transcript)" value={mt.recordingFile || null} onChange={(v) => updateMeeting(i, "recordingFile", v)} accept=".pdf,.doc,.docx,.txt" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export function ModuleEditor({ course, module, setCourses, onBack }) {
  const [title, setTitle] = useState(module.title); const [brief, setBrief] = useState(module.brief || "");
  const [notes, setNotes] = useState(module.notes || ""); const [videoUrl, setVideoUrl] = useState(module.videoUrl || ""); const [slideUrl, setSlideUrl] = useState(module.slideUrl || "");
  const [slideFile, setSlideFile] = useState(module.slideFile || null);
  const [slideDescription, setSlideDescription] = useState(module.slideDescription || "");
  const [summary, setSummary] = useState(module.summary || "");
  const [testType, setTestType] = useState(module.testType); const [passPct, setPassPct] = useState(module.passPct || 70);
  const [proofType, setProofType] = useState(module.proofType || "text"); const [markingGuide, setMarkingGuide] = useState(module.markingGuide || "");
  const [autoGradeOnly, setAutoGradeOnly] = useState(module.autoGradeOnly || false);
  const [linkType, setLinkType] = useState(module.linkType || "other");
  const [questionPrompt, setQuestionPrompt] = useState(module.questionPrompt || "");
  const [quiz, setQuiz] = useState(module.quiz || []);
  const [meetings, setMeetings] = useState(module.meetings || []);
  // A separate step from the lecture notes and from the Resources/Library
  // tab on purpose -- Fidelia doesn't want videos mixed into the library,
  // and wants every module able to carry its own required watch-list,
  // shown between Summary and Quick Check.
  const [videoIntro, setVideoIntro] = useState(module.videoIntro || "");
  const [videos, setVideos] = useState(module.videos || []);
  // Separate from the single slide deck above -- any number of extra
  // downloads for this module (a template, a checklist, a cheat sheet),
  // each with its own title so students see something meaningful instead
  // of a raw filename, same request she made for task files.
  const [resourceFiles, setResourceFiles] = useState(module.resourceFiles || []);
  function addResourceFile() { setResourceFiles((r) => [...r, { id: "rf" + Date.now(), label: "", file: null }]); }
  function updateResourceFile(i, patch) { setResourceFiles((r) => r.map((item, idx) => idx === i ? { ...item, ...patch } : item)); }
  function removeResourceFile(i) { setResourceFiles((r) => r.filter((_, idx) => idx !== i)); }
  function addQuestion() { setQuiz((q) => [...q, { q: "", options: ["", "", ""], correct: 0 }]); }
  function updateQ(i, field, value) { setQuiz((q) => q.map((item, idx) => idx !== i ? item : { ...item, [field]: value })); }
  function updateOpt(qi, oi, value) { setQuiz((q) => q.map((item, idx) => idx !== qi ? item : { ...item, options: item.options.map((o, oidx) => oidx === oi ? value : o) })); }
  function removeQ(i) { setQuiz((q) => q.filter((_, idx) => idx !== i)); }
  function addVideo() { setVideos((v) => [...v, { id: "v" + Date.now(), label: "", url: "", file: null }]); }
  function updateVideo(i, patch) { setVideos((v) => v.map((item, idx) => idx === i ? { ...item, ...patch } : item)); }
  function removeVideo(i) { setVideos((v) => v.filter((_, idx) => idx !== i)); }
  function save() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, modules: c.modules.map((m) => m.id !== module.id ? m : { ...m, title, brief, notes, summary, videoUrl, slideUrl, slideFile, slideDescription, testType, passPct: Number(passPct), proofType, linkType, markingGuide, questionPrompt, quiz, meetings, videoIntro, videos, resourceFiles: resourceFiles.filter((r) => r.file), autoGradeOnly }) })); onBack(); }
  const [confirmDelete, setConfirmDelete] = useState(false);
  function deleteModuleNow() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, modules: c.modules.filter((m) => m.id !== module.id) })); onBack(); }
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px]" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to {course.title}</button>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-[12px]"><span style={{ color: "#B04A3A" }}>Delete this module? Student progress on it is lost.</span><button onClick={deleteModuleNow} className="f-label" style={{ color: "#B04A3A", fontWeight: 700 }}>YES, DELETE</button><button onClick={() => setConfirmDelete(false)} style={{ color: "#A79B84" }}>Cancel</button></div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700, color: "#B04A3A" }}><Trash2 size={13} /> Delete module</button>
        )}
      </div>
      <div className="card rounded-2xl p-7 flex flex-col gap-4 mb-6">
        <div className="f-label text-[11px]" style={{ color: "#71675A" }}>LECTURE CONTENT</div>
        <Field label="Module title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Short brief (shown in course path)</div><RichTextEditor value={brief} onChange={setBrief} minRows={2} /></div>
        <div><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Lecture notes</div><RichTextEditor value={notes} onChange={setNotes} minRows={12} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Video link (max ~50MB if uploading elsewhere)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" /><Field label="Slide deck link (optional if uploading a file below)" value={slideUrl} onChange={(e) => setSlideUrl(e.target.value)} placeholder="https://…" /></div>
        <FileField label="Or upload a slide deck file (PDF, PPT, etc.)" value={slideFile} onChange={setSlideFile} accept=".pdf,.ppt,.pptx,.key" />
        {(slideUrl || slideFile) && <TextArea label="Description shown to students on the slide-deck step (optional)" value={slideDescription} onChange={(e) => setSlideDescription(e.target.value)} rows={2} placeholder="e.g. Slides from this week's session — the checklist and examples we reviewed together." />}
        <div className="f-label text-[11px] mt-2" style={{ color: "#71675A" }}>ADDITIONAL RESOURCES (OPTIONAL)</div>
        <div className="text-[13px]" style={{ color: "#71675A" }}>Any other downloads for this module — a template, a checklist, a cheat sheet — shown alongside the slide deck. As many as you like, each with its own title.</div>
        <div className="flex flex-col gap-3">
          {resourceFiles.map((r, i) => (
            <div key={r.id} className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
              <div className="flex items-center justify-between"><div className="f-label text-[11px]" style={{ color: "#71675A" }}>RESOURCE {i + 1}</div><button onClick={() => removeResourceFile(i)}><Trash2 size={14} color="#B04A3A" /></button></div>
              <Field label="Title (shown to students instead of the filename)" value={r.label} onChange={(e) => updateResourceFile(i, { label: e.target.value })} placeholder="e.g. Client Onboarding Checklist" />
              <FileField label="File" value={r.file} onChange={(file) => updateResourceFile(i, { file })} />
            </div>
          ))}
          <button onClick={addResourceFile} className="text-[13px] accent-text flex items-center gap-1.5 self-start" style={{ fontWeight: 700 }}><Plus size={14} /> Add a resource</button>
        </div>
      </div>

      <div className="card rounded-2xl p-7 flex flex-col gap-4 mb-6">
        <div className="f-label text-[11px]" style={{ color: "#71675A" }}>SUMMARY</div>
        <div className="text-[13px]" style={{ color: "#71675A" }}>Shown right after the lecture notes, before the quick check — a good spot for key takeaways or a recap.</div>
        <RichTextEditor value={summary} onChange={setSummary} minRows={6} />
      </div>

      <div className="card rounded-2xl p-7 flex flex-col gap-4 mb-6">
        <div className="f-label text-[11px]" style={{ color: "#71675A" }}>VIDEO RESOURCE</div>
        <div className="text-[13px]" style={{ color: "#71675A" }}>Shown after the summary, before the quick check. Separate from your Resource Library — just for this module. Leave empty to skip this step entirely.</div>
        <div><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Instructions</div><RichTextEditor value={videoIntro} onChange={setVideoIntro} minRows={4} /></div>
        <div className="flex flex-col gap-3">
          {videos.map((v, i) => (
            <div key={v.id} className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
              <div className="flex items-center justify-between"><div className="f-label text-[11px]" style={{ color: "#71675A" }}>VIDEO {i + 1}</div><button onClick={() => removeVideo(i)}><Trash2 size={14} color="#B04A3A" /></button></div>
              <Field label="Label (optional)" value={v.label} onChange={(e) => updateVideo(i, { label: e.target.value })} placeholder="e.g. How to set up your calendar" />
              <Field label="Video link (YouTube, Loom, etc. — optional if uploading a file below)" value={v.url} onChange={(e) => updateVideo(i, { url: e.target.value })} placeholder="https://…" />
              <FileField label="Or upload a video file" value={v.file} onChange={(file) => updateVideo(i, { file })} accept="video/*" />
            </div>
          ))}
          <button onClick={addVideo} className="text-[13px] accent-text flex items-center gap-1.5 self-start" style={{ fontWeight: 700 }}><Plus size={14} /> Add a video</button>
        </div>
      </div>

      <div className="card rounded-2xl p-7 flex flex-col gap-4 mb-6">
        <div className="f-label text-[11px]" style={{ color: "#71675A" }}>QUICK CHECK</div>
        <SelectF label="Check type" value={testType} onChange={(e) => setTestType(e.target.value)} options={[{ value: "multiple-choice", label: "Multiple choice (auto-graded)" }, { value: "written", label: "Short written answer (you review)" }, { value: "file-upload", label: "File / assignment upload (you review)" }, { value: "checklist", label: "Self-check (no review needed)" }, { value: "milestone", label: "Milestone project (bigger checkpoint, you review)" }]} />
        {testType === "multiple-choice" && (
          <div>
            <Field label="Pass score to unlock next (%)" type="number" value={passPct} onChange={(e) => setPassPct(e.target.value)} />
            <div className="mt-4 flex flex-col gap-4">{quiz.map((q, qi) => <div key={qi} className="rounded-xl p-4" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}><div className="flex items-center justify-between mb-2"><div className="f-label text-[11px]" style={{ color: "#71675A" }}>QUESTION {qi + 1}</div><button onClick={() => removeQ(qi)}><Trash2 size={14} color="#B04A3A" /></button></div><Field label="Question" value={q.q} onChange={(e) => updateQ(qi, "q", e.target.value)} /><div className="mt-3 flex flex-col gap-2">{q.options.map((o, oi) => <div key={oi} className="flex items-center gap-2"><input type="radio" checked={q.correct === oi} onChange={() => updateQ(qi, "correct", oi)} /><input className="input-field rounded-lg px-3 py-2 text-[13px]" placeholder={`Option ${oi + 1}`} value={o} onChange={(e) => updateOpt(qi, oi, e.target.value)} /></div>)}</div></div>)}<button onClick={addQuestion} className="text-[13px] accent-text flex items-center gap-1.5 self-start" style={{ fontWeight: 700 }}><Plus size={14} /> Add question</button></div>
          </div>
        )}
        {(testType === "written" || testType === "file-upload" || testType === "milestone") && (
          <>
            {(testType === "file-upload" || testType === "milestone") && <SelectF label="Required proof type" value={proofType} onChange={(e) => setProofType(e.target.value)} options={[{ value: "document", label: "Document upload" }, { value: "link", label: "Link" }, { value: "image", label: "Image / screenshot link" }]} />}
            {(testType === "file-upload" || testType === "milestone") && proofType === "link" && <SelectF label="What kind of link is this?" value={linkType} onChange={(e) => setLinkType(e.target.value)} options={LINK_TYPES.map((t) => ({ value: t.key, label: t.label }))} />}
            <div><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>{testType === "written" ? "The question students will answer" : testType === "milestone" ? "Milestone project brief (what they need to build and submit)" : "What students need to submit"}</div><RichTextEditor value={questionPrompt} onChange={setQuestionPrompt} minRows={5} /></div>
            {proofType !== "link" && <TextArea label="Marking guide — list the key points a good submission should cover, one per idea (used both for your review and for auto-checking matches)" value={markingGuide} onChange={(e) => setMarkingGuide(e.target.value)} rows={6} />}
            {proofType !== "link" && (
              <div className="rounded-lg px-4 py-3 flex flex-col gap-3" style={{ background: "#FAF6EC" }}>
                <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}>
                  <input type="checkbox" checked={autoGradeOnly} onChange={(e) => setAutoGradeOnly(e.target.checked)} />
                  Auto-grade using the marking guide — never needs my review
                </label>
                {autoGradeOnly ? (
                  <>
                    <div className="text-[12px]" style={{ color: "#71675A" }}>The system scores each answer against your marking guide above (0–100%) and unlocks the next module on its own once a student clears the pass score below. Below that score, they just see what they scored and can revise their answer and try again — it never comes to you.</div>
                    <Field label="Pass score to unlock next (%)" type="number" value={passPct} onChange={(e) => setPassPct(e.target.value)} />
                  </>
                ) : (
                  <div className="text-[12px]" style={{ color: "#71675A" }}>A strong match ({AUTO_APPROVE_THRESHOLD}%+) still unlocks the next module right away — anything under that comes to you for review, same as now.</div>
                )}
              </div>
            )}
            {proofType === "link" && (testType === "file-upload" || testType === "milestone") && <div className="text-[13px] rounded-lg px-4 py-3" style={{ background: "#FAF6EC", color: "#71675A" }}>No marking guide for a link — the system already checks it's the right kind of link ({LINK_TYPES.find((t) => t.key === linkType)?.label}). Every submission goes to you for review.</div>}
          </>
        )}
      </div>

      <div className="card rounded-2xl p-7 flex flex-col gap-4 mb-6">
        <MeetingsEditor meetings={meetings} setMeetings={setMeetings} />
      </div>

      <button onClick={save} className="btn-primary rounded-lg px-6 py-3 text-[14px] self-start">Save module</button>
    </div>
  );
}
export function CourseManager({ course, testimonials, setCourses, onBack }) {
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [openModuleId, setOpenModuleId] = useState(null);
  const [addingModule, setAddingModule] = useState(false); const [newModTitle, setNewModTitle] = useState("");
  const [confirmDeleteModId, setConfirmDeleteModId] = useState(null);
  const [title, setTitle] = useState(course.title); const [tagline, setTagline] = useState(course.tagline || ""); const [audience, setAudience] = useState(course.audience); const [description, setDescription] = useState(course.description); const [durationWeeks, setDurationWeeks] = useState(course.durationWeeks); const [level, setLevel] = useState(course.level); const [image, setImage] = useState(course.image);
  const [questions, setQuestions] = useState(course.applicationQuestions || []); const [newQ, setNewQ] = useState("");
  const [outcomes, setOutcomes] = useState(course.outcomes || []); const [newOutcome, setNewOutcome] = useState("");
  const [testimonialIds, setTestimonialIds] = useState(course.testimonialIds || []);
  function saveDetails() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, title, tagline, audience, description, durationWeeks: Number(durationWeeks), level, image, testimonialIds, outcomes })); setEditingDetails(false); }
  function saveQuestions() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, applicationQuestions: questions })); setEditingQuestions(false); }
  function addModule() { if (!newModTitle) return; setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, modules: [...c.modules, { id: Date.now(), title: newModTitle, brief: "", notes: "", videoUrl: "", slideUrl: "", testType: "checklist" }] })); setNewModTitle(""); setAddingModule(false); }
  function moveModule(index, dir) {
    setCourses((prev) => prev.map((c) => {
      if (c.id !== course.id) return c;
      const modules = [...c.modules];
      const target = index + dir;
      if (target < 0 || target >= modules.length) return c;
      [modules[index], modules[target]] = [modules[target], modules[index]];
      return { ...c, modules };
    }));
  }
  function togglePublish() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, status: c.status === "live" ? "draft" : "live" })); }
  function deleteModule(id) { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, modules: c.modules.filter((m) => m.id !== id) })); setConfirmDeleteModId(null); }
  function deleteCourseNow() { setCourses((prev) => prev.filter((c) => c.id !== course.id)); onBack(); }
  function toggleTestimonial(id) { setTestimonialIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  const openModule = openModuleId ? course.modules.find((m) => m.id === openModuleId) : null;
  if (openModule) return <ModuleEditor course={course} module={openModule} setCourses={setCourses} onBack={() => setOpenModuleId(null)} />;
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to courses</button>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div className="f-label text-[12px] mb-2 accent-text">COURSE MANAGER</div><h1 className="f-display text-[30px]" style={{ fontWeight: 800 }}>{course.title}</h1></div>
        <div className="flex items-center gap-2">
          <button onClick={togglePublish} className="f-label text-[11px] px-4 py-2 rounded-full tint-badge">{course.status === "live" ? "PUBLISHED" : "UNPUBLISHED"}</button>
          {confirmingDelete ? (
            <div className="flex items-center gap-2 text-[12px]"><span style={{ color: "#B04A3A" }}>Delete this course?</span><button onClick={deleteCourseNow} className="f-label" style={{ color: "#B04A3A", fontWeight: 700 }}>YES, DELETE</button><button onClick={() => setConfirmingDelete(false)} style={{ color: "#A79B84" }}>Cancel</button></div>
          ) : (
            <button onClick={() => setConfirmingDelete(true)} title="Delete this course" className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700, color: "#B04A3A" }}><Trash2 size={13} /> Delete course</button>
          )}
          <button onClick={() => setEditingDetails((s) => !s)} className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Pencil size={13} /> Edit details</button><button onClick={() => setEditingQuestions((s) => !s)} className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Pencil size={13} /> Application questions</button>
        </div>
      </div>
      {editingDetails && (
        <div className="card rounded-2xl p-7 mb-8 flex flex-col gap-4">
          <ImgField label="Course image" value={image} onChange={setImage} />
          <Field label="Course title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Field label="Tagline (short)" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <Field label="Who it's for" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <TextArea label="Full description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><SelectF label="Level" value={level} onChange={(e) => setLevel(e.target.value)} options={[{ value: "Beginner", label: "Beginner" }, { value: "Intermediate", label: "Intermediate" }, { value: "Advanced", label: "Advanced" }]} /><Field label="Duration (weeks)" type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} /></div>
          <div>
            <div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>WHAT YOU'LL LEARN (shown as bullet points on the course page)</div>
            <div className="flex flex-col gap-2">{outcomes.map((o, i) => <div key={i} className="flex items-center gap-2"><input className="input-field rounded-lg px-3.5 py-2 text-[14px]" value={o} onChange={(e) => setOutcomes((prev) => prev.map((x, idx) => idx === i ? e.target.value : x))} /><button onClick={() => setOutcomes((prev) => prev.filter((_, idx) => idx !== i))}><X size={16} color="#A79B84" /></button></div>)}</div>
            <div className="flex items-center gap-2 mt-2"><input className="input-field rounded-lg px-3.5 py-2 text-[14px]" placeholder="New bullet point…" value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newOutcome) { setOutcomes((prev) => [...prev, newOutcome]); setNewOutcome(""); } }} /><button onClick={() => { if (newOutcome) { setOutcomes((prev) => [...prev, newOutcome]); setNewOutcome(""); } }} className="btn-soft rounded-lg px-4 py-2 text-[13px] shrink-0">Add</button></div>
          </div>
          <div><div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>ASSOCIATED TESTIMONIALS</div><div className="flex flex-wrap gap-2">{testimonials.map((t) => <button key={t.id} onClick={() => toggleTestimonial(t.id)} className="f-label text-[11px] px-3 py-1.5 rounded-full" style={{ background: testimonialIds.includes(t.id) ? "var(--accent)" : "#F0E7D6", color: testimonialIds.includes(t.id) ? "#FAF6EC" : "#71675A" }}>{t.name}</button>)}</div></div>
          <button onClick={saveDetails} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] self-start">Save details</button>
        </div>
      )}
      {editingQuestions && (
        <div className="card rounded-2xl p-7 mb-8 flex flex-col gap-3">
          <div className="f-label text-[11px]" style={{ color: "#71675A" }}>APPLICATION QUESTIONS FOR THIS COURSE</div>
          {questions.map((q, i) => <div key={i} className="flex items-center gap-2"><input className="input-field rounded-lg px-3.5 py-2 text-[14px]" value={q} onChange={(e) => setQuestions((prev) => prev.map((x, idx) => idx === i ? e.target.value : x))} /><button onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}><X size={16} color="#A79B84" /></button></div>)}
          <div className="flex items-center gap-2"><input className="input-field rounded-lg px-3.5 py-2 text-[14px]" placeholder="New question…" value={newQ} onChange={(e) => setNewQ(e.target.value)} /><button onClick={() => { if (newQ) { setQuestions((prev) => [...prev, newQ]); setNewQ(""); } }} className="btn-soft rounded-lg px-4 py-2 text-[13px] shrink-0">Add</button></div>
          <button onClick={saveQuestions} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] self-start mt-2">Save questions</button>
        </div>
      )}
      <div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>MODULES</div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">{course.modules.map((m, i) => (
        <div key={m.id} className="card card-pop rounded-2xl p-5 text-left book-tab relative">
          <div className="flex items-center gap-1 absolute top-3 right-3">
            <button onClick={(e) => { e.stopPropagation(); moveModule(i, -1); }} disabled={i === 0} className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "#F0E7D6", opacity: i === 0 ? 0.4 : 1 }}><ChevronRight size={12} color="#71675A" style={{ transform: "rotate(-90deg)" }} /></button>
            <button onClick={(e) => { e.stopPropagation(); moveModule(i, 1); }} disabled={i === course.modules.length - 1} className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "#F0E7D6", opacity: i === course.modules.length - 1 ? 0.4 : 1 }}><ChevronRight size={12} color="#71675A" style={{ transform: "rotate(90deg)" }} /></button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteModId(m.id); }} title="Delete this module" className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "#F0E7D6" }}><Trash2 size={12} color="#B04A3A" /></button>
          </div>
          {confirmDeleteModId === m.id ? (
            <div className="pr-14">
              <div className="f-code text-[11px] mb-1 accent-text">{m.testType === "milestone" ? "MILESTONE" : "MODULE"} {String(i + 1).padStart(2, "0")}</div>
              <div className="text-[16px] mb-3" style={{ fontWeight: 700 }}>{m.title}</div>
              <div className="text-[13px] mb-3" style={{ color: "#B04A3A" }}>Delete this module? Students' progress on it and any submissions will be lost.</div>
              <div className="flex items-center gap-3 text-[13px]"><button onClick={(e) => { e.stopPropagation(); deleteModule(m.id); }} style={{ color: "#B04A3A", fontWeight: 700 }}>YES, DELETE</button><button onClick={(e) => { e.stopPropagation(); setConfirmDeleteModId(null); }} style={{ color: "#A79B84" }}>Cancel</button></div>
            </div>
          ) : (
            <button onClick={() => setOpenModuleId(m.id)} className="text-left w-full">
              <div className="f-code text-[11px] mb-1 accent-text">{m.testType === "milestone" ? "MILESTONE" : "MODULE"} {String(i + 1).padStart(2, "0")}</div>
              <div className="text-[16px] mb-1 pr-16" style={{ fontWeight: 700 }}>{m.title}</div>
              {m.brief ? <RichText html={m.brief} className="rich-content text-[13px] mb-3 line-clamp-3" style={{ color: "#71675A" }} /> : <div className="text-[13px] mb-3" style={{ color: "#71675A" }}>No brief yet.</div>}
              <div className="flex items-center gap-1.5 text-[12px] accent-text" style={{ fontWeight: 700 }}><Pencil size={12} /> Edit module</div>
            </button>
          )}
        </div>
      ))}</div>
      {addingModule ? <div className="flex items-center gap-3"><input className="input-field rounded-lg px-3.5 py-2" placeholder="New module title" value={newModTitle} onChange={(e) => setNewModTitle(e.target.value)} /><button onClick={addModule} className="btn-primary rounded-lg px-4 py-2 text-[13px] shrink-0">Add</button><button onClick={() => setAddingModule(false)}><X size={16} color="#A79B84" /></button></div> : <button onClick={() => setAddingModule(true)} className="btn-soft rounded-full px-5 py-2.5 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Plus size={15} /> Add module</button>}
    </div>
  );
}
export function AddCourseForm({ onAdd, onClose }) {
  const [title, setTitle] = useState(""); const [tagline, setTagline] = useState(""); const [audience, setAudience] = useState(""); const [description, setDescription] = useState(""); const [durationWeeks, setDurationWeeks] = useState(4); const [level, setLevel] = useState("Beginner"); const [image, setImage] = useState(null);
  return (
    <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
      <ImgField label="Course image" value={image} onChange={setImage} />
      <Field label="Course title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Field label="Tagline (short)" value={tagline} onChange={(e) => setTagline(e.target.value)} />
      <Field label="Who it's for" value={audience} onChange={(e) => setAudience(e.target.value)} />
      <TextArea label="Full description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><SelectF label="Level" value={level} onChange={(e) => setLevel(e.target.value)} options={[{ value: "Beginner", label: "Beginner" }, { value: "Intermediate", label: "Intermediate" }, { value: "Advanced", label: "Advanced" }]} /><Field label="Duration (weeks)" type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} /></div>
      <div className="flex gap-3 mt-1"><button onClick={() => { if (title) { onAdd({ title, tagline, audience, description, durationWeeks: Number(durationWeeks), level, image, outcomes: [], applicationQuestions: ["Tell us why you want to join this course."], testimonialIds: [] }); onClose(); } }} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">Create course</button><button onClick={onClose} className="text-[14px]" style={{ color: "#A79B84" }}>Cancel</button></div>
    </div>
  );
}
// "Other" is a sentinel moduleId (never a real one -- module ids are
// Date.now() numbers) meaning "not tied to any module": the meeting lives
// on the course itself (course.generalMeetings), not inside a module, and
// carries its own assignedStudentIds instead of being visible to everyone
// enrolled in the course.
function flattenMeetings(courses) {
  const list = [];
  for (const c of courses) {
    for (const m of c.modules) for (const mt of (m.meetings || [])) list.push({ ...mt, courseId: c.id, moduleId: m.id });
    for (const mt of (c.generalMeetings || [])) list.push({ ...mt, courseId: c.id, moduleId: "other" });
  }
  return list;
}
export function AdminMeetingsTab({ courses, setCourses, cohorts, students }) {
  const coursesWithModules = courses.filter((c) => c.modules.length > 0);
  const [cohortId, setCohortId] = useState("all");
  const [courseFilterId, setCourseFilterId] = useState("all");
  const activeCohort = cohortId === "all" ? null : cohorts.find((c) => c.id === cohortId);
  const filterCourses = activeCohort ? coursesWithModules.filter((c) => activeCohort.courseIds.includes(c.id)) : coursesWithModules;

  // One flat, editable list of every meeting across every course/module — no cohort/course/module
  // selection required just to see or add one. The filters below only narrow the view.
  const [draft, setDraft] = useState(() => flattenMeetings(courses));
  // Courses load asynchronously -- if this tab is opened before that fetch
  // resolves, the useState initializer above locks draft to empty forever
  // (it only ever runs once), and every meeting that arrives afterward
  // stays invisible even though it's really there. This catches it up the
  // first time real data shows up, without touching draft once it's
  // actually holding something (never overwrites an in-progress edit).
  useEffect(() => {
    if (draft.length > 0) return;
    const list = flattenMeetings(courses);
    if (list.length > 0) setDraft(list);
  }, [courses]);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function updateMeeting(id, field, value) { setDraft((d) => d.map((mt) => mt.id !== id ? mt : { ...mt, [field]: value })); }
  function updateMeetingCourse(id, newCourseId) {
    const course = courses.find((c) => c.id === newCourseId);
    setDraft((d) => d.map((mt) => mt.id !== id ? mt : { ...mt, courseId: newCourseId, moduleId: course?.modules[0]?.id }));
  }
  function updateMeetingDatePart(id, part, value) {
    setDraft((d) => d.map((mt) => {
      if (mt.id !== id) return mt;
      const [dd, tt] = (mt.date || "").split("T");
      const next = part === "date" ? [value, tt || ""] : [dd || "", value];
      return { ...mt, date: next[0] || next[1] ? `${next[0]}T${next[1]}` : "" };
    }));
  }
  function addMeeting() {
    const defaultCourse = (courseFilterId !== "all" ? courses.find((c) => c.id === courseFilterId) : filterCourses[0]) || coursesWithModules[0];
    if (!defaultCourse) return;
    setDraft((d) => [...d, { id: "mt" + Date.now(), label: `Class ${d.length + 1}`, date: "", link: "", recordingLink: "", recordingFile: null, assignedStudentIds: [], createdAt: Date.now(), courseId: defaultCourse.id, moduleId: defaultCourse.modules[0]?.id }]);
  }
  // Delete is immediate — it drops the meeting from wherever it currently lives, no separate save needed.
  // Only the course that actually contains this meeting gets a new object
  // reference here -- every other course is returned completely unchanged
  // (same reference). setCourses (syncCourses in App.jsx) decides what to
  // save by comparing references, so returning a "new" object for every
  // course in the roster -- even ones nothing happened to -- fired a
  // needless save for every single one of them alongside the real one.
  // With enough courses, that's a burst of simultaneous requests instead
  // of one, and if any of the unrelated ones failed or got rate-limited,
  // the real deletion could look like it silently didn't save, even
  // though it went out fine.
  function removeMeeting(id) {
    setDraft((d) => d.filter((mt) => mt.id !== id));
    setCourses((prev) => prev.map((c) => {
      const hasItModule = c.modules.some((m) => (m.meetings || []).some((x) => x.id === id));
      const hasItGeneral = (c.generalMeetings || []).some((x) => x.id === id);
      if (!hasItModule && !hasItGeneral) return c;
      return {
        ...c,
        modules: c.modules.map((m) => (m.meetings || []).some((x) => x.id === id) ? { ...m, meetings: m.meetings.filter((x) => x.id !== id) } : m),
        generalMeetings: (c.generalMeetings || []).filter((x) => x.id !== id),
      };
    }));
  }
  // Saving one row removes it from wherever it's currently stored and (re)inserts it at its
  // chosen course/module — this is what lets a row's own module picker move it on save.
  // "other" is the sentinel for "not tied to a module" -- that destination
  // is course.generalMeetings instead of any module's own meetings array.
  // Same "only touch what actually changed" fix as removeMeeting above.
  function saveMeeting(id) {
    const mt = draft.find((x) => x.id === id);
    if (!mt) return;
    const { courseId, moduleId, ...meetingFields } = mt;
    const isGeneral = moduleId === "other";
    setCourses((prev) => prev.map((c) => {
      const hadItModule = c.modules.some((m) => (m.meetings || []).some((x) => x.id === id));
      const hadItGeneral = (c.generalMeetings || []).some((x) => x.id === id);
      const isDestination = c.id === courseId;
      if (!hadItModule && !hadItGeneral && !isDestination) return c;
      return {
        ...c,
        modules: c.modules.map((m) => {
          const withoutThis = (m.meetings || []).filter((x) => x.id !== id);
          if (isDestination && !isGeneral && m.id === moduleId) return { ...m, meetings: [...withoutThis, meetingFields] };
          return withoutThis.length === (m.meetings || []).length ? m : { ...m, meetings: withoutThis };
        }),
        generalMeetings: isDestination && isGeneral ? [...(c.generalMeetings || []).filter((x) => x.id !== id), meetingFields] : (c.generalMeetings || []).filter((x) => x.id !== id),
      };
    }));
    setSavedIds((s) => new Set(s).add(id));
    setTimeout(() => setSavedIds((s) => { const n = new Set(s); n.delete(id); return n; }), 2000);
  }

  const visible = draft.filter((mt) => {
    if (cohortId !== "all" && !filterCourses.some((c) => c.id === mt.courseId)) return false;
    if (courseFilterId !== "all" && mt.courseId !== courseFilterId) return false;
    return true;
  });

  return (
    <>
      <SectionHeader eyebrow="MANAGE" title="Virtual Meetings" action={<button onClick={addMeeting} disabled={coursesWithModules.length === 0} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> Add meeting</button>} />
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="f-label text-[11px]" style={{ color: "#A79B84" }}>FILTER</span>
        <SelectF value={cohortId} onChange={(e) => { setCohortId(e.target.value); setCourseFilterId("all"); }} options={[{ value: "all", label: "All cohorts" }, ...cohorts.map((c) => ({ value: c.id, label: c.name }))]} />
        <SelectF value={courseFilterId} onChange={(e) => setCourseFilterId(e.target.value)} options={[{ value: "all", label: "All courses" }, ...filterCourses.map((c) => ({ value: c.id, label: c.title }))]} />
      </div>
      {coursesWithModules.length === 0 && <div className="card rounded-2xl p-8 text-center text-[14px]" style={{ color: "#A79B84" }}>Add a course with at least one module before scheduling meetings.</div>}
      {coursesWithModules.length > 0 && visible.length === 0 && <div className="card rounded-2xl p-8 text-center text-[14px]" style={{ color: "#A79B84" }}>No virtual meetings match this filter yet — click "Add meeting" to schedule one.</div>}
      <div className="flex flex-col gap-4">
        {visible.map((mt) => {
          const course = courses.find((c) => c.id === mt.courseId);
          return (
            <div key={mt.id} className="card rounded-2xl p-5 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectF label="Course" value={mt.courseId} onChange={(e) => updateMeetingCourse(mt.id, e.target.value)} options={coursesWithModules.map((c) => ({ value: c.id, label: c.title }))} />
                <SelectF label="Which module is this?" value={mt.moduleId} onChange={(e) => updateMeeting(mt.id, "moduleId", e.target.value === "other" ? "other" : Number(e.target.value))} options={[...(course?.modules || []).map((m, i) => ({ value: m.id, label: `Module ${i + 1} — ${m.title}` })), { value: "other", label: "Other — not part of a module" }]} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_0.85fr_0.75fr_1.5fr_auto] gap-3 items-end">
                <Field label={mt.moduleId === "other" ? "Meeting title" : "Label"} value={mt.label} onChange={(e) => updateMeeting(mt.id, "label", e.target.value)} placeholder={mt.moduleId === "other" ? "e.g. Onboarding call" : "e.g. Tuesday class"} />
                <Field label="Date" type="date" value={mt.date ? mt.date.split("T")[0] : ""} onChange={(e) => updateMeetingDatePart(mt.id, "date", e.target.value)} />
                <Field label="Time" type="time" value={mt.date && mt.date.includes("T") ? mt.date.split("T")[1] : ""} onChange={(e) => updateMeetingDatePart(mt.id, "time", e.target.value)} />
                <Field label="Meeting link" value={mt.link} onChange={(e) => updateMeeting(mt.id, "link", e.target.value)} placeholder="https://…" />
                {confirmDeleteId === mt.id ? (
                  <div className="flex items-center gap-2 mb-2.5 text-[12px]"><span style={{ color: "#B04A3A" }}>Delete?</span><button onClick={() => { removeMeeting(mt.id); setConfirmDeleteId(null); }} className="f-label" style={{ color: "#B04A3A", fontWeight: 700 }}>YES</button><button onClick={() => setConfirmDeleteId(null)} style={{ color: "#A79B84" }}>Cancel</button></div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(mt.id)} title="Delete this meeting" className="mb-2.5 flex items-center gap-1.5 text-[12px]" style={{ color: "#B04A3A" }}><Trash2 size={16} /> Delete</button>
                )}
              </div>
              {mt.moduleId === "other" && (() => {
                // Scoped to whichever cohort is picked in the filter bar above --
                // "All cohorts" shows everyone enrolled in the course, same as
                // before; picking one cohort narrows the tag list to just its
                // students, so a typo-prone list of 80 names doesn't have to be
                // scrolled through to tag two people in one cohort.
                const taggable = students.filter((s) => s.enrollments.some((e) => e.courseId === mt.courseId) && (cohortId === "all" || s.cohortId === cohortId));
                return (
                  <div className="pt-3" style={{ borderTop: "1px dashed #E7DEC9" }}>
                    <div className="f-label text-[10px] mb-2" style={{ color: "#A79B84" }}>TAG PEOPLE (they'll be notified and see this under their own Virtual Meetings){cohortId !== "all" && ` — showing ${cohorts.find((c) => c.id === cohortId)?.name || "this cohort"} only`}</div>
                    <div className="flex flex-wrap gap-2">
                      {taggable.map((s) => {
                        const tagged = (mt.assignedStudentIds || []).includes(s.id);
                        return <button key={s.id} type="button" onClick={() => updateMeeting(mt.id, "assignedStudentIds", tagged ? (mt.assignedStudentIds || []).filter((x) => x !== s.id) : [...(mt.assignedStudentIds || []), s.id])} className="f-code text-[11px] px-3 py-1.5 rounded-full" style={{ background: tagged ? "var(--accent)" : "#F0E7D6", color: tagged ? "#FAF6EC" : "#71675A", fontWeight: 700 }}>{s.name}</button>;
                      })}
                      {taggable.length === 0 && <span className="text-[13px]" style={{ color: "#A79B84" }}>No students enrolled in this course {cohortId !== "all" ? "in this cohort " : ""}yet.</span>}
                    </div>
                  </div>
                );
              })()}
              <div className="pt-3" style={{ borderTop: "1px dashed #E7DEC9" }}>
                <div className="f-label text-[10px] mb-2" style={{ color: "#A79B84" }}>VIRTUAL RECORDING (after class, if there is one)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <Field label="Recording link" value={mt.recordingLink || ""} onChange={(e) => updateMeeting(mt.id, "recordingLink", e.target.value)} placeholder="https://…" />
                  <FileField label="Or upload a document (minutes, transcript)" value={mt.recordingFile || null} onChange={(v) => updateMeeting(mt.id, "recordingFile", v)} accept=".pdf,.doc,.docx,.txt" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1"><button onClick={() => saveMeeting(mt.id)} className="btn-primary rounded-lg px-5 py-2 text-[13px] self-start">Save</button>{savedIds.has(mt.id) && <span className="text-[13px] accent-text" style={{ fontWeight: 700 }}>Saved.</span>}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
// Same drag-to-place idea as CertificateTemplateEditor, extended with a
// fifth draggable element -- the photo frame -- which needs a size as well
// as a position, so it gets two range sliders (width/height) alongside the
// drag. One shared template for the whole Room, not one per course: Name,
// Student ID and Cohort belong to the student either way, and Programme is
// supplied by whichever course's own tab the student opens this from.
function IdCardTemplateEditor({ template, onSave, onClose }) {
  const [file, setFile] = useState(template?.file || null);
  const [photoBox, setPhotoBox] = useState(template?.photoBox || { xPct: 27, yPct: 48, widthPct: 32, heightPct: 55 });
  const [namePos, setNamePos] = useState(template?.namePos || { xPct: 62, yPct: 42 });
  const [idPos, setIdPos] = useState(template?.idPos || { xPct: 62, yPct: 50 });
  const [programmePos, setProgrammePos] = useState(template?.programmePos || { xPct: 62, yPct: 58 });
  const [cohortPos, setCohortPos] = useState(template?.cohortPos || { xPct: 62, yPct: 66 });
  const [fontSizePct, setFontSizePct] = useState(template?.fontSizePct || 3);
  const boxRef = useRef(null);
  const draggingRef = useRef(null);
  const setters = { photo: setPhotoBox, name: setNamePos, id: setIdPos, programme: setProgrammePos, cohort: setCohortPos };
  function onFilePick(e) { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setFile({ name: f.name, dataUrl: r.result }); r.readAsDataURL(f); }
  function posFromEvent(e) {
    const rect = boxRef.current.getBoundingClientRect();
    return { xPct: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)), yPct: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)) };
  }
  function onDrag(e) {
    const key = draggingRef.current;
    if (!key) return;
    const p = posFromEvent(e);
    if (key === "photo") setPhotoBox((b) => ({ ...b, ...p }));
    else setters[key]((prev) => ({ ...prev, ...p }));
  }
  const markers = [
    { key: "name", label: "Name", pos: namePos, sample: "Jane Doe" },
    { key: "id", label: "Student ID", pos: idPos, sample: "FJ/2026/001" },
    { key: "programme", label: "Programme", pos: programmePos, sample: "Virtual Assistant Mastery" },
    { key: "cohort", label: "Cohort", pos: cohortPos, sample: "Blueprint Cohort" },
  ];
  return (
    <div className="card rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4"><div className="text-[15px]" style={{ fontWeight: 700 }}>Student ID card template</div><button onClick={onClose}><X size={16} color="#A79B84" /></button></div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}><UploadCloud size={14} /> {file ? "Replace template image" : "Upload template image"}<input type="file" accept="image/*" onChange={onFilePick} style={{ display: "none" }} /></label>
        {file && <button onClick={() => setFile(null)} className="rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 600, color: "#B04A3A", border: "1px solid #E7DEC9" }}><Trash2 size={14} /> Delete image</button>}
      </div>
      {file && (
        <>
          <div className="text-[12px] mb-2" style={{ color: "#71675A" }}>Drag the photo frame and each field to where it should sit. The dashed box is the photo frame — a student's photo gets cropped to fill it.</div>
          <div
            ref={boxRef}
            onPointerMove={onDrag}
            onPointerUp={() => { draggingRef.current = null; }}
            onPointerLeave={() => { draggingRef.current = null; }}
            className="relative rounded-xl overflow-hidden mb-4"
            style={{ border: "1px solid #E7DEC9", touchAction: "none", containerType: "inline-size" }}
          >
            <img src={file.dataUrl} alt="" style={{ display: "block", width: "100%" }} draggable={false} />
            <div
              onPointerDown={(e) => { e.preventDefault(); draggingRef.current = "photo"; setPhotoBox((b) => ({ ...b, ...posFromEvent(e) })); }}
              style={{ position: "absolute", left: `${photoBox.xPct}%`, top: `${photoBox.yPct}%`, width: `${photoBox.widthPct}%`, height: `${photoBox.heightPct}%`, transform: "translate(-50%,-50%)", border: "2px dashed var(--accent)", background: "color-mix(in srgb, var(--accent) 12%, transparent)", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><span className="f-code text-[10px]" style={{ color: "var(--accent)", fontWeight: 700 }}>PHOTO</span></div>
            {markers.map((m) => (
              <div
                key={m.key}
                onPointerDown={(e) => { e.preventDefault(); draggingRef.current = m.key; setters[m.key]((prev) => ({ ...prev, ...posFromEvent(e) })); }}
                style={{ position: "absolute", left: `${m.pos.xPct}%`, top: `${m.pos.yPct}%`, transform: "translate(0,-50%)", fontFamily: "Georgia, serif", fontWeight: 600, fontSize: `${fontSizePct}cqw`, color: "#1B2A4A", cursor: "grab", whiteSpace: "nowrap", padding: "2px 6px" }}
              >{m.sample}</div>
            ))}
          </div>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Text size</div><input type="range" min={1.5} max={6} step={0.25} value={fontSizePct} onChange={(e) => setFontSizePct(Number(e.target.value))} style={{ width: "100%" }} /></label>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Photo frame width</div><input type="range" min={10} max={70} step={1} value={photoBox.widthPct} onChange={(e) => setPhotoBox((b) => ({ ...b, widthPct: Number(e.target.value) }))} style={{ width: "100%" }} /></label>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Photo frame height</div><input type="range" min={10} max={90} step={1} value={photoBox.heightPct} onChange={(e) => setPhotoBox((b) => ({ ...b, heightPct: Number(e.target.value) }))} style={{ width: "100%" }} /></label>
        </>
      )}
      <div className="flex items-center gap-4">
        <button disabled={!file} onClick={() => onSave({ file, photoBox, namePos, idPos, programmePos, cohortPos, fontSizePct })} className="btn-primary rounded-lg px-5 py-2.5 text-[13px] disabled:opacity-40">Save template</button>
        {template && <button onClick={() => onSave(null)} className="text-[13px]" style={{ color: "#B04A3A" }}>Remove template</button>}
      </div>
    </div>
  );
}
export function CoursesTab({ courses, setCourses, testimonials }) {
  const [showAdd, setShowAdd] = useState(false); const [openCourseId, setOpenCourseId] = useState(null);
  function addCourse(data) { setCourses((prev) => [...prev, { id: "c" + Date.now(), status: "draft", modules: [], ...data }]); }
  const openCourse = openCourseId ? courses.find((c) => c.id === openCourseId) : null;
  if (openCourse) return <CourseManager course={openCourse} testimonials={testimonials} setCourses={setCourses} onBack={() => setOpenCourseId(null)} />;
  return (
    <>
      <SectionHeader eyebrow="MANAGE" title="Courses" action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> Add course</button>} />
      {showAdd && <AddCourseForm onAdd={addCourse} onClose={() => setShowAdd(false)} />}
      <div className="flex flex-col gap-4">{courses.map((c) => <button key={c.id} onClick={() => setOpenCourseId(c.id)} className="card card-pop rounded-2xl p-6 w-full text-left flex items-center gap-4"><div className="rounded-xl overflow-hidden shrink-0" style={{ width: 64, height: 64, background: c.image ? "#FAF6EC" : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, white), #F0E7D6)" }}>{c.image ? <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <div className="w-full h-full flex items-center justify-center"><GraduationCap size={22} color="var(--accent)" /></div>}</div><div className="flex-1"><div className="f-display text-[19px]" style={{ fontWeight: 700 }}>{c.title}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{c.modules.length} modules · {c.durationWeeks} weeks · {c.level}</div></div><span className="f-label text-[10px] px-3 py-1.5 rounded-full shrink-0 tint-badge">{c.status === "live" ? "PUBLISHED" : "UNPUBLISHED"}</span><ChevronRight size={18} color="#A79B84" /></button>)}</div>
    </>
  );
}

export function StudentDetail({ student, applicant, setStudents, courses, cohorts, tasks, onClose, onDelete }) {
  const [status, setStatus] = useState(student.accountStatus); const [cohortId, setCohortId] = useState(student.cohortId);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [manageAccessId, setManageAccessId] = useState(null);
  function saveStatus(v) { setStatus(v); setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, accountStatus: v } : s)); }
  function saveCohort(v) { setCohortId(v); setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, cohortId: v } : s)); }
  function reissue(enrollmentId) { const code = genCode(); setStudents((prev) => prev.map((s) => s.id !== student.id ? s : { ...s, enrollments: s.enrollments.map((e) => e.id === enrollmentId ? { ...e, code } : e) })); }
  function toggleAccess(enrollmentId, tabId) {
    setStudents((prev) => prev.map((s) => s.id !== student.id ? s : {
      ...s,
      enrollments: s.enrollments.map((e) => {
        if (e.id !== enrollmentId) return e;
        const current = e.restrictedTabs || [];
        const next = current.includes(tabId) ? current.filter((t) => t !== tabId) : [...current, tabId];
        return { ...e, restrictedTabs: next };
      }),
    }));
  }
  function decideReview(enrollmentId, approve) {
    setStudents((prev) => prev.map((s) => s.id !== student.id ? s : {
      ...s,
      enrollments: s.enrollments.map((e) => {
        if (e.id !== enrollmentId || !e.pendingReview) return e;
        const moduleId = e.pendingReview.moduleId;
        return {
          ...e,
          pendingReview: null,
          completedModuleIds: approve ? [...new Set([...e.completedModuleIds, moduleId])] : e.completedModuleIds,
        };
      }),
    }));
  }
  const pendingReviews = student.enrollments.filter((e) => e.pendingReview);
  return (
    <div>
      <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to roster</button>
      <div className="card rounded-2xl p-7 mb-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: 52, height: 52, background: "color-mix(in srgb, var(--accent) 14%, white)" }}>{student.photo ? <img src={student.photo.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle size={24} color="var(--accent)" />}</div>
          <div><div className="f-display text-[21px]" style={{ fontWeight: 800 }}>{student.name}</div><div className="text-[14px]" style={{ color: "#71675A" }}>{student.email}</div></div>
        </div>
        <div className="flex items-center gap-4">
          {confirmingDelete ? (
            <div className="flex items-center gap-2 text-[12px]"><span style={{ color: "#B04A3A" }}>Delete this student?</span><button onClick={onDelete} className="f-label" style={{ color: "#B04A3A", fontWeight: 700 }}>YES, DELETE</button><button onClick={() => setConfirmingDelete(false)} style={{ color: "#A79B84" }}>Cancel</button></div>
          ) : (
            <button onClick={() => setConfirmingDelete(true)} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#B04A3A" }}><Trash2 size={14} /> Delete student</button>
          )}
        </div>
      </div>
      {(student.bio || student.socialLinks?.length > 0) && (
        <div className="rounded-lg px-4 py-3 mb-5" style={{ background: "#FAF6EC" }}>
          {student.bio && <div className="text-[13.5px] mb-2" style={{ color: "#4A4237" }}>{student.bio}</div>}
          {student.socialLinks?.length > 0 && <div className="flex flex-wrap gap-2">{student.socialLinks.filter((l) => l.url).map((l) => <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="f-code text-[11px] px-2.5 py-1 rounded-full tint-badge">{SOCIAL_PLATFORMS.find((p) => p.value === l.platform)?.label || l.platform}</a>)}</div>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <div><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>STUDENT ID</div><div className="text-[14px] f-code">{student.studentId}</div></div>
        <div className="flex-1"><SelectF label="Cohort" value={cohortId} onChange={(e) => saveCohort(e.target.value)} options={cohorts.map((c) => ({ value: c.id, label: c.name }))} /></div>
      </div>
      <div className="mb-5"><SelectF label="Account status" value={status} onChange={(e) => saveStatus(e.target.value)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "suspended", label: "Suspended" }]} /></div>
      {pendingReviews.length > 0 && (
        <div className="mb-5 pb-5" style={{ borderBottom: "1px solid #F0E7D6" }}>
          <div className="f-label text-[11px] mb-3" style={{ color: "#B04A3A" }}>AWAITING YOUR REVIEW</div>
          <div className="flex flex-col gap-3">{pendingReviews.map((e) => {
            const course = courses.find((c) => c.id === e.courseId);
            const module = course?.modules.find((m) => m.id === e.pendingReview.moduleId);
            return (
              <div key={e.id} className="rounded-xl p-4" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
                <div className="flex items-center justify-between mb-1"><div className="text-[13px]" style={{ fontWeight: 700 }}>{course?.title} — {module?.title}</div>{typeof e.pendingReview.autoScore === "number" && <span className="f-code text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F0E7D6", color: "#71675A" }}>AUTO-CHECK: {e.pendingReview.autoScore}% match</span>}</div>
                {module?.questionPrompt && <RichText html={module.questionPrompt} className="rich-content text-[12px] mb-2" style={{ color: "#71675A" }} />}
                <RichText html={e.pendingReview.proof} className="rich-content text-[14px] mb-3 rounded-lg px-3 py-2.5" style={{ background: "#fff", border: "1px solid #E7DEC9" }} />
                <div className="flex items-center gap-2"><button onClick={() => decideReview(e.id, true)} className="btn-primary rounded-lg px-4 py-2 text-[12px]">Approve — unlock next module</button><button onClick={() => decideReview(e.id, false)} className="text-[12px]" style={{ color: "#B04A3A" }}>Send back</button></div>
              </div>
            );
          })}</div>
        </div>
      )}
      <div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>ENROLLMENTS</div>
      <div className="flex flex-col gap-2 mb-5">{student.enrollments.map((e) => {
        const studentCohort = cohorts.find((c) => c.id === student.cohortId);
        const endedDaysAgo = studentCohort?.endDate ? Math.floor((Date.now() - new Date(studentCohort.endDate).getTime()) / 86400000) : null;
        const restricted = new Set(e.restrictedTabs || []);
        const course = courses.find((c) => c.id === e.courseId);
        const elig = course ? courseEligibility(tasks, course, e, student.id) : null;
        return (
          <div key={e.id} className="rounded-lg px-4 py-3" style={{ background: "#FAF6EC" }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[14px]" style={{ fontWeight: 700 }}>{course?.title}</div>
                  {elig && (elig.eligible
                    ? <span className="f-code text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#E4F3E9", color: "#2F7D4F", fontWeight: 700 }}>GRADUATED</span>
                    : <span className="f-code text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#FBEAE7", color: "#B04A3A", fontWeight: 700 }}>STILL IN TRAINING</span>)}
                </div>
                <div className="f-code text-[10px]" style={{ color: "#71675A" }}>{e.status.toUpperCase()} · {e.completedModuleIds.length}/{course?.modules.length || 8} modules{restricted.size > 0 ? ` · ${restricted.size} area${restricted.size === 1 ? "" : "s"} restricted` : ""}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="f-code text-[13px]">{e.code}</span>
                <button onClick={() => reissue(e.id)} className="f-label text-[10px] accent-text">REISSUE</button>
                <button onClick={() => setManageAccessId(manageAccessId === e.id ? null : e.id)} className="f-label text-[10px] accent-text">{manageAccessId === e.id ? "HIDE" : "MANAGE ACCESS"}</button>
              </div>
            </div>
            {manageAccessId === e.id && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #E7DEC9" }}>
                {endedDaysAgo != null && endedDaysAgo > 0 && (
                  <div className="text-[12px] rounded-lg px-3 py-2 mb-3" style={{ background: "#FBF0E2", color: "#8A5422" }}>{studentCohort.name} ended {endedDaysAgo === 1 ? "1 day" : `${endedDaysAgo} days`} ago.</div>
                )}
                {STUDENT_ACCESS_TABS.map((group) => (
                  <div key={group.group}>
                    <div className="f-label text-[10px] mt-2 mb-1" style={{ color: "#A79B84" }}>{group.group.toUpperCase()}</div>
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid #F0E7D6" }}>
                        <div><div className="text-[13px]">{item.label}</div>{item.sub && <div className="text-[11px]" style={{ color: "#A79B84" }}>{item.sub}</div>}</div>
                        <button onClick={() => toggleAccess(e.id, item.id)} className="rounded-full shrink-0" style={{ width: 36, height: 21, background: !restricted.has(item.id) ? "#4E7D5C" : "#E7DEC9", position: "relative", transition: "background .15s" }}>
                          <span style={{ position: "absolute", top: 2, left: !restricted.has(item.id) ? 17 : 2, width: 17, height: 17, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}</div>
      {applicant && <div className="pt-5" style={{ borderTop: "1px solid #F0E7D6" }}><div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>LATEST APPLICATION ANSWERS</div>{applicant.answers.map((ans, i) => <div key={i} className="mb-2 text-[13px]">{ans}</div>)}</div>}
      </div>
    </div>
  );
}
export function StudentsTab({ students, setStudents, onRemove, applicants, courses, cohorts, tasks }) {
  const [selected, setSelected] = useState(null);
  const [cohortFilter, setCohortFilter] = useState("all");
  const [graduatedOnly, setGraduatedOnly] = useState(false);
  function exportCsv() { const rows = [["Student ID", "Name", "Email", "Cohort", "Status", "Enrollments"], ...students.map((s) => [s.studentId, s.name, s.email, cohorts.find((c) => c.id === s.cohortId)?.name || "", s.accountStatus, s.enrollments.map((e) => courses.find((c) => c.id === e.courseId)?.title).join("; ")])]; const csv = rows.map((r) => r.join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "fj-room-students.csv"; a.click(); URL.revokeObjectURL(url); }
  // Graduated means at least one of their enrollments has cleared the
  // same courseEligibility check the Gradebook and Certificates tab use
  // (100% course progress, a passing capstone, and not held back) -- one
  // shared definition of "graduated" everywhere it shows up.
  function isGraduated(s) { return s.enrollments.some((e) => { const c = courses.find((x) => x.id === e.courseId); return c && courseEligibility(tasks, c, e, s.id).eligible; }); }
  const scopedStudents = students
    .filter((s) => cohortFilter === "all" || s.cohortId === cohortFilter)
    .filter((s) => !graduatedOnly || isGraduated(s));
  const selectedStudent = students.find((s) => s.id === selected);
  const selectedApplicant = selectedStudent ? applicants.filter((a) => a.email === selectedStudent.email).slice(-1)[0] : null;
  // A clean page swap -- not an inline panel the roster table stays
  // sitting under -- same pattern CourseManager/ModuleEditor already use.
  if (selectedStudent) return <StudentDetail student={selectedStudent} applicant={selectedApplicant} setStudents={setStudents} courses={courses} cohorts={cohorts} tasks={tasks} onClose={() => setSelected(null)} onDelete={() => { onRemove(selectedStudent.id); setSelected(null); }} />;
  return (
    <>
      <SectionHeader eyebrow="ROSTER" title="Students" action={<button onClick={exportCsv} className="btn-soft rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Download size={14} /> Export CSV</button>} />
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => setCohortFilter("all")} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: cohortFilter === "all" ? "var(--accent)" : "#F0E7D6", color: cohortFilter === "all" ? "#FAF6EC" : "#71675A" }}>All cohorts</button>
        {cohorts.map((co) => <button key={co.id} onClick={() => setCohortFilter(co.id)} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: cohortFilter === co.id ? "var(--accent)" : "#F0E7D6", color: cohortFilter === co.id ? "#FAF6EC" : "#71675A" }}>{co.name}</button>)}
        <button onClick={() => setGraduatedOnly((g) => !g)} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: graduatedOnly ? "var(--accent)" : "#F0E7D6", color: graduatedOnly ? "#FAF6EC" : "#71675A" }}>Graduated students</button>
      </div>
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-6 gap-x-5 px-6 py-3 f-label text-[11px]" style={{ background: "#F0E7D6", color: "#71675A" }}><div>STUDENT ID</div><div>NAME</div><div>COHORT</div><div>STATUS</div><div>COURSES</div><div>PROGRESS</div></div>
            {scopedStudents.map((s) => { const graduated = isGraduated(s); return <button key={s.id} onClick={() => setSelected(s.id)} className="w-full grid grid-cols-6 gap-x-5 px-6 py-4 items-center text-[14px] text-left" style={{ borderTop: "1px solid #F0E7D6" }}><div className="f-code text-[11px]" style={{ color: "#71675A" }}>{s.studentId}</div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ color: "#4A4237" }}>{cohorts.find((c) => c.id === s.cohortId)?.name || "—"}</div><span className="f-code text-[10px] px-2.5 py-1 rounded-full self-start tint-badge">{s.accountStatus.toUpperCase()}</span><div style={{ color: "#4A4237" }}>{s.enrollments.length}</div>{graduated ? <span className="f-code text-[10px] px-2.5 py-1 rounded-full self-start" style={{ background: "#E4F3E9", color: "#2F7D4F", fontWeight: 700 }}>GRADUATED</span> : <span className="f-code text-[10px] px-2.5 py-1 rounded-full self-start" style={{ background: "#FBEAE7", color: "#B04A3A", fontWeight: 700 }}>STILL IN TRAINING</span>}</button>; })}
            {scopedStudents.length === 0 && <div className="px-6 py-8 text-[13px]" style={{ color: "#A79B84" }}>No students match this filter yet.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export function TaskForm({ students, courses, cohorts, initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || ""); const [description, setDescription] = useState(initial?.description || ""); const [tools, setTools] = useState(initial?.tools || ""); const [dueInDays, setDueInDays] = useState(initial?.dueInDays || 7); const [proofType, setProofType] = useState(initial?.proofType || "link");
  const [courseId, setCourseId] = useState(initial?.courseId || courses[0]?.id); const [assigned, setAssigned] = useState(initial?.assigned || []);
  // cohortId "all" keeps the original behavior exactly -- pick people by
  // hand for this course. Any real cohort switches to auto-assign: every
  // enrolled student in that course+cohort, no picking names one by one.
  const [cohortId, setCohortId] = useState(initial?.cohortId || "all");
  const [deadlineAt, setDeadlineAt] = useState(initial?.deadlineAt || "");
  // Empty means "old style" -- one proof field (proofType below), same as
  // every task before this. Adding a row switches to requiring each of
  // these specific links instead.
  const [requiredLinks, setRequiredLinks] = useState(initial?.requiredLinks || []);
  const [isCapstone, setIsCapstone] = useState(initial?.isCapstone || false);
  // What SHE gives them to complete the task (a template, a brief, a
  // sample) -- separate from requiredLinks/proofType above, which is what
  // THEY submit back. Any number of files, each optional.
  const [files, setFiles] = useState(initial?.files || []);
  function toggle(id) { setAssigned((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function addFileRow() { setFiles((prev) => [...prev, { id: "f" + Date.now(), file: null }]); }
  function updateFileRow(i, patch) { setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, ...patch } : f)); }
  function removeFileRow(i) { setFiles((prev) => prev.filter((_, idx) => idx !== i)); }
  const eligible = students.filter((s) => s.enrollments.some((e) => e.courseId === courseId));
  const cohortEligible = cohortId === "all" ? eligible : eligible.filter((s) => s.cohortId === cohortId);
  const effectiveAssigned = cohortId === "all" ? assigned : cohortEligible.map((s) => s.id);
  function addLinkRow() {
    const used = new Set(requiredLinks.map((r) => r.type));
    const next = LINK_TYPES.find((t) => !used.has(t.key)) || LINK_TYPES[0];
    setRequiredLinks((prev) => [...prev, { type: next.key, label: next.label }]);
  }
  function updateLinkRow(i, patch) { setRequiredLinks((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r)); }
  function removeLinkRow(i) { setRequiredLinks((prev) => prev.filter((_, idx) => idx !== i)); }
  return (
    <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
      <Field label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Full description / instructions</div><RichTextEditor value={description} onChange={setDescription} minRows={4} /></div>
      <Field label="Tools needed (optional)" value={tools} onChange={(e) => setTools(e.target.value)} placeholder="e.g. Calendly, a laptop" />

      <div>
        <div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>FILES FOR STUDENTS (OPTIONAL)</div>
        <div className="text-[12px] mb-2" style={{ color: "#A79B84" }}>Anything they need to do this task — a template, a brief, a sample. They can view and download it; separate from what they submit back to you below.</div>
        {files.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            {files.map((f, i) => (
              <div key={f.id} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
                <div className="flex-1"><FileField value={f.file} onChange={(file) => updateFileRow(i, { file })} /></div>
                <button onClick={() => removeFileRow(i)}><X size={15} color="#A79B84" /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addFileRow} className="text-[13px] accent-text flex items-center gap-1.5" style={{ fontWeight: 700 }}><Plus size={14} /> Add a file</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectF label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)} options={courses.map((c) => ({ value: c.id, label: c.title }))} />
        <SelectF label="Cohort" value={cohortId} onChange={(e) => setCohortId(e.target.value)} options={[{ value: "all", label: "Pick students myself" }, ...cohorts.map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Due in (days) — shown until a real deadline is set below" type="number" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} />
        <Field label="Hard deadline (optional — locks submission after this moment)" type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} />
      </div>

      {cohortId === "all" ? (
        <div><div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>ASSIGN TO</div><div className="flex flex-wrap gap-2">{eligible.map((s) => <button key={s.id} onClick={() => toggle(s.id)} className="f-label text-[11px] px-3 py-1.5 rounded-full" style={{ background: assigned.includes(s.id) ? "var(--accent)" : "#F0E7D6", color: assigned.includes(s.id) ? "#FAF6EC" : "#71675A" }}>{s.name}</button>)}</div></div>
      ) : (
        <div className="rounded-xl p-4" style={{ background: "#F0E7D6" }}>
          <div className="text-[13.5px] mb-2" style={{ color: "var(--accent)", fontWeight: 700 }}>This assigns to all {cohortEligible.length} student{cohortEligible.length === 1 ? "" : "s"} in {cohorts.find((c) => c.id === cohortId)?.name} taking {courses.find((c) => c.id === courseId)?.title}.</div>
          <div className="flex flex-wrap gap-1.5">{cohortEligible.map((s) => <span key={s.id} className="f-code text-[11px] px-2.5 py-1 rounded-full" style={{ background: "#FAF6EC", color: "#71675A" }}>{s.name}</span>)}</div>
        </div>
      )}

      <div>
        <div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>WHAT THEY NEED TO SUBMIT</div>
        {requiredLinks.length === 0 ? (
          <SelectF label="Required proof type" value={proofType} onChange={(e) => setProofType(e.target.value)} options={[{ value: "link", label: "Link" }, { value: "image", label: "Image / screenshot" }, { value: "document", label: "Document" }, { value: "text", label: "Written text" }]} />
        ) : (
          <div className="flex flex-col gap-2 mb-2">
            {requiredLinks.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
                <select className="input-field rounded-lg px-2.5 py-2 text-[13px]" style={{ maxWidth: 150 }} value={r.type} onChange={(e) => { const t = LINK_TYPES.find((x) => x.key === e.target.value); updateLinkRow(i, { type: e.target.value, label: t.label }); }}>
                  {LINK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <input className="input-field rounded-lg px-3 py-2 text-[13px] flex-1" placeholder="Label shown to student (optional)" value={r.label} onChange={(e) => updateLinkRow(i, { label: e.target.value })} />
                <button onClick={() => removeLinkRow(i)}><X size={15} color="#A79B84" /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addLinkRow} className="text-[13px] accent-text flex items-center gap-1.5" style={{ fontWeight: 700 }}><Plus size={14} /> Require a specific link (Google Doc, Canva, Trello…)</button>
        {requiredLinks.length > 0 && <div className="text-[12px] mt-1.5" style={{ color: "#A79B84" }}>Each link is checked as the student types it — it has to actually look like the right kind of link before they can submit.</div>}
      </div>

      <label className="flex items-center gap-2.5 text-[13.5px] rounded-lg p-3" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9", cursor: "pointer" }}>
        <input type="checkbox" checked={isCapstone} onChange={(e) => setIsCapstone(e.target.checked)} />
        <span>This is the <strong>capstone</strong> for {courses.find((c) => c.id === courseId)?.title || "this course"} — counts toward certificate eligibility in the Gradebook. Only one task per course can be the capstone.</span>
      </label>

      <div className="flex gap-3 mt-1"><button onClick={() => { if (title) onSave({ title, description, tools, courseId, cohortId, dueInDays: Number(dueInDays), deadlineAt: deadlineAt || null, proofType, requiredLinks, isCapstone, files: files.filter((f) => f.file), assigned: effectiveAssigned }); }} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">Save task</button><button onClick={onClose} className="text-[14px]" style={{ color: "#A79B84" }}>Cancel</button></div>
    </div>
  );
}
export function SubmissionDetail({ sid, student, sub, task, onGrade, onGradeLinks, onClose }) {
  const [score, setScore] = useState(sub?.score || 100);
  const links = sub?.links || {};
  const hasLinks = task?.requiredLinks?.length > 0;
  const maxShare = hasLinks ? linkShare(task.requiredLinks.length) : 0;
  // Every link is always a working draft, graded before or not -- seeded
  // from whatever's already saved so re-opening this screen always starts
  // from the truth, never from a blank slate. Nothing is ever locked: she
  // asked specifically to be able to go back and rescore work she'd
  // already approved, not just add a note to it.
  const [drafts, setDrafts] = useState(() => {
    const d = {};
    task?.requiredLinks?.forEach((_, i) => {
      const g = sub?.linkGrades?.[i];
      d[i] = g ? { decision: g.decision, score: g.score ?? linkShare(task.requiredLinks.length), feedback: g.feedback || "" } : { decision: null, score: linkShare(task.requiredLinks.length), feedback: "" };
    });
    return d;
  });
  function setDraft(i, patch) { setDrafts((p) => ({ ...p, [i]: { ...p[i], ...patch } })); }
  const allDecided = hasLinks && Object.values(drafts).every((d) => d.decision != null);
  // Separate from each link's own feedback -- a closing note on the whole
  // submission rather than any one piece of it ("Great work overall, keep
  // this pace up for the next one").
  const [comment, setComment] = useState(sub?.comment || "");
  function saveLinks(notify) {
    const linkGrades = {};
    Object.entries(drafts).forEach(([i, d]) => { linkGrades[i] = { decision: d.decision, score: d.decision === "approved" ? Math.min(maxShare, Math.max(0, Number(d.score) || 0)) : null, feedback: d.feedback || "" }; });
    onGradeLinks(sid, linkGrades, comment, notify);
  }
  return <div className="card modal-in rounded-2xl p-6 mb-4">
    <div className="flex items-center justify-between mb-3"><div className="text-[15px]" style={{ fontWeight: 700 }}>{student?.name}'s submission</div><button onClick={onClose}><X size={16} color="#A79B84" /></button></div>
    {hasLinks ? (
      <div className="flex flex-col gap-3 mb-2">
        {task.requiredLinks.map((r, i) => {
          const url = links[i];
          const everNotified = sub.linkGrades?.[i]?.decision != null && sub.notifiedRound === sub.round;
          const draft = drafts[i];
          return (
            <div key={i} className="rounded-xl p-4" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[13.5px]" style={{ fontWeight: 700 }}>{r.label || r.type}</div>
                  {url ? <a href={url} target="_blank" rel="noreferrer" className="text-[12.5px] accent-text break-all">{url} ↗</a> : <span className="text-[12.5px]" style={{ color: "#A79B84" }}>Not submitted</span>}
                </div>
                {everNotified && <span className="f-code text-[10px] px-2.5 py-1 rounded-full shrink-0" style={{ background: "#F0E7D6", color: "#71675A" }}>{draft.decision === "approved" ? "✓ already notified" : "waiting on student"}</span>}
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setDraft(i, { decision: "approved" })} className="f-label text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: draft.decision === "approved" ? "#2F7D4F" : "#FFFFFF", color: draft.decision === "approved" ? "#fff" : "#4A4237", border: "1px solid #E7DEC9" }}><Check size={12} /> Approve</button>
                  <button onClick={() => setDraft(i, { decision: "resubmit" })} className="f-label text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: draft.decision === "resubmit" ? "#B2572B" : "#FFFFFF", color: draft.decision === "resubmit" ? "#fff" : "#4A4237", border: "1px solid #E7DEC9" }}><RotateCcw size={12} /> Resubmit</button>
                  {draft.decision === "approved" && <div className="flex items-center gap-1.5 ml-auto"><input type="number" min={0} max={maxShare} className="input-field rounded-lg px-2.5 py-1.5 text-[13px]" style={{ width: 70 }} value={draft.score} onChange={(e) => setDraft(i, { score: Math.min(maxShare, Math.max(0, Number(e.target.value) || 0)) })} /><span className="text-[12px]" style={{ color: "#71675A" }}>/ {maxShare}% max</span></div>}
                </div>
                {draft.decision && <textarea className="input-field rounded-lg px-3 py-2 text-[13px] w-full mt-2" rows={draft.decision === "resubmit" ? 3 : 2} placeholder={draft.decision === "resubmit" ? "Why is this going back to them?" : "Feedback on this one (optional)"} value={draft.feedback} onChange={(e) => setDraft(i, { feedback: e.target.value })} />}
              </div>
            </div>
          );
        })}
        <label className="block mt-1"><div className="f-label text-[11px] mb-1.5" style={{ color: "#71675A" }}>Overall comment (optional — shown to {student?.name?.split(" ")[0]} with their result)</div><textarea className="input-field rounded-lg px-3 py-2 text-[13px] w-full" rows={2} placeholder="e.g. Great work overall — keep this pace up for the next one." value={comment} onChange={(e) => setComment(e.target.value)} /></label>
        <div className="flex items-center gap-3 mt-1">
          <button disabled={!allDecided} onClick={() => saveLinks(false)} className="btn-soft rounded-lg px-5 py-2.5 text-[13px] disabled:opacity-40">Save</button>
          <button disabled={!allDecided} onClick={() => saveLinks(true)} className="btn-primary rounded-lg px-5 py-2.5 text-[13px] disabled:opacity-40">Save &amp; notify {student?.name?.split(" ")[0]}</button>
        </div>
        <div className="text-[12px]" style={{ color: "#A79B84" }}>{!allDecided ? "Decide on every link before saving." : "Save keeps this between you and the gradebook — nothing goes to them until you notify."}</div>
      </div>
    ) : (
      <>
        <div className="text-[14px] mb-4" style={{ color: "#4A4237" }}>{sub.note}</div>
        <div className="flex items-center gap-3"><Field label="Score (%)" type="number" value={score} onChange={(e) => setScore(e.target.value)} /><button onClick={() => onGrade(sid, "approved", Number(score))} className="btn-primary rounded-lg px-5 py-2.5 text-[13px] shrink-0 mt-6">Mark reviewed</button></div>
      </>
    )}
  </div>;
}
// Only one task per course can be the capstone -- picking a new one for a
// course un-ticks whichever task held that spot before, same way a radio
// button works, instead of letting eligibility silently depend on whichever
// capstone task happens to come first in the list.
function applyCapstoneExclusivity(prev, taskId, courseId, isCapstone) {
  if (!isCapstone) return prev;
  return prev.map((t) => (t.id !== taskId && t.courseId === courseId && t.isCapstone) ? { ...t, isCapstone: false } : t);
}
const SUBMISSION_FILTERS = [
  { key: "all", label: "All" },
  { key: "needs review", label: "Needs review" },
  { key: "waiting on student", label: "Waiting on student" },
  { key: "approved", label: "Approved" },
  { key: "not submitted", label: "Not submitted" },
];
export function TaskDetail({ task, setTasks, students, courses, cohorts, onClose, onDelete }) {
  const [editing, setEditing] = useState(false); const [viewingSub, setViewingSub] = useState(null);
  const [filter, setFilter] = useState("all");
  function grade(sid, status, score) { setTasks((prev) => prev.map((t) => t.id !== task.id ? t : { ...t, submissions: { ...t.submissions, [sid]: { ...t.submissions[sid], status, score, lastActivityAt: Date.now() } } })); setViewingSub(null); }
  // Every link stays editable forever, approved or not -- decision, score
  // and feedback can all be revised at any time, any number of times.
  // Status and score always fall out of whatever's currently saved (that's
  // the one place deriveSubmissionStatus/sumLinkScores are trusted to
  // agree with what the admin just clicked), so her own view of where
  // things stand is always accurate even on a plain save. The round still
  // bumps on every save, same as before, so ids stay fresh -- but the
  // student-facing notification is gated separately, on notifiedRound:
  // only "Save & notify" moves it up to match the round that was just
  // saved. A plain "Save" updates everything the same way, it just leaves
  // notifiedRound where it was, so nothing fires until she's ready.
  function gradeLinks(sid, linkGrades, comment, notify) {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== task.id) return t;
      const prevSub = t.submissions[sid];
      const nextSub = { ...prevSub, linkGrades, comment, round: (prevSub.round || 0) + 1, lastActivityAt: Date.now() };
      nextSub.status = deriveSubmissionStatus(t, nextSub);
      nextSub.score = sumLinkScores(t, nextSub);
      if (notify) nextSub.notifiedRound = nextSub.round;
      return { ...t, submissions: { ...t.submissions, [sid]: nextSub } };
    }));
    setViewingSub(null);
  }
  function save(data) { setTasks((prev) => applyCapstoneExclusivity(prev, task.id, data.courseId, data.isCapstone).map((t) => t.id !== task.id ? t : { ...t, ...data })); setEditing(false); }
  if (editing) return <TaskForm students={students} courses={courses} cohorts={cohorts} initial={task} onSave={save} onClose={() => setEditing(false)} />;
  const rows = task.assigned.map((sid) => {
    const s = students.find((x) => x.id === sid);
    const sub = task.submissions[sid];
    const status = !sub ? "not submitted" : (task.requiredLinks?.length > 0 ? deriveSubmissionStatus(task, sub) : sub.status === "approved" ? "approved" : "needs review");
    return { sid, s, sub, status };
  });
  const visibleRows = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  return (
    <div className="card rounded-2xl p-7 mb-6">
      <div className="flex items-center justify-between mb-2"><button onClick={onClose} className="flex items-center gap-1.5 text-[13px]" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to tasks</button><div className="flex gap-3"><button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-[13px] accent-text" style={{ fontWeight: 700 }}><Pencil size={13} /> Edit</button><button onClick={() => onDelete(task.id)} className="flex items-center gap-1.5 text-[13px]" style={{ color: "#B04A3A" }}><Trash2 size={13} /> Delete</button></div></div>
      <div className="f-display text-[22px] mt-3 mb-1" style={{ fontWeight: 800 }}>{task.title}</div>
      <RichText html={task.description} className="rich-content text-[15px] mb-2" style={{ color: "#4A4237" }} />
      {task.tools && <div className="text-[14px] mb-2" style={{ color: "#71675A" }}><strong>Tools:</strong> {task.tools}</div>}
      {task.files?.length > 0 && <div className="mb-4"><div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>FILES FOR STUDENTS</div><TaskFileList files={task.files} /></div>}
      <div className="text-[14px] mb-1" style={{ color: "#71675A" }}><strong>Required proof:</strong> {task.requiredLinks?.length > 0 ? task.requiredLinks.map((r) => r.label || r.type).join(", ") : task.proofType}</div>
      {task.isCapstone && <div className="text-[12px] mb-1"><span className="f-code px-2 py-0.5 rounded-full tint-badge">CAPSTONE</span></div>}
      {task.deadlineAt && <div className="text-[14px] mb-6" style={{ color: "#71675A" }}><strong>Closes:</strong> {new Date(task.deadlineAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>}
      <div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>SUBMISSIONS</div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">{SUBMISSION_FILTERS.map((f) => <button key={f.key} onClick={() => setFilter(f.key)} className="f-label text-[11px] px-3 py-1.5 rounded-full" style={{ background: filter === f.key ? "var(--accent)" : "#F0E7D6", color: filter === f.key ? "#FAF6EC" : "#71675A" }}>{f.label}</button>)}</div>
      <div className="flex flex-col gap-3">{visibleRows.map(({ sid, s, sub, status }) => (
        <div key={sid}>
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}><div><span className="text-[14px]" style={{ fontWeight: 700 }}>{s?.name}</span>{sub && <span className="f-code text-[10px] tint-badge px-2 py-1 rounded-full ml-2">{status.toUpperCase()}{sub.score != null ? ` · ${sub.score}%` : ""}</span>}{sub?.lastActivityAt && <span className="text-[11.5px] ml-2" style={{ color: "#A79B84" }}>{formatDateTime(sub.lastActivityAt)}</span>}</div>{sub ? <button onClick={() => setViewingSub(viewingSub === sid ? null : sid)} className="f-label text-[11px] accent-text flex items-center gap-1"><Eye size={12} /> View</button> : <span className="f-code text-[10px]" style={{ color: "#C9BFAE" }}>NOT SUBMITTED</span>}</div>
          {viewingSub === sid && <SubmissionDetail sid={sid} student={s} sub={sub} task={task} onGrade={grade} onGradeLinks={gradeLinks} onClose={() => setViewingSub(null)} />}
        </div>
      ))}</div>
    </div>
  );
}
export function TasksTab({ tasks, setTasks, students, courses, cohorts }) {
  const [showAdd, setShowAdd] = useState(false); const [selected, setSelected] = useState(null);
  function addTask(data) { const id = "t" + Date.now(); setTasks((prev) => [...applyCapstoneExclusivity(prev, id, data.courseId, data.isCapstone), { id, submissions: {}, ...data }]); setShowAdd(false); }
  function deleteTask(id) { setTasks((prev) => prev.filter((t) => t.id !== id)); setSelected(null); }
  const selectedTask = tasks.find((t) => t.id === selected);
  return (
    <>
      <SectionHeader eyebrow="ASSIGN & REVIEW" title="Tasks" action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> New task</button>} />
      {showAdd && <TaskForm students={students} courses={courses} cohorts={cohorts} onSave={addTask} onClose={() => setShowAdd(false)} />}
      {selectedTask ? <TaskDetail task={selectedTask} setTasks={setTasks} students={students} courses={courses} cohorts={cohorts} onClose={() => setSelected(null)} onDelete={deleteTask} /> : <div className="flex flex-col gap-4">{tasks.map((t) => <button key={t.id} onClick={() => setSelected(t.id)} className="card card-pop rounded-xl p-5 text-left"><div className="flex items-center justify-between mb-1.5"><div className="text-[16px] flex items-center gap-2" style={{ fontWeight: 700 }}>{t.title}{t.isCapstone && <span className="f-code text-[10px] px-2 py-0.5 rounded-full tint-badge">CAPSTONE</span>}</div><span className="f-code text-[10px]" style={{ color: "#A79B84" }}>{t.assigned.length} assigned</span></div><RichText html={t.description} className="rich-content text-[14px] line-clamp-2" style={{ color: "#71675A" }} /></button>)}</div>}
    </>
  );
}

export function ResourceForm({ courses, initial, onSave, onClose }) {
  // "category" only ever existed as this form's own way of asking "should
  // this be public" -- it was never actually saved (only isPublic was), so
  // reopening an existing resource to edit anything else about it always
  // reset this dropdown to "Module resource" regardless of its real status,
  // and saving from there would silently un-publish a resource that was
  // meant to stay public.
  const [category, setCategory] = useState(initial ? (initial.isPublic ? "free" : "module") : "module"); const [folder, setFolder] = useState(initial?.folder || ""); const [title, setTitle] = useState(initial?.title || ""); const [description, setDescription] = useState(initial?.description || ""); const [type, setType] = useState(initial?.type || "Doc"); const [url, setUrl] = useState(initial?.url || ""); const [file, setFile] = useState(initial?.file || null); const [kind, setKind] = useState(initial?.kind || "link"); const [visibility, setVisibility] = useState(initial?.visibility || "course"); const [courseId, setCourseId] = useState(initial?.courseId || courses[0]?.id);
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const isPublic = category === "free";
  const canSave = folder && title && (kind === "file" ? file : url);
  async function submit() {
    // Silently doing nothing when a required field was empty (no error, no
    // "saving" state) looked exactly like a successful save that just
    // didn't stick -- there was nothing here to tell you otherwise.
    if (!canSave) {
      setError(!folder ? "Folder name is required." : !title ? "Resource title is required." : kind === "file" ? "Please upload a file." : "Please add a link.");
      return;
    }
    setSaving(true); setError("");
    const err = await onSave({ courseId: category === "free" ? null : courseId, folder, title, description, type, url, file, kind, visibility: category === "free" ? "all" : visibility, isPublic });
    setSaving(false);
    if (err) setError(err); else onClose();
  }
  return (
    <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
      <SelectF label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: "module", label: "Module resource (for enrolled students)" }, { value: "free", label: "Free download (public)" }]} />
      {category === "module" && <SelectF label="Visible to" value={visibility} onChange={(e) => setVisibility(e.target.value)} options={[{ value: "course", label: "Just this course" }, { value: "all", label: "All courses" }]} />}
      {category === "module" && <SelectF label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)} options={courses.map((c) => ({ value: c.id, label: c.title }))} />}
      <Field label="Folder name" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="e.g. Module 1 resources" />
      <Field label="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Full description (what it's for, who it's for, how it helps) — shown when someone clicks View" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      <SelectF label="Output" value={kind} onChange={(e) => setKind(e.target.value)} options={[{ value: "link", label: "Link — Download opens the link" }, { value: "file", label: "Uploaded file — Download serves the file" }]} />
      {kind === "link" ? <Field label="Link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /> : <FileField label="File (PDF, slides, image, document)" value={file} onChange={setFile} />}
      <SelectF label="Format" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: "Doc", label: "Doc" }, { value: "Sheet", label: "Sheet" }, { value: "Slides", label: "Slides" }, { value: "Link", label: "Link" }]} />
      {error && <div className="text-[13px]" style={{ color: "#B04A3A" }}>{error}</div>}
      <div className="flex gap-3"><button disabled={saving} onClick={submit} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">{saving ? "Saving…" : "Save resource"}</button><button onClick={onClose} className="text-[14px]" style={{ color: "#A79B84" }}>Cancel</button></div>
    </div>
  );
}
export function LibraryTab({ resources, onAdd, onEdit, onRemove, courses }) {
  const [showAdd, setShowAdd] = useState(false); const [editingId, setEditingId] = useState(null); const [copiedId, setCopiedId] = useState(null);
  const folders = [...new Set(resources.map((r) => r.folder))];
  function copyLink(id) {
    navigator.clipboard?.writeText(`${window.location.origin}/?r=${id}`).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
  }
  function copyLibraryLink() {
    navigator.clipboard?.writeText(`${window.location.origin}/?library=1`).then(() => { setCopiedId("library"); setTimeout(() => setCopiedId(null), 2000); });
  }
  return (
    <>
      <SectionHeader eyebrow="MANAGE" title="Resource library" action={<div className="flex items-center gap-2"><button onClick={copyLibraryLink} className="btn-soft rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Send size={14} /> {copiedId === "library" ? "Copied!" : "Copy library link"}</button><button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> Add resource</button></div>} />
      {showAdd && <ResourceForm courses={courses} onSave={onAdd} onClose={() => setShowAdd(false)} />}
      {folders.map((f) => <div key={f} className="mb-6"><div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>{f.toUpperCase()}</div><div className="flex flex-col gap-2">{resources.filter((r) => r.folder === f).map((r) => (
        <div key={r.id}><div className="card rounded-lg px-5 py-3 flex items-center justify-between text-[14px]"><span className="flex items-center gap-2">{r.title} {r.isPublic && <span className="f-code text-[9px] tint-badge px-2 py-0.5 rounded-full">PUBLIC</span>}{r.visibility === "all" && !r.isPublic && <span className="f-code text-[9px] tint-badge px-2 py-0.5 rounded-full">ALL COURSES</span>}</span><div className="flex items-center gap-3">{r.isPublic && <button onClick={() => copyLink(r.id)} className="f-label text-[10px] accent-text flex items-center gap-1"><Send size={11} /> {copiedId === r.id ? "COPIED!" : "COPY LINK"}</button>}<button onClick={() => setEditingId(editingId === r.id ? null : r.id)} className="f-label text-[10px] accent-text flex items-center gap-1"><Pencil size={11} /> EDIT</button><button onClick={() => onRemove(r.id)}><Trash2 size={14} color="#B04A3A" /></button></div></div>{editingId === r.id && <ResourceForm courses={courses} initial={r} onSave={(data) => onEdit(r.id, data)} onClose={() => setEditingId(null)} />}</div>
      ))}</div></div>)}
    </>
  );
}
// Drag-to-place the name on the admin's own certificate image, once per
// course -- not once per student. "Jane Doe" previews at the saved size
// and spot using the same xPct/yPct/fontSizePct that renderCertificate
// later draws onto the real PNG, so what's dragged here is exactly what
// students get, never an approximation of it.
function CertificateTemplateEditor({ course, onSave, onClose }) {
  const existing = course.certificateTemplate;
  const [file, setFile] = useState(existing?.file || null);
  const [namePos, setNamePos] = useState(existing?.namePos || { xPct: 50, yPct: 55 });
  const [fontSizePct, setFontSizePct] = useState(existing?.fontSizePct || 6);
  const [includeDate, setIncludeDate] = useState(existing?.includeDate ?? true);
  const [datePos, setDatePos] = useState(existing?.datePos || { xPct: 50, yPct: 75 });
  const [dateFontSizePct, setDateFontSizePct] = useState(existing?.dateFontSizePct || 2.5);
  const boxRef = useRef(null);
  // Which tag is being dragged right now -- "name", "date", or null. Set
  // on the tag itself (pointerdown), tracked while the pointer moves
  // anywhere over the preview, cleared on release -- so dragging the
  // name never accidentally grabs the date tag sitting near it.
  const draggingRef = useRef(null);
  function onFilePick(e) { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setFile({ name: f.name, dataUrl: r.result }); r.readAsDataURL(f); }
  function posFromEvent(e) {
    const rect = boxRef.current.getBoundingClientRect();
    return { xPct: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)), yPct: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)) };
  }
  return (
    <div className="card rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4"><div className="text-[15px]" style={{ fontWeight: 700 }}>Certificate template — {course.title}</div><button onClick={onClose}><X size={16} color="#A79B84" /></button></div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}><UploadCloud size={14} /> {file ? "Replace template image" : "Upload template image"}<input type="file" accept="image/*" onChange={onFilePick} style={{ display: "none" }} /></label>
        {file && <button onClick={() => { setFile(null); setNamePos({ xPct: 50, yPct: 55 }); setFontSizePct(6); setDatePos({ xPct: 50, yPct: 75 }); }} className="rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 600, color: "#B04A3A", border: "1px solid #E7DEC9" }}><Trash2 size={14} /> Delete image</button>}
      </div>
      {file && (
        <>
          <div className="text-[12px] mb-2" style={{ color: "#71675A" }}>Drag the name{includeDate ? " and the date" : ""} to where each should sit on the certificate.</div>
          <div
            ref={boxRef}
            onPointerMove={(e) => { if (draggingRef.current === "name") setNamePos(posFromEvent(e)); else if (draggingRef.current === "date") setDatePos(posFromEvent(e)); }}
            onPointerUp={() => { draggingRef.current = null; }}
            onPointerLeave={() => { draggingRef.current = null; }}
            className="relative rounded-xl overflow-hidden mb-4"
            style={{ border: "1px solid #E7DEC9", touchAction: "none", containerType: "inline-size" }}
          >
            <img src={file.dataUrl} alt="" style={{ display: "block", width: "100%" }} draggable={false} />
            <div
              onPointerDown={(e) => { e.preventDefault(); draggingRef.current = "name"; setNamePos(posFromEvent(e)); }}
              style={{ position: "absolute", left: `${namePos.xPct}%`, top: `${namePos.yPct}%`, transform: "translate(-50%,-50%)", fontFamily: "Georgia, serif", fontWeight: 600, fontSize: `${fontSizePct}cqw`, color: "#2A2620", cursor: "grab", whiteSpace: "nowrap", padding: "2px 6px" }}
            >Jane Doe</div>
            {includeDate && (
              <div
                onPointerDown={(e) => { e.preventDefault(); draggingRef.current = "date"; setDatePos(posFromEvent(e)); }}
                style={{ position: "absolute", left: `${datePos.xPct}%`, top: `${datePos.yPct}%`, transform: "translate(-50%,-50%)", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: `${dateFontSizePct}cqw`, color: "#2A2620", cursor: "grab", whiteSpace: "nowrap", padding: "2px 6px" }}
              >{formatIssueDate(new Date().toISOString())}</div>
            )}
          </div>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Name size</div><input type="range" min={2} max={14} step={0.5} value={fontSizePct} onChange={(e) => setFontSizePct(Number(e.target.value))} style={{ width: "100%" }} /></label>
          <label className="flex items-center gap-2 mb-3 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}><input type="checkbox" checked={includeDate} onChange={(e) => setIncludeDate(e.target.checked)} /> Also show the date it was issued</label>
          {includeDate && <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Date size</div><input type="range" min={1} max={6} step={0.25} value={dateFontSizePct} onChange={(e) => setDateFontSizePct(Number(e.target.value))} style={{ width: "100%" }} /></label>}
        </>
      )}
      <div className="flex items-center gap-4">
        <button disabled={!file} onClick={() => onSave({ file, namePos, fontSizePct, includeDate, datePos, dateFontSizePct })} className="btn-primary rounded-lg px-5 py-2.5 text-[13px] disabled:opacity-40">Save template</button>
        {existing && <button onClick={() => onSave(null)} className="text-[13px]" style={{ color: "#B04A3A" }}>Remove template — back to manual upload</button>}
      </div>
    </div>
  );
}
export function CertificatesTab({ students, setStudents, courses, setCourses, tasks }) {
  const [editingCourseId, setEditingCourseId] = useState(null);
  function upload(sid, eid, e) { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setStudents((prev) => prev.map((s) => s.id !== sid ? s : { ...s, enrollments: s.enrollments.map((en) => en.id === eid ? { ...en, certificateFile: r.result } : en) })); r.readAsDataURL(f); }
  function toggle(sid, eid) { setStudents((prev) => prev.map((s) => s.id !== sid ? s : { ...s, enrollments: s.enrollments.map((en) => en.id === eid ? { ...en, certificateReady: !en.certificateReady } : en) })); }
  function toggleHold(sid, eid) { setStudents((prev) => prev.map((s) => s.id !== sid ? s : { ...s, enrollments: s.enrollments.map((en) => en.id === eid ? { ...en, certificateHeld: !en.certificateHeld } : en) })); }
  function saveCertName(sid, eid, name) { setStudents((prev) => prev.map((s) => s.id !== sid ? s : { ...s, enrollments: s.enrollments.map((en) => en.id === eid ? { ...en, certificateName: name } : en) })); }
  function saveTemplate(courseId, template) { setCourses((prev) => prev.map((c) => c.id !== courseId ? c : { ...c, certificateTemplate: template })); setEditingCourseId(null); }
  const editingCourse = courses.find((c) => c.id === editingCourseId);
  return (
    <>
      <SectionHeader eyebrow="ISSUE" title="Certificates" />
      <div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>COURSE TEMPLATES</div>
      <div className="flex flex-col gap-3 mb-8">{courses.map((c) => (
        <div key={c.id} className="card rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div><div className="text-[15px]" style={{ fontWeight: 700 }}>{c.title}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{c.certificateTemplate ? "Template set — eligible students are issued their certificate automatically." : "No template yet — certificates for this course are uploaded one at a time below."}</div></div>
          <button onClick={() => setEditingCourseId(c.id)} className="btn-soft rounded-full px-4 py-2 text-[13px]" style={{ fontWeight: 600 }}>{c.certificateTemplate ? "Edit template" : "Set up template"}</button>
        </div>
      ))}</div>
      {editingCourse && <CertificateTemplateEditor course={editingCourse} onSave={(t) => saveTemplate(editingCourse.id, t)} onClose={() => setEditingCourseId(null)} />}
      <div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>STUDENTS</div>
      <div className="flex flex-col gap-3">{students.flatMap((s) => s.enrollments.filter((e) => e.status === "active").map((e) => ({ s, e }))).map(({ s, e }) => {
        const course = courses.find((c) => c.id === e.courseId);
        const hasTemplate = !!course?.certificateTemplate;
        const elig = hasTemplate ? courseEligibility(tasks, course, e, s.id) : null;
        return (
          <div key={e.id} className="card rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div><div className="text-[16px]" style={{ fontWeight: 700 }}>{s.name}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{course?.title} · {e.completedModuleIds.length}/{course?.modules.length || 8} modules</div></div>
              {hasTemplate ? (
                elig.held
                  ? <span className="f-code text-[11px] px-3 py-1.5 rounded-full" style={{ background: "#F7E6D8", color: "#B2572B" }}>ON HOLD</span>
                  : elig.eligible
                    ? <span className="f-code text-[11px] px-3 py-1.5 rounded-full" style={{ background: "#E4F3E9", color: "#2F7D4F" }}>AUTO-ISSUED — ELIGIBLE</span>
                    : <span className="f-code text-[11px] px-3 py-1.5 rounded-full" style={{ background: "#F0E7D6", color: "#71675A" }}>NOT YET ELIGIBLE · {elig.coursePct}% course, capstone {elig.capstone.label}</span>
              ) : (
                <div className="flex items-center gap-2"><label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer flex items-center gap-1.5" style={{ fontWeight: 600 }}><UploadCloud size={14} /> {e.certificateFile ? "Replace file" : "Upload certificate"}<input type="file" onChange={(ev) => upload(s.id, e.id, ev)} style={{ display: "none" }} /></label><button disabled={!e.certificateFile} onClick={() => toggle(s.id, e.id)} className={e.certificateReady ? "btn-soft" : "btn-primary"} style={{ borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 700, opacity: !e.certificateFile ? 0.4 : 1 }}>{e.certificateReady ? "Ready — Revoke" : "Mark ready & assign"}</button></div>
              )}
            </div>
            {hasTemplate && (
              <div className="flex items-center gap-4 flex-wrap pt-3" style={{ borderTop: "1px solid #E7DEC9" }}>
                <label className="flex items-center gap-2 text-[13px] cursor-pointer shrink-0" style={{ fontWeight: 600 }}>
                  <input type="checkbox" checked={!!e.certificateHeld} onChange={() => toggleHold(s.id, e.id)} />
                  Hold this certificate back
                </label>
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="f-label text-[11px] shrink-0" style={{ color: "#A79B84" }}>NAME ON CERTIFICATE</span>
                  <input className="input-field rounded-lg px-3 py-1.5 text-[13px] flex-1 min-w-0" value={e.certificateName ?? s.name} onChange={(ev) => saveCertName(s.id, e.id, ev.target.value)} placeholder={s.name} />
                </div>
              </div>
            )}
          </div>
        );
      })}</div>
    </>
  );
}
// Same drag-to-place pattern as the ID card template -- a photo frame
// (position + size) plus two single-line fields (name, student ID) and
// one multi-line field (the quote, which also needs a size since it has
// to wrap and shrink to fit rather than sit at one fixed point).
function TestimonialTemplateEditor({ template, onSave, onClose }) {
  const [file, setFile] = useState(template?.file || null);
  const [photoBox, setPhotoBox] = useState(template?.photoBox || { xPct: 27, yPct: 30, widthPct: 36, heightPct: 40 });
  const [namePos, setNamePos] = useState(template?.namePos || { xPct: 10, yPct: 68 });
  const [idPos, setIdPos] = useState(template?.idPos || { xPct: 10, yPct: 74 });
  const [quoteBox, setQuoteBox] = useState(template?.quoteBox || { xPct: 55, yPct: 82, widthPct: 80, heightPct: 28 });
  const [fontSizePct, setFontSizePct] = useState(template?.fontSizePct || 3);
  const [quoteFontSizePct, setQuoteFontSizePct] = useState(template?.quoteFontSizePct || 2.2);
  const boxRef = useRef(null);
  const draggingRef = useRef(null);
  const setters = { photo: setPhotoBox, name: setNamePos, id: setIdPos, quote: setQuoteBox };
  function onFilePick(e) { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setFile({ name: f.name, dataUrl: r.result }); r.readAsDataURL(f); }
  function posFromEvent(e) {
    const rect = boxRef.current.getBoundingClientRect();
    return { xPct: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)), yPct: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)) };
  }
  function onDrag(e) {
    const key = draggingRef.current;
    if (!key) return;
    setters[key]((prev) => ({ ...prev, ...posFromEvent(e) }));
  }
  const markers = [{ key: "name", label: "Name", pos: namePos, sample: "Jane Doe", weight: 700 }, { key: "id", label: "Student ID", pos: idPos, sample: "FJ/2026/001", weight: 500 }];
  return (
    <div className="card rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4"><div className="text-[15px]" style={{ fontWeight: 700 }}>Testimonial card template</div><button onClick={onClose}><X size={16} color="#A79B84" /></button></div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}><UploadCloud size={14} /> {file ? "Replace template image" : "Upload template image"}<input type="file" accept="image/*" onChange={onFilePick} style={{ display: "none" }} /></label>
        {file && <button onClick={() => setFile(null)} className="rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 600, color: "#B04A3A", border: "1px solid #E7DEC9" }}><Trash2 size={14} /> Delete image</button>}
      </div>
      {file && (
        <>
          <div className="text-[12px] mb-2" style={{ color: "#71675A" }}>Drag the photo frame, the name, the Student ID, and the quote box to where each should sit.</div>
          <div
            ref={boxRef}
            onPointerMove={onDrag}
            onPointerUp={() => { draggingRef.current = null; }}
            onPointerLeave={() => { draggingRef.current = null; }}
            className="relative rounded-xl overflow-hidden mb-4"
            style={{ border: "1px solid #E7DEC9", touchAction: "none", containerType: "inline-size" }}
          >
            <img src={file.dataUrl} alt="" style={{ display: "block", width: "100%" }} draggable={false} />
            <div
              onPointerDown={(e) => { e.preventDefault(); draggingRef.current = "photo"; setPhotoBox((b) => ({ ...b, ...posFromEvent(e) })); }}
              style={{ position: "absolute", left: `${photoBox.xPct}%`, top: `${photoBox.yPct}%`, width: `${photoBox.widthPct}%`, height: `${photoBox.heightPct}%`, transform: "translate(-50%,-50%)", border: "2px dashed var(--accent)", background: "color-mix(in srgb, var(--accent) 12%, transparent)", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><span className="f-code text-[10px]" style={{ color: "var(--accent)", fontWeight: 700 }}>PHOTO</span></div>
            <div
              onPointerDown={(e) => { e.preventDefault(); draggingRef.current = "quote"; setQuoteBox((b) => ({ ...b, ...posFromEvent(e) })); }}
              style={{ position: "absolute", left: `${quoteBox.xPct}%`, top: `${quoteBox.yPct}%`, width: `${quoteBox.widthPct}%`, height: `${quoteBox.heightPct}%`, transform: "translate(-50%,-50%)", border: "2px dashed #7A2E3B", background: "rgba(122,46,59,.08)", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><span className="f-code text-[10px]" style={{ color: "#7A2E3B", fontWeight: 700 }}>QUOTE</span></div>
            {markers.map((m) => (
              <div
                key={m.key}
                onPointerDown={(e) => { e.preventDefault(); draggingRef.current = m.key; setters[m.key]((prev) => ({ ...prev, ...posFromEvent(e) })); }}
                style={{ position: "absolute", left: `${m.pos.xPct}%`, top: `${m.pos.yPct}%`, transform: "translate(0,-50%)", fontFamily: "Georgia, serif", fontWeight: m.weight, fontSize: `${fontSizePct}cqw`, color: "#1B2A4A", cursor: "grab", whiteSpace: "nowrap", padding: "2px 6px" }}
              >{m.sample}</div>
            ))}
          </div>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Name / ID text size</div><input type="range" min={1.5} max={6} step={0.25} value={fontSizePct} onChange={(e) => setFontSizePct(Number(e.target.value))} style={{ width: "100%" }} /></label>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Quote text size</div><input type="range" min={1} max={7} step={0.1} value={quoteFontSizePct} onChange={(e) => setQuoteFontSizePct(Number(e.target.value))} style={{ width: "100%" }} /><div className="text-[11px] mt-1" style={{ color: "#A79B84" }}>If a quote is long, it still shrinks to fit the quote box above -- so widening or heightening that box also helps the text sit larger.</div></label>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Photo frame width</div><input type="range" min={10} max={70} step={1} value={photoBox.widthPct} onChange={(e) => setPhotoBox((b) => ({ ...b, widthPct: Number(e.target.value) }))} style={{ width: "100%" }} /></label>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Photo frame height</div><input type="range" min={10} max={90} step={1} value={photoBox.heightPct} onChange={(e) => setPhotoBox((b) => ({ ...b, heightPct: Number(e.target.value) }))} style={{ width: "100%" }} /></label>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Quote box width</div><input type="range" min={20} max={95} step={1} value={quoteBox.widthPct} onChange={(e) => setQuoteBox((b) => ({ ...b, widthPct: Number(e.target.value) }))} style={{ width: "100%" }} /></label>
          <label className="block mb-4"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Quote box height</div><input type="range" min={10} max={80} step={1} value={quoteBox.heightPct} onChange={(e) => setQuoteBox((b) => ({ ...b, heightPct: Number(e.target.value) }))} style={{ width: "100%" }} /></label>
        </>
      )}
      <div className="flex items-center gap-4">
        <button disabled={!file} onClick={() => onSave({ file, photoBox, namePos, idPos, quoteBox, fontSizePct, quoteFontSizePct })} className="btn-primary rounded-lg px-5 py-2.5 text-[13px] disabled:opacity-40">Save template</button>
        {template && <button onClick={() => onSave(null)} className="text-[13px]" style={{ color: "#B04A3A" }}>Remove template</button>}
      </div>
    </div>
  );
}
// Renders the actual composited card for one testimonial row, so what's
// shown in the admin list is exactly what the landing page will show --
// never a separate approximation of it.
function TestimonialThumb({ template, testimonial }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!template) return;
    let cancelled = false; let objectUrl = null;
    renderTestimonialCard(template.file.dataUrl, testimonial.photo?.dataUrl || null, {
      name: testimonial.name, studentId: testimonial.studentId, quote: testimonial.quote,
      photoBox: template.photoBox, namePos: template.namePos, idPos: template.idPos, quoteBox: template.quoteBox,
      fontSizePct: template.fontSizePct, quoteFontSizePct: template.quoteFontSizePct, photoZoom: testimonial.photoZoom,
    }).then((u) => { if (cancelled) { URL.revokeObjectURL(u); return; } objectUrl = u; setUrl(u); }).catch((e) => console.error("renderTestimonialCard failed", e));
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [template, testimonial.photo?.dataUrl, testimonial.name, testimonial.studentId, testimonial.quote, testimonial.photoZoom]);
  if (!template) return null;
  return url ? <img src={url} alt="" style={{ width: 90, borderRadius: 8, border: "1px solid #E7DEC9" }} /> : <div className="rounded-lg" style={{ width: 90, height: 60, background: "#F0E7D6" }} />;
}
function TestimonialForm({ students, cohorts, courses, template, initial, onSave, onClose }) {
  const [linkedStudentId, setLinkedStudentId] = useState(initial?.linkedStudentId || "");
  const [name, setName] = useState(initial?.name || "");
  const [studentId, setStudentId] = useState(initial?.studentId || "");
  const [cohort, setCohort] = useState(initial?.cohort || "");
  const [programme, setProgramme] = useState(initial?.programme || "");
  const [quote, setQuote] = useState(initial?.quote || "");
  const [photo, setPhoto] = useState(initial?.photo || null);
  const [photoZoom, setPhotoZoom] = useState(initial?.photoZoom || 1);
  const [previewUrl, setPreviewUrl] = useState(null);
  function pickStudent(id) {
    setLinkedStudentId(id);
    if (!id) return;
    const s = students.find((x) => x.id === id);
    if (!s) return;
    setName(s.name); setStudentId(s.studentId); setPhoto(s.photo || null); setPhotoZoom(1);
    setCohort(cohorts.find((c) => c.id === s.cohortId)?.name || "");
    const course = courses.find((c) => s.enrollments.some((e) => e.courseId === c.id));
    setProgramme(course?.title || "");
  }
  function onPhotoPick(e) { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setPhoto({ name: f.name, dataUrl: r.result }); setPhotoZoom(1); }; r.readAsDataURL(f); }
  // A live preview of the real composited card, right here in the form --
  // so dragging the zoom slider shows exactly what the saved card will
  // look like instead of the admin having to save first to find out.
  useEffect(() => {
    if (!template) { setPreviewUrl(null); return; }
    let cancelled = false; let objectUrl = null;
    renderTestimonialCard(template.file.dataUrl, photo?.dataUrl || null, {
      name, studentId, quote, photoBox: template.photoBox, namePos: template.namePos, idPos: template.idPos, quoteBox: template.quoteBox,
      fontSizePct: template.fontSizePct, quoteFontSizePct: template.quoteFontSizePct, photoZoom,
    }).then((u) => { if (cancelled) { URL.revokeObjectURL(u); return; } objectUrl = u; setPreviewUrl(u); }).catch((e) => console.error("renderTestimonialCard failed", e));
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [template, photo?.dataUrl, name, studentId, quote, photoZoom]);
  const canSave = name.trim() && quote.trim();
  return (
    <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
      <SelectF label="Link to an existing student (optional) — fills in their name, photo and ID for you" value={linkedStudentId} onChange={(e) => pickStudent(e.target.value)} options={[{ value: "", label: "— Not a current student / fill in manually —" }, ...students.map((s) => ({ value: s.id, label: s.name }))]} />
      <div className="flex items-center gap-4">
        <div className="rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: 56, height: 56, background: "color-mix(in srgb, var(--accent) 14%, white)" }}>{photo ? <img src={photo.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle size={26} color="var(--accent)" />}</div>
        <label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}>{photo ? "Replace photo" : "Upload photo"}<input type="file" accept="image/*" onChange={onPhotoPick} style={{ display: "none" }} /></label>
      </div>
      {photo && <label className="block"><div className="f-label text-[12px] mb-1.5" style={{ color: "#71675A" }}>Photo zoom — leave as is, or zoom in a little</div><input type="range" min={1} max={2.5} step={0.05} value={photoZoom} onChange={(e) => setPhotoZoom(Number(e.target.value))} style={{ width: "100%" }} /></label>}
      {template && (
        <div className="self-start">
          <div className="f-label text-[10px] mb-1.5" style={{ color: "#A79B84" }}>LIVE PREVIEW</div>
          {previewUrl ? <img src={previewUrl} alt="" style={{ width: 160, borderRadius: 8, border: "1px solid #E7DEC9", display: "block" }} /> : <div className="rounded-lg" style={{ width: 160, height: 110, background: "#F0E7D6" }} />}
        </div>
      )}
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Student ID (shown on the card)" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="FJ/2026/001" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cohort" value={cohort} onChange={(e) => setCohort(e.target.value)} />
        <Field label="Programme" value={programme} onChange={(e) => setProgramme(e.target.value)} />
      </div>
      <TextArea label="Quote" value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} />
      <div className="flex gap-3 mt-1">
        <button disabled={!canSave} onClick={() => onSave({ linkedStudentId: linkedStudentId || null, name, studentId, cohort, programme, quote, photo, photoZoom })} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] disabled:opacity-40">Save testimonial</button>
        <button onClick={onClose} className="text-[14px]" style={{ color: "#A79B84" }}>Cancel</button>
      </div>
    </div>
  );
}
export function TestimonialsTab({ testimonials, setTestimonials, students, cohorts, courses, brand, setBrand }) {
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const template = brand.testimonialTemplate;
  function saveTemplate(t) { setBrand((b) => ({ ...b, testimonialTemplate: t })); setEditingTemplate(false); }
  function add(data) { setTestimonials((prev) => [...prev, { id: "te" + Date.now(), published: true, ...data }]); setShowAdd(false); }
  function save(id, data) { setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t)); setEditingId(null); }
  function remove(id) { setTestimonials((prev) => prev.filter((t) => t.id !== id)); }
  function togglePublished(id) { setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, published: !(t.published !== false) } : t)); }
  const editing = editingId ? testimonials.find((t) => t.id === editingId) : null;
  return (
    <>
      <SectionHeader eyebrow="LANDING PAGE" title="Testimonials" />
      <div className="card rounded-2xl p-8 max-w-[560px] mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><div className="f-label text-[12px] mb-1" style={{ color: "#71675A" }}>TESTIMONIAL CARD</div><div className="text-[13px]" style={{ color: "#71675A" }}>{template ? "Template set — testimonials show as styled cards on the landing page." : "No template yet — testimonials show as plain text until one's uploaded."}</div></div>
          <button onClick={() => setEditingTemplate((s) => !s)} className="btn-soft rounded-full px-4 py-2 text-[13px]" style={{ fontWeight: 600 }}>{template ? "Edit template" : "Set up template"}</button>
        </div>
        {editingTemplate && <div className="mt-5"><TestimonialTemplateEditor template={template} onSave={saveTemplate} onClose={() => setEditingTemplate(false)} /></div>}
      </div>
      {showAdd ? (
        <TestimonialForm students={students} cohorts={cohorts} courses={courses} template={template} onSave={add} onClose={() => setShowAdd(false)} />
      ) : (
        <button onClick={() => setShowAdd(true)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5 mb-6"><Plus size={16} /> Add testimonial</button>
      )}
      <div className="flex flex-col gap-3">{testimonials.map((t) => editingId === t.id ? (
        <TestimonialForm key={t.id} students={students} cohorts={cohorts} courses={courses} template={template} initial={editing} onSave={(data) => save(t.id, data)} onClose={() => setEditingId(null)} />
      ) : (
        <div key={t.id} className="card rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <TestimonialThumb template={template} testimonial={t} />
            <div><div className="text-[15px] mb-1" style={{ fontWeight: 700 }}>{t.name}</div><div className="f-code text-[11px] mb-1.5" style={{ color: "#A79B84" }}>{[t.studentId, t.cohort, t.programme].filter(Boolean).join(" · ")}</div><div className="text-[14px]" style={{ color: "#4A4237", fontStyle: "italic" }}>"{t.quote}"</div></div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* On = shows on the public landing page; off keeps it saved
                here but hidden from visitors -- lets testimonials be
                prepared ahead of time or pulled without deleting them. */}
            <label className="flex items-center gap-2 cursor-pointer" title={t.published !== false ? "Showing on the landing page" : "Hidden from the landing page"}>
              <span className="f-code text-[10px]" style={{ color: t.published !== false ? "#2F7D4F" : "#A79B84" }}>{t.published !== false ? "LIVE" : "HIDDEN"}</span>
              <button onClick={() => togglePublished(t.id)} className="rounded-full shrink-0" style={{ width: 36, height: 21, background: t.published !== false ? "#4E7D5C" : "#E7DEC9", position: "relative", transition: "background .15s" }}>
                <span style={{ position: "absolute", top: 2, left: t.published !== false ? 17 : 2, width: 17, height: 17, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
              </button>
            </label>
            <button onClick={() => setEditingId(t.id)}><Pencil size={15} color="var(--accent)" /></button><button onClick={() => remove(t.id)}><Trash2 size={15} color="#B04A3A" /></button>
          </div>
        </div>
      ))}</div>
    </>
  );
}
export function EditTQ({ item, onSave, onCancel }) {
  const [a, setA] = useState(item.name || item.q); const [b, setB] = useState(item.quote || item.a);
  return <div className="card rounded-xl p-5 flex flex-col gap-3"><Field label="Field 1" value={a} onChange={(e) => setA(e.target.value)} /><TextArea label="Field 2" value={b} onChange={(e) => setB(e.target.value)} /><div className="flex gap-3"><button onClick={() => onSave(item.id, a, b)} className="btn-primary rounded-lg px-4 py-2 text-[13px]">Save</button><button onClick={onCancel} className="text-[13px]" style={{ color: "#A79B84" }}>Cancel</button></div></div>;
}
export function FaqTab({ faqs, setFaqs }) {
  const [q, setQ] = useState(""); const [a, setA] = useState(""); const [editingId, setEditingId] = useState(null);
  function add() { if (!q || !a) return; setFaqs((prev) => [...prev, { id: "f" + Date.now(), q, a }]); setQ(""); setA(""); }
  function save(id, nq, na) { setFaqs((prev) => prev.map((f) => f.id === id ? { ...f, q: nq, a: na } : f)); setEditingId(null); }
  function remove(id) { setFaqs((prev) => prev.filter((f) => f.id !== id)); }
  return (
    <>
      <SectionHeader eyebrow="LANDING PAGE" title="FAQ" />
      <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3"><Field label="Question" value={q} onChange={(e) => setQ(e.target.value)} /><TextArea label="Answer" value={a} onChange={(e) => setA(e.target.value)} /><button onClick={add} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] self-start">Add FAQ</button></div>
      <div className="flex flex-col gap-3">{faqs.map((f) => editingId === f.id ? <EditTQ key={f.id} item={f} onSave={(id, a2, b2) => save(id, a2, b2)} onCancel={() => setEditingId(null)} /> : <div key={f.id} className="card rounded-xl p-5 flex items-start justify-between gap-4"><div><div className="text-[15px] mb-1" style={{ fontWeight: 700 }}>{f.q}</div><div className="text-[14px]" style={{ color: "#4A4237" }}>{f.a}</div></div><div className="flex gap-3 shrink-0"><button onClick={() => setEditingId(f.id)}><Pencil size={15} color="var(--accent)" /></button><button onClick={() => remove(f.id)}><Trash2 size={15} color="#B04A3A" /></button></div></div>)}</div>
    </>
  );
}

export function AdminChatTab({ students, directThreads, setDirectThreads }) {
  const [activeId, setActiveId] = useState(null); const [msg, setMsg] = useState("");
  const key = activeId ? pairKey("admin", activeId) : null; const thread = key ? (directThreads[key] || []) : [];
  function send() { if (!msg.trim() || !key) return; setDirectThreads((p) => ({ ...p, [key]: [...(p[key] || []), { from: "admin", text: msg, at: Date.now() }] })); setMsg(""); }
  return (
    <>
      <SectionHeader eyebrow="TALK TO STUDENTS" title="Chat" />
      <div className="card rounded-2xl flex" style={{ height: 480 }}>
        <div className="w-[140px] sm:w-[220px] shrink-0 overflow-y-auto" style={{ borderRight: "1px solid #E7DEC9" }}>{students.map((s) => { const unread = (directThreads[pairKey("admin", s.id)] || []).filter((m) => m.from !== "admin").length; return <button key={s.id} onClick={() => setActiveId(s.id)} className="w-full text-left px-5 py-3.5 text-[14px] flex items-center justify-between" style={{ background: activeId === s.id ? "color-mix(in srgb, var(--accent) 14%, white)" : "transparent", fontWeight: activeId === s.id ? 700 : 500 }}>{s.name}{unread > 0 && <span className="f-code text-[9px] rounded-full px-1.5 py-0.5" style={{ background: "var(--accent)", color: "#FAF6EC" }}>{unread}</span>}</button>; })}</div>
        <div className="flex-1 flex flex-col min-w-0">{!activeId ? <div className="flex-1 flex items-center justify-center text-[14px]" style={{ color: "#A79B84" }}>Select a conversation to open it.</div> : <><div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">{thread.map((m, i) => <div key={i} className="max-w-[75%] px-4 py-2.5 rounded-xl text-[14px]" style={{ alignSelf: m.from === "admin" ? "flex-end" : "flex-start", background: m.from === "admin" ? "var(--accent)" : "#F0E7D6", color: m.from === "admin" ? "#FAF6EC" : "#262019" }}>{m.text}</div>)}</div><div className="flex items-center gap-2 p-4" style={{ borderTop: "1px solid #E7DEC9" }}><input className="input-field rounded-full px-4 py-2.5 flex-1 min-w-0" placeholder="Reply…" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} /><button onClick={send} className="btn-primary rounded-full p-2.5 shrink-0"><Send size={16} /></button></div></>}</div>
      </div>
    </>
  );
}
export function AdminCommunityTab({ community, setCommunity, students, cohorts }) {
  const [cohortId, setCohortId] = useState("all");
  const scopedStudents = cohortId === "all" ? students : students.filter((s) => s.cohortId === cohortId);
  return (
    <>
      <div className="flex items-center gap-2 mb-4"><span className="f-label text-[11px]" style={{ color: "#A79B84" }}>VIEWING</span><SelectF value={cohortId} onChange={(e) => setCohortId(e.target.value)} options={[{ value: "all", label: "All cohorts" }, ...cohorts.map((c) => ({ value: c.id, label: c.name }))]} /></div>
      <CommunityPanel community={community} setCommunity={setCommunity} authorName="Fidelia" allStudents={scopedStudents} cohortId={cohortId} />
    </>
  );
}
export function AdminNoticeTab({ notices, setNotices, cohorts, students }) {
  const [noticeMsg, setNoticeMsg] = useState(""); const [cohortId, setCohortId] = useState("all"); const [openSeenId, setOpenSeenId] = useState(null);
  function post() { if (!noticeMsg.trim()) return; setNotices((p) => [...p, { id: "n" + Date.now(), text: noticeMsg, cohortId, seenBy: [] }]); setNoticeMsg(""); }
  return (
    <>
      <SectionHeader eyebrow="ONE-WAY BROADCAST" title="Notice Board" />
      <div className="card rounded-2xl p-6">
        <div className="flex gap-2 mb-3"><SelectF value={cohortId} onChange={(e) => setCohortId(e.target.value)} options={[{ value: "all", label: "All cohorts" }, ...cohorts.map((c) => ({ value: c.id, label: c.name }))]} /></div>
        <div className="flex gap-2 mb-5"><input className="input-field rounded-lg px-4 py-2.5" placeholder="Post to the whole cohort…" value={noticeMsg} onChange={(e) => setNoticeMsg(e.target.value)} /><button onClick={post} className="btn-primary rounded-lg px-5 text-[14px] shrink-0">Post</button></div>
        <div className="flex flex-col gap-3">{[...notices].reverse().map((a) => {
          const seenStudents = (a.seenBy || []).map((sid) => students.find((s) => s.id === sid)).filter(Boolean);
          return (
            <div key={a.id} className="rounded-xl p-4 text-[15px]" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
              {a.text}
              <div className="flex items-center justify-between mt-2">
                <div className="f-code text-[9px]" style={{ color: "#A79B84" }}>{a.cohortId === "all" ? "ALL COHORTS" : cohorts.find((c) => c.id === a.cohortId)?.name.toUpperCase()}</div>
                <button onClick={() => setOpenSeenId(openSeenId === a.id ? null : a.id)} className="f-label text-[10px] accent-text flex items-center gap-1"><Eye size={11} /> {seenStudents.length} seen</button>
              </div>
              {openSeenId === a.id && (
                <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px dashed #E7DEC9" }}>
                  {seenStudents.length === 0 ? <span className="text-[12px]" style={{ color: "#A79B84" }}>No one yet.</span> : seenStudents.map((s) => <span key={s.id} className="f-code text-[10px] px-2 py-1 rounded-full tint-badge">{s.name}</span>)}
                </div>
              )}
            </div>
          );
        })}</div>
      </div>
    </>
  );
}
export function BrandingTab({ brand, setBrand }) {
  const [editingIdCard, setEditingIdCard] = useState(false);
  const swatches = [{ n: "Deep sky", v: "#1C6FA0" }, { n: "Slate teal", v: "#2E7D6B" }, { n: "Plum", v: "#6E4C6B" }, { n: "Burgundy", v: "#7A2E3B" }, { n: "Forest", v: "#2F5233" }, { n: "Amber", v: "#B8752E" }, { n: "Charcoal blue", v: "#2C3E50" }, { n: "Rose", v: "#A65065" }, { n: "Ink violet", v: "#4B3F72" }, { n: "Clay", v: "#9C5A3C" }];
  function saveIdCardTemplate(t) { setBrand((b) => ({ ...b, idCardTemplate: t })); setEditingIdCard(false); }
  return (
    <>
      <SectionHeader eyebrow="WHITE-LABEL" title="Branding" />
      <div className="card rounded-2xl p-8 max-w-[560px]"><Field label="Platform name" value={brand.name} onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))} /><div className="mt-6"><div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>ACCENT COLOR</div><div className="flex items-center gap-3 flex-wrap">{swatches.map((s) => <button key={s.v} title={s.n} onClick={() => setBrand((b) => ({ ...b, accent: s.v }))} className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: s.v, border: brand.accent === s.v ? "3px solid #262019" : "3px solid transparent" }}>{brand.accent === s.v && <Check size={16} color="#FAF6EC" />}</button>)}<input type="color" value={brand.accent} onChange={(e) => setBrand((b) => ({ ...b, accent: e.target.value }))} style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer" }} /></div></div></div>
      <div className="card rounded-2xl p-8 max-w-[560px] mt-6">
        <div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>CONTACT LINKS — shown on the public site footer and "Still have questions?" section</div>
        <div className="flex flex-col gap-4">
          <Field label="Contact email" value={brand.email} onChange={(e) => setBrand((b) => ({ ...b, email: e.target.value }))} placeholder="you@example.com" />
          <Field label="WhatsApp number (digits only, country code, no + or spaces)" value={brand.whatsapp} onChange={(e) => setBrand((b) => ({ ...b, whatsapp: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="2348135793935" />
          <Field label="Instagram handle (no @)" value={brand.instagram} onChange={(e) => setBrand((b) => ({ ...b, instagram: e.target.value.replace(/^@/, "") }))} placeholder="yourhandle" />
          <Field label="Twitter / X handle (no @)" value={brand.twitter} onChange={(e) => setBrand((b) => ({ ...b, twitter: e.target.value.replace(/^@/, "") }))} placeholder="yourhandle" />
        </div>
      </div>
      <div className="card rounded-2xl p-8 max-w-[560px] mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><div className="f-label text-[12px] mb-1" style={{ color: "#71675A" }}>STUDENT ID CARD</div><div className="text-[13px]" style={{ color: "#71675A" }}>{brand.idCardTemplate ? "Template set — students generate their own card from inside each course." : "No template yet — upload one so students can generate their ID card."}</div></div>
          <button onClick={() => setEditingIdCard((s) => !s)} className="btn-soft rounded-full px-4 py-2 text-[13px]" style={{ fontWeight: 600 }}>{brand.idCardTemplate ? "Edit template" : "Set up template"}</button>
        </div>
        {editingIdCard && <div className="mt-5"><IdCardTemplateEditor template={brand.idCardTemplate} onSave={saveIdCardTemplate} onClose={() => setEditingIdCard(false)} /></div>}
      </div>
    </>
  );
}
export function AdminProfileTab({ adminProfile, setAdminProfile }) {
  const [name, setName] = useState(adminProfile.name); const [photo, setPhoto] = useState(adminProfile.photo); const [bio, setBio] = useState(adminProfile.bio || "");
  const [saved, setSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  function onPhotoPick(e) { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f); } }
  function save() { setAdminProfile((p) => ({ ...p, name, photo, bio })); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function copySignupLink() {
    navigator.clipboard?.writeText(window.location.origin).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); });
  }
  return (
    <>
      <SectionHeader eyebrow="YOUR PROFILE" title="My Profile" />
      <div className="card rounded-2xl p-6 max-w-[520px] mb-6">
        <div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>YOUR SIGN-UP LINK</div>
        <div className="text-[13px] mb-4" style={{ color: "#71675A" }}>Share this with anyone applying to a course — it opens your site, where they sign up and apply themselves.</div>
        <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 flex-wrap" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>
          <span className="text-[13px] f-code" style={{ color: "var(--accent)", fontWeight: 700, wordBreak: "break-all" }}>{window.location.origin}</span>
          <button onClick={copySignupLink} className="btn-soft rounded-full px-4 py-2 text-[12px] shrink-0" style={{ fontWeight: 700 }}>{linkCopied ? "Copied!" : "Copy link"}</button>
        </div>
      </div>
      <div className="card rounded-2xl p-8 max-w-[520px]">
        <div className="flex items-center gap-5 mb-6"><div className="rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: 76, height: 76, background: "color-mix(in srgb, var(--accent) 14%, white)" }}>{photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle size={34} color="var(--accent)" />}</div><label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}>Change photo<input type="file" accept="image/*" onChange={onPhotoPick} style={{ display: "none" }} /></label></div>
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-4"><TextArea label="Bio (shown on your landing page)" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
        <div className="flex items-center gap-3 mt-4"><button onClick={save} className="btn-primary rounded-lg px-6 py-2.5 text-[14px]">Save profile</button>{saved && <span className="text-[13px] accent-text" style={{ fontWeight: 700 }}>Saved.</span>}</div>
      </div>
      <div className="max-w-[520px]"><ChangePasswordCard email={ADMIN_EMAIL} /></div>
    </>
  );
}
export function GradebookTab({ students, courses, cohorts, tasks }) {
  const [cohortFilter, setCohortFilter] = useState("all");
  const scopedStudents = cohortFilter === "all" ? students : students.filter((s) => s.cohortId === cohortFilter);
  // Same courseEligibility the Certificates tab uses -- so a student held
  // back there (certificateHeld) never shows as eligible here either; the
  // two screens always agree on who's actually cleared to get a certificate.
  const rows = scopedStudents.flatMap((s) => s.enrollments.map((e) => {
    const c = courses.find((x) => x.id === e.courseId);
    const elig = c ? courseEligibility(tasks, c, e, s.id) : { eligible: false, coursePct: 0, capstone: capstoneStatus(tasks, e.courseId, s.id) };
    return { student: s.name, course: c?.title, coursePct: elig.coursePct, capstone: elig.capstone, eligible: elig.eligible };
  }));
  return (
    <>
      <SectionHeader eyebrow="ACCUMULATED SCORES" title="Gradebook" />
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => setCohortFilter("all")} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: cohortFilter === "all" ? "var(--accent)" : "#F0E7D6", color: cohortFilter === "all" ? "#FAF6EC" : "#71675A" }}>All cohorts</button>
        {cohorts.map((co) => <button key={co.id} onClick={() => setCohortFilter(co.id)} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: cohortFilter === co.id ? "var(--accent)" : "#F0E7D6", color: cohortFilter === co.id ? "#FAF6EC" : "#71675A" }}>{co.name}</button>)}
      </div>
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-5 px-6 py-3 f-label text-[11px]" style={{ background: "#F0E7D6", color: "#71675A" }}><div>STUDENT</div><div>COURSE</div><div>COURSE PROGRESS</div><div>CAPSTONE</div><div>ELIGIBILITY</div></div>
            {rows.map((r, i) => <div key={i} className="grid grid-cols-5 px-6 py-4 items-center text-[14px]" style={{ borderTop: "1px solid #F0E7D6" }}><div style={{ fontWeight: 700 }}>{r.student}</div><div>{r.course}</div><div>{r.coursePct}%</div><div>{r.capstone.label}</div><div>{r.eligible ? <span className="f-code text-[10px] px-2.5 py-1 rounded-full" style={{ background: "#E4F3E9", color: "#2F7D4F", fontWeight: 700 }}>ELIGIBLE</span> : <span className="f-code text-[10px] px-2.5 py-1 rounded-full" style={{ background: "#FBEAE7", color: "#B04A3A", fontWeight: 700 }}>INELIGIBLE</span>}</div></div>)}
          </div>
        </div>
        {rows.length === 0 && <div className="px-6 py-8 text-[13px]" style={{ color: "#A79B84" }}>No enrollments in this cohort yet.</div>}
      </div>
    </>
  );
}
export function OverviewTab({ courses, students, applicants, tasks, cohorts, setTab }) {
  const [cohortFilter, setCohortFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const activeCohort = cohortFilter === "all" ? null : cohorts.find((c) => c.id === cohortFilter);
  const filterCourses = activeCohort ? courses.filter((c) => activeCohort.courseIds.includes(c.id)) : courses;
  useEffect(() => { if (courseFilter !== "all" && !filterCourses.some((c) => c.id === courseFilter)) setCourseFilter("all"); }, [cohortFilter]);

  const scopedStudents = cohortFilter === "all" ? students : students.filter((s) => s.cohortId === cohortFilter);
  const scopedStudentIds = new Set(scopedStudents.map((s) => s.id));
  const scopedApplicants = (cohortFilter === "all" ? applicants : applicants.filter((a) => a.cohortId === cohortFilter)).filter((a) => courseFilter === "all" || a.courseId === courseFilter);
  const scopedEnrollments = (s) => s.enrollments.filter((e) => courseFilter === "all" || e.courseId === courseFilter);

  const pendingApplicants = scopedApplicants.filter((a) => a.status === "pending").length;
  const activeEnrollments = scopedStudents.reduce((n, s) => n + scopedEnrollments(s).filter((e) => e.status === "active").length, 0);
  const inReview = tasks.reduce((n, t) => n + Object.entries(t.submissions).filter(([sid, v]) => scopedStudentIds.has(sid) && v.status === "in review").length, 0);
  const completedTasks = tasks.reduce((n, t) => n + Object.entries(t.submissions).filter(([sid, v]) => scopedStudentIds.has(sid) && v.status === "approved").length, 0);
  // Each bar is one enrollment, not one student -- label with the course too
  // (as "First Name (COURSE)") so a student in two courses shows as two
  // clearly distinct bars instead of two identical, unlabeled ones.
  const progressData = scopedStudents.flatMap((s) => scopedEnrollments(s).map((e) => ({ name: `${s.name.split(" ")[0]} (${e.courseId.toUpperCase()})`, student: s.name, course: courses.find((c) => c.id === e.courseId)?.title || e.courseId, modules: e.completedModuleIds.length })));
  const recent = [...scopedApplicants.filter((a) => a.status === "pending").map((a) => ({ t: `${a.name} applied for a course` })), ...tasks.flatMap((t) => Object.entries(t.submissions).filter(([sid, v]) => scopedStudentIds.has(sid) && v.status === "in review").map(([sid]) => ({ t: `A submission for "${t.title}" is awaiting review` })))].slice(0, 6);
  return (
    <>
      <SectionHeader eyebrow="ADMIN OVERVIEW" title="Everything you're running." />
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button onClick={() => setCohortFilter("all")} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: cohortFilter === "all" ? "var(--accent)" : "#F0E7D6", color: cohortFilter === "all" ? "#FAF6EC" : "#71675A" }}>All cohorts</button>
        {cohorts.map((co) => <button key={co.id} onClick={() => setCohortFilter(co.id)} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: cohortFilter === co.id ? "var(--accent)" : "#F0E7D6", color: cohortFilter === co.id ? "#FAF6EC" : "#71675A" }}>{co.name}</button>)}
      </div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => setCourseFilter("all")} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: courseFilter === "all" ? "#4A4237" : "#F0E7D6", color: courseFilter === "all" ? "#FAF6EC" : "#71675A" }}>All courses</button>
        {filterCourses.map((c) => <button key={c.id} onClick={() => setCourseFilter(c.id)} className="f-label text-[11px] px-3.5 py-1.5 rounded-full" style={{ background: courseFilter === c.id ? "#4A4237" : "#F0E7D6", color: courseFilter === c.id ? "#FAF6EC" : "#71675A" }}>{c.title}</button>)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">{[{ label: "PENDING APPLICANTS", value: pendingApplicants }, { label: "ACTIVE ENROLLMENTS", value: activeEnrollments }, { label: "TASKS IN REVIEW", value: inReview }, { label: "TASKS COMPLETED", value: completedTasks }, { label: "COURSES LIVE", value: courses.filter((c) => c.status === "live").length }].map((s, i) => <div key={i} className="card rounded-2xl p-5"><div className="f-label text-[10px] mb-2" style={{ color: "#A79B84" }}>{s.label}</div><div className="f-display text-[26px] accent-text" style={{ fontWeight: 800 }}>{s.value}</div></div>)}</div>
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <div className="card rounded-2xl p-6 md:col-span-2">
          <div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>MODULES COMPLETED PER ENROLLMENT</div>
          {progressData.length === 0 && <div className="text-[14px]" style={{ color: "#A79B84" }}>No enrollments match this filter yet.</div>}
          {progressData.length > 0 && <div style={{ height: 220 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={progressData}><XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71675A" }} axisLine={{ stroke: "#E7DEC9" }} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: "#71675A" }} axisLine={false} tickLine={false} domain={[0, 8]} allowDecimals={false} /><Tooltip cursor={{ fill: "#F0E7D6" }} contentStyle={{ borderRadius: 10, border: "1px solid #E7DEC9", fontSize: 13 }} formatter={(value) => [`${value} modules`, "Completed"]} labelFormatter={(_, payload) => payload?.[0] ? `${payload[0].payload.student} — ${payload[0].payload.course}` : ""} /><Bar dataKey="modules" radius={[6, 6, 0, 0]}>{progressData.map((_, i) => <Cell key={i} fill="var(--accent)" />)}</Bar></BarChart></ResponsiveContainer></div>}
        </div>
        <div className="card rounded-2xl p-6"><div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>RECENT ACTIVITY</div>{recent.length === 0 && <div className="text-[14px]" style={{ color: "#A79B84" }}>All caught up.</div>}<div className="flex flex-col gap-3">{recent.map((r, i) => <div key={i} className="text-[14px] pb-3" style={{ borderBottom: i < recent.length - 1 ? "1px solid #F0E7D6" : "none", color: "#4A4237" }}>{r.t}</div>)}</div></div>
      </div>
      <button onClick={() => setTab("applicants")} className="card rounded-2xl p-6 w-full text-left flex items-center justify-between"><div><div className="f-display text-[19px]" style={{ fontWeight: 700 }}>Review new applicants</div><div className="text-[14px] mt-1" style={{ color: "#71675A" }}>{pendingApplicants} waiting on you.</div></div><ChevronRight size={18} color="#A79B84" /></button>
    </>
  );
}

// Owner-only (matches the RLS policies on team_members/team_activity) --
// AdminDashboard never shows this tab to a team member at all, regardless
// of their toggles, so there's no server-side check needed here too.
export function TeamTab() {
  const [members, setMembers] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState(""); const [newEmail, setNewEmail] = useState(""); const [newRole, setNewRole] = useState("Intern"); const [newRoleCustom, setNewRoleCustom] = useState("");
  const [addError, setAddError] = useState(""); const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  const [activityId, setActivityId] = useState(null);
  const [activity, setActivity] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => { fetchTeamMembers().then(setMembers).catch((e) => { console.error("fetchTeamMembers failed", e); setMembers([]); }); }, []);

  function copySignupLink() {
    navigator.clipboard?.writeText(`${window.location.origin}/?team=1`).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); });
  }
  async function submitAdd() {
    const roleLabel = newRole === "__custom__" ? newRoleCustom.trim() : newRole;
    if (!newName.trim() || !newEmail.trim() || !roleLabel) return;
    setAdding(true); setAddError("");
    try {
      const saved = await addTeamMember({ name: newName.trim(), email: newEmail.trim().toLowerCase(), roleLabel, permissions: [] });
      setMembers((prev) => [...prev, saved]);
      setNewName(""); setNewEmail(""); setNewRole("Intern"); setNewRoleCustom(""); setShowAdd(false);
    } catch (e) {
      console.error("addTeamMember failed", e);
      setAddError(e.message?.includes("duplicate") ? "That email is already on your team." : "Couldn't add them — check your connection and try again.");
    } finally { setAdding(false); }
  }
  async function removeMember(id) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try { await removeTeamMember(id); } catch (e) { console.error("removeTeamMember failed", e); }
  }
  function startEditPermissions(m) { setEditingId(m.id); setEditPermissions(m.permissions || []); setActivityId(null); }
  function togglePermission(id) { setEditPermissions((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }
  async function savePermissions() {
    const m = members.find((x) => x.id === editingId);
    try {
      const saved = await updateTeamMember(editingId, { name: m.name, roleLabel: m.roleLabel, permissions: editPermissions });
      setMembers((prev) => prev.map((x) => x.id === editingId ? saved : x));
      setEditingId(null);
    } catch (e) { console.error("updateTeamMember failed", e); }
  }
  async function openActivity(m) {
    setActivityId(m.id); setEditingId(null); setActivity([]);
    try { setActivity(await fetchTeamActivity(m.id)); } catch (e) { console.error("fetchTeamActivity failed", e); }
  }

  if (members === null) return <div className="text-[14px]" style={{ color: "#A79B84" }}>Loading…</div>;

  return (
    <>
      <SectionHeader eyebrow="MANAGE" title="Team" action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> Add team member</button>} />
      <div className="card rounded-2xl p-5 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ background: "color-mix(in srgb, var(--accent) 8%, white)" }}>
        <div><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>SIGN-UP LINK FOR YOUR TEAM</div><div className="text-[13px] f-code" style={{ color: "var(--accent)", fontWeight: 700, wordBreak: "break-all" }}>{window.location.origin}/?team=1</div></div>
        <button onClick={copySignupLink} className="btn-soft rounded-full px-4 py-2 text-[12px] shrink-0" style={{ fontWeight: 700 }}>{linkCopied ? "Copied!" : "Copy link"}</button>
      </div>

      {showAdd && (
        <div className="card rounded-2xl p-6 mb-6 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Their full name" />
            <Field label="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="them@email.com" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div style={{ maxWidth: 220 }}><SelectF label="Role label" value={newRole} onChange={(e) => setNewRole(e.target.value)} options={[{ value: "Intern", label: "Intern" }, { value: "Co-founder", label: "Co-founder" }, { value: "Content Strategist", label: "Content Strategist" }, { value: "Tech", label: "Tech" }, { value: "Team member", label: "Team member" }, { value: "__custom__", label: "Other (type your own)" }]} /></div>
            {newRole === "__custom__" && <div style={{ maxWidth: 220 }}><Field label="Custom role label" value={newRoleCustom} onChange={(e) => setNewRoleCustom(e.target.value)} placeholder="e.g. Social Media Manager" /></div>}
          </div>
          {addError && <div className="text-[13px]" style={{ color: "#B04A3A" }}>{addError}</div>}
          <button disabled={adding} onClick={submitAdd} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] self-start">{adding ? "Adding…" : "Add to team"}</button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {members.map((m) => (
          <div key={m.id} className="card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: "color-mix(in srgb, var(--accent) 14%, white)" }}>{m.photo ? <img src={m.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle size={22} color="var(--accent)" />}</div>
                <div><div className="text-[15px]" style={{ fontWeight: 700 }}>{m.name} <span className="f-code text-[10px] tint-badge px-2 py-0.5 rounded-full ml-1">{m.roleLabel}</span></div><div className="text-[13px] mt-0.5" style={{ color: "#71675A" }}>{m.email}</div>{m.bio && <div className="text-[12.5px] mt-1" style={{ color: "#A79B84" }}>{m.bio}</div>}</div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => startEditPermissions(m)} className="text-[12.5px]" style={{ color: "var(--accent)", fontWeight: 700 }}>{editingId === m.id ? "Hide" : "Edit access"}</button>
                <button onClick={() => openActivity(m)} className="text-[12.5px]" style={{ color: "var(--accent)", fontWeight: 700 }}>{activityId === m.id ? "Hide" : "Activity"}</button>
                <button onClick={() => removeMember(m.id)} className="text-[12.5px]" style={{ color: "#B04A3A", fontWeight: 700 }}>Remove</button>
              </div>
            </div>
            {editingId === m.id && (
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid #F0E7D6" }}>
                <div className="flex flex-col">
                  {TEAM_PERMISSION_TABS.map((group) => (
                    <div key={group.group}>
                      <div className="f-label text-[10.5px] mt-3 mb-1" style={{ color: "#A79B84" }}>{group.group.toUpperCase()}</div>
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #F0E7D6" }}>
                          <span className="text-[13.5px]">{item.label}</span>
                          <button onClick={() => togglePermission(item.id)} className="rounded-full" style={{ width: 38, height: 22, background: editPermissions.includes(item.id) ? "#4E7D5C" : "#E7DEC9", position: "relative", transition: "background .15s" }}>
                            <span style={{ position: "absolute", top: 2, left: editPermissions.includes(item.id) ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <button onClick={savePermissions} className="btn-primary rounded-lg px-5 py-2 text-[13px] mt-4">Save access</button>
              </div>
            )}
            {activityId === m.id && (
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid #F0E7D6" }}>
                {activity.length === 0 && <div className="text-[13px]" style={{ color: "#A79B84" }}>No activity yet.</div>}
                <div className="flex flex-col">
                  {activity.map((a) => (
                    <div key={a.id} className="py-2.5" style={{ borderBottom: "1px solid #F0E7D6" }}>
                      <div className="text-[13.5px]">{a.action}</div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: "#A79B84" }}>{new Date(a.created_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {members.length === 0 && !showAdd && <div className="card rounded-2xl p-8 text-center text-[14px]" style={{ color: "#A79B84" }}>No teammates yet — click "Add team member" to invite your first one.</div>}
      </div>
    </>
  );
}

// A team member's own account screen -- password change plus their own
// photo/bio (separate from AdminProfileTab, which is the owner's
// public-facing profile and doesn't apply to a teammate).
export function TeamAccountTab({ teamAccess, onUpdate }) {
  const [photo, setPhoto] = useState(teamAccess.photo); const [bio, setBio] = useState(teamAccess.bio || "");
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  function onPhotoPick(e) { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f); } }
  async function save() {
    setSaving(true);
    try {
      await updateMyTeamProfile({ photo, bio });
      onUpdate?.({ photo, bio });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error("updateMyTeamProfile failed", e); }
    finally { setSaving(false); }
  }
  return (
    <>
      <SectionHeader eyebrow="YOUR ACCOUNT" title={teamAccess.name} />
      <div className="text-[14px] mb-6" style={{ color: "#71675A" }}>Signed in as <strong>{teamAccess.roleLabel}</strong>.</div>
      <div className="card rounded-2xl p-8 max-w-[520px] mb-6">
        <div className="flex items-center gap-5 mb-6"><div className="rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: 76, height: 76, background: "color-mix(in srgb, var(--accent) 14%, white)" }}>{photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle size={34} color="var(--accent)" />}</div><label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer" style={{ fontWeight: 600 }}>Change photo<input type="file" accept="image/*" onChange={onPhotoPick} style={{ display: "none" }} /></label></div>
        <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        <div className="flex items-center gap-3 mt-4"><button disabled={saving} onClick={save} className="btn-primary rounded-lg px-6 py-2.5 text-[14px]">{saving ? "Saving…" : "Save profile"}</button>{saved && <span className="text-[13px] accent-text" style={{ fontWeight: 700 }}>Saved.</span>}</div>
      </div>
      <div className="max-w-[520px]"><ChangePasswordCard email={teamAccess.email} /></div>
    </>
  );
}

export function AdminDashboard({ courses, setCourses, students, setStudents, onRemoveStudent, applicants, setApplicants, onRemoveApplicant, onAcceptApplicant, cohorts, setCohorts, tasks, setTasks, resources, onAddResource, onEditResource, onRemoveResource, community, setCommunity, notices, setNotices, directThreads, setDirectThreads, testimonials, setTestimonials, faqs, setFaqs, brand, setBrand, adminProfile, setAdminProfile, onExit, onViewSite, notifItems, notifSeen, onMarkSeen, teamAccess, onSwitchToStudent, onUpdateTeamAccess }) {
  const allNavItems = [
    { id: "overview", icon: Sparkles, label: "Overview" }, { id: "profile", icon: UserCircle, label: "My Profile" }, { id: "applicants", icon: ClipboardCheck, label: "Applicants" },
    { id: "cohorts", icon: Layers, label: "Cohorts" }, { id: "courses", icon: BookOpen, label: "Courses" },
    { id: "meetings", icon: PlayCircle, label: "Virtual Meetings" },
    { id: "students", icon: Users, label: "Students" }, { id: "gradebook", icon: FileText, label: "Gradebook" },
    { id: "tasks", icon: ListChecks, label: "Tasks" }, { id: "library", icon: Library, label: "Library" },
    { id: "certificates", icon: Award, label: "Certificates" }, { id: "testimonials", icon: Star, label: "Testimonials" },
    { id: "faq", icon: HelpIcon, label: "FAQ" }, { id: "chat", icon: MessageCircle, label: "Chat" },
    { id: "community", icon: Users, label: "Community" }, { id: "notice", icon: Megaphone, label: "Notice Board" },
    { id: "branding", icon: Settings, label: "Branding" }, { id: "team", icon: UserCog, label: "Team" },
  ];
  // The owner sees everything, including Team (which only ever renders for
  // the owner regardless -- RLS on team_members enforces that server-side
  // too, this is just what's shown). A team member sees only their
  // toggled-on tabs, plus their own Account tab in place of My Profile
  // (which is the owner's public-facing bio, not theirs) and never Team.
  const navItems = teamAccess
    ? [{ id: "account", icon: UserCircle, label: "My Account" }, ...allNavItems.filter((n) => teamAccess.permissions.includes(n.id))]
    : allNavItems;
  const [tab, setTab] = useState(() => navItems[0]?.id || "overview");
  const sidebar = (
    <>
      <div className="flex items-center justify-between mb-1 px-2"><LogoMark height={38} /><button onClick={onExit} title="Sign out"><LogOut size={16} color="#A79B84" /></button></div>
      <div className="f-label text-[11px] mb-4 px-2" style={{ color: "#A79B84" }}>{teamAccess ? teamAccess.roleLabel.toUpperCase() : "ADMIN"}</div>
      <div className="px-2 mb-3" data-tour="notif-bell"><NotifBell items={notifItems} seen={notifSeen} onMarkSeen={onMarkSeen} /></div>
      <div className="flex flex-col gap-1 flex-1" data-tour="nav-sidebar">{navItems.map((n) => <div key={n.id} data-tour={n.id === "account" ? "nav-account" : undefined}><SidebarLink icon={n.icon} label={n.label} active={tab === n.id} onClick={() => setTab(n.id)} /></div>)}</div>
      {onSwitchToStudent && <button onClick={onSwitchToStudent} className="flex items-center gap-2 px-4 py-2.5 text-[14px] mt-4" style={{ color: "var(--accent)", fontWeight: 700 }}><Repeat size={16} /> Switch to student view</button>}
      <button onClick={onViewSite} className={`flex items-center gap-2 px-4 py-2.5 text-[14px] ${onSwitchToStudent ? "" : "mt-4"}`} style={{ color: "#A79B84", fontWeight: 600 }}><Home size={16} /> Home page</button>
      <button onClick={onExit} className="flex items-center gap-2 px-4 py-2.5 text-[14px]" style={{ color: "#A79B84", fontWeight: 600 }}><LogOut size={16} /> Sign out</button>
    </>
  );
  function dismissTeamTour() {
    markTourSeen().catch((e) => console.error("markTourSeen failed", e));
    onUpdateTeamAccess?.({ seenTour: true });
  }
  return (
    <DashboardShell sidebar={sidebar}>
        {teamAccess && !teamAccess.seenTour && <WelcomeTour steps={TEAM_TOUR_STEPS} onDone={dismissTeamTour} />}
        {tab === "overview" && <OverviewTab courses={courses} students={students} applicants={applicants} tasks={tasks} cohorts={cohorts} setTab={setTab} />}
        {tab === "profile" && <AdminProfileTab adminProfile={adminProfile} setAdminProfile={setAdminProfile} />}
        {tab === "account" && teamAccess && <TeamAccountTab teamAccess={teamAccess} onUpdate={onUpdateTeamAccess} />}
        {tab === "applicants" && <ApplicantsTab applicants={applicants} setApplicants={setApplicants} onRemove={onRemoveApplicant} students={students} setStudents={setStudents} courses={courses} cohorts={cohorts} onAccept={onAcceptApplicant} />}
        {tab === "cohorts" && <CohortsTab cohorts={cohorts} setCohorts={setCohorts} courses={courses} students={students} />}
        {tab === "courses" && <CoursesTab courses={courses} setCourses={setCourses} testimonials={testimonials} />}
        {tab === "meetings" && <AdminMeetingsTab courses={courses} setCourses={setCourses} cohorts={cohorts} students={students} />}
        {tab === "students" && <StudentsTab students={students} setStudents={setStudents} onRemove={onRemoveStudent} applicants={applicants} courses={courses} cohorts={cohorts} tasks={tasks} />}
        {tab === "gradebook" && <GradebookTab students={students} courses={courses} cohorts={cohorts} tasks={tasks} />}
        {tab === "tasks" && <TasksTab tasks={tasks} setTasks={setTasks} students={students} courses={courses} cohorts={cohorts} />}
        {tab === "library" && <LibraryTab resources={resources} onAdd={onAddResource} onEdit={onEditResource} onRemove={onRemoveResource} courses={courses} />}
        {tab === "certificates" && <CertificatesTab students={students} setStudents={setStudents} courses={courses} setCourses={setCourses} tasks={tasks} />}
        {tab === "testimonials" && <TestimonialsTab testimonials={testimonials} setTestimonials={setTestimonials} students={students} cohorts={cohorts} courses={courses} brand={brand} setBrand={setBrand} />}
        {tab === "faq" && <FaqTab faqs={faqs} setFaqs={setFaqs} />}
        {tab === "chat" && <AdminChatTab students={students} directThreads={directThreads} setDirectThreads={setDirectThreads} />}
        {tab === "community" && <AdminCommunityTab community={community} setCommunity={setCommunity} students={students} cohorts={cohorts} />}
        {tab === "notice" && <AdminNoticeTab notices={notices} setNotices={setNotices} cohorts={cohorts} students={students} />}
        {tab === "branding" && <BrandingTab brand={brand} setBrand={setBrand} />}
        {tab === "team" && !teamAccess && <TeamTab />}
    </DashboardShell>
  );
}

// =========================================================
// APP
// =========================================================
