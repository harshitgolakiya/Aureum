import { notFound } from "next/navigation";
import { ArticleExperience } from "@/components/insights-experience";
import { insightArticles, insightPresentation } from "@/data/site";
import type { Metadata } from "next";
export function generateStaticParams() {
  return insightArticles.map((article) => ({ slug: article.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = insightArticles.find((item) => item.slug === slug);
  if (!article) return { title: "Insight not found" };
  const display = insightPresentation(article);
  return {
    title: display.title,
    description: display.excerpt,
    alternates: { canonical: `/insights/${slug}` },
    robots: article.title.startsWith("[")
      ? { index: false, follow: true }
      : undefined,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!insightArticles.some((article) => article.slug === slug)) notFound();
  return (
    <main>
      <ArticleExperience slug={slug} />
    </main>
  );
}
