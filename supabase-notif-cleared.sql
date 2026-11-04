-- ============================================================
-- FJ Room — Notifications: a "clear" button for the bell.
--
-- Right now opening the bell only removes the red dot; the list
-- itself keeps growing forever. This adds a second column next
-- to the existing "seen" one, to remember which notifications
-- she's deliberately cleared so they stop showing in the list
-- at all (until that same thing happens again).
--
-- Paste into SQL Editor -> New query -> Run.
-- ============================================================

alter table notif_seen add column if not exists cleared_ids jsonb not null default '[]'::jsonb;
