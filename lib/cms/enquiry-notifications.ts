import "server-only";

import type { CmsEnquiry } from "./enquiries";
import { updateEnquiryNotification } from "./enquiries";

type ResendResponse = { id?: string; message?: string; name?: string };

function messageText(enquiry: CmsEnquiry) {
  return [
    "A new enquiry was submitted through the Aureum website.", "",
    `Name: ${enquiry.name}`, `Organisation: ${enquiry.organisation}`, `Role: ${enquiry.role}`,
    `Email: ${enquiry.email}`, `Phone: ${enquiry.phone || "Not provided"}`,
    `Area of interest: ${enquiry.interest}`, `Source: ${enquiry.source || "Not provided"}`, "",
    "Opportunity:", enquiry.opportunity || "Not provided", "",
    `CMS enquiry ID: ${enquiry.id}`,
  ].join("\n");
}

export async function sendEnquiryNotification(enquiry: CmsEnquiry, recipient: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!apiKey || !from || !recipient) {
    const error = "Email notification is not configured. Set RESEND_API_KEY and CONTACT_FROM_EMAIL.";
    await updateEnquiryNotification(enquiry.id, "not_configured", "", error);
    return { status: "not_configured" as const, error };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `aureum-contact-${enquiry.id}`,
        "User-Agent": "Aureum-Website/1.0",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: enquiry.email,
        subject: `New website enquiry — ${enquiry.interest}`,
        text: messageText(enquiry),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json().catch(() => ({})) as ResendResponse;
    if (!response.ok || !result.id) throw new Error(result.message || result.name || `Email provider returned ${response.status}.`);
    await updateEnquiryNotification(enquiry.id, "sent", result.id);
    return { status: "sent" as const, messageId: result.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email notification failed.";
    await updateEnquiryNotification(enquiry.id, "failed", "", message);
    return { status: "failed" as const, error: message };
  }
}
