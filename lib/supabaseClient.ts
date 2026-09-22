import { createBrowserClient } from '@supabase/ssr';

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  configuredSupabaseUrl && configuredSupabaseAnonKey
);

const supabaseUrl = configuredSupabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = configuredSupabaseAnonKey || 'placeholder-anon-key';

if (!isSupabaseConfigured) {
  console.warn('[supabaseClient] Env vars missing — using placeholders. Supabase calls will fail.');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
