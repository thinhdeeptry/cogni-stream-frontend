import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/_next/",
          "/private/",
          "/auth/",
          "/payment/",
          "/test/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/private/",
          "/auth/",
          "/payment/",
          "/test/",
        ],
      },
    ],
    sitemap: "https://cognistream.id.vn/sitemap.xml",
    host: "https://cognistream.id.vn",
  };
}
