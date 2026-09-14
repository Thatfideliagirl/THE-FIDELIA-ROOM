-- ============================================================
-- FJ Room — auto-create the applicant record the moment someone
-- confirms their email (needed for verified-email signups: at signup
-- time there's no session yet to save the application, so it's carried
-- as signup metadata and this trigger creates the real row once their
-- email is confirmed).
-- Safe to run any time, whether "Confirm email" is currently on or off
-- -- it only ever fires on an actual unconfirmed → confirmed transition.
-- Paste into the project's SQL Editor → New query → Run.
-- ============================================================

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
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_email_confirmed();
