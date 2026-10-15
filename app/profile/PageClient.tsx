'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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

const AVATAR_BUCKET = 'profile-avatars';
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[@.\s_-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function avatarSignedUrl(path: string | null) {
  if (!path) return '';
  const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? '';
}

function VerificationBadge({ status }: { status: SellerProfile['verification_status'] }) {
  const classes: Record<SellerProfile['verification_status'], string> = {
    approved: 'bg-[#edf4ed] text-[#3f6446]',
    pending: 'bg-[#f6eee2] text-[#8c5a22]',
    rejected: 'bg-[#faece8] text-[#9a4434]',
    draft: 'bg-[#f1f1ee] text-[#606b73]',
  };
  const labels: Record<SellerProfile['verification_status'], string> = {
    approved: 'Verified seller',
    pending: 'Verification in review',
    rejected: 'Verification needs an update',
    draft: 'Verification not submitted',
  };
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function orderStatusStyle(status: string) {
  const normalized = status.toLowerCase();
  if (['completed', 'approved', 'delivered'].includes(normalized)) return 'bg-[#e5f2ea] text-[#3c704e]';
  if (['in_progress', 'in_escrow', 'paid'].includes(normalized)) return 'bg-[#e7eff8] text-[#365d83]';
  if (['pending_payment', 'pending'].includes(normalized)) return 'bg-[#fff0e5] text-[#a6531e]';
  if (['cancelled', 'canceled', 'refunded', 'rejected'].includes(normalized)) return 'bg-[#f8e9e7] text-[#9b493d]';
  return 'bg-[#f0f1f3] text-[#5c6874]';
}

function PhotoAvatar({ url, name, email }: { url: string; name: string | null; email: string }) {
  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9e1d6] text-2xl font-semibold text-[#23384d] ring-4 ring-white shadow-[0_4px_18px_rgba(29,39,51,.10)] sm:h-28 sm:w-28 sm:text-3xl">
      {url ? (
        <Image src={url} alt="" fill sizes="112px" unoptimized className="object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name, email)}</span>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserRow | null>(null);
  const [authUserId, setAuthUserId] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [savedExtras, setSavedExtras] = useState({ displayName: '', phone: '', bio: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace('/signup?mode=signin');
        return;
      }

      const storedPath = typeof authUser.user_metadata?.profile_avatar_path === 'string'
        ? authUser.user_metadata.profile_avatar_path
        : null;
      const storedAvatarUrl = await avatarSignedUrl(storedPath);
      if (active) {
        setAuthUserId(authUser.id);
        const extras = { displayName: String(authUser.user_metadata?.display_name || ''), phone: String(authUser.user_metadata?.phone || ''), bio: String(authUser.user_metadata?.bio || '') };
        setSavedExtras(extras); setDisplayName(extras.displayName); setPhone(extras.phone); setBio(extras.bio);
        setAvatarPath(storedPath);
        setAvatarUrl(storedAvatarUrl);
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
      setUser(userRow as UserRow | null);
      setFullName(userRow?.full_name || '');
      setLocation(userRow?.state || '');
      setOrders((orderRows as unknown as OrderRow[]) || []);

      if (userRow?.is_seller) {
        const { data: profileRow } = await supabase
          .from('seller_profiles')
          .select('display_name, verification_status')
          .eq('user_id', authUser.id)
          .single();
        if (active) setSellerProfile(profileRow as SellerProfile | null);
      }

      if (active) setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, [router]);

  async function handleAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setAvatarError('');
    setAvatarMessage('');
    if (!file || !authUserId) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('This photo is over 3 MB. Choose a smaller image.');
      return;
    }

    setAvatarLoading(true);
    const path = `${authUserId}/avatar`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) {
      setAvatarError(uploadError.message.includes('Bucket not found')
        ? 'Profile photos are being set up. Please try again later.'
        : 'We couldn’t upload that photo. Please try again.');
      setAvatarLoading(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { profile_avatar_path: path },
    });
    if (metadataError) {
      setAvatarError('The photo uploaded, but we couldn’t save it to your profile. Please try again.');
      setAvatarLoading(false);
      return;
    }

    setAvatarPath(path);
    setAvatarUrl(await avatarSignedUrl(path));
    setAvatarMessage('Your profile photo is updated.');
    setAvatarLoading(false);
  }

  async function removeAvatar() {
    if (!avatarPath) return;
    setAvatarError('');
    setAvatarMessage('');
    setAvatarLoading(true);

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { profile_avatar_path: null },
    });
    if (metadataError) {
      setAvatarError('We couldn’t remove the photo from your profile. Please try again.');
      setAvatarLoading(false);
      return;
    }

    const { error: storageError } = await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
    setAvatarPath(null);
    setAvatarUrl('');
    setAvatarMessage(storageError ? 'The photo is no longer shown on your profile.' : 'Your profile photo has been removed.');
    setAvatarLoading(false);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUserId || !user || profileSaving) return;
    setProfileSaving(true); setProfileNotice(''); setProfileError('');
    try {
      const { error } = await supabase.from('users').update({ full_name: fullName.trim(), state: location.trim() || null }).eq('id', authUserId);
      if (error) throw error;
      setUser({ ...user, full_name: fullName.trim(), state: location.trim() || null });
      const { error: metadataError } = await supabase.auth.updateUser({ data: { display_name: displayName.trim(), phone: phone.trim(), bio: bio.trim() } });
      if (metadataError) { setProfileError('Your name and state were saved, but the other details could not be saved. Please retry.'); return; }
      setSavedExtras({ displayName: displayName.trim(), phone: phone.trim(), bio: bio.trim() });
      setProfileNotice('Your profile has been saved.');
    } catch { setProfileError('We could not save your profile. Your changes are still here; please try again.'); }
    finally { setProfileSaving(false); }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] text-[#1d2733]">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#687581] sm:px-6">Loading your profile…</div>
      </main>
    );
  }

  const roleLabel = user?.is_buyer && user?.is_seller
    ? 'Buyer and seller'
    : user?.is_seller
      ? 'Seller'
      : 'Buyer';

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_88%_4%,rgba(227,127,72,.15),transparent_28%),radial-gradient(ellipse_at_8%_42%,rgba(76,143,153,.09),transparent_30%),#f6f4ef] text-[#1d2733]">
      <SiteHeader isSeller={user?.is_seller} />

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
        <div className="mb-6">
          <div>
            <p className="text-sm font-semibold text-[#2e7776]">Account</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-.035em] text-[#1b3044] sm:text-4xl">My profile</h1>
          </div>
        </div>

        <p className="-mt-3 mb-7 text-sm text-[#606b80]">Manage how you appear on The Middleman.</p>
        <section className="rounded-[28px] border border-white/80 bg-[linear-gradient(115deg,#fffaf3_0%,#fffdf9_58%,#edf5f3_100%)] p-5 shadow-[0_12px_40px_rgba(48,40,31,.06)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <PhotoAvatar url={avatarUrl} name={user?.full_name ?? null} email={user?.email ?? ''} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[#687581]">{roleLabel}{user?.state ? ` · ${user.state}` : ''}</p>
              </div>
              <h2 className="mt-2 break-words font-display text-2xl font-semibold tracking-[-.025em] text-[#1b3044] sm:text-3xl">
                {user?.full_name?.trim() ? user.full_name : user?.email}
              </h2>
              <p className="mt-1 truncate text-sm text-[#687581]">{user?.email}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelected}
                className="sr-only"
                aria-label="Choose a professional profile photo"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="min-h-11 rounded-xl bg-[#de641e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c95415] disabled:cursor-wait disabled:opacity-60"
              >
                {avatarLoading ? 'Uploading photo…' : avatarUrl ? 'Change photo' : 'Add profile photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={avatarLoading}
                  className="min-h-10 rounded-xl px-4 py-2 text-sm font-semibold text-[#76594a] transition hover:bg-[#f7efe8] disabled:opacity-60"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-[#eee7de] pt-5">
            <p className="text-sm font-semibold text-[#2e7776]">A note about your photo</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6b7782]">Choose a clear, professional headshot. Avoid logos, group photos and heavy filters. JPG, PNG or WebP, up to 3 MB. The photo is stored privately and only shown in your account.</p>
            {avatarMessage && <p role="status" className="mt-3 text-sm font-medium text-[#436348]">{avatarMessage}</p>}
            {avatarError && <p role="alert" className="mt-3 text-sm font-medium text-[#9b3e2b]">{avatarError}</p>}
          </div>
        </section>

        <section className="mm-profile-editor mt-6 rounded-xl border border-[#e1e5ed] bg-white p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Personal information</h2>
          <p className="mt-1 text-sm text-[#606b80]">Keep your account details up to date.</p>
          <form onSubmit={saveProfile} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">Full name<input autoComplete="name" required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 block min-h-12 w-full border px-3" /></label>
            <label className="text-sm font-medium">Display name<input autoComplete="nickname" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 block min-h-12 w-full border px-3" /></label>
            <label className="text-sm font-medium">Email address<input type="email" value={user?.email || ''} readOnly className="mt-2 block min-h-12 w-full border px-3" /><span className="mt-1 block text-xs text-[#606b80]">Your sign-in email.</span></label>
            <label className="text-sm font-medium">WhatsApp number<input type="tel" autoComplete="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 block min-h-12 w-full border px-3" /></label>
            <label className="text-sm font-medium sm:col-span-2">Bio<textarea rows={3} maxLength={200} value={bio} onChange={(event) => setBio(event.target.value)} className="mt-2 block w-full border p-3" /><span className="mt-2 block text-right text-xs text-[#606b80]">{bio.length}/200</span></label>
            <p className="text-xs text-[#606b80] sm:col-span-2">Your email and phone number are private. Your seller listing name is managed separately during seller setup.</p>
            <label className="text-sm font-medium">State of residence<input autoComplete="address-level1" maxLength={80} value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 block min-h-12 w-full border px-3" /></label>
            <div className="flex flex-wrap items-end justify-end gap-3"><button type="button" onClick={() => { setFullName(user?.full_name || ''); setLocation(user?.state || ''); setDisplayName(savedExtras.displayName); setPhone(savedExtras.phone); setBio(savedExtras.bio); setProfileNotice(''); setProfileError(''); }} className="min-h-11 rounded-lg border border-[#e1e5ed] px-4 text-sm">Cancel changes</button><button type="submit" disabled={profileSaving || !fullName.trim()} className="min-h-11 rounded-lg bg-[#ed6509] px-5 text-sm font-semibold text-white disabled:opacity-50">{profileSaving ? 'Saving…' : 'Save changes'}</button></div>
            {profileNotice && <p role="status" className="text-sm text-[#13724a] sm:col-span-2">{profileNotice}</p>}{profileError && <p role="alert" className="text-sm text-[#b42318] sm:col-span-2">{profileError}</p>}
          </form>
        </section>
        <Link href="/settings" className="mt-6 flex items-center justify-between rounded-xl border border-[#e1e5ed] bg-white p-5 text-sm font-semibold">Account settings<span className="font-normal text-[#606b80]">Security and preferences</span></Link>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-[24px] bg-[#fffdf9] p-5 shadow-[0_10px_34px_rgba(48,40,31,.045)] ring-1 ring-[#dce8ea] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#a95320]">Recent activity</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[#1b3044] sm:text-2xl">Your orders</h2>
              </div>
              <Link href="/orders" className="text-sm font-semibold text-[#a95320] hover:underline">View all</Link>
            </div>

            {orders.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[#edf4f6] px-4 py-7 text-center">
                <p className="text-sm text-[#65727d]">Your purchases and their progress will appear here.</p>
                <Link href="/marketplace" className="mt-3 inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-[#a95320] hover:bg-white">
                  Explore products
                </Link>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-[#eee7de]">
                {orders.map((order) => (
                  <div key={order.id} className="flex min-w-0 flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#27394b]">{order.gigs?.title ?? 'Product'}</p>
                      <p className="mt-1 text-xs text-[#74808a]">₦{order.amount.toLocaleString()} <span aria-hidden="true">·</span> {new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${orderStatusStyle(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-[24px] border border-[#cddfdd] bg-[linear-gradient(145deg,#e5f2ef_0%,#eaf0f8_100%)] p-5 text-[#1b3044] shadow-[0_10px_34px_rgba(48,40,31,.045)] sm:p-6">
            <p className="text-sm font-semibold text-[#347a76]">{user?.is_seller ? 'Creator account' : 'Your account'}</p>
            <h2 className="mt-1 font-display text-xl font-semibold">{user?.is_seller ? 'Your seller status' : 'Buy and sell with one account'}</h2>
            <p className="mt-3 text-sm leading-6 text-[#526777]">
              {user?.is_seller
                ? 'Your product tools are in the main navigation. Check your current seller review status here.'
                : 'Your buyer account can also become a seller whenever you’re ready.'}
            </p>
            {user?.is_seller ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/75 px-4 py-3">
                <span className="text-sm font-medium text-[#526777]">Verification</span>
                {sellerProfile && <VerificationBadge status={sellerProfile.verification_status} />}
              </div>
            ) : (
              <Link href="/onboarding/role" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#de641e] px-4 text-sm font-semibold text-white transition hover:bg-[#c95415]">
                Set up selling
              </Link>
            )}
            {user?.is_seller && (
              <Link href="/seller-support" className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-[#b7cfcd] bg-white/70 px-4 text-sm font-semibold text-[#295e65] transition hover:bg-white">
                Operations messages
              </Link>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

