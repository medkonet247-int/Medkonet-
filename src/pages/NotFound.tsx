import { Link } from 'react-router-dom';
import { PageShell, PageHeader } from '../components/ui';

export function NotFound() {
  return (
    <PageShell>
      <PageHeader title="Page not found" intro="The page you are looking for does not exist." />
      <Link to="/" className="inline-flex min-h-[44px] items-center rounded-xl bg-royal px-5 py-2.5 font-semibold text-white">
        Go to Home
      </Link>
    </PageShell>
  );
}
