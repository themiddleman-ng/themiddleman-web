#!/usr/bin/env python3
"""Auth slide test suite (log-in <-> sign-up) for The Middleman.

Usage:  python3 authslide_suite.py --base http://localhost:3471 --out /path/to/outdir [--label 1eafd06] [--expect links-only]

--expect links-only (default): the Log in / Create account TAB BAR is gone from the product.
         Mode switches happen only via the inline "Create an account" / "Log in" links below the form,
         and those links drive the 480 ms panel slide (MOTION_SPEC §14).
--expect links-slide | tabs-slide: deprecated aliases that map to links-only behaviour.
Runs against any running build of the app. Writes results.json, SUMMARY.md, screenshots, videos.
Spec: MOTION_SPEC.md §14 as amended by /workspace/desktop-spec/AUTH_TRANSITION_FIX.md
(panel-only move, taps ignored while running, pushState on change, pinned logo, #signup-name focus).
The product no longer ships a tablist; the suite asserts it is absent.
"""
import argparse, asyncio, base64, json, os, re, shutil, statistics, subprocess, time
from playwright.async_api import async_playwright

CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")

PROBE = r"""
(() => {
if (window.__probe) return;
const P = window.__probe = { on:false, samples:[], shifts:[], loaf:[], downs:[], label:'' };
new PerformanceObserver(l => { for (const e of l.getEntries()) P.shifts.push({ t:e.startTime, v:e.value, input:e.hadRecentInput,
  src:(e.sources||[]).map(s => s.node ? (s.node.className||s.node.nodeName)+'' : '?').slice(0,4) }); }).observe({ type:'layout-shift', buffered:true });
try { new PerformanceObserver(l => { for (const e of l.getEntries()) P.loaf.push({ t:e.startTime, d:e.duration, block:e.blockingDuration }); })
  .observe({ type:'long-animation-frame', buffered:true }); } catch (e) {}
addEventListener('pointerdown', () => P.downs.push({ t:performance.now(), wall:Date.now() }), true);
const R = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [+b.x.toFixed(1), +b.y.toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)]; };
const vis = el => el.checkVisibility ? el.checkVisibility({ opacityProperty:true, visibilityProperty:true }) : true;
const flipped = () => { let n = 0; for (const el of document.querySelectorAll('.mm-auth, .mm-auth *')) {
  for (const pe of [null, '::after', '::before']) { const t = getComputedStyle(el, pe).transform; if (t && t.startsWith('matrix(-')) n++; } } return n; };
function tick(t) {
  if (P.on) {
    const m = document.querySelector('main.mm-auth');
    const stage = document.querySelector('.mm-auth-stage') || document.querySelector('.mm-auth-hero');
    const sr = R(stage);
    const logos = [...document.querySelectorAll('.mm-auth-logo')].filter(vis).map(R);
    const edges = [...document.querySelectorAll('.mm-auth-edge')].map(e => { const r = R(e); return sr && r ? [+(r[0]-sr[0]).toFixed(1), getComputedStyle(e).opacity] : null; });
    const hero = document.querySelector('.mm-auth-hero, .mm-auth-stage');
    const wa = hero ? getComputedStyle(hero, '::after') : null;
    const faces = [...document.querySelectorAll('.mm-auth-form-face, .mm-auth-slot-face')];
    const cx = innerWidth / 2, cy = innerHeight / 2, top = document.elementFromPoint(cx, cy);
    P.samples.push({ t, mode:m && m.dataset.mode, phase:m && (m.dataset.phase || m.dataset.switching || null),
      forms:document.querySelectorAll('.mm-auth form').length,
      faceOp:faces.map(f => +getComputedStyle(f).opacity), stage:sr, stageT:stage && getComputedStyle(stage).transform,
      logos, edges, waveL:wa && wa.left, waveT:wa && wa.transform,
      centerOnStage:!!(top && stage && stage.contains(top)), page:document.documentElement.scrollHeight,
      active:document.activeElement && (document.activeElement.id || document.activeElement.tagName),
      anims:document.getAnimations().filter(a => a.playState === 'running' && a.constructor.name === 'Animation').length,
      logoWrong:(() => {
        const st = document.querySelector('.mm-auth-stage'), sr = st && st.getBoundingClientRect();
        const pin = document.querySelector('.mm-auth-pin .mm-auth-logo'), brand = document.querySelector('.mm-auth-brand .mm-auth-logo');
        const ref = (pin && vis(pin) ? pin : brand); if (!ref || !sr) return 0;
        const b = ref.getBoundingClientRect(), px = b.x + b.width/2;
        const onStage = px >= sr.x && px <= sr.x + sr.width;
        let clip = null; for (let e = pin && pin.parentElement; e && !e.classList.contains('mm-auth-panel') && e.tagName !== 'MAIN'; e = e.parentElement) {
          const cs = getComputedStyle(e); if (cs.display !== 'contents' && /clip|hidden/.test(cs.overflowX)) { clip = e; break; } }
        const cr = clip ? clip.getBoundingClientRect() : null;
        const pinShown = !!(pin && vis(pin) && (!cr || (px >= cr.x && px <= cr.x + cr.width)));
        const z = el => +getComputedStyle(el).zIndex || 0;
        const brandBox = document.querySelector('.mm-auth-brand');
        const brandShown = !!(brand && vis(brand) && !(onStage && brandBox && z(brandBox) < z(st)));
        const top = pinShown && brandShown ? (z(brandBox) > z(st) ? 'brand' : 'pin') : pinShown ? 'pin' : brandShown ? 'brand' : 'none';
        return (onStage && top !== 'pin') || (!onStage && top !== 'brand') ? 1 : 0; })(),
      url:location.search });
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
P.flipped = flipped;
})();
"""

# Selectors that must NOT exist once the tab bar was removed.
TAB_SELECTORS = [
    "[role=tab]", "[role=tablist]", ".mm-auth-tabs", ".mm-auth-tab-indicator",
    "#auth-tab-signin", "#auth-tab-signup",
]

# Inline switch links below the form (they may be <button> or <a>). Never a tab, never the submit button.
LINK_TEXT = {"signup": re.compile(r"^\s*create an account\s*$", re.I), "signin": re.compile(r"^\s*(log in|sign in)\s*$", re.I)}

def inline_link(page, target):
    return (page.locator("main.mm-auth :is(a, button):not([role=tab]):not([type=submit])")
                .filter(has_text=LINK_TEXT[target]).last)

def pct(a, p):
    if not a: return None
    a = sorted(a); k = min(len(a)-1, int(round(p/100*(len(a)-1)))); return round(a[k], 2)

def analyse(samples, t0, window=900):
    s = [x for x in samples if x["t"] >= t0 - 1 and x["t"] <= t0 + window]
    if len(s) < 2: return {"error": "no samples"}
    deltas = [round(b["t"] - a["t"], 2) for a, b in zip(s, s[1:])]
    logo_sets = [tuple(map(tuple, x["logos"])) for x in s]
    logo_rects = sorted({r for ls in logo_sets for r in ls})
    stage_x = [x["stage"][0] for x in s if x["stage"]]
    edges = {}
    for x in s:
        for i, e in enumerate(x["edges"] or []):
            if e: edges.setdefault(i, set()).add(e[0])
    phases = []
    for x in s:
        if not phases or phases[-1][0] != x["phase"]: phases.append([x["phase"], round(x["t"] - t0)])
    modes = []
    for x in s:
        if not modes or modes[-1][0] != x["mode"]: modes.append([x["mode"], round(x["t"] - t0)])
    wave = sorted({(x["waveL"], x["waveT"]) for x in s})
    first_move = next((round(x["t"]-t0) for x in s if x["stage"] and abs(x["stage"][0]-stage_x[0]) > 0.5), None)
    settle = next((round(x["t"]-t0) for x in reversed(s) if x["stage"] and abs(x["stage"][0]-stage_x[-1]) > 0.5), None)
    def at(ms):
        c = min(s, key=lambda x: abs(x["t"] - (t0 + ms)))
        return {"ms": round(c["t"] - t0), "faceOp": c["faceOp"], "stageX": c["stage"] and c["stage"][0], "phase": c["phase"], "forms": c["forms"], "centerOnStage": c["centerOnStage"]}
    return {
        "frames": len(s), "delta_max": max(deltas), "delta_p95": pct(deltas, 95), "delta_mean": round(statistics.mean(deltas), 2),
        "frames_over_20ms": sum(d > 20 for d in deltas), "frames_over_17ms": sum(d > 17.5 for d in deltas),
        "stage_transforms_distinct": len({x["stageT"] for x in s}), "face_min_opacity": min((min(x["faceOp"]) for x in s if x["faceOp"]), default=None),
        "max_forms": max(x["forms"] for x in s), "frames_with_2plus_forms": sum(x["forms"] > 1 for x in s),
        "logo_distinct_rects": [list(r) for r in logo_rects], "logo_pinned": all(len(ls) >= 1 for ls in logo_sets) and len({r[:2] for r in logo_rects}) == 1,
        "frames_without_visible_logo": sum(len(ls) == 0 for ls in logo_sets),
        "page_heights": sorted({x["page"] for x in s}),
        "stage_x_from_to": [stage_x[0], stage_x[-1]] if stage_x else None, "stage_first_move_ms": first_move, "stage_settled_ms": settle,
        "edge_offsets_rel_stage": {k: sorted(v) for k, v in edges.items()},
        "wave_after_states": [list(w) for w in wave],
        "phases": phases, "modes": modes,
        "max_running_anims": max(x["anims"] for x in s),
        "center_covered_by_stage_ms": [round(x["t"]-t0) for x in s if x["centerOnStage"]][:1] + [round(x["t"]-t0) for x in s if x["centerOnStage"]][-1:],
        "frames_logo_wrong_colourway": [round(x["t"]-t0) for x in s if x.get("logoWrong")],
        "marks": [at(ms) for ms in (0, 100, 120, 200, 240, 360, 480, 600)],
    }

def classify(smp):
    """What a mode change looked like: slide (stage moved), fade (face opacity dipped), or instant."""
    xs = {x["stage"][0] for x in smp if x["stage"]}
    if len(xs) > 2: return "slide"
    if any(x["faceOp"] and min(x["faceOp"]) < 0.9 for x in smp): return "fade"
    return "instant"

def normalize_expect(expect):
    """Map deprecated aliases onto links-only."""
    if expect in ("links-slide", "tabs-slide", "links-only"):
        return "links-only"
    return expect

class Suite:
    def __init__(self, base, out, label, expect):
        self.base, self.out, self.label = base.rstrip("/"), out, label
        self.expect = normalize_expect(expect)
        self.results = {"label": label, "base": base, "expect": self.expect, "expect_arg": expect,
                        "started": time.strftime("%Y-%m-%d %H:%M:%S %z"), "tests": {}}
        os.makedirs(out, exist_ok=True)

    async def ctx(self, b, **kw):
        opts = dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1, color_scheme="dark")
        opts.update(kw)
        c = await b.new_context(**opts)
        await c.route(lambda u: not u.startswith(self.base), lambda r: r.abort())  # block fake Supabase etc.
        await c.add_init_script(PROBE)
        return c

    async def open(self, c, mode="signin"):
        page = await c.new_page()
        page._rsc = []
        page.on("request", lambda r: page._rsc.append(r.url) if ("/signup" in r.url and ("_rsc=" in r.url or r.headers.get("rsc") == "1")) else None)
        await page.goto(f"{self.base}/signup?mode={mode}", wait_until="networkidle")
        await page.wait_for_timeout(900)
        return page

    async def tab_dom_audit(self, page):
        """Hard check: zero tab-bar remnants in the DOM."""
        return await page.evaluate("""(sels) => {
          const found = {};
          for (const s of sels) {
            const n = document.querySelectorAll(s).length;
            if (n) found[s] = n;
          }
          return {ok: Object.keys(found).length === 0, found};
        }""", TAB_SELECTORS)

    async def trigger(self, page, target):
        await inline_link(page, target).click()

    async def toggle(self, page, target, wait=1100):
        await page.evaluate("__probe.samples=[]; __probe.on=true")
        await self.trigger(page, target)
        await page.wait_for_timeout(wait)
        return await page.evaluate("__probe.downs.at(-1).t")

    async def samples(self, page):
        return await page.evaluate("__probe.samples")

    # ---------- desktop: link-driven slide both ways, pacing, invariants, screencast frames ----------
    async def desktop(self, b, w, h):
        c = await self.ctx(b, viewport={"width": w, "height": h})
        page = await self.open(c, "signin")
        res = {"viewport": [w, h]}
        res["tabs_absent_signin"] = await self.tab_dom_audit(page)
        res["scaleX_flipped_elements_idle_signin"] = await page.evaluate("__probe.flipped()")
        res["link"] = {}
        for target, name in (("signup", "signin_to_signup"), ("signin", "signup_to_signin")):
            await page.evaluate("__probe.shifts=[]")
            try:
                t = await self.toggle(page, target)
            except Exception as e:
                res["link"][name] = {"error": f"trigger not found or not clickable: {str(e)[:160]}"}; continue
            a = analyse(await self.samples(page), t)
            a["looked_like"] = classify([x for x in await self.samples(page) if x["t"] >= t])
            sh = await page.evaluate("__probe.shifts")
            a["layout_shift_total"] = round(sum(x["v"] for x in sh), 4)
            a["cls_excluding_recent_input"] = round(sum(x["v"] for x in sh if not x["input"]), 4)
            a["focus_after"] = await page.evaluate("document.activeElement.id || document.activeElement.tagName")
            a["mode_after"] = await page.evaluate("document.querySelector('main.mm-auth').dataset.mode")
            if target == "signup":
                res["scaleX_flipped_elements_idle_signup"] = await page.evaluate("__probe.flipped()")
                res["tabs_absent_signup"] = await self.tab_dom_audit(page)
            res["link"][name] = a
        res["rsc_requests_on_toggle"] = len(page._rsc)
        res["loaf_over_50ms"] = [x for x in await page.evaluate("__probe.loaf") if x["d"] > 50]
        # Screencast pass for screenshots (affects pacing, so it's separate)
        cdp = await c.new_cdp_session(page)
        frames = []
        async def onframe(ev):
            frames.append((ev["metadata"]["timestamp"], ev["data"]))
            try: await cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})
            except Exception: pass
        cdp.on("Page.screencastFrame", lambda ev: asyncio.ensure_future(onframe(ev)))
        await cdp.send("Page.startScreencast", {"format": "png", "everyNthFrame": 1})
        await page.wait_for_timeout(300)
        shots = {}
        for target in ("signup", "signin"):
            try: await self.trigger(page, target)
            except Exception: continue
            await page.wait_for_timeout(1100)
            wall = (await page.evaluate("__probe.downs.at(-1).wall")) / 1000
            for ms in (0, 100, 200, 240, 360, 480):
                cand = [f for f in frames if f[0] >= wall + ms/1000 - 0.03]
                if not cand: continue
                best = min(cand, key=lambda f: abs(f[0] - (wall + ms/1000)))
                p = f"{self.out}/shots/{w}_link_to_{target}_{ms:03d}ms_(actual{int((best[0]-wall)*1000):+d}).png"
                os.makedirs(os.path.dirname(p), exist_ok=True)
                open(p, "wb").write(base64.b64decode(best[1])); shots.setdefault(f"link_to_{target}", []).append(os.path.basename(p))
        await cdp.send("Page.stopScreencast")
        res["screenshots"] = shots
        await c.close()
        return res

    # ---------- focus, rapid link taps, history, reload ----------
    async def behaviour(self, b):
        r = {}
        c = await self.ctx(b)
        page = await self.open(c, "signin")
        r["tabs_absent"] = await self.tab_dom_audit(page)
        await inline_link(page, "signup").click(); await page.wait_for_timeout(1100)
        r["focus_after_inform_link_to_signup"] = await page.evaluate("document.activeElement.id || document.activeElement.tagName")
        await inline_link(page, "signin").click(); await page.wait_for_timeout(1100)
        r["focus_after_inform_link_to_signin"] = await page.evaluate("document.activeElement.id || document.activeElement.tagName")
        await c.close()
        # rapid taps on the INLINE LINKS: 5 alternate create/log-in clicks in ~300 ms
        c = await self.ctx(b); page = await self.open(c, "signin")
        hl0 = await page.evaluate("history.length")
        await page.evaluate("__probe.on=true")
        t = time.time()
        for s in ("signup", "signin", "signup", "signin", "signup"):
            await inline_link(page, s).click(delay=0); await page.wait_for_timeout(45)
        r["rapid_taps_elapsed_ms"] = int((time.time() - t) * 1000)
        await page.wait_for_timeout(1500)
        st = await page.evaluate("""() => ({
          mode: document.querySelector('main.mm-auth').dataset.mode,
          phase: document.querySelector('main.mm-auth').dataset.phase,
          url: location.search,
          hist: history.length,
          forms: document.querySelectorAll('.mm-auth form').length,
        })""")
        st["history_entries_added"] = st.pop("hist") - hl0
        smp = await self.samples(page)
        st["max_running_anims"] = max((x["anims"] for x in smp), default=0)
        st["max_forms"] = max((x["forms"] for x in smp), default=st["forms"])
        st["url_matches_mode"] = ("mode=" + st["mode"]) in st["url"]
        r["rapid_taps"] = st
        await c.close()
        # history: one change via the inline link, then Back / Forward.
        # Same-mode re-click of the (now absent) switcher is N/A — try the same-mode inline link if present, else skip.
        c = await self.ctx(b); page = await self.open(c, "signin")
        hl0 = await page.evaluate("history.length")
        await self.trigger(page, "signup"); await page.wait_for_timeout(1100)
        # After switching to signup the "Create an account" link is gone; the "Log in" link is the opposite mode.
        # There is no same-mode switcher to re-click. Report entries after the one change only.
        h = {"entries_after_one_change": await page.evaluate("history.length") - hl0,
             "same_mode_reclick": "N/A (no tab switcher; opposite-mode link only)"}
        await page.evaluate("document.activeElement.blur(); __probe.samples=[]; __probe.on=true")
        await page.evaluate("window.__lsb=[]; new PerformanceObserver(l=>{for(const e of l.getEntries())__lsb.push([e.value,e.hadRecentInput])}).observe({type:'layout-shift'})")
        await page.go_back(); await page.wait_for_timeout(1200)
        smp = await self.samples(page)
        h["layout_shifts_on_back"] = await page.evaluate("__lsb")
        h["back"] = {"url": await page.evaluate("location.pathname+location.search"), "mode": await page.evaluate("document.querySelector('main.mm-auth')?.dataset.mode"),
                     "looked_like": classify(smp), "forms_max": max([x["forms"] for x in smp] or [0]), "focus": await page.evaluate("document.activeElement.id||document.activeElement.tagName")}
        await page.evaluate("__probe.samples=[]")
        await page.go_forward(); await page.wait_for_timeout(1200)
        smp = await self.samples(page)
        h["forward"] = {"url": await page.evaluate("location.pathname+location.search"), "mode": await page.evaluate("document.querySelector('main.mm-auth')?.dataset.mode"),
                        "looked_like": classify(smp), "forms_max": max([x["forms"] for x in smp] or [0])}
        h["rsc_requests"] = len(page._rsc)
        await page.reload(wait_until="networkidle"); await page.evaluate("__probe.samples=[]; __probe.on=true"); await page.wait_for_timeout(600)
        smp = await self.samples(page)
        h["reload_signup_animated"] = len({x['stage'][0] for x in smp if x['stage']}) > 1
        h["reload_mode"] = await page.evaluate("document.querySelector('main.mm-auth').dataset.mode")
        r["history"] = h
        await c.close()
        return r

    async def reduced(self, b):
        out = {}
        c = await self.ctx(b, reduced_motion="reduce"); page = await self.open(c, "signin")
        out["tabs_absent"] = await self.tab_dom_audit(page)
        for target, name in (("signup", "signin_to_signup"), ("signin", "signup_to_signin")):
            try: t = await self.toggle(page, target, 900)
            except Exception as e: out[name] = {"error": str(e)[:160]}; continue
            smp = await self.samples(page)
            a = analyse(smp, t, 600)
            xs = sorted({x["stage"][0] for x in smp if x["stage"]})
            a["distinct_stage_x"] = xs; a["intermediate_stage_positions"] = max(0, len(xs) - 2)
            a["focus"] = await page.evaluate("document.activeElement.id || document.activeElement.tagName")
            a["mode_after"] = await page.evaluate("document.querySelector('main.mm-auth').dataset.mode")
            out[name] = a
        out["has_view_transition_api"] = await page.evaluate("typeof document.startViewTransition === 'function'")
        await c.close()
        return out

    async def mobile(self, b, name, **ctxkw):
        c = await self.ctx(b, **ctxkw); page = await self.open(c, "signin")
        res = {"device": name}
        res["tabs_absent"] = await self.tab_dom_audit(page)
        await page.evaluate("__probe.on=true")
        # Tap the inline link (not a tab). Prefer locator.tap; fall back to click for emulated devices.
        link = inline_link(page, "signup")
        try:
            await link.tap()
        except Exception:
            await link.click()
        await page.wait_for_timeout(900)
        t = await page.evaluate("__probe.downs.at(-1)?.t ?? __probe.samples[0].t")
        a = analyse(await self.samples(page), t, 700)
        smp = [x for x in await self.samples(page) if x["t"] >= t]
        ph = [(x["page"], max(x["faceOp"] or [0])) for x in smp]
        changes = [(a_[0], b_[0], b_[1]) for a_, b_ in zip(ph, ph[1:]) if a_[0] != b_[0]]
        a["page_height_changes"] = changes
        a["height_changed_while_visible"] = any(op > 0.05 for _, _, op in changes)
        a["wipe_visible"] = await page.evaluate("(()=>{const w=document.querySelector('.mm-auth-wipe');return !!(w&&w.checkVisibility({opacityProperty:true}))})()")
        fade = [x for x in smp if x["faceOp"] and max(x["faceOp"]) < 0.99]
        a["face_fade_window_ms"] = [round(fade[0]["t"] - t), round(fade[-1]["t"] - t)] if fade else None
        res.update(a)
        await page.screenshot(path=f"{self.out}/shots/mobile_{name}_signup.png")
        link2 = inline_link(page, "signin")
        try:
            await link2.tap()
        except Exception:
            await link2.click()
        await page.wait_for_timeout(900)
        await page.screenshot(path=f"{self.out}/shots/mobile_{name}_signin.png")
        await c.close()
        return res

    async def video(self, b):
        vd = f"{self.out}/video_raw"; os.makedirs(vd, exist_ok=True)
        c = await self.ctx(b, record_video_dir=vd, record_video_size={"width": 1440, "height": 900})
        page = await self.open(c, "signin")
        await page.wait_for_timeout(500)
        for target in ("signup", "signin"):
            try: await self.trigger(page, target)
            except Exception: pass
            await page.wait_for_timeout(1300)
        path = await page.video.path(); await c.close()
        dst = f"{self.out}/desktop_1440_links.webm"; shutil.move(path, dst); shutil.rmtree(vd, ignore_errors=True)
        mp4 = dst.replace(".webm", ".mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", dst, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4])
        return {"webm": dst, "mp4": mp4 if os.path.exists(mp4) else None, "sequence": "link→signup, link→signin"}

    async def run(self):
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=CHROME, args=["--enable-gpu-rasterization"])
            T = self.results["tests"]
            for w, h in ((1280, 800), (1440, 900)):
                T[f"desktop_{w}"] = await self.desktop(b, w, h)
            T["behaviour"] = await self.behaviour(b)
            T["reduced_motion"] = await self.reduced(b)
            T["mobile_390"] = await self.mobile(b, "390", viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
            for dev in ("iPhone 13", "Pixel 7"):
                d = dict(p.devices[dev]); d.pop("default_browser_type", None); d["color_scheme"] = "dark"
                T[f"mobile_{dev.replace(' ', '_')}"] = await self.mobile(b, dev.replace(" ", "_"), **d)
            try: T["video"] = await self.video(b)
            except Exception as e: T["video"] = {"error": str(e)[:300]}
            await b.close()
        md, counts = summary(self.results)
        self.results["counts"] = counts
        json.dump(self.results, open(f"{self.out}/results.json", "w"), indent=1)
        open(f"{self.out}/SUMMARY.md", "w").write(md)
        print(md)

def slide_rows(row, tag, a):
    row(f"{tag}: looks like", a["looked_like"], "slide", a["looked_like"] == "slide")
    row(f"{tag}: frame deltas", f"max {a['delta_max']} ms, p95 {a['delta_p95']}, >20ms: {a['frames_over_20ms']}", "none >20 ms", a["frames_over_20ms"] == 0)
    row(f"{tag}: forms in DOM", f"max {a['max_forms']}", "≤1", a["max_forms"] <= 1)
    row(f"{tag}: logo", f"rects {a['logo_distinct_rects']}, frames w/o logo {a['frames_without_visible_logo']}", "one rect", a["logo_pinned"])
    row(f"{tag}: logo wrong colourway frames", f"{len(a['frames_logo_wrong_colourway'])} frames {a['frames_logo_wrong_colourway'][:1]}…{a['frames_logo_wrong_colourway'][-1:]}", "0", not a["frames_logo_wrong_colourway"])
    row(f"{tag}: page height", f"{a['page_heights']}", "constant", len(a["page_heights"]) == 1)
    row(f"{tag}: layout shift", f"total {a['layout_shift_total']}, CLS(excl. input) {a['cls_excluding_recent_input']}", "0", a["layout_shift_total"] == 0)
    row(f"{tag}: stage move", f"x {a['stage_x_from_to']}, first move {a['stage_first_move_ms']} ms, settled {a['stage_settled_ms']} ms", "≈480 ms", bool(a["stage_settled_ms"]) and 420 <= a["stage_settled_ms"] <= 560)
    row(f"{tag}: wave edges vs stage", f"{a['edge_offsets_rel_stage']} ::after {a['wave_after_states']}", "constant", all(len(v) == 1 for v in a["edge_offsets_rel_stage"].values()) and len(a["wave_after_states"]) <= 1)
    row(f"{tag}: running WAAPI anims", a["max_running_anims"], "≤2 (stage+pin)", a["max_running_anims"] <= 2)
    row(f"{tag}: phases (info)", f"{a['phases']}", "leaving→swapping(≈200)→entering(≈240)→idle(≈480)", None)

def summary(R):
    T = R["tests"]; exp = R["expect"]
    L = [f"# Auth slide suite: {R['label']}", "", f"Base {R['base']}, run {R['started']}, expect **{exp}** "
         f"(tab bar removed; inline links only drive the 480 ms panel slide)", "",
         "| Check | Result | Expected | Pass |", "|---|---|---|---|"]
    cnt = {"pass": 0, "fail": 0, "info": 0}
    def row(n, v, e, ok):
        k = "info" if ok is None else ("pass" if ok else "fail"); cnt[k] += 1
        L.append(f"| {n} | {v} | {e} | {'ℹ️' if ok is None else ('✅' if ok else '❌')} |")
    for w in (1280, 1440):
        d = T[f"desktop_{w}"]
        for label, audit in (("signin", d.get("tabs_absent_signin")), ("signup", d.get("tabs_absent_signup"))):
            if audit is None: continue
            row(f"{w} tabs absent ({label})", f"ok={audit['ok']} found={audit.get('found')}", "zero tablist/tabs/indicator", audit["ok"])
        for name in ("signin_to_signup", "signup_to_signin"):
            a = d["link"][name]; tag = f"{w} link {name}"
            if "error" in a:
                row(f"{tag}: trigger", a["error"], "clickable", False); continue
            slide_rows(row, tag, a)
        row(f"{w} scaleX(-1) elements idle", f"signin {d['scaleX_flipped_elements_idle_signin']}, signup {d.get('scaleX_flipped_elements_idle_signup')}", "0", d['scaleX_flipped_elements_idle_signin'] == 0 and d.get('scaleX_flipped_elements_idle_signup') == 0)
        row(f"{w} RSC requests on toggle", d["rsc_requests_on_toggle"], "0", d["rsc_requests_on_toggle"] == 0)
    bh = T["behaviour"]
    ba = bh.get("tabs_absent")
    if ba is not None:
        row("behaviour tabs absent", f"ok={ba['ok']} found={ba.get('found')}", "zero tablist/tabs/indicator", ba["ok"])
    row("focus after in-form link → sign-up", bh["focus_after_inform_link_to_signup"], "signup-name", bh["focus_after_inform_link_to_signup"] == "signup-name")
    row("focus after in-form link → sign-in", bh["focus_after_inform_link_to_signin"], "login-email", bh["focus_after_inform_link_to_signin"] == "login-email")
    rt = bh["rapid_taps"]
    base_ok = rt["url_matches_mode"] and rt["max_forms"] <= 1 and rt["phase"] in ("idle", None) and rt["max_running_anims"] <= 2
    row("5 rapid inline-link taps in ~300 ms", f"{rt}", "settles: URL matches mode, ≤1 form, idle, no stacked anims", base_ok)
    row("rapid taps history entries (info)", rt["history_entries_added"], "≤1 preferred (replaceState); >1 reported", None if rt["history_entries_added"] > 1 else (True if rt["history_entries_added"] <= 1 else None))
    hi = bh["history"]
    row("history entries (one link change)", hi["entries_after_one_change"], "1", hi["entries_after_one_change"] == 1)
    row("same-mode re-click (info)", hi["same_mode_reclick"], "N/A — tab switcher removed", None)
    row("Back: URL and mode in sync", f"{hi['back']['url']} / {hi['back']['mode']}, forms ≤{hi['back']['forms_max']}", "mode=signin / signin, ≤1 form", "mode=signin" in hi["back"]["url"] and hi["back"]["mode"] == "signin" and hi["back"]["forms_max"] <= 1)
    row("Forward: URL and mode in sync", f"{hi['forward']['url']} / {hi['forward']['mode']}, forms ≤{hi['forward']['forms_max']}", "mode=signup / signup, ≤1 form", "mode=signup" in hi["forward"]["url"] and hi["forward"]["mode"] == "signup" and hi["forward"]["forms_max"] <= 1)
    row("Back/Forward behaviour (info)", f"back: {hi['back']['looked_like']} (focus {hi['back']['focus']}), forward: {hi['forward']['looked_like']}", "reported, not judged", None)
    row("RSC on Back/Forward", hi["rsc_requests"], "0", hi["rsc_requests"] == 0)
    row("layout shifts on Back", hi["layout_shifts_on_back"], "[] (value, hadRecentInput)", not hi["layout_shifts_on_back"])
    row("reload ?mode=signup animates?", hi["reload_signup_animated"], "False", not hi["reload_signup_animated"])
    rm = T["reduced_motion"]
    ra = rm.get("tabs_absent")
    if ra is not None:
        row("reduced motion tabs absent", f"ok={ra['ok']} found={ra.get('found')}", "zero tablist/tabs/indicator", ra["ok"])
    for name, expect_mode in (("signin_to_signup", "signup"), ("signup_to_signin", "signin")):
        a = rm.get(name, {})
        if "error" in a: row(f"reduced motion link {name}: trigger", a["error"], "clickable", False); continue
        row(f"reduced motion link {name}: intermediate stage positions", a["intermediate_stage_positions"], "0 (dissolve/instant)", a["intermediate_stage_positions"] == 0)
        row(f"reduced motion link {name}: forms / mode", f"{a['max_forms']} / {a['mode_after']}", f"≤1 / {expect_mode}", a["max_forms"] <= 1 and a["mode_after"] == expect_mode)
    for k in [k for k in T if k.startswith("mobile_")]:
        m = T[k]
        ma = m.get("tabs_absent")
        if ma is not None:
            row(f"{k}: tabs absent", f"ok={ma['ok']} found={ma.get('found')}", "zero tablist/tabs/indicator", ma["ok"])
        row(f"{k}: stage moved", m["stage_x_from_to"], "no slide", bool(m["stage_x_from_to"]) and m["stage_x_from_to"][0] == m["stage_x_from_to"][1])
        row(f"{k}: face fade window", m["face_fade_window_ms"], "≈0–240 ms", bool(m["face_fade_window_ms"]) and m["face_fade_window_ms"][1] <= 300)
        row(f"{k}: forms / wipe", f"{m['max_forms']} / {m['wipe_visible']}", "≤1 / False", m["max_forms"] <= 1 and not m["wipe_visible"])
        row(f"{k}: logo", m["logo_distinct_rects"], "one rect", m["logo_pinned"])
        row(f"{k}: height changed while face visible", m["height_changed_while_visible"], "False", not m["height_changed_while_visible"])
        row(f"{k}: frame deltas", f"max {m['delta_max']}, >20ms {m['frames_over_20ms']}", "none >20", m["frames_over_20ms"] == 0)
    L += ["", f"**{cnt['pass']} pass, {cnt['fail']} fail, {cnt['info']} info** ({cnt['pass'] + cnt['fail']} judged checks)", "", f"Video: {T['video']}"]
    return "\n".join(L) + "\n", cnt

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True); ap.add_argument("--out", required=True); ap.add_argument("--label", default="run")
    ap.add_argument("--expect", choices=["links-only", "links-slide", "tabs-slide"], default="links-only",
                    help="links-only (default): tab bar removed; inline links slide. links-slide/tabs-slide are deprecated aliases.")
    a = ap.parse_args(); asyncio.run(Suite(a.base, a.out, a.label, a.expect).run())
