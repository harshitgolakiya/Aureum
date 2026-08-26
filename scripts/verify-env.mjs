const production = process.argv.includes("--production");
const requirements = [
  ["NEXT_PUBLIC_SITE_URL", "canonical URLs, sitemap and social metadata", true],
  ["NEXT_PUBLIC_MAPBOX_TOKEN", "interactive map upgrade", false],
  ["NEXT_PUBLIC_VITALS_ENDPOINT", "privacy-conscious field performance monitoring", false],
];
const privateRequirements = [
  ["DATABASE_URL", "MySQL CMS storage", (value) => { try { return ["mysql:", "mysqls:"].includes(new URL(value).protocol); } catch { return false; } }],
  ["NEXT_SERVER_ACTIONS_ENCRYPTION_KEY", "stable server-action encryption across instances", (value) => value.length >= 32],
  ["CMS_CRON_SECRET", "authenticated scheduled publishing", (value) => value.length >= 32],
  ["RESEND_API_KEY", "contact-form email notifications", (value) => value.length >= 10],
  ["CONTACT_FROM_EMAIL", "verified contact-form sender", (value) => /.+<[^\s@]+@[^\s@]+\.[^\s@]+>|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)],
];

let failed = false;
console.log(`Aureum environment audit${production ? " (production)" : ""}`);
for (const [name, purpose, required] of requirements) {
  const value = process.env[name];
  let valid = true;
  if (value) {
    try {
      const url = new URL(value);
      valid = url.protocol === "https:" && !url.username && !url.password;
    } catch {
      valid = false;
    }
  }
  const status = value
    ? valid
      ? "configured"
      : "invalid HTTPS URL"
    : required
      ? "required"
      : "optional";
  console.log(`- ${name}: ${status} — ${purpose}`);
  if ((production && required && !value) || (value && !valid)) failed = true;
}
for (const [name, purpose, validate] of privateRequirements) {
  const value = process.env[name]?.trim() ?? "";
  const valid = Boolean(value) && validate(value);
  console.log(`- ${name}: ${valid ? "configured" : value ? "invalid" : "required"} — ${purpose}`);
  if (production && !valid) failed = true;
}
if (failed) {
  console.error("Production environment is incomplete.");
  process.exitCode = 1;
}
