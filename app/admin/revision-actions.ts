"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InsightArticle, Project } from "@/data/site";
import { requireCmsRole } from "@/lib/cms/auth";
import { savePost, saveProject } from "@/lib/cms/collections";
import { getCmsRevision, recordCmsRevision, type CmsContentType } from "@/lib/cms/revisions";
import { recordCmsAudit } from "@/lib/cms/audit";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

export async function restoreRevisionAction(formData: FormData) {
  const session = await requireCmsRole("administrator", "editor");
  const contentType = value(formData, "contentType") as CmsContentType;
  const slug = value(formData, "slug");
  const revisionId = Number.parseInt(value(formData, "revisionId"), 10);
  if (!['project', 'insight'].includes(contentType) || !slug || !Number.isInteger(revisionId)) {
    redirect("/admin?error=invalid-content");
  }
  const revision = await getCmsRevision(revisionId, contentType, slug);
  if (!revision) redirect(`/admin/${contentType === "project" ? "projects" : "insights"}/${slug}/revisions?error=not-found`);

  if (contentType === "project") {
    const snapshot = revision.snapshot as Project;
    const restored: Project = { ...snapshot, slug, canonicalUrl: snapshot.canonicalUrl ?? "", searchIndex: snapshot.searchIndex ?? true, searchFollow: snapshot.searchFollow ?? true, socialTitle: snapshot.socialTitle ?? "", socialDescription: snapshot.socialDescription ?? "", socialImage: snapshot.socialImage ?? "", published: false, archived: false, workflowStatus: "unpublished", scheduledAt: "" };
    await saveProject(slug, restored);
    await recordCmsRevision("project", slug, "restore_revision", session.email, restored);
    await recordCmsAudit(session, "restore", "project", slug, restored.name, { revisionId });
    revalidatePath("/portfolio", "page");
  } else {
    const snapshot = revision.snapshot as InsightArticle;
    const restored: InsightArticle = { ...snapshot, slug, canonicalUrl: snapshot.canonicalUrl ?? "", searchIndex: snapshot.searchIndex ?? true, searchFollow: snapshot.searchFollow ?? true, socialTitle: snapshot.socialTitle ?? "", socialDescription: snapshot.socialDescription ?? "", socialImage: snapshot.socialImage ?? "", published: false, featured: false, archived: false, workflowStatus: "unpublished", scheduledAt: "" };
    await savePost(slug, restored);
    await recordCmsRevision("insight", slug, "restore_revision", session.email, restored);
    await recordCmsAudit(session, "restore", "insight", slug, restored.title, { revisionId });
    revalidatePath("/insights", "page");
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${contentType === "project" ? "projects" : "insights"}`);
  revalidatePath("/sitemap.xml");
  redirect(`/admin/${contentType === "project" ? "projects" : "insights"}/${slug}?restored=${revisionId}`);
}
