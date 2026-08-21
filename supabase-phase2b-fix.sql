-- ============================================================
-- FJ Room — fix: resources can't save at all right now
-- Something switched on Row Level Security for `resources` with no
-- rule permitting any access -- blocking reads AND writes for
-- everyone, including the admin account. This matches the app's
-- original design (resources were never meant to need RLS -- they're
-- admin-managed content, not private user data), so this just turns
-- it back off.
-- Paste into Supabase → SQL Editor → New query → Run.
-- ============================================================

alter table resources disable row level security;
