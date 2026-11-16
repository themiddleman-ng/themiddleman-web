"""Read-only contrast probe for the auth panel: logo + hero text vs panel background, both modes, 1440.
Usage: python3 contrast_probe.py --base http://localhost:PORT --out file.json"""
import argparse, asyncio, json
from playwright.async_api import async_playwright
JS = r"""() => {
 const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.slice(0,4).map(Number) : null; };
 const lum = ([r,g,b]) => { const f=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4}; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
 const cr = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return +((x+.05)/(y+.05)).toFixed(2); };
 const stage = document.querySelector('.mm-auth-stage') || document.querySelector('.mm-auth-hero');
 let bg = null; for (let e = stage; e && !bg; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && (c[3] ?? 1) > 0) bg = c; }
 const sr = stage.getBoundingClientRect();
 const out = {panelBg: bg, text: [], logo: []};
 for (const el of stage.querySelectorAll('p, h1, h2, span')) {
   const r = el.getBoundingClientRect(); if (!r.width || !el.textContent.trim() || !el.checkVisibility({opacityProperty:true})) continue;
   const c = rgb(getComputedStyle(el).color); out.text.push({t: el.textContent.trim().slice(0,40), color: c, contrast: cr(c, bg), px: getComputedStyle(el).fontSize});
 }
 for (const el of document.querySelectorAll('.mm-auth svg, .mm-auth img')) {
   const r = el.getBoundingClientRect(); if (!r.width || !el.checkVisibility({opacityProperty:true})) continue;
   const cx = r.x + r.width/2, cy = r.y + r.height/2; if (cx < sr.left || cx > sr.right || cy < sr.top || cy > sr.bottom) continue;
   const fills = [...new Set([...el.querySelectorAll('*'), el].map(n => getComputedStyle(n).fill).filter(f => f && f !== 'none'))];
   out.logo.push({tag: el.tagName, src: el.getAttribute('src'), rect: [r.x, r.y, r.width, r.height].map(Math.round), fills: fills.map(f => ({f, contrast: rgb(f) ? cr(rgb(f), bg) : null}))});
 }
 return out; }"""
async def main(a):
    res = {}
    async with async_playwright() as p:
        import sys; sys.path.insert(0, "/workspace/middleman-motion/auth-fix/harness"); from authslide_suite import CHROME; b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={"width":1440,"height":900}, color_scheme="dark")
        await c.route(lambda u: not u.startswith(a.base), lambda r: r.abort())
        pg = await c.new_page()
        for mode in ("signin", "signup"):
            await pg.goto(f"{a.base}/signup?mode={mode}", wait_until="networkidle"); await pg.wait_for_timeout(800)
            res[mode] = await pg.evaluate(JS)
            await pg.screenshot(path=a.out.replace(".json", f"_{mode}.png"))
        await b.close()
    json.dump(res, open(a.out, "w"), indent=1); print(json.dumps(res, indent=1)[:6000])
ap = argparse.ArgumentParser(); ap.add_argument("--base"); ap.add_argument("--out"); asyncio.run(main(ap.parse_args()))
