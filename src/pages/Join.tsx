import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ImageSlot } from '../components/ImageSlot';
import { FieldError, inputCls, labelCls, btnPrimary } from '../components/ui';
import { NIGERIAN_STATES, UNIVERSITY_TYPES, normalizeEmail, isValidEmail, normalizeWhatsApp, passwordStrength } from '../lib/validation';
import { invokeFunction, supabase } from '../lib/supabase';
import { useSiteText, t as st } from '../lib/siteText';
import { useEffect } from 'react';

interface FormState {
  fullName: string; email: string; password: string; confirmPassword: string;
  whatsappNumber: string; university: string; universityType: string; state: string;
  course: string; currentLevel: string; reasonForJoining: string; agreed: boolean;
}

const initial: FormState = {
  fullName: '', email: '', password: '', confirmPassword: '', whatsappNumber: '',
  university: '', universityType: '', state: '', course: '', currentLevel: '',
  reasonForJoining: '', agreed: false,
};

export function Join() {
  const texts = useSiteText('Join');
  const [regOpen, setRegOpen] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('is_registration_open');
      if (error) {
        // Fallback: try settings table (admins only) — default open if unreachable
        setRegOpen(true);
      } else {
        setRegOpen(Boolean(data));
      }
    })();
  }, []);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const navigate = useNavigate();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!isValidEmail(normalizeEmail(form.email))) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    if (!normalizeWhatsApp(form.whatsappNumber)) e.whatsappNumber = 'Enter a valid WhatsApp number (e.g. 0803..., +234803...).';
    if (!form.university.trim()) e.university = 'University is required.';
    if (!UNIVERSITY_TYPES.includes(form.universityType as (typeof UNIVERSITY_TYPES)[number])) e.universityType = 'Select a university type.';
    if (!NIGERIAN_STATES.includes(form.state)) e.state = 'Select your state.';
    if (!form.course.trim()) e.course = 'Course is required.';
    if (!form.currentLevel.trim()) e.currentLevel = 'Current academic level is required.';
    if (form.reasonForJoining.trim().length < 20) e.reasonForJoining = 'Please tell us a little more (at least 20 characters).';
    if (!form.agreed) e.agreed = 'Please agree to the Community Rules and Privacy Notice.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return; // double-submit guard
    if (!validate()) return;
    setSubmitting(true);
    setNotice(null);
    setDevCode(null);
    const { data, error } = await invokeFunction<{
      status?: string; email?: string; emailConfigured?: boolean; emailSent?: boolean;
      devCode?: string; errors?: Record<string, string>;
    }>('register', {
      fullName: form.fullName.trim(),
      email: normalizeEmail(form.email),
      password: form.password,
      whatsappNumber: form.whatsappNumber,
      university: form.university.trim(),
      universityType: form.universityType,
      state: form.state,
      course: form.course.trim(),
      currentLevel: form.currentLevel.trim(),
      reasonForJoining: form.reasonForJoining.trim(),
    });
    setSubmitting(false);
    if (data?.errors) { setErrors(data.errors); return; }
    if (error) {
      setNotice({ type: 'error', text: error || 'We could not create your account. Please try again shortly.' });
      return;
    }
    if (data?.status === 'already_verified') {
      setNotice({ type: 'info', text: 'This email is already verified. Please log in instead.' });
      return;
    }
    if (data?.devCode) setDevCode(data.devCode);
    if (data?.emailConfigured === false) {
      setNotice({ type: 'info', text: 'Email delivery is not configured yet. Your account was created — please keep this page open or return to Verify Email.' });
    } else if (data?.emailSent === false) {
      setNotice({ type: 'error', text: "We couldn't send the email right now. Please try again shortly." });
    }
    navigate(`/verify-email?email=${encodeURIComponent(normalizeEmail(form.email))}${data?.devCode ? `&devCode=${data.devCode}` : ''}`, { replace: true });
  }

  const strength = passwordStrength(form.password);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
      <div>
        <Logo />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-navy">{st(texts, 'join.title')}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{st(texts, 'join.intro')}</p>

        {notice && (
          <div role="status" className={`mt-5 rounded-xl border p-4 text-[15px] ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
            {notice.text}
            {notice.type === 'info' && notice.text.includes('already verified') && (
              <> <Link to="/login" className="font-bold underline">Go to Login</Link></>
            )}
          </div>
        )}
        {devCode && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px] text-amber-900">
            Development mode: your verification code is <strong>{devCode}</strong>. This is only shown while development mode is ON.
          </div>
        )}

        {regOpen === false && (
          <div role="status" className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-[15px] text-blue-900">
            <p className="font-bold">Registration is currently closed.</p>
            <p className="mt-1">Thank you for your interest in MedKonet Nigeria. Please check back soon, or contact us via WhatsApp or email on the Contact page.</p>
          </div>
        )}
        {regOpen !== false && (
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          <div>
            <label htmlFor="fullName" className={labelCls}>Full name</label>
            <input id="fullName" name="fullName" type="text" autoComplete="name" required value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)} className={inputCls} placeholder="e.g. Adaeze Okafor" />
            <FieldError message={errors.fullName} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email address</label>
            <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required value={form.email}
              onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="you@example.com" />
            <FieldError message={errors.email} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className={labelCls}>Password (minimum 8 characters)</label>
              <div className="relative">
                <input id="password" name="password" type={showPw ? 'text' : 'password'} autoComplete="new-password" required value={form.password}
                  onChange={(e) => set('password', e.target.value)} className={`${inputCls} pr-20`} />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}
                  className="absolute right-2 top-1/2 min-h-[44px] -translate-y-1/2 rounded-lg px-3 text-sm font-semibold text-royal">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && <p className="mt-1.5 text-sm text-slate-600">Strength: {strength.label}</p>}
              <FieldError message={errors.password} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelCls}>Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type={showPw ? 'text' : 'password'} autoComplete="new-password" required value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)} className={inputCls} />
              <FieldError message={errors.confirmPassword} />
            </div>
          </div>
          <div>
            <label htmlFor="whatsappNumber" className={labelCls}>WhatsApp number</label>
            <input id="whatsappNumber" name="whatsappNumber" type="tel" inputMode="tel" autoComplete="tel" required value={form.whatsappNumber}
              onChange={(e) => set('whatsappNumber', e.target.value)} className={inputCls} placeholder="0803... or +234803..." />
            <p className="mt-1.5 text-sm text-slate-500">{st(texts, 'join.helper.whatsapp')}</p>
            <FieldError message={errors.whatsappNumber} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="university" className={labelCls}>University</label>
              <input id="university" name="university" type="text" autoComplete="organization" required value={form.university}
                onChange={(e) => set('university', e.target.value)} className={inputCls} placeholder="e.g. University of Ibadan" />
              <FieldError message={errors.university} />
            </div>
            <div>
              <label htmlFor="universityType" className={labelCls}>University type</label>
              <select id="universityType" name="universityType" required value={form.universityType}
                onChange={(e) => set('universityType', e.target.value)} className={inputCls}>
                <option value="">Select type</option>
                {UNIVERSITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <FieldError message={errors.universityType} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="state" className={labelCls}>State</label>
              <select id="state" name="state" required value={form.state}
                onChange={(e) => set('state', e.target.value)} className={inputCls}>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <FieldError message={errors.state} />
            </div>
            <div>
              <label htmlFor="course" className={labelCls}>Course</label>
              <input id="course" name="course" type="text" required value={form.course}
                onChange={(e) => set('course', e.target.value)} className={inputCls} placeholder="e.g. Medicine and Surgery" />
              <FieldError message={errors.course} />
            </div>
          </div>
          <div>
            <label htmlFor="currentLevel" className={labelCls}>Current academic level</label>
            <input id="currentLevel" name="currentLevel" type="text" required value={form.currentLevel}
              onChange={(e) => set('currentLevel', e.target.value)} className={inputCls} placeholder="e.g. 200 level" />
            <FieldError message={errors.currentLevel} />
          </div>
          <div>
            <label htmlFor="reasonForJoining" className={labelCls}>Why do you want to join MedKonet?</label>
            <textarea id="reasonForJoining" name="reasonForJoining" required rows={5} value={form.reasonForJoining}
              onChange={(e) => set('reasonForJoining', e.target.value)} className={inputCls}
              placeholder="Tell us a little about yourself and what you hope to gain from the community…" />
            <p className="mt-1.5 text-right text-sm text-slate-500" aria-live="polite">{form.reasonForJoining.trim().length} characters (minimum 20)</p>
            <FieldError message={errors.reasonForJoining} />
          </div>
          <div>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
              <input type="checkbox" checked={form.agreed} onChange={(e) => set('agreed', e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#1D4ED8]" />
              <span className="text-[15px] text-slate-700">
                I agree to the <Link to="/community-rules" className="font-semibold text-royal underline">Community Rules</Link> and{' '}
                <Link to="/privacy" className="font-semibold text-royal underline">Privacy Notice</Link>.
              </span>
            </label>
            <FieldError message={errors.agreed} />
          </div>
          <button type="submit" disabled={submitting} className={`${btnPrimary} w-full sm:w-auto`}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                Submitting…
              </span>
            ) : st(texts, 'join.submit')}
          </button>
          <p className="text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-semibold text-royal underline">Login</Link>
          </p>
        </form>
        )}
      </div>
      <aside className="hidden lg:block">
        <ImageSlot slotKey="join-side" className="sticky top-24 aspect-[3/4] w-full" />
      </aside>
    </main>
  );
}
