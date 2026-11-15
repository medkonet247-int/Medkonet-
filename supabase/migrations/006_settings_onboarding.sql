-- ============================================================
-- Migration 006: Settings extensions + onboarding columns
-- Run after 001-005. No data loss: only ADDs.
-- ============================================================

-- New settings keys (OFF/empty by default)
insert into public.settings (key, value) values
  ('registration_open', 'true'),
  ('invite_template', 'Hello [Applicant Name],

Your application to join MedKonet Nigeria has been approved.

We are pleased to welcome you to a community connecting Medicine and Surgery students across Nigerian universities.

Use the invitation link below to join our official WhatsApp community:

[Insert Official WhatsApp Invitation Link]

We look forward to learning, connecting, and growing together.

MedKonet Nigeria
Connecting Medical Minds, Building Better Futures.'),
  ('show_community_link', 'false'),
  ('representative_programme_active', 'false')
on conflict (key) do nothing;

-- Onboarding confirmation (nullable, additive)
alter table public.applications
  add column if not exists onboarding_confirmed_at timestamptz,
  add column if not exists onboarding_confirmed_by uuid references auth.users(id);

-- Audit: onboarding confirmations
create or replace function public.audit_onboarding()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.onboarding_confirmed_at is null and new.onboarding_confirmed_at is not null then
    insert into public.audit_log (actor_id, action, target_id, details)
    values (auth.uid(), 'onboarding_confirmed', new.id::text,
      jsonb_build_object('email', new.email, 'confirmed_by', new.onboarding_confirmed_by));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_audit_onboarding on public.applications;
create trigger trg_audit_onboarding after update on public.applications
  for each row execute function public.audit_onboarding();

-- Helper: is approved member (verified + Approved application, or admin)
create or replace function public.is_approved_member()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.applications
    where user_id = auth.uid() and application_status = 'Approved'
  ) or public.is_admin();
$$;

-- Secure: get WhatsApp community link only for approved members when option ON
create or replace function public.get_community_link()
returns text language plpgsql security definer set search_path = public stable as $$
declare v_link text; v_show text;
begin
  if not public.is_approved_member() then return null; end if;
  select value into v_show from public.settings where key = 'show_community_link';
  if coalesce(v_show, 'false') <> 'true' then return null; end if;
  select value into v_link from public.settings where key = 'whatsapp_invite_link';
  if v_link is null or trim(v_link) = '' then return null; end if;
  return v_link;
end;
$$;

-- Secure: grant administrator by email (allowlist only; person becomes admin after verifying)
create or replace function public.grant_admin_by_email(p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
begin
  if not public.is_admin() then raise exception 'Not an administrator'; end if;
  if v_email = '' then raise exception 'Email is required'; end if;
  if v_email = 'bionicz115@gmail.com' then
    -- first admin already allowlisted; ensure role exists if user registered
    null;
  end if;
  insert into public.admin_allowlist (email, granted_by)
  values (v_email, auth.uid()::text)
  on conflict (email) do nothing;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'admin_granted', v_email, jsonb_build_object('email', v_email));
  return 'ok';
end;
$$;

-- Secure: revoke administrator (first admin can never be removed; no self-removal)
create or replace function public.revoke_admin_by_email(p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email)); v_uid uuid;
begin
  if not public.is_admin() then raise exception 'Not an administrator'; end if;
  if v_email = 'bionicz115@gmail.com' then raise exception 'The first administrator cannot be removed'; end if;
  select id into v_uid from public.profiles where lower(email) = v_email;
  if v_uid is not null and v_uid = auth.uid() then raise exception 'You cannot remove yourself'; end if;
  delete from public.admin_allowlist where email = v_email;
  if v_uid is not null then
    delete from public.user_roles where user_id = v_uid and role = 'admin';
  end if;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'admin_revoked', v_email, jsonb_build_object('email', v_email));
  return 'ok';
end;
$$;
