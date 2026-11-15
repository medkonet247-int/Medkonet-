import { ImageSlot } from '../components/ImageSlot';
import { PageShell, PageHeader, Card } from '../components/ui';
import { useSiteText, t as st } from '../lib/siteText';

const values = [
  { title: 'Collaboration', text: 'We learn better together — sharing knowledge and supporting one another across universities.' },
  { title: 'Compassion', text: 'We treat fellow students and future patients with kindness and respect.' },
  { title: 'Academic Excellence', text: 'We pursue deep understanding and high standards in our medical education.' },
  { title: 'Belonging', text: 'Every medical student deserves a community where they are welcomed and supported.' },
  { title: 'Integrity', text: 'We are honest in our work, our communication and our care for one another.' },
  { title: 'Growth', text: 'We encourage one another to keep learning and becoming better every day.' },
];

export function About() {
  const texts = useSiteText('About');
  return (
    <PageShell>
      <PageHeader title={st(texts, 'about.title')} intro={st(texts, 'about.intro')} />
      <ImageSlot slotKey="about-header" className="mb-10 aspect-[16/7] w-full" />
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-extrabold text-navy">{st(texts, 'about.who.heading')}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              MedKonet Nigeria is a community of Medicine and Surgery students across Nigerian universities.
              We connect students to share resources, discuss difficult concepts, find study partners and
              support one another throughout medical school.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold text-navy">{st(texts, 'about.mission.heading')}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Different Universities. One Medical Family. Our mission is to build meaningful academic
              relationships that help every member grow — academically, professionally and personally.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold text-navy">{st(texts, 'about.vision.heading')}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              A future nationwide network of medical students connected through university chapters,
              mentorship initiatives, academic resources, events and collaborations. We present this as
              our ambition, not as an achievement already claimed.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold text-navy">{st(texts, 'about.why.heading')}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Medical school can feel isolating. Students often face difficult concepts, demanding schedules
              and limited access to peers who truly understand the journey. MedKonet exists so no student
              has to figure it all out alone — with a commitment to collaboration and belonging at its heart.
            </p>
          </section>
        </div>
        <ImageSlot slotKey="about-story" className="aspect-[3/2] w-full" />
      </div>
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-navy">{st(texts, 'about.values.heading')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title}>
              <h3 className="font-bold text-navy">{v.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{v.text}</p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
