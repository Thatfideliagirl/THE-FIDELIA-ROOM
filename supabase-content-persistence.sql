-- ============================================================
-- FJ Room — real database saving for Testimonials, FAQ, Notice
-- Board, Tasks, Community, and Chat.
--
-- What this fixes: these six areas were never actually being saved
-- to the database -- they only lived in the app's memory while it
-- was open, so anything posted reset the moment anyone reloaded the
-- page. This predates Team Access; it's not something that broke,
-- it's something that was never finished. This finishes it, the
-- same way courses, cohorts, students, and resources already work.
--
-- The placeholder testimonials/FAQ/notice/task content you're
-- currently seeing was never real saved data either -- it'll be
-- empty the first time this loads, and from then on whatever you
-- (or your team) actually add through the app is what persists.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

-- ---- TESTIMONIALS & FAQ -- shown on the public landing page, so
-- these need to be readable even by a visitor who isn't signed in.
create table if not exists testimonials (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table testimonials disable row level security;
grant select, insert, update, delete on public.testimonials to anon, authenticated;

create table if not exists faqs (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table faqs disable row level security;
grant select, insert, update, delete on public.faqs to anon, authenticated;

-- ---- NOTICE BOARD, TASKS, COMMUNITY -- only ever used signed in
-- (admin, team, or a student), so no anon access needed here.
create table if not exists notices (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table notices disable row level security;
grant select, insert, update, delete on public.notices to authenticated;

create table if not exists tasks (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tasks disable row level security;
grant select, insert, update, delete on public.tasks to authenticated;

create table if not exists community_posts (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table community_posts disable row level security;
grant select, insert, update, delete on public.community_posts to authenticated;

-- ---- DIRECT MESSAGES -- one row per message rather than one row
-- per thread (a thread is just an ever-growing list, not a single
-- thing to replace), keyed by the same thread key the app already
-- computes client-side (pairKey(a, b) in lib/data.js).
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null,
  from_id text not null,
  text text not null,
  created_at timestamptz not null default now()
);
alter table direct_messages disable row level security;
grant select, insert on public.direct_messages to authenticated;
