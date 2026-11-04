# ADR-0005: Later template changes reach a copy through an update door the client owns

**Status:** Accepted (2026-11-04)

## Context

A client's site starts as a copy of this template, made with **Use this
template**. The copy has its own history and no git link back to the template,
so `git pull` can't bring later changes in, and nothing in the kit said how to
take them.

The rung-2 drill found the gap
([#39](https://github.com/lentago/monarda/issues/39),
[receipt](../../receipts/2026-11-04-agent-run-rung-2.md)). The drill copy had
been made at `dd03018`, before rung 2, and the second drill assumes rung 2's
`content/` folder and `rung` setting. The operator applied the template diff
`dd03018..0eb8d7b` as one patch, 49 files in the end, and merged
`campaign.config.ts` by hand to keep the copy's values. That was 1 min 18 s of
work for an operator who knew the template well. A client has no such operator.
[#42](https://github.com/lentago/monarda/issues/42) asked for the path to be
documented.

uvularia's templates had the same gap, and on 2026-11-04 the maintainer chose
an answer for them:
[uvularia ADR-0003](https://github.com/lentago/uvularia/blob/main/docs/adr/0003-template-updates-reach-clients-through-an-update-door.md),
built in uvularia#136 and hardened in uvularia#137 after review. It runs entirely
in the client's own repository with the client's own token, which is what
[ADR-0001](0001-client-owned-delivery.md) requires. A kit's workflows run from
files in the copy and call no workflow in a Lentago repository, the rule
`agent-pr-gate.yml` already follows. uvularia's door meets that rule too.

## Decision

1. **Adopt uvularia's update door, not a second design.** The kit ships the same
   three files: `.github/workflows/template-update.yml`,
   `scripts/template-update.py` and `.github/template-update.toml`. The rules
   are uvularia ADR-0003's Decisions 1 to 5: weekly and on demand, one pull
   request at a time in the client's repository, opened with the client's
   `TEMPLATE_UPDATE_TOKEN` (an issue instead, and a green run, when the token
   isn't set), a three-way file-by-file update against the template commit
   recorded in `.github/template-base` (inferred from the copy's first commit
   before the first update), a damaged or unfetchable base stops the run, and a
   declined update is not offered again.
2. **The script is a byte-for-byte copy** of uvularia's at commit `5189e45`.
   A fix goes into uvularia first and is copied back. `ci/test_template_update.py`
   holds the copy to a recorded hash, so a local edit fails the check. The
   workflow differs in two places only: the checkout action uses this kit's pin,
   and the script runs on the runner's own `python3`, as `docs-check` does,
   with no setup-python step.
3. **This kit's keep list:** `content/`, `.github/CODEOWNERS` and `LICENSE`.
   - `content/` is kept because a client rewrites those pages whole. A new
     placeholder page from the template would otherwise reach the live site on
     merge.
   - `campaign.config.ts` is **not** kept, unlike uvularia's `site.config.ts`.
     The kit's settings grow with the kit: rung 2 added `rung`, a required
     setting. A kept config would turn every new setting into a failed type
     check on the update pull request. Merged line by line, the new setting
     arrives and every value the client filled in stays theirs. Where the
     client and the template changed the same line, the pull request opens as
     a draft with both versions marked.
4. **The door's tests run in the template only.** `template-update-check.yml`
   runs `ci/test_template_update.py` when the door changes, and is skipped in a
   copy, whose config belongs to the client and may differ from the defaults
   the tests hold.

## Alternatives

- **Document the manual path only** (#42 as filed: add the template as a remote,
  diff two template commits, apply the patch, merge `campaign.config.ts` by
  hand). Honest and free, but it asks the client's one tech person to drive git
  through a 50-file patch, which is the gap the drill found. It is still
  possible: the script runs locally without a token and stages the same update.
- **Keep `campaign.config.ts`, as uvularia keeps `site.config.ts`.** Never
  touched, so never a conflict, but the copy stops building the first time the
  kit adds a required setting. Rejected for the merge above.
- **A kit-specific door in Node, the kit's own toolchain.** No Python
  dependency, but two implementations of the same rules to fix and test, for no
  difference a client would see. Rejected.
- **A reusable workflow in a Lentago repository that copies call.** Updates
  would then depend on a Lentago repository's workflow, which the kit's
  client-owned rule rules out. Rejected.

## Consequences

- `ADOPTION.md` gains **Getting later template changes**: the token steps, how
  you know it worked, the per-file rules, the keep list, and the install path for
  copies made before the door. The README points to it.
- A copy made before the door installs it once, by copying the three files from
  the template. A copy that already took template changes by hand records the
  commit it caught up to in `.github/template-base` first.
- An update never adds a kept path. A copy made before rung 2 has no `content/`
  folder, so it copies the folder in once by hand, and the update brings the
  rung-2 settings.
- In `lentago/monarda` itself the weekly run sees it is the template and does
  nothing.
- The token expires on the date its owner chose. When it does, the run fails
  with a message that names the token and says to make a new one.
- A copy's own Dependabot and the template both bump pinned actions. When they
  bump the same line to different versions, that line is a conflict for the
  client to resolve.
