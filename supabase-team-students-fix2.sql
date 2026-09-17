-- ============================================================
-- FJ Room — Team Access, part 3: actually fix "she still can't
-- see students."
--
-- What went wrong with the last file: the policies I gave you
-- checked "is this person in team_members" by querying the
-- team_members table directly from inside another table's security
-- rule. But team_members has its OWN security rule that only lets
-- YOU read it -- so when your teammate's request tried to check
-- "am I on the team", that check itself got silently blocked too,
-- and always came back "no". Same bug, one level deeper.
--
-- The fix: check membership through a small helper function
-- instead (same trick already used elsewhere in Team Access) that's
-- allowed to peek at team_members regardless of who's asking, and
-- point the rules at that instead of the table directly.
--
-- Paste into SQL Editor -> New query -> Run.
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

drop policy if exists "team_members_select_students" on students;
drop policy if exists "team_members_insert_students" on students;
drop policy if exists "team_members_update_students" on students;
drop policy if exists "team_members_delete_students" on students;
drop policy if exists "team_members_select_applicants" on applicants;
drop policy if exists "team_members_update_applicants" on applicants;
drop policy if exists "team_members_delete_applicants" on applicants;

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
