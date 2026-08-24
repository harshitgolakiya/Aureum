"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCmsRole, requireCmsSession, type CmsRole } from "@/lib/cms/auth";
import { changeCmsPassword, createCmsUser, resetCmsUserPassword, revokeCmsUserSessions, revokeOtherCmsSessions, updateCmsUser } from "@/lib/cms/users";

function value(formData: FormData, name: string) { const item = formData.get(name); return typeof item === "string" ? item.trim() : ""; }
function roleValue(formData: FormData): CmsRole { const role = value(formData, "role"); if (!['administrator', 'editor', 'viewer'].includes(role)) throw new Error("invalid-role"); return role as CmsRole; }
function finish(message: string) { revalidatePath("/admin/users"); redirect(`/admin/users?message=${encodeURIComponent(message)}`); }
function fail(error: unknown) { const code = error && typeof error === "object" && "code" in error ? String(error.code) : error instanceof Error ? error.message : "database"; redirect(`/admin/users?error=${encodeURIComponent(code)}`); }

export async function createCmsUserAction(formData: FormData) {
  await requireCmsRole("administrator");
  try { await createCmsUser(value(formData, "email"), value(formData, "password"), roleValue(formData)); } catch (error) { fail(error); }
  finish("user-created");
}

export async function updateCmsUserAction(formData: FormData) {
  await requireCmsRole("administrator");
  try { await updateCmsUser(value(formData, "userId"), roleValue(formData), formData.get("active") === "on"); } catch (error) { fail(error); }
  finish("user-updated");
}

export async function resetCmsUserPasswordAction(formData: FormData) {
  await requireCmsRole("administrator");
  try { await resetCmsUserPassword(value(formData, "userId"), value(formData, "password")); } catch (error) { fail(error); }
  finish("password-reset");
}

export async function revokeCmsUserSessionsAction(formData: FormData) {
  await requireCmsRole("administrator");
  try { await revokeCmsUserSessions(value(formData, "userId")); } catch (error) { fail(error); }
  finish("sessions-revoked");
}

export async function changeMyCmsPasswordAction(formData: FormData) {
  const session = await requireCmsSession();
  const next = value(formData, "newPassword");
  if (next !== value(formData, "confirmPassword")) redirect("/admin/users?error=password-mismatch");
  try { await changeCmsPassword(session.userId, value(formData, "currentPassword"), next); } catch (error) { fail(error); }
  finish("password-changed");
}

export async function revokeOtherCmsSessionsAction() {
  const session = await requireCmsSession();
  try { await revokeOtherCmsSessions(session.userId); } catch (error) { fail(error); }
  finish("other-sessions-revoked");
}
