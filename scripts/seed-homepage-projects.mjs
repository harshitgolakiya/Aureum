// Seeds the client brochure facilities used by the portfolio and homepage story.
//
//   npm run cms:seed-homepage                  add/refresh the client facilities
//   npm run cms:seed-homepage -- --retire-old  also soft-delete previous demo projects
//
// Safe to run more than once. Retired projects are soft-deleted, so they can be
// restored from the CMS Trash.
import mysql from "mysql2/promise";
import { clientProjects as projects } from "./client-project-data.mjs";

const retireOld = process.argv.includes("--retire-old");
const oldDemoSlugs = [
  "aureum-logistics-campus-demo",
  "dubai-urban-distribution-hub-demo",
  "abu-dhabi-sustainable-industrial-park-demo",
  "dubai-south-cold-chain-centre-demo",
  "project-4",
  "al-quoz-logistics-distribution-centre",
  "nexus-logistics-warehouse",
  "abu-dhabi-sustainable-industrial-park",
];

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Run through npm so .env.local is loaded, or export it.");
}
const database = await mysql.createConnection(process.env.DATABASE_URL);

async function ensureHomepageColumns() {
  const [rows] = await database.query("SHOW COLUMNS FROM cms_projects LIKE 'homepage%'");
  const have = new Set(rows.map((row) => String(row.Field)));
  const columns = [
    ["homepage_featured", "BOOLEAN NOT NULL DEFAULT FALSE", "gallery_images"],
    ["homepage_image", "VARCHAR(500) NOT NULL DEFAULT ''", "homepage_featured"],
    ["homepage_headline", "VARCHAR(300) NOT NULL DEFAULT ''", "homepage_image"],
    ["homepage_subline", "VARCHAR(300) NOT NULL DEFAULT ''", "homepage_headline"],
    ["homepage_specs", "TEXT NOT NULL", "homepage_subline"],
    ["homepage_tagline", "VARCHAR(1000) NOT NULL DEFAULT ''", "homepage_specs"],
    ["homepage_tagline_sub", "VARCHAR(1000) NOT NULL DEFAULT ''", "homepage_tagline"],
    ["homepage_closing", "VARCHAR(1000) NOT NULL DEFAULT ''", "homepage_tagline_sub"],
    ["homepage_services", "VARCHAR(1000) NOT NULL DEFAULT ''", "homepage_closing"],
  ];
  for (const [name, definition, after] of columns) {
    if (!have.has(name)) {
      await database.execute(`ALTER TABLE cms_projects ADD COLUMN ${name} ${definition} AFTER ${after}`);
      console.log(`Added column ${name}`);
    }
  }
  const [detailsColumns] = await database.query("SHOW COLUMNS FROM cms_projects LIKE 'project_details'");
  if (!detailsColumns.length) await database.execute("ALTER TABLE cms_projects ADD COLUMN project_details JSON NULL");
}

try {
  await database.beginTransaction();
  await ensureHomepageColumns();

  if (retireOld) {
    const [result] = await database.query(
      `UPDATE cms_projects
         SET deleted_at = UTC_TIMESTAMP(), published = FALSE, archived = TRUE,
             workflow_status = 'archived', scheduled_at = NULL, homepage_featured = FALSE
       WHERE slug IN (?) AND deleted_at IS NULL`,
      [oldDemoSlugs],
    );
    console.log(`Retired ${result.affectedRows} previous demo project(s).`);
  }

  for (const project of projects) {
    await database.execute(
      `INSERT INTO cms_projects
        (slug, name, location, asset_type, category, metric, project_status, philosophy, engagement,
         cover_image, opportunity, strategy, delivery, outcome, chapter_order, gallery_images,
         homepage_featured, homepage_image, homepage_headline, homepage_subline, homepage_specs,
         homepage_tagline, homepage_tagline_sub, homepage_closing, homepage_services,
         seo_title, seo_description, canonical_url, search_index, search_follow,
         social_title, social_description, social_image,
         published, archived, workflow_status, scheduled_at, deleted_at, sort_order, project_details)
       VALUES (${Array(40).fill("?").join(", ")})
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), location = VALUES(location), asset_type = VALUES(asset_type),
         category = VALUES(category), metric = VALUES(metric), project_status = VALUES(project_status),
         philosophy = VALUES(philosophy), engagement = VALUES(engagement), cover_image = VALUES(cover_image),
         opportunity = VALUES(opportunity), strategy = VALUES(strategy), delivery = VALUES(delivery),
         outcome = VALUES(outcome), chapter_order = VALUES(chapter_order), gallery_images = VALUES(gallery_images),
         homepage_featured = VALUES(homepage_featured), homepage_image = VALUES(homepage_image),
         homepage_headline = VALUES(homepage_headline), homepage_subline = VALUES(homepage_subline),
         homepage_specs = VALUES(homepage_specs), homepage_tagline = VALUES(homepage_tagline),
         homepage_tagline_sub = VALUES(homepage_tagline_sub), homepage_closing = VALUES(homepage_closing),
         homepage_services = VALUES(homepage_services),
         project_details = VALUES(project_details),
         published = VALUES(published), archived = VALUES(archived), workflow_status = VALUES(workflow_status),
         scheduled_at = VALUES(scheduled_at), deleted_at = VALUES(deleted_at), sort_order = VALUES(sort_order)`,
      [
        project.slug, project.name, project.location, project.type, project.category, project.metric,
        project.status, project.philosophy, project.engagement, project.coverImage,
        project.opportunity, project.strategy, project.delivery, project.outcome,
        project.chapterOrder, project.galleryImages,
        project.homepageFeatured, project.homepageImage, project.homepageHeadline, project.homepageSubline,
        project.homepageSpecs, project.homepageTagline, project.homepageTaglineSub,
        project.homepageClosing, project.homepageServices,
        project.seoTitle, project.seoDescription, project.canonicalUrl,
        project.searchIndex, project.searchFollow,
        project.socialTitle, project.socialDescription, project.socialImage,
        project.published, project.archived, project.workflowStatus, null, null, project.sortOrder, JSON.stringify(project.details),
      ],
    );
    console.log(`Seeded ${project.slug}`);
  }
  await database.commit();
} catch (error) {
  await database.rollback();
  throw error;
} finally {
  await database.end();
}
