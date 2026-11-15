import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

type Tab = 'Resources' | 'Events' | 'Mentorship' | 'Announcements';

const RESOURCE_TYPES = ['PDF', 'Document', 'Slides', 'Video link', 'Website link', 'Other'];
const EVENT_TYPES = ['Webinar', 'Study Session', 'Workshop', 'Meetup', 'Announcement', 'Other'];
const DEFAULT_CATS = ['Anatomy','Physiology','Biochemistry','Pathology','Pharmacology','Microbiology','Community Medicine','Medicine','Surgery','Obstetrics and Gynaecology','Paediatrics','Past Questions','Study Guides','Other'];

export function AdminContent() {
  const [tab, setTab] = useState<Tab>('Resources');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Published'>('All');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [resources, setResources] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [mentorship, setMentorship] = useState<Record<string, unknown>[]>([]);
  const [announcements, setAnnouncements] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATS);

  // Resource form
  const [rTitle, setRTitle] = useState(''); const [rDesc, setRDesc] = useState('');
  const [rCat, setRCat] = useState('Other'); const [rType, setRType] = useState('PDF');
  const [rFile, setRFile] = useState<File | null>(null); const [rUrl, setRUrl] = useState('');
  const [rContributor, setRContributor] = useState(''); const [rStatus, setRStatus] = useState<'Draft' | 'Published'>('Draft');
  const [newCat, setNewCat] = useState('');

  // Event form
  const [eTitle, setETitle] = useState(''); const [eDesc, setEDesc] = useState('');
  const [eAt, setEAt] = useState(''); const [eType, setEType] = useState('Webinar');
  const [eVenue, setEVenue] = useState(''); const [eReg, setEReg] = useState(''); const [eStatus, setEStatus] = useState<'Draft' | 'Published'>('Draft');

  // Mentorship form
  const [mTitle, setMTitle] = useState(''); const [mDesc, setMDesc] = useState('');
  const [mWho, setMWho] = useState(''); const [mHow, setMHow] = useState('');
  const [mStatus, setMStatus] = useState<'Draft' | 'Published'>('Draft'); const [mOpen, setMOpen] = useState<'Open' | 'Closed'>('Open');

  // Announcement form
  const [aTitle, setATitle] = useState(''); const [aMsg, setAMsg] = useState('');
  const [aStatus, setAStatus] = useState<'Draft' | 'Published'>('Draft'); const [aPinned, setAPinned] = useState(false);

  async function load() {
    setLoading(true);
    const [res, ev, me, an, cats] = await Promise.all([
      supabase.from('resources').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('event_at', { ascending: false }),
      supabase.from('mentorship_opportunities').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('resource_categories').select('name').order('name'),
    ]);
    if (res.error || ev.error || me.error || an.error) { setError('We could not load content.'); setLoading(false); return; }
    setResources((res.data ?? []) as Record<string, unknown>[]);
    setEvents((ev.data ?? []) as Record<string, unknown>[]);
    setMentorship((me.data ?? []) as Record<string, unknown>[]);
    setAnnouncements((an.data ?? []) as Record<string, unknown>[]);
    if (!cats.error && cats.data?.length) setCategories(cats.data.map((c) => c.name));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    const { error: err } = await supabase.from('resource_categories').insert({ name });
    if (err) { setError('Could not add category (may already exist).'); return; }
    setNewCat('');
    await load();
  }

  async function createResource() {
    if (!rTitle.trim()) { setError('Resource title is required.'); return; }
    setSaving(true);
    setError('');
    let filePath: string | null = null;
    if (rFile) {
      const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(rFile.type)) { setError('Only PDF, DOCX, PPTX or common images are allowed.'); setSaving(false); return; }
      if (rFile.size > 10 * 1024 * 1024) { setError('File must be 10 MB or smaller.'); setSaving(false); return; }
      const path = `resources/${Date.now()}-${rFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('resource-files').upload(path, rFile, { contentType: rFile.type });
      if (upErr) { setError('File upload failed.'); setSaving(false); return; }
      filePath = path;
    }
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('resources').insert({
      title: rTitle.trim(), description: rDesc.trim(), category: rCat, type: rType,
      file_path: filePath, external_url: rUrl.trim() || null,
      status: rStatus, contributor: rContributor.trim() || null,
      published_at: rStatus === 'Published' ? new Date().toISOString() : null,
      created_by: session.session?.user.id ?? null,
    });
    setSaving(false);
    if (err) { setError('We could not create the resource.'); return; }
    setRTitle(''); setRDesc(''); setRFile(null); setRUrl(''); setRContributor('');
    setNotice('Resource created.');
    await load();
  }

  async function deleteResource(row: Record<string, unknown>) {
    setSaving(true);
    const path = row.file_path as string | null;
    if (path) await supabase.storage.from('resource-files').remove([path]);
    const { error: err } = await supabase.from('resources').delete().eq('id', row.id);
    setSaving(false);
    if (err) { setError('We could not delete the resource.'); return; }
    setConfirmDelete(null);
    setNotice('Resource and its file deleted.');
    await load();
  }

  async function createEvent() {
    if (!eTitle.trim() || !eAt) { setError('Event title and date/time are required.'); return; }
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('events').insert({
      title: eTitle.trim(), description: eDesc.trim(), event_at: new Date(eAt).toISOString(),
      type: eType, venue_or_link: eVenue.trim(), registration_info: eReg.trim(),
      status: eStatus, created_by: session.session?.user.id ?? null,
    });
    setSaving(false);
    if (err) { setError('We could not create the event.'); return; }
    setETitle(''); setEDesc(''); setEAt(''); setEVenue(''); setEReg('');
    setNotice('Event created.');
    await load();
  }

  async function createMentorship() {
    if (!mTitle.trim()) { setError('Mentorship title is required.'); return; }
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('mentorship_opportunities').insert({
      title: mTitle.trim(), description: mDesc.trim(), who_for: mWho.trim(), how_to_apply: mHow.trim(),
      status: mStatus, opportunity_status: mOpen, created_by: session.session?.user.id ?? null,
    });
    setSaving(false);
    if (err) { setError('We could not create the opportunity.'); return; }
    setMTitle(''); setMDesc(''); setMWho(''); setMHow('');
    setNotice('Mentorship opportunity created.');
    await load();
  }

  async function createAnnouncement() {
    if (!aTitle.trim()) { setError('Announcement title is required.'); return; }
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('announcements').insert({
      title: aTitle.trim(), message: aMsg.trim(), status: aStatus, pinned: aPinned,
      published_at: aStatus === 'Published' ? new Date().toISOString() : null,
      created_by: session.session?.user.id ?? null,
    });
    setSaving(false);
    if (err) { setError('We could not create the announcement.'); return; }
    setATitle(''); setAMsg(''); setAPinned(false);
    setNotice('Announcement created.');
    await load();
  }

  async function toggleStatus(table: string, id: string, current: string) {
    const next = current === 'Published' ? 'Draft' : 'Published';
    const { error: err } = await supabase.from(table).update({
      status: next, published_at: next === 'Published' ? new Date().toISOString() : null,
    }).eq('id', id);
    if (err) { setError('We could not update status.'); return; }
    await load();
  }

  async function deleteRow(table: string, id: string) {
    const { error: err } = await supabase.from(table).delete().eq('id', id);
    if (err) { setError('We could not delete.'); return; }
    setConfirmDelete(null);
    await load();
  }

  if (loading) return <PageShell><Spinner label="Loading content…" /></PageShell>;

  const list = tab === 'Resources' ? resources : tab === 'Events' ? events : tab === 'Mentorship' ? mentorship : announcements;
  const filtered = list.filter((r) => {
    const title = String(r.title ?? '').toLowerCase();
    const q = search.trim().toLowerCase();
    const matchSearch = !q || title.includes(q);
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <PageShell>
      <PageHeader title="Content" intro="Resources, Events, Mentorship and Announcements. Drafts are never shown to members. All changes are audit-logged." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Content tabs">
        {(['Resources', 'Events', 'Mentorship', 'Announcements'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`min-h-[44px] rounded-xl px-4 font-semibold ${tab === t ? 'bg-royal text-white' : 'border border-slate-300 bg-white text-navy'}`}>{t}</button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div>
          <label htmlFor="cSearch" className={labelCls}>Search by title</label>
          <input id="cSearch" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} placeholder="Search…" />
        </div>
        <div>
          <label htmlFor="cStatus" className={labelCls}>Filter by status</label>
          <select id="cStatus" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={inputCls}>
            <option value="All">All</option><option value="Draft">Draft</option><option value="Published">Published</option>
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && <EmptyState title="No items found" message="Create one below or try a different search." />}
        {filtered.map((r) => (
          <Card key={String(r.id)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-navy">{String(r.title)}</p>
                <p className="text-sm text-slate-500">
                  {String(r.status)} · {r.published_at ? new Date(String(r.published_at)).toLocaleDateString() : 'Not published'}
                  {r.category ? ` · ${String(r.category)}` : ''}{r.type ? ` · ${String(r.type)}` : ''}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.status === 'Published' ? 'bg-green-100 text-green-900' : 'bg-slate-100 text-slate-700'}`}>{String(r.status)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => toggleStatus(tab === 'Resources' ? 'resources' : tab === 'Events' ? 'events' : tab === 'Mentorship' ? 'mentorship_opportunities' : 'announcements', String(r.id), String(r.status))} className={btnSecondary}>
                {r.status === 'Published' ? 'Unpublish' : 'Publish'}
              </button>
              {confirmDelete === String(r.id) ? (
                <>
                  <button onClick={() => tab === 'Resources' ? deleteResource(r) : deleteRow(tab === 'Events' ? 'events' : tab === 'Mentorship' ? 'mentorship_opportunities' : 'announcements', String(r.id))} disabled={saving} className={btnPrimary}>Confirm delete</button>
                  <button onClick={() => setConfirmDelete(null)} className={btnSecondary}>Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(String(r.id))} className={btnSecondary}>Delete</button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {tab === 'Resources' && (
        <Card className="mt-6">
          <h2 className="font-bold text-navy">Add resource</h2>
          <p className="mt-1 text-sm text-slate-600">Files: PDF, DOCX, PPTX or common images, up to 10 MB. Files are stored privately and opened via short-lived signed URLs.</p>
          <div className="mt-4 space-y-4">
            <div><label htmlFor="rTitle" className={labelCls}>Title</label><input id="rTitle" value={rTitle} onChange={(e) => setRTitle(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="rDesc" className={labelCls}>Description</label><textarea id="rDesc" rows={3} value={rDesc} onChange={(e) => setRDesc(e.target.value)} className={inputCls} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="rCat" className={labelCls}>Category</label>
                <select id="rCat" value={rCat} onChange={(e) => setRCat(e.target.value)} className={inputCls}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div><label htmlFor="rType" className={labelCls}>Type</label>
                <select id="rType" value={rType} onChange={(e) => setRType(e.target.value)} className={inputCls}>
                  {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select></div>
            </div>
            <div className="flex gap-2">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} className={inputCls} placeholder="New category name" aria-label="New category name" />
              <button onClick={addCategory} className={btnSecondary}>Add category</button>
            </div>
            <div><label htmlFor="rFile" className={labelCls}>File (optional)</label>
              <input id="rFile" type="file" accept=".pdf,.docx,.pptx,image/jpeg,image/png,image/webp" onChange={(e) => setRFile(e.target.files?.[0] ?? null)} className={inputCls} /></div>
            <div><label htmlFor="rUrl" className={labelCls}>External link (optional)</label>
              <input id="rUrl" type="url" inputMode="url" value={rUrl} onChange={(e) => setRUrl(e.target.value)} className={inputCls} placeholder="https://…" /></div>
            <div><label htmlFor="rContributor" className={labelCls}>Contributor (optional)</label>
              <input id="rContributor" value={rContributor} onChange={(e) => setRContributor(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="rStatus" className={labelCls}>Status</label>
              <select id="rStatus" value={rStatus} onChange={(e) => setRStatus(e.target.value as 'Draft' | 'Published')} className={inputCls}>
                <option value="Draft">Draft</option><option value="Published">Published</option>
              </select></div>
            <button onClick={createResource} disabled={saving} className={btnPrimary}>{saving ? 'Creating…' : 'Create resource'}</button>
          </div>
        </Card>
      )}

      {tab === 'Events' && (
        <Card className="mt-6">
          <h2 className="font-bold text-navy">Add event</h2>
          <div className="mt-4 space-y-4">
            <div><label htmlFor="eTitle" className={labelCls}>Title</label><input id="eTitle" value={eTitle} onChange={(e) => setETitle(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="eDesc" className={labelCls}>Description</label><textarea id="eDesc" rows={3} value={eDesc} onChange={(e) => setEDesc(e.target.value)} className={inputCls} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="eAt" className={labelCls}>Date and time (WAT)</label><input id="eAt" type="datetime-local" value={eAt} onChange={(e) => setEAt(e.target.value)} className={inputCls} /></div>
              <div><label htmlFor="eType" className={labelCls}>Type</label>
                <select id="eType" value={eType} onChange={(e) => setEType(e.target.value)} className={inputCls}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select></div>
            </div>
            <div><label htmlFor="eVenue" className={labelCls}>Venue or online link</label><input id="eVenue" value={eVenue} onChange={(e) => setEVenue(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="eReg" className={labelCls}>Registration information</label><textarea id="eReg" rows={2} value={eReg} onChange={(e) => setEReg(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="eStatus" className={labelCls}>Status</label>
              <select id="eStatus" value={eStatus} onChange={(e) => setEStatus(e.target.value as 'Draft' | 'Published')} className={inputCls}>
                <option value="Draft">Draft</option><option value="Published">Published</option>
              </select></div>
            <button onClick={createEvent} disabled={saving} className={btnPrimary}>{saving ? 'Creating…' : 'Create event'}</button>
          </div>
        </Card>
      )}

      {tab === 'Mentorship' && (
        <Card className="mt-6">
          <h2 className="font-bold text-navy">Add mentorship opportunity</h2>
          <div className="mt-4 space-y-4">
            <div><label htmlFor="mTitle" className={labelCls}>Title</label><input id="mTitle" value={mTitle} onChange={(e) => setMTitle(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="mDesc" className={labelCls}>Description</label><textarea id="mDesc" rows={3} value={mDesc} onChange={(e) => setMDesc(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="mWho" className={labelCls}>Who it is for</label><input id="mWho" value={mWho} onChange={(e) => setMWho(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="mHow" className={labelCls}>How to apply</label><textarea id="mHow" rows={2} value={mHow} onChange={(e) => setMHow(e.target.value)} className={inputCls} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="mStatus" className={labelCls}>Status</label>
                <select id="mStatus" value={mStatus} onChange={(e) => setMStatus(e.target.value as 'Draft' | 'Published')} className={inputCls}>
                  <option value="Draft">Draft</option><option value="Published">Published</option>
                </select></div>
              <div><label htmlFor="mOpen" className={labelCls}>Opportunity</label>
                <select id="mOpen" value={mOpen} onChange={(e) => setMOpen(e.target.value as 'Open' | 'Closed')} className={inputCls}>
                  <option value="Open">Open</option><option value="Closed">Closed</option>
                </select></div>
            </div>
            <button onClick={createMentorship} disabled={saving} className={btnPrimary}>{saving ? 'Creating…' : 'Create opportunity'}</button>
          </div>
        </Card>
      )}

      {tab === 'Announcements' && (
        <Card className="mt-6">
          <h2 className="font-bold text-navy">Add announcement</h2>
          <div className="mt-4 space-y-4">
            <div><label htmlFor="aTitle" className={labelCls}>Title</label><input id="aTitle" value={aTitle} onChange={(e) => setATitle(e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="aMsg" className={labelCls}>Message</label><textarea id="aMsg" rows={3} value={aMsg} onChange={(e) => setAMsg(e.target.value)} className={inputCls} /></div>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input type="checkbox" checked={aPinned} onChange={(e) => setAPinned(e.target.checked)} className="h-5 w-5 accent-[#1D4ED8]" />
              <span className="text-[15px]">Pinned</span>
            </label>
            <div><label htmlFor="aStatus" className={labelCls}>Status</label>
              <select id="aStatus" value={aStatus} onChange={(e) => setAStatus(e.target.value as 'Draft' | 'Published')} className={inputCls}>
                <option value="Draft">Draft</option><option value="Published">Published</option>
              </select></div>
            <button onClick={createAnnouncement} disabled={saving} className={btnPrimary}>{saving ? 'Creating…' : 'Create announcement'}</button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
