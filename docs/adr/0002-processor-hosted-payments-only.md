# ADR-0002: Donations go through a processor-hosted widget; the kit never touches card data

**Status:** Accepted (2026-08-17)

## Context

A campaign site's central action is "donate." The tempting thing is to build a
first-class donation form directly into the site — custom fields, a branded
checkout, amounts we control. But the moment a page collects a card number, it
pulls the whole site (and whoever operates it) into **PCI DSS** scope, and puts
us in the business of storing or transmitting cardholder data. For a static,
no-backend kit delivered into a client's account, that is a liability we have no
business taking on.

The site also ships with **no backend** (ADR-adjacent: it is static output on
Pages/S3). There is nowhere to safely receive, tokenize, or forward a payment
even if we wanted to.

## Decision

Donations are **always** handled by the client's own payment processor on the
processor's hosted pages. monarda offers exactly two wiring modes in
[`campaign.config.ts`](../../campaign.config.ts):

1. **`donate.embedHtml`** — the client pastes the processor's own embed snippet
   (Givebutter, Zeffy, PayPal, Donorbox, Stripe Payment Link, …), rendered
   verbatim. The card fields live inside the processor's iframe/widget.
2. **`donate.buttonUrl`** — a link-button to the processor's hosted donate page.

If neither is set, the donate section renders a clearly-marked "not configured"
notice so an unfinished site is obvious rather than silently broken. The kit's
code never renders a card input, and there is no code path that receives payment
data. PCI scope and the funds stay entirely with the processor.

## Alternatives

**Native donation form + payment API** — Collect amount and card details on the
site and call a processor API. *Worse*: drags the site into PCI scope, requires
a backend/secret to hold API keys, and makes the operator responsible for
cardholder data. Directly contradicts the no-backend, low-liability design.

**Processor JS SDK with client-side tokenization** *(retrospective — not
considered at the time)* — Use a processor SDK (e.g. Stripe Elements) so card
data is tokenized in the browser and never hits our origin. *Lateral*: keeps raw
card data off our servers and can reduce PCI scope to the lighter SAQ tiers, but
still requires the client to run/secure a backend for the secret key and adds a
JS dependency to a kit whose whole premise is static + zero client JS. The hosted
embed/link gets the same "we never see the card" outcome with none of that.

## Consequences

- The client must have (or create) a processor account before go-live;
  [`INTAKE.md`](../../INTAKE.md) asks for the embed snippet or donate URL, and
  [`DRY-RUN.md`](../../DRY-RUN.md) verifies a test donation completes on the
  processor's page.
- monarda cannot show a live, in-page fundraising total sourced from the
  processor (no backend to query it). The optional progress meter is a value the
  client updates by hand in the config — a deliberate trade for zero data
  handling.
- The kit stays free of PCI obligations and of any secret needed to move money.
