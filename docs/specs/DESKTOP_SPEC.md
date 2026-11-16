# The Middleman: Desktop Spec (1280–1920px), dark theme only

Version 1.0, 25 Oct 2026. Build branch: **`design/ui8-dark` only**. Nothing in this spec applies to the light theme, and nothing here is planned for it.
Every component below was opened on 21st.dev on 25 Oct 2026, through its markdown twin (`<url>.md`). Author, licence and npm dependencies are copied from that page. No component, URL or author here is invented.

**Fixed constraints**
- Orange is the only accent colour. The logo stays exactly as it is (`components/Logo.tsx`, 'Middle' #3B82F6 and 'man' #E8590C). Checkout stays paused, so "Purchases paused" stays disabled and no chunk touches Paystack code (`lib/paystack-*`, `app/payments`).
- Only free components with no paid dependencies, fonts or APIs. See §0.
- The hero motion uses CSS/SVG only. No WebGL, no canvas, and it is off under reduced motion. The existing `ShaderBackground.tsx` (WebGL) must **not** be used on the desktop home.
- The repo has **no framer-motion/motion** today (deps are next 15, react 18, @phosphor-icons/react, supabase, tailwind 4). Every pick that lists framer-motion or motion is **ported to CSS** (transform/opacity) instead of adding the dependency. This keeps the bundle the same size and makes reduced motion one CSS rule. Icons: swap lucide, tabler and radix-icons for `@phosphor-icons/react`, which is already installed.
- **Motion timings are not defined here.** All durations, easings and tokens come from **`/workspace/middleman-motion/DESKTOP_MOTION.md`** (desktop; it wins where it differs) and `MOTION_SPEC.md` §1 (base tokens). This spec only says *which* DESKTOP_MOTION section applies to each element. Animate only `transform` and `opacity`, per DESKTOP_MOTION §2.1 and MOTION_SPEC house rules.

---

## 0. Free-only verification

| Check | Result |
|---|---|
| Are 21st.dev components paid? | No. 21st.dev pricing (https://21st.dev/pricing.md) sells **plans** and author **templates**. Community components have no Pro tier. None of the component pages below shows a Pro, premium or paid marker. |
| Copy limit | The free Hobby plan allows **2 free copies a day** through the copy button or `npx shadcn add …?api_key=` (unlimited copies need the $6/mo Builder plan). **Do not buy Builder.** Most picks are short, so build them by hand from the live preview, or spread the copies over days (≤2/day). No 21st API key is needed. |
| Licences | Port code only from components marked **MIT**. Components marked "unknown" or "no-license" are used **as visual reference only** and rebuilt from scratch. Each row below is marked. |
| Dependencies | Allowed new npm package: **`cmdk`** (MIT, free, ~4 kB gz) for ⌘K. Nothing else gets added. framer-motion, motion, lucide, tabler, radix-icons and @number-flow are **not** added (see porting rule above). |
| Fonts/APIs | Fonts stay as they are: DM Sans and Outfit through `next/font/google` (free, self-hosted at build), plus the system monospace stack `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. No paid fonts. No third-party APIs. Search uses the existing Supabase `gigs` table. |

Every pick below is **FREE ✅**.

---

## 1. Component picks (all verified on 21st.dev)

### 1a. Hero background (10 candidates reviewed)

| # | Component | URL | Author | Licence | Deps | Verdict |
|---|---|---|---|---|---|---|
| **P** | **Background Paths** | https://21st.dev/@kokonutd/components/background-paths | Kokonut UI | MIT | framer-motion (dropped; rebuilt as CSS/SVG to the DESKTOP_MOTION §2.1 contract) | **PRIMARY.** The classic flowing-lines hero, with an aurora glow underneath. See §4 for why it beats aurora alone |
| **F** | **Aurora Background** | https://21st.dev/@manuarora700/components/aurora-background | Manu Arora | MIT | none | **FALLBACK** and Animation Master's default: built exactly as the DESKTOP_MOTION §2.4 "Aurora, CSS-only tier" (orange radial-gradient blobs, transform only, no blur). The original's multicolour stops and animated `background-position` are **not** used |
| 3b | Grid Pattern + Spotlight | https://21st.dev/@dillionverma/components/grid-pattern · https://21st.dev/@manuarora700/components/spotlight | Dillion Verma (Magic UI) · Manu Arora | MIT · MIT | none · none | Third option (the Vercel/Linear look). Build per DESKTOP_MOTION §2.2 "Grid with spotlight" if Samuel prefers a grid |
| 3 | Dot Pattern | https://21st.dev/@dillionverma/components/dot-pattern | Dillion Verma | MIT | none | Good alternative texture for the fallback (dots instead of lines) |
| 4 | Animated Grid Pattern | https://21st.dev/@dillionverma/components/animated-grid-pattern | Dillion Verma | MIT | framer-motion | Rejected: random squares blinking all the time is busy behind the product stack |
| 6 | Beams Background | https://21st.dev/@kokonutd/components/beams-background | Kokonut UI | MIT | motion | Rejected: canvas plus blur, heavier than SVG |
| 7 | Floating paths | https://21st.dev/@bundui/components/floating-paths | Bundui.io | unknown | motion | Same idea as P with an unclear licence, so use P |
| 8 | Tailwind CSS Background Snippet | https://21st.dev/@ibelick/components/tailwind-css-background-snippet | Julien Thibeaut | unknown | none | Reference only for the radial-glow CSS |
| 9 | Grid Background (vercel-grid-subtle) | https://21st.dev/@meghtrix/components/grid-background/vercel-grid-subtle | meghtrix | unknown | none | Reference only; F covers it with MIT code |
| 10 | Radial Lines | https://21st.dev/@designali-in/components/radial-lines | Ali Imam | unknown | none | Rejected: a sunburst competes with the headline |

### 1b. Section components

| Use | Component | URL | Author | Licence | Deps on 21st | How we use it | Free |
|---|---|---|---|---|---|---|---|
| ⌘K palette | **Command** (enhanced shadcn command) | https://21st.dev/@originui/components/command | Origin UI | MIT | cmdk, @radix-ui/react-icons, @radix-ui/react-dialog | Port it, keep `cmdk`, use a native `<dialog>` instead of the radix dialog, and phosphor icons | ✅ |
| ⌘K layout reference | Command Menu with Global Search | https://21st.dev/@ephraimduncan/components/command-menu-04 | Ephraim Duncan | MIT | cmdk, @tabler/icons-react | Grouping pattern with type filters and recent items | ✅ |
| Key hints | Kbd (kbd-group) | https://21st.dev/@shadcn/components/kbd/kbd-group | shadcn | unknown | none | Reference: rebuild a 10-line `<kbd>` component | ✅ |
| Navbar | Navbar with Dropdowns | https://21st.dev/@shadcnblockscom/components/shadcnblocks-com-navbar1 | Shadcnblocks.com | no-license | lucide-react | **Reference only.** A classic desktop nav with a Categories dropdown. Rebuild it in `SiteHeader.tsx` | ✅ |
| Navbar (alt ref) | Navigation Bar | https://21st.dev/@originui/components/navigation-menu-4 | Origin UI | unknown | lucide-react | Reference for the search-in-nav layout | ✅ |
| Product card | Product Card | https://21st.dev/@deltacomponents/components/product-card | deltacomponents | MIT | none | Structure: image well, badge, title/seller/price footer | ✅ |
| Card hover glow | Magic Card | https://21st.dev/@dillionverma/components/magic-card | Dillion Verma | MIT | framer-motion → CSS | Border spotlight that follows the cursor (CSS vars set on `pointermove`) | ✅ |
| New/Trending tabs | Vercel Tabs | https://21st.dev/@yadwinder/components/vercel-tabs | Yadwinder Singh | MIT | none | Hover highlight that slides plus an active underline | ✅ |
| Tabs (alt) | Animated Tabs | https://21st.dev/@educalvolpz/components/animated-tabs | Edu Calvo | MIT | motion → CSS | Reference for the roving-tabindex keyboard model | ✅ |
| Developer strip | Bento Grid | https://21st.dev/@dillionverma/components/bento-grid | Dillion Verma (Magic UI) | MIT | @radix-ui/react-icons → phosphor | A 3-tile bento for the dev strip | ✅ |
| Dev strip (alt) | Features 8 | https://21st.dev/@meschacirung/components/features-8 | Méschac Irung | MIT | lucide-react | Alternative layout if the bento feels too heavy | ✅ |
| Marquee strip | Marquee | https://21st.dev/@dillionverma/components/marquee | Dillion Verma (Magic UI) | MIT | none (CSS keyframes) | A strip of **file formats and categories** (real data only, not fake brand logos) | ✅ |
| Marquee (a11y ref) | Marquee (Dice UI) | https://21st.dev/@diceui/components/marquee | Dice UI | MIT | radix-ui, cva | Reference for pause on hover/focus plus a pause button | ✅ |
| FAQ | Two-Column FAQ | https://21st.dev/@ln-dev7/components/faqs-02 | LN | MIT | lucide-react | Matches the current layout: sticky intro on the left, accordion on the right | ✅ |
| FAQ (motion ref) | FAQ Accordion | https://21st.dev/@scrollxui/components/frequently-asked-questions-with-accordion | scrollxui | MIT | motion | Use **only** the staggered item entrance. Skip the word-by-word blur headline | ✅ |
| Sell CTA | Call to action | https://21st.dev/@tommyjepsen/components/call-to-action | Tommy Jepsen | MIT | lucide-react | Sell CTA block: badge, headline, two buttons | ✅ |
| CTA band shine | Border Beam | https://21st.dev/@dillionverma/components/border-beam | Dillion Verma (Magic UI) | MIT | none | One beam that travels around the "Browse products" button in the orange band (NICE) | ✅ |
| Pricing (not used) | Single Pricing Card | https://21st.dev/@efferd/components/single-pricing-card-1 | Efferd | unknown | lucide, framer-motion | **Not used.** The Middleman has no plans. Listed only because the brief asked | ✅ |
| Testimonials (**later, real quotes only**) | Staggered Testimonials Grid | https://21st.dev/@efferd/components/testimonials-3 | Efferd | no-license | none | Reference only. Ship it once there are real buyer and seller quotes | ✅ |
| Testimonials (alt) | Testimonials Marquee | https://21st.dev/@shadcnspace/components/marquee-01 | ShadcnSpace | no-license | none | Reference only | ✅ |
| Number ticker (**later, real numbers only**) | Number Ticker | https://21st.dev/@dillionverma/components/number-ticker | Dillion Verma (Magic UI) | MIT | framer-motion → CSS/rAF | Use it only for real totals such as products listed and sellers verified | ✅ |
| Naira ticker (alt) | Number Ticker Currency Counter | https://21st.dev/@shadcnspace/components/number-ticker-02 | ShadcnSpace | no-license | @number-flow/react | Reference only. Use `Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN'})` | ✅ |

Rejected on purpose: Liquid Glass Card (Samuel said it isn't needed, and blur is expensive), Product Reveal Card by isaiahbjork (licence unknown, framer-motion, overlay hides the price), Resizable Navbar by manuarora700 (licence unknown, motion).

---

## 2. Grid and page frame at 1440

- Container: `max-width: 1240px; margin-inline: auto; padding-inline: 32px` (24px at 1280). At 1920 the content stays at 1240 and only backgrounds bleed to full width.
- 12 columns, 24px gutter (≈ 79px column at 1240). Section vertical rhythm: 96px between sections, 64px inside dense sections.
- Breakpoints: `lg` 1024, `xl` 1280, `2xl` 1536. This spec covers ≥1280. The 768–1279 range keeps the round 4 tablet layout.
- Type scale (Outfit display / DM Sans body): H1 64/68 −0.02em, H2 40/44, H3 20/28, body 16/26, small 14/20. Monospace for file type, size and version (`ZIP · 4.2 MB · v1.3`).
- Surfaces: page #0E0E11, card #17171C, raised #202027, border 1px #2A2A33, text #F4F4F6, muted #A1A1AA. Orange: button fill #C2410C with white text and hover #E8590C, orange text #FB923C, focus ring `2px solid #FB923C; outline-offset: 2px`.

## 3. Section by section (home, in the current order)

| # | Section | Columns at 1440 | Component | Notes |
|---|---|---|---|---|
| 1 | **Nav** (sticky, 64px) | logo cols 1–2 · links 3–6 (Categories ▾, Marketplace, How it works, Sell) · search trigger 7–10 · Sign in + avatar 11–12 | Navbar with Dropdowns (ref) + Kbd | The search trigger is a 40px-tall button that reads "Search products…" and shows `⌘K` (or `Ctrl K`). Background #0E0E11/80 + 1px bottom border once scrolled past 8px. That is a colour change only, so no blur and no height change. The Categories dropdown is keyboard-operable (Enter/Space opens it, arrows move, Esc closes) |
| 2 | **Hero** (min-height 560px, fixed) | copy 1–6 · existing `HeroListingStack` 7–12 | **Background Paths** (primary) / Grid + Spotlight (fallback) | H1 "Find digital products that work." with "digital" in #FB923C. Subline. Buttons: **Browse products** (orange fill) and **Start selling** (outline). Trust line under them: "Pay in Naira with Paystack · Money held until you confirm delivery" (from `EscrowTrustLine`). The background sits behind everything, absolutely positioned, `pointer-events:none`, `aria-hidden` |
| 3 | **Category tiles** | 4 tiles × 3 cols | existing tiles; decorative palette for icons only | Hover: lift −4px and the border goes to the tile's decorative colour at 40%. NICE: a format marquee below the tiles (Marquee) |
| 4 | **New / Trending grid** | tabs row, then a 4 × 3-col card grid (2 rows) | **Vercel Tabs** + **Product Card** + **Magic Card** glow | Card: 4:3 cover, title (2 lines, clamped), seller + verified, category tag, price `₦45,000` in tabular numbers, file meta in mono. "View all →" link aligned right in the tabs row |
| 5 | **How it works** | 3 cards × 4 cols | existing | Numbered steps 1·2·3, plain language |
| 6 | **Developer strip** | bento: 1 big tile (cols 1–6, 2 rows) + 2 tiles (7–12) | **Bento Grid** | Big tile: "Press ⌘K to search everything" with a static mock of the palette. Small tiles: "Paystack checkout in Naira" and "Seller identity verification" (real features only). The big tile's CTA is a "Try it" button that opens ⌘K |
| 7 | **Sell CTA** | copy 1–7 · buttons 9–12 | **Call to action** | "List a digital product and get paid in Naira." Primary: Start selling. Secondary: Read seller guidelines |
| 8 | **FAQ** | intro 1–4 (sticky) · accordion 6–12 | **Two-Column FAQ** | Existing `HomeFAQ` questions. One open at a time. Motion is DESKTOP_MOTION §5 Implementation B (`grid-template-rows`, open `--mm-dur-acc-open`, close `--mm-dur-acc-close`) |
| 9 | **Orange CTA band** | headline 1–8 · button 9–12 | existing + **Border Beam** (NICE) | Band #C2410C with white text (passes AA). Button is #0E0E11 with white text |
| 10 | **Footer** | 4 columns of 3 | existing | Add a "Keyboard shortcuts (?)" link that opens the shortcuts dialog |

Marketplace, product, login and messages pages at desktop keep their round 4 layouts. They pick up the nav, ⌘K, shortcuts and card hover automatically through chunks 2 and 4.

## 4. Hero background, in detail (must satisfy DESKTOP_MOTION §2.1)

**Primary: Background Paths (Kokonut UI, MIT) on an aurora glow, CSS/SVG only.**

*Why this instead of aurora alone (the DESKTOP_MOTION default):*
1. Samuel asked for a **classic** hero background. Flowing line paths are the recognisable "classic" 21st.dev hero. Aurora is a soft wash.
2. The round 4 hero is **already an orange gradient wash**. Aurora alone would look like a small change on desktop, while the line art is a visible upgrade.
3. Line art suits a developer audience (Linear/Vercel feel) and doesn't add visual noise for non-developers.
4. The cost is the same as aurora once built to §2.1: compositor-only, no canvas, no WebGL, and JS is just the pause observer. Aurora isn't dropped either. Its blobs are the glow layer under the paths, and it is the automatic fallback tier.

*How the 21st.dev source is adapted to the §2.1 contract.* The original animates 72 paths' `pathLength` with framer-motion, which is a per-frame paint that §2.2 forbids beyond 3 short paths:
- **Static line art.** One inline SVG (`viewBox="0 0 696 316"`, `preserveAspectRatio="xMidYMid slice"`) with **18 paths** in 3 `<g>` groups. The paths are never redrawn. Each group sits in its own absolutely positioned wrapper `div`, and **only the wrapper moves**: `transform` translate ±2% / rotate ±1.5° and `opacity` .55↔.9, using the §2.2 aurora periods (18s / 23s / 29s, `--mm-ease-drift`, `alternate infinite`). That adds 3 composited layers.
- **Travelling highlights:** at most **3 short orange paths** (`--mm-hero-2`) with `stroke-dashoffset`. That is the §2.2 Beams-row allowance ("acceptable only for ≤ 3 short paths"), and the timing comes from the same row: 6–10s per run, delay 0–4s, opacity 0→.8→0. If paint flashing shows they exceed budget, drop them first.
- **Glow:** 2 aurora blobs exactly as the §2.4 snippet (`.blob.b1`, `.blob.b2`, `--mm-hero-1/-2`, peak opacity ≤ .35), which adds 2 layers. **Total animated layers: 5 (≤ 6 per §2.1).**
- **Tint and contrast:** line strokes `#F4F4F6` at .04–.12 by path index, and orange appears only in the 3 highlight paths and the blobs (opacity ≤ .35 behind text per §2.1). Add the §2.1 **static scrim** `linear-gradient(90deg,#0E0E11 0%,rgba(14,14,17,.7) 40%,transparent 70%)` behind the copy column, so `#F4F4F6` copy stays ≥ 7:1.
- **Zero layout shift:** the hero has a fixed `min-height: 560px`. `.mm-hero-bg` is `position:absolute; inset:0; overflow:hidden; contain:strict; z-index:-1; pointer-events:none; aria-hidden`. Nothing in it affects layout.
- **First paint and poster (§2.1, §2.3):** the server renders the SVG and blobs **frozen at t=0**. That *is* the poster (0 KB, no image request). Animation classes are added after `requestIdleCallback`. The H1 is the LCP and never waits for the background.
- **Pause (§2.1):** an `IntersectionObserver` (threshold 0) on the hero toggles `.is-paused` (`animation-play-state: paused; will-change: auto`), and so does `visibilitychange`. CSS animations resume from the same point, so there's no jump. The palette also pauses the hero while it is open (§6 rule).
- **Reduced motion, Save-Data, low power (§2.1, §2.3):** the poster only. The animation classes are never added, and `@media (prefers-reduced-motion: reduce){ .mm-hero-bg *{ animation:none } }` sits next to the site's existing `.homepage-hero` reduced-motion block in `globals.css` (same pattern). Save-Data / `prefers-reduced-data` / `hardwareConcurrency<=4` / `deviceMemory<=4` also give the poster. There is no pointer effect at all.
- **Governor (§2.1):** with no canvas, the only step-down is **live → poster** if the p75 frame delta over the first 120 frames is > 20 ms (`sessionStorage('mm_hero_tier')`).
- **Budget:** SVG < 6 kB gzip, ≤ 1 kB of JS (observer plus idle start), 0 network requests. Verify against the DESKTOP_MOTION §10 hero QA lines (60 fps at 1440×900 on an iGPU, paint flashing shows only the ≤ 3 highlight paths).

**Fallback: Aurora Background (Manu Arora, MIT), built as DESKTOP_MOTION §2.4 "Aurora, CSS-only tier".**
- Use it if the primary misses budget on test hardware, or if Samuel prefers the softer look. It's the same `.mm-hero-bg` container and the same scrim, poster, pause and reduced-motion rules. Only the static path SVG and the 3 highlights are removed. It's a const switch in `Hero.tsx` (`HERO_BG = 'paths' | 'aurora'`).

## 5. Hover, focus and press states

Timings and easings: **DESKTOP_MOTION** §3 (cards), §4 (tabs), §5 (FAQ), §6 (palette), §7 (scroll reveals) and §8 (focus ring). The table below lists *what* changes, and the timings come from those sections. Buttons and links use `--mm-dur-2` hover in, `--mm-dur-hover-out` out and `--mm-dur-1` press (MOTION_SPEC §1).

| Element | Hover | Focus-visible | Press |
|---|---|---|---|
| Primary button | bg #C2410C → #E8590C | 2px #FB923C ring, 2px offset | scale .98 |
| Secondary/outline | border #2A2A33 → #A1A1AA, bg #17171C → #202027 | ring | scale .98 |
| Text link | #FB923C, underline appears (`text-decoration-color` transition) | ring | — |
| Product card | exactly DESKTOP_MOTION §3: lift `--mm-lift-card-desk`, `::after` shadow layer, cover `--mm-scale-cover-desk`, optional `.mm-spot` cursor-follow rim (that is the Magic Card effect, built the compositor-safe §3 way) | §3 focus row + global ring | §3 press row |
| Category tile | lift `--mm-lift-card` (−4px, MOTION_SPEC), border takes the tile's decorative colour | ring | — |
| Tabs | DESKTOP_MOTION §4: label opacity only on hover. The indicator moves on **select**, not on hover (this overrides the hover pill in the Vercel Tabs source) | ring on the tab | — |
| Nav links | text #A1A1AA → #F4F4F6 | ring | — |
| ⌘K items | DESKTOP_MOTION §6 highlight (`.mm-pal-hl`, `--mm-dur-highlight`) | the highlight *is* the indicator (`aria-activedescendant`) | §6 execute flash |

Every hover has a matching `:focus-visible` state. Nothing appears only on hover (the price, seller and actions are always visible).

## 6. ⌘K search and keyboard shortcuts: **features with acceptance criteria**

These are new features, not styling. A chunk isn't done until every box is ticked.

**Acceptance criteria**
- [ ] **AC1** ⌘K on Mac and Ctrl+K on Windows/Linux open search **from any page** (mounted once in `app/layout.tsx`). Pressing it again while open closes it. **Esc closes it and returns focus to the element that had focus before it opened** (store `document.activeElement` on open and `.focus()` it on close; also on backdrop click).
- [ ] **AC2** Single-key shortcuts (`/`, `?`, `g` sequences) **never fire while focus is in an `input`, `textarea`, `select` or `[contenteditable]`** (checked through `event.target.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"]')`). They also skip when `event.isComposing`, or when Alt/Meta/Ctrl is held (except the ⌘K/Ctrl+K combo itself, which works everywhere, inputs included).
- [ ] **AC3** Results **link to real product pages** (`/gigs/{id}` from the Supabase `gigs` table, same query and visibility rules as `app/marketplace/PageClient.tsx`, and only published listings). Enter navigates and ⌘/Ctrl+Enter opens a new tab. The last row is always "See all results for '…'" → `/marketplace?q=…`. **An empty query** shows "Popular categories" (Web & Software, Design, Marketing, Writing → `/marketplace?category=…`) plus "Recently viewed" (localStorage, max 5) plus Pages (Marketplace, How it works, Sell, Help). **A query with no match** shows "No products match '…'. Try a shorter word, or browse a category:" followed by the category suggestions and a "Browse all products" link. Never a blank panel.
- [ ] **AC4** Opening the palette and all other new animations cause **no layout shift**: the dialog is `position:fixed`, scrollbar compensation uses `scrollbar-gutter: stable` on `html`, the result list has a fixed max-height, and the loading state uses skeleton rows of the same height. Everything **turns off under `prefers-reduced-motion`**, reusing the site's existing pattern (the `@media (prefers-reduced-motion: reduce)` blocks in `app/globals.css` and the `matchMedia('(prefers-reduced-motion: reduce)')` check in `components/motion/FadeIn.tsx`). Do not add a new mechanism.
- [ ] AC5 Palette a11y: `role="dialog" aria-modal="true" aria-label="Search"`, input `role="combobox"` with `aria-activedescendant` (cmdk provides it), focus trapped while open, a result count read by an `aria-live="polite"` region ("5 results").
- [ ] AC6 Motion and speed follow DESKTOP_MOTION §6 (open `--mm-dur-palette-in`, close `--mm-dur-palette-out`, native `<dialog>`, input focused on frame one, results replace instantly, no `AnimatePresence`). Speed: remote debounce 120 ms (§6), cancel stale requests with AbortController, limit 8 products, results < 300ms p75 on the preview. The palette code loads through `next/dynamic` and is **pre-mounted at idle** (hidden `<dialog>`, per DESKTOP_MOTION §6), so ⌘K is just `showModal()`. It adds nothing to the first-load JS. The product index is prefetched on the first `pointerenter` of the search button or the first ⌘ keydown.

**Shortcut map** (shown in a "Keyboard shortcuts" dialog opened with `?`, from the footer link, and from a hint in the palette footer)

| Keys | Action | Fires in inputs? |
|---|---|---|
| ⌘K / Ctrl K | Open/close search | Yes |
| / | Focus search (opens the palette) | No |
| ? | Show shortcuts | No |
| g then h | Go home | No |
| g then m | Go to marketplace | No |
| g then s | Go to messages (signed in) / sign in | No |
| ↑ ↓ Enter Esc | Move / open / close inside the palette and menus | Palette only |

The OS label is detected with `navigator.userAgentData?.platform ?? navigator.platform` and shows `⌘K` on Mac, otherwise `Ctrl K`. It is rendered after mount in a fixed-width `<kbd>` so the swap doesn't shift layout.

## 7. Accessibility (WCAG 2.2 AA)

- Contrast: body #F4F4F6 on #0E0E11 and muted #A1A1AA on #17171C both pass. Orange **text** is #FB923C only (it passes on #0E0E11 and #17171C). #C2410C/#E8590C are **fills** with white text, never text on dark (round 4 found #C2410C text on #111 at 3.65:1, so don't repeat it). Decorative colours appear only on icons, tags and borders, and tag text stays #F4F4F6 on a 15% tint.
- Targets: every interactive element is ≥ 44 × 44px (pad the hit area with `::before` where the visual is smaller, as with tab underlines, icon buttons and FAQ chevrons). Search trigger 40px visual / 44px hit.
- Landmarks: `header`, `nav aria-label="Main"`, `main`, `footer`. A "Skip to content" link is the first focusable element.
- Focus order follows the visual order, there are no positive tabindex values, and the dropdowns and palette trap focus and restore it.
- Marquee: pauses on hover and on focus-within, and has a visible pause/play button (WCAG 2.2.2). Under reduced motion it becomes a static, horizontally scrollable row (as `.marketplace-marquee` already does).
- Motion: nothing flashes. The only loop is the hero, which pauses off-screen and stops under reduced motion.
- Images: product covers have alt = product title, and decorative SVGs have `aria-hidden`.

## 8. Non-developer friendly checklist

- [ ] Main buttons use plain verbs: **Browse products**, **Start selling**, **Sign in**, **Buy now** (shown as "Purchases paused" while checkout is paused).
- [ ] No jargon on main paths: say "Money held until you confirm delivery", not "escrow"; "Pay in Naira with Paystack", not "payment gateway"; "Search" with a visible text label, not a ⌘K icon on its own.
- [ ] Prices always show `₦` with thousands separators (`₦45,000`) and say what you get ("ZIP file · 4.2 MB").
- [ ] Keyboard shortcuts are optional extras, so nothing *needs* a shortcut. Every action also has a visible button.
- [ ] Monospace and file/version details sit in secondary text, never in headlines or buttons.
- [ ] One primary (orange) CTA per section.
- [ ] Empty states always say what to do next (see AC3).
- [ ] Every FAQ answer is ≤ 3 sentences, in plain English.
- [ ] The developer strip is the *only* developer-flavoured section, with a plain-English line under each tile.

## 9. Developer standards checklist (GitHub / Vercel / Linear bar)

- [ ] ⌘K plus shortcuts (§6).
- [ ] CLS = 0.00 on home, marketplace and product at 1440 (every image has width/height or `aspect-ratio`, fonts use `display: swap` with the existing `next/font` metrics fallback, no content injected above the fold after load).
- [ ] LCP < 2.0s and INP < 200ms on the preview (Lighthouse desktop ≥ 95 performance).
- [ ] First-load JS on `/` grows by **≤ 10 kB gz** total (cmdk is loaded lazily).
- [ ] Monospace for file type, size, version and order IDs.
- [ ] Visible focus everywhere. Links are real `<a href>` (middle-click and open in new tab work).

---

## 10. Build plan: ordered chunks (branch `design/ui8-dark`)

Default: **one builder runs the chunks in order** and commits after each one, and the work can stop cleanly after any chunk. Chunks are **file-independent**: each one owns the files listed and touches no others, so two builders could run them in parallel after Chunk 1 lands. Each chunk imports its own CSS file from its own component, so there are no shared stylesheet edits. Every chunk ends with `pnpm lint && pnpm test && pnpm build` (the repo's real scripts; `build` runs the type check), a 1440 + 1920 screenshot, and a CLS check.

| Order | Chunk | Label | Owns these files (only) | Done when |
|---|---|---|---|---|
| 1 | **Foundation: home split, desktop grid, no layout shift, speed** | **MUST-HAVE** | `app/page.tsx`; new `components/home/{Hero,Categories,FeedSection,HowItWorks,DevStrip,SellCta,CtaBand,Footer}.tsx` (existing markup moved **verbatim**, so the visuals are identical); new `app/home-desktop.css` (12-col container, section rhythm, `aspect-ratio` on covers, `scrollbar-gutter: stable`); `next.config.mjs` (image sizes only) | The page looks the same as round 4 at all widths, CLS 0.00, and all tests pass. This turns each later chunk into one file |
| 2 | **⌘K search + keyboard shortcuts + desktop nav** | **MUST-HAVE** | new `components/search/{CommandPalette.tsx,SearchTrigger.tsx,search-events.ts,command-palette.css}`; new `lib/search/searchGigs.ts`; new `components/shortcuts/{useHotkeys.ts,ShortcutsDialog.tsx,Kbd.tsx}`; `app/layout.tsx` (mount palette + shortcuts once); `components/SiteHeader.tsx` (desktop nav + trigger); `package.json`/`pnpm-lock.yaml` (+`cmdk` only) | AC1–AC6 pass. The logic is unit-tested in a new `tests/command-palette.test.mjs` (the input guard for AC2, the empty and no-match states for AC3, result URLs that equal `/gigs/{id}`). Focus return and CLS are checked in a real browser on the preview at 1440 |
| 3 | **Hero + classic background** | **MUST-HAVE** | `components/home/Hero.tsx`; new `components/home/HeroPaths.tsx` (primary) and `components/home/HeroAurora.tsx` (fallback, behind the `HERO_BG` const); new `app/home-hero.css` (adds the DESKTOP_MOTION §1 tokens it uses, scoped to `.mm-hero-bg`, if they aren't in `:root` yet) | Every DESKTOP_MOTION §2.1 row is met and the §10 hero QA lines pass. Reduced motion and Save-Data give the poster, CLS 0.00, no canvas or WebGL |
| 4 | **Product card hover + New/Trending tabs** | NICE-TO-HAVE | `components/marketplace/GigCard.tsx`; `components/home/FeedSection.tsx`; new `components/marketplace/gig-card-hover.css`; new `components/home/FeedTabs.tsx` | §5 card and tab states, tabs with arrow keys, 44px targets |
| 5 | **Developer strip bento** | NICE-TO-HAVE | `components/home/DevStrip.tsx`; new `components/home/dev-strip.css` | The "Try it" button opens ⌘K through `search-events.ts` (imported, not edited) |
| 6 | **FAQ two-column accordion** | NICE-TO-HAVE | `components/HomeFAQ.tsx`; new `components/home-faq.css` | One open at a time, `aria-expanded`, `grid-template-rows` animation, reduced motion → instant |
| 7 | **Sell CTA + orange band + Border Beam** | NICE-TO-HAVE | `components/home/SellCta.tsx`; `components/home/CtaBand.tsx`; new `components/home/cta.css` | One beam on one button, stops under reduced motion |
| 8 | **Format/category marquee** | NICE-TO-HAVE | `components/home/Categories.tsx`; new `components/home/marquee.css` | Real formats/categories only, a pause button, static under reduced motion |
| 9 | Footer shortcuts link | NICE-TO-HAVE | `components/home/Footer.tsx` | The "Keyboard shortcuts" link opens the dialog (via `search-events.ts`) |
| — | Testimonials, number ticker | **LATER (blocked)** | — | Only when Samuel supplies real quotes and real totals. Never ship placeholder numbers or quotes |

If two builders run in parallel after Chunk 1, use Builder A for 2 → 4 → 6 → 8 and Builder B for 3 → 5 → 7 → 9. Chunk 5 and Chunk 9 only *import* `search-events.ts` from Chunk 2, so B must wait until Chunk 2 has merged before starting 5.

**Never touch:** `lib/paystack-*`, `app/payments/**`, the purchase-paused button logic, `components/Logo.tsx`, the desktop auth slide (`.mm-auth*`) except through the dedicated fix in AUTH_TRANSITION_FIX.md / MOTION_SPEC.md §14, and anything on the light branch.

---

## 11. Open conflicts for Samuel / Animation Master (not decided here)

1. **Focus and accent orange.** DESKTOP_MOTION §0/§8 use `#FF7A1A` (`--mm-focus`) for the focus ring, tab underline and palette highlight. The brand rules for this spec say focus and orange text are `#FB923C`. Both pass AA on `#0E0E11`/`#17171C`. Build with the `--mm-focus` token everywhere so this is a one-line change. **Pick one value.**
2. **Durations above 240 ms.** The brief caps UI motion at 120–240 ms, but DESKTOP_MOTION sets the accordion open to 280 ms, scroll reveal to 420 ms and desktop cover zoom to 420 ms. This spec follows DESKTOP_MOTION as instructed. If the 240 ms cap is strict, those three tokens are the only ones to change.
3. **Hero type.** This spec picks paths-over-aurora (primary) with aurora (fallback). Animation Master's default is aurora. The reasons are in §4, and switching is one const.

## §6.1 Amendment (Oct 25, Logic Analyst check) — overrides any conflicting route in §6
1. Category links use the real values only: `development`, `design`, `marketing`, `writing`, `ai_assisted` (e.g. `/marketplace?category=development`). Display labels stay "Web & Software", "Design", "Marketing", "Writing", "AI-assisted".
2. Page links: How it works → `/#how-it-works`; Help → `/#faq`; Sell → `/gigs/new` (already redirects signed-out users to sign-in and back). There are no `/sell` or `/help` routes.
3. Recently viewed: re-check each item against published listings before rendering; drop removed products silently.
