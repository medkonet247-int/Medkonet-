import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { FieldError, inputCls, labelCls, btnPrimary } from '../components/ui';
import { useSiteText, t as st } from '../lib/siteText';
import { invokeFunction } from '../lib/supabase';

export function ResetPassword() {
  const texts = useSiteText('Reset Password');
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    if (!token) { setError('This reset link is invalid. Please request a new one.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    setError('');
    const { error: err } = await invokeFunction('reset-password', { token, newPassword: password });
    setSubmitting(false);
    if (err) { setError(err); return; }
    navigate('/login', { replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <Logo />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'reset.title')}</h1>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="newPassword" className={labelCls}>New password (minimum 8 characters)</label>
          <input id="newPassword" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="confirmNew" className={labelCls}>Confirm new password</label>
          <input id="confirmNew" type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </div>
        <FieldError message={error} />
        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </main>
  );
}
