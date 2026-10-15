'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Logo from '@/components/Logo';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

const PASSWORD_RULES = [
  { key: 'length', label: '12–128 characters', test: (v) => v.length >= 12 && v.length <= 128 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  { key: 'symbol', label: 'One symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function passwordIsValid(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

function getLoginErrorMessage(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Those details don’t match an account. Check your email and password, or use “Forgot password?” to reset it.';
  }

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Confirm your email address first, then come back to log in.';
  }

  if (error?.status === 429 || code.includes('rate_limit') || message.includes('too many requests')) {
    return 'There have been too many sign-in attempts. Wait a little, then try again.';
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'We couldn’t reach the sign-in service. Check your connection and try again.';
  }

  return 'We couldn’t sign you in right now. Check your details and try again.';
}

function PasswordChecklist({ value }) {
  if (!value) return null;
  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.key}
            className={`text-[11px] flex items-center gap-1.5 transition-colors duration-200 ${
              met ? 'text-ember' : 'text-slate'
            }`}
          >
            <span
              className={`inline-block w-3 h-3 rounded-full border transition-colors duration-200 ${
                met ? 'bg-ember border-ember' : 'border-slate'
              }`}
            />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

// Keep the server and first client render identical. Browser preferences are
// restored after hydration; explicit mode links always win.
function getInitialMode(searchParams) {
  return searchParams.get('mode') === 'signin';
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flipped, setFlipped] = useState(() => getInitialMode(searchParams));
  const [modeReady, setModeReady] = useState(false);
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signin' || mode === 'signup') setFlipped(mode === 'signin');
    else {
      try { setFlipped(window.localStorage.getItem('mm_last_auth_mode') === 'signin'); }
      catch { setFlipped(false); }
    }
    setModeReady(true);
  }, [searchParams]);

  // Remember the mode the person ends up on, so their next visit opens
  // straight to it instead of always defaulting to sign up.
  useEffect(() => {
    if (modeReady) {
      try { window.localStorage.setItem('mm_last_auth_mode', flipped ? 'signin' : 'signup'); }
      catch { /* The auth form still works when preference storage is blocked. */ }
    }
  }, [flipped, modeReady]);

  // Sign up state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupNotice, setSignupNotice] = useState('');

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setLoginNotice('Your password has been updated. Sign in with your new password.');
    }
  }, [searchParams]);

  useEffect(() => {
    // Remove personal details and any consent value saved by earlier versions.
    try { window.localStorage.removeItem('mm_signup_draft'); }
    catch { /* Storage can be unavailable in private browsing. */ }
  }, []);
  const signupReady =
    fullName.trim().length > 0 &&
    /^\S+@\S+\.\S+$/.test(email) &&
    phone.trim().length >= 7 &&
    state.length > 0 &&
    passwordIsValid(password) &&
    agreedToTerms;

  async function handleSignup(e) {
    e.preventDefault();
    setSignupError('');
    setSignupNotice('');

    if (!passwordIsValid(password)) {
      setSignupError('Password must be 12–128 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.');
      return;
    }

    setSignupLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, state },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/role`,
      },
    });

    if (error) {
      // Bulletproof error extraction for Supabase
      const errorMsg =
        error.message ||
        error.error_description ||
        error.details ||
        error.hint ||
        (typeof error === 'string' ? error : 'Sign up failed. Please check your details and try again.');

      setSignupError(errorMsg);
      setSignupLoading(false);
      return;
    }

    if (!data.session) {
      setSignupNotice(`We sent a confirmation link to ${email}. Open it to verify your email and continue setting up your account.`);
      setSignupLoading(false);
      return;
    }

    router.push('/onboarding/role');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError(getLoginErrorMessage(error));
      setShowPassword(false);
      setLoginLoading(false);
      return;
    }

    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    router.push(assurance.data?.nextLevel === 'aal2' && assurance.data?.currentLevel !== 'aal2' ? '/security' : '/marketplace');
  }

  const inputClass = 'mt-1.5 w-full rounded-xl border border-[#ded6cb] bg-white px-3.5 py-3 text-[15px] text-[#1d2733] outline-none transition focus:border-[#de641e] focus:ring-4 focus:ring-[#de641e]/10 placeholder:text-[#89919a]';
  const labelClass = 'block text-sm font-medium text-[#33404d]';

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(ellipse_at_88%_8%,rgba(228,111,47,.20),transparent_30%),linear-gradient(145deg,#f7f1e7,#f4e9dc_56%,#f8f4ed)] px-4 py-5 text-[#1d2733] sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100svh-2.5rem)] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_24px_80px_rgba(65,46,28,.13)] md:min-h-[680px] md:grid-cols-[.85fr_1.15fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#182d41] p-10 text-[#faf4e9] md:flex lg:p-12">
          <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-[#e87635]/25 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <Logo variant="horizontal" className="text-[#faf4e9]" markClass="h-8 w-8" textClass="text-base" />
            <p className="mt-20 max-w-sm font-display text-4xl font-semibold leading-[1.08] tracking-[-.035em]">
              Useful digital products, made by people.
            </p>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#e5e4de]/80">
              Find ready-made templates, tools and creative resources from independent creators.
            </p>
          </div>
          <p className="relative text-sm text-[#e5e4de]/70">Pay in Naira through Paystack.</p>
        </aside>

        <section className="min-w-0 px-5 py-6 sm:px-9 sm:py-9 md:px-12 md:py-10">
          <div className="mb-7 flex items-center justify-between gap-4 md:hidden">
            <Logo variant="horizontal" markClass="h-8 w-8" textClass="text-base" />
            <Link href="/marketplace" className="text-sm font-medium text-[#445363] hover:text-[#de641e]">Browse first</Link>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#f4efe8] p-1" aria-label="Account access">
              <button type="button" onClick={() => setFlipped(false)} aria-pressed={!flipped} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${!flipped ? 'bg-white text-[#1d2733] shadow-sm' : 'text-[#687481] hover:text-[#1d2733]'}`}>Create account</button>
              <button type="button" onClick={() => setFlipped(true)} aria-pressed={flipped} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${flipped ? 'bg-white text-[#1d2733] shadow-sm' : 'text-[#687481] hover:text-[#1d2733]'}`}>Log in</button>
            </div>

            {!flipped ? (
              <>
                <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-.035em] sm:text-4xl">Create your account</h1>
                <p className="mt-2 text-[15px] leading-6 text-[#596674]">Buy digital products or set up a creator profile when you’re ready.</p>

                <form onSubmit={handleSignup} className="mt-6 space-y-4">
                  <label className={labelClass} htmlFor="signup-name">Full name
                    <input id="signup-name" type="text" autoComplete="name" placeholder="Ada Obi" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
                  </label>
                  <label className={labelClass} htmlFor="signup-email">Email address
                    <input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                  </label>
                  <label className={labelClass} htmlFor="signup-phone">WhatsApp number
                    <input id="signup-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="080..." value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputClass} />
                  </label>
                  <label className={labelClass} htmlFor="signup-state">State of residence
                    <select id="signup-state" value={state} onChange={(e) => setState(e.target.value)} required className={`${inputClass} appearance-none`}>
                      <option value="" disabled>Select a state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className={labelClass} htmlFor="signup-password">Password
                    <span className="relative block">
                      <input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="12–128 characters" value={password} onChange={(e) => {
                        setPassword(e.target.value);
                        if (signupError) setSignupError('');
                      }} minLength={12} maxLength={128} required className={`${inputClass} pr-20`} />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[#5d6874] hover:text-[#d7601e]">{showPassword ? 'Hide' : 'Show'}</button>
                    </span>
                  </label>
                  <PasswordChecklist value={password} />

                  <div className="flex items-start gap-3 rounded-xl bg-[#f7f3ed] p-3.5">
                    <input id="consent-terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#de641e]" />
                    <label htmlFor="consent-terms" className="text-xs leading-5 text-[#596674]">
                      I agree to the <Link href="/legal/terms" className="font-semibold text-[#b84d13] underline">Terms of Service</Link>, <Link href="/legal/privacy" className="font-semibold text-[#b84d13] underline">Privacy Policy</Link>, and <Link href="/legal/refunds" className="font-semibold text-[#b84d13] underline">Refund Policy</Link>.
                    </label>
                  </div>
                  {signupError && <p className="rounded-xl bg-[#fff0e8] px-3.5 py-3 text-sm leading-5 text-[#9d3e16]" role="alert">{signupError}</p>}
                  {signupNotice ? (
                    <div className="rounded-xl bg-[#f0f6ef] p-4 text-sm leading-6 text-[#35523b]" role="status">
                      <p>{signupNotice}</p>
                      <button type="button" onClick={() => setFlipped(true)} className="mt-2 font-semibold underline">Go to sign in</button>
                    </div>
                  ) : (
                    <button className="w-full rounded-xl bg-[#de641e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#c95415] focus:outline-none focus:ring-4 focus:ring-[#de641e]/20 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={signupLoading || !signupReady}>
                      {signupLoading ? 'Creating account…' : 'Create account'}
                    </button>
                  )}
                </form>

                <p className="mt-5 text-center text-sm text-[#63707d]">Already have an account? <button type="button" onClick={() => setFlipped(true)} className="font-semibold text-[#b84d13] hover:underline">Log in</button></p>
              </>
            ) : (
              <>
                <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-.035em] sm:text-4xl">Welcome back</h1>
                <p className="mt-2 text-[15px] leading-6 text-[#596674]">Log in to manage your products, orders and account.</p>
                {loginNotice && <p role="status" className="mt-5 rounded-xl bg-[#f0f6ef] px-3.5 py-3 text-sm leading-5 text-[#35523b]">{loginNotice}</p>}
                <form onSubmit={handleLogin} className="mt-7 space-y-5">
                  <label className={labelClass} htmlFor="login-email">Email address
                    <input id="login-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className={inputClass} />
                  </label>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className={labelClass} htmlFor="login-password">Password</label>
                      <Link href="/reset-password" className="text-xs font-semibold text-[#b84d13] hover:underline">Forgot password?</Link>
                    </div>
                    <span className="relative block">
                      <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className={`${inputClass} pr-20`} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[#5d6874] hover:text-[#d7601e]" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
                    </span>
                  </div>
                  {loginError && (
                    <div
                      className="flex gap-3.5 rounded-2xl border border-[#f0c6ad] bg-[#fff8f3] p-4 shadow-[0_8px_24px_-20px_rgba(120,53,20,0.45)]"
                      role="alert"
                      aria-live="assertive"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbe5d7] text-[#a94417]" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
                          <path d="M10 6.25v4.5m0 3h.01M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-semibold leading-5 text-[#713516]">We couldn’t sign you in</p>
                        <p className="mt-1 text-[13px] leading-5 text-[#765b4d]">{loginError}</p>
                      </div>
                    </div>
                  )}
                  <button className="w-full rounded-xl bg-[#de641e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#c95415] focus:outline-none focus:ring-4 focus:ring-[#de641e]/20 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Logging in…' : 'Log in'}
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-[#63707d]">New to The Middleman? <button type="button" onClick={() => setFlipped(false)} className="font-semibold text-[#b84d13] hover:underline">Create an account</button></p>
                <p className="mt-8 border-t border-[#eee6dc] pt-5 text-center text-xs leading-5 text-[#71808d]">By continuing, you agree to the <Link href="/legal/terms" className="underline">Terms of Service</Link> and <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.</p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

