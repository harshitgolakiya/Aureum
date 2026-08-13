const production = process.argv.includes("--production");
const requirements = [
  ["NEXT_PUBLIC_SITE_URL", "canonical URLs, sitemap and social metadata", true],
  ["NEXT_PUBLIC_CONTACT_ENDPOINT", "live contact-form delivery", true],
  ["NEXT_PUBLIC_MAPBOX_TOKEN", "interactive map upgrade", false],
];

let failed = false;
console.log(`Aureum environment audit${production ? " (production)" : ""}`);
for (const [name, purpose, required] of requirements) {
  const value = process.env[name];
  const status = value ? "configured" : required ? "required" : "optional";
  console.log(`- ${name}: ${status} — ${purpose}`);
  if (production && required && !value) failed = true;
}
if (failed) {
  console.error("Production environment is incomplete.");
  process.exitCode = 1;
}
