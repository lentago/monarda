// Rung 2's page list, read from the Markdown files in ./content.
import { getCollection, type CollectionEntry } from "astro:content";
import campaign from "../../campaign.config";
import { organization } from "../config";

export type Page = CollectionEntry<"pages">;

export interface NavItem {
  label: string;
  /** Path without the base, e.g. "" for home or "about/". */
  path: string;
}

/** Every page, in menu order (front matter `order`, then title). */
export async function pages(): Promise<Page[]> {
  const all = await getCollection("pages");
  return all.sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
}

/** The header menu: every page, plus the campaign page when it is kept. */
export async function navItems(): Promise<NavItem[]> {
  const items: NavItem[] = (await pages()).map((p) => ({
    label: p.data.nav ?? p.data.title,
    path: p.id === "home" ? "" : `${p.id}/`,
  }));
  if (organization(campaign).campaignPage) {
    items.push({ label: campaign.name, path: "campaign/" });
  }
  return items;
}
