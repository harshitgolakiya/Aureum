import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsRole } from "@/lib/cms/auth";
import { getCmsProjectRecord, getCmsRedirectHistory } from "@/lib/cms/collections";
import { CmsShell } from "../../cms-shell";
import { ProjectEditor } from "../project-editor";

export default async function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, requireCmsRole("administrator", "editor")]);
  const [project, redirects] = await Promise.all([getCmsProjectRecord(slug), getCmsRedirectHistory("project", slug)]);
  if (!project || project.archived) notFound();
  return (
    <CmsShell active="projects" email={session.email} eyebrow="Projects / Edit" title={project.name} actions={<Link className="cms-header-link" href="/admin/projects">Back to projects</Link>}>
      <ProjectEditor project={project} redirects={redirects.map((item) => ({ oldSlug: item.oldSlug, createdAt: item.createdAt.toISOString() }))} />
    </CmsShell>
  );
}
