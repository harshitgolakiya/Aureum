# Aureum CMS launch-readiness report

Date: 24 August 2026

## Result

The CMS code and local production build pass the Feature 13 security,
editorial workflow, media, concurrency, accessibility, responsive-layout, and
recovery checks, plus the Feature 14 scheduled-publishing checks. The
application is ready for the temporary Hostinger deployment. Production CMS
and contact delivery remain blocked until hPanel supplies the database,
contact endpoint, and private security values listed below.

## Automated coverage

- Authentication and permissions: anonymous redirects, media API rejection,
  viewer read-only access, editor access, and repeated-login lockout pass.
- Editorial lifecycle: project draft, publish, archive, and restore pass;
  insight schedule, cancel, trash, and trash recovery pass.
- Scheduler: Bearer authentication, due project/insight publication, future
  exclusion, idempotency, revisions, audit events, and Dubai-to-UTC conversion
  pass.
- Data integrity: simultaneous duplicate-slug creation stores exactly one
  record. Optimistic locking rejects a stale concurrent edit.
- Media: a 1200 × 800 PNG upload is converted to WebP, receives 480 px and
  960 px responsive variants, is publicly served, and can be safely deleted.
- Accessibility: all audited CMS routes have one main landmark and one H1,
  named navigation, labeled controls, named links/buttons, image alt
  attributes, valid ARIA references, valid heading order, and keyboard-operable
  tablet navigation.
- Visual sanity: admin navigation waits for the requested route to finish,
  rejects headings above the CMS scale, verifies styled Users controls/cards,
  and captures the Users page for direct desktop inspection. Public intro,
  header, footer, and cursor behavior are excluded from admin routes.
- Responsive layouts: dashboard, libraries, editors, media, pages, users,
  recovery, and settings pass without horizontal overflow at 768, 1024, 1440,
  and 1920 pixels.
- Public browser matrix: Chrome and Edge pass all seven configured routes at
  375, 430, 768, 1024, 1280, 1440, and 1920 pixels with normal and reduced
  motion. Hydration, responsive-image, scroll-behavior, missing GSAP target,
  runtime, and network warnings are treated as failures.
- Dependencies: the production tree reports zero known vulnerabilities after
  upgrading Sharp to the patched 0.35.3 release.
- Recovery: the latest backup validates and restores into a disposable MySQL
  database with matching counts across all 12 tables and 52 rows. The
  disposable database is removed after verification.

Run the focused checks after a production build:

```text
npm run cms:audit:launch
npm run cms:audit:browsers
npm run cms:verify-scheduler
npm run cms:verify-restore -- backups/<backup-file>.json
```

## Deployment blockers

Set real HTTPS values in the production environment and rerun
`npm run audit:env:production`:

- `NEXT_PUBLIC_SITE_URL` — set to
  `https://darkgray-oryx-870770.hostingersite.com` now and to
  `https://aureum.ae` at final-domain cutover.
- `NEXT_PUBLIC_CONTACT_ENDPOINT` — the live secure contact-form gateway.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` — a stable private key of at least 32
  characters shared by all production instances.
- `CMS_CRON_SECRET` — a private random value of at least 32 characters used by
  the scheduled-publishing worker.

Do not copy placeholder values from `.env.example` into production. The local
database and administrator credentials are configured but are intentionally
not recorded in this report.

## Editorial launch decisions

- The database currently has zero published projects and zero published
  insights. Public routes correctly hide every draft and placeholder record,
  but the Portfolio and Insights libraries will launch empty until approved
  records are published.
- Approved legal documents and the real Instagram and Facebook profile URLs
  have not been supplied. Legal routes remain noindex and clearly marked as
  awaiting approval; unset social networks are hidden until their HTTPS URLs
  are added in CMS settings.
- The approved Aureum address, investment email, partnerships email, and phone
  number are now shared by the footer, Contact page, and CMS settings.

## Launch checklist

1. Configure the four deployment values above in Hostinger hPanel, plus the
   Hostinger MySQL `DATABASE_URL` and one-time bootstrap administrator values.
2. Run the production environment audit and require a zero exit code.
3. Create and verify a fresh database backup immediately before deployment.
4. Run the production build, route checks, public browser audit, both CMS
   audits, and scheduler verification against the release commit.
5. Configure the hosting scheduler to run `npm run cms:publish-due` every
   minute, then confirm a disposable scheduled record publishes on time.
6. Publish only approved project and insight records; an empty published set is
   valid and must not restore placeholder content.
