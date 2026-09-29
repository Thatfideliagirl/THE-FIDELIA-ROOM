-- ============================================================
-- FJ Room — diagnostic: did these two recent applicants take a
-- path that skips sending any email at all?
--
-- This doesn't change anything -- it just shows the last few
-- applicants and how they got created. Run it and send me back
-- what comes out (or a screenshot of the results grid).
-- ============================================================

select
  name,
  email,
  created_at,
  auth_user_id is not null as was_already_signed_in,
  student_ref is not null as applied_as_existing_student
from applicants
order by created_at desc
limit 5;
