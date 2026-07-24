import Script from "next/script";

/**
 * Optional privacy-friendly analytics (Cloudflare Web Analytics).
 * Add NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN to .env.local — token from
 * Cloudflare dashboard → Web Analytics → Add a site → eurodigital.ca
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN?.trim();
  if (!token) return null;

  return (
    <Script
      id="cf-web-analytics"
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
