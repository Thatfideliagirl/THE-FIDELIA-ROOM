-- ============================================================
-- FJ Room — Phase 1c fix: the `enrollments` column on `students`
-- never actually got created (confirmed directly against your
-- database), which is why "Accept" doesn't work.
-- Paste into Supabase → SQL Editor → New query → Run.
-- ============================================================

alter table students add column if not exists enrollments jsonb not null default '[]';
