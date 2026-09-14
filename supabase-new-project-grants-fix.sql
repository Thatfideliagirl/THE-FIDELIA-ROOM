-- ============================================================
-- FJ Room — NEW project fix: missing table grants
-- Tables exist and RLS is set correctly, but this project didn't come
-- with the usual baseline "anon/authenticated can touch these tables at
-- all" permissions that Supabase normally sets up automatically. This
-- grants exactly what each table needs -- nothing more.
-- Paste into the NEW project's SQL Editor → New query → Run.
-- ============================================================

-- Public, admin-managed content: same trusted-client model as the rest
-- of this app -- no login needed to read, and RLS is already off for
-- these, so the write access is safe the same way it already is
-- everywhere else in the app.
grant select, insert, update, delete on public.courses to anon, authenticated;
grant select, insert, update, delete on public.cohorts to anon, authenticated;
grant select, insert, update, delete on public.resources to anon, authenticated;
grant select, insert, update, delete on public.site_settings to anon, authenticated;

-- Private data: only signed-in users get any access at all, and RLS
-- (already in place) narrows that down further to "your own row, or
-- the admin account".
grant select, insert, update on public.students to authenticated;
grant select, insert, update on public.applicants to authenticated;
