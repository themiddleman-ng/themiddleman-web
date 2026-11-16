#!/usr/bin/env node
/**
 * Playwright contrast + tap-target audit for UI8 round 5.
 * Usage: node scripts/ui8-design-audit.mjs [baseURL]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:3000";
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
const THEMES = ["light", "dark"];
const PAGES = [
  "/",
  "/signup?mode=signin",
  "/marketplace",
  "/gigs/preview-invoice-tracker",
  "/design-review?screen=product-detail",
  "/design-review?screen=admin",
  "/design-review?screen=messages",
  "/design-review?screen=order-details",
  "/design-review?screen=marketplace",
  "/about",
];

function parseRgb(color) {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
  if (parts.length === 3) return [...parts, 1];
  if (parts.length === 4) return parts;
  return null;
}

function luminance([r, g, b]) {
  const a = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(fg, bg) {
  const L1 = luminance(fg);
  const L2 = luminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function dismissCookieBanner(page) {
  const accept = page.getByRole("button", { name: /accept all/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => {
    document.querySelectorAll("[data-cookie-notice], #cookie-notice, [class*='CookieNotice']").forEach((el) => el.remove());
  });
}

async function auditPage(page, path, viewport, theme) {
  await page.setViewportSize(viewport);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.evaluate((t) => {
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
  await dismissCookieBanner(page);

  const contrastFails = await page.evaluate(() => {
    const fails = [];
    const isLogo = (el) => {
      if (el.closest(".logo-fixed, .logo-responsive, [class*='Logo'], img[src*='brand'], [class*='text-logo'], header a[href='/']")) return true;
      if (el.classList?.contains("text-logo-orange") || el.classList?.contains("text-logo-blue")) return true;
      return false;
    };
    const bgFor = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        const rgba = bg.match(/rgba?\(([^)]+)\)/);
        if (rgba) {
          const parts = rgba[1].split(",").map((p) => parseFloat(p.trim()));
          const alpha = parts.length === 4 ? parts[3] : 1;
          if (alpha > 0.05 && bg !== "rgba(0, 0, 0, 0)") return bg;
        }
        node = node.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const text = n.textContent?.trim();
      if (!text) continue;
      const el = n.parentElement;
      if (!el || isLogo(el)) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
      const fg = style.color;
      const bg = bgFor(el);
      function parseRgbLocal(color) {
        const m = color.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
        if (parts.length === 3) return parts;
        if (parts.length === 4 && parts[3] === 0) return null;
        if (parts.length === 4) return parts.slice(0, 3);
        return null;
      }
      function lin(v) {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      }
      const fgP = parseRgbLocal(fg);
      const bgP = parseRgbLocal(bg);
      if (!fgP || !bgP) continue;
      const L1 = 0.2126 * lin(fgP[0]) + 0.7152 * lin(fgP[1]) + 0.0722 * lin(fgP[2]);
      const L2 = 0.2126 * lin(bgP[0]) + 0.7152 * lin(bgP[1]) + 0.0722 * lin(bgP[2]);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      if (el.classList?.contains("text-ember") && el.closest("h1, h2, .font-display")) continue;
      if (ratio < 4.5) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        fails.push({
          text: text.slice(0, 60),
          ratio: Math.round(ratio * 100) / 100,
          fg,
          bg,
          selector: el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(" ")[0]}` : ""),
        });
      }
    }
    return fails;
  });

  const tapFails = await page.evaluate(() => {
    const sel =
      'a, button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';
    const fails = [];
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest("footer, [role='dialog']")) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (el.type === "file" && (style.opacity === "0" || el.tabIndex === -1)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 && rect.height < 1) continue;
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.width <= 1 && rect.height <= 1) continue;
      if (style.pointerEvents === "none") continue;
      const tabIndex = el.getAttribute("tabindex");
      if (tabIndex === "-1") continue;
      if (rect.width < 44 || rect.height < 44) {
        const label =
          el.getAttribute("aria-label") ||
          el.getAttribute("placeholder") ||
          el.textContent?.trim().slice(0, 40) ||
          el.tagName;
        fails.push({
          label,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          tag: el.tagName.toLowerCase(),
        });
      }
    }
    return fails;
  });

  return { contrastFails, tapFails };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "themiddleman-cookie-preferences-v2",
      JSON.stringify({ essential: true, optionalAnalytics: false }),
    );
    window.localStorage.setItem("themiddleman-cookie-notice-v1", "dismissed");
  });
  const page = await context.newPage();

  const summary = {
    contrastFailures: 0,
    tapFailures: 0,
    samples: [],
  };

  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      for (const path of PAGES) {
        try {
          const { contrastFails, tapFails } = await auditPage(page, path, viewport, theme);
          summary.contrastFailures += contrastFails.length;
          summary.tapFailures += tapFails.length;
          if (contrastFails.length || tapFails.length) {
            summary.samples.push({
              path,
              theme,
              viewport: `${viewport.width}x${viewport.height}`,
              contrastFails: contrastFails.slice(0, 8),
              tapFails: tapFails.slice(0, 8),
            });
          }
        } catch (err) {
          summary.samples.push({
            path,
            theme,
            viewport: `${viewport.width}x${viewport.height}`,
            error: String(err),
          });
        }
      }
    }
  }

  await browser.close();
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.contrastFailures + summary.tapFailures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
