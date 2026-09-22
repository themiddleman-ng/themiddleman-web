import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileTabBar from "@/components/layout/MobileTabBar";
import CookieNotice from "@/components/legal/CookieNotice";

const SITE_URL = "https://themiddleman.com.ng";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Middleman | Buy and Sell Digital Work Safely",
    template: "%s | The Middleman",
  },
  description:
    "Discover verified Nigerian creators, buy digital products and services, and keep payments protected through escrow until delivery is approved.",
  applicationName: "The Middleman",
  keywords: [
    "Nigeria digital marketplace",
    "escrow marketplace",
    "digital products Nigeria",
    "verified Nigerian creators",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "The Middleman",
    title: "The Middleman | Buy and Sell Digital Work Safely",
    description:
      "Verified Nigerian creators, clear prices, and escrow-protected payments from order to delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Middleman | Buy and Sell Digital Work Safely",
    description:
      "Verified Nigerian creators, clear prices, and escrow-protected payments from order to delivery.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/brand/app-icon.png", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="ltr" lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink text-bone">
        {children}
        <CookieNotice />
        <MobileTabBar />
      </body>
    </html>
  );
}
