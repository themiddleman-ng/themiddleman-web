import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SaveProductButton, ShortlistPanel } from "@/components/marketplace/Shortlist";
import GigPreview from '@/components/marketplace/GigPreview';
import catalogue from '@/fixtures/catalogue-review.json';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Catalogue design review', robots: { index: false, follow: false } };
export default function DesignPreview() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
  return <main className="mx-auto w-full max-w-7xl px-5 py-10 text-bone"><Link href="/marketplace" className="text-sm text-[#a94b18] underline">Back to marketplace</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight">Catalogue design review</h1><p className="mt-3 max-w-2xl text-slate">Illustrative covers for the eight existing listings, followed by four new product proposals. These mockups are not seller deliverables. Draft products are not published or available to buy.</p><ShortlistPanel />{[{title:'Existing listing concepts',items:catalogue.existing},{title:'New product drafts',items:catalogue.drafts}].map(group=><section key={group.title} className="mt-10"><h2 className="mb-5 text-xl font-semibold">{group.title}</h2><div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{group.items.map(item=><article key={item.id}><div className="aspect-[4/3] overflow-hidden rounded-lg"><GigPreview category={item.category} seed={item.id} title={item.title}/></div><h3 className="mt-3 font-semibold">{item.title}</h3>{!('published' in item) && <div className="mt-2"><SaveProductButton product={item} /></div>}<p className="mt-2 text-sm text-[#a94b18]">{'published' in item ? 'Proposed price' : 'Listed price'} · ₦{item.price_ngn.toLocaleString('en-NG')}</p>{'description' in item && <p className="mt-2 text-sm leading-6 text-slate">{String(item.description)}</p>}</article>)}</div></section>)}</main>;
}
