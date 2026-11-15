import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Spinner, EmptyState, ErrorState, Card } from '../components/ui';

interface LogRow { id: string; actor_id: string | null; action: string; target_id: string | null; details: Record<string, unknown>; created_at: string; }

export function AdminAudit() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('audit_log')
      .select('*').order('created_at', { ascending: false }).limit(200);
    if (err) { setError('We could not load the audit log.'); setLoading(false); return; }
    setRows((data ?? []) as LogRow[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (loading) return <PageShell><Spinner label="Loading audit log…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Audit Log" intro="Read-only. Approvals, rejections, invitations, onboarding, settings, admin grants, content, university and representative changes." />
      {error && <ErrorState message={error} onRetry={load} />}
      {rows.length === 0 && <EmptyState title="No audit entries yet" message="Actions will be recorded here." />}
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <p className="font-bold text-navy">{r.action}</p>
            <p className="mt-1 text-sm text-slate-600">Administrator: {r.actor_id ?? '—'} · Target: {r.target_id ?? '—'}</p>
            <p className="text-sm text-slate-500">{new Date(r.created_at).toLocaleString()}</p>
            <details className="mt-2">
              <summary className="min-h-[44px] cursor-pointer text-sm font-semibold text-royal">Details</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(r.details, null, 2)}</pre>
            </details>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
