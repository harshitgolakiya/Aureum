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
  const article = insightArticles.find((item) => item.slug === slug);
  if (!article) notFound();
  const display = insightPresentation(article);
  const approved = !article.title.startsWith("[");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return (
    <main>
      {approved && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: display.title,
              description: display.excerpt,
              url: `${siteUrl}/insights/${slug}`,
              author: { "@type": "Person", name: display.author },
              publisher: { "@type": "Organization", name: "Aureum Development" },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ArticleExperience slug={slug} />
    </main>
  );
}
