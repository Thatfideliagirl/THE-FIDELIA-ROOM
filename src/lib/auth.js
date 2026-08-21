import { supabase } from "./supabaseClient.js";
import { ADMIN_EMAIL } from "./data.js";

const isEmail = (v) => v.includes("@");

// Applicants sign in by email or Student ID; Supabase only signs in by email,
// so a Student ID gets resolved to its email first via a safe RPC lookup.
export async function resolveLoginEmail(identifier) {
  const trimmed = identifier.trim();
  if (isEmail(trimmed)) return trimmed;
  const { data, error } = await supabase.rpc("email_for_login", { identifier: trimmed });
  if (error || !data) return null;
  return data;
}

// Every function below wraps its network call in try/catch: a blocked or
// dropped connection throws instead of returning Supabase's own {error}
// shape, and left uncaught that stalls the caller's loading state forever
// with no message shown. Network failures surface as "network" so the UI
// can say so, instead of hanging.
export async function signIn(identifier, password) {
  try {
    const email = await resolveLoginEmail(identifier);
    if (!email) return { error: "not-found" };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message.toLowerCase().includes("invalid") ? "wrong-password" : "unknown" };
    return { user: data.user };
  } catch {
    return { error: "network" };
  }
}

export async function signUpApplicant({ name, email, phone, password }) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { authUserId: data.user?.id || null };
  } catch {
    return { error: "network" };
  }
}

export async function sendPasswordReset(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    return { error: error?.message || null };
  } catch {
    return { error: "network" };
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function isAdminEmail(email) {
  return (email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
