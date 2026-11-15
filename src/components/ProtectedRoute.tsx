import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { appUser, loading } = useAuth();
  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16 text-center"><Spinner label="Loading…" /></main>;
  // Visitors clicking members-only links go to Join MedKonet.
  if (!appUser) return <Navigate to="/join" replace />;
  if (!appUser.emailVerified) return <Navigate to={`/verify-email?email=${encodeURIComponent(appUser.email)}`} replace />;
  if (appUser.role === 'admin') return <>{children}</>;
  if (appUser.applicationStatus !== 'Approved') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { appUser, loading } = useAuth();
  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16 text-center"><Spinner label="Loading…" /></main>;
  if (!appUser) return <Navigate to="/login" replace />;
  if (appUser.role !== 'admin') return <Navigate to="/access-denied" replace />;
  return <>{children}</>;
}

export function RepresentativeRoute({ children }: { children: ReactNode }) {
  const { appUser, loading } = useAuth();
  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16 text-center"><Spinner label="Loading…" /></main>;
  if (!appUser) return <Navigate to="/login" replace />;
  if (!appUser.representativeUniversityId) return <Navigate to="/access-denied" replace />;
  return <>{children}</>;
}
