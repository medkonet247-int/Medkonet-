import { PageShell, PageHeader, Card } from '../components/ui';
import { BRAND } from '../lib/constants';
import { useSiteText, t as st } from '../lib/siteText';

export function Contact() {
  const texts = useSiteText('Contact');
  return (
    <PageShell>
      <PageHeader title={st(texts, 'contact.title')} intro={st(texts, 'contact.intro')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-navy">{st(texts, 'contact.whatsapp.heading')}</h2>
          <p className="mt-2 text-[15px] text-slate-600">Message us on WhatsApp:</p>
          <ul className="mt-3 space-y-2">
            {BRAND.whatsappLinks.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center font-semibold text-royal underline underline-offset-4">
                  Chat on WhatsApp
                </a>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-navy">{st(texts, 'contact.email.heading')}</h2>
          <p className="mt-2 text-[15px] text-slate-600">Send us an email:</p>
          <a href={`mailto:${BRAND.email}`} className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-royal underline underline-offset-4 break-all">
            {BRAND.email}
          </a>
        </Card>
      </div>
    </PageShell>
  );
}
