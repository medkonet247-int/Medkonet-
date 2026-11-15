import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { FieldError, inputCls, labelCls, btnPrimary } from '../components/ui';
import { normalizeEmail, isValidEmail } from '../lib/validation';
import { useSiteText, t as st } from '../lib/siteText';
import { invokeFunction } from '../lib/supabase';

export function ForgotPassword() {
  const texts = useSiteText('Forgot Password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    if (!isValidEmail(normalizeEmail(email))) { setError('Enter a valid email address.'); return; }
    setSubmitting(true);
    setError('');
    setNotice('');
    const { data, error: err } = await invokeFunction<{ emailConfigured?: boolean; emailSent?: boolean }>(
      'forgot-password', { email: normalizeEmail(email) }
    );
    setSubmitting(false);
    if (err) { setError('We could not send the email right now. Please try again shortly.'); return; }
    if (data?.emailConfigured === false) {
      setNotice('Email delivery is not configured yet.');
      return;
    }
    // Generic success — never reveal whether the address exists.
    setNotice('If an account exists for that email, a password reset link has been sent. Check your inbox (and spam folder).');
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <Logo />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'forgot.title')}</h1>
      <p className="mt-2 text-slate-600">Enter your account email and we will send you a link to set a new password.</p>
      {notice && <div role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[15px] text-blue-900">{notice}</div>}
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="forgotEmail" className={labelCls}>Email address</label>
          <input id="forgotEmail" type="email" inputMode="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>
        <FieldError message={error} />
        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <p className="mt-6 text-[15px] text-slate-600">
        Remembered it? <Link to="/login" className="font-semibold text-royal underline">Back to Login</Link>
      </p>
    </main>
  );
}
