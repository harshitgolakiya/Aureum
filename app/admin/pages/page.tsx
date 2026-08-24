import Link from "next/link";
import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getCmsContentUpdateTimes } from "@/lib/cms/content";
import { CMS_PAGE_CONFIGS, type CmsPageSlug } from "@/lib/cms/pages";
import { CmsShell } from "../cms-shell";

const pageSlugs: CmsPageSlug[] = ["home", "who-we-are"];

export default async function PagesPage() {
  const session = await requireCmsSession();
  const updates = await getCmsContentUpdateTimes();
  const canEdit = cmsRoleCanEdit(session.role);
  const formatter = new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
  return <CmsShell active="pages" email={session.email} role={session.role} eyebrow="Website content" title="Pages">
    <div className="cms-pages-library">
      <section className="cms-library-summary"><div><p className="cms-eyebrow">Structured page editor</p><h2>Edit copy in the same sections visitors see.</h2><p>Each route has its own workspace, validation, and protected preview. Projects and insights remain in their dedicated libraries.</p></div><div className="cms-library-counts"><span><strong>{pageSlugs.length}</strong>Managed pages</span><span><strong>{pageSlugs.reduce((total, slug) => total + CMS_PAGE_CONFIGS[slug].keys.length, 0)}</strong>Sections</span></div></section>
      <div className="cms-page-cards">{pageSlugs.map((slug, index) => {
        const page = CMS_PAGE_CONFIGS[slug];
        const dates = page.keys.map((key) => updates[key]).filter((date): date is Date => Boolean(date));
        const updated = dates.sort((left, right) => right.getTime() - left.getTime())[0];
        return <article key={slug}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{page.route}</small><h2>{page.title}</h2><p>{page.description}</p><dl><div><dt>Sections</dt><dd>{page.keys.length}</dd></div><div><dt>Last saved</dt><dd>{updated ? formatter.format(updated) : "Using fallback content"}</dd></div></dl></div><footer>{canEdit ? <Link className="cms-primary-action" href={`/admin/pages/${slug}`}>Edit page</Link> : <span>Viewer access</span>}<Link href={`/admin/pages/${slug}/preview`} target="_blank">Preview ↗</Link></footer></article>;
      })}</div>
      <section className="cms-global-settings-callout"><div><p className="cms-eyebrow">Global content</p><h2>Footer and contact information</h2><p>Content shared by every page is managed separately to avoid accidental site-wide changes while editing one route.</p></div><Link href="/admin/settings">Open global settings →</Link></section>
    </div>
  </CmsShell>;
}
