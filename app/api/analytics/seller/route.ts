import {
  authenticatedUser,
  privateJson,
  serviceClient,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PAID_STATUSES = ["in_escrow", "delivered", "approved", "disputed"];

export async function GET(request: Request) {
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: "Sign in to view seller analytics." }, 401);
  if (!productPackagesEnabled()) return privateJson({ error: "Seller analytics are not enabled here." }, 404);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Analytics are unavailable." }, 503);
  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") || 7);
  const days = [7, 30, 90, 0].includes(requestedDays) ? requestedDays : 7;

  const { data: seller, error: sellerError } = await db.from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (sellerError) return privateJson({ error: "Could not load seller analytics." }, 500);
  if (!seller) return privateJson({ error: "Seller profile not found." }, 404);

  const { data: gigs, error: gigsError } = await db.from("gigs")
    .select("id,title,status")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });
  if (gigsError) return privateJson({ error: "Could not load seller products." }, 500);
  const products = gigs ?? [];
  if (!products.length) return privateJson({ days, products: [], totals: { views: 0, downloads: 0, sales: 0, salesValue: 0 }, trackingEnabled: (process.env.MARKETPLACE_ANALYTICS_PEPPER || "").length >= 32 });

  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null;
  let viewQuery = db.from("marketplace_events")
    .select("gig_id,properties,created_at")
    .eq("event_type", "product.viewed")
    .in("gig_id", products.map((product) => product.id))
    .order("created_at", { ascending: false })
    .limit(10000);
  if (since) viewQuery = viewQuery.gte("created_at", since);

  let orderQuery = db.from("orders")
    .select("gig_id,amount,created_at,status")
    .eq("seller_id", seller.id)
    .in("status", PAID_STATUSES)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (since) orderQuery = orderQuery.gte("created_at", since);

  const [viewsResult, ordersResult, ratingsResult, versionsResult] = await Promise.all([
    viewQuery,
    orderQuery,
    db.rpc("get_gig_ratings"),
    db.from("product_versions").select("id,gig_id").in("gig_id", products.map((product) => product.id)),
  ]);
  if (viewsResult.error || ordersResult.error || versionsResult.error)
    return privateJson({ error: "Could not load seller performance data." }, 500);
  const versionToGig = new Map((versionsResult.data ?? []).map((version) => [version.id, version.gig_id]));
  const versionIds = [...versionToGig.keys()];
  let downloadsQuery = versionIds.length
    ? db.from("product_downloads").select("product_version_id,downloaded_at").in("product_version_id", versionIds).limit(10000)
    : null;
  if (downloadsQuery && since) downloadsQuery = downloadsQuery.gte("downloaded_at", since);
  const downloadsResult = downloadsQuery ? await downloadsQuery : { data: [], error: null };
  if (downloadsResult.error) return privateJson({ error: "Could not load download activity." }, 500);
  const downloadsByGig = new Map();
  for (const download of downloadsResult.data ?? []) {
    const gigId = versionToGig.get(download.product_version_id);
    if (gigId) downloadsByGig.set(gigId, (downloadsByGig.get(gigId) ?? 0) + 1);
  }

  const productRows = products.map((product) => {
    const productViews = (viewsResult.data ?? []).filter((row) => row.gig_id === product.id);
    const productOrders = (ordersResult.data ?? []).filter((row) => row.gig_id === product.id);
    const ratingRows = (ratingsResult.data ?? []) as Array<{ gig_id: string; average_rating: number | null; review_count: number | null }>;
    const rating = ratingRows.find((row) => row.gig_id === product.id);
    const salesValue = productOrders.reduce((total, row) => total + Number(row.amount || 0), 0);
    const views = productViews.length;
    const sales = productOrders.length;
    return {
      id: product.id,
      title: product.title,
      status: product.status,
      views,
      downloads: downloadsByGig.get(product.id) ?? 0,
      sales,
      salesValue,
      conversionRate: views ? Math.round((sales / views) * 10000) / 100 : 0,
      averageRating: rating?.average_rating ?? null,
      reviewCount: rating?.review_count ?? 0,
    };
  });

  return privateJson({
    days,
    trackingEnabled: (process.env.MARKETPLACE_ANALYTICS_PEPPER || "").length >= 32,
    products: productRows,
    totals: {
      views: productRows.reduce((sum, item) => sum + item.views, 0),
      sales: productRows.reduce((sum, item) => sum + item.sales, 0),
      salesValue: productRows.reduce((sum, item) => sum + item.salesValue, 0),
      downloads: productRows.reduce((sum, item) => sum + item.downloads, 0),
    },
  });
}
