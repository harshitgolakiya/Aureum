import { notFound, permanentRedirect } from "next/navigation";
import { ArticleExperience } from "@/components/insights-experience";
import { insightPresentation } from "@/data/site";
import { getCmsRedirect, getPostBySlug, getPosts } from "@/lib/cms/collections";
import { getSiteOrigin } from "@/lib/site-url";
import type { Metadata } from "next";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPostBySlug(slug);
  if (!article) {
    const destination = await getCmsRedirect("insight", slug);
    if (destination) permanentRedirect(`/insights/${destination}`);
    return { title: "Insight not found" };
  }
  const display = insightPresentation(article);
  const canonical = article.canonicalUrl || `/insights/${slug}`;
  const title = article.seoTitle || display.title;
  const description = article.seoDescription || display.excerpt;
  const socialTitle = article.socialTitle || title;
  const socialDescription = article.socialDescription || description;
  const socialImage = article.socialImage || article.coverImage;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: article.searchIndex && !article.title.startsWith("["), follow: article.searchFollow },
    openGraph: { title: socialTitle, description: socialDescription, url: canonical, siteName: "Aureum", type: "article", authors: [article.author], images: socialImage ? [{ url: socialImage }] : [] },
    twitter: { card: "summary_large_image", title: socialTitle, description: socialDescription, images: socialImage ? [socialImage] : [] },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, insightArticles] = await Promise.all([getPostBySlug(slug), getPosts()]);
  if (!article) {
    const destination = await getCmsRedirect("insight", slug);
    if (destination) permanentRedirect(`/insights/${destination}`);
    notFound();
  }
  const display = insightPresentation(article);
  const approved = !article.title.startsWith("[");
  const siteUrl = getSiteOrigin();
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
              url: new URL(article.canonicalUrl || `/insights/${slug}`, siteUrl).toString(),
              author: { "@type": "Person", name: display.author },
              publisher: { "@type": "Organization", name: "Aureum Development" },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ArticleExperience article={article} articles={insightArticles} />
    </main>
  );
}
