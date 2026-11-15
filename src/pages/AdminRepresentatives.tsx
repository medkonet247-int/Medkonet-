import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

interface Assignment {
  id: string; email: string; university_id: string; status: string;
  granted_by: string | null; granted_at: string; internal_notes: string;
  show_on_directory: boolean; consent_confirmed: boolean; last_status_change: string;
}
interface Uni { id: string; name: string; }
interface Proposal { id: string; representative_email: string; university_id: string; title: string; message: string; status: string; internal_note: string; created_at: string; }
interface Need { id: string; representative_email: string; university_id: string; category: string; message: string; status: string; internal_note: string; created_at: string; }

export function AdminRepresentatives() {
  const [rows, setRows] = useState<Assignment[]>([]);
  const [unis, setUnis] = useState<Uni[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [uniId, setUniId] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const [a, u, p, n] = await Promise.all([
      supabase.from('representative_assignments').select('*').order('granted_at', { ascending: false }),
      supabase.from('universities').select('id,name').eq('active', true).eq('verification_status', 'Verified').order('name'),
      supabase.from('rep_announcement_proposals').select('*').order('created_at', { ascending: false }),
      supabase.from('community_needs_reports').select('*').order('created_at', { ascending: false }),
    ]);
    if (a.error) { setError('We could not load representatives.'); setLoading(false); return; }
    setRows((a.data ?? []) as Assignment[]);
    setUnis((u.data ?? []) as Uni[]);
    setProposals((p.data ?? []) as Proposal[]);
    setNeeds((n.data ?? []) as Need[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function uniName(id: string) { return unis.find((u) => u.id === id)?.name ?? id; }

  async function add() {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setError('Enter a valid email address.'); return; }
    if (!uniId) { setError('Choose a verified university.'); return; }
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('representative_assignments').insert({
      email: v, university_id: uniId, status: 'Awaiting registration',
      granted_by: session.session?.user.id ?? null,
    });
    setSaving(false);
    if (err) { setError('Could not add representative (email may already exist).'); return; }
    setEmail('');
    setNotice('Representative added. They become Active only after verifying, being Approved, and the programme being ON.');
    await load();
  }

  async function setStatus(id: string, status: string) {
    setSaving(true);
    const { error: err } = await supabase.from('representative_assignments').update({
      status, last_status_change: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false);
    if (err) { setError('We could not update status.'); return; }
    setConfirm(null);
    await load();
  }

  async function toggleDirectory(id: string, row: Assignment) {
    const { error: err } = await supabase.from('representative_assignments').update({
      show_on_directory: !row.show_on_directory,
      consent_confirmed: !row.show_on_directory ? row.consent_confirmed : false,
    }).eq('id', id);
    if (err) { setError('We could not update directory visibility.'); return; }
    await load();
  }

  async function toggleConsent(id: string, row: Assignment) {
    const { error: err } = await supabase.from('representative_assignments').update({
      consent_confirmed: !row.consent_confirmed,
    }).eq('id', id);
    if (err) { setError('We could not update consent.'); return; }
    await load();
  }

  async function reviewProposal(p: Proposal, action: 'Published' | 'Rejected') {
    const { error: err } = await supabase.from('rep_announcement_proposals').update({
      status: action, internal_note: note[p.id] ?? '', updated_at: new Date().toISOString(),
    }).eq('id', p.id);
    if (err) { setError('We could not review the proposal.'); return; }
    await load();
  }

  async function updateNeed(n: Need, status: string) {
    const { error: err } = await supabase.from('community_needs_reports').update({
      status, internal_note: note[n.id] ?? '', updated_at: new Date().toISOString(),
    }).eq('id', n.id);
    if (err) { setError('We could not update the report.'); return; }
    await load();
  }

  if (loading) return <PageShell><Spinner label="Loading representatives…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Representatives" intro="Restricted role. Representatives never become administrators. History is never deleted." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}

      <Card>
        <h2 className="font-bold text-navy">Add representative</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="repEmail" className={labelCls}>Email</label>
            <input id="repEmail" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="person@example.com" /></div>
          <div><label htmlFor="repUni" className={labelCls}>University (verified, active)</label>
            <select id="repUni" value={uniId} onChange={(e) => setUniId(e.target.value)} className={inputCls}>
              <option value="">Choose university…</option>
              {unis.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select></div>
        </div>
        <button onClick={add} disabled={saving} className={`${btnPrimary} mt-3`}>{saving ? 'Adding…' : 'Add representative'}</button>
      </Card>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && <EmptyState title="No representatives yet" message="Add one above." />}
        {rows.map((r) => (
          <Card key={r.id}>
            <p className="font-bold text-navy break-all">{r.email}</p>
            <p className="text-sm text-slate-500">{uniName(r.university_id)} · {r.status} · Granted {new Date(r.granted_at).toLocaleDateString()}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status !== 'Suspended' && r.status !== 'Revoked' && (
                confirm === r.id ? (
                  <>
                    <button onClick={() => setStatus(r.id, 'Suspended')} disabled={saving} className={btnPrimary}>Confirm suspend</button>
                    <button onClick={() => setConfirm(null)} className={btnSecondary}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirm(r.id)} className={btnSecondary}>Suspend</button>
                )
              )}
              {r.status === 'Suspended' && <button onClick={() => setStatus(r.id, 'Active')} className={btnSecondary}>Reinstate</button>}
              {r.status !== 'Revoked' && (
                <button onClick={() => setStatus(r.id, 'Revoked')} className={btnSecondary}>Revoke</button>
              )}
              <button onClick={() => toggleDirectory(r.id, r)} className={btnSecondary}>
                Directory: {r.show_on_directory ? 'Shown' : 'Hidden'}
              </button>
              <button onClick={() => toggleConsent(r.id, r)} className={btnSecondary}>
                Consent: {r.consent_confirmed ? 'Confirmed' : 'Not confirmed'}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-navy">Proposed announcements queue</h2>
        <div className="mt-3 space-y-3">
          {proposals.length === 0 && <EmptyState title="No proposals" message="Representative proposals will appear here." />}
          {proposals.map((p) => (
            <Card key={p.id}>
              <p className="font-bold text-navy">{p.title}</p>
              <p className="text-sm text-slate-500">{p.representative_email} · {uniName(p.university_id)} · {p.status}</p>
              <p className="mt-1 text-[15px] text-slate-700">{p.message}</p>
              <label className={labelCls} htmlFor={`pn-${p.id}`}>Internal note</label>
              <input id={`pn-${p.id}`} value={note[p.id] ?? ''} onChange={(e) => setNote((n) => ({ ...n, [p.id]: e.target.value }))} className={inputCls} />
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => reviewProposal(p, 'Published')} className={btnPrimary}>Approve &amp; publish</button>
                <button onClick={() => reviewProposal(p, 'Rejected')} className={btnSecondary}>Reject</button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-navy">Community-need reports</h2>
        <div className="mt-3 space-y-3">
          {needs.length === 0 && <EmptyState title="No reports" message="Reports will appear here." />}
          {needs.map((n) => (
            <Card key={n.id}>
              <p className="font-bold text-navy">{n.category}</p>
              <p className="text-sm text-slate-500">{n.representative_email} · {uniName(n.university_id)} · {n.status}</p>
              <p className="mt-1 text-[15px] text-slate-700">{n.message}</p>
              <label className={labelCls} htmlFor={`nn-${n.id}`}>Internal note</label>
              <input id={`nn-${n.id}`} value={note[n.id] ?? ''} onChange={(e) => setNote((x) => ({ ...x, [n.id]: e.target.value }))} className={inputCls} />
              <div className="mt-2 flex flex-wrap gap-2">
                {['Received', 'In progress', 'Resolved'].map((s) => (
                  <button key={s} onClick={() => updateNeed(n, s)} className={btnSecondary}>{s}</button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
