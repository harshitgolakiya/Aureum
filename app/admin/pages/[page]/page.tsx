import { notFound } from "next/navigation";
import { requireCmsRole } from "@/lib/cms/auth";
import { getAllCmsContent } from "@/lib/cms/content";
import { CMS_PAGE_CONFIGS, isCmsEditorSlug, type CmsPageSlug } from "@/lib/cms/pages";
import { cmsDefinitionByKey, type CmsField } from "@/lib/cms/schema";
import { CmsShell } from "../../cms-shell";
import { PageContentEditor } from "../page-content-editor";

export default async function PageEditorRoute({ params }: { params: Promise<{ page: string }> }) {
  const [{ page }, session, content] = await Promise.all([params, requireCmsRole("administrator", "editor"), getAllCmsContent()]);
  if (!isCmsEditorSlug(page) || page === "settings") notFound();
  const config = CMS_PAGE_CONFIGS[page as CmsPageSlug];
  const sections = config.keys.map((key) => {
    const definition = cmsDefinitionByKey[key];
    return { key, title: definition.title, description: definition.description, fields: definition.fields as readonly CmsField[], value: content[key] as unknown as Record<string, string> };
  });
  return <CmsShell active="pages" email={session.email} role={session.role} eyebrow={config.route} title={`Edit ${config.title}`}><PageContentEditor editorSlug={page} previewHref={`/admin/pages/${page}/preview`} sections={sections} /></CmsShell>;
}
