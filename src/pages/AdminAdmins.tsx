import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

interface AdminRow { email: string; granted_by: string; created_at: string; }

export function AdminAdmins() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    // Admins read allowlist via service? RLS denies direct read. Use audit? Instead query user_roles join profiles.
    // Fallback: list user_roles admins + profiles.
    const { data: roles, error: err } = await supabase.from('user_roles').select('user_id,granted_at').eq('role', 'admin');
    if (err) { setError('We could not load administrators.'); setLoading(false); return; }
    const rows: AdminRow[] = [];
    for (const r of roles ?? []) {
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', r.user_id).maybeSingle();
      rows.push({ email: prof?.email ?? r.user_id, granted_by: '', created_at: r.granted_at });
    }
    setAdmins(rows);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function grant() {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setError('Enter a valid email address.'); return; }
    setSaving(true);
    setError('');
    setNotice('');
    const { error: err } = await supabase.rpc('grant_admin_by_email', { p_email: v });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEmail('');
    setNotice(`${v} has been allowlisted. They become administrator only after verifying that email.`);
    await load();
  }

  async function revoke(v: string) {
    setSaving(true);
    setError('');
    const { error: err } = await supabase.rpc('revoke_admin_by_email', { p_email: v });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setConfirmRevoke(null);
    setNotice(`${v} has been revoked.`);
    await load();
  }

  if (loading) return <PageShell><Spinner label="Loading administrators…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Administrator Management" intro="Grant by email through a secure server function. The person becomes administrator only after verifying that email. The first administrator can never be removed." />
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}
      <Card>
        <h2 className="font-bold text-navy">Grant administrator access</h2>
        <label htmlFor="grantEmail" className={labelCls}>Email to allowlist</label>
        <input id="grantEmail" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="person@example.com" />
        <button onClick={grant} disabled={saving} className={`${btnPrimary} mt-3`}>{saving ? 'Granting…' : 'Grant access'}</button>
      </Card>
      <div className="mt-6 space-y-3">
        {admins.length === 0 && <EmptyState title="No administrators listed" message="Administrators appear here after verifying an allowlisted email." />}
        {admins.map((a) => (
          <Card key={a.email}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-navy break-all">{a.email}</p>
                <p className="text-sm text-slate-500">Granted {new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              {a.email.toLowerCase() === 'bionicz115@gmail.com' ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">First administrator (protected)</span>
              ) : confirmRevoke === a.email ? (
                <div className="flex gap-2">
                  <button onClick={() => revoke(a.email)} disabled={saving} className={btnPrimary}>Confirm revoke</button>
                  <button onClick={() => setConfirmRevoke(null)} className={btnSecondary}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmRevoke(a.email)} className={btnSecondary}>Revoke access</button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
