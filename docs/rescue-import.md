# Rescue import: move your existing site onto rung 2

**What you're about to do:** carry the words and pictures from the site you
have now (WordPress, Squarespace, Wix, Weebly, Google Sites, or a site you can
no longer log in to) into the Markdown pages of [rung 2](../content/README.md),
the plain organization site. Markdown is plain text where a line starting with
`##` is a heading and `- ` starts a list.

**Why bother:** the new site is yours: no subscription, no login that belongs
to a former volunteer. The pages are text files in your own repository. And
the old site's content is the part that took years to write; the layout is the
part you can rebuild in an afternoon.

**How long:** it depends on the platform, and on one fact: how much of the site
can be exported. Only two builders export structure at all.

| Where the site lives | What you can get out | Path | Effort (our estimate) |
|---|---|---|---|
| WordPress | A full export file (WXR, WordPress's export format) | [Script](#path-a-wordpress-and-squarespace-the-script) | An hour or two for a six-page site, plus the fix-up |
| Squarespace | A WordPress-format export file | [Script](#path-a-wordpress-and-squarespace-the-script) | The same, and see the page types it skips |
| Wix | Nothing; Wix offers no site export and, officially, no blog export | [By hand](#path-b-wix-weebly-and-google-sites-scrape-and-rewrite) | Half a day for six pages |
| Weebly | A ZIP of the site that often leaves out the blog | [By hand](#path-b-wix-weebly-and-google-sites-scrape-and-rewrite) | Half a day for six pages |
| Google Sites | A Google Takeout download | [By hand](#path-b-wix-weebly-and-google-sites-scrape-and-rewrite) | Half a day for six pages |
| You can't log in to it | Whatever the Wayback Machine saved | [Wayback](#path-c-you-lost-access-to-your-own-site-the-wayback-machine) | A day, with gaps |

The efforts are estimates, not measurements. The script has been run only on
the [sample export](rescue-import-sample/README.md), and nobody has timed a real
Wix, Weebly, or Google Sites move yet. Your own pages may take more or less.

> **Heads up.** Do the export and the image download **before** you cancel the
> old plan or let the domain lapse. Exports can be re-run while you have a
> login; images only come across while the old site is still up. If the old
> site is already gone, skip to [Path C](#path-c-you-lost-access-to-your-own-site-the-wayback-machine).

## Before you start

**You'll need:** this repository (your copy of the template), Node.js 20 or
newer, and a login to the old site. Run `npm install` once.

**Skip this if** your site has under three pages of real content. Typing them
into [`content/`](../content/README.md) is faster than any import.

## Path A: WordPress and Squarespace, the script

### Step 1: Export from the old site

**WordPress:** in the admin, go to **Tools → Export**, choose **All content**,
and download the file. It ends in `.xml`.

> **Heads up.** Choosing only **Pages** leaves out the menu. The menu lives in
> the export as "All content" items, and without it the import cannot copy your
> page order or menu labels.

**Squarespace:** in the site's settings, find **Import / Export**, then
**Export**, and pick the WordPress option. Squarespace's export covers some page
types and not others. Reports of it list events, products, store, album, and
index pages as left out, and video and audio blocks too; check
[Squarespace's own help](https://support.squarespace.com/) for the current list
before you rely on it. The script can only list what the file mentions, so
open your old site next to the new one at the end and look for anything missing.

### Step 2: Run the import

Put the file somewhere in the repository, say `old-site.xml`, and run:

```bash
npm run rescue-import -- old-site.xml
```

The script reads the file, writes one Markdown file per published page into
`content/`, and downloads every image and document those pages use into
`public/images/` and `public/files/`. That is the only network traffic: it
fetches what your pages link to (usually the old site, though a link can point
anywhere), and it sends no site content anywhere.

What it does to each page:

- **Names it for the kit.** A page called "About Us", "Our Story", or "Who We
  Are" becomes `about.md`; likewise `programs`, `events`, `donate`, `contact`,
  and `home`. Any other page keeps its own name (`volunteer-days.md`).
  Override a guess with `--map old-slug=new-slug`.
- **Writes the front matter** (the settings block at the top of each file):
  `title`, `description` from the excerpt if there is one, and `nav` and
  `order` from the old menu. A page that opens with its own big heading uses
  that as its title.
- **Fixes the headings**, so the page's top heading is `##` (the layout already
  prints the title as the top heading).
- **Rewrites links** between pages to the kit's form, `/about/`, and saves linked
  documents such as PDFs.
- **Leaves your edits alone.** It overwrites only the kit's "Replace this"
  placeholders. Add `--force` to overwrite a page you have already edited.

Useful options:

| Option | What it does |
|---|---|
| `--dry-run` | Converts and prints the report, writes nothing. Run this first. |
| `--images-from <folder>` | Reads images from a folder holding a copy of the old site (its paths mirror the old addresses) instead of downloading. For a site that is down, a hosting backup, or a [Wayback copy](#path-c-you-lost-access-to-your-own-site-the-wayback-machine). |
| `--no-images` | Skips every download. Image links keep pointing at the old site and will break when it goes. |
| `--report <file>` | Also saves the loss list to a file. |

**Why not [`wordpress-export-to-markdown`](https://github.com/lonekorean/wordpress-export-to-markdown)
directly?** It is MIT-licensed and maintained, and it is a good fit if you
mostly want a blog's posts as Markdown. Our script uses the same converter
library underneath ([turndown](https://github.com/mixmark-io/turndown)), but
writes pages in the shape this kit reads, and prints the loss list. If you
want the posts too, run that tool separately and copy over the few you need.

### Step 3: Read the loss list

The script ends with what the export could not carry over. Read all of it; the
list is the point. Here is what each part means and what the kit uses instead:

| What was lost | Why | What replaces it |
|---|---|---|
| **Menus** | The export carries a menu's order, not its look or dropdowns. | The header menu is built from the pages in `content/` (front matter `nav` and `order`). Entries that weren't pages, like a Facebook link, go in `links` in [`campaign.config.ts`](../campaign.config.ts), which the footer shows. |
| **Forms** | A form is a plugin plus a database. Neither is in the export. | A hosted form provider such as Google Forms, Tally, or Jotform: paste its embed into `contact.formEmbedHtml`, or keep the email button. |
| **Donation widgets** | Widgets are scripts and shortcodes that call your old processor plugin. | The processor-hosted donate section: set `donate.embedHtml` or `donate.buttonUrl`. `content/donate.md` shows it under your words. The kit never touches card data ([ADR-0002](adr/0002-processor-hosted-payments-only.md)). |
| **Shortcodes** | A shortcode, like `[gallery]` or `[events_calendar]`, is a placeholder a plugin fills in when the page loads. | Write the content out as text, or link to it. The words inside a shortcode survive; the output does not. |
| **Page-builder markup** | Divi, Elementor, WPBakery and the like wrap text in layout code. | The words come across as plain Markdown. Rebuild columns and buttons as headings, lists, and links. |
| **Posts, drafts, comments** | Rung 2 has no blog. | Fold the few posts that matter into `events.md` or `programs.md`. |

> **Heads up.** A page the old site never had stays as the kit's placeholder,
> and the report says so. Search `content/` for "Replace this" until nothing
> is left, or delete the page.

### Step 4: Finish by hand

1. Fill in the donate and contact settings in `campaign.config.ts`, as in
   [`INTAKE.md`](../INTAKE.md).
2. Set `rung: 2` and fill in the `organization` block next to it.
3. Add alt text to every image the report listed. Alt text is the short
   description a screen reader reads aloud in place of a picture.
4. Open each page's links. A link the report listed as "still pointing at the
   old site" will break when that site goes.

### How you know it worked

```bash
SITE_RUNG=2 npm run build && npm run check
npm run a11y
```

The build lists every page, the type check reports 0 errors, and the
accessibility check lists every page with 0 errors. Then open the old site and
the new one side by side and click through every menu entry. If you want a
dry run first, the [sample export](rescue-import-sample/README.md) goes through
the same steps.

## Path B: Wix, Weebly, and Google Sites, scrape and rewrite

**What you're about to do:** copy each page's words into a Markdown file by
hand, and save its pictures. "Scrape and rewrite" means exactly that, with no
script in the middle, because these three give the script nothing to read.

- **Wix** exports no site. It offers no blog export either, officially.
- **Weebly** gives you a ZIP of the site, but the ZIP often drops the blog.
- **Google Sites** exports through [Google Takeout](https://takeout.google.com/),
  Google's download-your-data tool. What it gives you is Google's format, not
  a WordPress export, so the script can't read it.

**How long:** about half a day for the six rung-2 pages, if the words are
short. That is our estimate, not a measurement. Blogs add time per post; fold
in only the few that matter.

**Steps:**

1. **List what exists.** Open the old site's menu and write down every page.
   Most small sites have a `/sitemap.xml` that lists them; try it. Decide
   which of the six rung-2 pages each one becomes, and which you drop.
2. **Copy the words.** For each page, copy the text into the matching file in
   [`content/`](../content/README.md). Keep headings as `##` lines, lists as
   `- ` lines, and links as `[words](address)`. Link to your own pages like
   `/events/`.
3. **Save the pictures.** Save each image you want from the old site (your
   builder's media library, or right-click and save), name it in lowercase
   with dashes, and drop it in `public/images/`. In the page, write
   `![A short description of the picture](/images/spring-sale.jpg)`.
4. **Rebuild the three lost pieces** (menu, form, donate) the way the loss-list
   table in [Path A](#step-3-read-the-loss-list) describes.
5. **Check it the same way:** the commands under
   [How you know it worked](#how-you-know-it-worked).

> **Heads up.** For Weebly, open the ZIP's HTML pages in a browser and copy
> from there; the files are the rendered pages, not clean text. For Google
> Sites, copy from the live site if you still have it, and use Takeout as the
> backup.

## Path C: you lost access to your own site, the Wayback Machine

**Skip this if** you can still log in anywhere. An export from the real site
beats an archive copy every time.

**What you're about to do:** pull the last copy of your site that the
[Internet Archive's Wayback Machine](https://web.archive.org/) saved, then
rewrite it into rung-2 pages.

This is the situation in the [Paper Lantern Players story](https://github.com/lentago/lupinus/blob/main/guide/stories/04-paper-lantern-players.md):
the domain is registered to a former volunteer's personal account, the renewal
email goes unseen, and opening night finds a parked page where the theatre's
site used to be. In that story the path out is to get the domain into the
theatre's own name. The Wayback Machine is the other half: it may still hold
the words the site used to say.

**How long:** about a day, and the result has gaps. The Archive saves what its
crawler happened to visit, on the dates it visited. It can miss pages, images,
and recent edits, and it never has anything that sat behind a form or a login.

**Steps:**

1. **See what's there.** Open `https://web.archive.org/web/*/yourdomain.example*`
   (with your real domain) and look at the dates. Pick the last date before the
   site broke.
2. **Download the site.** Use a tool that fetches a whole site from the
   Archive. Two are current:
   - [`wayback-dl`](https://github.com/sigman78/wayback-dl), a single program
     written in Go (MIT). For example:
     `wayback-dl yourdomain.example -to 20260301000000 -directory ./old-site`
     (`-to` is the cutoff date as year, month, day, hour, minute, second).
   - [`wayback_machine_downloader_straw`](https://github.com/StrawberryMaster/wayback-machine-downloader),
     a maintained fork of the original Ruby gem: `gem install
     wayback_machine_downloader_straw`, then
     `wayback_machine_downloader https://yourdomain.example --to 20260301`.

   > **Heads up.** Don't install the original `wayback_machine_downloader` gem
   > from [hartator/wayback-machine-downloader](https://github.com/hartator/wayback-machine-downloader).
   > Its last release was in 2021 and its last code change in February 2024, so
   > it is stale. The fork above and `wayback-dl` are the current ones.
3. **Rewrite the pages.** What you downloaded is the site's rendered HTML, not
   an export file, so the script has nothing to read here. Follow
   [Path B](#path-b-wix-weebly-and-google-sites-scrape-and-rewrite) steps 1 to
   5, opening the saved pages in a browser and copying the words out.
4. **Reuse the pictures.** The downloaded folder holds whatever images the
   Archive saved. Copy the ones you want into `public/images/`. Some will be
   missing; replace those with new photos.
5. **Get the domain back, separately.** Nothing here helps the domain. Contact
   the registrar with whatever proof of the organization's ownership you have,
   and put the registration in the organization's own name this time.

**How you know it worked:** the same build, type check, and accessibility
commands as [Path A](#how-you-know-it-worked), and every page you meant to keep
loads on the new site. Then write down what the Archive didn't have, and fill
that gap with new content on purpose.

## What this script doesn't do

- It does not read Wix, Weebly, or Google Sites files, or Wayback downloads.
- It does not carry over styling, comments, users, plugin settings, or any
  hosting. The kit has its own look; change colors with `theme` in
  `campaign.config.ts`.
- It does not check that what the old site said is still true. Read every page
  once before you publish it.
