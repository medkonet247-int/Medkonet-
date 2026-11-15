-- ============================================================
-- MedKonet Nigeria — Phase A
-- Migration 001: Extensions, tables, constraints, indexes
-- Run in order: 001 -> 002 -> 003 -> 004 -> 005
-- Paste each file into Supabase SQL Editor and run.
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- profiles: one row per auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

-- applications: membership applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  whatsapp_number text not null,
  university text not null,
  university_type text not null check (university_type in ('Federal','State','Private')),
  state text not null,
  course text not null,
  current_level text not null,
  reason_for_joining text not null,
  application_status text not null default 'Pending' check (application_status in ('Pending','Approved','Rejected')),
  rejection_reason text,
  invited_at timestamptz,
  invited_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists applications_email_lower_idx on public.applications (lower(email));
create index if not exists applications_status_idx on public.applications (application_status);
create index if not exists applications_submitted_idx on public.applications (submitted_at desc);

-- verification_codes: hashed 4-digit codes + link tokens (never plain text)
create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  used_at timestamptz,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists verification_codes_user_idx on public.verification_codes (user_id, created_at desc);
create index if not exists verification_codes_email_idx on public.verification_codes (lower(email), created_at desc);

-- password reset tokens (hashed), same table pattern via separate table for clarity
create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_idx on public.password_resets (user_id, created_at desc);

-- admin_allowlist: the ONLY source of administrator eligibility
create table if not exists public.admin_allowlist (
  email text primary key,
  granted_by text not null default 'initial-setup',
  created_at timestamptz not null default now()
);

-- user_roles: dedicated roles table (never on profile/application)
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','member')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id)
);

-- settings: key-value (e.g. whatsapp_invite_link — never shown publicly)
create table if not exists public.settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- site_images: admin-managed public images
create table if not exists public.site_images (
  slot_key text primary key,
  image_path text not null,
  alt_text text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- audit_log: administrators read only
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
