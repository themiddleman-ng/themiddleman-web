'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { signinHref } from '@/lib/auth/signin-redirect.mjs';

export default function AccountDeletionClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        router.replace(signinHref('/account/delete'));
        return;
      }
      setEmail(data.user.email ?? '');
      setLoadingAccount(false);
    });
    return () => { active = false; };
  }, [router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (confirmation !== 'DELETE' || !understood || !password) {
      setError('Confirm the deletion, enter your password and check the acknowledgement.');
      return;
    }
    if (!email) {
      setError('We could not verify the email on this account. Sign in again and retry.');
      return;
    }

    setSubmitting(true);
    const reauth = await supabase.auth.signInWithPassword({ email, password });
    if (reauth.error) {
      setError('That password could not be confirmed. Check it and try again.');
      setSubmitting(false);
      return;
    }

    const [assurance, factors] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
    const hasVerifiedFactor = factors.data?.all.some((factor) => factor.status === 'verified') ?? false;
    if (hasVerifiedFactor && assurance.data?.currentLevel !== 'aal2') {
      window.location.assign('/security?next=%2Faccount%2Fdelete');
      return;
    }

    const response = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error || 'Your account could not be deleted. Please try again.');
      setSubmitting(false);
      return;
    }

    setEmailSent(Boolean(result.emailSent));
    setCompleted(true);
    setPassword('');
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }

  if (loadingAccount) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate sm:px-6">Checking your account…</div>;
  }

  if (completed) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-line bg-paper p-5 sm:p-8">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#e9f3e9] text-lg text-[#35633e]" aria-hidden="true">✓</div>
          <h1 className="mt-5 font-display text-3xl font-bold text-[#23384d]">Your account is deleted</h1>
          <p className="mt-3 text-sm leading-6 text-slate">Your profile, conversations and seller payout details have been removed, and your active listings were archived. Order and payment records may remain in de-identified form for transaction history and legal obligations.</p>
          <p className="mt-3 text-sm leading-6 text-slate">{emailSent ? 'We sent a confirmation email with a way to share feedback.' : 'The account is closed, but we could not send the confirmation email.'}</p>
          <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#de641e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c95415]">Back to the marketplace</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-12">
      <Link href="/profile" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#596a78] hover:text-[#c65316]">
        <span aria-hidden="true">←</span> Back to profile
      </Link>

      <div className="mt-4 rounded-2xl border border-[#ead9cd] bg-[#fffdf9] p-5 text-[#243344] shadow-[0_12px_40px_rgba(39,45,51,.08)] sm:mt-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[.12em] text-[#a94b18]">ACCOUNT AND PRIVACY</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-[-.03em] sm:text-4xl">Delete your account</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f6c78]">This permanently closes your Middleman account. You will no longer be able to sign in or manage products on it.</p>

        <div className="mt-6 space-y-3 rounded-xl bg-[#f7f3ed] p-4 text-sm leading-6 text-[#4f5d69]">
          <p><strong className="text-[#25384b]">Your profile and conversations will be removed.</strong> Seller payout details and identity documents will be deleted, and active listings will be archived.</p>
          <p><strong className="text-[#25384b]">Some transaction records will remain.</strong> Order and payment history may be retained in de-identified form for accounting and legal obligations.</p>
          <p>Open orders, disputes or support cases must be resolved before deletion can finish.</p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="delete-account-email" className="block text-sm font-medium text-[#33404d]">Account email</label>
            <input id="delete-account-email" value={email} readOnly className="mt-1.5 w-full rounded-xl border border-[#ded6cb] bg-[#f6f2ec] px-3.5 py-3 text-[15px] text-[#65717c]" />
          </div>
          <div>
            <label htmlFor="delete-account-password" className="block text-sm font-medium text-[#33404d]">Confirm your password</label>
            <input id="delete-account-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-[#ded6cb] bg-white px-3.5 py-3 text-[15px] text-[#1d2733] outline-none focus:border-[#de641e] focus:ring-4 focus:ring-[#de641e]/10" />
            <p className="mt-1.5 text-xs leading-5 text-[#75808a]">We ask you to sign in again before making this change.</p>
          </div>
          <div>
            <label htmlFor="delete-account-confirmation" className="block text-sm font-medium text-[#33404d]">Type <span className="font-bold">DELETE</span> to confirm</label>
            <input id="delete-account-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoCapitalize="characters" autoComplete="off" spellCheck={false} required className="mt-1.5 w-full rounded-xl border border-[#ded6cb] bg-white px-3.5 py-3 text-[15px] text-[#1d2733] outline-none focus:border-[#de641e] focus:ring-4 focus:ring-[#de641e]/10" />
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-[#ead9cd] p-3.5 text-sm leading-5 text-[#5f6c78]">
            <input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#c65316]" />
            <span>I understand the account cannot be restored and some de-identified transaction records will be retained.</span>
          </label>
          {error && <p role="alert" className="rounded-xl bg-[#fff0ea] px-3.5 py-3 text-sm leading-5 text-[#933d27]">{error}</p>}
          <button type="submit" disabled={submitting || confirmation !== 'DELETE' || !understood || !password} className="min-h-12 w-full rounded-xl bg-[#9d3d2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#843122] focus:outline-none focus:ring-4 focus:ring-[#9d3d2b]/15 disabled:cursor-not-allowed disabled:opacity-45">
            {submitting ? 'Removing your account…' : 'Delete my account'}
          </button>
        </form>
      </div>
    </section>
  );
}
