-- Phase 2d: move cohorts out of local mock state into Supabase.
-- Same issue as courses/branding before: unlocking a course for a cohort
-- only ever changed the admin's own browser tab, never the database --
-- so students never actually saw it unlock on their side.

-- Same as the old courses table: this uuid-based cohorts table was created
-- by the very first schema for a design that was never adopted, and
-- nothing in the app queries it.
drop table if exists cohorts cascade;

create table if not exists cohorts (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table cohorts disable row level security;

-- Carry over the one cohort that already exists as local seed data.
insert into cohorts (id, data) values
('diamond', '{
  "name": "Diamond Cohort", "startDate": "2026-01-06", "endDate": "2026-06-30", "status": "active",
  "courseIds": ["va", "cs"], "unlockedCourseIds": ["va"]
}'::jsonb)
on conflict (id) do nothing;
