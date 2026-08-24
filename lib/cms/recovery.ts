import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ensureCmsSchema, getCmsPool } from "./database";

export type CmsTrashItem = {
  contentType: "project" | "insight";
  slug: string;
  label: string;
  deletedAt: Date;
};

export async function getCmsTrash(): Promise<CmsTrashItem[]> {
  const database = getCmsPool();
  if (!database) return [];
  await ensureCmsSchema();
  const [rows] = await database.query<(RowDataPacket & { content_type: "project" | "insight"; slug: string; label: string; deleted_at: Date })[]>(
    `SELECT content_type, slug, label, deleted_at FROM (
       SELECT 'project' AS content_type, slug, name AS label, deleted_at FROM cms_projects WHERE deleted_at IS NOT NULL
       UNION ALL
       SELECT 'insight' AS content_type, slug, title AS label, deleted_at FROM cms_posts WHERE deleted_at IS NOT NULL
     ) AS trash ORDER BY deleted_at DESC`,
  );
  return rows.map((row) => ({ contentType: row.content_type, slug: row.slug, label: row.label, deletedAt: row.deleted_at }));
}

export async function softDeleteCmsRecord(contentType: "project" | "insight", slug: string) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const table = contentType === "project" ? "cms_projects" : "cms_posts";
  const extra = contentType === "insight" ? ", featured = FALSE" : "";
  const [result] = await database.execute<ResultSetHeader>(
    `UPDATE ${table} SET deleted_at = UTC_TIMESTAMP(), published = FALSE, archived = TRUE, workflow_status = 'archived', scheduled_at = NULL${extra} WHERE slug = ? AND deleted_at IS NULL`,
    [slug],
  );
  if (!result.affectedRows) throw new Error("Content record not found.");
}

export async function restoreCmsTrashRecord(contentType: "project" | "insight", slug: string) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const table = contentType === "project" ? "cms_projects" : "cms_posts";
  const extra = contentType === "insight" ? ", featured = FALSE" : "";
  const [result] = await database.execute<ResultSetHeader>(
    `UPDATE ${table} SET deleted_at = NULL, published = FALSE, archived = FALSE, workflow_status = 'unpublished', scheduled_at = NULL${extra} WHERE slug = ? AND deleted_at IS NOT NULL`,
    [slug],
  );
  if (!result.affectedRows) throw new Error("Trash record not found.");
}
