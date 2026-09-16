export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Create an account',
  description: 'Join The Middleman to buy or sell digital work with protected payments.',
  robots: { index: false, follow: true },
};
import PageClient from './PageClient';
export default function Page(props: any) { return <PageClient {...props} />; }
