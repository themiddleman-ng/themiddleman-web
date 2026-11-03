import { createClient } from "@supabase/supabase-js";
import { DESIGN_PREVIEW_GIGS } from "@/lib/design-preview/catalog";

export type PublicGigCard = {
  title: string;
  description: string;
  priceNgn: number;
  cover: string | null;
};

const SITE_URL = "https://themiddleman.com.ng";

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function clip(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function fromPreview(id: string): PublicGigCard | null {
  const preview = DESIGN_PREVIEW_GIGS.find((item) => item.id === id);
  if (!preview) return null;
  const cover = preview.gallery_image_paths?.[0] ?? null;
  return {
    title: clip(preview.title, 90),
    description: clip(preview.description, 180),
    priceNgn: preview.price_ngn,
    cover,
  };
}

/** Active listings and the local sample catalogue only. Drafts and hidden rows return null. */
export async function loadPublicGigCard(id: string): Promise<PublicGigCard | null> {
  if (!configured()) return fromPreview(id);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("gigs")
    .select("title, description, price_ngn, gallery_image_paths")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) return null;

  const imagePath = Array.isArray(data.gallery_image_paths) ? data.gallery_image_paths[0] : null;
  const cover = typeof imagePath === "string" && imagePath
    ? imagePath.startsWith("http") || imagePath.startsWith("/")
      ? imagePath
      : supabase.storage.from("gig-media").getPublicUrl(imagePath).data.publicUrl
    : null;

  return {
    title: clip(data.title || "Digital product", 90),
    description: clip(data.description || "A digital product on The Middleman.", 180),
    priceNgn: Number(data.price_ngn) || 0,
    cover,
  };
}

export function gigPageUrl(id: string) {
  return `${SITE_URL}/gigs/${encodeURIComponent(id)}`;
}

export function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
