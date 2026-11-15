# MedKonet Nigeria — Phase A

Public website, registration, email verification, login, student dashboard, administrator approvals and image manager.

**Tagline:** Connecting Medical Minds, Building Better Futures. **Statement:** Different Universities. One Medical Family.

## Stack

React + TypeScript + Vite + Tailwind (SPA, deploys on Vercel) + Supabase (database, auth, storage, Edge Functions). Email via Brevo through a single replaceable module in the Edge Functions.

## Quick start (local)

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

## Setup checklist (owner)

1. Create the Supabase project.
2. Run SQL migrations in order (`supabase/migrations/001` → `005`) in the Supabase SQL Editor.
3. Add the two Vercel variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy the Edge Functions (see `supabase/functions/README.md`).
5. Save Edge Function secrets: `EMAIL_PROVIDER_API_KEY` (or `BREVO_API_KEY`), `EMAIL_FROM` (or `BREVO_SENDER_EMAIL`), `SITE_URL`.
6. Verify the Brevo sender.
7. Confirm `DEVELOPMENT_MODE` is OFF (missing/empty/invalid = OFF; stored as an Edge Function secret, never in the browser).
8. Add your logo by replacing the placeholder in `src/components/Logo.tsx` (single component — updates header, footer, login and join).
9. In Supabase Auth, turn OFF "Confirm email" so Supabase's own confirmation email is not used (see Edge Functions README).
10. Set the official WhatsApp invite link in Admin Dashboard → Settings (never invent a link; the button stays disabled until set).

## Structure

- `src/pages/` — Home, About, Contact, Join, Login, Verify Email, Forgot/Reset Password, Community, Resources, Mentorship, Events, Student Dashboard, Admin Dashboard, Media, Community Rules, Privacy Notice.
- `src/components/` — Logo (single placeholder), Header, Footer, ImageSlot + generated SVG artwork, route guards, shared UI.
- `supabase/migrations/` — ordered SQL (tables, RLS, functions/triggers, storage bucket, seed).
- `supabase/functions/` — `register`, `verify-email`, `resend-verification`, `forgot-password`, `reset-password` + `_shared/email.ts` (Brevo module).

## Security notes

- RLS on every table; route guards are UX only.
- First administrator `bionicz115@gmail.com` is enforced only by `admin_allowlist`, never by a form field or frontend check. Roles live in `user_roles`.
- Verification codes/tokens are stored hashed, expire in 10 minutes, max 5 attempts, single use; a new code invalidates older ones.
- Emails/WhatsApp numbers are never shown publicly or to other students. All user text is rendered as plain text.
