import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseEnv } from '@/lib/env';
export async function createSupabase() {
  const env = supabaseEnv();
  if (!env) throw new Error('SUPABASE_NOT_CONFIGURED');
  const store = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components cannot set cookies; proxy refreshes the session. */ }
      }
    },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
  });
}
