import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';
import { NIGERIAN_STATES } from '../lib/validation';

interface Uni {
  id: string; name: string; type: string; state: string; location: string;
  verification_status: string; active: boolean; created_at: string;
}
interface AppRow { id: string; university: string; university_id: string | null; application_status: string; }

export function AdminUniversities() {
  const [rows, setRows] = useState<Uni[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [state, setState] = useState('All');
  const [verif, setVerif] = useState('All');
  const [active, setActive] = useState('All');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const [name, setName] = useState(''); const [uType, setUType] = useState('Federal');
  const [uState, setUState] = useState(NIGERIAN_STATES[0]); const [location, setLocation] = useState('');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('universities').select('*').order('name');
    if (err) { setError('We could not load universities.'); setLoading(false); return; }
    setRows((data ?? []) as Uni[]);
    const { data: appData } = await supabase.from('applications').select('id,university,university_id,application_status');
    setApps((appData ?? []) as AppRow[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addUniversity() {
    if (!name.trim()) { setError('University name is required.'); return; }
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('universities').insert({
      name: name.trim(), type: uType, state: uState, location: location.trim(),
      changed_by: session.session?.user.id ?? null,
    });
    setSaving(false);
    if (err) { setError('Could not add university (name may already exist).'); return; }
    setName(''); setLocation('');
    setNotice('University added as Unverified.');
    await load();
  }

  async function update(id: string, patch: Record<string, unknown>) {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('universities').update({ ...patch, changed_by: session.session?.user.id ?? null }).eq('id', id);
    setSaving(false);
    if (err) { setError('We could not update the university.'); return; }
    setConfirm(null);
    await load();
  }

  // Needs matching queue: group unlinked apps by typed name
  const unlinked = apps.filter((a) => !a.university_id);
  const groups: Record<string, AppRow[]> = {};
  for (const a of unlinked) {
    const key = a.university.trim().toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  const groupList = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  async function linkGroup(typedName: string, universityId: string) {
    setSaving(true);
    const ids = groups[typedName.toLowerCase()].map((a) => a.id);
    const { error: err } = await supabase.from('applications').update({ university_id: universityId }).in('id', ids);
    setSaving(false);
    if (err) { setError('We could not link applications.'); return; }
    setNotice(`Linked ${ids.length} application(s) to the selected university.`);
    await load();
  }

  async function createFromTyped(typedName: string, typedType: string, typedState: string) {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { data: created, error: err } = await supabase.from('universities').insert({
      name: typedName, type: typedType, state: typedState, location: '',
      changed_by: session.session?.user.id ?? null,
    }).select('id').single();
    if (err || !created) { setError('Could not create university (name may already exist).'); setSaving(false); return; }
    const ids = groups[typedName.toLowerCase()].map((a) => a.id);
    await supabase.from('applications').update({ university_id: created.id }).in('id', ids);
    setSaving(false);
    setNotice('University created (Unverified) and applications linked.');
    await load();
  }

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !r.name.toLowerCase().includes(q)) return false;
    if (type !== 'All' && r.type !== type) return false;
    if (state !== 'All' && r.state !== state) return false;
    if (verif !== 'All' && r.verification_status !== verif) return false;
    if (active !== 'All' && String(r.active) !== active) return false;
    return true;
  });

  if (loading) return <PageShell><Spinner label="Loading universities…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Universities" intro="Directory starts empty. Deactivate rather than delete when records are linked. Matching is always confirmed by an administrator, never automatic." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}

      <Card>
        <h2 className="font-bold text-navy">Add university</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="uName" className={labelCls}>Name</label><input id="uName" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
          <div><label htmlFor="uType" className={labelCls}>Type</label>
            <select id="uType" value={uType} onChange={(e) => setUType(e.target.value)} className={inputCls}>
              <option value="Federal">Federal</option><option value="State">State</option><option value="Private">Private</option>
            </select></div>
          <div><label htmlFor="uState" className={labelCls}>State</label>
            <select id="uState" value={uState} onChange={(e) => setUState(e.target.value)} className={inputCls}>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label htmlFor="uLoc" className={labelCls}>Location</label><input id="uLoc" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} /></div>
        </div>
        <button onClick={addUniversity} disabled={saving} className={`${btnPrimary} mt-3`}>{saving ? 'Adding…' : 'Add university'}</button>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div><label htmlFor="fSearch" className={labelCls}>Search</label><input id="fSearch" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} placeholder="Search…" /></div>
        <div><label htmlFor="fType" className={labelCls}>Type</label>
          <select id="fType" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="All">All</option><option value="Federal">Federal</option><option value="State">State</option><option value="Private">Private</option>
          </select></div>
        <div><label htmlFor="fState" className={labelCls}>State</label>
          <select id="fState" value={state} onChange={(e) => setState(e.target.value)} className={inputCls}>
            <option value="All">All</option>{NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label htmlFor="fVerif" className={labelCls}>Verification</label>
          <select id="fVerif" value={verif} onChange={(e) => setVerif(e.target.value)} className={inputCls}>
            <option value="All">All</option><option value="Verified">Verified</option><option value="Unverified">Unverified</option>
          </select></div>
      </div>
      <div className="mt-3">
        <label htmlFor="fActive" className={labelCls}>Active status</label>
        <select id="fActive" value={active} onChange={(e) => setActive(e.target.value)} className={inputCls}>
          <option value="All">All</option><option value="true">Active</option><option value="false">Deactivated</option>
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && <EmptyState title="No universities found" message="Add one above or adjust filters." />}
        {filtered.map((r) => (
          <Card key={r.id}>
            <p className="font-bold text-navy">{r.name}</p>
            <p className="text-sm text-slate-500">{r.type} · {r.state}{r.location ? ` · ${r.location}` : ''} · {r.verification_status} · {r.active ? 'Active' : 'Deactivated'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => update(r.id, { verification_status: r.verification_status === 'Verified' ? 'Unverified' : 'Verified' })} className={btnSecondary}>
                {r.verification_status === 'Verified' ? 'Unverify' : 'Verify'}
              </button>
              {confirm === r.id ? (
                <>
                  <button onClick={() => update(r.id, { active: !r.active })} disabled={saving} className={btnPrimary}>Confirm {r.active ? 'deactivate' : 'reactivate'}</button>
                  <button onClick={() => setConfirm(null)} className={btnSecondary}>Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirm(r.id)} className={btnSecondary}>{r.active ? 'Deactivate' : 'Reactivate'}</button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-navy">Needs matching</h2>
        <p className="mt-1 text-sm text-slate-600">Unlinked applications grouped by typed university name. Link a group or create a new Unverified university in one step.</p>
        <div className="mt-4 space-y-4">
          {groupList.length === 0 && <EmptyState title="No unmatched applications" message="All applications are linked." />}
          {groupList.map(([typedKey, items]) => {
            const typedName = items[0].university;
            return (
              <Card key={typedKey}>
                <p className="font-bold text-navy">“{typedName}” — {items.length} application(s)</p>
                <p className="text-sm text-slate-500">{items.map((a) => a.application_status).join(', ')}</p>
                <div className="mt-3 grid gap-3">
                  <label className={labelCls} htmlFor={`link-${typedKey}`}>Link to existing university (all active, verified first)</label>
                  <select id={`link-${typedKey}`} className={inputCls} defaultValue=""
                    onChange={(e) => { if (e.target.value) linkGroup(typedName, e.target.value); }}>
                    <option value="">Choose university…</option>
                    {[...rows.filter((r) => r.active && r.verification_status === 'Verified'), ...rows.filter((r) => r.active && r.verification_status !== 'Verified')].map((r) => (
                      <option key={r.id} value={r.id}>{r.name} — {r.type}, {r.state} ({r.verification_status})</option>
                    ))}
                  </select>
                  <CreateFromTyped typedName={typedName} onCreate={createFromTyped} saving={saving} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

function CreateFromTyped({ typedName, onCreate, saving }: { typedName: string; onCreate: (n: string, t: string, s: string) => void; saving: boolean }) {
  const [t, setT] = useState('Federal');
  const [s, setS] = useState(NIGERIAN_STATES[0]);
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <select aria-label="Type for new university" value={t} onChange={(e) => setT(e.target.value)} className={inputCls}>
        <option value="Federal">Federal</option><option value="State">State</option><option value="Private">Private</option>
      </select>
      <select aria-label="State for new university" value={s} onChange={(e) => setS(e.target.value)} className={inputCls}>
        {NIGERIAN_STATES.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <button onClick={() => onCreate(typedName, t, s)} disabled={saving} className={btnSecondary}>Create new (Unverified) &amp; link</button>
    </div>
  );
}
