-- ============================================================
-- FJ Room — Team Access, part 2: let team members actually see
-- students & applicants.
--
-- You already ran supabase-team-access.sql -- this is a small
-- follow-up, not a replacement. Paste into SQL Editor -> New query
-- -> Run, same as before.
--
-- What this fixes: the "Students" tab was toggled on for your
-- teammate but she saw a blank roster. Root cause -- the students/
-- applicants tables' security rules only ever recognized YOUR email
-- specifically (they predate Team Access), so a real teammate's
-- login was invisible to them, even with the tab turned on -- no
-- error, just zero rows back. This adds a second rule, additive to
-- the one that already exists for you, covering anyone you've
-- actually added to your team. Which tabs a teammate can actually
-- SEE is still controlled entirely by the toggles on your Team tab.
--
-- The membership check goes through a small helper function rather
-- than querying team_members directly, because team_members has its
-- own security rule (owner-only) that would otherwise block that
-- very check for anyone who isn't you.
-- ============================================================

create or replace function public.is_team_member()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from team_members where auth_user_id = auth.uid());
$$;
grant execute on function public.is_team_member() to authenticated;

create policy "team_members_select_students" on students for select to authenticated
  using (public.is_team_member());
create policy "team_members_insert_students" on students for insert to authenticated
  with check (public.is_team_member());
create policy "team_members_update_students" on students for update to authenticated
  using (public.is_team_member());
create policy "team_members_delete_students" on students for delete to authenticated
  using (public.is_team_member());

create policy "team_members_select_applicants" on applicants for select to authenticated
  using (public.is_team_member());
create policy "team_members_update_applicants" on applicants for update to authenticated
  using (public.is_team_member());
create policy "team_members_delete_applicants" on applicants for delete to authenticated
  using (public.is_team_member());
