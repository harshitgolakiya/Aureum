import { notFound } from "next/navigation";
import { CmsShell } from "../../../cms-shell";
import { RevisionHistory } from "../../../revision-history";
import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getCmsProjectRecord } from "@/lib/cms/collections";

export default async function ProjectRevisionsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireCmsSession();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const project = await getCmsProjectRecord(slug);
  if (!project) notFound();
  return <CmsShell active="projects" email={session.email} eyebrow="Portfolio CMS" title="Project revisions"><RevisionHistory contentType="project" slug={slug} title={project.name} query={query} canRestore={cmsRoleCanEdit(session.role)} /></CmsShell>;
}
