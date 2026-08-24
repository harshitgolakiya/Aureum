import "server-only";

import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ensureCmsSchema, getCmsPool } from "./database";
import { getCurrentCmsTokenHash, hashCmsPassword, validateCmsPassword, verifyCmsPassword, type CmsRole } from "./auth";

export type CmsUser = { id: string; email: string; role: CmsRole; active: boolean; mustChangePassword: boolean; lastLoginAt: Date | null; createdAt: Date; activeSessions: number };
type UserRow = RowDataPacket & { id: string; email: string; role: CmsRole; active: number | boolean; must_change_password: number | boolean; last_login_at: Date | null; created_at: Date; active_sessions: number };

function databaseOrThrow() { const database = getCmsPool(); if (!database) throw new Error("DATABASE_URL is not configured."); return database; }

export async function getCmsUsers(): Promise<CmsUser[]> {
  const database = databaseOrThrow(); await ensureCmsSchema();
  const [rows] = await database.query<UserRow[]>(`SELECT u.id, u.email, u.role, u.active, u.must_change_password, u.last_login_at, u.created_at,
    COUNT(CASE WHEN s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP() THEN 1 END) AS active_sessions
    FROM cms_users u LEFT JOIN cms_sessions s ON s.user_id = u.id GROUP BY u.id ORDER BY u.created_at ASC`);
  return rows.map((row) => ({ id: row.id, email: row.email, role: row.role, active: Boolean(row.active), mustChangePassword: Boolean(row.must_change_password), lastLoginAt: row.last_login_at, createdAt: row.created_at, activeSessions: Number(row.active_sessions) }));
}

export async function createCmsUser(emailInput: string, password: string, role: CmsRole) {
  const email = emailInput.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("invalid-email");
  const passwordError = validateCmsPassword(password); if (passwordError) throw new Error("invalid-password");
  const database = databaseOrThrow(); await ensureCmsSchema();
  await database.execute("INSERT INTO cms_users (id, email, password_hash, role, active, must_change_password) VALUES (?, ?, ?, ?, TRUE, TRUE)", [randomUUID(), email, await hashCmsPassword(password), role]);
}

export async function updateCmsUser(userId: string, role: CmsRole, active: boolean) {
  const database = databaseOrThrow(); await ensureCmsSchema();
  const [target] = await database.execute<(RowDataPacket & { role: CmsRole; active: number | boolean })[]>("SELECT role, active FROM cms_users WHERE id = ? LIMIT 1", [userId]);
  if (!target.length) throw new Error("not-found");
  if (target[0].role === "administrator" && target[0].active && (role !== "administrator" || !active)) {
    const [admins] = await database.query<(RowDataPacket & { count: number })[]>("SELECT COUNT(*) AS count FROM cms_users WHERE role = 'administrator' AND active = TRUE");
    if (Number(admins[0]?.count) <= 1) throw new Error("last-administrator");
  }
  await database.execute("UPDATE cms_users SET role = ?, active = ? WHERE id = ?", [role, active, userId]);
  if (!active) await database.execute("UPDATE cms_sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL", [userId]);
}

export async function resetCmsUserPassword(userId: string, password: string) {
  if (validateCmsPassword(password)) throw new Error("invalid-password");
  const database = databaseOrThrow(); await ensureCmsSchema();
  const [result] = await database.execute<ResultSetHeader>("UPDATE cms_users SET password_hash = ?, must_change_password = TRUE WHERE id = ?", [await hashCmsPassword(password), userId]);
  if (!result.affectedRows) throw new Error("not-found");
  await database.execute("UPDATE cms_sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL", [userId]);
}

export async function changeCmsPassword(userId: string, currentPassword: string, newPassword: string) {
  if (validateCmsPassword(newPassword)) throw new Error("invalid-password");
  const database = databaseOrThrow(); await ensureCmsSchema();
  const [rows] = await database.execute<(RowDataPacket & { password_hash: string })[]>("SELECT password_hash FROM cms_users WHERE id = ? LIMIT 1", [userId]);
  if (!rows[0] || !(await verifyCmsPassword(currentPassword, rows[0].password_hash))) throw new Error("current-password");
  await database.execute("UPDATE cms_users SET password_hash = ?, must_change_password = FALSE WHERE id = ?", [await hashCmsPassword(newPassword), userId]);
  const currentToken = await getCurrentCmsTokenHash();
  await database.execute("UPDATE cms_sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND token_hash <> ? AND revoked_at IS NULL", [userId, currentToken]);
}

export async function revokeCmsUserSessions(userId: string) { const database = databaseOrThrow(); await ensureCmsSchema(); await database.execute("UPDATE cms_sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL", [userId]); }
export async function revokeOtherCmsSessions(userId: string) { const database = databaseOrThrow(); await ensureCmsSchema(); const currentToken = await getCurrentCmsTokenHash(); await database.execute("UPDATE cms_sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND token_hash <> ? AND revoked_at IS NULL", [userId, currentToken]); }
