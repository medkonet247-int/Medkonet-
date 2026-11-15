// Shared helpers for MedKonet Edge Functions (Deno).
// Uses service-role key ONLY here on the server — never in browser code.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function isDevelopmentMode(): boolean {
  const v = (Deno.env.get('DEVELOPMENT_MODE') ?? '').trim().toLowerCase();
  // Missing, empty or invalid means OFF. Only explicit ON values turn it on.
  return v === 'on' || v === 'true' || v === '1' || v === 'yes';
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateCode(): string {
  const n = Math.floor(Math.random() * 10000);
  return String(n).padStart(4, '0');
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function normalizeEmail(email: string): string {
  return (email ?? '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Normalise WhatsApp numbers to international format without '+'.
 * Accepts 0803..., +234803..., 234803..., 803... and international formats.
 * Returns null if invalid.
 */
export function normalizeWhatsApp(raw: string): string | null {
  if (!raw) return null;
  let v = raw.trim().replace(/[\s\-().]/g, '');
  if (!v) return null;
  if (v.startsWith('+')) v = v.slice(1);
  if (!/^\d+$/.test(v)) return null;
  // Nigerian local: 0803... -> 234803...
  if (v.startsWith('0')) {
    v = '234' + v.slice(1);
  } else if (/^234\d{10}$/.test(v)) {
    // already international Nigeria
  } else if (/^\d{10}$/.test(v)) {
    // 803... without leading 0 -> assume Nigeria
    v = '234' + v;
  } else if (/^\d{7,15}$/.test(v)) {
    // other international formats: keep as-is
  } else {
    return null;
  }
  if (!/^\d{7,15}$/.test(v)) return null;
  return v;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() ?? '';
  return ip || req.headers.get('cf-connecting-ip') || 'unknown';
}

export async function hashIp(ip: string): Promise<string> {
  const h = await sha256Hex(ip);
  return h.slice(0, 32);
}

export function getSiteUrl(req: Request): string {
  const fromEnv = (Deno.env.get('SITE_URL') ?? Deno.env.get('APP_URL') ?? '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const origin = req.headers.get('origin') ?? '';
  if (origin) return origin.replace(/\/$/, '');
  return 'http://localhost:5173';
}

export const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
  'Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
  'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara','FCT Abuja',
];
