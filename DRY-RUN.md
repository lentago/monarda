# Dry-run runbook — filled intake to live site

**What you're about to do:** starting from a completed [`INTAKE.md`](INTAKE.md),
take a real campaign site live — **on the client's own account** — with every
check along the way turning green. An optional second drill below switches
the site to rung 2, the plain organization site, and times it separately.

**Why bother:** running this once before a real engagement surfaces the slow
steps (DNS, the AWS OIDC role — the sign-in method the S3 deploy uses instead
of a stored password) while nothing is at stake. Find the stumble here, not in
front of the client.

**Time:** however long the drill takes you, start to finish — that's the
receipt. Fill in the table at the bottom when you're done.

## Before you start the clock

- [ ] `INTAKE.md` is completely filled in.
- [ ] You have write access to the **client's** GitHub org/account (not a Lentago
      one — this deploys to their account by design).
- [ ] Processor account exists and you have an embed snippet **or** a donate URL.
- [ ] If deploying to S3: you have access to the client's AWS account.
- [ ] Node 20+ and git installed locally.

## The drill

Start the clock. Record the elapsed time at each checkpoint.

| # | Step | Check it's green | ✅ |
|---|---|---|---|
| 1 | **Create the repo** from this template ("Use this template") into the client's account, and clone it. | `git clone` succeeds; repo is under the client org. | |
| 2 | **Edit `campaign.config.ts`** with the intake answers (name, tagline, goal, deadline, story, colors, links). | File saved; no TODO placeholders left. | |
| 3 | **Wire the donate widget** — paste the processor `embedHtml` or set `buttonUrl`. | Donate section no longer shows the "not configured" notice. | |
| 4 | **Wire contact** — set `contact.email` or paste `formEmbedHtml`. | Contact section renders. | |
| 5 | **Preview locally**: `npm install && npm run dev`, open the local URL. | Page loads; all four sections look right. | |
| 6 | **Build + a11y locally**: `npm run build` then `npm run check`. | Build completes; type check passes. | |
| 7 | **Set the deploy target.** Pages: Settings → Pages → Source = GitHub Actions. S3: fill the four `env:` placeholders in `deploy-s3.yml` and create the OIDC role. | Setting saved / placeholders filled. | |
| 8 | **Set `base`** in `campaign.config.ts` correctly for the target (`/` for custom domain or user site; `/<repo>/` for a project Pages site). | Matches the URL you expect. | |
| 9 | **Commit and push to `main`.** | `deploy-pages.yml` (or `deploy-s3.yml`) runs. | |
| 10 | **Watch the deploy** in the Actions tab. | Workflow is green. | |
| 11 | **Open the live URL.** | Site loads over HTTPS; content correct. | |
| 12 | **Click the donate button/widget.** | Lands on the processor's hosted page; a test donation can be made. | |
| 13 | **Test contact** (send the mailto / submit the form). | Email opens / form submits. | |
| 14 | **Custom domain (if any):** set DNS + confirm in the host. | Domain resolves to the site over HTTPS. | |
| 15 | **Accessibility + performance spot check:** run Lighthouse (or `npm run a11y` against the built site). | No serious a11y errors; performance is strong. | |

Stop the clock.

## Receipt

| Field | Value |
|---|---|
| Date of drill | |
| Operator | |
| Deploy target (Pages / S3) | |
| Custom domain? | |
| **Total elapsed time** | |
| All checks green? (Y/N) | |
| Slowest step (bottleneck) | |
| Notes / follow-ups | |

## Optional second drill — rung 2, the organization site

**Skip this if** the organization only needs the campaign page. Rung 2 turns
the site into six pages (home, about, programs, events, donate, contact), each
a Markdown file in [`content/`](content/README.md). Start a second clock; this
time is recorded separately so the rung-1 number stays honest.

**Before you start the second clock:**

- [ ] The rung-1 drill above is done: the site is live on the client's
      account, with donate and contact wired.
- [ ] Section 7 of [`INTAKE.md`](INTAKE.md) is filled in, with the words for
      each page.

| # | Step | Check it's green | Elapsed | ✅ |
|---|---|---|---|---|
| A | **Switch the rung on.** In `campaign.config.ts`, set `rung: 2` and fill in `organization` (name, tagline, and whether to keep the campaign page). | `npm run dev` shows the organization's home page with a menu of six pages, or seven with the campaign page. | | |
| B | **Fill the pages.** Put the intake answers into the files in `content/`. Delete any page the organization doesn't want, except `home.md`. | `grep -l "Replace this" content/*.md` lists only `content/README.md`. | | |
| C | **Build and check locally:** `npm run build`, `npm run check`, then `npm run a11y`. | The build lists every page; the type check reports 0 errors; the accessibility check lists every page with 0 errors. | | |
| D | **Deploy.** Commit and push to `main`, then watch the deploy workflow in the Actions tab. | Workflow is green. | | |
| E | **Open every page.** Visit the live URL and follow each link in the menu. On the donate page, click the donate button or widget. | Every page loads over HTTPS with the header, footer, and your content; donate reaches the processor's hosted page. | | |
| F | **Check accessibility on the live site:** `npm run a11y -- <live URL>`. | Every page is listed with 0 errors. | | |

Stop the second clock.

## Rung-2 receipt

| Field | Value |
|---|---|
| Date of drill | |
| Operator | |
| Deploy target (Pages / S3) | |
| Pages built | |
| **Total elapsed time, rung 2** | |
| All checks green? (Y/N) | |
| Slowest step (bottleneck) | |
| Notes / follow-ups | |

## Notes

> **Heads up.** DNS and the AWS OIDC role are the usual bottlenecks. DNS
> propagation and IAM trust policies both take longer than you'd expect —
> worth pre-staging before a real engagement.

> **Heads up.** A `base` mismatch is the most common cause of "why is my CSS
> missing." A project Pages site needs `base: "/<repo>/"`.

> **Heads up (rung 2).** Switching moves the campaign off the front page:
> the site's address now opens the organization's home page, and the campaign
> lives at `/campaign/`. Tell the client before step D if links to the
> campaign are already out in the world.

> **Heads up (rung 2).** In the Markdown pages, link to other pages as
> `/donate/` or `/events/`, with a slash at each end. The kit adds `base` for
> you, so the same link works on a project Pages site and a custom domain.

> **Heads up (rung 2, step F).** `npm run a11y` takes its page list from your
> last local `npm run build`. Build the same commit you pushed before checking
> the live site, or a page you added since won't be checked.

Re-running the drill after any template change keeps the recorded time honest.
The kit maintainers' runs are recorded under [`receipts/`](receipts/README.md);
the tables in this file ship blank so they are yours to fill.

## How you know it worked

Every row in the drill above is checked, the live URL loads over HTTPS with
your content in place, the donate button reaches the processor's page, and
contact works. That's what you're signing off on when you fill in the
[Receipt](#receipt). If you ran the second drill, every page in the menu loads
on the live site and passes the accessibility check; that's what the
[Rung-2 receipt](#rung-2-receipt) signs off on.
