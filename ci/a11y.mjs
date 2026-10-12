#!/usr/bin/env node
// -----------------------------------------------------------------------------
// npm run a11y — WCAG 2 AA check (pa11y-ci, axe + htmlcs) on every built page.
//
//   npm run build && npm run a11y              serves ./dist locally and checks it
//   npm run a11y -- https://you.github.io/repo/  checks the same pages, live
//
// The page list is the one the last `npm run build` recorded (see
// src/lib/record-built-pages.ts), so a new page is checked without anyone
// editing a list. Runner settings live in .pa11yci.json.
// -----------------------------------------------------------------------------
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const root = new URL("..", import.meta.url);
const PORT = Number(process.env.A11Y_PORT || 4321);

function fail(message) {
  console.error(`a11y: ${message}`);
  process.exit(2);
}

function binPath(pkg, bin) {
  const manifest = require.resolve(`${pkg}/package.json`);
  const entry = require(manifest).bin;
  return join(manifest, "..", typeof entry === "string" ? entry : entry[bin]);
}

let built;
try {
  built = JSON.parse(
    readFileSync(new URL("node_modules/.astro/built-pages.json", root), "utf8"),
  );
} catch {
  fail("no page list found. Run `npm run build` first.");
}
if (!built.pages.length) fail("the last build produced no pages.");

const liveUrl = process.argv[2];
let siteRoot;
let preview;

if (liveUrl) {
  siteRoot = liveUrl.endsWith("/") ? liveUrl : `${liveUrl}/`;
} else {
  siteRoot = `http://127.0.0.1:${PORT}${built.base.endsWith("/") ? built.base : `${built.base}/`}`;
  preview = spawn(
    process.execPath,
    [binPath("astro", "astro"), "preview", "--host", "127.0.0.1", "--port", String(PORT)],
    { cwd: root, stdio: "ignore" },
  );
  let exited = false;
  preview.on("exit", () => (exited = true));
  for (let i = 0; ; i++) {
    if (exited) fail(`the preview server stopped. Is port ${PORT} already in use?`);
    if (i >= 60) fail(`the preview server did not answer at ${siteRoot} within 30 s.`);
    try {
      if ((await fetch(siteRoot)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
}

const urls = built.pages.map((p) => new URL(p, siteRoot).href);
const { defaults } = JSON.parse(readFileSync(new URL(".pa11yci.json", root), "utf8"));
const configFile = join(mkdtempSync(join(tmpdir(), "a11y-")), "pa11yci.json");
writeFileSync(configFile, JSON.stringify({ defaults, urls }));

console.log(`Checking ${urls.length} page(s) against WCAG 2 AA:`);
const code = await new Promise((resolve) => {
  const run = spawn(process.execPath, [binPath("pa11y-ci", "pa11y-ci"), "--config", configFile], {
    cwd: root,
    stdio: "inherit",
  });
  run.on("exit", (c) => resolve(c ?? 1));
});
preview?.kill();

console.log(
  "\nAutomated checks find some accessibility problems, not all of them. " +
    "Tab through each page and try it with a screen reader too.",
);
process.exit(code);
