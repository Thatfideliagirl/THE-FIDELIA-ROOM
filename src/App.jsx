import React, { useState, useEffect, useRef } from "react";
import {
  seedStudents, seedApplicants, seedTasks,
  seedTestimonials, seedFaqs, FONT_STYLE, genCode, nextStudentId,
} from "./lib/data.js";
import {
  Landing, CoursesIndex, CourseDetail, ResourcesPage, ApplicationForm,
  SignInScreen, InReviewScreen, CodeRedeemScreen, LogoMark, Field, ResourceDetail,
} from "./components.jsx";
import { MyCourses } from "./student.jsx";
import { AdminDashboard } from "./admin.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { signIn, signOut, signUpApplicant, sendPasswordReset, isAdminEmail } from "./lib/auth.js";
import { fetchApplicants, insertApplicant, updateApplicant, deleteApplicant, fetchStudents, insertStudent, updateStudent, deleteStudent, fetchResources, insertResource, updateResource, deleteResource, fetchCourses, upsertCourse, fetchCohorts, upsertCohort, deleteCohort, fetchSettings, updateSettings } from "./lib/db.js";
import { sendWelcomeEmail, sendAcceptanceEmail } from "./lib/email.js";

// Captured the instant this module evaluates -- before Supabase's own client
// (imported above) gets any chance to run its background session-detection
// and silently strip these tokens from the URL. Reading this later, e.g.
// inside a useEffect, races that background work and loses often enough to
// be the actual bug: the tokens are gone by the time React's first effect
// runs, so a recovery link falls through to a normal sign-in instead of the
// reset-password screen.
const isRecoveryLink = typeof window !== "undefined" && (window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery"));
// A reset/confirmation link that's expired or was already clicked once
// (email links are single-use) redirects here with "error=..." in the URL
// instead of the tokens -- previously this fell through to a plain landing
// page with no explanation, so it looked like the link "just didn't work".
const isExpiredAuthLink = typeof window !== "undefined" && (window.location.hash.includes("error=") || window.location.search.includes("error="));

export default function App() {
  const [page, setPage] = useState(() => (isRecoveryLink ? "resetPassword" : isExpiredAuthLink ? "linkExpired" : "landing"));
  const [presetCourseId, setPresetCourseId] = useState(null);
  const [viewCourseId, setViewCourseId] = useState(null);
  const [applyingAsExisting, setApplyingAsExisting] = useState(null);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState("");
  // A resource's "copy shareable link" produces a URL like /?r=<id> -- read
  // that on first load so anyone opening a shared link lands directly on
  // that resource, layered over the normal public site behind it (rather
  // than a bare, isolated page), so they see the rest of FJ Room too.
  const [sharedResourceId, setSharedResourceId] = useState(() => new URLSearchParams(window.location.search).get("r"));
  const [courses, setCourses] = useState([]);
  const [cohorts, setCohorts] = useState([]);
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
  const [isAdminSession, setIsAdminSession] = useState(false);
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
  async function removeStudent(id) {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try { await deleteStudent(id); } catch (e) { reportSaveError("deleteStudent failed")(e); }
  }
  function syncApplicants(updater) {
    setApplicants((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before && before !== item) updateApplicant(item.id, item).catch(reportSaveError("updateApplicant failed")); });
      return next;
    });
  }
  async function removeApplicant(id) {
    setApplicants((prev) => prev.filter((a) => a.id !== id));
    try { await deleteApplicant(id); } catch (e) { reportSaveError("deleteApplicant failed")(e); }
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
  // Cohorts too -- same shape as syncCourses, but cohorts can also be
  // deleted (admin.jsx's remove()), so anything present in prev but missing
  // from next gets deleted in the background as well.
  useEffect(() => { fetchCohorts().then(setCohorts).catch((e) => console.error("fetchCohorts failed", e)); }, []);
  function syncCohorts(updater) {
    setCohorts((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before !== item) upsertCohort(item).catch(reportSaveError("upsertCohort failed")); });
      prev.forEach((item) => { if (!next.find((x) => x.id === item.id)) deleteCohort(item.id).catch(reportSaveError("deleteCohort failed")); });
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
    if (isAdminEmail(email)) { setIsAdminSession(true); setPage("adminDash"); return; }
    const myStudent = studs.find((s) => s.authUserId === session.user.id || s.email.toLowerCase() === email.toLowerCase());
    if (myStudent) { setActiveStudent(myStudent); setPage("studentDash"); return; }
    const myApplicant = [...apps].reverse().find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (myApplicant) { setActiveApplicant(myApplicant); setPage(myApplicant.status === "pending" ? "inReview" : "landing"); return; }
    // A real, working login with no matching applicant/student record --
    // e.g. the account got created but the application step right after it
    // failed. Silently landing on the plain landing page here looked
    // exactly like "nothing happened" with no way to tell what went wrong.
    setPage("accountNotFound");
  }
  useEffect(() => {
    // isRecoveryLink (module-level, captured before Supabase's client could
    // touch the URL) already put us on the resetPassword screen via the
    // initial page state above. Skipping getSession() here too -- on a
    // recovery link it would resolve to the temporary recovery session and
    // call loadForSession(), dumping the user on whatever their account
    // normally opens to instead of letting them set a new password.
    if (!isRecoveryLink) {
      supabase?.auth.getSession().then(({ data }) => loadForSession(data.session));
    }
    const { data: listener } = supabase?.auth.onAuthStateChange((event, session) => {
      // Establishing the recovery link's temporary session fires its own
      // auth event (not only "PASSWORD_RECOVERY" -- versions/timing vary,
      // and a plain SIGNED_IN/INITIAL_SESSION can fire right alongside it).
      // Routing that through loadForSession() signed the user straight into
      // their dashboard the instant the link was opened, before they ever
      // got a chance to type a new password -- the reset screen would flash
      // and immediately get replaced. While handling a recovery link, every
      // auth event is ignored here; only the explicit "Continue" button
      // after a successful save is allowed to route them onward.
      if (isRecoveryLink) return;
      loadForSession(session);
    }) || { data: null };
    return () => listener?.subscription.unsubscribe();
  }, []);
  const [newPassword, setNewPassword] = useState(""); const [resetSaving, setResetSaving] = useState(false); const [resetError, setResetError] = useState(""); const [resetDone, setResetDone] = useState(false);
  async function submitNewPassword() {
    if (newPassword.length < 6) { setResetError("Needs at least 6 characters."); return; }
    setResetSaving(true); setResetError("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setResetSaving(false);
    if (error) { setResetError(error.message); return; }
    setResetDone(true);
  }

  async function handleSignIn(identifier, password) {
    const result = await signIn(identifier, password);
    if (!result.error) return null;
    return result.error === "unknown" && result.detail ? result.detail : result.error;
  }
  async function handleForgotPassword(email) { const { error } = await sendPasswordReset(email); return error; }
  async function handleSignOut() { await signOut(); setActiveStudent(null); setActiveApplicant(null); setIsAdminSession(false); setPage("landing"); }

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
      const { error, authUserId, needsConfirmation } = await signUpApplicant({ name: rest.name, email: rest.email, password, courseId: rest.courseId, answers: rest.answers });
      if (error) return error.toLowerCase().includes("already registered") ? "That email already has an account — try signing in instead." : error;
      if (needsConfirmation) {
        // No session yet, so nothing can be saved until they confirm --
        // the applicant row gets created automatically by a database
        // trigger the moment their email is confirmed (see signUpApplicant).
        setPendingConfirmEmail(rest.email);
        setPage("checkEmail");
        sendWelcomeEmail({ email: rest.email, name: rest.name, courseName: courses.find((c) => c.id === rest.courseId)?.title || "your course" });
        return null;
      }
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
      {page === "landing" && (isAdminSession || liveStudent) && (
        <button onClick={() => setPage(isAdminSession ? "adminDash" : "studentDash")} className="fixed z-[999] f-label text-[11px] px-4 py-2 rounded-full" style={{ top: 16, left: 16, background: "var(--accent)", color: "#FAF6EC", fontWeight: 700, boxShadow: "0 10px 22px -10px rgba(0,0,0,.4)" }}>BACK TO DASHBOARD</button>
      )}
      {sharedResourceId && resources.find((r) => r.id === sharedResourceId) && (
        <ResourceDetail
          resource={resources.find((r) => r.id === sharedResourceId)}
          onClose={() => { setSharedResourceId(null); window.history.replaceState({}, "", window.location.pathname); }}
          onBrowseMore={() => { setSharedResourceId(null); window.history.replaceState({}, "", window.location.pathname); setPage("resources"); }}
        />
      )}
      {page === "landing" && <Landing courses={courses} resources={resources} testimonials={testimonials} faqs={faqs} brand={brand} onSignIn={() => setPage("login")} onSignUp={(courseId) => { setPresetCourseId(typeof courseId === "string" ? courseId : null); setApplyingAsExisting(null); setPage("signup"); }} onViewCourses={() => setPage("courses")} onViewResources={() => setPage("resources")} onViewCourseDetail={(id) => { setViewCourseId(id); setPage("courseDetail"); }} />}
      {page === "courses" && <CoursesIndex courses={courses} onBack={() => setPage("landing")} onOpen={(id) => { setViewCourseId(id); setPage("courseDetail"); }} />}
      {page === "courseDetail" && viewCourse && <CourseDetail course={viewCourse} testimonials={testimonials} onBack={() => setPage("courses")} onApply={(id) => { setPresetCourseId(id); setApplyingAsExisting(null); setPage("signup"); }} />}
      {page === "resources" && <ResourcesPage resources={resources} onBack={() => setPage("landing")} />}
      {page === "signup" && <ApplicationForm courses={courses} cohorts={cohorts} presetCourseId={presetCourseId} existingUser={applyingAsExisting} onSubmit={submitApplication} onCancel={() => setPage(applyingAsExisting ? "studentDash" : "landing")} />}
      {page === "login" && <SignInScreen students={students} applicants={applicants} onBack={() => setPage("landing")} onSignIn={handleSignIn} onForgotPassword={handleForgotPassword} onEnterStudent={(s) => { setActiveStudent(s); setPage("studentDash"); }} onEnterApplicant={(a) => { setActiveApplicant(a); setPage("inReview"); }} onEnterAdmin={() => setPage("adminDash")} />}
      {page === "inReview" && liveApplicant && <InReviewScreen applicant={liveApplicant} onExit={handleSignOut} />}
      {page === "resetPassword" && (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="reveal in w-full max-w-[420px]">
            <div className="flex flex-col items-center text-center mb-8"><LogoMark height={80} /><div className="f-label text-[13px] mt-5 mb-1 accent-text">RESET PASSWORD</div><h2 className="f-display text-[26px]" style={{ fontWeight: 800 }}>Choose a new password.</h2></div>
            <div className="card rounded-2xl p-7 flex flex-col gap-4" style={{ boxShadow: "0 20px 50px -24px rgba(38,32,25,0.16)" }}>
              {resetDone ? (
                <>
                  <div className="text-[14px] accent-text">Your password's been updated — you're signed in.</div>
                  <button onClick={() => { setResetDone(false); setNewPassword(""); supabase.auth.getSession().then(({ data }) => loadForSession(data.session)); }} className="btn-primary rounded-lg py-3 text-[15px]">Continue</button>
                </>
              ) : (
                <>
                  <Field label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                  {resetError && <div className="text-[13px]" style={{ color: "#B04A3A" }}>{resetError}</div>}
                  <button disabled={resetSaving} onClick={submitNewPassword} className="btn-primary rounded-lg py-3 text-[15px]">{resetSaving ? "Saving…" : "Save new password"}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {page === "linkExpired" && (
        <div className="min-h-screen flex items-center justify-center px-6 text-center">
          <div className="reveal in max-w-[420px]">
            <LogoMark height={64} />
            <div className="f-label text-[13px] mt-6 mb-3 accent-text">LINK EXPIRED</div>
            <h1 className="f-display text-[26px] mb-4" style={{ fontWeight: 800 }}>That link's no longer valid.</h1>
            <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#71675A" }}>It's either expired or was already used once — email links only work one time. Head back to sign in and request a fresh one.</p>
            <button onClick={() => setPage("login")} className="btn-primary rounded-lg py-3 px-6 text-[15px]">Back to sign in</button>
          </div>
        </div>
      )}
      {page === "checkEmail" && (
        <div className="min-h-screen flex items-center justify-center px-6 text-center">
          <div className="reveal in max-w-[420px]">
            <LogoMark height={64} />
            <div className="f-label text-[13px] mt-6 mb-3 accent-text">CHECK YOUR EMAIL</div>
            <h1 className="f-display text-[26px] mb-4" style={{ fontWeight: 800 }}>Confirm your email to continue.</h1>
            <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#71675A" }}>We've sent a confirmation link to <strong>{pendingConfirmEmail}</strong>. Open it and tap the link — it'll bring you right back here, and your application will be submitted automatically. Don't see it? Check your spam/junk folder too.</p>
            <button onClick={() => setPage("landing")} className="f-label text-[12px]" style={{ color: "#A79B84" }}>BACK TO HOME</button>
          </div>
        </div>
      )}
      {page === "accountNotFound" && (
        <div className="min-h-screen flex items-center justify-center px-6 text-center">
          <div className="reveal in max-w-[420px]">
            <LogoMark height={64} />
            <div className="f-label text-[13px] mt-6 mb-3 accent-text">ACCOUNT NOT FOUND</div>
            <h1 className="f-display text-[26px] mb-4" style={{ fontWeight: 800 }}>We can't find an application for this account.</h1>
            <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#71675A" }}>You're signed in, but there's no application on file for this email. If you started applying before and it didn't go through, please apply again.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setPage("signup")} className="btn-primary rounded-lg py-3 text-[15px]">Apply again</button>
              <button onClick={handleSignOut} className="f-label text-[12px]" style={{ color: "#A79B84" }}>SIGN OUT</button>
            </div>
          </div>
        </div>
      )}
      {page === "studentDash" && liveStudent && pendingEnrollment && <CodeRedeemScreen student={liveStudent} enrollment={pendingEnrollment} onRedeem={() => redeemCode(pendingEnrollment.id)} onExit={handleSignOut} />}
      {page === "studentDash" && liveStudent && !pendingEnrollment && (
        <MyCourses student={liveStudent} setStudents={syncStudents} courses={courses} cohorts={cohorts} applicants={applicants} tasks={tasks} setTasks={setTasks} resources={resources} community={community} setCommunity={setCommunity} notices={notices.filter((n) => n.cohortId === "all" || n.cohortId === liveStudent.cohortId)} setNotices={setNotices} directThreads={directThreads} setDirectThreads={setDirectThreads} allStudents={students} onExit={handleSignOut} onViewSite={() => setPage("landing")} onApplyMore={(courseId) => { setApplyingAsExisting(liveStudent); setPresetCourseId(courseId || null); setPage("signup"); }} notifItems={studentNotifItems} notifSeen={studentNotifSeen} onMarkSeen={setStudentNotifSeen} />
      )}
      {page === "adminDash" && (
        <AdminDashboard courses={courses} setCourses={syncCourses} students={students} setStudents={syncStudents} onRemoveStudent={removeStudent} applicants={applicants} setApplicants={syncApplicants} onRemoveApplicant={removeApplicant} onAcceptApplicant={acceptApplicant} cohorts={cohorts} setCohorts={syncCohorts} tasks={tasks} setTasks={setTasks} resources={resources} onAddResource={addResource} onEditResource={editResource} onRemoveResource={removeResource} community={community} setCommunity={setCommunity} notices={notices} setNotices={setNotices} directThreads={directThreads} setDirectThreads={setDirectThreads} testimonials={testimonials} setTestimonials={setTestimonials} faqs={faqs} setFaqs={setFaqs} brand={brand} setBrand={syncBrand} adminProfile={adminProfile} setAdminProfile={syncAdminProfile} onExit={handleSignOut} onViewSite={() => setPage("landing")} notifItems={adminNotifItems} notifSeen={adminNotifSeen} onMarkSeen={setAdminNotifSeen} />
      )}
    </div>
  );
}
