# Log-in ↔ sign-up transition: fix checklist (build-ready)

**Status:** this is a spec only. No code was changed, committed or pushed.
**Base:** `origin/design/ui8-dark` @ `c6cf827` (PR #10). It was read and run from the throwaway worktree `/workspace/wt-auth`, which has a stub `.env.local`: fake Supabase URL, no secrets.
**Target choreography:** `/workspace/middleman-motion/MOTION_SPEC.md` §14 (Animation Master). This file doesn't redesign it. It does three things:
- confirms or corrects §14.1 with measurements;
- merges in The Logic Analyst's four `switchMode` fixes;
- adds the Organizer's decisions (a) per-mode copy, (b) a measured min-height and (c) two pre-drawn wave SVGs.

**Line refs** are for `app/signup/PageClient.js` (PC) and `app/product-design.css` (CSS) at `c6cf827`.

**About commit 9981698** ("Restore desktop login/sign-up hero slide"):
- It isn't on any remote branch.
- `ui8-dark` already carries the equivalent rule at CSS L255–267: hero `translateX(100%)` and form `translateX(-100%)`, scoped to ≥768 px, using the `.8s` transitions at L105 and L120.
- That restore is the slide that is janky today. Section 2 replaces it, so don't cherry-pick 9981698.

---

## 0. Evidence: what was measured

The production build (`next build && next start`) was run locally in Chrome, in dark mode (the default). Capture method:
- Playwright with a CDP screencast for the frames;
- a rAF probe logging the rects of the logo, hero, form and face, the number of forms, the opacity, the wave's `::after` and the URL;
- `PerformanceObserver` for layout-shift and long-animation-frame;
- a Chrome trace.

| Artefact | Path |
|---|---|
| Frames 1440×900 (log-in → sign-up → log-in, ~50 ms apart) | `/workspace/shots/auth-transition/1440/*.jpg` |
| Frames 375×812 | `/workspace/shots/auth-transition/375/*.jpg` |
| Contact sheets | `/workspace/shots/auth-transition/contact-1440.png`, `/workspace/shots/auth-transition/contact-375.png` (copies are saved as `{1440,375}/contact-sheet.png`) |
| Probe logs and traces | `{1440,375}/probe.json`, `{1440,375}/trace.json` |
| Scripts | `capture.py`, `race.py`, `measure.py` in the same folder |

**Measured at 1440×900:**
- **Page height jumps 900 → 992 px the instant you click "Create account"** (and 992 → 900 on the way back). Hero and form both stretch, a scrollbar appears, and `.mm-auth-hero-note` shifts down 92 px.
- **The form face swaps at t = 0.** In the very first frame after the click, the sign-up face is mounted at opacity 0 and the log-in face is gone. It then fades in over 450 ms while its column is still travelling.
- **The wave teleports at t = 0.** `::after` goes from `left: 665px; transform: none` to `left: -1px; transform: matrix(-1,0,0,1,0,0)` in the click frame, before the panel has moved 1 px. Frame `03_click_signup_+0154ms.jpg` shows the dark bite on the wrong edge of a still-left hero.
- **The panels cross.**
  - Around 430–560 ms the form column (later in the DOM, no z-index) paints over the hero.
  - Frame `09_…+0454ms` shows only a sliver of orange: the hero, logo and copy are hidden under the form.
  - Frame `10_…+0504ms` shows orange reappearing on the right.
- **The logo travels.** Its x moves 40 → 760 px with the hero, and it is covered by the form mid-slide.
- **Main thread is fine.** The rAF delta never exceeded 16.8 ms, there were no tasks over 16 ms and no LoAF entries during the toggles. The jank is choreography and layout, not CPU.
  - The single biggest frame cost was a **24.6 ms raster task** at transition start. That is the two 720×992 layers getting promoted on the first frame. It was measured in headless software raster, so expect less on a real GPU, but it is a real first-frame hitch.
- **Every toggle fires a server round-trip.** `router.replace` triggers an RSC fetch (`/signup?mode=signup&_rsc=…`) because `/signup` is `force-dynamic`. On production latency that re-render lands mid-slide.

**Measured at 375×812:**
- The 720 ms orange wipe covers the **entire screen, logo and tabs included**, from about 250 to 600 ms. That is the "flash" (frames `signup_+0303…+0603`).
- The page height jumps 956 → 1206 px at the 300 ms swap.
- The wave `::after` animates `scaleX(-1 → 1)` over 800 ms, so it visibly squashes through zero.

**Race test (`race.py`, 375 px):**
- Tap Create account, then Sign in 100 ms later. The page ends in **sign-up**, while the Sign in tab has focus and the user's last input was Sign in.
- With a 450 ms gap, `data-switching` stays `true` from 43 to 1261 ms without ever resetting. The CSS wipe animation therefore never restarts, and the second swap happens with no orange cover: a visible snap.

**Focus test:** clicking the in-form "Create an account" link leaves `document.activeElement = BODY`, so focus is lost.

**Reduced motion:** the hero's `transition-duration` computes to `0s`, so the result is an instant 720 px orange-block teleport.

### 0.1 §14.1 diagnosis: confirmed or corrected

| §14.1 | Verdict | Evidence |
|---|---|---|
| D1 panels cross, form paints over hero | **Confirmed** (top cause) | Frames +404…+554 ms |
| D2 form content swaps at click | **Confirmed** | Probe: face swap and opacity 0 in the click frame |
| D3 wave pops | **Confirmed** | `::after` left/transform change in the click frame |
| D4 page height jumps | **Confirmed and quantified** | 900 → 992 (1440), 956 → 1206 (375) |
| D5 logo travels | **Confirmed** | Logo x 40 → 760 px, hidden mid-slide |
| D6 no history or interruption model | **Confirmed, plus more** | `router.replace` = 1 history entry total (Back leaves `/signup`) **and** an RSC fetch per toggle; race test above |
| D7 breathe repaints | **Corrected: moot today** | The raster wave div is `display:none` everywhere: CSS L669 (mobile), L867 (global) and L1172 (≥768). Breathe never runs. Keep the §14.2 compositor-only breathe only if the raster wave comes back |
| D8 mobile wipe and wave flip | **Confirmed** | 375 frames: full-screen orange, logo covered; scaleX squash |
| D9 reduced motion teleport | **Confirmed** | `transition-duration: 0s` |
| — (new) | **Added: first-frame raster hitch** | 24.6 ms RasterTask at transition start (layer promotion). §14's WAAPI promotes at start too, so pre-promote at `pointerdown`/`focus` of a tab (see M2) |
| — (new) | **Added: focus loss** | In-form link triggers unmount their own button → focus on `BODY` |

**Corrections to §14 snippets:**
- The sign-up first field is **`#signup-name`**, not `#signup-fullname`.
- The draft hook is **`usePersistedForm({ formId:'signup' })`** (PC L262), not `useSignupDraft`.
- `--mm-ease-in-out`, `--mm-ease-in`, `--mm-ease-out` and `--mm-ease-snap` **don't exist in the app CSS yet**. Define them on `.mm-auth` (step S1).
- §14.6 says "Log in". The real sign-in `<h1>` is "Welcome back." (PC L485).

**Colour note (no change requested):** the code uses `--auth-hero-bg: #F97316` with `#111111` text and a navy logo in **both** themes (globals.css L21/L33, CSS L866/L1169). The brief's #C2410C with white ink in dark isn't what ships. This spec doesn't change colours. If Samuel wants #C2410C, it is a one-variable change in `globals.css`, so flag it to him separately.

---

## Checklist for Grok Bot. Do the steps in order; each line is one commit-sized change.

Work on `design/ui8-dark` only. Use no new dependencies. Durations follow §14.3: the slide is **760 ms** on `cubic-bezier(.65,0,.2,1)` (`--mm-ease-in-out`). That is §14's deliberate trim of the reserved 800 ms. If Samuel wants exactly 800, change `--mm-auth-dur` and add 5% to every offset below.

### 1. Logic fixes (do these first; they fix the snaps on their own)

All four are **confirmed** in PC `switchMode` (L229–249) and its cleanup (L227).

- [ ] **L1. Stored, cancellable timers; no queued taps.**
  - The bug: L247 `window.setTimeout(applyMode, 300)` is never stored. Only the 720 ms timer goes into `switchTimer` (L248), so a second tap can't cancel the first swap.
  - The race test confirms it: the last tap is lost and the wipe doesn't restart.
  - Fix: keep **all** pending work in one ref, plus a run token. Every new request cancels it, and stale callbacks check the token and bail.
  - While a switch is running, a toggle **reverses** toward the newest target (§14.5 "last click wins"). This is the "ignore taps during a switch" fix, upgraded: no tap is queued and none fires late.

    ```js
    const run = useRef({ token: 0, timers: [], anim: null, pin: null, target: null });
    const clearRun = () => { run.current.timers.forEach(clearTimeout); run.current.timers = []; };
    ```

- [ ] **L2. No `router.replace` for mode changes.**
  - The bug: L235 `router.replace(buildAuthUrl(...))` changes `searchParams`. That re-runs the L205–209 effect and triggers an RSC fetch plus a second render mid-animation.
  - Fix: use the **native history API**. Next 15 keeps `useSearchParams` in sync with it, so there's no server fetch and no re-render from the router.
  - Delete the L205–209 effect. The initial mode comes from `getInitialMode` (L130). Later mode changes come only from `requestMode()` and the `popstate` listener.
  - **Decision needed (one line):** The Logic Analyst said `replaceState`; §14.6 says `pushState`. The checklist defaults to `history.pushState`, because §14 is the target and Samuel asked for Back/Forward to work.
    - With `pushState`, Back undoes the last toggle with the same choreography.
    - With `replaceState`, Back leaves `/signup` in one step.
    - Either satisfies the Logic Analyst's actual fix: no router call, so no remount or refetch. Swap the one call if Samuel prefers `replaceState`.
- [ ] **L3. One timed path for desktop and mobile.**
  - The bug: L237 `if (reduceMotion || desktop) { applyMode(); return; }` makes desktop skip the phase state entirely. The swap is instant and the CSS slides separately.
  - Fix: replace `switching: boolean` with **`phase: 'idle'|'leaving'|'swapping'|'entering'`** on `<main data-phase>`. Desktop and mobile both go through it, with different durations (§14.4 and §14.10). Only reduced motion skips it (step M5).
- [ ] **L4. Clear everything on unmount.**
  - The bug: L227 clears only `switchTimer`.
  - Fix:

    ```js
    useEffect(() => () => { clearRun(); run.current.token++; run.current.anim?.cancel(); run.current.pin?.cancel(); }, []);
    ```

  - Also on `pageshow` with `event.persisted` (bfcache restore): call `clearRun()`, set `phase='idle'` and cancel the animations, so a restored page is never stuck mid-phase.
- [ ] **L5. Focus.** `done()` (§14.11) focuses `#signup-name` / `#login-email` with `{preventScroll:true}` after **pointer and link** triggers.
  - Arrow keys in the tablist keep focus on the tab.
  - `popstate` moves nothing.
  - This fixes the measured focus loss to `BODY`.
- [ ] **L6. `localStorage('mm_last_auth_mode')`** is written in `done()` at `idle`. It replaces the L220–225 effect, so it isn't written on the transient mid-swap state.

### 2. Structure (DOM and CSS, before any motion)

- [ ] **S1. Tokens** on `.mm-auth`:

  ```css
  .mm-auth{
    --mm-ease-in-out:cubic-bezier(.65,0,.2,1); --mm-ease-in:cubic-bezier(.4,0,1,1);
    --mm-ease-out:cubic-bezier(.22,1,.36,1);   --mm-ease-snap:cubic-bezier(.2,0,0,1);
    --mm-auth-dur:760ms; --mm-auth-min-h:1032px;
  }
  ```

- [ ] **S2. DOM per §14.2.** Rewrite PC L392–534:

  ```
  main.mm-auth[data-mode][data-phase]
    .mm-auth-panel                 position:relative; overflow:clip; grid 1fr 1fr; background = form surface
      .mm-auth-brand               dark-surface Logo (aria-label), pinned: abs top:40px left:40px z:3
      .mm-auth-stage (ref)         THE ONLY MOVING LAYER: abs inset:0 auto 0 0; width:50%; z:2; contain:layout paint style
        .mm-auth-edge--r  <img src="/design/auth-edge-r.svg">   right:-56px
        .mm-auth-edge--l  <img src="/design/auth-edge-l.svg">   left:-56px
        .mm-auth-pin (ref)         abs inset:0; holds the onPanel Logo at top:40px left:40px, aria-hidden (counter-translated)
        .mm-auth-hero-copy         per-mode copy (S4)
        .mm-auth-hero-note         "Purchases are paused…"
      section.mm-auth-slot         grid-column 2 (signin) / 1 (signup); tabs + ONE keyed face with ONE <form>
  ```

  - Delete `<div className="mm-auth-wipe">` (L533) and the empty `<div aria-hidden>` raster-wave div (L395).
  - **Contain:** `.mm-auth-stage` uses `contain: layout paint style` because its overhangs sit outside its box. The panel clips them, not the stage, so **don't** add `overflow:hidden` on the stage.
  - Also add `contain: layout style` on `.mm-auth-slot`.
  - "Browse first" stays in the mobile header only (it's already hidden ≥768 via CSS L198).
- [ ] **S3. Two pre-drawn wave SVGs, no scaleX flip** (decision c).
  - Create `public/design/auth-edge-r.svg` and `public/design/auth-edge-l.svg`, each `viewBox="0 0 56 800"` with `preserveAspectRatio="none"`.
  - **The orange bulge is the shape**: fill `#F97316` (= `--auth-hero-bg`), stroke as today.
  - `-l` is the path redrawn with mirrored x coordinates (x → 56 − x), **not** a transform.
  - Use the current curve from CSS L1184 as the source: `M30 0C10 80 50 160 30 240S10 400 30 480 50 640 30 720 10 800 30 800`. Fill from that path to x=0 for `-r`, and the mirror for `-l`.
  - **Delete:**
    - CSS L1175–1191 (desktop `::after` wave plus its signup override);
    - L192–194 (raster wave and its `scaleX(-1)`);
    - L276 `mm-background-breathe`.
  - **Mobile band** (§14.10): keep the bottom wave static.
    - Delete CSS L683–685 (`[data-mode=signup] ::after { scaleX(-1) }`) and the `transition` at L681.
    - The band looks the same in both modes.
  - Slot padding on the hero-facing side: at least **72 px**, so the 56 px overhang never touches inputs (`padding-inline: 72px 96px` for signin and `96px 72px` for signup).
- [ ] **S4. Per-mode hero copy** (decision a). Render from a table, keyed by the *shown* mode:

  | Mode | Headline (`p.font-display`) | Sub |
  |---|---|---|
  | Log-in | `Ready-made.<br/>Made yours.` | `Find useful digital products. Customize them with the creator.` |
  | Sign-up | `Join The Middleman.` | `Buy ready-made digital products or sell your own, paid in Naira.` |

  - Lock the copy box so the swap never reflows the stage: `.mm-auth-hero-copy{min-height:<tallest of the two at the breakpoint>; max-width:470px}`.
  - "Join The Middleman." fits on 2 lines at `clamp(40px,4.6vw,66px)` in a 470 px box. Verify both at 1280 and 1440, and set `min-height` to the taller one.
  - Mobile (<768): the copy also swaps per mode, in the same 100 ms hidden window as the form.
- [ ] **S5. Height: measured, not guessed** (decision b).
  - The sign-up slot's natural height was measured with the panel unconstrained. Chrome, dark, production build:

    | Viewport | Log-in slot | Sign-up slot (current padding 48 px + `clamp()` sides) | Sign-up with §14 sides 96/72 | Sign-up + password checklist visible |
    |---|---|---|---|---|
    | 1280×800 | 743 px | **992 px** | **1030 px** | +78 px (1070 / 1109) |
    | 1440×900 | 743 px | **992 px** | **1030 px** | +78 px (1070 / 1109) |

    The two widths match because the face caps at `max-width: 28rem` (448 px).
  - **Set `--mm-auth-min-h: 1032px`** (the §14 padding value, rounded up) for ≥768, and `.mm-auth-panel{min-height:max(100svh, var(--mm-auth-min-h))}`. Replace the `min-height:100svh` / `md:min-h-[680px]` at CSS L104 and PC L393.
  - Log-in is vertically centred in the same box (`justify-content:center`), so toggling never changes `scrollHeight`.
  - The checklist and error alerts (+78 px or more) use the §14.7 fallback: lock the slot height while hidden, then animate the **slot's** height over the `entering` window. The panel's min-height doesn't move.
  - Optional, if Samuel dislikes the page scrolling at 1280×800: put Phone and State side by side at ≥1024 px. That saves about 80 px, so re-measure and lower the token.
- [ ] **S6. Remove the old slide rules:**
  - CSS L105 and L120: the `transition: transform .8s` on hero and form;
  - L154, L255–267 (the 9981698 equivalent);
  - L283–286 and L295 (`mm-auth-face` keyframe on mount);
  - L740–752 and L277–282 (wipe and `mm-auth-spider`);
  - L159 (the blanket `transition:none` kill switch; replaced by M5).
  - Keep the L196–205 hero-bar placement only if it's still used for the mobile header.

### 3. Motion (use the §14.4 timeline exactly)

Desktop ≥768 px, log-in → sign-up. Sign-up → log-in is the mirror.

| t (ms) | Stage (hero, waves, pinned logo copy) | Hero copy | Slot (tabs + form) |
|---|---|---|---|
| 0 | WAAPI `translateX(0→100%)`, 760 ms `--mm-ease-in-out`; pin counter-animates `0→-100%` | out: opacity 1→0, translateX 0→+12 px, 180 ms `--mm-ease-in` | out: opacity 1→0, translateY 0→−6 px, 160 ms `--mm-ease-in`; `inert`, `aria-hidden`, `aria-busy`; pill slides 160 ms `--mm-ease-snap` |
| 160–180 | 5–7 % | 0 | 0 |
| ≈340 (`currentTime ≥ 340`, ≈50 %) | | copy content swaps (hidden) | **swap:** `flushSync` sets mode → new face mounts in the other grid column at opacity 0; the only layout of the run |
| 480 | 88 % | in: opacity 0→1, translateX −12→0, 280 ms `--mm-ease-out` | |
| 500 | 90 % | | in: opacity 0→1, translateY 8→0, 260 ms `--mm-ease-out` |
| 760 | settled; cancel the anims after committing the resting class | 1 | 1; clear `inert`/`aria-*`; focus first field (L5) |

- [ ] **M1. Controller.** Implement `requestMode()`, `watchSwap()` and `done()` from §14.11, with L1–L6 applied. Pointer/link triggers pass `source:'pointer'`, tab arrow keys pass `'arrow-key'`, and `popstate` passes `'popstate'`.
  - Reversal before the swap uses `anim.reverse()` and `pin.reverse()`; nothing swaps.
  - After the swap, the threshold is `currentTime ≤ 420`.
- [ ] **M2. Compositing.**
  - Set `will-change: transform` on `.mm-auth-stage` and `.mm-auth-pin` while `data-phase ≠ idle`.
  - **Also add it on `pointerenter`/`focusin` of `.mm-auth-tabs` and the inline switch links, and remove it on leave if idle.** This pre-promotes before the click and removes the measured 24.6 ms first-frame raster.
  - Never animate `left`, `right`, `width`, `clip-path`, `background-*` or `scaleX`.
- [ ] **M3. Mobile (<768): 240 ms form-only cross-fade** per §14.10.
  - 0–100 ms: face out, opacity 1→0, `--mm-ease-in`.
  - At 100 ms: swap (form and per-mode copy).
  - 100–240 ms: in, opacity 0→1 and translateY 6→0, `--mm-ease-out`.
  - No slide and no wipe. The hero band, logo and tabs stay still.
  - The same `phase` machine and timers ref as desktop (L3) handle it.
- [ ] **M4. Tab pill:** `transition: transform 160ms var(--mm-ease-snap)`, replacing `.35s` at CSS L251.
- [ ] **M5. Reduced motion: 150 ms cross-fade.**
  - Use `document.startViewTransition(() => flushSync(commit))` with `view-transition-name: mm-auth` on `.mm-auth-panel`, and `::view-transition-old/new(mm-auth){animation-duration:150ms; animation-timing-function:linear}`. If it's unsupported, swap instantly.
  - Desktop and mobile alike: no transform, no breathe.
  - Focus moves immediately.
  - Scope the `transition-duration:0ms` override to `.mm-auth-stage, .mm-auth-slot, .mm-auth-hero-copy`, not `.mm-auth *`, so input focus rings still work.
- [ ] **M6. Resize across 768 px mid-run:** call `anim.finish()`, `pin.finish()` and `clearRun()`, then apply the target layout.

### 4. QA (run before posting results; §14.12 plus these measured gates)

Re-run `/workspace/shots/auth-transition/capture.py` against the new build (`next build && next start -p 3457`). Every assertion below comes from its rAF probe or a Playwright check.

- [ ] **No layout shift:**
  - `document.documentElement.scrollHeight` is identical before, during and after both toggles at 1280×800 and 1440×900. Today it goes 900 → 992.
  - Layout-shift entries = 0 at ≥768.
  - At 375, the height may change only while the face is at opacity 0.
- [ ] **Frames:**
  - rAF delta ≤ 16.7 ms for every frame of the 760 ms at 1440×900. Also run under 4× CPU throttle in the Performance panel.
  - No `RunTask` over 16 ms.
  - Paint flashing shows no stage repaint while moving.
  - Exactly one Layout at about 340 ms.
- [ ] **Logo pinned:** the `.mm-auth-brand` rect is identical in every frame (Δ = 0 px). Today x goes 40 → 760. The logo is never covered: z-index 3 is above the stage.
- [ ] **Never two forms:**
  - `document.querySelectorAll('.mm-auth form').length <= 1` in every frame.
  - The slot opacity is 0 for the whole 160–500 ms window.
  - Hero copy: 0 by 180 ms and nothing before 480 ms.
- [ ] **No crossing:** in every frame the stage paints above the slot. Frame 450 ms must show orange covering the seam (today it shows a sliver).
- [ ] **No wave pop:** no `scaleX` anywhere in `.mm-auth*`. Neither edge `<img>` changes `left`, `right`, `opacity` or `transform` relative to the stage in any frame.
- [ ] **No server round-trip:** zero `?_rsc=` requests on toggle (today: one per toggle).
- [ ] **Race (`race.py`):** taps at 100 ms and 450 ms gaps, and 10 clicks in 2 s, end in the mode of the **last** tap, with one running animation at most and no console errors. Today the 100 ms gap ends in the wrong mode.
- [ ] **Reverse mid-move** at 100, 300, 400 and 600 ms returns smoothly from the current position.
- [ ] **Focus:** clicking the in-form "Create an account" ends with `activeElement.id === 'signup-name'` (today it's `BODY`). Arrow keys on the tabs keep focus on the tab.
- [ ] **Back/Forward:**
  - With `pushState`: each toggle adds one entry, Back and Forward replay the choreography, and focus doesn't move.
  - A reload of `?mode=signin|signup` lands with no animation.
  - A bfcache restore is never stuck mid-phase.
- [ ] **Reduced motion** (Playwright `reduced_motion='reduce'`): a 150 ms dissolve, with no stage transform in any frame.
- [ ] **Mobile 375×812:** a 240 ms form-only cross-fade. There's no element with an orange full-screen background in any frame, and the logo rect is constant.
- [ ] **Unmount mid-run** (navigate away at 200 ms): no timers fire afterwards and no React state-on-unmounted warnings appear.
- [ ] Post the new contact sheets next to the old ones as before/after.
