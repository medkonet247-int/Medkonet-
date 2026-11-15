-- ============================================================
-- Migration 008: Members-only content tables + RLS
-- Drafts never returned to members (RLS enforces Published only).
-- ============================================================

-- Resource categories (admins can add more)
create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
insert into public.resource_categories (name) values
  ('Anatomy'),('Physiology'),('Biochemistry'),('Pathology'),('Pharmacology'),
  ('Microbiology'),('Community Medicine'),('Medicine'),('Surgery'),
  ('Obstetrics and Gynaecology'),('Paediatrics'),('Past Questions'),('Study Guides'),('Other')
on conflict (name) do nothing;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Other',
  type text not null check (type in ('PDF','Document','Slides','Video link','Website link','Other')),
  file_path text,
  external_url text,
  status text not null default 'Draft' check (status in ('Draft','Published')),
  contributor text,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resources_status_idx on public.resources (status, published_at desc);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_at timestamptz not null,
  type text not null check (type in ('Webinar','Study Session','Workshop','Meetup','Announcement','Other')),
  venue_or_link text not null default '',
  registration_info text not null default '',
  status text not null default 'Draft' check (status in ('Draft','Published')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_status_idx on public.events (status, event_at desc);

create table if not exists public.mentorship_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  who_for text not null default '',
  how_to_apply text not null default '',
  status text not null default 'Draft' check (status in ('Draft','Published')),
  opportunity_status text not null default 'Open' check (opportunity_status in ('Open','Closed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null default '',
  status text not null default 'Draft' check (status in ('Draft','Published')),
  pinned boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists announcements_status_idx on public.announcements (status, pinned desc, published_at desc);

-- RLS
alter table public.resource_categories enable row level security;
alter table public.resources enable row level security;
alter table public.events enable row level security;
alter table public.mentorship_opportunities enable row level security;
alter table public.announcements enable row level security;

-- Categories: approved members read; admins write
drop policy if exists "categories_select" on public.resource_categories;
create policy "categories_select" on public.resource_categories for select
  using (public.is_approved_member() or public.is_admin());
drop policy if exists "categories_insert_admin" on public.resource_categories;
create policy "categories_insert_admin" on public.resource_categories for insert with check (public.is_admin());
drop policy if exists "categories_update_admin" on public.resource_categories;
create policy "categories_update_admin" on public.resource_categories for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "categories_delete_admin" on public.resource_categories;
create policy "categories_delete_admin" on public.resource_categories for delete using (public.is_admin());

-- Resources: members read Published only; admins all
drop policy if exists "resources_select" on public.resources;
create policy "resources_select" on public.resources for select
  using (public.is_admin() or (status = 'Published' and public.is_approved_member()));
drop policy if exists "resources_insert_admin" on public.resources;
create policy "resources_insert_admin" on public.resources for insert with check (public.is_admin());
drop policy if exists "resources_update_admin" on public.resources;
create policy "resources_update_admin" on public.resources for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "resources_delete_admin" on public.resources;
create policy "resources_delete_admin" on public.resources for delete using (public.is_admin());

-- Events
drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events for select
  using (public.is_admin() or (status = 'Published' and public.is_approved_member()));
drop policy if exists "events_insert_admin" on public.events;
create policy "events_insert_admin" on public.events for insert with check (public.is_admin());
drop policy if exists "events_update_admin" on public.events;
create policy "events_update_admin" on public.events for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "events_delete_admin" on public.events;
create policy "events_delete_admin" on public.events for delete using (public.is_admin());

-- Mentorship
drop policy if exists "mentorship_select" on public.mentorship_opportunities;
create policy "mentorship_select" on public.mentorship_opportunities for select
  using (public.is_admin() or (status = 'Published' and public.is_approved_member()));
drop policy if exists "mentorship_insert_admin" on public.mentorship_opportunities;
create policy "mentorship_insert_admin" on public.mentorship_opportunities for insert with check (public.is_admin());
drop policy if exists "mentorship_update_admin" on public.mentorship_opportunities;
create policy "mentorship_update_admin" on public.mentorship_opportunities for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mentorship_delete_admin" on public.mentorship_opportunities;
create policy "mentorship_delete_admin" on public.mentorship_opportunities for delete using (public.is_admin());

-- Announcements
drop policy if exists "announcements_select" on public.announcements;
create policy "announcements_select" on public.announcements for select
  using (public.is_admin() or (status = 'Published' and public.is_approved_member()));
drop policy if exists "announcements_insert_admin" on public.announcements;
create policy "announcements_insert_admin" on public.announcements for insert with check (public.is_admin());
drop policy if exists "announcements_update_admin" on public.announcements;
create policy "announcements_update_admin" on public.announcements for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "announcements_delete_admin" on public.announcements;
create policy "announcements_delete_admin" on public.announcements for delete using (public.is_admin());

-- Audit triggers for content
create or replace function public.audit_content_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_table text := TG_TABLE_NAME;
begin
  if TG_OP = 'DELETE' then
    insert into public.audit_log (actor_id, action, target_id, details)
    values (auth.uid(), v_table || '_deleted', old.id::text,
      jsonb_build_object('table', v_table, 'title', coalesce(old.title, '')));
    return old;
  end if;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), v_table || '_' || lower(TG_OP), new.id::text,
    jsonb_build_object('table', v_table, 'title', coalesce(new.title, ''), 'status', new.status));
  return new;
end;
$$;
drop trigger if exists trg_audit_resources on public.resources;
create trigger trg_audit_resources after insert or update or delete on public.resources
  for each row execute function public.audit_content_change();
drop trigger if exists trg_audit_events on public.events;
create trigger trg_audit_events after insert or update or delete on public.events
  for each row execute function public.audit_content_change();
drop trigger if exists trg_audit_mentorship on public.mentorship_opportunities;
create trigger trg_audit_mentorship after insert or update or delete on public.mentorship_opportunities
  for each row execute function public.audit_content_change();
drop trigger if exists trg_audit_announcements on public.announcements;
create trigger trg_audit_announcements after insert or update or delete on public.announcements
  for each row execute function public.audit_content_change();
