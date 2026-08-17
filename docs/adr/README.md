# Architecture decision records

The decisions below record why monarda — the Lentago Labs campaign-site kit — is
built the way it is. They are the kit's own design decisions, not decisions about
any one campaign that uses it.

> **For repos created from this template:** these ADRs document the kit itself.
> Your campaign is welcome to keep them as background and add its own decisions
> below (custom domain choice, processor choice, and so on), or start a fresh log
> — either way, use the format guide below.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-client-owned-delivery.md) | Deploy into the client's own account, never Lentago-hosted | Accepted | 2026-08-17 |
| [0002](0002-processor-hosted-payments-only.md) | Donations go through a processor-hosted widget; the kit never touches card data | Accepted | 2026-08-17 |
| [0003](0003-pages-default-s3-opt-in.md) | GitHub Pages is the default deploy; S3 + CloudFront is the opt-in paid variant | Accepted | 2026-08-17 |

---

## How to add an ADR to this repo

Create `docs/adr/NNNN-<short-slug>.md` and add a row to the index above. Use this structure:

```markdown
# ADR-NNNN: <Title>

**Status:** Accepted (<date>)

## Context

Why was a decision needed? What constraints and forces were in play?

## Decision

What was decided, and how does it address the context?

## Alternatives

List the options that were actually weighed, then add one or two marked
*"retrospective — not considered at the time"* with an honest assessment
(worse / better / lateral) and a short reason.

## Consequences

What does this decision make easier or harder going forward? What are the
known trade-offs or scars?
```

**Recorded vs. retrospective alternatives:** Alternatives that were actually weighed at decision
time go in the list without special marking. Options added later for completeness must be
explicitly labelled *"retrospective — not considered at the time"* so future readers know they
were not part of the original deliberation. Honest assessment (worse / better / lateral) is
required — do not present retrospective options as neutral.
