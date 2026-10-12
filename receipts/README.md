# Adoption receipts

This folder holds monarda's **own** adoption receipts: the record of an operator
running [`DRY-RUN.md`](../DRY-RUN.md) end to end, from **Use this template** to a
live site on an account outside this organization, and writing down how long it
took and whether every check went green.

A receipt is how a tier claim earns the right to be made. The tier registry in
[lupinus](https://github.com/lentago/lupinus/blob/main/guide/tiers.md) cites the
**latest** receipt here as its evidence that this kit is adoptable.

The tables inside `DRY-RUN.md` and `ADOPTION.md` are **yours** to fill when you
run the drill in your own copy; they ship blank on purpose. Our runs live here.

## How to file one

1. Run [`DRY-RUN.md`](../DRY-RUN.md) all the way through, noting the elapsed
   time at each checkpoint.
2. Copy the latest receipt here to `receipts/<YYYY-MM-DD>-<operator>.md` and
   replace its values with yours.
3. Commit it in a pull request. Receipts are **append-only**: file a new one for
   each run; never edit or delete a past receipt. The history of runs is itself
   evidence that the time stays honest across template changes.
