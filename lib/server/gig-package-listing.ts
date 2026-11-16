import "server-only";
import type { GigPackageListing } from "@/lib/gig-package-listing";
import { serviceClient } from "@/lib/server/marketplace";

export type { GigPackageListing };

export async function loadGigPackageListing(gigId: string): Promise<GigPackageListing | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data: gig } = await db
    .from("gigs")
    .select("current_product_version_id,status")
    .eq("id", gigId)
    .maybeSingle();
  if (!gig?.current_product_version_id || gig.status !== "active") return null;

  const { data: version } = await db
    .from("product_versions")
    .select("original_filename,content_type,validation_report,access_status")
    .eq("id", gig.current_product_version_id)
    .maybeSingle();
  if (!version || version.access_status !== "available") return null;

  const report = version.validation_report as { archive?: { paths?: string[] } } | null;
  const innerPaths = Array.isArray(report?.archive?.paths)
    ? report.archive.paths.filter((path): path is string => typeof path === "string")
    : [];

  return {
    originalFilename: version.original_filename,
    contentType: version.content_type,
    innerPaths,
  };
}
