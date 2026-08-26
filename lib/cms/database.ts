import "server-only";

import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";

let pool: Pool | null | undefined;
let schemaReady: Promise<void> | null = null;

export function isCmsDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getCmsPool() {
  if (pool !== undefined) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  pool = connectionString
    ? createPool({
        uri: connectionString,
        connectionLimit: 8,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        charset: "utf8mb4",
        timezone: "Z",
      })
    : null;
  return pool;
}

export async function ensureCmsSchema() {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  schemaReady ??= (async () => {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_entries (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        content_key VARCHAR(191) NOT NULL,
        value_json JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY cms_entries_content_key_unique (content_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_contact_submissions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(120) NOT NULL,
        organisation VARCHAR(120) NOT NULL,
        role_title VARCHAR(120) NOT NULL,
        email VARCHAR(254) NOT NULL,
        phone VARCHAR(80) NOT NULL DEFAULT '',
        interest VARCHAR(120) NOT NULL,
        opportunity TEXT NOT NULL,
        source VARCHAR(120) NOT NULL DEFAULT '',
        status ENUM('new','in_progress','closed','spam') NOT NULL DEFAULT 'new',
        notification_status ENUM('pending','sent','failed','not_configured') NOT NULL DEFAULT 'pending',
        notification_message_id VARCHAR(191) NOT NULL DEFAULT '',
        notification_error VARCHAR(500) NOT NULL DEFAULT '',
        client_hash CHAR(64) NOT NULL,
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY cms_contact_status_submitted (status, submitted_at),
        KEY cms_contact_email (email),
        KEY cms_contact_client_recent (client_hash, submitted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_projects (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        slug VARCHAR(191) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        asset_type VARCHAR(255) NOT NULL,
        category VARCHAR(120) NOT NULL,
        metric VARCHAR(180) NOT NULL,
        project_status VARCHAR(180) NOT NULL,
        philosophy TEXT NOT NULL,
        engagement VARCHAR(180) NOT NULL,
        cover_image VARCHAR(500) NOT NULL,
        opportunity TEXT NOT NULL,
        strategy TEXT NOT NULL,
        delivery TEXT NOT NULL,
        outcome TEXT NOT NULL,
        chapter_order VARCHAR(255) NOT NULL DEFAULT 'opportunity,strategy,delivery,outcome',
        gallery_images TEXT NOT NULL,
        seo_title VARCHAR(300) NOT NULL DEFAULT '',
        seo_description TEXT NOT NULL,
        canonical_url VARCHAR(500) NOT NULL DEFAULT '',
        search_index BOOLEAN NOT NULL DEFAULT TRUE,
        search_follow BOOLEAN NOT NULL DEFAULT TRUE,
        social_title VARCHAR(300) NOT NULL DEFAULT '',
        social_description TEXT NOT NULL,
        social_image VARCHAR(500) NOT NULL DEFAULT '',
        published BOOLEAN NOT NULL DEFAULT FALSE,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        workflow_status ENUM('draft','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft',
        scheduled_at DATETIME NULL,
        deleted_at DATETIME NULL,
        sort_order INT NOT NULL DEFAULT 0,
        lock_version INT UNSIGNED NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY cms_projects_slug_unique (slug),
        KEY cms_projects_published_sort (published, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [projectArchiveColumn] = await database.query<RowDataPacket[]>(
      "SHOW COLUMNS FROM cms_projects WHERE Field IN ('archived', 'workflow_status', 'scheduled_at', 'deleted_at')",
    );
    const projectWorkflowColumnNames = new Set(projectArchiveColumn.map((column) => String(column.Field)));
    if (!projectWorkflowColumnNames.has("archived")) {
      await database.execute(
        "ALTER TABLE cms_projects ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE AFTER published",
      );
    }
    if (!projectWorkflowColumnNames.has("workflow_status")) {
      await database.execute("ALTER TABLE cms_projects ADD COLUMN workflow_status ENUM('draft','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft' AFTER archived");
      await database.execute("UPDATE cms_projects SET workflow_status = CASE WHEN archived = TRUE THEN 'archived' WHEN published = TRUE THEN 'published' ELSE 'draft' END");
    }
    if (!projectWorkflowColumnNames.has("scheduled_at")) {
      await database.execute("ALTER TABLE cms_projects ADD COLUMN scheduled_at DATETIME NULL AFTER workflow_status");
    }
    if (!projectWorkflowColumnNames.has("deleted_at")) {
      await database.execute("ALTER TABLE cms_projects ADD COLUMN deleted_at DATETIME NULL AFTER scheduled_at");
    }
    const [projectEditorColumns] = await database.query<RowDataPacket[]>(
      "SHOW COLUMNS FROM cms_projects WHERE Field IN ('chapter_order', 'seo_title', 'seo_description')",
    );
    const projectEditorColumnNames = new Set(
      projectEditorColumns.map((column) => String(column.Field)),
    );
    if (!projectEditorColumnNames.has("chapter_order")) {
      await database.execute(
        "ALTER TABLE cms_projects ADD COLUMN chapter_order VARCHAR(255) NOT NULL DEFAULT 'opportunity,strategy,delivery,outcome' AFTER outcome",
      );
    }
    if (!projectEditorColumnNames.has("seo_title")) {
      await database.execute(
        "ALTER TABLE cms_projects ADD COLUMN seo_title VARCHAR(300) NOT NULL DEFAULT '' AFTER gallery_images",
      );
    }
    if (!projectEditorColumnNames.has("seo_description")) {
      await database.execute(
        "ALTER TABLE cms_projects ADD COLUMN seo_description TEXT NOT NULL AFTER seo_title",
      );
    }
    const [projectSeoColumns] = await database.query<RowDataPacket[]>("SHOW COLUMNS FROM cms_projects WHERE Field IN ('canonical_url','search_index','search_follow','social_title','social_description','social_image')");
    const projectSeoColumnNames = new Set(projectSeoColumns.map((column) => String(column.Field)));
    if (!projectSeoColumnNames.has("canonical_url")) await database.execute("ALTER TABLE cms_projects ADD COLUMN canonical_url VARCHAR(500) NOT NULL DEFAULT '' AFTER seo_description");
    if (!projectSeoColumnNames.has("search_index")) await database.execute("ALTER TABLE cms_projects ADD COLUMN search_index BOOLEAN NOT NULL DEFAULT TRUE AFTER canonical_url");
    if (!projectSeoColumnNames.has("search_follow")) await database.execute("ALTER TABLE cms_projects ADD COLUMN search_follow BOOLEAN NOT NULL DEFAULT TRUE AFTER search_index");
    if (!projectSeoColumnNames.has("social_title")) await database.execute("ALTER TABLE cms_projects ADD COLUMN social_title VARCHAR(300) NOT NULL DEFAULT '' AFTER search_follow");
    if (!projectSeoColumnNames.has("social_description")) await database.execute("ALTER TABLE cms_projects ADD COLUMN social_description TEXT NOT NULL AFTER social_title");
    if (!projectSeoColumnNames.has("social_image")) await database.execute("ALTER TABLE cms_projects ADD COLUMN social_image VARCHAR(500) NOT NULL DEFAULT '' AFTER social_description");
    const [projectLockColumns] = await database.query<RowDataPacket[]>("SHOW COLUMNS FROM cms_projects WHERE Field = 'lock_version'");
    if (!projectLockColumns.length) await database.execute("ALTER TABLE cms_projects ADD COLUMN lock_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER sort_order");
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_posts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        slug VARCHAR(191) NOT NULL,
        category VARCHAR(120) NOT NULL,
        title VARCHAR(300) NOT NULL,
        excerpt TEXT NOT NULL,
        author VARCHAR(180) NOT NULL,
        author_title VARCHAR(255) NOT NULL,
        publication_date VARCHAR(80) NOT NULL,
        read_time VARCHAR(80) NOT NULL,
        cover_image VARCHAR(500) NOT NULL,
        body LONGTEXT NOT NULL,
        body_document JSON NULL,
        pull_quote TEXT NOT NULL,
        seo_title VARCHAR(300) NOT NULL DEFAULT '',
        seo_description TEXT NOT NULL,
        canonical_url VARCHAR(500) NOT NULL DEFAULT '',
        search_index BOOLEAN NOT NULL DEFAULT TRUE,
        search_follow BOOLEAN NOT NULL DEFAULT TRUE,
        social_title VARCHAR(300) NOT NULL DEFAULT '',
        social_description TEXT NOT NULL,
        social_image VARCHAR(500) NOT NULL DEFAULT '',
        published BOOLEAN NOT NULL DEFAULT FALSE,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        workflow_status ENUM('draft','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft',
        scheduled_at DATETIME NULL,
        deleted_at DATETIME NULL,
        sort_order INT NOT NULL DEFAULT 0,
        lock_version INT UNSIGNED NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY cms_posts_slug_unique (slug),
        KEY cms_posts_published_sort (published, sort_order),
        KEY cms_posts_featured (featured)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [postWorkflowColumns] = await database.query<RowDataPacket[]>(
      "SHOW COLUMNS FROM cms_posts WHERE Field IN ('archived', 'workflow_status', 'scheduled_at', 'deleted_at')",
    );
    const postWorkflowColumnNames = new Set(
      postWorkflowColumns.map((column) => String(column.Field)),
    );
    if (!postWorkflowColumnNames.has("archived")) {
      await database.execute(
        "ALTER TABLE cms_posts ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE AFTER featured",
      );
    }
    if (!postWorkflowColumnNames.has("scheduled_at")) {
      await database.execute(
        "ALTER TABLE cms_posts ADD COLUMN scheduled_at DATETIME NULL AFTER archived",
      );
    }
    if (!postWorkflowColumnNames.has("workflow_status")) {
      await database.execute("ALTER TABLE cms_posts ADD COLUMN workflow_status ENUM('draft','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft' AFTER archived");
      await database.execute("UPDATE cms_posts SET workflow_status = CASE WHEN archived = TRUE THEN 'archived' WHEN published = TRUE THEN 'published' WHEN scheduled_at IS NOT NULL THEN 'scheduled' ELSE 'draft' END");
    }
    if (!postWorkflowColumnNames.has("deleted_at")) {
      await database.execute("ALTER TABLE cms_posts ADD COLUMN deleted_at DATETIME NULL AFTER scheduled_at");
    }
    const [postEditorColumns] = await database.query<RowDataPacket[]>(
      "SHOW COLUMNS FROM cms_posts WHERE Field IN ('body_document', 'seo_title', 'seo_description')",
    );
    const postEditorColumnNames = new Set(postEditorColumns.map((column) => String(column.Field)));
    if (!postEditorColumnNames.has("body_document")) {
      await database.execute("ALTER TABLE cms_posts ADD COLUMN body_document JSON NULL AFTER body");
    }
    if (!postEditorColumnNames.has("seo_title")) {
      await database.execute("ALTER TABLE cms_posts ADD COLUMN seo_title VARCHAR(300) NOT NULL DEFAULT '' AFTER pull_quote");
    }
    if (!postEditorColumnNames.has("seo_description")) {
      await database.execute("ALTER TABLE cms_posts ADD COLUMN seo_description TEXT NOT NULL AFTER seo_title");
    }
    const [postSeoColumns] = await database.query<RowDataPacket[]>("SHOW COLUMNS FROM cms_posts WHERE Field IN ('canonical_url','search_index','search_follow','social_title','social_description','social_image')");
    const postSeoColumnNames = new Set(postSeoColumns.map((column) => String(column.Field)));
    if (!postSeoColumnNames.has("canonical_url")) await database.execute("ALTER TABLE cms_posts ADD COLUMN canonical_url VARCHAR(500) NOT NULL DEFAULT '' AFTER seo_description");
    if (!postSeoColumnNames.has("search_index")) await database.execute("ALTER TABLE cms_posts ADD COLUMN search_index BOOLEAN NOT NULL DEFAULT TRUE AFTER canonical_url");
    if (!postSeoColumnNames.has("search_follow")) await database.execute("ALTER TABLE cms_posts ADD COLUMN search_follow BOOLEAN NOT NULL DEFAULT TRUE AFTER search_index");
    if (!postSeoColumnNames.has("social_title")) await database.execute("ALTER TABLE cms_posts ADD COLUMN social_title VARCHAR(300) NOT NULL DEFAULT '' AFTER search_follow");
    if (!postSeoColumnNames.has("social_description")) await database.execute("ALTER TABLE cms_posts ADD COLUMN social_description TEXT NOT NULL AFTER social_title");
    if (!postSeoColumnNames.has("social_image")) await database.execute("ALTER TABLE cms_posts ADD COLUMN social_image VARCHAR(500) NOT NULL DEFAULT '' AFTER social_description");
    const [postLockColumns] = await database.query<RowDataPacket[]>("SHOW COLUMNS FROM cms_posts WHERE Field = 'lock_version'");
    if (!postLockColumns.length) await database.execute("ALTER TABLE cms_posts ADD COLUMN lock_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER sort_order");
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_media (
        id CHAR(36) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        public_path VARCHAR(500) NOT NULL,
        media_type ENUM('image', 'video') NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        width INT UNSIGNED NULL,
        height INT UNSIGNED NULL,
        size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
        alt_text VARCHAR(500) NOT NULL DEFAULT '',
        caption TEXT NOT NULL,
        focal_x TINYINT UNSIGNED NOT NULL DEFAULT 50,
        focal_y TINYINT UNSIGNED NOT NULL DEFAULT 50,
        poster_path VARCHAR(500) NOT NULL DEFAULT '',
        variants_json JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY cms_media_public_path_unique (public_path),
        KEY cms_media_type_updated (media_type, updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_media_files (
        public_path VARCHAR(500) NOT NULL,
        media_id CHAR(36) NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        file_data LONGBLOB NOT NULL,
        size_bytes BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (public_path),
        KEY cms_media_files_media_id (media_id),
        CONSTRAINT cms_media_files_media_fk FOREIGN KEY (media_id) REFERENCES cms_media(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_revisions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        content_type ENUM('project', 'insight') NOT NULL,
        content_slug VARCHAR(191) NOT NULL,
        event VARCHAR(40) NOT NULL,
        editor_email VARCHAR(255) NOT NULL,
        snapshot_json JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY cms_revisions_content (content_type, content_slug, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_redirects (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        content_type ENUM('project', 'insight') NOT NULL,
        old_slug VARCHAR(191) NOT NULL,
        new_slug VARCHAR(191) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY cms_redirects_old_slug (content_type, old_slug),
        KEY cms_redirects_destination (content_type, new_slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_users (
        id CHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('administrator', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
        last_login_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY cms_users_email_unique (email),
        KEY cms_users_role_active (role, active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_sessions (
        token_hash CHAR(64) NOT NULL,
        user_id CHAR(36) NOT NULL,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (token_hash),
        KEY cms_sessions_user_active (user_id, revoked_at, expires_at),
        CONSTRAINT cms_sessions_user_fk FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_login_attempts (
        email VARCHAR(255) NOT NULL,
        client_key VARCHAR(100) NOT NULL,
        attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
        window_started_at DATETIME NOT NULL,
        locked_until DATETIME NULL,
        PRIMARY KEY (email, client_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_audit_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        actor_user_id CHAR(36) NULL,
        actor_email VARCHAR(255) NOT NULL,
        action VARCHAR(40) NOT NULL,
        content_type VARCHAR(40) NOT NULL,
        content_slug VARCHAR(191) NOT NULL,
        record_label VARCHAR(300) NOT NULL,
        metadata_json JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY cms_audit_created (created_at, id),
        KEY cms_audit_actor (actor_email, created_at),
        KEY cms_audit_content (content_type, content_slug, created_at),
        KEY cms_audit_action (action, created_at),
        CONSTRAINT cms_audit_user_fk FOREIGN KEY (actor_user_id) REFERENCES cms_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS cms_migrations (
        migration_key VARCHAR(191) NOT NULL,
        details_json JSON NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (migration_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  })();
  return schemaReady;
}

export type CmsEntryRow = RowDataPacket & {
  content_key: string;
  value_json: unknown;
  updated_at: Date;
};

export async function testCmsDatabase() {
  const database = getCmsPool();
  if (!database) return false;
  try {
    await database.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
