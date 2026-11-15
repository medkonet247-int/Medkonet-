import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useSiteText, t } from '../lib/siteText';

export function Header() {
  const { appUser, signOut } = useAuth();
  const texts = useSiteText('Header');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = appUser?.role === 'admin';
  const isRep = Boolean(appUser?.representativeUniversityId);
  const isMember = isAdmin || appUser?.applicationStatus === 'Approved';

  const links = [
    { to: '/', label: t(texts, 'header.home') },
    { to: '/about', label: t(texts, 'header.about') },
    { to: '/community', label: t(texts, 'header.community') },
    { to: '/resources', label: t(texts, 'header.resources') },
    { to: '/mentorship', label: t(texts, 'header.mentorship') },
    { to: '/events', label: t(texts, 'header.events') },
    { to: '/contact', label: t(texts, 'header.contact') },
  ];
  if (isMember) links.splice(6, 0, { to: '/directory', label: 'University Directory' });
  if (isRep) links.push({ to: '/representative', label: 'Representative' });

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[64px] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `min-h-[44px] rounded-lg px-3 py-2 text-[15px] font-medium ${isActive ? 'text-royal' : 'text-slate-700 hover:text-navy'}`}>
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className="min-h-[44px] rounded-lg px-3 py-2 text-[15px] font-semibold text-royal">Admin</NavLink>
          )}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {appUser ? (
            <>
              <Link to="/dashboard" className="min-h-[44px] rounded-lg px-3 py-2 text-[15px] font-medium text-slate-700 hover:text-navy">{t(texts, 'header.dashboard')}</Link>
              <button onClick={handleLogout} className="min-h-[44px] rounded-lg px-3 py-2 text-[15px] font-medium text-slate-700 hover:text-navy">{t(texts, 'header.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="min-h-[44px] rounded-lg px-3 py-2 text-[15px] font-medium text-slate-700 hover:text-navy">{t(texts, 'header.login')}</Link>
              <Link to="/join" className="inline-flex min-h-[44px] items-center rounded-xl bg-royal px-4 py-2 text-[15px] font-semibold text-white hover:bg-royal-700">{t(texts, 'header.join')}</Link>
            </>
          )}
        </div>
        <button className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 lg:hidden"
          aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}>
          <span aria-hidden="true" className="text-xl leading-none">{open ? '✕' : '☰'}</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-medium text-slate-800 hover:bg-slate-50">{l.label}</Link>
              </li>
            ))}
            {isAdmin && (
              <>
                <li><Link to="/admin" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-semibold text-royal hover:bg-slate-50">Admin Dashboard</Link></li>
                <li><Link to="/admin/content" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-medium text-slate-800 hover:bg-slate-50">Content</Link></li>
                <li><Link to="/admin/site-text" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-medium text-slate-800 hover:bg-slate-50">Site Text</Link></li>
                <li><Link to="/admin/universities" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-medium text-slate-800 hover:bg-slate-50">Universities</Link></li>
                <li><Link to="/admin/representatives" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-medium text-slate-800 hover:bg-slate-50">Representatives</Link></li>
                <li><Link to="/admin/settings" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-medium text-slate-800 hover:bg-slate-50">Settings</Link></li>
                <li><Link to="/admin/audit" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[16px] font-medium text-slate-800 hover:bg-slate-50">Audit Log</Link></li>
              </>
            )}
            <li className="pt-2">
              {appUser ? (
                <div className="flex gap-2">
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-navy">{t(texts, 'header.dashboard')}</Link>
                  <button onClick={handleLogout} className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-royal px-4 font-semibold text-white">{t(texts, 'header.logout')}</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-navy">{t(texts, 'header.login')}</Link>
                  <Link to="/join" onClick={() => setOpen(false)} className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-royal px-4 font-semibold text-white">{t(texts, 'header.join')}</Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
