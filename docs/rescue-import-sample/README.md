# Sample export for the rescue import

A small, made-up WordPress export for a fictional organization, the Harbor
Street Garden Club. It exists so you can try
[the rescue import](../rescue-import.md) before you point it at your own site.
Nothing here is a real organization, address, or donation page.

- `export.xml`: the export file (WXR, WordPress's export format). It has seven
  published pages, one draft, one blog post, a menu, and one of each thing the
  import cannot carry over: a contact form, a donation widget, a calendar
  shortcode, and page-builder markup.
- `old-site/`: a stand-in for the old site's files, so the import can "download"
  the two images without a network.

Try it in a scratch copy of the repository, because it overwrites the
placeholder pages in `content/`:

```bash
npm install
npm run rescue-import -- docs/rescue-import-sample/export.xml \
  --images-from docs/rescue-import-sample/old-site
SITE_RUNG=2 npm run build && npm run check
```

To put the placeholders back, run `git checkout content && rm -r public/images`
and delete `content/volunteer-days.md`.
