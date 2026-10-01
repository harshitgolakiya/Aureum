// Load the checked-in TypeScript facility data for database scripts, without
// importing Next.js server code or creating a second copy of the brochure data.
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function load(relativePath, requireModule = () => { throw new Error("Unexpected data dependency"); }) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)(requireModule, exports);
  return exports;
}
const details = await load("../data/project-details.ts");
export const { clientProjects } = await load("../data/client-projects.ts", (name) => {
  if (name === "./project-details") return details;
  throw new Error(`Unexpected client data dependency: ${name}`);
});
