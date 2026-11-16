# The Middleman: Motion Spec (marketplace hero, icon micro-interactions, card hover)

Version 1.0, 2026-10-18. This is a written spec only. No assets, Lottie files or recordings are produced here; section 7 describes the assets so they can be made once the spec is approved.

**Scope:** the **marketplace/homepage hero** (`.homepage-hero` in `app/page.tsx`), icon micro-interactions (wishlist heart, notification bell, brand icons) and product card hover/press (`.gm-card`).

> **Auth slide:** the desktop login ↔ sign-up slide is no longer "don't touch". Its target choreography (it keeps the concept and direction of travel, and makes the move fluid and clean) is §14, **Auth slide: target choreography**. Changes to `.mm-auth*` must follow §14 exactly; nothing else in this document touches those selectors.

**Terminology.** Tokens use the `--mm-` prefix from `AUDIT.md` §4. Each token is mapped to its generic name in `/workspace/animation-kb/ANIMATION_PLAYBOOK.md` §3 so the two documents read together.

**Palette (dark theme):** bg `#0E0E11`, card `#17171C`, text `#F4F4F6`, accent `#FF7A1A`, amber glow companion `#FFB547` (used for glow and highlights only, never as a second UI accent).

**House rules for this brief**
1. Animate only `transform` and `opacity`. Shadows deepen through a pre-rendered `::after` shadow layer whose `opacity` changes. Never transition `box-shadow`, `filter`, `width/height`, `top/left` or `background-position` on interactive elements.
2. UI motion runs 120–250 ms with ease-out. Only the hero is slower.
3. One "moment" per screen. The hero drift is the ambient layer; everything else answers input.
4. Nothing loops except the hero drift, and it pauses off-screen, in background tabs and under reduced motion.
5. Reduced motion swaps movement for opacity. Feedback is never removed (playbook rule 7).

---

## 1. Motion tokens

Add these to the `:root` in `app/product-design.css`, next to the AUDIT P0 tokens. The first block repeats the AUDIT tokens exactly; the rest are new.

### 1.1 Durations

| Token | Value | Use | Playbook equivalent |
|---|---|---|---|
| `--mm-dur-1` | 120 ms | Press-down, colour/opacity swap, badge count change | `--dur-micro` (100) / `--dur-fast` (150) |
| `--mm-dur-2` | 200 ms | Hover in, release, brand-icon colour, quick-view fade | `--dur-base` |
| `--mm-dur-hover-out` | 160 ms | Hover out (exits run a little faster than entrances) | `--dur-fast`/`--dur-base` |
| `--mm-dur-bounce` | 240 ms | Heart fill bounce (keyframes) | `--dur-moderate` |
| `--mm-dur-3` | 320 ms | Bell swing, menus (AUDIT P2) | `--dur-slow` |
| `--mm-dur-cover` | 350 ms | Card cover image zoom (inside its frame) | `--dur-slow`/`--dur-slower` |
| `--mm-dur-4` | 480 ms | Hero copy entrance (AUDIT P7) | `--dur-hero` |
| `--mm-dur-pulse` | 640 ms | Notification badge ring pulse (×2, then stops) | — |
| `--mm-dur-hero-in` | 900 ms | Hero objects entrance | hero-only |
| `--mm-dur-drift-a…d` | 11 s / 13 s / 17 s / 19 s | Hero ambient drift loops (the periods don't divide each other, so the composition never visibly repeats) | ambient |

### 1.2 Easings

| Token | cubic-bezier | Use | Playbook equivalent |
|---|---|---|---|
| `--mm-ease-out` | `cubic-bezier(.22, 1, .36, 1)` | Default for hover in, release, entrances (already used by `mm-rise`) | close to `--ease-out-soft` |
| `--mm-ease-out-expo` | `cubic-bezier(.16, 1, .3, 1)` | Card lift. It's the curve `.gm-card` already uses, so keep it | `--ease-stripe` family |
| `--mm-ease-in` | `cubic-bezier(.4, 0, 1, 1)` | Exits (quick-view out) | `--ease-in-soft` |
| `--mm-ease-press` | `cubic-bezier(.2, 0, 0, 1)` | Press-down | `--ease-standard` |
| `--mm-ease-overshoot` | `cubic-bezier(.34, 1.56, .64, 1)` | Heart pop, badge count pop. Small overshoot, used only on "you did something" moments | spring, bounce ≈ .2 |
| `--mm-ease-drift` | `cubic-bezier(.37, 0, .63, 1)` | Hero drift (sine-in-out, smooth reversal at each end) | `--ease-in-out` |
| `--mm-ease-in-out` | `cubic-bezier(.4, 0, .1, 1)` | **Auth slide only** (§14, 480 ms). Slight accel then a long smooth decelerate. Don't reuse for other UI | — |

Springs (Framer Motion only): `press = { type:"spring", visualDuration:.2, bounce:0 }`, `pop = { type:"spring", visualDuration:.24, bounce:.35 }`, `parallax = useSpring(mv, { stiffness:60, damping:20, mass:1 })`.

### 1.3 Distances, scales, opacities

| Token | Value | Use |
|---|---|---|
| `--mm-lift-card` | −4 px | Card hover lift (unchanged from today) |
| `--mm-lift-card-press` | −1 px | Card pressed while hovered (desktop) |
| `--mm-lift-icon` | −2 px | Brand icon hover lift |
| `--mm-rise` | 8 px | Entrance travel (AUDIT) |
| `--mm-rise-quickview` | 6 px | Quick-view button travel |
| `--mm-scale-press` | .92 | Icon button press (heart, bell, tab icons) |
| `--mm-scale-card-press-touch` | .98 | Card press on touch |
| `--mm-scale-card-press` | .995 | Card press on desktop (AUDIT P3) |
| `--mm-scale-pop` | 1.18 | Heart peak scale |
| `--mm-scale-cover` | 1.035 | Cover zoom inside `.gm-preview-inner` (unchanged) |
| `--mm-brand-rest-opacity` | .70 | Brand icon mono layer at rest |
| `--mm-shadow-rest-opacity` | 0 | Card hover-shadow layer at rest |
| `--mm-parallax-max` | 16 px | Maximum pointer parallax offset (front-most object) |
| `--mm-drift-y` / `--mm-drift-x` / `--mm-drift-rot` | per object, see §5 | Hero drift amplitudes |

### 1.4 Drop-in token CSS

```css
:root{
  /* AUDIT P0 (unchanged) */
  --mm-ease-out:cubic-bezier(.22,1,.36,1);
  --mm-ease-in-out:cubic-bezier(.4,0,.1,1);   /* auth slide only, see §14 (480 ms) */
  --mm-ease-in:cubic-bezier(.4,0,1,1);
  --mm-dur-1:120ms; --mm-dur-2:200ms; --mm-dur-3:320ms; --mm-dur-4:480ms;
  --mm-rise:8px;
  /* this brief */
  --mm-ease-out-expo:cubic-bezier(.16,1,.3,1);
  --mm-ease-press:cubic-bezier(.2,0,0,1);
  --mm-ease-overshoot:cubic-bezier(.34,1.56,.64,1);
  --mm-ease-drift:cubic-bezier(.37,0,.63,1);
  --mm-dur-hover-out:160ms; --mm-dur-bounce:240ms; --mm-dur-cover:350ms;
  --mm-dur-pulse:640ms; --mm-dur-hero-in:900ms;
  --mm-lift-card:-4px; --mm-lift-card-press:-1px; --mm-lift-icon:-2px;
  --mm-rise-quickview:6px;
  --mm-scale-press:.92; --mm-scale-card-press:.995; --mm-scale-card-press-touch:.98;
  --mm-scale-pop:1.18; --mm-scale-cover:1.035;
  --mm-brand-rest-opacity:.7;
  --mm-parallax-max:16px;
  --mm-accent:#FF7A1A; --mm-amber:#FFB547;
}
```

---

## 2. Interaction specs: wishlist heart

**Component:** a heart `IconButton` on the card cover (top-right) and on the product detail page. Phosphor `Heart` is used: `weight="regular"` at rest, `weight="fill"` when active. Render both glyphs stacked and swap their opacity; don't swap the SVG path, so the swap is compositor-only.

**Hit area:** 44×44 px box (48×48 on `pointer:coarse`), glyph 20 px, round `#0E0E11` at 60% opacity backing so it reads on any cover.

| State | Trigger | Properties: from → to | Duration | Easing | Delay | Reduced motion |
|---|---|---|---|---|---|---|
| Rest (off) | — | outline glyph opacity 1, colour `#F4F4F6` at .85; fill glyph opacity 0, scale 1 | — | — | — | same |
| Hover (desktop only) | `:hover` | outline opacity .85 → 1; button scale 1 → 1.06 | `--mm-dur-2` in / `--mm-dur-hover-out` out | `--mm-ease-out` | 0 | opacity only, no scale |
| Pressed | `:active` / pointerdown | button scale current → `.92` | `--mm-dur-1` | `--mm-ease-press` | 0 | no scale. Outline opacity → .7 for 120 ms |
| Activate (off → on) | click / Enter / Space | fill glyph opacity 0 → 1 (`--mm-dur-1`); fill glyph keyframes scale `.92 → 1.18 (40%) → .96 (70%) → 1` | `--mm-dur-bounce` (240 ms) | `--mm-ease-overshoot` on the up-stroke, `--mm-ease-out` after | 0 | fill fades in over 120 ms, no scale |
| Active (on) | `aria-pressed="true"` | fill glyph opacity 1, colour `#FF7A1A`; outline glyph opacity 0 | — | — | — | same |
| Deactivate (on → off) | click | fill opacity 1 → 0, scale 1 → .9. **No bounce** (removing shouldn't celebrate) | `--mm-dur-2` | `--mm-ease-in` | 0 | opacity only |
| Focus-visible | keyboard focus | 2 px ring `#FF7A1A`, 2 px offset, ring opacity 0 → 1 (draw the ring on a pseudo-element) | `--mm-dur-1` | linear | 0 | same |
| Disabled / pending | request in flight | stays in its optimistic state. Pointer events off. No spinner (the toggle is optimistic; roll back with the deactivate motion on error) | — | — | — | — |

Optional, off by default: a single 6-dot "spark" burst (each dot translate 0 → 10 px and opacity 1 → 0 over 300 ms). Keep it off at launch; the brief asks for restraint.

## 3. Interaction specs: notification bell

**Component:** header bell `IconButton` (Phosphor `Bell`, regular ↔ fill), with a count badge at the top-right (min 16 px, `#FF7A1A`, text `#0E0E11`, tabular numbers).

| State | Trigger | Properties: from → to | Duration | Easing | Delay | Reduced motion |
|---|---|---|---|---|---|---|
| Rest | — | outline glyph opacity 1 (`#F4F4F6` .85), fill opacity 0 | — | — | — | same |
| Hover (desktop) | `:hover` | outline opacity → 1; glyph rotate 0 → −6° (transform-origin `50% 8%`, the bell's hook) | `--mm-dur-2` / `--mm-dur-hover-out` | `--mm-ease-out` | 0 | opacity only |
| Pressed | `:active` | scale → .92 | `--mm-dur-1` | `--mm-ease-press` | 0 | none |
| Active / open (panel showing) | `aria-expanded="true"` | fill glyph opacity 0 → 1, colour `#F4F4F6` (the badge keeps the orange; the bell doesn't turn orange, so there's one accent per spot); one swing: rotate `0 → −10° → 8° → −4° → 0` | fill 120 ms; swing `--mm-dur-3` (320 ms) | `--mm-ease-out` | 0 | fill crossfade only, no swing |
| New notification arrives | count increments while the page is visible | badge number crossfades; badge scale `.6 → 1` (on 0 → 1) or `1 → 1.15 → 1` (on n → n+1); then a ring (`::after`, 2 px `#FF7A1A`) scales `1 → 1.9` while its opacity goes `.5 → 0` | pop `--mm-dur-bounce`; ring `--mm-dur-pulse` × **2 iterations, then stop** | pop `--mm-ease-overshoot`; ring `--mm-ease-out` | ring starts 80 ms after the pop | number crossfade only; no ring |
| Badge cleared | count → 0 | badge opacity 1 → 0, scale 1 → .6 | `--mm-dur-2` | `--mm-ease-in` | 0 | opacity only |
| Focus-visible | keyboard | same ring as heart | `--mm-dur-1` | linear | 0 | same |

Never loop the badge pulse. Batch arrivals: if several arrive within 2 s, pulse once.

## 4. Interaction specs: brand icons (GitHub, Google, WhatsApp, Paystack)

**Where:** social sign-in buttons, footer and "share", and the checkout trust row ("Secured by Paystack").

**Construction (compositor-only colour change):** each icon is two stacked SVG layers in a 44×44 px hit box (glyph 20–24 px).
- `.mono`: the Simple Icons path filled with `#F4F4F6`, opacity `.70` at rest.
- `.brand`: the full-colour version, opacity 0 at rest.

Hover crossfades the opacity of the two layers. It never tweens `fill`/`color`.

| Brand | Colour layer | Notes |
|---|---|---|
| GitHub (Octocat, `simple-icons/github`) | `#F4F4F6` at 100% | The brand black `#181717` is invisible on `#0E0E11`. On dark UI GitHub's own guidance is the white mark, so here "full colour" means full-opacity white |
| Google (`simple-icons/google` for mono) | The official four-colour "G" (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`) | Simple Icons only ships the single-path mono G, so the colour layer must be Google's official multi-path G. Google's sign-in branding rules apply to the button itself |
| WhatsApp (`simple-icons/whatsapp`) | `#25D366` | |
| Paystack (`simple-icons/paystack`) | `#00C3F7` (Simple Icons' brand hex for Paystack) | Confirm with Paystack's current brand kit before launch. Paystack's own logo assets have changed over time |

| State | Trigger | Properties: from → to | Duration | Easing | Delay | Reduced motion |
|---|---|---|---|---|---|---|
| Rest | — | mono opacity .70, brand opacity 0, translateY 0 | — | — | — | same |
| Hover (desktop) | `:hover` | mono .70 → 0; brand 0 → 1; icon translateY 0 → −2 px | `--mm-dur-2` in, `--mm-dur-hover-out` out | `--mm-ease-out` | 0 | crossfade only, no lift |
| Focus-visible | keyboard | same as hover, plus the focus ring | `--mm-dur-2` | `--mm-ease-out` | 0 | crossfade only |
| Pressed | `:active` | translateY → 0, scale → .96; colour stays on | `--mm-dur-1` | `--mm-ease-press` | 0 | no transform |
| Touch (no hover) | — | icons show **full colour at rest** (there's no hover to reveal it), and press gives scale .96 | `--mm-dur-1` | `--mm-ease-press` | 0 | no transform |
| Disabled | `aria-disabled` | mono .35, no hover response | — | — | — | — |

## 5. Interaction specs: product card (`.gm-card`)

**Structure:** `.gm-card` (the transformed element) → `::after` hover-shadow layer → `.gm-preview` (`overflow:hidden`, radius 14 px) → `.gm-preview-inner` (cover image) → `.mm-quickview` button (centred bottom of the cover, a 40 px tall pill: `#0E0E11` at 80% opacity, `#F4F4F6` text, "Quick view" + eye icon) → wishlist heart (top-right, §2) → body (title, seller, `₦` price, `.gm-arrow`).

**Shadow strategy:** the card keeps a static rest shadow `0 1px 0 rgba(255,255,255,.04) inset, 0 1px 2px rgba(0,0,0,.4)`. `::after` holds the deep shadow `0 18px 40px -12px rgba(0,0,0,.65), 0 0 0 1px rgba(255,122,26,.10)` with opacity 0. Only that opacity animates. This **replaces** today's `box-shadow` transition at `app/globals.css` ~L1235–1236 (which is also a light-theme `rgba(28,27,24,.1)` shadow).

| State | Trigger | Properties: from → to | Duration | Easing | Delay | Reduced motion |
|---|---|---|---|---|---|---|
| Rest | — | card translateY 0, scale 1; `::after` opacity 0; cover scale 1; quick-view opacity 0, translateY 6 px, `pointer-events:none`; border `rgba(255,255,255,.06)` | — | — | — | same |
| Hover (desktop) | `:hover` | card translateY 0 → −4 px; `::after` 0 → 1; cover scale 1 → 1.035; quick-view opacity 0 → 1, translateY 6 → 0 px, `pointer-events:auto`; `.gm-arrow` translateX 0 → 3 px | card and shadow `--mm-dur-2`; cover `--mm-dur-cover`; quick-view `--mm-dur-2` | card `--mm-ease-out-expo`; cover `--mm-ease-out`; quick-view `--mm-ease-out` | quick-view **+40 ms** (it follows the lift, so it reads as a reveal) | `::after` and quick-view opacity only (no lift, no zoom, no travel) |
| Hover out | pointer leaves | reverse of the above, quick-view without delay | `--mm-dur-hover-out` (160 ms) | `--mm-ease-in` for quick-view, `--mm-ease-out` for the card | 0 | opacity only |
| Pressed (desktop) | `:active` on the card | translateY −4 → −1 px, scale → .995; `::after` → .6 | `--mm-dur-1` | `--mm-ease-press` | 0 | `::after` → .6 only |
| Pressed (touch) | `:active` | scale 1 → .98, `::after` 0 → .5; release eases back | down `--mm-dur-1`, up `--mm-dur-2` | down `--mm-ease-press`, up `--mm-ease-out` | 0 | `::after` opacity only |
| Focus-within (keyboard) | `:focus-visible` on the card link, or `:focus-within` | same as hover, plus a 2 px `#FF7A1A` ring on the card (pseudo-element, opacity 0 → 1). Quick-view must be reachable by Tab | as hover | as hover | 0 | opacity only |
| Quick-view button hover | `:hover` on `.mm-quickview` | background layer opacity .8 → 1; icon translateX 0 → 2 px | `--mm-dur-2` | `--mm-ease-out` | 0 | opacity only |
| Quick-view open | click | AUDIT P2 dialog spec: backdrop to 40% over 200 ms; panel rises 8 px, scale .98 → 1 over 280 ms `--mm-ease-out`; exit 160 ms. On mobile, a bottom sheet `translateY(100%) → 0` over 320 ms | — | — | — | crossfade 150 ms |
| Loading → loaded | image decode | skeleton crossfades to the cover over 200 ms (AUDIT P6) | `--mm-dur-2` | linear | 0 | same |

Grid entrance (AUDIT P3, for reference): the first 6 cards fade and rise 8 px over 420 ms, staggered 40 ms, once. The grid isn't re-staggered on filter changes.

---

## 6. Hero choreography (marketplace hero)

### 6.1 Composition

The hero keeps its two-column layout (`lg:grid-cols-[1fr_…]`): copy on the left, a 3D "still life" on the right. The existing ambient layers `.homepage-hero::before/::after` (36 s light shift, 32 s ambient drift) stay. **For the dark theme** retint them: base `#0E0E11`; `::before` radial `rgba(255,122,26,.10)` at 78% 48% plus `rgba(255,181,71,.06)` at 23% 10%; `::after` glow `rgba(255,122,26,.22) → rgba(255,181,71,.08) → transparent`. Keep its `filter: blur()` static; never animate blur.

Stage: `.mm-hero-stage`, absolutely positioned over the right column, `pointer-events:none`, `aria-hidden="true"`, `contain: layout paint`. Each object is a two-level element:

```
.mm-hero-obj            ← JS writes the pointer parallax (translate3d) here
  .mm-hero-obj__drift   ← CSS keyframes drift (translate + rotate) here
    <picture> AVIF → WebP <img>
  .mm-hero-obj__glow    ← radial-gradient disc behind the object; only its opacity breathes
```

The two transforms live on different elements so they compose without fighting.

| # | Object | Position (stage %, centre) | Display width (desktop ≥1280 / tablet / mobile) | Depth z | Layer | Glow |
|---|---|---|---|---|---|---|
| A | Naira coin (hero object) | 58% x, 46% y | 300 / 240 / 180 px | 1.0 (front) | top | 340 px disc, `rgba(255,122,26,.35)`, breathes .55 ↔ .80 |
| B | Shopping cart | 82% x, 22% y | 220 / 180 / hidden | 0.6 | middle | 240 px, `rgba(255,181,71,.22)`, .45 ↔ .65 |
| C | Glossy cube, large | 28% x, 74% y | 130 / 110 / 96 px | 0.45 | middle | 160 px, `rgba(255,122,26,.28)`, .5 ↔ .7 |
| D | Glossy cube, small (same file as C, mirrored with `scaleX(-1)`, 60% opacity) | 90% x, 80% y | 72 / 60 / hidden | 0.25 (back) | bottom | none |

Optional alternative to B: the digital product box (§7.4). Use one or the other, never both, so the scene stays at 4 objects or fewer.

### 6.2 Entrance (once per page load)

Order: the hero copy goes first (AUDIT P7: h1 → sub → CTAs, 480 ms each, 80 ms stagger), then the objects.

| Object | From | To | Duration | Easing | Delay (from first paint of copy) |
|---|---|---|---|---|---|
| A coin | opacity 0, translateY 16 px, scale .94 | 1, 0, 1 | `--mm-dur-hero-in` (900 ms) | `--mm-ease-out` | 240 ms |
| B cart | opacity 0, translateY 12 px, scale .96 | 1, 0, 1 | 900 ms | `--mm-ease-out` | 360 ms |
| C cube | opacity 0, translateY 10 px | 1, 0 | 800 ms | `--mm-ease-out` | 440 ms |
| D cube small | opacity 0 | .6 | 800 ms | `--mm-ease-out` | 520 ms |
| Glows | opacity 0 | their breathe minimum | 1200 ms | linear | same delay as their object |

If the images arrive after 1.5 s (slow network), skip the stagger and fade each object in over 400 ms as it decodes (`img.decode().then(...)`), so nothing "jumps in" mid-read.

### 6.3 Ambient drift (CSS keyframes, `alternate`, `infinite`)

| Object | translateY amplitude | translateX amplitude | rotate | Period (one direction) | Phase offset (negative `animation-delay`) |
|---|---|---|---|---|---|
| A coin | ±10 px | ±4 px | −3° ↔ 3° (plus rotateY 0 ↔ 8° for a slow turn feel) | 11 s (`--mm-dur-drift-a`) | 0 |
| B cart | ±8 px | ±6 px | −2° ↔ 1.5° | 13 s | −4 s |
| C cube | ±12 px | ±3 px | 4° ↔ 10° | 17 s | −9 s |
| D cube small | ±6 px | ±2 px | −8° ↔ −2° | 19 s | −13 s |
| Glows | — | — | — | opacity breathe on the same period as the object | same |

Easing: `--mm-ease-drift`. Peak speed stays under 3 px/s, which is calm enough to read through.

### 6.4 Pointer parallax (desktop only)

- Input: `pointermove` on the hero section only, normalised to `nx, ny ∈ [−1, 1]` from the hero centre. Passive listener.
- Target offset per object: `x = −nx × 16 px × depth`, `y = −ny × 10 px × depth` (moves away from the pointer, so the scene feels "behind glass").
  - Max offsets: A ±16/±10 px; B ±9.6/±6; C ±7.2/±4.5; D ±4/±2.5.
  - Optional tilt on A only: `rotateX(ny × 4°) rotateY(nx × −6°)` with `perspective: 900px` on the stage.
- Smoothing: one `requestAnimationFrame` loop lerps the current toward the target by `0.08` per frame (≈ a 350 ms settle). Write `translate3d()` to `.mm-hero-obj` only. No layout reads inside the loop.
- On `pointerleave`, the target goes to 0 and the scene glides back.
- The loop sleeps when the offsets are within 0.1 px of the target, and restarts on the next `pointermove`.
- **Pause rules:** an `IntersectionObserver` (threshold 0) on the hero adds `.is-paused` when the hero is off-screen. That sets `animation-play-state: paused` on the drift and glows, and cancels the rAF. Do the same on `visibilitychange` when hidden.
- `will-change: transform` only on `.mm-hero-obj` and `.mm-hero-obj__drift`, and only while not paused (it's removed with `.is-paused`).

### 6.5 Reduced motion (`prefers-reduced-motion: reduce`)

- Static composition: the objects are rendered at their rest positions with drift phase 0 and no parallax. The glows are fixed at their mid opacity.
- The entrance becomes a plain opacity 0 → 1 over 200 ms, with no stagger, travel or scale.
- The rAF loop and the pointer listener are never attached. The device-tilt option is unavailable.
- The images still load (they're part of the design), as one static frame.

---

## 7. Assets to produce after approval (described, not made)

Common art direction for all objects: a soft, glossy "clay plastic" 3D look in the UI8 premium-icon style. Rounded bevels (radius ≈ 8–12% of the object size), no hard edges, no texture noise. Studio lighting: a large soft key light from the upper left at 45°, a warm amber rim light from the right (`#FFB547`), and a weak cool fill (`#2A2A35`) from below so the objects sit on a dark page. Specular highlights are soft and broad, not pin-point. **No ground shadow and no baked glow** (the glow is CSS so it can be dimmed per device). Camera: 50–85 mm equivalent with a mild three-quarter view, the object centred with about 6% padding.

Production route: render in Blender/Spline (or generate, then cut out) on a transparent background, and export straight-alpha PNG masters at 1200 px. Then export AVIF (quality ~50, `-s 6`, 4:4:4 for clean edges) and WebP (quality ~78, alpha quality 90). Check the edges on `#0E0E11` for white fringing; matte against a dark colour if needed.

| # | File stem | Description | Material | Master | Delivered size (2× of max display) | Budget AVIF | Budget WebP |
|---|---|---|---|---|---|---|---|
| 7.1 | `hero-coin-naira` | Thick coin, tilted ~20° toward the camera, with an embossed **₦** glyph (the two horizontal bars must be clearly visible) and a raised rim | Glossy orange-amber plastic, `#FF7A1A` body grading to `#FFB547` on the lit side; the glyph a shade darker (`#E8650C`) | 1200 px | 600×600 | ≤ 38 KB | ≤ 55 KB |
| 7.2 | `hero-cart` | Chunky rounded shopping cart, three-quarter view, chunky wire basket | Matte charcoal `#2B2B31` body; glossy `#FF7A1A` handle grip, wheels and front badge | 1200 px | 440×440 | ≤ 34 KB | ≤ 48 KB |
| 7.3 | `hero-cube` | Rounded cube showing three faces, tilted on two axes | Opaque glossy orange → amber gradient, top face brightest. (A translucent variant was tried in concept and is riskier to cut out: avoid it) | 1200 px | 260×260 | ≤ 14 KB | ≤ 20 KB |
| 7.4 | `hero-box` (alternative to the cart) | Rounded product package with an orange band (no bow, so it reads as "digital product" rather than "gift") | Matte charcoal box, glossy `#FF7A1A` band, amber edge highlight | 1200 px | 440×360 | ≤ 30 KB | ≤ 42 KB |
| 7.5 | `hero-static` (fallback) | A single flattened composite of A + B + C + D + glows at rest, on transparent | — | — | 1200×900 | ≤ 60 KB | ≤ 80 KB |

**Budget:** one browser downloads one format. The scene (coin + cart + cube) totals **≤ 86 KB in AVIF / ≤ 123 KB in WebP**, under the ~150 KB cap with headroom. Mobile (coin + cube at 1× sizes) ≈ **30–40 KB**. `hero-static` is loaded **instead of** the separate objects only where §8 says so; it is never loaded alongside them. Lottie is not recommended: these are raster-shaded objects, and Lottie would need an embedded bitmap anyway.

Concept renders already exist from before the scope change (1024×576 JPG on white, not cut out, not production files): the coin, cart, translucent cube, opaque cube and gift box. They're useful as art-direction references only.

---

## 8. Loading strategy

1. Hero copy and CTA are the LCP. The objects never block it.
2. The markup ships `<picture>` with `<source type="image/avif">` + `<source type="image/webp">` + `<img decoding="async" fetchpriority="low" width height alt="">` inside the `aria-hidden` stage, with `srcset` 1×/2×. Set explicit `width`/`height` so there's no CLS.
3. Inject the `src`s after `load` via `requestIdleCallback` (fallback `setTimeout 300`). `loading="lazy"` alone isn't enough, because the hero is above the fold and lazy loading wouldn't defer it.
4. Skip the separate objects and use `hero-static` (or nothing, with only the CSS glow) when: `navigator.connection.saveData` is on, `effectiveType` is `slow-2g`/`2g`, or `prefers-reduced-data: reduce` matches.
5. Don't start the drift until `img.decode()` resolves for object A. Then add `.is-ready` to the stage, which starts the entrance.
6. In Next.js, use plain `<picture>` (not `next/image`) for these decorative transparent assets so the formats and priority are controlled by hand. Serve them from `/public/hero/` with `Cache-Control: public, max-age=31536000, immutable` and hashed filenames.

---

## 9. Platforms: Android, iOS and desktop (responsive Next.js)

### 9.1 Capability gates (use these media queries, never user-agent sniffing)

| Gate | Query | What it enables |
|---|---|---|
| Hover-capable | `@media (hover:hover) and (pointer:fine)` | All `:hover` styles, quick-view on hover, pointer parallax |
| Touch | `@media (hover:none), (pointer:coarse)` | `:active` press feedback, quick-view always visible, 48 px targets, drift only |
| Reduced motion | `@media (prefers-reduced-motion:reduce)` | §6.5 and the reduced-motion column in every table |
| Low power (JS) | `navigator.hardwareConcurrency <= 4` **or** `navigator.deviceMemory <= 4` **or** viewport < 768 px | Adds `html.mm-lowfx` (§9.5) |

All `:hover` rules live **inside** the hover-capable query. That's the main defence against "sticky hover" on iOS and Android, where a tap leaves `:hover` applied until you tap elsewhere.

### 9.2 Breakpoints (Tailwind v4 defaults, as used in the repo)

| Range | Name | Hero objects | Pointer parallax | Card hover/press |
|---|---|---|---|---|
| < 640 px | phone | 2: A coin (180 px) + C cube (96 px), stage stacked below the copy with a height of 220 px | off | press only |
| 640–767 px | large phone | 2: A + C | off | press only |
| 768–1023 px | tablet | 3: A + B + C (B at 180 px) | only if hover-capable (iPad with trackpad) | hover if capable, else press |
| 1024–1279 px | laptop | 4: A–D | on | hover |
| ≥ 1280 px | desktop | 4: A–D at full size | on | hover |

Drift amplitudes are multiplied by **0.6 below 768 px**, so the motion stays proportional on small stages.

### 9.3 Desktop (hover + fine pointer)

- Full spec: hover states from §2–§5 and pointer parallax from §6.4.
- Keyboard parity: every hover reveal also triggers on `:focus-visible` / `:focus-within`.
- Trackpad on iPad/Android tablets matches `(hover:hover) and (pointer:fine)` and gets desktop behaviour. That's intended.

### 9.4 Touch (iOS and Android phones and tablets without a pointer)

- **No hover states.** Feedback comes from `:active`, using the press rows in the tables:
  - Cards: scale `.98` + shadow layer `.5` (down 120 ms, up 200 ms).
  - Icon buttons: scale `.92`.
  - Brand icons: scale `.96`.
- **Quick-view on touch:** always visible (opacity 1, translateY 0) as a compact 36 px tall pill with a 48 px hit area, bottom-right of the cover. Tapping the card opens the product, and tapping the pill opens the quick-view bottom sheet. The pill is not tap-to-reveal, because a two-tap reveal is slower and confuses users.
- **Brand icons on touch:** shown in full colour at rest.
- **Hero on touch:** slow drift only. **No pointer parallax** (there's no pointer, and `touchmove`-driven parallax fights scrolling).
- **Optional device tilt, off by default:** behind a feature flag `heroTilt`. It uses `deviceorientation` (gamma/beta clamped to ±15°, mapped to the same parallax formula at **50% strength**) with the same 0.08 lerp. On iOS 13+ it needs `DeviceOrientationEvent.requestPermission()` from a user gesture, so never prompt on load. Recommendation: leave it off. Permission prompts for a decorative effect aren't worth it.
- `touch-action: manipulation` on buttons and cards removes double-tap-zoom delay.

### 9.5 Android low-end notes

- Add `html.mm-lowfx` when `hardwareConcurrency <= 4`, `deviceMemory <= 4` or the viewport is < 768 px. It:
  - Limits the hero to **2 objects** (A + C).
  - **Halves the glow:** glow disc size × .5 and peak opacity × .5. The ambient `::after` `blur(28px)` drops to `blur(14px)`, which is a static value, never animated.
  - Disables glow breathing (fixed opacity).
  - Stops the coin's `rotateY` (2D transforms only).
- Prefer CSS over JS: on touch and low-end devices the hero runs **zero JS per frame** (only CSS keyframes, which run on the compositor thread). The rAF parallax loop exists only on hover-capable devices.
- Cap simultaneous `will-change` layers at about 6. Large transparent layers cost GPU memory on 2–3 GB devices.
- Test on a real low-end device (e.g. a Tecno/Infinix/itel phone on Android Go, common in the Nigerian market) with Chrome DevTools remote debugging, 4× CPU throttle and the "Slow 4G" preset. Target: no dropped frames during drift, and the hero LCP unaffected.

### 9.6 iOS Safari notes

- `-webkit-tap-highlight-color: transparent` on interactive elements, **replaced** with our own `:active` press state and a `:focus-visible` ring, so feedback is never lost.
- **`backdrop-filter` + transforms:** don't put the quick-view pill or header with `backdrop-filter: blur()` inside a transformed (lifting or scaling) ancestor. Safari re-rasterises the blur every frame, which causes flicker and jank. Use a solid `rgba(14,14,17,.8)` background on the pill instead. If the header uses backdrop blur, keep it outside any animated element.
- Use `100dvh` (with a `100vh` fallback first) for any full-height hero or sheet, so the collapsing URL bar doesn't cause jumps. Bottom sheets add `padding-bottom: env(safe-area-inset-bottom)`.
- `:active` doesn't fire on iOS unless the document has a touch listener. Add `document.addEventListener('touchstart', () => {}, { passive: true })` once, or rely on React's synthetic handlers already attached at the root.
- Sticky hover: covered by gating all hover rules (§9.1). Never use `:hover` alone for anything functional.
- iOS Low Power Mode throttles rAF to 30 fps. Drift is CSS, so it's unaffected; parallax doesn't run on touch anyway.
- Respect the iOS "Reduce Motion" setting, which maps to `prefers-reduced-motion`.

### 9.7 Touch target sizes

| Platform | Minimum | Applies to |
|---|---|---|
| iOS (Apple HIG) | 44×44 pt | Heart, bell, brand icons, quick-view pill, filter chips |
| Android (Material) | 48×48 dp | Same, under `pointer:coarse` |
| Desktop | 32×32 px visual is fine, but keep a 44 px hit box for consistency | Icon buttons |

Implementation: the glyph stays 20–24 px; the hit area grows with padding or an invisible `::before` inset of −8 px. Keep at least 8 px between adjacent targets. The wishlist heart sits 8 px from the cover edge so its hit box doesn't overlap the card link.

---

## 10. Drop-in code: CSS

```css
/* ---------- base ---------- */
.mm-iconbtn,.gm-card,.mm-brand,.mm-quickview{ -webkit-tap-highlight-color:transparent; touch-action:manipulation; }

/* ---------- icon buttons (heart, bell) ---------- */
.mm-iconbtn{ position:relative; display:grid; place-items:center; width:44px; height:44px; border-radius:999px;
  transition:transform var(--mm-dur-2) var(--mm-ease-out); }
@media (pointer:coarse){ .mm-iconbtn{ width:48px; height:48px; } }
.mm-iconbtn > svg{ grid-area:1/1; width:20px; height:20px; transition:opacity var(--mm-dur-1) linear, transform var(--mm-dur-2) var(--mm-ease-out); }
.mm-iconbtn .is-fill{ opacity:0; color:var(--mm-accent); }
.mm-iconbtn .is-outline{ color:#F4F4F6; opacity:.85; }
.mm-iconbtn:active{ transform:scale(var(--mm-scale-press)); transition-duration:var(--mm-dur-1); transition-timing-function:var(--mm-ease-press); }
.mm-iconbtn[aria-pressed="true"] .is-fill{ opacity:1; }
.mm-iconbtn[aria-pressed="true"] .is-outline{ opacity:0; }
.mm-iconbtn[data-just-activated] .is-fill{ animation:mm-heart-pop var(--mm-dur-bounce) var(--mm-ease-out) both; }
@keyframes mm-heart-pop{ 0%{transform:scale(.92)} 40%{transform:scale(var(--mm-scale-pop)); animation-timing-function:var(--mm-ease-overshoot)} 70%{transform:scale(.96)} 100%{transform:scale(1)} }
@media (hover:hover) and (pointer:fine){
  .mm-iconbtn:hover{ transform:scale(1.06); }
  .mm-iconbtn:hover .is-outline{ opacity:1; }
  .mm-bell:hover > svg{ transform:rotate(-6deg); transform-origin:50% 8%; }
}
/* bell */
.mm-bell[aria-expanded="true"] .is-fill{ opacity:1; color:#F4F4F6; }
.mm-bell[data-swing] > svg{ transform-origin:50% 8%; animation:mm-bell-swing var(--mm-dur-3) var(--mm-ease-out); }
@keyframes mm-bell-swing{ 0%{transform:rotate(0)} 30%{transform:rotate(-10deg)} 60%{transform:rotate(8deg)} 80%{transform:rotate(-4deg)} 100%{transform:rotate(0)} }
.mm-badge{ position:absolute; top:6px; right:6px; min-width:16px; height:16px; border-radius:8px; background:var(--mm-accent); color:#0E0E11; font:600 10px/16px system-ui; font-variant-numeric:tabular-nums; text-align:center; }
.mm-badge::after{ content:""; position:absolute; inset:0; border-radius:inherit; border:2px solid var(--mm-accent); opacity:0; pointer-events:none; }
.mm-badge[data-pulse]{ animation:mm-badge-pop var(--mm-dur-bounce) var(--mm-ease-overshoot); }
.mm-badge[data-pulse]::after{ animation:mm-badge-ring var(--mm-dur-pulse) var(--mm-ease-out) 80ms 2; }
@keyframes mm-badge-pop{ 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
@keyframes mm-badge-ring{ from{transform:scale(1); opacity:.5} to{transform:scale(1.9); opacity:0} }

/* ---------- brand icons ---------- */
.mm-brand{ position:relative; display:grid; place-items:center; width:44px; height:44px;
  transition:transform var(--mm-dur-hover-out) var(--mm-ease-out); }
.mm-brand > svg{ grid-area:1/1; width:22px; height:22px; transition:opacity var(--mm-dur-hover-out) var(--mm-ease-out); }
.mm-brand .mono{ fill:#F4F4F6; opacity:var(--mm-brand-rest-opacity); }
.mm-brand .brand{ opacity:0; }
.mm-brand:focus-visible .mono{ opacity:0 } .mm-brand:focus-visible .brand{ opacity:1 }
@media (hover:hover) and (pointer:fine){
  .mm-brand:hover{ transform:translateY(var(--mm-lift-icon)); transition-duration:var(--mm-dur-2); }
  .mm-brand:hover > svg{ transition-duration:var(--mm-dur-2); }
  .mm-brand:hover .mono{ opacity:0 } .mm-brand:hover .brand{ opacity:1 }
}
@media (hover:none),(pointer:coarse){ .mm-brand .mono{opacity:0} .mm-brand .brand{opacity:1} }
.mm-brand:active{ transform:translateY(0) scale(.96); transition:transform var(--mm-dur-1) var(--mm-ease-press); }

/* ---------- product card ---------- */
.gm-card{ position:relative; isolation:isolate; background:#17171C; border:1px solid rgba(255,255,255,.06); border-radius:16px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04), 0 1px 2px rgba(0,0,0,.4);           /* static, never transitioned */
  transition:transform var(--mm-dur-hover-out) var(--mm-ease-out-expo); }
.gm-card::after{ content:""; position:absolute; inset:0; z-index:-1; border-radius:inherit; pointer-events:none;
  box-shadow:0 18px 40px -12px rgba(0,0,0,.65), 0 0 0 1px rgba(255,122,26,.10);
  opacity:0; transition:opacity var(--mm-dur-hover-out) var(--mm-ease-out); }
.gm-preview{ overflow:hidden; border-radius:14px; }
.gm-preview-inner{ transition:transform var(--mm-dur-cover) var(--mm-ease-out); }
.mm-quickview{ position:absolute; left:50%; bottom:12px; height:40px; padding:0 14px; border-radius:999px;
  background:rgba(14,14,17,.8); color:#F4F4F6;        /* solid, no backdrop-filter (iOS) */
  opacity:0; transform:translate(-50%, var(--mm-rise-quickview)); pointer-events:none;
  transition:opacity var(--mm-dur-hover-out) var(--mm-ease-in), transform var(--mm-dur-hover-out) var(--mm-ease-in); }
.mm-quickview::before{ content:""; position:absolute; inset:-4px; }           /* 48px hit area */
@media (hover:hover) and (pointer:fine){
  .gm-card:hover{ transform:translateY(var(--mm-lift-card)); transition-duration:var(--mm-dur-2); }
  .gm-card:hover::after{ opacity:1; transition-duration:var(--mm-dur-2); }
  .gm-card:hover .gm-preview-inner{ transform:scale(var(--mm-scale-cover)); }
  .gm-card:hover .gm-arrow{ transform:translateX(3px); }
  .gm-card:hover .mm-quickview{ opacity:1; transform:translate(-50%,0); pointer-events:auto;
    transition:opacity var(--mm-dur-2) var(--mm-ease-out) 40ms, transform var(--mm-dur-2) var(--mm-ease-out) 40ms; }
  .gm-card:active{ transform:translateY(var(--mm-lift-card-press)) scale(var(--mm-scale-card-press)); transition-duration:var(--mm-dur-1); }
  .gm-card:active::after{ opacity:.6; }
}
.gm-card:focus-within::after{ opacity:1; }
.gm-card:focus-within .mm-quickview{ opacity:1; transform:translate(-50%,0); pointer-events:auto; }
@media (hover:none),(pointer:coarse){
  .mm-quickview{ left:auto; right:10px; transform:none; height:36px; opacity:1; pointer-events:auto; }
  .gm-card:active{ transform:scale(var(--mm-scale-card-press-touch)); transition:transform var(--mm-dur-1) var(--mm-ease-press); }
  .gm-card:active::after{ opacity:.5; transition-duration:var(--mm-dur-1); }
}

/* ---------- hero stage ---------- */
.mm-hero-stage{ position:absolute; inset:0; pointer-events:none; contain:layout paint; perspective:900px; }
.mm-hero-obj{ position:absolute; left:var(--x); top:var(--y); width:var(--w); translate:-50% -50%;
  opacity:0; transform:translate3d(0,0,0); }
.mm-hero-stage.is-ready .mm-hero-obj{ animation:mm-hero-in var(--mm-dur-hero-in) var(--mm-ease-out) var(--in-delay) both; }
@keyframes mm-hero-in{ from{opacity:0; scale:var(--in-scale,.96); translate:-50% calc(-50% + var(--in-y,12px))} to{opacity:var(--o,1); scale:1; translate:-50% -50%} }
.mm-hero-obj__drift{ animation:var(--drift-name) var(--period) var(--mm-ease-drift) var(--phase) infinite alternate; }
.mm-hero-obj__glow{ position:absolute; inset:-15%; z-index:-1; border-radius:50%;
  background:radial-gradient(closest-side, var(--glow), transparent); opacity:var(--glow-min);
  animation:mm-glow var(--period) var(--mm-ease-drift) var(--phase) infinite alternate; }
@keyframes mm-glow{ to{ opacity:var(--glow-max); } }
@keyframes mm-drift-a{ from{transform:translate(-4px,-10px) rotate(-3deg) rotateY(0)} to{transform:translate(4px,10px) rotate(3deg) rotateY(8deg)} }
@keyframes mm-drift-b{ from{transform:translate(-6px,-8px) rotate(-2deg)} to{transform:translate(6px,8px) rotate(1.5deg)} }
@keyframes mm-drift-c{ from{transform:translate(-3px,-12px) rotate(4deg)} to{transform:translate(3px,12px) rotate(10deg)} }
@keyframes mm-drift-d{ from{transform:translate(-2px,-6px) rotate(-8deg) scaleX(-1)} to{transform:translate(2px,6px) rotate(-2deg) scaleX(-1)} }
.mm-hero-obj, .mm-hero-obj__drift{ will-change:transform; }
.mm-hero-stage.is-paused *, .mm-hero-stage.is-paused *::before{ animation-play-state:paused !important; will-change:auto; }
/* object setup (desktop) */
.mm-obj-a{ --x:58%; --y:46%; --w:300px; --in-delay:240ms; --in-y:16px; --in-scale:.94; --drift-name:mm-drift-a; --period:11s; --phase:0s;  --glow:rgba(255,122,26,.35); --glow-min:.55; --glow-max:.8; }
.mm-obj-b{ --x:82%; --y:22%; --w:220px; --in-delay:360ms; --drift-name:mm-drift-b; --period:13s; --phase:-4s;  --glow:rgba(255,181,71,.22); --glow-min:.45; --glow-max:.65; }
.mm-obj-c{ --x:28%; --y:74%; --w:130px; --in-delay:440ms; --in-y:10px; --drift-name:mm-drift-c; --period:17s; --phase:-9s;  --glow:rgba(255,122,26,.28); --glow-min:.5; --glow-max:.7; }
.mm-obj-d{ --x:90%; --y:80%; --w:72px;  --in-delay:520ms; --o:.6; --drift-name:mm-drift-d; --period:19s; --phase:-13s; }
@media (max-width:1023px){ .mm-obj-d{ display:none } .mm-obj-a{--w:240px} .mm-obj-b{--w:180px} .mm-obj-c{--w:110px} }
@media (max-width:767px){
  .mm-obj-b{ display:none } .mm-obj-a{--w:180px} .mm-obj-c{--w:96px}
  .mm-hero-obj__drift{ scale:1; }  /* amplitudes reduced via the -sm keyframes below */
  .mm-obj-a{ --drift-name:mm-drift-a-sm } .mm-obj-c{ --drift-name:mm-drift-c-sm }
}
@keyframes mm-drift-a-sm{ from{transform:translate(-2.4px,-6px) rotate(-1.8deg)} to{transform:translate(2.4px,6px) rotate(1.8deg)} }
@keyframes mm-drift-c-sm{ from{transform:translate(-1.8px,-7.2px) rotate(4deg)} to{transform:translate(1.8px,7.2px) rotate(7.6deg)} }
/* low-end */
.mm-lowfx .mm-obj-b, .mm-lowfx .mm-obj-d{ display:none }
.mm-lowfx .mm-hero-obj__glow{ inset:10%; animation:none; opacity:calc(var(--glow-max,.6) * .5); }
.mm-lowfx .mm-obj-a{ --drift-name:mm-drift-a-sm }        /* 2D only, no rotateY */
.mm-lowfx .homepage-hero::after{ filter:blur(14px); }

/* ---------- reduced motion (everything above) ---------- */
@media (prefers-reduced-motion:reduce){
  .mm-hero-obj__drift, .mm-hero-obj__glow{ animation:none !important; }
  .mm-hero-obj__glow{ opacity:calc((var(--glow-min,.5) + var(--glow-max,.7)) / 2); }
  .mm-hero-stage.is-ready .mm-hero-obj{ animation:mm-fade 200ms linear both; }
  @keyframes mm-fade{ from{opacity:0} to{opacity:var(--o,1)} }
  .mm-hero-obj, .mm-hero-obj__drift{ will-change:auto; transform:none !important; }
  .gm-card, .gm-card:hover, .gm-card:active, .mm-brand:hover, .mm-brand:active,
  .mm-iconbtn:hover, .mm-iconbtn:active, .mm-bell:hover > svg{ transform:none !important; }
  .gm-card:hover .gm-preview-inner{ transform:none; }
  .mm-quickview{ transition-property:opacity; }
  .mm-iconbtn[data-just-activated] .is-fill, .mm-bell[data-swing] > svg,
  .mm-badge[data-pulse], .mm-badge[data-pulse]::after{ animation:none; }
}
```

**Hero JS (vanilla, desktop parallax + pause; about 40 lines, no dependency):**

```js
export function initHeroMotion(hero){
  const stage = hero.querySelector('.mm-hero-stage'); if(!stage) return;
  const objs = [...stage.querySelectorAll('.mm-hero-obj')].map(el => ({ el, d:+el.dataset.depth, x:0, y:0 }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if ((navigator.hardwareConcurrency||8) <= 4 || (navigator.deviceMemory||8) <= 4 || innerWidth < 768)
    document.documentElement.classList.add('mm-lowfx');
  // start entrance once the hero object decodes
  const a = stage.querySelector('.mm-obj-a img');
  (a?.decode?.() ?? Promise.resolve()).catch(()=>{}).finally(() => stage.classList.add('is-ready'));
  // pause off-screen / hidden
  let visible = true, raf = 0, tx = 0, ty = 0;
  const setPaused = p => { stage.classList.toggle('is-paused', p); if (p) cancelAnimationFrame(raf), raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setPaused(!visible || document.hidden); }).observe(hero);
  document.addEventListener('visibilitychange', () => setPaused(!visible || document.hidden));
  if (reduce || !fine) return;                 // touch + reduced motion: CSS drift / static only
  const MAX_X = 16, MAX_Y = 10, LERP = 0.08;
  const tick = () => {
    let moving = false;
    for (const o of objs){
      const gx = -tx*MAX_X*o.d, gy = -ty*MAX_Y*o.d;
      o.x += (gx-o.x)*LERP; o.y += (gy-o.y)*LERP;
      if (Math.abs(gx-o.x) > .1 || Math.abs(gy-o.y) > .1) moving = true;
      o.el.style.transform = `translate3d(${o.x.toFixed(2)}px,${o.y.toFixed(2)}px,0)`;
    }
    raf = moving && visible ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };
  let rect = hero.getBoundingClientRect();
  addEventListener('resize', () => rect = hero.getBoundingClientRect(), { passive:true });
  addEventListener('scroll', () => rect = hero.getBoundingClientRect(), { passive:true });
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    tx = ((e.clientX-rect.left)/rect.width)*2-1; ty = ((e.clientY-rect.top)/rect.height)*2-1; kick();
  }, { passive:true });
  hero.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });
}
```
Markup per object: `<div class="mm-hero-obj mm-obj-a" data-depth="1"><div class="mm-hero-obj__drift"><picture>…</picture></div><div class="mm-hero-obj__glow"></div></div>`, with depth values A 1, B .6, C .45, D .25.

---

## 11. Drop-in code: Framer Motion (React)

The repo has no animation library yet (AUDIT §1). If `motion` is adopted (AUDIT §4: `motion` via `LazyMotion` + `m`, about 5 KB), use these. Import from `motion/react` (the current package name for Framer Motion; `framer-motion` has the same API).

```tsx
'use client';
import { LazyMotion, domAnimation, m, useReducedMotion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Heart, Bell } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

export const ease = { out:[.22,1,.36,1], outExpo:[.16,1,.3,1], in:[.4,0,1,1], press:[.2,0,0,1], overshoot:[.34,1.56,.64,1], drift:[.37,0,.63,1] } as const;
export const dur  = { d1:.12, d2:.2, hoverOut:.16, bounce:.24, d3:.32, cover:.35, pulse:.64, heroIn:.9 } as const;

const useFinePointer = () => {
  const [fine, set] = useState(false);
  useEffect(() => { const q = matchMedia('(hover: hover) and (pointer: fine)'); set(q.matches);
    const f = () => set(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, []);
  return fine;
};

/* ---------- Wishlist heart ---------- */
export function WishlistButton({ on, onToggle }: { on:boolean; onToggle:()=>void }){
  const reduce = useReducedMotion(); const fine = useFinePointer();
  return (
    <m.button type="button" aria-pressed={on} aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'} onClick={onToggle}
      className="mm-iconbtn" whileHover={fine && !reduce ? { scale:1.06 } : undefined}
      whileTap={reduce ? { opacity:.7 } : { scale:.92 }} transition={{ duration:dur.d2, ease:ease.out }}>
      <m.span style={{ gridArea:'1/1' }} animate={{ opacity: on ? 0 : .85 }} transition={{ duration:dur.d1 }}><Heart size={20} weight="regular" /></m.span>
      <m.span style={{ gridArea:'1/1', color:'#FF7A1A' }} initial={false}
        animate={on ? { opacity:1, scale: reduce ? 1 : [.92, 1.18, .96, 1] } : { opacity:0, scale: reduce ? 1 : .9 }}
        transition={on ? { duration:dur.bounce, times:[0,.4,.7,1], ease:ease.out, opacity:{ duration:dur.d1 } }
                       : { duration:dur.d2, ease:ease.in }}>
        <Heart size={20} weight="fill" />
      </m.span>
    </m.button>
  );
}

/* ---------- Notification bell ---------- */
export function BellButton({ open, count, onClick }: { open:boolean; count:number; onClick:()=>void }){
  const reduce = useReducedMotion(); const prev = useRef(count); const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => { if (count > prev.current && !document.hidden) setPulseKey(k => k + 1); prev.current = count; }, [count]);
  return (
    <m.button type="button" aria-expanded={open} aria-label={`Notifications${count ? `, ${count} unread` : ''}`} onClick={onClick}
      className="mm-iconbtn" whileTap={reduce ? undefined : { scale:.92 }} transition={{ duration:dur.d1, ease:ease.press }}>
      <m.span style={{ gridArea:'1/1', transformOrigin:'50% 8%' }}
        animate={open && !reduce ? { rotate:[0,-10,8,-4,0] } : { rotate:0 }} transition={{ duration:dur.d3, ease:ease.out }}>
        <Bell size={20} weight={open ? 'fill' : 'regular'} />
      </m.span>
      <AnimatePresence>
        {count > 0 && (
          <m.span key="badge" className="mm-badge" initial={reduce ? { opacity:0 } : { opacity:0, scale:.6 }}
            animate={{ opacity:1, scale:1 }} exit={reduce ? { opacity:0 } : { opacity:0, scale:.6 }}
            transition={{ duration:dur.bounce, ease:ease.overshoot }}>
            {count > 99 ? '99+' : count}
            {!reduce && pulseKey > 0 && (
              <m.span key={pulseKey} aria-hidden className="mm-badge-ring"
                initial={{ scale:1, opacity:.5 }} animate={{ scale:1.9, opacity:0 }}
                transition={{ duration:dur.pulse, ease:ease.out, delay:.08, repeat:1 }} />
            )}
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );
}

/* ---------- Brand icon ---------- */
export function BrandIcon({ mono, color, label, href }: { mono:React.ReactNode; color:React.ReactNode; label:string; href:string }){
  const reduce = useReducedMotion(); const fine = useFinePointer();
  return (
    <m.a href={href} aria-label={label} className="mm-brand" initial="rest" animate="rest"
      whileHover={fine ? 'hover' : undefined} whileFocus="hover" whileTap="press"
      variants={{ rest:{ y:0, scale:1 }, hover:{ y: reduce ? 0 : -2 }, press:{ y:0, scale: reduce ? 1 : .96 } }}
      transition={{ duration:dur.d2, ease:ease.out }}>
      <m.span style={{ gridArea:'1/1' }} variants={{ rest:{ opacity: fine ? .7 : 0 }, hover:{ opacity:0 }, press:{ opacity:0 } }}>{mono}</m.span>
      <m.span style={{ gridArea:'1/1' }} variants={{ rest:{ opacity: fine ? 0 : 1 }, hover:{ opacity:1 }, press:{ opacity:1 } }}>{color}</m.span>
    </m.a>
  );
}

/* ---------- Product card ---------- */
export function ProductCard({ children, cover, onQuickView }:{ children:React.ReactNode; cover:React.ReactNode; onQuickView:()=>void }){
  const reduce = useReducedMotion(); const fine = useFinePointer();
  const lift = reduce ? {} : { y:-4 };
  return (
    <m.article className="gm-card" initial="rest" animate="rest" whileHover={fine ? 'hover' : undefined} whileFocus="hover"
      whileTap={reduce ? undefined : (fine ? { y:-1, scale:.995 } : { scale:.98 })}
      variants={{ rest:{ y:0, scale:1, transition:{ duration:dur.hoverOut, ease:ease.outExpo } },
                  hover:{ ...lift, transition:{ duration:dur.d2, ease:ease.outExpo } } }}>
      <m.div aria-hidden className="gm-card-shadow" /* absolutely positioned, holds the deep box-shadow */
        variants={{ rest:{ opacity:0 }, hover:{ opacity:1 } }} transition={{ duration:dur.d2, ease:ease.out }} />
      <div className="gm-preview">
        <m.div className="gm-preview-inner" variants={{ rest:{ scale:1 }, hover:{ scale: reduce ? 1 : 1.035 } }}
          transition={{ duration:dur.cover, ease:ease.out }}>{cover}</m.div>
        <m.button type="button" className="mm-quickview" onClick={onQuickView}
          variants={fine ? { rest:{ opacity:0, y: reduce ? 0 : 6, pointerEvents:'none' as const },
                             hover:{ opacity:1, y:0, pointerEvents:'auto' as const, transition:{ duration:dur.d2, ease:ease.out, delay:.04 } } }
                         : { rest:{ opacity:1, y:0 }, hover:{ opacity:1, y:0 } }}
          transition={{ duration:dur.hoverOut, ease:ease.in }}>Quick view</m.button>
      </div>
      {children}
    </m.article>
  );
}

/* ---------- Hero stage (parallax on fine pointers only; drift stays in CSS) ---------- */
const OBJS = [
  { cls:'mm-obj-a', depth:1,   src:'/hero/hero-coin-naira', w:300, h:300 },
  { cls:'mm-obj-b', depth:.6,  src:'/hero/hero-cart',       w:220, h:220 },
  { cls:'mm-obj-c', depth:.45, src:'/hero/hero-cube',       w:130, h:130 },
  { cls:'mm-obj-d', depth:.25, src:'/hero/hero-cube',       w:72,  h:72  },
];
export function HeroStage({ heroRef }:{ heroRef:React.RefObject<HTMLElement> }){
  const reduce = useReducedMotion(); const fine = useFinePointer();
  const nx = useMotionValue(0), ny = useMotionValue(0);
  const sx = useSpring(nx, { stiffness:60, damping:20 }), sy = useSpring(ny, { stiffness:60, damping:20 });
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const hero = heroRef.current; if (!hero) return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting)); io.observe(hero);
    if (reduce || !fine) return () => io.disconnect();
    const move = (e:PointerEvent) => { if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const r = hero.getBoundingClientRect(); nx.set(((e.clientX-r.left)/r.width)*2-1); ny.set(((e.clientY-r.top)/r.height)*2-1); };
    const leave = () => { nx.set(0); ny.set(0); };
    hero.addEventListener('pointermove', move, { passive:true }); hero.addEventListener('pointerleave', leave);
    return () => { io.disconnect(); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); };
  }, [reduce, fine]);
  return (
    <div className={`mm-hero-stage is-ready${paused ? ' is-paused' : ''}`} aria-hidden>
      {OBJS.map((o, i) => <HeroObj key={o.cls} o={o} i={i} sx={sx} sy={sy} still={reduce || !fine} />)}
    </div>
  );
}
function HeroObj({ o, i, sx, sy, still }:any){
  const x = useTransform(sx, (v:number) => still ? 0 : -v*16*o.depth);
  const y = useTransform(sy, (v:number) => still ? 0 : -v*10*o.depth);
  const reduce = useReducedMotion();
  return (
    <m.div className={`mm-hero-obj ${o.cls}`} style={{ x, y }}
      initial={reduce ? { opacity:0 } : { opacity:0, scale:.96 }} animate={{ opacity: o.cls==='mm-obj-d' ? .6 : 1, scale:1 }}
      transition={reduce ? { duration:.2 } : { duration:dur.heroIn, ease:ease.out, delay:.24 + i*.1 }}>
      <div className="mm-hero-obj__drift">
        <picture>
          <source type="image/avif" srcSet={`${o.src}.avif`} />
          <img src={`${o.src}.webp`} width={o.w} height={o.h} alt="" decoding="async" fetchPriority="low" />
        </picture>
      </div>
      <div className="mm-hero-obj__glow" />
    </m.div>
  );
}
// Wrap the app (or the page) once: <LazyMotion features={domAnimation} strict>…</LazyMotion>
```

Notes: in the `motion` version, keep the drift and glow in CSS (§10). Animating infinite loops through JS on the main thread would undo the "prefer CSS" rule for low-end Android. The `.is-ready` class should be gated on `img.decode()` as in §8 (simplified above).

---

## 12. QA checklist

- [ ] Any `.mm-auth*` change matches §14 (Auth slide: target choreography) and passes the §14.12 checklist.
- [ ] DevTools → Rendering → "Paint flashing": no green flashes during hover, press or drift (only compositing).
- [ ] Performance panel: no long tasks during hero drift. On touch, no rAF callbacks at all.
- [ ] macOS "Reduce motion", iOS "Reduce Motion" and Android "Remove animations" each give the static hero, crossfades only, and working feedback.
- [ ] Tap a card on iOS, then scroll: no stuck lifted card (sticky-hover check).
- [ ] Keyboard Tab through a card reaches quick-view, and the focus ring is visible.
- [ ] Every icon target is ≥ 44 px (iOS) / ≥ 48 px under `pointer:coarse`.
- [ ] Hero assets ≤ 150 KB per format (AVIF ≈ 86 KB target) and no CLS from the stage.
- [ ] The badge pulse runs at most twice per arrival burst. Nothing else loops.

## 13. Caveats and open decisions

1. **Paystack colour:** `#00C3F7` is Simple Icons' value. Verify it against Paystack's current brand kit; their brand guidance may require the full logo lockup (not just the mark) for "Secured by Paystack".
2. **Google colour icon:** Simple Icons only has the mono G. The full-colour state needs Google's official four-colour G asset, and Google's sign-in button guidelines limit how the button itself is restyled.
3. **GitHub:** "full colour" on dark means 100% white, because brand black is invisible on `#0E0E11`.
4. **Theme mismatch:** the current `.homepage-hero` on `design/ui8-fixes` is a light peach gradient. This spec assumes the dark palette in the brief and gives dark retints for `::before/::after` (§6.1). Confirm the homepage is actually going dark before building.
5. **Existing `.gm-card` CSS** is defined twice (around L1157 and L1235 in `app/globals.css`) and transitions `box-shadow`. This spec replaces both with the pseudo-element approach. Clean up the duplicate as part of AUDIT P0.
6. **Assets aren't produced.** The §7 sizes are budgets, not measured files. Concept renders exist only as art-direction references (on white, not cut out).
7. **Device tilt** is specified but recommended off (iOS permission prompt).

---

## 14. Auth slide: target choreography

Added 2026-11-03. **Spec only**: no code was changed, committed or pushed.

> **Changelog 2026-11-05:** duration 760→480 ms; curve → `(.4,0,.1,1)` for fast smooth settle. Tabs removed; links-only.

**Source read:** branch `origin/design/ui8-dark` @ `c6cf827`, specifically `app/signup/PageClient.js` (`AuthPageInner`, `switchMode`) and every `.mm-auth*` rule in `app/product-design.css` (around L103–125, 151–167, 192–206, 218–298, 644–760, 863–880, 956–958, 1120 and 1166–1200). `/workspace/desktop-spec/AUTH_TRANSITION_FIX.md` (the designer's frame-by-frame diagnosis) didn't exist when this was written, so align terminology with it once it lands. The Log in / Create account **tab bar** has since been removed; only the inline links below the form switch modes.

**Concept kept:** the orange hero panel (`#F97316`, dark text) travels horizontally between the two halves. Log-in = hero **left**, form right. Sign-up = hero **right**, form left. The direction of travel is unchanged: log-in → sign-up moves the hero left → right, and sign-up → log-in moves it right → left. Only *how* it moves changes — fast and smooth, not sluggish.

### 14.1 Why it feels broken today (diagnosis from the code)

| # | Symptom | Cause on `ui8-dark` |
|---|---|---|
| D1 | Two panels cross through each other. The form slides **over** the hero mid-move | `.mm-auth-hero` and `.mm-auth-form` each transition `transform .8s` and swap with `translateX(±100%)` (L254–266). The form comes later in the DOM with no z-index, so it paints on top while they overlap |
| D2 | The form content changes the instant you click, then slides with the wrong panel | On desktop `switchMode()` calls `applyMode()` immediately (L237–240). `setFlipped` swaps the keyed `.mm-auth-form-face` at t = 0, and its 450 ms `mm-auth-face` rise plays *while* the column is travelling. There's no hidden swap point |
| D3 | The wave edge pops | The desktop edge wave is `.mm-auth-hero::after` (L1175–1190). In sign-up it jumps from `right:-1px` to `left:-1px` with `transform:scaleX(-1)` and **no transition**, so it teleports to the other edge at t = 0 |
| D4 | The page height jumps | The sign-up form is taller than log-in. `.mm-auth-panel` is `min-height:100svh` (desktop) / `md:min-h-[680px]`, so when sign-up overflows, the grid grows the instant the content swaps. That's a layout shift and a scrollbar jump |
| D5 | The logo travels | `Logo` sits inside `.mm-auth-hero-bar`, inside the moving `<aside>` |
| D6 | No real interruption or Back/Forward model | `router.replace` (no history entry). A `searchParams` effect sets `flipped` directly (an instant swap with no choreography). Rapid clicks re-key the face each time |
| D7 | Breathe runs on a paint property | `mm-background-breathe` animates `background-size` (repaint every frame) on the raster wave div. It's `display:none` on desktop dark, but it's still running wherever that div shows |
| D8 | Mobile wipe and wave flip | `.mm-auth-wipe` / `mm-auth-spider` 720 ms orange overlay plus a 300 ms delayed swap; the mobile wave `::after` transitions `scaleX(-1)` over .8 s (it visibly squashes through zero) |
| D9 | Reduced motion | The kill switch (`.mm-auth *{transition:none}`) gives an abrupt full-panel jump: a 50vw orange block teleports |

### 14.2 Target architecture (one moving layer)

```
main.mm-auth[data-mode][data-phase]
  .mm-auth-panel            ← position:relative; overflow:clip; 2-column grid; background = form surface
    .mm-auth-brand          ← logo, pinned (outside the moving layer, see 14.7)
    .mm-auth-stage          ← THE ONLY MOVING LAYER: abs, top/bottom 0, left 0, width 50%, z-index 2
      .mm-auth-hero-bg      ← orange fill (+ optional raster wave, breathe paused during the move)
      .mm-auth-edge--r      ← wave edge on the stage's right side, overhanging into the form (pre-drawn)
      .mm-auth-edge--l      ← mirrored wave edge (pre-drawn mirror, NOT scaleX(-1)) on the left side
      .mm-auth-hero-copy    ← brand copy, cross-fades (14.4)
    .mm-auth-slot           ← form column: grid-column 2 (log-in) or 1 (sign-up); holds ONE form + inline mode links
```

- **Single transform.** `.mm-auth-stage` is `translateX(0)` in log-in and `translateX(100%)` in sign-up (100% = its own width = half the panel). The hero background, both wave edges and the copy are its children, so they move as **one composited layer** and can't drift apart.
- **The form doesn't slide.** It fades out, jumps columns while invisible, and fades in. This removes D1 and D2 entirely: there's never a form crossing the hero, and never two forms.
- **Wave without a pop (D3).** Both edges always exist, as pre-rendered SVGs (the left one is a separately drawn mirrored path, so nothing flips). Each edge **overhangs outside** the stage box (`right:-56px` / `left:-56px`, fill = the hero orange `#F97316`, stroke as today), so the boundary reads exactly like today's wave. At rest the outer edge is off-panel and clipped by `.mm-auth-panel{overflow:clip}`. During the move the leading edge slides out of view and the trailing edge slides in, purely as a consequence of the one transform. No opacity, flip or position toggle.
  - Form padding on the hero-facing side must be ≥ 72 px, so the 56 px overhang never covers the inputs.
- **Breathe kept (28 s) but compositor-only and paused during the slide.** Replace the keyframes with `opacity .985 ↔ 1` + `transform: scale(1) ↔ scale(1.003, 1.002)` on the raster wave element, and set `animation-play-state: paused` while `data-phase ≠ idle`. (Changing `background-size` is a repaint, so it's removed.)
- **will-change only during the move:** `will-change: transform` is set on `.mm-auth-stage` when the phase enters `leaving` and removed at `idle`. The stage is animated with the Web Animations API, which promotes it anyway while running. No permanent `will-change`.

### 14.3 Timing

| Token | Value | Note |
|---|---|---|
| `--mm-auth-dur` | **480 ms** | Fast enough to feel decisive over ~50vw; not so short it snaps. Replaces the old 760 ms soft-settle |
| `--mm-ease-in-out` | `cubic-bezier(.4, 0, .1, 1)` | **Auth slide only.** Slight accel then a long smooth decelerate — more physical / realistic than the old soft-start `.65,0,.2,1`. Keep the token name; change the value |
| `--mm-auth-out` | **100 ms**, `--mm-ease-in` | Form fades out immediately so the click never feels ignored |
| `--mm-auth-copy-out` | **120 ms**, `--mm-ease-in` | Outgoing hero copy |
| `--mm-auth-swap-at` | stage progress ≥ 0.5 (≈ **200 ms** on the new curve) | Mid-cover swap, read from the animation's progress, not a timer |
| `--mm-auth-in` | **180 ms** starting ≈ **240 ms**, `--mm-ease-out` | Form fades in as the panel clears |
| `--mm-auth-copy-in` | **200 ms** starting ≈ **220 ms**, `--mm-ease-out` | Incoming hero copy |
| `--mm-auth-mobile` | 240 ms total (100 out + 140 in) | Mobile cross-fade (unchanged) |
| `--mm-auth-reduced` | 150 ms | Reduced-motion cross-fade (unchanged) |

Properties animated: `transform` (stage, copy, form) and `opacity` (copy, form) only. The one layout operation, moving the slot to the other `grid-column`, happens **once**, at the swap point, while the slot is at opacity 0.

### 14.4 Timeline: desktop ≥ 768 px, log-in → sign-up (the reverse is a mirror image)

| t (ms) | Stage (hero + waves) | Hero copy | Form slot (form + inline links) | Phase / system |
|---|---|---|---|---|
| 0 | starts `translateX(0 → 100%)`, **480 ms**, `.4,0,.1,1`; `will-change` on; breathe paused | outgoing copy starts opacity 1 → 0, translateX 0 → +12 px (drifts *with* the travel; 120 ms `--mm-ease-in`) | starts opacity 1 → 0, translateY 0 → −6 px (**100 ms** `--mm-ease-in`); `inert` + `aria-hidden` set **now** | `idle → leaving`; `history.pushState(?mode=signup)`; `aria-busy=true` |
| 100 | ~15–20% | ~80% faded | **opacity 0** (fully hidden) | |
| 120 | ~25% | **opacity 0** | hidden | |
| 120 → 200 | accelerating into the decelerate, ~25% → 50% | hidden | hidden | nothing visible but the hero moving: the "clean" stretch |
| ≈ 200 | **50%** (hero centred, covering the seam) | copy content swaps (if the copy differs per mode); stays hidden | **swap:** React commits the new mode → the log-in form unmounts, the sign-up form mounts in `grid-column:1`; still opacity 0 and inert | `leaving → swapping → entering` (same frame) |
| 220 | ~58% | incoming copy starts opacity 0 → 1, translateX −12 px → 0 (**200 ms** `--mm-ease-out`) | hidden | |
| 240 | ~65% (the left column is clearing behind the hero edge) | rising | incoming form starts opacity 0 → 1, translateY 8 px → 0 (**180 ms** `--mm-ease-out`) | |
| 360 | ~92% | ~70% | ~70% | |
| 480 | **100%, settled** | opacity 1 | opacity 1 | `entering → idle`; `will-change` off; breathe resumes; `inert`/`aria-hidden`/`aria-busy` removed; focus → first field (14.6) |

Guarantees:
- The outgoing copy is at 0 from 120 ms, and the incoming copy starts at 220 ms, so there's never any overlap at any opacity.
- Exactly one form exists in the DOM in every frame, and it's at opacity 0 for the whole 100–240 ms window around the swap.

### 14.5 State machine

```
            click / key / popstate (target ≠ current)
  ┌──────┐ ─────────────────────────────────────────▶ ┌─────────┐  stage progress ≥ .5  ┌──────────┐  same frame  ┌──────────┐  stage finished  ┌──────┐
  │ idle │                                            │ leaving │ ────────────────────▶ │ swapping │ ───────────▶ │ entering │ ───────────────▶ │ idle │
  └──────┘ ◀──────────────── reverse (target = from) ─└─────────┘                       └──────────┘              └──────────┘                  └──────┘
                                                                                                              new toggle ▲│ (target ≠ shown)
                                                                                                                         │▼
                                                                                               becomes a fresh `leaving` from the current position
```

| Event | In phase | Action |
|---|---|---|
| toggle to the other mode | `idle` | start `leaving` (timeline 14.4) |
| toggle back to the **origin** | `leaving` (pre-swap) | **Reverse:** `stageAnim.reverse()` continues from the current position at the same rate; the form/copy fade back in from their current opacity (CSS transitions retarget); cancel the swap. Arrive back at `idle` in the origin mode. No swap ever happened |
| toggle again (to the shown mode) | `leaving` | ignored (already heading there) |
| toggle back | `swapping` / `entering` | The content is already the target. Start a new `leaving` toward the origin from the current stage position (`reverse()`); the incoming form fades back out from its current opacity; the swap fires again when progress crosses .5 going back |
| any | any | **last click wins.** Each run gets a token, and stale callbacks (`finished`, swap watcher, focus) check it and bail. One WAAPI animation on the stage at a time (`reverse()`, never stack new ones) |
| `popstate` (Back/Forward) | any | treated exactly like a toggle to the URL's mode. Focus doesn't move on popstate |
| resize across 768 px | any | finish instantly (`anim.finish()`), apply the target layout |

### 14.6 Form swap, focus, a11y, URL

- **One form:** only the active form is rendered. The slot holds exactly one `<form>` plus the inline "Log in" / "Create an account" links (no tab bar).
  - Drop the keyed `mm-auth-face` 450 ms animation; the phase classes replace it.
  - Sign-up drafts keep using the existing `useSignupDraft`, so nothing typed is lost across the swap.
- **Inert:** the outgoing form gets `inert` and `aria-hidden="true"` at t = 0, so no typing, autofill or click can land in a form that's disappearing. The slot has `aria-busy="true"` while `phase ≠ idle`.
- **Focus after the transition (t = 480 ms):**
  - Triggered by a pointer click on the in-form "Log in" / "Create an account" links: `firstField.focus({ preventScroll:true })` (`#signup-fullname` / `#login-email`).
  - Back/Forward: focus isn't moved.
- **Screen readers:** the incoming `<h1>` ("Create your account" / "Log in") is the announcement. Add a visually hidden `aria-live="polite"` node that announces "Sign-up form" / "Log-in form" at `idle`. Nothing is announced during the move.
- **URL and history:** user toggles call `history.pushState(null, '', buildAuthUrl(...))` at t = 0. Next 15's `useSearchParams` stays in sync with native `pushState`. Back/Forward then fires the same choreography. Replace the current `searchParams` effect, which sets `flipped` directly, with "request a transition to the URL mode". The initial load reads `?mode` / `localStorage` with no animation. `localStorage('mm_last_auth_mode')` is written at `idle`.

### 14.7 Height: no layout shift

- **Reserve the tallest state:**

  ```css
  .mm-auth-panel{ min-height:max(100svh, var(--mm-auth-min-h)) }
  ```

  `--mm-auth-min-h` is the sign-up form's natural height plus the panel padding, measured at design time per breakpoint (e.g. a starting value of `880px` at 1280×800; verify in QA).
  - Log-in is vertically centred inside the same box, so swapping modes never changes the page height and never moves the scrollbar.
- **Fallback (dynamic content such as error alerts or the password checklist):**
  1. Just before the swap (while hidden), lock the slot: `style.height = current px`.
  2. After the swap, measure the new `scrollHeight`.
  3. Animate the **slot's `height`** (not the panel's) from old to new over the `entering` window (240–480 ms, `--mm-ease-out`).
  4. At `idle`, release it to `auto`.

  The slot is out of flow relative to the stage, and the panel's min-height already covers the maximum, so this never shifts the page (CLS 0). It's a layout animation, but it's confined to one hidden or fading element.
- No `scrollTo` during the transition. If the user is scrolled down, they stay where they are.

### 14.8 Logo pinned (zero movement)

- `.mm-auth-brand` is a sibling of the stage (not a child): `position:absolute; top:40px; left:40px; z-index:3`. It doesn't move, ever.
- **Colourway follows what's under it,** without animating colour:
  - It's rendered twice, as two stacked copies with the identical position.
  - The `onPanel` (navy on orange) copy lives **inside the stage** in a full-size `.mm-auth-pin` wrapper that counter-translates: the stage is `+X` and the wrapper is `−X`, i.e. `translateX(0 ↔ -100%)`, the same animation and curve. On screen it stays perfectly still, and the stage's `overflow:clip` reveals it only while the orange is underneath.
  - The dark-surface copy sits in `.mm-auth-brand` beneath.
  - The result is that the orange edge "wipes" the logo colour as it passes, with zero logo movement and only transforms.
  - `components/Logo.tsx` isn't modified; only existing variants are used.
- The first logo copy (dark-surface) is the accessible one (`aria-label`). The counter-translated copy is `aria-hidden`.

### 14.9 Reduced motion (`prefers-reduced-motion: reduce`)

- **No slide.** Use a **150 ms cross-fade of the whole panel** via the View Transitions API: `document.startViewTransition(() => commitMode())` with `::view-transition-old/new(mm-auth)` at 150 ms linear opacity. That way the hero changing sides reads as a dissolve, not a 50vw orange block teleporting.
- Where `startViewTransition` is unsupported: an **instant swap**.
- Breathe off. Focus, URL and a11y rules from 14.6 still apply (focus moves immediately).

### 14.10 Mobile (< 768 px): cross-fade, no slide, no wipe

- **Remove** `.mm-auth-wipe`, `@keyframes mm-auth-spider`, the 300 ms delayed `applyMode` and the 720 ms `switching` timer.
- The hero band (top) is **static** in both modes: the wave `::after` no longer flips. Drop the `scaleX(-1)` transition, or swap to a pre-drawn mirrored SVG instantly while the form is hidden.
- **Form-only cross-fade, 240 ms total:**
  1. 0–100 ms: the outgoing form goes opacity 1 → 0 (`--mm-ease-in`) and is `inert` at 0.
  2. 100 ms: the swap (one form mounted).
  3. 100–240 ms: the incoming form goes opacity 0 → 1 and translateY 6 px → 0 (`--mm-ease-out`).
- Inline mode links stay put (they don't fade with the form face if they live outside it; if they live inside the face, they cross-fade with it).
- The height difference is handled by the page's natural flow. Below the fold that isn't CLS, because it comes from user input within 500 ms (the "recent input" exclusion). Keep the inline links in a stable place so the trigger doesn't jump.
- Reduced motion on mobile: an instant swap.

### 14.11 Snippets (all UNTESTED)

```css
/* UNTESTED. Desktop structure and choreography */
:root{ --mm-auth-dur:480ms; --mm-auth-min-h:880px; }
@media (min-width:768px){
  .mm-auth-panel{ position:relative; overflow:clip; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr);
    min-height:max(100svh, var(--mm-auth-min-h)); }
  .mm-auth-stage{ position:absolute; inset:0 auto 0 0; width:50%; z-index:2; transform:translateX(0); }
  .mm-auth[data-mode=signup] .mm-auth-stage{ transform:translateX(100%); }          /* resting states; WAAPI animates between */
  .mm-auth[data-phase]:not([data-phase=idle]) .mm-auth-stage{ will-change:transform; }
  .mm-auth-edge{ position:absolute; top:0; bottom:0; width:56px; pointer-events:none; background:no-repeat center / 100% 100%; }
  .mm-auth-edge--r{ right:-56px; background-image:url(/design/auth-edge-r.svg); }   /* orange bulge + stroke */
  .mm-auth-edge--l{ left:-56px;  background-image:url(/design/auth-edge-l.svg); }   /* pre-drawn mirror, no scaleX(-1) */
  .mm-auth-pin{ position:absolute; inset:0; pointer-events:none; }                   /* counter-translated by WAAPI */
  .mm-auth[data-mode=signup] .mm-auth-pin{ transform:translateX(-100%); }

  .mm-auth-slot{ grid-column:2; position:relative; z-index:1; display:flex; flex-direction:column; justify-content:center;
    padding-inline:72px 96px; }
  .mm-auth[data-mode=signup] .mm-auth-slot{ grid-column:1; padding-inline:96px 72px; }

  /* outgoing */
  .mm-auth-slot, .mm-auth-hero-copy{ transition:opacity 100ms var(--mm-ease-in), transform 100ms var(--mm-ease-in); }
  .mm-auth[data-phase=leaving] .mm-auth-slot,
  .mm-auth[data-phase=swapping] .mm-auth-slot{ opacity:0; transform:translateY(-6px); }
  .mm-auth[data-phase=leaving] .mm-auth-hero-copy,
  .mm-auth[data-phase=swapping] .mm-auth-hero-copy{ opacity:0; transform:translateX(calc(12px * var(--dir))); transition-duration:120ms; }
  /* incoming: enter from the "before" state, then transition with a delay after swap (≈200 ms) */
  .mm-auth[data-phase=entering] .mm-auth-slot{ opacity:1; transform:none;
    transition:opacity 180ms var(--mm-ease-out) 40ms, transform 180ms var(--mm-ease-out) 40ms; }     /* 200 + 40 = 240 ms */
  .mm-auth[data-phase=entering] .mm-auth-hero-copy{ opacity:1; transform:none;
    transition:opacity 200ms var(--mm-ease-out) 20ms, transform 200ms var(--mm-ease-out) 20ms; }     /* 200 + 20 = 220 ms */
  @starting-style{ .mm-auth[data-phase=entering] .mm-auth-slot{ opacity:0; transform:translateY(8px); } }
  /* If @starting-style doesn't apply on a React re-render, JS sets opacity:0 / translateY(8px) inline at the swap, then clears it next frame */

  .mm-auth-wave-raster{ animation:mm-breathe 28s ease-in-out infinite alternate; }
  .mm-auth:not([data-phase=idle]) .mm-auth-wave-raster{ animation-play-state:paused; }
}
@keyframes mm-breathe{ from{ opacity:.985; transform:scale(1) } to{ opacity:1; transform:scale(1.003,1.002) } }
@media (max-width:767px){
  .mm-auth-stage{ position:relative; width:auto; transform:none !important; }
  .mm-auth-wipe{ display:none !important; }
  .mm-auth-face{ transition:opacity 100ms var(--mm-ease-in); }
  .mm-auth[data-phase=leaving] .mm-auth-face{ opacity:0; }
  .mm-auth[data-phase=entering] .mm-auth-face{ opacity:1; transform:none; transition:opacity 140ms var(--mm-ease-out), transform 140ms var(--mm-ease-out); }
  @starting-style{ .mm-auth[data-phase=entering] .mm-auth-face{ opacity:0; transform:translateY(6px); } }
}
@media (prefers-reduced-motion:reduce){
  .mm-auth *{ transition-duration:0ms !important; animation:none !important; }
  ::view-transition-old(mm-auth), ::view-transition-new(mm-auth){ animation-duration:150ms; animation-timing-function:linear; }
  .mm-auth-panel{ view-transition-name:mm-auth; }
}
```

```jsx
// UNTESTED. Controller inside AuthPageInner (replaces switchMode and the searchParams effect)
const EASE = 'cubic-bezier(.4,0,.1,1)', DUR = 480;
const run = useRef({ token:0, anim:null, pin:null, target:null, swapped:false });

function requestMode(signin, { source = 'pointer' } = {}){
  const r = run.current, main = mainRef.current;
  const desktop = matchMedia('(min-width: 768px)').matches;
  const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (source !== 'popstate') history.pushState(null, '', buildAuthUrl(signin, searchParams));

  if (reduce){ const commit = () => flushSync(() => setFlipped(signin));
    document.startViewTransition ? document.startViewTransition(commit) : commit(); return done(signin, source); }

  if (!desktop) return mobileCrossfade(signin, source);               // 240 ms, form only

  // Interruption: an animation is running → reverse it (last click wins)
  if (r.anim && r.anim.playState === 'running'){
    if (r.target === signin) return;                                  // already heading there
    r.token++; r.target = signin; r.anim.reverse(); r.pin?.reverse();
    setPhase('leaving'); watchSwap(r.token, signin); return;
  }
  if (signin === flipped) return;

  const token = ++r.token; r.target = signin; r.swapped = false;
  const from = flipped ? '0%' : '100%', to = signin ? '0%' : '100%';
  main.style.setProperty('--dir', signin ? -1 : 1);
  setPhase('leaving');                                                // CSS fades the slot + copy out; slot gets inert
  r.anim = stageRef.current.animate([{ transform:`translateX(${from})` }, { transform:`translateX(${to})` }],
                                    { duration:DUR, easing:EASE, fill:'forwards' });
  r.pin  = pinRef.current.animate([{ transform:`translateX(-${from})` }, { transform:`translateX(-${to})` }],
                                  { duration:DUR, easing:EASE, fill:'forwards' });
  watchSwap(token, signin);
  r.anim.finished.then(() => { if (token !== r.token) return; r.anim.commitStyles?.(); r.anim.cancel(); r.pin.cancel();
    setPhase('idle'); done(r.target, source); }).catch(() => {});
}

function watchSwap(token, signin){
  const r = run.current;
  const tick = () => {
    if (token !== r.token || !r.anim) return;
    // eased progress isn't exposed by WAAPI, so use time: 200 ms ≈ 50% travel on this curve
    const t = r.anim.currentTime, past = r.anim.playbackRate > 0 ? t >= 200 : t <= 280;
    if (past && flippedRef.current !== signin){ flushSync(() => { setPhase('swapping'); setFlipped(signin); }); setPhase('entering'); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function done(signin, source){
  try { localStorage.setItem('mm_last_auth_mode', signin ? 'signin' : 'signup'); } catch {}
  if (source === 'pointer' || source === 'link') (signin ? loginEmailRef : signupNameRef).current?.focus({ preventScroll:true });
  // 'popstate' moves nothing
}

useEffect(() => {                                                     // Back/Forward
  const onPop = () => requestMode(new URLSearchParams(location.search).get('mode') === 'signin', { source:'popstate' });
  addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
}, []);
// <section className="mm-auth-slot" inert={phase !== 'idle' ? '' : undefined} aria-hidden={phase === 'leaving' || phase === 'swapping'} aria-busy={phase !== 'idle'}>
// React 18.2 doesn't know `inert`: pass inert="" (string) or set it via ref (node.inert = true).
```

Implementation notes:
- With `reverse()` on a CSS-eased WAAPI animation, the path back is the exact time-mirror, which is what a "change of mind" should feel like.
- In the reverse case after the swap, the swap watcher's threshold uses `currentTime ≤ 280 ms` (the mirror of 200 ms).
- `flushSync` keeps the class change and the content swap in the same frame.

### 14.12 QA checklist (auth slide)

- [ ] **60 fps:** Chrome Performance panel, 4× CPU throttle, 1280×800 and 1440×900. Across the 480 ms there are no frames over 16.7 ms and no long tasks. "Paint flashing" shows no repaint of the stage while it moves, and the only layout is a single one at ≈ 200 ms.
- [ ] **No double forms:** step through the recording frame by frame. Every frame has ≤ 1 `<form>` in the DOM (assert with `document.querySelectorAll('.mm-auth form').length <= 1` in a rAF logger), and the form is at opacity 0 for the whole 100–240 ms window.
- [ ] **No wave pop:** frame-by-frame, the boundary is continuous. Neither edge ever changes position relative to the stage, there's no `scaleX(-1)` and no opacity change.
- [ ] **Logo:** its bounding rect is identical in every frame (a rAF logger delta of 0 px). The colourway changes only where the orange passes.
- [ ] **No CLS:** Performance panel "Layout shifts" = 0. `document.documentElement.scrollHeight` is unchanged before and after the toggle at 1280×800 and 1440×900. Test while scrolled to the bottom too.
- [ ] **Hero copy:** the outgoing copy is invisible by 120 ms, the incoming copy is not visible before 220 ms, and there's never any overlap.
- [ ] **Keyboard / links:**
  - Clicking "Create an account" lands focus in `#signup-fullname` after 480 ms.
  - Clicking "Log in" lands focus in `#login-email` after 480 ms.
  - Typing during the transition never lands in the hidden form.
  - Esc and Enter do nothing unexpected mid-move.
  - No tablist / tab roles in the DOM.
- [ ] **Screen reader (VoiceOver + NVDA):** a single announcement of the new form or heading. The hidden form is never read. `aria-busy` clears.
- [ ] **Rapid toggle:** click the inline links 10× within 2 s. The final state matches the last input, nothing stacks or flickers, there's one running animation at most, and there are no console errors.
- [ ] **Reverse mid-move:** click back at 80, 150, 250 and 360 ms. Each case returns smoothly from the current position with no swap glitch.
- [ ] **Back/Forward:** each user toggle adds one history entry. Back and Forward replay the choreography, with focus unmoved. A reload with `?mode=signin|signup` lands with no animation.
- [ ] **Reduced motion:** a 150 ms dissolve (or an instant swap), with no slide and no breathe.
- [ ] **Mobile 375/390 px:** a 240 ms form-only cross-fade. No orange wipe, a static hero band, and the inline links don't jump.
- [ ] Resizing across 768 px mid-transition finishes cleanly.
