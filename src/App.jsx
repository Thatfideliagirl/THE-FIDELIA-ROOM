import React, { useState, useEffect, useRef } from "react";
import {
  seedCohorts, seedStudents, seedApplicants, seedTasks,
  seedTestimonials, seedFaqs, FONT_STYLE, genCode, nextStudentId,
} from "./lib/data.js";
import {
  Landing, CoursesIndex, CourseDetail, ResourcesPage, ApplicationForm,
  SignInScreen, InReviewScreen, CodeRedeemScreen,
} from "./components.jsx";
import { MyCourses } from "./student.jsx";
import { AdminDashboard } from "./admin.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { signIn, signOut, signUpApplicant, sendPasswordReset, isAdminEmail } from "./lib/auth.js";
import { fetchApplicants, insertApplicant, updateApplicant, fetchStudents, insertStudent, updateStudent, fetchResources, insertResource, updateResource, deleteResource, fetchCourses, upsertCourse, fetchSettings, updateSettings } from "./lib/db.js";
import { sendWelcomeEmail, sendAcceptanceEmail } from "./lib/email.js";

export default function App() {
  const [page, setPage] = useState("landing");
  const [presetCourseId, setPresetCourseId] = useState(null);
  const [viewCourseId, setViewCourseId] = useState(null);
  const [applyingAsExisting, setApplyingAsExisting] = useState(null);
  const [courses, setCourses] = useState([]);
  const [cohorts, setCohorts] = useState(seedCohorts);
  const [students, setStudents] = useState(seedStudents);
  const [applicants, setApplicants] = useState(seedApplicants);
  const [tasks, setTasks] = useState(seedTasks);
  const [resources, setResources] = useState([]);
  const [testimonials, setTestimonials] = useState(seedTestimonials);
  const [faqs, setFaqs] = useState(seedFaqs);
  const [community, setCommunity] = useState([]);
  const [notices, setNotices] = useState([{ id: "n0", text: "Welcome to Virtual Assistant Foundations, cohort!", cohortId: "all", seenBy: [] }]);
  const [directThreads, setDirectThreads] = useState({});
  const [brand, setBrand] = useState({ name: "FJ Room", accent: "#1C6FA0", email: "FJRoomm@gmail.com", whatsapp: "2348135793935", instagram: "VA_WEY_DEY_PAMPER", twitter: "VA_WeyDeyPamper" });
  const [adminProfile, setAdminProfile] = useState({ name: "Fidelia Joseph", photo: null, bio: "" });
  const [activeStudent, setActiveStudent] = useState(null);
  const [activeApplicant, setActiveApplicant] = useState(null);
  const [adminNotifSeen, setAdminNotifSeen] = useState([]);
  const [studentNotifSeen, setStudentNotifSeen] = useState([]);

  useEffect(() => { const el = document.createElement("style"); el.innerHTML = FONT_STYLE; document.head.appendChild(el); return () => document.head.removeChild(el); }, []);

  // Real accounts (Phase 1): applicants + students live in Supabase now, guarded
  // by real login. These wrapped setters keep every existing setStudents/
  // setApplicants call site in student.jsx/admin.jsx working unchanged --
  // whatever record actually changed (a new object reference, from the usual
  // `.map(x => x.id !== id ? x : {...x, ...})` pattern) gets written back to
  // Supabase in the background. Everything else (courses, cohorts, tasks,
  // community, notices, chat) is still local/mock -- that's the rest of Phase 2.
  //
  // These background writes have no UI of their own to show a failure in --
  // callers just call setX and move on. saveError/reportSaveError gives every
  // sync wrapper below a single shared place to surface "that didn't actually
  // save" instead of only logging to a console nobody's watching.
  const [saveError, setSaveError] = useState("");
  function reportSaveError(context) { return (e) => { console.error(context, e); setSaveError("Something didn't save -- check your connection and try that again."); }; }
  function syncStudents(updater) {
    setStudents((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before && before !== item) updateStudent(item.id, item).catch(reportSaveError("updateStudent failed")); });
      return next;
    });
  }
  function syncApplicants(updater) {
    setApplicants((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before && before !== item) updateApplicant(item.id, item).catch(reportSaveError("updateApplicant failed")); });
      return next;
    });
  }

  // Resources are real too, now -- fetched on load regardless of login (the
  // public Resources page needs them without anyone signed in). add/edit
  // return an error string (or null) so the form can show it instead of
  // silently closing on failure.
  useEffect(() => { fetchResources().then(setResources).catch((e) => console.error("fetchResources failed", e)); }, []);

  // Courses and branding/admin-profile are real now too -- both fetched on
  // load regardless of login (the public landing/courses pages need them).
  // syncCourses mirrors syncStudents/syncApplicants: any item whose reference
  // changed (existing edit) or that's missing from prev (a brand-new course
  // from addCourse) gets upserted in the background, so every existing
  // setCourses call site in admin.jsx keeps working unchanged.
  useEffect(() => { fetchCourses().then(setCourses).catch((e) => console.error("fetchCourses failed", e)); }, []);
  function syncCourses(updater) {
    setCourses((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before !== item) upsertCourse(item).catch(reportSaveError("upsertCourse failed")); });
      return next;
    });
  }
  useEffect(() => { fetchSettings().then((s) => { if (s) { setBrand(s.brand); setAdminProfile(s.adminProfile); } }).catch((e) => console.error("fetchSettings failed", e)); }, []);
  function syncBrand(updater) {
    setBrand((prev) => { const next = typeof updater === "function" ? updater(prev) : updater; updateSettings({ brand: next, adminProfile }).catch(reportSaveError("updateSettings failed")); return next; });
  }
  function syncAdminProfile(updater) {
    setAdminProfile((prev) => { const next = typeof updater === "function" ? updater(prev) : updater; updateSettings({ brand, adminProfile: next }).catch(reportSaveError("updateSettings failed")); return next; });
  }
  async function addResource(data) {
    try { const saved = await insertResource(data); setResources((prev) => [...prev, saved]); return null; }
    catch (e) { console.error("insertResource failed", e); return "Couldn't save this resource — check your connection and try again."; }
  }
  async function editResource(id, data) {
    try { const saved = await updateResource(id, data); setResources((prev) => prev.map((r) => r.id === id ? saved : r)); return null; }
    catch (e) { console.error("updateResource failed", e); return "Couldn't save this resource — check your connection and try again."; }
  }
  async function removeResource(id) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    try { await deleteResource(id); } catch (e) { console.error("deleteResource failed", e); }
  }

  async function loadForSession(session) {
    if (!session) { setStudents([]); setApplicants([]); return; }
    const [studs, apps] = await Promise.all([fetchStudents(), fetchApplicants()]);
    setStudents(studs); setApplicants(apps);
    const email = session.user.email;
    if (isAdminEmail(email)) { setPage("adminDash"); return; }
    const myStudent = studs.find((s) => s.authUserId === session.user.id || s.email.toLowerCase() === email.toLowerCase());
    if (myStudent) { setActiveStudent(myStudent); setPage("studentDash"); return; }
    const myApplicant = [...apps].reverse().find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (myApplicant) { setActiveApplicant(myApplicant); setPage(myApplicant.status === "pending" ? "inReview" : "landing"); }
  }
  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => loadForSession(data.session));
    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => loadForSession(session)) || { data: null };
    return () => listener?.subscription.unsubscribe();
  }, []);

  async function handleSignIn(identifier, password) {
    const result = await signIn(identifier, password);
    return result.error || null;
  }
  async function handleForgotPassword(email) { const { error } = await sendPasswordReset(email); return error; }
  async function handleSignOut() { await signOut(); setActiveStudent(null); setActiveApplicant(null); setPage("landing"); }

  // insertApplicant/insertStudent/updateStudent/updateApplicant throw on failure
  // (a real DB error, or a blocked/dropped connection) -- caught here so a
  // failure always resolves the caller's loading state and shows a message,
  // instead of leaving a "Submitting..." button stuck forever.
  async function submitApplication(data) {
    try {
      const { password, ...rest } = data;
      if (applyingAsExisting) {
        const saved = await insertApplicant({ ...rest, status: "pending", studentRef: applyingAsExisting.id });
        setApplicants((prev) => [...prev, saved]);
        setActiveStudent(applyingAsExisting); setPage("studentDash");
        return null;
      }
      const { error, authUserId } = await signUpApplicant({ name: rest.name, email: rest.email, password });
      if (error) return error.toLowerCase().includes("already registered") ? "That email already has an account — try signing in instead." : error;
      const saved = await insertApplicant({ ...rest, status: "pending", studentRef: null, authUserId });
      setApplicants((prev) => [...prev, saved]);
      setActiveApplicant(saved); setApplyingAsExisting(null); setPage("inReview");
      sendWelcomeEmail({ email: rest.email, name: rest.name, courseName: courses.find((c) => c.id === rest.courseId)?.title || "your course" });
      return null;
    } catch (e) {
      console.error("submitApplication failed", e);
      return "Couldn't reach the server — check your connection and try again.";
    }
  }
  async function acceptApplicant(applicant, cohortId) {
    try {
      const code = genCode();
      if (applicant.studentRef) {
        const student = students.find((s) => s.id === applicant.studentRef);
        const updated = await updateStudent(student.id, { ...student, enrollments: [...student.enrollments, { id: "e" + Date.now(), courseId: applicant.courseId, code, status: "awaiting-code", completedModuleIds: [], certificateReady: false, certificateFile: null }] });
        setStudents((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      } else {
        const studentId = nextStudentId(students);
        const newStudent = await insertStudent({ studentId, name: applicant.name, email: applicant.email, cohortId, photo: null, seenTour: false, accountStatus: "active", authUserId: applicant.authUserId, enrollments: [{ id: "e" + Date.now(), courseId: applicant.courseId, code, status: "awaiting-code", completedModuleIds: [], certificateReady: false, certificateFile: null }] });
        setStudents((prev) => [...prev, newStudent]);
      }
      const acceptedApplicant = await updateApplicant(applicant.id, { ...applicant, status: "accepted" });
      setApplicants((prev) => prev.map((a) => a.id === acceptedApplicant.id ? acceptedApplicant : a));
      sendAcceptanceEmail({ email: applicant.email, name: applicant.name, courseName: courses.find((c) => c.id === applicant.courseId)?.title || "your course", accessCode: code, loginUrl: window.location.origin });
      return null;
    } catch (e) {
      console.error("acceptApplicant failed", e);
      return "Couldn't accept this applicant — check your connection and try again.";
    }
  }
  function redeemCode(enrollmentId) { syncStudents((prev) => prev.map((s) => s.id !== activeStudent.id ? s : { ...s, enrollments: s.enrollments.map((e) => e.id === enrollmentId ? { ...e, status: "active" } : e) })); }
  const liveStudent = activeStudent ? students.find((s) => s.id === activeStudent.id) || activeStudent : null;
  const liveApplicant = activeApplicant ? applicants.find((a) => a.id === activeApplicant.id) || activeApplicant : null;
  const viewCourse = viewCourseId ? courses.find((c) => c.id === viewCourseId) : null;
  // Only gate the whole dashboard behind the code-entry screen for a genuinely
  // brand-new student (nothing usable yet). A student who already has an
  // active course and gets accepted into a second one shouldn't be locked
  // out of the first while that second code is still unredeemed -- they
  // redeem it inline from My Courses instead (see MyCourses).
  const hasUsableEnrollment = liveStudent?.enrollments.some((e) => e.status !== "awaiting-code");
  const pendingEnrollment = !hasUsableEnrollment ? liveStudent?.enrollments.find((e) => e.status === "awaiting-code") : null;

  const adminNotifItems = [
    ...applicants.filter((a) => a.status === "pending").map((a) => ({ id: `ap-${a.id}`, t: `${a.name} applied for a course` })),
    ...tasks.flatMap((t) => Object.entries(t.submissions).filter(([, v]) => v.status === "in review").map(([sid]) => ({ id: `sub-${t.id}-${sid}`, t: `New submission for "${t.title}"` }))),
    ...students.flatMap((s) => s.enrollments.filter((e) => e.pendingReview).map((e) => ({ id: `mod-${e.id}`, t: `${s.name} submitted a module quick check for review` }))),
  ];
  const studentNotifItems = liveStudent ? [
    ...tasks.filter((t) => t.assigned.includes(liveStudent.id) && !t.submissions[liveStudent.id]).map((t) => ({ id: `assigned-${t.id}`, t: `You've been assigned a new task: "${t.title}"` })),
    ...tasks.filter((t) => t.assigned.includes(liveStudent.id)).flatMap((t) => { const sub = t.submissions[liveStudent.id]; return sub && sub.status === "approved" ? [{ id: `grade-${t.id}`, t: `Your task "${t.title}" was reviewed — ${sub.score}%` }] : []; }),
    ...liveStudent.enrollments.filter((e) => e.certificateReady).map((e) => ({ id: `cert-${e.id}`, t: "Your certificate is ready to download" })),
  ] : [];

  return (
    <div className="lms-root" style={{ "--accent": brand.accent }}>
      {saveError && (
        <div className="fixed left-1/2 z-[999] flex items-center gap-3 rounded-xl px-5 py-3 text-[13px]" style={{ top: 16, transform: "translateX(-50%)", background: "#B04A3A", color: "#FAF6EC", boxShadow: "0 14px 30px -10px rgba(0,0,0,.35)", fontWeight: 600 }}>
          {saveError}
          <button onClick={() => setSaveError("")} className="f-label text-[11px]" style={{ opacity: .85 }}>DISMISS</button>
        </div>
      )}
      {page === "landing" && <Landing courses={courses} resources={resources} testimonials={testimonials} faqs={faqs} brand={brand} onSignIn={() => setPage("login")} onSignUp={(courseId) => { setPresetCourseId(typeof courseId === "string" ? courseId : null); setApplyingAsExisting(null); setPage("signup"); }} onViewCourses={() => setPage("courses")} onViewResources={() => setPage("resources")} onViewCourseDetail={(id) => { setViewCourseId(id); setPage("courseDetail"); }} />}
      {page === "courses" && <CoursesIndex courses={courses} onBack={() => setPage("landing")} onOpen={(id) => { setViewCourseId(id); setPage("courseDetail"); }} />}
      {page === "courseDetail" && viewCourse && <CourseDetail course={viewCourse} testimonials={testimonials} onBack={() => setPage("courses")} onApply={(id) => { setPresetCourseId(id); setApplyingAsExisting(null); setPage("signup"); }} />}
      {page === "resources" && <ResourcesPage resources={resources} onBack={() => setPage("landing")} />}
      {page === "signup" && <ApplicationForm courses={courses} cohorts={cohorts} presetCourseId={presetCourseId} existingUser={applyingAsExisting} onSubmit={submitApplication} onCancel={() => setPage(applyingAsExisting ? "studentDash" : "landing")} />}
      {page === "login" && <SignInScreen students={students} applicants={applicants} onBack={() => setPage("landing")} onSignIn={handleSignIn} onForgotPassword={handleForgotPassword} onEnterStudent={(s) => { setActiveStudent(s); setPage("studentDash"); }} onEnterApplicant={(a) => { setActiveApplicant(a); setPage("inReview"); }} onEnterAdmin={() => setPage("adminDash")} />}
      {page === "inReview" && liveApplicant && <InReviewScreen applicant={liveApplicant} onExit={handleSignOut} />}
      {page === "studentDash" && liveStudent && pendingEnrollment && <CodeRedeemScreen student={liveStudent} enrollment={pendingEnrollment} onRedeem={() => redeemCode(pendingEnrollment.id)} onExit={handleSignOut} />}
      {page === "studentDash" && liveStudent && !pendingEnrollment && (
        <MyCourses student={liveStudent} setStudents={syncStudents} courses={courses} cohorts={cohorts} applicants={applicants} tasks={tasks} setTasks={setTasks} resources={resources} community={community} setCommunity={setCommunity} notices={notices.filter((n) => n.cohortId === "all" || n.cohortId === liveStudent.cohortId)} setNotices={setNotices} directThreads={directThreads} setDirectThreads={setDirectThreads} allStudents={students} onExit={handleSignOut} onApplyMore={(courseId) => { setApplyingAsExisting(liveStudent); setPresetCourseId(courseId || null); setPage("signup"); }} notifItems={studentNotifItems} notifSeen={studentNotifSeen} onMarkSeen={setStudentNotifSeen} />
      )}
      {page === "adminDash" && (
        <AdminDashboard courses={courses} setCourses={syncCourses} students={students} setStudents={syncStudents} applicants={applicants} setApplicants={syncApplicants} onAcceptApplicant={acceptApplicant} cohorts={cohorts} setCohorts={setCohorts} tasks={tasks} setTasks={setTasks} resources={resources} onAddResource={addResource} onEditResource={editResource} onRemoveResource={removeResource} community={community} setCommunity={setCommunity} notices={notices} setNotices={setNotices} directThreads={directThreads} setDirectThreads={setDirectThreads} testimonials={testimonials} setTestimonials={setTestimonials} faqs={faqs} setFaqs={setFaqs} brand={brand} setBrand={syncBrand} adminProfile={adminProfile} setAdminProfile={syncAdminProfile} onExit={handleSignOut} notifItems={adminNotifItems} notifSeen={adminNotifSeen} onMarkSeen={setAdminNotifSeen} />
      )}
    </div>
  );
}
