export const dynamic = 'force-dynamic';
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

const pages: Record<string, { eyebrow: string; title: string; body: string; action: string }> = {
  about: { eyebrow: "OUR STORY", title: "A trusted home for digital products.", body: "The Middleman helps Nigerians browse ready-made digital products, code, templates, and creative work. Purchases are paused, so browsing does not start a payment.", action: "Browse the marketplace" },
  careers: { eyebrow: "CAREERS", title: "Build trust into every transaction.", body: "We are building thoughtful tools for the next generation of Nigeria's digital workforce. There are no open roles today, but we would love to hear from exceptional people.", action: "Email our team" },
  disputes: { eyebrow: "RESOLUTION", title: "Fair outcomes, clearly handled.", body: "Purchases are paused, so there is no payment to hold. When payments are enabled, a disagreement about delivery will follow the published dispute policy.", action: "Contact support" },
  "seller-guidelines": { eyebrow: "SELLER GUIDE", title: "Set clear expectations. Deliver excellent work.", body: "Describe exactly what a buyer would receive. Purchases and payouts are paused on this launch, so a listing is a preview until checkout opens.", action: "Start seller verification" },
};

export default async function InformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  const href = slug === "careers" || slug === "disputes" ? "mailto:hello@themiddleman.com.ng" : slug === "seller-guidelines" ? "/onboarding/seller" : "/marketplace";
  return <main className="min-h-screen bg-ink text-bone"><SiteHeader /><section className="mx-auto max-w-3xl px-6 py-24"><p className="mb-4 text-xs font-medium tracking-[.2em] text-ember">{page.eyebrow}</p><h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">{page.title}</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate">{page.body}</p><Link href={href} className="mt-10 inline-flex rounded-full bg-ember-cta px-6 py-3 font-medium text-ink transition hover:bg-ember-hover">{page.action}</Link></section></main>;
}
