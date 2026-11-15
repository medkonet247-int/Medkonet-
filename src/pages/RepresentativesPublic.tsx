import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageShell, PageHeader, Card, Spinner, EmptyState } from '../components/ui';

interface Rep { full_name: string; university_name: string; }

export function RepresentativesPublic() {
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: prog } = await supabase.from('settings').select('value').eq('key', 'representative_programme_active').maybeSingle();
      // Note: settings readable only by admins; members use RPC instead.
      const { data, error } = await supabase.rpc('list_public_representatives');
      if (error) { setInactive(true); setLoading(false); return; }
      const list = (data ?? []) as Rep[];
      setReps(list);
      if (list.length === 0) setInactive(true);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageShell><Spinner label="Loading…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="University Representatives" intro="Representatives help welcome new members at their universities. Only representatives who have explicitly consented to be listed appear here." />
      {inactive || reps.length === 0 ? (
        <Card><p className="text-[15px] text-slate-700">The representative programme is not active yet.</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reps.map((r, i) => (
            <Card key={i}>
              <p className="font-bold text-navy">{r.full_name}</p>
              <p className="mt-1 text-sm text-slate-600">{r.university_name}</p>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
