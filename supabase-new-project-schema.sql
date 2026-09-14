-- ============================================================
-- FJ Room — full schema for the NEW Supabase project
-- This is everything the app actually uses, consolidated into one
-- script (the old project needed several incremental fixes over time --
-- this is what it looks like starting clean). Paste this whole file into
-- the NEW project's SQL Editor → New query → Run.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---- STUDENTS ----
create table students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  student_code text unique not null,   -- e.g. FJ/2026/001
  name text not null,
  email text unique not null,
  cohort_id text,
  photo_url text,
  bio text,
  seen_tour boolean not null default false,
  account_status text not null default 'active',
  enrollments jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ---- APPLICANTS ----
create table applicants (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id),
  name text not null,
  email text not null,
  phone text,
  course_id text,
  cohort_id text,
  student_ref uuid references students(id) on delete set null,
  answers jsonb not null default '[]',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---- RESOURCES (admin-managed content, no RLS needed) ----
create table resources (
  id uuid primary key default gen_random_uuid(),
  course_id text,
  folder text not null,
  title text not null,
  description text,
  type text,
  kind text not null default 'link',
  url text,
  file_url text,
  visibility text not null default 'course',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
alter table resources disable row level security;

-- ---- COURSES (one jsonb blob per course, admin-managed) ----
create table courses (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table courses disable row level security;

-- ---- COHORTS (one jsonb blob per cohort, admin-managed) ----
create table cohorts (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table cohorts disable row level security;

-- ---- SITE SETTINGS (branding + admin's own profile, single row) ----
create table site_settings (
  id text primary key default 'main',
  brand jsonb not null,
  admin_profile jsonb not null,
  updated_at timestamptz default now()
);
alter table site_settings disable row level security;

-- ---- RLS: students & applicants hold real people's private data ----
alter table students enable row level security;
alter table applicants enable row level security;

-- Anyone signed in can create an application for their own email.
create policy "applicants_insert_own" on applicants for insert to authenticated
  with check (email = auth.jwt() ->> 'email');
-- You can see your own application; the admin account can see all of them.
create policy "applicants_select" on applicants for select to authenticated
  using (email = auth.jwt() ->> 'email' or auth.jwt() ->> 'email' = 'fjroomm@gmail.com');
-- Only the admin account can accept/decline (update status).
create policy "applicants_update_admin" on applicants for update to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

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
-- either a Student ID (FJ/2026/001) or an email typed into the same field.
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
