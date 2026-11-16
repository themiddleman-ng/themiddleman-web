import {
  authenticatedUser,
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function activeGig(db: NonNullable<ReturnType<typeof serviceClient>>, gigId: string) {
  const { data, error } = await db
    .from("gigs")
    .select("id,status")
    .eq("id", gigId)
    .maybeSingle();
  if (error || !data || data.status !== "active") return null;
  return data;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser();
  if (!user) return privateJson({ saved: false, signedIn: false });
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: "Invalid product." }, 400);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Wishlist is unavailable." }, 503);
  if (!(await activeGig(db, id))) return privateJson({ error: "Product not found." }, 404);

  const { data, error } = await db
    .from("gig_wishlists")
    .select("gig_id")
    .eq("user_id", user.id)
    .eq("gig_id", id)
    .maybeSingle();
  if (error) return privateJson({ error: "Could not load wishlist state." }, 500);
  return privateJson({ saved: Boolean(data), signedIn: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: "Sign in to save products." }, 401);
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: "Invalid product." }, 400);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Wishlist is unavailable." }, 503);
  if (!(await activeGig(db, id))) return privateJson({ error: "Product not found." }, 404);

  const { data: existing, error: readError } = await db
    .from("gig_wishlists")
    .select("gig_id")
    .eq("user_id", user.id)
    .eq("gig_id", id)
    .maybeSingle();
  if (readError) return privateJson({ error: "Could not update wishlist." }, 500);

  if (existing) {
    const { error } = await db.from("gig_wishlists").delete().eq("user_id", user.id).eq("gig_id", id);
    if (error) return privateJson({ error: "Could not remove from wishlist." }, 500);
    return privateJson({ saved: false });
  }

  const { error } = await db.from("gig_wishlists").insert({ user_id: user.id, gig_id: id });
  if (error?.code === "23505") return privateJson({ saved: true });
  if (error) return privateJson({ error: "Could not save to wishlist." }, 500);
  return privateJson({ saved: true }, 201);
}
