-- ============================================================
-- Migration 011: Private storage bucket for resource files
-- No public URLs. Access via short-lived signed URLs only.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', false)
on conflict (id) do update set public = false;

drop policy if exists "resource-files admin all" on storage.objects;
create policy "resource-files admin all" on storage.objects for all
  using (bucket_id = 'resource-files' and public.is_admin())
  with check (bucket_id = 'resource-files' and public.is_admin());

-- Approved members may read (for signed URLs) but never list publicly
drop policy if exists "resource-files member read" on storage.objects;
create policy "resource-files member read" on storage.objects for select
  using (bucket_id = 'resource-files' and public.is_approved_member());
