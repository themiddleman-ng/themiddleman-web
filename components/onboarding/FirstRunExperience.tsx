"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { markTourSeen, mergeTourStates, readTourState, tourKey, type TourState } from '@/lib/onboarding/tour-state';

type Step = { title: string; text: string; target?: string };
const PAGE_TOURS: Record<string, Step[]> = {
  '/marketplace': [{ title: 'Find your next starting point', text: 'Search products and select a category. Use price filters and sorting to narrow your choices.', target: 'input[type=search]' }, { title: 'Look before you buy', text: 'Open a product to review its preview, creator, price and what is included before ordering.' }],
  '/browse': [{ title: 'Explore by category', text: 'Choose a category to discover relevant digital products. You can return to all products at any time.' }],
  '/orders': [{ title: 'Everything you ordered', text: 'Follow payment, delivery and review progress here. Open an order to see the actions available for its current status.' }],
  '/messages': [{ title: 'Your product conversations', text: 'Choose a conversation in the inbox. On mobile, use the back arrow to return to your other conversations.', target: '[aria-label="Conversation list"]' }, { title: 'Keep the conversation here', text: 'Write in the message box. Enter sends and Shift + Enter adds a new line. Share files through the order flow.' }],
  '/profile': [{ title: 'Make yourself recognisable', text: 'Add a profile photo here. The same photo appears in the top-right account button on every page. Tap Edit to change your details, then Save to return to a compact summary.' }, { title: 'One account, both roles', text: 'Use the selling setup to become a creator while continuing to buy products. Authenticator and Admin links are in this page and the account menu.' }],
  '/payments': [{ title: 'Your money, clearly recorded', text: 'Review payments and seller payouts here. Statuses reflect the actual payment and order records.' }],
  '/notifications': [{ title: 'Catch up on updates', text: 'Read order and account updates here. Use the available controls to mark notifications as read.' }],
  '/settings': [{ title: 'Your preferences', text: 'Manage your account, cookie preferences and security. Replay the welcome tour here whenever you want.' }],
  '/security': [{ title: 'Authenticator app', text: 'Install Google Authenticator or Authy, tap Set up authenticator, scan the QR code, then enter the 6-digit code. Admin stays locked until that code is verified.' }],
  '/gigs/mine': [{ title: 'Your product workspace', text: 'Manage your listings, check their status and open the editor. Create a product when you are ready to publish something new.' }],
  '/gigs/new': [{ title: 'Give your product room to shine', text: 'Work through the listing fields, preview images and package requirements. Your existing validation will explain anything missing.' }],
  '/gigs/detail': [{ title: 'Review the product first', text: 'Read the description, price, included files and seller details. The purchase controls will guide you through the next step.' }],
  '/disputes': [{ title: 'Resolve an order issue', text: 'Review the dispute and submit the information requested. Existing order permissions and deadlines still apply.' }],
  '/seller-support': [{ title: 'Stay in touch with operations', text: 'Read seller operations updates and use the available reply controls to keep the discussion together.' }],
  '/onboarding/role': [{ title: 'Choose how you will use your account', text: 'Choose buying, selling, or the Buy and sell button. Continue saves your preference and guides sellers to the application.' }],
  '/onboarding/seller': [{ title: 'Set up your creator profile', text: 'Complete the required profile and verification fields. Review your details before submitting your application.' }],
  '/onboarding/pending': [{ title: 'Your application status', text: 'Check review progress and any feedback here. Your account will show the next available action when the review changes.' }],
  '/account/delete': [{ title: 'Review account removal carefully', text: 'Read the consequences and requirements before using the existing deletion controls. You can leave this page without deleting anything.' }],
  '/admin': [{ title: 'Operations overview', text: 'Review the recorded platform totals, order pipeline and items requiring attention. Use the workspace navigation to open each review queue.' }],
  '/admin/products': [{ title: 'Review product packages', text: 'Inspect each submission and use the available review actions. Existing admin permissions and package feature gates remain in force.' }],
  '/admin/sellers': [{ title: 'Seller directory', text: 'Review seller profiles and their current verification status. Use the existing review controls for the selected seller.' }],
  '/admin/review': [{ title: 'Delivery review queue', text: 'Inspect submitted deliveries and provide clear review feedback before taking an approval or revision action.' }],
  '/admin/escrow': [{ title: 'Trust and payouts', text: 'Review the order and payment state before acting. Financial actions remain protected by their existing server checks.' }],
  '/admin/communications': [{ title: 'Seller communications', text: 'Select the intended seller and review the message before sending through the existing communication flow.' }],
  '/admin/email-preview': [{ title: 'Review notification templates', text: 'Choose a template to inspect its contents and layout before changing notification content.' }],
  '/analytics': [{ title: 'Understand your product performance', text: 'Change the time period to see recorded views, sales and downloads. The chart compares your products using the selected metric.' }],
};
const cacheKey = (id: string) => 'middleman-page-tours:' + id;
function cached(id: string) { try { return readTourState(JSON.parse(localStorage.getItem(cacheKey(id)) || 'null')); } catch { return null; } }

export default function FirstRunExperience() {
  const pathname = usePathname();
  const key = tourKey(pathname);
  const steps = PAGE_TOURS[key];
  const [stage, setStage] = useState<'hidden' | 'choice' | 'tour'>('hidden');
  const [index, setIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [authVersion, setAuthVersion] = useState(0);
  const stateRef = useRef<TourState | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const pendingSave = useRef(Promise.resolve());
  const [notice, setNotice] = useState('');

  const save = useCallback(async (state: TourState, id: string) => {
    stateRef.current = state;
    let localSaved = false;
    try { localStorage.setItem(cacheKey(id), JSON.stringify(state)); localSaved = true; } catch { /* Fall back to account metadata. */ }
    // Preferences only: these metadata values are never used for authorisation.
    pendingSave.current = pendingSave.current.catch(() => {}).then(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id !== id) return;
      const merged = mergeTourStates(readTourState(user.user_metadata?.middleman_page_tours), state) || state;
      const { error } = await supabase.auth.updateUser({ data: { middleman_page_tours: merged } });
      if (error && !localSaved) setNotice('Your browser could not remember this tour. You can still close it for this visit.');
    });
    await pendingSave.current;
  }, []);

  useEffect(() => {
    let knownId: string | null | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const id = session?.user.id || null;
      if (event === 'SIGNED_OUT') { setStage('hidden'); setUserId(null); stateRef.current = null; }
      if (id !== knownId && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) setAuthVersion((value) => value + 1);
      knownId = id;
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    setStage('hidden'); setIndex(0); setNotice('');
    if (!steps) return;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setUserId(user.id);
      let state = mergeTourStates(readTourState(user.user_metadata?.middleman_page_tours), cached(user.id));
      if (!state) {
        // Honour the original welcome preference when upgrading existing accounts.
        const { data, error } = await supabase.from('user_onboarding_preferences').select('experience_choice,walkthrough_status,current_step').eq('user_id', user.id).maybeSingle();
        let legacy = data;
        try { legacy = JSON.parse(localStorage.getItem('middleman-onboarding:' + user.id) || 'null') || data; } catch { /* Keep the saved database preference. */ }
        if (!active) return;
        if (legacy) state = { version: 2, optedIn: legacy.experience_choice === 'new', seen: legacy.walkthrough_status === 'in_progress' ? {} : { '/marketplace': true, '/orders': true, '/messages': true, '/profile': true } };
        // A connection error is not evidence that this is a first visit.
        else if (error) return;
      }
      stateRef.current = state;
      if (!active) return;
      setStage(!state ? 'choice' : state.optedIn && !state.seen[key] ? 'tour' : 'hidden');
    })();
    return () => { active = false; };
  }, [key, steps, authVersion]);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (!userId || event.key !== cacheKey(userId)) return;
      const updated = cached(userId);
      stateRef.current = mergeTourStates(stateRef.current, updated);
      if (updated && (!updated.optedIn || updated.seen[key])) setStage('hidden');
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key, userId]);

  const dismiss = useCallback(() => {
    setStage('hidden');
    if (!userId) return;
    const current = stateRef.current || { version: 2 as const, optedIn: false, seen: {} };
    void save(markTourSeen(current, key), userId);
  }, [key, save, userId]);

  function choose(optedIn: boolean) {
    if (!userId) return;
    const state: TourState = { version: 2, optedIn, seen: stateRef.current?.seen || {} };
    void save(optedIn ? state : markTourSeen(state, key), userId);
    // Keep the existing preference table compatible with older clients.
    void supabase.from('user_onboarding_preferences').upsert({ user_id: userId, experience_choice: optedIn ? 'new' : 'veteran', walkthrough_status: optedIn ? 'completed' : 'skipped', current_step: 0, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setIndex(0); setStage(optedIn ? 'tour' : 'hidden');
  }

  useEffect(() => {
    const welcome = () => { if (userId) { setIndex(0); setStage('choice'); } };
    const replay = () => { if (userId && steps) { setIndex(0); setStage('tour'); } };
    window.addEventListener('middleman:onboarding-reset', welcome);
    window.addEventListener('middleman:onboarding-replay', replay);
    return () => { window.removeEventListener('middleman:onboarding-reset', welcome); window.removeEventListener('middleman:onboarding-replay', replay); };
  }, [steps, userId]);

  useEffect(() => {
    if (stage === 'hidden') return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled)'));
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keyboard); previousFocus?.focus(); };
  }, [stage, dismiss]);

  useEffect(() => {
    if (stage !== 'tour') return;
    const target = steps?.[index]?.target ? document.querySelector<HTMLElement>(steps[index].target!) : null;
    if (!target) return;
    const outline = target.style.outline; const offset = target.style.outlineOffset;
    target.style.outline = '3px solid #ed6509'; target.style.outlineOffset = '5px';
    return () => { target.style.outline = outline; target.style.outlineOffset = offset; };
  }, [stage, index, steps]);

  if (stage === 'hidden' || !steps) return null;
  const step = steps[index] || steps[0];
  return <div className="fixed inset-0 z-[121] flex items-center justify-center bg-[#111b30]/50 p-4">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="mm-tour-title" aria-describedby="mm-tour-description" className="relative w-full max-w-md rounded-2xl border border-[#e1e5ed] bg-white p-7 text-[#11172b] shadow-xl">
      <button type="button" onClick={dismiss} aria-label="Close tour" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-lg text-2xl text-[#606b80] hover:bg-[#f1f5fa]"><XIcon size={20} aria-hidden="true" /></button>
      <p className="pr-10 text-xs font-semibold uppercase tracking-wider text-[#b84b00]">{stage === 'choice' ? 'Welcome to The Middleman' : `Page tour · ${index + 1} of ${steps.length}`}</p>
      <h2 aria-live="polite" id="mm-tour-title" className="mt-4 pr-4 text-2xl font-semibold tracking-tight">{stage === 'choice' ? 'Is this your first time here?' : step.title}</h2>
      <p aria-live="polite" id="mm-tour-description" className="mt-3 text-sm leading-6 text-[#606b80]">{stage === 'choice' ? 'Take a short introduction on each page as you explore. You can close a tour anytime and replay the welcome from Settings.' : step.text}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {stage === 'choice' ? <><button type="button" onClick={() => choose(true)} className="min-h-11 rounded-lg bg-[#e96309] px-5 text-sm font-semibold text-white">Yes, show me around</button><button type="button" onClick={() => choose(false)} className="min-h-11 rounded-lg border border-[#e1e5ed] px-4 text-sm font-medium">I know my way</button></> : <><button type="button" onClick={dismiss} className="min-h-11 px-2 text-sm text-[#606b80]">Skip this tour</button><button type="button" onClick={() => index + 1 >= steps.length ? dismiss() : setIndex(index + 1)} className="ml-auto min-h-11 rounded-lg bg-[#e96309] px-5 text-sm font-semibold text-white">{index + 1 >= steps.length ? 'Got it' : 'Next'}</button></>}
      </div>
      {notice && <p role="status" className="mt-3 text-xs text-[#9c4014]">{notice}</p>}
    </section>
  </div>;
}
