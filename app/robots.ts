import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Signed-in app shells and APIs have no public content worth indexing.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/citizen", "/api", "/__/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
