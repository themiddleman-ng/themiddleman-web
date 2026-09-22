'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ShaderBackground from '@/components/ShaderBackground';
import Logo from '@/components/Logo';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [wantsToBuy, setWantsToBuy] = useState(true);
  const [wantsToSell, setWantsToSell] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasSelection = wantsToBuy || wantsToSell;

  async function handleContinue() {
    setLoading(true);
    setError('');

    if (!hasSelection) {
      setError('At least one option is required.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be logged in to continue.'); setLoading(false); return; }

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_buyer: wantsToBuy, is_seller: wantsToSell })
      .eq('id', user.id);

    if (updateError) {
      // If this fires with "0 rows" style issues, the signup trigger never created
      // the users row for this account — that's a backend problem, not something
      // the person can fix by retrying.
      setError('We could not save your choice. Please contact support if this keeps happening.');
      setLoading(false);
      return;
    }
    router.push(wantsToSell ? '/onboarding/seller' : '/marketplace');
  }

  const choices = [
    {
      active: wantsToBuy,
      setActive: setWantsToBuy,
      number: '01',
      title: 'BUY DIGITAL PRODUCTS',
      text: 'Discover software, code, templates and other digital products to use or build with.',
      tag: 'Buyer',
    },
    {
      active: wantsToSell,
      setActive: setWantsToSell,
      number: '02',
      title: 'SELL DIGITAL PRODUCTS',
      text: 'List your software, code or digital products and make them available to buyers.',
      tag: 'Seller',
    },
  ];

  return (
    <main className="auth-shell-shader">
      <ShaderBackground variant="silk" />
      <section className="relative z-10 w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Logo variant="vertical" />
          <span className="rounded-full border border-ember/20 bg-white/70 px-3 py-1 text-xs font-medium text-slate shadow-sm">Step 1 of 2</span>
        </div>

        <div className="auth-glass-card overflow-hidden">
          <div className="border-b border-line bg-[radial-gradient(circle_at_top_right,_rgba(242,100,25,.18),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,.88),rgba(247,243,236,.92))] px-6 py-10 sm:px-10">
            <p className="text-xs font-semibold tracking-[.2em] text-ember">MAKE IT YOURS</p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              How would you like to use<br className="hidden sm:block" /> The Middleman?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate sm:text-base">
              Choose one path or both. Your account adapts to what you want to buy or sell, and you can change these
              preferences later.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="grid gap-4 sm:grid-cols-2">
              {choices.map((choice) => (
                <button
                  type="button"
                  key={choice.tag}
                  onClick={() => choice.setActive(!choice.active)}
                  className={`group relative rounded-2xl border p-6 text-left transition duration-200 ${
                    choice.active
                      ? 'border-ember bg-ember/10 shadow-[0_18px_40px_rgba(242,100,25,.15)] ring-1 ring-ember/30'
                      : 'border-line bg-[rgba(255,255,255,0.68)] hover:-translate-y-0.5 hover:border-ember/30 hover:shadow-[0_14px_30px_rgba(31,21,12,.08)]'
                  }`}
                >
                  <span className="font-mono text-xs font-semibold tracking-[.2em] text-ember">{choice.number}</span>
                  <span
                    className={`absolute right-5 top-5 grid h-6 w-6 place-items-center rounded-full border text-xs font-bold ${
                      choice.active ? 'border-ember bg-ember text-ink shadow-[0_0_0_3px_rgba(242,100,25,.12)]' : 'border-line bg-white/80 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <h2 className="mt-8 font-display text-xl font-bold tracking-tight text-bone">{choice.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate">{choice.text}</p>
                  <span className="mt-6 inline-flex items-center rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-slate shadow-sm">
                    {choice.tag}
                  </span>
                </button>
              ))}
            </div>

            {error && <p className="auth-error mt-5">{error}</p>}

            <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
              <p className="text-center text-xs text-slate sm:text-left">{hasSelection ? 'Ready to continue' : 'At least one option is required.'}</p>
              <button
                onClick={handleContinue}
                disabled={loading || !hasSelection}
                className="auth-button w-full sm:w-auto sm:px-7 shadow-lg shadow-ember/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving your choices...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
