#!/usr/bin/env node
/**
 * Walk /admin routes on a local Next build. Requires UI_AUDIT_BASE_URL (default http://127.0.0.1:3000).
 */
import { chromium } from "playwright";

const BASE = process.env.UI_AUDIT_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_ROUTES = [
  "/admin",
  "/admin/products",
  "/admin/sellers",
  "/admin/review",
  "/admin/escrow",
  "/admin/communications",
  "/admin/email-preview",
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = [];

for (const route of ADMIN_ROUTES) {
  const response = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  const status = response?.status() ?? 0;
  const title = await page.title();
  const hasSignIn = await page.getByRole("link", { name: /sign in/i }).isVisible().catch(() => false);
  report.push({ route, status, title, likelyGuest: hasSignIn });
}

await browser.close();
console.log(JSON.stringify({ base: BASE, routes: report }, null, 2));
