# The Middleman: Desktop Motion Upgrade (spec only)

Version 1.0, 2026-10-25. **Written spec only.** No code has been built and no assets were produced. Every snippet is marked **UNTESTED**. The dark hero build still awaits Samuel's sign-off.

This document builds on `MOTION_SPEC.md` (tokens §1, card §5, hero §6, platforms §9). Where the two disagree on desktop behaviour, this one wins. Touch and mobile behaviour stays as in `MOTION_SPEC.md` §9.

**Scope:** desktop only, gated by `@media (hover:hover) and (pointer:fine)` and a width of at least 1024 px unless noted. It covers the hero background, product cards, tabs, FAQ, the ⌘K/Ctrl+K command palette, scroll reveals, focus rings, and an optional liquid-glass variant.

## 0. Agreed constraints (unchanged, restated so nobody re-litigates them)

| Constraint | Rule |
|---|---|
| Login / sign-up slide | **Auth slide: target choreography** is now specified in `MOTION_SPEC.md` §14: one moving hero layer, 760 ms `cubic-bezier(.65,0,.2,1)` (`--mm-ease-in-out`, used only by the slide), with the form cross-fading and swapping at the midpoint. No selector in *this* document matches `.mm-auth*`. Follow §14 for any auth change. |
| Paystack | Use the `#00C3F7` icon **only**, plus the **official "Secured by Paystack" badge** (an unmodified Paystack asset) in the checkout trust row. The badge never animates: no hover, lift, tint or opacity change. Only the global focus ring applies if it's a link. |
| Google | The full-colour G inside **Google's dark button style**: fill `#131314`, 1 px border `#8E918F`, text `#E3E3E3`, Roboto Medium per Google's guidelines. No other restyle. There's no lift or colour swap; the button keeps its own hover/press states and gets our global focus ring. *(This supersedes the Google row of `MOTION_SPEC.md` §4.)* |
| GitHub | Mark at 100% white (`#F4F4F6`). |
| Hero tint | Brand orange `#C2410C` / `#E8590C` on `#0E0E11`. UI accent stays `#FF7A1A`. |

---

## 1. New tokens (added on top of `MOTION_SPEC.md` §1)

All existing `--mm-*` tokens are reused unchanged (`--mm-dur-1` 120 ms, `--mm-dur-2` 200 ms, `--mm-dur-hover-out` 160 ms, `--mm-dur-3` 320 ms, `--mm-dur-4` 480 ms, `--mm-ease-out`, `--mm-ease-out-expo`, `--mm-ease-in`, `--mm-ease-press`, `--mm-ease-drift`, etc.). New tokens are added only where no existing one fits.

| Token | Value | Why it's new |
|---|---|---|
| `--mm-dur-0` | 0 ms | Instant: focus ring appearance, highlight on held arrow keys |
| `--mm-dur-focus` | 80 ms | Optional focus-ring offset settle (≤ 100 ms) |
| `--mm-dur-highlight` | 80 ms | Palette result highlight move |
| `--mm-dur-palette-out` | 90 ms | Palette close |
| `--mm-dur-palette-in` | 120 ms | Palette open (it equals `--mm-dur-1`; named separately so it can never drift above 150 ms) |
| `--mm-dur-tab` | 200 ms | Tab indicator slide |
| `--mm-dur-acc-open` / `--mm-dur-acc-close` | 280 ms / 200 ms | Accordion (close is faster) |
| `--mm-dur-card-in` / `--mm-dur-card-out` | 220 ms / 180 ms | Bolder desktop card lift |
| `--mm-dur-cover-desk` | 420 ms | Desktop cover zoom |
| `--mm-dur-reveal` | 420 ms | Scroll reveal (IntersectionObserver path) |
| `--mm-stagger` | 50 ms | Reveal stagger step (cap: 6 items) |
| `--mm-reveal-y` | 10 px | Reveal travel (inside the 8–12 px band) |
| `--mm-lift-card-desk` | −6 px | Desktop card lift (−4 px stays for tablet) |
| `--mm-scale-cover-desk` | 1.05 | Desktop cover zoom |
| `--mm-ease-snap` | `cubic-bezier(.2,0,0,1)` | Developer-facing UI (palette, highlight, tabs). Same curve as `--mm-ease-press`, aliased so intent is clear |
| `--mm-hero-1` / `--mm-hero-2` | `#C2410C` / `#E8590C` | Hero tints |
| `--mm-focus` | `#FF7A1A` | Focus ring colour (≈ 7.6:1 on `#0E0E11`) |

```css
/* UNTESTED */
:root{
  --mm-dur-0:0ms; --mm-dur-focus:80ms; --mm-dur-highlight:80ms;
  --mm-dur-palette-out:90ms; --mm-dur-palette-in:120ms;
  --mm-dur-tab:200ms; --mm-dur-acc-open:280ms; --mm-dur-acc-close:200ms;
  --mm-dur-card-in:220ms; --mm-dur-card-out:180ms; --mm-dur-cover-desk:420ms;
  --mm-dur-reveal:420ms; --mm-stagger:50ms; --mm-reveal-y:10px;
  --mm-lift-card-desk:-6px; --mm-scale-cover-desk:1.05;
  --mm-ease-snap:cubic-bezier(.2,0,0,1);
  --mm-hero-1:#C2410C; --mm-hero-2:#E8590C; --mm-focus:#FF7A1A;
}
```

---

## 2. Hero background motion (adapts to the 21st.dev pick)

### 2.1 Common contract (applies whichever type is chosen)

| Item | Spec |
|---|---|
| Palette | Base `#0E0E11`. Tints `#C2410C` (deep) and `#E8590C` (bright) with opacity **≤ .35** on any pixel behind text. Add a static scrim (`linear-gradient(90deg, #0E0E11 0%, rgba(14,14,17,.7) 40%, transparent 70%)`) behind the copy column, so `#F4F4F6` text stays ≥ 7:1 on the brightest frame. |
| Target | 60 fps on a 2020-class laptop iGPU at 1440×900. Hard floor: 50 fps, otherwise the governor (below) steps quality down. |
| Frame budget | 16.7 ms per frame in total. The hero may use **≤ 2 ms main-thread JS** and **≤ 4 ms GPU**. Shaded canvas area: **≤ 1 MP per frame** (e.g. 1440×800 at 0.5 render scale × DPR 1.5 ≈ 0.65 MP). |
| Allowed animated properties | `transform` and `opacity` on DOM layers; uniforms on one canvas. **Never animate** `filter`/`blur()`, `backdrop-filter`, `box-shadow`, `background-position`, `mask-position`, `width/height`, or CSS custom properties that drive gradient stops (each of those repaints every frame). |
| Layer count | ≤ 6 composited layers for the hero, with `will-change: transform` only while running. |
| Canvas rules | **One** `<canvas>` max. `devicePixelRatio` capped at **1.5**. Render scale 0.5 (shader) or 1.0 (2D sprites) and upscale with CSS `width:100%; height:100%`; the softness is on-brand. `powerPreference:'low-power'`, `antialias:false`, `alpha:false` (paint `#0E0E11` in-shader), `preserveDrawingBuffer:false`. Resize via `ResizeObserver`, debounced to 150 ms. |
| Pause | An `IntersectionObserver` (threshold 0) on the hero section: when it's off-screen, stop rAF / `animation-play-state: paused`. `visibilitychange`: when hidden, stop. Also stop on window `blur` if the tab is visible but unfocused for > 30 s (optional). Resume from the **same time value** (store `t` and add delta time), so there's no jump. |
| First paint | A **poster** paints first (a CSS gradient approximation, 0 KB, or an AVIF still ≤ 40 KB). The live layer mounts after `requestIdleCallback`, draws one frame, then crossfades in over 400 ms (`--mm-ease-out`). The hero copy is the LCP and never waits for the background. |
| Reduced motion | `prefers-reduced-motion: reduce`: the poster only. The canvas/JS never mounts. Pointer effects are off. |
| Save-Data / low power | `navigator.connection.saveData`, `prefers-reduced-data: reduce`, `effectiveType` in {`slow-2g`,`2g`,`3g`}, `hardwareConcurrency <= 4` or `deviceMemory <= 4` → **poster plus at most the CSS-only tier** (no canvas, no shader). |
| Runtime governor | Sample frame deltas for the first 120 frames after the fade-in. If the p75 delta is > 20 ms, step down a tier: render scale .5 → .35 → CSS-only tier → poster. Never step back up in the same session. Store the result in `sessionStorage('mm_hero_tier')`. |
| Pointer interaction | Optional. If the effect follows the cursor, use one rAF with a lerp of 0.1, written as a uniform or `translate3d`. The listener is passive and only on the hero. Pointer leave eases back to centre. |

### 2.2 Per-type recommendations (GPU-cheapest implementation)

| 21st.dev type | What it usually ships as | Cheapest equivalent to build | Motion values | Cost notes |
|---|---|---|---|---|
| **Aurora / gradient mesh** | Blobs with `filter: blur(80–120px)`, sometimes an animated `background-position` | **3–4 absolutely positioned `div`s with `radial-gradient(closest-side, var(--mm-hero-2) 0%, transparent 70%)`**. The falloff *is* the blur, so there's no filter. Animate `transform` only (translate ±6–10% of their own size, rotate ±8°, scale .95↔1.08) with CSS keyframes, `alternate infinite`. | Periods 18 s / 23 s / 29 s / 37 s (not multiples of each other), `--mm-ease-drift`, peak opacity .28–.35 | Compositor-only and zero JS. Cheapest of all, and the **recommended default**. If the original uses `blur()`, rasterise a static blur once (a blurred layer that never changes size is rasterised once; moving it with `transform` is cheap), but gradients are still preferred. |
| **Particles / dots grid** | Canvas with N particles, often O(n²) connecting lines | **Static dot grid** as a CSS `radial-gradient` tile (`background-size: 24px 24px`, dot 1 px `rgba(244,244,246,.08)`), plus **one** large radial "wave" or spotlight layer moving by `transform` with a **static** `mask-image` fading the edges. If real particles are a must: one canvas 2D, ≤ 80 particles at DPR 1.5, each drawn by `drawImage` of a pre-rendered 8 px sprite. No lines, or lines only within 90 px using a spatial grid with N ≤ 50 | Particle speed 4–12 px/s; wave period 12 s; tint `#E8590C` at .5 on the dots in the light | The CSS version is compositor-only. The canvas version costs ~0.5 ms JS/frame at N = 80; avoid `shadowBlur` and per-particle gradients. |
| **Beams / lines** | SVG paths with animated `stroke-dashoffset`, or many absolutely positioned glowing divs | **≤ 6 "comet" beams**: thin `div`s (1–2 px × 30–40% of the track) with `linear-gradient(90deg, transparent, var(--mm-hero-2), transparent)`, moving with `transform: translateX/Y` along static tracks inside an `overflow:hidden` container. The static track lines are one SVG or CSS background. | Travel 1 track length in 6–10 s, staggered random delay 0–4 s, opacity 0 → .8 → 0 across the run, `linear` | Compositor-only. `stroke-dashoffset` triggers paint every frame, so it's acceptable only for ≤ 3 short paths. Never use `filter: drop-shadow` for the glow; bake the glow into the gradient. |
| **Shader / noise** | Full-res WebGL fragment shader (fbm, domain warp), sometimes 4–6 octaves | **One WebGL1/2 canvas, render scale 0.5, DPR cap 1.5**: fbm with **≤ 3 octaves**, `mediump`, one full-screen triangle, uniforms `u_time`, `u_res`, `u_pointer`, `u_c1`/`u_c2` (the tints). Optional 30 fps cap (draw every other rAF) for "ambient" looks. Film grain: a **static** 128 px noise PNG tile at 4% opacity (not animated). | Time scale 0.04–0.08 (slow), pointer influence radius 25% of the hero with a lerp of 0.08 | ≈ 0.4–0.65 MP per frame, typically < 2 ms GPU on an iGPU. Check `webglcontextlost` and fall back to the poster. This is the most expensive type; the governor is mandatory. |
| **Grid with spotlight** | CSS grid lines plus a spotlight driven by `mask-position` or by CSS variables updated on `mousemove` | **Static** grid (`repeating-linear-gradient` lines, 1 px `rgba(244,244,246,.06)`, 48 px cell) with a **static** radial `mask-image` vignette. The spotlight is a **separate** 600 px `radial-gradient(closest-side, rgba(232,89,12,.22), transparent)` disc moved with `translate3d` (rAF lerp of 0.12). A second copy of the grid in `#E8590C` at .35 sits inside the spotlight disc (the disc has `overflow:hidden` and its child counter-translates), so the lines "light up" under the cursor with no repaint. | Idle: the spotlight drifts in a 14 s Lissajous path (±12% x, ±8% y). Pointer: it follows with a lerp of 0.12. Leave: it returns to the idle path over 600 ms | Compositor-only. Updating `--x/--y` variables that feed a gradient or mask repaints the whole hero each frame, so avoid that. |

**Recommendation order (cheapest → richest):** aurora (CSS) → grid with spotlight → beams → dots (CSS) → particles (canvas) → shader. If the designer picks the shader, ship the aurora CSS version as the governor's "CSS-only tier".

### 2.3 Reduced-motion / poster spec

- The poster is the same composition frozen at `t = 0` (or the designer's chosen frame), exported as AVIF ≤ 40 KB at 1600×900, `fetchpriority="low"`. A CSS gradient approximation is painted under it, so there's never a flash.
- Under reduced motion, cursor spotlights are **off** (no motion follows the pointer).
- The poster also shows on Save-Data, on low power, if the governor ends at the poster tier, and on WebGL failure.

### 2.4 Snippets (UNTESTED)

```css
/* Aurora, CSS-only tier. UNTESTED */
.mm-hero-bg{ position:absolute; inset:0; overflow:hidden; background:#0E0E11; contain:strict; z-index:-1; }
.mm-hero-bg .blob{ position:absolute; width:60vmax; aspect-ratio:1; border-radius:50%;
  background:radial-gradient(closest-side, var(--c) 0%, transparent 70%); opacity:var(--o,.3);
  will-change:transform; animation:mm-aurora var(--p) var(--mm-ease-drift) var(--d,0s) infinite alternate; }
.blob.b1{ --c:var(--mm-hero-1); --p:18s; left:45%; top:-20%; }
.blob.b2{ --c:var(--mm-hero-2); --p:23s; --d:-7s; left:65%; top:20%; --o:.26; }
.blob.b3{ --c:var(--mm-hero-1); --p:29s; --d:-13s; left:20%; top:45%; --o:.22; }
@keyframes mm-aurora{ from{ transform:translate3d(-6%,-4%,0) rotate(-8deg) scale(.95) } to{ transform:translate3d(8%,6%,0) rotate(8deg) scale(1.08) } }
.mm-hero-bg.is-paused .blob{ animation-play-state:paused; will-change:auto; }
@media (prefers-reduced-motion:reduce){ .mm-hero-bg .blob{ animation:none; } }
```

```js
// Shared runner for canvas tiers. UNTESTED
export function runHero(hero, draw /* (t, dt) => void */){
  const lowPower = navigator.connection?.saveData || matchMedia('(prefers-reduced-data: reduce)').matches
    || (navigator.hardwareConcurrency||8) <= 4 || (navigator.deviceMemory||8) <= 4;
  if (lowPower || matchMedia('(prefers-reduced-motion: reduce)').matches) return { tier:'poster' };
  let raf = 0, last = 0, t = 0, onScreen = true, samples = [];
  const loop = now => {
    const dt = Math.min(now - (last || now), 50); last = now; t += dt;
    draw(t, dt);
    if (samples.length < 120) { samples.push(dt); if (samples.length === 120) govern(); }
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && onScreen && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  const stop  = () => { cancelAnimationFrame(raf); raf = 0; };
  const govern = () => { const s = [...samples].sort((a,b)=>a-b); if (s[90] > 20) hero.dispatchEvent(new CustomEvent('mm:hero-stepdown')); };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start(); return { stop };
}
// Canvas sizing: const dpr = Math.min(devicePixelRatio, 1.5); canvas.width = w * dpr * SCALE; canvas.height = h * dpr * SCALE;
```

---

## 3. Product card hover and press (desktop, bolder)

Same structure as `MOTION_SPEC.md` §5 (`.gm-card`, `::after` shadow layer, `.gm-preview` → `.gm-preview-inner`, `.mm-quickview`). Only the desktop values change.

| State | Properties: from → to | Duration | Easing | Delay | Reduced motion |
|---|---|---|---|---|---|
| Rest | translateY 0; `::after` opacity 0; cover scale 1; quick-view opacity 0, translateY 8 px; spotlight opacity 0; border `rgba(255,255,255,.06)` | — | — | — | same |
| Hover in | translateY 0 → **−6 px**; `::after` 0 → 1 (shadow `0 24px 48px -16px rgba(0,0,0,.7), 0 0 0 1px rgba(255,122,26,.14)`); cover 1 → **1.05**; quick-view opacity 0 → 1, translateY 8 → 0; `.gm-arrow` translateX 0 → 4 px; spotlight border 0 → 1 | lift and shadow `--mm-dur-card-in` (220 ms); cover `--mm-dur-cover-desk` (420 ms); quick-view `--mm-dur-2`; spotlight 150 ms | lift `--mm-ease-out-expo`; cover `--mm-ease-out`; quick-view `--mm-ease-out` | quick-view +60 ms | shadow layer, quick-view and spotlight opacity only; no lift, zoom or travel |
| Hover out | reverse; quick-view leaves first with no delay | `--mm-dur-card-out` (180 ms); quick-view 120 ms | `--mm-ease-out`; quick-view `--mm-ease-in` | 0 | opacity only |
| Press | translateY −6 → −2 px, scale → .985; `::after` → .6 | `--mm-dur-1` (120 ms) down / `--mm-dur-2` up | `--mm-ease-press` / `--mm-ease-out` | 0 | `::after` → .6 only |
| Focus-visible (card link) | same as hover in, plus the global focus ring (§8) on the card | as hover | as hover | 0 | opacity only |
| Grid hover neighbours | **No** dimming of sibling cards. It's noisy, and it hurts comparison shopping. | — | — | — | — |

**Optional cursor-follow spotlight border.** A 1 px orange rim brightens near the cursor.
- **Construction (compositor-friendly):** `.gm-card > .mm-spot` is `position:absolute; inset:0; border-radius:inherit; padding:1px`, with a **static** mask that leaves only the 1 px border visible (`mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)`). Inside it is a 320 px disc `radial-gradient(closest-side, rgba(255,122,26,.9), transparent)`, moved with `translate3d` from a single rAF (lerp 0.2, which settles in about 100 ms).
- **What to avoid:** updating `--mx/--my` variables that feed a gradient. That repaints the card every frame.
- **Limits:**
  - Only the **hovered** card runs the loop. The listener attaches on `pointerenter` and detaches on `pointerleave`.
  - Optional inner glow: the same disc at 6% opacity behind the content.
  - Off under reduced motion, off on `mm-lowfx`, and off when the liquid-glass variant is on.
- **Perf:** one layer per hovered card, no paint after the first. Cover zoom stays inside `overflow:hidden`, so there's no layout. Never transition `box-shadow` (the shadow lives on `::after`, opacity only).

```css
/* UNTESTED */
@media (hover:hover) and (pointer:fine) and (min-width:1024px){
  .gm-card{ transition:transform var(--mm-dur-card-out) var(--mm-ease-out-expo); }
  .gm-card::after{ box-shadow:0 24px 48px -16px rgba(0,0,0,.7), 0 0 0 1px rgba(255,122,26,.14); transition:opacity var(--mm-dur-card-out) var(--mm-ease-out); }
  .gm-card .gm-preview-inner{ transition:transform var(--mm-dur-cover-desk) var(--mm-ease-out); }
  .gm-card:hover{ transform:translateY(var(--mm-lift-card-desk)); transition-duration:var(--mm-dur-card-in); }
  .gm-card:hover::after{ opacity:1; transition-duration:var(--mm-dur-card-in); }
  .gm-card:hover .gm-preview-inner{ transform:scale(var(--mm-scale-cover-desk)); }
  .gm-card:hover .gm-arrow{ transform:translateX(4px); }
  .gm-card:hover .mm-quickview{ opacity:1; transform:translate(-50%,0); pointer-events:auto;
    transition:opacity var(--mm-dur-2) var(--mm-ease-out) 60ms, transform var(--mm-dur-2) var(--mm-ease-out) 60ms; }
  .gm-card:active{ transform:translateY(-2px) scale(.985); transition:transform var(--mm-dur-1) var(--mm-ease-press); }
  .gm-card:active::after{ opacity:.6; }
  .mm-spot{ position:absolute; inset:0; border-radius:inherit; padding:1px; pointer-events:none; overflow:hidden; opacity:0;
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor;
    mask:linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); transition:opacity 150ms linear; }
  .mm-spot > i{ position:absolute; left:0; top:0; width:320px; height:320px; margin:-160px 0 0 -160px;
    background:radial-gradient(closest-side, rgba(255,122,26,.9), transparent); will-change:transform; }
  .gm-card:hover .mm-spot{ opacity:1; }
}
@media (prefers-reduced-motion:reduce){ .mm-spot{ display:none; } .gm-card:hover, .gm-card:active{ transform:none; } .gm-card:hover .gm-preview-inner{ transform:none; } }
```

```js
// Spotlight follower: only for the hovered card. UNTESTED
export function spotlight(card){
  const dot = card.querySelector('.mm-spot > i'); let raf=0, x=0, y=0, tx=0, ty=0, r;
  const tick = () => { x += (tx-x)*.2; y += (ty-y)*.2; dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    raf = (Math.abs(tx-x)+Math.abs(ty-y) > .3) ? requestAnimationFrame(tick) : 0; };
  const move = e => { tx = e.clientX - r.left; ty = e.clientY - r.top; if(!raf) raf = requestAnimationFrame(tick); };
  card.addEventListener('pointerenter', e => { r = card.getBoundingClientRect(); x = tx = e.clientX-r.left; y = ty = e.clientY-r.top;
    card.addEventListener('pointermove', move, { passive:true }); });
  card.addEventListener('pointerleave', () => { card.removeEventListener('pointermove', move); cancelAnimationFrame(raf); raf = 0; });
}
```

---

## 4. Animated tabs indicator

**Applies to:** marketplace category tabs, product detail tabs (Overview / Files / Reviews) and dashboard tabs. One shared indicator element per `role="tablist"`. Variants: an **underline** (2 px `#FF7A1A`, default for content tabs) or a **pill** (`#17171C` fill plus 1 px `rgba(255,255,255,.08)` border, for segmented filters).

| State | Properties: from → to | Duration | Easing | Delay | Reduced motion |
|---|---|---|---|---|---|
| Rest | indicator under the selected tab; selected label `#F4F4F6`, others `rgba(244,244,246,.6)` | — | — | — | same |
| Hover (an unselected tab) | label opacity .6 → .85; **the indicator doesn't move on hover** | `--mm-dur-1` | linear | 0 | same |
| Select by click | indicator x/width from the old tab → the new tab; labels crossfade | indicator `--mm-dur-tab` (200 ms); label 150 ms | `--mm-ease-snap` | 0 | indicator **jumps** instantly (0 ms); label crossfade 100 ms |
| Select by arrow key (←/→, Home/End) | roving `tabindex`; focus **and** selection move (automatic activation); the indicator follows | 200 ms | `--mm-ease-snap` | 0 | instant |
| Held arrow key (`e.repeat`) | indicator duration → 0 for that move, so it never lags behind focus | 0 ms | — | — | instant |
| Focus-visible | the global ring (§8) on the tab itself, not on the indicator | instant | — | — | same |
| Panel change | the old panel is hidden instantly; the new panel fades in, opacity 0 → 1 (no travel) | 120 ms | `--mm-ease-out` | 0 | instant |
| Resize / font load | the indicator snaps (no transition) on `ResizeObserver` updates | 0 ms | — | — | — |

### Implementation A (preferred where supported): CSS anchor positioning

Supported in Chromium 125+ and Safari 26+. Gate it with `@supports (anchor-name: --a)`. Multiple tablists on one page need `anchor-scope` (Chromium 131+); otherwise give each tablist a unique anchor name.

```css
/* UNTESTED */
@supports (anchor-name: --a){
  .mm-tabs{ position:relative; anchor-scope:--mm-tab; }
  .mm-tab[aria-selected="true"]{ anchor-name:--mm-tab; }
  .mm-tabs-ind{ position:absolute; position-anchor:--mm-tab;
    left:anchor(left); right:anchor(right); bottom:anchor(bottom); height:2px; background:var(--mm-focus); border-radius:2px;
    transition:left var(--mm-dur-tab) var(--mm-ease-snap), right var(--mm-dur-tab) var(--mm-ease-snap); }
  .mm-tabs[data-instant] .mm-tabs-ind{ transition:none; }   /* set during held-arrow repeats and resize */
  .mm-tabs--pill .mm-tabs-ind{ top:anchor(top); height:auto; background:#17171C; box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); border-radius:999px; z-index:-1; }
}
@media (prefers-reduced-motion:reduce){ .mm-tabs-ind{ transition:none !important; } }
```

**Perf:** `left`/`right` on one absolutely positioned, out-of-flow element is a tiny layout, which is acceptable. Wrap the tablist in `contain: layout`.

### Implementation B (fallback): FLIP with transform

- **Underline:** base width 1 px; set `transform: translateX(x) scaleX(w)` with `transform-origin: 0 0`. Compositor-only. Scaling a flat 2 px line doesn't distort it.
- **Pill:** scaleX would distort the rounded ends. Use `translateX(x)` for position, set `width` instantly, and animate only the transform. The width snap is masked by the motion. For pills with very different widths, transition `width` too; it's still a tiny layout.

```js
// FLIP fallback. UNTESTED
export function tabs(list){
  const ind = list.querySelector('.mm-tabs-ind'); const tabs = [...list.querySelectorAll('[role=tab]')];
  const place = (tab, instant) => { list.toggleAttribute('data-instant', !!instant);
    ind.style.transform = `translateX(${tab.offsetLeft}px) scaleX(${tab.offsetWidth})`; };
  const select = (tab, instant) => { tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    tab.focus(); place(tab, instant); /* show panel */ };
  list.addEventListener('click', e => { const t = e.target.closest('[role=tab]'); if (t) select(t, false); });
  list.addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const n = { ArrowRight:i+1, ArrowLeft:i-1, Home:0, End:tabs.length-1 }[e.key]; if (n === undefined) return;
    e.preventDefault(); select(tabs[(n + tabs.length) % tabs.length], e.repeat);
  });
  new ResizeObserver(() => place(tabs.find(t => t.getAttribute('aria-selected')==='true'), true)).observe(list);
}
```

**Framer Motion (UNTESTED):** `{selected && <m.span layoutId={`tabs-${id}`} className="mm-tabs-ind" transition={reduce ? {duration:0} : {duration:.2, ease:[.2,0,0,1]}} />}`, rendered inside each tab. `layoutId` does the FLIP with transforms. Set `transition={{duration:0}}` while `e.repeat` is true.

---

## 5. FAQ accordion

| State | Properties: from → to | Duration | Easing | Delay | Reduced motion |
|---|---|---|---|---|---|
| Closed (rest) | content height 0, opacity 0; chevron 0° | — | — | — | same |
| Hover on summary (desktop) | question text opacity .85 → 1; chevron translateY 0 → 1 px | `--mm-dur-1` | `--mm-ease-out` | 0 | opacity only |
| Opening | height 0 → auto; content opacity 0 → 1 and translateY −4 → 0 px; chevron 0 → 180° (or `+` → `×`, 0 → 45°) | height `--mm-dur-acc-open` (280 ms); content 200 ms; chevron 280 ms | `--mm-ease-out` | content **+60 ms** | height instant; content opacity 120 ms; chevron instant |
| Closing | height auto → 0; content opacity 1 → 0 (no travel); chevron back to 0° | height `--mm-dur-acc-close` (200 ms); content 100 ms; chevron 200 ms | `--mm-ease-in` for height and content, `--mm-ease-out` for the chevron | 0 | instant |
| Exclusive mode (optional) | `<details name="faq">` closes the sibling: both animations run at once (close 200 ms while open 280 ms) | as above | as above | 0 | instant |
| Focus-visible | the global ring on `summary` | instant | — | — | same |
| Find-in-page | native `<details>` auto-opens. The grid fallback uses `hidden="until-found"` plus a `beforematch` handler | — | — | — | — |

**Implementation A (progressive): `<details>` with `::details-content` and `interpolate-size`.** `::details-content` is supported in Chromium 131+, Safari 18.4+ and Firefox 143+. `interpolate-size` is **Chromium 129+ only**; other browsers open instantly, which is an acceptable fallback.

```css
/* UNTESTED */
:root{ interpolate-size:allow-keywords; }
.mm-faq details::details-content{ block-size:0; overflow:clip; opacity:0;
  transition:block-size var(--mm-dur-acc-close) var(--mm-ease-in), opacity 100ms var(--mm-ease-in), content-visibility var(--mm-dur-acc-close) allow-discrete; }
.mm-faq details[open]::details-content{ block-size:auto; opacity:1;
  transition:block-size var(--mm-dur-acc-open) var(--mm-ease-out), opacity 200ms var(--mm-ease-out) 60ms, content-visibility var(--mm-dur-acc-open) allow-discrete; }
.mm-faq summary .chev{ transition:transform var(--mm-dur-acc-close) var(--mm-ease-out); }
.mm-faq details[open] summary .chev{ transform:rotate(180deg); transition-duration:var(--mm-dur-acc-open); }
.mm-faq summary{ list-style:none; cursor:pointer; } .mm-faq summary::-webkit-details-marker{ display:none; }
@media (prefers-reduced-motion:reduce){
  .mm-faq details::details-content, .mm-faq details[open]::details-content{ transition:opacity 120ms linear, content-visibility 0s allow-discrete; }
  .mm-faq summary .chev{ transition:none; }
}
```

**Implementation B (universal): `grid-template-rows: 0fr → 1fr`.** Use this for the existing `HomeFAQ.tsx` button + region pattern (AUDIT P5).

```css
/* UNTESTED */
.mm-acc-panel{ display:grid; grid-template-rows:0fr; transition:grid-template-rows var(--mm-dur-acc-close) var(--mm-ease-in); }
.mm-acc-panel > div{ overflow:hidden; min-height:0; opacity:0; transition:opacity 100ms var(--mm-ease-in); }
.mm-acc[aria-expanded="true"] + .mm-acc-panel{ grid-template-rows:1fr; transition-duration:var(--mm-dur-acc-open); transition-timing-function:var(--mm-ease-out); }
.mm-acc[aria-expanded="true"] + .mm-acc-panel > div{ opacity:1; transition:opacity 200ms var(--mm-ease-out) 60ms; }
```

**Perf:** height animation is layout, but it's confined to one item. Add `contain: layout paint` on each FAQ item, so siblings below move by layout only once per frame and nothing repaints. Never animate more than two items at once. Long answers (> 600 px) cap the open duration at 320 ms, so they don't feel sluggish.

---

## 6. Command palette (⌘K / Ctrl+K): crisp, under 150 ms

**Hard requirements:** everything stays under 150 ms. Typing is never blocked. The input is focused on frame one.

| State | Trigger | Properties: from → to | Duration | Easing | Reduced motion |
|---|---|---|---|---|---|
| Open | ⌘K / Ctrl+K (also `/` when not in a field), or the header search button | `<dialog>.showModal()`: panel opacity 0 → 1, scale .98 → 1, translateY −4 → 0 px; backdrop opacity 0 → 1 (`rgba(14,14,17,.6)`) | **120 ms** (`--mm-dur-palette-in`) | `--mm-ease-snap` | opacity only, 80 ms |
| Input focus | same frame as `showModal()` | `autofocus` on the input (`showModal` honours it); the caret is visible immediately; keystrokes typed during the animation land in the input | 0 ms | — | same |
| Typing / filtering | input | results **replace instantly**, with no list animation. Highlight resets to row 0 instantly. Debounce remote search to 120 ms, but local results render synchronously | 0 ms | — | same |
| Highlight move (↑/↓, mouse hover) | keydown / pointermove | a single `.mm-pal-hl` element (row background `rgba(255,122,26,.12)` plus a 2 px left bar `#FF7A1A`) translateY to the row's offset | **80 ms** (`--mm-dur-highlight`) | `--mm-ease-snap` | 0 ms |
| Held arrow key | `e.repeat === true` | highlight transition **0 ms**; `scrollIntoView({block:'nearest'})` instant (never `behavior:'smooth'`) | 0 ms | — | 0 ms |
| Mouse hover on a row | pointermove (not `mouseenter`, so a scroll under a still cursor doesn't steal the highlight) | same as a highlight move | 80 ms | `--mm-ease-snap` | 0 ms |
| Execute (Enter) | Enter / click | the row flashes `rgba(255,122,26,.2)` for 60 ms, then the palette closes and the action runs **immediately** (it doesn't wait for the close animation) | 60 ms | linear | no flash |
| Close | Esc, ⌘K again, backdrop click, execute | panel opacity 1 → 0, scale 1 → .99 (no travel); backdrop 1 → 0. Focus returns to the previously focused element on the same frame | **90 ms** (`--mm-dur-palette-out`) | `--mm-ease-in` | opacity only, 60 ms |
| Reopen while closing | ⌘K during the close | interrupts: CSS transitions reverse from the current value; no queueing | ≤ 120 ms | — | — |
| Focus ring inside | Tab to filters/buttons | global ring, **instant** | 0 ms | — | same |

**Rules**
- Animation never gates input or events. No `pointer-events:none` and no `inert` during the open, and no `await` before `focus()`.
- Pre-mount the palette DOM (hidden `<dialog>`) at idle, so opening is just `showModal()`, with no React mount on the keystroke. Prefetch the command index on the first `pointerenter` of the search button or the first ⌘ keydown.
- Results list: virtualise beyond 50 rows. The highlight element lives inside the scroll container, so it scrolls with the rows.
- `aria-activedescendant` on the input points at the highlighted row (focus stays in the input).
- **Liquid-glass variant:** if the palette uses backdrop blur (§9), the open animation becomes **opacity-only**, because scaling a backdrop-filtered layer is the most expensive case. Pause the hero background while the palette is open.

```css
/* UNTESTED */
.mm-pal{ width:min(640px, 92vw); margin-top:12vh; padding:0; border:1px solid rgba(255,255,255,.08); border-radius:14px;
  background:#17171C; color:#F4F4F6; opacity:1; transform:none;
  transition:opacity var(--mm-dur-palette-out) var(--mm-ease-in), transform var(--mm-dur-palette-out) var(--mm-ease-in),
             overlay var(--mm-dur-palette-out) allow-discrete, display var(--mm-dur-palette-out) allow-discrete; }
.mm-pal:not([open]){ opacity:0; transform:scale(.99); }
.mm-pal[open]{ transition-duration:var(--mm-dur-palette-in); transition-timing-function:var(--mm-ease-snap); }
@starting-style{ .mm-pal[open]{ opacity:0; transform:translateY(-4px) scale(.98); } }
.mm-pal::backdrop{ background:rgba(14,14,17,.6); opacity:1; transition:opacity var(--mm-dur-palette-out) linear, overlay var(--mm-dur-palette-out) allow-discrete, display var(--mm-dur-palette-out) allow-discrete; }
.mm-pal:not([open])::backdrop{ opacity:0; }
.mm-pal[open]::backdrop{ transition-duration:var(--mm-dur-palette-in); }
@starting-style{ .mm-pal[open]::backdrop{ opacity:0; } }
.mm-pal-list{ position:relative; max-height:min(420px, 60vh); overflow:auto; overscroll-behavior:contain; }
.mm-pal-hl{ position:absolute; inset:0 0 auto 0; height:var(--row-h,40px); pointer-events:none; border-radius:8px;
  background:rgba(255,122,26,.12); box-shadow:inset 2px 0 0 #FF7A1A;
  transform:translateY(var(--hl-y,0)); transition:transform var(--mm-dur-highlight) var(--mm-ease-snap); }
.mm-pal[data-instant] .mm-pal-hl{ transition:none; }
@media (prefers-reduced-motion:reduce){
  .mm-pal, .mm-pal[open]{ transform:none !important; transition-property:opacity, overlay, display; transition-duration:60ms; }
  .mm-pal[open]{ transition-duration:80ms; }
  .mm-pal-hl{ transition:none; }
}
```

```js
// UNTESTED
const pal = document.querySelector('dialog.mm-pal'), input = pal.querySelector('input'); let opener = null;
addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault();
    if (pal.open) return pal.close(); opener = document.activeElement; pal.showModal(); input.focus({ preventScroll:true }); input.select(); }
});
pal.addEventListener('close', () => opener?.focus?.({ preventScroll:true }));
pal.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; e.preventDefault();
  pal.toggleAttribute('data-instant', e.repeat);
  moveHighlight(e.key === 'ArrowDown' ? 1 : -1);  // sets --hl-y, aria-activedescendant, then row.scrollIntoView({ block:'nearest' })
});
pal.addEventListener('keyup', () => pal.removeAttribute('data-instant'));
```

**Framer Motion note:** don't use `AnimatePresence` for the palette shell. The mount and unmount on the keystroke risks missing frame-one focus. Keep the native `<dialog>` plus the CSS above. If Motion is used anyway, use `initial={{opacity:0, scale:.98, y:-4}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:.99}} transition={{duration:.12, ease:[.2,0,0,1]}}` with exit `{duration:.09}`, and call `input.focus()` in a `useLayoutEffect`, not after the animation.

---

## 7. Scroll reveals

| Item | Spec |
|---|---|
| What reveals | Section headings, "how it works" steps, feature rows, product grid rows *below the fold*, testimonials, footer CTA band |
| Never reveals | Anything above the fold on load; the hero; the header/nav; prices, buy/checkout buttons, form fields, error messages; the Paystack badge; content reached by in-page anchor or back/forward (it's shown already revealed) |
| Motion | opacity 0 → 1, translateY **10 px** → 0 (`--mm-reveal-y`, in the 8–12 band). No scale, blur or horizontal travel |
| Duration / easing | IntersectionObserver path: `--mm-dur-reveal` (420 ms) `--mm-ease-out`. Scroll-driven path: progress-linked over `animation-range: entry 10% entry 60%`, `--mm-ease-out` |
| Stagger | `--mm-stagger` (50 ms) per sibling, **max 6** staggered (total ≤ 300 ms); item 7+ appears with item 6. Grids stagger per **row**, not per card |
| Once only | Revealed elements get `.mm-revealed`, which sets `animation:none; opacity:1; transform:none`, so scrolling back never replays (view() timelines are reversible by nature, so the lock is required) |
| Trigger point | IO `threshold: 0.15`, `rootMargin: '0px 0px -10% 0px'` |
| Reduced motion | **No reveal**: content is simply visible (no opacity fade either) |
| Perf | transform and opacity only. Unobserve each element after its reveal. `will-change` is never set globally. Scroll-driven animations run off the main thread in Chromium |

**Support:** `animation-timeline: view()` is supported in Chromium 115+ and Safari 26+. Firefox has it behind a flag, so it gets the IO path. Gate the scroll-driven path with `@supports (animation-timeline: view())`.

**Above-the-fold rule:** the reveal script runs before first paint (inline in `<head>` or at the top of the client entry). Only elements whose `getBoundingClientRect().top > innerHeight` get `.mm-reveal-pending` (the hidden state). Everything else is never hidden. Without JS, nothing is hidden.

```css
/* UNTESTED */
@media (prefers-reduced-motion:no-preference){
  .mm-reveal-pending{ opacity:0; transform:translateY(var(--mm-reveal-y)); }
  .mm-reveal-pending.is-in{ opacity:1; transform:none;
    transition:opacity var(--mm-dur-reveal) var(--mm-ease-out) calc(var(--i,0) * var(--mm-stagger)),
               transform var(--mm-dur-reveal) var(--mm-ease-out) calc(var(--i,0) * var(--mm-stagger)); }
  @supports (animation-timeline: view()){
    .mm-reveal-pending{ opacity:1; transform:none; animation:mm-reveal linear both; animation-timeline:view();
      animation-range:entry calc(10% + var(--i,0) * 3%) entry calc(60% + var(--i,0) * 3%); }
    @keyframes mm-reveal{ from{ opacity:0; transform:translateY(var(--mm-reveal-y)); } to{ opacity:1; transform:none; } }
  }
}
.mm-revealed{ animation:none !important; opacity:1 !important; transform:none !important; }
```

```js
// UNTESTED. Run before first paint
export function reveals(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...document.querySelectorAll('[data-reveal]')].filter(el => el.getBoundingClientRect().top > innerHeight);
  els.forEach(el => { el.classList.add('mm-reveal-pending');
    const sibs = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    el.style.setProperty('--i', Math.min(sibs.indexOf(el), 5)); });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return; const el = e.target; el.classList.add('is-in'); io.unobserve(el);
    setTimeout(() => el.classList.add('mm-revealed'), 420 + 5*50 + 50);   // lock once done
  }), { threshold:.15, rootMargin:'0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
}
```

Under the scroll-driven path, the IO still runs only to add `.mm-revealed` once the element reaches 60% entry (use `threshold: .6`, or lock on the first intersection after 600 ms).

**Framer Motion (UNTESTED):** `<m.div initial={{opacity:0, y:10}} whileInView={{opacity:1, y:0}} viewport={{ once:true, amount:.15, margin:'0px 0px -10% 0px' }} transition={{ duration:.42, ease:[.22,1,.36,1], delay: Math.min(i,5)*.05 }} />`. Skip `initial` when `useReducedMotion()` is true, or when the element starts above the fold.

---

## 8. Global keyboard focus ring

| State | Properties | Duration | Notes |
|---|---|---|---|
| Mouse / touch focus | no ring (`:focus:not(:focus-visible)`) | — | Never `outline:none` without a `:focus-visible` replacement |
| Keyboard focus (`:focus-visible`) | `outline: 2px solid var(--mm-focus)` (`#FF7A1A`), `outline-offset: 2px`. On orange or accent fills, `outline-color: #F4F4F6`. Inside the dark Google button and the Paystack badge: the same orange ring, nothing else | **Appears instantly (0 ms)** | `outline` follows `border-radius` in all current engines. It doesn't affect layout, and it's paint-only on one element |
| Optional settle | `outline-offset` 4 px → 2 px | **80 ms** (`--mm-dur-focus`), `--mm-ease-snap` | Off inside the command palette and tabs (instant there), and off under reduced motion |
| Focus leaving | ring disappears instantly | 0 ms | No fade out, which would leave ghost rings when tabbing fast |
| Composite components | cards: the ring on the card link (the card lifts per §3); tabs: the ring on the tab; palette rows: no ring (the highlight *is* the focus indicator via `aria-activedescendant`); inputs: border `#FF7A1A` plus the ring | instant | |
| Forced colors | `@media (forced-colors: active){ outline-color: Highlight }` | — | |
| Contrast | `#FF7A1A` on `#0E0E11` ≈ 7.6:1, and on `#17171C` ≈ 7:1. Passes WCAG 2.2 SC 2.4.11 / 1.4.11 at 2 px | — | |

```css
/* UNTESTED */
:where(a, button, input, select, textarea, summary, [tabindex], [role=tab], [role=button]):focus-visible{
  outline:2px solid var(--mm-focus); outline-offset:2px; transition:outline-offset var(--mm-dur-focus) var(--mm-ease-snap); }
@media (prefers-reduced-motion:no-preference){
  @starting-style{ :where(a, button, input, select, textarea, summary, [tabindex], [role=tab], [role=button]):focus-visible{ outline-offset:4px; } }
}
:where(.mm-pal, .mm-tabs) :focus-visible{ transition:none; }
.mm-btn--accent:focus-visible{ outline-color:#F4F4F6; }
:focus:not(:focus-visible){ outline:none; }
@media (forced-colors:active){ :focus-visible{ outline-color:Highlight; } }
```

Note: `@starting-style` on `:focus-visible` is a newer pattern, so treat it as an UNTESTED progressive enhancement. Browsers that ignore it simply show the ring at 2 px instantly, which meets the spec.

---

## 9. Optional variant: liquid glass

Use it **only** on the header (after scroll), the command palette, and the quick-view pill. Off by default. It's behind a flag `mm-glass`.

| Item | Spec |
|---|---|
| Look | `background: rgba(23,23,28,.55)`; `backdrop-filter: blur(16px) saturate(140%)`; 1 px specular rim: a static `linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.04))` drawn with the mask-border trick (§3); an inner top highlight `inset 0 1px 0 rgba(255,255,255,.08)` (static box-shadow, never transitioned) |
| Motion | The glass surface **never transforms while blurred**. Enter and exit are opacity-only (header: 200 ms; palette: 120 / 90 ms). Content inside may move |
| Cost | Every frame in which anything behind a backdrop-filter element changes, the browser re-reads and re-blurs that backdrop region. Over an animated hero that's continuous GPU work proportional to the glass area × blur radius |
| Rules | ≤ 2 glass surfaces visible at once; blur ≤ 16 px; area ≤ 25% of the viewport; while the palette is open over the hero, the hero pauses. Safari: never put `backdrop-filter` on, or inside, an element with a running transform animation (it flickers and re-rasterises), and include `-webkit-backdrop-filter` |
| "Liquid" refraction | SVG `feDisplacementMap` via `backdrop-filter: url(#…)` is Chromium-only and expensive. **Not recommended.** Fake the refraction with the static specular rim plus a faint static noise tile |
| Fallback | `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))`, `mm-lowfx`, Save-Data or `prefers-reduced-transparency: reduce` → solid `rgba(23,23,28,.94)` with the same rim and highlight. It looks about 90% the same at zero cost |
| Reduced motion | Glass stays (it's not motion), but enters and exits as an instant or 80 ms opacity change |

```css
/* UNTESTED */
.mm-glass{ background:rgba(23,23,28,.94); box-shadow:inset 0 1px 0 rgba(255,255,255,.08); }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  html.mm-glass-on:not(.mm-lowfx) .mm-glass{ background:rgba(23,23,28,.55);
    -webkit-backdrop-filter:blur(16px) saturate(140%); backdrop-filter:blur(16px) saturate(140%); }
}
@media (prefers-reduced-transparency:reduce){ .mm-glass{ background:rgba(23,23,28,.94) !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; } }
```

---

## 10. QA checklist (desktop)

- [ ] Any `.mm-auth*` change follows `MOTION_SPEC.md` §14 and its QA list. `cubic-bezier(.65,0,.2,1)` is used only by the auth slide.
- [ ] Hero: 60 fps at 1440×900 on an iGPU (Performance panel). Main thread ≤ 2 ms per frame. The canvas backing store is ≤ 1 MP. It pauses off-screen and on a hidden tab, and the rAF count drops to 0.
- [ ] Hero: the poster shows under reduced motion, Save-Data and low power; the canvas never mounts there.
- [ ] Paint flashing: no repaint while hovering cards, moving the spotlight, the tab indicator (FLIP path) or the palette highlight.
- [ ] Palette: ⌘K → typed characters appear with no drops (test by typing "abc" immediately after ⌘K). Open ≤ 120 ms, close ≤ 90 ms, highlight ≤ 80 ms, instant on held arrows, focus returns to the opener.
- [ ] The focus ring appears with no perceptible delay on Tab, in every component.
- [ ] Accordion: close is visibly faster than open. Find-in-page opens the hidden answers.
- [ ] Reveals: nothing above the fold is ever hidden, nothing replays on scroll-up, and there's no reveal under reduced motion.
- [ ] Paystack badge unmodified and static; Google button in the dark style only; GitHub 100% white.

## 11. Caveats

1. **The 21st.dev pick is pending.** §2.2 covers the five common types. Once the component is chosen, audit its source against the §2.1 contract; most ship with an animated `blur()` or variable-driven gradients that need the swaps listed.
2. **Browser support (as of Oct 2026, verify at build time):**
   - CSS anchor positioning: Chromium 125+ and Safari 26+; there's a FLIP fallback.
   - `interpolate-size`: Chromium only; the fallback is an instant open.
   - `::details-content`: Chromium 131+, Safari 18.4+ and Firefox 143+.
   - `animation-timeline: view()`: Chromium 115+ and Safari 26+; Firefox uses the IO fallback.
   - `@starting-style`: all current engines.
3. **"Bolder" card values** (−6 px, 1.05 cover) are desktop ≥ 1024 px only. Tablet keeps −4 px / 1.035 from `MOTION_SPEC.md`.
4. **All numbers are spec targets, not measurements**, because nothing is built yet. The 60 fps and frame-budget claims must be verified on real hardware.
5. The hero tints `#C2410C` / `#E8590C` are deeper than the UI accent `#FF7A1A` by design (the background recedes, the UI pops). Confirm with the designer.
