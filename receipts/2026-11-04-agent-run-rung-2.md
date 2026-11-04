# Dry-run receipt — 2026-11-04, agent run, rung 2

**What this is:** the first timed run of the second drill in
[`DRY-RUN.md`](../DRY-RUN.md) (rung 2, the organization site, steps A to F). It
ran against the copy the [rung-1 receipt](2026-10-12-agent-run.md) built, which
lives on an account outside the lentago organization. It is the receipt the
rung-2 epic ([#18](https://github.com/lentago/monarda/issues/18)) asked for,
tracked in [#39](https://github.com/lentago/monarda/issues/39).

| Field | Value |
|---|---|
| Date of drill | 2026-11-04 |
| Operator | an agent (Monarda Claude) driving the maintainer's personal GitHub account. The section 7 intake answers were prepared before the clock started |
| Template version | `lentago/monarda` at `0eb8d7b` (main, 2026-11-04) |
| Target repository | [cpitzi/pennywell-winter-shelves](https://github.com/cpitzi/pennywell-winter-shelves), the rung-1 drill copy, switched to rung 2 at commit [`9744e86`](https://github.com/cpitzi/pennywell-winter-shelves/commit/9744e86) |
| Deploy target | GitHub Pages (project site, `base: "/pennywell-winter-shelves/"`) |
| Pages built | 7: home, about, programs, events, donate, contact, and the campaign at `/campaign/` |
| **Total elapsed time, rung 2** | **5 min 03 s** |
| All checks green? | Yes, with two caveats on step E, recorded below |
| Slowest step | step D, the Pages deploy: 3 min 34 s from push to green. The workflow's deploy job alone took 2 min 37 s |
| Live URL | https://cpitzi.github.io/pennywell-winter-shelves/ |

The organization is the fictional Pennywell Street Pantry from the lupinus
adoption stories. The home page and the campaign page both say so, so nobody
mistakes a drill for a real pantry.

## Before the clock: bringing the copy up to the template

The copy was created from the template at `dd03018`, before rung 2 merged. It
had no `content/` folder and no `rung` setting, and the drill assumes both. So
the copy was first brought up to `0eb8d7b` and that work was timed on its own,
not on the drill clock. The template diff `dd03018..0eb8d7b` went in as one
patch (49 files, about 3,400 lines). `campaign.config.ts` was merged by hand so
it gained the `rung` and `organization` block and kept the drill's values. The
site stayed on rung 1.

| Checkpoint | Elapsed | Note |
|---|---|---|
| Start | 0:00 | |
| Template diff applied | 0:06 | |
| Built | 0:35 | |
| Committed, ready to push | 1:18 | commit [`3599d14`](https://github.com/cpitzi/pennywell-winter-shelves/commit/3599d14) |
| Push to deploy green | 2:15 more | the workflow ran 1 min 49 s. The push itself waited on a permission decision on the operator's side, which is not a kit step and is not counted |

After that deploy the live URL still served the rung-1 campaign page.

## Elapsed time per checkpoint

| Checkpoint | Elapsed | Step time | Note |
|---|---|---|---|
| Clock start | 0:00 | | section 7 answers prepared: the six page files, plus the organization name, tagline, and keeping the campaign page |
| A `rung: 2` and `organization` set; `npm run dev` shows the home page and its menu | 0:09 | 9 s | the menu had seven entries: Home, About, Programs, Events, Donate, Contact, Winter Shelves 2026. It was confirmed at 0:02; the checkpoint was stamped at 0:09, after the dev server was stopped |
| B the six pages filled from the intake | 0:17 | 8 s | `grep -l "Replace this" content/*.md` listed only `content/README.md`. No page was deleted |
| C `npm run build` | 0:30 | 13 s | 7 pages built |
| C `npm run check` | 0:33 | 3 s | 0 errors, 0 warnings, 0 hints |
| C `npm run a11y` | 0:45 | 12 s | 7 of 7 pages, WCAG 2 AA, **0 errors** |
| D commit | 0:53 | 8 s | |
| D push to `main` | 1:01 | 8 s | |
| D deploy workflow green | 4:35 | 3 min 34 s | the run took 3 min 14 s (build 22 s, deploy 2 min 37 s); the rest is the wait for the run to start |
| E every page in the menu, and the donate click-through | 4:46 | 11 s | all 7 pages returned 200 over HTTPS, each with the header, the footer, and its own heading. Donate reached `paypal.com/donate` |
| F `npm run a11y -- https://cpitzi.github.io/pennywell-winter-shelves/` | 5:03 | 17 s | 7 of 7 live pages, **0 errors** |

## Caveats on step E

- **Donate.** The button reached PayPal's hosted donate page. The drill's
  `donate.buttonUrl` is PayPal's general donate address, not a real pantry's
  button, and no test donation was made. This is the same open question the
  rung-1 receipt recorded, which
  [#17](https://github.com/lentago/monarda/issues/17) proposes to settle with
  per-processor sandbox walkthroughs.
- **Opening the pages.** The operator was headless. It fetched each menu link
  from the live home page over HTTPS and checked it for the header, the footer,
  and the page's own heading. Step F then rendered every page in a headless
  browser. A human run should click through the menu.

## What the drill found

- **A copy made before rung 2 can't run the rung-2 drill as written.** It has to
  take the template's later changes first, and the kit doesn't say how: "Use
  this template" leaves no git link back to the template. Filed as
  [#42](https://github.com/lentago/monarda/issues/42).
- **The Pages deploy is now the bottleneck, and it varies.** The whole rung-1
  deploy took 55 s on 2026-10-12. The catch-up deploy today took 1 min 49 s and
  the step-D deploy took 3 min 14 s, most of it in GitHub's own deploy job. The
  operator's part of rung 2 came to 1 min 01 s up to the push and 28 s of
  checks after the deploy.
- **Links between pages work on a project Pages site.** `home.md` links to
  `/programs/`, `/events/`, `/campaign/`, and `/donate/`. The live page renders
  them under `/pennywell-winter-shelves/`, and each one returns 200, as the
  runbook's heads-up says it should.
- **The front page moved.** The live URL now opens the organization's home page,
  and the campaign is at `/campaign/`. The [rung-1 receipt](2026-10-12-agent-run.md)
  carries a dated note saying so. The runbook warns about this before step D. No
  links to the drill's campaign page had gone out.

## Follow-ups

- Update the monarda row in lupinus `guide/tiers.md` to cite this receipt as
  evidence that the kit covers the plain organization site
  ([lupinus#39](https://github.com/lentago/lupinus/issues/39)).
- Document how a copy takes template updates
  ([#42](https://github.com/lentago/monarda/issues/42)).
- No human has yet run either drill cold, so the first-timer time is still
  unrecorded for both rungs.
- The drill repository stays up on rung 2 as the live artifact this receipt
  points at. Deleting it later does not change the numbers above.
