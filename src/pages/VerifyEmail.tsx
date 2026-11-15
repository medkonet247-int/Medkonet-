import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { FieldError, inputCls, labelCls, btnPrimary, btnSecondary } from '../components/ui';
import { maskEmail, normalizeEmail, isValidEmail } from '../lib/validation';
import { useSiteText, t as st } from '../lib/siteText';
import { invokeFunction, supabase } from '../lib/supabase';

export function VerifyEmail() {
  const texts = useSiteText('Verify Email');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = params.get('email') ?? '';
  const tokenParam = params.get('token') ?? '';
  const devCodeParam = params.get('devCode') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState('');
  const [devCode, setDevCode] = useState(devCodeParam);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Verify via link token (works on another device/browser).
  useEffect(() => {
    if (!tokenParam) return;
    (async () => {
      setVerifying(true);
      const { data, error: err } = await invokeFunction<{ verified?: boolean; isAdmin?: boolean; email?: string }>(
        'verify-email', { email: emailParam, token: tokenParam }
      );
      setVerifying(false);
      if (err || !data?.verified) {
        setError('This verification link is invalid or has expired. Please request a new code below.');
        setExpired(true);
        return;
      }
      await finishVerification(data.email ?? emailParam, Boolean(data.isAdmin));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam]);

  async function finishVerification(verifiedEmail: string, isAdmin: boolean) {
    // Sign the user in (password was set at registration; use stored session if present).
    // If no session, send to login — but try to sign in silently is not possible without password.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      navigate('/login?verified=1', { replace: true });
      return;
    }
    if (isAdmin) navigate('/admin', { replace: true });
    else navigate('/dashboard', { replace: true });
  }

  function onDigitChange(i: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 3) inputs.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') ?? '').replace(/\D/g, '').slice(0, 4);
    if (!text) return;
    const next = ['', '', '', ''];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputs.current[Math.min(text.length, 4) - 1]?.focus();
  }

  async function onVerify(ev: React.FormEvent) {
    ev.preventDefault();
    if (verifying) return;
    const code = digits.join('');
    if (!isValidEmail(normalizeEmail(email))) { setError('Enter your email address.'); return; }
    if (code.length !== 4) { setError('Enter the 4-digit code.'); return; }
    setVerifying(true);
    setError('');
    const { data, error: err } = await invokeFunction<{ verified?: boolean; isAdmin?: boolean; email?: string; attemptsRemaining?: number; expired?: boolean }>(
      'verify-email', { email: normalizeEmail(email), code }
    );
    setVerifying(false);
    if (err || !data?.verified) {
      // Generic error; show attempts remaining.
      const remaining = (data as { attemptsRemaining?: number } | null)?.attemptsRemaining;
      if (typeof remaining === 'number') setAttemptsLeft(remaining);
      if ((data as { expired?: boolean } | null)?.expired) setExpired(true);
      setError(err || 'Incorrect code. Please try again.');
      return;
    }
    await finishVerification(data.email ?? email, Boolean(data.isAdmin));
  }

  async function onResend() {
    if (resending || cooldown > 0) return;
    if (!isValidEmail(normalizeEmail(email))) { setError('Enter your email address first.'); return; }
    setResending(true);
    setError('');
    setNotice('');
    const { data, error: err } = await invokeFunction<{ status?: string; emailConfigured?: boolean; emailSent?: boolean; devCode?: string; retryAfter?: number }>(
      'resend-verification', { email: normalizeEmail(email) }
    );
    setResending(false);
    if (err) { setError('We could not send the email right now. Please try again shortly.'); return; }
    if (data?.status === 'rate_limited') {
      setCooldown(data.retryAfter ?? 60);
      setError('Please wait before requesting another code.');
      return;
    }
    setCooldown(60);
    setDigits(['', '', '', '']);
    setExpired(false);
    setAttemptsLeft(null);
    if (data?.devCode) setDevCode(data.devCode);
    if (data?.emailConfigured === false) {
      setEmailConfigured(false);
      setNotice('Email delivery is not configured yet.');
    } else if (data?.emailSent === false) {
      setError("We couldn't send the email right now. Please try again shortly.");
    } else {
      setNotice('A new code has been sent. Check your inbox (and spam folder).');
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <Logo />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'verify.title')}</h1>
      <p className="mt-2 text-slate-600">
        {email ? <>We sent a 4-digit code to <strong>{maskEmail(email)}</strong>. It expires in 10 minutes.</> : 'Enter your email and the 4-digit code we sent you.'}
      </p>

      {emailConfigured === false && (
        <div role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px] text-amber-900">
          Email delivery is not configured yet.
        </div>
      )}
      {notice && <div role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[15px] text-blue-900">{notice}</div>}
      {devCode && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px] text-amber-900">
          Development mode: your code is <strong>{devCode}</strong>.
        </div>
      )}

      <form onSubmit={onVerify} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="verifyEmail" className={labelCls}>Email address</label>
          <input id="verifyEmail" type="email" inputMode="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>
        <fieldset>
          <legend className={labelCls}>4-digit verification code</legend>
          <div className="flex gap-3" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                pattern="[0-9]*"
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
                value={d}
                onChange={(e) => onDigitChange(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
                }}
                className="h-14 w-14 rounded-xl border border-slate-300 text-center text-2xl font-bold focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30"
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">Numeric keyboard on mobile. You can paste the full code.</p>
        </fieldset>
        <FieldError message={error} />
        {attemptsLeft !== null && attemptsLeft > 0 && (
          <p className="text-sm text-slate-600">{attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining.</p>
        )}
        {expired && <p className="text-sm text-slate-600">This code has expired. Please request a new code.</p>}
        <button type="submit" disabled={verifying} className={`${btnPrimary} w-full`}>
          {verifying ? 'Verifying…' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button onClick={onResend} disabled={resending || cooldown > 0} className={btnSecondary}>
          {resending ? 'Sending…' : cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        </button>
        <Link to="/join" className="inline-flex min-h-[44px] items-center font-semibold text-royal underline underline-offset-4">
          Wrong email? Register again
        </Link>
      </div>
    </main>
  );
}
