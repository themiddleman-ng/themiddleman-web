'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import ShaderBackground from '@/components/ShaderBackground';
import Logo from '@/components/Logo';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5c0 8.5 6.5 15 15 15l3-4-6-3-2 2c-2.5-1.2-4.8-3.5-6-6l2-2-3-6-4 1Z" transform="scale(0.8) translate(2.5,2)" />
      <path d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2 5.4 2.4-1.2 3a2 2 0 0 1-2.1 1.2C10.9 20.5 4.5 14.1 3.6 6.3A2 2 0 0 1 4.8 4.1l3-1.2 2.4 5.4-2 2Z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

const PASSWORD_RULES = [
  { key: 'length', label: '9–15 characters', test: (v) => v.length >= 9 && v.length <= 15 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  { key: 'symbol', label: 'One symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function passwordIsValid(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
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

function Field({ icon, label, children }) {
  return (
    <div className="field-shell">
      <label className="field-label">{label}</label>
      <span className="field-icon">{icon}</span>
      {children}
    </div>
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
    return window.localStorage.getItem('mm_last_auth_mode') === 'signin';
  }
  return false;
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flipped, setFlipped] = useState(() => getInitialMode(searchParams));
  // Suppresses the flip transition on the very first render only, so
  // landing on "sign in" doesn't visibly animate in from "sign up".
  const [skipInitialAnim, setSkipInitialAnim] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSkipInitialAnim(false));
    return () => cancelAnimationFrame(id);
  }, []);

  // Remember the mode the person ends up on, so their next visit opens
  // straight to it instead of always defaulting to sign up.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mm_last_auth_mode', flipped ? 'signin' : 'signup');
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
  const [signupError, setSignupError] = useState('');

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(window.localStorage.getItem('mm_signup_draft') || 'null');
      if (saved) {
        setFullName(saved.fullName || '');
        setEmail(saved.email || '');
        setPhone(saved.phone || '');
        setState(saved.state || '');
        setPassword(saved.password || '');
        if (typeof setAgreedToTerms === 'function') setAgreedToTerms(!!saved.agreedToTerms);
      }
    } catch (e) { /* ignore corrupt storage */ }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !draftLoaded) return;
    window.localStorage.setItem('mm_signup_draft', JSON.stringify({ fullName, email, phone, state, password, agreedToTerms }));
  }, [fullName, email, phone, state, password, agreedToTerms, draftLoaded]);

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

    if (!passwordIsValid(password)) {
      setSignupError('Password must be 9–15 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.');
      return;
    }

    setSignupLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, state } },
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

    window.localStorage.removeItem('mm_signup_draft');
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
      const errorMsg = error.message || error.error_description || 'Invalid email or password.';
      setLoginError(errorMsg);
      setLoginLoading(false);
      return;
    }

    router.push('/marketplace');
  }

  return (
    <main className="auth-shell-shader">
      <ShaderBackground variant="metaballs" />
      <div className="w-full max-w-[780px] flip-card">
        <div className={`flip-card-inner ${flipped ? 'is-flipped' : ''} ${skipInitialAnim ? 'no-anim' : ''}`}>

          {/* FRONT — Sign up */}
          <div className="flip-face flip-face-front auth-glass-card p-8">
            <Logo variant="vertical" className="mx-auto" />
            <p className="mt-8 text-xs font-medium tracking-[.2em] text-ember">GET STARTED</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-slate">Buy or sell digital products and services with escrow protecting every transaction.</p>

            <form onSubmit={handleSignup} className="mt-7 space-y-4">
              <Field icon={<UserIcon />} label="Full name">
                <input type="text" placeholder="Ada Obi" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="field-input" />
              </Field>
              <Field icon={<MailIcon />} label="Email">
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="field-input" />
              </Field>
              <Field icon={<PhoneIcon />} label="WhatsApp number">
                <input type="tel" placeholder="080..." value={phone} onChange={(e) => setPhone(e.target.value)} required className="field-input" />
              </Field>
              <Field icon={<PinIcon />} label="State of residence">
                <select value={state} onChange={(e) => setState(e.target.value)} required className="field-input field-select">
                  <option value="" disabled>Select a state</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field icon={<LockIcon />} label="Password">
                <input type="password" placeholder="9–15 characters" value={password} onChange={(e) => {
                  setPassword(e.target.value);
                  if (signupError) setSignupError('');
                }} minLength={9} maxLength={15} required className="field-input" />
              </Field>
              <PasswordChecklist value={password} />
              {/* Consent checkbox — REQUIRED */}
              <div className="flex items-start gap-3 rounded-xl border border-line bg-ink/40 p-4">
                <input
                  id="consent-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 accent-ember"
                />
                <label htmlFor="consent-terms" className="text-xs cursor-pointer text-slate leading-relaxed">
                  I have read and agree to The Middleman&apos;s{' '}
                  <Link href="/legal/terms" className="text-ember underline hover:text-ember/80">Terms of Service</Link>,{' '}
                  <Link href="/legal/privacy" className="text-ember underline hover:text-ember/80">Privacy Policy</Link>, and{' '}
                  <Link href="/legal/refunds" className="text-ember underline hover:text-ember/80">Refund Policy</Link>.
                  I understand that all transactions are escrow-protected.
                </label>
              </div>
              {signupError && <p className="auth-error">{signupError}</p>}
              <button
                className="auth-button disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ember shadow-lg shadow-ember/20"
                type="submit"
                disabled={signupLoading || !signupReady}
              >
                {signupLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate">
              Already have an account?{' '}
              <button type="button" onClick={() => setFlipped(true)} className="text-ember font-medium hover:underline">
                Sign in
              </button>
            </p>
            <p className="mt-3 text-center text-xs text-slate">
              By continuing, you agree to our <Link href="/legal/terms" className="text-bone underline">Terms</Link> and{' '}
              <Link href="/legal/privacy" className="text-bone underline">Privacy Policy</Link>.
            </p>
          </div>

          {/* BACK — Sign in */}
          <div className="flip-face flip-face-back auth-login-shell">
            <div className="auth-visual-panel">
              <div className="auth-brand-mark">
                <div className="auth-brand-dot" />
                <span>THE MIDDLEMAN</span>
              </div>

              <div className="auth-handshake-container animate-fade-in">
                <div className="auth-handshake-overlay" />
                <Image
                  src="/handshake.jpg"
                  alt="Two professionals shaking hands"
                  fill
                  sizes="(max-width: 1024px) 0px, 440px"
                  className="auth-handshake-image"
                />
              </div>

              <div className="auth-visual-copy">
                <div className="auth-eyebrow">Nigeria&apos;s Digital Marketplace</div>
                <h1>Every order. Every payout. Held to account.</h1>
                <p className="mt-3 text-sm text-[#ece8e0]/80">
                  Digital products, software, templates, and creative assets protected by escrow.
                </p>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-[#6F6A63] font-mono uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Orders protected. Payments tracked. Everyone accountable.
                </div>
              </div>
            </div>

            <div className="auth-login-panel">
              <div className="auth-login-wrap">
                <div className="auth-form-eyebrow">WELCOME BACK</div>
                <h2>Log in to The Middleman</h2>
                <p className="auth-sub">
                  Manage your products, orders, and payouts in one place.
                </p>
                <p className="text-xs text-[#6F6A63] -mt-5 mb-7">
                  New to The Middleman?{' '}
                  <button 
                    type="button" 
                    onClick={() => setFlipped(false)} 
                    className="text-ember font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>

                <form onSubmit={handleLogin} className="auth-form-grid">
                  <div className="auth-form-field">
                    <label htmlFor="login-email">Email address</label>
                    <div className="auth-input-shell">
                      <input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="auth-form-field">
                    <label htmlFor="login-password">Password</label>
                    <div className="auth-input-shell">
                      <input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                      <button type="button" className="auth-toggle-pass" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  {loginError && <p className="auth-error">{loginError}</p>}

                  <div className="auth-row-between">
                    <label className="auth-remember">
                      <input type="checkbox" />
                      Keep me signed in
                    </label>
                    <Link href="/signup?mode=signin">Forgot password?</Link>
                  </div>

                  <button className="auth-primary-btn" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Signing in...' : 'Log in'}
                  </button>
                </form>

                <div className="auth-divider">or continue with</div>

                <div className="auth-oauth-row">
                  <button className="auth-social-btn" type="button" aria-label="Continue with Google">
                    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.3 0-9.6-3.4-11.2-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C39.9 36.9 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
                    Google
                  </button>
                  <button className="auth-social-btn" type="button" aria-label="Continue with GitHub">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                    GitHub
                  </button>
                </div>

                <div className="auth-footer-line">
                  By continuing, you agree to our <Link href="/legal/terms">Terms</Link>
                </div>
              </div>
            </div>
          </div>

        </div>
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
