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
