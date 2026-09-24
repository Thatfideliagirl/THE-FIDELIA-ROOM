-- ============================================================
-- FJ Room — fix: Supabase's security warning about public tables
--
-- What that email actually found: courses, cohorts, testimonials,
-- FAQs, resources, and your site settings (brand/logo/contact info)
-- are correctly readable by anyone -- that's required for your
-- landing page, course list, and resource library to work for a
-- visitor who hasn't signed in yet. That part is fine and stays.
--
-- The real problem: they're currently also WRITABLE by anyone with
-- no login at all -- not just from your own admin screens. Your
-- site's public key (not a secret, it's meant to be visible in the
-- browser) is enough on its own for a stranger to call this
-- database directly and delete your whole course catalog, wipe your
-- testimonials, or deface your site branding, without ever signing
-- in. I checked: nothing in the app writes to any of these tables
-- without you or a team member being signed in first, so this fix
-- has no effect on anything that currently works.
--
-- Fix: reading stays open to everyone (anon + authenticated).
-- Adding, editing, and deleting now requires being signed in
-- (authenticated) -- which is already true every time you or your
-- team actually use these screens.
--
-- Paste into the project's SQL Editor -> New query -> Run.
-- ============================================================

revoke insert, update, delete on public.courses from anon;
revoke insert, update, delete on public.cohorts from anon;
revoke insert, update, delete on public.resources from anon;
revoke insert, update, delete on public.site_settings from anon;
revoke insert, update, delete on public.testimonials from anon;
revoke insert, update, delete on public.faqs from anon;

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.cohorts to authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.testimonials to authenticated;
grant select, insert, update, delete on public.faqs to authenticated;
