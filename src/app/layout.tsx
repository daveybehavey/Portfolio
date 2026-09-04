import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AttributionCapture } from "@/components/AttributionCapture";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_E164,
  SITE_DESCRIPTION,
  SITE_URL,
  defaultOpenGraph,
} from "@/lib/site";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EuroDigital — Websites and growth systems for local businesses",
    template: "%s — EuroDigital",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    ...defaultOpenGraph,
    title: "EuroDigital — Websites and growth systems for local businesses",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EuroDigital — Small business website launches",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EuroDigital — Websites and growth systems for local businesses",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "EuroDigital",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/logo.png`,
        image: `${SITE_URL}/og-image.png`,
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE_E164,
        areaServed: [
          "Victoria",
          "Vancouver Island",
          "British Columbia",
          "Canada",
        ],
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "EuroDigital",
        description:
          "EuroDigital — websites, search foundations, analytics, and practical growth systems for Victoria and Vancouver Island businesses.",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-CA",
      },
    ],
  };

  return (
    <html lang="en-CA" className={sans.variable}>
      <body className="font-sans antialiased">
        <AttributionCapture />
        {children}
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
