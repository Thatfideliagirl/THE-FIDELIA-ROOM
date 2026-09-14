-- Migration done -- lock students/applicants back down to their real
-- security rules (the policies were never removed, just paused).
alter table students enable row level security;
alter table applicants enable row level security;
revoke insert, select on public.students from anon;
revoke insert, select on public.applicants from anon;
