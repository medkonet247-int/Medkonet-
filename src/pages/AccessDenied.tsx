import { Link } from 'react-router-dom';
import { PageShell, PageHeader } from '../components/ui';

export function AccessDenied() {
  return (
    <PageShell>
      <PageHeader title="Access denied" intro="You do not have administrator access to this page." />
      <p className="text-slate-600">If you believe this is a mistake, please contact the MedKonet team via the Contact page.</p>
      <Link to="/" className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-royal px-5 py-2.5 font-semibold text-white">
        Go to Home
      </Link>
    </PageShell>
  );
}
