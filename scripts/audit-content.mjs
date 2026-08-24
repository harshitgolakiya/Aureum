import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = await readFile(
  new URL("../data/site.ts", import.meta.url),
  "utf8",
);
const projects = (source.match(/name: "\[Project Name\]"/g) || []).length;
const articles = (source.match(/author: "\[Author name\]"/g) || []).length;
const metrics = (source.match(/metric: "\[/g) || []).length;
const mediaSource = await readFile(
  new URL("../data/media.ts", import.meta.url),
  "utf8",
);
const approvedAssets = [
  ...mediaSource.matchAll(/src:\s*["'](\/media\/[^"']+)["']/g),
].map((match) => match[1]);
const missingAssets = [];
for (const asset of approvedAssets) {
  try {
    await access(
      fileURLToPath(new URL(`../public${asset}`, import.meta.url)),
    );
  } catch {
    missingAssets.push(asset);
  }
}

console.log("Aureum content readiness");
console.log(`- Project records awaiting approved facts: ${projects}`);
console.log(`- Insight records awaiting approved authors/copy: ${articles}`);
console.log(`- Project metrics awaiting approval: ${metrics}`);
console.log(`- Approved media mappings installed: ${approvedAssets.length}`);
console.log(
  "- Legal copy, final social URLs, map integration and final project media remain client-controlled.",
);
if (missingAssets.length) {
  console.error(`Missing approved media files: ${missingAssets.join(", ")}`);
  process.exitCode = 1;
}
console.log(
  projects || articles
    ? "Presentation fallbacks remain active; placeholder detail routes stay noindex."
    : "Content data appears ready for final editorial review.",
);
