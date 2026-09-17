-- ============================================================
-- FJ Room — Team Access
--
-- Lets you add teammates (starting with your intern) who sign in
-- with their own email/password and see a dashboard built from
-- exactly the tabs you turn on for them -- plus an activity log so
-- you can see what each person actually did.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role_label text not null default 'Team member',
  permissions jsonb not null default '[]'::jsonb,
  auth_user_id uuid references auth.users(id),
  photo text,
  bio text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists team_activity (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references team_members(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;
alter table team_activity enable row level security;

-- Only the owner account can see or manage the full roster and
-- activity feed -- this is who's allowed to grant admin access in
-- the first place, so it stays locked to you specifically.
create policy "team_members_owner_all" on team_members for all to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com')
  with check (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

create policy "team_activity_owner_select" on team_activity for select to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

grant select, insert, update, delete on public.team_members to authenticated;
grant select on public.team_activity to authenticated;

-- Lets the sign-up screen check "is this email invited" and prefill
-- the name/role, without exposing the rest of the roster to anyone
-- who isn't the owner.
create or replace function public.check_team_invite(check_email text)
returns table (name text, role_label text)
language sql
security definer
set search_path = public
as $$
  select name, role_label from team_members where email = check_email;
$$;
grant execute on function public.check_team_invite(text) to anon, authenticated;

-- Lets a signed-in team member read their own row (name, permissions)
-- without needing direct SELECT access to the whole table.
create or replace function public.get_my_team_access()
returns table (id uuid, name text, email text, role_label text, permissions jsonb, photo text, bio text)
language sql
security definer
set search_path = public
as $$
  select id, name, email, role_label, permissions, photo, bio from team_members where auth_user_id = auth.uid();
$$;
grant execute on function public.get_my_team_access() to authenticated;

-- Lets a signed-in team member update their OWN photo/bio only --
-- resolves the caller's row server-side, so this can never touch
-- their permissions, role label, or anyone else's row.
create or replace function public.update_my_team_profile(new_photo text, new_bio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update team_members set photo = new_photo, bio = new_bio where auth_user_id = auth.uid();
end;
$$;
grant execute on function public.update_my_team_profile(text, text) to authenticated;

-- Links a newly-created auth account back to its team_members row
-- (called once, right after sign-up) and lets any signed-in team
-- member log their own activity -- both resolve the caller's own
-- identity server-side, so nobody can claim to be someone else.
create or replace function public.claim_team_membership()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update team_members set auth_user_id = auth.uid()
  where email = auth.jwt() ->> 'email' and auth_user_id is null;
end;
$$;
grant execute on function public.claim_team_membership() to authenticated;

create or replace function public.log_team_activity(action_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_id uuid;
begin
  select id into member_id from team_members where auth_user_id = auth.uid();
  if member_id is not null then
    insert into team_activity (team_member_id, action) values (member_id, action_text);
  end if;
end;
$$;
grant execute on function public.log_team_activity(text) to authenticated;
