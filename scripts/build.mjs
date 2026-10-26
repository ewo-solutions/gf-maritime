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

const WA = `  <a class="wa" href="https://wa.me/50767490031" target="_blank" rel="noopener" aria-label="Chat with GF Maritime on WhatsApp (opens in a new tab)"><img src="assets/icons/whatsapp.svg" alt="" width="27" height="27"></a>\n`;

const pages = readdirSync(join(root, "src/pages")).filter((f) => f.endsWith(".html"));

for (const file of pages) {
  let src = read(`src/pages/${file}`);
  const m = src.match(/^<!--(\{.*?\})-->\s*/s);
  if (!m) throw new Error(`${file}: missing JSON meta comment on line 1`);
  const meta = JSON.parse(m[1]);
  src = src.slice(m[0].length).replace(/\{\{> ([\w-]+)\}\}\n?/g, (_, name) => read(`src/partials/${name}.html`));

  const out = layout
    .replace(/\{\{cur:([\w.-]+)\}\}/g, (_, href) => (href === meta.nav ? ' aria-current="page"' : ""))
    .replace("{{header_class}}", meta.header === "solid" ? "site-header--solid" : "")
    .replace("{{head_extra}}", "")
    .replace("{{wa}}", meta.whatsapp ? WA : "")
    .replaceAll("{{title}}", meta.title)
    .replaceAll("{{desc}}", meta.desc)
    .replace("{{content}}", () => src.trimEnd());

  writeFileSync(join(root, file), out);
  console.log("built", file);
}
