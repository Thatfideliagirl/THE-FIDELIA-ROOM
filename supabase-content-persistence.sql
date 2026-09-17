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
-- Run supabase-team-students-fix2.sql BEFORE this one if you
-- haven't already -- the Chat section below depends on the
-- is_team_member() helper it creates.
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
-- computes client-side (pairKey(a, b) in lib/data.js -- always the
-- two participant ids sorted and joined with "__", where "admin"
-- stands in for you/your team since chat doesn't distinguish which
-- team member is replying).
--
-- Unlike the other five tables above, this one holds private 1-on-1
-- messages -- so unlike them, it keeps row-level security ON: a
-- student can only ever read/send messages in a thread they're
-- actually part of, and you/your team can only read/send the
-- "admin" side of a conversation, never a thread between two
-- students that doesn't involve you at all.
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null,
  from_id text not null,
  text text not null,
  created_at timestamptz not null default now()
);
alter table direct_messages enable row level security;
grant select, insert on public.direct_messages to authenticated;

drop policy if exists "direct_messages_select" on direct_messages;
create policy "direct_messages_select" on direct_messages for select to authenticated
using (
  (
    (public.is_team_member() or auth.jwt() ->> 'email' = 'fjroomm@gmail.com')
    and 'admin' in (split_part(thread_key, '__', 1), split_part(thread_key, '__', 2))
  )
  or exists (
    select 1 from students st
    where st.auth_user_id = auth.uid()
    and st.id::text in (split_part(thread_key, '__', 1), split_part(thread_key, '__', 2))
  )
);

drop policy if exists "direct_messages_insert" on direct_messages;
create policy "direct_messages_insert" on direct_messages for insert to authenticated
with check (
  (
    (public.is_team_member() or auth.jwt() ->> 'email' = 'fjroomm@gmail.com')
    and from_id = 'admin'
    and 'admin' in (split_part(thread_key, '__', 1), split_part(thread_key, '__', 2))
  )
  or exists (
    select 1 from students st
    where st.auth_user_id = auth.uid()
    and st.id::text = from_id
    and st.id::text in (split_part(thread_key, '__', 1), split_part(thread_key, '__', 2))
  )
);
