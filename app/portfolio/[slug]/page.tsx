import { notFound, permanentRedirect } from "next/navigation";
import { CaseStudyExperience } from "@/components/portfolio-experience";
import { ProjectHero } from "@/components/facility-experience";
import { projectPresentation } from "@/data/site";
import { getCmsRedirect, getProjectBySlug, getProjects } from "@/lib/cms/collections";
import { getSiteOrigin } from "@/lib/site-url";
import type { Metadata } from "next";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    const destination = await getCmsRedirect("project", slug);
    if (destination) permanentRedirect(`/portfolio/${destination}`);
    return { title: "Development not found" };
  }
  const display = projectPresentation(project);
  const canonical = project.canonicalUrl || `/portfolio/${slug}`;
  const title = project.seoTitle || `${display.name} | Portfolio`;
  const description = project.seoDescription || `${project.type}. ${display.philosophy}`;
  const socialTitle = project.socialTitle || title;
  const socialDescription = project.socialDescription || description;
  const socialImage = project.socialImage || project.coverImage;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: project.searchIndex && !project.name.startsWith("["), follow: project.searchFollow },
    openGraph: { title: socialTitle, description: socialDescription, url: canonical, siteName: "Aureum", type: "website", images: socialImage ? [{ url: socialImage }] : [] },
    twitter: { card: "summary_large_image", title: socialTitle, description: socialDescription, images: socialImage ? [socialImage] : [] },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([getProjectBySlug(slug), getProjects()]);
  if (!project) {
    const destination = await getCmsRedirect("project", slug);
    if (destination) permanentRedirect(`/portfolio/${destination}`);
    notFound();
  }
  const display = projectPresentation(project);
  const approved = !project.name.startsWith("[");
  const siteUrl = getSiteOrigin();
  return (
    <main>
      {approved && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Place",
              additionalType: project.type,
              name: display.name,
              description: display.philosophy,
              url: new URL(project.canonicalUrl || `/portfolio/${slug}`, siteUrl).toString(),
              ...(project.location ? { location: project.location } : {}),
              creator: { "@type": "Organization", name: "Aureum Development" },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ProjectHero project={project} />
      <CaseStudyExperience project={project} projects={projects} />
    </main>
  );
}
