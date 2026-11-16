# The Middleman: Motion Audit

Prepared 2026-10-18. Read-only review. Nothing was pushed, opened or changed on any remote.

## 0. Where the code lives

- **Live repo:** `themiddleman-ng/themiddleman-web` on GitHub. It is public, Samuel has admin, and the deploy is https://themiddleman-web.vercel.app.
  - The default branch is `feat/product-first-homepage`.
  - The local read-only clone is `/workspace/middleman`, checked out at `design/ui8-fixes`.
- **Older mirror:** `bukssamuel/themiddleman` on cursor-origin, mirrored from `samuelbukumni/themiddleman`. This is the pre-org-migration repo. Its branches are `main`, `cleanup/pre-org-migration`, `feat/mobile-shell-architecture-…`, `fix/mobile-header-login-appearance-…`, `fix/signup-page-flip-card-layout-…`, `paystack-integration-hardening`, `redesign/homepage-orca-direction` and `security/sanitize-devcontainer-env`. It is not the active codebase.

### Active branches (newest first)

| Branch | Last commit | Notes |
|---|---|---|
| `design/ui8-fixes` | 2026-10-18 04:07 UTC, "design: apply UI8 product, login, cookie, cover, and chrome fixes" | Head of PR #9, which targets `cursor/review-fixes-d8c9` |
| `cursor/review-fixes-d8c9` | 2026-10-18 04:09 UTC, same commit re-applied (d33a124) | Head of PR #8, which targets `feat/product-first-homepage`. Its tree is identical to `design/ui8-fixes` |
| `feat/product-first-homepage` (default) | 2026-10-15, "feat: add complete sample design walkthrough" | Baseline / deployed |

## 1. Stack

- Next.js 15.5 (App Router), React 18.2, TypeScript, plus some leftover `.js` page clients.
- Tailwind CSS v4 (`@tailwindcss/postcss`) and two large hand-written stylesheets: `app/globals.css` (about 1,800 lines) and `app/product-design.css` (about 700 lines, the "mm-" design layer).
- Supabase for auth and data, and Paystack for payments.
- Icons come from `@phosphor-icons/react`.
- **No animation library is installed.** There is no framer-motion/motion, GSAP, Lottie or Rive. All motion is CSS keyframes and transitions.
- There are home-grown motion primitives in `components/motion/` (`FadeIn`, `StaggerChildren`, `TiltCard`), but **none of them are imported anywhere**, so they are dead code.

## 2. ⚠️ The desktop login ↔ sign-up hero slide (protected)

**How it works on `feat/product-first-homepage` (the version Samuel loves):**

- **Markup** (`app/signup/PageClient.js`): `<main className="mm-auth" data-mode={flipped ? 'signin' : 'signup'}>` wraps a 2-column grid containing `<aside className="mm-auth-hero">` and `<section className="mm-auth-form">`. The `flipped` state is toggled by the "Log in" / "Create an account" buttons. The last-used mode is saved in `localStorage` (`mm_last_auth_mode`) and can be set with `?mode=signin|signup`.
- **CSS** (`app/product-design.css`, lines 71–77 on the default branch):
  ```css
  .mm-auth .mm-auth-hero { … transition:transform .8s cubic-bezier(.65,0,.2,1); }
  .mm-auth .mm-auth-form { … transition:transform .8s cubic-bezier(.65,0,.2,1); }
  .mm-auth[data-mode=signup] .mm-auth-hero { transform:translateX(100%); }
  .mm-auth[data-mode=signup] .mm-auth-form { transform:translateX(-100%); }
  ```
  The two columns swap places with an 800 ms ease-in-out. The wave background (`/design/auth-hero-wave.png`, the hero's first child) mirrors with `scaleX(-1)` in sign-up mode and "breathes" over 28 s (`mm-background-breathe`). Below 768 px the transforms are cancelled. There is also a global `prefers-reduced-motion` kill switch for `.mm-auth *`.

**🚨 Regression found:** commit `3b1a456` / `d33a124`, which is now on **both** `design/ui8-fixes` (PR #9) **and** `cursor/review-fixes-d8c9` (PR #8), replaced those two lines with:
```css
.mm-auth[data-mode=signup] .mm-auth-hero,
.mm-auth[data-mode=signup] .mm-auth-form { transform:none; }
```
It also added `overflow:hidden` to the grid. **This removes the desktop slide.** On those branches, switching modes on desktop only swaps the form content: the `key` change re-runs `mm-auth-face`, a 0.45 s rise. The wave still mirrors, but the panels no longer travel.

PR #8's description says "Keep PR #8 untouched", yet the same commit was pushed onto PR #8's head. If PR #8 merges as it stands, the slide is lost on the default branch too.

**Recommended fix:** restore the two `translateX(±100%)` lines in the desktop scope, ideally inside `@media (min-width:768px)`. Keep the `minmax(0,1fr)` columns, but check that `overflow:hidden` on `.mm-auth > div` does not clip the moving panels. It shouldn't, because the panels swap inside the grid box. Then verify at 1280 and 1440 px. This audit does **not** propose any other change to this slide.

Mobile (≤767 px) uses a separate orange "spider wipe" (`.mm-auth-wipe`, `mm-auth-spider` 0.72 s), started by `switchMode()` only when not on desktop and not in reduced motion. Leave that alone too.

## 3. What already animates (inventory)

| Surface | Motion today | Verdict |
|---|---|---|
| Homepage hero (`.homepage-hero` in `app/page.tsx`) | Ambient light drift (36 s and 32 s alternating), reduced-motion safe | Good, subtle. Keep |
| Home feed marquee (`HomeFeed.tsx`) | 42 s linear marquee, reduced-motion safe | OK. Add pause on hover/focus (see P7) |
| Product cards `.gm-card` | Hover lift −4 px, 250 ms expo-out, arrow nudge 3 px. On mobile marketplace: `mm-rise` stagger (40 ms steps, first 6 cards) | Good base. Desktop has no entrance (see P3) |
| Auth form face | `mm-auth-face` 450 ms rise on mode switch | Good |
| Signed-in toast | `mm-toast-in` 400 ms | No exit: it disappears after 4.2 s (see P4) |
| FAQ (`HomeFAQ.tsx`) | `+` rotates 45°. The answer toggles with the `hidden` attribute and jumps open | Needs height easing (see P5) |
| Account menu (`SiteHeader.tsx`) | Pops in and out with no transition | See P2 |
| Cookie notice | Toggle knob slides. The panel itself appears and disappears abruptly | See P4 |
| Mobile tab bar | Color change, centre "+" `active:scale-95` | Good. Add an active-indicator glide (P8) |
| Messages | `typing-dot` bounce. `animate-pulse` placeholders | OK |
| Gig detail / new gig / home feed | Tailwind `animate-pulse` skeletons | Unify to one shimmer (P6) |
| Report-product dialog (`gigs/[id]`), FirstRunExperience tour dialog | Mount and unmount with no motion | See P2 |
| Orders progress, payments, analytics, admin | Static | See P9 and P10 |

**Dead CSS** that is defined but has no consumer:

- `.flip-card*`, `.mp-ticket`, `.mp-tab-underline`, `.perforation-line`, `.receipt-print`, `.gm-caret`, `.gm-node`, `.gm-skeleton`, `auth-floaty` and the older `.auth-*` page styles.
- `globals.css` also defines `::view-transition-old/new(root)` that nothing triggers.
- `@keyframes typing-bounce` and `gm-shimmer` are each defined twice.

Clean these up first (P0) so the new motion system has a single source of truth.

## 4. Motion system proposal

**Library: stay CSS-first, with no new dependency for 90% of this.** The app already speaks CSS keyframes, Tailwind v4 supports `@starting-style`, and every target is simple: enter, exit, height, hover.

- Use **`@starting-style` with `transition-behavior: allow-discrete`** for enter and exit of popovers, dialogs, toasts and the cookie bar. It is native in Chrome, Edge, Safari 17.5+ and Firefox 129+. Older browsers just snap, which is a fine fallback.
- Use the **native `<dialog>` and `popover`** for the menu and dialogs. You get focus handling for free and they animate with the rule above.
- Use the **View Transitions API** for route changes. React 18 is in use, so Next's `experimental.viewTransition` (React 19 only) is not available. Use a tiny `useViewTransitionRouter()` wrapper that calls `document.startViewTransition(() => router.push(href))` when supported and motion is allowed.
- **Only if** exit animations get painful in React (lists that reorder, for example), add `motion` (motion.dev) via `LazyMotion` + `m`, which keeps it to about 5 KB. Don't add GSAP; nothing here needs a timeline engine.

**Tokens.** Add these to `app/product-design.css` `:root` and reuse them everywhere:
```css
:root{
  --mm-ease-out: cubic-bezier(.22,1,.36,1);     /* entrances, already used by mm-rise */
  --mm-ease-in-out: cubic-bezier(.65,0,.2,1);   /* the auth slide curve: reserve for big spatial moves */
  --mm-ease-in: cubic-bezier(.4,0,1,1);         /* exits */
  --mm-dur-1: 120ms;  /* press, color */
  --mm-dur-2: 200ms;  /* hover, small UI */
  --mm-dur-3: 320ms;  /* menus, toasts, accordions */
  --mm-dur-4: 480ms;  /* page and section entrances */
  --mm-rise: 8px;     /* max travel for entrances: keep it small */
}
```

**Rules of restraint:**

- Animate only `transform` and `opacity`, plus `grid-template-rows` for accordions.
- Exits run about 30% faster than entrances.
- Use no bounce or overshoot except a single 1.02 settle on success checkmarks.
- Nothing loops apart from the existing ambient hero and marquee.
- Stagger at most 6 items at 40 ms. Items after that appear together.

**Reduced motion:** use one global block. It keeps opacity crossfades (they help orientation) and removes travel, scale and loops.
```css
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; scroll-behavior:auto!important; }
  ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){ animation:none!important; }
}
```
JS paths should check `matchMedia('(prefers-reduced-motion: reduce)')`, which `FadeIn` and `switchMode` already do.

## 5. Recommendations by flow, in priority order

### P0: Groundwork (do first, invisible to users)
- Restore the desktop auth slide (section 2).
- Delete the dead CSS listed in section 3 and the duplicate keyframes.
- Add the motion tokens and the global reduced-motion block.
- Either delete `components/motion/*` or rebuild `FadeIn` on the tokens (8 px travel instead of the current 32 px `translate-y-8`, 480 ms). `TiltCard` is too loud for this brand; drop it.

### P1: Page transitions (global, highest perceived polish)
- A crossfade plus a 6 px rise on the main content: 220 ms out (`--mm-ease-in`), 320 ms in (`--mm-ease-out`). Use View Transitions with `view-transition-name: mm-main` on `<main>`.
- Keep the header and mobile tab bar static. Give them their own `view-transition-name` so they don't fade.
- **Shared element:** product card cover → product detail cover (`view-transition-name: cover-{id}`), 400 ms `--mm-ease-in-out`. This is the "wow" moment, and it is the only one.
- **Exclude `/signup`** from route transitions so nothing competes with the protected slide.

### P2: Menus and dialogs
- **Account menu (`SiteHeader`):** opacity 0→1, scale .98→1, translateY −4→0, `transform-origin: top right`. 180 ms in, 120 ms out. Move it to `popover` or keep the state and use `@starting-style`.
- **Report-product dialog and FirstRunExperience tour:**
  - Backdrop fades to 40% over 200 ms.
  - The panel rises 8 px and scales .98→1 over 280 ms with `--mm-ease-out`, and exits in 160 ms.
  - On mobile, make it a bottom sheet that slides up `translateY(100%)→0` over 320 ms.
- **Tour step changes:** crossfade the content over 200 ms, and grow the progress bar's width (scaleX) over 320 ms.

### P3: Card and list entrances
- **Marketplace grid, home feed rows, browse, my gigs:**
  - On first load, cards fade and rise 8 px over 420 ms, staggered 40 ms for the first 6. Extend the existing mobile-only `mm-rise` to desktop.
  - Trigger once per view with IntersectionObserver for below-the-fold rows, using the reworked `FadeIn`.
- **Filter or search changes:** crossfade the grid over 160 ms. Don't re-stagger, because users will filter repeatedly.
- **Card hover:** keep the −4 px lift. Add `scale(1.03)` on the cover image inside an `overflow:hidden` frame (`.gm-preview-inner` is already set up for it) over 350 ms. Add press feedback with `:active { transform: translateY(-1px) scale(.995) }` over 120 ms.

### P4: Toasts, cookie bar and feedback
- **SignedInToast:** add an exit (fade plus −6 px over 180 ms) by setting a `leaving` state 200 ms before unmount. Pause the 4.2 s timer while hovered.
- **Generalise this into one `<Toast>`** for "Saved", "Copied", "Payment verified" and "Message sent". Those currently appear as static text in profile, settings, onboarding and payments.
- **Cookie notice:** slide up 12 px and fade in over 360 ms, 1.2 s after load so it doesn't compete with the hero. Exit 200 ms down.
- **Form validation (auth, onboarding seller, gigs/new, settings):**
  - Error text: height-reveal plus fade over 200 ms.
  - Invalid field: the border color transitions over 150 ms. Do **not** shake; it's noisy and bad for accessibility.
  - Success check: draw the stroke over 280 ms, with a 1.02 settle.
  - `PasswordChecklist`: each rule's tick crossfades and its color eases over 180 ms.

### P5: Accordions and disclosure
- **HomeFAQ, legal TOC on mobile, order details expand, admin rows:** replace `hidden` with the `grid-template-rows: 0fr → 1fr` technique. Use 280 ms `--mm-ease-out`, and fade the answer from 0 to 1 starting 60 ms later.
  - Keep `aria-expanded`. Add `inert` when collapsed so screen readers behave.
  - The `+` rotation should use the same 280 ms and easing.

### P6: Loading and skeleton states
- **Unify skeletons on one calm shimmer:** a 1.6 s linear sweep with low contrast (`#f2ede4 → #fbf8f2`). Revive `.gm-skeleton` and replace the scattered `animate-pulse`. Under reduced motion it becomes a static tint.
- **Shape skeletons to the real layout:**
  - Card: a 1.65 aspect cover and two lines of text.
  - Gig detail: a cover block, a title line and a buy box.
  - Messages: alternating bubbles.
- **Crossfade skeleton → content** over 200 ms, so there's no pop.
- **Add `loading.tsx`** for the app-router segments that fetch on the server (marketplace, gigs/[id], orders, messages) using those skeletons. There are currently no `loading.tsx` files.
- **Buttons:** "Logging in…" and "Creating account…" should show a 14 px spinner (0.8 s rotation) that fades in after 150 ms, so it doesn't flash on fast responses. Keep the width fixed so the label doesn't jump.

### P7: Homepage restraint polish
- **Hero copy:** h1, subcopy and CTAs fade-rise 8 px with an 80 ms stagger, 480 ms each, once on load.
- **Section headings:** reveal on scroll once, 8 px over 420 ms.
- **Marquee:** add `:hover, :focus-within { animation-play-state: paused }`, which helps users and WCAG 2.2.2.
- **The 3-step "how it works":** the step numbers count in or connect with a thin line that draws over 600 ms when scrolled into view. Run it once.

### P8: Navigation micro-interactions
- **Mobile tab bar:** add an active pill or indicator that glides between tabs (translateX, 260 ms `--mm-ease-out`), and an icon press scale of .92 over 120 ms.
- **Desktop nav links and marketplace category tabs:** add an ember underline that grows from the left (scaleX 0→1, 200 ms). `.gm-cat::after` already exists; apply the same pattern to the header.
- **Header search:** the focus width expands over 200 ms `--mm-ease-out`. It currently uses Tailwind's default ease.
- **Header on scroll:** after 8 px of scroll, add a hairline border and a soft shadow, faded in over 200 ms. Don't shrink or hide it.

### P9: Numbers and data
- **Analytics, admin overview, payments totals, seller dashboard:** count numbers up from 0 over 700 ms with ease-out, once, when in view. Use `font-variant-numeric: tabular-nums` so the width stays stable. Format with `Intl.NumberFormat('en-NG', {style:'currency',currency:'NGN'})` on every frame.
- **Bars and meters:** grow from 0 (scaleX or scaleY) over 600 ms, staggered 40 ms.
- **Orders progress tracker:** the completed segment fills to the current step over 500 ms. The current step's dot gets a single soft ring pulse once (not looping).

### P10: Empty states and moments of delight (sparingly)
- **Empty states** ("No orders yet", "No conversations yet", "No payments yet", "No products match", "No reviews yet"): the illustration or icon fades and rises 8 px over 420 ms, then the copy follows 80 ms later. Nothing loops.
- **Payment success / order placed:** a checkmark draws over 360 ms, with one ring that scales out and fades over 500 ms. This is the single celebratory moment in the product. No confetti.
- **Messages:** a new message bubble rises 6 px and fades in over 220 ms. Sent bubbles start from the composer side. Keep the existing typing dots.
- **404 page:** a gentle 6 px float on the stub illustration, 4 s, paused under reduced motion. This is optional.

## 6. Do-not-touch list
- The desktop `/signup` hero and form slide (section 2): the curve, the 800 ms duration and the wave mirror.
- The mobile auth wipe, unless Samuel asks.
- The ambient homepage hero light. It's already at the right level of subtle.

## 7. Implementation order (suggested PR slices)
1. P0: restore the slide, add tokens and reduced motion, clean up dead CSS. Small and safe.
2. P2 + P4 (overlays and toasts), using `@starting-style` and native `dialog`/`popover`.
3. P3 + P6 (cards and skeletons, `loading.tsx`).
4. P1 (View Transitions plus the card→detail shared cover).
5. P5, P8, P9, P10 polish.

Each slice should come with before/after screen recordings at desktop 1440 px and mobile 390 px, plus a pass with reduced motion turned on in DevTools.
