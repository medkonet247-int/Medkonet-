import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

interface Row {
  key: string; page: string; label: string; current_value: string; default_value: string;
  previous_value: string | null; visibility: string; updated_at: string; updated_by: string | null;
}

const PAGE_LINKS: Record<string, string> = {
  Header: '/', Home: '/', About: '/about', Contact: '/contact', Join: '/join', Login: '/login',
  'Verify Email': '/verify-email', 'Forgot Password': '/forgot-password', 'Reset Password': '/reset-password',
  Community: '/community', Resources: '/resources', Mentorship: '/mentorship', Events: '/events',
  Footer: '/', 'Community Rules': '/community-rules', 'Privacy Notice': '/privacy',
};

export function AdminSiteText() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [confirmSave, setConfirmSave] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('site_text')
      .select('*').order('page').order('key');
    if (err) { setError('We could not load site text.'); setLoading(false); return; }
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (Object.values(dirty).some(Boolean)) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || r.label.toLowerCase().includes(q) || r.current_value.toLowerCase().includes(q) || r.key.toLowerCase().includes(q);
  });
  const pages = Array.from(new Set(filtered.map((r) => r.page)));

  async function save(key: string) {
    setSaving(true);
    setError('');
    const { error: err } = await supabase.rpc('update_site_text', { p_key: key, p_value: drafts[key] ?? '' });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setConfirmSave(null);
    setDirty((d) => ({ ...d, [key]: false }));
    setNotice('Saved. Changes are live on the site.');
    await load();
  }

  async function reset(key: string) {
    setSaving(true);
    setError('');
    const { error: err } = await supabase.rpc('reset_site_text', { p_key: key });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setConfirmReset(null);
    setDirty((d) => ({ ...d, [key]: false }));
    setNotice('Reset to default.');
    await load();
  }

  async function undo(key: string) {
    const row = rows.find((r) => r.key === key);
    if (!row?.previous_value) return;
    setDrafts((d) => ({ ...d, [key]: row.previous_value! }));
    setDirty((d) => ({ ...d, [key]: true }));
  }

  if (loading) return <PageShell><Spinner label="Loading site text…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Site Text" intro="Edit public wording. Plain text only — HTML and scripts are stripped. Changes go live immediately and are audit-logged with old and new values." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}
      <label htmlFor="stSearch" className={labelCls}>Search</label>
      <input id="stSearch" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} placeholder="Search label or text…" />
      {Object.values(dirty).some(Boolean) && (
        <p role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">You have unsaved changes. Save or discard before leaving.</p>
      )}
      {filtered.length === 0 && <div className="mt-6"><EmptyState title="No site text found" message="Try a different search." /></div>}
      {pages.map((page) => (
        <section key={page} className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-navy">{page}</h2>
            {PAGE_LINKS[page] && <Link to={PAGE_LINKS[page]} className="min-h-[44px] font-semibold text-royal underline">View on site</Link>}
          </div>
          <div className="mt-3 space-y-3">
            {filtered.filter((r) => r.page === page).map((r) => {
              const value = drafts[r.key] ?? r.current_value;
              const isDirty = Boolean(dirty[r.key]);
              return (
                <Card key={r.key}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-navy">{r.label}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{r.key} · {r.visibility}</span>
                  </div>
                  <label htmlFor={`st-${r.key}`} className={labelCls}>Text ({value.length} characters, max 2000)</label>
                  <textarea id={`st-${r.key}`} rows={3} value={value}
                    onChange={(e) => { setDrafts((d) => ({ ...d, [r.key]: e.target.value })); setDirty((d) => ({ ...d, [r.key]: true })); }}
                    className={inputCls} />
                  <p className="mt-2 text-sm text-slate-500">
                    Last edited: {new Date(r.updated_at).toLocaleString()} by {r.updated_by ?? '—'}
                  </p>
                  {r.previous_value && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-700">Previous value (for undo):</p>
                      <p className="text-sm text-slate-600">{r.previous_value}</p>
                      <button onClick={() => undo(r.key)} className={`${btnSecondary} mt-2`}>Undo to previous</button>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {confirmSave === r.key ? (
                      <>
                        <button onClick={() => save(r.key)} disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Confirm save'}</button>
                        <button onClick={() => setConfirmSave(null)} className={btnSecondary}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmSave(r.key)} disabled={!isDirty} className={btnPrimary}>Save</button>
                    )}
                    {confirmReset === r.key ? (
                      <>
                        <button onClick={() => reset(r.key)} disabled={saving} className={btnPrimary}>Confirm reset</button>
                        <button onClick={() => setConfirmReset(null)} className={btnSecondary}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmReset(r.key)} className={btnSecondary}>Reset to default</button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
