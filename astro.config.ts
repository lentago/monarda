import { defineConfig } from "astro/config";
import campaign from "./campaign.config";

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
  },
});
