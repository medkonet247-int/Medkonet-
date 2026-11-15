import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, ErrorState, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';

export const DEFAULT_TEMPLATE = `Hello [Applicant Name],

Your application to join MedKonet Nigeria has been approved.

We are pleased to welcome you to a community connecting Medicine and Surgery students across Nigerian universities.

Use the invitation link below to join our official WhatsApp community:

[Insert Official WhatsApp Invitation Link]

We look forward to learning, connecting, and growing together.

MedKonet Nigeria
Connecting Medical Minds, Building Better Futures.`;

export function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [regOpen, setRegOpen] = useState(true);
  const [inviteLink, setInviteLink] = useState('');
  const [template, setTemplate] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [repActive, setRepActive] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('settings').select('key,value');
    if (err) { setError('We could not load settings.'); setLoading(false); return; }
    const map: Record<string, string> = {};
    for (const r of data ?? []) map[r.key] = r.value;
    setRegOpen((map.registration_open ?? 'true') === 'true');
    setInviteLink(map.whatsapp_invite_link ?? '');
    setTemplate(map.invite_template ?? DEFAULT_TEMPLATE);
    setShowLink((map.show_community_link ?? 'false') === 'true');
    setRepActive((map.representative_programme_active ?? 'false') === 'true');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(key: string, value: string) {
    setSaving(true);
    setError('');
    setNotice('');
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from('settings').upsert(
      { key, value, updated_by: session.session?.user.id ?? null }, { onConflict: 'key' }
    );
    setSaving(false);
    if (err) { setError('We could not save settings.'); return; }
    setNotice('Settings saved. This change has been recorded in the audit log.');
  }

  async function saveTemplate() {
    if (!template.includes('[Applicant Name]')) {
      setError('The template is missing the placeholder [Applicant Name]. Add it and try again.');
      return;
    }
    if (!template.includes('[Insert Official WhatsApp Invitation Link]')) {
      setError('The template is missing the placeholder [Insert Official WhatsApp Invitation Link]. Add it and try again.');
      return;
    }
    await save('invite_template', template);
  }

  async function saveInviteLink() {
    const v = inviteLink.trim();
    if (v) {
      try { new URL(v); } catch { setError('Enter a valid URL for the WhatsApp invite link.'); return; }
      if (!/^https:\/\//i.test(v)) { setError('The invite link must start with https://'); return; }
    }
    await save('whatsapp_invite_link', v);
  }

  if (loading) return <PageShell><Spinner label="Loading settings…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Settings" intro="Registration, invitations and programme switches. Every change is audit-logged." />
      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}

      <Card>
        <h2 className="font-bold text-navy">Registration</h2>
        <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3">
          <input type="checkbox" checked={regOpen} onChange={(e) => setRegOpen(e.target.checked)} className="h-5 w-5 accent-[#1D4ED8]" />
          <span className="text-[15px]">Registration open (when closed, Join shows a polite message and the server refuses new sign-ups; existing members can still log in)</span>
        </label>
        <button onClick={() => save('registration_open', regOpen ? 'true' : 'false')} disabled={saving} className={`${btnPrimary} mt-3`}>{saving ? 'Saving…' : 'Save Registration Setting'}</button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold text-navy">Official WhatsApp Community Invitation Link</h2>
        <p className="mt-1 text-sm text-slate-600">Stored in the database, never shown publicly. Validated URL.</p>
        <label htmlFor="inviteLink" className={labelCls}>Invite link</label>
        <input id="inviteLink" type="url" inputMode="url" value={inviteLink} onChange={(e) => setInviteLink(e.target.value)} className={inputCls} placeholder="https://chat.whatsapp.com/…" />
        <button onClick={saveInviteLink} disabled={saving} className={`${btnSecondary} mt-3`}>{saving ? 'Saving…' : 'Save Invite Link'}</button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold text-navy">Invitation Message Template</h2>
        <p className="mt-1 text-sm text-slate-600">Must contain [Applicant Name] and [Insert Official WhatsApp Invitation Link].</p>
        <label htmlFor="template" className={labelCls}>Template</label>
        <textarea id="template" rows={12} value={template} onChange={(e) => setTemplate(e.target.value)} className={inputCls} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={saveTemplate} disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save Template'}</button>
          <button onClick={() => setTemplate(DEFAULT_TEMPLATE)} className={btnSecondary}>Reset to default</button>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold text-navy">Visibility &amp; Programmes</h2>
        <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3">
          <input type="checkbox" checked={showLink} onChange={(e) => setShowLink(e.target.checked)} className="h-5 w-5 accent-[#1D4ED8]" />
          <span className="text-[15px]">Show WhatsApp community link to approved members (OFF by default)</span>
        </label>
        <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-3">
          <input type="checkbox" checked={repActive} onChange={(e) => setRepActive(e.target.checked)} className="h-5 w-5 accent-[#1D4ED8]" />
          <span className="text-[15px]">Representative programme active (OFF by default)</span>
        </label>
        <button onClick={async () => { await save('show_community_link', showLink ? 'true' : 'false'); await save('representative_programme_active', repActive ? 'true' : 'false'); }} disabled={saving} className={`${btnPrimary} mt-3`}>
          {saving ? 'Saving…' : 'Save Visibility & Programmes'}
        </button>
      </Card>
    </PageShell>
  );
}
