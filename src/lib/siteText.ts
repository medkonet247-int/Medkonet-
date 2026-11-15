import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/** Original wording kept in code as fallback (matches 012 seed character for character). */
export const SITE_TEXT_DEFAULTS: Record<string, string> = {
  'header.home': 'Home', 'header.about': 'About', 'header.community': 'Community',
  'header.resources': 'Resources', 'header.mentorship': 'Mentorship', 'header.events': 'Events',
  'header.contact': 'Contact', 'header.join': 'Join MedKonet', 'header.login': 'Login',
  'header.dashboard': 'Dashboard', 'header.logout': 'Logout',
  'home.hero.eyebrow': 'MedKonet Nigeria',
  'home.hero.headline': 'Your Medical Journey, Stronger Together.',
  'home.hero.supporting': 'Connect with Medicine and Surgery students across Nigerian universities, exchange knowledge, discover opportunities, and grow alongside people who understand your journey.',
  'home.hero.primary': 'Become a Member', 'home.hero.secondary': 'Explore Our Community',
  'home.mission.heading': 'Different Universities. One Medical Family.',
  'home.mission.text': 'MedKonet connects students to share resources, discuss difficult concepts, find study partners, support one another and build meaningful academic relationships — across universities, as one family.',
  'home.offers.heading': 'What We Offer', 'home.benefits.heading': 'Community Benefits',
  'home.belonging.heading': "You Don't Have to Figure It All Out Alone.",
  'home.belonging.text': 'Students can find encouragement, ask questions, share challenges and learn alongside peers without fear of unhealthy competition. Collaboration, compassion and belonging come first.',
  'home.vision.heading': 'Our Growth Vision',
  'home.vision.text': 'We aspire to grow into a nationwide network with university chapters, mentorship initiatives, academic resources, events and collaborations. These are future ambitions — not achievements we claim today.',
  'home.cta.heading': "Your Journey Matters. Let's Grow Together.",
  'home.cta.button': 'Apply to Join MedKonet',
  'about.title': 'About MedKonet Nigeria', 'about.intro': 'Connecting Medical Minds, Building Better Futures.',
  'about.who.heading': 'Who We Are',
  'about.who.text': 'MedKonet Nigeria is a community of Medicine and Surgery students across Nigerian universities. We connect students to share resources, discuss difficult concepts, find study partners and support one another throughout medical school.',
  'about.mission.heading': 'Our Mission',
  'about.mission.text': 'Different Universities. One Medical Family. Our mission is to build meaningful academic relationships that help every member grow — academically, professionally and personally.',
  'about.vision.heading': 'Our Vision',
  'about.vision.text': 'A future nationwide network of medical students connected through university chapters, mentorship initiatives, academic resources, events and collaborations. We present this as our ambition, not as an achievement already claimed.',
  'about.why.heading': 'Why MedKonet Exists',
  'about.why.text': 'Medical school can feel isolating. Students often face difficult concepts, demanding schedules and limited access to peers who truly understand the journey. MedKonet exists so no student has to figure it all out alone — with a commitment to collaboration and belonging at its heart.',
  'about.values.heading': 'Our Core Values',
  'contact.title': 'Contact MedKonet', 'contact.intro': 'We would love to hear from you. Reach us through any of the options below.',
  'contact.whatsapp.heading': 'WhatsApp', 'contact.email.heading': 'Email',
  'join.title': 'Join MedKonet Nigeria',
  'join.intro': 'Apply for membership. Submitting this form does not guarantee acceptance — every application is reviewed by the MedKonet team. Your WhatsApp number and email are never published publicly.',
  'join.submit': 'Submit Application',
  'join.helper.whatsapp': 'Stored in international format. Never published publicly.',
  'login.title': 'Login to MedKonet', 'verify.title': 'Verify Your Email',
  'forgot.title': 'Forgot Password', 'reset.title': 'Set a New Password',
  'community.title': 'Our Community', 'community.intro': 'A welcoming space for Medicine and Surgery students across Nigerian universities.',
  'resources.title': 'Academic Resources', 'resources.intro': 'Shared academic resources from fellow medical students.',
  'mentorship.title': 'Mentorship', 'mentorship.intro': 'Guidance from peers further along the medical journey.',
  'events.title': 'Events', 'events.intro': 'Academic events and collaborations with fellow medical students.',
  'footer.tagline': 'Connecting Medical Minds, Building Better Futures. Different Universities. One Medical Family.',
  'footer.copyright': 'All rights reserved.',
  'rules.title': 'Community Rules', 'rules.intro': 'Simple, honest rules that describe how MedKonet Nigeria really works.',
  'privacy.title': 'Privacy Notice', 'privacy.intro': 'What we collect, why, and who can see it — in plain language.',
};

/**
 * One bundle fetch per page (not per text). Defaults render immediately (no flicker);
 * if the DB is unreachable or a value is missing/empty, the default is shown — never blank.
 */
export function useSiteText(page: string): Record<string, string> {
  const [texts, setTexts] = useState<Record<string, string>>(SITE_TEXT_DEFAULTS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('site_text').select('key,current_value').eq('page', page);
      if (error || cancelled || !data) return;
      const merged = { ...SITE_TEXT_DEFAULTS };
      for (const row of data) {
        const v = (row.current_value ?? '').trim();
        if (v) merged[row.key] = row.current_value;
      }
      setTexts(merged);
    })();
    return () => { cancelled = true; };
  }, [page]);
  return texts;
}

export function t(texts: Record<string, string>, key: string): string {
  const v = (texts[key] ?? '').trim();
  return v || SITE_TEXT_DEFAULTS[key] || key;
}
