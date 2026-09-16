-- ============================================================
-- FJ Room — fix: deleting a student or applicant looked like it
-- worked but reverted after a refresh (or showed an error).
--
-- Root cause, two layers, both missing for "students" and
-- "applicants" since delete wasn't a feature yet when this project
-- was first set up:
--   1. A table-level permission grant for delete (without this, the
--      database refuses the request outright -- this is the "went
--      wrong" error you saw).
--   2. A row-level security rule allowing the admin account to
--      delete a row (without this, even a permitted request quietly
--      matches nothing, so the row silently survives).
-- Both are needed together. This adds both, admin-only, matching
-- the same pattern already used for updates.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

grant delete on public.students to authenticated;
grant delete on public.applicants to authenticated;

create policy "applicants_delete_admin" on applicants for delete to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');

create policy "students_delete_admin" on students for delete to authenticated
  using (auth.jwt() ->> 'email' = 'fjroomm@gmail.com');
