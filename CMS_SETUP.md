# Aureum MySQL CMS

The CMS is available at `/admin` and stores approved content in MySQL. Public
pages use checked-in fallback content whenever MySQL is not configured or is
temporarily unavailable.

## 1. Create the database

Create a MySQL 8+ database and a user with `SELECT`, `INSERT`, `UPDATE`, and
`CREATE` permissions for that database. The CMS creates its table on first use.
The equivalent schema is checked in at `database/cms.sql` for environments that
manage migrations separately.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL`: MySQL connection URL.
- `CMS_ADMIN_EMAIL`: one-time administrator bootstrap email, used only while
  the users table is empty.
- `CMS_ADMIN_PASSWORD`: one-time bootstrap password with at least 12 characters,
  including a letter, number, and special character. It is immediately hashed
  with scrypt before database storage and is not used for normal sign-in after
  the first user exists.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: stable 32-byte base64 key shared by all
  production instances.
- `CMS_CRON_SECRET`: private random value of at least 32 characters, shared only
  with the scheduled-publishing runner.
- `NEXT_PUBLIC_SITE_URL`: use
  `https://darkgray-oryx-870770.hostingersite.com` for the temporary deployment;
  replace it with `https://aureum.ae` when the final domain is connected.

Do not commit `.env.local`.

For Hostinger, create the MySQL database in hPanel and use its exact database
name, username, password, and host in `DATABASE_URL`. The host is commonly
`localhost` for a database attached to the same Hostinger account. Add the
variables under the Node.js application deployment settings and redeploy after
changing them.

CMS sessions are random opaque tokens backed by MySQL. Administrators can add
users, assign Administrator, Editor, or Viewer access, reset passwords, disable
accounts, and revoke sessions from `/admin/users`. Once the bootstrap account
exists, remove `CMS_ADMIN_EMAIL` and `CMS_ADMIN_PASSWORD` from the production
runtime environment.

## 3. Initialize content

Restart the Next.js server, visit `/admin`, sign in, confirm that MySQL shows as
connected, and select **Initialize with current content**. Initialization only
inserts missing records and never overwrites existing CMS edits.

## Publishing projects and insights

The **Projects** and **Insights / Blog** areas in `/admin` are MySQL-backed
collections. Editors can create, update, order, publish/unpublish, and preview
records. Published records automatically feed the homepage, listing pages,
detail routes, metadata, and sitemap.

## Scheduled publishing

Schedule fields in the project and insight editors use Dubai time (GST,
UTC+4). The application stores the corresponding UTC instant so publication is
consistent regardless of the server's timezone.

Production must invoke the authenticated publisher at least once per minute.
The included runner reads `CMS_CRON_SECRET`, sends a Bearer-authenticated POST,
and uses `NEXT_PUBLIC_SITE_URL` by default:

```powershell
npm run cms:publish-due
```

If the publishing endpoint uses a different internal origin, set
`CMS_PUBLISH_ENDPOINT` to the full HTTPS URL ending in `/api/cron/publish`.
Configure the hosting platform's scheduler to run the command every minute.
The endpoint is idempotent: repeated calls leave already-published records
unchanged. Do not put `CMS_CRON_SECRET` in a public environment variable,
client-side code, source control, logs, or the scheduler URL.

Verify the worker against a production build and disposable records with:

```powershell
npm run cms:verify-scheduler
```

Images and videos are uploaded and optimized through `/admin/media`. Project
galleries and insight content use the media picker rather than manual public
folder placement.

The initialization action inserts only missing starter records. It does not
overwrite existing editorial work.

## Managed content

- Homepage hero.
- Who We Are hero.
- All three leadership cards and biographies.
- Global footer statement, address, email addresses, and phone number.
- Portfolio projects and complete case-study narratives.
- Insight/blog metadata, cover images, article bodies, featured state, and
  publication state.

New sections can be registered in `lib/cms/schema.ts`; the editor renders their
fields automatically.

## Page content

The `/admin/pages` library separates content by public route. Homepage and Who
We Are have dedicated section-based editors with validation, unsaved-change
warnings, and authenticated saved-content previews. Leadership profiles are
grouped under Who We Are. Footer, address, and contact information are kept in
`/admin/settings` because those values affect every route.

## Audit log, trash, and database recovery

The `/admin/recovery` area records content create, edit, publish, unpublish,
schedule, archive, restore, feature, and delete events. Its filters cover user,
content type, record, action, and date. Delete actions move projects and
insights to trash; restoring always returns them as unpublished content so an
editor can review them before republishing.

Create an application-level database backup from the project root:

```powershell
node --env-file=.env.local .\scripts\cms-backup.mjs
```

Backups are written to the ignored `backups/` directory. Copy completed backup
files to encrypted off-site storage according to the deployment retention
policy. Validate a backup without changing the database:

```powershell
node --env-file=.env.local .\scripts\cms-restore.mjs backups/aureum-cms-YYYY-MM-DDTHH-MM-SSZ.json --verify
```

Restore only during a maintenance window. First back up the current target,
confirm `.env.local` points to the intended database, stop CMS writes, run the
validation command above, and then replace the CMS tables:

```powershell
node --env-file=.env.local .\scripts\cms-restore.mjs backups/aureum-cms-YYYY-MM-DDTHH-MM-SSZ.json --replace
```

`--replace` is intentionally mandatory because restore clears the current CMS
tables before importing the backup. After restoring, restart Next.js, sign in,
and verify the dashboard, one project, one insight, one media asset, and the
audit log before reopening editorial access.

The isolated restore verifier creates and removes a disposable database. If
the CMS runtime user intentionally lacks global `CREATE DATABASE` permission,
pre-authorize one disposable database name and set
`CMS_RESTORE_TEST_DATABASE` to that name when running the verifier.

## Public CMS verification

MySQL is the authority for public projects and insights. Only records in the
published state are returned to the homepage, listings, detail routes,
metadata, and sitemap. An empty database collection renders as empty; checked-in
starter content is used only when MySQL is unconfigured or unavailable.

With the production server running, verify the complete public integration:

```powershell
node --env-file=.env.local .\scripts\verify-public-cms.mjs
```

Set `CMS_VERIFY_SITE_URL` when checking a deployment at a URL different from
`NEXT_PUBLIC_SITE_URL`. The verifier checks published listings and details,
indexed sitemap entries, and exclusion of draft, archived, and trashed records.

For an existing installation upgraded from the starter content, take a backup
and run the one-time migration before verification:

```powershell
node --env-file=.env.local .\scripts\migrate-public-cms.mjs
```

The migration never deletes or overwrites editorial fields. It moves any
previously published records that still contain approval placeholders into
Draft and records each change in the audit log. A migration ledger makes the
command safe to rerun.
