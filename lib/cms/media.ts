import "server-only";

import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { connection } from "next/server";
import { approvedMedia, homeHeroMedia } from "@/data/media";
import { ensureCmsSchema, getCmsPool } from "./database";

export type MediaVariant = { width: number; height: number; path: string; size: number };
export type MediaAsset = {
  id: string;
  filename: string;
  originalName: string;
  publicPath: string;
  type: "image" | "video";
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  altText: string;
  caption: string;
  focalX: number;
  focalY: number;
  posterPath: string;
  variants: MediaVariant[];
  usage: string[];
  createdAt: Date;
  updatedAt: Date;
};

type MediaRow = RowDataPacket & {
  id: string; filename: string; original_name: string; public_path: string;
  media_type: "image" | "video"; mime_type: string; width: number | null;
  height: number | null; size_bytes: number; alt_text: string; caption: string;
  focal_x: number; focal_y: number; poster_path: string; variants_json: unknown;
  created_at: Date; updated_at: Date;
};

function variants(value: unknown): MediaVariant[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.path === "string") as MediaVariant[] : [];
  } catch { return []; }
}

function rowToAsset(row: MediaRow, usage: string[] = []): MediaAsset {
  return { id: row.id, filename: row.filename, originalName: row.original_name, publicPath: row.public_path, type: row.media_type, mimeType: row.mime_type, width: row.width, height: row.height, sizeBytes: Number(row.size_bytes), altText: row.alt_text, caption: row.caption, focalX: row.focal_x, focalY: row.focal_y, posterPath: row.poster_path, variants: variants(row.variants_json), usage, createdAt: row.created_at, updatedAt: row.updated_at };
}

function legacyId(publicPath: string) {
  const hash = createHash("sha256").update(publicPath).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

function mimeFor(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  return extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : extension === ".avif" ? "image/avif" : extension === ".webm" ? "video/webm" : "video/mp4";
}

async function seedCheckedInMedia() {
  const database = getCmsPool();
  if (!database) return;
  const publicRoot = path.join(process.cwd(), "public");
  const paths: string[] = [];
  for (const directory of ["media/heroes", "leadership"]) {
    try {
      const files = await readdir(path.join(publicRoot, directory));
      files.forEach((file) => paths.push(`/${directory}/${file}`));
    } catch { /* Optional checked-in media directory. */ }
  }
  const altByPath = new Map(Object.values(approvedMedia).map((item) => [item.src, item.alt]));
  for (const publicPath of paths) {
    const absolute = path.join(publicRoot, ...publicPath.split("/").filter(Boolean));
    const fileStat = await stat(absolute);
    const mimeType = mimeFor(publicPath);
    const type = mimeType.startsWith("image/") ? "image" : "video";
    let width: number | null = null;
    let height: number | null = null;
    if (type === "image") {
      const metadata = await sharp(absolute).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    }
    const originalName = path.basename(publicPath);
    const filename = path.parse(originalName).name.replace(/[-_]+/g, " ");
    await database.execute(
      `INSERT IGNORE INTO cms_media (id, filename, original_name, public_path, media_type, mime_type, width, height, size_bytes, alt_text, caption, focal_x, focal_y, poster_path, variants_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 50, 50, ?, JSON_ARRAY())`,
      [legacyId(publicPath), filename, originalName, publicPath, type, mimeType, width, height, fileStat.size, altByPath.get(publicPath) ?? (type === "image" ? filename : ""), publicPath === homeHeroMedia.videoSrc ? homeHeroMedia.posterSrc : ""],
    );
  }
}

async function usageMap(paths: string[]) {
  const usage = new Map(paths.map((item) => [item, [] as string[]]));
  if (!paths.length) return usage;
  const database = getCmsPool();
  if (!database) return usage;
  const [projects] = await database.query<(RowDataPacket & { slug: string; cover_image: string; gallery_images: string })[]>("SELECT slug, cover_image, gallery_images FROM cms_projects");
  const [posts] = await database.query<(RowDataPacket & { slug: string; cover_image: string; body_document: unknown })[]>("SELECT slug, cover_image, body_document FROM cms_posts");
  const [entries] = await database.query<(RowDataPacket & { content_key: string; value_json: unknown })[]>("SELECT content_key, value_json FROM cms_entries");
  for (const publicPath of paths) {
    const hits = usage.get(publicPath)!;
    projects.forEach((project) => { if (project.cover_image === publicPath || project.gallery_images.includes(publicPath)) hits.push(`Project: ${project.slug}`); });
    posts.forEach((post) => { if (post.cover_image === publicPath || JSON.stringify(post.body_document ?? "").includes(publicPath)) hits.push(`Insight: ${post.slug}`); });
    entries.forEach((entry) => { if (JSON.stringify(entry.value_json ?? "").includes(publicPath)) hits.push(`Page content: ${entry.content_key}`); });
  }
  return usage;
}

export async function getMediaLibrary(): Promise<MediaAsset[]> {
  await connection();
  const database = getCmsPool();
  if (!database) return [];
  await ensureCmsSchema();
  await seedCheckedInMedia();
  const [rows] = await database.query<MediaRow[]>("SELECT * FROM cms_media ORDER BY updated_at DESC, filename ASC");
  const usage = await usageMap(rows.map((row) => row.public_path));
  return rows.map((row) => rowToAsset(row, usage.get(row.public_path) ?? []));
}

export async function getMediaAsset(id: string) {
  const database = getCmsPool();
  if (!database) return null;
  await ensureCmsSchema();
  const [rows] = await database.execute<MediaRow[]>("SELECT * FROM cms_media WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) return null;
  const usage = await usageMap([rows[0].public_path]);
  return rowToAsset(rows[0], usage.get(rows[0].public_path) ?? []);
}

export async function registerMediaAsset(asset: Omit<MediaAsset, "usage" | "createdAt" | "updatedAt">, files: Array<{ publicPath: string; mimeType: string; data: Buffer }>) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const transaction = await database.getConnection();
  try {
    await transaction.beginTransaction();
    await transaction.execute(
      `INSERT INTO cms_media (id, filename, original_name, public_path, media_type, mime_type, width, height, size_bytes, alt_text, caption, focal_x, focal_y, poster_path, variants_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE filename=VALUES(filename), original_name=VALUES(original_name), public_path=VALUES(public_path), media_type=VALUES(media_type), mime_type=VALUES(mime_type), width=VALUES(width), height=VALUES(height), size_bytes=VALUES(size_bytes), alt_text=VALUES(alt_text), caption=VALUES(caption), focal_x=VALUES(focal_x), focal_y=VALUES(focal_y), poster_path=VALUES(poster_path), variants_json=VALUES(variants_json)`,
      [asset.id, asset.filename, asset.originalName, asset.publicPath, asset.type, asset.mimeType, asset.width, asset.height, asset.sizeBytes, asset.altText, asset.caption, asset.focalX, asset.focalY, asset.posterPath, JSON.stringify(asset.variants)],
    );
    await transaction.execute("DELETE FROM cms_media_files WHERE media_id = ?", [asset.id]);
    for (const file of files) {
      await transaction.execute("INSERT INTO cms_media_files (public_path, media_id, mime_type, file_data, size_bytes) VALUES (?, ?, ?, ?, ?)", [file.publicPath, asset.id, file.mimeType, file.data, file.data.length]);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally { transaction.release(); }
}

export async function getStoredMediaFile(publicPath: string) {
  const database = getCmsPool();
  if (!database) return null;
  await ensureCmsSchema();
  const [rows] = await database.execute<(RowDataPacket & { mime_type: string; file_data: Buffer; size_bytes: number })[]>("SELECT mime_type, file_data, size_bytes FROM cms_media_files WHERE public_path = ? LIMIT 1", [publicPath]);
  return rows[0] ?? null;
}

export async function updateMediaMetadata(id: string, input: { filename: string; altText: string; caption: string; focalX: number; focalY: number; posterPath: string }) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const [result] = await database.execute<ResultSetHeader>("UPDATE cms_media SET filename=?, alt_text=?, caption=?, focal_x=?, focal_y=?, poster_path=? WHERE id=?", [input.filename, input.altText, input.caption, input.focalX, input.focalY, input.posterPath, id]);
  if (!result.affectedRows) throw new Error("Media asset not found.");
}

export async function deleteMediaRecord(id: string) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  const [result] = await database.execute<ResultSetHeader>("DELETE FROM cms_media WHERE id = ?", [id]);
  if (!result.affectedRows) throw new Error("Media asset not found.");
}
