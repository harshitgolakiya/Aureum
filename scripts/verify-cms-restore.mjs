import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mysql from "mysql2/promise";

const backupArgument = process.argv[2];
if (!backupArgument) throw new Error("Usage: node scripts/verify-cms-restore.mjs <backup.json>");
const sourceUrl = new URL(process.env.DATABASE_URL?.trim() ?? "");
if (!sourceUrl.pathname.slice(1)) throw new Error("DATABASE_URL must name the source CMS database.");
const backupUrl = pathToFileURL(resolve(backupArgument));
const backup = JSON.parse(await readFile(backupUrl, "utf8"));
const sourceDatabase = sourceUrl.pathname.slice(1);
const targetDatabase = process.env.CMS_RESTORE_TEST_DATABASE || `aureum_restore_qa_${Date.now()}`;
if (!/^aureum_restore_qa_[a-z0-9_]+$/.test(targetDatabase)) throw new Error("Unsafe restore test database name.");
const tables = Object.keys(backup.tables ?? {});
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/";
const targetUrl = new URL(sourceUrl);
targetUrl.pathname = `/${targetDatabase}`;
const database = await mysql.createConnection(adminUrl.toString());

try {
  await database.query(`CREATE DATABASE IF NOT EXISTS \`${targetDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  for (const table of tables) {
    if (!/^cms_[a-z_]+$/.test(table)) throw new Error(`Unsafe table name: ${table}`);
    await database.query(`CREATE TABLE \`${targetDatabase}\`.\`${table}\` LIKE \`${sourceDatabase}\`.\`${table}\``);
  }
  const restoreScript = fileURLToPath(new URL("./cms-restore.mjs", import.meta.url));
  const restored = spawnSync(process.execPath, [restoreScript, fileURLToPath(backupUrl), "--replace"], {
    env: { ...process.env, DATABASE_URL: targetUrl.toString() },
    encoding: "utf8",
    windowsHide: true,
  });
  if (restored.status !== 0) throw new Error(restored.stderr || restored.stdout || "Restore command failed.");
  const [counts] = await database.query(`SELECT ${tables.map((table) => `(SELECT COUNT(*) FROM \`${targetDatabase}\`.\`${table}\`) AS \`${table}\``).join(", ")}`);
  const mismatches = tables.filter((table) => Number(counts[0][table]) !== backup.tables[table].rows.length);
  if (mismatches.length) throw new Error(`Restore row-count mismatch: ${mismatches.join(", ")}`);
  console.log(`PASS isolated restore verified across ${tables.length} tables and ${tables.reduce((total, table) => total + backup.tables[table].rows.length, 0)} rows.`);
} finally {
  await database.query(`DROP DATABASE IF EXISTS \`${targetDatabase}\``).catch(() => {});
  await database.end();
}
