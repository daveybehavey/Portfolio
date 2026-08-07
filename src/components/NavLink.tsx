"use client";

import Link from "next/link";
import {
  type AnalyticsLocation,
  classifyHref,
  trackCtaClick,
} from "@/lib/analytics";
import {
  isContactHref,
  noteInquiryCta,
  withContactAttribution,
} from "@/lib/lead-attribution";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  location?: AnalyticsLocation;
};

export function NavLink({
  href,
  children,
  className,
  location = "header",
}: NavLinkProps) {
  const label = typeof children === "string" ? children : href;
  const resolvedHref = withContactAttribution(href, {
    ctaLabel: isContactHref(href) ? label : undefined,
    ctaLocation: isContactHref(href) ? location : undefined,
  });

  const onClick = () => {
    if (isContactHref(resolvedHref)) {
      noteInquiryCta({ label, location });
    }
    trackCtaClick({
      label,
      location,
      href: resolvedHref,
      linkType: classifyHref(resolvedHref),
    });
  };

  if (resolvedHref.startsWith("/") && !resolvedHref.startsWith("//")) {
    return (
      <Link href={resolvedHref} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={resolvedHref} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
