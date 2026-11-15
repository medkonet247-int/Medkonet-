import { corsHeaders, json, sha256Hex } from '../_shared/helpers.ts';
import { getAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const token = String(body.token ?? '').trim();
  const newPassword = String(body.newPassword ?? '');
  if (!token) return json({ error: 'Reset link is invalid.' }, 400);
  if (newPassword.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400);

  const supabase = getAdminClient();
  const tokenHash = await sha256Hex(token);
  const { data: row } = await supabase.from('password_resets')
    .select('*').eq('token_hash', tokenHash).is('used_at', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!row) return json({ error: 'This reset link is invalid or has already been used.' }, 400);
  if (Date.now() > new Date(String(row.expires_at)).getTime()) {
    return json({ error: 'This reset link has expired. Please request a new one.' }, 400);
  }

  const { error } = await supabase.auth.admin.updateUserById(String(row.user_id), { password: newPassword });
  if (error) return json({ error: 'We could not reset your password. Please try again shortly.' }, 500);

  await supabase.from('password_resets').update({ used_at: new Date().toISOString() }).eq('id', row.id);
  return json({ status: 'ok' });
});
