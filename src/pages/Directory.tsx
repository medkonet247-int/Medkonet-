import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls } from '../components/ui';

interface Uni { id: string; name: string; type: string; state: string; location: string; }
interface Count { university_id: string; onboarded_count: number; }

export function Directory() {
  const [rows, setRows] = useState<Uni[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [state, setState] = useState('All');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('universities')
      .select('id,name,type,state,location')
      .eq('verification_status', 'Verified').eq('active', true).order('name');
    if (err) { setError('We could not load the directory.'); setLoading(false); return; }
    setRows((data ?? []) as Uni[]);
    const { data: countData } = await supabase.rpc('university_member_counts');
    const map: Record<string, number> = {};
    for (const c of (countData ?? []) as Count[]) map[c.university_id] = Number(c.onboarded_count ?? 0);
    setCounts(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const states = Array.from(new Set(rows.map((r) => r.state))).sort();
  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !r.name.toLowerCase().includes(q)) return false;
    if (type !== 'All' && r.type !== type) return false;
    if (state !== 'All' && r.state !== state) return false;
    return true;
  });

  if (loading) return <PageShell><Spinner label="Loading directory…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="University Directory" intro="Verified universities in the MedKonet network. Member counts show onboarded members only." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label htmlFor="dSearch" className={labelCls}>Search</label>
          <input id="dSearch" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} placeholder="Search universities…" /></div>
        <div><label htmlFor="dType" className={labelCls}>Type</label>
          <select id="dType" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="All">All types</option><option value="Federal">Federal</option><option value="State">State</option><option value="Private">Private</option>
          </select></div>
        <div><label htmlFor="dState" className={labelCls}>State</label>
          <select id="dState" value={state} onChange={(e) => setState(e.target.value)} className={inputCls}>
            <option value="All">All states</option>{states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
      </div>
      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <EmptyState title="No universities have been added to the directory yet. Check back soon." message="Verified universities will appear here." />
        )}
        {filtered.map((r) => (
          <Card key={r.id}>
            <p className="font-bold text-navy">{r.name}</p>
            <p className="mt-1 text-sm text-slate-500">{r.type} · {r.state}{r.location ? ` · ${r.location}` : ''}</p>
            <p className="mt-1 text-sm text-slate-600">{counts[r.id] ?? 0} onboarded member{(counts[r.id] ?? 0) === 1 ? '' : 's'}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
