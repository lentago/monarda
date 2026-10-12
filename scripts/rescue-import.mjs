#!/usr/bin/env node
// -----------------------------------------------------------------------------
// npm run rescue-import -- <export.xml> — turn a WordPress or Squarespace export
// into rung-2 pages.
//
//   npm run rescue-import -- export.xml
//   npm run rescue-import -- export.xml --images-from ./old-site-copy
//   npm run rescue-import -- export.xml --dry-run
//
// Reads a WordPress export (WXR) file, which Squarespace's "WordPress" export
// also is. Writes one Markdown file per published page into ./content, with the
// front matter src/content.config.ts expects; downloads the images and
// documents those pages use into ./public/images and ./public/files; then
// prints what the export could not carry over, with the kit's replacement for
// each. The runbook is docs/rescue-import.md.
//
// The only network traffic is fetching the images and documents your pages
// link to (usually the old site, but a link can point anywhere), and only when
// you run this. It sends no site content anywhere.
// -----------------------------------------------------------------------------
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import TurndownService from "turndown";
import { parseStringPromise } from "xml2js";

const root = fileURLToPath(new URL("..", import.meta.url));

const USAGE = `Usage: npm run rescue-import -- <export.xml> [options]

  --content <dir>       where the pages go            (default: content)
  --images <dir>        where images go               (default: public/images)
  --files <dir>         where documents go            (default: public/files)
  --images-from <dir>   read images and documents from a folder holding a copy
                        of the old site (its paths mirror the old URLs) instead
                        of downloading them
  --no-images           skip every download; image links keep pointing at the
                        old site
  --map <old=new>       import the page with old slug as content/<new>.md
                        (repeatable)
  --force               overwrite pages you have already edited (the default
                        overwrites only the kit's "Replace this" placeholders)
  --dry-run             convert and report, but write nothing
  --report <file>       also save the loss list to a file
`;

// What each of the kit's six pages might be called on the old site.
const KIT_PAGES = {
  home: ["home", "front-page", "welcome", "homepage", "index"],
  about: ["about", "about-us", "our-story", "who-we-are", "our-mission", "mission"],
  programs: ["programs", "our-programs", "what-we-do", "services", "our-work", "projects"],
  events: ["events", "calendar", "upcoming-events", "event-calendar"],
  donate: ["donate", "give", "giving", "support", "support-us", "donations", "ways-to-give"],
  contact: ["contact", "contact-us", "get-in-touch", "reach-us"],
};
const KIT_ORDER = ["home", "about", "programs", "events", "donate", "contact"];
const RESERVED = new Set(["readme", "campaign"]);

// Anything matching these is a form, a donation widget, or a page builder.
const FORM_CODES = /^(contact-form-7|wpforms?|gravityforms?|ninja_form|formidable|forminator|fluentform|caldera_form|mc4wp_form|mailpoet_form|jetpack-contact-form|contact-form|everest_form|wpcf7)$/;
const DONATE_CODES = /^(give_|donat|charitable|wpedon|givewp|seamless|zeffy|givebutter)/;
const BUILDER_CODES = /^(et_pb_|vc_|fusion_|av_|fl_|nectar|ultimate_|tm_pb|us_|tcb|elementor)/;
const DONATE_HOSTS = /donorbox|givebutter|zeffy|paypal|givelively|classy\.org|networkforgood|actblue|gofundme|justgiving|bloomerang|qgiv|donately|stripe\.com|everyaction|neonone|virtuous|fundraiseup|buymeacoffee|ko-fi/i;
const FORM_HOSTS = /docs\.google\.com\/forms|forms\.gle|typeform|jotform|tally\.so|airtable\.com\/embed|wufoo|formstack|hsforms|hubspot|mailchimp|list-manage|eocampaign|constantcontact/i;
const VIDEO_HOSTS = /youtube(-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\//i;
const BUILDER_CLASS = /\b(elementor-|et_pb_|vc_row|vc_column|fl-row|fl-col|wpb_|fusion-builder|sqs-block|sqs-layout)/;
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|csv|txt|ics|zip)$/i;
const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
const BLOCK_START = /^<(h[1-6]|ul|ol|table|div|figure|blockquote|p|pre|hr|iframe|form|section|aside|script)\b/i;

// ---------------------------------------------------------------- small helpers

const arr = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const text = (v) => (typeof v === "string" ? v : v && typeof v === "object" ? (v._ ?? "") : "");
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
const yaml = (s) => JSON.stringify(s); // a JSON string is a valid YAML string
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
const plain = (html) => decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

// WordPress stores paragraphs as blank-line-separated text and adds the <p>
// tags when it renders. Do the same, so the converter sees paragraphs.
function autop(html) {
  return html
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => (BLOCK_START.test(chunk) ? chunk : `<p>${chunk.replace(/\n/g, "<br>")}</p>`))
    .join("\n\n");
}

// ------------------------------------------------------------------- the import

async function main() {
  let args;
  try {
    args = parseArgs({
      allowPositionals: true,
      options: {
        content: { type: "string", default: "content" },
        images: { type: "string", default: "public/images" },
        files: { type: "string", default: "public/files" },
        "images-from": { type: "string" },
        "no-images": { type: "boolean", default: false },
        map: { type: "string", multiple: true, default: [] },
        force: { type: "boolean", default: false },
        "dry-run": { type: "boolean", default: false },
        report: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
    });
  } catch (e) {
    console.error(`rescue-import: ${e.message}\n\n${USAGE}`);
    process.exit(2);
  }
  const { values: opt, positionals } = args;
  if (opt.help || positionals.length !== 1) {
    console.log(USAGE);
    process.exit(opt.help ? 0 : 2);
  }

  const started = Date.now();
  const rel = (p) => resolve(root, p);
  const contentDir = rel(opt.content);
  const imagesDir = rel(opt.images);
  const filesDir = rel(opt.files);
  const publicPath = (dir) => "/" + dir.slice(rel("public").length + 1).replaceAll("\\", "/");

  let xml;
  try {
    xml = readFileSync(resolve(positionals[0]), "utf8");
  } catch (e) {
    console.error(`rescue-import: cannot read ${positionals[0]}: ${e.message}`);
    process.exit(2);
  }
  let doc;
  try {
    doc = await parseStringPromise(xml, { explicitArray: false, trim: true });
  } catch (e) {
    console.error(`rescue-import: ${positionals[0]} is not valid XML: ${e.message}`);
    process.exit(2);
  }
  const channel = doc?.rss?.channel;
  if (!channel) {
    console.error(
      "rescue-import: this does not look like a WordPress export (no <rss><channel>). " +
        "Squarespace: use its WordPress-format export.",
    );
    process.exit(2);
  }

  const siteBase = text(channel["wp:base_site_url"]) || text(channel.link) || "https://old-site.invalid";
  const siteHost = host(siteBase);
  const items = arr(channel.item).map((it) => ({
    raw: it,
    id: text(it["wp:post_id"]),
    type: text(it["wp:post_type"]),
    status: text(it["wp:status"]),
    slug: text(it["wp:post_name"]),
    title: text(it.title),
    html: text(it["content:encoded"]),
    excerpt: text(it["excerpt:encoded"]),
    menuOrder: Number(text(it["wp:menu_order"])) || 0,
    meta: Object.fromEntries(
      arr(it["wp:postmeta"]).map((m) => [text(m["wp:meta_key"]), text(m["wp:meta_value"])]),
    ),
    menuName: arr(it.category).find((c) => c?.$?.domain === "nav_menu")?.$?.nicename,
  }));

  // ---- what the export holds, and which pages we keep
  const published = items.filter((i) => i.type === "page" && i.status === "publish");
  const skipped = {
    drafts: items.filter((i) => i.type === "page" && i.status !== "publish"),
    posts: items.filter((i) => i.type === "post" && i.status === "publish"),
    other: {},
  };
  for (const i of items) {
    if (["page", "post", "nav_menu_item", "attachment", "wp_global_styles"].includes(i.type)) continue;
    if (i.type) skipped.other[i.type] = (skipped.other[i.type] ?? 0) + 1;
  }

  // ---- names: which export page becomes which file
  const userMap = Object.fromEntries(
    opt.map.map((m) => {
      const [from, to] = m.split("=");
      return [from, slugify(to ?? "")];
    }),
  );
  const claimed = new Map(); // kit slug -> item
  const fileFor = new Map(); // item id -> file slug
  const notes = [];
  for (const p of published) {
    const candidates = [p.slug, slugify(p.title)].filter(Boolean);
    let target = candidates.map((c) => userMap[c]).find(Boolean);
    target ??= KIT_ORDER.find((k) => candidates.some((c) => KIT_PAGES[k].includes(c)));
    target ??= slugify(p.slug || p.title) || `page-${p.id}`;
    if (RESERVED.has(target)) target = `${target}-page`;
    if (claimed.has(target)) {
      let alt = `${target}-${p.id}`;
      for (let n = 2; claimed.has(alt); n++) alt = `${target}-${p.id}-${n}`;
      notes.push(`Two pages wanted content/${target}.md; "${p.title}" became content/${alt}.md.`);
      target = alt;
    }
    claimed.set(target, p);
    fileFor.set(p.id, target);
  }
  // Pages by old address, so links between pages can be rewritten.
  const pathToSlug = new Map();
  for (const p of published) {
    const link = text(p.raw.link);
    const paths = [link && new URL(link, siteBase).pathname, `/${p.slug}/`, `/?page_id=${p.id}`];
    for (const path of paths.filter(Boolean)) {
      pathToSlug.set(path.replace(/\/+$/, "") || "/", fileFor.get(p.id));
    }
  }
  const frontPage = [...claimed.entries()].find(([k]) => k === "home");
  if (frontPage) pathToSlug.set("/", "home");

  // ---- the old menu
  const menuItems = items.filter((i) => i.type === "nav_menu_item" && i.status === "publish");
  const menus = {};
  for (const m of menuItems) (menus[m.menuName ?? "menu"] ??= []).push(m);
  const mappedCount = (list) => list.filter((m) => fileFor.has(m.meta._menu_item_object_id)).length;
  const mainMenuName = Object.keys(menus).sort((a, b) => mappedCount(menus[b]) - mappedCount(menus[a]))[0];
  const mainMenu = (menus[mainMenuName] ?? []).sort((a, b) => a.menuOrder - b.menuOrder);
  const menuLabel = new Map();
  const menuRank = new Map();
  const menuLeftovers = [];
  let rank = 0;
  for (const m of mainMenu) {
    const target = m.meta._menu_item_object_id;
    const label = m.title || text(m.raw.title);
    if (m.meta._menu_item_type === "post_type" && fileFor.has(target) && !menuRank.has(target)) {
      menuRank.set(target, ++rank);
      menuLabel.set(target, label);
    } else {
      menuLeftovers.push({ label, url: m.meta._menu_item_url ?? "" });
    }
  }
  const nested = mainMenu.filter((m) => (m.meta._menu_item_menu_item_parent ?? "0") !== "0").length;

  // ---- assets (images and documents), planned while converting
  const assets = new Map(); // absolute URL -> { kind, name, candidates, status }
  const usedNames = new Set();
  const planAsset = (url, kind) => {
    if (assets.has(url)) return assets.get(url);
    const original = new URL(url).href;
    // WordPress saves resized copies as name-300x200.jpg; the original is name.jpg.
    const stripped = kind === "image" ? original.replace(/-\d+x\d+(\.[A-Za-z]+)(\?|$)/, "$1$2") : original;
    const u = new URL(stripped);
    let name = slugify(decodeURIComponent(basename(u.pathname, extname(u.pathname)))) || "file";
    const ext = extname(u.pathname).toLowerCase();
    let full = name + ext;
    for (let n = 2; usedNames.has(kind + full); n++) full = `${name}-${n}${ext}`;
    usedNames.add(kind + full);
    const a = {
      kind,
      name: full,
      candidates: stripped === original ? [original] : [stripped, original],
      status: "pending",
      pages: new Set(),
    };
    assets.set(url, a);
    return a;
  };

  // ---- convert each page
  const loss = {
    forms: [], // { page, what }
    donate: [],
    shortcodes: [],
    builders: [],
    embeds: [],
    scripts: [],
    tables: [],
    noAlt: [],
    oldLinks: new Map(), // url -> pages
  };
  const converted = [];

  for (const p of published) {
    const slug = fileFor.get(p.id);
    const where = `${slug}.md`;
    let html = p.html.replace(/<!--[\s\S]*?-->/g, "");

    if (BUILDER_CLASS.test(html)) loss.builders.push({ page: where, what: "layout wrapper markup" });

    // Shortcodes: [name attrs] and [/name]. Keep the words inside, drop the tag.
    const shortcodes = new Set();
    html = html.replace(/\[(\/?)([A-Za-z][\w-]*)((?:\s[^\[\]]*)?)\]/g, (all, close, name) => {
      if (name === "caption") return "";
      if (FORM_CODES.test(name)) return (close || loss.forms.push({ page: where, what: `[${name}]` }), "");
      if (DONATE_CODES.test(name)) return (close || loss.donate.push({ page: where, what: `[${name}]` }), "");
      if (BUILDER_CODES.test(name)) return (close || shortcodes.add(`builder:${name}`), "");
      if (!close) shortcodes.add(name);
      return "";
    });
    for (const s of shortcodes) {
      if (s.startsWith("builder:")) {
        if (!loss.builders.some((b) => b.page === where && b.what.includes("shortcodes"))) {
          loss.builders.push({ page: where, what: "builder shortcodes (text kept, layout dropped)" });
        }
      } else loss.shortcodes.push({ page: where, what: `[${s}]` });
    }

    html = autop(html);

    // A page that opens with its own h1 gets that as its title.
    let title = p.title || p.slug;
    const lead = html.match(/^\s*(?:<[^>]+>\s*)*?<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    let titleFromBody = false;
    if (lead && !/<(p|ul|ol|table)\b/i.test(lead[0])) {
      const t = plain(lead[1]);
      if (t) {
        title = t;
        titleFromBody = true;
        html = html.replace(lead[0], "");
      }
    }

    // Heading levels, after the title h1 is gone: the page title is the h1, so
    // the top remaining heading becomes h2.
    const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
    const shift = levels.length ? 2 - Math.min(...levels) : 0;

    const td = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "_",
    });
    td.addRule("heading", {
      filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
      replacement(content, node) {
        const t = content.replace(/\s+/g, " ").trim();
        if (!t) return "";
        const level = Math.min(6, Math.max(2, Number(node.nodeName[1]) + shift));
        return `\n\n${"#".repeat(level)} ${t}\n\n`;
      },
    });
    td.addRule("image", {
      filter: "img",
      replacement(_c, node) {
        const raw = node.getAttribute("src") || node.getAttribute("data-src") || "";
        if (!raw || raw.startsWith("data:")) return "";
        let abs;
        try {
          abs = new URL(raw, siteBase).href;
        } catch {
          return "";
        }
        const alt = (node.getAttribute("alt") ?? "").replace(/[\[\]\n]+/g, " ").trim();
        if (!alt) loss.noAlt.push(where);
        const a = planAsset(abs, "image");
        a.pages.add(where);
        return `![${alt}](@@${abs}@@)`;
      },
    });
    td.addRule("link", {
      filter: (node) => node.nodeName === "A" && node.getAttribute("href"),
      replacement(content, node) {
        const href = node.getAttribute("href").trim();
        const label = content.trim();
        // An image wrapped in a link to its own full-size file: keep the image.
        if (label.startsWith("![") && IMG_EXT.test(href.split(/[?#]/)[0])) return label;
        if (!label) return "";
        const safe = (u) => u.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");
        if (/^(mailto:|tel:|#)/i.test(href)) return `[${label}](${safe(href)})`;
        let u;
        try {
          u = new URL(href, siteBase);
        } catch {
          return label;
        }
        if (host(u.href) !== siteHost) return `[${label}](${safe(u.href)})`;
        const page = pathToSlug.get(u.pathname.replace(/\/+$/, "") || "/");
        if (page) return `[${label}](${page === "home" ? "/" : `/${page}/`}${u.hash})`;
        if (DOC_EXT.test(u.pathname) || /\/wp-content\/uploads\//.test(u.pathname)) {
          const a = planAsset(u.href.split("#")[0], IMG_EXT.test(u.pathname) ? "image" : "file");
          a.pages.add(where);
          return `[${label}](@@${a.candidates.at(-1)}@@)`;
        }
        loss.oldLinks.set(u.href, [...(loss.oldLinks.get(u.href) ?? []), where]);
        return `[${label}](${safe(u.href)})`;
      },
    });
    td.addRule("iframe", {
      filter: "iframe",
      replacement(_c, node) {
        const src = node.getAttribute("src") || node.getAttribute("data-src") || "";
        if (DONATE_HOSTS.test(src)) loss.donate.push({ page: where, what: `embedded widget from ${host(src)}` });
        else if (FORM_HOSTS.test(src)) loss.forms.push({ page: where, what: `embedded form from ${host(src)}` });
        else if (VIDEO_HOSTS.test(src)) {
          const id = src.match(/(?:embed|video)\/([\w-]+)/)?.[1];
          const url = src.includes("vimeo") ? `https://vimeo.com/${id}` : `https://www.youtube.com/watch?v=${id}`;
          loss.embeds.push({ page: where, what: `video from ${host(src)} (kept as a link)` });
          return `\n\n[Watch the video](${url})\n\n`;
        } else loss.embeds.push({ page: where, what: `embed from ${host(src) || "an unknown host"}` });
        return "";
      },
    });
    td.addRule("form", {
      filter: "form",
      replacement() {
        loss.forms.push({ page: where, what: "an HTML form" });
        return "";
      },
    });
    td.addRule("script", {
      filter: ["script", "style", "noscript"],
      replacement(_c, node) {
        const src = node.getAttribute?.("src") ?? "";
        const body = node.textContent ?? "";
        if (DONATE_HOSTS.test(src + body)) loss.donate.push({ page: where, what: `donation script ${host(src) || ""}`.trim() });
        else if (node.nodeName === "SCRIPT") loss.scripts.push({ page: where, what: src ? `script from ${host(src)}` : "an inline script" });
        return "";
      },
    });
    td.addRule("table", {
      filter: "table",
      replacement(_c, node) {
        const trs = Array.from(node.getElementsByTagName("tr"));
        const rows = trs.map((tr) => Array.from(tr.childNodes).filter((c) => /^(TD|TH)$/.test(c.nodeName)));
        if (!rows.length) return "";
        const cells = rows.flat();
        if (cells.some((c) => c.getAttribute("colspan") > 1 || c.getAttribute("rowspan") > 1)) loss.tables.push({ page: where, what: "merged table cells (flattened)" });
        const width = Math.max(...rows.map((r) => r.length));
        const cell = (c) =>
          (c ? td.turndown(c.innerHTML) : "").replace(/\s*\n+\s*/g, " ").replace(/\|/g, "\\|").trim();
        const line = (r) => `| ${Array.from({ length: width }, (_, i) => cell(r[i])).join(" | ")} |`;
        const sep = `| ${Array.from({ length: width }, () => "---").join(" | ")} |`;
        return `\n\n${[line(rows[0]), sep, ...rows.slice(1).map(line)].join("\n")}\n\n`;
      },
    });

    let body = td.turndown(html).replace(/ /g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (!body) body = "";

    const excerpt = plain(p.excerpt).slice(0, 240);
    converted.push({ p, slug, title, titleFromBody, body, excerpt });
  }

  // ---- fetch images and documents while the old site is still up
  const fromDir = opt["images-from"] && resolve(opt["images-from"]);
  const fetchOne = async (a) => {
    for (const url of a.candidates) {
      try {
        if (fromDir) {
          const path = decodeURIComponent(new URL(url).pathname);
          const hit = [join(fromDir, path), join(fromDir, basename(path))].find((f) => existsSync(f));
          if (hit) return { url, data: readFileSync(hit) };
          continue;
        }
        const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000) });
        if (!res.ok) continue;
        const type = res.headers.get("content-type") ?? "";
        if (a.kind === "image" && !type.startsWith("image/")) continue;
        return { url, data: Buffer.from(await res.arrayBuffer()), type };
      } catch {
        // try the next candidate
      }
    }
    return null;
  };
  const jobs = [...assets.values()];
  if (!opt["no-images"]) {
    let next = 0;
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (next < jobs.length) {
          const a = jobs[next++];
          const got = await fetchOne(a);
          if (!got) {
            a.status = "failed";
            continue;
          }
          if (!extname(a.name)) {
            const e = { "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp", "image/svg+xml": ".svg" }[got.type?.split(";")[0]];
            if (e) a.name += e;
          }
          a.data = got.data;
          a.status = "ok";
        }
      }),
    );
  }
  const finalUrl = (original) => {
    const a = assets.get(original) ?? [...assets.values()].find((x) => x.candidates.includes(original));
    if (!a) return original;
    if (a.status !== "ok") return original;
    return `${publicPath(a.kind === "image" ? imagesDir : filesDir)}/${a.name}`;
  };

  // ---- write
  const ranks = (c) => {
    if (menuRank.has(c.p.id)) return menuRank.get(c.p.id);
    const k = KIT_ORDER.indexOf(c.slug);
    return k >= 0 ? k + 1 : 100;
  };
  const written = [];
  const kept = [];
  for (const c of converted) {
    const file = join(contentDir, `${c.slug}.md`);
    const label = menuLabel.get(c.p.id);
    const fm = ["---", `title: ${yaml(c.title)}`];
    if (c.excerpt) fm.push(`description: ${yaml(c.excerpt)}`);
    if (label && label !== c.title) fm.push(`nav: ${yaml(label)}`);
    fm.push(`order: ${ranks(c)}`, "---");
    const body = c.body.replace(/\]\(@@(.+?)@@\)/g, (_m, u) => `](${finalUrl(u)})`);
    if (
      !opt.force &&
      existsSync(file) &&
      !/Replace this/.test(readFileSync(file, "utf8"))
    ) {
      kept.push(`${c.slug}.md`);
      continue;
    }
    written.push({ file, slug: c.slug, text: `${fm.join("\n")}\n\n${body}\n`, from: c.p.title, empty: !body });
  }
  const placeholdersLeft = KIT_ORDER.filter(
    (k) => !claimed.has(k) && existsSync(join(contentDir, `${k}.md`)),
  );

  if (!opt["dry-run"]) {
    mkdirSync(contentDir, { recursive: true });
    for (const w of written) writeFileSync(w.file, w.text);
    for (const a of jobs.filter((x) => x.status === "ok")) {
      const dir = a.kind === "image" ? imagesDir : filesDir;
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, a.name), a.data);
    }
  }

  // ---- report
  const out = [];
  const say = (s = "") => out.push(s);
  const group = (list) => {
    const by = new Map();
    for (const l of list) by.set(l.what, [...(by.get(l.what) ?? []), l.page]);
    return [...by.entries()].map(([what, pages]) => `${what} on ${[...new Set(pages)].join(", ")}`);
  };
  const section = (name, list, replacement, none) => {
    say(`${name}`);
    if (!list.length) say(`  none found in this export.`);
    else for (const l of group(list)) say(`  - ${l}`);
    if (list.length || none) say(`  Replacement: ${replacement}`);
    say();
  };

  say(`rescue-import${opt["dry-run"] ? " (dry run, nothing written)" : ""}: ${text(channel.title) || "the export"}`);
  say();
  say("PAGES");
  for (const w of written) say(`  ${w.from} -> ${opt.content}/${w.slug}.md${w.empty ? "  (empty after conversion)" : ""}`);
  for (const k of kept) say(`  kept your edited ${opt.content}/${k} (use --force to overwrite)`);
  for (const k of placeholdersLeft) say(`  no page found for ${k}: ${opt.content}/${k}.md is still the kit's placeholder`);
  for (const n of notes) say(`  ${n}`);
  say();
  const okAssets = jobs.filter((a) => a.status === "ok");
  const failed = jobs.filter((a) => a.status === "failed");
  const imgs = jobs.filter((a) => a.kind === "image");
  say("IMAGES AND DOCUMENTS");
  if (opt["no-images"]) say(`  --no-images: ${jobs.length} image/document link(s) still point at the old site and will break when it goes.`);
  else {
    const verb = opt["dry-run"] ? "found (not saved)" : "saved";
    say(`  ${okAssets.filter((a) => a.kind === "image").length} of ${imgs.length} image(s) ${verb}, to ${opt.images}`);
    say(`  ${okAssets.filter((a) => a.kind === "file").length} of ${jobs.length - imgs.length} document(s) ${verb}, to ${opt.files}`);
    for (const a of failed) say(`  FAILED: ${a.candidates.at(-1)} (used on ${[...a.pages].join(", ")}); the link still points at the old site`);
  }
  const missingAlt = [...new Set(loss.noAlt)];
  if (missingAlt.length) say(`  Missing alt text (describe each image, or leave it for a decorative one): ${missingAlt.join(", ")}`);
  say();

  say("WHAT THIS IMPORT LOST, AND WHAT THE KIT USES INSTEAD");
  say();
  say("Menus");
  if (!mainMenu.length) say("  no menu in this export.");
  else {
    say(`  Old menu "${mainMenuName}": ${mainMenu.map((m) => m.title).join(", ")}.`);
    say(`  ${menuRank.size} entr${menuRank.size === 1 ? "y was a page" : "ies were pages"}: their order and labels became "order" and "nav" in the front matter.`);
    for (const m of menuLeftovers) say(`  - not a page: "${m.label}"${m.url ? ` (${m.url})` : ""}`);
    if (nested) say(`  - ${nested} dropdown entr${nested === 1 ? "y" : "ies"} flattened: the kit's menu has one level.`);
    if (Object.keys(menus).length > 1) say(`  - other menus not imported: ${Object.keys(menus).filter((n) => n !== mainMenuName).join(", ")}`);
  }
  say("  Replacement: the header menu is built from the pages in content/ (front matter \"nav\" and \"order\").");
  say("  Links that are not pages go in \"links\" in campaign.config.ts (shown in the footer), or in a page's text.");
  say();
  section("Forms", loss.forms, "a hosted form provider (Google Forms, Tally, Jotform); paste its embed into contact.formEmbedHtml in campaign.config.ts, or keep the email button.", true);
  section("Embedded donation widgets", loss.donate, "the processor-hosted donate section: set donate.embedHtml or donate.buttonUrl in campaign.config.ts; content/donate.md shows it under your words.", true);
  section("Shortcodes", loss.shortcodes, "write the content out as plain text in the page, or link to it; the shortcode's output (calendars, galleries, sliders) did not come with the export.", true);
  section("Page-builder markup", loss.builders, "the words came across as plain Markdown; rebuild any columns or buttons as headings, lists and links.", true);
  section("Other embeds (video, maps, widgets)", loss.embeds, "link to the video or map from the page's text.", false);
  section("Scripts", loss.scripts, "removed on purpose; the kit ships no required JavaScript and no trackers.", false);
  section("Tables", loss.tables, "check each table reads correctly.", false);

  say("Not in the export, never imported");
  if (skipped.posts.length) say(`  - ${skipped.posts.length} published blog post(s): ${skipped.posts.map((i) => `"${i.title}"`).join(", ")}. Rung 2 has no blog; fold the few that matter into events.md or programs.md.`);
  if (skipped.drafts.length) say(`  - ${skipped.drafts.length} unpublished page(s): ${skipped.drafts.map((i) => `"${i.title}"`).join(", ")}`);
  for (const [t, n] of Object.entries(skipped.other)) say(`  - ${n} item(s) of type "${t}" (events, products and the like)`);
  say("  - comments, users, categories, theme styling and plugin settings (the kit has its own look; see theme in campaign.config.ts)");
  say();

  if (loss.oldLinks.size) {
    say("Links to the old site that have no page on the new one (they still point at the old address):");
    for (const [url, pages] of [...loss.oldLinks].slice(0, 15)) say(`  - ${url} on ${[...new Set(pages)].join(", ")}`);
    say();
  }

  say(`Done in ${((Date.now() - started) / 1000).toFixed(1)} s. Next: search ${opt.content}/ for "Replace this", then SITE_RUNG=2 npm run build && npm run check.`);

  const reportText = out.join("\n");
  console.log(reportText);
  if (opt.report) writeFileSync(resolve(opt.report), reportText + "\n");
}

main().catch((e) => {
  console.error(`rescue-import: ${e.stack ?? e}`);
  process.exit(1);
});
