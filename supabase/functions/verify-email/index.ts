import { corsHeaders, json, isDevelopmentMode, sha256Hex, normalizeEmail } from '../_shared/helpers.ts';
import { getAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const email = normalizeEmail(String(body.email ?? ''));
  const code = String(body.code ?? '').trim();
  const token = String(body.token ?? '').trim();
  if (!email && !token) return json({ error: 'Verification details are missing.' }, 400);
  if (!code && !token) return json({ error: 'Enter your 4-digit code.' }, 400);

  const supabase = getAdminClient();
  const now = new Date().toISOString();

  // Find the latest unused code row.
  let row: Record<string, unknown> | null = null;
  if (token) {
    const tokenHash = await sha256Hex(token);
    const { data } = await supabase.from('verification_codes')
      .select('*').eq('token_hash', tokenHash).is('used_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    row = data as Record<string, unknown> | null;
  } else {
    if (!/^\d{4}$/.test(code)) return json({ error: 'Enter the 4-digit code.', attemptsRemaining: 5 }, 400);
    const { data } = await supabase.from('verification_codes')
      .select('*').eq('email', email).is('used_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    row = data as Record<string, unknown> | null;
  }

  if (!row) {
    return json({ error: 'This code is no longer valid. Please request a new code.', attemptsRemaining: 0, expired: true }, 400);
  }

  const expiresAt = new Date(String(row.expires_at)).getTime();
  if (Date.now() > expiresAt) {
    await supabase.from('verification_codes').update({ used_at: now }).eq('id', row.id);
    return json({ error: 'This code has expired. Please request a new code.', attemptsRemaining: 0, expired: true }, 400);
  }

  const attempts = Number(row.attempts ?? 0);
  const maxAttempts = Number(row.max_attempts ?? 5);
  if (attempts >= maxAttempts) {
    await supabase.from('verification_codes').update({ used_at: now }).eq('id', row.id);
    return json({ error: 'Too many attempts. Please request a new code.', attemptsRemaining: 0 }, 400);
  }

  // Compare hashes (constant-time-ish).
  let ok = false;
  if (token) {
    ok = String(row.token_hash) === (await sha256Hex(token));
  } else {
    ok = String(row.code_hash) === (await sha256Hex(code));
  }

  if (!ok) {
    const newAttempts = attempts + 1;
    const remaining = Math.max(0, maxAttempts - newAttempts);
    if (newAttempts >= maxAttempts) {
      await supabase.from('verification_codes').update({ attempts: newAttempts, used_at: now }).eq('id', row.id);
      return json({ error: 'Too many attempts. This code is now invalid. Please request a new code.', attemptsRemaining: 0 }, 400);
    }
    await supabase.from('verification_codes').update({ attempts: newAttempts }).eq('id', row.id);
    return json({ error: 'Incorrect code. Please try again.', attemptsRemaining: remaining }, 400);
  }

  // Success: single use — mark used, verify profile, ensure application, check admin.
  await supabase.from('verification_codes').update({ used_at: now }).eq('id', row.id);
  const userId = String(row.user_id);
  const userEmail = normalizeEmail(String(row.email));

  await supabase.from('profiles').update({ email_verified: true }).eq('id', userId);
  try { await supabase.auth.admin.updateUserById(userId, { email_confirm: true }); } catch { /* ignore */ }

  // Administrator provisioning: allowlist check, NEVER while development mode is ON.
  let isAdmin = false;
  if (!isDevelopmentMode()) {
    const { data: allow } = await supabase.from('admin_allowlist')
      .select('email').eq('email', userEmail).maybeSingle();
    if (allow) {
      await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin', granted_by: userId }, { onConflict: 'user_id' });
      // Admin skips the application.
      await supabase.from('applications').delete().eq('user_id', userId);
      isAdmin = true;
    }
  }

  return json({ verified: true, isAdmin, email: userEmail });
});
