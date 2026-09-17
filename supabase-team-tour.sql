-- ============================================================
-- FJ Room — Team Access: welcome tour for new teammates.
--
-- A team member setting their password for the first time never
-- got the same "here's where everything is" walkthrough a new
-- student gets. This adds one for them -- shown once, first sign
-- in, dismissible.
--
-- Paste into SQL Editor -> New query -> Run.
-- ============================================================

alter table team_members add column if not exists seen_tour boolean not null default false;

-- get_my_team_access's return columns are changing (adding seen_tour),
-- which Postgres won't let CREATE OR REPLACE do -- has to be dropped first.
drop function if exists public.get_my_team_access();
create function public.get_my_team_access()
returns table (id uuid, name text, email text, role_label text, permissions jsonb, photo text, bio text, seen_tour boolean)
language sql
security definer
set search_path = public
as $$
  select id, name, email, role_label, permissions, photo, bio, seen_tour from team_members where auth_user_id = auth.uid();
$$;
grant execute on function public.get_my_team_access() to authenticated;

create or replace function public.mark_my_tour_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update team_members set seen_tour = true where auth_user_id = auth.uid();
end;
$$;
grant execute on function public.mark_my_tour_seen() to authenticated;
