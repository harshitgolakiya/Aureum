import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cmsRoleCanEdit, getCmsSession } from "@/lib/cms/auth";
import { deleteMediaRecord, getMediaAsset, getMediaLibrary, registerMediaAsset, updateMediaMetadata, type MediaVariant } from "@/lib/cms/media";

export const runtime = "nodejs";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null, limit: number) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
function percentage(value: FormDataEntryValue | null) { const number = Number(cleanText(value, 4)); return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 50; }
function validPublicPath(value: string) { return !value || /^\/[A-Za-z0-9/_\-.]+$/.test(value); }
function error(message: string, status = 400) { return NextResponse.json({ ok: false, message }, { status }); }
function refresh() { revalidatePath("/admin"); revalidatePath("/admin/media"); }

export async function GET() {
  if (!(await getCmsSession())) return error("Unauthorized", 401);
  const assets = await getMediaLibrary();
  return NextResponse.json({ ok: true, assets });
}

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return error("Unauthorized", 401);
  if (!cmsRoleCanEdit(session.role)) return error("Forbidden", 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_VIDEO_BYTES + 1024 * 1024) return error("Upload exceeds the 50 MB limit.", 413);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return error("Choose a file to upload.");
  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) return error("Use JPEG, PNG, WebP, AVIF, MP4, or WebM files.");
  if (isImage && file.size > MAX_IMAGE_BYTES) return error("Images must be 20 MB or smaller.", 413);
  if (isVideo && file.size > MAX_VIDEO_BYTES) return error("Videos must be 50 MB or smaller.", 413);
  const altText = cleanText(form.get("altText"), 500);
  if (isImage && !altText) return error("Alt text is required for images.");
  const posterPath = cleanText(form.get("posterPath"), 500);
  if (!validPublicPath(posterPath)) return error("Poster must be a public media path beginning with /.");
  const replaceId = cleanText(form.get("replaceId"), 36);
  const existing = replaceId ? await getMediaAsset(replaceId) : null;
  if (replaceId && (!existing || !existing.publicPath.startsWith("/uploads/media/"))) return error("Only uploaded library assets can be replaced.", 409);

  const id = existing?.id ?? randomUUID();
  const filename = cleanText(form.get("filename"), 255) || path.parse(file.name).name.replace(/[-_]+/g, " ").slice(0, 255);
  const buffer = Buffer.from(await file.arrayBuffer());
  let publicPath = "";
  let mimeType = file.type;
  let width: number | null = null;
  let height: number | null = null;
  let sizeBytes = 0;
  const variants: MediaVariant[] = [];
  const files: Array<{ publicPath: string; mimeType: string; data: Buffer }> = [];

  try {
    if (isImage) {
      const source = sharp(buffer, { failOn: "error" }).rotate();
      const metadata = await source.metadata();
      if (!metadata.width || !metadata.height) return error("The image dimensions could not be read.");
      if (metadata.width < 160 || metadata.height < 160) return error("Images must be at least 160 × 160 pixels.");
      publicPath = `/uploads/media/${id}.webp`;
      const master = await source.clone().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer();
      const masterMetadata = await sharp(master).metadata();
      width = masterMetadata.width ?? null;
      height = masterMetadata.height ?? null;
      files.push({ publicPath, mimeType: "image/webp", data: master });
      sizeBytes = master.length;
      mimeType = "image/webp";
      for (const variantWidth of [480, 960, 1600].filter((item) => item < metadata.width!)) {
        const variantPath = `/uploads/media/${id}-${variantWidth}.webp`;
        const output = await source.clone().resize({ width: variantWidth, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toBuffer();
        const outputMetadata = await sharp(output).metadata();
        files.push({ publicPath: variantPath, mimeType: "image/webp", data: output });
        variants.push({ width: outputMetadata.width ?? variantWidth, height: outputMetadata.height ?? 0, path: variantPath, size: output.length });
      }
    } else {
      const validSignature = file.type === "video/mp4" ? buffer.subarray(4, 12).includes(Buffer.from("ftyp")) : buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
      if (!validSignature) return error("The video file signature is invalid.");
      const extension = file.type === "video/webm" ? "webm" : "mp4";
      publicPath = `/uploads/media/${id}.${extension}`;
      files.push({ publicPath, mimeType: file.type, data: buffer });
      sizeBytes = buffer.length;
    }
    await registerMediaAsset({ id, filename, originalName: file.name.slice(0, 255), publicPath, type: isImage ? "image" : "video", mimeType, width, height, sizeBytes, altText, caption: cleanText(form.get("caption"), 5000), focalX: percentage(form.get("focalX")), focalY: percentage(form.get("focalY")), posterPath, variants }, files);
    refresh();
    return NextResponse.json({ ok: true, asset: await getMediaAsset(id), message: existing ? "Media replaced." : "Media uploaded." });
  } catch (cause) {
    console.error("Media upload failed", cause);
    return error("The media file could not be processed.", 422);
  }
}

export async function PATCH(request: Request) {
  const session = await getCmsSession();
  if (!session) return error("Unauthorized", 401);
  if (!cmsRoleCanEdit(session.role)) return error("Forbidden", 403);
  const input = await request.json() as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id : "";
  const asset = await getMediaAsset(id);
  if (!asset) return error("Media asset not found.", 404);
  const filename = typeof input.filename === "string" ? input.filename.trim().slice(0, 255) : "";
  const altText = typeof input.altText === "string" ? input.altText.trim().slice(0, 500) : "";
  const caption = typeof input.caption === "string" ? input.caption.trim().slice(0, 5000) : "";
  const posterPath = typeof input.posterPath === "string" ? input.posterPath.trim().slice(0, 500) : "";
  if (!filename) return error("Filename is required.");
  if (asset.type === "image" && !altText) return error("Alt text is required for images.");
  if (!validPublicPath(posterPath)) return error("Poster must be a public media path beginning with /.");
  const focal = (value: unknown) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 50;
  await updateMediaMetadata(id, { filename, altText, caption, focalX: focal(input.focalX), focalY: focal(input.focalY), posterPath });
  refresh();
  return NextResponse.json({ ok: true, asset: await getMediaAsset(id), message: "Media details saved." });
}

export async function DELETE(request: Request) {
  const session = await getCmsSession();
  if (!session) return error("Unauthorized", 401);
  if (!cmsRoleCanEdit(session.role)) return error("Forbidden", 403);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const asset = await getMediaAsset(id);
  if (!asset) return error("Media asset not found.", 404);
  if (asset.usage.length) return NextResponse.json({ ok: false, message: "This asset is in use and cannot be deleted.", usage: asset.usage }, { status: 409 });
  if (!asset.publicPath.startsWith("/uploads/media/")) return error("Checked-in assets cannot be deleted from the CMS.", 409);
  await deleteMediaRecord(id);
  refresh();
  return NextResponse.json({ ok: true, message: "Media deleted." });
}
