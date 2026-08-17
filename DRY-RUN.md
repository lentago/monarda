# Dry-run runbook — filled intake to live site

A timed drill. The goal: starting from a completed [`INTAKE.md`](INTAKE.md), get
a real campaign site live **on the client's own account** with every check green.
The receipt is the recorded time — fill in the table at the bottom.

Run this end to end at least once before a real engagement. It surfaces the slow
steps (DNS, the AWS OIDC role) while nothing is at stake.

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

## Notes

- **DNS and the AWS OIDC role are the usual bottlenecks.** Propagation and IAM
  trust policies take longest and are worth pre-staging on a real engagement.
- A `base` mismatch is the most common "why is my CSS missing" symptom — a
  project Pages site needs `base: "/<repo>/"`.
- Re-running the drill after any template change keeps the recorded time honest.
