import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const ORDER_DELIVERIES_BUCKET = 'order-deliveries';

export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const cookieStore = await cookies();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        for (const item of items) {
          try { cookieStore.set(item.name, item.value, item.options); }
          catch { /* Server components cannot persist refreshed cookies. */ }
        }
      },
    },
  });
  const { data: { user }, error } = await client.auth.getUser();
  return error ? null : user;
}

export async function adminUser() {
  const [user, db] = await Promise.all([authenticatedUser(), Promise.resolve(serviceClient())]);
  if (!user || !db) return null;
  const { data, error } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return !error && data?.role === 'admin' ? { user, db } : null;
}

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
