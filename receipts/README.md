# Adoption receipts

This folder holds the receipts from the kit's maintainers running
[`DRY-RUN.md`](../DRY-RUN.md) end to end, from **Use this template** to a live
site on an account outside their organization, writing down how long it took
and whether every check went green. When you run the drill in your own copy,
you fill the tables in `DRY-RUN.md` and `ADOPTION.md`; if you keep this folder,
add your run as a new file here too.

A receipt is how a tier claim earns the right to be made. The tier registry in
[lupinus](https://github.com/lentago/lupinus/blob/main/guide/tiers.md) should
cite the **latest** receipt here as its evidence that this kit is adoptable;
until it does, its monarda row says the receipt is pending.

The tables inside `DRY-RUN.md` and `ADOPTION.md` are **yours** to fill when you
run the drill in your own copy; they ship blank on purpose. The maintainers' runs
live here.

## How to file one

1. Run [`DRY-RUN.md`](../DRY-RUN.md) all the way through, noting the elapsed
   time at each checkpoint.
2. Copy the latest receipt here to `receipts/<YYYY-MM-DD>-<operator>.md` and
   replace its values with yours.
3. Commit it in a pull request. Receipts are **append-only**: file a new one for
   each run; never change or delete what a past receipt records. The history of
   runs is itself evidence that the time stays honest across template changes.
4. If the live site a past receipt points at changes later (a later drill
   switches it to another rung, say), add a dated note at the top of that
   receipt saying what moved, when, and which commit the receipt was taken at.
   Leave everything it recorded as it was.
