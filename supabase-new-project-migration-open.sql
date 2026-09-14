-- ============================================================
-- FJ Room — NEW project: temporarily open students/applicants
-- for the one-time data migration. The insert policies only allow
-- "your own email" (applicants) or "the admin account" (students),
-- which blocks writing in your existing real records as-is. This
-- turns RLS off just long enough for that copy, then a second file
-- turns it back on right after (the policies stay defined -- this
-- doesn't remove them, just pauses enforcement).
-- Paste into the NEW project's SQL Editor → New query → Run.
-- ============================================================

alter table students disable row level security;
alter table applicants disable row level security;
