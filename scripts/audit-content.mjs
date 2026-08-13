import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../data/site.ts", import.meta.url),
  "utf8",
);
const projects = (source.match(/name: "\[Project Name\]"/g) || []).length;
const articles = (source.match(/author: "\[Author name\]"/g) || []).length;
const metrics = (source.match(/metric: "\[/g) || []).length;

console.log("Aureum content readiness");
console.log(`- Project records awaiting approved facts: ${projects}`);
console.log(`- Insight records awaiting approved authors/copy: ${articles}`);
console.log(`- Project metrics awaiting approval: ${metrics}`);
console.log(
  "- Legal, leadership, contact, map and final media remain client-controlled.",
);
console.log(
  projects || articles
    ? "Presentation fallbacks remain active; placeholder detail routes stay noindex."
    : "Content data appears ready for final editorial review.",
);
