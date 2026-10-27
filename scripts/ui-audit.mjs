#!/usr/bin/env node
/**
 * Read-only UI audit: contrast samples, tap targets, horizontal overflow.
 * Run against `pnpm build && pnpm start` locally (default http://127.0.0.1:3000).
 */
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";

const BASE = process.env.UI_AUDIT_BASE_URL || "http://127.0.0.1:3000";
const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const ROUTES = [
  "/",
  "/marketplace",
  "/browse",
  "/about",
  "/signup?mode=signin",
  "/gigs/new",
  "/messages",
  "/orders",
  "/profile",
  "/settings",
  "/admin",
  "/design-review",
  "/legal/terms",
  "/sellers/00000000-0000-4000-8000-000000000001",
];

async function auditPage(page, route, viewport) {
  const issues = [];
  await page.setViewportSize(viewport);
  const response = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  if (!response || response.status() >= 500) {
    issues.push({ type: "http", detail: `status ${response?.status() ?? "no response"}` });
    return issues;
  }
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const active = doc.scrollWidth > doc.clientWidth + 1;
    if (!active) return { active: false, culprits: [] };
    const vw = doc.clientWidth;
    const culprits = [];
    for (const el of document.querySelectorAll("*")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right > vw + 1 || rect.left < -1) {
        const id = el.id ? `#${el.id}` : "";
        const cls =
          el.className && typeof el.className === "string"
            ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}`
            : "";
        culprits.push({
          tag: el.tagName,
          sel: id || cls || el.tagName,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
    }
    culprits.sort((a, b) => b.right - a.right);
    return { active: true, culprits: culprits.slice(0, 6) };
  });
  if (overflow.active) {
    issues.push({ type: "overflow", detail: "horizontal scroll detected", culprits: overflow.culprits });
  }

  const smallTargets = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("a,button,[role='button'],[role='menuitem']")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.width < 44 || rect.height < 44) {
        const label = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40);
        bad.push({ w: Math.round(rect.width), h: Math.round(rect.height), label });
      }
    }
    return bad.slice(0, 12);
  });
  if (smallTargets.length) issues.push({ type: "tap", detail: smallTargets });

  const lowContrast = await page.evaluate(() => {
    const samples = [];
    const pick = (sel) => document.querySelector(sel);
    const nodes = [
      pick("main"),
      pick("header"),
      pick("nav"),
    ].filter(Boolean);
    for (const node of nodes) {
      const style = getComputedStyle(node);
      const fg = style.color;
      const bg = style.backgroundColor;
      if (fg && bg) samples.push({ fg, bg, tag: node.tagName });
    }
    return samples;
  });
  issues.push({ type: "contrast-sample", detail: lowContrast });
  return issues;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const report = { base: BASE, generatedAt: new Date().toISOString(), routes: {} };

  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      const key = `${vp.name}:${route}`;
      try {
        report.routes[key] = await auditPage(page, route, vp);
      } catch (error) {
        report.routes[key] = [{ type: "error", detail: String(error) }];
      }
    }
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
