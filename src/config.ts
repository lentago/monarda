// -----------------------------------------------------------------------------
// Campaign config schema + loader.
//
// You almost never need to touch THIS file. Edit `campaign.config.ts` in the
// project root instead — that is the single file that describes your campaign.
// This file just gives that config its types (so your editor can autocomplete
// and catch typos) and a couple of small helpers.
// -----------------------------------------------------------------------------

/** A labelled hyperlink (used for social/press links in the footer). */
export interface NamedLink {
  label: string;
  url: string;
}

/**
 * The donate section renders a payment widget that is HOSTED BY YOUR PROCESSOR.
 * This kit never sees, stores, or transmits card data — PCI scope stays with
 * the processor. You have two ways to wire it up:
 *
 *   1. `embedHtml` — paste the exact embed snippet your processor gives you
 *      (Givebutter, Zeffy, PayPal, Donorbox, Stripe Payment Link button, …).
 *      It is injected verbatim at build time. Only paste code from your own
 *      processor account.
 *
 *   2. `buttonUrl` — the URL of your processor-hosted donate page. The kit
 *      renders a plain link-button to it. Simplest, and works with any
 *      processor that gives you a shareable donate link.
 *
 * If both are set, `embedHtml` wins. If neither is set, the donate section
 * shows a clearly-marked "not configured yet" placeholder so a half-finished
 * site is obvious rather than silently broken.
 */
export interface DonateConfig {
  /** Section heading, e.g. "Chip in". */
  heading: string;
  /** One or two sentences above the widget. */
  blurb?: string;
  /** Processor embed snippet, pasted verbatim from your processor account. */
  embedHtml?: string;
  /** Processor-hosted donate page URL (used when `embedHtml` is empty). */
  buttonUrl?: string;
  /** Label for the link-button when using `buttonUrl`. */
  buttonLabel?: string;
  /** Name of the processor, shown as a small "Payments handled by …" note. */
  processorName?: string;
}

/**
 * The contact / volunteer section. No backend ships with this kit, so you get
 * two no-server options:
 *
 *   1. `email` — renders a mailto: link with an optional pre-filled subject.
 *   2. `formEmbedHtml` — paste a form embed from a hosted form provider you
 *      already use (Google Forms, Tally, Jotform, a processor's signup form…).
 *
 * If both are set, both render. If neither is set, the section is omitted.
 */
export interface ContactConfig {
  heading: string;
  blurb?: string;
  /** Address for the volunteer/contact mailto link. */
  email?: string;
  /** Pre-filled subject line for the mailto link. */
  emailSubject?: string;
  /** Embed snippet from a hosted form provider. */
  formEmbedHtml?: string;
}

/** One optional story block. Add as many as you like. */
export interface StoryBlock {
  heading?: string;
  /** Body paragraphs. Each string becomes its own <p>. */
  paragraphs: string[];
}

export interface CampaignConfig {
  // --- Identity ---------------------------------------------------------------
  /** Campaign name — shown in the header, hero, and browser tab. */
  name: string;
  /** One-line tagline under the name. */
  tagline: string;
  /** The public URL the site will live at, e.g. "https://give.example.org".
   *  Used for the canonical link and social-share preview. No trailing slash. */
  siteUrl: string;
  /** Sub-path the site is served from. "/" for a custom domain or a
   *  user/org GitHub Pages site; "/your-repo-name/" for a project Pages site
   *  (https://you.github.io/your-repo-name/). Must start and end with "/". */
  base: string;
  /** BCP-47 language tag for the <html lang> attribute. */
  lang: string;

  // --- The ask ---------------------------------------------------------------
  /** Fundraising goal, already formatted for display, e.g. "$25,000". */
  goal: string;
  /** Optional: amount raised so far, formatted, e.g. "$8,200". Set this to
   *  render a progress meter; leave empty to hide it. Update it by hand. */
  raised?: string;
  /** Optional 0–100 percent for the progress meter. If omitted but both goal
   *  and raised are plain "$" amounts, the kit will try to compute it. */
  raisedPercent?: number;
  /** Campaign deadline, formatted for display, e.g. "November 4, 2026". */
  deadline: string;

  // --- Content ---------------------------------------------------------------
  hero: {
    /** Big headline. Defaults to the campaign name if empty. */
    headline?: string;
    /** Sentence under the headline explaining the ask. */
    subhead: string;
    /** Label on the primary button (jumps to the donate section). */
    ctaLabel: string;
  };
  story: {
    heading: string;
    blocks: StoryBlock[];
  };
  donate: DonateConfig;
  contact: ContactConfig;

  // --- Look & footer ---------------------------------------------------------
  theme: {
    /** Primary brand color (buttons, accents). Any CSS color. */
    accent: string;
    /** Text color for content sitting on the accent (e.g. button labels). */
    onAccent: string;
  };
  /** Small print in the footer, e.g. "Paid for by Friends of …". */
  footerNote?: string;
  /** Optional social / press links shown in the footer. */
  links?: NamedLink[];
}

/**
 * Best-effort percent for the progress meter. Prefers an explicit
 * `raisedPercent`; otherwise parses the digits out of `raised` and `goal`.
 * Returns null when it can't tell (so the meter is simply not rendered).
 */
export function progressPercent(cfg: CampaignConfig): number | null {
  if (typeof cfg.raisedPercent === "number") {
    return Math.max(0, Math.min(100, cfg.raisedPercent));
  }
  const digits = (s?: string) => Number((s ?? "").replace(/[^0-9.]/g, ""));
  const raised = digits(cfg.raised);
  const goal = digits(cfg.goal);
  if (!cfg.raised || !goal || Number.isNaN(raised) || Number.isNaN(goal)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}
