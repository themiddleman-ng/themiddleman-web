'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SiteHeader from '@/components/SiteHeader';

type UserRow = {
  full_name: string | null;
  email: string;
  state: string | null;
  is_buyer: boolean;
  is_seller: boolean;
};

type SellerProfile = {
  display_name: string;
  verification_status: 'draft' | 'pending' | 'approved' | 'rejected';
};

type OrderRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  gigs: { title: string } | null;
};

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function VerificationBadge({ status }: { status: SellerProfile['verification_status'] }) {
  const styles: Record<string, string> = {
    approved: 'border-ember/40 bg-ember/10 text-ember',
    pending: 'border-line text-slate',
    rejected: 'border-red-900/40 bg-red-950/20 text-red-400',
    draft: 'border-line text-slate',
  };
  const labels: Record<string, string> = {
    approved: 'Verified seller',
    pending: 'Verification pending',
    rejected: 'Verification rejected',
    draft: 'Not submitted',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserRow | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/signup?mode=signin');
        return;
      }

      const [{ data: userRow }, { data: orderRows }] = await Promise.all([
        supabase.from('users').select('full_name, email, state, is_buyer, is_seller').eq('id', authUser.id).single(),
        supabase
          .from('orders')
          .select('id, amount, status, created_at, gigs(title)')
          .eq('buyer_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (!active) return;
      setUser(userRow as UserRow);
      setOrders((orderRows as unknown as OrderRow[]) || []);

      if (userRow?.is_seller) {
        const { data: profileRow } = await supabase
          .from('seller_profiles')
          .select('display_name, verification_status')
          .eq('user_id', authUser.id)
          .single();
        if (active) setSellerProfile(profileRow as SellerProfile);
      }

      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/signup');
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-ink text-bone">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-slate sm:px-6">Loading your profile...</div>
      </main>
    );
  }

  const roleLabel = user?.is_buyer && user?.is_seller
    ? 'Buyer & Seller'
    : user?.is_seller
    ? 'Seller'
    : 'Buyer';

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader isSeller={user?.is_seller} />

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-9">
        <div className="rounded-2xl border border-line bg-paper p-5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-ember/30 bg-ember/15 font-display text-xl font-bold text-ember sm:h-16 sm:w-16 sm:text-2xl">
                {initials(user?.full_name ?? null, user?.email ?? '')}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate">Your profile</p>
                <h1 className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">
                  {user?.full_name?.trim() ? user.full_name : user?.email}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate">
                    {roleLabel}{user?.state ? ` · ${user.state}` : ''}
                  </span>
                  {user?.is_seller && sellerProfile && (
                    <VerificationBadge status={sellerProfile.verification_status} />
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-2.5">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("middleman:onboarding-replay"))}
                className="min-h-11 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-bone transition-colors hover:border-ember/40 hover:text-ember sm:rounded-full"
              >
                Replay the quick tour
              </button>
              {user?.is_seller && (
                <Link
                  href="/seller-support"
                  className="min-h-11 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-bone transition-colors hover:border-ember/40 hover:text-ember sm:rounded-full"
                >
                  Operations messages
                </Link>
              )}
              <Link
                href="/onboarding/role"
                className="min-h-11 rounded-xl border border-line px-4 py-2.5 text-center text-sm font-semibold text-bone transition-colors hover:border-slate sm:rounded-full"
              >
                Edit account preferences
              </Link>
              <button
                onClick={handleSignOut}
                className="min-h-11 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-slate transition-colors hover:border-red-900/50 hover:text-red-400 sm:rounded-full"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:mt-7 sm:gap-6 lg:grid-cols-[1.4fr_.6fr]">
          <section className="min-w-0 rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-[.16em] text-ember">RECENT ORDERS</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Your activity</h2>
              </div>
              <Link href="/orders" className="text-sm font-semibold text-ember hover:text-ember/80">
                View all
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-line py-10 text-center">
                <p className="text-sm text-slate">No orders yet.</p>
                <Link href="/marketplace" className="mt-3 inline-block text-sm font-semibold text-ember hover:text-ember/80">
                  Browse the marketplace
                </Link>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-line">
                {orders.map((order, index) => (
              <div key={order.id} className="flex min-w-0 flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink border border-line font-mono text-sm text-ember">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{order.gigs?.title ?? 'Product'}</p>
                        <p className="text-xs text-slate font-mono">₦{order.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-line px-3 py-1 text-xs text-slate capitalize">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <p className="text-xs font-bold tracking-[.16em] text-ember">ACCOUNT STATUS</p>
            <h2 className="mt-2 font-display text-2xl font-bold">
              {user?.is_seller ? 'Selling on The Middleman' : 'Ready to buy'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              {user?.is_seller
                ? 'Manage your products, verification details and account preferences here.'
                : 'Browse product details before you buy. Checkout is in Naira through Paystack.'}
            </p>
            {!user?.is_seller && (
              <Link
                href="/onboarding/role"
                className="mt-6 inline-flex rounded-full border border-line px-5 py-3 text-sm font-semibold text-bone hover:border-slate transition-colors"
              >
                Start selling too
              </Link>
            )}
            <Link
              href="/payments"
              className="mt-3 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-semibold text-ink hover:bg-ember/90 transition-colors"
            >
              View payment activity
            </Link>
          </aside>
        </div>

        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#e8d8cb] bg-[#fffaf5] p-5 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#26384a]">Account and privacy</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#66717b]">You can permanently remove your account and personal profile details. Order and payment records may be retained in de-identified form.</p>
          </div>
          <Link href="/account/delete" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[#d8bca9] px-4 py-2.5 text-sm font-semibold text-[#8b4025] transition hover:bg-[#faeee6]">Delete account</Link>
        </section>
      </div>
    </main>
  );
}

