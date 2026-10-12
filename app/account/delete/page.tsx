import SiteHeader from '@/components/SiteHeader';
import AccountDeletionClient from './page-client';

export const metadata = {
  title: 'Delete account',
  robots: { index: false, follow: false },
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader compact />
      <AccountDeletionClient />
    </main>
  );
}
