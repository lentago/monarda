# ADR-0003: GitHub Pages is the default deploy; S3 + CloudFront is the opt-in paid variant

**Status:** Accepted (2026-08-17)

## Context

The site has to deploy to the client's own account (ADR-0001), and there is more
than one reasonable target. GitHub Pages is free and needs nothing but the repo.
AWS S3 + CloudFront gives a custom domain with a CDN and fine-grained cache
control, but costs money and requires standing up a bucket, a distribution, and
credentials. The fleet convention is **free-tier-first**: default to the
zero-cost path and flag the paid one as opt-in.

Both targets must avoid long-lived cloud credentials. A campaign repo handed to a
client should never carry a static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`.

## Decision

Ship **two** deploy workflows and make the free one the default:

- [`deploy-pages.yml`](../../.github/workflows/deploy-pages.yml) runs on push to
  `main`. It is the recommended path: free, no cloud account, uses GitHub's own
  Pages OIDC deployment.
- [`deploy-s3.yml`](../../.github/workflows/deploy-s3.yml) is **disabled by
  default** (`workflow_dispatch` only) and gated behind four clearly-marked
  placeholders. It authenticates to the client's AWS account via **GitHub OIDC**
  assuming an IAM role the client creates — **no long-lived AWS keys anywhere** —
  then `aws s3 sync`s the build and optionally invalidates CloudFront.

Both pin every third-party action to a full commit SHA with a version comment.
The README frames Pages as free/default and S3 as the paid variant; exact AWS
costs are left to current pricing rather than guessed.

## Alternatives

**One workflow with a target switch** *(retrospective — not considered at the
time)* — A single parameterized workflow that deploys to Pages or S3 based on a
flag. *Lateral*: fewer files, but conflates two very different permission and
setup profiles (Pages token vs. AWS OIDC role) into one harder-to-read file; two
focused workflows are clearer for a client to reason about and enable one at a
time.

**S3 with a static IAM access key in secrets** — Simplest AWS wiring. *Worse*:
puts long-lived cloud credentials in a repo delivered to a client — exactly the
standing-credential risk OIDC exists to remove.

**Netlify / Vercel / Cloudflare Pages** *(retrospective — not considered at the
time)* — Also free static hosts with good DX. *Lateral*: viable, but each adds a
third-party account outside the client's existing GitHub/AWS footprint; Pages and
S3 keep everything inside accounts the client already owns per ADR-0001.

## Consequences

- Most clients deploy for free with a Settings toggle and a push; nobody pays for
  hosting unless they opt into S3.
- The S3 path requires a one-time IAM OIDC setup in the client's account (the
  usual dry-run bottleneck, flagged in [`DRY-RUN.md`](../../DRY-RUN.md)).
- Two workflows mean two files to keep SHA-pins current; Dependabot's
  github-actions updates cover both.
