-- One more temporary opening for the same one-time migration --
-- RLS is already off on these tables from the last step, but they also
-- need a plain grant for the migration script's connection to write
-- through. Re-enabling RLS right after this (next file) shuts this back
-- off automatically, since the real security policies only apply to
-- signed-in users, not this temporary access.
grant select, insert on public.students to anon;
grant select, insert on public.applicants to anon;
