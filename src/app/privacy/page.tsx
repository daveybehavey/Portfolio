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
    "How EuroDigital handles analytics and contact on eurodigital.ca.",
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
              Simple and minimal.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              This site is a static portfolio for EuroDigital ({SITE_URL}).
              There are no accounts and no comment forms stored on this server.
            </p>

            <h2 className="mt-10 text-xl font-semibold text-slate-900">
              Contact
            </h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              When you use the contact form or email link, your message is sent
              through your own email app to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                {CONTACT_EMAIL}
              </a>
              . I do not store form submissions on this server.
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
                      contact actions they use (aggregate traffic and button
                      events — not ad personalization).{" "}
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
                      for lightweight, cookie-free visit counts.{" "}
                    </>
                  ) : null}
                  You can block these scripts with a browser extension or
                  privacy settings if you prefer.
                </>
              ) : (
                "This deployment does not load third-party analytics scripts."
              )}
            </p>

            <h2 className="mt-10 text-xl font-semibold text-slate-900">
              Hosting
            </h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              The site is hosted on Cloudflare Pages. Cloudflare may process
              technical request data (IP address, user agent) as part of
              delivering the site and protecting it from abuse.
            </p>

            <h2 className="mt-10 text-xl font-semibold text-slate-900">
              Questions
            </h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              if anything here should be clearer.
            </p>

            <p className="mt-10 text-sm text-slate-500">
              <Link
                href="/"
                className="font-medium text-slate-700 hover:text-slate-900"
              >
                ← Back to home
              </Link>
            </p>
          </article>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
