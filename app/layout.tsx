import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileTabBar from "@/components/layout/MobileTabBar";
import CookieNotice from "@/components/legal/CookieNotice";
import FirstRunExperience from "@/components/onboarding/FirstRunExperience";
import DesignFrame from "@/components/design/DesignFrame";
import SignedInToast from "@/components/feedback/SignedInToast";
import "./product-design.css";

const SITE_URL = "https://themiddleman.com.ng";
const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "The Middleman",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/app-icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "The Middleman",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-NG",
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Middleman | Nigerian Digital Products Marketplace",
    template: "%s | The Middleman",
  },
  description:
    "Browse ready-made digital products from independent Nigerian creators. Review listing details and pay in Naira through Paystack.",
  applicationName: "The Middleman",
  keywords: [
    "Nigeria digital marketplace",
    "digital products Nigeria",
    "Nigerian creators",
    "templates and creative resources",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "The Middleman",
    title: "The Middleman | Nigerian Digital Products Marketplace",
    description:
      "Find ready-made digital products from Nigerian creators. Review listing details and pay in Naira through Paystack.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Middleman | Nigerian Digital Products Marketplace",
    description:
      "Find ready-made digital products from Nigerian creators. Browse, compare listing details and pay in naira through Paystack.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <DesignFrame>{children}</DesignFrame>
        <SignedInToast />
        <FirstRunExperience />
        <CookieNotice />
        <MobileTabBar />
      </body>
    </html>
  );
}
