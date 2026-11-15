import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { FieldError, inputCls, labelCls, btnPrimary } from '../components/ui';
import { normalizeEmail, isValidEmail } from '../lib/validation';
import { supabase } from '../lib/supabase';
import { useSiteText, t as st } from '../lib/siteText';

export function Login() {
  const texts = useSiteText('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failures, setFailures] = useState(0);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const verifiedParam = params.get('verified') === '1';

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    if (!isValidEmail(normalizeEmail(email))) { setError('Enter a valid email address.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    if (failures >= 5) { setError('Too many failed attempts. Please wait a minute and try again.'); return; }
    setSubmitting(true);
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email), password,
    });
    setSubmitting(false);
    if (signInError || !data.session) {
      setFailures((f) => f + 1);
      setError('Invalid email or password.');
      return;
    }
    // Check verification + role.
    const userId = data.session.user.id;
    const { data: profile } = await supabase.from('profiles')
      .select('email_verified').eq('id', userId).maybeSingle();
    if (!profile?.email_verified) {
      await supabase.auth.signOut();
      navigate(`/verify-email?email=${encodeURIComponent(normalizeEmail(email))}`, { replace: true });
      return;
    }
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    if (roleRow?.role === 'admin') navigate('/admin', { replace: true });
    else navigate('/dashboard', { replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <Logo />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'login.title')}</h1>
      {verifiedParam && (
        <div role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">
          Your email is verified. Please log in.
        </div>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="loginEmail" className={labelCls}>Email address</label>
          <input id="loginEmail" type="email" inputMode="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="loginPassword" className={labelCls}>Password</label>
          <div className="relative">
            <input id="loginPassword" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-20`} />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}
              className="absolute right-2 top-1/2 min-h-[44px] -translate-y-1/2 rounded-lg px-3 text-sm font-semibold text-royal">
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <FieldError message={error} />
        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-[15px]">
        <Link to="/forgot-password" className="font-semibold text-royal underline underline-offset-4">Forgot password?</Link>
        <p className="text-slate-600">
          New to MedKonet? <Link to="/join" className="font-semibold text-royal underline">Join MedKonet</Link>
        </p>
      </div>
    </main>
  );
}
