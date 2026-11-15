-- ============================================================
-- Migration 004: Storage bucket "site-images"
-- Publicly READABLE (public site images only),
-- writable only by administrators via storage policies.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

-- Storage policies (storage.objects)
drop policy if exists "site-images public read" on storage.objects;
create policy "site-images public read" on storage.objects for select
  using (bucket_id = 'site-images');

drop policy if exists "site-images admin insert" on storage.objects;
create policy "site-images admin insert" on storage.objects for insert
  with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "site-images admin update" on storage.objects;
create policy "site-images admin update" on storage.objects for update
  using (bucket_id = 'site-images' and public.is_admin())
  with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "site-images admin delete" on storage.objects;
create policy "site-images admin delete" on storage.objects for delete
  using (bucket_id = 'site-images' and public.is_admin());
