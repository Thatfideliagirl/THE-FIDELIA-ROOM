import { supabase } from "./supabaseClient.js";

// Uploaded files (resource downloads, slide decks, meeting recordings) go
// into a real Storage bucket instead of being embedded as base64 "data:"
// links -- those don't reliably download on mobile browsers, since most
// mobile browsers (iPhone Safari especially) don't support downloading a
// data: link at all. A real file has a real URL, which works everywhere.
export async function uploadFile(file) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from("uploads").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return data.publicUrl;
}
