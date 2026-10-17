import assert from "node:assert/strict";
import test from "node:test";
import { filterListings, filterThreads, matchesPrice } from "../lib/design-preview/filters.mjs";

const listings = [
  ["Invoice & Expense Tracker", "Ada Studio", "₦8,500", "development"],
  ["Business Landing Page Kit", "Tobi Builds", "₦25,000", "development"],
  ["Social Media Brand Pack", "Nneka Design", "₦12,000", "design"],
  ["Student Planner", "Ife Tools", "₦4,000", "writing"],
  ["Restaurant Menu Template", "Kemi Studio", "₦6,500", "design"],
  ["Storefront Starter Kit", "Dev Kole", "₦32,000", "development"],
];

test("price ranges include the boundaries buyers expect", () => {
  assert.equal(matchesPrice(4999, "Under ₦5,000"), true);
  assert.equal(matchesPrice(5000, "Under ₦5,000"), false);
  assert.equal(matchesPrice(5000, "₦5,000 – ₦10,000"), true);
  assert.equal(matchesPrice(10000, "₦5,000 – ₦10,000"), true);
  assert.equal(matchesPrice(10000, "₦10,000 – ₦25,000"), true);
  assert.equal(matchesPrice(25001, "Over ₦25,000"), true);
  assert.equal(matchesPrice(25000, "Over ₦25,000"), false);
  assert.equal(matchesPrice(1, "Any price"), true);
});

test("marketplace filters combine search, category, price, and sort", () => {
  const underTen = filterListings(listings, { price: "Under ₦5,000" }).map((item) => item[0]);
  assert.deepEqual(underTen, ["Student Planner"]);

  const design = filterListings(listings, { category: "design", sort: "Price: low to high" }).map((item) => item[0]);
  assert.deepEqual(design, ["Restaurant Menu Template", "Social Media Brand Pack"]);

  const searched = filterListings(listings, { query: " ada ", category: "development" }).map((item) => item[0]);
  assert.deepEqual(searched, ["Invoice & Expense Tracker"]);

  const expensive = filterListings(listings, { price: "Over ₦25,000", sort: "Price: high to low" }).map((item) => item[2]);
  assert.deepEqual(expensive, ["₦32,000"]);
});

test("conversation search matches the person, product, or latest line", () => {
  const threads = [
    { name: "Ada Studio", product: "Invoice & Expense Tracker", preview: "Thanks! I’ll send a preview" },
    { name: "Tobi Builds", product: "Business Landing Page Kit", preview: "Sounds good" },
    { name: "Nneka Design", product: "Social Media Brand Pack", preview: "Final file" },
  ];
  assert.equal(filterThreads(threads, "tobi").length, 1);
  assert.equal(filterThreads(threads, "brand").length, 1);
  assert.equal(filterThreads(threads, "preview")[0].name, "Ada Studio");
  assert.equal(filterThreads(threads, "   ").length, 3);
  assert.equal(filterThreads(threads, "missing").length, 0);
});
