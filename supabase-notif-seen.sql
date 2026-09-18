-- ============================================================
-- FJ Room — make "mark as seen" on the notification bell actually
-- stick.
--
-- Opening the bell marked everything seen only in that one browser
-- tab's memory -- refreshing (or opening the site on another
-- device) reset it, because which notifications you'd already seen
-- was never actually saved anywhere. This gives every signed-in
-- person (you, your team, or a student) their own row remembering
-- which notification IDs they've already dismissed.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

create table if not exists notif_seen (
  viewer_key text primary key,
  seen_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table notif_seen enable row level security;

drop policy if exists "notif_seen_own" on notif_seen;
create policy "notif_seen_own" on notif_seen for all to authenticated
  using (viewer_key = auth.uid()::text)
  with check (viewer_key = auth.uid()::text);

grant select, insert, update on public.notif_seen to authenticated;
