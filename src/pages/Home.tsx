import { Link } from 'react-router-dom';
import { ImageSlot } from '../components/ImageSlot';
import { Card } from '../components/ui';
import { useSiteText, t as st } from '../lib/siteText';

const offers = [
  { title: 'Student Networking', text: 'Meet Medicine and Surgery students across Nigerian universities and build meaningful academic relationships.' },
  { title: 'Academic Resource Sharing', text: 'Share and discover study materials contributed by fellow medical students.' },
  { title: 'Peer Learning', text: 'Discuss difficult concepts together and learn from one another.' },
  { title: 'Mentorship and Guidance', text: 'Discover mentorship opportunities and guidance from peers further along the journey.' },
  { title: 'Study Partnerships', text: 'Find supportive study partners for revision, reading groups and exam preparation.' },
  { title: 'Events and Academic Collaboration', text: 'Take part in academic events and collaborations with fellow medical students.' },
];

const benefits = [
  'Build connections across universities',
  'Access shared academic resources',
  'Learn from fellow medical students',
  'Find supportive study partners',
  'Discover mentorship opportunities',
  'Stay encouraged throughout medical school',
  'Develop professional relationships',
];

export function Home() {
  const texts = useSiteText('Home');
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-[#0F2B5B] to-royal text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">{st(texts, 'home.hero.eyebrow')}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {st(texts, 'home.hero.headline')}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg">{st(texts, 'home.hero.supporting')}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/join" className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-6 py-3 text-[16px] font-bold text-navy shadow hover:bg-blue-50">
                {st(texts, 'home.hero.primary')}
              </Link>
              <Link to="/join" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-[16px] font-semibold text-white hover:bg-white/10">
                {st(texts, 'home.hero.secondary')}
              </Link>
            </div>
          </div>
          <ImageSlot slotKey="home-hero" className="aspect-[3/2] w-full shadow-lg" />
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'home.mission.heading')}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{st(texts, 'home.mission.text')}</p>
          </div>
          <ImageSlot slotKey="home-mission" className="aspect-[3/2] w-full" />
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'home.offers.heading')}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <Card key={o.title}>
                <h3 className="font-bold text-navy">{o.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{o.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'home.benefits.heading')}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-royal text-xs font-bold text-white">✓</span>
              <span className="text-[15px] text-slate-700">{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Belonging */}
      <section className="bg-slate-50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center">
          <ImageSlot slotKey="home-belonging" className="aspect-[3/2] w-full" />
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'home.belonging.heading')}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{st(texts, 'home.belonging.text')}</p>
          </div>
        </div>
      </section>

      {/* Growth vision */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-royal p-6 text-white sm:p-10">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{st(texts, 'home.vision.heading')}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-blue-100">{st(texts, 'home.vision.text')}</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">{st(texts, 'home.cta.heading')}</h2>
          <Link to="/join" className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-royal px-7 py-3 text-[16px] font-bold text-white hover:bg-royal-700">
            {st(texts, 'home.cta.button')}
          </Link>
        </div>
      </section>
    </main>
  );
}
