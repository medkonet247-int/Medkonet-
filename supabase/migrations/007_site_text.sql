-- ============================================================
-- Migration 007: Site Text editor table + RLS + secure update
-- ============================================================

create table if not exists public.site_text (
  key text primary key,
  page text not null,
  label text not null,
  current_value text not null,
  default_value text not null,
  previous_value text,
  visibility text not null default 'public' check (visibility in ('public','members')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create index if not exists site_text_page_idx on public.site_text (page);

alter table public.site_text enable row level security;

drop policy if exists "site_text_select" on public.site_text;
create policy "site_text_select" on public.site_text for select
  using (visibility = 'public' or public.is_approved_member() or public.is_admin());
-- Writes only via secure function (no direct insert/update/delete policies for anon/authenticated)

-- Secure update: admin only, plain-text sanitised, max length enforced, audit with old/new
create or replace function public.update_site_text(p_key text, p_value text)
returns text language plpgsql security definer set search_path = public as $$
declare v_old text; v_clean text; v_len int := 2000;
begin
  if not public.is_admin() then raise exception 'Not an administrator'; end if;
  select current_value into v_old from public.site_text where key = p_key;
  if v_old is null then raise exception 'Text key not found'; end if;
  -- Strip HTML/script tags, collapse whitespace
  v_clean := regexp_replace(coalesce(p_value, ''), '<[^>]*>', '', 'g');
  v_clean := trim(v_clean);
  if v_clean = '' then raise exception 'Text cannot be empty. Use Reset to default instead.'; end if;
  if char_length(v_clean) > v_len then raise exception 'Text is too long (max 2000 characters)'; end if;
  update public.site_text
    set previous_value = v_old, current_value = v_clean,
        updated_at = now(), updated_by = auth.uid()
    where key = p_key;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'site_text_changed', p_key,
    jsonb_build_object('key', p_key, 'old_value', v_old, 'new_value', v_clean));
  return 'ok';
end;
$$;

create or replace function public.reset_site_text(p_key text)
returns text language plpgsql security definer set search_path = public as $$
declare v_old text; v_def text;
begin
  if not public.is_admin() then raise exception 'Not an administrator'; end if;
  select current_value, default_value into v_old, v_def from public.site_text where key = p_key;
  if v_old is null then raise exception 'Text key not found'; end if;
  update public.site_text set previous_value = v_old, current_value = v_def,
    updated_at = now(), updated_by = auth.uid() where key = p_key;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'site_text_reset', p_key,
    jsonb_build_object('key', p_key, 'old_value', v_old, 'new_value', v_def));
  return 'ok';
end;
$$;
