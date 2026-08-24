import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { publishDueContent } from "@/lib/cms/collections";

export const runtime = "nodejs";

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

function authorized(request: Request, secret: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  return Boolean(supplied) && timingSafeEqual(hash(supplied), hash(secret));
}

function refreshPublishedRoutes(projects: string[], insights: string[]) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/insights");
  revalidatePath("/portfolio");
  revalidatePath("/insights");
  revalidatePath("/sitemap.xml");
  for (const slug of projects) revalidatePath(`/portfolio/${slug}`);
  for (const slug of insights) revalidatePath(`/insights/${slug}`);
}

export async function POST(request: Request) {
  const secret = process.env.CMS_CRON_SECRET?.trim() ?? "";
  if (secret.length < 32) {
    return NextResponse.json({ ok: false, message: "Publishing worker is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const published = await publishDueContent();
    refreshPublishedRoutes(published.projects, published.insights);
    return NextResponse.json({ ok: true, published, count: published.projects.length + published.insights.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Scheduled publishing worker failed", error);
    return NextResponse.json({ ok: false, message: "Scheduled publishing failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
