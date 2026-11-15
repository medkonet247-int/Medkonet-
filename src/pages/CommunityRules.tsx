import { PageShell, PageHeader, Card } from '../components/ui';
import { useSiteText, t as st } from '../lib/siteText';

export function CommunityRules() {
  const texts = useSiteText('Community Rules');
  return (
    <PageShell>
      <PageHeader title={st(texts, 'rules.title')} intro={st(texts, 'rules.intro')} />
      <Card>
        <ul className="list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-slate-700">
          <li>Be respectful and kind to every member. No harassment, hate speech or bullying.</li>
          <li>Keep discussions academic and supportive. Encourage one another without unhealthy competition.</li>
          <li>Do not share other members&apos; personal information (such as WhatsApp numbers or emails) outside the community without their permission.</li>
          <li>Do not post spam, advertisements or unrelated content.</li>
          <li>Share resources honestly — do not claim authorship of work that is not yours.</li>
          <li>Administrators may remove content or membership that breaks these rules, and will explain their decision where possible.</li>
          <li>Your application details are reviewed by administrators only. They are never published publicly.</li>
        </ul>
      </Card>
    </PageShell>
  );
}
