// Single replaceable email-provider module (Brevo).
// To replace the provider, rewrite ONLY this file.
// Secrets (Edge Function secrets, never in browser):
//   EMAIL_PROVIDER_API_KEY (also accepts BREVO_API_KEY)
//   EMAIL_FROM (also accepts BREVO_SENDER_EMAIL) — "Name <address>" or just address

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  configured: boolean;
  sent: boolean;
  status?: number;
  messageId?: string;
  error?: string;
}

function parseSender(raw: string): { email: string; name?: string } {
  const m = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim() || undefined, email: m[2].trim() };
  return { email: raw.trim() };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = (Deno.env.get('EMAIL_PROVIDER_API_KEY') ?? Deno.env.get('BREVO_API_KEY') ?? '').trim();
  const fromRaw = (Deno.env.get('EMAIL_FROM') ?? Deno.env.get('BREVO_SENDER_EMAIL') ?? '').trim();
  if (!apiKey || !fromRaw) {
    return { configured: false, sent: false };
  }
  const sender = parseSender(fromRaw);
  if (!sender.email) return { configured: false, sent: false };

  const payload: Record<string, unknown> = {
    sender: sender.name ? { name: sender.name, email: sender.email } : { email: sender.email },
    to: [{ email: input.to }],
    subject: input.subject,
    htmlContent: input.html,
  };
  if (input.text) payload.textContent = input.text;

  let res: Response;
  try {
    res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Log server-side only; never log the key.
    console.error('Email provider network error', String(e));
    return { configured: true, sent: false, error: 'network_error' };
  }

  const status = res.status;
  let body: Record<string, unknown> = {};
  try { body = await res.json(); } catch { /* ignore */ }

  // Treat as sent ONLY when Brevo returns success with a message id.
  const messageId = (body.messageId ?? body.message_id ?? '') as string;
  if ((status === 200 || status === 201) && messageId) {
    return { configured: true, sent: true, status, messageId };
  }
  // Log the real HTTP status on the server (never the key).
  console.error('Email provider rejected request', { status, body: JSON.stringify(body).slice(0, 500) });
  return { configured: true, sent: false, status, error: 'provider_rejected' };
}

export function verificationEmailHtml(code: string, verifyLink: string): { subject: string; html: string; text: string } {
  const subject = 'Your MedKonet verification code';
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0B1F3A">
    <h1 style="font-size:22px;margin:0 0 8px">Verify your MedKonet email</h1>
    <p>Welcome to MedKonet Nigeria — Connecting Medical Minds, Building Better Futures.</p>
    <p>Your 4-digit verification code is:</p>
    <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:12px 0">${code}</p>
    <p>It expires in 10 minutes. Enter it on the Verify Email page, or use this link (works on any device):</p>
    <p><a href="${verifyLink}" style="color:#1D4ED8">Verify my email</a></p>
    <p style="color:#64748B;font-size:13px">If you did not request this, ignore this email.</p>
  </div>`;
  const text = `Your MedKonet verification code is ${code}. It expires in 10 minutes. Verify here: ${verifyLink}`;
  return { subject, html, text };
}

export function passwordResetEmailHtml(resetLink: string): { subject: string; html: string; text: string } {
  const subject = 'Reset your MedKonet password';
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0B1F3A">
    <h1 style="font-size:22px;margin:0 0 8px">Reset your password</h1>
    <p>Use this link to set a new MedKonet password. It expires in 30 minutes and can be used once.</p>
    <p><a href="${resetLink}" style="color:#1D4ED8">Set a new password</a></p>
    <p style="color:#64748B;font-size:13px">If you did not request this, ignore this email. Your password has not changed.</p>
  </div>`;
  const text = `Reset your MedKonet password here: ${resetLink}`;
  return { subject, html, text };
}
