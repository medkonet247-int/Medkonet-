import { Link } from 'react-router-dom';

/**
 * LOGO PLACEHOLDER — single component used everywhere (header, footer, login, join).
 * To use your real logo: replace the placeholder box below with
 *   <img src="/logo.png" alt="MedKonet Nigeria logo" className="h-10 w-auto" />
 * and place your file in /public/logo.png. No other file needs changing.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 min-h-[44px]" aria-label="MedKonet Nigeria — home">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-white text-sm font-bold tracking-tight"
      >
        MK
      </span>
      <span className="leading-tight">
        <span className="block text-[17px] font-bold text-navy">MedKonet Nigeria</span>
        {!compact && (
          <span className="block text-[11px] font-medium text-slate-500">
            Connecting Medical Minds, Building Better Futures
          </span>
        )}
      </span>
    </Link>
  );
}
