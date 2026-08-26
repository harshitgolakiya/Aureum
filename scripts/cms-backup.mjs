import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const tables = ["cms_entries", "cms_contact_submissions", "cms_projects", "cms_posts", "cms_media", "cms_users", "cms_media_files", "cms_sessions", "cms_revisions", "cms_redirects", "cms_audit_log", "cms_login_attempts", "cms_migrations"];
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

function encode(value) {
  if (Buffer.isBuffer(value)) return { __cmsBackupType: "buffer", value: value.toString("base64") };
  if (value instanceof Date) return { __cmsBackupType: "date", value: value.toISOString() };
  return value;
}

const database = await mysql.createConnection({ uri: databaseUrl, timezone: "Z" });
try {
  const backup = { format: "aureum-cms-backup", version: 1, createdAt: new Date().toISOString(), tables: {} };
  for (const table of tables) {
    const [columns] = await database.query(`SHOW COLUMNS FROM \`${table}\``);
    const [rows] = await database.query(`SELECT * FROM \`${table}\``);
    backup.tables[table] = {
      columns: columns.map((column) => ({ name: column.Field, type: column.Type })),
      rows: rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, encode(value)]))),
    };
  }
  const outputDirectory = path.resolve(process.env.CMS_BACKUP_DIR?.trim() || "backups");
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const outputPath = path.join(outputDirectory, `aureum-cms-${stamp}.json`);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(backup)}\n`, { encoding: "utf8", flag: "wx" });
  console.log(`Backup created: ${outputPath}`);
  console.log(`Rows exported: ${Object.values(backup.tables).reduce((total, table) => total + table.rows.length, 0)}`);
} finally {
  await database.end();
}
