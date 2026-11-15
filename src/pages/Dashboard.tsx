import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageShell, PageHeader, Card, Spinner } from '../components/ui';
import { BRAND } from '../lib/constants';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const { appUser, loading } = useAuth();
  const [communityLink, setCommunityLink] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; message: string }[]>([]);
  useEffect(() => {
    (async () => {
      const { data: link } = await supabase.rpc('get_community_link');
      setCommunityLink((link as string | null) ?? null);
      const { data: ann } = await supabase.from('announcements')
        .select('id,title,message').eq('status', 'Published')
        .order('pinned', { ascending: false }).order('published_at', { ascending: false }).limit(3);
      setAnnouncements((ann ?? []) as { id: string; title: string; message: string }[]);
    })();
  }, []);
  if (loading) return <PageShell><Spinner label="Loading your dashboard…" /></PageShell>;
  if (!appUser) return <PageShell><p>Please <Link to="/login" className="font-semibold text-royal underline">login</Link>.</p></PageShell>;

  if (!appUser.emailVerified) {
    return (
      <PageShell>
        <PageHeader title="Verify your email" intro="Your account is not verified yet." />
        <Card>
          <p className="text-slate-700">Please verify your email to continue. Check your inbox for the 4-digit code.</p>
          <Link to={`/verify-email?email=${encodeURIComponent(appUser.email)}`} className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-royal px-5 py-2.5 font-semibold text-white">
            Go to Verify Email
          </Link>
        </Card>
      </PageShell>
    );
  }

  if (appUser.role === 'admin') {
    return (
      <PageShell>
        <PageHeader title={`Welcome, ${appUser.fullName || 'Admin'}`} intro="You are signed in as a MedKonet administrator." />
        <Card>
          <Link to="/admin" className="inline-flex min-h-[44px] items-center rounded-xl bg-royal px-5 py-2.5 font-semibold text-white">
            Open Administrator Dashboard
          </Link>
        </Card>
      </PageShell>
    );
  }

  if (appUser.applicationStatus === 'Pending') {
    return (
      <PageShell>
        <PageHeader title="Application received" intro="Thank you for applying to join MedKonet Nigeria." />
        <Card>
          <p className="leading-relaxed text-slate-700">
            Your application is under review. Submitting an application does not guarantee acceptance —
            the MedKonet team will review every application carefully. You will be contacted if your
            application is approved.
          </p>
        </Card>
      </PageShell>
    );
  }

  if (appUser.applicationStatus === 'Rejected') {
    return (
      <PageShell>
        <PageHeader title="Application not approved" intro="Thank you for your interest in MedKonet Nigeria." />
        <Card>
          <p className="leading-relaxed text-slate-700">
            We are sorry — your application was not approved at this time. This is not a reflection of your
            worth as a future medical professional. If you believe this decision was made in error, or if
            your circumstances change, please contact us.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a href={BRAND.whatsappLinks[0]} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-royal px-5 py-2.5 font-semibold text-white">
              Contact via WhatsApp
            </a>
            <a href={`mailto:${BRAND.email}`} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-navy">
              Email us
            </a>
          </div>
        </Card>
      </PageShell>
    );
  }

  // Approved
  return (
    <PageShell>
      <PageHeader title={`Welcome, ${appUser.fullName || 'MedKonet member'}`} intro="You are an approved MedKonet member. Different Universities. One Medical Family." />
      <Card>
        <p className="leading-relaxed text-slate-700">
          Approval does not mean you have joined the WhatsApp community yet — the MedKonet team will send
          your WhatsApp invitation separately. You are only counted as onboarded once the team confirms it.
          In the meantime, explore the members&apos; pages below.
        </p>
        {communityLink && (
          <a href={communityLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-royal px-5 py-2.5 font-semibold text-white">
            Join the WhatsApp community
          </a>
        )}
      </Card>
      {announcements.length > 0 && (
        <Card className="mt-4">
          <h2 className="font-bold text-navy">Latest announcements</h2>
          <ul className="mt-2 space-y-2">
            {announcements.map((a) => (
              <li key={a.id} className="text-[15px] text-slate-700"><strong>{a.title}:</strong> {a.message}</li>
            ))}
          </ul>
        </Card>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { to: '/community', title: 'Community', text: 'Connect with fellow medical students.' },
          { to: '/resources', title: 'Academic Resources', text: 'Discover shared study materials.' },
          { to: '/mentorship', title: 'Mentorship', text: 'Learn about our mentorship vision.' },
          { to: '/events', title: 'Events', text: 'See upcoming academic events.' },
          { to: '/directory', title: 'University Directory', text: 'Browse verified universities.' },
          { to: '/representatives', title: 'University Representatives', text: 'Meet listed representatives.' },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-royal">
            <p className="font-bold text-navy">{l.title}</p>
            <p className="mt-1 text-[15px] text-slate-600">{l.text}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
