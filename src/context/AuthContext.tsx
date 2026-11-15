import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  role: 'admin' | 'member' | null;
  applicationStatus: 'Pending' | 'Approved' | 'Rejected' | null;
  representativeUniversityId: string | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, appUser: null, loading: true,
  refresh: async () => {}, signOut: async () => {},
});

export function useAuth() { return useContext(Ctx); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAppUser(u: User | null) {
    if (!u) { setAppUser(null); return; }
    const { data: profile } = await supabase
      .from('profiles').select('email,full_name,email_verified').eq('id', u.id).maybeSingle();
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', u.id).maybeSingle();
    let status: AppUser['applicationStatus'] = null;
    if (roleRow?.role !== 'admin') {
      const { data: app } = await supabase
        .from('applications').select('application_status').eq('user_id', u.id).maybeSingle();
      status = (app?.application_status as AppUser['applicationStatus']) ?? null;
    }
    let repUni: string | null = null;
    try {
      const { data: repData } = await supabase.rpc('my_representative_university');
      repUni = (repData as string | null) ?? null;
    } catch { repUni = null; }
    setAppUser({
      id: u.id,
      email: profile?.email ?? u.email ?? '',
      fullName: profile?.full_name ?? '',
      emailVerified: Boolean(profile?.email_verified),
      role: (roleRow?.role as 'admin' | 'member' | null) ?? null,
      applicationStatus: status,
      representativeUniversityId: repUni,
    });
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    await loadAppUser(data.session?.user ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      await loadAppUser(sess?.user ?? null);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setSession(null); setAppUser(null);
  }

  return <Ctx.Provider value={{ user, session, appUser, loading, refresh, signOut }}>{children}</Ctx.Provider>;
}
