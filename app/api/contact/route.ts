import { createHash } from "node:crypto";
import { getCmsContent } from "@/lib/cms/content";
import { createContactSubmission, isContactRateLimited, validateContactSubmission } from "@/lib/cms/enquiries";
import { sendEnquiryNotification } from "@/lib/cms/enquiry-notifications";

const MAX_BODY_BYTES = 16_384;

function requestIsSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const expectedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || new URL(request.url).host;
    return new URL(origin).host.toLowerCase() === expectedHost.toLowerCase();
  } catch {
    return false;
  }
}

function clientHash(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  const salt = process.env.CONTACT_RATE_LIMIT_SALT || process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY || "aureum-contact";
  return createHash("sha256").update(`${salt}|${address}|${agent}`).digest("hex");
}

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) return Response.json({ ok: false, message: "Invalid request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ ok: false, message: "JSON is required." }, { status: 415 });
  }
  const statedLength = Number(request.headers.get("content-length") || 0);
  if (statedLength > MAX_BODY_BYTES) return Response.json({ ok: false, message: "Form data is too large." }, { status: 413 });

  try {
    const bodyText = await request.text();
    if (Buffer.byteLength(bodyText, "utf8") > MAX_BODY_BYTES) return Response.json({ ok: false, message: "Form data is too large." }, { status: 413 });
    const body = JSON.parse(bodyText) as unknown;
    if (body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).companyWebsite === "string" && (body as Record<string, string>).companyWebsite.trim()) {
      return Response.json({ ok: true }, { status: 201 });
    }
    const validation = validateContactSubmission(body);
    if (!validation.value) return Response.json({ ok: false, errors: validation.errors }, { status: 400 });
    const hash = clientHash(request);
    if (await isContactRateLimited(hash)) return Response.json({ ok: false, message: "Please wait before sending another enquiry." }, { status: 429 });

    const enquiry = await createContactSubmission(validation.value, hash);
    if (!enquiry) throw new Error("The saved enquiry could not be read.");

    // Storage is the source of truth. A notification failure never discards a valid enquiry.
    const footer = await getCmsContent("site.footer");
    await sendEnquiryNotification(enquiry, footer.primaryEmail);
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Contact form submission failed.", error);
    return Response.json({ ok: false, message: "The enquiry could not be saved. Please try again." }, { status: 503 });
  }
}
