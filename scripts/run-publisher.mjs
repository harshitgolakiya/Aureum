const secret = process.env.CMS_CRON_SECRET?.trim() ?? "";
const configuredEndpoint = process.env.CMS_PUBLISH_ENDPOINT?.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const endpoint = configuredEndpoint || (siteUrl ? new URL("/api/cron/publish", siteUrl).toString() : "");

if (secret.length < 32) throw new Error("CMS_CRON_SECRET must contain at least 32 characters.");
if (!endpoint) throw new Error("Set CMS_PUBLISH_ENDPOINT or NEXT_PUBLIC_SITE_URL before running the publisher.");
const url = new URL(endpoint);
const local = ["localhost", "127.0.0.1"].includes(url.hostname);
if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("The publishing endpoint must use HTTPS outside local development.");

const response = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
  signal: AbortSignal.timeout(15_000),
});
const result = await response.json().catch(() => null);
if (!response.ok || !result?.ok) throw new Error(`Publishing worker returned ${response.status}.`);
console.log(`Scheduled publishing complete: ${result.count} record${result.count === 1 ? "" : "s"} published.`);
