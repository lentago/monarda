import { defineConfig } from "astro/config";
import campaign from "./campaign.config";
import { rehypeBaseLinks } from "./src/lib/rehype-base-links";
import { recordBuiltPages } from "./src/lib/record-built-pages";

// Site URL and base path come from your campaign config, so you only ever edit
// one file. `site` powers canonical + social-share URLs; `base` is the sub-path
// the site is served from (see the note next to `base` in campaign.config.ts).
export default defineConfig({
  site: campaign.siteUrl,
  base: campaign.base,
  // Zero client-side JavaScript by default — Astro only ships JS for islands,
  // and this kit has none. That keeps the site fast and Lighthouse-friendly.
  build: {
    // Emit clean directory URLs (/story/ rather than /story.html).
    format: "directory",
    // Inline all CSS so each page is one request, as on the one-page site.
    inlineStylesheets: "always",
  },
  // Rung 2's Markdown pages: "/donate/" in a page becomes "<base>donate/".
  markdown: {
    rehypePlugins: [rehypeBaseLinks(campaign.base)],
  },
  // Writes the list of pages each build produced, so `npm run a11y` checks
  // every one of them without a hand-kept list.
  integrations: [recordBuiltPages()],
});
