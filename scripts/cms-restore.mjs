import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const tableOrder = ["cms_entries", "cms_contact_submissions", "cms_projects", "cms_posts", "cms_media", "cms_users", "cms_media_files", "cms_sessions", "cms_revisions", "cms_redirects", "cms_audit_log", "cms_login_attempts", "cms_migrations"];
const args = process.argv.slice(2);
const backupArgument = args.find((argument) => !argument.startsWith("--"));
const verifyOnly = args.includes("--verify");
const replace = args.includes("--replace");
if (!backupArgument) throw new Error("Usage: npm run cms:restore -- <backup.json> --verify | --replace");

const backupPath = path.resolve(backupArgument);
const backup = JSON.parse(await readFile(backupPath, "utf8"));
if (backup.format !== "aureum-cms-backup" || backup.version !== 1 || !backup.tables) throw new Error("Unsupported or invalid Aureum CMS backup.");
for (const table of tableOrder) {
  const payload = backup.tables[table];
  if (!payload && table === "cms_migrations") continue;
  if (!payload || !Array.isArray(payload.columns) || !Array.isArray(payload.rows)) throw new Error(`Backup is missing ${table}.`);
  const names = new Set(payload.columns.map((column) => column.name));
  for (const row of payload.rows) if (Object.keys(row).some((column) => !names.has(column))) throw new Error(`Backup has an unknown ${table} column.`);
}
console.log(`Backup validated: ${backupPath}`);
console.log(`Created: ${backup.createdAt}; rows: ${Object.values(backup.tables).reduce((total, table) => total + table.rows.length, 0)}`);
if (verifyOnly) process.exit(0);
if (!replace) throw new Error("Restore is destructive. Re-run with --replace after validating the target DATABASE_URL and backup.");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required for restore.");

function decode(value, columnType) {
  if (value && typeof value === "object" && value.__cmsBackupType === "buffer") return Buffer.from(value.value, "base64");
  if (value && typeof value === "object" && value.__cmsBackupType === "date") return new Date(value.value);
  if (/\bjson\b/i.test(columnType) && value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

const database = await mysql.createConnection({ uri: databaseUrl, timezone: "Z" });
try {
  await database.beginTransaction();
  await database.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of [...tableOrder].reverse()) await database.query(`DELETE FROM \`${table}\``);
  for (const table of tableOrder) {
    const payload = backup.tables[table] ?? { columns: [], rows: [] };
    const columnTypes = Object.fromEntries(payload.columns.map((column) => [column.name, column.type]));
    for (const row of payload.rows) {
      const columns = Object.keys(row);
      if (!columns.length) continue;
      const identifiers = columns.map((column) => `\`${column}\``).join(", ");
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((column) => decode(row[column], columnTypes[column]));
      await database.execute(`INSERT INTO \`${table}\` (${identifiers}) VALUES (${placeholders})`, values);
    }
  }
  await database.query("SET FOREIGN_KEY_CHECKS = 1");
  await database.commit();
  console.log("Restore completed successfully.");
} catch (error) {
  await database.rollback();
  throw error;
} finally {
  await database.end();
}
