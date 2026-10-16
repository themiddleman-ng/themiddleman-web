export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Create an account',
  description: 'Create an account to buy digital products, or list one of your own. Checkout is in Naira through Paystack.',
  robots: { index: false, follow: true },
};
import PageClient from './PageClient';
export default function Page(props: any) { return <PageClient {...props} />; }
