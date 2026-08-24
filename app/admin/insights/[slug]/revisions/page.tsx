import { notFound } from "next/navigation";
import { CmsShell } from "../../../cms-shell";
import { RevisionHistory } from "../../../revision-history";
import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getCmsPostRecord } from "@/lib/cms/collections";

export default async function InsightRevisionsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireCmsSession();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const insight = await getCmsPostRecord(slug);
  if (!insight) notFound();
  return <CmsShell active="insights" email={session.email} eyebrow="Editorial CMS" title="Insight revisions"><RevisionHistory contentType="insight" slug={slug} title={insight.title} query={query} canRestore={cmsRoleCanEdit(session.role)} /></CmsShell>;
}
