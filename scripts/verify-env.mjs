const production = process.argv.includes("--production");
const requirements = [
  ["NEXT_PUBLIC_SITE_URL", "canonical URLs, sitemap and social metadata", true],
  ["NEXT_PUBLIC_CONTACT_ENDPOINT", "live contact-form delivery", true],
  ["NEXT_PUBLIC_MAPBOX_TOKEN", "interactive map upgrade", false],
  ["NEXT_PUBLIC_VITALS_ENDPOINT", "privacy-conscious field performance monitoring", false],
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
if (failed) {
  console.error("Production environment is incomplete.");
  process.exitCode = 1;
}
