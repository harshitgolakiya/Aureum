"use server";

import { revalidatePath } from "next/cache";
import type { CmsWorkflowStatus, InsightArticle } from "@/data/site";
import { requireCmsRole, requireCmsSession } from "@/lib/cms/auth";
import { CmsWriteConflictError, getCmsPostRecord, isPostSlugAvailable, savePost } from "@/lib/cms/collections";
import { insightDocumentPlainText, normalizeInsightDocument, serializeInsightDocument } from "@/lib/cms/insight-document";
import { slugifyInsight, validateInsightDraft, validateInsightForPublishing } from "@/lib/cms/insight-validation";
import { recordCmsRevision } from "@/lib/cms/revisions";
import { recordCmsAudit, type CmsAuditAction } from "@/lib/cms/audit";
import { parseDubaiDateTimeLocal } from "@/lib/cms/scheduling";

export type InsightEditorResult = {
  ok: boolean;
  slug?: string;
  published?: boolean;
  workflowStatus?: CmsWorkflowStatus;
  savedAt?: string;
  lockVersion?: number;
  message?: string;
  errors?: Record<string, string>;
};

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function numberValue(formData: FormData, name: string) {
  const parsed = Number.parseInt(value(formData, name), 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 9999)) : 0;
}

function versionValue(formData: FormData) {
  const parsed = Number.parseInt(value(formData, "lockVersion"), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function documentValue(formData: FormData) {
  try {
    return normalizeInsightDocument(JSON.parse(value(formData, "bodyDocument")));
  } catch {
    return [];
  }
}

function insightFromForm(formData: FormData, existing: InsightArticle | null, workflowStatus: CmsWorkflowStatus, scheduledAt: string): InsightArticle {
  const title = value(formData, "title");
  const blocks = documentValue(formData);
  return {
    slug: slugifyInsight(value(formData, "slug") || title),
    category: value(formData, "category"),
    title: title || "Untitled insight",
    excerpt: value(formData, "excerpt"),
    author: value(formData, "author"),
    authorTitle: value(formData, "authorTitle"),
    date: value(formData, "date"),
    readTime: value(formData, "readTime"),
    coverImage: value(formData, "coverImage"),
    body: insightDocumentPlainText(blocks),
    bodyDocument: serializeInsightDocument(blocks),
    pullQuote: value(formData, "pullQuote"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    canonicalUrl: value(formData, "canonicalUrl"),
    searchIndex: checked(formData, "searchIndex"),
    searchFollow: checked(formData, "searchFollow"),
    socialTitle: value(formData, "socialTitle"),
    socialDescription: value(formData, "socialDescription"),
    socialImage: value(formData, "socialImage"),
    published: workflowStatus === "published",
    featured: workflowStatus === "published" && Boolean(existing?.featured),
    archived: workflowStatus === "archived",
    workflowStatus,
    scheduledAt,
    sortOrder: numberValue(formData, "sortOrder"),
  };
}

function refreshInsightRoutes(slug: string, originalSlug: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/insights");
  revalidatePath("/insights");
  revalidatePath("/insights/[slug]", "page");
  revalidatePath(`/insights/${slug}`);
  if (originalSlug && originalSlug !== slug) revalidatePath(`/insights/${originalSlug}`);
  revalidatePath("/sitemap.xml");
}

export async function checkInsightSlugAction(slugInput: string, originalSlug = "") {
  await requireCmsSession();
  const slug = slugifyInsight(slugInput);
  if (!slug) return { slug, available: false, message: "Enter an article title or slug." };
  const available = await isPostSlugAvailable(slug, originalSlug);
  return { slug, available, message: available ? "Slug is available." : "This slug is already in use." };
}

export async function saveInsightEditorAction(formData: FormData): Promise<InsightEditorResult> {
  const session = await requireCmsRole("administrator", "editor");
  const intent = value(formData, "intent");
  const originalSlug = value(formData, "originalSlug");
  const expectedVersion = originalSlug ? versionValue(formData) : undefined;
  const existing = originalSlug ? await getCmsPostRecord(originalSlug) : null;
  const scheduleInput = value(formData, "scheduledAt");
  const scheduledDate = scheduleInput ? parseDubaiDateTimeLocal(scheduleInput) : null;
  const workflowStatus: CmsWorkflowStatus = intent === "publish"
    ? "published"
    : intent === "schedule"
      ? "scheduled"
      : intent === "save" && existing
        ? existing.workflowStatus
        : "draft";
  const scheduledAt = workflowStatus === "scheduled"
    ? (intent === "schedule" ? scheduledDate?.toISOString() ?? "" : existing?.scheduledAt ?? "")
    : "";
  const insight = insightFromForm(formData, existing, workflowStatus, scheduledAt);
  if (!insight.slug) return { ok: false, errors: { slug: "Enter an article title before saving." } };

  const errors = intent === "publish" || intent === "schedule" ? validateInsightForPublishing(insight) : validateInsightDraft(insight);
  if (intent === "schedule" && (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now())) {
    errors.scheduledAt = "Choose a valid publication time in the future.";
  }
  if (!(await isPostSlugAvailable(insight.slug, originalSlug))) errors.slug = "This slug is already in use.";
  if (Object.keys(errors).length) {
    return { ok: false, errors, message: intent === "publish" ? "Complete the highlighted fields before publishing." : "Check the highlighted fields." };
  }

  try {
    await savePost(originalSlug, insight, expectedVersion);
    await recordCmsRevision("insight", insight.slug, intent || "save", session.email, insight);
    const auditAction: CmsAuditAction = !existing ? "create" : intent === "publish" ? "publish" : intent === "schedule" ? "schedule" : "edit";
    await recordCmsAudit(session, auditAction, "insight", insight.slug, insight.title, originalSlug && originalSlug !== insight.slug ? { previousSlug: originalSlug } : undefined);
    refreshInsightRoutes(insight.slug, originalSlug);
    return {
      ok: true,
      slug: insight.slug,
      published: insight.published,
      workflowStatus: insight.workflowStatus,
      savedAt: new Date().toISOString(),
      lockVersion: originalSlug ? (expectedVersion ?? 0) + 1 : 1,
      message: intent === "autosave" ? "Draft autosaved." : intent === "schedule" ? "Insight scheduled." : insight.published ? "Insight published." : "Draft saved.",
    };
  } catch (error) {
    if (error instanceof CmsWriteConflictError) {
      return { ok: false, message: "This insight was changed in another tab. Reload before saving so those changes are not overwritten." };
    }
    if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
      return { ok: false, errors: { slug: "This slug is already in use." }, message: "Choose a different insight slug." };
    }
    console.error("Insight editor save failed", error);
    return { ok: false, message: "The insight could not be saved. Check MySQL and try again." };
  }
}
