import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { PageShell, PageHeader, Card, Spinner, EmptyState, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

interface Application {
  id: string; user_id: string; full_name: string; email: string; whatsapp_number: string;
  university: string; university_type: string; state: string; course: string; current_level: string;
  reason_for_joining: string; application_status: 'Pending' | 'Approved' | 'Rejected';
  rejection_reason: string | null; invited_at: string | null; invited_by: string | null;
  reviewed_at: string | null; reviewed_by: string | null; submitted_at: string;
  onboarding_confirmed_at: string | null; university_id: string | null;
}

const PAGE_SIZE = 10;

export function AdminDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [uniFilter, setUniFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ app: Application; status: 'Approved' | 'Rejected' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteDraft, setInviteDraft] = useState('');
  const [inviteTemplate, setInviteTemplate] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.from('applications')
      .select('*').order('submitted_at', { ascending: false });
    if (err) { setError('We could not load applications.'); setLoading(false); return; }
    setApps((data ?? []) as Application[]);
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'whatsapp_invite_link').maybeSingle();
    setInviteLink(settings?.value ?? '');
    setInviteDraft(settings?.value ?? '');
    const { data: tpl } = await supabase.from('settings').select('value').eq('key', 'invite_template').maybeSingle();
    setInviteTemplate(tpl?.value ?? '');
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const counts = {
    total: apps.length,
    pending: apps.filter((a) => a.application_status === 'Pending').length,
    approved: apps.filter((a) => a.application_status === 'Approved').length,
    rejected: apps.filter((a) => a.application_status === 'Rejected').length,
    universities: new Set(apps.map((a) => a.university)).size,
    states: new Set(apps.map((a) => a.state)).size,
  };

  const filtered = apps.filter((a) => {
    const matchFilter = filter === 'All' || a.application_status === filter;
    const matchUni = uniFilter === 'All' || a.university === uniFilter;
    const matchState = stateFilter === 'All' || a.state === stateFilter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    return matchFilter && matchUni && matchState && matchSearch;
  }).sort((a, b) => sort === 'newest'
    ? new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    : new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function changeStatus(app: Application, status: 'Approved' | 'Rejected') {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const actor = session.session?.user.id ?? null;
    const { error: err } = await supabase.from('applications').update({
      application_status: status,
      rejection_reason: status === 'Rejected' ? rejectionReason.trim() || null : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: actor,
    }).eq('id', app.id);
    setSaving(false);
    if (err) { setError('We could not update this application.'); return; }
    setConfirmAction(null);
    setRejectionReason('');
    setSelected(null);
    await load();
  }

  async function saveInviteLink() {
    setSaving(true);
    const value = inviteDraft.trim();
    if (value) {
      try { new URL(value); } catch { setError('Enter a valid URL for the WhatsApp invite link.'); setSaving(false); return; }
      if (!/^https:\/\//i.test(value)) { setError('The invite link must start with https://'); setSaving(false); return; }
    }
    const { data: session } = await supabase.auth.getSession();
    const actor = session.session?.user.id ?? null;
    const { error: err } = await supabase.from('settings').upsert(
      { key: 'whatsapp_invite_link', value, updated_by: actor }, { onConflict: 'key' }
    );
    setSaving(false);
    if (err) { setError('We could not save the invite link.'); return; }
    setInviteLink(value);
    setInviteMsg('Invite link saved.');
  }

  async function markInvited(app: Application) {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const actor = session.session?.user.id ?? null;
    const { error: err } = await supabase.from('applications').update({
      invited_at: new Date().toISOString(), invited_by: actor,
    }).eq('id', app.id);
    setSaving(false);
    if (err) { setError('We could not mark this applicant as invited.'); return; }
    setSelected(null);
    await load();
  }

  function inviteMessage(app: Application): string {
    if (inviteTemplate) {
      return inviteTemplate
        .split('[Applicant Name]').join(app.full_name)
        .split('[Insert Official WhatsApp Invitation Link]').join(inviteLink);
    }
    return `Hello ${app.full_name}, welcome to MedKonet Nigeria! You have been approved. Join our WhatsApp community here: ${inviteLink}`;
  }

  if (loading) return <PageShell><Spinner label="Loading applications…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Administrator Dashboard" intro="Review membership applications. Real counts only." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/admin/media" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Media</Link>
        <Link to="/admin/settings" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Settings</Link>
        <Link to="/admin/members" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Members</Link>
        <Link to="/admin/admins" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Administrators</Link>
        <Link to="/admin/content" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Content</Link>
        <Link to="/admin/site-text" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Site Text</Link>
        <Link to="/admin/universities" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Universities</Link>
        <Link to="/admin/reports" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Reports</Link>
        <Link to="/admin/representatives" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Representatives</Link>
        <Link to="/admin/audit" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">Audit Log</Link>
      </div>
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Pending', value: counts.pending },
          { label: 'Approved', value: counts.approved },
          { label: 'Rejected', value: counts.rejected },
          { label: 'Universities represented', value: counts.universities },
          { label: 'States represented', value: counts.states },
        ].map((c) => (
          <Card key={c.label} className="text-center">
            <p className="text-3xl font-extrabold text-navy">{c.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{c.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-bold text-navy">WhatsApp Community Invite Link (Settings)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Stored in the database and never shown publicly. If it is not set, the invitation button is disabled.
        </p>
        <label htmlFor="inviteLink" className={labelCls}>Official WhatsApp invite link</label>
        <input id="inviteLink" type="url" inputMode="url" value={inviteDraft}
          onChange={(e) => setInviteDraft(e.target.value)} className={inputCls} placeholder="https://chat.whatsapp.com/…" />
        {inviteMsg && <p role="status" className="mt-2 text-sm text-green-800">{inviteMsg}</p>}
        <button onClick={saveInviteLink} disabled={saving} className={`${btnSecondary} mt-3`}>
          {saving ? 'Saving…' : 'Save Invite Link'}
        </button>
        {!inviteLink && (
          <p className="mt-2 text-sm font-medium text-amber-800">No invite link set yet — add it above to enable invitations.</p>
        )}
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="search" className={labelCls}>Search by name or email</label>
          <input id="search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={inputCls} placeholder="Search…" />
        </div>
        <div>
          <label htmlFor="filter" className={labelCls}>Filter by status</label>
          <select id="filter" value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }} className={inputCls}>
            <option value="All">All</option><option value="Pending">Pending</option>
            <option value="Approved">Approved</option><option value="Rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label htmlFor="uniFilter" className={labelCls}>Filter by university</label>
          <select id="uniFilter" value={uniFilter} onChange={(e) => { setUniFilter(e.target.value); setPage(1); }} className={inputCls}>
            <option value="All">All universities</option>
            {Array.from(new Set(apps.map((a) => a.university))).sort().map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="stateFilter" className={labelCls}>Filter by state</label>
          <select id="stateFilter" value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); setPage(1); }} className={inputCls}>
            <option value="All">All states</option>
            {Array.from(new Set(apps.map((a) => a.state))).sort().map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className={labelCls}>Sort</label>
          <select id="sort" value={sort} onChange={(e) => { setSort(e.target.value as 'newest' | 'oldest'); setPage(1); }} className={inputCls}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {pageItems.length === 0 && <EmptyState title="No applications found" message="Try a different search or filter." />}
        {pageItems.map((app) => (
          <Card key={app.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-navy">{app.full_name}</p>
                <p className="text-sm text-slate-600 break-all">{app.email}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {app.university} · {app.state} · Submitted {new Date(app.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${app.application_status === 'Approved' ? 'bg-green-100 text-green-900' : app.application_status === 'Rejected' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'}`}>
                {app.application_status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setSelected(app)} className={btnSecondary}>View details</button>
              <button onClick={() => setConfirmAction({ app, status: 'Approved' })} className={btnPrimary}>Approve</button>
              <button onClick={() => setConfirmAction({ app, status: 'Rejected' })} className={btnSecondary}>Reject</button>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btnSecondary}>Previous</button>
          <p className="text-sm text-slate-600">Page {page} of {totalPages}</p>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={btnSecondary}>Next</button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Application details">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-extrabold text-navy">Application details</h2>
              <button onClick={() => setSelected(null)} aria-label="Close details" className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 px-3">✕</button>
            </div>
            <dl className="mt-4 space-y-3 text-[15px]">
              {[
                ['Full name', selected.full_name], ['Email', selected.email],
                ['WhatsApp number', selected.whatsapp_number], ['University', selected.university],
                ['University type', selected.university_type], ['State', selected.state],
                ['Course', selected.course], ['Current level', selected.current_level],
                ['Why join', selected.reason_for_joining], ['Status', selected.application_status],
                ['Submitted', new Date(selected.submitted_at).toLocaleString()],
                ['Reviewed', selected.reviewed_at ? new Date(selected.reviewed_at).toLocaleString() : '—'],
                ['Reviewed by', selected.reviewed_by ?? '—'],
                ['Rejection reason', selected.rejection_reason ?? '—'],
                ['Invited at', selected.invited_at ? new Date(selected.invited_at).toLocaleString() : 'Not invited'],
                ['Onboarded at', selected.onboarding_confirmed_at ? new Date(selected.onboarding_confirmed_at).toLocaleString() : 'Not confirmed'],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-3">
                  <dt className="font-semibold text-navy">{k}</dt><dd className="text-slate-700 break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
              <div>
                <h3 className="font-bold text-navy">WhatsApp invitation</h3>
                <label htmlFor="invitePreview" className={labelCls}>Editable message preview</label>
                <textarea id="invitePreview" rows={4} defaultValue={inviteMessage(selected)} className={inputCls} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={inviteLink ? `https://wa.me/${selected.whatsapp_number}?text=${encodeURIComponent(inviteMessage(selected))}` : undefined}
                    target="_blank" rel="noreferrer"
                    aria-disabled={!inviteLink}
                    className={`${btnPrimary} ${!inviteLink ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Send WhatsApp Invitation
                  </a>
                  <button onClick={() => markInvited(selected)} disabled={saving} className={btnSecondary}>
                    {saving ? 'Saving…' : 'Mark as invited'}
                  </button>
                </div>
                {!inviteLink && <p className="mt-2 text-sm text-amber-800">Add the official WhatsApp invite link in Settings above to enable invitations.</p>}
                <p className="mt-2 text-sm text-slate-500">Opening the link does not mark the applicant as invited — use “Mark as invited” separately.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-label="Confirm decision">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-lg font-extrabold text-navy">
              {confirmAction.status === 'Approved' ? 'Approve' : 'Reject'} this application?
            </h2>
            <p className="mt-2 text-[15px] text-slate-600">
              {confirmAction.app.full_name} ({confirmAction.app.email}) — current status: {confirmAction.app.application_status}.
              You can change this decision later.
            </p>
            {confirmAction.status === 'Rejected' && (
              <div className="mt-4">
                <label htmlFor="rejectionReason" className={labelCls}>Internal rejection reason (optional)</label>
                <textarea id="rejectionReason" rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className={inputCls} />
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button onClick={() => changeStatus(confirmAction.app, confirmAction.status)} disabled={saving} className={btnPrimary}>
                {saving ? 'Saving…' : `Confirm ${confirmAction.status}`}
              </button>
              <button onClick={() => { setConfirmAction(null); setRejectionReason(''); }} className={btnSecondary}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
