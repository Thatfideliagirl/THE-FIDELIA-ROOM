import { supabase } from "./supabaseClient.js";

// The free-resource email box. A visitor gives their email once per device;
// after that the resource just opens and each open still counts as another
// visit on their row in the admin's email list. Nothing here ever blocks the
// resource: if saving fails (offline, or the setup file hasn't been run yet)
// the visitor still gets what they came for.
const KEY = "fjroom_lead_email";
export function getSavedLeadEmail() { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } }
export function saveLeadEmail(email) { try { localStorage.setItem(KEY, email.trim().toLowerCase()); } catch { /* private window: they'll just be asked again */ } }
export const isValidEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((e || "").trim());
export async function recordFreeResourceEmail(email, resourceTitle) {
  // Preferred: the site's own server records it AND sends the one-time
  // thank-you email for a brand-new address. If that isn't available (not set
  // up yet, offline, or running locally) fall back to recording directly.
  try {
    const r = await fetch("/api/free-resource-signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), resourceTitle: resourceTitle || "" }) });
    const j = await r.json().catch(() => null);
    if (r.ok && j && j.ok) return;
  } catch { /* fall through to the direct save below */ }
  if (!supabase) return;
  const { error } = await supabase.rpc("record_free_resource_email", { p_email: email.trim(), p_resource_title: resourceTitle || null });
  if (error) console.error("recordFreeResourceEmail failed", error);
}
// Admin-side: reads are allowed only for the owner's login (see the SQL file).
export async function fetchFreeResourceEmails() {
  const { data, error } = await supabase.from("free_resource_emails").select("*").order("last_seen", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function deleteFreeResourceEmail(email) {
  const { error } = await supabase.from("free_resource_emails").delete().eq("email", email);
  if (error) throw error;
}
