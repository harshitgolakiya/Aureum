import type { MetadataRoute } from "next";
import { insightArticles, projects } from "@/data/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const routes = [
    "",
    "/who-we-are",
    "/how-we-partner",
    "/portfolio",
    "/insights",
    "/contact",
    ...projects
      .filter((project) => !project.name.startsWith("["))
      .map((project) => `/portfolio/${project.slug}`),
    ...insightArticles
      .filter((article) => !article.title.startsWith("["))
      .map((article) => `/insights/${article.slug}`),
  ];
  return routes.map((url) => ({
    url: base + url,
    changeFrequency: url === "" ? ("weekly" as const) : ("monthly" as const),
    priority: url === "" ? 1 : url.split("/").length === 2 ? 0.8 : 0.65,
  }));
}
