"use client";

import Link from "next/link";
import {
  type AnalyticsLocation,
  classifyHref,
  trackCtaClick,
} from "@/lib/analytics";

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

  const onClick = () => {
    trackCtaClick({
      label,
      location,
      href,
      linkType: classifyHref(href),
    });
  };

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
