-- ============================================================================
-- Royalty Studio — 0003 Storage buckets + policies
-- Public read of imagery; only authenticated admins may upload/delete.
-- ============================================================================

-- Create the four public buckets. `public = true` means the files are served
-- via public URLs (fine for a portfolio); writes are still controlled by the
-- storage.objects policies below.
insert into storage.buckets (id, name, public)
values
  ('portfolio',    'portfolio',    true),
  ('branding',     'branding',     true),
  ('services',     'services',     true),
  ('testimonials', 'testimonials', true)
on conflict (id) do nothing;

-- Public, read-only access to objects in these buckets.
drop policy if exists "royalty_public_read" on storage.objects;
create policy "royalty_public_read" on storage.objects
  for select using (
    bucket_id in ('portfolio', 'branding', 'services', 'testimonials')
  );

-- Admins may upload.
drop policy if exists "royalty_admin_insert" on storage.objects;
create policy "royalty_admin_insert" on storage.objects
  for insert with check (
    public.is_admin()
    and bucket_id in ('portfolio', 'branding', 'services', 'testimonials')
  );

-- Admins may replace/update.
drop policy if exists "royalty_admin_update" on storage.objects;
create policy "royalty_admin_update" on storage.objects
  for update using (
    public.is_admin()
    and bucket_id in ('portfolio', 'branding', 'services', 'testimonials')
  )
  with check (
    public.is_admin()
    and bucket_id in ('portfolio', 'branding', 'services', 'testimonials')
  );

-- Admins may delete.
drop policy if exists "royalty_admin_delete" on storage.objects;
create policy "royalty_admin_delete" on storage.objects
  for delete using (
    public.is_admin()
    and bucket_id in ('portfolio', 'branding', 'services', 'testimonials')
  );
