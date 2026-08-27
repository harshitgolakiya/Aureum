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
  "/insights",
  "/contact",
  "/privacy-policy",
];
const viewports = [
  ["phone-375", 375, 812, true, 2],
  ["phone-430", 430, 932, true, 2],
  ["tablet-768", 768, 1024, true, 2],
  ["tablet-1024", 1024, 768, true, 2],
  ["laptop-short", 1280, 650, false, 1],
  ["desktop-1440", 1440, 900, false, 1],
  ["desktop-1920", 1920, 1080, false, 1],
];
const motionModes = ["no-preference", "reduce"];
const routeFilter = process.env.AUDIT_ROUTES?.split(",").filter(Boolean);
const viewportFilter = process.env.AUDIT_VIEWPORTS?.split(",").filter(Boolean);
const selectedRoutes = routeFilter?.length
  ? routes.filter((route) => routeFilter.includes(route))
  : routes;
const selectedViewports = viewportFilter?.length
  ? viewports.filter(([name]) => viewportFilter.includes(name))
  : viewports;

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
  const listeners = new Map();
  let sequence = 0;
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) {
      listeners.get(message.method)?.forEach((listener) =>
        listener(message.params),
      );
      return;
    }
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const opened = once(socket, "open");
  return {
    opened,
    on(method, listener) {
      const callbacks = listeners.get(method) || new Set();
      callbacks.add(listener);
      listeners.set(method, callbacks);
      return () => callbacks.delete(listener);
    },
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
  const navigation = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');
  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    viewportWidths: {
      inner: innerWidth,
      client: document.documentElement.clientWidth,
      htmlScroll: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
    },
    main: Boolean(document.querySelector('main')),
    duplicateIds: [...new Set(duplicateIds)],
    unlabeledButtons,
    imagesWithoutAlt,
    unnamedLinks,
    unlabeledFields,
    brokenAriaReferences: [...new Set(brokenAriaReferences)],
    htmlLang: document.documentElement.lang,
    h1Count: document.querySelectorAll('h1').length,
    domNodes: document.querySelectorAll('*').length,
    resourceCount: performance.getEntriesByType('resource').length,
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd : 0,
    decodedResourceBytes: resources.reduce((total, entry) => total + (entry.decodedBodySize || 0), 0),
    overflowElements: [...document.querySelectorAll('body *')]
      .filter(node => { const rect = node.getBoundingClientRect(); return rect.right > innerWidth + 2 || rect.left < -2; })
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return Math.max(aRect.right - innerWidth, -aRect.left) - Math.max(bRect.right - innerWidth, -bRect.left);
      })
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
      await cdp.send("Network.enable");
      let runtimeErrors = [];
      let networkErrors = [];
      let actionableWarnings = [];
      cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
        runtimeErrors.push(
          exceptionDetails.exception?.description || exceptionDetails.text,
        );
      });
      cdp.on("Runtime.consoleAPICalled", ({ type, args }) => {
        if (type !== "warning" && type !== "error") return;
        const message = args
          .map((argument) => argument.value ?? argument.description ?? "")
          .join(" ");
        if (
          message.includes("GSAP target") ||
          (message.includes("Image with src") &&
            message.includes("either width or height modified")) ||
          message.includes("missing-data-scroll-behavior")
        ) {
          actionableWarnings.push(message);
        }
      });
      cdp.on("Network.loadingFailed", ({ errorText, canceled }) => {
        if (!canceled && errorText !== "net::ERR_ABORTED")
          networkErrors.push(errorText);
      });
      for (const motion of motionModes) {
        await cdp.send("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-reduced-motion", value: motion }],
        });
        for (const [viewport, width, height, mobile, deviceScaleFactor] of selectedViewports) {
          await cdp.send("Emulation.setDeviceMetricsOverride", {
            width,
            height,
            deviceScaleFactor,
            mobile,
          });
          await cdp.send("Emulation.setTouchEmulationEnabled", {
            enabled: mobile,
            maxTouchPoints: mobile ? 5 : 1,
          });
          for (const route of selectedRoutes) {
            runtimeErrors = [];
            networkErrors = [];
            actionableWarnings = [];
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
              value.domNodes <= 2500 &&
              value.resourceCount <= 150 &&
              value.domContentLoaded <= 4000 &&
              value.decodedResourceBytes <= 5_000_000 &&
              value.overflow <= 2 &&
              !value.duplicateIds.length &&
              !value.brokenAriaReferences.length &&
              value.unlabeledButtons === 0 &&
              value.imagesWithoutAlt === 0 &&
              value.unnamedLinks === 0 &&
              value.unlabeledFields === 0 &&
              runtimeErrors.length === 0 &&
              networkErrors.length === 0 &&
              actionableWarnings.length === 0;
            value.runtimeErrors = runtimeErrors;
            value.networkErrors = networkErrors;
            value.actionableWarnings = actionableWarnings;
            const label = `${name} ${viewport} ${motion} ${route}`;
            if (pass) console.log(`PASS ${label}`);
            else console.log(`FAIL ${label}`, JSON.stringify(value));
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
        ["mobile navigation", "/", `async () => { const button = document.querySelector('.menu-button'); button?.focus(); button?.click(); await new Promise(resolve => setTimeout(resolve, 100)); const menu = document.querySelector('#mobile-menu'); const opened = button?.getAttribute('aria-expanded') === 'true' && menu?.getAttribute('aria-hidden') === 'false' && menu?.contains(document.activeElement); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await new Promise(resolve => setTimeout(resolve, 100)); return opened && button?.getAttribute('aria-expanded') === 'false' && menu?.getAttribute('aria-hidden') === 'true' && document.activeElement === button; }`],
        ["homepage image sequence", "/", `async () => { const section = document.querySelector('.aureum-sequence-story'); if (!section) return false; const travel = Math.max(section.offsetHeight - innerHeight, 1); scrollTo(0, section.offsetTop + travel * 0.55); await new Promise(resolve => setTimeout(resolve, 1200)); const active = section.querySelector('.aureum-sequence-stage-stack article.is-active'); const progress = section.querySelector('.aureum-sequence-progress > span'); return section.querySelector('.aureum-sequence-visual')?.classList.contains('is-ready') && active?.querySelector('h2')?.textContent.trim() === 'Development Strategy' && parseFloat(getComputedStyle(progress).width) > 0; }`, "no-preference"],
        ["portfolio filter", "/portfolio", `async () => { const buttons = [...document.querySelectorAll('.portfolio-filter-bar button')]; const button = buttons.find(node => node.textContent.trim() === 'Logistics'); if (!button) return buttons.length === 1 && buttons[0].textContent.trim() === 'All' && buttons[0].getAttribute('aria-pressed') === 'true'; button.click(); await new Promise(resolve => setTimeout(resolve, 100)); return button.getAttribute('aria-pressed') === 'true'; }`],
        ["contact validation", "/contact", `async () => { document.querySelector('.strategic-form button[type="submit"]')?.click(); await new Promise(resolve => setTimeout(resolve, 100)); const alert = document.querySelector('.error-summary[role="alert"]'); return Boolean(alert && document.activeElement === alert && document.querySelectorAll('[aria-invalid="true"]').length >= 4); }`],
        ["contact visual states", "/contact", `async () => { await new Promise(resolve => setTimeout(resolve, 1200)); const title = document.querySelector('.contact-hero h1'); const selects = [...document.querySelectorAll('.strategic-form .select-field')]; if (!title || selects.length !== 2) return false; const titleStyle = getComputedStyle(title); const titleVisible = Number(titleStyle.opacity) >= 0.99 && titleStyle.color === 'rgb(255, 255, 255)'; const labelsClear = selects.every(field => { const label = field.querySelector(':scope > span')?.getBoundingClientRect(); const select = field.querySelector('select')?.getBoundingClientRect(); return label && select && label.bottom <= select.top + 2; }); return titleVisible && labelsClear; }`],
        ["contact spam protection", "/contact", `async () => { const input = document.querySelector('#companyWebsite'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set; setter?.call(input, 'https://spam.invalid'); input?.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 50)); document.querySelector('.strategic-form button[type="submit"]')?.click(); await new Promise(resolve => setTimeout(resolve, 100)); return Boolean(document.querySelector('.confirmation.success') && !document.querySelector('.error-summary')); }`],
      ];
      for (const [label, route, expression, motion = "reduce"] of interactions) {
        await cdp.send("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-reduced-motion", value: motion }],
        });
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
