-- ============================================================
-- FJ Room — fix: uploaded files (resource downloads, slide decks,
-- meeting recordings) don't download on mobile.
--
-- Root cause: uploaded files were being embedded directly into the
-- page as giant base64 blobs ("data:" links) instead of being real
-- files with a real web address. Desktop browsers mostly tolerate
-- this; mobile browsers (especially iPhone Safari) generally don't
-- support downloading a "data:" link at all, so the button does
-- nothing.
--
-- Fix: a real file storage bucket, so uploads become actual files
-- with a real, reliable URL -- same trusted-client model already
-- used for courses/resources/cohorts (public read, anyone with the
-- app's key can write, since only the admin screens ever call this).
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "uploads_public_read" on storage.objects for select
  using (bucket_id = 'uploads');

create policy "uploads_write" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'uploads');

create policy "uploads_update" on storage.objects for update to anon, authenticated
  using (bucket_id = 'uploads');

create policy "uploads_delete" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'uploads');
