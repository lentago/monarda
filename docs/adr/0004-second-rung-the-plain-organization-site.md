# ADR-0004: A second rung, the plain organization site; the campaign page stays rung 1

**Status:** Accepted (2026-10-12)

## Context

monarda has been one page by design: a campaign site with a hero, a story, a
donate section pointing at the processor's hosted page, and a contact section,
driven by one config file. That scope kept the kit small enough to be adoptable
from the repository alone, and on 2026-10-12 it was timed for the first time:
three minutes and one second from "Use this template" to a live site
([receipt](../../receipts/2026-10-12-agent-run.md)).

Three of the five adoption stories in `lentago/lupinus` lean on monarda, and
two of them (the pantry and the community theatre) are really asking for the
organization's whole site, not a campaign: a handful of pages that say who the
organization is, what it does, when things happen, how to give, and how to
reach it. Most small organizations have such a site already, on WordPress,
Squarespace, Wix, or a builder subscription, and the stories' exit from those
only works if there is a page set to land on. The 2026-10-12 offerings
research found that only WordPress and Squarespace export structure (both
convert to Markdown in hours), that Wix exports no site at all, and that menus,
forms, and donation widgets are lost in every path. The maintainer decided the
same day to add the rung.

## Decision

1. **Rung 2 is the plain organization site:** home, about, programs, events,
   donate, contact. A handful of pages, no more by default.
2. **Rung 1 is unchanged.** The one-page campaign site stays the first kit, the
   timed one, and the one `lentago/lupinus` points first-time adopters at. Rung 2
   is reached from it, the way uvularia's ladder adds a rung at a time.
3. **Same bones.** Rung 2 keeps the one-config-file shape (extending the existing
   config or a sibling `site.config.ts`), the processor-hosted donate flow
   ([ADR-0002](0002-processor-hosted-payments-only.md)), the Pages-default and
   S3-opt-in deploy ([ADR-0003](0003-pages-default-s3-opt-in.md)), the build
   check, and the accessibility gate on **every** page.
4. **Content is Markdown pages**, so a rescue import has a target. The import is
   a runbook plus a script for WordPress and Squarespace exports, with an
   explicit list of what each path loses, and a Wayback rescue as the last
   resort when the organization has lost access to its own site.
5. **Still not a CMS.** The kit ships no admin interface and no server. Editing
   without git is an optional layer the runbook documents, a git-backed editor
   such as Sveltia CMS or Pages CMS in front of the organization's own
   repository, never something Lentago hosts ([ADR-0001](0001-client-owned-delivery.md)).
6. **Rung 2 gets its own timed drill and receipt**, recorded separately so the
   rung-1 number stays honest.

## Alternatives

- **Stay one page.** Rejected: the stories show the demand, and a campaign page
  without an organization site behind it leaves the builder subscription in
  place.
- **A separate kit for the organization site.** Rejected for now: one template
  with rungs mirrors the ladder the fleet already uses, shares the deploy and
  accessibility machinery, and keeps the first-time path to one repository.
  Revisit if the two page sets diverge.
- **Build an editing interface into the kit.** Rejected: ADR-0007 asks for kits
  that are boring-simple to operate with no server to run; a hosted editor is a
  dependency the organization would have to leave.

## Consequences

- The scope statements in `README.md` and `ADOPTION.md` change from "one page"
  to "one page on rung 1; a handful on rung 2".
- Issue #18 becomes the rung-2 epic with three pieces: the page set, the rescue
  import, and editing without git. `DRY-RUN.md` gains a rung-2 drill.
- The lupinus picker row for monarda is updated when rung 2 has a receipt, not
  before.
- The accessibility-by-default kit (lentago/.github#247) applies to every page of
  rung 2 from the first build.
