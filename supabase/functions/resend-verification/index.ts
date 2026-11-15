import { corsHeaders, json, isDevelopmentMode, sha256Hex, generateCode, generateToken, normalizeEmail, isValidEmail, getClientIp, hashIp, getSiteUrl } from '../_shared/helpers.ts';
import { sendEmail, verificationEmailHtml } from '../_shared/email.ts';
import { getAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const email = normalizeEmail(String(body.email ?? ''));
  if (!isValidEmail(email)) return json({ error: 'Enter a valid email address.' }, 400);

  const supabase = getAdminClient();
  const devMode = isDevelopmentMode();
  const ipHash = await hashIp(getClientIp(req));
  const siteUrl = getSiteUrl(req);
  const nowMs = Date.now();

  // Generic response helper (never reveal whether the address exists).
  const generic = (extra: Record<string, unknown> = {}) =>
    json({ status: 'ok', email, ...extra });

  const { data: profile } = await supabase.from('profiles')
    .select('id,email_verified').eq('email', email).maybeSingle();
  if (!profile) return generic();
  if (profile.email_verified) return generic({ alreadyVerified: true });

  // Rate limits: cooldown 60s, hourly cap 5 per email, hourly cap 10 per IP.
  const { data: recent } = await supabase.from('verification_codes')
    .select('created_at,ip_hash').eq('email', email)
    .order('created_at', { ascending: false }).limit(10);
  const rows = (recent ?? []) as Array<{ created_at: string; ip_hash: string | null }>;
  if (rows.length && nowMs - new Date(rows[0].created_at).getTime() < 60_000) {
    return json({ status: 'rate_limited', retryAfter: 60, email });
  }
  const hourAgo = nowMs - 60 * 60 * 1000;
  const emailHour = rows.filter((r) => new Date(r.created_at).getTime() > hourAgo).length;
  if (emailHour >= 5) return json({ status: 'rate_limited', retryAfter: 3600, email });

  const { data: ipRecent } = await supabase.from('verification_codes')
    .select('created_at').eq('ip_hash', ipHash)
    .order('created_at', { ascending: false }).limit(15);
  const ipHour = ((ipRecent ?? []) as Array<{ created_at: string }>)
    .filter((r) => new Date(r.created_at).getTime() > hourAgo).length;
  if (ipHour >= 10) return json({ status: 'rate_limited', retryAfter: 3600, email });

  // New code invalidates older ones.
  await supabase.from('verification_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', profile.id).is('used_at', null);

  const code = generateCode();
  const token = generateToken();
  const codeHash = await sha256Hex(code);
  const tokenHash = await sha256Hex(token);
  await supabase.from('verification_codes').insert({
    user_id: profile.id, email, code_hash: codeHash, token_hash: tokenHash,
    expires_at: new Date(nowMs + 10 * 60 * 1000).toISOString(), ip_hash: ipHash,
  });

  const verifyLink = `${siteUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const mail = verificationEmailHtml(code, verifyLink);
  const result = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });

  return generic({
    emailConfigured: result.configured, emailSent: result.sent,
    ...(devMode ? { devCode: code } : {}),
  });
});
