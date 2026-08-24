import process from "node:process";
import mysql from "mysql2/promise";

const migrationKey = "feature-12-public-content-authority";
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const database = await mysql.createConnection({ uri: databaseUrl, timezone: "Z" });

try {
  await database.execute(`CREATE TABLE IF NOT EXISTS cms_migrations (migration_key VARCHAR(191) NOT NULL, details_json JSON NULL, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (migration_key)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [applied] = await database.execute("SELECT migration_key FROM cms_migrations WHERE migration_key = ? LIMIT 1", [migrationKey]);
  if (applied.length) {
    console.log("Public CMS migration was already applied; no records changed.");
    process.exit(0);
  }
  await database.beginTransaction();
  const [projects] = await database.query("SELECT slug, name FROM cms_projects WHERE published = TRUE AND (LEFT(TRIM(name), 1) = '[' OR LEFT(TRIM(location), 1) = '[' OR LEFT(TRIM(metric), 1) = '[' OR LEFT(TRIM(project_status), 1) = '[' OR LEFT(TRIM(philosophy), 1) = '[') FOR UPDATE");
  const [insights] = await database.query("SELECT slug, title FROM cms_posts WHERE published = TRUE AND (LEFT(TRIM(title), 1) = '[' OR LEFT(TRIM(excerpt), 1) = '[' OR LEFT(TRIM(author), 1) = '[' OR LEFT(TRIM(publication_date), 1) = '[') FOR UPDATE");
  for (const project of projects) {
    await database.execute("UPDATE cms_projects SET published = FALSE, archived = FALSE, workflow_status = 'draft', scheduled_at = NULL WHERE slug = ?", [project.slug]);
    await database.execute("INSERT INTO cms_audit_log (actor_user_id, actor_email, action, content_type, content_slug, record_label, metadata_json) VALUES (NULL, 'Feature 12 migration', 'unpublish', 'project', ?, ?, ?)", [project.slug, project.name, JSON.stringify({ reason: "approval placeholders", preserved: true })]);
  }
  for (const insight of insights) {
    await database.execute("UPDATE cms_posts SET published = FALSE, featured = FALSE, archived = FALSE, workflow_status = 'draft', scheduled_at = NULL WHERE slug = ?", [insight.slug]);
    await database.execute("INSERT INTO cms_audit_log (actor_user_id, actor_email, action, content_type, content_slug, record_label, metadata_json) VALUES (NULL, 'Feature 12 migration', 'unpublish', 'insight', ?, ?, ?)", [insight.slug, insight.title, JSON.stringify({ reason: "approval placeholders", preserved: true })]);
  }
  await database.execute("INSERT INTO cms_migrations (migration_key, details_json) VALUES (?, ?)", [migrationKey, JSON.stringify({ projectsMovedToDraft: projects.length, insightsMovedToDraft: insights.length })]);
  await database.commit();
  console.log(`Public CMS migration completed: ${projects.length} placeholder projects and ${insights.length} placeholder insights moved to drafts without deletion.`);
} catch (error) {
  await database.rollback();
  throw error;
} finally {
  await database.end();
}
