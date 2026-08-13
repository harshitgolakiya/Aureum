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

- `NEXT_PUBLIC_SITE_URL`: final HTTPS origin.
- `NEXT_PUBLIC_CONTACT_ENDPOINT`: approved form endpoint.
- `NEXT_PUBLIC_MAPBOX_TOKEN`: optional Mapbox credential.

Use `npm run audit:env:production` before deployment.

The verification suite also enforces browser-level accessibility, runtime-error,
network-failure, DOM-size and resource-count budgets across Chrome and Edge in
standard and reduced-motion modes.
