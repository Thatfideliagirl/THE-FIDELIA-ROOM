-- ============================================================
-- FJ Room — Phase 2 step 1: Resources move to the real database
-- Same fix as before: course_id was typed as uuid, but courses are
-- still local ids like "va", not real database rows yet.
-- Paste into Supabase → SQL Editor → New query → Run.
-- ============================================================

alter table resources drop constraint if exists resources_course_id_fkey;
alter table resources alter column course_id type text using course_id::text;
