import {
  adminUser,
  privateJson,
  serviceClient,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const administrator = await adminUser();
  if (!administrator) return privateJson({ error: "Admin access required." }, 403);
  if (!productPackagesEnabled()) return privateJson({ error: "Product package review is not enabled here." }, 404);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Review queue is unavailable." }, 503);

  const { data: versions, error: versionsError } = await db.from("product_versions")
    .select("id,gig_id,seller_profile_id,version_number,original_filename,content_type,file_size,sha256,security_status,review_status,validation_report,uploaded_at")
    .eq("review_status", "awaiting_review")
    .order("uploaded_at", { ascending: true })
    .limit(50);
  if (versionsError) return privateJson({ error: "Could not load the product review queue." }, 500);
  if (!versions?.length) return privateJson({ products: [] });

  const gigIds = [...new Set(versions.map((version) => version.gig_id))];
  const sellerIds = [...new Set(versions.map((version) => version.seller_profile_id))];
  const [gigsResult, sellersResult] = await Promise.all([
    db.from("gigs")
      .select("id,title,category,description,price_ngn,gallery_image_paths,demo_video_path,demo_links,is_ai_assisted,seller_id")
      .in("id", gigIds),
    db.from("seller_profiles")
      .select("id,display_name,verification_status")
      .in("id", sellerIds),
  ]);
  if (gigsResult.error || sellersResult.error)
    return privateJson({ error: "Could not load listing details for review." }, 500);

  const gigs = new Map((gigsResult.data ?? []).map((gig) => [gig.id, gig]));
  const sellers = new Map((sellersResult.data ?? []).map((seller) => [seller.id, seller]));
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const products = versions.map((version) => {
    const gig = gigs.get(version.gig_id);
    const seller = sellers.get(version.seller_profile_id);
    const media = (gig?.gallery_image_paths ?? []).map((path: string) => ({
      path,
      url: db.storage.from("gig-media").getPublicUrl(path).data.publicUrl,
    }));
    const demoVideoUrl = gig?.demo_video_path
      ? db.storage.from("gig-media").getPublicUrl(gig.demo_video_path).data.publicUrl
      : null;
    return {
      ...version,
      gig: gig ? {
        id: gig.id,
        title: gig.title,
        category: gig.category,
        description: gig.description,
        price_ngn: gig.price_ngn,
        is_ai_assisted: gig.is_ai_assisted,
        media,
        demo_links: gig.demo_links ?? [],
        demo_video_url: demoVideoUrl,
      } : null,
      seller: seller ? {
        display_name: seller.display_name,
        verification_status: seller.verification_status,
      } : null,
      // Kept to avoid accidentally treating this as a public preview link.
      privatePackage: true,
    };
  });
  return privateJson({ products, environment: new URL(baseUrl).hostname });
}
