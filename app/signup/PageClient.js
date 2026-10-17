'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/csr/EyeSlash';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { LockIcon } from '@phosphor-icons/react/dist/csr/Lock';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { WifiSlashIcon } from '@phosphor-icons/react/dist/csr/WifiSlash';
import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';
import { supabase } from '@/lib/supabaseClient';
import { applyLoginFailure, classifyLoginError, classifySignupError, validateLoginInput } from '@/lib/auth/login-errors.mjs';
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

function alertIcon(alert) {
  if (alert.code === 'network' || alert.code === 'unavailable') return WifiSlashIcon;
  if (alert.code === 'rate-limit') return ClockIcon;
  if (alert.field === 'email') return EnvelopeSimpleIcon;
  if (alert.field === 'password' || alert.field === 'credentials') return LockIcon;
  return WarningCircleIcon;
}

function AuthCallout({ alert, onAction }) {
  if (!alert) return null;
  const Icon = alertIcon(alert);
  return (
    <div id="auth-alert" className="rounded-lg border border-[#e4c2b2] border-l-4 border-l-[#b42318] bg-[#fff8f6] px-3.5 py-3" role="alert" aria-live="assertive">
      <div className="flex gap-3">
        <Icon size={18} weight="fill" className="mt-0.5 shrink-0 text-[#b42318]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-[#7a271a]">{alert.title}</p>
          <p className="mt-1 text-[13px] leading-5 text-[#5c4036]">{alert.message}</p>
          {alert.actionHref ? (
            <Link href={alert.actionHref} className="mt-2 inline-flex text-[13px] font-semibold text-[#9a3412] underline decoration-[#e7b49a] underline-offset-2">{alert.actionLabel}</Link>
          ) : alert.actionLabel && onAction ? (
            <button type="button" onClick={onAction} className="mt-2 text-[13px] font-semibold text-[#9a3412] underline decoration-[#e7b49a] underline-offset-2">{alert.actionLabel}</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PasswordField({ id, value, onChange, autoComplete, placeholder, shown, onToggle, invalid, describedBy, inputRef }) {
  return (
    <div className="relative mt-1.5">
      <input
        ref={inputRef}
        id={id}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? describedBy : undefined}
        className={`w-full rounded-xl border bg-white py-3 pl-3.5 pr-12 text-[15px] text-[#1d2733] outline-none transition placeholder:text-[#89919a] focus:ring-4 ${invalid ? 'border-[#b42318] focus:border-[#b42318] focus:ring-[#b42318]/15' : 'border-[#ded6cb] focus:border-[#de641e] focus:ring-[#de641e]/10'}`}
      />
      <button
        type="button"
        aria-pressed={shown}
        aria-label={shown ? 'Hide password' : 'Show password'}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-[#5d6874] hover:text-[#c95415] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3D91]"
      >
        {shown ? <EyeSlashIcon size={18} aria-hidden="true" /> : <EyeIcon size={18} aria-hidden="true" />}
      </button>
    </div>
  );
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

// Decide which face to show before the very first paint, so there's nothing
// to "flip away from". URL param wins (explicit ?mode=signin link), otherwise
// we fall back to whatever the person used last time.
function getInitialMode(searchParams) {
  const fromUrl = searchParams.get('mode');
  if (fromUrl === 'signin') return true;
  if (fromUrl === 'signup') return false;
  if (typeof window !== 'undefined') {
    try { return window.localStorage.getItem('mm_last_auth_mode') === 'signin'; }
    catch { return false; }
  }
  return false;
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flipped, setFlipped] = useState(() => getInitialMode(searchParams));

  // Remember the mode the person ends up on, so their next visit opens
  // straight to it instead of always defaulting to sign up.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('mm_last_auth_mode', flipped ? 'signin' : 'signup'); }
      catch { /* The auth form still works when preference storage is blocked. */ }
    }
  }, [flipped]);

  // Sign up state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupAlert, setSignupAlert] = useState(null);
  const [signupNotice, setSignupNotice] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginAlert, setLoginAlert] = useState(null);
  const [loginNotice, setLoginNotice] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);

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
    setSignupAlert(null);
    setSignupNotice('');

    if (!passwordIsValid(password)) {
      setSignupAlert(classifySignupError({ code: 'weak_password' }));
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
      setSignupAlert(classifySignupError(error));
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

  function focusLoginField(field) {
    const node = field === 'email' ? loginEmailRef.current : field === 'password' || field === 'credentials' ? loginPasswordRef.current : null;
    node?.focus();
  }

  async function handleLogin(e) {
    e.preventDefault();
    const clientError = validateLoginInput({ email: loginEmail, password: loginPassword });
    if (clientError) {
      setLoginAlert(clientError);
      focusLoginField(clientError.field);
      return;
    }

    setLoginAlert(null);
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      const failure = classifyLoginError(error);
      const next = applyLoginFailure({ email: loginEmail, password: loginPassword, alert: failure });
      setLoginAlert(failure);
      setLoginPassword(next.password);
      setShowLoginPassword(false);
      setLoginLoading(false);
      window.requestAnimationFrame(() => focusLoginField(next.focus));
      return;
    }

    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    router.push(assurance.data?.nextLevel === 'aal2' && assurance.data?.currentLevel !== 'aal2' ? '/security' : '/marketplace');
  }

  const inputClass = 'mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-[#1d2733] outline-none transition placeholder:text-[#89919a] focus:ring-4';
  const validInput = 'border-[#ded6cb] focus:border-[#de641e] focus:ring-[#de641e]/10';
  const invalidInput = 'border-[#b42318] focus:border-[#b42318] focus:ring-[#b42318]/15';
  const labelClass = 'block text-sm font-medium text-[#33404d]';

  return (
    <main data-mode={flipped ? "signin" : "signup"} className="mm-auth min-h-[100svh] bg-[radial-gradient(ellipse_at_88%_8%,rgba(228,111,47,.20),transparent_30%),linear-gradient(145deg,#f7f1e7,#f4e9dc_56%,#f8f4ed)] px-4 pb-24 pt-5 text-[#1d2733] sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100svh-2.5rem)] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_24px_80px_rgba(65,46,28,.13)] md:min-h-[680px] md:grid-cols-[.85fr_1.15fr]">
        <aside className="mm-auth-hero relative hidden flex-col justify-between overflow-hidden bg-[#182d41] p-10 text-[#faf4e9] md:flex lg:p-12">
          <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-[#e87635]/25 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <Logo variant="vertical" />
            <p className="mt-20 max-w-sm font-display text-4xl font-semibold leading-[1.08] tracking-[-.035em]">
              Ready-made.<br />Made yours.
            </p>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#e5e4de]/80">
              Find useful digital products. Customize them with the creator.
            </p>
          </div>
          <p className="relative text-sm text-[#e5e4de]/70">Pay in Naira through Paystack.</p>
        </aside>

        <section className="mm-auth-form min-w-0 w-full flex-col px-5 py-6 sm:px-9 sm:py-9 md:px-12 md:py-10">
          <div className="mm-auth-mobile-brand mb-7 flex w-full items-center justify-between gap-4 md:hidden">
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
                    <input id="signup-name" type="text" autoComplete="name" placeholder="Ada Obi" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={`${inputClass} ${validInput}`} />
                  </label>
                  <label className={labelClass} htmlFor="signup-email">Email address
                    <input id="signup-email" type="email" autoComplete="email" placeholder="Enter your email" value={email} onChange={(e) => { setEmail(e.target.value); if (signupAlert?.field === 'email') setSignupAlert(null); }} aria-invalid={signupAlert?.field === 'email' || undefined} aria-describedby={signupAlert?.field === 'email' ? 'auth-alert' : undefined} required className={`${inputClass} ${signupAlert?.field === 'email' ? invalidInput : validInput}`} />
                  </label>
                  <label className={labelClass} htmlFor="signup-phone">WhatsApp number
                    <input id="signup-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="080..." value={phone} onChange={(e) => setPhone(e.target.value)} required className={`${inputClass} ${validInput}`} />
                  </label>
                  <label className={labelClass} htmlFor="signup-state">State of residence
                    <select id="signup-state" value={state} onChange={(e) => setState(e.target.value)} required className={`${inputClass} ${validInput} appearance-none`}>
                      <option value="" disabled>Select a state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className={labelClass} htmlFor="signup-password">Password
                    <PasswordField
                      id="signup-password"
                      value={password}
                      autoComplete="new-password"
                      placeholder="12–128 characters"
                      shown={showSignupPassword}
                      onToggle={() => setShowSignupPassword((value) => !value)}
                      invalid={signupAlert?.field === 'password'}
                      describedBy="auth-alert"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (signupAlert?.field === 'password') setSignupAlert(null);
                      }}
                    />
                  </label>
                  <PasswordChecklist value={password} />

                  <div className="flex items-start gap-3 rounded-xl bg-[#f7f3ed] p-3.5">
                    <input id="consent-terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#de641e]" />
                    <label htmlFor="consent-terms" className="text-xs leading-5 text-[#596674]">
                      I agree to the <Link href="/legal/terms" className="font-semibold text-[#b84d13] underline">Terms of Service</Link>, <Link href="/legal/privacy" className="font-semibold text-[#b84d13] underline">Privacy Policy</Link>, and <Link href="/legal/refunds" className="font-semibold text-[#b84d13] underline">Refund Policy</Link>.
                    </label>
                  </div>
                  <AuthCallout alert={signupAlert} onAction={signupAlert?.actionLabel ? () => { setFlipped(true); setSignupAlert(null); } : undefined} />
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
                <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-.035em] sm:text-4xl">Welcome back.</h1>
                <p className="mt-2 text-[15px] leading-6 text-[#596674]">Sign in to your Middleman account.</p>
                {loginNotice && <p role="status" className="mt-5 rounded-xl bg-[#f0f6ef] px-3.5 py-3 text-sm leading-5 text-[#35523b]">{loginNotice}</p>}
                <form noValidate onSubmit={handleLogin} className="mt-7 space-y-5">
                  <label className={labelClass} htmlFor="login-email">Email address
                    <input ref={loginEmailRef} id="login-email" type="email" autoComplete="email" inputMode="email" placeholder="Enter your email" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); if (loginAlert && loginAlert.field !== 'password') setLoginAlert(null); }} aria-invalid={loginAlert?.field === 'email' || loginAlert?.field === 'credentials' || undefined} aria-describedby={loginAlert ? 'auth-alert' : undefined} className={`${inputClass} ${loginAlert?.field === 'email' || loginAlert?.field === 'credentials' ? invalidInput : validInput}`} />
                  </label>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className={labelClass} htmlFor="login-password">Password</label>
                      <Link href="/reset-password" className="text-xs font-semibold text-[#b84d13] hover:underline">Forgot password?</Link>
                    </div>
                    <PasswordField
                      id="login-password"
                      inputRef={loginPasswordRef}
                      value={loginPassword}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      shown={showLoginPassword}
                      onToggle={() => setShowLoginPassword((value) => !value)}
                      invalid={loginAlert?.field === 'password' || loginAlert?.field === 'credentials'}
                      describedBy="auth-alert"
                      onChange={(e) => { setLoginPassword(e.target.value); if (loginAlert?.field === 'password' || loginAlert?.field === 'credentials') setLoginAlert(null); }}
                    />
                  </div>
                  <AuthCallout alert={loginAlert} />
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

