import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { AVATAR_BUCKET, candidateAvatarPaths, metadataAvatarPath } from '@/lib/profile/owner-avatar.mjs';
import { serviceClient, uuidPattern } from '@/lib/server/marketplace';

export type PublicSellerListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  price_ngn: number;
  is_ai_assisted: boolean;
  gallery_image_paths: string[] | null;
};

export type PublicSellerProfile = {
  id: string;
  display_name: string;
  bio: string;
  rating_avg: number;
  total_orders_completed: number;
  created_at: string;
  avatar_url: string | null;
  listings: PublicSellerListing[];
};

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function resolveAvatarUrl(userId: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  const knownPath = metadataAvatarPath(data.user.user_metadata);
  const paths = candidateAvatarPaths(userId, knownPath);
  for (const path of paths) {
    const signed = await db.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
    if (!signed.error && signed.data?.signedUrl) return signed.data.signedUrl;
  }
  return null;
}

export async function loadPublicSellerProfile(sellerId: string): Promise<PublicSellerProfile | null> {
  if (!uuidPattern.test(sellerId)) return null;
  const supabase = anonClient();
  if (!supabase) return null;

  const { data: seller, error } = await supabase
    .from('public_seller_profiles')
    .select('id, user_id, display_name, bio, rating_avg, total_orders_completed, created_at')
    .eq('id', sellerId)
    .maybeSingle();
  if (error || !seller) return null;

  const { data: listings } = await supabase
    .from('gigs')
    .select('id, title, description, category, price_ngn, is_ai_assisted, gallery_image_paths')
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  let avatar_url: string | null = null;
  if (seller.user_id && serviceClient()) {
    avatar_url = await resolveAvatarUrl(seller.user_id);
  }

  return {
    id: seller.id,
    display_name: seller.display_name,
    bio: seller.bio ?? '',
    rating_avg: Number(seller.rating_avg ?? 0),
    total_orders_completed: Number(seller.total_orders_completed ?? 0),
    created_at: seller.created_at,
    avatar_url,
    listings: (listings ?? []) as PublicSellerListing[],
  };
}
