import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getAllCmsContent } from "@/lib/cms/content";
import { CMS_PAGE_CONFIGS } from "@/lib/cms/pages";
import { cmsDefinitionByKey, type CmsField } from "@/lib/cms/schema";
import { CmsShell } from "../cms-shell";
import { PageContentEditor } from "../pages/page-content-editor";

export default async function SettingsPage() {
  const [session, content] = await Promise.all([requireCmsSession(), getAllCmsContent()]);
  const config = CMS_PAGE_CONFIGS.settings;
  const sections = config.keys.map((key) => { const definition = cmsDefinitionByKey[key]; return { key, title: definition.title, description: definition.description, fields: definition.fields as readonly CmsField[], value: content[key] as unknown as Record<string, string> }; });
  return <CmsShell active="settings" email={session.email} role={session.role} eyebrow="Site-wide content" title="Global settings"><PageContentEditor canEdit={cmsRoleCanEdit(session.role)} editorSlug="settings" previewHref="/" sections={sections} /></CmsShell>;
}
