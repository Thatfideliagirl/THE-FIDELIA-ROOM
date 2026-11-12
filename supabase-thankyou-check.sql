-- ============================================================
-- FJ Room -- makes the free-resource "thank-you email" dependable.
--
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- It is safe to run more than once and doesn't touch or delete anything.
--
-- It adds one small helper that, in a single step, saves the visit AND tells
-- the website two things: "is this email brand new?" and "is this one of my
-- students?" -- so the thank-you only goes to genuinely new visitors.
-- ============================================================
create or replace function record_free_resource_email_v2(p_email text, p_resource_title text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(trim(coalesce(p_email, '')));
  t text := left(coalesce(p_resource_title, ''), 200);
  was_new boolean;
  is_stud boolean;
begin
  if length(e) = 0 or length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false);
  end if;
  was_new := not exists (select 1 from free_resource_emails where email = e);
  is_stud := exists (select 1 from students where lower(email) = e);
  perform record_free_resource_email(e, t);
  return jsonb_build_object('ok', true, 'is_new', was_new, 'is_student', is_stud);
end;
$$;

revoke all on function record_free_resource_email_v2(text, text) from public;
grant execute on function record_free_resource_email_v2(text, text) to anon, authenticated;
