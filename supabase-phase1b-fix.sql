-- ============================================================
-- FJ Room — Phase 1b fix: course/cohort IDs aren't real database
-- rows yet (that's later work), so they can't be a `uuid` column.
-- Paste into Supabase → SQL Editor → New query → Run.
-- ============================================================

alter table applicants drop constraint if exists applicants_course_id_fkey;
alter table applicants drop constraint if exists applicants_cohort_id_fkey;
alter table applicants alter column course_id type text using course_id::text;
alter table applicants alter column cohort_id type text using cohort_id::text;

alter table students drop constraint if exists students_cohort_id_fkey;
alter table students alter column cohort_id type text using cohort_id::text;
