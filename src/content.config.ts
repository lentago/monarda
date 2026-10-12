// -----------------------------------------------------------------------------
// Rung 2's pages: every Markdown file in ./content (except its README) becomes
// one page, named after the file: about.md → /about/. home.md is the front page.
// The front matter fields each page may set are described below.
// -----------------------------------------------------------------------------
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const pages = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "./content" }),
  schema: z.object({
    /** The page's heading and browser-tab title. */
    title: z.string(),
    /** Search-result and link-preview summary. Defaults to the organization tagline. */
    description: z.string().optional(),
    /** Label in the header menu. Defaults to the title. */
    nav: z.string().optional(),
    /** Position in the header menu, lowest first. */
    order: z.number().default(100),
  }),
});

export const collections = { pages };
