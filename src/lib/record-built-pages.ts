// After every build, record which pages were built (and under which `base`)
// in node_modules/.astro/built-pages.json. `npm run a11y` (ci/a11y.mjs) reads this list, so
// the accessibility check covers every page with no URL list to maintain.
import { writeFile, mkdir } from "node:fs/promises";
import type { AstroIntegration } from "astro";

export function recordBuiltPages(): AstroIntegration {
  let base = "/";
  let dir: URL;
  return {
    name: "record-built-pages",
    hooks: {
      "astro:config:done": ({ config }) => {
        base = config.base;
        dir = new URL("node_modules/.astro/", config.root);
      },
      "astro:build:done": async ({ pages, logger }) => {
        const paths = pages.map((p) => p.pathname).sort();
        await mkdir(dir, { recursive: true });
        await writeFile(
          new URL("built-pages.json", dir),
          JSON.stringify({ base, pages: paths }, null, 2) + "\n",
        );
        logger.info(`recorded ${paths.length} page(s) for the accessibility check`);
      },
    },
  };
}
