export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Marketplace',
  description: 'Browse digital products and services from verified Nigerian creators.',
  alternates: { canonical: '/marketplace' },
};
import PageClient from './PageClient';
export default function Page(props: any) { return <PageClient {...props} />; }
