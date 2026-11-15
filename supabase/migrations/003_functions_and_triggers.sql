-- ============================================================
-- Migration 003: Secure functions (fixed search_path) + triggers
-- ============================================================

-- is_admin(): SECURITY DEFINER with fixed search_path
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- get_my_role(): returns 'admin' | 'member' | null for current user
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.user_roles where user_id = auth.uid() limit 1;
$$;

-- updated_at auto-touch
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_applications_touch on public.applications;
create trigger trg_applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_touch on public.settings;
create trigger trg_settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_site_images_touch on public.site_images;
create trigger trg_site_images_touch before update on public.site_images
  for each row execute function public.touch_updated_at();

-- Audit: application status changes (approve/reject/change)
create or replace function public.audit_application_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.application_status is distinct from new.application_status then
    insert into public.audit_log (actor_id, action, target_id, details)
    values (
      auth.uid(),
      'application_status_changed',
      new.id::text,
      jsonb_build_object(
        'from', old.application_status,
        'to', new.application_status,
        'email', new.email,
        'reviewed_by', new.reviewed_by,
        'rejection_reason', new.rejection_reason
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_application on public.applications;
create trigger trg_audit_application after update on public.applications
  for each row execute function public.audit_application_change();

-- Audit: invitations marked
create or replace function public.audit_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.invited_at is null and new.invited_at is not null then
    insert into public.audit_log (actor_id, action, target_id, details)
    values (
      auth.uid(),
      'invitation_marked',
      new.id::text,
      jsonb_build_object('email', new.email, 'invited_by', new.invited_by, 'invited_at', new.invited_at)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_invitation on public.applications;
create trigger trg_audit_invitation after update on public.applications
  for each row execute function public.audit_invitation();

-- Audit: settings changes
create or replace function public.audit_settings_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, target_id, details)
  values (
    auth.uid(),
    'settings_changed',
    new.key,
    jsonb_build_object('key', new.key)
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_settings on public.settings;
create trigger trg_audit_settings after insert or update on public.settings
  for each row execute function public.audit_settings_change();

-- Audit: image changes
create or replace function public.audit_image_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, target_id, details)
  values (
    auth.uid(),
    'site_image_changed',
    new.slot_key,
    jsonb_build_object('slot_key', new.slot_key, 'image_path', new.image_path)
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_image_insert on public.site_images;
create trigger trg_audit_image_insert after insert on public.site_images
  for each row execute function public.audit_image_change();

drop trigger if exists trg_audit_image_update on public.site_images;
create trigger trg_audit_image_update after update on public.site_images
  for each row execute function public.audit_image_change();
