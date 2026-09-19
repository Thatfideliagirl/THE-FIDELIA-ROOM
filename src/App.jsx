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
import { fetchApplicants, insertApplicant, updateApplicant, deleteApplicant, fetchStudents, insertStudent, updateStudent, deleteStudent, fetchResources, insertResource, updateResource, deleteResource, fetchCourses, upsertCourse, deleteCourse, fetchCohorts, upsertCohort, deleteCohort, fetchSettings, updateSettings, fetchTestimonials, upsertTestimonial, deleteTestimonial, fetchFaqs, upsertFaq, deleteFaq, fetchNotices, upsertNotice, fetchTasks, upsertTask, deleteTask, fetchCommunityPosts, upsertCommunityPost, fetchDirectMessages, insertDirectMessage, fetchNotifSeen, saveNotifSeen } from "./lib/db.js";
import { sendWelcomeEmail, sendAcceptanceEmail } from "./lib/email.js";
import { checkTeamInvite, signUpTeamMember, getMyTeamAccess, logActivity } from "./lib/team.js";

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
// The team sign-up link is a fixed "?team=1" address (copyable from the
// admin's Team tab), separate from the normal student sign-up flow, which
// asks course-application questions that don't apply to a teammate.
const isTeamSignupLink = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("team") === "1";

export default function App() {
  const [page, setPage] = useState(() => (isRecoveryLink ? "resetPassword" : isExpiredAuthLink ? "linkExpired" : isTeamSignupLink ? "teamSignup" : "landing"));
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
  // Set only for a signed-in team member (never the owner) -- their own
  // name/permissions, fetched from their own team_members row. Drives which
  // admin tabs render for them, and whether a "switch to student view" link
  // shows at all (only when they also have a real student enrollment).
  const [teamAccess, setTeamAccess] = useState(null);
  const [teamViewMode, setTeamViewMode] = useState("admin"); // "admin" | "student"
  // The signed-in user's own Supabase auth id -- needed when a team member
  // applies for a course themselves (they already have a login, so that
  // application must link to their existing account, not create a new one).
  const [currentAuthUserId, setCurrentAuthUserId] = useState(null);
  // One shared "already seen" list per signed-in person -- covers both
  // their admin-side and student-side notifications, since the two
  // sides' IDs are prefixed differently (ap-/sub-/mod- vs assigned-/
  // grade-/cert-) and never collide. Persisted per person (see
  // fetchNotifSeen/syncNotifSeen below) so it survives a refresh or
  // signing in on another device, instead of resetting every reload.
  const [notifSeen, setNotifSeen] = useState([]);
  function syncNotifSeen(updater) {
    setNotifSeen((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (currentAuthUserId) saveNotifSeen(currentAuthUserId, next).catch(reportSaveError("saveNotifSeen failed"));
      return next;
    });
  }
  useEffect(() => {
    if (!currentAuthUserId) { setNotifSeen([]); return; }
    fetchNotifSeen(currentAuthUserId).then(setNotifSeen).catch((e) => console.error("fetchNotifSeen failed", e));
  }, [currentAuthUserId]);

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
  // Showing only a generic "check your connection" message hid the real
  // cause for every one of these -- Accept's actual error (a duplicate
  // student code) turned out to have nothing to do with connectivity, and
  // wouldn't have been found nearly as fast without seeing the real text.
  function reportSaveError(context) { return (e) => { console.error(context, e); setSaveError(e?.message ? `Didn't save: ${e.message}` : "Something didn't save -- check your connection and try that again."); }; }
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

  // Live sync: a student applying, submitting a quick check, or an admin
  // action in a different tab/device previously only showed up here after a
  // manual refresh. Supabase Realtime pushes a change notification the
  // instant any row in these tables is inserted/updated/deleted, and the
  // simplest correct reaction is just refetching that table -- these fetches
  // are cheap, and it sidesteps any risk of a hand-patched local update
  // drifting from what's actually in the database. The admin notification
  // bell and dashboard counts are computed directly from this same state, so
  // they go live for free, no separate wiring needed.
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => { fetchStudents().then(setStudents).catch((e) => console.error("realtime fetchStudents failed", e)); })
      .on("postgres_changes", { event: "*", schema: "public", table: "applicants" }, () => { fetchApplicants().then(setApplicants).catch((e) => console.error("realtime fetchApplicants failed", e)); })
      .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, () => { fetchResources().then(setResources).catch((e) => console.error("realtime fetchResources failed", e)); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Courses and branding/admin-profile are real now too -- both fetched on
  // load regardless of login (the public landing/courses pages need them).
  // syncCourses mirrors syncStudents/syncApplicants: any item whose reference
  // changed (existing edit) or that's missing from prev (a brand-new course
  // from addCourse) gets upserted in the background, so every existing
  // setCourses call site in admin.jsx keeps working unchanged. Anything
  // present in prev but missing from next (CourseManager's delete) gets
  // deleted in the background too, same as syncCohorts below.
  useEffect(() => { fetchCourses().then(setCourses).catch((e) => console.error("fetchCourses failed", e)); }, []);
  function syncCourses(updater) {
    setCourses((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before !== item) { upsertCourse(item).catch(reportSaveError("upsertCourse failed")); if (teamAccess) logActivity(`Edited course "${item.title}"`); } });
      prev.forEach((item) => { if (!next.find((x) => x.id === item.id)) { deleteCourse(item.id).catch(reportSaveError("deleteCourse failed")); if (teamAccess) logActivity(`Deleted course "${item.title}"`); } });
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
  // Shared by testimonials/faqs/notices/tasks/community below -- same
  // add-or-edit-or-delete diffing as syncCohorts, just generalized since
  // five near-identical copies of that block would just be noise.
  function makeBlobSync(setState, upsertFn, deleteFn, label) {
    return (updater) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        next.forEach((item) => { const before = prev.find((x) => x.id === item.id); if (before !== item) upsertFn(item).catch(reportSaveError(`${label} save failed`)); });
        if (deleteFn) prev.forEach((item) => { if (!next.find((x) => x.id === item.id)) deleteFn(item.id).catch(reportSaveError(`${label} delete failed`)); });
        return next;
      });
    };
  }
  useEffect(() => { fetchTestimonials().then(setTestimonials).catch((e) => console.error("fetchTestimonials failed", e)); }, []);
  const syncTestimonials = makeBlobSync(setTestimonials, upsertTestimonial, deleteTestimonial, "Testimonial");
  useEffect(() => { fetchFaqs().then(setFaqs).catch((e) => console.error("fetchFaqs failed", e)); }, []);
  const syncFaqs = makeBlobSync(setFaqs, upsertFaq, deleteFaq, "FAQ");
  useEffect(() => { fetchNotices().then(setNotices).catch((e) => console.error("fetchNotices failed", e)); }, []);
  const syncNotices = makeBlobSync(setNotices, upsertNotice, null, "Notice");
  useEffect(() => { fetchTasks().then(setTasks).catch((e) => console.error("fetchTasks failed", e)); }, []);
  const syncTasks = makeBlobSync(setTasks, upsertTask, deleteTask, "Task");
  useEffect(() => { fetchCommunityPosts().then(setCommunity).catch((e) => console.error("fetchCommunityPosts failed", e)); }, []);
  const syncCommunity = makeBlobSync(setCommunity, upsertCommunityPost, null, "Community post");
  // Direct messages are pure appends in every call site (sendMsg/send just
  // push one new message onto the thread's array), so instead of diffing
  // whole objects like the blob tables above, this just inserts whatever's
  // new past each thread's previous length.
  useEffect(() => { fetchDirectMessages().then(setDirectThreads).catch((e) => console.error("fetchDirectMessages failed", e)); }, []);
  function syncDirectThreads(updater) {
    setDirectThreads((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      Object.keys(next).forEach((key) => {
        const newMsgs = (next[key] || []).slice((prev[key] || []).length);
        newMsgs.forEach((m) => insertDirectMessage({ threadKey: key, from: m.from, text: m.text }).catch(reportSaveError("Message send failed")));
      });
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
    try { const saved = await insertResource(data); setResources((prev) => [...prev, saved]); if (teamAccess) logActivity(`Added a resource to the Library: "${data.title}"`); return null; }
    catch (e) { console.error("insertResource failed", e); return "Couldn't save this resource — check your connection and try again."; }
  }
  async function editResource(id, data) {
    try { const saved = await updateResource(id, data); setResources((prev) => prev.map((r) => r.id === id ? saved : r)); if (teamAccess) logActivity(`Edited a Library resource: "${data.title}"`); return null; }
    catch (e) { console.error("updateResource failed", e); return "Couldn't save this resource — check your connection and try again."; }
  }
  async function removeResource(id) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    try { await deleteResource(id); } catch (e) { console.error("deleteResource failed", e); }
  }

  async function loadForSession(session, isFreshSignIn = false) {
    if (!session) { setStudents([]); setApplicants([]); setCurrentAuthUserId(null); return; }
    setCurrentAuthUserId(session.user.id);
    const [studs, apps] = await Promise.all([fetchStudents(), fetchApplicants()]);
    setStudents(studs); setApplicants(apps);
    const email = session.user.email;
    if (isAdminEmail(email)) { setIsAdminSession(true); setTeamAccess(null); setPage("adminDash"); return; }
    const myStudent = studs.find((s) => s.authUserId === session.user.id || s.email.toLowerCase() === email.toLowerCase());
    // A team member is checked before the plain student match, since they
    // may also have a student enrollment -- their own dashboard is where
    // they should land by default, with the switch-to-student-view link
    // (rendered only when myStudent exists) as how they reach that side.
    try {
      const access = await getMyTeamAccess();
      if (access) {
        setTeamAccess(access); setTeamViewMode("admin");
        if (myStudent) setActiveStudent(myStudent);
        setPage("adminDash");
        // loadForSession runs on plenty of things that aren't a real sign-in
        // (restoring the session on a page reload, a background token
        // refresh every ~50 minutes while the tab stays open) -- logging on
        // every call turned one real sign-in into three or four entries.
        // Only a genuine SIGNED_IN event (or a fresh team sign-up, which
        // calls this with isFreshSignIn itself) counts as one.
        if (isFreshSignIn) logActivity("Signed in");
        return;
      }
    } catch (e) { console.error("getMyTeamAccess failed", e); }
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
      // "INITIAL_SESSION" fires immediately on subscribing, carrying the
      // exact same session the explicit getSession() call above already
      // handles -- reacting to it too ran the whole loadForSession flow
      // (two fetches, one navigation decision) twice on every page load,
      // and could momentarily land a freshly-signed-up applicant on
      // "account not found" before their own submit flow's insert had a
      // chance to land.
      if (isRecoveryLink || event === "INITIAL_SESSION") return;
      loadForSession(session, event === "SIGNED_IN");
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

  // Team sign-up: a two-step form (check the invite, then set a password)
  // rather than everything at once, since we don't know who's visiting
  // until they type their email -- checkTeamInvite is what actually
  // confirms it's a real invite and supplies the name/role to show them.
  const [teamStep, setTeamStep] = useState("email"); // "email" | "password"
  const [teamEmail, setTeamEmail] = useState(""); const [teamName, setTeamName] = useState(""); const [teamRoleLabel, setTeamRoleLabel] = useState("");
  const [teamPassword, setTeamPassword] = useState(""); const [teamError, setTeamError] = useState(""); const [teamChecking, setTeamChecking] = useState(false); const [teamSubmitting, setTeamSubmitting] = useState(false); const [teamAwaitingConfirm, setTeamAwaitingConfirm] = useState(false);
  async function submitTeamEmail() {
    if (!teamEmail.trim()) return;
    setTeamChecking(true); setTeamError("");
    try {
      const invite = await checkTeamInvite(teamEmail.trim());
      if (!invite) { setTeamError("This email hasn't been invited yet — check with whoever invited you."); return; }
      setTeamName(invite.name); setTeamRoleLabel(invite.roleLabel); setTeamStep("password");
    } catch (e) {
      console.error("checkTeamInvite failed", e);
      setTeamError("Couldn't reach the server — check your connection and try again.");
    } finally { setTeamChecking(false); }
  }
  async function submitTeamPassword() {
    if (teamPassword.length < 6) { setTeamError("Needs at least 6 characters."); return; }
    setTeamSubmitting(true); setTeamError("");
    const { error, hasSession } = await signUpTeamMember({ name: teamName, email: teamEmail.trim(), password: teamPassword });
    setTeamSubmitting(false);
    if (error) { setTeamError(error.toLowerCase().includes("already registered") ? "That email already has an account — try signing in instead." : error); return; }
    if (hasSession) { supabase.auth.getSession().then(({ data }) => loadForSession(data.session, true)); }
    else { setTeamAwaitingConfirm(true); }
  }
  async function handleForgotPassword(email) { const { error } = await sendPasswordReset(email); return error; }
  async function handleSignOut() { await signOut(); setActiveStudent(null); setActiveApplicant(null); setIsAdminSession(false); setTeamAccess(null); setTeamViewMode("admin"); setPage("landing"); }

  // insertApplicant/insertStudent/updateStudent/updateApplicant throw on failure
  // (a real DB error, or a blocked/dropped connection) -- caught here so a
  // failure always resolves the caller's loading state and shows a message,
  // instead of leaving a "Submitting..." button stuck forever.
  async function submitApplication(data) {
    try {
      const { password, ...rest } = data;
      if (applyingAsExisting?.isTeamMember) {
        // A team member applying for their first course -- they already
        // have a login (their team account), so this links straight to
        // it instead of going through signUpApplicant's create-a-new-
        // account flow, which would just fail with "already registered".
        const saved = await insertApplicant({ ...rest, status: "pending", studentRef: null, authUserId: currentAuthUserId });
        setApplicants((prev) => [...prev, saved]);
        setActiveApplicant(saved); setApplyingAsExisting(null); setPage("inReview");
        return null;
      }
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
      // A unique-violation here (code 23505) means a matching pending
      // application already exists -- most likely a double-click on
      // Submit racing itself. That application already went through
      // correctly, so this isn't a real failure worth showing an error
      // for; it just quietly stops here instead of leaving a second copy.
      if (e?.code === "23505") return null;
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
      // PGRST116 = .single() matched zero (or more than one) row -- the
      // browser's own copy of this applicant is stale (e.g. it was already
      // accepted, or removed by the duplicate-cleanup) and a plain refetch
      // fixes it, which is a different, better message than "check your
      // connection" for something that was never a network problem.
      if (e?.code === "PGRST116") return "This application has changed since you loaded the page — refresh and try again.";
      return e?.message ? `Couldn't accept this applicant: ${e.message}` : "Couldn't accept this applicant — check your connection and try again.";
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
    // A written/file-upload/milestone submission reviewed by an admin never
    // gave the student any feedback at all -- unlike an auto-graded quick
    // check, which shows "well done" the instant it passes, this happened in
    // a separate admin session with nobody there to see it. modapproved- is
    // also what LessonView checks (same notifSeen id) to show that same
    // "well done, continue" screen the first time they open the module.
    ...liveStudent.enrollments.flatMap((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      if (!course) return [];
      return e.completedModuleIds.flatMap((mid) => {
        const mod = course.modules.find((m) => m.id === mid);
        if (!mod || !["written", "file-upload", "milestone"].includes(mod.testType)) return [];
        return [{ id: `modapproved-${e.id}-${mid}`, t: `Your submission for "${mod.title}" was approved — the next module is unlocked` }];
      });
    }),
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
      {page === "landing" && (isAdminSession || teamAccess || liveStudent) && (
        <button onClick={() => setPage(isAdminSession || teamAccess ? "adminDash" : "studentDash")} className="fixed z-[999] f-label text-[11px] px-4 py-2 rounded-full" style={{ top: 16, left: 16, background: "var(--accent)", color: "#FAF6EC", fontWeight: 700, boxShadow: "0 10px 22px -10px rgba(0,0,0,.4)" }}>BACK TO DASHBOARD</button>
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
      {page === "signup" && <ApplicationForm courses={courses} cohorts={cohorts} presetCourseId={presetCourseId} existingUser={applyingAsExisting} onSubmit={submitApplication} onCancel={() => setPage(applyingAsExisting ? (applyingAsExisting.isTeamMember ? "adminDash" : "studentDash") : "landing")} />}
      {page === "login" && <SignInScreen students={students} applicants={applicants} onBack={() => setPage("landing")} onSignIn={handleSignIn} onForgotPassword={handleForgotPassword} onEnterStudent={(s) => { setActiveStudent(s); setPage("studentDash"); }} onEnterApplicant={(a) => { setActiveApplicant(a); setPage("inReview"); }} onEnterAdmin={() => setPage("adminDash")} />}
      {page === "inReview" && liveApplicant && <InReviewScreen applicant={liveApplicant} onExit={teamAccess ? () => setPage("adminDash") : handleSignOut} exitLabel={teamAccess ? "BACK TO DASHBOARD" : "SIGN OUT"} />}
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
      {page === "teamSignup" && (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="reveal in w-full max-w-[400px]">
            <div className="flex flex-col items-center text-center mb-8"><LogoMark height={80} /><div className="f-label text-[13px] mt-5 mb-1 accent-text">JOIN THE TEAM</div><h2 className="f-display text-[26px]" style={{ fontWeight: 800 }}>{teamAwaitingConfirm ? "Check your email." : "Set up your account."}</h2></div>
            <div className="card rounded-2xl p-7 flex flex-col gap-4" style={{ boxShadow: "0 20px 50px -24px rgba(38,32,25,0.16)" }}>
              {teamAwaitingConfirm ? (
                <p className="text-[14px] text-center" style={{ color: "#71675A" }}>We've sent a confirmation link to <strong>{teamEmail}</strong>. Open it on this device and you'll be signed straight in.</p>
              ) : teamStep === "email" ? (
                <>
                  <p className="text-[13px]" style={{ color: "#71675A" }}>Enter the email address you were invited with.</p>
                  <Field label="Email" value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitTeamEmail()} />
                  {teamError && (
                    <div className="text-[13px]" style={{ color: "#B04A3A" }}>
                      {teamError}
                      {teamError.includes("hasn't been invited") && (
                        <div className="mt-2">
                          <button onClick={() => setPage("landing")} className="text-[13px]" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline" }}>Not meant to be here? Go to the sign-up page instead →</button>
                        </div>
                      )}
                    </div>
                  )}
                  <button disabled={teamChecking} onClick={submitTeamEmail} className="btn-primary rounded-lg py-3 text-[15px]">{teamChecking ? "Checking…" : "Continue"}</button>
                </>
              ) : (
                <>
                  <p className="text-[13px]" style={{ color: "#71675A" }}>You've been invited to FJ Room as <strong>{teamRoleLabel}</strong>. Create a password to get started, {teamName.split(" ")[0]}.</p>
                  <Field label="Password" type="password" value={teamPassword} onChange={(e) => setTeamPassword(e.target.value)} placeholder="At least 6 characters" onKeyDown={(e) => e.key === "Enter" && submitTeamPassword()} />
                  {teamError && <div className="text-[13px]" style={{ color: "#B04A3A" }}>{teamError}</div>}
                  <button disabled={teamSubmitting} onClick={submitTeamPassword} className="btn-primary rounded-lg py-3 text-[15px]">{teamSubmitting ? "Creating…" : "Create account"}</button>
                </>
              )}
            </div>
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
        <MyCourses student={liveStudent} setStudents={syncStudents} courses={courses} cohorts={cohorts} applicants={applicants} tasks={tasks} setTasks={syncTasks} resources={resources} community={community} setCommunity={syncCommunity} notices={notices.filter((n) => n.cohortId === "all" || n.cohortId === liveStudent.cohortId)} setNotices={syncNotices} directThreads={directThreads} setDirectThreads={syncDirectThreads} allStudents={students} onExit={handleSignOut} onViewSite={() => setPage("landing")} onApplyMore={(courseId) => { setApplyingAsExisting(liveStudent); setPresetCourseId(courseId || null); setPage("signup"); }} notifItems={studentNotifItems} notifSeen={notifSeen} onMarkSeen={syncNotifSeen} />
      )}
      {page === "adminDash" && teamAccess && teamViewMode === "student" && liveStudent && (
        <MyCourses student={liveStudent} setStudents={syncStudents} courses={courses} cohorts={cohorts} applicants={applicants} tasks={tasks} setTasks={syncTasks} resources={resources} community={community} setCommunity={syncCommunity} notices={notices.filter((n) => n.cohortId === "all" || n.cohortId === liveStudent.cohortId)} setNotices={syncNotices} directThreads={directThreads} setDirectThreads={syncDirectThreads} allStudents={students} onExit={handleSignOut} onViewSite={() => setPage("landing")} onApplyMore={(courseId) => { setApplyingAsExisting(liveStudent); setPresetCourseId(courseId || null); setPage("signup"); }} notifItems={studentNotifItems} notifSeen={notifSeen} onMarkSeen={syncNotifSeen} onSwitchToTeamAdmin={() => setTeamViewMode("admin")} />
      )}
      {page === "adminDash" && !(teamAccess && teamViewMode === "student") && (
        <AdminDashboard courses={courses} setCourses={syncCourses} students={students} setStudents={syncStudents} onRemoveStudent={removeStudent} applicants={applicants} setApplicants={syncApplicants} onRemoveApplicant={removeApplicant} onAcceptApplicant={acceptApplicant} cohorts={cohorts} setCohorts={syncCohorts} tasks={tasks} setTasks={syncTasks} resources={resources} onAddResource={addResource} onEditResource={editResource} onRemoveResource={removeResource} community={community} setCommunity={syncCommunity} notices={notices} setNotices={syncNotices} directThreads={directThreads} setDirectThreads={syncDirectThreads} testimonials={testimonials} setTestimonials={syncTestimonials} faqs={faqs} setFaqs={syncFaqs} brand={brand} setBrand={syncBrand} adminProfile={adminProfile} setAdminProfile={syncAdminProfile} onExit={handleSignOut} onViewSite={() => setPage("landing")} notifItems={adminNotifItems} notifSeen={notifSeen} onMarkSeen={syncNotifSeen} teamAccess={teamAccess} onSwitchToStudent={teamAccess ? () => {
          if (liveStudent) { setTeamViewMode("student"); return; }
          // Not enrolled anywhere yet -- same "apply" flow any brand-new
          // visitor uses, skipping straight to picking a course since
          // they're already signed in (existingUser mode on the form).
          const myPendingApplicant = [...applicants].reverse().find((a) => a.email.toLowerCase() === teamAccess.email.toLowerCase() && a.status === "pending");
          if (myPendingApplicant) { setActiveApplicant(myPendingApplicant); setPage("inReview"); return; }
          setApplyingAsExisting({ isTeamMember: true, name: teamAccess.name, email: teamAccess.email, cohortId: null, enrollments: [] });
          setPresetCourseId(null);
          setPage("signup");
        } : null} onUpdateTeamAccess={(patch) => setTeamAccess((prev) => prev ? { ...prev, ...patch } : prev)} />
      )}
    </div>
  );
}
