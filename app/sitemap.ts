import type { MetadataRoute } from "next";
import { getPosts, getProjects } from "@/lib/cms/collections";
import { getSiteOrigin } from "@/lib/site-url";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, insightArticles] = await Promise.all([getProjects(), getPosts()]);
  const base = getSiteOrigin();
  const routes = [
    "",
    "/who-we-are",
    "/how-we-partner",
    "/portfolio",
    "/insights",
    "/contact",
    ...projects
      .filter((project) => project.searchIndex && !project.name.startsWith("["))
      .map((project) => `/portfolio/${project.slug}`),
    ...insightArticles
      .filter((article) => article.searchIndex && !article.title.startsWith("["))
      .map((article) => `/insights/${article.slug}`),
  ];
  return routes.map((url) => ({
    url: base + url,
    changeFrequency: url === "" ? ("weekly" as const) : ("monthly" as const),
    priority: url === "" ? 1 : url.split("/").length === 2 ? 0.8 : 0.65,
  }));
}
