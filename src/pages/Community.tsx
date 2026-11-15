import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageSlot } from '../components/ImageSlot';
import { PageShell, PageHeader, Card, Spinner, ErrorState } from '../components/ui';
import { useSiteText, t } from '../lib/siteText';
import { supabase } from '../lib/supabase';

interface Announcement { id: string; title: string; message: string; pinned: boolean; published_at: string | null; }

export function Community() {
  const texts = useSiteText('Community');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.from('announcements')
        .select('id,title,message,pinned,published_at')
        .eq('status', 'Published').order('pinned', { ascending: false }).order('published_at', { ascending: false });
      if (err) setError('We could not load announcements.');
      setAnnouncements((data ?? []) as Announcement[]);
      setLoading(false);
    })();
  }, []);

  return (
    <PageShell>
      <PageHeader title={t(texts, 'community.title')} intro={t(texts, 'community.intro')} />
      <ImageSlot slotKey="community-header" className="mb-10 aspect-[16/7] w-full" />
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-bold text-navy">Purpose</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            A welcoming space for Medicine and Surgery students across Nigerian universities to connect,
            exchange knowledge and grow together.
          </p>
        </Card>
        <Card>
          <h2 className="font-bold text-navy">Participation expectations</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Be respectful, keep discussions academic and supportive, and protect other members&apos; privacy.
            Please read the <Link to="/community-rules" className="font-semibold text-royal underline">Community Rules</Link>.
          </p>
        </Card>
        <Card>
          <h2 className="font-bold text-navy">Respectful communication</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Encourage one another without unhealthy competition. Ask questions, share challenges and learn
            alongside peers.
          </p>
        </Card>
        <Card>
          <h2 className="font-bold text-navy">Resource-sharing guidelines</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Share resources honestly and do not claim authorship of work that is not yours. Do not share other
            members&apos; personal information without permission.
          </p>
        </Card>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl font-extrabold text-navy">Announcements</h2>
        {loading ? <div className="mt-4"><Spinner label="Loading announcements…" /></div> : announcements.length === 0 ? (
          <Card className="mt-4"><p className="text-[15px] text-slate-600">No announcements yet. Check back soon.</p></Card>
        ) : (
          <div className="mt-4 space-y-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <p className="font-bold text-navy">{a.title}{a.pinned ? ' · Pinned' : ''}</p>
                {a.published_at && <p className="text-sm text-slate-500">{new Date(a.published_at).toLocaleDateString()}</p>}
                <p className="mt-2 text-[15px] text-slate-700">{a.message}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
