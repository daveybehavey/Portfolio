import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EuroDigital",
    short_name: "EuroDigital",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#4f46e5",
    lang: "en-CA",
    icons: [
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
