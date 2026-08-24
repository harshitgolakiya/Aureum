import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsRole } from "@/lib/cms/auth";
import { getCmsPostRecord, getCmsRedirectHistory } from "@/lib/cms/collections";
import { CmsShell } from "../../cms-shell";
import { InsightEditor } from "../insight-editor";

export default async function EditInsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, requireCmsRole("administrator", "editor")]);
  const [insight, redirects] = await Promise.all([getCmsPostRecord(slug), getCmsRedirectHistory("insight", slug)]);
  if (!insight || insight.archived) notFound();
  return <CmsShell active="insights" email={session.email} eyebrow="Insights / Edit" title={insight.title} actions={<Link className="cms-header-link" href="/admin/insights">Back to insights</Link>}><InsightEditor insight={insight} redirects={redirects.map((item) => ({ oldSlug: item.oldSlug, createdAt: item.createdAt.toISOString() }))} /></CmsShell>;
}
