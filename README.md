# Aureum

Premium Next.js website for Aureum, the 360° industrial developer.

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run verify
```

## Production environment

- `NEXT_PUBLIC_SITE_URL`: current canonical HTTPS origin. Use
  `https://darkgray-oryx-870770.hostingersite.com` for the temporary deployment
  and change it to `https://aureum.ae` only when the final domain is connected.
- `NEXT_PUBLIC_CONTACT_ENDPOINT`: approved form endpoint.
- `NEXT_PUBLIC_MAPBOX_TOKEN`: optional Mapbox credential.
- `NEXT_PUBLIC_VITALS_ENDPOINT`: optional HTTPS receiver for privacy-conscious
  Core Web Vitals monitoring; disabled when the visitor enables Do Not Track.

Use `npm run audit:env:production` before deployment.

## Hostinger deployment

Deploy this repository as a **Node.js Web App** using Node.js 22 or 24, with
`npm run build` as the build command and `npm run start` as the start command.
Add production environment values in hPanel; never upload `.env.local` or paste
its secrets into Git. Hostinger GitHub deployments rebuild automatically after
each push when automatic deployments are enabled.

The temporary deployment uses
`https://darkgray-oryx-870770.hostingersite.com`. During the final-domain
cutover, connect `aureum.ae`, update `NEXT_PUBLIC_SITE_URL`, save and redeploy,
then verify canonical metadata, `/robots.txt`, and `/sitemap.xml` before
submitting the sitemap to search engines.

The verification suite also enforces browser-level accessibility, runtime-error,
network-failure, DOM-size and resource-count budgets across Chrome and Edge in
standard and reduced-motion modes.

The browser matrix covers 375px and 430px phones, 768px and 1024px tablets,
a short-height 1280px laptop, 1440px desktop and 1920px wide desktop layouts.

## Approved media

Place approved project, leadership and editorial assets in `public/media`, then
map each existing reservation label in `data/media.ts`. The placeholder is
replaced automatically, including responsive image optimization and accessible
alt text. `npm run audit:content` fails if a mapped file is missing.
