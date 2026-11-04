# Adopting the monarda campaign-site kit

**What you're about to do:** set up your own fundraising campaign website — a
fast, static, accessible page you configure by editing one file — and deploy
it, with GitHub Actions, to your own GitHub Pages or AWS account.

**Why bother:** when you're done, you own everything — the repository, the
domain, the processor account, and (if you chose that path) the AWS account.
Nothing here is hosted by the party who set it up for you, so nobody else can
take it down or hold it for ransom.

**Time:** allow about an hour for the Pages path the first time. The one run
on record took three minutes and one second, for an operator who had the intake
answers ready and the tooling installed
([receipt](receipts/2026-10-12-agent-run.md)); the deploy workflow was the
slowest step at under a minute. See [Prerequisites](#prerequisites) for what
tends to be slow on a first run.

**Status of this runbook:** run once, 2026-10-12 — see [Receipt](#receipt)

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

## Rung 2: the plain organization site

**Skip this if** one campaign page is all you need. That page is rung 1, the
default; the kit comes in rungs, steps you take one at a time, and you can
climb to rung 2 whenever you're ready.

**What you get:** a home page plus about, programs, events, donate, and
contact pages, with the same header menu and footer on every page. You can
keep the campaign page as a seventh page at `/campaign/`. Each page is a
Markdown file in [`content/`](content/README.md), which is plain text with a
few marks for headings, lists, and links. The donate page uses the same
processor-hosted button or widget as rung 1, so card data still never touches
your site.

**What it costs:** the same as rung 1. $0 on GitHub Pages; on S3 +
CloudFront, AWS charges for a few more small files.

**How long:** the one rung-2 run on record took 5 min 03 s, for an operator
who had the words for each page ready before the clock started
([receipt](receipts/2026-11-04-agent-run-rung-2.md)). The Pages deploy was the
slowest step, at 3 min 34 s. Writing six short pages is the rest of the work,
so allow for it if the words aren't written yet. The
[rung-2 drill](DRY-RUN.md#optional-second-drill--rung-2-the-organization-site)
is timed on its own clock, apart from rung 1.

**How to switch:** set `rung: 2` in `campaign.config.ts`, fill in the
`organization` block next to it, then answer the rung-2 questions in
[`INTAKE.md`](INTAKE.md#7-rung-2--the-organization-site) and put the answers in
the files in `content/`.

**Already have a site?** The [rescue import](docs/rescue-import.md) moves a
WordPress or Squarespace export onto these pages, and its runbook covers Wix,
Weebly, Google Sites, and a site you've lost access to.

> **Heads up.** Switching moves the campaign off the front page. Links people
> already shared to your site's address now land on the organization's home
> page, and the campaign lives at `/campaign/`.

## What this is not

- **Not a payment processor.** The donate section links to or embeds your
  processor's hosted page. Card data, PCI scope, and the money stay with the
  processor — not with this site.
- **Not a CMS** (a content management system, like WordPress). There is no
  admin panel, no database, and no login. You edit `campaign.config.ts` (and,
  on rung 2, the Markdown files in `content/`) in the repository and push.
- **One page on rung 1; a handful on rung 2.** Rung 1 is a single campaign
  landing page. Rung 2 is six pages about your organization, per
  [ADR-0004](docs/adr/0004-second-rung-the-plain-organization-site.md). Neither
  is meant to grow into a big site.

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
- Run Lighthouse, or `npm run a11y -- <your live URL>` after a local
  `npm run build` of the same commit. That checks every page the build
  produced against the live site. No serious accessibility errors.

## Receipt

| Field | Value |
|---|---|
| Date | 2026-10-12 |
| Operator | agent run on the maintainer's personal account ([full receipt](receipts/2026-10-12-agent-run.md)) |
| Version tested | `dd03018` |
| Deploy target | GitHub Pages, project site, no custom domain |
| Total elapsed | 3 min 01 s |
| Slowest step | the Pages deploy workflow, 55 s |
| All checks green | Partly; no test donation was made (no processor sandbox), and the `mailto:` link was rendered, not clicked |
| Notes | Two defects filed: #19 (the first run is red before Pages is enabled) and #20 (`npm run a11y` against the live URL). The kit maintainers' runs are recorded under [`receipts/`](receipts/README.md); this table is yours to overwrite in your copy. |

## Getting later template changes

**What you're about to do:** let your copy receive the kit's later fixes (a
repaired workflow, a clearer guide, a new setting) as a pull request in your own
repository, which you review and merge like any other.

**Why bother:** a repository made with **Use this template** is a copy with no
link back to the template, so `git pull` can't bring later changes in. Without
this, your copy never hears about a fix. With it, a pull request shows up when
the template has changed, your checks run on it, and the diff shows every line.

**How long:** about three minutes, once.

**Skip this if** you would rather copy changes by hand. Nothing breaks if you
never set this up: the workflow opens an issue saying an update is waiting, and
stays green.

1. **Make a token.** A token is a password for one program, with only the
   powers you give it. On GitHub, open your picture → **Settings → Developer
   settings → Personal access tokens → Fine-grained tokens → Generate new
   token**. Set **Resource owner** to the account or organization that owns
   your site's repository, **Repository access** to *Only select repositories*
   and pick this one repository, and under **Repository permissions** set
   **Contents**, **Pull requests** and **Workflows** to *Read and write*. Pick
   an expiry date and put it in your calendar.
2. **Give it to the repository.** In the repository, **Settings → Secrets and
   variables → Actions → New repository secret**. Name it
   `TEMPLATE_UPDATE_TOKEN` and paste the token. GitHub never shows it again,
   and the workflow uses it only to push the update branch and open the pull
   request.
3. **Run it once.** **Actions → template-update → Run workflow**. After that it
   runs every Monday on its own.

> **Heads up.** An organization may need to allow fine-grained tokens, or
> approve this one, before it works. An organization owner does that under the
> organization's **Settings → Personal access tokens**. While the token is
> pending, the run fails with an error that names `TEMPLATE_UPDATE_TOKEN`.

**How you know it worked:** the run ends green, and either it says your copy is
already up to date or a pull request titled **Template update: …** is open, with
your checks running on it. Its description lists every file it changed and why.

**What the pull request changes.** For each file,
[`scripts/template-update.py`](scripts/template-update.py) compares three
versions: the template at your last update, the template now, and yours.

| If… | then |
| :-- | :-- |
| you never changed the file | it becomes the template's new version |
| the template didn't change it | yours stays exactly as it is |
| you both changed it, on different lines | the two are merged and both changes are kept |
| you both changed the same lines | both versions are left in the file between `<<<<<<<` and `>>>>>>>` markers, the pull request opens as a draft, and its description names the files. Keep what you want, delete the markers, and push to the pull request's branch |
| the template removed it | it is removed, unless you had changed it; then it stays and is listed |

`campaign.config.ts` is merged this way, on purpose. When the kit gains a
setting (rung 2 added `rung` and `organization`), the update brings the new
setting in and every value you filled in stays yours. A placeholder you never
replaced follows the template.

**What it never touches:** your pages in `content/`, your reviewers in
`.github/CODEOWNERS`, and `LICENSE`. Files you added yourself, such as images in
`public/`, aren't part of the template, so an update never touches them either.
The list is `keep` in [`.github/template-update.toml`](.github/template-update.toml).
That file is yours, and an update never changes it, so add a path when you've
made a template file your own.

> **Heads up.** While an update pull request is open, no new one opens. Closing
> one without merging means "not this one": that update isn't offered again,
> and the next change to the template opens a fresh pull request. Delete its
> `template-update/…` branch if you change your mind.

> **Heads up.** The usual conflict is a pinned action line in
> `.github/workflows/`: your copy's Dependabot bumped it, and the template
> bumped it to a different version. Keep the newer one.

**Made your copy before November 2026?** If it has no
`.github/workflows/template-update.yml`, it was made before the kit had one.
Copy three files from the template into it:
`.github/workflows/template-update.yml`, `scripts/template-update.py` and
`.github/template-update.toml`. Commit them, then follow the steps above.

- **Which template version did your copy start from?** You don't need to know.
  **Use this template** makes a first commit holding exactly the template's
  files, and the first run finds the template commit that matches it. To see
  it before you make a token, run `python3 scripts/template-update.py --dry-run`
  in a clean checkout (Python 3.11 or newer). It prints that commit, marked
  `inferred`, and every file it would change, and changes nothing.
- **Made it before rung 2?** If your copy has no `content/` folder, an update
  won't add one, because `content/` is on your keep list. Copy the folder in
  once, then commit it:
  `git fetch https://github.com/lentago/monarda.git main && git checkout FETCH_HEAD -- content/`.
  The update brings the rung-2 settings into `campaign.config.ts` as usual.
- **Already brought template changes in by hand?** Before the first run, write
  the template commit you caught up to into `.github/template-base`, on a line
  of its own, and commit it. The update then starts from that commit instead of
  the one your copy was made from.
- **Never want a token?** Run `python3 scripts/template-update.py` yourself. It
  stages the same update without committing anything. Check it with
  `git diff --cached`, then commit and push.

Why it works this way is recorded in
[ADR-0005](docs/adr/0005-template-updates-through-an-update-door.md).

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
- [ ] On rung 2: no page in `content/` still says "Replace this."
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
