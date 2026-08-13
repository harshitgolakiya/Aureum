# Aureum Launch Readiness

## One-command verification

Run `npm run verify` to check TypeScript, ESLint, the production build, representative routes, the branded 404, metadata routes, security headers, Chrome/Edge rendering in standard and reduced-motion modes, accessibility structure, core interactions and client-content dependencies.

Run `npm run audit:browsers` to create a fresh production build and repeat 72 Chrome/Edge route checks at 390px and 1440px, plus navigation, filtering, lightbox and form-validation smoke tests.

The GitHub Actions quality workflow runs the same verification automatically for every push and pull request targeting `main`.

## Required production environment

- `NEXT_PUBLIC_SITE_URL`: final HTTPS origin without a trailing slash.
- `NEXT_PUBLIC_CONTACT_ENDPOINT`: approved HTTPS form gateway for the current JSON payload.
- `NEXT_PUBLIC_MAPBOX_TOKEN`: optional until the interactive map is approved.

Run `npm run audit:env:production` to validate required deployment variables.

## Client-controlled launch blockers

- Approved project facts, case studies, captions and photography.
- Approved founder and leadership profiles and portraits.
- Approved insight articles, authors and imagery.
- Approved office address and contact details.
- Approved map location and credentials.
- Approved legal documents.
- Analytics and consent preference.
- Final domain and hosting environment.

## Final external QA

After final assets and credentials are installed:

1. Run Lighthouse against the deployed HTTPS origin.
2. Test Chrome, Edge, Firefox and Safari current versions.
3. Test iOS Safari and Android Chrome on physical devices.
4. Verify real contact-form delivery and failure handling.
5. Validate analytics and consent behavior.
6. Enable indexing only after approved detail content replaces placeholders.
