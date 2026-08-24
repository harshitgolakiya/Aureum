import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { connection } from "next/server";
import {
  insightArticles as fallbackPosts,
  projects as fallbackProjects,
  type CmsWorkflowStatus,
  type InsightArticle,
  type Project,
} from "@/data/site";
import { ensureCmsSchema, getCmsPool } from "./database";
import { recordCmsRevision } from "./revisions";
import { recordCmsAudit } from "./audit";
import { softDeleteCmsRecord } from "./recovery";

type ProjectRow = RowDataPacket & {
  slug: string;
  name: string;
  location: string;
  asset_type: string;
  category: string;
  metric: string;
  project_status: string;
  philosophy: string;
  engagement: string;
  cover_image: string;
  opportunity: string;
  strategy: string;
  delivery: string;
  outcome: string;
  chapter_order: string;
  gallery_images: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  search_index: number | boolean;
  search_follow: number | boolean;
  social_title: string;
  social_description: string;
  social_image: string;
  published: number | boolean;
  archived: number | boolean;
  workflow_status: CmsWorkflowStatus;
  scheduled_at: Date | null;
  sort_order: number;
  lock_version: number;
  updated_at: Date;
};

type PostRow = RowDataPacket & {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  author_title: string;
  publication_date: string;
  read_time: string;
  cover_image: string;
  body: string;
  body_document: unknown;
  pull_quote: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  search_index: number | boolean;
  search_follow: number | boolean;
  social_title: string;
  social_description: string;
  social_image: string;
  published: number | boolean;
  featured: number | boolean;
  archived: number | boolean;
  workflow_status: CmsWorkflowStatus;
  scheduled_at: Date | null;
  sort_order: number;
  lock_version: number;
  updated_at: Date;
};

function projectFromRow(row: ProjectRow): Project {
  return {
    slug: row.slug,
    name: row.name,
    location: row.location,
    type: row.asset_type,
    category: row.category,
    metric: row.metric,
    status: row.project_status,
    philosophy: row.philosophy,
    engagement: row.engagement,
    coverImage: row.cover_image,
    opportunity: row.opportunity,
    strategy: row.strategy,
    delivery: row.delivery,
    outcome: row.outcome,
    chapterOrder: row.chapter_order,
    galleryImages: row.gallery_images,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    searchIndex: Boolean(row.search_index),
    searchFollow: Boolean(row.search_follow),
    socialTitle: row.social_title,
    socialDescription: row.social_description,
    socialImage: row.social_image,
    published: Boolean(row.published),
    archived: Boolean(row.archived),
    workflowStatus: row.workflow_status,
    scheduledAt: row.scheduled_at?.toISOString() ?? "",
    sortOrder: row.sort_order,
  };
}

function postFromRow(row: PostRow): InsightArticle {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    author: row.author,
    authorTitle: row.author_title,
    date: row.publication_date,
    readTime: row.read_time,
    coverImage: row.cover_image,
    body: row.body,
    bodyDocument: typeof row.body_document === "string" ? row.body_document : row.body_document ? JSON.stringify(row.body_document) : "",
    pullQuote: row.pull_quote,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    searchIndex: Boolean(row.search_index),
    searchFollow: Boolean(row.search_follow),
    socialTitle: row.social_title,
    socialDescription: row.social_description,
    socialImage: row.social_image,
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    archived: Boolean(row.archived),
    workflowStatus: row.workflow_status,
    scheduledAt: row.scheduled_at?.toISOString() ?? "",
    sortOrder: row.sort_order,
  };
}

export async function getProjects(includeDrafts = false): Promise<Project[]> {
  await connection();
  const database = getCmsPool();
  if (!database) return fallbackProjects.filter((item) => includeDrafts || item.published);
  try {
    await ensureCmsSchema();
    await publishDueContent();
    const [rows] = await database.query<ProjectRow[]>(
      `SELECT slug, name, location, asset_type, category, metric, project_status,
        philosophy, engagement, cover_image, opportunity, strategy, delivery,
        outcome, chapter_order, gallery_images, seo_title, seo_description,
        canonical_url, search_index, search_follow, social_title, social_description, social_image,
        published, archived, workflow_status, scheduled_at, sort_order, updated_at
       FROM cms_projects
       ${includeDrafts ? "WHERE archived = FALSE AND deleted_at IS NULL" : "WHERE published = TRUE AND archived = FALSE AND deleted_at IS NULL"}
       ORDER BY sort_order ASC, updated_at DESC`,
    );
    return rows.map(projectFromRow);
  } catch (error) {
    console.warn("CMS projects are unavailable; using checked-in fallbacks.", error);
    return fallbackProjects.filter((item) => includeDrafts || item.published);
  }
}

export async function getProjectBySlug(slug: string, includeDrafts = false) {
  const items = await getProjects(includeDrafts);
  return items.find((item) => item.slug === slug) ?? null;
}

export type CmsProjectListItem = Project & { updatedAt: Date; lockVersion: number };

export async function getCmsProjectLibrary(): Promise<CmsProjectListItem[]> {
  await connection();
  const database = getCmsPool();
  if (!database) {
    return fallbackProjects.map((item) => ({ ...item, updatedAt: new Date(0), lockVersion: 0 }));
  }
  try {
    await ensureCmsSchema();
    await publishDueContent();
    const [rows] = await database.query<ProjectRow[]>(
      `SELECT slug, name, location, asset_type, category, metric, project_status,
        philosophy, engagement, cover_image, opportunity, strategy, delivery,
        outcome, chapter_order, gallery_images, seo_title, seo_description,
        canonical_url, search_index, search_follow, social_title, social_description, social_image,
        published, archived, workflow_status, scheduled_at, sort_order, lock_version, updated_at
       FROM cms_projects WHERE deleted_at IS NULL
       ORDER BY updated_at DESC, sort_order ASC`,
    );
    return rows.map((row) => ({ ...projectFromRow(row), updatedAt: row.updated_at, lockVersion: row.lock_version }));
  } catch (error) {
    console.warn("CMS project library is unavailable.", error);
    return fallbackProjects.map((item) => ({ ...item, updatedAt: new Date(0), lockVersion: 0 }));
  }
}

export async function getCmsProjectRecord(slug: string) {
  const projects = await getCmsProjectLibrary();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function isProjectSlugAvailable(slug: string, originalSlug = "") {
  const database = getCmsPool();
  if (!database) return false;
  await ensureCmsSchema();
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT slug FROM cms_projects WHERE slug = ? AND slug <> ? LIMIT 1",
    [slug, originalSlug],
  );
  const [redirects] = await database.execute<RowDataPacket[]>("SELECT 1 FROM cms_redirects WHERE content_type = 'project' AND old_slug = ? LIMIT 1", [slug]);
  return !rows.length && !redirects.length;
}

export async function getPosts(includeDrafts = false): Promise<InsightArticle[]> {
  await connection();
  const database = getCmsPool();
  if (!database) return fallbackPosts.filter((item) => !item.archived && (includeDrafts || item.published));
  try {
    await ensureCmsSchema();
    await publishDueContent();
    const [rows] = await database.query<PostRow[]>(
      `SELECT slug, category, title, excerpt, author, author_title,
        publication_date, read_time, cover_image, body, body_document, pull_quote,
        seo_title, seo_description, canonical_url, search_index, search_follow,
        social_title, social_description, social_image, published,
        featured, archived, workflow_status, scheduled_at, sort_order, updated_at
       FROM cms_posts
       WHERE archived = FALSE AND deleted_at IS NULL${includeDrafts ? "" : " AND published = TRUE"}
       ORDER BY featured DESC, sort_order ASC, updated_at DESC`,
    );
    return rows.map(postFromRow);
  } catch (error) {
    console.warn("CMS posts are unavailable; using checked-in fallbacks.", error);
    return fallbackPosts.filter((item) => !item.archived && (includeDrafts || item.published));
  }
}

export async function getPostBySlug(slug: string, includeDrafts = false) {
  const items = await getPosts(includeDrafts);
  return items.find((item) => item.slug === slug) ?? null;
}

export type CmsPostListItem = InsightArticle & { updatedAt: Date; lockVersion: number };

export async function getCmsPostLibrary(): Promise<CmsPostListItem[]> {
  await connection();
  const database = getCmsPool();
  if (!database) return [];
  await ensureCmsSchema();
  await publishDueContent();
  const [rows] = await database.query<PostRow[]>(
    `SELECT slug, category, title, excerpt, author, author_title,
      publication_date, read_time, cover_image, body, body_document, pull_quote,
      seo_title, seo_description, canonical_url, search_index, search_follow,
      social_title, social_description, social_image, published,
      featured, archived, workflow_status, scheduled_at, sort_order, lock_version, updated_at
     FROM cms_posts WHERE deleted_at IS NULL
     ORDER BY updated_at DESC`,
  );
  return rows.map((row) => ({ ...postFromRow(row), updatedAt: row.updated_at, lockVersion: row.lock_version }));
}

export async function getCmsPostRecord(slug: string) {
  const posts = await getCmsPostLibrary();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function isPostSlugAvailable(slug: string, originalSlug = "") {
  const database = getCmsPool();
  if (!database) return false;
  await ensureCmsSchema();
  const [rows] = await database.execute<RowDataPacket[]>(
    "SELECT slug FROM cms_posts WHERE slug = ? AND slug <> ? LIMIT 1",
    [slug, originalSlug],
  );
  const [redirects] = await database.execute<RowDataPacket[]>("SELECT 1 FROM cms_redirects WHERE content_type = 'insight' AND old_slug = ? LIMIT 1", [slug]);
  return !rows.length && !redirects.length;
}

export type CmsActivityItem = {
  kind: "Project" | "Insight";
  slug: string;
  title: string;
  published: boolean;
  updatedAt: Date;
};

export async function getCmsRecentActivity(): Promise<CmsActivityItem[]> {
  await connection();
  const database = getCmsPool();
  if (!database) return [];
  try {
    await ensureCmsSchema();
    const [rows] = await database.query<(RowDataPacket & {
      kind: "Project" | "Insight";
      slug: string;
      title: string;
      published: number | boolean;
      updated_at: Date;
    })[]>(
      `SELECT kind, slug, title, published, updated_at FROM (
         SELECT 'Project' AS kind, slug, name AS title, published, updated_at FROM cms_projects WHERE deleted_at IS NULL
         UNION ALL
         SELECT 'Insight' AS kind, slug, title, published, updated_at FROM cms_posts WHERE deleted_at IS NULL
       ) AS activity
       ORDER BY updated_at DESC
       LIMIT 6`,
    );
    return rows.map((row) => ({
      kind: row.kind,
      slug: row.slug,
      title: row.title,
      published: Boolean(row.published),
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.warn("CMS activity is unavailable.", error);
    return [];
  }
}

async function saveSlugRedirect(contentType: "project" | "insight", oldSlug: string, newSlug: string) {
  const database = getCmsPool();
  if (!database || oldSlug === newSlug) return;
  await database.execute(
    "UPDATE cms_redirects SET new_slug = ? WHERE content_type = ? AND new_slug = ?",
    [newSlug, contentType, oldSlug],
  );
  await database.execute(
    `INSERT INTO cms_redirects (content_type, old_slug, new_slug) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE new_slug = VALUES(new_slug)`,
    [contentType, oldSlug, newSlug],
  );
}

export async function getCmsRedirect(contentType: "project" | "insight", oldSlug: string) {
  const database = getCmsPool();
  if (!database) return null;
  await ensureCmsSchema();
  const [rows] = await database.execute<(RowDataPacket & { new_slug: string })[]>(
    "SELECT new_slug FROM cms_redirects WHERE content_type = ? AND old_slug = ? LIMIT 1",
    [contentType, oldSlug],
  );
  return rows[0]?.new_slug ?? null;
}

export type CmsSlugRedirect = { oldSlug: string; newSlug: string; createdAt: Date };

export async function getCmsRedirectHistory(contentType: "project" | "insight", currentSlug: string): Promise<CmsSlugRedirect[]> {
  const database = getCmsPool();
  if (!database) return [];
  await ensureCmsSchema();
  const [rows] = await database.execute<(RowDataPacket & { old_slug: string; new_slug: string; created_at: Date })[]>(
    "SELECT old_slug, new_slug, created_at FROM cms_redirects WHERE content_type = ? AND new_slug = ? ORDER BY created_at DESC",
    [contentType, currentSlug],
  );
  return rows.map((row) => ({ oldSlug: row.old_slug, newSlug: row.new_slug, createdAt: row.created_at }));
}

export class CmsWriteConflictError extends Error {
  constructor() {
    super("This record changed after the editor was opened.");
    this.name = "CmsWriteConflictError";
  }
}

export async function saveProject(originalSlug: string, project: Project, expectedVersion?: number) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  if (originalSlug && expectedVersion !== undefined) {
    const [claim] = await database.execute<ResultSetHeader>(
      "UPDATE cms_projects SET lock_version = lock_version + 1 WHERE slug = ? AND lock_version = ? AND deleted_at IS NULL",
      [originalSlug, expectedVersion],
    );
    if (!claim.affectedRows) throw new CmsWriteConflictError();
  }
  if (originalSlug && originalSlug !== project.slug) {
    await database.execute<ResultSetHeader>(
      "UPDATE cms_projects SET slug = ? WHERE slug = ?",
      [project.slug, originalSlug],
    );
    await saveSlugRedirect("project", originalSlug, project.slug);
  }
  await database.execute<ResultSetHeader>(
    `INSERT INTO cms_projects
      (slug, name, location, asset_type, category, metric, project_status,
       philosophy, engagement, cover_image, opportunity, strategy, delivery,
       outcome, chapter_order, gallery_images, seo_title, seo_description,
       canonical_url, search_index, search_follow, social_title, social_description, social_image,
       published, archived, workflow_status, scheduled_at, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ${originalSlug ? `ON DUPLICATE KEY UPDATE
       name = VALUES(name), location = VALUES(location),
       asset_type = VALUES(asset_type), category = VALUES(category),
       metric = VALUES(metric), project_status = VALUES(project_status),
       philosophy = VALUES(philosophy), engagement = VALUES(engagement),
       cover_image = VALUES(cover_image), opportunity = VALUES(opportunity),
       strategy = VALUES(strategy), delivery = VALUES(delivery),
       outcome = VALUES(outcome), chapter_order = VALUES(chapter_order),
       gallery_images = VALUES(gallery_images), seo_title = VALUES(seo_title),
       seo_description = VALUES(seo_description),
       canonical_url = VALUES(canonical_url), search_index = VALUES(search_index),
       search_follow = VALUES(search_follow), social_title = VALUES(social_title),
       social_description = VALUES(social_description), social_image = VALUES(social_image),
       published = VALUES(published), archived = VALUES(archived),
       workflow_status = VALUES(workflow_status), scheduled_at = VALUES(scheduled_at),
       sort_order = VALUES(sort_order)${expectedVersion === undefined ? ", lock_version = lock_version + 1" : ""}` : ""}`,
    [
      project.slug,
      project.name,
      project.location,
      project.type,
      project.category,
      project.metric,
      project.status,
      project.philosophy,
      project.engagement,
      project.coverImage,
      project.opportunity,
      project.strategy,
      project.delivery,
      project.outcome,
      project.chapterOrder,
      project.galleryImages,
      project.seoTitle,
      project.seoDescription,
      project.canonicalUrl,
      project.searchIndex,
      project.searchFollow,
      project.socialTitle,
      project.socialDescription,
      project.socialImage,
      project.published,
      project.archived,
      project.workflowStatus,
      project.scheduledAt ? new Date(project.scheduledAt) : null,
      project.sortOrder,
    ],
  );
}

export async function updateProjectLibraryState(
  slug: string,
  action: "publish" | "unpublish" | "archive" | "restore" | "cancel_schedule",
) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const statements = {
    publish: "UPDATE cms_projects SET published = TRUE, archived = FALSE, workflow_status = 'published', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    unpublish: "UPDATE cms_projects SET published = FALSE, workflow_status = 'unpublished', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    archive: "UPDATE cms_projects SET published = FALSE, archived = TRUE, workflow_status = 'archived', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    restore: "UPDATE cms_projects SET published = FALSE, archived = FALSE, workflow_status = 'unpublished', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    cancel_schedule: "UPDATE cms_projects SET published = FALSE, archived = FALSE, workflow_status = 'draft', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
  } as const;
  const [result] = await database.execute<ResultSetHeader>(statements[action], [slug]);
  if (!result.affectedRows) throw new Error("Project not found.");
}

export async function duplicateProjectRecord(slug: string) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const [rows] = await database.execute<ProjectRow[]>(
    `SELECT slug, name, location, asset_type, category, metric, project_status,
      philosophy, engagement, cover_image, opportunity, strategy, delivery,
      outcome, chapter_order, gallery_images, seo_title, seo_description,
      canonical_url, search_index, search_follow, social_title, social_description, social_image,
      published, archived, workflow_status, scheduled_at, sort_order, updated_at
     FROM cms_projects WHERE slug = ? AND deleted_at IS NULL LIMIT 1`,
    [slug],
  );
  const source = rows[0];
  if (!source) throw new Error("Project not found.");
  let copySlug = `${slug}-copy`;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const [matches] = await database.execute<RowDataPacket[]>(
      "SELECT 1 FROM cms_projects WHERE slug = ? LIMIT 1",
      [copySlug],
    );
    if (!matches.length) break;
    copySlug = `${slug}-copy-${suffix}`;
  }
  const copy = projectFromRow(source);
  await saveProject("", {
    ...copy,
    slug: copySlug,
    name: `${copy.name} (Copy)`,
    published: false,
    archived: false,
    workflowStatus: "draft",
    scheduledAt: "",
    sortOrder: Math.min(copy.sortOrder + 1, 9999),
  });
  return copySlug;
}

export async function savePost(originalSlug: string, post: InsightArticle, expectedVersion?: number) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  if (originalSlug && expectedVersion !== undefined) {
    const [claim] = await database.execute<ResultSetHeader>(
      "UPDATE cms_posts SET lock_version = lock_version + 1 WHERE slug = ? AND lock_version = ? AND deleted_at IS NULL",
      [originalSlug, expectedVersion],
    );
    if (!claim.affectedRows) throw new CmsWriteConflictError();
  }
  if (originalSlug && originalSlug !== post.slug) {
    await database.execute<ResultSetHeader>(
      "UPDATE cms_posts SET slug = ? WHERE slug = ?",
      [post.slug, originalSlug],
    );
    await saveSlugRedirect("insight", originalSlug, post.slug);
  }
  await database.execute<ResultSetHeader>(
    `INSERT INTO cms_posts
      (slug, category, title, excerpt, author, author_title, publication_date,
       read_time, cover_image, body, body_document, pull_quote, seo_title,
       seo_description, canonical_url, search_index, search_follow, social_title,
       social_description, social_image, published, featured, archived, workflow_status, scheduled_at, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ${originalSlug ? `ON DUPLICATE KEY UPDATE
       category = VALUES(category), title = VALUES(title), excerpt = VALUES(excerpt),
       author = VALUES(author), author_title = VALUES(author_title),
       publication_date = VALUES(publication_date), read_time = VALUES(read_time),
       cover_image = VALUES(cover_image), body = VALUES(body),
       body_document = VALUES(body_document), pull_quote = VALUES(pull_quote),
       seo_title = VALUES(seo_title), seo_description = VALUES(seo_description),
       canonical_url = VALUES(canonical_url), search_index = VALUES(search_index),
       search_follow = VALUES(search_follow), social_title = VALUES(social_title),
       social_description = VALUES(social_description), social_image = VALUES(social_image),
       published = VALUES(published),
       featured = VALUES(featured), archived = VALUES(archived),
       workflow_status = VALUES(workflow_status),
       scheduled_at = VALUES(scheduled_at), sort_order = VALUES(sort_order)${expectedVersion === undefined ? ", lock_version = lock_version + 1" : ""}` : ""}`,
    [
      post.slug,
      post.category,
      post.title,
      post.excerpt,
      post.author,
      post.authorTitle,
      post.date,
      post.readTime,
      post.coverImage,
      post.body,
      post.bodyDocument || null,
      post.pullQuote,
      post.seoTitle,
      post.seoDescription,
      post.canonicalUrl,
      post.searchIndex,
      post.searchFollow,
      post.socialTitle,
      post.socialDescription,
      post.socialImage,
      post.published,
      post.featured,
      post.archived,
      post.workflowStatus,
      post.scheduledAt ? new Date(post.scheduledAt) : null,
      post.sortOrder,
    ],
  );
}

export async function updatePostLibraryState(
  slug: string,
  action: "publish" | "unpublish" | "archive" | "restore" | "cancel_schedule",
) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const statements = {
    publish: "UPDATE cms_posts SET published = TRUE, archived = FALSE, workflow_status = 'published', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    unpublish: "UPDATE cms_posts SET published = FALSE, featured = FALSE, workflow_status = 'unpublished', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    archive: "UPDATE cms_posts SET published = FALSE, featured = FALSE, archived = TRUE, workflow_status = 'archived', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    restore: "UPDATE cms_posts SET published = FALSE, featured = FALSE, archived = FALSE, workflow_status = 'unpublished', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
    cancel_schedule: "UPDATE cms_posts SET published = FALSE, featured = FALSE, archived = FALSE, workflow_status = 'draft', scheduled_at = NULL WHERE slug = ? AND deleted_at IS NULL",
  } as const;
  const [result] = await database.execute<ResultSetHeader>(statements[action], [slug]);
  if (!result.affectedRows) throw new Error("Insight not found.");
}

export async function duplicatePostRecord(slug: string) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const [rows] = await database.execute<PostRow[]>(
    `SELECT slug, category, title, excerpt, author, author_title,
      publication_date, read_time, cover_image, body, body_document, pull_quote,
      seo_title, seo_description, canonical_url, search_index, search_follow,
      social_title, social_description, social_image, published,
      featured, archived, workflow_status, scheduled_at, sort_order, updated_at
     FROM cms_posts WHERE slug = ? AND deleted_at IS NULL LIMIT 1`,
    [slug],
  );
  const source = rows[0];
  if (!source) throw new Error("Insight not found.");
  let copySlug = `${slug}-copy`;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const [matches] = await database.execute<RowDataPacket[]>(
      "SELECT 1 FROM cms_posts WHERE slug = ? LIMIT 1",
      [copySlug],
    );
    if (!matches.length) break;
    copySlug = `${slug}-copy-${suffix}`;
  }
  const copy = postFromRow(source);
  await savePost("", {
    ...copy,
    slug: copySlug,
    title: `${copy.title} (Copy)`,
    published: false,
    featured: false,
    archived: false,
    workflowStatus: "draft",
    scheduledAt: "",
    sortOrder: Math.min(copy.sortOrder + 1, 9999),
  });
  return copySlug;
}

export async function publishDueContent() {
  const database = getCmsPool();
  const published = { projects: [] as string[], insights: [] as string[] };
  if (!database) return published;
  await ensureCmsSchema();
  const [dueProjects] = await database.query<ProjectRow[]>(
    `SELECT slug, name, location, asset_type, category, metric, project_status,
      philosophy, engagement, cover_image, opportunity, strategy, delivery,
      outcome, chapter_order, gallery_images, seo_title, seo_description,
      canonical_url, search_index, search_follow, social_title, social_description, social_image,
      published, archived, workflow_status, scheduled_at, sort_order, updated_at
     FROM cms_projects WHERE workflow_status = 'scheduled' AND scheduled_at <= UTC_TIMESTAMP() AND deleted_at IS NULL`,
  );
  const [duePosts] = await database.query<PostRow[]>(
    `SELECT slug, category, title, excerpt, author, author_title, publication_date,
      read_time, cover_image, body, body_document, pull_quote, seo_title,
      seo_description, canonical_url, search_index, search_follow, social_title,
      social_description, social_image, published, featured, archived, workflow_status, scheduled_at,
      sort_order, updated_at FROM cms_posts
     WHERE workflow_status = 'scheduled' AND scheduled_at <= UTC_TIMESTAMP() AND deleted_at IS NULL`,
  );
  for (const row of dueProjects) {
    const [result] = await database.execute<ResultSetHeader>("UPDATE cms_projects SET published = TRUE, archived = FALSE, workflow_status = 'published', scheduled_at = NULL WHERE slug = ? AND workflow_status = 'scheduled' AND deleted_at IS NULL", [row.slug]);
    if (result.affectedRows) {
      await recordCmsRevision("project", row.slug, "scheduled_publish", "System scheduler", { ...projectFromRow(row), published: true, archived: false, workflowStatus: "published", scheduledAt: "" });
      await recordCmsAudit(null, "publish", "project", row.slug, row.name, { source: "schedule" });
      published.projects.push(row.slug);
    }
  }
  for (const row of duePosts) {
    const [result] = await database.execute<ResultSetHeader>("UPDATE cms_posts SET published = TRUE, archived = FALSE, workflow_status = 'published', scheduled_at = NULL WHERE slug = ? AND workflow_status = 'scheduled' AND deleted_at IS NULL", [row.slug]);
    if (result.affectedRows) {
      await recordCmsRevision("insight", row.slug, "scheduled_publish", "System scheduler", { ...postFromRow(row), published: true, archived: false, workflowStatus: "published", scheduledAt: "" });
      await recordCmsAudit(null, "publish", "insight", row.slug, row.title, { source: "schedule" });
      published.insights.push(row.slug);
    }
  }
  return published;
}

export async function setFeaturedPostRecord(slug: string, featured: boolean) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [targetRows] = await connection.execute<PostRow[]>(
      "SELECT slug FROM cms_posts WHERE slug = ? AND published = TRUE AND archived = FALSE AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
      [slug],
    );
    if (!targetRows.length) throw new Error("Only a published insight can be featured.");
    if (featured) {
      await connection.execute("UPDATE cms_posts SET featured = FALSE WHERE featured = TRUE");
    }
    await connection.execute("UPDATE cms_posts SET featured = ? WHERE slug = ? AND deleted_at IS NULL", [featured, slug]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteProject(slug: string) {
  await softDeleteCmsRecord("project", slug);
}

export async function deletePost(slug: string) {
  await softDeleteCmsRecord("insight", slug);
}

export async function seedCmsCollections() {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const [projectRows] = await database.query<(RowDataPacket & { slug: string })[]>("SELECT slug FROM cms_projects");
  const [postRows] = await database.query<(RowDataPacket & { slug: string })[]>("SELECT slug FROM cms_posts");
  const projectSlugs = new Set(projectRows.map((row) => row.slug));
  const postSlugs = new Set(postRows.map((row) => row.slug));
  for (const project of fallbackProjects) {
    if (!projectSlugs.has(project.slug)) await saveProject("", project);
  }
  for (const post of fallbackPosts) {
    if (!postSlugs.has(post.slug)) await savePost("", post);
  }
}
