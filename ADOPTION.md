# Adopting the monarda campaign-site kit

**What you're about to do:** set up your own fundraising campaign website — a
fast, static, accessible page you configure by editing one file — and deploy
it, with GitHub Actions, to your own GitHub Pages or AWS account.

**Why bother:** when you're done, you own everything — the repository, the
domain, the processor account, and (if you chose that path) the AWS account.
Nothing here is hosted by the party who set it up for you, so nobody else can
take it down or hold it for ransom.

**Time:** about an hour for the Pages path, often less — but nobody has
recorded a receipt yet, so treat that as a guess until the table at the bottom
says otherwise. See [Prerequisites](#prerequisites) for what tends to be slow.

**Status of this runbook:** never run — see [Receipt](#receipt)

## What you get

A single-page campaign site with four sections:

- **Hero** — campaign name, tagline, fundraising goal, deadline, and an optional
  progress bar.
- **Story** — your narrative, structured as however many blocks you need.
- **Donate** — a button or embed widget hosted by your payment processor. Card
  data never touches this site.
- **Contact / volunteer** — a `mailto:` button or a hosted form embed (Google
  Forms, Tally, Jotform, or similar).

The site is built as static HTML with system fonts and no client-side
JavaScript. It deploys via GitHub Actions and scores well on Lighthouse out of
the box.

| What | Who owns it |
|---|---|
| The GitHub repository | You |
| The live website and domain | You |
| Your payment processor account and the money | You |
| Your AWS account (S3 path only) | You |

## What this is not

- **Not a payment processor.** The donate section links to or embeds your
  processor's hosted page. Card data, PCI scope, and the money stay with the
  processor — not with this site.
- **Not a CMS.** There is no admin panel, no database, and no login. You edit
  `campaign.config.ts` in the repository and push.
- **Not multi-page.** This is a single campaign landing page.

## Prerequisites

**Accounts:**
- A GitHub account with permission to create repositories in your target org or
  personal account.
- A payment processor account (Givebutter, Zeffy, PayPal, Donorbox, or similar)
  with an embed snippet **or** a donate URL ready to paste.
- If deploying to S3 + CloudFront: access to an AWS account you control.

**Tools:** Node 20+ and git, installed locally.

**Access you must already have:** permission to enable GitHub Pages and GitHub
Actions in the target repository.

**Cost:** $0 for GitHub Pages. S3 + CloudFront costs money on AWS — typically
small for a campaign site, but check AWS pricing for S3 and CloudFront before
choosing that path.

**Time:** Allow a few hours end to end on the first run. DNS propagation and
setting up the AWS OIDC role (S3 path only — OIDC is the sign-in method that
lets GitHub Actions prove its identity to AWS without a stored password or
key) are the usual slow steps; see [DRY-RUN.md](DRY-RUN.md) for details.

## Intake

Complete [`INTAKE.md`](INTAKE.md). It is a one-page questionnaire — every
question maps directly to a field in `campaign.config.ts` or to a one-time setup
step. When `INTAKE.md` is fully filled in, the rest of the drill is mechanical.

## Swap list

`campaign.config.ts` ships with placeholder text in every field — each is
already labeled for replacement and self-explanatory. Two values warrant
explicit mention:

| Ours | Where it lives | Put yours here | Tracked |
|---|---|---|---|
| `#1b4b2e` (Lentago brand green) | `campaign.config.ts` → `theme.accent` | Your brand or campaign color (hex) | mechanical |
| `us-east-1` | `.github/workflows/deploy-s3.yml` → `AWS_REGION` (S3 path only) | Your S3 bucket's AWS region | mechanical |

> **Heads up.** The S3 deploy workflow ships deliberately disabled. Its trigger
> is `workflow_dispatch` only, until you fill in all four `env:` values in
> `deploy-s3.yml` (`AWS_REGION`, `AWS_ROLE_ARN`, `S3_BUCKET`,
> `CLOUDFRONT_DISTRIBUTION_ID`). The `REPLACE_ME` strings in that file make each
> placeholder unmistakable — if nothing deployed, check those first.

## The drill

The full 15-step drill — from a completed `INTAKE.md` to a live site on your
account — lives in [`DRY-RUN.md`](DRY-RUN.md). Follow it in order. Every step
has a check: something concrete you can confirm before moving to the next one.

> **Heads up.** If a check doesn't go green, stop right there. Every later step
> assumes the one before it worked. See [Troubleshooting](#troubleshooting)
> below for the common causes.

## Verify it works

- Open the live URL. The page loads over HTTPS with all four sections visible
  and your content in place (no placeholder text remaining).
- Click the donate button or widget. You reach your processor's hosted donation
  page.
- Test contact: click the email link or submit the volunteer form.
- Run Lighthouse or `npm run a11y` against the live URL. No serious
  accessibility errors.

## Receipt

| Field | Value |
|---|---|
| Date | |
| Operator | |
| Version tested | |
| Deploy target | |
| Total elapsed | |
| Slowest step | |
| All checks green | |
| Notes | |

## Teardown

To remove the site completely:

1. **Disable GitHub Pages:** in the repo, Settings → Pages → set Source to
   *None*. The site goes offline immediately.
2. **Remove custom domain (if any):** delete the DNS CNAME or ALIAS record at
   your registrar, then remove the domain from the Pages settings to release
   GitHub's hold on it.
3. **If S3 + CloudFront:** disable and delete the CloudFront distribution, then
   empty and delete the S3 bucket, then delete the OIDC IAM role from your AWS
   account. Check AWS Cost Explorer the next day to confirm charges have stopped.
4. **Unlink the processor campaign:** in your payment processor account,
   deactivate or archive the campaign page so it no longer accepts donations.
5. **Archive or delete the repository:** Settings → Danger Zone. Archive keeps
   history readable; delete removes it entirely.

## You are operationally ready when

- [ ] Every placeholder in `campaign.config.ts` has been replaced with your
      campaign's real content.
- [ ] The donate section reaches your processor's hosted page (tested with a
      real click).
- [ ] The live site loads over HTTPS on your Pages URL or custom domain.
- [ ] You have run [`DRY-RUN.md`](DRY-RUN.md) end to end and recorded the
      [Receipt](#receipt) — in both that file and this one.
- [ ] Someone other than the person who set it up can follow this document and
      reach the live site.

## Troubleshooting

**Symptom:** Site loads but CSS or assets are missing (broken layout, unstyled
page).
**Cause:** `base` mismatch. A GitHub Pages project site (`you.github.io/repo/`)
needs `base: "/repo/"` in `campaign.config.ts`; a custom domain or user/org site
needs `base: "/"`.
**Fix:** Set `base` to the correct value, commit, and push.

---

**Symptom:** `deploy-pages.yml` runs green but the site never appears (or keeps
serving the old version).
**Cause:** GitHub Pages source is not set to "GitHub Actions".
**Fix:** In the repo, Settings → Pages → Source → *GitHub Actions*. Then
re-run the workflow from the Actions tab.

---

**Symptom:** S3 deploy workflow fails with an authentication or credentials
error.
**Cause:** The OIDC IAM role's trust policy does not include this repository.
**Fix:** In AWS IAM, edit the role's trust policy to allow
`token.actions.githubusercontent.com` for your org and repository. The comment
block at the top of `.github/workflows/deploy-s3.yml` shows the exact trust
policy shape.

## Getting help

Open an issue on this repository. Include: the step you were on, the exact
command, the full output, and your platform. If a step was wrong, unclear, or
missing a prerequisite — that is the most valuable issue you can file.

---

**Runbook owner:** @cpitzi · **Last verified:** 2026-08-21
