import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import GigCard from "@/components/marketplace/GigCard";
import type { PublicSellerProfile } from "@/lib/server/public-seller-profile";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

export default function SellerProfileView({ profile }: { profile: PublicSellerProfile }) {
  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border border-line bg-elevated sm:mx-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill unoptimized className="object-cover" sizes="96px" />
            ) : (
              <span className="grid h-full w-full place-items-center font-display text-2xl font-bold text-bone">
                {initialsFrom(profile.display_name)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-medium tracking-[.2em] text-eyebrow">VERIFIED SELLER</p>
            <h1 className="mt-2 flex flex-wrap items-center justify-center gap-2 font-display text-3xl font-bold tracking-tight sm:justify-start">
              {profile.display_name}
              <span role="img" aria-label="Verified seller" className="text-lg font-bold text-link">✓</span>
            </h1>
            <p className="mt-2 text-sm text-muted">Joined {formatJoinDate(profile.created_at)}</p>
            {profile.total_orders_completed > 0 ? (
              <p className="mt-1 text-sm text-slate">
                {profile.total_orders_completed} completed order{profile.total_orders_completed === 1 ? "" : "s"}
              </p>
            ) : null}
            {profile.bio ? (
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-slate">{profile.bio}</p>
            ) : (
              <p className="mt-4 text-sm text-muted">This seller has not added a bio yet.</p>
            )}
          </div>
        </div>

        <section className="mt-10" aria-labelledby="seller-listings-heading">
          <h2 id="seller-listings-heading" className="font-display text-2xl font-semibold">
            Products
          </h2>
          {profile.listings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line bg-paper px-6 py-12 text-center">
              <p className="text-lg font-semibold text-bone">No active listings yet</p>
              <p className="mt-2 text-sm text-muted">Check back later for new products from this seller.</p>
              <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ember-cta px-5 text-sm font-semibold text-on-ember hover:bg-ember-hover">
                Browse marketplace
              </Link>
            </div>
          ) : (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profile.listings.map((gig) => (
                <li key={gig.id}>
                  <GigCard
                    gig={{
                      ...gig,
                      gallery_image_paths: gig.gallery_image_paths ?? undefined,
                      seller_profiles: { display_name: profile.display_name, verification_status: "approved" },
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
