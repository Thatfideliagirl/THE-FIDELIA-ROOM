-- ============================================================
-- FJ Room — temporary diagnostic table for the welcome-email bug
--
-- The problem so far: the email that's supposed to go out the
-- moment someone applies (sendWelcomeEmail) isn't arriving, but the
-- email that goes out when you approve them (sendAcceptanceEmail)
-- works fine -- same underlying send code for both. The applicant's
-- own "confirm your email" message (sent by Supabase itself, not by
-- this) does arrive, which rules out their email address being bad.
--
-- This creates a small table the app will write a line to every
-- time it tries to send one of these emails, and another line once
-- it knows whether that attempt actually went through or failed.
-- That lets me see directly whether the request is even being
-- started for real applicants, instead of needing you to go digging
-- in your browser's technical tools. Nothing here is customer-
-- facing and nothing else in the app changes -- once the bug is
-- found, this table can be dropped.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  email text not null,
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table email_log enable row level security;

-- Anyone can write a log line (the welcome email fires before someone
-- has a signed-in session yet), but nobody can read it except you or
-- a signed-in team member -- same shape as the rest of the app's
-- read-vs-write split.
drop policy if exists "email_log_insert_anyone" on email_log;
create policy "email_log_insert_anyone" on email_log for insert
  to anon, authenticated with check (true);

drop policy if exists "email_log_select_authenticated" on email_log;
create policy "email_log_select_authenticated" on email_log for select
  to authenticated using (true);

grant insert on public.email_log to anon;
grant select, insert on public.email_log to authenticated;
