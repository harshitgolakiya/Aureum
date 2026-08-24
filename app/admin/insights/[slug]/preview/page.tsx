import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsSession } from "@/lib/cms/auth";
import { getCmsPostLibrary, getCmsPostRecord } from "@/lib/cms/collections";
import { ArticleExperience } from "@/components/insights-experience";

function queryValue(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export default async function InsightPreviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams, requireCmsSession()]).then(([route, values]) => [route, values] as const);
  const [insight, library] = await Promise.all([getCmsPostRecord(slug), getCmsPostLibrary()]);
  if (!insight || insight.archived) notFound();
  const mobile = queryValue(query.view) === "mobile";
  return <div className={`cms-project-preview cms-insight-preview${mobile ? " is-mobile" : ""}`}>
    <div className="cms-preview-toolbar"><div><span>Protected preview</span><strong>{insight.published ? "Published" : "Draft"}</strong><Link className={!mobile ? "is-active" : ""} href={`/admin/insights/${slug}/preview`}>Desktop</Link><Link className={mobile ? "is-active" : ""} href={`/admin/insights/${slug}/preview?view=mobile`}>Mobile</Link></div><Link href={`/admin/insights/${slug}`}>← Return to editor</Link></div>
    <div className="cms-preview-device"><main><ArticleExperience article={insight} articles={library.filter((item) => !item.archived)} /></main></div>
  </div>;
}
