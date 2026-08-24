export const TEMPORARY_SITE_ORIGIN =
  "https://darkgray-oryx-870770.hostingersite.com";

export const PLANNED_SITE_ORIGIN = "https://aureum.ae";

export function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return TEMPORARY_SITE_ORIGIN;

  try {
    return new URL(configured).origin;
  } catch {
    return TEMPORARY_SITE_ORIGIN;
  }
}
