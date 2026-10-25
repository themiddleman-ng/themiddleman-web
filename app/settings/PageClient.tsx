'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { useAdminAccount } from '@/lib/account/use-admin-account';
import { supabase } from '@/lib/supabaseClient';
import { signinHref } from '@/lib/auth/signin-redirect.mjs';

export default function SettingsPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [welcomeReset, setWelcomeReset] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const isAdmin = useAdminAccount(userId);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (!user) router.replace(signinHref('/settings'));
      else {
        setUserId(user.id);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [router]);

  function replayWelcome() {
    setWelcomeReset(true);
    window.dispatchEvent(new Event('middleman:onboarding-reset'));
    window.setTimeout(() => setWelcomeReset(false), 3500);
  }

  function openCookieSettings() {
    window.dispatchEvent(new Event('middleman:cookies-open'));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] text-[#1d2733]">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-[#687581] sm:px-6">Loading your settings…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_88%_4%,rgba(227,127,72,.12),transparent_28%),#f7f3ec] text-[#1d2733]">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
        <div className="mb-7">
          <p className="text-sm font-medium text-[#111111] underline decoration-[#F97316] underline-offset-2">Your account</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-.035em] text-[#1b3044] sm:text-4xl">Settings</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#687581]">Manage your profile, the welcome tour and privacy choices.</p>
        </div>

        <div className="divide-y divide-[#eee7de] rounded-[24px] bg-[#fffdf9] px-5 shadow-[0_12px_40px_rgba(48,40,31,.06)] sm:px-7">
          <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
            <div>
              <p className="text-sm font-semibold text-[#26384a]">Profile</p>
              <p className="mt-1 text-sm leading-6 text-[#6b7782]">Update your photo and view your account details.</p>
            </div>
            <Link href="/profile" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-[#ddd5c9] px-4 text-sm font-semibold text-[#304458] transition hover:bg-[#f7f2eb] sm:w-auto">Open profile</Link>
          </section>

          <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
            <div>
              <p className="text-sm font-semibold text-[#26384a]">Welcome tour</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#6b7782]">Start again from the friendly welcome question. Pick “I’m new here” for the guided tour, or skip if you already know your way around.</p>
              {welcomeReset && <p role="status" className="mt-2 text-sm font-medium text-[#426348]">The welcome question is ready.</p>}
            </div>
            <button type="button" onClick={replayWelcome} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-[#183149] px-4 text-sm font-semibold text-white transition hover:bg-[#24445f] sm:w-auto">Replay welcome</button>
          </section>

          <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
            <div>
              <p className="text-sm font-semibold text-[#26384a]">Cookie preferences</p>
              <p className="mt-1 text-sm leading-6 text-[#6b7782]">Choose whether to allow optional analytics. Essential storage stays on for sign-in and security.</p>
            </div>
            <button type="button" onClick={openCookieSettings} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-[#ddd5c9] px-4 text-sm font-semibold text-[#304458] transition hover:bg-[#f7f2eb] sm:w-auto">Review cookies</button>
          </section>

          <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
            <div>
              <p className="text-sm font-semibold text-[#26384a]">Authenticator app</p>
              <p className="mt-1 text-sm leading-6 text-[#6b7782]">Add a 6-digit code from Google Authenticator or Authy. This is the same “authenticator” used to unlock admin tools.</p>
            </div>
            <Link href="/security" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-[#ddd5c9] px-4 text-sm font-semibold text-[#304458] transition hover:bg-[#f7f2eb] sm:w-auto">Set up authenticator</Link>
          </section>

          <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
            <div>
              <p className="text-sm font-semibold text-[#26384a]">Admin workspace</p>
              {isAdmin ? (
                <p className="mt-1 text-sm leading-6 text-[#6b7782]">This account is a platform admin. Open Admin from here or the account photo menu. If it asks for a code first, finish the authenticator setup above.</p>
              ) : (
                <p className="mt-1 text-sm leading-6 text-[#6b7782]">Admin tools are only shown to platform operators. This account is a regular buyer or seller, so there is no Admin page to open.</p>
              )}
            </div>
            {isAdmin ? (
              <Link href="/admin" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-[#183149] px-4 text-sm font-semibold text-white transition hover:bg-[#24445f] sm:w-auto">Open admin</Link>
            ) : (
              <span className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-[#eee7de] px-4 text-sm text-[#7a8691] sm:w-auto">Not an admin account</span>
            )}
          </section>

          <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
            <div>
              <p className="text-sm font-semibold text-[#26384a]">Account removal</p>
              <p className="mt-1 text-sm leading-6 text-[#6b7782]">Review what happens to your account and records before deleting it.</p>
            </div>
            <Link href="/account/delete" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[#91432b] transition hover:bg-[#faeee6] sm:w-auto">Delete account</Link>
          </section>
        </div>
      </div>
    </main>
  );
}

