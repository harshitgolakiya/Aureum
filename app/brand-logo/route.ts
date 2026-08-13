import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const logo = await readFile(path.join(process.cwd(), "aureumLogo.svg"));
  return new Response(new Uint8Array(logo), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
