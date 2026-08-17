// =============================================================================
//  ▶▶▶  THIS IS THE ONE FILE YOU EDIT.  ◀◀◀
//
//  Fill in your campaign's details below and everything else follows. Nothing
//  here talks to a payment processor directly — the donate widget is hosted by
//  your processor, so card data and PCI scope never touch this site.
//
//  After editing, run `npm run dev` to preview locally, then deploy (see
//  README.md). Every field is documented in ./src/config.ts if you want the
//  full reference.
// =============================================================================

import type { CampaignConfig } from "./src/config";

const config: CampaignConfig = {
  // --- Identity --------------------------------------------------------------
  name: "Your Campaign Name",
  tagline: "A short line that says what you're raising money to do.",
  siteUrl: "https://give.example.org", // no trailing slash
  base: "/", // "/" for a custom domain; "/your-repo-name/" for a project Pages site
  lang: "en",

  // --- The ask ---------------------------------------------------------------
  goal: "$25,000",
  raised: "", // e.g. "$8,200" — set to show a progress meter, or leave "" to hide it
  // raisedPercent: 33,     // or set the percent directly and skip the math
  deadline: "November 4, 2026",

  // --- Content ---------------------------------------------------------------
  hero: {
    headline: "", // leave empty to use the campaign name
    subhead:
      "One or two sentences that make the ask concrete: who this helps and what the money does.",
    ctaLabel: "Donate",
  },

  story: {
    heading: "Why this matters",
    blocks: [
      {
        heading: "The situation",
        paragraphs: [
          "Replace this with the real story. Lead with a specific person, place, or moment — not statistics.",
          "A second paragraph can add the stakes: what happens if the goal is met, and what happens if it isn't.",
        ],
      },
      {
        heading: "Where your money goes",
        paragraphs: [
          "Be concrete about how funds are used. Donors give more when they can picture the outcome.",
        ],
      },
    ],
  },

  // --- Donate: a widget HOSTED BY YOUR PROCESSOR -----------------------------
  //  Pick ONE approach and delete the note in the other. See ./src/config.ts
  //  and the "Choosing a processor" section of README.md for examples of
  //  Givebutter / Zeffy / PayPal / Donorbox snippets.
  donate: {
    heading: "Chip in",
    blurb: "Every contribution goes straight to the campaign. Give securely below.",
    // OPTION 1 — paste your processor's embed snippet here (wins if set):
    embedHtml: "",
    // OPTION 2 — or link to your processor-hosted donate page:
    buttonUrl: "https://your-processor.example/your-campaign",
    buttonLabel: "Donate securely",
    processorName: "your payment processor",
  },

  // --- Contact / volunteer signup (no backend) -------------------------------
  contact: {
    heading: "Get involved",
    blurb: "Want to volunteer, host an event, or ask a question? Reach out.",
    email: "hello@example.org",
    emailSubject: "I'd like to help with the campaign",
    // formEmbedHtml: "",  // or paste a Google Forms / Tally / Jotform embed
  },

  // --- Look & footer ---------------------------------------------------------
  theme: {
    accent: "#1b4b2e",
    onAccent: "#ffffff",
  },
  footerNote: "Paid for by Friends of Your Campaign.",
  links: [
    // { label: "Instagram", url: "https://instagram.com/yourcampaign" },
    // { label: "Press kit", url: "https://example.org/press" },
  ],
};

export default config;
