# Campaign intake — one page

Fill this in once. Every answer maps to a field in `campaign.config.ts`, to a
one-time setup step, or (rung 2 only) to a page in `content/`. When this page is complete, a site can go live on your own
account in a single sitting — see [`DRY-RUN.md`](DRY-RUN.md).

Nothing here asks for card numbers, bank details, or donor data. Payments are
handled entirely by your chosen processor; this kit only links to or embeds
their hosted widget.

## 1. The campaign

| Question | Your answer | Maps to |
|---|---|---|
| Campaign name (as it should appear on the site) | | `name` |
| One-line tagline | | `tagline` |
| Fundraising goal (formatted, e.g. `$25,000`) | | `goal` |
| Amount raised so far, if you want a progress bar (optional) | | `raised` |
| Campaign deadline (e.g. `November 4, 2026`) | | `deadline` |
| Sub-headline below your campaign name — one or two sentences on what you're asking for | | `hero.subhead` |

## 2. The story

| Question | Your answer | Maps to |
|---|---|---|
| The story: who this helps, what the money does, what's at stake (a few short paragraphs) | | `story.blocks` |

## 3. Payments — your processor

You keep the money, and PCI compliance — the card industry's security rules —
stays with your payment processor; the site only points at their widget. Pick
one and get either an **embed snippet** or a **donate link** from your
processor account.

| Question | Your answer | Maps to |
|---|---|---|
| Processor (Givebutter / Zeffy / PayPal / Donorbox / other) | | `donate.processorName` |
| Do you already have an embed snippet (a block of HTML your processor gives you to paste in), a donate-page URL, or neither yet? | | `donate.embedHtml` / `donate.buttonUrl` |
| Paste the embed snippet **or** the donate URL here | | `donate.embedHtml` / `donate.buttonUrl` |

See the "Choosing a processor" section of [`README.md`](README.md) for what each
option looks like. All are free to start; none require a backend — a server of
your own.

## 4. Contact & volunteers (no backend)

| Question | Your answer | Maps to |
|---|---|---|
| Public contact / volunteer email address | | `contact.email` |
| Or: a hosted form embed (Google Forms / Tally / Jotform) — paste it | | `contact.formEmbedHtml` |

## 5. Look

| Question | Your answer | Maps to |
|---|---|---|
| Primary/brand color (hex, e.g. `#1b4b2e`) | | `theme.accent` |
| Footer small print (e.g. "Paid for by …") | | `footerNote` |
| Social / press links (label + URL, optional) | | `links` |

## 6. Where it lives — you own all of it

| Question | Your answer | Used for |
|---|---|---|
| Who owns the GitHub org/account this repo goes into? | | Hosting; branch = source of truth |
| Deploy target: **GitHub Pages** (free, default) or **S3 + CloudFront** (paid — Amazon's storage and content-delivery service)? | | Which deploy workflow |
| Custom domain? If yes, which one? | | `siteUrl`, `base`, DNS |
| If S3: which AWS account owns the bucket + who administers it? | | OIDC role, bucket |

> **Ownership.** The repository, the domain, the processor account, and (if used)
> the AWS account are all **yours**. This kit is delivered into your account and
> runs there. It is not hosted by, and does not depend on, the party who set it
> up for you.

## 7. Rung 2 — the organization site

**Skip this if** one campaign page is enough. Rung 2 turns the site into six
pages about your organization: home, about, programs, events, donate, and
contact. Each page is a short Markdown file in `content/`, plain text with a
few marks for headings and lists, so these answers can be as rough as notes.
If you have a website today, its pages are the quickest place to copy them
from.

| Question | Your answer | Maps to |
|---|---|---|
| Organization name, as it should appear at the top of every page | | `organization.name` |
| One line on who you are and who you serve | | `organization.tagline` |
| Keep the campaign as one of the pages? (yes / no) | | `organization.campaignPage` |
| Home: two or three sentences a first-time visitor should read | | `content/home.md` |
| About: how you started, who's involved, where to find you | | `content/about.md` |
| Programs: each program, who it serves, when it runs, how to take part | | `content/programs.md` |
| Events: upcoming dates, and anything that happens every week | | `content/events.md` |
| Donate: what a gift makes possible, in one or two concrete sentences | | `content/donate.md` |
| Contact: phone or mailing address if you want them shown, and how to volunteer | | `content/contact.md` |
| Any of about, programs, or events you don't need? | | Delete that file in `content/` |
