-- ============================================================
-- FJ Room — make task submissions, community mentions, and
-- messages show up live, the same way applications already do.
--
-- You just ran into this: a submission email arrived, but the
-- in-app notification bell never updated the count, because the
-- dashboard tab had already loaded before the submission came in.
-- Students and applicants were already set up to push live updates
-- to an open tab -- tasks (submissions, grading), community posts
-- (mentions), and direct messages never were. This turns live
-- updates on for those three as well, so the bell catches up the
-- instant something happens, without needing to reload the page.
--
-- Paste into SQL Editor -> New query -> Run.
-- ============================================================

alter publication supabase_realtime add table tasks, community_posts, direct_messages;
