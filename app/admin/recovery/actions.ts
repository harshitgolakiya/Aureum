"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCmsRole } from "@/lib/cms/auth";
import { recordCmsAudit } from "@/lib/cms/audit";
import { getCmsTrash, restoreCmsTrashRecord } from "@/lib/cms/recovery";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

export async function restoreTrashAction(formData: FormData) {
  const session = await requireCmsRole("administrator", "editor");
  const contentType = value(formData, "contentType");
  const slug = value(formData, "slug");
  if (!(["project", "insight"].includes(contentType)) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect("/admin/recovery?error=invalid");
  try {
    const item = (await getCmsTrash()).find((record) => record.contentType === contentType && record.slug === slug);
    if (!item) throw new Error("Trash record not found.");
    await restoreCmsTrashRecord(contentType as "project" | "insight", slug);
    await recordCmsAudit(session, "restore", contentType as "project" | "insight", slug, item.label, { source: "trash" });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/recovery");
    revalidatePath(contentType === "project" ? "/admin/projects" : "/admin/insights");
    revalidatePath(contentType === "project" ? "/portfolio" : "/insights");
    revalidatePath(contentType === "project" ? "/portfolio/[slug]" : "/insights/[slug]", "page");
    revalidatePath(`/${contentType === "project" ? "portfolio" : "insights"}/${slug}`);
    revalidatePath("/sitemap.xml");
  } catch (error) {
    console.error("CMS trash restore failed", error);
    redirect("/admin/recovery?error=restore");
  }
  redirect(`/admin/recovery?restored=${encodeURIComponent(slug)}`);
}
