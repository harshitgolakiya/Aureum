import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsSession } from "@/lib/cms/auth";
import { isCmsEditorSlug } from "@/lib/cms/pages";
import HomePage from "@/app/page";
import WhoWeArePage from "@/app/who-we-are/page";

export default async function PageContentPreview({ params }: { params: Promise<{ page: string }> }) {
  const [{ page }] = await Promise.all([params, requireCmsSession()]);
  if (!isCmsEditorSlug(page) || page === "settings") notFound();
  return <div className="cms-page-preview"><div className="cms-preview-toolbar"><div><span>Protected page preview</span><strong>Saved content</strong></div><Link href={`/admin/pages/${page}`}>← Return to editor</Link></div>{page === "home" ? <HomePage /> : <WhoWeArePage />}</div>;
}
