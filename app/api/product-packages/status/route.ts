import { privateJson } from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  return privateJson({ enabled: productPackagesEnabled() });
}
