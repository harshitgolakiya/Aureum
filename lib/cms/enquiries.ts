import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ensureCmsSchema, getCmsPool } from "./database";

export const ENQUIRY_STATUSES = ["new", "in_progress", "closed", "spam"] as const;
export const CONTACT_INTERESTS = ["Industrial Investment", "Development Management", "Strategic Partnership", "Land Development", "Market Intelligence", "Other"] as const;
export const CONTACT_SOURCES = ["", "Referral", "Search", "Event", "Other"] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export type EnquiryNotificationStatus = "pending" | "sent" | "failed" | "not_configured";
export type ContactSubmissionInput = {
  name: string;
  organisation: string;
  role: string;
  email: string;
  phone: string;
  interest: string;
  opportunity: string;
  source: string;
};
export type CmsEnquiry = ContactSubmissionInput & {
  id: number;
  status: EnquiryStatus;
  notificationStatus: EnquiryNotificationStatus;
  notificationMessageId: string;
  notificationError: string;
  submittedAt: Date;
  updatedAt: Date;
};
export type CmsEnquiryComment = {
  id: number;
  enquiryId: number;
  authorEmail: string;
  comment: string;
  createdAt: Date;
};

type EnquiryRow = RowDataPacket & {
  id: number;
  name: string;
  organisation: string;
  role_title: string;
  email: string;
  phone: string;
  interest: string;
  opportunity: string;
  source: string;
  status: EnquiryStatus;
  notification_status: EnquiryNotificationStatus;
  notification_message_id: string;
  notification_error: string;
  submitted_at: Date;
  updated_at: Date;
};

const SELECT_FIELDS = `id, name, organisation, role_title, email, phone, interest, opportunity, source,
  status, notification_status, notification_message_id, notification_error, submitted_at, updated_at`;

function databaseOrThrow() {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  return database;
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function validateContactSubmission(value: unknown): { value?: ContactSubmissionInput; errors?: Record<string, string> } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { errors: { form: "Invalid form data." } };
  const raw = value as Record<string, unknown>;
  const candidate: ContactSubmissionInput = {
    name: text(raw.name, 120),
    organisation: text(raw.organisation, 120),
    role: text(raw.role, 120),
    email: text(raw.email, 254).toLowerCase(),
    phone: text(raw.phone, 80),
    interest: text(raw.interest, 120),
    opportunity: text(raw.opportunity, 2000),
    source: text(raw.source, 120),
  };
  const errors: Record<string, string> = {};
  if (candidate.name.length < 2) errors.name = "Please enter your full name.";
  if (candidate.organisation.length < 2) errors.organisation = "Please enter your organisation.";
  if (candidate.role.length < 2) errors.role = "Please enter your role or position.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) errors.email = "Please enter a valid email address.";
  if (candidate.phone && !/^[+\d\s()-]{7,80}$/.test(candidate.phone)) errors.phone = "Please enter a valid phone number.";
  if (!CONTACT_INTERESTS.includes(candidate.interest as (typeof CONTACT_INTERESTS)[number])) errors.interest = "Please select an area of interest.";
  if (!CONTACT_SOURCES.includes(candidate.source as (typeof CONTACT_SOURCES)[number])) errors.source = "Please select a valid source.";
  return Object.keys(errors).length ? { errors } : { value: candidate };
}

function mapEnquiry(row: EnquiryRow): CmsEnquiry {
  return {
    id: Number(row.id), name: row.name, organisation: row.organisation, role: row.role_title,
    email: row.email, phone: row.phone, interest: row.interest, opportunity: row.opportunity,
    source: row.source, status: row.status, notificationStatus: row.notification_status,
    notificationMessageId: row.notification_message_id, notificationError: row.notification_error,
    submittedAt: row.submitted_at, updatedAt: row.updated_at,
  };
}

export async function isContactRateLimited(clientHash: string) {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  const [rows] = await database.execute<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM cms_contact_submissions WHERE client_hash = ? AND submitted_at >= UTC_TIMESTAMP() - INTERVAL 15 MINUTE",
    [clientHash],
  );
  return Number(rows[0]?.count ?? 0) >= 10;
}

export async function createContactSubmission(input: ContactSubmissionInput, clientHash: string) {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  const [result] = await database.execute<ResultSetHeader>(
    `INSERT INTO cms_contact_submissions
      (name, organisation, role_title, email, phone, interest, opportunity, source, client_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.name, input.organisation, input.role, input.email, input.phone, input.interest, input.opportunity, input.source, clientHash],
  );
  return getCmsEnquiryById(result.insertId);
}

export async function getCmsEnquiryById(id: number) {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  const [rows] = await database.execute<EnquiryRow[]>(`SELECT ${SELECT_FIELDS} FROM cms_contact_submissions WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapEnquiry(rows[0]) : null;
}

export async function getCmsEnquiries(filters: { q?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  const clauses: string[] = [];
  const values: Array<string> = [];
  const search = filters.q?.trim().slice(0, 120) ?? "";
  if (search) {
    const term = `%${search}%`;
    clauses.push("(name LIKE ? OR organisation LIKE ? OR email LIKE ? OR interest LIKE ?)");
    values.push(term, term, term, term);
  }
  if (filters.status && ENQUIRY_STATUSES.includes(filters.status as EnquiryStatus)) {
    clauses.push("status = ?");
    values.push(filters.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const offset = (page - 1) * pageSize;
  const [countRows] = await database.execute<(RowDataPacket & { count: number })[]>(`SELECT COUNT(*) AS count FROM cms_contact_submissions ${where}`, values);
  const [rows] = await database.execute<EnquiryRow[]>(
    `SELECT ${SELECT_FIELDS} FROM cms_contact_submissions ${where} ORDER BY submitted_at DESC, id DESC LIMIT ${pageSize} OFFSET ${offset}`,
    values,
  );
  return { entries: rows.map(mapEnquiry), total: Number(countRows[0]?.count ?? 0) };
}

export async function getCmsEnquiryCounts() {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  const [rows] = await database.query<(RowDataPacket & { status: EnquiryStatus; count: number })[]>("SELECT status, COUNT(*) AS count FROM cms_contact_submissions GROUP BY status");
  const counts: Record<EnquiryStatus | "all", number> = { all: 0, new: 0, in_progress: 0, closed: 0, spam: 0 };
  for (const row of rows) { counts[row.status] = Number(row.count); counts.all += Number(row.count); }
  return counts;
}

export async function getAllCmsEnquiries() {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  const [rows] = await database.query<EnquiryRow[]>(`SELECT ${SELECT_FIELDS} FROM cms_contact_submissions ORDER BY submitted_at DESC, id DESC`);
  return rows.map(mapEnquiry);
}

export async function updateCmsEnquiryStatus(id: number, status: EnquiryStatus) {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  await database.execute("UPDATE cms_contact_submissions SET status = ? WHERE id = ?", [status, id]);
}

export async function updateEnquiryNotification(id: number, status: EnquiryNotificationStatus, messageId = "", error = "") {
  const database = databaseOrThrow();
  await ensureCmsSchema();
  await database.execute(
    "UPDATE cms_contact_submissions SET notification_status = ?, notification_message_id = ?, notification_error = ? WHERE id = ?",
    [status, messageId.slice(0, 191), error.slice(0, 500), id],
  );
}

export async function addCmsEnquiryComment(enquiryId: number, author: { userId: string; email: string }, commentInput: string) {
  const comment = commentInput.trim();
  if (!comment || comment.length > 2000) throw new Error("Comment must be between 1 and 2,000 characters.");
  const database = databaseOrThrow();
  await ensureCmsSchema();
  await database.execute(
    "INSERT INTO cms_enquiry_comments (enquiry_id, author_user_id, author_email, comment_text) VALUES (?, ?, ?, ?)",
    [enquiryId, author.userId, author.email, comment],
  );
}

export async function getCmsEnquiryComments(enquiryIds: number[]) {
  const grouped = new Map<number, CmsEnquiryComment[]>();
  const ids = [...new Set(enquiryIds.filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (!ids.length) return grouped;
  const database = databaseOrThrow();
  await ensureCmsSchema();
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await database.execute<(RowDataPacket & { id: number; enquiry_id: number; author_email: string; comment_text: string; created_at: Date })[]>(
    `SELECT id, enquiry_id, author_email, comment_text, created_at FROM cms_enquiry_comments WHERE enquiry_id IN (${placeholders}) ORDER BY created_at ASC, id ASC`,
    ids,
  );
  for (const row of rows) {
    const comment = { id: Number(row.id), enquiryId: Number(row.enquiry_id), authorEmail: row.author_email, comment: row.comment_text, createdAt: row.created_at };
    grouped.set(comment.enquiryId, [...(grouped.get(comment.enquiryId) ?? []), comment]);
  }
  return grouped;
}
