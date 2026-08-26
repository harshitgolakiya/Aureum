CREATE TABLE IF NOT EXISTS cms_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_key VARCHAR(191) NOT NULL,
  value_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY cms_entries_content_key_unique (content_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY cms_projects_slug_unique (slug),
  KEY cms_projects_published_sort (published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY cms_posts_slug_unique (slug),
  KEY cms_posts_published_sort (published, sort_order),
  KEY cms_posts_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_redirects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_type ENUM('project', 'insight') NOT NULL,
  old_slug VARCHAR(191) NOT NULL,
  new_slug VARCHAR(191) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY cms_redirects_old_slug (content_type, old_slug),
  KEY cms_redirects_destination (content_type, new_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_enquiry_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enquiry_id BIGINT UNSIGNED NOT NULL,
  author_user_id CHAR(36) NULL,
  author_email VARCHAR(255) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY cms_enquiry_comments_enquiry (enquiry_id, created_at, id),
  KEY cms_enquiry_comments_author (author_user_id, created_at),
  CONSTRAINT cms_enquiry_comments_enquiry_fk FOREIGN KEY (enquiry_id) REFERENCES cms_contact_submissions(id) ON DELETE CASCADE,
  CONSTRAINT cms_enquiry_comments_author_fk FOREIGN KEY (author_user_id) REFERENCES cms_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_login_attempts (
  email VARCHAR(255) NOT NULL,
  client_key VARCHAR(100) NOT NULL,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at DATETIME NOT NULL,
  locked_until DATETIME NULL,
  PRIMARY KEY (email, client_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_migrations (
  migration_key VARCHAR(191) NOT NULL,
  details_json JSON NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (migration_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
