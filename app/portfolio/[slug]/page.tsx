import { notFound } from "next/navigation";
import { CaseStudyExperience } from "@/components/portfolio-experience";
import { Media } from "@/components/ui";
import { projectPresentation, projects } from "@/data/site";
import type { Metadata } from "next";
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return { title: "Development not found" };
  const display = projectPresentation(project);
  return {
    title: `${display.name} | Portfolio`,
    description: `${project.type}. ${display.philosophy}`,
    alternates: { canonical: `/portfolio/${slug}` },
    robots: project.name.startsWith("[")
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
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const display = projectPresentation(project);
  return (
    <main>
      <section className="case-hero">
        <Media label="project-hero.webp" />
        <div>
          <small>
            {display.location} / {project.type}
          </small>
          <h1>{display.name}</h1>
          <p>{display.philosophy}</p>
        </div>
      </section>
      <CaseStudyExperience slug={slug} />
    </main>
  );
}
