"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordCmsAudit } from "@/lib/cms/audit";
import { requireCmsRole } from "@/lib/cms/auth";
import { deleteTeamMember, getTeamMember, saveTeamMember, slugifyTeamMember, type TeamMember } from "@/lib/cms/team";

export type TeamEditorState = {
  ok: boolean;
  slug?: string;
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

function memberFromForm(formData: FormData): TeamMember {
  const name = value(formData, "name");
  return {
    slug: slugifyTeamMember(value(formData, "slug") || name),
    name,
    role: value(formData, "role"),
    discipline: value(formData, "discipline"),
    visualLabel: value(formData, "visualLabel"),
    portrait: value(formData, "portrait"),
    profilePortrait: value(formData, "profilePortrait"),
    biographyOne: value(formData, "biographyOne"),
    biographyTwo: value(formData, "biographyTwo"),
    biographyThree: value(formData, "biographyThree"),
    biographyFour: value(formData, "biographyFour"),
    biographyFive: value(formData, "biographyFive"),
    group: value(formData, "group") === "executive" ? "executive" : "senior",
    published: formData.get("published") === "on",
    sortOrder: numberValue(formData, "sortOrder"),
  };
}

function validate(member: TeamMember) {
  const errors: Record<string, string> = {};
  const required: Array<keyof TeamMember> = ["name", "role", "discipline", "portrait", "profilePortrait", "biographyOne"];
  for (const field of required) if (!String(member[field]).trim()) errors[field] = "This field is required.";
  if (!member.slug) errors.slug = "Enter a name or slug.";
  if (member.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(member.slug)) errors.slug = "Use lowercase letters, numbers, and hyphens.";
  if (member.name.length > 255) errors.name = "Keep this under 256 characters.";
  if (member.role.length > 255) errors.role = "Keep this under 256 characters.";
  if (member.discipline.length > 180) errors.discipline = "Keep this under 181 characters.";
  return errors;
}

function refreshTeamRoutes() {
  revalidatePath("/who-we-are");
  revalidatePath("/admin/team");
  revalidatePath("/admin/pages/who-we-are/preview");
}

export async function saveTeamMemberAction(_previous: TeamEditorState, formData: FormData): Promise<TeamEditorState> {
  const session = await requireCmsRole("administrator", "editor");
  const originalSlug = value(formData, "originalSlug");
  const member = memberFromForm(formData);
  const errors = validate(member);
  if (Object.keys(errors).length) return { ok: false, message: "Check the highlighted fields before saving.", errors };

  const existingAtSlug = await getTeamMember(member.slug);
  if (existingAtSlug && existingAtSlug.slug !== originalSlug) {
    return { ok: false, message: "Choose a different slug.", errors: { slug: "This slug is already in use." } };
  }

  try {
    const existing = originalSlug ? await getTeamMember(originalSlug) : null;
    await saveTeamMember(originalSlug, member);
    await recordCmsAudit(session, existing ? "edit" : "create", "team_member", member.slug, member.name, originalSlug && originalSlug !== member.slug ? { previousSlug: originalSlug } : undefined);
    refreshTeamRoutes();
    return { ok: true, slug: member.slug, message: existing ? "Team member updated." : "Team member created." };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
      return { ok: false, message: "Choose a different slug.", errors: { slug: "This slug is already in use." } };
    }
    console.error("Team member save failed", error);
    return { ok: false, message: "The team member could not be saved. Check MySQL and try again." };
  }
}

export async function deleteTeamMemberAction(formData: FormData) {
  const session = await requireCmsRole("administrator", "editor");
  const slug = value(formData, "slug");
  const member = await getTeamMember(slug);
  if (!member) redirect("/admin/team?error=missing");
  await deleteTeamMember(slug);
  await recordCmsAudit(session, "delete", "team_member", slug, member.name);
  refreshTeamRoutes();
  redirect(`/admin/team?deleted=${encodeURIComponent(member.name)}`);
}
