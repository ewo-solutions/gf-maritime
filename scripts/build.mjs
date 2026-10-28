// Static site build: stitches src/pages/*.html into src/layout.html and writes the
// finished pages to the repo root (so the site can be hosted from the root as-is).
//
//   node scripts/build.mjs
//
// Each page starts with a one-line JSON comment:
//   <!--{"title":"…","desc":"…","header":"hero|solid","nav":"page.html"}-->
// and may include shared partials with {{> name}} (see src/partials).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const layout = read("src/layout.html");

// Live domain (apex redirects to www in Vercel). Used for canonical URLs, share tags and the sitemap.
const SITE = "https://www.gf-maritime.com";

const WA = `  <a class="wa" href="https://wa.me/50767490031" target="_blank" rel="noopener" aria-label="Chat with GF Maritime on WhatsApp (opens in a new tab)"><img src="assets/icons/whatsapp.svg" alt="" width="27" height="27"></a>\n`;

const SKIP = '  <a class="skip-link" href="#main">Skip to content</a>\n';
const pages = readdirSync(join(root, "src/pages")).filter((f) => f.endsWith(".html"));
const sitemap = [];

for (const file of pages) {
  let src = read(`src/pages/${file}`);
  const m = src.match(/^<!--(\{.*?\})-->\s*/s);
  if (!m) throw new Error(`${file}: missing JSON meta comment on line 1`);
  const meta = JSON.parse(m[1]);
  src = src.slice(m[0].length).replace(/\{\{> ([\w-]+)\}\}\n?/g, (_, name) => read(`src/partials/${name}.html`));

  const url = SITE + (file === "index.html" ? "/" : `/${file}`);
  const out = layout
    .replace(/\{\{cur:([\w.-]+)\}\}/g, (_, href) => (href === meta.nav ? ' aria-current="page"' : ""))
    .replace("{{header_class}}", meta.header === "solid" ? "site-header--solid" : "")
    // 404 is served from any path, so it needs absolute asset URLs (<base>) and has no in-page skip target
    .replace("{{base}}", meta.base ? '  <base href="/">\n' : "")
    .replace("{{skip}}", meta.base ? "" : SKIP)
    .replace("{{head_extra}}", meta.head ? read(`src/partials/${meta.head}.html`) : "")
    .replaceAll("{{site}}", SITE)
    .replaceAll("{{url}}", url)
    .replace("{{wa}}", meta.whatsapp ? WA : "")
    .replaceAll("{{title}}", meta.title)
    .replaceAll("{{desc}}", meta.desc)
    .replace("{{content}}", () => src.trimEnd());

  writeFileSync(join(root, file), out);
  if (meta.sitemap !== false) sitemap.push(url);
  console.log("built", file);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemap.sort().map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>\n`).join("") +
    `</urlset>\n`
);
console.log("built sitemap.xml");
