import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

interface Application {
  id: string; full_name: string; email: string; whatsapp_number: string;
  university: string; university_type: string; state: string; course: string; current_level: string;
  application_status: 'Pending' | 'Approved' | 'Rejected';
  invited_at: string | null; onboarding_confirmed_at: string | null; submitted_at: string;
}

export function AdminMembers() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [group, setGroup] = useState<'Applicants' | 'Approved' | 'Onboarded'>('Applicants');
  const [confirmOnboard, setConfirmOnboard] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('applications')
      .select('id,full_name,email,whatsapp_number,university,university_type,state,course,current_level,application_status,invited_at,onboarding_confirmed_at,submitted_at')
      .order('submitted_at', { ascending: false });
    if (err) { setError('We could not load members.'); setLoading(false); return; }
    setApps((data ?? []) as Application[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const applicants = apps.filter((a) => a.application_status === 'Pending' || a.application_status === 'Rejected');
  const approved = apps.filter((a) => a.application_status === 'Approved' && !a.onboarding_confirmed_at);
  const onboarded = apps.filter((a) => a.application_status === 'Approved' && a.onboarding_confirmed_at);
  const current = group === 'Applicants' ? applicants : group === 'Approved' ? approved : onboarded;

  async function confirmOnboarding(app: Application) {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('applications').update({
      onboarding_confirmed_at: new Date().toISOString(),
      onboarding_confirmed_by: session.session?.user.id ?? null,
    }).eq('id', app.id);
    setSaving(false);
    if (err) { setError('We could not confirm onboarding.'); return; }
    setConfirmOnboard(null);
    await load();
  }

  if (loading) return <PageShell><Spinner label="Loading members…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Member Management" intro="Three groups with real counts. Onboarding is confirmed manually — approval or invitation alone never means a student joined WhatsApp." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: 'Applicants', label: 'Applicants', count: applicants.length },
          { key: 'Approved', label: 'Approved', count: approved.length },
          { key: 'Onboarded', label: 'Onboarded members', count: onboarded.length },
        ] as const).map((g) => (
          <button key={g.key} onClick={() => setGroup(g.key)} aria-pressed={group === g.key}
            className={`min-h-[44px] rounded-xl border p-3 text-center ${group === g.key ? 'border-royal bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <span className="block text-2xl font-extrabold text-navy">{g.count}</span>
            <span className="block text-sm font-medium text-slate-600">{g.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {current.length === 0 && <EmptyState title="No members in this group" message="Members will appear here as applications progress." />}
        {current.map((app) => (
          <Card key={app.id}>
            <p className="font-bold text-navy">{app.full_name}</p>
            <p className="text-sm text-slate-600 break-all">{app.email}</p>
            <p className="mt-1 text-sm text-slate-500">{app.university} · {app.state} · {app.course} · {app.current_level}</p>
            <p className="mt-1 text-sm text-slate-500">
              Status: {app.application_status} · Invited: {app.invited_at ? new Date(app.invited_at).toLocaleDateString() : 'No'} · Onboarded: {app.onboarding_confirmed_at ? new Date(app.onboarding_confirmed_at).toLocaleDateString() : 'No'}
            </p>
            {group === 'Approved' && (
              <button onClick={() => setConfirmOnboard(app)} className={`${btnPrimary} mt-3`}>Confirm onboarding</button>
            )}
          </Card>
        ))}
      </div>
      {confirmOnboard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-label="Confirm onboarding">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-lg font-extrabold text-navy">Confirm onboarding?</h2>
            <p className="mt-2 text-[15px] text-slate-600">
              Confirm that {confirmOnboard.full_name} has been onboarded. This records the timestamp and your administrator identity.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => confirmOnboarding(confirmOnboard)} disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Confirm onboarding'}</button>
              <button onClick={() => setConfirmOnboard(null)} className={btnSecondary}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
