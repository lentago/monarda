# ADR-0001: Deploy into the client's own account, never Lentago-hosted

**Status:** Accepted (2026-08-17)

## Context

monarda is a campaign-site kit delivered to a client who runs a fundraising
campaign. Someone has to host the resulting website, and the natural default for
a service provider would be to host it themselves — one account, one dashboard,
one place to operate every client's site.

The fleet delivery rule (ADR-0007, org-wide) draws a bright line the other way:
kits are delivered **into client-owned repos and accounts**. Multi-tenancy — one
provider-run system holding many clients' sites, domains, and donor traffic — is
the thing that rule exists to avoid. A campaign site also carries reputational
and, through its donate flow, quasi-financial weight: the client should not be
able to lose their site because a provider relationship ended.

## Decision

Everything monarda produces runs in the **client's** account:

- "Use this template" creates the site repo under the **client's** GitHub org.
- [`deploy-pages.yml`](../../.github/workflows/deploy-pages.yml) publishes to the
  client's own GitHub Pages.
- [`deploy-s3.yml`](../../.github/workflows/deploy-s3.yml) deploys to the
  client's own S3/CloudFront via a GitHub OIDC role **they** create in **their**
  AWS account.
- The domain and the payment processor account are the client's.

No monarda workflow authenticates to, or deploys onto, Lentago infrastructure.
The README states plainly that the client owns the repo, site, domain, processor
account, and (if used) AWS account, and that the site does not depend on us to
keep running.

## Alternatives

**Provider-hosted multi-tenant hosting** — Host every client's site on a
Lentago-run platform. *Worse*: exactly the multi-tenancy the fleet delivery rule
prohibits; concentrates other people's campaigns, domains, and traffic under one
operator and makes the client dependent on that operator to stay online.

**Provider-owned repo, transfer on completion** *(retrospective — not considered
at the time)* — Build in a Lentago repo, transfer ownership at handoff.
*Lateral*: ends in the same client-owned place, but the site lives under the
wrong account during the most fragile window (setup + first go-live), and repo
transfer is a manual, error-prone step. Starting in the client's account avoids
the transfer entirely.

## Consequences

- The operator needs write access to the client's GitHub (and, for S3, AWS)
  account during setup. [`INTAKE.md`](../../INTAKE.md) captures who owns those
  accounts up front; [`DRY-RUN.md`](../../DRY-RUN.md) checks that access before
  the clock starts.
- There is no central dashboard across clients — by design. Each site is
  independent.
- The template's files must read correctly in the client's context, since they
  are copied verbatim. This constrains how Lentago attribution appears (light and
  factual) and is called out in `CLAUDE.md`.
