import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import type { CmsSession } from "./auth";
import { ensureCmsSchema, getCmsPool } from "./database";

export type CmsAuditAction =
  | "create"
  | "edit"
  | "publish"
  | "schedule"
  | "cancel_schedule"
  | "unpublish"
  | "archive"
  | "restore"
  | "delete"
  | "feature"
  | "unfeature";

export type CmsAuditContentType = "project" | "insight" | "page" | "settings" | "enquiry";

export type CmsAuditEntry = {
  id: number;
  actorEmail: string;
  action: string;
  contentType: string;
  contentSlug: string;
  recordLabel: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

type AuditRow = RowDataPacket & {
  id: number;
  actor_email: string;
  action: string;
  content_type: string;
  content_slug: string;
  record_label: string;
  metadata_json: unknown;
  created_at: Date;
};

export async function recordCmsAudit(
  actor: Pick<CmsSession, "userId" | "email"> | null,
  action: CmsAuditAction,
  contentType: CmsAuditContentType,
  contentSlug: string,
  recordLabel: string,
  metadata?: Record<string, unknown>,
) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  await database.execute(
    `INSERT INTO cms_audit_log
      (actor_user_id, actor_email, action, content_type, content_slug, record_label, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [actor?.userId ?? null, actor?.email ?? "System scheduler", action, contentType, contentSlug, recordLabel, metadata ? JSON.stringify(metadata) : null],
  );
}

export type CmsAuditFilters = {
  user?: string;
  contentType?: string;
  record?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

function validDate(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function getCmsAuditLog(filters: CmsAuditFilters = {}) {
  const database = getCmsPool();
  if (!database) return { entries: [] as CmsAuditEntry[], total: 0 };
  await ensureCmsSchema();
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  if (filters.user?.trim()) { clauses.push("actor_email = ?"); values.push(filters.user.trim().toLowerCase()); }
  if (filters.contentType && ["project", "insight", "page", "settings", "enquiry"].includes(filters.contentType)) { clauses.push("content_type = ?"); values.push(filters.contentType); }
  if (filters.action?.trim()) { clauses.push("action = ?"); values.push(filters.action.trim()); }
  if (filters.record?.trim()) { clauses.push("(content_slug LIKE ? OR record_label LIKE ?)"); const term = `%${filters.record.trim()}%`; values.push(term, term); }
  if (validDate(filters.from)) { clauses.push("created_at >= ?"); values.push(`${filters.from} 00:00:00`); }
  if (validDate(filters.to)) { clauses.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)"); values.push(`${filters.to} 00:00:00`); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const pageSize = Math.min(Math.max(filters.pageSize ?? 30, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const offset = (page - 1) * pageSize;
  const [countRows] = await database.execute<(RowDataPacket & { count: number })[]>(`SELECT COUNT(*) AS count FROM cms_audit_log ${where}`, values);
  const [rows] = await database.execute<AuditRow[]>(
    `SELECT id, actor_email, action, content_type, content_slug, record_label, metadata_json, created_at
     FROM cms_audit_log ${where} ORDER BY created_at DESC, id DESC LIMIT ${pageSize} OFFSET ${offset}`,
    values,
  );
  return {
    total: Number(countRows[0]?.count ?? 0),
    entries: rows.map((row) => ({
      id: row.id,
      actorEmail: row.actor_email,
      action: row.action,
      contentType: row.content_type,
      contentSlug: row.content_slug,
      recordLabel: row.record_label,
      metadata: row.metadata_json && typeof row.metadata_json === "object" ? row.metadata_json as Record<string, unknown> : null,
      createdAt: row.created_at,
    })),
  };
}

export async function getCmsAuditFilterOptions() {
  const database = getCmsPool();
  if (!database) return { users: [] as string[], actions: [] as string[] };
  await ensureCmsSchema();
  const [users] = await database.query<(RowDataPacket & { actor_email: string })[]>("SELECT DISTINCT actor_email FROM cms_audit_log ORDER BY actor_email");
  const [actions] = await database.query<(RowDataPacket & { action: string })[]>("SELECT DISTINCT action FROM cms_audit_log ORDER BY action");
  return { users: users.map((row) => row.actor_email), actions: actions.map((row) => row.action) };
}
