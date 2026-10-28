-- ============================================================
-- FJ Room — Resource library: "all courses in this cohort"
--
-- What this does: adds one new column to your resources table so a
-- resource can be marked visible to every course inside one specific
-- cohort, not just one single course or literally every course on the
-- whole site.
--
-- Nothing existing is touched or deleted. Every resource you already
-- have keeps working exactly as it does today -- this column just sits
-- empty (NULL) on all of them until you start using the new "All courses
-- in this cohort" option when adding or editing a resource.
--
-- How to run it: Supabase dashboard → SQL Editor → New query → paste
-- this in → Run.
-- ============================================================

alter table resources add column if not exists cohort_id text;
