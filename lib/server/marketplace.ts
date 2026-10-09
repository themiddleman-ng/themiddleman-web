import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { escrowV2Enabled } from './escrow-config.mjs';
import { cookies } from 'next/headers';

export const ORDER_DELIVERIES_BUCKET = 'order-deliveries';

export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedContext() {
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
  return error || !user ? null : { user, client };
}

export async function authenticatedUser() {
  return (await authenticatedContext())?.user ?? null;
}

export async function adminUser() {
  const [session, db] = await Promise.all([authenticatedContext(), Promise.resolve(serviceClient())]);
  if (!session || !db) return null;
  const { user, client } = session;
  const { data, error } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error || data?.role !== 'admin') return null;
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  const factors = await client.auth.mfa.listFactors();
  if (assurance.error || assurance.data?.currentLevel !== 'aal2' || factors.error ||
    !factors.data?.all.some(factor => factor.status === 'verified')) return null;
  if (escrowV2Enabled()) {
    const claims = await client.auth.getClaims();
    const sessionId = claims.data?.claims?.session_id;
    if (claims.error || typeof sessionId !== 'string') return null;
    const active = await db.rpc('admin_session_active', { p_uid:user.id, p_session_id:sessionId });
    if (active.error || active.data !== true) return null;
  }
  return { user, db };
}

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
