"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCmsSession,
  deleteCmsSession,
  requireCmsRole,
} from "@/lib/cms/auth";
import {
  deletePost,
  deleteProject,
  duplicatePostRecord,
  duplicateProjectRecord,
  getCmsPostRecord,
  getCmsProjectRecord,
  setFeaturedPostRecord,
  updatePostLibraryState,
  updateProjectLibraryState,
} from "@/lib/cms/collections";
import { validateProjectForPublishing } from "@/lib/cms/project-validation";
import { validateInsightForPublishing } from "@/lib/cms/insight-validation";
import { recordCmsRevision } from "@/lib/cms/revisions";
import { recordCmsAudit, type CmsAuditAction } from "@/lib/cms/audit";

function fieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function revalidatePublishingRoutes(kind: "project" | "post", slug?: string, oldSlug?: string) {
  revalidatePath("/");
  revalidatePath(kind === "project" ? "/portfolio" : "/insights");
  revalidatePath(kind === "project" ? "/portfolio/[slug]" : "/insights/[slug]", "page");
  if (slug) revalidatePath(`/${kind === "project" ? "portfolio" : "insights"}/${slug}`);
  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/${kind === "project" ? "portfolio" : "insights"}/${oldSlug}`);
  }
  revalidatePath("/sitemap.xml");
}

export async function loginAction(formData: FormData) {
  const email = fieldValue(formData, "email");
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const result = await createCmsSession(email, password, "cms-login");
  redirect(result === "success" ? "/admin" : `/admin/login?error=${result}`);
}

export async function logoutAction() {
  await deleteCmsSession();
  redirect("/admin/login");
}

export async function projectLibraryAction(formData: FormData) {
  const session = await requireCmsRole("administrator", "editor");
  const slug = fieldValue(formData, "slug");
  const action = fieldValue(formData, "operation");
  if (!validSlug(slug) || !["publish", "unpublish", "archive", "restore", "duplicate", "cancel_schedule", "trash"].includes(action)) {
    redirect("/admin/projects?error=invalid-content");
  }
  try {
    if (action === "duplicate") {
      const copySlug = await duplicateProjectRecord(slug);
      const copy = await getCmsProjectRecord(copySlug);
      if (copy) {
        await recordCmsRevision("project", copySlug, "duplicate", session.email, copy);
        await recordCmsAudit(session, "create", "project", copySlug, copy.name, { source: slug });
      }
      revalidatePublishingRoutes("project", copySlug);
      redirect(`/admin/projects?created=${encodeURIComponent(copySlug)}`);
    }
    if (action === "publish") {
      const project = await getCmsProjectRecord(slug);
      if (!project || Object.keys(validateProjectForPublishing(project)).length) {
        redirect(`/admin/projects?error=incomplete&entry=${encodeURIComponent(slug)}`);
      }
    }
    const current = await getCmsProjectRecord(slug);
    if (!current) throw new Error("Project not found.");
    if (action === "trash") {
      await deleteProject(slug);
      await recordCmsAudit(session, "delete", "project", slug, current.name, { recovery: "trash" });
      revalidatePublishingRoutes("project", slug);
      redirect(`/admin/projects?updated=${encodeURIComponent(slug)}&operation=trash`);
    }
    await updateProjectLibraryState(
      slug,
      action as "publish" | "unpublish" | "archive" | "restore" | "cancel_schedule",
    );
    const updated = await getCmsProjectRecord(slug);
    if (updated) {
      await recordCmsRevision("project", slug, action, session.email, updated);
      await recordCmsAudit(session, action as CmsAuditAction, "project", slug, updated.name);
    }
    revalidatePublishingRoutes("project", slug);
    redirect(`/admin/projects?updated=${encodeURIComponent(slug)}&operation=${action}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("CMS project library action failed", error);
    redirect("/admin/projects?error=database");
  }
}

export async function postLibraryAction(formData: FormData) {
  const session = await requireCmsRole("administrator", "editor");
  const slug = fieldValue(formData, "slug");
  const action = fieldValue(formData, "operation");
  const allowed = ["publish", "unpublish", "archive", "restore", "duplicate", "feature", "unfeature", "cancel_schedule", "trash"];
  if (!validSlug(slug) || !allowed.includes(action)) {
    redirect("/admin/insights?error=invalid-content");
  }
  try {
    if (action === "duplicate") {
      const copySlug = await duplicatePostRecord(slug);
      const copy = await getCmsPostRecord(copySlug);
      if (copy) {
        await recordCmsRevision("insight", copySlug, "duplicate", session.email, copy);
        await recordCmsAudit(session, "create", "insight", copySlug, copy.title, { source: slug });
      }
      revalidatePublishingRoutes("post", copySlug);
      redirect(`/admin/insights?created=${encodeURIComponent(copySlug)}`);
    }
    const current = await getCmsPostRecord(slug);
    if (!current) throw new Error("Insight not found.");
    if (action === "publish" && Object.keys(validateInsightForPublishing(current)).length) {
      redirect(`/admin/insights?error=incomplete&entry=${encodeURIComponent(slug)}`);
    }
    if (action === "trash") {
      await deletePost(slug);
      await recordCmsAudit(session, "delete", "insight", slug, current.title, { recovery: "trash" });
      revalidatePublishingRoutes("post", slug);
      redirect(`/admin/insights?updated=${encodeURIComponent(slug)}&operation=trash`);
    }
    if (action === "feature" || action === "unfeature") {
      await setFeaturedPostRecord(slug, action === "feature");
    } else {
      await updatePostLibraryState(
        slug,
        action as "publish" | "unpublish" | "archive" | "restore" | "cancel_schedule",
      );
    }
    const updated = await getCmsPostRecord(slug);
    if (updated) {
      await recordCmsRevision("insight", slug, action, session.email, updated);
      await recordCmsAudit(session, action as CmsAuditAction, "insight", slug, updated.title);
    }
    revalidatePublishingRoutes("post", slug);
    redirect(`/admin/insights?updated=${encodeURIComponent(slug)}&operation=${action}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("CMS insight library action failed", error);
    redirect(`/admin/insights?error=${action === "feature" ? "feature" : "database"}`);
  }
}
