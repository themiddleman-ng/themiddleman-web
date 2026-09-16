import type { Metadata } from "next";
import "./globals.css";
import MobileTabBar from "@/components/layout/MobileTabBar";

export const metadata: Metadata = {
  title: "The Middleman",
  description: "Verified digital products and code, escrow-backed, Nigeria-wide.",
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/brand/app-icon.png", type: "image/png" },
    ],
  },
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
        <MobileTabBar />
      </body>
    </html>
  );
}
