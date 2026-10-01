# Client facility content

The four PDFs in `public/` are the source for the facilities in `data/client-projects.ts`.
Names follow the supplied filenames and can be changed in the CMS.

## New project format

Facility records use `cms_projects.project_details` (JSON) for the marketing headline,
commercial offering, ordered specifications with notes, features, sectors, custom
sections, contact, PDF brochure and image caption. The existing project fields
still hold the name, summary, asset category, availability/status and engagement.
Legacy records without facility details continue to use the case-study layout.

The CMS supports both formats. Facility records can publish without images or a
location. Photos can later be assigned separately as cover, gallery and homepage
images. Empty galleries are omitted; image-free covers show a text composition.

## Import and deployment

Schema setup adds the JSON column without removing existing fields. The first
portfolio or project-library request runs the transactional migration
`2026-10-client-facility-brochures-v1`. It inserts missing client records and never
overwrites subsequent CMS edits. Known demonstration records are returned to
draft only if their opportunity text still identifies them as demo placeholders.
They remain available in the CMS.

The checked-in fallback contains the same four records. The homepage uses their
specifications and brochure copy and accepts image-free featured projects.
`npm run cms:seed-homepage` now refreshes these client records. That explicit seed
command overwrites their CMS fields; routine deployment does not.

## Client confirmation needed

- Locations are not provided for Logistics, Skyline or Trading. They are blank.
- Trading advertises build-to-own while also listing leasehold as an advantage.
  Both source statements are retained; the tenure should be confirmed.
- Logistics and Trading built-up figures are described in the source as
  operational areas excluding utilities/service areas. Their specification notes
  retain this qualification.
- Proposed renders are illustrative concepts, not completed-site photography.
- No client names, contract values, delivery dates or completed-project outcomes
  have been inferred.

## Verification

`CMS_AUDIT_FACILITIES=1 npm run cms:audit:browsers` adds a temporary facility
save/edit/publish/revision round-trip check. The temporary record is cleaned up.
The public browser audit accepts facility routes through `AUDIT_ROUTES`.
