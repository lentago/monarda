# Your pages (rung 2)

**What this folder is:** the words on your organization site. Each Markdown
file here becomes one page, named after the file: `about.md` is `/about/`,
`home.md` is the front page. Markdown is plain text with a few marks for
formatting: a line starting with `##` is a heading, `- ` starts a list item,
and `[words](/donate/)` is a link.

This folder is only used when `rung: 2` is set in
[`campaign.config.ts`](../campaign.config.ts). On rung 1, the one-page
campaign site, these files are ignored.

## Editing a page

Each file opens with a short block between two `---` lines, called the *front
matter*. It holds the page's settings, not its words:

| Field | What it does | Required |
|---|---|---|
| `title` | The page's main heading and its browser-tab title. | Yes |
| `description` | The summary search engines and link previews show. Defaults to your tagline. | No |
| `nav` | The label in the menu at the top of every page. Defaults to `title`. | No |
| `order` | Where the page sits in that menu, lowest number first. | No |

Below the front matter, write the page. Start your own headings at `##`,
because the page title is already the top heading.

Every placeholder sentence starts with **Replace this**, so you can tell what
is left: when searching the folder for "Replace this" finds nothing, every page
is yours.

> **Heads up.** Link to your own pages with a leading slash and a trailing one,
> like `/events/`. The kit adds your site's `base` path for you, so the same
> link works on a GitHub Pages project site and on your own domain.

## The donate and contact pages

`donate.md` and `contact.md` are ordinary pages with one extra: below your
words, the donate page shows the donate button or widget, and the contact page
shows the email button or form, both set in `campaign.config.ts`. Payments
happen on your processor's own page; this site never sees card details.

## Bringing pages from an old site

If your words are on WordPress or Squarespace, the
[rescue import](../docs/rescue-import.md) writes these files for you from the
site's export. It overwrites only the "Replace this" placeholders.

## Adding or removing a page

- **To remove a page,** delete its file. It leaves the menu too. Keep `home.md`.
- **To add a page,** copy any file, rename it (lowercase, dashes for spaces:
  `annual-report.md`), and change its front matter.

Keep the list short. A handful of pages that are up to date beats twenty that
aren't.
