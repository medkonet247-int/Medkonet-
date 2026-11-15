import { PageShell, PageHeader, Card } from '../components/ui';
import { useSiteText, t as st } from '../lib/siteText';

export function PrivacyNotice() {
  const texts = useSiteText('Privacy Notice');
  return (
    <PageShell>
      <PageHeader title={st(texts, 'privacy.title')} intro={st(texts, 'privacy.intro')} />
      <div className="space-y-4">
        <Card>
          <h2 className="font-bold text-navy">What we collect</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
            When you apply to join, we collect your full name, email address, WhatsApp number, university,
            university type, state, course, current academic level and your reason for joining. We also store
            a hashed verification code to confirm your email.
          </p>
        </Card>
        <Card>
          <h2 className="font-bold text-navy">Why we collect it</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
            To verify your email, review your membership application, and — if approved — invite you to the
            WhatsApp community. We do not sell your data or use it for advertising.
          </p>
        </Card>
        <Card>
          <h2 className="font-bold text-navy">Who can see it</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
            Only MedKonet administrators can read applications. Your WhatsApp number and email are never
            published publicly and are never shown to other students. Verification codes are stored only as
            hashes and expire after 10 minutes.
          </p>
        </Card>
        <Card>
          <h2 className="font-bold text-navy">Contact</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
            Questions about your data? Contact us via the Contact page. We will respond honestly about what
            we hold and help you with access or deletion requests.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
