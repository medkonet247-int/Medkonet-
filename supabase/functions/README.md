# MedKonet Edge Functions — Deployment Guide

Deploy each function separately. All functions share `_shared/` (email provider module, helpers, admin client).

## Functions

| Function | Purpose |
|---|---|
| `register` | Validates application server-side, creates auth user + profile + Pending application atomically, generates hashed 4-digit code + link token (10-min expiry), sends Brevo email. |
| `verify-email` | Verifies by 4-digit code OR link token. Enforces 5-attempt limit, expiry, single use. On success marks email verified and checks `admin_allowlist` (never in development mode). |
| `resend-verification` | Resends a fresh code (invalidates older ones). Cooldown 60s, hourly cap 5/email, 10/IP. Generic responses. |
| `forgot-password` | Sends password-reset link via the same Brevo module. Always generic. |
| `reset-password` | Sets a new password from a hashed, single-use, 30-min token. |

## How to deploy (Supabase CLI)

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy register
supabase functions deploy verify-email
supabase functions deploy resend-verification
supabase functions deploy forgot-password
supabase functions deploy reset-password
```

Or deploy from the Supabase Dashboard: Edge Functions → New function → paste the `index.ts` (and `_shared` files).

## Secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | Yes (auto) | Provided by Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (auto) | Server-only. Never expose in browser code. |
| `EMAIL_PROVIDER_API_KEY` | For email | Brevo API key. Also accepts `BREVO_API_KEY`. |
| `EMAIL_FROM` | For email | Sender as `Name <address>` or just an address. Also accepts `BREVO_SENDER_EMAIL`. Verify this sender in Brevo first. |
| `SITE_URL` | Recommended | Public site URL, e.g. `https://your-domain.vercel.app` (used in email links). Falls back to request origin. |
| `DEVELOPMENT_MODE` | Optional, OFF by default | **Where it is stored:** as an Edge Function secret in Supabase (Dashboard → Edge Functions → Secrets), never in the browser or `VITE_*` variables. **How to turn it OFF:** set it to `off` (or delete it / leave empty). Missing, empty or invalid means OFF. While ON, the 4-digit code is shown on screen and administrator promotion is blocked. Never leave it ON in production. |

If `EMAIL_PROVIDER_API_KEY` or `EMAIL_FROM` is missing, the app still runs and the verification screen says "Email delivery is not configured yet." If Brevo rejects a request, the real HTTP status is logged server-side (never the key) and students see only: "We couldn't send the email right now. Please try again shortly." An email counts as sent only when Brevo returns success with a message id.

## Supabase Auth setting to change (disable Supabase's own confirmation email)

MedKonet uses its own verification (Edge Functions + Brevo). Supabase's confirmation email must NOT be used:

1. Supabase Dashboard → Authentication → Providers → Email → turn **OFF** "Confirm email" (so users are not blocked by Supabase confirmation and no Supabase email is sent).
2. Authentication → Email Templates → you may leave templates unused; no Supabase emails will be sent for signup because confirmation is off and all verification/reset emails go through the Edge Functions above.
3. Users are created by the `register` function with `email_confirm: true` via the admin API, and MedKonet's own `profiles.email_verified` flag controls access.

## Database

Run migrations in order in the Supabase SQL Editor: `supabase/migrations/001` → `002` → `003` → `004` → `005`.
