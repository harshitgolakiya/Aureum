import "server-only";

import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { getSiteOrigin } from "@/lib/site-url";
import { ensureCmsSchema, getCmsPool, isCmsDatabaseConfigured } from "./database";

const COOKIE_NAME = "aureum_cms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const RATE_WINDOW_MINUTES = 15;
const RATE_LIMIT = 5;

export type CmsRole = "administrator" | "editor" | "viewer";
export type CmsSession = { userId: string; email: string; role: CmsRole; mustChangePassword: boolean };
export type CmsLoginResult = "success" | "invalid" | "locked" | "unconfigured";

type UserAuthRow = RowDataPacket & { id: string; email: string; password_hash: string; role: CmsRole; active: number | boolean; must_change_password: number | boolean };

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function secureCookie() { return process.env.NODE_ENV === "production" && getSiteOrigin().startsWith("https://"); }
export async function getCurrentCmsTokenHash() { const token = (await cookies()).get(COOKIE_NAME)?.value; return token ? tokenHash(token) : ""; }
function derivePassword(password: string, salt: string) { return new Promise<Buffer>((resolve, reject) => { scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)); }); }

export function validateCmsPassword(password: string) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) return "Include a letter, number, and special character.";
  return "";
}

export async function hashCmsPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await derivePassword(password, salt);
  return `scrypt$16384$8$1$${salt}$${hash.toString("base64url")}`;
}

export async function verifyCmsPassword(password: string, encoded: string) {
  const [algorithm, n, r, p, salt, expected] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expected || n !== "16384" || r !== "8" || p !== "1") return false;
  const actual = await derivePassword(password, salt);
  const expectedBuffer = Buffer.from(expected, "base64url");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

async function ensureBootstrapAdmin() {
  const database = getCmsPool();
  if (!database) return false;
  await ensureCmsSchema();
  const [countRows] = await database.query<(RowDataPacket & { count: number })[]>("SELECT COUNT(*) AS count FROM cms_users");
  if (Number(countRows[0]?.count) > 0) return true;
  const email = normalizeEmail(process.env.CMS_ADMIN_EMAIL ?? "");
  const password = process.env.CMS_ADMIN_PASSWORD ?? "";
  if (!email || !password || validateCmsPassword(password)) return false;
  try {
    await database.execute("INSERT INTO cms_users (id, email, password_hash, role, active, must_change_password) VALUES (?, ?, ?, 'administrator', TRUE, FALSE)", [randomUUID(), email, await hashCmsPassword(password)]);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ER_DUP_ENTRY") throw error;
  }
  return true;
}

export async function isCmsAuthConfigured() {
  if (!isCmsDatabaseConfigured()) return false;
  try { return await ensureBootstrapAdmin(); } catch { return false; }
}

async function loginIsLocked(email: string, clientKey: string) {
  const database = getCmsPool();
  if (!database) return false;
  const [rows] = await database.execute<(RowDataPacket & { locked_until: Date | null })[]>("SELECT locked_until FROM cms_login_attempts WHERE email = ? AND client_key = ? LIMIT 1", [email, clientKey]);
  return Boolean(rows[0]?.locked_until && rows[0].locked_until.getTime() > Date.now());
}

async function recordLoginFailure(email: string, clientKey: string) {
  const database = getCmsPool();
  if (!database) return;
  await database.execute(
    `INSERT INTO cms_login_attempts (email, client_key, attempt_count, window_started_at, locked_until)
     VALUES (?, ?, 1, UTC_TIMESTAMP(), NULL)
     ON DUPLICATE KEY UPDATE
       attempt_count = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL ${RATE_WINDOW_MINUTES} MINUTE, 1, attempt_count + 1),
       locked_until = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL ${RATE_WINDOW_MINUTES} MINUTE, NULL, IF(attempt_count >= ${RATE_LIMIT}, UTC_TIMESTAMP() + INTERVAL ${RATE_WINDOW_MINUTES} MINUTE, locked_until)),
       window_started_at = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL ${RATE_WINDOW_MINUTES} MINUTE, UTC_TIMESTAMP(), window_started_at)`,
    [email, clientKey],
  );
}

export async function createCmsSession(emailInput: string, password: string, clientKey = "unknown"): Promise<CmsLoginResult> {
  if (!(await isCmsAuthConfigured())) return "unconfigured";
  const database = getCmsPool();
  if (!database) return "unconfigured";
  const email = normalizeEmail(emailInput);
  if (await loginIsLocked(email, clientKey)) return "locked";
  const [rows] = await database.execute<UserAuthRow[]>("SELECT id, email, password_hash, role, active, must_change_password FROM cms_users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user || !user.active || !(await verifyCmsPassword(password, user.password_hash))) {
    await recordLoginFailure(email, clientKey);
    return "invalid";
  }
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await database.execute("DELETE FROM cms_login_attempts WHERE email = ? AND client_key = ?", [email, clientKey]);
  await database.execute("INSERT INTO cms_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [tokenHash(rawToken), user.id, expiresAt]);
  await database.execute("UPDATE cms_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [user.id]);
  (await cookies()).set(COOKIE_NAME, rawToken, { httpOnly: true, secure: secureCookie(), sameSite: "strict", path: "/", maxAge: SESSION_TTL_SECONDS, priority: "high" });
  return "success";
}

export async function getCmsSession(): Promise<CmsSession | null> {
  const rawToken = (await cookies()).get(COOKIE_NAME)?.value;
  const database = getCmsPool();
  if (!rawToken || !database) return null;
  await ensureCmsSchema();
  const [rows] = await database.execute<(UserAuthRow & { user_id: string })[]>(
    `SELECT u.id AS user_id, u.email, u.role, u.active, u.must_change_password, u.password_hash
     FROM cms_sessions s JOIN cms_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP() AND u.active = TRUE LIMIT 1`,
    [tokenHash(rawToken)],
  );
  const user = rows[0];
  return user ? { userId: user.user_id, email: user.email, role: user.role, mustChangePassword: Boolean(user.must_change_password) } : null;
}

export async function requireCmsSession() { const session = await getCmsSession(); if (!session) redirect("/admin/login"); return session; }
export async function requireCmsRole(...roles: CmsRole[]) { const session = await requireCmsSession(); if (session.mustChangePassword) redirect("/admin/users?error=password-required"); if (!roles.includes(session.role)) redirect("/admin?error=forbidden"); return session; }
export function cmsRoleCanEdit(role: CmsRole) { return role === "administrator" || role === "editor"; }

export async function deleteCmsSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;
  const database = getCmsPool();
  if (rawToken && database) await database.execute("UPDATE cms_sessions SET revoked_at = UTC_TIMESTAMP() WHERE token_hash = ?", [tokenHash(rawToken)]);
  cookieStore.delete(COOKIE_NAME);
}
