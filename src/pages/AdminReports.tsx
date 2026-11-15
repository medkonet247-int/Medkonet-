import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, ErrorState, inputCls, labelCls, btnSecondary } from '../components/ui';

interface Summary { total_applications: number; pending_count: number; approved_count: number; rejected_count: number; universities_represented: number; states_represented: number; }
interface ByUni { university_name: string; total: number; pending: number; approved: number; rejected: number; onboarded: number; }
interface Growth { period_start: string; applications: number; }

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byUni, setByUni] = useState<ByUni[]>([]);
  const [growth, setGrowth] = useState<Growth[]>([]);

  async function load() {
    setLoading(true);
    const f = from ? new Date(from).toISOString() : new Date(2000, 0, 1).toISOString();
    const t = to ? new Date(to).toISOString() : new Date().toISOString();
    const [s, b, g] = await Promise.all([
      supabase.rpc('report_summary', { p_from: f, p_to: t }),
      supabase.rpc('report_by_university'),
      supabase.rpc('report_growth', { p_from: f, p_to: t }),
    ]);
    if (s.error || b.error || g.error) { setError('We could not load reports.'); setLoading(false); return; }
    setSummary(((s.data ?? []) as Summary[])[0] ?? null);
    setByUni((b.data ?? []) as ByUni[]);
    setGrowth((g.data ?? []) as Growth[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function exportCsv() {
    const header = 'University,Total,Pending,Approved,Rejected,Onboarded\n';
    const lines = byUni.map((r) => [r.university_name, r.total, r.pending, r.approved, r.rejected, r.onboarded].join(',')).join('\n');
    const blob = new Blob([header + lines], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'medkonet-report.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <PageShell><Spinner label="Loading reports…" /></PageShell>;

  const maxGrowth = Math.max(1, ...growth.map((g) => g.applications));

  return (
    <PageShell>
      <PageHeader title="Reports" intro="Aggregates computed in the database. CSV export contains no email or WhatsApp numbers." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label htmlFor="rFrom" className={labelCls}>From</label><input id="rFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></div>
        <div><label htmlFor="rTo" className={labelCls}>To</label><input id="rTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></div>
        <div className="flex items-end"><button onClick={load} className={btnSecondary}>Apply range</button></div>
      </div>

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ['Total', summary.total_applications], ['Pending', summary.pending_count],
            ['Approved', summary.approved_count], ['Rejected', summary.rejected_count],
            ['Universities represented', summary.universities_represented], ['States represented', summary.states_represented],
          ].map(([label, value]) => (
            <Card key={String(label)} className="text-center">
              <p className="text-2xl font-extrabold text-navy">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </Card>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-navy">Growth over time (per month)</h2>
        {growth.length === 0 ? <p className="mt-2 text-sm text-slate-600">No applications in this range.</p> : (
          <div className="mt-3 space-y-2">
            {growth.map((g) => (
              <div key={g.period_start} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-slate-600">{g.period_start}</span>
                <div className="h-5 flex-1 rounded bg-slate-100">
                  <div className="h-5 rounded bg-royal" style={{ width: `${(g.applications / maxGrowth) * 100}%` }} />
                </div>
                <span className="w-10 text-right text-sm font-semibold">{g.applications}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-navy">Applications by university</h2>
          <button onClick={exportCsv} className={btnSecondary}>Export CSV (no contact details)</button>
        </div>
        <div className="mt-3 space-y-3">
          {byUni.length === 0 && <p className="text-sm text-slate-600">No applications yet.</p>}
          {byUni.map((r, i) => (
            <Card key={i}>
              <p className="font-bold text-navy">{r.university_name}</p>
              <p className="text-sm text-slate-600">Total {r.total} · Pending {r.pending} · Approved {r.approved} · Rejected {r.rejected} · Onboarded {r.onboarded}</p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
