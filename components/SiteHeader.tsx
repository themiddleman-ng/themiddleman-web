'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Logo from '@/components/Logo';

type ConversationUnreadRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  messages: { sender_id: string; created_at: string }[] | null;
};

export default function SiteHeader({ isSeller = false }: { isSeller?: boolean }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setUnreadCount(0);
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('id, buyer_id, seller_id, buyer_last_read_at, seller_last_read_at, messages ( sender_id, created_at )')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (cancelled) return;

      if (error) {
        setUnreadCount(0);
        return;
      }

      const conversations = (data ?? []) as ConversationUnreadRow[];

      const count = conversations.reduce((total, conversation) => {
        const isBuyer = conversation.buyer_id === user.id;
        const lastReadAt = isBuyer ? conversation.buyer_last_read_at : conversation.seller_last_read_at;
        const latestIncomingMessage = (conversation.messages ?? [])
          .filter((message) => message.sender_id !== user.id)
          .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];

        if (!latestIncomingMessage) return total;
        if (!lastReadAt) return total + 1;
        return new Date(latestIncomingMessage.created_at) > new Date(lastReadAt) ? total + 1 : total;
      }, 0);

      setUnreadCount(count);
    }

    loadUnreadCount();

    const handleRefresh = () => {
      void loadUnreadCount();
    };

    window.addEventListener('messages:read-updated', handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener('messages:read-updated', handleRefresh);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/signup?mode=signin');
  }

  const desktopLink = 'rounded-full px-3 py-2 transition-colors hover:bg-ember/8 hover:text-bone';
  const mobileLink = 'rounded-lg px-3 py-2.5 text-sm text-bone transition-colors hover:bg-ember/8';

  const unreadBadge = unreadCount > 0 && (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-ember px-1.5 py-0.5 text-[11px] font-semibold leading-none text-ink">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:py-5">
        <Logo className="text-lg" markClass="h-7 w-7" />

        {/* Desktop nav — md and above */}
        <div className="hidden md:flex items-center gap-2 text-sm text-slate">
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/marketplace" className={desktopLink}>Marketplace</Link>
            <Link href="/orders" className={desktopLink}>My Orders</Link>
            {isSeller && <Link href="/gigs/mine" className={desktopLink}>My Products</Link>}
            <Link href="/messages" className={desktopLink}>
              <span className="inline-flex items-center gap-2">
                Messages
                {unreadBadge}
              </span>
            </Link>
            <Link href="/payments" className={desktopLink}>Payments</Link>
            <Link href="/profile" className={desktopLink}>Profile</Link>
          </nav>
          <button
            onClick={handleSignOut}
            className="hidden md:inline-flex rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-slate shadow-sm transition-colors hover:border-ember/40 hover:text-ember"
          >
            Sign out
          </button>
        </div>

        {/* Mobile actions — below md */}
        <div className="flex items-center gap-1 md:hidden">
          <Link href="/messages" className="rounded-full px-3 py-2 text-sm text-slate transition-colors hover:bg-ember/8 hover:text-bone">
            <span className="inline-flex items-center gap-2">
              Messages
              {unreadBadge}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/80 text-slate shadow-sm transition-colors hover:text-bone"
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu sheet */}
      {menuOpen && (
        <div className="border-t border-line bg-white/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            <Link href="/marketplace" onClick={() => setMenuOpen(false)} className={mobileLink}>Marketplace</Link>
            <Link href="/orders" onClick={() => setMenuOpen(false)} className={mobileLink}>My Orders</Link>
            {isSeller && <Link href="/gigs/mine" onClick={() => setMenuOpen(false)} className={mobileLink}>My Products</Link>}
            <Link href="/payments" onClick={() => setMenuOpen(false)} className={mobileLink}>Payments</Link>
            <Link href="/profile" onClick={() => setMenuOpen(false)} className={mobileLink}>Profile</Link>
            <button
              onClick={handleSignOut}
              className="mt-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-slate shadow-sm transition-colors hover:border-ember/40 hover:text-ember"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
