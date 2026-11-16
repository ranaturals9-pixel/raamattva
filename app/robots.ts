import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // While the site is "coming soon", ask search engines to wait.
  if (process.env.COMING_SOON === "1") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/order", "/login"] }], sitemap: `${site}/sitemap.xml` };
}
