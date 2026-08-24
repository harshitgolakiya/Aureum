import process from "node:process";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const base = (process.env.CMS_VERIFY_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const database = await mysql.createConnection({ uri: databaseUrl, timezone: "Z" });

function assert(condition, message) { if (!condition) throw new Error(message); }
async function html(path) { const response = await fetch(`${base}${path}`, { redirect: "manual" }); return { response, body: await response.text() }; }

try {
  const [projects] = await database.query("SELECT slug, name, search_index FROM cms_projects WHERE published = TRUE AND archived = FALSE AND deleted_at IS NULL ORDER BY slug");
  const [insights] = await database.query("SELECT slug, title, search_index FROM cms_posts WHERE published = TRUE AND archived = FALSE AND deleted_at IS NULL ORDER BY slug");
  assert(projects.every((project) => !project.name.trim().startsWith("[")), "A project with approval placeholders is still published.");
  assert(insights.every((insight) => !insight.title.trim().startsWith("[")), "An insight with approval placeholders is still published.");
  const [hiddenProjects] = await database.query("SELECT slug FROM cms_projects WHERE (published = FALSE OR archived = TRUE OR deleted_at IS NOT NULL) ORDER BY slug");
  const [hiddenInsights] = await database.query("SELECT slug FROM cms_posts WHERE (published = FALSE OR archived = TRUE OR deleted_at IS NOT NULL) ORDER BY slug");
  const [home, portfolio, insightList, sitemap] = await Promise.all([html("/"), html("/portfolio"), html("/insights"), html("/sitemap.xml")]);
  for (const page of [home, portfolio, insightList, sitemap]) assert(page.response.status === 200, `Public route returned ${page.response.status}.`);
  for (const project of projects) {
    assert(portfolio.body.includes(`/portfolio/${project.slug}`), `Published project ${project.slug} is missing from Portfolio.`);
    const detail = await html(`/portfolio/${project.slug}`);
    assert(detail.response.status === 200 && detail.body.includes(project.name), `Published project ${project.slug} detail failed.`);
    assert(Boolean(project.search_index) ? sitemap.body.includes(`/portfolio/${project.slug}`) : !sitemap.body.includes(`/portfolio/${project.slug}`), `Project ${project.slug} sitemap state is incorrect.`);
  }
  for (const insight of insights) {
    assert(insightList.body.includes(`/insights/${insight.slug}`), `Published insight ${insight.slug} is missing from Insights.`);
    const detail = await html(`/insights/${insight.slug}`);
    assert(detail.response.status === 200 && detail.body.includes(insight.title), `Published insight ${insight.slug} detail failed.`);
    assert(Boolean(insight.search_index) ? sitemap.body.includes(`/insights/${insight.slug}`) : !sitemap.body.includes(`/insights/${insight.slug}`), `Insight ${insight.slug} sitemap state is incorrect.`);
  }
  for (const item of hiddenProjects) assert(!portfolio.body.includes(`/portfolio/${item.slug}`) && !sitemap.body.includes(`/portfolio/${item.slug}`), `Non-public project ${item.slug} leaked publicly.`);
  for (const item of hiddenInsights) assert(!insightList.body.includes(`/insights/${item.slug}`) && !sitemap.body.includes(`/insights/${item.slug}`), `Non-public insight ${item.slug} leaked publicly.`);
  console.log(`Public CMS readiness passed: ${projects.length} projects and ${insights.length} insights are live.`);
} finally {
  await database.end();
}
