import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = createClient(
  url ?? 'http://localhost:54321',
  key ?? 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

export async function invokeFunction<T = Record<string, unknown>>(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Functions return JSON errors with useful fields (attemptsRemaining, errors, etc.).
    // Surface the full parsed body as `data` so callers can read those fields.
    let message = error.message;
    let parsed: T | null = null;
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx) {
        const clone = ctx.clone();
        const json = await clone.json();
        if (json?.error) message = String(json.error);
        parsed = json as T;
      }
    } catch { /* keep default */ }
    return { data: parsed, error: message };
  }
  return { data: data as T, error: null };
}
