-- ============================================================
-- FJ Room — fix: applying once was creating two applicant rows.
--
-- The confirmation email only ever went out once (that part was
-- always fine), but the LMS ended up with two entries for the same
-- person/course. I found and closed two real ways this could
-- happen on the app side, but rather than gamble on having caught
-- every possible cause, this adds a hard rule at the database level
-- that makes it structurally impossible from here on: the same
-- person can never have two PENDING applications to the same
-- course at once. A person can still re-apply to a course later if
-- an earlier application was declined -- this only blocks two
-- pending applications for the same thing existing at the same time.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

create unique index if not exists applicants_one_pending_per_course
  on applicants (auth_user_id, course_id)
  where auth_user_id is not null and status = 'pending';

-- The trigger that auto-creates an applicant row when someone confirms
-- their email now backs off quietly instead of erroring/duplicating if
-- a matching pending row already exists.
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.email_confirmed_at is null and NEW.email_confirmed_at is not null
     and (NEW.raw_user_meta_data ? 'pendingApplication') then
    insert into public.applicants (name, email, phone, course_id, answers, status, auth_user_id)
    values (
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      nullif(NEW.raw_user_meta_data->>'phone', ''),
      nullif(NEW.raw_user_meta_data->>'courseId', ''),
      coalesce(NEW.raw_user_meta_data->'answers', '[]'::jsonb),
      'pending',
      NEW.id
    )
    on conflict (auth_user_id, course_id) where auth_user_id is not null and status = 'pending' do nothing;
  end if;
  return NEW;
end;
$$;
