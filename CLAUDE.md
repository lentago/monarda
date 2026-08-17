# CLAUDE.md — monarda

> Read [README.md](README.md) for the full project pitch. This file is
> operational notes for Claude: what the artifacts are, where outputs land, and
> the conventions to respect. Fleet-wide rules (PR workflow, attribution) live
> in `~/repos/CLAUDE.md` and should NOT be restated here — call out only this
> repo's deviations.

## Persona — introduce yourself

When Claude initializes in this directory, open the first response with a brief
self-introduction as **Monarda Claude** — steward of the Lentago Labs
campaign-site kit. One sentence is plenty; don't make a meal of it.

## What this repo is

monarda is a **GitHub template repo** (`is_template=true`): the campaign-site
kit. "Use this template" copies every file here verbatim into a **client's own**
new repo, so **every file must read correctly in the client's context** —
lentago attribution stays light and factual. The product is a minimal static
Astro site (no backend, no trackers, zero client JS) that a client configures by
editing one file and deploys to their **own** GitHub Pages or AWS account.
Build system: `npm` + Astro (`npm run build` → `dist/`); there is no server.

The bright line (delivery rule ADR-0007, fleet-wide): kits deploy into
**client-owned** repos/accounts, never Lentago-hosted. Payments and PCI stay
with the client's processor — this kit only links to or embeds a
processor-hosted widget and never touches card data.

## Artifacts / layout

| Path | Purpose |
|---|---|
| `campaign.config.ts` | The single file a client edits (name/goal/colors/donate/contact). |
| `src/config.ts` | Typed schema + docs for the config; rarely edited. |
| `src/` | Astro site: `layouts/Base.astro`, four section components, `styles/global.css`. |
| `.github/workflows/deploy-pages.yml` | Free GitHub Pages deploy (the default). |
| `.github/workflows/deploy-s3.yml` | Opt-in S3 + CloudFront deploy via OIDC — no static AWS keys. |
| `.github/workflows/build-check.yml` | PR gate: `astro check`, build, pa11y WCAG 2 AA. |
| `INTAKE.md` / `DRY-RUN.md` | Client questionnaire and the timed deploy drill. |
| `docs/adr/` | Architecture decision records. |

## Conventions to respect

- **One config file.** New site content should be config-driven through
  `campaign.config.ts` wherever reasonable — a client edits one file, not source.
- **Never handle payments or card data.** Donate is always a processor-hosted
  embed or link. Keep it that way.
- **No trackers, no web fonts, no required client JS.** System fonts, static
  output, Lighthouse-friendly. Preserve accessibility (semantic landmarks, skip
  link, visible focus, WCAG 2 AA — the pa11y gate must stay green).
- **SHA-pin every third-party action** with a trailing `# vX.Y.Z` version
  comment (see the deploy workflows). No long-lived AWS keys anywhere.
- **Write for the client.** Docs address the client (owner of everything) and the
  operator (who runs the dry-run); keep Lentago references factual and minimal.

## When in doubt

- Config field meanings: [`src/config.ts`](src/config.ts).
- How a client is meant to go live: [`DRY-RUN.md`](DRY-RUN.md).
- Why the design is the way it is (donate embed, client ownership):
  [`docs/adr/`](docs/adr/).
