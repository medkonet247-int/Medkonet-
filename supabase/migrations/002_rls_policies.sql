-- ============================================================
-- Migration 002: Row Level Security on EVERY table
-- Route guards are UX only — real protection is here.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.verification_codes enable row level security;
alter table public.password_resets enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.user_roles enable row level security;
alter table public.settings enable row level security;
alter table public.site_images enable row level security;
alter table public.audit_log enable row level security;

-- profiles: own read; admins read all; own update (name only via app logic)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
  using (auth.uid() = id);
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles for select
  using (public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
-- inserts/updates of email_verified done by Edge Functions (service role bypasses RLS)

-- applications: own read; admins full read/update; no direct insert (Edge Function creates)
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications for select
  using (auth.uid() = user_id);
drop policy if exists "applications_select_admin" on public.applications;
create policy "applications_select_admin" on public.applications for select
  using (public.is_admin());
drop policy if exists "applications_update_admin" on public.applications;
create policy "applications_update_admin" on public.applications for update
  using (public.is_admin()) with check (public.is_admin());

-- verification_codes: NO access for anon/authenticated (service role only)
-- (no policies = deny all; RLS enabled above)

-- password_resets: NO access for anon/authenticated (service role only)

-- admin_allowlist: NO access for anon/authenticated (service role only)

-- user_roles: own read; admins read all
drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles for select
  using (auth.uid() = user_id);
drop policy if exists "user_roles_select_admin" on public.user_roles;
create policy "user_roles_select_admin" on public.user_roles for select
  using (public.is_admin());

-- settings: admins read/write only; never public
drop policy if exists "settings_select_admin" on public.settings;
create policy "settings_select_admin" on public.settings for select
  using (public.is_admin());
drop policy if exists "settings_insert_admin" on public.settings;
create policy "settings_insert_admin" on public.settings for insert
  with check (public.is_admin());
drop policy if exists "settings_update_admin" on public.settings;
create policy "settings_update_admin" on public.settings for update
  using (public.is_admin()) with check (public.is_admin());

-- site_images: public READ (site images only), admins write
drop policy if exists "site_images_select_public" on public.site_images;
create policy "site_images_select_public" on public.site_images for select
  using (true);
drop policy if exists "site_images_insert_admin" on public.site_images;
create policy "site_images_insert_admin" on public.site_images for insert
  with check (public.is_admin());
drop policy if exists "site_images_update_admin" on public.site_images;
create policy "site_images_update_admin" on public.site_images for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "site_images_delete_admin" on public.site_images;
create policy "site_images_delete_admin" on public.site_images for delete
  using (public.is_admin());

-- audit_log: admins read; admins insert (app-level logging)
drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin" on public.audit_log for select
  using (public.is_admin());
drop policy if exists "audit_log_insert_admin" on public.audit_log;
create policy "audit_log_insert_admin" on public.audit_log for insert
  with check (public.is_admin());
