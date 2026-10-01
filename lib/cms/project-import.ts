import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { clientProjects } from "@/data/client-projects";
import { getCmsPool } from "./database";

// Versioned, transactional import. Later CMS edits are never overwritten.
export async function importClientProjectsOnce() {
  const database = getCmsPool();
  if (!database) return;
  const key = "2026-10-client-facility-brochures-v1";
  const db = await database.getConnection();
  try {
    await db.beginTransaction();
    const [claim] = await db.execute("INSERT IGNORE INTO cms_migrations (migration_key, details_json) VALUES (?, ?)", [key, JSON.stringify({ source: "four client facility brochures" })]);
    if (!(claim as { affectedRows: number }).affectedRows) { await db.rollback(); return; }
    for (const project of clientProjects) {
      const fields = {
        slug: project.slug, name: project.name, location: project.location, asset_type: project.type,
        category: project.category, metric: project.metric, project_status: project.status,
        philosophy: project.philosophy, engagement: project.engagement, cover_image: "",
        opportunity: "", strategy: "", delivery: "", outcome: "", chapter_order: "", gallery_images: "",
        homepage_featured: true, homepage_image: "", homepage_headline: project.homepageHeadline,
        homepage_subline: project.homepageSubline, homepage_specs: project.homepageSpecs,
        homepage_tagline: project.homepageTagline, homepage_tagline_sub: project.homepageTaglineSub,
        homepage_closing: project.homepageClosing, homepage_services: "", seo_title: "", seo_description: "",
        canonical_url: "", search_index: true, search_follow: true, social_title: "", social_description: "", social_image: "",
        published: true, archived: false, workflow_status: "published", scheduled_at: null, sort_order: project.sortOrder,
        project_details: JSON.stringify(project.details),
      };
      const columns = Object.keys(fields);
      // Preserve any record an editor has already created under this slug.
      await db.execute(`INSERT IGNORE INTO cms_projects (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`, Object.values(fields));
    }
    // Retire only the known demonstration records, retaining them in the CMS.
    const demos = ["al-quoz-logistics-distribution-centre", "nexus-logistics-warehouse", "abu-dhabi-sustainable-industrial-park"];
    const [records] = await db.query<RowDataPacket[]>("SELECT slug FROM cms_projects WHERE slug IN (?) AND opportunity LIKE '%placeholder copy for the demonstration project%'", [demos]);
    for (const row of records) {
      await db.execute("UPDATE cms_projects SET published = FALSE, homepage_featured = FALSE, workflow_status = 'draft', lock_version = lock_version + 1 WHERE slug = ?", [row.slug]);
    }
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  } finally { db.release(); }
}
