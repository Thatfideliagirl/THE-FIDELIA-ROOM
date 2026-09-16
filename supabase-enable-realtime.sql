-- ============================================================
-- FJ Room — turn on live updates for students, applicants, and
-- resources, so the admin dashboard/notifications update without a
-- manual page refresh.
-- Paste into the project's SQL Editor -> New query -> Run.
-- Safe to run once. If it complains a table is "already a member",
-- that just means it's already on -- ignore and move on.
-- ============================================================

alter publication supabase_realtime add table students, applicants, resources;
