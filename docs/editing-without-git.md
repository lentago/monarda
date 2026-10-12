# Editing without git

**What you're about to do:** set up a browser-based editor so a volunteer can
change a page on your rung 2 site without learning git. They sign in, edit the
page in a form, press save, and the change arrives in your repository as a
pull request, which is a proposed change someone else reviews before it goes
live. You review it and merge it. The site rebuilds itself.

**Why bother:** the pages are Markdown files in [`content/`](../content/README.md),
and git is the part that stops most volunteers. The editor hides it. You still
get what git gives you: every change recorded, every change reviewed, and an
undo button.

**How long:** not timed yet. Fill in the [receipt](#receipt) the first time you
run through it, and the number becomes yours.

**Skip this if** the people who edit your pages are comfortable with GitHub, or
if one person does all the editing. Editing a file on github.com directly works
today and needs none of this. This page is for the volunteer who should never
have to see a branch.

> **Heads up.** The kit ships no admin screen and no server
> ([ADR-0004](adr/0004-second-rung-the-plain-organization-site.md), point 5).
> Everything below is a layer you switch on, in accounts you own
> ([ADR-0001](adr/0001-client-owned-delivery.md)). Lentago hosts nothing here,
> and nothing here is on by default: a fresh copy of this template builds the
> same site with or without this page.

## The two editors, and which to pick

A *git-backed editor* is a web page that reads and writes your repository's
files for you. These two are the ones worth your time:

| | **Sveltia CMS** (recommended) | **Pages CMS**, hosted |
|---|---|---|
| License | [MIT](https://github.com/sveltia/sveltia-cms) | [MIT](https://github.com/hunvreus/pagescms) |
| Where it runs | In the volunteer's browser, from a script on your own site at `/admin/` | On the Pages CMS service's servers |
| Sign-in | GitHub, through a small sign-in Worker (one file) in **your** Cloudflare or Netlify account | GitHub, handled by the Pages CMS service |
| Edits arrive as | A pull request per edit (`publish_mode: editorial_workflow`, [documented here](https://sveltiacms.app/en/docs/workflows/editorial)) | Not documented; we have not confirmed a pull-request mode, so plan on commits to the branch you choose |
| Setup | About six steps, one free account at Cloudflare or Netlify | Install a GitHub App, add one file, no extra account |
| Training for a volunteer | A short walk-through | The least of the options here |
| If the vendor disappears | Nothing changes: the script is pinned and the Worker is yours | You lose the editor and keep your site and files |

**The trade-off, plainly.** Sveltia CMS asks more of you once (a sign-in Worker
to deploy and a GitHub OAuth app to register) and in exchange nothing in the
editing path belongs to anyone else. Pages CMS is the easier day one and the
lowest training, but the thing that signs your volunteers in and touches your
repository is a service someone else runs. That is not Lentago-hosted either,
yet it is a dependency you would have to leave, which is the thing
[ADR-0004](adr/0004-second-rung-the-plain-organization-site.md) asked us to avoid
building in. If you cannot spare the hour for the Worker, Pages CMS is a fair
choice. The rest of this page covers Sveltia CMS, since that is the one the kit
ships a config for. For Pages CMS, follow
[its own docs](https://pagescms.org/docs/); the front matter fields to expose
are the four in [`content/README.md`](../content/README.md#editing-a-page).

**Two we don't recommend.**

- **Static CMS.** Its repository was [archived on 2024-09-09](https://github.com/StaticJsCMS/static-cms)
  and no longer gets fixes, including security ones.
- **TinaCloud.** Its [free tier is two users](https://tina.io/pricing). A
  volunteer-run organization will pass two editors quickly, and the next tier
  is a subscription.

## What you'll need

- Rung 2 switched on (`rung: 2` in [`campaign.config.ts`](../campaign.config.ts))
  and the site live, per [`DRY-RUN.md`](../DRY-RUN.md#optional-second-drill--rung-2-the-organization-site).
- Admin on the organization's GitHub account, to register an app and invite people.
- A free [Cloudflare](https://www.cloudflare.com/) account owned by the
  organization, for the sign-in Worker. (Netlify works too; see the note under
  step 2.)
- A volunteer with a free GitHub account, for the test.

**Cost:** $0 on Cloudflare's free Workers plan for an organization this size,
on GitHub's free plan. Check both providers' current limits before you rely on
that.

## Setup, once (the maintainer)

### 1. Copy the editor into your site

The editor's two files live in [`editor/sveltia/`](../editor/sveltia/config.yml),
where the build never looks. Copying them into `public/admin/` is the switch:

```
cp -r editor/sveltia public/admin
```

Open `public/admin/config.yml` and change the two lines marked `CHANGE`:
`repo` (your organization and repository, like `your-org/your-repo`) and
`base_url` (you get this address in step 2, so come back to it). Leave the rest.

**Heads up.** After the copy, `/admin/` is a public address on your live site.
Anyone can open it, but all they see is a sign-in button; only people you have
given write access to the repository can edit anything. The page asks visitors'
browsers to load the editor script from `unpkg.com`, a public file host, only
when someone opens `/admin/`. The script is pinned to one version and checked
against a hash, so it can't change under you. The rest of the site stays free of
trackers and scripts.

**To switch it off again,** delete `public/admin/` and push.

### 2. Deploy the sign-in Worker

A *Worker* is a small program that Cloudflare runs for you. This one does the
GitHub sign-in handshake that a static site can't do alone. It is
[`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) (MIT), and it
is one file.

1. Follow the "deploy to Cloudflare" button in that project's README, signed in
   to **your** Cloudflare account. It copies the Worker into your account.
2. Note the Worker's address, which looks like
   `https://sveltia-cms-auth.your-subdomain.workers.dev`. Put it in
   `base_url` in `public/admin/config.yml`.

If your site is already on Netlify, its built-in sign-in works without a Worker;
the Worker's README says how. We have not exercised that route.

### 3. Register a GitHub OAuth app

An *OAuth app* is how GitHub knows the Worker is allowed to ask people to sign
in. Register it under the organization so the organization owns it.

1. On GitHub, go to the organization's Settings → Developer settings → OAuth
   Apps → New OAuth App.
2. Homepage URL: your site's address. Authorization callback URL: your Worker's
   address followed by `/callback`.
3. Create it, then generate a client secret. Copy the client ID and the secret.

### 4. Give the Worker its settings

In the Cloudflare dashboard, open the Worker's Settings → Variables and add:

| Variable | Value |
|---|---|
| `GITHUB_CLIENT_ID` | The client ID from step 3 |
| `GITHUB_CLIENT_SECRET` | The client secret, saved as encrypted |
| `ALLOWED_DOMAINS` | Your site's host name, like `www.example.org` (or `you.github.io` for a project Pages site). Optional, but the Worker's README strongly recommends it, and we do too |

### 5. Protect `main`

So that nothing a volunteer does can go live without you, in the repository's
Settings → Rules, add a rule for `main` that requires a pull request before
merging **and at least one approving review**, and leave the rule's bypass list
empty. A pull request alone is not enough: anyone with Write access could merge
it. With the review required, GitHub will not let a volunteer approve their own
pull request, so the approval has to come from someone else. If more than one
volunteer has Write access, also tick **Require review from Code Owners** and
list yourself in a `CODEOWNERS` file, so an approval from another volunteer
does not count. Write access plus that rule means a volunteer can propose but
not publish.

### 6. Publish the editor

Commit `public/admin/` and push to `main`. When the deploy finishes, open
`<your site>/admin/`. You should see a sign-in screen.

**How you know it worked:** the sign-in screen loads, and "Sign in with GitHub"
takes you to GitHub and back to a list headed **Pages** with your six pages.

## Adding a volunteer

1. They make a free GitHub account if they don't have one.
2. In the repository's Settings → Collaborators, invite them with the **Write**
   role. (If the repository belongs to an organization, add them to a team with
   Write access instead.) GitHub emails them; they accept.
3. Send them `<your site>/admin/` and the page below.

GitHub's access rules are the only access rules. Take their access away there
and the editor stops working for them.

## Editing a page (the volunteer)

You'll need: a GitHub account the maintainer has invited, and the editor's
address. About five minutes.

1. Open the editor's address and choose **Sign in with GitHub**. The first time,
   GitHub asks whether to let the editor use your account. Allow it.
2. Choose **Pages**, then the page you want to change.
3. Edit the title, the menu label, or the **Body**. The body is the words on the
   page. Start headings at level 2 and link to other pages with slashes at both
   ends, like `/events/`.
4. Save. Your change is now a pull request waiting for the maintainer. The page
   on the live site doesn't change yet.
5. Tell the maintainer it's there, or wait for them to see it.

**Heads up.** If the editor shows a message about permissions, the maintainer
hasn't given your account Write access yet. Nothing is broken on your side.

**How you know it worked:** the editor lists your edit as waiting for review.
(The branch it made is named `cms/pages/<page>`; the maintainer will see a
pull request with that name.)

## Reviewing the pull request (the maintainer)

1. Open the repository's Pull requests tab and find the new one.
2. Look at the checks. The same checks that run on every change run here:
   [`build-check.yml`](../.github/workflows/build-check.yml) builds both rungs
   and tests every page for accessibility.
3. Read the change under Files changed. It is the Markdown the volunteer edited.
4. Merge it. The deploy workflow publishes the site.

**How you know it worked:** the deploy workflow goes green and the live page
shows the volunteer's words.

## Receipt

Time the walk-through once, with a real volunteer account, and fill in the
table. It ships blank so the numbers are yours. The first clock covers setup
(steps 1 to 6) and the second covers one edit from the volunteer opening the
editor to the maintainer merging it.

| # | Step | Check it's green | Elapsed | ✅ |
|---|---|---|---|---|
| 1 | **Copy the editor** into `public/admin/` and fill in `repo`. | `public/admin/config.yml` exists. | | |
| 2 | **Deploy the Worker** in the organization's Cloudflare account. | The Worker's address answers. | | |
| 3 | **Register the OAuth app** under the organization. | Client ID and secret in hand. | | |
| 4 | **Set the Worker's variables.** | Three variables saved. | | |
| 5 | **Protect `main`** with a pull-request rule. | The rule shows as active. | | |
| 6 | **Publish** `public/admin/` and wait for the deploy. | `<site>/admin/` shows the sign-in screen. | | |
| 7 | **Invite the volunteer** with the Write role. | Invitation accepted. | | |
| 8 | **Volunteer signs in** and opens a page. | The page's fields show. | | |
| 9 | **Volunteer edits and saves.** | A pull request appears in the repository. | | |
| 10 | **Maintainer reviews and merges.** | Checks green; deploy green; the live page shows the edit. | | |

| Field | Value |
|---|---|
| Date | |
| Maintainer | |
| Volunteer (role only) | |
| Editor and version (`@sveltia/cms@…` from `public/admin/index.html`) | |
| **Setup time, steps 1 to 7** | |
| **Edit-to-merge time, steps 8 to 10** | |
| Slowest step (bottleneck) | |
| Notes / follow-ups | |

## Upgrading, and getting out

- **Upgrading.** The editor script is pinned in `public/admin/index.html`. To
  move to a newer version, change the version in the address and the `integrity`
  hash together (the hash is the file's SHA-384 digest), then run through steps
  8 to 10 again.
- **Getting out.** Delete `public/admin/`, the Worker, and the OAuth app. Your
  pages are ordinary Markdown files in `content/`; they never depended on the
  editor.

## What we have and haven't run

The config in [`editor/sveltia/config.yml`](../editor/sveltia/config.yml) is
checked against the editor's published schema for the pinned version, and the
default build is unchanged without the copy step. Sign-in, the Worker, and the
pull-request flow need real GitHub and Cloudflare accounts and have not been run
by the kit's maintainers. The receipt above is where the first real run goes.
