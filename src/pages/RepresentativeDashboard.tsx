import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

interface Welcome { full_name: string; course: string; current_level: string; onboarding_confirmed: boolean; }
interface Proposal { id: string; title: string; message: string; status: string; internal_note: string; created_at: string; }
interface Need { id: string; category: string; message: string; status: string; created_at: string; }

export function RepresentativeDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uniName, setUniName] = useState('');
  const [welcome, setWelcome] = useState<Welcome[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [pTitle, setPTitle] = useState(''); const [pMsg, setPMsg] = useState('');
  const [nCat, setNCat] = useState('Resources'); const [nMsg, setNMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data: uniId } = await supabase.rpc('my_representative_university');
    if (!uniId) { setLoading(false); return; }
    const { data: uni } = await supabase.from('universities').select('name').eq('id', uniId).maybeSingle();
    setUniName(uni?.name ?? '');
    const [w, p, n] = await Promise.all([
      supabase.rpc('get_members_to_welcome'),
      supabase.rpc('my_rep_proposals'),
      supabase.rpc('my_needs_reports'),
    ]);
    setWelcome((w.data ?? []) as Welcome[]);
    setProposals((p.data ?? []) as Proposal[]);
    setNeeds((n.data ?? []) as Need[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submitProposal() {
    if (!pTitle.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    const { error: err } = await supabase.rpc('submit_rep_proposal', { p_title: pTitle.trim(), p_message: pMsg.trim() });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setPTitle(''); setPMsg('');
    setNotice('Proposal submitted for admin approval.');
    await load();
  }

  async function withdraw(id: string) {
    const { error: err } = await supabase.rpc('withdraw_rep_proposal', { p_id: id });
    if (err) { setError(err.message); return; }
    await load();
  }

  async function submitNeed() {
    if (!nMsg.trim()) { setError('Message is required.'); return; }
    setSaving(true);
    const { error: err } = await supabase.rpc('submit_needs_report', { p_category: nCat, p_message: nMsg.trim() });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setNMsg('');
    setNotice('Report submitted.');
    await load();
  }

  if (loading) return <PageShell><Spinner label="Loading representative dashboard…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Representative Dashboard" intro={`My university: ${uniName || '—'}`} />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}
      <Card>
        <p className="text-[15px] font-semibold text-amber-900">Privacy reminder: do not share or screenshot members&apos; information. You can only see limited details for your own university.</p>
      </Card>

      <section className="mt-6">
        <h2 className="text-xl font-extrabold text-navy">Members to welcome</h2>
        <div className="mt-3 space-y-3">
          {welcome.length === 0 && <EmptyState title="No members to welcome yet" message="Approved members from your university will appear here." />}
          {welcome.map((w, i) => (
            <Card key={i}>
              <p className="font-bold text-navy">{w.full_name}</p>
              <p className="text-sm text-slate-600">{w.course} · {w.current_level} · Onboarding confirmed: {w.onboarding_confirmed ? 'Yes' : 'No'}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="mt-6">
        <h2 className="font-bold text-navy">Propose announcement</h2>
        <p className="mt-1 text-sm text-slate-600">Saved as “Awaiting admin approval” and hidden from members until an administrator publishes it.</p>
        <div className="mt-3 space-y-3">
          <div><label htmlFor="pTitle" className={labelCls}>Title</label><input id="pTitle" value={pTitle} onChange={(e) => setPTitle(e.target.value)} className={inputCls} /></div>
          <div><label htmlFor="pMsg" className={labelCls}>Message</label><textarea id="pMsg" rows={3} value={pMsg} onChange={(e) => setPMsg(e.target.value)} className={inputCls} /></div>
          <button onClick={submitProposal} disabled={saving} className={btnPrimary}>{saving ? 'Submitting…' : 'Submit proposal'}</button>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold text-navy">Report a community need</h2>
        <div className="mt-3 space-y-3">
          <div><label htmlFor="nCat" className={labelCls}>Category</label>
            <select id="nCat" value={nCat} onChange={(e) => setNCat(e.target.value)} className={inputCls}>
              {['Resources','Events','Mentorship','Technical problem','Welfare or support','Other'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label htmlFor="nMsg" className={labelCls}>Message (max 1000 characters)</label>
            <textarea id="nMsg" rows={3} value={nMsg} onChange={(e) => setNMsg(e.target.value)} className={inputCls} /></div>
          <button onClick={submitNeed} disabled={saving} className={btnPrimary}>{saving ? 'Submitting…' : 'Submit report'}</button>
        </div>
      </Card>

      <section className="mt-6">
        <h2 className="text-xl font-extrabold text-navy">My submissions</h2>
        <div className="mt-3 space-y-3">
          {proposals.map((p) => (
            <Card key={p.id}>
              <p className="font-bold text-navy">{p.title}</p>
              <p className="text-sm text-slate-600">{p.status} · {new Date(p.created_at).toLocaleDateString()}</p>
              {p.internal_note && <p className="mt-1 text-sm text-slate-600">Admin note: {p.internal_note}</p>}
              {p.status === 'Awaiting admin approval' && (
                <button onClick={() => withdraw(p.id)} className={`${btnSecondary} mt-2`}>Withdraw</button>
              )}
            </Card>
          ))}
          {needs.map((n) => (
            <Card key={n.id}>
              <p className="font-bold text-navy">{n.category}</p>
              <p className="text-sm text-slate-600">{n.status} · {new Date(n.created_at).toLocaleDateString()}</p>
              <p className="mt-1 text-[15px] text-slate-700">{n.message}</p>
            </Card>
          ))}
          {proposals.length === 0 && needs.length === 0 && <EmptyState title="No submissions yet" message="Your proposals and reports will appear here." />}
        </div>
      </section>
    </PageShell>
  );
}
