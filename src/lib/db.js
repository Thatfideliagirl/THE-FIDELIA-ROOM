import { supabase } from "./supabaseClient.js";

const applicantOut = (a) => ({
  id: a.id, name: a.name, email: a.email, phone: a.phone,
  courseId: a.course_id, cohortId: a.cohort_id, studentRef: a.student_ref,
  answers: a.answers || [], status: a.status, authUserId: a.auth_user_id,
});
const applicantIn = (a) => ({
  name: a.name, email: a.email, phone: a.phone || null,
  course_id: a.courseId, cohort_id: a.cohortId || null, student_ref: a.studentRef || null,
  answers: a.answers || [], status: a.status || "pending", auth_user_id: a.authUserId || null,
});

const studentOut = (s) => ({
  id: s.id, studentId: s.student_code, name: s.name, email: s.email, cohortId: s.cohort_id,
  photo: s.photo_url ? { name: "photo", dataUrl: s.photo_url } : null, bio: s.bio || "",
  seenTour: s.seen_tour, accountStatus: s.account_status, authUserId: s.auth_user_id,
  enrollments: s.enrollments || [],
});
const studentIn = (s) => ({
  student_code: s.studentId, name: s.name, email: s.email, cohort_id: s.cohortId || null,
  photo_url: s.photo?.dataUrl || null, bio: s.bio || "",
  seen_tour: !!s.seenTour, account_status: s.accountStatus || "active", auth_user_id: s.authUserId || null,
  enrollments: s.enrollments || [],
});

const resourceOut = (r) => ({
  id: r.id, courseId: r.course_id, folder: r.folder, title: r.title, description: r.description || "",
  type: r.type, kind: r.kind, url: r.url || "", file: r.file_url ? { name: r.title, dataUrl: r.file_url } : null,
  visibility: r.visibility, isPublic: r.is_public,
});
const resourceIn = (r) => ({
  course_id: r.courseId || null, folder: r.folder, title: r.title, description: r.description || "",
  type: r.type, kind: r.kind || "link", url: r.url || null, file_url: r.file?.dataUrl || null,
  visibility: r.visibility || "course", is_public: !!r.isPublic,
});

export async function fetchResources() {
  const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(resourceOut);
}
export async function insertResource(resource) {
  const { data, error } = await supabase.from("resources").insert(resourceIn(resource)).select().single();
  if (error) throw error;
  return resourceOut(data);
}
export async function updateResource(id, resource) {
  const { data, error } = await supabase.from("resources").update(resourceIn(resource)).eq("id", id).select().single();
  if (error) throw error;
  return resourceOut(data);
}
export async function deleteResource(id) {
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchApplicants() {
  const { data, error } = await supabase.from("applicants").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(applicantOut);
}
export async function insertApplicant(applicant) {
  const { data, error } = await supabase.from("applicants").insert(applicantIn(applicant)).select().single();
  if (error) throw error;
  return applicantOut(data);
}
// Writes back the applicant's whole current shape (status, studentRef, etc.) --
// simpler than tracking sparse patches, and fine for a single-admin app.
export async function updateApplicant(id, applicant) {
  const { status, studentRef } = applicant;
  const { data, error } = await supabase.from("applicants").update({ status, student_ref: studentRef || null }).eq("id", id).select().single();
  if (error) throw error;
  return applicantOut(data);
}
export async function deleteApplicant(id) {
  const { error } = await supabase.from("applicants").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchStudents() {
  const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(studentOut);
}
export async function insertStudent(student) {
  const { data, error } = await supabase.from("students").insert(studentIn(student)).select().single();
  if (error) throw error;
  return studentOut(data);
}
// Writes back the student's whole current shape -- simpler than tracking
// sparse patches, and fine for a single-admin app with no concurrent editors.
export async function updateStudent(id, student) {
  const { cohortId, accountStatus, seenTour, photo, bio, enrollments } = student;
  const dbPatch = { cohort_id: cohortId || null, account_status: accountStatus, seen_tour: !!seenTour, photo_url: photo?.dataUrl || null, bio: bio || "", enrollments: enrollments || [] };
  const { data, error } = await supabase.from("students").update(dbPatch).eq("id", id).select().single();
  if (error) throw error;
  return studentOut(data);
}
// Only removes the students row -- their login account itself isn't touched
// (deleting an auth user needs the service-role key, which never belongs in
// this app's own code). Any applicant row that referenced them auto-clears
// that reference at the database level rather than breaking.
export async function deleteStudent(id) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

// Courses are stored as one opaque jsonb blob per row (keyed by the app's
// own string id, e.g. "va") rather than a normalized schema -- the shape
// (nested modules, quizzes, meetings) already lives in this exact form
// throughout the app, so this is just giving that same object a place to
// persist instead of reinventing it as columns.
const courseOut = (row) => ({ id: row.id, ...row.data });
export async function fetchCourses() {
  const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(courseOut);
}
export async function upsertCourse(course) {
  const { id, ...rest } = course;
  const { data, error } = await supabase.from("courses").upsert({ id, data: rest, updated_at: new Date().toISOString() }).select().single();
  if (error) throw error;
  return courseOut(data);
}

// Cohorts follow the same opaque-jsonb-blob pattern as courses.
const cohortOut = (row) => ({ id: row.id, ...row.data });
export async function fetchCohorts() {
  const { data, error } = await supabase.from("cohorts").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(cohortOut);
}
export async function upsertCohort(cohort) {
  const { id, ...rest } = cohort;
  const { data, error } = await supabase.from("cohorts").upsert({ id, data: rest, updated_at: new Date().toISOString() }).select().single();
  if (error) throw error;
  return cohortOut(data);
}
export async function deleteCohort(id) {
  const { error } = await supabase.from("cohorts").delete().eq("id", id);
  if (error) throw error;
}

// Testimonials, FAQs, notices, tasks, and community posts all follow the
// same opaque-jsonb-blob-per-row shape as courses/cohorts above -- each is
// just a flat list of small objects the UI already treats as plain data,
// so this reuses that exact pattern instead of inventing five new ones.
const blobOut = (row) => ({ id: row.id, ...row.data });
async function fetchBlobs(table) {
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(blobOut);
}
async function upsertBlob(table, item) {
  const { id, ...rest } = item;
  const { data, error } = await supabase.from(table).upsert({ id: String(id), data: rest, updated_at: new Date().toISOString() }).select().single();
  if (error) throw error;
  return blobOut(data);
}
async function deleteBlob(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", String(id));
  if (error) throw error;
}

export async function fetchTestimonials() { return fetchBlobs("testimonials"); }
export async function upsertTestimonial(t) { return upsertBlob("testimonials", t); }
export async function deleteTestimonial(id) { return deleteBlob("testimonials", id); }

export async function fetchFaqs() { return fetchBlobs("faqs"); }
export async function upsertFaq(f) { return upsertBlob("faqs", f); }
export async function deleteFaq(id) { return deleteBlob("faqs", id); }

export async function fetchNotices() { return fetchBlobs("notices"); }
export async function upsertNotice(n) { return upsertBlob("notices", n); }

export async function fetchTasks() { return fetchBlobs("tasks"); }
export async function upsertTask(t) { return upsertBlob("tasks", t); }
export async function deleteTask(id) { return deleteBlob("tasks", id); }

export async function fetchCommunityPosts() { return fetchBlobs("community_posts"); }
export async function upsertCommunityPost(p) { return upsertBlob("community_posts", p); }

// Direct messages are the one exception to the blob shape above -- a
// thread is an ever-growing list of individual messages, not a single
// object to replace wholesale, so each message is its own row keyed by
// its thread (pairKey(a, b) from lib/data.js), and reads are grouped back
// into the same { [threadKey]: [...messages] } shape the UI already uses.
export async function fetchDirectMessages() {
  const { data, error } = await supabase.from("direct_messages").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  const grouped = {};
  (data || []).forEach((row) => { (grouped[row.thread_key] ||= []).push({ from: row.from_id, text: row.text }); });
  return grouped;
}
export async function insertDirectMessage({ threadKey, from, text }) {
  const { error } = await supabase.from("direct_messages").insert({ thread_key: threadKey, from_id: String(from), text });
  if (error) throw error;
}

// Branding and the admin's own profile are both single-object, single-admin
// settings -- one row in site_settings covers both rather than two tables.
export async function fetchSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { brand: data.brand, adminProfile: data.admin_profile };
}
export async function updateSettings({ brand, adminProfile }) {
  const { error } = await supabase.from("site_settings").upsert({ id: "main", brand, admin_profile: adminProfile, updated_at: new Date().toISOString() });
  if (error) throw error;
}
