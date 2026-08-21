import React, { useState, useEffect, useRef } from "react";
import {
  seedCourses, seedCohorts, seedStudents, seedApplicants, seedTasks,
  seedResources, seedTestimonials, seedFaqs, FONT_STYLE, genCode, nextStudentId,
} from "./lib/data.js";
import {
  Landing, CoursesIndex, CourseDetail, ResourcesPage, ApplicationForm,
  SignInScreen, InReviewScreen, CodeRedeemScreen,
} from "./components.jsx";
import { MyCourses } from "./student.jsx";
import { AdminDashboard } from "./admin.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { signIn, signOut, signUpApplicant, sendPasswordReset, isAdminEmail } from "./lib/auth.js";
import { fetchApplicants, insertApplicant, updateApplicant, fetchStudents, insertStudent, updateStudent } from "./lib/db.js";

export default function App() {
  const [page, setPage] = useState("landing");
  const [presetCourseId, setPresetCourseId] = useState(null);
  const [viewCourseId, setViewCourseId] = useState(null);
  const [applyingAsExisting, setApplyingAsExisting] = useState(null);
  const [courses, setCourses] = useState(seedCourses);
  const [cohorts, setCohorts] = useState(seedCohorts);
  const [students, setStudents] = useState(seedStudents);
  const [applicants, setApplicants] = useState(seedApplicants);
  const [tasks, setTasks] = useState(seedTasks);
  const [resources, setResources] = useState(seedResources.map((r) => ({ ...r, visibility: r.visibility || "course" })));
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
  // resources, community, notices, chat) is still local/mock -- that's Phase 2.
  function syncStudents(updater) {
    setStudents((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before && before !== item) updateStudent(item.id, item).catch((e) => console.error("updateStudent failed", e)); });
      return next;
    });
  }
  function syncApplicants(updater) {
    setApplicants((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before && before !== item) updateApplicant(item.id, item).catch((e) => console.error("updateApplicant failed", e)); });
      return next;
    });
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

  async function submitApplication(data) {
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
    return null;
  }
  async function acceptApplicant(applicant, cohortId) {
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
  }
  function redeemCode(enrollmentId) { syncStudents((prev) => prev.map((s) => s.id !== activeStudent.id ? s : { ...s, enrollments: s.enrollments.map((e) => e.id === enrollmentId ? { ...e, status: "active" } : e) })); }
  const liveStudent = activeStudent ? students.find((s) => s.id === activeStudent.id) || activeStudent : null;
  const liveApplicant = activeApplicant ? applicants.find((a) => a.id === activeApplicant.id) || activeApplicant : null;
  const viewCourse = viewCourseId ? courses.find((c) => c.id === viewCourseId) : null;
  const pendingEnrollment = liveStudent?.enrollments.find((e) => e.status === "awaiting-code");

  const adminNotifItems = [
    ...applicants.filter((a) => a.status === "pending").map((a) => ({ id: `ap-${a.id}`, t: `${a.name} applied for a course` })),
    ...tasks.flatMap((t) => Object.entries(t.submissions).filter(([, v]) => v.status === "in review").map(([sid]) => ({ id: `sub-${t.id}-${sid}`, t: `New submission for "${t.title}"` }))),
    ...students.flatMap((s) => s.enrollments.filter((e) => e.pendingReview).map((e) => ({ id: `mod-${e.id}`, t: `${s.name} submitted a module quick check for review` }))),
  ];
  const studentNotifItems = liveStudent ? [
    ...tasks.filter((t) => t.assigned.includes(liveStudent.id)).flatMap((t) => { const sub = t.submissions[liveStudent.id]; return sub && sub.status === "approved" ? [{ id: `grade-${t.id}`, t: `Your task "${t.title}" was reviewed — ${sub.score}%` }] : []; }),
    ...liveStudent.enrollments.filter((e) => e.certificateReady).map((e) => ({ id: `cert-${e.id}`, t: "Your certificate is ready to download" })),
  ] : [];

  return (
    <div className="lms-root" style={{ "--accent": brand.accent }}>
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
        <AdminDashboard courses={courses} setCourses={setCourses} students={students} setStudents={syncStudents} applicants={applicants} setApplicants={syncApplicants} onAcceptApplicant={acceptApplicant} cohorts={cohorts} setCohorts={setCohorts} tasks={tasks} setTasks={setTasks} resources={resources} setResources={setResources} community={community} setCommunity={setCommunity} notices={notices} setNotices={setNotices} directThreads={directThreads} setDirectThreads={setDirectThreads} testimonials={testimonials} setTestimonials={setTestimonials} faqs={faqs} setFaqs={setFaqs} brand={brand} setBrand={setBrand} adminProfile={adminProfile} setAdminProfile={setAdminProfile} onExit={handleSignOut} notifItems={adminNotifItems} notifSeen={adminNotifSeen} onMarkSeen={setAdminNotifSeen} />
      )}
    </div>
  );
}
