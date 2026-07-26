import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { SiteFooter } from "@/components/SiteFooter";
import { isGaEnabled } from "@/lib/analytics";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How EuroDigital handles contact inquiries, spam protection, analytics, and hosting on eurodigital.ca.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const cfAnalyticsEnabled = Boolean(
    process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN?.trim(),
  );
  const gaAnalyticsEnabled = isGaEnabled();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <PageBackground />
      <SkipLink />
      <SiteHeader />

      <main id="main-content" className="relative z-10 flex-1 py-16 sm:py-20">
        <Container>
          <article className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Privacy
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Simple, limited, and explained.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              EuroDigital ({SITE_URL}) does not provide visitor accounts or keep a
              customer database on the public website. Static pages remain static;
              only the inquiry endpoint performs server-side processing.
            </p>

            <h2 className="mt-10 text-xl font-semibold text-slate-900">
              Contact inquiries
            </h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              You can always email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              directly. When the online form is enabled, it sends the name, email
              address, business or industry, selected project type, message, and a
              random submission identifier to a narrow Cloudflare Pages Function.
              The visitor&apos;s email address is used as the reply-to address and is
              never accepted as the trusted sender address.
            </p>

            <h2 className="mt-10 text-xl font-semibold text-slate-900">
              Spam protection and email delivery
            </h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              The form uses{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                className="font-medium text-indigo-600 hover:text-indigo-700"
                rel="noopener noreferrer"
                target="_blank"
              >
                Cloudflare Turnstile
              </a>{" "}
              to check whether a submission appears legitimate. The server sends
              the Turnstile token and technical request information, which may
              include an IP address, to Cloudflare for validation. A valid token is
              required before the message is delivered.
            </p>
            <p className="mt-3 leading-relaxed text-slate-700">
              Valid inquiries are sent through{" "}
              <a
                href="https://resend.com/legal/privacy-policy"
                className="font-medium text-indigo-600 hover:text-indigo-700"
                rel="noopener noreferrer"
                target="_blank"
              >
                Resend
              </a>{" "}
              to {CONTACT_EMAIL}. EuroDigital does not write inquiry contents to a
              website database. The message is retained in the receiving mailbox,
              and Cloudflare or Resend may retain operational records according to
              their services, account settings, and legal obligations.
            </p>

            <h2 className="mt-10 text-xl font-semibold text-slate-900">
              Analytics
            </h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              {gaAnalyticsEnabled || cfAnalyticsEnabled ? (
                <>
                  {gaAnalyticsEnabled ? (
                    <>
                      I use{" "}
                      <a
                        href="https://support.google.com/analytics/answer/11593727"
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Google Analytics 4
                      </a>{" "}
                      to understand how people find the site and which pages and
                      contact actions they use (aggregate traffic and button events
                      — not ad personalization).{" "}
                    </>
                  ) : null}
                  {cfAnalyticsEnabled ? (
                    <>
                      {gaAnalyticsEnabled ? "I also use " : "I use "}
                      <a
                        href="https://www.cloudflare.com/web-analytics/"
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Cloudflare Web Analytics
                      </a>{" "}
                      for lightweight, cookie-free visit counts.{" 