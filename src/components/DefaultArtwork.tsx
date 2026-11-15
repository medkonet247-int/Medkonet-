/**
 * Generated medical-themed SVG artwork (no external images, no hotlinks).
 * Each slot has distinct inline SVG: stethoscope, anatomy lines, study scenes,
 * abstract medical shapes. Every slot is paired with descriptive alt text
 * via the wrapping <img>-like figure role in ImageSlot.
 */
export function DefaultArtwork({ slotKey }: { slotKey: string }) {
  const common = 'h-full w-full';
  if (slotKey === 'home-hero') {
    return (
      <svg viewBox="0 0 640 420" role="img" aria-label="Medical students collaborating with stethoscope and anatomy artwork" className={common} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0B1F3A" /><stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <rect width="640" height="420" fill="url(#heroBg)" />
        <circle cx="520" cy="90" r="120" fill="#0EA5E9" opacity="0.18" />
        <circle cx="120" cy="340" r="90" fill="#ffffff" opacity="0.08" />
        {/* stethoscope */}
        <path d="M320 90 v70 c0 40 30 60 60 60 s60-20 60-60 v-10" fill="none" stroke="#7DD3FC" strokeWidth="10" strokeLinecap="round" />
        <circle cx="320" cy="80" r="22" fill="none" stroke="#7DD3FC" strokeWidth="10" />
        <circle cx="440" cy="140" r="26" fill="#E0F2FE" />
        <circle cx="440" cy="140" r="12" fill="#1D4ED8" />
        {/* ECG line */}
        <path d="M60 300 h120 l20-50 30 90 25-60 15 20 h310" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {/* cross */}
        <g fill="#ffffff" opacity="0.9">
          <rect x="150" y="120" width="18" height="54" rx="4" /><rect x="132" y="138" width="54" height="18" rx="4" />
        </g>
        <text x="320" y="370" textAnchor="middle" fill="#E0F2FE" fontSize="20" fontFamily="system-ui" fontWeight="600">Different Universities. One Medical Family.</text>
      </svg>
    );
  }
  if (slotKey === 'home-mission') {
    return (
      <svg viewBox="0 0 640 420" role="img" aria-label="Abstract medical network connecting universities" className={common} preserveAspectRatio="xMidYMid slice">
        <rect width="640" height="420" fill="#EFF6FF" />
        <g stroke="#93C5FD" strokeWidth="3">
          <line x1="320" y1="210" x2="140" y2="110" /><line x1="320" y1="210" x2="500" y2="110" />
          <line x1="320" y1="210" x2="140" y2="310" /><line x1="320" y1="210" x2="500" y2="310" />
          <line x1="320" y1="210" x2="320" y2="70" />
        </g>
        <circle cx="320" cy="210" r="46" fill="#1D4ED8" />
        <g fill="#ffffff"><rect x="313" y="188" width="14" height="44" rx="3" /><rect x="299" y="202" width="42" height="14" rx="3" /></g>
        {[[140,110],[500,110],[140,310],[500,310],[320,70]].map(([x,y],i) => (
          <g key={i}><circle cx={x} cy={y} r="30" fill="#0EA5E9" /><circle cx={x} cy={y} r="12" fill="#E0F2FE" /></g>
        ))}
      </svg>
    );
  }
  if (slotKey === 'home-belonging') {
    return (
      <svg viewBox="0 0 640 420" role="img" aria-label="Supportive study scene with medical students" className={common} preserveAspectRatio="xMidYMid slice">
        <rect width="640" height="420" fill="#F8FAFC" />
        <rect x="60" y="250" width="520" height="14" rx="7" fill="#CBD5E1" />
        {[150, 320, 490].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="170" r="42" fill={i === 1 ? '#1D4ED8' : '#0EA5E9'} />
            <path d={`M${x-55} 250 c0-45 25-65 55-65 s55 20 55 65 z`} fill={i === 1 ? '#0B1F3A' : '#334155'} />
          </g>
        ))}
        <path d="M240 150 q80-40 160 0" fill="none" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 14" />
        <rect x="270" y="285" width="100" height="70" rx="8" fill="#ffffff" stroke="#CBD5E1" strokeWidth="3" />
        <path d="M285 310 h70 M285 325 h50" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }
  if (slotKey === 'about-header' || slotKey === 'community-header') {
    return (
      <svg viewBox="0 0 640 420" role="img" aria-label="Medical education and community artwork" className={common} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="abBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1D4ED8" /><stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
        <rect width="640" height="420" fill="url(#abBg)" />
        <path d="M0 300 Q160 220 320 300 T640 300 V420 H0 Z" fill="#0B1F3A" opacity="0.25" />
        <g fill="#ffffff" opacity="0.95">
          <rect x="300" y="120" width="40" height="120" rx="10" /><rect x="260" y="160" width="120" height="40" rx="10" />
        </g>
        <path d="M80 340 h140 l18-44 26 80 22-52 14 16 h260" fill="none" stroke="#E0F2FE" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (slotKey === 'about-story') {
    return (
      <svg viewBox="0 0 640 420" role="img" aria-label="Students learning together with medical books" className={common} preserveAspectRatio="xMidYMid slice">
        <rect width="640" height="420" fill="#EFF6FF" />
        <rect x="120" y="110" width="180" height="220" rx="12" fill="#ffffff" stroke="#BFDBFE" strokeWidth="4" />
        <rect x="340" y="110" width="180" height="220" rx="12" fill="#ffffff" stroke="#BFDBFE" strokeWidth="4" />
        <path d="M145 150 h130 M145 180 h130 M145 210 h90 M365 150 h130 M365 180 h130 M365 210 h90" stroke="#94A3B8" strokeWidth="8" strokeLinecap="round" />
        <path d="M300 150 v140" stroke="#1D4ED8" strokeWidth="6" />
        <circle cx="320" cy="370" r="10" fill="#0EA5E9" />
      </svg>
    );
  }
  // join-side default
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Welcoming medical students joining MedKonet" className={common} preserveAspectRatio="xMidYMid slice">
      <rect width="640" height="420" fill="#0B1F3A" />
      <circle cx="320" cy="190" r="110" fill="#1D4ED8" opacity="0.5" />
      <g fill="#ffffff">
        <rect x="305" y="130" width="30" height="120" rx="8" /><rect x="260" y="175" width="120" height="30" rx="8" />
      </g>
      <path d="M60 350 h140 l18-44 26 80 22-52 14 16 h300" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
