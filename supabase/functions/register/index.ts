import { corsHeaders, json, isDevelopmentMode, sha256Hex, generateCode, generateToken, normalizeEmail, isValidEmail, normalizeWhatsApp, getClientIp, hashIp, getSiteUrl, NIGERIAN_STATES } from '../_shared/helpers.ts';
import { sendEmail, verificationEmailHtml } from '../_shared/email.ts';
import { getAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const fullName = String(body.fullName ?? '').trim();
  const email = normalizeEmail(String(body.email ?? ''));
  const password = String(body.password ?? '');
  const whatsappRaw = String(body.whatsappNumber ?? '');
  const university = String(body.university ?? '').trim();
  const universityType = String(body.universityType ?? '').trim();
  const state = String(body.state ?? '').trim();
  const course = String(body.course ?? '').trim();
  const currentLevel = String(body.currentLevel ?? '').trim();
  const reason = String(body.reasonForJoining ?? '').trim();

  // ---- Server-side validation (mirror of client) ----
  const errors: Record<string, string> = {};
  if (!fullName) errors.fullName = 'Full name is required.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  const whatsapp = normalizeWhatsApp(whatsappRaw);
  if (!whatsapp) errors.whatsappNumber = 'Enter a valid WhatsApp number (e.g. 0803..., +234803...).';
  if (!university) errors.university = 'University is required.';
  if (!['Federal', 'State', 'Private'].includes(universityType)) errors.universityType = 'Select a university type.';
  if (!NIGERIAN_STATES.includes(state)) errors.state = 'Select your state.';
  if (!course) errors.course = 'Course is required.';
  if (!currentLevel) errors.currentLevel = 'Current academic level is required.';
  if (reason.length < 20) errors.reasonForJoining = 'Please tell us a little more (at least 20 characters).';
  if (Object.keys(errors).length) return json({ error: 'Please fix the highlighted fields.', errors }, 400);

  const supabase = getAdminClient();

  // Registration open/closed switch (server-enforced).
  const { data: regSetting } = await supabase.from('settings').select('value').eq('key', 'registration_open').maybeSingle();
  if (regSetting && String(regSetting.value).trim() === 'false') {
    return json({ error: 'Registration is currently closed. Please contact the MedKonet team via the Contact page.' }, 403);
  }

  const devMode = isDevelopmentMode();
  const ipHash = await hashIp(getClientIp(req));
  const siteUrl = getSiteUrl(req);

  // ---- Existing account handling (reveal nothing else) ----
  const { data: existingProfile } = await supabase
    .from('profiles').select('id,email_verified').eq('email', email).maybeSingle();

  if (existingProfile) {
    if (existingProfile.email_verified) {
      return json({ status: 'already_verified', email });
    }
    // Unverified: resend a fresh code (invalidates older ones).
    const code = generateCode();
    const token = generateToken();
    const codeHash = await sha256Hex(code);
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await supabase.from('verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', existingProfile.id).is('used_at', null);
    await supabase.from('verification_codes').insert({
      user_id: existingProfile.id, email, code_hash: codeHash, token_hash: tokenHash,
      expires_at: expiresAt, ip_hash: ipHash,
    });
    const verifyLink = `${siteUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    const mail = verificationEmailHtml(code, verifyLink);
    const result = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
    return json({
      status: 'resend_sent', email,
      emailConfigured: result.configured, emailSent: result.sent,
      ...(devMode ? { devCode: code } : {}),
    });
  }

  // ---- Create account atomically (rollback on failure) ----
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !created?.user) {
    // Duplicate race: treat as already exists generically.
    const msg = String(createErr?.message ?? '');
    if (/already|exists|duplicate/i.test(msg)) {
      return json({ status: 'already_verified', email });
    }
    return json({ error: 'We could not create your account. Please try again shortly.' }, 500);
  }
  const userId = created.user.id;

  const rollback = async () => {
    try { await supabase.auth.admin.deleteUser(userId); } catch { /* ignore */ }
  };

  const { error: profileErr } = await supabase.from('profiles').insert({
    id: userId, email, full_name: fullName, email_verified: false,
  });
  if (profileErr) { await rollback(); return json({ error: 'We could not create your account. Please try again shortly.' }, 500); }

  // Pending application created once only (unique constraint on user_id/email).
  const { error: appErr } = await supabase.from('applications').insert({
    user_id: userId, full_name: fullName, email, whatsapp_number: whatsapp!,
    university, university_type: universityType, state, course,
    current_level: currentLevel, reason_for_joining: reason,
    application_status: 'Pending',
  });
  if (appErr) { await rollback(); return json({ error: 'We could not create your account. Please try again shortly.' }, 500); }

  // Verification code + link token (hashed, 10-minute expiry).
  const code = generateCode();
  const token = generateToken();
  const codeHash = await sha256Hex(code);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: codeErr } = await supabase.from('verification_codes').insert({
    user_id: userId, email, code_hash: codeHash, token_hash: tokenHash,
    expires_at: expiresAt, ip_hash: ipHash,
  });
  if (codeErr) { await rollback(); return json({ error: 'We could not create your account. Please try again shortly.' }, 500); }

  // Send email — account is NEVER lost if sending fails.
  const verifyLink = `${siteUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const mail = verificationEmailHtml(code, verifyLink);
  const result = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });

  return json({
    status: 'created', email,
    emailConfigured: result.configured, emailSent: result.sent,
    ...(devMode ? { devCode: code } : {}),
  });
});
