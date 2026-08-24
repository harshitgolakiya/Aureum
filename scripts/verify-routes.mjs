import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { setTimeout as wait } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const port = 3199;
const origin = `http://127.0.0.1:${port}`;
const nextBin = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
let output = "";
server.stdout.on("data", (chunk) => (output += chunk));
server.stderr.on("data", (chunk) => (output += chunk));

const routes = [
  "/",
  "/who-we-are",
  "/how-we-partner",
  "/portfolio",
  "/insights",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
  "/aureumLogo.svg",
  "/manifest.webmanifest",
  "/opengraph-image",
  "/robots.txt",
  "/sitemap.xml",
];
const unpublishedPlaceholderRoutes = [
  "/portfolio/project-1",
  "/portfolio/project-2",
  "/portfolio/project-3",
  "/portfolio/project-4",
  "/insights/article-1",
  "/insights/article-2",
  "/insights/article-3",
];

async function ready() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(origin)).ok) return;
    } catch {}
    await wait(250);
  }
  throw new Error(`Server did not become ready.\n${output}`);
}

let failed = false;
try {
  await ready();
  for (const route of routes) {
    const response = await fetch(origin + route);
    console.log(`${response.ok ? "PASS" : "FAIL"} ${response.status} ${route}`);
    if (!response.ok) failed = true;
  }
  for (const route of unpublishedPlaceholderRoutes) {
    const response = await fetch(origin + route);
    let pass = response.status === 404;
    let expectation = "unpublished";
    if (response.status === 200) {
      const html = await response.text();
      pass = /<meta(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b)[^>]*>/i.test(html);
      expectation = "outage fallback noindex";
    }
    console.log(`${pass ? "PASS" : "FAIL"} ${response.status} ${expectation} ${route}`);
    if (!pass) failed = true;
  }
  const landing = await fetch(origin);
  const landingHtml = await landing.text();
  const footerDetails = [
    "Aureum Asset Management LLC. FZ",
    "602, Capricorn Tower",
    "Trade Center Second",
    "Dubai,",
    "United Arab Emirates",
    "info@aureum.ae",
    "04 234 8818",
    'href="mailto:info@aureum.ae"',
    'href="tel:+97142348818"',
  ];
  const footerDetailsPass = footerDetails.every((detail) =>
    landingHtml.includes(detail),
  );
  console.log(
    `${footerDetailsPass ? "PASS" : "FAIL"} approved footer address and contact links`,
  );
  if (!footerDetailsPass) failed = true;
  const headers = {
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "cross-origin-opener-policy": "same-origin",
    "permissions-policy":
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  };
  for (const [header, expected] of Object.entries(headers)) {
    const value = landing.headers.get(header);
    console.log(
      `${value === expected ? "PASS" : "FAIL"} header ${header}: ${value || "missing"}`,
    );
    if (value !== expected) failed = true;
  }
  const logo = await fetch(origin + "/aureumLogo.svg");
  const logoCached = (logo.headers.get("cache-control") || "").includes(
    "immutable",
  );
  console.log(`${logoCached ? "PASS" : "FAIL"} immutable Aureum logo cache`);
  if (!logoCached) failed = true;
  const missing = await fetch(origin + "/route-that-does-not-exist");
  console.log(
    `${missing.status === 404 ? "PASS" : "FAIL"} ${missing.status} branded 404`,
  );
  if (missing.status !== 404) failed = true;
} finally {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    server.kill("SIGTERM");
  }
  await Promise.race([once(server, "exit"), wait(2000)]);
}
if (failed) process.exitCode = 1;
