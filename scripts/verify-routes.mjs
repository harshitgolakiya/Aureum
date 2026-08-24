import { spawn } from "node:child_process";
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
    const pass = response.status === 404;
    console.log(`${pass ? "PASS" : "FAIL"} ${response.status} unpublished ${route}`);
    if (!pass) failed = true;
  }
  const landing = await fetch(origin);
  const headers = {
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
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), wait(2000)]);
}
if (failed) process.exitCode = 1;
