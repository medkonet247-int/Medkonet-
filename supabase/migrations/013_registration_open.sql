-- ============================================================
-- Migration 013: Public registration-open check (secure function)
-- ============================================================

create or replace function public.is_registration_open()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select value from public.settings where key = 'registration_open'), 'true') = 'true';
$$;
