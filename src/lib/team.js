import { supabase } from "./supabaseClient.js";

const teamMemberOut = (row) => ({
  id: row.id, name: row.name, email: row.email, roleLabel: row.role_label,
  permissions: row.permissions || [], authUserId: row.auth_user_id, createdAt: row.created_at,
  photo: row.photo || null, bio: row.bio || "",
});

export async function fetchTeamMembers() {
  const { data, error } = await supabase.from("team_members").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(teamMemberOut);
}
export async function addTeamMember({ name, email, roleLabel, permissions }) {
  const { data, error } = await supabase.from("team_members").insert({ name, email, role_label: roleLabel, permissions: permissions || [] }).select().single();
  if (error) throw error;
  return teamMemberOut(data);
}
export async function updateTeamMember(id, { name, roleLabel, permissions }) {
  const { data, error } = await supabase.from("team_members").update({ name, role_label: roleLabel, permissions }).eq("id", id).select().single();
  if (error) throw error;
  return teamMemberOut(data);
}
export async function removeTeamMember(id) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
}

// Checks whether an email has been invited (added by the owner) before
// letting the team sign-up form proceed -- returns null for "not invited".
export async function checkTeamInvite(email) {
  const { data, error } = await supabase.rpc("check_team_invite", { check_email: email });
  if (error) throw error;
  return data && data[0] ? { name: data[0].name, roleLabel: data[0].role_label } : null;
}

// Creates the login; loadForSession's getMyTeamAccess() call links it back
// to the team_members row the owner already created on whatever request
// actually carries a real session -- immediately if email confirmation is
// off, or after they click the confirmation link if it's on.
export async function signUpTeamMember({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) return { error: error.message };
  return { error: null, hasSession: !!data.session };
}

// A signed-in team member reading their own access -- null if the caller
// isn't on the roster (e.g. they're the owner, or not a team member at
// all). Claims the row first (idempotent, matches by the caller's own
// verified email) so this works regardless of whether the link happened
// right after sign-up or on a later, ordinary login -- e.g. if email
// confirmation is on and their first "session" only exists after they
// click the confirmation link, not at sign-up time.
export async function getMyTeamAccess() {
  await supabase.rpc("claim_team_membership");
  const { data, error } = await supabase.rpc("get_my_team_access");
  if (error) throw error;
  if (!data || !data[0]) return null;
  const row = data[0];
  return { id: row.id, name: row.name, email: row.email, roleLabel: row.role_label, permissions: row.permissions || [], photo: row.photo || null, bio: row.bio || "" };
}

// A team member updating their own photo/bio -- goes through a
// security-definer RPC rather than a broad RLS update policy, so they can
// only ever touch these two columns on their own row, never their
// permissions or role.
export async function updateMyTeamProfile({ photo, bio }) {
  const { error } = await supabase.rpc("update_my_team_profile", { new_photo: photo, new_bio: bio });
  if (error) throw error;
}

export async function fetchTeamActivity(teamMemberId) {
  const { data, error } = await supabase.from("team_activity").select("*").eq("team_member_id", teamMemberId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

// Fire-and-forget, same pattern as email sends -- a logging failure should
// never interrupt the action that triggered it.
export function logActivity(actionText) {
  supabase?.rpc("log_team_activity", { action_text: actionText }).then(({ error }) => { if (error) console.error("logActivity failed", error); });
}
