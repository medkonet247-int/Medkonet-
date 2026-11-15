-- ============================================================
-- Migration 005: Seed first administrator allowlist + settings
-- The first administrator is enforced ONLY by admin_allowlist.
-- ============================================================

insert into public.admin_allowlist (email, granted_by)
values ('bionicz115@gmail.com', 'initial-setup')
on conflict (email) do nothing;

-- WhatsApp community invite link: intentionally EMPTY.
-- Admin sets it in Admin Dashboard > Settings. Never invent a link.
insert into public.settings (key, value)
values ('whatsapp_invite_link', '')
on conflict (key) do nothing;
