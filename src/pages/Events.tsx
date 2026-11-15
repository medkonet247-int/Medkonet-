import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls } from '../components/ui';
import { useSiteText, t } from '../lib/siteText';

interface EventRow {
  id: string; title: string; description: string; event_at: string; type: string;
  venue_or_link: string; registration_info: string;
}

export function Events() {
  const texts = useSiteText('Events');
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('events')
      .select('id,title,description,event_at,type,venue_or_link,registration_info')
      .eq('status', 'Published').order('event_at', { ascending: true });
    if (err) { setError('We could not load events.'); setLoading(false); return; }
    setRows((data ?? []) as EventRow[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const now = new Date();
  const filtered = rows.filter((r) => {
    const isUpcoming = new Date(r.event_at) >= now;
    if (tab === 'Upcoming' && !isUpcoming) return false;
    if (tab === 'Past' && isUpcoming) return false;
    const q = search.trim().toLowerCase();
    if (q && !r.title.toLowerCase().includes(q)) return false;
    if (type !== 'All' && r.type !== type) return false;
    return true;
  });

  if (loading) return <PageShell><Spinner label="Loading events…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title={t(texts, 'events.title')} intro={t(texts, 'events.intro')} />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      <div className="flex gap-2" role="tablist" aria-label="Event tabs">
        {(['Upcoming', 'Past'] as const).map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)}
            className={`min-h-[44px] rounded-xl px-4 font-semibold ${tab === x ? 'bg-royal text-white' : 'border border-slate-300 bg-white text-navy'}`}>{x}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="eSearch" className={labelCls}>Search by title</label>
          <input id="eSearch" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} placeholder="Search…" /></div>
        <div><label htmlFor="eType" className={labelCls}>Filter by type</label>
          <select id="eType" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="All">All types</option>{['Webinar','Study Session','Workshop','Meetup','Announcement','Other'].map((x) => <option key={x} value={x}>{x}</option>)}
          </select></div>
      </div>
      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <EmptyState title="No events have been published yet. Check back soon." message="When events are published, they will appear here." />
        )}
        {filtered.map((r) => (
          <Card key={r.id}>
            <p className="font-bold text-navy">{r.title}</p>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(r.event_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT · {r.type}
            </p>
            {r.description && <p className="mt-2 text-[15px] text-slate-700">{r.description}</p>}
            {r.venue_or_link && <p className="mt-2 text-[15px] text-slate-700"><strong>Venue / link:</strong> {r.venue_or_link}</p>}
            {r.registration_info && <p className="mt-1 text-[15px] text-slate-700"><strong>Registration:</strong> {r.registration_info}</p>}
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
