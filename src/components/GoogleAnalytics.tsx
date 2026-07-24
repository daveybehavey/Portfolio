import Script from "next/script";
import { GA_MEASUREMENT_ID, isGaEnabled } from "@/lib/analytics";

/**
 * Google Analytics 4 (optional). Set NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
 * Dashboard → Admin → Data streams → Web → Measurement ID
 */
export function GoogleAnalytics() {
  if (!isGaEnabled()) return null;

  const id = GA_MEASUREMENT_ID;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('config', '${id}', {
            send_page_view: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
