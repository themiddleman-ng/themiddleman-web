import type { CardGig } from "@/components/marketplace/GigCard";

/** Read-only sample listings used when the app has no database, plus one in-code example. */
const sampleSeller = { display_name: "Sample seller", verification_status: "sample" };
const exampleListing = { display_name: "Example listing", verification_status: "sample" };

export const EXAMPLE_HELLO_WORLD_ID = "preview-hello-world";

export function withHelloWorldExample<T extends { id: string }>(rows: T[]): T[] {
  const example = DESIGN_PREVIEW_GIGS.find((item) => item.id === EXAMPLE_HELLO_WORLD_ID);
  if (!example || rows.some((row) => row.id === example.id)) return rows;
  return [example as unknown as T, ...rows];
}

export const DESIGN_PREVIEW_GIGS: Array<CardGig & { created_at: string }> = [
  {
    id: EXAMPLE_HELLO_WORLD_ID,
    title: "Hello World example",
    description: "A free example you can run in the browser and download. It prints Hello World. This is not a real seller, not a sale, and checkout stays paused.",
    category: "development",
    price_ngn: 0,
    is_ai_assisted: false,
    gallery_image_paths: ["/examples/hello-world/cover.png"],
    created_at: "2026-11-07T00:00:00.000Z",
    seller_profiles: exampleListing,
  },
  {
    id: "preview-invoice-tracker",
    title: "Invoice & Expense Tracker",
    description: "A spreadsheet template for a Nigerian small business: Naira invoices, expense categories, and a simple monthly summary. Edit it in Excel or Google Sheets.",
    category: "development",
    price_ngn: 8500,
    is_ai_assisted: false,
    gallery_image_paths: ["/images/listings/invoice-tracker.webp"],
    created_at: "2026-10-15T14:00:00.000Z",
    seller_profiles: sampleSeller,
  },
  {
    id: "preview-landing-page-kit",
    title: "Business Landing Page Kit",
    description: "A one-page website template for a Lagos service business, with sections for the offer, proof of work you add yourself, and a WhatsApp contact link.",
    category: "development",
    price_ngn: 25000,
    is_ai_assisted: false,
    gallery_image_paths: ["/images/listings/landing-page-kit.webp"],
    created_at: "2026-10-14T14:00:00.000Z",
    seller_profiles: sampleSeller,
  },
  {
    id: "preview-social-brand-pack",
    title: "Social Media Brand Pack",
    description: "Editable Instagram and WhatsApp status templates: post sizes, a colour sheet, and caption space for a Nigerian brand.",
    category: "design",
    price_ngn: 12000,
    is_ai_assisted: false,
    gallery_image_paths: ["/images/listings/social-brand-pack.webp"],
    created_at: "2026-10-13T14:00:00.000Z",
    seller_profiles: sampleSeller,
  },
  {
    id: "preview-student-planner",
    title: "Student Planner",
    description: "A semester planner for Nigerian university students: lecture timetable, assignment dates, and a weekly study page. A printable and editable file.",
    category: "writing",
    price_ngn: 4000,
    is_ai_assisted: false,
    gallery_image_paths: ["/images/listings/student-planner.webp"],
    created_at: "2026-10-12T14:00:00.000Z",
    seller_profiles: sampleSeller,
  },
  {
    id: "preview-restaurant-menu",
    title: "Restaurant Menu Template",
    description: "An editable menu layout for a bukka or small restaurant, with room for Naira prices, dishes, and a short note about opening hours.",
    category: "design",
    price_ngn: 6500,
    is_ai_assisted: false,
    gallery_image_paths: ["/images/listings/menu-template.webp"],
    created_at: "2026-10-11T14:00:00.000Z",
    seller_profiles: sampleSeller,
  },
  {
    id: "preview-storefront-kit",
    title: "Storefront Starter Kit",
    description: "A product-catalogue template for a small shop that sells on WhatsApp: item cards, Naira prices, and a simple order note the buyer can copy.",
    category: "development",
    price_ngn: 32000,
    is_ai_assisted: false,
    gallery_image_paths: ["/images/listings/storefront-kit.webp"],
    created_at: "2026-10-10T14:00:00.000Z",
    seller_profiles: sampleSeller,
  },
];
