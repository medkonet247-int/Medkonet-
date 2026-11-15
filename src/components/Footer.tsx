import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { BRAND } from '../lib/constants';
import { useSiteText, t } from '../lib/siteText';

export function Footer() {
  const texts = useSiteText('Footer');
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo compact />
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{t(texts, 'footer.tagline')}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-1 sm:flex sm:flex-wrap sm:items-center">
            <Link to="/community" className="flex min-h-[44px] items-center text-[14px] font-medium text-slate-700 hover:text-royal">Community</Link>
            <Link to="/community-rules" className="flex min-h-[44px] items-center text-[14px] font-medium text-slate-700 hover:text-royal">Community Rules</Link>
            <Link to="/privacy" className="flex min-h-[44px] items-center text-[14px] font-medium text-slate-700 hover:text-royal">Privacy Notice</Link>
            <Link to="/contact" className="flex min-h-[44px] items-center text-[14px] font-medium text-slate-700 hover:text-royal">Contact</Link>
            <a href={BRAND.whatsappLinks[0]} target="_blank" rel="noreferrer" className="flex min-h-[44px] items-center text-[14px] font-medium text-slate-700 hover:text-royal">WhatsApp</a>
            <a href={`mailto:${BRAND.email}`} className="flex min-h-[44px] items-center text-[14px] font-medium text-slate-700 hover:text-royal">Email us</a>
          </nav>
        </div>
        <p className="mt-4 border-t border-slate-100 pt-3 text-[14px] text-slate-500">
          © {new Date().getFullYear()} MedKonet Nigeria. {t(texts, 'footer.copyright')}
        </p>
      </div>
    </footer>
  );
}
