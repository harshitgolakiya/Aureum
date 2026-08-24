import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsSession } from "@/lib/cms/auth";
import { getCmsProjectLibrary, getCmsProjectRecord } from "@/lib/cms/collections";
import { projectPresentation } from "@/data/site";
import { CaseStudyExperience } from "@/components/portfolio-experience";
import { Media } from "@/components/ui";

export default async function ProjectPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }] = await Promise.all([params, requireCmsSession()]);
  const [project, library] = await Promise.all([getCmsProjectRecord(slug), getCmsProjectLibrary()]);
  if (!project || project.archived) notFound();
  const display = projectPresentation(project);
  const projects = library.filter((item) => !item.archived);
  return (
    <div className="cms-project-preview">
      <div className="cms-preview-toolbar"><div><span>Protected preview</span><strong>{project.published ? "Published" : "Draft"}</strong></div><Link href={`/admin/projects/${project.slug}`}>← Return to editor</Link></div>
      <main>
        <section className="case-hero">
          <Media label="project-hero.webp" src={project.coverImage} alt={display.name} />
          <div><small>{display.location} / {project.type}</small><h1>{display.name}</h1><p>{display.philosophy}</p></div>
        </section>
        <CaseStudyExperience project={project} projects={projects} />
      </main>
    </div>
  );
}
