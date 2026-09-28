// Moves CMS uploads that were stored inside MySQL (cms_media_files) onto disk.
//
//   npm run cms:migrate-uploads                copy database-stored uploads into UPLOAD_DIR
//   npm run cms:migrate-uploads -- --purge-db  also remove the database copies once verified
//
// UPLOAD_DIR defaults to ./uploads. Existing files are never overwritten, so it is
// safe to run more than once. Until the database copies are purged, the site still
// falls back to them for any file that is not on disk.
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const purge = process.argv.includes("--purge-db");
const uploadRoot = process.env.UPLOAD_DIR?.trim()
  ? path.resolve(process.env.UPLOAD_DIR.trim())
  : path.resolve("uploads");
const FILE_NAME = /^[A-Za-z0-9-]+\.(?:webp|mp4|webm)$/;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Run through npm so .env.local is loaded, or export it.");
}
const database = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await database.query(
    "SELECT public_path, file_data, size_bytes FROM cms_media_files WHERE public_path LIKE '/uploads/media/%'",
  );
  let copied = 0;
  let skipped = 0;
  const verified = [];
  for (const row of rows) {
    const name = row.public_path.slice("/uploads/media/".length);
    if (!FILE_NAME.test(name)) {
      console.warn(`Skipping unexpected path: ${row.public_path}`);
      continue;
    }
    const target = path.join(uploadRoot, "media", name);
    await mkdir(path.dirname(target), { recursive: true });
    const existing = await stat(target).catch(() => null);
    if (existing) {
      skipped += 1;
    } else {
      const temporary = `${target}.${process.pid}.tmp`;
      await writeFile(temporary, row.file_data);
      await rename(temporary, target);
      copied += 1;
    }
    const onDisk = await readFile(target);
    if (onDisk.length === Number(row.size_bytes)) verified.push(row.public_path);
    else console.warn(`Size mismatch, keeping database copy: ${row.public_path}`);
  }
  console.log(`Copied ${copied}, already on disk ${skipped}, verified ${verified.length}/${rows.length} → ${uploadRoot}`);
  if (purge && verified.length) {
    const [result] = await database.query("DELETE FROM cms_media_files WHERE public_path IN (?)", [verified]);
    console.log(`Removed ${result.affectedRows} verified database copies.`);
  } else if (purge) {
    console.log("Nothing verified, so nothing was removed from the database.");
  }
} finally {
  await database.end();
}
