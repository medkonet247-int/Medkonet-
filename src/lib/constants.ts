export const BRAND = {
  name: 'MedKonet Nigeria',
  tagline: 'Connecting Medical Minds, Building Better Futures',
  statement: 'Different Universities. One Medical Family.',
  whatsappLinks: ['https://wa.link/fwg87s', 'https://wa.link/i54hf5'],
  email: 'adorableodobe@gmail.com',
};

export const IMAGE_SLOTS = [
  { key: 'home-hero', label: 'Home hero', alt: 'Medical students collaborating with stethoscope and anatomy artwork' },
  { key: 'home-mission', label: 'Home mission section', alt: 'Abstract medical network connecting universities' },
  { key: 'home-belonging', label: 'Home belonging section', alt: 'Supportive study scene with medical students' },
  { key: 'about-header', label: 'About page header', alt: 'Medical education and community artwork' },
  { key: 'about-story', label: 'About story section', alt: 'Students learning together with medical books' },
  { key: 'community-header', label: 'Community page header', alt: 'Diverse medical students connected as one family' },
  { key: 'join-side', label: 'Join page side panel', alt: 'Welcoming medical students joining MedKonet' },
] as const;

export type ImageSlotKey = (typeof IMAGE_SLOTS)[number]['key'];
