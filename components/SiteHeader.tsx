'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Logo from '@/components/Logo';
import OwnerAvatar from '@/components/profile/OwnerAvatar';
import { useAdminAccount } from '@/lib/account/use-admin-account';
import { publishOwnerAvatar, useOwnerAvatar } from '@/lib/profile/use-owner-avatar';

type HeaderUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function userLabel(user: HeaderUser) {
  const name = user.user_metadata?.full_name;
  return typeof name === 'string' && name.trim() ? name.trim() : user.email ?? 'Your account';
}

export default function SiteHeader({ isSeller: sellerHint = false, compact = false, hideOnMobile = false }: { isSeller?: boolean; compact?: boolean; hideOnMobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const ownerAvatar = useOwnerAvatar(user);
  const isAdmin = useAdminAccount(user?.id);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sellerAccount, setSellerAccount] = useState(sellerHint);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(authUser as HeaderUser | null);
      setAuthResolved(true);
      if (!authUser) {
        setUnreadCount(0);
        setNotificationCount(0);
        return;
      }

      const [sellerResponse, messagesResponse, notificationsResponse] = await Promise.all([
        supabase.from('users').select('is_seller').eq('id', authUser.id).maybeSingle(),
        fetch('/api/conversations', { cache: 'no-store' }),
        fetch('/api/notifications', { cache: 'no-store' }),
      ]);
      if (cancelled) return;
      setSellerAccount(Boolean(sellerResponse.data?.is_seller || sellerHint));
      if (messagesResponse.ok) {
        const result = await messagesResponse.json();
        if (!cancelled) setUnreadCount(result.unreadCount ?? 0);
      } else setUnreadCount(0);
      if (notificationsResponse.ok) {
        const result = await notificationsResponse.json();
        if (!cancelled) setNotificationCount(result.unreadCount ?? 0);
      } else setNotificationCount(0);
    }

    void loadCounts();
    const refresh = () => { void loadCounts(); };
    window.addEventListener('messages:read-updated', refresh);
    window.addEventListener('notifications:updated', refresh);
    window.addEventListener('focus', refresh);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED') {
        void supabase.auth.getUser().then(({ data }) => {
          if (!cancelled) setUser((data.user as HeaderUser | null) ?? null);
        });
      } else {
        setUser((session?.user as HeaderUser | null) ?? null);
      }
      setAuthResolved(true);
      if (!session?.user) {
        setSellerAccount(false);
        setUnreadCount(0);
        setNotificationCount(0);
      } else {
        void supabase.from('users').select('is_seller').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => setSellerAccount(Boolean(data?.is_seller || sellerHint)));
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('messages:read-updated', refresh);
      window.removeEventListener('notifications:updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [sellerHint]);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    publishOwnerAvatar(null);
    setUser(null);
    setMenuOpen(false);
    router.push('/marketplace');
  }

  function openCookieSettings() {
    window.dispatchEvent(new Event('middleman:cookies-open'));
    setMenuOpen(false);
  }

  const desktopLink = 'rounded-full px-3 py-2 text-sm text-bone transition-colors hover:bg-elevated hover:text-bone';
  const mobileLink = 'flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-sm text-bone transition-colors hover:bg-elevated';

  function submitHeaderSearch(event: FormEvent) {
    event.preventDefault();
    const next = searchQuery.trim();
    router.push(next ? `/marketplace?q=${encodeURIComponent(next)}` : '/marketplace');
    setMenuOpen(false);
  }
  const unreadBadge = unreadCount > 0 ? (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e56b27] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  ) : null;
  const notificationBadge = notificationCount > 0 ? (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e56b27] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
      {notificationCount > 99 ? '99+' : notificationCount}
    </span>
  ) : null;

  return (
    <header className={`${hideOnMobile ? 'hidden md:block ' : ''}sticky top-0 z-30 border-b border-line backdrop-blur-xl ${compact ? 'bg-ink/95' : 'bg-ink/95'}`}>
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="z-10 shrink-0">
          <Logo href="/" className="text-lg" markClass="h-7 w-7" variant="horizontal" textClass="text-sm" />
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" aria-label="Main navigation">
          <Link href="/marketplace" className={desktopLink}>Marketplace</Link>
          <Link href="/#how-it-works" className={`${desktopLink} hidden lg:inline-flex`}>How it works</Link>
          <Link href="/#faq" className={`${desktopLink} hidden lg:inline-flex`}>FAQ</Link>
          {user && <>
            <Link href="/orders" data-onboarding-target="orders" className={desktopLink}>Orders</Link>
            <Link href="/messages" data-onboarding-target="messages" className={desktopLink}><span className="inline-flex items-center gap-2">Messages{unreadBadge}</span></Link>
          </>}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <form onSubmit={submitHeaderSearch} className="hidden lg:block" role="search">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                className="h-10 w-44 rounded-full border border-line bg-paper pl-9 pr-3 text-sm text-bone placeholder:text-slate transition focus:w-56 focus:border-ember focus:outline-none focus:ring-4 focus:ring-ember/15 xl:w-56 xl:focus:w-64"
              />
            </label>
          </form>
          <Link href="/browse" aria-label="Search products" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-bone lg:hidden">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" strokeLinecap="round" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={user ? `Open account menu for ${userLabel(user)}` : 'Open account menu'}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-controls="account-menu"
            data-onboarding-target="menu"
            className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-line bg-paper text-bone shadow-sm transition hover:border-ember/60 hover:bg-elevated focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ember/15"
          >
            {user ? (
              <OwnerAvatar
                url={ownerAvatar.url}
                name={userLabel(user)}
                email={user.email}
                size={40}
                className="h-10 w-10"
              />
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-3.4 3.3-5.2 7.5-5.2s6.7 1.8 7.5 5.2" />
              </svg>
            )}
            {!authResolved && <span className="absolute inset-0 rounded-full ring-2 ring-line" aria-hidden="true" />}
            {(unreadCount + notificationCount) > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-ember" aria-label="You have unread updates" />}
          </button>

          {menuOpen && (
            <div id="account-menu" role="menu" className="absolute right-0 top-[calc(100%+0.65rem)] z-50 max-h-[min(78svh,36rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-line bg-paper p-2.5 text-bone shadow-[0_18px_55px_rgba(0,0,0,.45)]">
              {user ? (
                <>
                  <div className="mb-1 flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
                    <OwnerAvatar url={ownerAvatar.url} name={userLabel(user)} email={user.email} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{userLabel(user)}</p>
                      {user.email && <p className="mt-0.5 truncate text-xs text-slate">{user.email}</p>}
                    </div>
                  </div>
                  <nav aria-label="Account navigation" className="space-y-0.5">
                    <Link role="menuitem" href="/profile" data-onboarding-target="profile" className={mobileLink}>Profile</Link>
                    <Link role="menuitem" href="/orders" data-onboarding-target="orders" className={`${mobileLink} md:hidden`}>My orders</Link>
                    {sellerAccount && <Link role="menuitem" href="/gigs/mine" className={mobileLink}>My products</Link>}
                    <Link role="menuitem" href="/notifications" className={mobileLink}><span>Notifications</span>{notificationBadge}</Link>
                    <Link role="menuitem" href="/payments" className={mobileLink}>Payments</Link>
                    <Link role="menuitem" href="/settings" className={mobileLink}>Settings</Link>
                    <Link role="menuitem" href="/security" className={mobileLink}>Authenticator &amp; security</Link>
                    {isAdmin && <Link role="menuitem" href="/admin" className={mobileLink}>Admin workspace</Link>}
                  </nav>
                  <div className="my-2 border-t border-line pt-2">
                    <button type="button" role="menuitem" onClick={handleSignOut} className={`${mobileLink} w-full text-left text-ember hover:bg-elevated`}>Sign out</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-3 pb-3 pt-2">
                    <p className="font-display text-lg font-semibold">Welcome to The Middleman</p>
                    <p className="mt-1 text-xs leading-5 text-slate">Browse products now, then sign in when you’re ready to buy or sell.</p>
                  </div>
                  <nav aria-label="Guest account menu" className="space-y-0.5">
                    <Link role="menuitem" href="/marketplace" className={mobileLink}>Browse products</Link>
                    <Link role="menuitem" href="/about" className={mobileLink}>About The Middleman</Link>
                    <button type="button" role="menuitem" onClick={openCookieSettings} className={`${mobileLink} w-full text-left`}>Cookie settings</button>
                  </nav>
                  <div className="mt-2 grid gap-2 border-t border-line px-1 pt-3">
                    <Link role="menuitem" href="/signup?mode=signin" className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-elevated px-3 text-sm font-semibold text-bone transition hover:bg-paper">Log in</Link>
                    <Link role="menuitem" href="/signup?mode=signup" className="flex min-h-11 items-center justify-center rounded-xl bg-[#C2410C] px-3 text-sm font-semibold text-white transition hover:bg-[#9A3412]">Create an account</Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
