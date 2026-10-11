export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Marketplace',
  description: 'Browse digital products from Nigerian creators, compare listing details, and view prices in Naira.',
  alternates: { canonical: '/marketplace' },
};
import PageClient from './PageClient';
export default function Page(props: any) { return <PageClient {...props} />; }
