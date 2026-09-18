-- ============================================================
-- FJ Room — restore the original testimonials & FAQs
--
-- These were confirmed to be genuinely empty in your live database
-- (the earlier "placeholder" content only ever lived in the app's
-- memory, before real saving existed -- it was never actually
-- stored, so the migration had nothing to carry over).
--
-- This puts the original three testimonials and four FAQs back as
-- real rows, so they show on the landing page AND are editable /
-- deletable from Admin > Testimonials and Admin > FAQ from now on.
-- Safe to re-run -- it just overwrites these same rows again.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

insert into testimonials (id, data) values
  ('te1', '{"name":"Larry O.","quote":"Fidelia doesn''t just teach — she checks that you actually got it before you move on."}'),
  ('te2', '{"name":"Victoria A.","quote":"I came in nervous about tech tools. Left with a client and a system I actually understand."}'),
  ('te3', '{"name":"Faith I.","quote":"Got my first client three weeks after finishing module seven."}')
on conflict (id) do update set data = excluded.data, updated_at = now();

insert into faqs (id, data) values
  ('f1', '{"q":"Do I need previous experience before applying?","a":"No — most courses are built for beginners."}'),
  ('f2', '{"q":"How do I apply for a course?","a":"Applying and signing up happen in one step."}'),
  ('f4', '{"q":"How do I receive my access code?","a":"Once approved, keep an eye on your email — check spam too, just in case."}'),
  ('f5', '{"q":"Will I get a certificate?","a":"Yes, once you complete every module."}')
on conflict (id) do update set data = excluded.data, updated_at = now();
