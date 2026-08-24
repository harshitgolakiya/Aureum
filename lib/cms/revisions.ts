import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import type { InsightArticle, Project } from "@/data/site";
import { ensureCmsSchema, getCmsPool } from "./database";

export type CmsContentType = "project" | "insight";
export type CmsRevisionSnapshot = Project | InsightArticle;

export type CmsRevision = {
  id: number;
  contentType: CmsContentType;
  contentSlug: string;
  event: string;
  editorEmail: string;
  snapshot: CmsRevisionSnapshot;
  createdAt: Date;
};

type RevisionRow = RowDataPacket & {
  id: number;
  content_type: CmsContentType;
  content_slug: string;
  event: string;
  editor_email: string;
  snapshot_json: unknown;
  created_at: Date;
};

function revisionFromRow(row: RevisionRow): CmsRevision {
  const snapshot = typeof row.snapshot_json === "string"
    ? JSON.parse(row.snapshot_json) as CmsRevisionSnapshot
    : row.snapshot_json as CmsRevisionSnapshot;
  return {
    id: Number(row.id),
    contentType: row.content_type,
    contentSlug: row.content_slug,
    event: row.event,
    editorEmail: row.editor_email,
    snapshot,
    createdAt: row.created_at,
  };
}

export async function recordCmsRevision(
  contentType: CmsContentType,
  contentSlug: string,
  event: string,
  editorEmail: string,
  snapshot: CmsRevisionSnapshot,
) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  await database.execute(
    `INSERT INTO cms_revisions
      (content_type, content_slug, event, editor_email, snapshot_json)
     VALUES (?, ?, ?, ?, ?)`,
    [contentType, contentSlug, event, editorEmail, JSON.stringify(snapshot)],
  );
}

export async function getCmsRevisions(contentType: CmsContentType, contentSlug: string) {
  const database = getCmsPool();
  if (!database) return [];
  await ensureCmsSchema();
  const [rows] = await database.execute<RevisionRow[]>(
    `SELECT id, content_type, content_slug, event, editor_email, snapshot_json, created_at
     FROM cms_revisions WHERE content_type = ? AND content_slug = ? ORDER BY id DESC`,
    [contentType, contentSlug],
  );
  return rows.map(revisionFromRow);
}

export async function getCmsRevision(id: number, contentType: CmsContentType, contentSlug: string) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const database = getCmsPool();
  if (!database) return null;
  await ensureCmsSchema();
  const [rows] = await database.execute<RevisionRow[]>(
    `SELECT id, content_type, content_slug, event, editor_email, snapshot_json, created_at
     FROM cms_revisions WHERE id = ? AND content_type = ? AND content_slug = ? LIMIT 1`,
    [id, contentType, contentSlug],
  );
  return rows[0] ? revisionFromRow(rows[0]) : null;
}
