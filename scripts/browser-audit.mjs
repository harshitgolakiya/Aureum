import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as wait } from "node:timers/promises";
import WebSocket from "ws";

const appPort = 3198;
const origin = `http://127.0.0.1:${appPort}`;
const nextBin = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const app = spawn(process.execPath, [nextBin, "start", "-p", String(appPort)], {
  stdio: "ignore",
  windowsHide: true,
});
const browsers = [
  ["Chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"],
  ["Edge", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"],
].filter(([, executable]) => existsSync(executable));
const routes = [
  "/",
  "/who-we-are",
  "/how-we-partner",
  "/portfolio",
  "/portfolio/project-1",
  "/insights",
  "/insights/article-1",
  "/contact",
  "/privacy-policy",
];
const viewports = [
  ["mobile", 390, 844],
  ["desktop", 1440, 900],
];
const motionModes = ["no-preference", "reduce"];

async function waitFor(url, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {}
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const opened = once(socket, "open");
  return {
    opened,
    send(method, params = {}) {
      const id = ++sequence;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) =>
        pending.set(id, { resolve, reject }),
      );
    },
    close() {
      socket.close();
    },
  };
}

const auditExpression = `(() => {
  const duplicateIds = [...document.querySelectorAll('[id]')]
    .map(node => node.id)
    .filter((id, index, ids) => id && ids.indexOf(id) !== index);
  const unlabeledButtons = [...document.querySelectorAll('button')]
    .filter(node => !node.getAttribute('aria-label') && !node.getAttribute('title') && !node.textContent.trim()).length;
  const imagesWithoutAlt = [...document.querySelectorAll('img')]
    .filter(node => !node.hasAttribute('alt')).length;
  const unnamedLinks = [...document.querySelectorAll('a[href]')]
    .filter(node => !node.getAttribute('aria-label') && !node.getAttribute('title') && !node.textContent.trim() && !node.querySelector('img[alt]:not([alt=""])')).length;
  const unlabeledFields = [...document.querySelectorAll('input, select, textarea')]
    .filter(node => !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby') && !node.labels?.length).length;
  const brokenAriaReferences = [...document.querySelectorAll('[aria-controls], [aria-describedby], [aria-labelledby]')]
    .flatMap(node => ['aria-controls', 'aria-describedby', 'aria-labelledby']
      .flatMap(attribute => (node.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)))
    .filter(id => !document.getElementById(id));
  return {
    overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    main: Boolean(document.querySelector('main')),
    duplicateIds: [...new Set(duplicateIds)],
    unlabeledButtons,
    imagesWithoutAlt,
    unnamedLinks,
    unlabeledFields,
    brokenAriaReferences: [...new Set(brokenAriaReferences)],
    htmlLang: document.documentElement.lang,
    h1Count: document.querySelectorAll('h1').length,
    overflowElements: [...document.querySelectorAll('body *')]
      .filter(node => { const rect = node.getBoundingClientRect(); return rect.right > innerWidth + 2 || rect.left < -2; })
      .slice(0, 8)
      .map(node => ({ tag: node.tagName, className: String(node.className || ''), rect: node.getBoundingClientRect().toJSON() })),
  };
})()`;

let failed = false;
try {
  await waitFor(origin);
  if (!browsers.length)
    console.log("SKIP No supported local Chromium browser found.");
  for (
    let browserIndex = 0;
    browserIndex < browsers.length;
    browserIndex += 1
  ) {
    const [name, executable] = browsers[browserIndex];
    const debugPort = 9320 + browserIndex;
    const profile = await mkdtemp(join(tmpdir(), "aureum-browser-audit-"));
    const browser = spawn(
      executable,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: "ignore", windowsHide: true },
    );
    try {
      await waitFor(`http://127.0.0.1:${debugPort}/json/version`);
      const pages = await (
        await fetch(`http://127.0.0.1:${debugPort}/json/list`)
      ).json();
      const page = pages.find((entry) => entry.type === "page");
      const cdp = connect(page.webSocketDebuggerUrl);
      await cdp.opened;
      await cdp.send("Page.enable");
      await cdp.send("Runtime.enable");
      for (const motion of motionModes) {
        await cdp.send("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-reduced-motion", value: motion }],
        });
        for (const [viewport, width, height] of viewports) {
          await cdp.send("Emulation.setDeviceMetricsOverride", {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: viewport === "mobile",
          });
          for (const route of routes) {
            await cdp.send("Page.navigate", { url: origin + route });
            await wait(650);
            const result = await cdp.send("Runtime.evaluate", {
              expression: auditExpression,
              returnByValue: true,
            });
            const value = result.result.value;
            const pass =
              value.main &&
              value.htmlLang === "en" &&
              value.h1Count === 1 &&
              value.overflow <= 2 &&
              !value.duplicateIds.length &&
              !value.brokenAriaReferences.length &&
              value.unlabeledButtons === 0 &&
              value.imagesWithoutAlt === 0 &&
              value.unnamedLinks === 0 &&
              value.unlabeledFields === 0;
            const label = `${name} ${viewport} ${motion} ${route}`;
            if (pass) console.log(`PASS ${label}`);
            else console.log(`FAIL ${label}`, value);
            if (!pass) failed = true;
          }
        }
      }

      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
      });
      const interactions = [
        ["mobile navigation", "/", `async () => { const button = document.querySelector('.menu-button'); button?.click(); await new Promise(resolve => setTimeout(resolve, 100)); const menu = document.querySelector('#mobile-menu'); return button?.getAttribute('aria-expanded') === 'true' && menu?.getAttribute('aria-hidden') === 'false'; }`],
        ["portfolio filter", "/portfolio", `async () => { const button = [...document.querySelectorAll('.portfolio-filter-bar button')].find(node => node.textContent.trim() === 'Logistics'); button?.click(); await new Promise(resolve => setTimeout(resolve, 100)); return button?.getAttribute('aria-pressed') === 'true' && document.querySelectorAll('.portfolio-editorial-grid > a').length > 0; }`],
        ["project lightbox", "/portfolio/project-1", `async () => { document.querySelector('.case-gallery button')?.click(); await new Promise(resolve => setTimeout(resolve, 100)); const dialog = document.querySelector('[role="dialog"]'); const focused = document.activeElement?.classList.contains('lightbox-close'); dialog?.querySelector('.lightbox-close')?.click(); await new Promise(resolve => setTimeout(resolve, 50)); return Boolean(dialog && focused && !document.querySelector('[role="dialog"]')); }`],
        ["contact validation", "/contact", `async () => { document.querySelector('.strategic-form button[type="submit"]')?.click(); await new Promise(resolve => setTimeout(resolve, 100)); const alert = document.querySelector('.error-summary[role="alert"]'); return Boolean(alert && document.activeElement === alert && document.querySelectorAll('[aria-invalid="true"]').length >= 4); }`],
      ];
      for (const [label, route, expression] of interactions) {
        await cdp.send("Page.navigate", { url: origin + route });
        await wait(650);
        const result = await cdp.send("Runtime.evaluate", {
          expression: `(${expression})()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const pass = result.result.value === true;
        console.log(`${pass ? "PASS" : "FAIL"} ${name} interaction ${label}`);
        if (!pass) failed = true;
      }
      cdp.close();
    } finally {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(browser.pid), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        });
      } else browser.kill("SIGTERM");
      await Promise.race([once(browser, "exit"), wait(2000)]);
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          await rm(profile, { recursive: true, force: true });
          break;
        } catch (error) {
          if (attempt === 3) throw error;
          await wait(300);
        }
      }
    }
  }
} finally {
  app.kill("SIGTERM");
  await Promise.race([once(app, "exit"), wait(2000)]);
}
if (failed) process.exitCode = 1;
