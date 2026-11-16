#!/usr/bin/env python3
"""One-off: 5 rapid inline-link taps within 200ms under NORMAL motion. Read-only."""
import asyncio, json, os, time
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://127.0.0.1:3491")
OUT = os.environ.get("OUT", "/workspace/middleman-motion/auth-fix/runs/50ed8b4-rapid-tap-200ms")
SHA = "50ed8b43ceb8382ccb4263af79229eff2a354e4c"
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")

# Sync in-page clicks: no Playwright actionability waits between taps.
# Alternate sequence as asked; only currently-mounted switch buttons can hit.
# Also spam the visible switch link 5x so we actually invoke the handler 5 times inside the lock window.
EVAL_ALTERNATE = r"""
() => {
  const seq = ['create an account', 'log in', 'create an account', 'log in', 'create an account'];
  const find = (label) => {
    const alts = label === 'log in'
      ? [/^\s*log in\s*$/i, /^\s*sign in\s*$/i]
      : [/^\s*create an account\s*$/i];
    return [...document.querySelectorAll('main.mm-auth button[type=button]')]
      .find(b => alts.some(r => r.test((b.textContent || '').trim())));
  };
  const hist0 = history.length;
  const mode0 = document.querySelector('main.mm-auth')?.dataset.mode;
  const phase0 = document.querySelector('main.mm-auth')?.dataset.phase;
  const t0 = performance.now();
  const clicks = [];
  for (const label of seq) {
    const btn = find(label);
    if (btn) {
      btn.click();
      clicks.push({ label, hit: true, t_ms: +(performance.now() - t0).toFixed(2),
        phase_after: document.querySelector('main.mm-auth')?.dataset.phase,
        run_phase: undefined });
    } else {
      clicks.push({ label, hit: false, t_ms: +(performance.now() - t0).toFixed(2) });
    }
  }
  const elapsed = performance.now() - t0;
  return {
    kind: 'alternate',
    elapsed_ms: +elapsed.toFixed(2),
    hist0, mode0, phase0,
    hist_immediate: history.length,
    mode_immediate: document.querySelector('main.mm-auth')?.dataset.mode,
    phase_immediate: document.querySelector('main.mm-auth')?.dataset.phase,
    url_immediate: location.search,
    clicks,
    hits: clicks.filter(c => c.hit).length,
  };
}
"""

EVAL_SPAM_VISIBLE = r"""
() => {
  const findAny = () => [...document.querySelectorAll('main.mm-auth button[type=button]')]
    .find(b => /^\s*(create an account|log in|sign in)\s*$/i.test((b.textContent || '').trim()));
  const hist0 = history.length;
  const mode0 = document.querySelector('main.mm-auth')?.dataset.mode;
  const t0 = performance.now();
  const clicks = [];
  for (let i = 0; i < 5; i++) {
    const btn = findAny();
    const label = btn ? (btn.textContent || '').trim() : null;
    if (btn) {
      btn.click();
      clicks.push({ i, label, hit: true, t_ms: +(performance.now() - t0).toFixed(2),
        phase_after: document.querySelector('main.mm-auth')?.dataset.phase });
    } else {
      clicks.push({ i, label: null, hit: false, t_ms: +(performance.now() - t0).toFixed(2) });
    }
  }
  const elapsed = performance.now() - t0;
  return {
    kind: 'spam_visible',
    elapsed_ms: +elapsed.toFixed(2),
    hist0, mode0,
    hist_immediate: history.length,
    mode_immediate: document.querySelector('main.mm-auth')?.dataset.mode,
    phase_immediate: document.querySelector('main.mm-auth')?.dataset.phase,
    url_immediate: location.search,
    clicks,
    hits: clicks.filter(c => c.hit).length,
  };
}
"""

# Also try calling switchMode alternating via React props onClick when button missing —
# extract onClick from the single visible switch button, then we can only call one direction.
# For true alternating handler calls without opposite DOM, read both directions from fiber of previous... skip.

SETTLE_EVAL = r"""
() => ({
  mode: document.querySelector('main.mm-auth')?.dataset.mode,
  phase: document.querySelector('main.mm-auth')?.dataset.phase,
  url: location.search,
  href: location.href,
  hist: history.length,
  forms: document.querySelectorAll('.mm-auth form').length,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  desktop: matchMedia('(min-width: 768px)').matches,
})
"""

async def run_case(browser, name, eval_src):
  ctx = await browser.new_context(
    viewport={"width": 1440, "height": 900},
    color_scheme="dark",
    # CRITICAL: do NOT emulate prefers-reduced-motion
  )
  # Explicitly ensure no reduced motion override
  page = await ctx.new_page()
  await page.add_init_script("""
    // Do not force reduce; leave as browser default (no-preference in headless chrome)
  """)
  await page.goto(f"{BASE}/signup?mode=signin", wait_until="networkidle")
  await page.wait_for_selector("main.mm-auth")
  # Confirm reduced motion OFF
  pref = await page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
  # Wait idle
  await page.wait_for_function("() => document.querySelector('main.mm-auth')?.dataset.phase === 'idle'")
  await page.wait_for_timeout(200)
  before = await page.evaluate(SETTLE_EVAL)
  burst = await page.evaluate(eval_src)
  await page.wait_for_timeout(1500)
  after = await page.evaluate(SETTLE_EVAL)
  after["history_entries_added"] = after["hist"] - burst["hist0"]
  result = {
    "name": name,
    "reduced_motion": pref,
    "before": before,
    "burst": burst,
    "after": after,
    "elapsed_ms": burst["elapsed_ms"],
    "within_200ms": burst["elapsed_ms"] <= 200,
    "history_entries_added": after["history_entries_added"],
  }
  await ctx.close()
  return result

async def main():
  os.makedirs(OUT, exist_ok=True)
  async with async_playwright() as p:
    browser = await p.chromium.launch(executable_path=CHROME, headless=True,
      args=["--disable-dev-shm-usage"])
    # Primary: alternate sequence as Logic Analyst asked
    alt = await run_case(browser, "alternate_5", EVAL_ALTERNATE)
    # Secondary: 5 handler invocations on the visible link (stronger lock stress)
    spam = await run_case(browser, "spam_visible_5", EVAL_SPAM_VISIBLE)
    await browser.close()
  report = {
    "sha": SHA,
    "base": BASE,
    "viewport": "1440x900",
    "color_scheme": "dark",
    "reduced_motion": False,
    "primary_alternate": alt,
    "secondary_spam_visible": spam,
    "note": (
      "Only one switch link is mounted at a time (mode ternary). "
      "Alternate sequence can only hit the currently visible label until swap (~200ms); "
      "spam_visible fires 5 real button.click() handler calls inside the lock window."
    ),
  }
  path = f"{OUT}/rapid_tap_stress.json"
  with open(path, "w") as f:
    json.dump(report, f, indent=2)
  # short summary
  summary = f"""# Rapid-tap lock stress — {SHA[:7]}

Reduced motion: OFF (normal). Viewport 1440×900 dark. Base {BASE}

## Primary (alternate create/log-in/create/log-in/create)
- elapsed_ms: {alt['elapsed_ms']}
- within_200ms: {alt['within_200ms']}
- hits: {alt['burst']['hits']}/5
- history_entries_added: {alt['history_entries_added']}
- final: mode={alt['after']['mode']} phase={alt['after']['phase']} url={alt['after']['url']} forms={alt['after']['forms']}
- clicks: {json.dumps(alt['burst']['clicks'])}

## Secondary (spam visible switch link ×5 — 5 real handler calls)
- elapsed_ms: {spam['elapsed_ms']}
- within_200ms: {spam['within_200ms']}
- hits: {spam['burst']['hits']}/5
- history_entries_added: {spam['history_entries_added']}
- final: mode={spam['after']['mode']} phase={spam['after']['phase']} url={spam['after']['url']} forms={spam['after']['forms']}
- clicks: {json.dumps(spam['burst']['clicks'])}
"""
  with open(f"{OUT}/SUMMARY.md", "w") as f:
    f.write(summary)
  print(summary)
  print("wrote", path)

asyncio.run(main())
