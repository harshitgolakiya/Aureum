"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordCmsAudit } from "@/lib/cms/audit";
import { requireCmsRole } from "@/lib/cms/auth";
import { getCmsContent } from "@/lib/cms/content";
import { ENQUIRY_STATUSES, getCmsEnquiryById, updateCmsEnquiryStatus, type EnquiryStatus } from "@/lib/cms/enquiries";
import { sendEnquiryNotification } from "@/lib/cms/enquiry-notifications";

function enquiryId(formData: FormData) {
  const id = Number.parseInt(String(formData.get("id") || ""), 10);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

export async function updateEnquiryStatusAction(formData: FormData) {
  const session = await requireCmsRole("administrator", "editor");
  const id = enquiryId(formData);
  const status = String(formData.get("status") || "") as EnquiryStatus;
  if (!id || !ENQUIRY_STATUSES.includes(status)) redirect("/admin/enquiries?error=invalid");
  const enquiry = await getCmsEnquiryById(id);
  if (!enquiry) redirect("/admin/enquiries?error=not-found");
  await updateCmsEnquiryStatus(id, status);
  await recordCmsAudit(session, "edit", "enquiry", String(id), enquiry.name, { field: "status", from: enquiry.status, to: status });
  revalidatePath("/admin/enquiries");
  redirect(`/admin/enquiries?updated=${id}`);
}

export async function retryEnquiryNotificationAction(formData: FormData) {
  const session = await requireCmsRole("administrator", "editor");
  const id = enquiryId(formData);
  if (!id) redirect("/admin/enquiries?error=invalid");
  const enquiry = await getCmsEnquiryById(id);
  if (!enquiry) redirect("/admin/enquiries?error=not-found");
  const footer = await getCmsContent("site.footer");
  const result = await sendEnquiryNotification(enquiry, footer.primaryEmail);
  await recordCmsAudit(session, "edit", "enquiry", String(id), enquiry.name, { operation: "retry_notification", result: result.status });
  revalidatePath("/admin/enquiries");
  redirect(`/admin/enquiries?notification=${result.status}`);
}
