-- ============================================================
-- FJ Room — Phase 1 (real accounts) migration
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run once, on top of the schema you already ran.
-- ============================================================

-- Links a signed-up applicant to their real login account, and lets an
-- accepted applicant's login carry straight over to their student record.
alter table applicants add column if not exists auth_user_id uuid references auth.users(id);

-- Course enrollments (progress, codes, pending review, certificates) live as
-- one JSON array on the student's own row for now, matching the shape the
-- app already uses everywhere -- simpler than standing up the separate
-- `enrollments` table's own RLS/CRUD in this same pass. That table stays in
-- the schema unused for now; nothing currently writes to it.
alter table students add column if not exists enrollments jsonb not null default '[]';

-- ---- APPLICANTS ----
-- (drop-then-create so this file is safe to re-run if it partially ran before)
drop policy if exists "applicants_insert_own" on applicants;
drop policy if exists "applicants_select" on applicants;
drop policy if exists "applicants_update_admin" on applicants;

-- Anyone signed in can create an application for their own email.
create policy "applicants_insert_own" on applicants for insert to authenticated
  with check (email = auth.jwt() ->> 'email');

-- You can see your own application; the admin account can see all of them.
create policy "applicants_select" on applicants for select to authenticated
  using (email = auth.jwt() ->> 'email' or auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

-- Only the admin account can accept/decline (update status).
create policy "applicants_update_admin" on applicants for update to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

-- ---- STUDENTS ----
drop policy if exists "students_select" on students;
drop policy if exists "students_insert_admin" on students;
drop policy if exists "students_update" on students;

-- You can see your own student record; the admin account can see everyone's.
create policy "students_select" on students for select to authenticated
  using (auth_user_id = auth.uid() or auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

-- Only the admin account creates student records (this happens at "Accept").
create policy "students_insert_admin" on students for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

-- You can update your own record (profile edits); the admin account can update anyone's.
create policy "students_update" on students for update to authenticated
  using (auth_user_id = auth.uid() or auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

-- ---- SIGN-IN WITH STUDENT ID ----
-- Supabase only signs in by email, so this looks up the matching email for
-- either a Student ID (FJ/2026/001) or an email typed into the same field --
-- without exposing the rest of the students table to a logged-out visitor.
create or replace function public.email_for_login(identifier text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from students where lower(student_code) = lower(identifier)
  union all
  select email from students where lower(email) = lower(identifier)
  limit 1;
$$;
grant execute on function public.email_for_login(text) to anon, authenticated;
