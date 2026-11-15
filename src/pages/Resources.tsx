import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls } from '../components/ui';
import { useSiteText, t } from '../lib/siteText';

interface Resource {
  id: string; title: string; description: string; category: string; type: string;
  file_path: string | null; external_url: string | null; contributor: string | null; published_at: string | null;
}

export function Resources() {
  const texts = useSiteText('Resources');
  const [rows, setRows] = useState<Resource[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [type, setType] = useState('All');
  const [opening, setOpening] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('resources')
      .select('id,title,description,category,type,file_path,external_url,contributor,published_at')
      .eq('status', 'Published').order('published_at', { ascending: false });
    if (err) { setError('We could not load resources.'); setLoading(false); return; }
    setRows((data ?? []) as Resource[]);
    const { data: catData } = await supabase.from('resource_categories').select('name').order('name');
    setCats((catData ?? []).map((c) => c.name));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function openFile(r: Resource) {
    if (!r.file_path) return;
    setOpening(r.id);
    const { data, error: err } = await supabase.storage.from('resource-files').createSignedUrl(r.file_path, 3600);
    setOpening(null);
    if (err || !data?.signedUrl) { setError('We could not open that file. Please try again.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    return matchSearch && (cat === 'All' || r.category === cat) && (type === 'All' || r.type === type);
  });

  if (loading) return <PageShell><Spinner label="Loading resources…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title={t(texts, 'resources.title')} intro={t(texts, 'resources.intro')} />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label htmlFor="rSearch" className={labelCls}>Search</label>
          <input id="rSearch" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} placeholder="Search title or description…" /></div>
        <div><label htmlFor="rCat" className={labelCls}>Category</label>
          <select id="rCat" value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls}>
            <option value="All">All categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div><label htmlFor="rType" className={labelCls}>Type</label>
          <select id="rType" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="All">All types</option>{['PDF','Document','Slides','Video link','Website link','Other'].map((x) => <option key={x} value={x}>{x}</option>)}
          </select></div>
      </div>
      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <EmptyState title="No resources yet" message="Resources shared by members will appear here. Check back soon — we will never list fake resources." />
        )}
        {filtered.map((r) => (
          <Card key={r.id}>
            <p className="font-bold text-navy">{r.title}</p>
            <p className="mt-1 text-sm text-slate-500">{r.category} · {r.type}{r.contributor ? ` · Contributed by ${r.contributor}` : ''}{r.published_at ? ` · ${new Date(r.published_at).toLocaleDateString()}` : ''}</p>
            {r.description && <p className="mt-2 text-[15px] text-slate-700">{r.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {r.file_path && (
                <button onClick={() => openFile(r)} disabled={opening === r.id} className="inline-flex min-h-[44px] items-center rounded-xl bg-royal px-4 py-2 font-semibold text-white disabled:opacity-60">
                  {opening === r.id ? 'Opening…' : 'Open file'}
                </button>
              )}
              {r.external_url && (
                <a href={r.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-4 py-2 font-semibold text-navy">
                  Open link
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
