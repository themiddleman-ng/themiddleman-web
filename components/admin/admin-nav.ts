export type AdminNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  mobileTab?: "overview" | "products" | "sellers" | "more";
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", mobileTab: "overview" },
  { href: "/admin/products", label: "Products", mobileTab: "products" },
  { href: "/admin/sellers", label: "Sellers", mobileTab: "sellers" },
  { href: "/admin/review", label: "Delivery reviews" },
  { href: "/admin/escrow", label: "Escrow" },
  { href: "/admin/communications", label: "Communications" },
  { href: "/admin/email-preview", label: "Email previews" },
];

export function adminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}
