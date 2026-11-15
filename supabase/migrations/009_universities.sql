-- ============================================================
-- Migration 009: University directory + linking + reports
-- ============================================================

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Federal','State','Private')),
  state text not null,
  location text not null default '',
  verification_status text not null default 'Unverified' check (verification_status in ('Unverified','Verified')),
  active boolean not null default true,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists universities_name_lower_idx on public.universities (lower(name));
create index if not exists universities_active_idx on public.universities (active, verification_status);

-- Link applications to directory (nullable, additive; free-text university kept)
alter table public.applications
  add column if not exists university_id uuid references public.universities(id);

alter table public.universities enable row level security;

-- Members (approved) + admins read Verified+active; admins read all
drop policy if exists "universities_select" on public.universities;
create policy "universities_select" on public.universities for select
  using (public.is_admin() or (verification_status = 'Verified' and active = true and public.is_approved_member()));
drop policy if exists "universities_insert_admin" on public.universities;
create policy "universities_insert_admin" on public.universities for insert with check (public.is_admin());
drop policy if exists "universities_update_admin" on public.universities;
create policy "universities_update_admin" on public.universities for update using (public.is_admin()) with check (public.is_admin());
-- No delete policy: deactivate rather than delete when linked (admins deactivate via update)

-- Audit university changes
create or replace function public.audit_university_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'university_changed', new.id::text,
    jsonb_build_object('name', new.name, 'type', new.type, 'state', new.state,
      'verification', new.verification_status, 'active', new.active));
  return new;
end;
$$;
drop trigger if exists trg_audit_university on public.universities;
create trigger trg_audit_university after insert or update on public.universities
  for each row execute function public.audit_university_change();

-- Secure counts: members see ONBOARDED per university; admins see approved+onboarded.
-- Returns aggregates only, never individual rows.
create or replace function public.university_member_counts()
returns table (university_id uuid, university_name text, approved_count bigint, onboarded_count bigint)
language sql security definer set search_path = public stable as $$
  select u.id, u.name,
    count(a.id) filter (where a.application_status = 'Approved') as approved_count,
    count(a.id) filter (where a.application_status = 'Approved' and a.onboarding_confirmed_at is not null) as onboarded_count
  from public.universities u
  left join public.applications a on a.university_id = u.id
  group by u.id, u.name
  order by u.name;
$$;

-- Reports (admin only): applications by university, growth per month, represented counts
create or replace function public.report_summary(p_from timestamptz, p_to timestamptz)
returns table (
  total_applications bigint, pending_count bigint, approved_count bigint, rejected_count bigint,
  universities_represented bigint, states_represented bigint
)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_admin() then raise exception 'Not an administrator'; end if;
  return query
  select
    count(*) filter (where submitted_at >= p_from and submitted_at <= p_to),
    count(*) filter (where submitted_at >= p_from and submitted_at <= p_to and application_status = 'Pending'),
    count(*) filter (where submitted_at >= p_from and submitted_at <= p_to and application_status = 'Approved'),
    count(*) filter (where submitted_at >= p_from and submitted_at <= p_to and application_status = 'Rejected'),
    count(distinct university_id) filter (where university_id is not null and submitted_at >= p_from and submitted_at <= p_to),
    count(distinct state) filter (where submitted_at >= p_from and submitted_at <= p_to)
  from public.applications;
end;
$$;

create or replace function public.report_by_university()
returns table (university_name text, total bigint, pending bigint, approved bigint, rejected bigint, onboarded bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_admin() then raise exception 'Not an administrator'; end if;
  return query
  select coalesce(u.name, 'Unmatched (' || a.university || ')') as university_name,
    count(*) as total,
    count(*) filter (where a.application_status = 'Pending'),
    count(*) filter (where a.application_status = 'Approved'),
    count(*) filter (where a.application_status = 'Rejected'),
    count(*) filter (where a.application_status = 'Approved' and a.onboarding_confirmed_at is not null)
  from public.applications a
  left join public.universities u on u.id = a.university_id
  group by u.name, a.university
  order by total desc;
end;
$$;

create or replace function public.report_growth(p_from timestamptz, p_to timestamptz)
returns table (period_start date, applications bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_admin() then raise exception 'Not an administrator'; end if;
  return query
  select date_trunc('month', submitted_at)::date as period_start, count(*) as applications
  from public.applications
  where submitted_at >= p_from and submitted_at <= p_to
  group by 1 order by 1;
end;
$$;
