import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsSession } from "@/lib/cms/auth";
import { getCmsProjectLibrary, getCmsProjectRecord } from "@/lib/cms/collections";
import { CaseStudyExperience } from "@/components/portfolio-experience";
import { ProjectHero } from "@/components/facility-experience";

export default async function ProjectPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }] = await Promise.all([params, requireCmsSession()]);
  const [project, library] = await Promise.all([getCmsProjectRecord(slug), getCmsProjectLibrary()]);
  if (!project || project.archived) notFound();
  const projects = library.filter((item) => !item.archived);
  return (
    <div className="cms-project-preview">
      <div className="cms-preview-toolbar"><div><span>Protected preview</span><strong>{project.published ? "Published" : "Draft"}</strong></div><Link href={`/admin/projects/${project.slug}`}>← Return to editor</Link></div>
      <main>
        <ProjectHero project={project} />
        <CaseStudyExperience project={project} projects={projects} />
      </main>
    </div>
  );
}
