'use client';

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/csr/EyeSlash';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { LockIcon } from '@phosphor-icons/react/dist/csr/Lock';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { WifiSlashIcon } from '@phosphor-icons/react/dist/csr/WifiSlash';
import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { supabase } from '@/lib/supabaseClient';
import { applyLoginFailure, classifyLoginError, classifySignupError, validateLoginInput } from '@/lib/auth/login-errors.mjs';
import { markSignedIn } from '@/components/feedback/SignedInToast';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { readReturnPath, safeNextPath } from '@/lib/auth/signin-redirect.mjs';
import { usePersistedForm } from '@/lib/forms/usePersistedForm';
import DraftRestoredNotice from '@/components/forms/DraftRestoredNotice';

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
  const compact = alert.code === 'invalid-credentials' || !alert.message;
  return (
    <div
      id="auth-alert"
      className={`mm-auth-alert flex items-start gap-2 rounded-md border-l-[3px] border-l-ember-cta bg-paper px-3 ${compact ? 'py-2' : 'py-2.5'}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon size={16} weight="fill" className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-5 text-muted">{alert.title}</p>
        {alert.message ? <p className="mt-0.5 text-[12px] leading-5 text-muted">{alert.message}</p> : null}
        {alert.actionHref ? (
          <Link href={alert.actionHref} className="mt-1.5 inline-flex text-[12px] font-semibold text-muted underline decoration-link underline-offset-2">{alert.actionLabel}</Link>
        ) : alert.actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="mt-1.5 text-[12px] font-semibold text-muted underline decoration-link underline-offset-2">{alert.actionLabel}</button>
        ) : null}
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
        className={`w-full rounded-xl border bg-white py-3 pl-3.5 pr-12 text-[15px] text-bone outline-none transition placeholder:text-muted focus:ring-4 ${invalid ? 'border-line focus:border-line focus:ring-line/15' : 'border-line focus:border-line focus:ring-line/10'}`}
      />
      <button
        type="button"
        aria-pressed={shown}
        aria-label={shown ? 'Hide password' : 'Show password'}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted hover:text-ember-cta focus:outline-none focus-visible:ring-2 focus-visible:ring-line"
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

const DESKTOP_MS = 760;
const DESKTOP_SWAP_MS = 340;
const DESKTOP_ENTER_MS = 500;
const MOBILE_FADE_MS = 100;
const MOBILE_SWAP_MS = 132;
const MOBILE_MS = 260;

function getInitialMode(searchParams) {
  const fromUrl = searchParams.get('mode');
  if (fromUrl === 'signin') return 'signin';
  return 'signup';
}

function buildAuthUrl(signin, searchParams) {
  const params = new URLSearchParams();
  params.set('mode', signin ? 'signin' : 'signup');
  const next = readReturnPath(searchParams);
  if (next) params.set('next', next);
  if (searchParams.get('reset') === 'success') params.set('reset', 'success');
  return `/signup?${params.toString()}`;
}

function AuthModeTabs({ signin, onSelect, tabRefs, onPromote }) {
  return (
    <div
      className="mm-auth-tabs"
      role="tablist"
      aria-label="Account access"
      onPointerEnter={() => onPromote?.(true)}
      onPointerLeave={() => onPromote?.(false)}
      onFocus={() => onPromote?.(true)}
      onBlur={() => onPromote?.(false)}
    >
      <span className="mm-auth-tab-indicator" aria-hidden="true" />
      <button
        type="button"
        role="tab"
        id="auth-tab-signup"
        ref={(node) => { tabRefs.current[0] = node; }}
        aria-selected={!signin}
        aria-controls="auth-panel-signup"
        tabIndex={signin ? -1 : 0}
        onClick={() => onSelect(false, 'pointer')}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            if (onSelect(true, 'arrow-key')) tabRefs.current[1]?.focus();
          }
        }}
      >
        Create account
      </button>
      <button
        type="button"
        role="tab"
        id="auth-tab-signin"
        ref={(node) => { tabRefs.current[1] = node; }}
        aria-selected={signin}
        aria-controls="auth-panel-signin"
        tabIndex={signin ? 0 : -1}
        onClick={() => onSelect(true, 'pointer')}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            if (onSelect(false, 'arrow-key')) tabRefs.current[0]?.focus();
          }
        }}
      >
        Sign in
      </button>
    </div>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(() => getInitialMode(searchParams));
  const [pill, setPill] = useState(() => getInitialMode(searchParams));
  const [layout, setLayout] = useState(() => getInitialMode(searchParams));
  const [phase, setPhase] = useState('idle');
  const [motion, setMotion] = useState('fade');
  const [promote, setPromote] = useState(false);
  const run = useRef({ token: 0, timers: [], anim: null, pin: null, phase: 'idle', target: null });
  const modeRef = useRef(mode);
  const layoutRef = useRef(layout);
  const searchRef = useRef(searchParams);
  const stageRef = useRef(null);
  const pinRef = useRef(null);
  const tabRefs = useRef([]);
  const requestModeRef = useRef(null);
  const returnPath = readReturnPath(searchParams);
  modeRef.current = mode;
  layoutRef.current = layout;
  searchRef.current = searchParams;

  function captureMotion() {
    const stage = stageRef.current;
    const pin = pinRef.current;
    return {
      stage: stage ? getComputedStyle(stage).transform : null,
      pin: pin ? getComputedStyle(pin).transform : null,
    };
  }

  function holdMotion(captured) {
    const stage = stageRef.current;
    const pin = pinRef.current;
    if (stage && captured?.stage && captured.stage !== "none") stage.style.transform = captured.stage;
    if (pin && captured?.pin && captured.pin !== "none") pin.style.transform = captured.pin;
  }

  function releaseMotion() {
    if (stageRef.current) stageRef.current.style.transform = "";
    if (pinRef.current) pinRef.current.style.transform = "";
  }

  function clearRun() {
    run.current.timers.forEach((id) => window.clearTimeout(id));
    run.current.timers = [];
    run.current.anim?.cancel();
    run.current.pin?.cancel();
    run.current.anim = null;
    run.current.pin = null;
  }

  function arm(fn, ms, token) {
    const id = window.setTimeout(() => {
      if (run.current.token !== token) return;
      fn();
    }, ms);
    run.current.timers.push(id);
    return id;
  }

  function pushMode(next, motionKind, layoutSide) {
    const url = buildAuthUrl(next === 'signin', searchRef.current);
    if (`${window.location.pathname}${window.location.search}` === url) return;
    const prev = window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
    const state = { ...prev, mmMotion: motionKind, mmLayout: layoutSide };
    if (state.__NA || state._N) {
      window.history.pushState(state, '', url);
      return;
    }
    History.prototype.pushState.call(window.history, state, '', url);
  }

  function finish(next, source) {
    releaseMotion();
    run.current.anim?.cancel();
    run.current.pin?.cancel();
    run.current.anim = null;
    run.current.pin = null;
    run.current.phase = 'idle';
    run.current.target = null;
    flushSync(() => setPhase('idle'));
    if (source === 'arrow-key') {
      const tab = next === 'signin' ? 'auth-tab-signin' : 'auth-tab-signup';
      document.getElementById(tab)?.focus({ preventScroll: true });
      return;
    }
    const field = next === 'signup' ? 'signup-name' : 'login-email';
    document.getElementById(field)?.focus({ preventScroll: true });
  }

  function requestMode(next, source = 'pointer', historyOpts = null) {
    if (run.current.phase !== 'idle') return false;
    if (next !== 'signin' && next !== 'signup') return false;
    if (next === modeRef.current && !(source === 'popstate' && historyOpts?.motion === 'slide' && historyOpts.layout && historyOpts.layout !== layoutRef.current)) {
      if (source !== 'popstate') pushMode(next, 'fade', layoutRef.current);
      return true;
    }
    const token = ++run.current.token;
    clearRun();
    run.current.target = next;
    run.current.source = source;
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useSlide = !reduce && desktop && (
      source === 'link' || (source === 'popstate' && historyOpts?.motion === 'slide')
    );
    const layoutTarget = useSlide ? (historyOpts?.layout || next) : layoutRef.current;
    run.current.motion = useSlide ? 'slide' : 'fade';
    setMotion(useSlide ? 'slide' : 'fade');

    const commit = () => {
      flushSync(() => {
        setMode(next);
        setPill(next);
        if (useSlide) setLayout(layoutTarget);
      });
      modeRef.current = next;
      if (useSlide) layoutRef.current = layoutTarget;
      if (source !== 'popstate') pushMode(next, useSlide ? 'slide' : 'fade', useSlide ? layoutTarget : layoutRef.current);
    };

    if (reduce) {
      run.current.phase = 'leaving';
      const apply = () => {
        commit();
        finish(next, source);
      };
      if (typeof document.startViewTransition === 'function') {
        try {
          document.startViewTransition(() => { apply(); });
          return true;
        } catch { /* Fall through to an instant swap. */ }
      }
      apply();
      return true;
    }

    run.current.phase = 'leaving';
    setPhase('leaving');

    if (!useSlide) {
      const fadeOut = desktop ? 90 : MOBILE_FADE_MS;
      const fadeSwap = desktop ? 100 : MOBILE_SWAP_MS;
      const fadeDone = desktop ? 180 : MOBILE_MS;
      arm(() => {
        run.current.phase = 'swapping';
        setPhase('swapping');
      }, fadeOut, token);
      arm(() => {
        commit();
        run.current.phase = 'entering';
        setPhase('entering');
      }, fadeSwap, token);
      arm(() => finish(next, source), fadeDone, token);
      return true;
    }

    const stage = stageRef.current;
    const pin = pinRef.current;
    if (!stage) {
      commit();
      finish(next, source);
      return true;
    }
    const toSignup = next === 'signup';
    const stageTo = toSignup ? 'translateX(100%)' : 'translateX(0%)';
    const pinTo = toSignup ? 'translateX(-100%)' : 'translateX(0%)';
    const stageFrom = getComputedStyle(stage).transform;
    const pinFrom = pin ? getComputedStyle(pin).transform : 'none';
    const ease = 'cubic-bezier(.65, 0, .2, 1)';
    run.current.anim = stage.animate(
      [{ transform: stageFrom }, { transform: stageTo }],
      { duration: DESKTOP_MS, easing: ease, fill: 'forwards' },
    );
    if (pin) {
      run.current.pin = pin.animate(
        [{ transform: pinFrom }, { transform: pinTo }],
        { duration: DESKTOP_MS, easing: ease, fill: 'forwards' },
      );
    }
    arm(() => {
      run.current.phase = 'swapping';
      setPhase('swapping');
      commit();
    }, DESKTOP_SWAP_MS, token);
    arm(() => {
      run.current.phase = 'entering';
      setPhase('entering');
    }, DESKTOP_ENTER_MS, token);
    arm(() => finish(next, source), DESKTOP_MS, token);
    return true;
  }
  requestModeRef.current = requestMode;

  function fromHistory(next, historyState) {
    if (next !== 'signin' && next !== 'signup') return;
    const sliding = run.current.motion === 'slide' && run.current.phase !== 'idle';
    const storedLayout = historyState?.mmLayout === 'signin' || historyState?.mmLayout === 'signup' ? historyState.mmLayout : next;
    const motion = sliding || storedLayout !== layoutRef.current ? 'slide' : 'fade';
    if (run.current.phase !== 'idle' && run.current.target === next && !sliding) return;
    const captured = captureMotion();
    run.current.token += 1;
    clearRun();
    if (motion === 'slide') holdMotion(captured);
    run.current.phase = 'idle';
    setPhase('idle');
    if (next === modeRef.current && storedLayout === layoutRef.current) {
      releaseMotion();
      return;
    }
    requestMode(next, 'popstate', { motion, layout: storedLayout });
  }
  const fromHistoryRef = useRef(fromHistory);
  fromHistoryRef.current = fromHistory;

  useEffect(() => {
    const onPopState = (event) => {
      const url = new URL(window.location.href);
      if (url.pathname !== '/signup') return;
      event.stopImmediatePropagation();
      const next = url.searchParams.get('mode') === 'signin' ? 'signin' : 'signup';
      const historyState = event.state;
      queueMicrotask(() => fromHistoryRef.current(next, historyState));
    };
    const onPageShow = (event) => {
      if (!event.persisted) return;
      run.current.token += 1;
      clearRun();
      run.current.phase = 'idle';
      setPhase('idle');
    };
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const syncPin = () => {
      if (pinRef.current) pinRef.current.inert = desktopQuery.matches;
    };
    syncPin();
    const onResize = () => {
      syncPin();
      if (run.current.phase === 'idle') return;
      const target = run.current.target;
      run.current.token += 1;
      clearRun();
      if (target && target !== modeRef.current) {
        flushSync(() => setMode(target));
        modeRef.current = target;
        pushMode(target, 'fade', layoutRef.current);
      }
      run.current.phase = 'idle';
      run.current.target = null;
      setPhase('idle');
    };
    window.addEventListener('popstate', onPopState, true);
    window.addEventListener('pageshow', onPageShow);
    desktopQuery.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('popstate', onPopState, true);
      window.removeEventListener('pageshow', onPageShow);
      desktopQuery.removeEventListener('change', onResize);
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return;
      router.replace(returnPath || '/marketplace');
    });
    return () => { active = false; };
  }, [router, returnPath]);

  useEffect(() => () => {
    run.current.token += 1;
    clearRun();
  }, []);

  useLayoutEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const apply = () => {
      if (pinRef.current) pinRef.current.inert = query.matches;
    };
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const bar = document.querySelector('[aria-label="Cookie notice"]');
      const height = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0;
      root.style.setProperty("--mm-auth-cookie", `${height}px`);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      root.style.removeProperty("--mm-auth-cookie");
    };
  }, []);

  useEffect(() => {
    const raw = searchParams.get('mode');
    if (raw !== 'signin' && raw !== 'signup') return;
    if (raw === modeRef.current || raw === run.current.target) return;
    queueMicrotask(() => {
      if (raw === modeRef.current || raw === run.current.target) return;
      fromHistoryRef.current(raw, window.history.state);
    });
  }, [searchParams]);

  function switchMode(signin, source = 'pointer') {
    return requestMode(signin ? 'signin' : 'signup', source);
  }

  function promoteLayers(on) {
    if (!on && run.current.phase !== 'idle') return;
    setPromote(on);
  }

  const [signupDraft, setSignupDraft] = useState({
    fullName: '',
    email: '',
    phone: '',
    state: '',
    agreedToTerms: false,
  });
  const {
    restored: signupDraftRestored,
    discardDraft: discardSignupDraft,
    clearDraft: clearSignupDraft,
  } = usePersistedForm({
    formId: 'signup',
    userId: null,
    values: signupDraft,
    setValues: setSignupDraft,
    secretKeys: ['password'],
  });
  const { fullName, email, phone, state, agreedToTerms } = signupDraft;
  const setFullName = (value) => setSignupDraft((current) => ({ ...current, fullName: value }));
  const setEmail = (value) => setSignupDraft((current) => ({ ...current, email: value }));
  const setPhone = (value) => setSignupDraft((current) => ({ ...current, phone: value }));
  const setState = (value) => setSignupDraft((current) => ({ ...current, state: value }));
  const setAgreedToTerms = (value) => setSignupDraft((current) => ({ ...current, agreedToTerms: value }));

  const [password, setPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupAlert, setSignupAlert] = useState(null);
  const [signupNotice, setSignupNotice] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginAlert, setLoginAlert] = useState(null);
  const [loginNotice, setLoginNotice] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setLoginNotice('Your password has been updated. Sign in with your new password.');
    }
  }, [searchParams]);

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

    clearSignupDraft();
    markSignedIn();
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
    setLoginLoading(false);
    setLoginSuccess(true);
    markSignedIn();
    const requested = readReturnPath(searchParams);
    const next = assurance.data?.nextLevel === 'aal2' && assurance.data?.currentLevel !== 'aal2' ? '/security' : requested || '/marketplace';
    window.setTimeout(() => router.push(next), 700);
  }

  const inputClass = 'mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-bone outline-none transition placeholder:text-muted focus:ring-4';
  const validInput = 'border-line focus:border-line focus:ring-line/10';
  const invalidInput = 'border-line focus:border-line focus:ring-line/15';
  const labelClass = 'block text-sm font-medium text-muted';

  const signin = mode === 'signin';
  const busy = phase !== 'idle';
  const linkPromote = {
    onPointerEnter: () => promoteLayers(true),
    onPointerLeave: () => promoteLayers(false),
    onFocus: () => promoteLayers(true),
    onBlur: () => promoteLayers(false),
  };

  return (
    <main data-mode={mode} data-layout={layout} data-pill={pill} data-phase={phase} data-motion={motion} data-promote={promote ? 'true' : undefined} className="mm-auth relative bg-paper text-bone">
      <div className="mm-auth-panel">
        <div className="mm-auth-brand">
          <Logo variant="horizontal" className="mm-auth-logo" textClass="text-[17px]" markClass="h-8 w-8" />
        </div>
        <div className="mm-auth-stage" ref={stageRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mm-auth-edge mm-auth-edge--r" src="/design/auth-edge-r.svg" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mm-auth-edge mm-auth-edge--l" src="/design/auth-edge-l.svg" alt="" />
          <div className="mm-auth-clip">
            <div className="mm-auth-pin" ref={pinRef} aria-hidden="true">
              <Logo variant="horizontal" onPanel className="mm-auth-logo" textClass="text-[17px]" markClass="h-8 w-8" />
            </div>
          </div>
          <div className="mm-auth-hero-bar">
            <Link href="/marketplace" className="mm-auth-browse inline-flex min-h-11 items-center text-[16px] font-semibold">Browse first</Link>
          </div>
          <div className="mm-auth-hero-copy">
            <p className="max-w-[470px] font-display text-4xl font-semibold leading-[1.08] tracking-[-.035em]">
              {"Ready\u2011made."}<br />Made yours.
            </p>
            <p className="mm-auth-hero-sub mt-5 max-w-[470px] text-[16px] leading-7">
              Find useful digital products. Customize them with the creator.
            </p>
          </div>
          <p className="mm-auth-hero-note mt-4 max-w-[470px] text-[16px] leading-7">Purchases are paused. Signing up does not charge you.</p>
        </div>

        <section className="mm-auth-slot mm-auth-form">
          <div
            key={mode}
            className="mm-auth-slot-face mm-auth-form-face mx-auto w-full max-w-lg"
            inert={busy || undefined}
            aria-hidden={busy || undefined}
            aria-busy={busy || undefined}
          >
            <AuthModeTabs signin={signin} onSelect={switchMode} tabRefs={tabRefs} onPromote={promoteLayers} />
            {mode === 'signup' ? (
              <>
                <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-.035em] sm:text-4xl">Create your account</h1>
                <p className="mt-2 text-[15px] leading-6 text-muted">Browse digital products or set up a creator profile when you’re ready. Purchases are paused.</p>
                <DraftRestoredNotice
                  visible={signupDraftRestored}
                  onDiscard={() => {
                    discardSignupDraft();
                    setSignupDraft({ fullName: '', email: '', phone: '', state: '', agreedToTerms: false });
                  }}
                />

                <form onSubmit={handleSignup} className="mt-6 space-y-4" id="auth-panel-signup" role="tabpanel" aria-labelledby="auth-tab-signup">
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

                  <div className="flex items-start gap-3 rounded-xl bg-paper p-3.5">
                    <input id="consent-terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-ember-cta" />
                    <label htmlFor="consent-terms" className="text-[16px] leading-6 text-muted">
                      I agree to the <Link href="/legal/terms" className="inline-flex min-h-11 items-center font-semibold text-eyebrow underline">Terms of Service</Link>, <Link href="/legal/privacy" className="inline-flex min-h-11 items-center font-semibold text-eyebrow underline">Privacy Policy</Link>, and <Link href="/legal/refunds" className="inline-flex min-h-11 items-center font-semibold text-eyebrow underline">Refund Policy</Link>.
                    </label>
                  </div>
                  <AuthCallout alert={signupAlert} onAction={signupAlert?.actionLabel ? () => { switchMode(true, 'link'); setSignupAlert(null); } : undefined} />
                  {signupNotice ? (
                    <div className="mm-auth-alert rounded-xl bg-paper p-4 text-sm leading-6 text-muted" role="status">
                      <p>{signupNotice}</p>
                      <button type="button" onClick={() => switchMode(true, 'link')} {...linkPromote} className="mt-2 font-semibold underline">Go to sign in</button>
                    </div>
                  ) : (
                    <button className="w-full rounded-xl bg-ember-cta px-5 py-3.5 text-sm font-bold text-ink transition hover:bg-ember-hover focus:outline-none focus:ring-4 focus:ring-line/20 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={signupLoading || !signupReady}>
                      {signupLoading ? 'Creating account…' : 'Create account'}
                    </button>
                  )}
                </form>

                <p className="mt-5 text-center text-[16px] text-muted">Already have an account? <button type="button" onClick={() => switchMode(true, 'link')} {...linkPromote} className="inline-flex min-h-11 items-center font-semibold text-eyebrow hover:underline">Log in</button></p>
              </>
            ) : (
              <>
                <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-.035em] sm:text-4xl">Welcome back.</h1>
                <p className="mt-2 text-[15px] leading-6 text-muted">Sign in to your Middleman account.</p>
                {returnPath ? (
                  <p role="status" className="mt-4 rounded-xl border border-line bg-paper px-3.5 py-3 text-sm leading-5 text-muted">
                    Sign in to continue
                  </p>
                ) : null}
                {loginNotice && <p role="status" className="mt-5 rounded-xl bg-paper px-3.5 py-3 text-sm leading-5 text-muted">{loginNotice}</p>}
                <form noValidate onSubmit={handleLogin} className="mt-7 space-y-5" id="auth-panel-signin" role="tabpanel" aria-labelledby="auth-tab-signin">
                  <label className={labelClass} htmlFor="login-email">Email address
                    <input ref={loginEmailRef} id="login-email" type="email" autoComplete="email" inputMode="email" placeholder="Enter your email" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); if (loginAlert && loginAlert.field !== 'password') setLoginAlert(null); }} aria-invalid={loginAlert?.field === 'email' || loginAlert?.field === 'credentials' || undefined} aria-describedby={loginAlert ? 'auth-alert' : undefined} className={`${inputClass} ${loginAlert?.field === 'email' || loginAlert?.field === 'credentials' ? invalidInput : validInput}`} />
                  </label>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className={labelClass} htmlFor="login-password">Password</label>
                      <Link href="/reset-password" className="inline-flex min-h-11 items-center text-[16px] font-semibold text-eyebrow hover:underline">Forgot password?</Link>
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
                  {loginSuccess ? (
                    <div className="mm-auth-alert flex items-center gap-2 rounded-md bg-paper px-3 py-2.5 text-[13px] font-semibold text-muted" role="status" aria-live="polite">
                      <CheckCircleIcon size={16} weight="fill" aria-hidden="true" />
                      Signed in successfully
                    </div>
                  ) : (
                    <AuthCallout alert={loginAlert} />
                  )}
                  <button className="w-full rounded-xl bg-ember-cta px-5 py-3.5 text-sm font-bold text-ink transition hover:bg-ember-hover focus:outline-none focus:ring-4 focus:ring-line/20 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={loginLoading || loginSuccess}>
                    {loginSuccess ? 'Continuing…' : loginLoading ? 'Logging in…' : 'Log in'}
                  </button>
                </form>
                <p className="mt-6 text-center text-[16px] text-muted">New to The Middleman? <button type="button" onClick={() => switchMode(false, 'link')} {...linkPromote} className="inline-flex min-h-11 items-center font-semibold text-eyebrow hover:underline">Create an account</button></p>
                <p className="mt-8 border-t border-line pt-5 text-center text-[14px] leading-6 text-muted">By continuing, you agree to the <Link href="/legal/terms" className="inline-flex min-h-11 items-center font-semibold underline">Terms of Service</Link> and <Link href="/legal/privacy" className="inline-flex min-h-11 items-center font-semibold underline">Privacy Policy</Link>.</p>
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
