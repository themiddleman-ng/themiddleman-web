export const dynamic = 'force-dynamic';
import Link from "next/link";
import { notFound } from "next/navigation";

const pages: Record<string, { eyebrow: string; title: string; body: string; action: string }> = {
  about: { eyebrow: "OUR STORY", title: "A trusted home for digital products.", body: "The Middleman helps Nigerians buy and sell verified digital products, code, templates, and creative work — with escrow-backed Naira and multi-currency payments held safely on every order.", action: "Browse the marketplace" },
  careers: { eyebrow: "CAREERS", title: "Build trust into every transaction.", body: "We are building thoughtful tools for the next generation of Nigeria's digital workforce. There are no open roles today, but we would love to hear from exceptional people.", action: "Email our team" },
  disputes: { eyebrow: "RESOLUTION", title: "Fair outcomes, clearly handled.", body: "If delivery and expectations do not match, both parties can submit the agreed brief and work history for a structured review. Funds remain protected while we assess the case.", action: "Contact support" },
  "seller-guidelines": { eyebrow: "SELLER GUIDE", title: "Set clear expectations. Deliver excellent work.", body: "Keep your offer specific, communicate milestones early, and only mark an order delivered when the agreed work is ready to review. Great sellers earn trust over time.", action: "Start seller verification" },
};

export default async function InformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  const href = slug === "careers" || slug === "disputes" ? "mailto:hello@themiddleman.com.ng" : slug === "seller-guidelines" ? "/onboarding/seller" : "/marketplace";
  return <main className="min-h-screen bg-ink text-bone"><header className="border-b border-line"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/" className="font-display text-lg font-bold"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-ember" />The Middleman</Link><Link href="/marketplace" className="text-sm text-slate hover:text-bone">Browse marketplace</Link></div></header><section className="mx-auto max-w-3xl px-6 py-24"><p className="mb-4 text-xs font-medium tracking-[.2em] text-ember">{page.eyebrow}</p><h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">{page.title}</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate">{page.body}</p><Link href={href} className="mt-10 inline-flex rounded-full bg-ember px-6 py-3 font-medium text-ink transition hover:bg-ember/90">{page.action}</Link></section></main>;
}
