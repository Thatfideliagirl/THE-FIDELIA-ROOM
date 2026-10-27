-- ============================================================
-- FJ Room — fix two things at once
--
-- 1) THE NAME ISSUE YOU REPORTED
-- Nothing in the app's own screens has ever let a student (or anyone
-- but you) change their name -- there's no edit box for it anywhere,
-- not even for you as admin. I checked every place the app saves a
-- student and confirmed that again just now.
--
-- But the database's security rule for "can this person update this
-- student record" only checks WHOSE row is being touched (their own),
-- not WHICH fields are allowed to change. So even though the app's
-- screens never offer a way to do it, someone logged in as that
-- student could, in theory, send a request straight to the database
-- itself -- skipping the app's screens entirely -- and change their
-- own name, email, or Student ID, because the database wasn't
-- actually stopping that specific field from changing. That's a gap
-- in the underlying rule, not something the app's interface did.
--
-- This adds a second layer of protection, directly in the database:
-- no matter what anyone sends, the name, email, Student ID, and which
-- login the record belongs to can only ever change when it's YOU
-- (the admin account) making the change. Self-service edits (photo,
-- bio, social links) keep working exactly as before.
--
-- 2) SOCIAL MEDIA LINKS WEREN'T ACTUALLY BEING SAVED
-- A separate, real bug on my end: a student's social links looked
-- like they saved ("Saved." shows up), but there was no actual column
-- for them in the database -- so they only ever lived in the page's
-- temporary memory and disappeared on reload. This adds that column;
-- I'll ship the matching code fix once you've run this.
--
-- Paste this whole thing into Supabase -> SQL Editor -> New query ->
-- Run. It doesn't touch or delete any existing data.
-- ============================================================

-- ---- 1) lock down name / email / student ID / login link ----
create or replace function public.protect_student_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.jwt() ->> 'email' is distinct from 'fjroomm@gmail.com' then
    new.name := old.name;
    new.email := old.email;
    new.student_code := old.student_code;
    new.auth_user_id := old.auth_user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_student_identity_trigger on students;
create trigger protect_student_identity_trigger
  before update on students
  for each row
  execute function public.protect_student_identity();

-- ---- 2) add the missing social links column ----
alter table students add column if not exists social_links jsonb not null default '[]'::jsonb;
