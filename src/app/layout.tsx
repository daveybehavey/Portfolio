import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_URL, defaultOpenGraph } from "@/lib/site";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EuroDigital — Island websites & apps",
    template: "%s — EuroDigital"
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    ...defaultOpenGraph,
    title: "EuroDigital — Island websites & apps",
    description: SITE_DESCRIPTION,
    url: SITE_URL
  },
  twitter: {
    card: "summary_large_image",
    title: "EuroDigital — Island websites & apps",
    description: SITE_DESCRIPTION
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
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
        email: CONTACT_EMAIL,
        areaServed: ["Vancouver Island", "British Columbia", "Canada"],
        description: SITE_DESCRIPTION
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "EuroDigital",
        description:
          "Official EuroDigital portfolio — project samples, services, and inquiries for Vancouver Island businesses.",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-CA"
      }
    ]
  };

  return (
    <html lang="en-CA" className={sans.variable}>
      <body className="font-sans antialiased">
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
