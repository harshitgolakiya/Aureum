import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const sourceRoots = ["app", "components", "data"];
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css"]);
const forbidden = [
  [/\bdebugger\b/g, "debugger statement"],
  [/console\.(log|debug)\s*\(/g, "development console call"],
  [/\b(?:TODO|FIXME|HACK)\b/g, "unfinished source marker"],
];
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) await walk(path);
    else if (textExtensions.has(extname(path))) {
      const source = await readFile(path, "utf8");
      for (const [pattern, label] of forbidden) {
        if (pattern.test(source)) failures.push(`${relative(root, path)}: ${label}`);
        pattern.lastIndex = 0;
      }
    }
  }
}

for (const directory of sourceRoots) await walk(join(root, directory));

const publicRoot = join(root, "public");
async function auditAssets(directory) {
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) await auditAssets(path);
    else if (info.size > (extname(path).toLowerCase() === ".mp4" ? 50_000_000 : 5_000_000))
      failures.push(`${relative(root, path)}: asset exceeds its delivery budget`);
    else if (
      relative(publicRoot, path).split(/[/\\]/).slice(0, 2).join("/") ===
        "media/heroes" &&
      extname(path).toLowerCase() === ".png"
    )
      failures.push(`${relative(root, path)}: hero photography must use WebP`);
    else if (
      relative(publicRoot, path).split(/[/\\]/).slice(0, 2).join("/") ===
        "media/heroes" &&
      [".jpg", ".jpeg", ".webp", ".avif"].includes(extname(path).toLowerCase()) &&
      info.size > 500_000
    )
      failures.push(`${relative(root, path)}: optimized hero exceeds 500 KB`);
  }
}
await auditAssets(publicRoot);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("PASS source hygiene and static asset budgets");
