import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { setTimeout as wait } from "node:timers/promises";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required for the scheduler audit.");
const secret = randomBytes(32).toString("base64url");
const port = 3203;
const origin = `http://127.0.0.1:${port}`;
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], { env: { ...process.env, CMS_CRON_SECRET: secret }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let output = "";
server.stdout.on("data", (chunk) => (output += chunk));
server.stderr.on("data", (chunk) => (output += chunk));
const database = await mysql.createConnection({ uri: databaseUrl, timezone: "Z" });
const prefix = `scheduler-qa-${Date.now()}`;
const dueProject = `${prefix}-due-project`;
const futureProject = `${prefix}-future-project`;
const dueInsight = `${prefix}-due-insight`;
const futureInsight = `${prefix}-future-insight`;
const slugs = [dueProject, futureProject, dueInsight, futureInsight];
let failed = false;

function check(pass, label) {
  console.log(`${pass ? "PASS" : "FAIL"} ${label}`);
  if (!pass) failed = true;
}

async function ready() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await wait(250);
  }
  throw new Error(`Scheduler audit server did not start.\n${output}`);
}

async function worker(token = secret) {
  return fetch(origin + "/api/cron/publish", { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
}

async function project(slug, name, due) {
  await database.execute(
    `INSERT INTO cms_projects
      (slug, name, location, asset_type, category, metric, project_status, philosophy, engagement,
       cover_image, opportunity, strategy, delivery, outcome, chapter_order, gallery_images,
       seo_title, seo_description, canonical_url, search_index, search_follow, social_title,
       social_description, social_image, published, archived, workflow_status, scheduled_at, sort_order)
     VALUES (?, ?, 'Dubai', 'Warehouse', 'Logistics', 'QA metric', 'Complete', 'QA summary',
       'Development management', '/media/heroes/portfolio.webp', 'QA opportunity', 'QA strategy',
       'QA delivery', 'QA outcome', 'opportunity,strategy,delivery,outcome', '', '', '', '', TRUE,
       TRUE, '', '', '', FALSE, FALSE, 'scheduled', ${due ? "UTC_TIMESTAMP() - INTERVAL 1 MINUTE" : "UTC_TIMESTAMP() + INTERVAL 1 DAY"}, 9999)`,
    [slug, name],
  );
}

async function insight(slug, title, due) {
  const document = JSON.stringify([{ id: "qa-paragraph", type: "paragraph", text: "QA scheduled article body." }]);
  await database.execute(
    `INSERT INTO cms_posts
      (slug, category, title, excerpt, author, author_title, publication_date, read_time, cover_image,
       body, body_document, pull_quote, seo_title, seo_description, canonical_url, search_index,
       search_follow, social_title, social_description, social_image, published, featured, archived,
       workflow_status, scheduled_at, sort_order)
     VALUES (?, 'Thought Leadership', ?, 'QA summary', 'QA Editor', 'Editor', '21 August 2026',
       '3 min read', '/media/heroes/insights.webp', 'QA scheduled article body.', ?, '', '', '', '',
       TRUE, TRUE, '', '', '', FALSE, FALSE, FALSE, 'scheduled', ${due ? "UTC_TIMESTAMP() - INTERVAL 1 MINUTE" : "UTC_TIMESTAMP() + INTERVAL 1 DAY"}, 9999)`,
    [slug, title, document],
  );
}

try {
  await ready();
  await Promise.all([
    project(dueProject, "Due scheduler project", true),
    project(futureProject, "Future scheduler project", false),
    insight(dueInsight, "Due scheduler insight", true),
    insight(futureInsight, "Future scheduler insight", false),
  ]);

  check((await worker("")).status === 401, "missing worker secret is rejected");
  check((await worker("incorrect-secret-value-that-is-long-enough")).status === 401, "incorrect worker secret is rejected");
  const first = await worker();
  const firstResult = await first.json();
  check(first.ok && firstResult.count === 2 && first.headers.get("cache-control")?.includes("no-store"), "due project and insight publish through the protected worker");

  const [projectRows] = await database.execute("SELECT slug, published, workflow_status, scheduled_at FROM cms_projects WHERE slug IN (?, ?)", [dueProject, futureProject]);
  const [insightRows] = await database.execute("SELECT slug, published, workflow_status, scheduled_at FROM cms_posts WHERE slug IN (?, ?)", [dueInsight, futureInsight]);
  const state = Object.fromEntries([...projectRows, ...insightRows].map((row) => [row.slug, row]));
  check(Boolean(state[dueProject]?.published) && state[dueProject]?.workflow_status === "published" && state[dueProject]?.scheduled_at === null, "due project state is published");
  check(Boolean(state[dueInsight]?.published) && state[dueInsight]?.workflow_status === "published" && state[dueInsight]?.scheduled_at === null, "due insight state is published");
  check(!state[futureProject]?.published && state[futureProject]?.workflow_status === "scheduled" && state[futureProject]?.scheduled_at, "future project remains scheduled");
  check(!state[futureInsight]?.published && state[futureInsight]?.workflow_status === "scheduled" && state[futureInsight]?.scheduled_at, "future insight remains scheduled");

  const second = await worker();
  const secondResult = await second.json();
  check(second.ok && secondResult.count === 0, "repeat worker execution is idempotent");
  const [revisionRows] = await database.execute("SELECT content_type, content_slug, COUNT(*) count FROM cms_revisions WHERE content_slug IN (?, ?) AND event = 'scheduled_publish' GROUP BY content_type, content_slug", [dueProject, dueInsight]);
  const [auditRows] = await database.execute("SELECT content_type, content_slug, COUNT(*) count FROM cms_audit_log WHERE content_slug IN (?, ?) AND action = 'publish' GROUP BY content_type, content_slug", [dueProject, dueInsight]);
  check(revisionRows.length === 2 && revisionRows.every((row) => Number(row.count) === 1), "one immutable scheduled-publish revision is recorded per item");
  check(auditRows.length === 2 && auditRows.every((row) => Number(row.count) === 1), "one scheduler audit event is recorded per item");
} finally {
  await database.execute("DELETE FROM cms_revisions WHERE content_slug IN (?, ?, ?, ?)", slugs);
  await database.execute("DELETE FROM cms_audit_log WHERE content_slug IN (?, ?, ?, ?)", slugs);
  await database.execute("DELETE FROM cms_projects WHERE slug IN (?, ?)", [dueProject, futureProject]);
  await database.execute("DELETE FROM cms_posts WHERE slug IN (?, ?)", [dueInsight, futureInsight]);
  await database.end();
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), wait(2000)]);
}
if (failed) process.exitCode = 1;
