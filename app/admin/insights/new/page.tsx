import Link from "next/link";
import { requireCmsRole } from "@/lib/cms/auth";
import { CmsShell } from "../../cms-shell";
import { InsightEditor } from "../insight-editor";

export default async function NewInsightPage() {
  const session = await requireCmsRole("administrator", "editor");
  return <CmsShell active="insights" email={session.email} eyebrow="Insights / New" title="Create insight" actions={<Link className="cms-header-link" href="/admin/insights">Back to insights</Link>}><InsightEditor /></CmsShell>;
}
