import { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>;
}

export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">{intro}</p>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</div>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">{message}</p>;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </span>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="font-semibold text-navy">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
      <p className="font-semibold text-red-800">Something went wrong</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 min-h-[44px] rounded-lg bg-red-700 px-4 text-sm font-semibold text-white">
          Try again
        </button>
      )}
    </div>
  );
}

export const inputCls =
  'w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[16px] text-slate-900 placeholder:text-slate-400 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30';

export const labelCls = 'mb-1.5 block text-sm font-semibold text-navy';

export const btnPrimary =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-royal px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-royal-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-royal focus:ring-offset-2';

export const btnSecondary =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-royal focus:ring-offset-2';
