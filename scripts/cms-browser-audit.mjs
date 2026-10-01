import { createHash, randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as wait } from "node:timers/promises";
import mysql from "mysql2/promise";
import WebSocket from "ws";

const port = 3202;
const origin = `http://127.0.0.1:${port}`;
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const browserPath = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find(existsSync);
if (!browserPath) {
  console.log("SKIP No local Chromium browser found for the CMS accessibility audit.");
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the CMS browser audit.");

const app = spawn(process.execPath, [nextBin, "start", "-p", String(port)], { stdio: "ignore", windowsHide: true });
const db = await mysql.createConnection(process.env.DATABASE_URL);
const rawToken = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(rawToken).digest("hex");
const teamAuditSlug = `qa-team-${Date.now()}`;
const facilityAuditSlug = `qa-facility-${Date.now()}`;
const [admins] = await db.query("SELECT id FROM cms_users WHERE role = 'administrator' AND active = TRUE ORDER BY created_at LIMIT 1");
if (!admins.length) throw new Error("An active CMS administrator is required for the browser audit.");
await db.execute("INSERT INTO cms_sessions (token_hash, user_id, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 1 HOUR)", [tokenHash, admins[0].id]);

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let id = 0;
  socket.on("message", (data) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const item = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message));
    else item.resolve(message.result);
  });
  return {
    opened: once(socket, "open"),
    send(method, params = {}) { const requestId = ++id; socket.send(JSON.stringify({ id: requestId, method, params })); return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject })); },
    close() { socket.close(); },
  };
}

const routes = ["/admin", "/admin/projects", "/admin/projects/new", "/admin/insights", "/admin/insights/new", "/admin/media", "/admin/team", "/admin/team/new", "/admin/pages", "/admin/users", "/admin/recovery", "/admin/settings"];
const viewports = [["tablet-768", 768, 1024], ["tablet-1024", 1024, 768], ["desktop-1440", 1440, 900], ["desktop-1920", 1920, 1080]];
const requestedRoutes = process.env.CMS_AUDIT_ROUTES?.split(",").filter(Boolean);
const requestedViewports = process.env.CMS_AUDIT_VIEWPORTS?.split(",").filter(Boolean);
const selectedRoutes = requestedRoutes?.length ? requestedRoutes.filter((route) => routes.includes(route) || /^\/admin\/projects\/[a-z0-9-]+(?:\/preview)?$/.test(route)) : routes;
const selectedViewports = requestedViewports?.length ? viewports.filter(([name]) => requestedViewports.includes(name)) : viewports;
const expression = `(() => {
  const name = node => (node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || '').trim() || node.querySelector('img[alt]:not([alt=""])')?.alt || '';
  const fields = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')];
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(node => Number(node.tagName.slice(1)));
  return {
    lang: document.documentElement.lang,
    main: document.querySelectorAll('main').length,
    h1: document.querySelectorAll('h1').length,
    navigation: Boolean(document.querySelector('nav[aria-label]')),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    missingAlt: [...document.images].filter(node => !node.hasAttribute('alt')).length,
    unnamedButtons: [...document.querySelectorAll('button, summary')].filter(node => !name(node)).length,
    unnamedLinks: [...document.querySelectorAll('a[href]')].filter(node => !name(node)).length,
    unlabeledFields: fields.filter(node => !node.labels?.length && !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby')).length,
    duplicateIds: [...document.querySelectorAll('[id]')].map(node => node.id).filter((id, index, ids) => id && ids.indexOf(id) !== index),
    brokenAria: [...document.querySelectorAll('[aria-controls],[aria-describedby],[aria-labelledby]')].flatMap(node => ['aria-controls','aria-describedby','aria-labelledby'].flatMap(attr => (node.getAttribute(attr) || '').split(/\\s+/).filter(Boolean))).filter(id => !document.getElementById(id)),
    headingSkips: headings.slice(1).filter((level, index) => level > headings[index] + 1).length,
    oversizedHeadings: [...document.querySelectorAll('h1,h2,h3')].filter(node => Number.parseFloat(getComputedStyle(node).fontSize) > 80).length,
    userControlIssues: [...document.querySelectorAll('.cms-users-page input:not([type="hidden"]):not([type="checkbox"]), .cms-users-page select, .cms-users-page button, .cms-users-page summary')].filter(node => { const r=node.getBoundingClientRect(); const s=getComputedStyle(node); return r.height < 36 || s.borderStyle === 'none'; }).length,
    userPanelIssues: [...document.querySelectorAll('.cms-security-grid > article, .cms-user-create, .cms-user-list')].filter(node => { const s=getComputedStyle(node); return s.backgroundColor === 'rgba(0, 0, 0, 0)' || Number.parseFloat(s.borderTopWidth) < 1; }).length,
    tinyTargets: [...document.querySelectorAll('button,a[href],summary,input,select,textarea')].filter(node => { const r=node.getBoundingClientRect(); const s=getComputedStyle(node); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24); }).length,
  };
})()`;

let failed = false;
let browser;
let profile;
try {
  await waitFor(origin);
  profile = await mkdtemp(join(tmpdir(), "aureum-cms-audit-"));
  browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=9332", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  await waitFor("http://127.0.0.1:9332/json/version");
  const pages = await (await fetch("http://127.0.0.1:9332/json/list")).json();
  const cdp = connect(pages.find((page) => page.type === "page").webSocketDebuggerUrl);
  await cdp.opened;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setCookie", { name: "aureum_cms_session", value: rawToken, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Strict" });
  async function navigate(route) {
    await cdp.send("Page.navigate", { url: origin + route });
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await wait(100);
      const state = await cdp.send("Runtime.evaluate", {
        expression: `({ path: location.pathname, ready: document.readyState, title: document.title })`,
        returnByValue: true,
      });
      const value = state.result.value;
      if (value?.path === route && value.ready === "complete") return;
    }
    const state = await cdp.send("Runtime.evaluate", { expression: `({ path: location.pathname, ready: document.readyState, title: document.title })`, returnByValue: true });
    throw new Error(`Navigation to ${route} did not settle: ${JSON.stringify(state.result.value)}`);
  }
  for (const [viewport, width, height] of selectedViewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    for (const route of selectedRoutes) {
      await navigate(route);
      await wait(150);
      const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
      const value = result.result.value;
      const pass = value.lang === "en" && value.main === 1 && value.h1 === 1 && value.navigation && value.overflow <= 2 && !value.missingAlt && !value.unnamedButtons && !value.unnamedLinks && !value.unlabeledFields && !value.duplicateIds.length && !value.brokenAria.length && !value.headingSkips && !value.oversizedHeadings && !value.userControlIssues && !value.userPanelIssues;
      console.log(`${pass ? "PASS" : "FAIL"} ${viewport} ${route}${pass ? "" : ` ${JSON.stringify(value)}`}`);
      if (!pass) failed = true;
      if (process.env.CMS_AUDIT_SCREENSHOTS === "1" && viewport === "desktop-1440" && route === "/admin/users") {
        await mkdir(".qa-shots", { recursive: true });
        const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(".qa-shots/admin-users-1440.png", Buffer.from(screenshot.data, "base64"));
        await cdp.send("Runtime.evaluate", { expression: `document.querySelector('.cms-user-list')?.scrollIntoView({ block: 'start' })` });
        await wait(100);
        const directoryScreenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(".qa-shots/admin-users-directory-1440.png", Buffer.from(directoryScreenshot.data, "base64"));
      }
    }
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
  await navigate("/admin");
  const keyboard = await cdp.send("Runtime.evaluate", { expression: `(async () => { const focusables=[...document.querySelectorAll('a[href],button,summary,input,select,textarea')].filter(n=>{const r=n.getBoundingClientRect();return !n.disabled&&r.width&&r.height&&!n.closest('details:not([open]) > :not(summary)')}); const seen=focusables.slice(0,8).map(node=>{node.focus();return document.activeElement===node}); const summary=document.querySelector('.cms-mobile-menu summary'); summary?.focus(); summary?.click(); await new Promise(r=>setTimeout(r,30)); return { pass: seen.every(Boolean) && Boolean(summary) && summary?.parentElement?.open === true, focusCount: seen.filter(Boolean).length, tested: seen.length, menuOpen: summary?.parentElement?.open === true }; })()`, awaitPromise: true, returnByValue: true });
  const keyboardPass = keyboard.result.value?.pass === true;
  console.log(`${keyboardPass ? "PASS" : "FAIL"} tablet keyboard focus and navigation menu${keyboardPass ? "" : ` ${JSON.stringify(keyboard.result.value)}`}`);
  if (!keyboardPass) failed = true;
  if (process.env.CMS_AUDIT_FACILITIES === "1") {
    await navigate("/admin/projects/new");
    await wait(300);
    const details = {
      headline: "QA facility headline", offering: "Lease", specifications: [{ label: "Floor plate", value: "7,000 sq ft", note: "Each floor" }],
      featuresTitle: "Key features", features: ["Dedicated parking"], sectors: ["Healthcare"], sections: [{ title: "Connectivity", body: "QA facility connectivity." }],
      contactName: "QA Contact", contactPhone: "+971 55 689 4660", brochure: "/Aureum_Office Building.pdf", imageCaption: "Site photography",
    };
    await cdp.send("Runtime.evaluate", { expression: `(async () => {
      const form = document.querySelector('form.cms-project-editor');
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      const name = form.elements.namedItem('name'); set.call(name, 'QA Facility'); name.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 80));
      const slug = form.elements.namedItem('slug'); set.call(slug, ${JSON.stringify(facilityAuditSlug)}); slug.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 80));
      for (const [key, value] of Object.entries({ type: 'Office building', category: 'Commercial Office', metric: '7,000 sq ft', status: 'Ready to move in', engagement: 'Lease', philosophy: 'QA facility summary.' })) form.elements.namedItem(key).value = value;
      form.elements.namedItem('projectDetails').value = ${JSON.stringify(JSON.stringify(details))};
      [...form.querySelectorAll('button')].find(n => n.textContent === 'Save draft').click();
    })()`, awaitPromise: true });
    let saved = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await wait(100);
      const [rows] = await db.execute("SELECT project_details FROM cms_projects WHERE slug = ?", [facilityAuditSlug]);
      if (rows.length) { const detail = typeof rows[0].project_details === 'string' ? JSON.parse(rows[0].project_details) : rows[0].project_details; saved = detail.specifications[0].value === '7,000 sq ft' && detail.brochure === details.brochure; break; }
    }
    console.log(`${saved ? 'PASS' : 'FAIL'} facility details save to database without images or invented location`);
    if (!saved) failed = true;
    if (saved) {
      await navigate(`/admin/projects/${facilityAuditSlug}`);
      await wait(300);
      const edited = await cdp.send("Runtime.evaluate", { expression: `(async () => {
        const form = document.querySelector('form.cms-project-editor');
        [...form.querySelectorAll('button')].find(n => n.textContent === 'Add specification').click();
        await new Promise(r => setTimeout(r, 80));
        const articles = [...form.querySelectorAll('.cms-chapter-editor article')];
        const last = articles.filter(n => n.textContent.includes('Specification')).at(-1);
        const inputs = last.querySelectorAll('input');
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        set.call(inputs[0], 'Configuration'); inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        set.call(inputs[1], 'G+1'); inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        const details = JSON.parse(form.elements.namedItem('projectDetails').value);
        const pass = details.specifications.length === 2 && details.specifications[1].value === 'G+1';
        [...form.querySelectorAll('button')].find(n => n.textContent === 'Publish project').click();
        return pass;
      })()`, awaitPromise: true, returnByValue: true });
      let published = false;
      for (let attempt = 0; attempt < 80; attempt += 1) {
        await wait(100);
        const [rows] = await db.execute("SELECT published, JSON_LENGTH(project_details, '$.specifications') AS specs FROM cms_projects WHERE slug = ?", [facilityAuditSlug]);
        if (rows[0]?.published) { published = rows[0].specs === 2; break; }
      }
      const html = await (await fetch(origin + `/portfolio/${facilityAuditSlug}`)).text();
      const pass = edited.result.value && published && html.includes('G+1') && html.includes('7,000 sq ft');
      console.log(`${pass ? 'PASS' : 'FAIL'} facility CMS specification edit and publish round trip`);
      if (!pass) failed = true;
      const [revisions] = await db.execute("SELECT COUNT(*) AS count FROM cms_revisions WHERE content_type = 'project' AND content_slug = ?", [facilityAuditSlug]);
      const revisionPass = revisions[0].count >= 2;
      console.log(`${revisionPass ? 'PASS' : 'FAIL'} facility changes retain revision history`);
      if (!revisionPass) failed = true;
    }
  }
  await navigate("/admin/team/new");
  await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const form = document.querySelector('form.cms-project-editor');
      const values = ${JSON.stringify({
        name: "QA Team Member",
        slug: teamAuditSlug,
        role: "QA Director",
        discipline: "Quality Assurance",
        visualLabel: "QA",
        biographyOne: "Temporary team profile created by the CMS browser audit.",
        group: "senior",
        sortOrder: "9999",
      })};
      for (const [name, value] of Object.entries(values)) {
        const field = form?.elements.namedItem(name);
        if (field) field.value = value;
      }
      const published = form?.elements.namedItem('published');
      if (published) published.checked = true;
      form?.requestSubmit();
      return Boolean(form);
    })()`,
    returnByValue: true,
  });
  let teamCreated = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await wait(100);
    const [rows] = await db.execute("SELECT name, published FROM cms_team_members WHERE slug = ? AND deleted_at IS NULL", [teamAuditSlug]);
    if (rows.length) { teamCreated = rows[0].name === "QA Team Member" && Boolean(rows[0].published); break; }
  }
  console.log(`${teamCreated ? "PASS" : "FAIL"} CMS can add and publish a team member without portraits`);
  if (!teamCreated) failed = true;
  const publicTeamPage = await fetch(origin + "/who-we-are");
  const publicTeamBody = await publicTeamPage.text();
  const teamPublished = publicTeamPage.ok && publicTeamBody.includes("QA Team Member");
  console.log(`${teamPublished ? "PASS" : "FAIL"} published team member appears on Who We Are`);
  if (!teamPublished) failed = true;
  await navigate("/admin/team");
  await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      window.confirm = () => true;
      const row = [...document.querySelectorAll('.cms-project-row')].find(node => node.textContent.includes('QA Team Member'));
      row?.querySelector('details')?.setAttribute('open', '');
      const button = [...(row?.querySelectorAll('button') || [])].find(node => node.textContent.includes('Delete member'));
      button?.click();
      return Boolean(button);
    })()`,
    returnByValue: true,
  });
  let teamDeleted = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await wait(100);
    const [rows] = await db.execute("SELECT deleted_at FROM cms_team_members WHERE slug = ?", [teamAuditSlug]);
    if (rows[0]?.deleted_at) { teamDeleted = true; break; }
  }
  console.log(`${teamDeleted ? "PASS" : "FAIL"} CMS can remove a team member`);
  if (!teamDeleted) failed = true;
  cdp.close();
} finally {
  if (browser?.pid) spawnSync("taskkill", ["/pid", String(browser.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  if (profile) await rm(profile, { recursive: true, force: true }).catch(() => {});
  await db.execute("DELETE FROM cms_sessions WHERE token_hash = ?", [tokenHash]);
  await db.execute("DELETE FROM cms_audit_log WHERE content_type = 'team_member' AND content_slug = ?", [teamAuditSlug]);
  await db.execute("DELETE FROM cms_team_members WHERE slug = ?", [teamAuditSlug]);
  await db.execute("DELETE FROM cms_revisions WHERE content_type = 'project' AND content_slug = ?", [facilityAuditSlug]);
  await db.execute("DELETE FROM cms_audit_log WHERE content_type = 'project' AND content_slug = ?", [facilityAuditSlug]);
  await db.execute("DELETE FROM cms_projects WHERE slug = ?", [facilityAuditSlug]);
  await db.end();
  app.kill("SIGTERM");
  await Promise.race([once(app, "exit"), wait(2000)]);
}
if (failed) process.exitCode = 1;
