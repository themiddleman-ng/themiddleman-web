# Auth slide: test results and gaps (2026-11-03)

Nothing was pushed. The reference fix is a **local** commit only.

> **2026-11-05 update:** the Log in / Create account tab switcher was removed from the product. Only the inline links below the form switch modes. Panel slide retargeted to **480 ms** with `cubic-bezier(.4,0,.1,1)` (was 760 ms / `.65,0,.2,1`) for a fast smooth settle — see MOTION_SPEC §14. The harness default is `--expect links-only`; settle window **420–560 ms**. See `harness/README.md`.

## Contents

| Path | What |
|---|---|
| `harness/authslide_suite.py` | Playwright suite; runs against any running build: `python3 authslide_suite.py --base http://localhost:PORT --out DIR --label NAME` |
| `harness/run_against_ref.sh` | One command for any branch or commit: `harness/run_against_ref.sh origin/design/ui8-dark [port] [outdir]`. It makes a throwaway worktree, copies the stub `.env.local` (fake Supabase), runs `pnpm install --frozen-lockfile`, lint and build, starts the server, runs the suite, then cleans up |
| `71db55b/` | Results for **origin/design/ui8-dark @ 71db55b**, the other agent's fix: `SUMMARY.md`, `results.json`, `slide_1440_both_ways.{webm,mp4}`, `contact_1440.png`, `shots/` (0/100/200/340/450/500/760 ms both ways at 1280 and 1440, plus 390, iPhone 13 and Pixel 7) |
| `runs/71db55b/` | The same commit re-run through `run_against_ref.sh` (identical results: confirms the script works) |
| `reference-fix/` | The same suite against the local follow-up commit `1704832` |
| `0001-Make-log-in-sign-up-slide-fluid-single-hero-layer-ti.patch` | That follow-up as a patch on top of 71db55b (2 files, +24/−14). Apply with `git am` |

## What the suite checks (amended §14)

- **Frame timing:** rAF deltas over 0–900 ms, both directions, at 1280×800 and 1440×900.
- **Forms:** at most one `<form>` per frame.
- **Logo:** one rect per frame, and the right colourway over orange vs dark.
- **Page height:** constant.
- **Layout shift:** PerformanceObserver total, plus CLS excluding input.
- **Stage:** first move and settle time, and the phase timeline.
- **Wave edges:** offsets relative to the stage, and no `scaleX(-1)` anywhere.
- **Tabs:** pill motion, and whether the tabs jump while visible.
- **RSC requests:** for `/signup`.
- **Focus:**
  - in-form link → `#signup-name`;
  - tab click → `#login-email`;
  - arrow key → stays on the new tab.
- **Fast taps:** 5 taps in ~300 ms, which must be ignored after the first.
- **History:** pushState only on change, and Back/Forward animate.
- **Reload:** with `?mode` there's no animation.
- **Reduced motion:** no intermediate stage positions.
- **Mobile:** 390 px, iPhone 13 and Pixel 7 emulation (Chromium engine). No slide, no wipe, a 240 ms face fade, and height changes only while hidden.

## 71db55b results: 68 pass, 12 fail

**Passes:**
- **Frames:** max delta 16.8 ms, p95 16.7, 0 frames > 20 ms, at 1280 and 1440 in both directions.
- **Forms:** at most 1 form in every frame.
- **Logo:** rect constant at (40, 40).
- **Page height:** a constant 1104 px.
- **Stage:** moves 0 → 640/720 px; first move ≈ 40 ms, settled ≈ 725 ms. Phases: leaving 9 → swapping ≈ 345–360 → entering ≈ 510 → idle ≈ 775 ms.
- **Waves:** the edges are fixed relative to the stage, with 0 `scaleX(-1)` elements.
- **RSC:** 0 `/signup` requests.
- **Focus:** `#signup-name` and `#login-email` after clicks.
- **Fast taps:** 5 taps end in sign-up, with 1 history entry and the URL in sync.
- **History:** Back and Forward animate, no RSC request, and a reload doesn't animate.
- **Reduced motion:** 0 intermediate positions.
- **Mobile (390, iPhone 13, Pixel 7):** no slide, no wipe, face fade ≈ 31–198 ms, height changes only while hidden.

**Gaps.** Each is listed as evidence → minimal fix; all are fixed in `1704832`.

1. **The logo shows the wrong colourway mid-slide: dark ink on the dark form.**
   - Evidence: 5–7 frames per toggle (1440: 259–343 ms going to sign-up, 345–445 ms going back). `71db55b/contact_1440.png` frame 340 ms shows the logo almost invisible.
   - Cause: the on-orange copy isn't clipped to the stage (`.mm-auth-stage{overflow:visible}`), and the dark copy is switched by `data-mode` at the swap.
   - Fix: wrap the pin in `.mm-auth-pin-clip{position:absolute;inset:0;overflow:clip}`. Always show `.mm-auth-brand` beneath the stage (z-index 1), and set `pointer-events:none` on the stage.
2. **The tabs jump columns while visible.**
   - Evidence: the tablist x goes 824 → 104 at 359 ms at opacity 1 (1440). It's visible in frames 340 and 450 ms.
   - Cause: only the face fades; `.mm-auth-slot`'s tabs wrapper doesn't.
   - Fix: add `.mm-auth-slot-tabs` to the same leaving/swapping/entering animations (desktop only; mobile tabs stay put).
3. **Layout shift 0.5 per toggle** (total 1.0 per round trip). The sources are `.mm-auth-slot`, the tabs wrapper and the indicator.
   - It's excluded from CLS today only because the swap lands within 500 ms of the click (`hadRecentInput`). Back/Forward also logs 0.5.
   - Cause: `grid-column` 2 → 1 plus the `justify-content` change at the swap.
   - Fix: keep `grid-column:2` with `justify-content:flex-start`, and move the slot with `transform: translateX(-100%)` in sign-up. Transforms aren't layout shifts.
4. **Arrow keys lose the tab focus.**
   - Evidence: after ArrowLeft on "Sign in" the mode becomes sign-up, but focus stays on `#auth-tab-signin`, which is now unselected with `tabindex=-1`.
   - Cause: `switchMode()` doesn't return `requestMode()`'s result, so the `if (onSelect(...)) focus()` branch never runs.
   - Fix: `return requestMode(...)`.
5. **The decorative logo link is focusable inside `aria-hidden`** (axe rule aria-hidden-focus). The pin copy is a second "The Middleman homepage" link in the tab order.
   - Fix: set `pinRef.current.inert = matchMedia('(min-width:768px)').matches` and keep it in sync on change. On mobile the pin is the visible logo, so it stays focusable there.
6. **The headline breaks at the hyphen** ("Ready- / made.") at 1280 and 1440.
   - Cause: the `max-w-sm` (24rem) cap on a 66 px display line.
   - Fix: `.mm-auth-stage .mm-auth-hero-copy p.font-display{max-width:none}`. The 470 px copy box still bounds it.
7. **Min-height doesn't match the measurement.**
   - The natural sign-up slot is **1048 px** at both 1280 and 1440 (the face is capped at 28rem). That's with this build's 104/48 padding; sign-in is 799 px. The token is 1104 (56 px of dead space), and the designer's 1032 would be 16 px too short with this padding.
   - Fix: `--mm-auth-min-h:1048px`. The page then measures a constant 1048 in both modes.

**Reference fix `1704832`** (local branch `fix/auth-slide-fluid` in `/workspace/wt-authfix`, not pushed): **80/80 pass**.
- Lint: 0 errors.
- Build: ok.
- `pnpm test`: 99 pass.
- Layout shift: 0, including on Back.
- Logo: 0 wrong-colourway frames.
- Tabs: no visible jump.
- Arrow keys: focus lands on `auth-tab-signup`.
- Frames: max 16.8 ms.
- Page height: 1048 constant.

**Side effect:** sign-in is now top-aligned (104 px), the same as sign-up, instead of vertically centred in the tall box.

## Caveats

- Headless Chrome on the box (software raster, 60 Hz rAF). Real-GPU and 4×-throttle checks in the DevTools Performance panel are still worth doing on a laptop.
- iPhone and Pixel are Chromium device emulation, not WebKit or real devices.
- Playwright `go_back` reports `hadRecentInput: true`. A real Back button may count shifts toward CLS, which is why gap 3 matters.
- Still open from §14 (deliberately, per AUTH_TRANSITION_FIX amendments):
  - no per-mode hero copy (awaiting Samuel);
  - taps are ignored mid-run instead of reversing;
  - mobile: the invisible brand link is still focusable (pre-existing).
