import { supabase } from "./supabaseClient.js";
import { ADMIN_EMAIL } from "./data.js";

const isEmail = (v) => v.includes("@");
// supabase-js doesn't always throw when the browser's own fetch fails (a
// dropped connection, a blocked domain, no signal) -- sometimes it resolves
// normally with an {error} whose message is the raw "Failed to fetch",
// which would otherwise show as an opaque "something went wrong" instead
// of the connection problem it actually is.
const isFetchFailure = (message) => /fetch/i.test(message || "");

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
    // Any other Supabase error (unconfirmed email, rate limit, etc.) is rare
    // enough that it's more useful to show the real reason than to hide it
    // behind one generic "something went wrong" -- that's what made the last
    // occurrence of this impossible to diagnose without guessing.
    if (error) {
      if (isFetchFailure(error.message)) return { error: "network" };
      return { error: error.message.toLowerCase().includes("invalid") ? "wrong-password" : "unknown", detail: error.message };
    }
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
    // Without an explicit redirectTo, Supabase sends the user back to
    // whatever "Site URL" is configured in the project's own Auth settings
    // -- which may not be this deployment at all. Pointing it at the page
    // that's actually running is what makes the link go anywhere useful.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
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
