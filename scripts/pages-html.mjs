import fs from "node:fs";
import path from "node:path";

/** Next `output: "export"` emits `admin.html` + `admin/` (RSC). Cloudflare
 *  serves `/admin` cleanly when `admin/index.html` exists. */
const pages = ["admin", "size", "blog", "read", "view"];
const outDir = path.resolve("out");

for (const page of pages) {
  const htmlFile = path.join(outDir, `${page}.html`);
  const dir = path.join(outDir, page);
  if (!fs.existsSync(htmlFile)) continue;
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(htmlFile, path.join(dir, "index.html"));
  console.log(`pages-html: ${page}/index.html`);
}
