-- ============================================================
-- FJ Room — diagnostic: why can't a teammate sign in?
--
-- This doesn't change anything -- it just shows you what state her
-- account is actually in. Replace the email below with hers, then
-- run it and tell me what comes back.
-- ============================================================

select
  tm.name,
  tm.email,
  tm.role_label,
  tm.auth_user_id is not null as has_linked_login,
  au.email_confirmed_at is not null as email_confirmed,
  au.created_at as account_created,
  au.last_sign_in_at
from team_members tm
left join auth.users au on au.id = tm.auth_user_id or au.email = tm.email
where tm.email = 'REPLACE_WITH_HER_EMAIL';
