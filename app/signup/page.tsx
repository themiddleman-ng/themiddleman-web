export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Create an account',
  description: 'Create an account to browse digital products or list one of your own. Purchases are paused, so signing up does not start a payment.',
  robots: { index: false, follow: true },
};
import PageClient from './PageClient';
export default function Page(props: any) { return <PageClient {...props} />; }
