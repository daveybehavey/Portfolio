"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { observeLocation } from "@/lib/lead-attribution";

/**
 * Records in-memory landing path, UTMs, CTA query params, and referrer
 * across client navigations. No cookies or localStorage.
 */
function AttributionObserverInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    observeLocation({
      pathname: pathname || "/",
      search: searchParams?.toString() ? `?${searchParams.toString()}` : "",
      documentReferrer:
        typeof document !== "undefined" ? document.referrer : "",
    });
  }, [pathname, searchParams]);

  return null;
}

export function AttributionCapture() {
  return (
    <Suspense fallback={null}>
      <AttributionObserverInner />
    </Suspense>
  );
}
