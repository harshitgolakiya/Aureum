import "server-only";

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/*
 * CMS uploads live on disk, outside the built app, so redeploying never touches them.
 *
 *   UPLOAD_DIR=/absolute/path/to/uploads   (recommended in production)
 *
 * When UPLOAD_DIR is not set, files go to ./uploads in the project root. Point
 * UPLOAD_DIR at a folder that sits outside the deployed app directory, otherwise a
 * redeploy that replaces the app folder would replace the uploads with it.
 *
 * Files are stored as <UPLOAD_DIR>/media/<name> and served from /uploads/media/<name>.
 */
const PUBLIC_PREFIX = "/uploads/media/";
const FILE_NAME = /^[A-Za-z0-9-]+\.(?:webp|mp4|webm)$/;

const MIME_BY_EXTENSION: Record<string, string> = {
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export function getUploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "uploads");
}

export function isUploadedMediaPath(publicPath: string) {
  return publicPath.startsWith(PUBLIC_PREFIX) && FILE_NAME.test(publicPath.slice(PUBLIC_PREFIX.length));
}

export function uploadedMimeType(publicPath: string) {
  return MIME_BY_EXTENSION[path.extname(publicPath).toLowerCase()] ?? "application/octet-stream";
}

function diskPath(publicPath: string) {
  if (!isUploadedMediaPath(publicPath)) throw new Error(`Not an uploaded media path: ${publicPath}`);
  return path.join(getUploadRoot(), "media", publicPath.slice(PUBLIC_PREFIX.length));
}

/** Writes each file atomically (temp file, then rename) and returns the public paths written. */
export async function writeUploadedFiles(files: Array<{ publicPath: string; data: Buffer }>) {
  const written: string[] = [];
  try {
    for (const file of files) {
      const target = diskPath(file.publicPath);
      await mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.${process.pid}.tmp`;
      await writeFile(temporary, file.data);
      await rename(temporary, target);
      written.push(file.publicPath);
    }
  } catch (error) {
    await removeUploadedFiles(written);
    throw error;
  }
  return written;
}

/** Returns the file's bytes, or null when it is not on disk. */
export async function readUploadedFile(publicPath: string) {
  if (!isUploadedMediaPath(publicPath)) return null;
  try {
    return await readFile(diskPath(publicPath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function removeUploadedFiles(publicPaths: string[]) {
  await Promise.all(
    publicPaths
      .filter(isUploadedMediaPath)
      .map((publicPath) => rm(diskPath(publicPath), { force: true }).catch(() => undefined)),
  );
}
