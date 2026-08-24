
# Aureum CMS — Product Backlog

This backlog replaces the previous all-at-once CMS approach. Work proceeds in
the order below. Only one feature may be in progress at a time.

## Working rules

- Finish, test, and review one feature before starting another.
- Do not change public website behavior until the relevant CMS workflow is
  complete.
- Preserve existing content and database records during every migration.
- Every destructive action needs confirmation and a recovery path.
- Each feature must work on desktop and tablet admin layouts.
- A feature is complete only when type checks, lint, production build, and its
  focused functional tests pass.

## Feature 01 — CMS shell and dashboard

Status: Complete

- Replace the long single-page form dump with a proper application shell.
- Add persistent navigation for Dashboard, Projects, Insights, Media, Pages,
  Users, and Settings.
- Add a responsive sidebar and useful page headers/breadcrumbs.
- Dashboard cards: published projects, draft projects, published insights,
  draft insights, and media count.
- Add recent-content and quick-action areas.
- Keep the existing editors available during migration so no capability is
  lost.

Acceptance criteria:

- `/admin` is a dashboard, not an editor list.
- Every CMS area has a clear route and active navigation state.
- Authentication protects every CMS route except `/admin/login`.
- Existing project, insight, and page data remains unchanged.

## Feature 02 — Project library

Status: Complete

- Dedicated `/admin/projects` page.
- Search by project name, location, category, or slug.
- Filter by published/draft status and category.
- Sort by updated date, display order, and title.
- Paginated table/card view with status and updated timestamp.
- Clear create, edit, preview, duplicate, publish/unpublish, and archive actions.

Acceptance criteria:

- An editor can find any project without opening every record.
- Drafts and published projects are visually distinct.
- Archive is recoverable and permanent deletion is not the default action.

## Feature 03 — Project editor

Status: Complete

- Separate create and edit routes.
- Group fields into Overview, Details, Story, Media, SEO, and Publishing.
- Friendly slug generation with uniqueness checking.
- Inline validation and useful field guidance.
- Draft saving without requiring every publishing field.
- Preview before publication.
- Reorderable gallery and structured case-study chapters.
- Unsaved-change protection.

Acceptance criteria:

- A draft can be saved with partial content.
- A project cannot publish until required fields and media are valid.
- Editing one project cannot overwrite another project.

## Feature 04 — Insight library

Status: Complete

- Dedicated `/admin/insights` page.
- Search, category/status filters, sorting, and pagination.
- Published, draft, scheduled, and archived states.
- Featured-story controls with clear conflict handling.
- Preview, duplicate, archive, and restore actions.

## Feature 05 — Insight editor

Status: Complete

- Separate create and edit routes.
- Title, slug, excerpt, author, category, date, read time, cover, and SEO fields.
- Structured rich-text editor supporting headings, paragraphs, lists, links,
  quotes, images, captions, and dividers.
- Clean stored document format; no unsafe raw HTML.
- Draft autosave and unsaved-change recovery.
- Desktop/mobile article preview.

Acceptance criteria:

- Long-form articles can be authored without writing markup.
- Saved content renders predictably and safely on the public article page.

## Feature 06 — Media library

Status: Complete

- Dedicated `/admin/media` page and reusable media picker.
- Image upload with type, size, and dimension validation.
- Automatic WebP conversion and responsive variants.
- Video upload validation and poster assignment.
- Alt text, caption, focal point, filename, and usage metadata.
- Search, filters, copy URL, replace, and safe deletion.
- Prevent deletion while an asset is in use.

Acceptance criteria:

- Editors never need to manually place files inside `public/`.
- Uploaded images are optimized before publication.
- Required accessibility metadata is enforced.

## Feature 07 — Publishing workflow and revisions

Status: Complete

- Draft, scheduled, published, unpublished, and archived states.
- Schedule and cancel publication.
- Immutable revision history for every save/publish event.
- Compare revisions and restore an earlier revision.
- Clear confirmation for unpublish/archive actions.
- Record editor identity and timestamps.

## Feature 08 — SEO controls

Status: Complete

- SEO title and description with length guidance.
- Canonical URL, index/follow, and social title/description/image.
- Search-result and social-card previews.
- Sitemap inclusion based on publication/index state.
- Slug-change redirect history.

## Feature 09 — Users and permissions

Status: Complete

- Database-backed users with securely hashed passwords.
- Roles: Administrator, Editor, and Viewer.
- Per-action authorization enforced on the server.
- Password reset/change and session revocation.
- Rate-limited login and secure production cookie settings.
- Remove plain-text admin passwords from normal production authentication.

## Feature 10 — Audit log and recovery

Status: Complete

- Record create, edit, publish, unpublish, archive, restore, and delete events.
- Filter by user, content type, record, action, and date.
- Soft delete with trash and restore.
- Database backup/export procedure and tested restore instructions.

## Feature 11 — Page-content editor

Status: Complete

- Move existing page-copy forms into a dedicated `/admin/pages` area.
- Group fields by route and page section.
- Add page preview and validation.
- Keep global footer/settings separate from page content.

## Feature 12 — Public-site migration

Status: Complete

- Migrate approved project and insight records without data loss.
- Connect only published records to public listings and detail routes.
- Revalidate homepage, listings, detail pages, metadata, and sitemap after
  publishing changes.
- Preserve fallback behavior only for database outages, not empty collections.
- Remove the temporary legacy editor after feature parity is verified.

## Feature 13 — Final QA and launch readiness

Status: QA complete; launch blocked by production configuration

- Permission and authentication security tests.
- Create/edit/publish/schedule/archive/restore workflow tests.
- Media upload and optimization tests.
- Concurrent editing and duplicate-slug tests.
- Keyboard and screen-reader accessibility pass.
- Tablet and desktop CMS responsive pass.
- Production environment and backup/restore verification.

QA result:

- Security, workflow, media, concurrent-editing, accessibility, responsive,
  production-build, and isolated backup/restore checks pass.
- The temporary canonical origin is approved. Full CMS/contact launch remains
  blocked until `NEXT_PUBLIC_SITE_URL` and
  `NEXT_PUBLIC_CONTACT_ENDPOINT` are configured with their real HTTPS values,
  and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` plus `CMS_CRON_SECRET` are configured
  with strong private values.
- See `CMS_QA.md` for the test matrix and deployment checklist.

## Feature 14 — Precise scheduled publishing

Status: Complete

- Treat editor schedule values as Dubai time (GST / UTC+4) and store the exact
  corresponding UTC instant.
- Add an authenticated server endpoint that publishes due projects and
  insights without waiting for a visitor request.
- Revalidate affected public pages, admin libraries, and sitemap entries after
  publication.
- Add a production-safe runner suitable for a one-minute scheduler interval.
- Verify authorization, due/future boundaries, idempotency, revisions, audit
  events, and timezone conversion with disposable database records.

Acceptance result:

- The focused scheduler test passes all cases and the launch workflow test
  confirms Dubai editor time is stored as the correct UTC instant.
- Deployment requires `CMS_CRON_SECRET` and a recurring invocation as described
  in `CMS_SETUP.md`.

## Explicitly deferred

The following are not included unless separately approved:

- Multi-language content.
- Public comments.
- Email marketing/newsletter automation.
- External DAM or headless-CMS integration.
- AI-generated editorial content.
