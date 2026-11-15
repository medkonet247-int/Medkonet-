-- ============================================================
-- Migration 010: University representatives (restricted role)
-- ============================================================

create table if not exists public.representative_assignments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  university_id uuid not null references public.universities(id),
  status text not null default 'Awaiting registration'
    check (status in ('Awaiting registration','Awaiting approval','Active','Suspended','Revoked')),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  internal_notes text not null default '',
  show_on_directory boolean not null default false,
  consent_confirmed boolean not null default false,
  last_status_change timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists rep_email_idx on public.representative_assignments (lower(email));
create index if not exists rep_university_idx on public.representative_assignments (university_id, status);

create table if not exists public.rep_announcement_proposals (
  id uuid primary key default gen_random_uuid(),
  representative_email text not null,
  university_id uuid not null references public.universities(id),
  title text not null,
  message text not null default '',
  status text not null default 'Awaiting admin approval'
    check (status in ('Awaiting admin approval','Published','Rejected','Withdrawn')),
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_needs_reports (
  id uuid primary key default gen_random_uuid(),
  representative_email text not null,
  university_id uuid not null references public.universities(id),
  category text not null check (category in ('Resources','Events','Mentorship','Technical problem','Welfare or support','Other')),
  message text not null,
  status text not null default 'Received' check (status in ('Received','In progress','Resolved')),
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.representative_assignments enable row level security;
alter table public.rep_announcement_proposals enable row level security;
alter table public.community_needs_reports enable row level security;

-- No direct read for members/representatives (secure functions only).
-- Admins read all via policies below.
drop policy if exists "rep_assign_select_admin" on public.representative_assignments;
create policy "rep_assign_select_admin" on public.representative_assignments for select using (public.is_admin());
drop policy if exists "rep_assign_insert_admin" on public.representative_assignments;
create policy "rep_assign_insert_admin" on public.representative_assignments for insert with check (public.is_admin());
drop policy if exists "rep_assign_update_admin" on public.representative_assignments;
create policy "rep_assign_update_admin" on public.representative_assignments for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "rep_proposals_select_admin" on public.rep_announcement_proposals;
create policy "rep_proposals_select_admin" on public.rep_announcement_proposals for select using (public.is_admin());
drop policy if exists "rep_proposals_insert_admin" on public.rep_announcement_proposals;
create policy "rep_proposals_insert_admin" on public.rep_announcement_proposals for insert with check (public.is_admin());
drop policy if exists "rep_proposals_update_admin" on public.rep_announcement_proposals;
create policy "rep_proposals_update_admin" on public.rep_announcement_proposals for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "needs_select_admin" on public.community_needs_reports;
create policy "needs_select_admin" on public.community_needs_reports for select using (public.is_admin());
drop policy if exists "needs_insert_admin" on public.community_needs_reports;
create policy "needs_insert_admin" on public.community_needs_reports for insert with check (public.is_admin());
drop policy if exists "needs_update_admin" on public.community_needs_reports;
create policy "needs_update_admin" on public.community_needs_reports for update using (public.is_admin()) with check (public.is_admin());

-- Is active representative of university X (programme ON + verified + Approved + Active assignment)
create or replace function public.is_active_representative(p_university_id uuid)
returns boolean language plpgsql security definer set search_path = public stable as $$
declare v_prog text; v_email text;
begin
  select value into v_prog from public.settings where key = 'representative_programme_active';
  if coalesce(v_prog, 'false') <> 'true' then return false; end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();
  if v_email is null then return false; end if;
  -- verified email
  if not exists (select 1 from public.profiles where id = auth.uid() and email_verified = true) then return false; end if;
  -- approved application
  if not exists (select 1 from public.applications where user_id = auth.uid() and application_status = 'Approved') then return false; end if;
  -- active assignment for this university
  return exists (
    select 1 from public.representative_assignments
    where lower(email) = v_email and university_id = p_university_id and status = 'Active'
  );
end;
$$;

-- My representative university (null if not active representative)
create or replace function public.my_representative_university()
returns uuid language plpgsql security definer set search_path = public stable as $$
declare v_prog text; v_email text; v_uni uuid;
begin
  select value into v_prog from public.settings where key = 'representative_programme_active';
  if coalesce(v_prog, 'false') <> 'true' then return null; end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();
  if v_email is null then return null; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and email_verified = true) then return null; end if;
  if not exists (select 1 from public.applications where user_id = auth.uid() and application_status = 'Approved') then return null; end if;
  select university_id into v_uni from public.representative_assignments
    where lower(email) = v_email and status = 'Active' limit 1;
  return v_uni;
end;
$$;

-- Members to welcome: ONLY full name, course, current level, onboarding status. Rep's own university only.
create or replace function public.get_members_to_welcome()
returns table (full_name text, course text, current_level text, onboarding_confirmed boolean)
language plpgsql security definer set search_path = public stable as $$
declare v_uni uuid := public.my_representative_university();
begin
  if v_uni is null then return; end if;
  return query
  select a.full_name, a.course, a.current_level, (a.onboarding_confirmed_at is not null) as onboarding_confirmed
  from public.applications a
  where a.university_id = v_uni and a.application_status = 'Approved'
  order by a.full_name;
end;
$$;

-- Representative proposals: own only (secure function)
create or replace function public.my_rep_proposals()
returns table (id uuid, title text, message text, status text, internal_note text, created_at timestamptz)
language plpgsql security definer set search_path = public stable as $$
declare v_uni uuid := public.my_representative_university(); v_email text;
begin
  if v_uni is null then return; end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();
  return query select p.id, p.title, p.message, p.status, p.internal_note, p.created_at
    from public.rep_announcement_proposals p
    where p.university_id = v_uni and lower(p.representative_email) = v_email
    order by p.created_at desc;
end;
$$;

create or replace function public.submit_rep_proposal(p_title text, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uni uuid := public.my_representative_university(); v_email text; v_id uuid;
begin
  if v_uni is null then raise exception 'Not an active representative'; end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();
  if trim(coalesce(p_title, '')) = '' then raise exception 'Title is required'; end if;
  if char_length(p_title) > 200 or char_length(p_message) > 2000 then raise exception 'Text too long'; end if;
  insert into public.rep_announcement_proposals (representative_email, university_id, title, message)
  values (v_email, v_uni, trim(p_title), trim(p_message)) returning id into v_id;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'rep_proposal_submitted', v_id::text, jsonb_build_object('title', p_title));
  return v_id;
end;
$$;

create or replace function public.withdraw_rep_proposal(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_uni uuid := public.my_representative_university(); v_email text;
begin
  if v_uni is null then raise exception 'Not an active representative'; end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();
  update public.rep_announcement_proposals set status = 'Withdrawn', updated_at = now()
    where id = p_id and university_id = v_uni and lower(representative_email) = v_email
      and status = 'Awaiting admin approval';
  return 'ok';
end;
$$;

-- Community needs: own only
create or replace function public.my_needs_reports()
returns table (id uuid, category text, message text, status text, created_at timestamptz)
language plpgsql security definer set search_path = public stable as $$
declare v_uni uuid := public.my_representative_university(); v_email text;
begin
  if v_uni is null then return; end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();
  return query select r.id, r.category, r.message, r.status, r.created_at
    from public.community_needs_reports r
    where r.university_id = v_uni and lower(r.representative_email) = v_email
    order by r.created_at desc;
end;
$$;

create or replace function public.submit_needs_report(p_category text, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uni uuid := public.my_representative_university(); v_email text; v_id uuid;
begin
  if v_uni is null then raise exception 'Not an active representative'; end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();
  if p_category not in ('Resources','Events','Mentorship','Technical problem','Welfare or support','Other') then
    raise exception 'Invalid category'; end if;
  if trim(coalesce(p_message, '')) = '' then raise exception 'Message is required'; end if;
  if char_length(p_message) > 1000 then raise exception 'Message too long (max 1000 characters)'; end if;
  insert into public.community_needs_reports (representative_email, university_id, category, message)
  values (v_email, v_uni, p_category, trim(p_message)) returning id into v_id;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'needs_report_submitted', v_id::text, jsonb_build_object('category', p_category));
  return v_id;
end;
$$;

-- Public representatives list: only if show_on_directory + consent + Active + programme ON
create or replace function public.list_public_representatives()
returns table (full_name text, university_name text)
language plpgsql security definer set search_path = public stable as $$
declare v_prog text;
begin
  select value into v_prog from public.settings where key = 'representative_programme_active';
  if coalesce(v_prog, 'false') <> 'true' then return; end if;
  if not public.is_approved_member() then return; end if;
  return query
  select p.full_name, u.name
  from public.representative_assignments r
  join public.universities u on u.id = r.university_id
  join public.profiles p on lower(p.email) = lower(r.email)
  where r.status = 'Active' and r.show_on_directory = true and r.consent_confirmed = true
    and u.active = true and u.verification_status = 'Verified'
  order by p.full_name;
end;
$$;

-- Audit representative changes
create or replace function public.audit_rep_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'representative_changed', new.id::text,
    jsonb_build_object('email', new.email, 'status', new.status, 'university_id', new.university_id));
  return new;
end;
$$;
drop trigger if exists trg_audit_rep on public.representative_assignments;
create trigger trg_audit_rep after insert or update on public.representative_assignments
  for each row execute function public.audit_rep_change();
