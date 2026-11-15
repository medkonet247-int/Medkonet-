import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState } from '../components/ui';
import { useSiteText, t } from '../lib/siteText';

interface Opp { id: string; title: string; description: string; who_for: string; how_to_apply: string; opportunity_status: string; }

export function Mentorship() {
  const texts = useSiteText('Mentorship');
  const [rows, setRows] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('mentorship_opportunities')
      .select('id,title,description,who_for,how_to_apply,opportunity_status')
      .eq('status', 'Published').order('created_at', { ascending: false });
    if (err) { setError('We could not load mentorship opportunities.'); setLoading(false); return; }
    setRows((data ?? []) as Opp[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (loading) return <PageShell><Spinner label="Loading mentorship…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title={t(texts, 'mentorship.title')} intro={t(texts, 'mentorship.intro')} />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      <Card>
        <h2 className="font-bold text-navy">How the programme is intended to work</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          Mentorship is a developing initiative. We intend to connect students with mentors who can offer guidance
          on study, clinical skills and career decisions. No fake mentors are listed — opportunities appear here
          only when they are real and published by the MedKonet team.
        </p>
      </Card>
      <div className="mt-6 space-y-3">
        {rows.length === 0 && (
          <EmptyState title="Mentorship opportunities will be announced here when they become available." message="Check back soon." />
        )}
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-bold text-navy">{r.title}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.opportunity_status === 'Open' ? 'bg-green-100 text-green-900' : 'bg-slate-100 text-slate-700'}`}>{r.opportunity_status}</span>
            </div>
            {r.description && <p className="mt-2 text-[15px] text-slate-700">{r.description}</p>}
            {r.who_for && <p className="mt-2 text-[15px] text-slate-700"><strong>Who it is for:</strong> {r.who_for}</p>}
            {r.how_to_apply && <p className="mt-1 text-[15px] text-slate-700"><strong>How to apply:</strong> {r.how_to_apply}</p>}
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
