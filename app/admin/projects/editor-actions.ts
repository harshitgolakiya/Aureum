"use server";

import { revalidatePath } from "next/cache";
import { requireCmsRole, requireCmsSession } from "@/lib/cms/auth";
import {
  getCmsProjectRecord,
  isProjectSlugAvailable,
  saveProject,
  CmsWriteConflictError,
} from "@/lib/cms/collections";
import {
  normalizeChapterOrder,
  slugifyProject,
  validateProjectDraft,
  validateProjectForPublishing,
} from "@/lib/cms/project-validation";
import type { CmsWorkflowStatus, Project } from "@/data/site";
import { recordCmsRevision } from "@/lib/cms/revisions";
import { recordCmsAudit, type CmsAuditAction } from "@/lib/cms/audit";
import { parseDubaiDateTimeLocal } from "@/lib/cms/scheduling";

export type ProjectEditorResult = {
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

function projectFromForm(formData: FormData, workflowStatus: CmsWorkflowStatus, scheduledAt: string): Project {
  const name = value(formData, "name");
  const slug = slugifyProject(value(formData, "slug") || name);
  const galleryImages = value(formData, "galleryImages")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
  return {
    slug,
    name: name || "Untitled project",
    location: value(formData, "location"),
    type: value(formData, "type"),
    category: value(formData, "category"),
    metric: value(formData, "metric"),
    status: value(formData, "status"),
    philosophy: value(formData, "philosophy"),
    engagement: value(formData, "engagement"),
    coverImage: value(formData, "coverImage"),
    opportunity: value(formData, "opportunity"),
    strategy: value(formData, "strategy"),
    delivery: value(formData, "delivery"),
    outcome: value(formData, "outcome"),
    chapterOrder: normalizeChapterOrder(value(formData, "chapterOrder")),
    galleryImages,
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    canonicalUrl: value(formData, "canonicalUrl"),
    searchIndex: checked(formData, "searchIndex"),
    searchFollow: checked(formData, "searchFollow"),
    socialTitle: value(formData, "socialTitle"),
    socialDescription: value(formData, "socialDescription"),
    socialImage: value(formData, "socialImage"),
    published: workflowStatus === "published",
    archived: workflowStatus === "archived",
    workflowStatus,
    scheduledAt,
    sortOrder: numberValue(formData, "sortOrder"),
  };
}

function refreshProjectRoutes(slug: string, originalSlug: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/portfolio");
  revalidatePath("/portfolio/[slug]", "page");
  revalidatePath(`/portfolio/${slug}`);
  if (originalSlug && originalSlug !== slug) revalidatePath(`/portfolio/${originalSlug}`);
  revalidatePath("/sitemap.xml");
}

export async function checkProjectSlugAction(slugInput: string, originalSlug = "") {
  await requireCmsSession();
  const slug = slugifyProject(slugInput);
  if (!slug) return { slug, available: false, message: "Enter a project name or slug." };
  const available = await isProjectSlugAvailable(slug, originalSlug);
  return { slug, available, message: available ? "Slug is available." : "This slug is already in use." };
}

export async function saveProjectEditorAction(formData: FormData): Promise<ProjectEditorResult> {
  const session = await requireCmsRole("administrator", "editor");
  const intent = value(formData, "intent");
  const originalSlug = value(formData, "originalSlug");
  const expectedVersion = originalSlug ? versionValue(formData) : undefined;
  const existing = originalSlug ? await getCmsProjectRecord(originalSlug) : null;
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
  const project = projectFromForm(formData, workflowStatus, scheduledAt);
  if (!project.slug) return { ok: false, errors: { slug: "Enter a project name before saving." } };

  const errors = intent === "publish" || intent === "schedule"
    ? validateProjectForPublishing(project)
    : validateProjectDraft(project);
  if (intent === "schedule" && (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now())) {
    errors.scheduledAt = "Choose a valid publication time in the future.";
  }
  if (!(await isProjectSlugAvailable(project.slug, originalSlug))) {
    errors.slug = "This slug is already in use.";
  }
  if (Object.keys(errors).length) {
    return { ok: false, errors, message: intent === "publish" ? "Complete the highlighted fields before publishing." : "Check the highlighted fields." };
  }

  try {
    await saveProject(originalSlug, project, expectedVersion);
    await recordCmsRevision("project", project.slug, intent || "save", session.email, project);
    const auditAction: CmsAuditAction = !existing ? "create" : intent === "publish" ? "publish" : intent === "schedule" ? "schedule" : "edit";
    await recordCmsAudit(session, auditAction, "project", project.slug, project.name, originalSlug && originalSlug !== project.slug ? { previousSlug: originalSlug } : undefined);
    refreshProjectRoutes(project.slug, originalSlug);
    return {
      ok: true,
      slug: project.slug,
      published: project.published,
      workflowStatus: project.workflowStatus,
      savedAt: new Date().toISOString(),
      lockVersion: originalSlug ? (expectedVersion ?? 0) + 1 : 1,
      message: intent === "autosave" ? "Draft autosaved." : intent === "schedule" ? "Project scheduled." : project.published ? "Project published." : "Draft saved.",
    };
  } catch (error) {
    if (error instanceof CmsWriteConflictError) {
      return { ok: false, message: "This project was changed in another tab. Reload before saving so those changes are not overwritten." };
    }
    if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
      return { ok: false, errors: { slug: "This slug is already in use." }, message: "Choose a different project slug." };
    }
    console.error("Project editor save failed", error);
    return { ok: false, message: "The project could not be saved. Check MySQL and try again." };
  }
}
