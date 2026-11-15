import { corsHeaders, json, sha256Hex, generateToken, normalizeEmail, isValidEmail, getSiteUrl } from '../_shared/helpers.ts';
import { sendEmail, passwordResetEmailHtml } from '../_shared/email.ts';
import { getAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const email = normalizeEmail(String(body.email ?? ''));
  if (!isValidEmail(email)) return json({ error: 'Enter a valid email address.' }, 400);

  const supabase = getAdminClient();
  const siteUrl = getSiteUrl(req);

  // Always generic — never reveal whether the address exists.
  const { data: profile } = await supabase.from('profiles')
    .select('id').eq('email', email).maybeSingle();
  if (!profile) return json({ status: 'ok', email });

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  await supabase.from('password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', profile.id).is('used_at', null);
  await supabase.from('password_resets').insert({
    user_id: profile.id, email, token_hash: tokenHash,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });

  const resetLink = `${siteUrl}/reset-password?token=${token}`;
  const mail = passwordResetEmailHtml(resetLink);
  const result = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });

  return json({ status: 'ok', email, emailConfigured: result.configured, emailSent: result.sent });
});
