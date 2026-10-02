import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import DisputeResponses from './dispute-responses';

export default function DisputesPage() {
  return <main className="min-h-screen bg-ink text-bone"><SiteHeader/><section className="mx-auto max-w-3xl px-5 py-12"><h1 className="font-display text-3xl font-bold">Seller dispute responses</h1><p className="mt-4 text-slate">Respond within 24 hours. Admin reviews the listing, package and evidence. Buyer identity stays private in platform records.</p><Link href="/legal/disputes" className="mt-4 inline-block text-ember">Dispute rules</Link><DisputeResponses/></section></main>;
}
