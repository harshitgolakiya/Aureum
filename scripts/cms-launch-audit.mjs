import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setTimeout as wait } from "node:timers/promises";
import mysql from "mysql2/promise";
import sharp from "sharp";

const port = 3201;
const origin = `http://127.0.0.1:${port}`;
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required for the CMS launch audit.");

const manifest = JSON.parse(await readFile(new URL("../.next/server/server-reference-manifest.json", import.meta.url), "utf8"));
const actionId = (name) => Object.entries(manifest.node).find(([, item]) => item.exportedName === name)?.[0];
const actions = Object.fromEntries(["loginAction", "saveProjectEditorAction", "saveInsightEditorAction", "projectLibraryAction", "postLibraryAction", "restoreTrashAction"].map((name) => [name, actionId(name)]));
if (Object.values(actions).some((id) => !id)) throw new Error("The production server-action manifest is incomplete. Run the build first.");

const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let serverOutput = "";
server.stdout.on("data", (chunk) => (serverOutput += chunk));
server.stderr.on("data", (chunk) => (serverOutput += chunk));
const db = await mysql.createConnection({ uri: databaseUrl, timezone: "Z" });
const qa = `qa-${Date.now()}`;
const projectSlug = `${qa}-project`;
const insightSlug = `${qa}-insight`;
const duplicateSlug = `${qa}-duplicate`;
const qaEmails = [`${qa}-editor@example.invalid`, `${qa}-viewer@example.invalid`];
const qaSlugs = [projectSlug, insightSlug, duplicateSlug];
let mediaId = "";
let failed = false;
const futureDubaiInput = () => new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 16);

function check(pass, label, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failed = true;
}

async function ready() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await wait(250);
  }
  throw new Error(`CMS audit server did not start.\n${serverOutput}`);
}

function sessionToken() {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: createHash("sha256").update(raw).digest("hex") };
}

async function createTestUser(role, email) {
  const id = randomUUID();
  const token = sessionToken();
  await db.execute("INSERT INTO cms_users (id, email, password_hash, role, active, must_change_password) VALUES (?, ?, 'qa-not-a-login-hash', ?, TRUE, FALSE)", [id, email, role]);
  await db.execute("INSERT INTO cms_sessions (token_hash, user_id, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 1 HOUR)", [token.hash, id]);
  return { id, cookie: `aureum_cms_session=${token.raw}` };
}

async function callAction(id, route, fields, cookie = "") {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(`_1_${key}`, String(value));
  form.set("0", '["$K1"]');
  return fetch(origin + route, { method: "POST", headers: { Accept: "text/x-component", "Next-Action": id, ...(cookie ? { Cookie: cookie } : {}) }, body: form, redirect: "manual" });
}

const fullProject = (slug, name, lockVersion = 0, intent = "draft") => ({
  intent, originalSlug: lockVersion ? slug : "", lockVersion, slug, name,
  location: "Dubai", type: "Warehouse", category: "Logistics", metric: "10,000 sq ft",
  status: "Complete", philosophy: "QA project summary", engagement: "Development management",
  coverImage: "/media/heroes/portfolio.webp", opportunity: "QA opportunity", strategy: "QA strategy",
  delivery: "QA delivery", outcome: "QA outcome", chapterOrder: "opportunity,strategy,delivery,outcome",
  galleryImages: "", seoTitle: "", seoDescription: "", canonicalUrl: "", socialTitle: "",
  socialDescription: "", socialImage: "", searchIndex: "on", searchFollow: "on", sortOrder: 9999,
  scheduledAt: intent === "schedule" ? futureDubaiInput() : "",
});

const fullInsight = (slug, intent = "draft") => ({
  intent, originalSlug: "", lockVersion: 0, slug, title: "QA launch insight", excerpt: "QA editorial summary",
  author: "QA Editor", authorTitle: "Editor", category: "Thought Leadership", date: "21 August 2026",
  readTime: "3 min read", coverImage: "/media/heroes/insights.webp", bodyDocument: JSON.stringify([{ id: randomUUID(), type: "paragraph", text: "QA article body." }]),
  pullQuote: "", seoTitle: "", seoDescription: "", canonicalUrl: "", socialTitle: "", socialDescription: "",
  socialImage: "", searchIndex: "on", searchFollow: "on", sortOrder: 9999,
  scheduledAt: intent === "schedule" ? futureDubaiInput() : "",
});

async function row(table, slug) {
  const [rows] = await db.execute(`SELECT * FROM ${table} WHERE slug = ? LIMIT 1`, [slug]);
  return rows[0];
}

try {
  await ready();
  await fetch(origin + "/admin/login");
  const editor = await createTestUser("editor", qaEmails[0]);
  const viewer = await createTestUser("viewer", qaEmails[1]);

  const anonymousAdmin = await fetch(origin + "/admin", { redirect: "manual" });
  check([302, 303, 307, 308].includes(anonymousAdmin.status) && anonymousAdmin.headers.get("location")?.includes("/admin/login"), "anonymous admin access is redirected");
  check((await fetch(origin + "/api/admin/media")).status === 401, "anonymous media API is rejected");
  check((await fetch(origin + "/admin", { headers: { Cookie: viewer.cookie } })).ok, "viewer can open the dashboard");
  const viewerEdit = await fetch(origin + "/admin/projects/new", { headers: { Cookie: viewer.cookie }, redirect: "manual" });
  check([302, 303, 307, 308].includes(viewerEdit.status) && viewerEdit.headers.get("location")?.includes("error=forbidden"), "viewer cannot open an editor");
  check((await fetch(origin + "/api/admin/media", { headers: { Cookie: viewer.cookie } })).ok, "viewer has read-only media access");
  const deniedUpload = new FormData();
  deniedUpload.set("file", new Blob(["not-an-image"], { type: "image/png" }), "qa.png");
  deniedUpload.set("altText", "QA");
  check((await fetch(origin + "/api/admin/media", { method: "POST", headers: { Cookie: viewer.cookie }, body: deniedUpload })).status === 403, "viewer media upload is forbidden");
  check((await fetch(origin + "/admin/projects/new", { headers: { Cookie: editor.cookie } })).ok, "editor can open content editors");

  const badEmail = `${qa}-locked@example.invalid`;
  let lastLogin;
  for (let attempt = 0; attempt < 7; attempt += 1) lastLogin = await callAction(actions.loginAction, "/admin/login", { email: badEmail, password: "Definitely-wrong-123!" });
  const lastLoginBody = await lastLogin?.text();
  check(Boolean(lastLogin?.headers.get("location")?.includes("error=locked") || lastLoginBody?.includes("error=locked")), "login rate limiting locks repeated failures");
  await db.execute("DELETE FROM cms_login_attempts WHERE email = ?", [badEmail]);

  await callAction(actions.saveProjectEditorAction, "/admin/projects/new", fullProject(projectSlug, "QA workflow project"), editor.cookie);
  check((await row("cms_projects", projectSlug))?.workflow_status === "draft", "project draft creation");
  await callAction(actions.saveProjectEditorAction, `/admin/projects/${projectSlug}`, fullProject(projectSlug, "QA workflow project", 1, "publish"), editor.cookie);
  check(Boolean((await row("cms_projects", projectSlug))?.published), "project publishing");
  await callAction(actions.projectLibraryAction, "/admin/projects", { slug: projectSlug, operation: "archive" }, editor.cookie);
  check((await row("cms_projects", projectSlug))?.workflow_status === "archived", "project archive");
  await callAction(actions.projectLibraryAction, "/admin/projects", { slug: projectSlug, operation: "restore" }, editor.cookie);
  check((await row("cms_projects", projectSlug))?.workflow_status === "unpublished", "project archive restore");

  const scheduledFields = fullInsight(insightSlug, "schedule");
  const expectedSchedule = new Date(`${scheduledFields.scheduledAt}:00+04:00`);
  const scheduleResponse = await callAction(actions.saveInsightEditorAction, "/admin/insights/new", scheduledFields, editor.cookie);
  const scheduleBody = await scheduleResponse.text();
  const scheduledInsight = await row("cms_posts", insightSlug);
  check(scheduledInsight?.workflow_status === "scheduled", "insight scheduling", scheduledInsight ? `status ${scheduledInsight.workflow_status}` : scheduleBody.slice(0, 240));
  const actualSchedule = scheduledInsight?.scheduled_at ? new Date(scheduledInsight.scheduled_at) : null;
  check(
    Boolean(actualSchedule) && Math.abs(actualSchedule.getTime() - expectedSchedule.getTime()) < 1000,
    "Dubai schedule is stored as the correct UTC instant",
    actualSchedule ? `expected ${expectedSchedule.toISOString()}, got ${actualSchedule.toISOString()}` : "scheduled_at was empty",
  );
  await callAction(actions.postLibraryAction, "/admin/insights", { slug: insightSlug, operation: "cancel_schedule" }, editor.cookie);
  check((await row("cms_posts", insightSlug))?.workflow_status === "draft", "scheduled insight cancellation");
  await callAction(actions.postLibraryAction, "/admin/insights", { slug: insightSlug, operation: "trash" }, editor.cookie);
  check(Boolean((await row("cms_posts", insightSlug))?.deleted_at), "insight soft delete");
  await callAction(actions.restoreTrashAction, "/admin/recovery", { contentType: "insight", slug: insightSlug }, editor.cookie);
  check((await row("cms_posts", insightSlug))?.workflow_status === "unpublished" && !(await row("cms_posts", insightSlug))?.deleted_at, "trash recovery");

  const duplicateResults = await Promise.all([
    callAction(actions.saveProjectEditorAction, "/admin/projects/new", fullProject(duplicateSlug, "First concurrent save"), editor.cookie),
    callAction(actions.saveProjectEditorAction, "/admin/projects/new", fullProject(duplicateSlug, "Second concurrent save"), editor.cookie),
  ]);
  const [duplicateRows] = await db.execute("SELECT name, lock_version FROM cms_projects WHERE slug = ?", [duplicateSlug]);
  const [duplicateRevisions] = await db.execute("SELECT COUNT(*) AS count FROM cms_revisions WHERE content_type = 'project' AND content_slug = ? AND event = 'draft'", [duplicateSlug]);
  check(duplicateRows.length === 1 && Number(duplicateRevisions[0].count) === 1 && duplicateResults.every((response) => response.status < 500), "duplicate-slug race creates exactly one record");
  const winningName = duplicateRows[0].name;
  await Promise.all([
    callAction(actions.saveProjectEditorAction, `/admin/projects/${duplicateSlug}`, fullProject(duplicateSlug, "Concurrent edit A", 1, "save"), editor.cookie),
    callAction(actions.saveProjectEditorAction, `/admin/projects/${duplicateSlug}`, fullProject(duplicateSlug, "Concurrent edit B", 1, "save"), editor.cookie),
  ]);
  const edited = await row("cms_projects", duplicateSlug);
  check(edited.lock_version === 2 && edited.name !== winningName && ["Concurrent edit A", "Concurrent edit B"].includes(edited.name), "stale concurrent edit is rejected without overwrite");

  const image = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#17345c" } }).png().toBuffer();
  const upload = new FormData();
  upload.set("file", new Blob([image], { type: "image/png" }), "launch-audit.png");
  upload.set("filename", "Launch audit image");
  upload.set("altText", "Solid blue launch audit image");
  const uploadResponse = await fetch(origin + "/api/admin/media", { method: "POST", headers: { Cookie: editor.cookie }, body: upload });
  const uploaded = await uploadResponse.json();
  mediaId = uploaded.asset?.id ?? "";
  check(uploadResponse.ok && uploaded.asset?.mimeType === "image/webp" && uploaded.asset?.width === 1200 && uploaded.asset?.variants?.length === 2, "image upload converts to WebP with responsive variants");
  if (mediaId) {
    const mediaResponse = await fetch(origin + uploaded.asset.publicPath);
    check(mediaResponse.ok && mediaResponse.headers.get("content-type")?.includes("image/webp"), "optimized media is publicly served");
    const deleteResponse = await fetch(`${origin}/api/admin/media?id=${mediaId}`, { method: "DELETE", headers: { Cookie: editor.cookie } });
    check(deleteResponse.ok, "unused uploaded media can be safely deleted");
    mediaId = "";
  }
} finally {
  if (mediaId) await fetch(`${origin}/api/admin/media?id=${mediaId}`, { method: "DELETE" }).catch(() => {});
  await db.execute("DELETE FROM cms_revisions WHERE content_slug IN (?, ?, ?)", qaSlugs);
  await db.execute("DELETE FROM cms_redirects WHERE old_slug IN (?, ?, ?) OR new_slug IN (?, ?, ?)", [...qaSlugs, ...qaSlugs]);
  await db.execute("DELETE FROM cms_audit_log WHERE content_slug IN (?, ?, ?) OR actor_email IN (?, ?)", [...qaSlugs, ...qaEmails]);
  await db.execute("DELETE FROM cms_projects WHERE slug IN (?, ?)", [projectSlug, duplicateSlug]);
  await db.execute("DELETE FROM cms_posts WHERE slug = ?", [insightSlug]);
  await db.execute("DELETE FROM cms_login_attempts WHERE email LIKE ?", [`${qa}%`]);
  await db.execute("DELETE FROM cms_users WHERE email IN (?, ?)", qaEmails);
  await db.end();
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), wait(2000)]);
}

if (failed) process.exitCode = 1;
