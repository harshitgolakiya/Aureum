import { notFound } from "next/navigation";
import { getStoredMediaFile } from "@/lib/cms/media";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!/^[A-Za-z0-9-]+\.(?:webp|mp4|webm)$/.test(filename)) notFound();
  const file = await getStoredMediaFile(`/uploads/media/${filename}`);
  if (!file) notFound();
  return new Response(new Uint8Array(file.file_data), { headers: { "Content-Type": file.mime_type, "Cache-Control": "public, max-age=31536000, immutable", "Content-Length": String(file.size_bytes) } });
}
