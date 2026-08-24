"use server";

import { revalidatePath } from "next/cache";
import { requireCmsRole } from "@/lib/cms/auth";
import { recordCmsAudit } from "@/lib/cms/audit";
import { getAllCmsContent, saveCmsContent } from "@/lib/cms/content";
import { CMS_PAGE_CONFIGS, contentFromForm, isCmsEditorSlug, validatePageContent } from "@/lib/cms/pages";

export type PageEditorState = {
  ok: boolean;
  message?: string;
  savedAt?: string;
  errors?: Record<string, string>;
};

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

export async function savePageContentAction(_previous: PageEditorState, formData: FormData): Promise<PageEditorState> {
  const session = await requireCmsRole("administrator", "editor");
  const editorSlug = value(formData, "editorSlug");
  if (!isCmsEditorSlug(editorSlug)) return { ok: false, message: "This content area is not registered." };
  const config = CMS_PAGE_CONFIGS[editorSlug];
  const submitted = contentFromForm(config, formData);
  const errors = validatePageContent(config, submitted);
  if (Object.keys(errors).length) return { ok: false, message: "Check the highlighted fields before saving.", errors };

  try {
    const current = await getAllCmsContent();
    const changedKeys = config.keys.filter((key) => JSON.stringify(current[key]) !== JSON.stringify(submitted[key]));
    for (const key of changedKeys) await saveCmsContent(key, submitted[key] as never);
    if (changedKeys.length) {
      await recordCmsAudit(session, "edit", editorSlug === "settings" ? "settings" : "page", editorSlug, config.title, { sections: changedKeys });
    }
    if (editorSlug === "settings") revalidatePath("/", "layout");
    else revalidatePath(config.route);
    revalidatePath("/admin/pages");
    revalidatePath(editorSlug === "settings" ? "/admin/settings" : `/admin/pages/${editorSlug}`);
    return { ok: true, message: changedKeys.length ? "Changes saved and the website preview was refreshed." : "No changes to save.", savedAt: new Date().toISOString() };
  } catch (error) {
    console.error("CMS page content save failed", error);
    return { ok: false, message: "The page could not be saved. Check the MySQL connection and try again." };
  }
}
