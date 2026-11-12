-- ============================================================
-- FJ Room — everything new in one go.
--
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- It is safe to run more than once, and it doesn't touch or delete
-- anything you already have.
--
--   PART 1  Your Email List (free resources)
--   PART 2  Meeting reminders
-- ============================================================


-- ------------------------------------------------------------
-- PART 1 — Your Email List
--
-- One row per person (their email, lower-case, so no duplicates).
-- Coming back with the same email just raises "visits" by one.
-- Visitors can only ADD themselves through the function below;
-- they can't read the list. Only your login can read or remove.
-- ------------------------------------------------------------
create table if not exists free_resource_emails (
  email        text primary key,
  visits       integer     not null default 1,
  first_seen   timestamptz not null default now(),
  last_seen    timestamptz not null default now(),
  last_resource text,
  resources    jsonb       not null default '[]'::jsonb
);
alter table free_resource_emails enable row level security;

drop policy if exists "free_emails_owner_read" on free_resource_emails;
create policy "free_emails_owner_read" on free_resource_emails
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

drop policy if exists "free_emails_owner_delete" on free_resource_emails;
create policy "free_emails_owner_delete" on free_resource_emails
  for delete to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

grant select, delete on free_resource_emails to authenticated;

create or replace function record_free_resource_email(p_email text, p_resource_title text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(trim(coalesce(p_email, '')));
  t text := left(coalesce(p_resource_title, ''), 200);
begin
  if length(e) = 0 or length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return;
  end if;
  insert into free_resource_emails (email, last_resource, resources)
  values (e, nullif(t, ''), case when t = '' then '[]'::jsonb else jsonb_build_array(t) end)
  on conflict (email) do update set
    visits        = free_resource_emails.visits + 1,
    last_seen     = now(),
    last_resource = coalesce(nullif(t, ''), free_resource_emails.last_resource),
    resources     = case
                      when t = '' or free_resource_emails.resources @> to_jsonb(t)
                        then free_resource_emails.resources
                      else free_resource_emails.resources || jsonb_build_array(t)
                    end;
end;
$$;

revoke all on function record_free_resource_email(text, text) from public;
grant execute on function record_free_resource_email(text, text) to anon, authenticated;


-- ------------------------------------------------------------
-- PART 2 — Meeting reminders ("your class starts in 1 hour")
--
-- (a) A small record of which meetings have already been reminded,
--     so nobody is ever emailed twice for the same class.
-- (b) A timer inside Supabase that wakes the website's reminder job
--     every 10 minutes. (Your hosting plan only allows a timer once
--     a day, so this one lives here instead. It is free.)
--
-- Before this works you also need to add ONE setting on Vercel --
-- see the note I sent you ("SUPABASE_SERVICE_ROLE_KEY").
-- ------------------------------------------------------------
create table if not exists meeting_reminders (
  key        text primary key,
  sent_at    timestamptz not null default now(),
  recipients integer     not null default 0
);
-- No policies on purpose: only the website's server (using the service key)
-- can read or write this. Visitors and students can't touch it.
alter table meeting_reminders enable row level security;

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Remove an older copy of this timer if you run the file again.
do $$
begin
  perform cron.unschedule('fjroom-meeting-reminders');
exception when others then
  null;
end;
$$;

select cron.schedule(
  'fjroom-meeting-reminders',
  '*/10 * * * *',
  $$ select net.http_post(
       url     := 'https://www.fjroom.com/api/send-meeting-reminders',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body    := '{}'::jsonb
     ); $$
);
