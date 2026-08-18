import React, { useState, useEffect, useRef } from "react";
import {
  Lock, CheckCircle2, Circle, ArrowRight, ArrowLeft, BookOpen, Users,
  MessageCircle, ListChecks, Settings, LogOut, Library, ChevronRight,
  ChevronDown, Sparkles, Plus, Check, Send, X, Heart, MessageSquare,
  FileText, Download, GraduationCap, Mail, Phone, Award,
  UserCircle, FolderPlus, Folder, UploadCloud, ClipboardCheck, HelpCircle as HelpIcon,
  Clock, Trash2, Eye, Star, Pencil, PlayCircle, Bell, Megaphone, Layers, AtSign
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { genCode, nextStudentId, pairKey } from "./lib/data.js";
import { Field, SectionHeader, NotifBell, SidebarLink, LogoMark, TextArea, SelectF, ImgField } from "./components.jsx";
import { CommunityPanel } from "./student.jsx";

export function ApplicantsTab({ applicants, setApplicants, students, setStudents, courses, cohorts }) {
  const [openId, setOpenId] = useState(null); const [cohortInput, setCohortInput] = useState(cohorts[0]?.id);
  const course = (id) => courses.find((c) => c.id === id);
  function accept(a) {
    const code = genCode();
    if (a.studentRef) {
      setStudents((prev) => prev.map((s) => s.id !== a.studentRef ? s : { ...s, enrollments: [...s.enrollments, { id: "e" + Date.now(), courseId: a.courseId, code, status: "awaiting-code", completedModuleIds: [], certificateReady: false, certificateFile: null }] }));
    } else {
      const studentId = nextStudentId(students);
      setStudents((prev) => [...prev, { id: "s" + Date.now(), studentId, name: a.name, email: a.email, cohortId: cohortInput, photo: null, seenTour: false, accountStatus: "active", enrollments: [{ id: "e" + Date.now(), courseId: a.courseId, code, status: "awaiting-code", completedModuleIds: [], certificateReady: false, certificateFile: null }] }]);
    }
    setApplicants((prev) => prev.map((x) => x.id === a.id ? { ...x, status: "accepted" } : x));
  }
  function decline(a) { setApplicants((prev) => prev.map((x) => x.id === a.id ? { ...x, status: "declined" } : x)); }
  const pending = applicants.filter((a) => a.status === "pending"); const resolved = applicants.filter((a) => a.status !== "pending");
  return (
    <>
      <SectionHeader eyebrow="REVIEW QUEUE" title="Applicants" />
      {pending.length === 0 && <div className="text-[15px] mb-8" style={{ color: "#A79B84" }}>No pending applications.</div>}
      <div className="flex flex-col gap-4 mb-10">{pending.map((a) => (
        <div key={a.id} className="card rounded-2xl p-6">
          <button className="w-full flex items-center justify-between" onClick={() => setOpenId(openId === a.id ? null : a.id)}><div className="text-left"><div className="text-[17px]" style={{ fontWeight: 700 }}>{a.name} {a.studentRef && <span className="f-code text-[10px] tint-badge px-2 py-0.5 rounded-full ml-1">EXISTING STUDENT</span>}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{a.email} · applying to {course(a.courseId)?.title}</div></div><ChevronDown size={18} color="#A79B84" style={{ transform: openId === a.id ? "rotate(180deg)" : "none" }} /></button>
          {openId === a.id && <div className="mt-5 pt-5" style={{ borderTop: "1px solid #F0E7D6" }}>{course(a.courseId)?.applicationQuestions.map((q, i) => <div key={i} className="mb-3"><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>{q.toUpperCase()}</div><div className="text-[14px]">{a.answers[i]}</div></div>)}{!a.studentRef && <div className="mt-4 mb-4" style={{ maxWidth: 220 }}><SelectF label="Cohort" value={cohortInput} onChange={(e) => setCohortInput(e.target.value)} options={cohorts.map((c) => ({ value: c.id, label: c.name }))} /></div>}<div className="flex gap-3"><button onClick={() => accept(a)} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">Accept & generate code</button><button onClick={() => decline(a)} className="btn-ghost rounded-lg px-5 py-2.5 text-[14px]">Decline</button></div></div>}
        </div>
      ))}</div>
      {resolved.length > 0 && <><div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>DECIDED</div><div className="flex flex-col gap-2">{resolved.map((a) => <div key={a.id} className="flex items-center justify-between px-5 py-3 rounded-lg text-[14px]" style={{ background: "#F0E7D6" }}><span>{a.name}</span><span className="f-code text-[10px]" style={{ color: a.status === "accepted" ? "var(--accent)" : "#A79B84" }}>{a.status.toUpperCase()}</span></div>)}</div></>}
    </>
  );
}

export function CohortsTab({ cohorts, setCohorts, courses, students }) {
  const [showAdd, setShowAdd] = useState(false); const [openId, setOpenId] = useState(null);
  const [name, setName] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [courseIds, setCourseIds] = useState([]);
  function toggleCourse(id) { setCourseIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function add() { if (!name) return; setCohorts((prev) => [...prev, { id: "co" + Date.now(), name, startDate, endDate, status: "active", courseIds }]); setName(""); setStartDate(""); setEndDate(""); setCourseIds([]); setShowAdd(false); }
  function remove(id) { setCohorts((prev) => prev.filter((c) => c.id !== id)); }
  return (
    <>
      <SectionHeader eyebrow="MANAGE" title="Cohorts" action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> New cohort</button>} />
      {showAdd && (
        <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
          <Field label="Cohort name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3"><Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /><Field label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div><div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>COURSES AVAILABLE IN THIS COHORT</div><div className="flex flex-wrap gap-2">{courses.map((c) => <button key={c.id} onClick={() => toggleCourse(c.id)} className="f-label text-[11px] px-3 py-1.5 rounded-full" style={{ background: courseIds.includes(c.id) ? "var(--accent)" : "#F0E7D6", color: courseIds.includes(c.id) ? "#FAF6EC" : "#71675A" }}>{c.title}</button>)}</div></div>
          <button onClick={add} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] self-start">Create cohort</button>
        </div>
      )}
      <div className="flex flex-col gap-4">{cohorts.map((co) => {
        const members = students.filter((s) => s.cohortId === co.id);
        return (
          <div key={co.id} className="card rounded-2xl p-6">
            <button className="w-full flex items-center justify-between" onClick={() => setOpenId(openId === co.id ? null : co.id)}>
              <div className="text-left"><div className="f-display text-[19px]" style={{ fontWeight: 700 }}>{co.name}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{members.length} students · {co.courseIds.length} courses · {co.startDate} to {co.endDate}</div></div>
              <div className="flex items-center gap-3"><span className="f-code text-[10px] px-2.5 py-1 rounded-full tint-badge">{co.status.toUpperCase()}</span><ChevronDown size={18} color="#A79B84" style={{ transform: openId === co.id ? "rotate(180deg)" : "none" }} /></div>
            </button>
            {openId === co.id && (
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid #F0E7D6" }}>
                <div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>COURSES</div>
                <div className="flex flex-wrap gap-2 mb-6">{co.courseIds.map((cid) => <span key={cid} className="f-label text-[11px] px-3 py-1.5 rounded-full tint-badge">{courses.find((c) => c.id === cid)?.title}</span>)}</div>
                <div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>CALL SHEET — MEMBERS</div>
                <div className="flex flex-col gap-2 mb-4">{members.map((s) => <div key={s.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[13px]" style={{ background: "#FAF6EC" }}><span style={{ fontWeight: 600 }}>{s.name}</span><span className="f-code text-[11px]" style={{ color: "#71675A" }}>{s.enrollments.length} enrollment{s.enrollments.length !== 1 ? "s" : ""}</span></div>)}{members.length === 0 && <div className="text-[13px]" style={{ color: "#A79B84" }}>No members yet.</div>}</div>
                <button onClick={() => remove(co.id)} className="text-[12px]" style={{ color: "#B04A3A" }}>Delete cohort</button>
              </div>
            )}
          </div>
        );
      })}</div>
    </>
  );
}

export function ModuleEditor({ course, module, setCourses, onBack }) {
  const [title, setTitle] = useState(module.title); const [brief, setBrief] = useState(module.brief || "");
  const [notes, setNotes] = useState(module.notes || ""); const [videoUrl, setVideoUrl] = useState(module.videoUrl || ""); const [slideUrl, setSlideUrl] = useState(module.slideUrl || "");
  const [testType, setTestType] = useState(module.testType); const [passPct, setPassPct] = useState(module.passPct || 70);
  const [proofType, setProofType] = useState(module.proofType || "text"); const [markingGuide, setMarkingGuide] = useState(module.markingGuide || "");
  const [quiz, setQuiz] = useState(module.quiz || []);
  function addQuestion() { setQuiz((q) => [...q, { q: "", options: ["", "", ""], correct: 0 }]); }
  function updateQ(i, field, value) { setQuiz((q) => q.map((item, idx) => idx !== i ? item : { ...item, [field]: value })); }
  function updateOpt(qi, oi, value) { setQuiz((q) => q.map((item, idx) => idx !== qi ? item : { ...item, options: item.options.map((o, oidx) => oidx === oi ? value : o) })); }
  function removeQ(i) { setQuiz((q) => q.filter((_, idx) => idx !== i)); }
  function save() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, modules: c.modules.map((m) => m.id !== module.id ? m : { ...m, title, brief, notes, videoUrl, slideUrl, testType, passPct: Number(passPct), proofType, markingGuide, quiz }) })); onBack(); }
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to {course.title}</button>
      <div className="card rounded-2xl p-7 flex flex-col gap-4">
        <Field label="Module title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Field label="Short brief (shown in course path)" value={brief} onChange={(e) => setBrief(e.target.value)} />
        <TextArea label="Lecture notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="grid grid-cols-2 gap-3"><Field label="Video link (max ~50MB if uploading elsewhere)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" /><Field label="Slide deck link" value={slideUrl} onChange={(e) => setSlideUrl(e.target.value)} placeholder="https://…" /></div>
        <SelectF label="Check type" value={testType} onChange={(e) => setTestType(e.target.value)} options={[{ value: "multiple-choice", label: "Multiple choice (auto-graded)" }, { value: "written", label: "Short written answer (you review)" }, { value: "file-upload", label: "File / assignment upload (you review)" }, { value: "checklist", label: "Self-check (no review needed)" }]} />
        {testType === "multiple-choice" && (
          <div>
            <Field label="Pass score to unlock next (%)" type="number" value={passPct} onChange={(e) => setPassPct(e.target.value)} />
            <div className="mt-4 flex flex-col gap-4">{quiz.map((q, qi) => <div key={qi} className="rounded-xl p-4" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}><div className="flex items-center justify-between mb-2"><div className="f-label text-[11px]" style={{ color: "#71675A" }}>QUESTION {qi + 1}</div><button onClick={() => removeQ(qi)}><Trash2 size={14} color="#B04A3A" /></button></div><Field label="Question" value={q.q} onChange={(e) => updateQ(qi, "q", e.target.value)} /><div className="mt-3 flex flex-col gap-2">{q.options.map((o, oi) => <div key={oi} className="flex items-center gap-2"><input type="radio" checked={q.correct === oi} onChange={() => updateQ(qi, "correct", oi)} /><input className="input-field rounded-lg px-3 py-2 text-[13px]" placeholder={`Option ${oi + 1}`} value={o} onChange={(e) => updateOpt(qi, oi, e.target.value)} /></div>)}</div></div>)}<button onClick={addQuestion} className="text-[13px] accent-text flex items-center gap-1.5 self-start" style={{ fontWeight: 700 }}><Plus size={14} /> Add question</button></div>
          </div>
        )}
        {(testType === "written" || testType === "file-upload") && (
          <>
            {testType === "file-upload" && <SelectF label="Required proof type" value={proofType} onChange={(e) => setProofType(e.target.value)} options={[{ value: "document", label: "Document upload" }, { value: "link", label: "Link" }, { value: "image", label: "Image / screenshot link" }]} />}
            <TextArea label="Marking guide (for your review — what a good answer looks like)" value={markingGuide} onChange={(e) => setMarkingGuide(e.target.value)} />
          </>
        )}
        <button onClick={save} className="btn-primary rounded-lg px-6 py-3 text-[14px] self-start mt-2">Save module</button>
      </div>
    </div>
  );
}
export function CourseManager({ course, testimonials, setCourses, onBack }) {
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [openModuleId, setOpenModuleId] = useState(null);
  const [addingModule, setAddingModule] = useState(false); const [newModTitle, setNewModTitle] = useState("");
  const [title, setTitle] = useState(course.title); const [tagline, setTagline] = useState(course.tagline || ""); const [audience, setAudience] = useState(course.audience); const [description, setDescription] = useState(course.description); const [durationWeeks, setDurationWeeks] = useState(course.durationWeeks); const [level, setLevel] = useState(course.level); const [image, setImage] = useState(course.image);
  const [questions, setQuestions] = useState(course.applicationQuestions || []); const [newQ, setNewQ] = useState("");
  const [testimonialIds, setTestimonialIds] = useState(course.testimonialIds || []);
  function saveDetails() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, title, tagline, audience, description, durationWeeks: Number(durationWeeks), level, image, testimonialIds })); setEditingDetails(false); }
  function saveQuestions() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, applicationQuestions: questions })); setEditingQuestions(false); }
  function addModule() { if (!newModTitle) return; setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, modules: [...c.modules, { id: Date.now(), title: newModTitle, brief: "", notes: "", videoUrl: "", slideUrl: "", testType: "checklist" }] })); setNewModTitle(""); setAddingModule(false); }
  function togglePublish() { setCourses((prev) => prev.map((c) => c.id !== course.id ? c : { ...c, status: c.status === "live" ? "draft" : "live" })); }
  function toggleTestimonial(id) { setTestimonialIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  const openModule = openModuleId ? course.modules.find((m) => m.id === openModuleId) : null;
  if (openModule) return <ModuleEditor course={course} module={openModule} setCourses={setCourses} onBack={() => setOpenModuleId(null)} />;
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to courses</button>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div className="f-label text-[12px] mb-2 accent-text">COURSE MANAGER</div><h1 className="f-display text-[30px]" style={{ fontWeight: 800 }}>{course.title}</h1></div>
        <div className="flex items-center gap-2"><button onClick={togglePublish} className="f-label text-[11px] px-4 py-2 rounded-full tint-badge">{course.status === "live" ? "PUBLISHED" : "UNPUBLISHED"}</button><button onClick={() => setEditingDetails((s) => !s)} className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Pencil size={13} /> Edit details</button><button onClick={() => setEditingQuestions((s) => !s)} className="btn-soft rounded-full px-4 py-2 text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Pencil size={13} /> Application questions</button></div>
      </div>
      {editingDetails && (
        <div className="card rounded-2xl p-7 mb-8 flex flex-col gap-4">
          <ImgField label="Course image" value={image} onChange={setImage} />
          <Field label="Course title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Field label="Tagline (short)" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <Field label="Who it's for" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <TextArea label="Full description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-3"><SelectF label="Level" value={level} onChange={(e) => setLevel(e.target.value)} options={[{ value: "Beginner", label: "Beginner" }, { value: "Intermediate", label: "Intermediate" }, { value: "Advanced", label: "Advanced" }]} /><Field label="Duration (weeks)" type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} /></div>
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
      <div className="grid md:grid-cols-2 gap-4 mb-6">{course.modules.map((m) => <button key={m.id} onClick={() => setOpenModuleId(m.id)} className="card card-pop rounded-2xl p-5 text-left book-tab"><div className="f-code text-[11px] mb-1 accent-text">MODULE {String(m.id).padStart(2, "0")}</div><div className="text-[16px] mb-1" style={{ fontWeight: 700 }}>{m.title}</div><div className="text-[13px] mb-3" style={{ color: "#71675A" }}>{m.brief || "No brief yet."}</div><div className="flex items-center gap-1.5 text-[12px] accent-text" style={{ fontWeight: 700 }}><Pencil size={12} /> Edit module</div></button>)}</div>
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
      <div className="grid grid-cols-2 gap-3"><SelectF label="Level" value={level} onChange={(e) => setLevel(e.target.value)} options={[{ value: "Beginner", label: "Beginner" }, { value: "Intermediate", label: "Intermediate" }, { value: "Advanced", label: "Advanced" }]} /><Field label="Duration (weeks)" type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} /></div>
      <div className="flex gap-3 mt-1"><button onClick={() => { if (title) { onAdd({ title, tagline, audience, description, durationWeeks: Number(durationWeeks), level, image, outcomes: [], applicationQuestions: ["Tell us why you want to join this course."], testimonialIds: [] }); onClose(); } }} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">Create course</button><button onClick={onClose} className="text-[14px]" style={{ color: "#A79B84" }}>Cancel</button></div>
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

export function StudentDetail({ student, applicant, setStudents, courses, cohorts, onClose }) {
  const [status, setStatus] = useState(student.accountStatus); const [cohortId, setCohortId] = useState(student.cohortId);
  function saveStatus(v) { setStatus(v); setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, accountStatus: v } : s)); }
  function saveCohort(v) { setCohortId(v); setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, cohortId: v } : s)); }
  function reissue(enrollmentId) { const code = genCode(); setStudents((prev) => prev.map((s) => s.id !== student.id ? s : { ...s, enrollments: s.enrollments.map((e) => e.id === enrollmentId ? { ...e, code } : e) })); }
  return (
    <div className="card rounded-2xl p-7 mb-6">
      <div className="flex items-center justify-between mb-5"><div><div className="f-display text-[21px]" style={{ fontWeight: 800 }}>{student.name}</div><div className="text-[14px]" style={{ color: "#71675A" }}>{student.email}</div></div><button onClick={onClose}><X size={18} color="#A79B84" /></button></div>
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div><div className="f-label text-[10px] mb-1" style={{ color: "#A79B84" }}>STUDENT ID</div><div className="text-[14px] f-code">{student.studentId}</div></div>
        <div className="flex-1"><SelectF label="Cohort" value={cohortId} onChange={(e) => saveCohort(e.target.value)} options={cohorts.map((c) => ({ value: c.id, label: c.name }))} /></div>
      </div>
      <div className="mb-5"><SelectF label="Account status" value={status} onChange={(e) => saveStatus(e.target.value)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "suspended", label: "Suspended" }]} /></div>
      <div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>ENROLLMENTS</div>
      <div className="flex flex-col gap-2 mb-5">{student.enrollments.map((e) => <div key={e.id} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "#FAF6EC" }}><div><div className="text-[14px]" style={{ fontWeight: 700 }}>{courses.find((c) => c.id === e.courseId)?.title}</div><div className="f-code text-[10px]" style={{ color: "#71675A" }}>{e.status.toUpperCase()} · {e.completedModuleIds.length}/{courses.find((c) => c.id === e.courseId)?.modules.length || 8} modules</div></div><div className="flex items-center gap-2"><span className="f-code text-[13px]">{e.code}</span><button onClick={() => reissue(e.id)} className="f-label text-[10px] accent-text">REISSUE</button></div></div>)}</div>
      {applicant && <div className="pt-5" style={{ borderTop: "1px solid #F0E7D6" }}><div className="f-label text-[11px] mb-3" style={{ color: "#71675A" }}>LATEST APPLICATION ANSWERS</div>{applicant.answers.map((ans, i) => <div key={i} className="mb-2 text-[13px]">{ans}</div>)}</div>}
    </div>
  );
}
export function StudentsTab({ students, setStudents, applicants, courses, cohorts }) {
  const [selected, setSelected] = useState(null);
  function exportCsv() { const rows = [["Student ID", "Name", "Email", "Cohort", "Status", "Enrollments"], ...students.map((s) => [s.studentId, s.name, s.email, cohorts.find((c) => c.id === s.cohortId)?.name || "", s.accountStatus, s.enrollments.map((e) => courses.find((c) => c.id === e.courseId)?.title).join("; ")])]; const csv = rows.map((r) => r.join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "fj-room-students.csv"; a.click(); URL.revokeObjectURL(url); }
  const selectedStudent = students.find((s) => s.id === selected);
  const selectedApplicant = selectedStudent ? applicants.filter((a) => a.email === selectedStudent.email).slice(-1)[0] : null;
  return (
    <>
      <SectionHeader eyebrow="ROSTER" title="Students" action={<button onClick={exportCsv} className="btn-soft rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5" style={{ fontWeight: 700 }}><Download size={14} /> Export CSV</button>} />
      {selectedStudent && <StudentDetail student={selectedStudent} applicant={selectedApplicant} setStudents={setStudents} courses={courses} cohorts={cohorts} onClose={() => setSelected(null)} />}
      <div className="card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 px-6 py-3 f-label text-[11px]" style={{ background: "#F0E7D6", color: "#71675A" }}><div>STUDENT ID</div><div>NAME</div><div>COHORT</div><div>STATUS</div><div>COURSES</div></div>
        {students.map((s) => <button key={s.id} onClick={() => setSelected(s.id)} className="w-full grid grid-cols-5 px-6 py-4 items-center text-[14px] text-left" style={{ borderTop: "1px solid #F0E7D6" }}><div className="f-code text-[11px]" style={{ color: "#71675A" }}>{s.studentId}</div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ color: "#4A4237" }}>{cohorts.find((c) => c.id === s.cohortId)?.name || "—"}</div><span className="f-code text-[10px] px-2.5 py-1 rounded-full self-start tint-badge">{s.accountStatus.toUpperCase()}</span><div style={{ color: "#4A4237" }}>{s.enrollments.length}</div></button>)}
      </div>
    </>
  );
}

export function TaskForm({ students, courses, initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || ""); const [description, setDescription] = useState(initial?.description || ""); const [tools, setTools] = useState(initial?.tools || ""); const [dueInDays, setDueInDays] = useState(initial?.dueInDays || 7); const [proofType, setProofType] = useState(initial?.proofType || "link");
  const [courseId, setCourseId] = useState(initial?.courseId || courses[0]?.id); const [assigned, setAssigned] = useState(initial?.assigned || []);
  function toggle(id) { setAssigned((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  const eligible = students.filter((s) => s.enrollments.some((e) => e.courseId === courseId));
  return (
    <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
      <Field label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Full description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Field label="Tools needed (optional)" value={tools} onChange={(e) => setTools(e.target.value)} placeholder="e.g. Calendly, a laptop" />
      <div className="grid grid-cols-2 gap-3"><SelectF label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)} options={courses.map((c) => ({ value: c.id, label: c.title }))} /><Field label="Due in (days)" type="number" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} /></div>
      <SelectF label="Required proof type" value={proofType} onChange={(e) => setProofType(e.target.value)} options={[{ value: "link", label: "Link" }, { value: "image", label: "Image / screenshot" }, { value: "document", label: "Document" }, { value: "text", label: "Written text" }]} />
      <div><div className="f-label text-[11px] mb-2" style={{ color: "#71675A" }}>ASSIGN TO</div><div className="flex flex-wrap gap-2">{eligible.map((s) => <button key={s.id} onClick={() => toggle(s.id)} className="f-label text-[11px] px-3 py-1.5 rounded-full" style={{ background: assigned.includes(s.id) ? "var(--accent)" : "#F0E7D6", color: assigned.includes(s.id) ? "#FAF6EC" : "#71675A" }}>{s.name}</button>)}</div></div>
      <div className="flex gap-3 mt-1"><button onClick={() => { if (title) onSave({ title, description, tools, courseId, dueInDays: Number(dueInDays), proofType, assigned }); }} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">Save task</button><button onClick={onClose} className="text-[14px]" style={{ color: "#A79B84" }}>Cancel</button></div>
    </div>
  );
}
export function SubmissionDetail({ sid, student, sub, onGrade, onClose }) {
  const [score, setScore] = useState(sub?.score || 100);
  return <div className="card modal-in rounded-2xl p-6 mb-4"><div className="flex items-center justify-between mb-3"><div className="text-[15px]" style={{ fontWeight: 700 }}>{student?.name}'s submission</div><button onClick={onClose}><X size={16} color="#A79B84" /></button></div><div className="text-[14px] mb-4" style={{ color: "#4A4237" }}>{sub.note}</div><div className="flex items-center gap-3"><Field label="Score (%)" type="number" value={score} onChange={(e) => setScore(e.target.value)} /><button onClick={() => onGrade(sid, "approved", Number(score))} className="btn-primary rounded-lg px-5 py-2.5 text-[13px] shrink-0 mt-6">Mark reviewed</button></div></div>;
}
export function TaskDetail({ task, setTasks, students, onClose, onDelete }) {
  const [editing, setEditing] = useState(false); const [viewingSub, setViewingSub] = useState(null);
  function grade(sid, status, score) { setTasks((prev) => prev.map((t) => t.id !== task.id ? t : { ...t, submissions: { ...t.submissions, [sid]: { ...t.submissions[sid], status, score } } })); setViewingSub(null); }
  function save(data) { setTasks((prev) => prev.map((t) => t.id !== task.id ? t : { ...t, ...data })); setEditing(false); }
  if (editing) return <TaskForm students={students} courses={[{ id: task.courseId, title: task.courseId }]} initial={task} onSave={save} onClose={() => setEditing(false)} />;
  return (
    <div className="card rounded-2xl p-7 mb-6">
      <div className="flex items-center justify-between mb-2"><button onClick={onClose} className="flex items-center gap-1.5 text-[13px]" style={{ color: "#71675A" }}><ArrowLeft size={14} /> Back to tasks</button><div className="flex gap-3"><button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-[13px] accent-text" style={{ fontWeight: 700 }}><Pencil size={13} /> Edit</button><button onClick={() => onDelete(task.id)} className="flex items-center gap-1.5 text-[13px]" style={{ color: "#B04A3A" }}><Trash2 size={13} /> Delete</button></div></div>
      <div className="f-display text-[22px] mt-3 mb-1" style={{ fontWeight: 800 }}>{task.title}</div>
      <div className="text-[15px] mb-2" style={{ color: "#4A4237" }}>{task.description}</div>
      {task.tools && <div className="text-[14px] mb-2" style={{ color: "#71675A" }}><strong>Tools:</strong> {task.tools}</div>}
      <div className="text-[14px] mb-6" style={{ color: "#71675A" }}><strong>Required proof:</strong> {task.proofType}</div>
      <div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>SUBMISSIONS</div>
      <div className="flex flex-col gap-3">{task.assigned.map((sid) => { const s = students.find((x) => x.id === sid); const sub = task.submissions[sid]; return (
        <div key={sid}>
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}><div><span className="text-[14px]" style={{ fontWeight: 700 }}>{s?.name}</span>{sub && <span className="f-code text-[10px] tint-badge px-2 py-1 rounded-full ml-2">{sub.status.toUpperCase()}{sub.score != null ? ` · ${sub.score}%` : ""}</span>}</div>{sub ? <button onClick={() => setViewingSub(viewingSub === sid ? null : sid)} className="f-label text-[11px] accent-text flex items-center gap-1"><Eye size={12} /> View</button> : <span className="f-code text-[10px]" style={{ color: "#C9BFAE" }}>NOT SUBMITTED</span>}</div>
          {viewingSub === sid && <SubmissionDetail sid={sid} student={s} sub={sub} onGrade={grade} onClose={() => setViewingSub(null)} />}
        </div>
      ); })}</div>
    </div>
  );
}
export function TasksTab({ tasks, setTasks, students, courses }) {
  const [showAdd, setShowAdd] = useState(false); const [selected, setSelected] = useState(null);
  function addTask(data) { setTasks((prev) => [...prev, { id: "t" + Date.now(), submissions: {}, ...data }]); setShowAdd(false); }
  function deleteTask(id) { setTasks((prev) => prev.filter((t) => t.id !== id)); setSelected(null); }
  const selectedTask = tasks.find((t) => t.id === selected);
  return (
    <>
      <SectionHeader eyebrow="ASSIGN & REVIEW" title="Tasks" action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> New task</button>} />
      {showAdd && <TaskForm students={students} courses={courses} onSave={addTask} onClose={() => setShowAdd(false)} />}
      {selectedTask ? <TaskDetail task={selectedTask} setTasks={setTasks} students={students} onClose={() => setSelected(null)} onDelete={deleteTask} /> : <div className="flex flex-col gap-4">{tasks.map((t) => <button key={t.id} onClick={() => setSelected(t.id)} className="card card-pop rounded-xl p-5 text-left"><div className="flex items-center justify-between mb-1.5"><div className="text-[16px]" style={{ fontWeight: 700 }}>{t.title}</div><span className="f-code text-[10px]" style={{ color: "#A79B84" }}>{t.assigned.length} assigned</span></div><div className="text-[14px]" style={{ color: "#71675A" }}>{t.description}</div></button>)}</div>}
    </>
  );
}

export function ResourceForm({ courses, initial, onSave, onClose }) {
  const [category, setCategory] = useState(initial?.category || "module"); const [folder, setFolder] = useState(initial?.folder || ""); const [title, setTitle] = useState(initial?.title || ""); const [description, setDescription] = useState(initial?.description || ""); const [type, setType] = useState(initial?.type || "Doc"); const [url, setUrl] = useState(initial?.url || ""); const [kind, setKind] = useState(initial?.kind || "link"); const [visibility, setVisibility] = useState(initial?.visibility || "course"); const [courseId, setCourseId] = useState(initial?.courseId || courses[0]?.id);
  const isPublic = category === "free";
  return (
    <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3">
      <SelectF label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: "module", label: "Module resource (for enrolled students)" }, { value: "free", label: "Free download (public)" }]} />
      {category === "module" && <SelectF label="Visible to" value={visibility} onChange={(e) => setVisibility(e.target.value)} options={[{ value: "course", label: "Just this course" }, { value: "all", label: "All courses" }]} />}
      <SelectF label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)} options={courses.map((c) => ({ value: c.id, label: c.title }))} />
      <Field label="Folder name" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="e.g. Module 1 resources" />
      <Field label="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Full description (what it's for, who it's for, how it helps)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Field label="Link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      <SelectF label="Output" value={kind} onChange={(e) => setKind(e.target.value)} options={[{ value: "file", label: "Document — shows Download" }, { value: "link", label: "Link — shows View" }]} />
      <SelectF label="Format" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: "Doc", label: "Doc" }, { value: "Sheet", label: "Sheet" }, { value: "Slides", label: "Slides" }, { value: "Link", label: "Link" }]} />
      <div className="flex gap-3"><button onClick={() => { if (folder && title && url) onSave({ courseId, folder, title, description, type, url, kind, visibility: category === "free" ? "all" : visibility, isPublic }); }} className="btn-primary rounded-lg px-5 py-2.5 text-[14px]">Save resource</button><button onClick={onClose} className="text-[14px]" style={{ color: "#A79B84" }}>Cancel</button></div>
    </div>
  );
}
export function LibraryTab({ resources, setResources, courses }) {
  const [showAdd, setShowAdd] = useState(false); const [editingId, setEditingId] = useState(null);
  function add(data) { setResources((prev) => [...prev, { id: "r" + Date.now(), ...data }]); setShowAdd(false); }
  function save(id, data) { setResources((prev) => prev.map((r) => r.id === id ? { ...r, ...data } : r)); setEditingId(null); }
  function remove(id) { setResources((prev) => prev.filter((r) => r.id !== id)); }
  const folders = [...new Set(resources.map((r) => r.folder))];
  return (
    <>
      <SectionHeader eyebrow="MANAGE" title="Resource library" action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary rounded-full px-5 py-2.5 text-[14px] flex items-center gap-1.5"><Plus size={16} /> Add resource</button>} />
      {showAdd && <ResourceForm courses={courses} onSave={add} onClose={() => setShowAdd(false)} />}
      {folders.map((f) => <div key={f} className="mb-6"><div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>{f.toUpperCase()}</div><div className="flex flex-col gap-2">{resources.filter((r) => r.folder === f).map((r) => (
        <div key={r.id}><div className="card rounded-lg px-5 py-3 flex items-center justify-between text-[14px]"><span className="flex items-center gap-2">{r.title} {r.isPublic && <span className="f-code text-[9px] tint-badge px-2 py-0.5 rounded-full">PUBLIC</span>}{r.visibility === "all" && !r.isPublic && <span className="f-code text-[9px] tint-badge px-2 py-0.5 rounded-full">ALL COURSES</span>}</span><div className="flex items-center gap-3"><button onClick={() => setEditingId(editingId === r.id ? null : r.id)} className="f-label text-[10px] accent-text flex items-center gap-1"><Pencil size={11} /> EDIT</button><button onClick={() => remove(r.id)}><Trash2 size={14} color="#B04A3A" /></button></div></div>{editingId === r.id && <ResourceForm courses={courses} initial={r} onSave={(data) => save(r.id, data)} onClose={() => setEditingId(null)} />}</div>
      ))}</div></div>)}
    </>
  );
}
export function CertificatesTab({ students, setStudents, courses }) {
  function upload(sid, eid, e) { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setStudents((prev) => prev.map((s) => s.id !== sid ? s : { ...s, enrollments: s.enrollments.map((en) => en.id === eid ? { ...en, certificateFile: r.result } : en) })); r.readAsDataURL(f); }
  function toggle(sid, eid) { setStudents((prev) => prev.map((s) => s.id !== sid ? s : { ...s, enrollments: s.enrollments.map((en) => en.id === eid ? { ...en, certificateReady: !en.certificateReady } : en) })); }
  return (
    <>
      <SectionHeader eyebrow="ISSUE" title="Certificates" />
      <div className="flex flex-col gap-3">{students.flatMap((s) => s.enrollments.filter((e) => e.status === "active").map((e) => ({ s, e }))).map(({ s, e }) => (
        <div key={e.id} className="card rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div><div className="text-[16px]" style={{ fontWeight: 700 }}>{s.name}</div><div className="text-[13px] mt-1" style={{ color: "#71675A" }}>{courses.find((c) => c.id === e.courseId)?.title} · {e.completedModuleIds.length}/{courses.find((c) => c.id === e.courseId)?.modules.length || 8} modules</div></div>
          <div className="flex items-center gap-2"><label className="btn-soft rounded-full px-4 py-2 text-[13px] cursor-pointer flex items-center gap-1.5" style={{ fontWeight: 600 }}><UploadCloud size={14} /> {e.certificateFile ? "Replace file" : "Upload certificate"}<input type="file" onChange={(ev) => upload(s.id, e.id, ev)} style={{ display: "none" }} /></label><button disabled={!e.certificateFile} onClick={() => toggle(s.id, e.id)} className={e.certificateReady ? "btn-soft" : "btn-primary"} style={{ borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 700, opacity: !e.certificateFile ? 0.4 : 1 }}>{e.certificateReady ? "Ready — Revoke" : "Mark ready & assign"}</button></div>
        </div>
      ))}</div>
    </>
  );
}
export function TestimonialsTab({ testimonials, setTestimonials }) {
  const [name, setName] = useState(""); const [quote, setQuote] = useState(""); const [editingId, setEditingId] = useState(null);
  function add() { if (!name || !quote) return; setTestimonials((prev) => [...prev, { id: "te" + Date.now(), name, quote }]); setName(""); setQuote(""); }
  function save(id, n, q) { setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, name: n, quote: q } : t)); setEditingId(null); }
  function remove(id) { setTestimonials((prev) => prev.filter((t) => t.id !== id)); }
  return (
    <>
      <SectionHeader eyebrow="LANDING PAGE" title="Testimonials" />
      <div className="card rounded-xl p-6 mb-6 flex flex-col gap-3"><Field label="Student name" value={name} onChange={(e) => setName(e.target.value)} /><TextArea label="Quote" value={quote} onChange={(e) => setQuote(e.target.value)} /><button onClick={add} className="btn-primary rounded-lg px-5 py-2.5 text-[14px] self-start">Add testimonial</button></div>
      <div className="flex flex-col gap-3">{testimonials.map((t) => editingId === t.id ? <EditTQ key={t.id} item={t} field1="name" field2="quote" onSave={(id, a, b) => save(id, a, b)} onCancel={() => setEditingId(null)} /> : <div key={t.id} className="card rounded-xl p-5 flex items-start justify-between gap-4"><div><div className="text-[15px] mb-1" style={{ fontWeight: 700 }}>{t.name}</div><div className="text-[14px]" style={{ color: "#4A4237", fontStyle: "italic" }}>"{t.quote}"</div></div><div className="flex gap-3 shrink-0"><button onClick={() => setEditingId(t.id)}><Pencil size={15} color="var(--accent)" /></button><button onClick={() => remove(t.id)}><Trash2 size={15} color="#B04A3A" /></button></div></div>)}</div>
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
  function send() { if (!msg.trim() || !key) return; setDirectThreads((p) => ({ ...p, [key]: [...(p[key] || []), { from: "admin", text: msg }] })); setMsg(""); }
  return (
    <>
      <SectionHeader eyebrow="TALK TO STUDENTS" title="Chat" />
      <div className="card rounded-2xl flex" style={{ height: 480 }}>
        <div className="w-[220px] shrink-0 overflow-y-auto" style={{ borderRight: "1px solid #E7DEC9" }}>{students.map((s) => { const unread = (directThreads[pairKey("admin", s.id)] || []).filter((m) => m.from !== "admin").length; return <button key={s.id} onClick={() => setActiveId(s.id)} className="w-full text-left px-5 py-3.5 text-[14px] flex items-center justify-between" style={{ background: activeId === s.id ? "color-mix(in srgb, var(--accent) 14%, white)" : "transparent", fontWeight: activeId === s.id ? 700 : 500 }}>{s.name}{unread > 0 && <span className="f-code text-[9px] rounded-full px-1.5 py-0.5" style={{ background: "var(--accent)", color: "#FAF6EC" }}>{unread}</span>}</button>; })}</div>
        <div className="flex-1 flex flex-col">{!activeId ? <div className="flex-1 flex items-center justify-center text-[14px]" style={{ color: "#A79B84" }}>Select a conversation to open it.</div> : <><div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">{thread.map((m, i) => <div key={i} className="max-w-[75%] px-4 py-2.5 rounded-xl text-[14px]" style={{ alignSelf: m.from === "admin" ? "flex-end" : "flex-start", background: m.from === "admin" ? "var(--accent)" : "#F0E7D6", color: m.from === "admin" ? "#FAF6EC" : "#262019" }}>{m.text}</div>)}</div><div className="flex items-center gap-2 p-4" style={{ borderTop: "1px solid #E7DEC9" }}><input className="input-field rounded-full px-4 py-2.5" placeholder="Reply…" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} /><button onClick={send} className="btn-primary rounded-full p-2.5 shrink-0"><Send size={16} /></button></div></>}</div>
      </div>
    </>
  );
}
export function AdminCommunityTab({ community, setCommunity, students }) {
  return <CommunityPanel community={community} setCommunity={setCommunity} authorName="Fidelia" allStudents={students} />;
}
export function AdminNoticeTab({ notices, setNotices, cohorts }) {
  const [noticeMsg, setNoticeMsg] = useState(""); const [cohortId, setCohortId] = useState("all");
  function post() { if (!noticeMsg.trim()) return; setNotices((p) => [...p, { text: noticeMsg, cohortId }]); setNoticeMsg(""); }
  return (
    <>
      <SectionHeader eyebrow="ONE-WAY BROADCAST" title="Notice Board" />
      <div className="card rounded-2xl p-6">
        <div className="flex gap-2 mb-3"><SelectF value={cohortId} onChange={(e) => setCohortId(e.target.value)} options={[{ value: "all", label: "All cohorts" }, ...cohorts.map((c) => ({ value: c.id, label: c.name }))]} /></div>
        <div className="flex gap-2 mb-5"><input className="input-field rounded-lg px-4 py-2.5" placeholder="Post to the whole cohort…" value={noticeMsg} onChange={(e) => setNoticeMsg(e.target.value)} /><button onClick={post} className="btn-primary rounded-lg px-5 text-[14px] shrink-0">Post</button></div>
        <div className="flex flex-col gap-3">{[...notices].reverse().map((a, i) => <div key={i} className="rounded-xl p-4 text-[15px]" style={{ background: "#FAF6EC", border: "1px solid #E7DEC9" }}>{a.text}<div className="f-code text-[9px] mt-1" style={{ color: "#A79B84" }}>{a.cohortId === "all" ? "ALL COHORTS" : cohorts.find((c) => c.id === a.cohortId)?.name.toUpperCase()}</div></div>)}</div>
      </div>
    </>
  );
}
export function BrandingTab({ brand, setBrand }) {
  const swatches = [{ n: "Deep sky", v: "#1C6FA0" }, { n: "Slate teal", v: "#2E7D6B" }, { n: "Plum", v: "#6E4C6B" }, { n: "Burgundy", v: "#7A2E3B" }, { n: "Forest", v: "#2F5233" }, { n: "Amber", v: "#B8752E" }, { n: "Charcoal blue", v: "#2C3E50" }, { n: "Rose", v: "#A65065" }, { n: "Ink violet", v: "#4B3F72" }, { n: "Clay", v: "#9C5A3C" }];
  return (
    <>
      <SectionHeader eyebrow="WHITE-LABEL" title="Branding" />
      <div className="card rounded-2xl p-8 max-w-[560px]"><Field label="Platform name" value={brand.name} onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))} /><div className="mt-6"><div className="f-label text-[12px] mb-3" style={{ color: "#71675A" }}>ACCENT COLOR</div><div className="flex items-center gap-3 flex-wrap">{swatches.map((s) => <button key={s.v} title={s.n} onClick={() => setBrand((b) => ({ ...b, accent: s.v }))} className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: s.v, border: brand.accent === s.v ? "3px solid #262019" : "3px solid transparent" }}>{brand.accent === s.v && <Check size={16} color="#FAF6EC" />}</button>)}<input type="color" value={brand.accent} onChange={(e) => setBrand((b) => ({ ...b, accent: e.target.value }))} style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer" }} /></div></div></div>
    </>
  );
}
export function GradebookTab({ students, courses }) {
  const rows = students.flatMap((s) => s.enrollments.map((e) => { const c = courses.find((x) => x.id === e.courseId); const pct = c ? Math.round((e.completedModuleIds.length / c.modules.length) * 100) : 0; return { student: s.name, course: c?.title, pct, eligible: pct >= 90 }; }));
  return (
    <>
      <SectionHeader eyebrow="ACCUMULATED SCORES" title="Gradebook" />
      <div className="card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 px-6 py-3 f-label text-[11px]" style={{ background: "#F0E7D6", color: "#71675A" }}><div>STUDENT</div><div>COURSE</div><div>PROGRESS</div><div>CERTIFICATE ELIGIBLE (90%+)</div></div>
        {rows.map((r, i) => <div key={i} className="grid grid-cols-4 px-6 py-4 items-center text-[14px]" style={{ borderTop: "1px solid #F0E7D6" }}><div style={{ fontWeight: 700 }}>{r.student}</div><div>{r.course}</div><div>{r.pct}%</div><div>{r.eligible ? <span className="f-code text-[10px] tint-badge px-2 py-1 rounded-full">YES</span> : <span className="f-code text-[10px]" style={{ color: "#A79B84" }}>NOT YET</span>}</div></div>)}
      </div>
    </>
  );
}
export function OverviewTab({ courses, students, applicants, tasks, setTab }) {
  const pendingApplicants = applicants.filter((a) => a.status === "pending").length;
  const activeEnrollments = students.reduce((n, s) => n + s.enrollments.filter((e) => e.status === "active").length, 0);
  const inReview = tasks.reduce((n, t) => n + Object.values(t.submissions).filter((s) => s.status === "in review").length, 0);
  const completedTasks = tasks.reduce((n, t) => n + Object.values(t.submissions).filter((s) => s.status === "approved").length, 0);
  const progressData = students.flatMap((s) => s.enrollments.map((e) => ({ name: s.name.split(" ")[0], modules: e.completedModuleIds.length })));
  const recent = [...applicants.filter((a) => a.status === "pending").map((a) => ({ t: `${a.name} applied for a course` })), ...tasks.flatMap((t) => Object.entries(t.submissions).filter(([, v]) => v.status === "in review").map(([sid]) => ({ t: `A submission for "${t.title}" is awaiting review` })))].slice(0, 6);
  return (
    <>
      <SectionHeader eyebrow="ADMIN OVERVIEW" title="Everything you're running." />
      <div className="grid grid-cols-5 gap-4 mb-8">{[{ label: "PENDING APPLICANTS", value: pendingApplicants }, { label: "ACTIVE ENROLLMENTS", value: activeEnrollments }, { label: "TASKS IN REVIEW", value: inReview }, { label: "TASKS COMPLETED", value: completedTasks }, { label: "COURSES LIVE", value: courses.filter((c) => c.status === "live").length }].map((s, i) => <div key={i} className="card rounded-2xl p-5"><div className="f-label text-[10px] mb-2" style={{ color: "#A79B84" }}>{s.label}</div><div className="f-display text-[26px] accent-text" style={{ fontWeight: 800 }}>{s.value}</div></div>)}</div>
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <div className="card rounded-2xl p-6 md:col-span-2"><div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>MODULES COMPLETED PER ENROLLMENT</div><div style={{ height: 220 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={progressData}><XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71675A" }} axisLine={{ stroke: "#E7DEC9" }} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: "#71675A" }} axisLine={false} tickLine={false} domain={[0, 8]} /><Tooltip cursor={{ fill: "#F0E7D6" }} contentStyle={{ borderRadius: 10, border: "1px solid #E7DEC9", fontSize: 13 }} /><Bar dataKey="modules" radius={[6, 6, 0, 0]}>{progressData.map((_, i) => <Cell key={i} fill="var(--accent)" />)}</Bar></BarChart></ResponsiveContainer></div></div>
        <div className="card rounded-2xl p-6"><div className="f-label text-[12px] mb-4" style={{ color: "#71675A" }}>RECENT ACTIVITY</div>{recent.length === 0 && <div className="text-[14px]" style={{ color: "#A79B84" }}>All caught up.</div>}<div className="flex flex-col gap-3">{recent.map((r, i) => <div key={i} className="text-[14px] pb-3" style={{ borderBottom: i < recent.length - 1 ? "1px solid #F0E7D6" : "none", color: "#4A4237" }}>{r.t}</div>)}</div></div>
      </div>
      <button onClick={() => setTab("applicants")} className="card rounded-2xl p-6 w-full text-left flex items-center justify-between"><div><div className="f-display text-[19px]" style={{ fontWeight: 700 }}>Review new applicants</div><div className="text-[14px] mt-1" style={{ color: "#71675A" }}>{pendingApplicants} waiting on you.</div></div><ChevronRight size={18} color="#A79B84" /></button>
    </>
  );
}

export function AdminDashboard({ courses, setCourses, students, setStudents, applicants, setApplicants, cohorts, setCohorts, tasks, setTasks, resources, setResources, community, setCommunity, notices, setNotices, directThreads, setDirectThreads, testimonials, setTestimonials, faqs, setFaqs, brand, setBrand, onExit, notifItems, notifSeen, onMarkSeen }) {
  const [tab, setTab] = useState("overview");
  const navItems = [
    { id: "overview", icon: Sparkles, label: "Overview" }, { id: "applicants", icon: ClipboardCheck, label: "Applicants" },
    { id: "cohorts", icon: Layers, label: "Cohorts" }, { id: "courses", icon: BookOpen, label: "Courses" },
    { id: "students", icon: Users, label: "Students" }, { id: "gradebook", icon: FileText, label: "Gradebook" },
    { id: "tasks", icon: ListChecks, label: "Tasks" }, { id: "library", icon: Library, label: "Library" },
    { id: "certificates", icon: Award, label: "Certificates" }, { id: "testimonials", icon: Star, label: "Testimonials" },
    { id: "faq", icon: HelpIcon, label: "FAQ" }, { id: "chat", icon: MessageCircle, label: "Chat" },
    { id: "community", icon: Users, label: "Community" }, { id: "notice", icon: Megaphone, label: "Notice Board" },
    { id: "branding", icon: Settings, label: "Branding" },
  ];
  return (
    <div className="min-h-screen flex">
      <aside className="w-[250px] shrink-0 px-5 py-6 flex flex-col overflow-y-auto" style={{ borderRight: "1px solid #E7DEC9" }}>
        <div className="flex items-center justify-between mb-1 px-2"><LogoMark height={38} /><button onClick={onExit} title="Sign out"><LogOut size={16} color="#A79B84" /></button></div>
        <div className="f-label text-[11px] mb-4 px-2" style={{ color: "#A79B84" }}>ADMIN</div>
        <div className="px-2 mb-3"><NotifBell items={notifItems} seen={notifSeen} onMarkSeen={onMarkSeen} /></div>
        <div className="flex flex-col gap-1 flex-1">{navItems.map((n) => <SidebarLink key={n.id} icon={n.icon} label={n.label} active={tab === n.id} onClick={() => setTab(n.id)} />)}</div>
        <button onClick={onExit} className="flex items-center gap-2 px-4 py-2.5 text-[14px] mt-4" style={{ color: "#A79B84", fontWeight: 600 }}><LogOut size={16} /> Sign out</button>
      </aside>
      <main className="flex-1 px-10 md:px-16 py-12 max-w-[1040px]">
        {tab === "overview" && <OverviewTab courses={courses} students={students} applicants={applicants} tasks={tasks} setTab={setTab} />}
        {tab === "applicants" && <ApplicantsTab applicants={applicants} setApplicants={setApplicants} students={students} setStudents={setStudents} courses={courses} cohorts={cohorts} />}
        {tab === "cohorts" && <CohortsTab cohorts={cohorts} setCohorts={setCohorts} courses={courses} students={students} />}
        {tab === "courses" && <CoursesTab courses={courses} setCourses={setCourses} testimonials={testimonials} />}
        {tab === "students" && <StudentsTab students={students} setStudents={setStudents} applicants={applicants} courses={courses} cohorts={cohorts} />}
        {tab === "gradebook" && <GradebookTab students={students} courses={courses} />}
        {tab === "tasks" && <TasksTab tasks={tasks} setTasks={setTasks} students={students} courses={courses} />}
        {tab === "library" && <LibraryTab resources={resources} setResources={setResources} courses={courses} />}
        {tab === "certificates" && <CertificatesTab students={students} setStudents={setStudents} courses={courses} />}
        {tab === "testimonials" && <TestimonialsTab testimonials={testimonials} setTestimonials={setTestimonials} />}
        {tab === "faq" && <FaqTab faqs={faqs} setFaqs={setFaqs} />}
        {tab === "chat" && <AdminChatTab students={students} directThreads={directThreads} setDirectThreads={setDirectThreads} />}
        {tab === "community" && <AdminCommunityTab community={community} setCommunity={setCommunity} students={students} />}
        {tab === "notice" && <AdminNoticeTab notices={notices} setNotices={setNotices} cohorts={cohorts} />}
        {tab === "branding" && <BrandingTab brand={brand} setBrand={setBrand} />}
      </main>
    </div>
  );
}

// =========================================================
// APP
// =========================================================
