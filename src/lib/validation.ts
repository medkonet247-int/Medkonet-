export const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
  'Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
  'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara','FCT Abuja',
];

export const UNIVERSITY_TYPES = ['Federal', 'State', 'Private'] as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Normalise to international format without '+'. Returns null if invalid. */
export function normalizeWhatsApp(raw: string): string | null {
  if (!raw) return null;
  let v = raw.trim().replace(/[\s\-().]/g, '');
  if (!v) return null;
  if (v.startsWith('+')) v = v.slice(1);
  if (!/^\d+$/.test(v)) return null;
  if (v.startsWith('0')) v = '234' + v.slice(1);
  else if (/^234\d{10}$/.test(v)) { /* ok */ }
  else if (/^\d{10}$/.test(v)) v = '234' + v;
  else if (/^\d{7,15}$/.test(v)) { /* international */ }
  else return null;
  if (!/^\d{7,15}$/.test(v)) return null;
  return v;
}

export function passwordStrength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  return { score: s, label: labels[s] ?? 'Weak' };
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, user.length - 2))}@${domain}`;
}
