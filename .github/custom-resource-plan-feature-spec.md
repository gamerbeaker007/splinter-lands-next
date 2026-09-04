# Feature Specification: Custom Resource Processing Plans

## Purpose

Add a new **Custom Plan** strategy to the existing **Process Resource**
flow.

Custom Plan allows a user to create (not more then 5), save, edit, reorder, validate, and
execute a sequence of existing resource actions:

-   Transfer
-   Pool
-   Buy
-   Sell
-   Swap

The implementation should reuse the existing action, calculation,
transaction, safety-margin, confirmation/verification, and Today-panel
behavior wherever possible. Do not duplicate existing transaction logic.

The feature should remain simple: validation uses the balances available
when the dialog is opened or edited, consumes those balances virtually
in plan order, and does **not** model resources or DEC produced by
earlier plan rows as available to later rows.

------------------------------------------------------------------------

## 0. Codebase Grounding (resolved decisions)

This section supersedes any conflicting statement later in the document.
It records what actually exists in the repository and the decisions taken
before implementation.

### 0.1 Owner key — there is no "store"

The application has no store entity. Every persisted land-manager record
is keyed by the Hive account name, resolved **server-side** from the
session (`getAuthStatus()` in
`src/lib/backend/actions/auth-actions.ts`), never from a client-supplied
value. Compare `LandManagerConfig { player String @id }`.

Read every occurrence of *store* / `store_id` in this document as
**`player`**. The uniqueness constraint is therefore
`@@unique([player, name])`.

### 0.2 Existing code to reuse

Calculation primitives (all pure, already shared — do not reimplement):

| Need | Function | Location |
|---|---|---|
| Transfer / Swap output (all 4 directions) | `computeSwapAmounts(pools, from, to, amount)` | `src/lib/shared/landManagerUtils.ts:157` |
| Buy: DEC needed for a desired resource amount | `computeDecNeededForResource(pools, symbol, amount)` | `landManagerUtils.ts:177` |
| Generic inverse (desired output → input) | `computeInputForDesiredOutput(...)` | `landManagerUtils.ts:202` |
| AMM price impact (+ inverse) | `calculatePriceImpact` / `calculatePriceImpactInverse` | `src/lib/shared/priceUtils.ts` |
| Trade-hub fee constants | `TRADE_HUB_FEE`, `TRADE_HUB_FEE_PER_HOP` | `src/lib/shared/statics.ts` |

Operation builders (`src/lib/shared/operations/opBuilders.ts`):

-   Transfer **and** Swap → `buildSwapTokensOp` (same `fromSymbol`/
    `toSymbol` across two regions = transfer; different symbols = swap).
-   Pool → `buildAddLiquidityOp`
-   Sell → `buildSellResourceForDecOp`
-   Buy → `buildBuyWithDecOp`

Execution / reporting:

-   `broadcastOperations` + `waitForTransactions`
    (`src/lib/frontend/splBroadcast.ts`)
-   `invalidatePlayerRegionCaches()` after success or failure
-   `recordPostHarvestLog(...)`
    (`src/lib/backend/actions/land-manager/log-actions.ts`)
-   Reference implementation of the whole shape:
    `src/hooks/useProcessResourcesAction.ts`

The existing per-action helpers inside `makeHarvestableOps.ts`
(`tryPool`, `tryTransfer`, `trySwap`, `tryBuyDec`) and
`topUpPoolOps.ts` (`trySellResource`, `tryBuyResources`,
`trySwapResource`) are **deficit-driven allocators** — "given a shortfall,
find sources". Custom Plan is the inverse ("given an explicit amount,
compute the result"), so those functions are *not* directly reusable.
Reuse the calculation primitives in the table above instead; extract a
shared helper only where a genuine duplicate would otherwise appear.

### 0.3 Balances — the dialog fetches its own

§1.1 and §14 originally assumed the calling component already holds
balances. It does not: per-region balances live in row-local state inside
`RegionOverview.tsx` (`getRegionResourceBalance` per row), and the global
DEC balance is not in the UI at all.

Decision: the Custom Plan dialog fetches its own state on open and again
immediately before execution, exactly as `useProcessResourcesAction`
does:

```ts
const [{ balances }, { pools }, decBalance] = await Promise.all([
  getBulkRegionData(enabledRegionUids, force),
  getLandPools(),
  getDecBalance(username),
]);
```

Do not refactor `RegionOverview` for this feature.

### 0.4 Ledger basis — stored balances only

Splinterlands separates **stored** balance from **ready** (produced but
unharvested) resources. `effectiveBalance()` sums both, but ready
resources **cannot leave a region** until harvested — this is why
`makeHarvestableOps.ts` maintains a separate `stored` ledger.

Decision:

-   The validation ledger and every percentage base use **stored
    balances only**.
-   The row displays the stored balance. Where a region also has ready
    resources, show them as secondary information (e.g.
    `12,400 (+3,100 ready)`) so the user understands why the usable
    figure is lower.
-   Ready resources are never spendable by a plan row.

### 0.5 Amount semantics — input amount, estimate shown

Transfer and Swap both route through `swap_tokens` and pay the trade-hub
fee, so input ≠ output. A transfer of 50,000 Wood does **not** deliver
50,000 Wood.

Decision:

-   Transfer, Pool, Sell and Swap: the entered amount is what is
    **spent** from the source region. `%` is therefore an exact
    percentage of the stored source balance, and the ledger subtraction
    is exact.
-   Each of those rows additionally displays the **estimated received**
    amount (`computeSwapAmounts`) — including Transfer, where the ~10%
    fee is otherwise invisible to the user.
-   Buy remains output-based per §9: the user enters the resource amount
    to receive and the row shows the estimated DEC cost from
    `computeDecNeededForResource`.

### 0.6 Eligible resources

Only `NATURAL_RESOURCES` (`GRAIN`, `WOOD`, `STONE`, `IRON` —
`src/lib/shared/statics.ts:70`) are valid in any row. `RESEARCH` and
`AURA` are soulbound (`NON_TRANSFERABLE_DONATION_RESOURCES`) and have no
trade-hub pool; `SPS` is out of scope. Resource selectors must exclude
them rather than surface a row that cannot succeed on-chain.

### 0.7 Execution batching is visible to the user

`MAX_OPS_PER_BROADCAST = 4` (`src/types/landManager.ts:20`), and
`broadcastOperations` raises **one Keychain popup per chunk** with a full
block wait between chunks. A 9-row plan means 3 signature prompts and
several seconds of waiting.

Therefore:

-   The plan editor shows the resulting signature count before execution
    (the existing `ConfirmActionDialog` already warns above
    `MAX_OPS_PER_BROADCAST`).
-   A rejected chunk stops the run; earlier chunks stay broadcast. This
    is the existing behaviour and is consistent with §19 (no rollback).
-   Custom Plan execution routes through the existing plan-review path
    (`ProcessResourcesRow.run()` → `onPlan(plan, confirm)` →
    `ActionPlanDialog`/`ConfirmActionDialog`) rather than introducing a
    second confirmation surface.

### 0.8 Limits

-   Maximum **5 saved plans per player** (the cap mentioned in Purpose).
    Attempting to save a sixth shows a validation error naming the
    limit; New Plan stays available for an unsaved scratch plan.
-   No hard row cap. Warn once the row count implies more than 2
    Keychain popups (i.e. more than 8 rows), per §0.7.
-   Plan name maximum length: 40 characters.

### 0.9 Region identity

Use `region_uid` (string) everywhere — it is what every SPL API call and
every op builder consumes. `LandManagerConfig.enabled_regions` stores
`region_number` (`Int`) for region *selection* only; do not use it as a
foreign key on plan rows. Schema fields are therefore
`from_region_uid` / `to_region_uid`, not `*_region_id`.

------------------------------------------------------------------------

## 1. Entry Point

Add a resource-processing strategy named:

**Custom Plan**

When the user selects Custom Plan and presses **Process Resource**, open
the Custom Plan dialog.

On opening:

1.  Fetch the region resource balances, land pools and global DEC
    balance (see §0.3). Stored balances only (§0.4).
2.  Load the user's saved Custom Plans for the current player.
3.  If saved plans exist, select the first/default plan.
4.  If no saved plans exist, open a new empty plan.
5.  Recalculate and validate the selected plan immediately against the
    current balances.

The user must also be able to start a **New Plan** even when saved plans
exist.

------------------------------------------------------------------------

## 2. Multiple Saved Plans

A store can have multiple Custom Plans.

Each saved plan must have:

-   ID
-   Store ID / appropriate existing store reference
-   Name
-   Ordered list of plan rows/actions
-   Creation metadata consistent with existing application patterns
-   Updated timestamp
-   A stable/default ordering or explicit default selection

### Plan name rules

-   Required when saving.
-   Cannot be empty.
-   Must be unique within the store.
-   Apply a sensible maximum length consistent with the application.
-   A duplicate name must show a validation error; it must never
    silently overwrite another plan.
-   Plan names can be renamed.
-   Plans can be deleted.
-   Deleting a plan requires confirmation.
-   The last saved plan may be deleted; afterwards the UI returns to a
    new empty Custom Plan.

### Security

All database writes and queries must use the project's ORM or
parameterized queries.

**Never concatenate plan names or any other user-controlled plan data
into SQL strings.**

Normal input validation is still required, but input filtering must not
be treated as SQL-injection protection.

------------------------------------------------------------------------

## 3. Plan Selector / Management

Provide controls equivalent to:

-   Plan selector
-   New Plan
-   Rename
-   Delete

Exact styling should follow existing application conventions.

When multiple saved plans exist, the first/default plan is selected when
the dialog opens.

Do not rely on unspecified database row ordering to determine the
default. Persist an explicit default/sort-order mechanism or use an
existing application convention.

------------------------------------------------------------------------

## 4. Plan Editor UX

The plan consists of ordered rows.

Each row represents one resource action.

### Progressive entry

A row should expose the full layout from the beginning so the user can
see what information will be required.

Fields that cannot yet be entered are disabled.

Example:

1.  User selects action/strategy.
2.  Relevant next field becomes enabled.
3.  Completing that field enables the next.
4.  Continue until the row is complete.

Do not dynamically hide the overall structure unnecessarily; prefer
visible-but-disabled upcoming fields.

### Permanent empty row

The editor always has one empty row after the last configured row.

-   The empty row is not part of the plan.
-   It is not persisted.
-   It does not affect validation.
-   It cannot be deleted.
-   Once it becomes a completed/configured row, automatically add
    another empty row underneath it.

A partially entered row is different from the permanent empty row and
makes the plan **incomplete**.

------------------------------------------------------------------------

## 5. Row Operations

Configured rows can be:

-   Edited
-   Deleted
-   Duplicated
-   Reordered using drag and drop
-   Inserted/repositioned between other rows

Duplicating a row creates an exact copy directly below the source row.

Duplicates are allowed. For example, two transfers of 500 Wood are valid
if the available Wood balance can cover both.

After any edit, delete, duplicate, insertion, or reorder:

1.  Recalculate the plan.
2.  Revalidate rows from top to bottom.
3.  Update estimated/calculated values.
4.  Update row status.
5.  Update overall plan status.
6.  Update Save/Execute button states.

The displayed row order is the execution order and must be persisted.

Rows can only be reordered before execution. While an execution is
running, its immutable execution snapshot is unaffected by editor
changes.

------------------------------------------------------------------------

## 6. Common Row Concepts

Where applicable, resource selectors should use the application's
existing resource icons/select-list UI.

Display the current relevant resource balance for source regions.

### Amount types

Two amount types can exist:

-   `%` --- percentage
-   `Abs` --- absolute

Percentages:

-   Must be whole integers.
-   Minimum: 1%.
-   Maximum: 100%.
-   Represent a percentage of the currently owned source resource.
-   Store the percentage instruction itself in the database, not only
    its calculated absolute value.

Absolute input amounts:

-   Must be whole integers.
-   Minimum: 1.

Calculated outputs may be fractional.

Examples:

-   100 Wood may result in 103.49 Grain.
-   Pooling 100 Wood may require 22.35 DEC.

Use the application's existing precision/rounding rules for calculated
results.

------------------------------------------------------------------------

## 7. Transfer Row

Fields:

1.  Action = Transfer
2.  From Region
3.  Resource
4.  Current stored resource balance in From Region
5.  To Region
6.  Amount Type: `%` or `Abs`
7.  Amount (spent from the source — see §0.5)
8.  Estimated amount received in To Region (`computeSwapAmounts`; a
    transfer pays the trade-hub fee, so this is lower than the amount
    sent)
9.  Validation indicator

Rules:

-   From Region and To Region cannot be the same.
-   Amount must be at least 1.
-   Percentage must be an integer from 1--100.
-   Percentage is calculated from the current owned resource balance in
    the From Region.
-   The action consumes the source resource for plan validation.
-   The destination result is **not** added to the validation balance of
    the destination region.
-   Show amount/resource in an error state when the available validation
    balance is insufficient.
-   Show a green check when valid.

------------------------------------------------------------------------

## 8. Pool Row

Fields:

1.  Action = Pool
2.  From Region
3.  Resource
4.  Current resource balance in From Region
5.  Amount Type: `%` or `Abs`
6.  Amount
7.  Automatically calculated estimated DEC requirement/result
8.  Validation indicator

Rules:

-   Amount must be at least 1.
-   Percentage must be an integer from 1--100.
-   Percentage is based on the currently owned source resource.
-   Reuse the existing Pool calculation logic.
-   Reuse existing minimum amounts, safety margins, and other Pool
    business rules.
-   The row is invalid if the source resource is insufficient.
-   The row is invalid if the required global DEC balance is
    insufficient.
-   DEC required by the row must be consumed in the plan's temporary
    validation balance.
-   Do not treat any output/result from the Pool action as available to
    subsequent rows.
-   Show a green check only when valid.

------------------------------------------------------------------------

## 9. Buy Row

Buy supports **absolute amounts only**.

Fields:

1.  Action = Buy
2.  To Region
3.  Resource
4.  Absolute amount to receive
5.  Automatically calculated estimated DEC cost
6.  Validation indicator

Rules:

-   No percentage option for Buy.
-   Amount must be a whole integer of at least 1.
-   The amount represents how much resource the user wants to receive.
-   Resource is bought directly into the selected region.
-   If resources are required in multiple regions, the user creates
    multiple Buy rows.
-   Reuse the existing Buy calculation/action logic.
-   Reuse existing minimum amounts, pricing, safety margins, and other
    business rules.
-   The row is invalid if the available global DEC validation balance
    cannot cover the calculated cost.
-   DEC consumed by earlier rows must be considered.
-   Bought resources are **not** added to the validation resource
    balance for later rows.
-   Show a green check only when valid.

------------------------------------------------------------------------

## 10. Sell Row

Fields:

1.  Action = Sell
2.  From Region
3.  Resource
4.  Current resource balance in From Region
5.  Amount Type: `%` or `Abs`
6.  Amount
7.  Automatically calculated estimated DEC received
8.  Validation indicator

Rules:

-   Amount must be at least 1.
-   Percentage must be an integer from 1--100.
-   Percentage means the percentage of the currently owned resource in
    that region to sell.
-   Reuse the existing Sell calculation/action logic.
-   Selling consumes the source resource in the temporary validation
    balance.
-   DEC received from a Sell action goes to the account's global DEC
    balance as normal.
-   However, estimated DEC received from Sell must **not** be added to
    the temporary validation DEC balance for later plan rows.
-   Show a green check only when valid.

------------------------------------------------------------------------

## 11. Swap Row

Example:

> Swap 100 Grain from Region X into an estimated 700 Wood in Region Y.

Fields:

1.  Action = Swap
2.  From Region
3.  From Resource
4.  Current From Resource balance
5.  Amount Type: `%` or `Abs`
6.  Input amount
7.  To Resource
8.  Automatically calculated estimated output amount
9.  To Region
10. Validation indicator

Rules:

-   From Resource and To Resource cannot be the same.
-   Amount must be at least 1.
-   Percentage must be an integer from 1--100.
-   Percentage is based on the currently owned From Resource in the From
    Region.
-   Reuse the existing Swap calculation code.
-   Reuse all existing Swap minimum amounts, safety margins, rates, and
    business rules.
-   Calculated output may be fractional.
-   The source resource is consumed in the temporary validation balance.
-   The calculated destination resource is **not** added to the
    validation balance for subsequent rows.
-   Show a green check only when valid.

------------------------------------------------------------------------

## 12. Validation Model

### Core principle

Keep validation simple.

Start from a temporary copy/ledger of the **current balances supplied by
the calling component**.

Validate rows sequentially from top to bottom.

For each row:

1.  Resolve its current absolute requirement.
2.  Check the required source resource and/or DEC against the temporary
    validation balance.
3.  If valid, subtract what that action consumes from the temporary
    validation balance.
4.  Continue to the next row.
5.  Never add the expected output of an action back into the temporary
    balance.

This makes execution order relevant to validation without creating
dependencies between transaction results.

### Example: aggregate resource consumption

Current Region A balance:

-   Wood = 100,000

Plan:

1.  Transfer 60,000 Wood from A to B
2.  Sell 60,000 Wood from A

Validation:

-   Row 1: valid; temporary A/Wood becomes 40,000.
-   Row 2: invalid; it requires 60,000 but only 40,000 remains in the
    plan validation ledger.
-   Overall plan: invalid.

The UI should therefore show Row 2 as invalid, not merely mark the plan
invalid at the end.

### Example: percentage plus absolute

Current Region A Wood:

-   100,000

Plan:

1.  Transfer 50% Wood A → B
2.  Transfer 50,000 Wood A → C

Resolve:

-   Row 1 = 50,000.
-   Temporary remaining balance = 50,000.
-   Row 2 = 50,000.
-   Plan is valid.

If Row 2 is changed to 50,001, Row 2 becomes invalid and the plan
becomes invalid.

### Do not use secondary effects

Current balances:

-   Region A Wood = 100,000
-   Region B Wood = 0

Plan:

1.  Transfer 50,000 Wood A → B
2.  Transfer 20,000 Wood B → C

Row 2 remains invalid.

The Wood arriving in Region B from Row 1 (~45,000 after the trade-hub
fee — see §0.5) must **not** be considered available to Row 2.

The same principle applies to:

-   Bought resources
-   Swap output resources
-   Transfer destinations
-   DEC received from Sell
-   Any other result/output of a plan action

A user who needs resources directly in multiple regions should configure
separate actions that are valid against the balances that currently
exist.

------------------------------------------------------------------------

## 13. Percentage Calculation

Percentage is per action, based on the current owned source balance.

Example:

Current Region A Wood = 100,000.

A row containing:

> Transfer 50% Wood

resolves to 50,000 Wood when evaluated.

Importantly, the stored percentage does not change simply because an
earlier row consumes the same resource.

Validation still occurs sequentially against the temporary ledger.

Example:

1.  Transfer 60% Wood from A
2.  Sell 50% Wood from A

With an original balance of 100,000:

-   Row 1 resolves to 60,000 and consumes 60,000.
-   Row 2's percentage instruction resolves from the current
    owned/source balance according to the plan's percentage calculation
    (50,000).
-   Only 40,000 remains in the temporary validation ledger.
-   Row 2 is invalid.

Do not reinterpret Row 2 as "50% of the remaining 40,000."

------------------------------------------------------------------------

## 14. Recalculation

Recalculate automatically:

-   When the dialog opens.
-   When a saved plan is loaded.
-   When a row field changes.
-   When a row is added.
-   When a row is deleted.
-   When a row is duplicated.
-   When rows are reordered.
-   Immediately before execution.

No manual Refresh/Recalculate button is required.

The dialog owns its balance snapshot (§0.3). Recalculation between edits
is pure and runs against that snapshot — no refetch per keystroke. Refetch
only on dialog open, on explicit plan load, and immediately before
execution (with `force = true` on that last call, matching
`getBulkRegionData(uids, !planOnly)` in `useProcessResourcesAction`).

------------------------------------------------------------------------

## 15. Row and Plan Status

A completed row has all required fields filled.

A valid row:

-   Is complete.
-   Passes its action-specific business rules.
-   Has enough source resource/DEC according to sequential plan
    validation.
-   Passes existing minimum amount/safety-margin validation.

Display a green check for a valid row.

Invalid amounts/balances should use the application's existing error
styling, including red/error presentation where appropriate.

### Overall plan states

A plan may be:

-   Empty
-   Incomplete
-   Complete but invalid
-   Complete and executable
-   Dirty/modified
-   Executing

A partially configured row makes the plan incomplete.

The permanent final empty row does not make the plan incomplete.

------------------------------------------------------------------------

## 16. Save Behavior

There is no auto-save.

A plan can be saved only when:

-   It has a valid non-empty unique name.
-   It contains at least one completed row.
-   There is no partially configured/incomplete row.

A plan **may be saved even when its completed rows are currently
invalid**.

This is intentional: saved plans may become valid/invalid as balances
change.

Saving an existing plan overwrites/updates that plan rather than
creating a version history.

Changes to a loaded saved plan make the editor dirty.

Provide a **Save Only** action when there are unsaved changes and the
plan satisfies the save requirements.

------------------------------------------------------------------------

## 17. Execute Behavior

A plan can be executed without being saved.

Execution is allowed only when:

-   There is at least one configured row.
-   There are no incomplete rows.
-   Every configured row is valid.
-   Every row has a green check.
-   The complete plan is executable against the current validation
    state.

When Execute is disabled, provide a useful reason in the UI (for example
via helper text/tooltip/error state) rather than leaving the user to
guess why.

### Unsaved changes dialog

When the user executes a dirty/unsaved plan, provide these choices:

-   **Cancel**
-   **Save Only** --- enabled when save requirements are satisfied and
    changes exist.
-   **Execute without saving** --- enabled only when the plan is valid
    and executable.
-   **Save & Execute** --- enabled only when the plan is saveable,
    valid, and executable.

Save & Execute should save silently and then execute.

------------------------------------------------------------------------

## 18. Immutable Execution Snapshot

Immediately before execution:

1.  Recalculate the complete plan.
2.  Revalidate the complete plan.
3.  Resolve every percentage instruction to its absolute amount.
4.  Resolve required calculated values using the existing
    calculation/action logic.
5.  Create an immutable execution snapshot containing absolute actions.
6.  Submit that snapshot for execution.

Example saved row:

> Transfer 50% Wood from Region A to Region B

The database continues to store:

> 50%

At execution time, if the applicable current balance resolves that
instruction to 50,000 Wood, the execution snapshot contains:

> Transfer 50,000 Wood from Region A to Region B

Once execution starts, changes made in the editor must not alter the
running execution snapshot.

------------------------------------------------------------------------

## 19. Transaction Execution

Reuse the existing Process Resource/action execution patterns.

All rows in the validated execution snapshot are fired/submitted for
execution.

Do **not** implement row-to-row success dependencies.

Specifically:

-   Row 2 does not wait for Row 1 to succeed as a business dependency.
-   A failure does not roll back successful actions.
-   Do not implement plan-level transaction rollback.
-   Do not automatically retry only failed rows.
-   Collect successful and failed transactions using the application's
    existing transaction handling.
-   Wait for actions to be confirmed and verified using the same
    behavior already implemented for the other resource action
    buttons/dialogs (`broadcastOperations` → `waitForTransactions`).
-   Show results/failures in the existing **Today panel**, as other
    resource actions already do.

### Batching

Ops are chunked at `MAX_OPS_PER_BROADCAST = 4` with one Keychain popup
per chunk (§0.7). Submit rows in plan order so the chunk boundaries
follow the displayed order. A user-rejected or failed chunk stops the
run and leaves earlier chunks broadcast — report which rows were
submitted and which were not, and do not roll back.

### Today-panel reporting

Reuse `recordPostHarvestLog(username, actions, txIds)` and the existing
`LandPostHarvestLog` / `PostHarvestSection`, since Custom Plan *is* a
Process Resource strategy. Two extensions are needed in
`src/types/landManager.ts`:

-   Add `"transfer"` to `PostHarvestActionSummary["type"]` (currently
    `sell_for_dec | add_to_pool | buy_resource | swap_resource`).
-   Add optional `to_region_uid` and `to_symbol` so transfer and swap
    rows can report both ends. (`to_symbol`/`to_resource_amount` already
    exist for `swap_resource`.)

Existing merge logic keys on `(type, region_uid, symbol)`; extend the key
with `to_region_uid` so two transfers of the same resource to different
regions do not collapse into one line.

If a transaction unexpectedly fails despite pre-validation, use the
application's existing transaction-failure/verification behavior.

Balance changes occurring between validation and blockchain/transaction
execution are an accepted low-probability risk. Do not over-engineer
locking or dependency handling for this feature.

Trigger reload invalidate caches after fail or success.

------------------------------------------------------------------------

## 20. Editor During Execution

Follow existing Process Resource UI behavior for in-progress
buttons/actions.

The editor does not need to be globally locked solely because a plan is
executing.

However:

-   The submitted execution snapshot is immutable.
-   Editing the displayed plan after execution begins has no effect on
    the running transactions.
-   Reordering only affects future executions.
-   Existing loading/progress states should be reused.

------------------------------------------------------------------------

## 21. Database Design

Prisma, `prisma/schema.prisma`, snake_case `@@map` names matching the
existing `land_*` tables. Access exclusively through the Prisma client
from `"use server"` action modules under
`src/lib/backend/actions/land-manager/`, with the owning player resolved
from `getAuthStatus()` — never from a client argument (§0.1). Prisma is
parameterized by construction; no raw SQL for this feature.

```prisma
model LandCustomPlan {
  id         String               @id @default(uuid())
  player     String
  name       String
  sort_order Int                  @default(0)
  created_at DateTime             @default(now())
  updated_at DateTime             @updatedAt
  items      LandCustomPlanItem[]

  @@unique([player, name])
  @@index([player, sort_order])
  @@map("land_custom_plan")
}

model LandCustomPlanItem {
  id              String         @id @default(uuid())
  plan_id         String
  sequence        Int
  action_type     String         // transfer | pool | buy | sell | swap
  from_region_uid String?
  to_region_uid   String?
  from_resource   String?
  to_resource     String?
  amount_type     String         // pct | abs
  amount          Int
  plan            LandCustomPlan @relation(fields: [plan_id], references: [id], onDelete: Cascade)

  @@unique([plan_id, sequence])
  @@index([plan_id, sequence])
  @@map("land_custom_plan_item")
}
```

Notes:

-   `@@unique([player, name])` enforces §2's name rule at the database
    level; surface the constraint violation as a field error, never as a
    silent overwrite.
-   `@@unique([plan_id, sequence])` makes acceptance criterion 38
    structural — persisted order *is* display and execution order.
    Rewrite the full item set on save (delete + recreate inside one
    `prisma.$transaction`) so reorders cannot leave gaps or collisions.
-   `sort_order` gives the deterministic default-plan selection §3
    requires; `is_default` is unnecessary — the lowest `sort_order`
    wins.
-   `amount` is `Int`: both `%` (1–100) and `Abs` (≥1) are whole
    integers per §6. Only *calculated* values are fractional, and none
    are persisted.
-   `onDelete: Cascade` covers plan deletion; the 5-plan cap (§0.8) is
    enforced in the action, not the schema.
-   Region references are `region_uid` strings (§0.9). Resource symbols
    reuse the existing `NATURAL_RESOURCES` values (§0.6).

Do not persist transient UI values unnecessarily.

In particular, calculated values such as:

-   current balance
-   resolved percentage amount
-   estimated swap output
-   estimated DEC

should normally be recalculated from current application state/existing
calculation logic when the plan is opened, edited, or executed.

Use the existing resource identifiers/types rather than introducing
duplicate string representations if the application already has
enums/IDs.

The exact schema may be adapted to existing project conventions.

------------------------------------------------------------------------

## 22. Reuse Existing Code

This feature is an orchestration layer around functionality that already
exists.

Before implementing new business logic, locate and reuse the existing
implementations for:

-   Transfer
-   Pool
-   Buy
-   Sell
-   Swap
-   Resource selection
-   Region selection
-   Resource balances
-   Global DEC balance
-   Swap estimates
-   Pool estimates
-   Buy/Sell estimates
-   Minimum amounts
-   Safety margins
-   Transaction creation/submission
-   Transaction confirmation
-   Transaction verification
-   Transaction failure handling
-   Today-panel result reporting
-   Existing Process Resource progress/loading behavior

Avoid creating a second implementation of these rules inside Custom
Plan.

Where necessary, extract existing logic into shared pure/helper
functions so both the existing single-action UI and Custom Plan use the
same calculations and validation.

------------------------------------------------------------------------

## 23. Suggested Validation Architecture

Prefer a small deterministic plan-validation function rather than
embedding cross-row calculations directly in UI components.

Conceptually:

``` text
validatePlan(plan, currentBalances, globalDecBalance):
    validationBalances = copy(currentBalances)
    validationDec = globalDecBalance

    for row in plan.rows in sequence:
        resolved = resolveRow(row, currentBalances)

        result = validateRow(
            resolved,
            validationBalances,
            validationDec,
            existingBusinessRules
        )

        attach result to row

        if result.valid:
            subtract consumed source resources
            subtract consumed DEC
            // DO NOT add outputs/resources/DEC produced by the action

    return rowResults + overallPlanStatus
```

Important distinction:

-   `currentBalances` are used to resolve stored percentage
    instructions.
-   `validationBalances` track how much of those balances earlier rows
    have already reserved/consumed.

This distinction prevents a percentage from accidentally becoming a
percentage of the remaining plan balance.

Keep this function free of transaction side effects so it can run after
every edit/reorder.

------------------------------------------------------------------------

## 24. Acceptance Criteria

The feature is complete when at minimum:

1.  Custom Plan appears as a Process Resource strategy.
2.  The dialog can create a new named plan.
3.  Multiple named plans can be saved per store.
4.  Plan names are unique per store.
5.  Saved plans can be loaded, renamed, updated, and deleted.
6.  Deletion requires confirmation.
7.  Deleting the final saved plan returns to an empty new plan.
8.  Transfer, Pool, Buy, Sell, and Swap rows are supported.
9.  Buy only accepts absolute amounts.
10. Transfer, Pool, Sell, and Swap support integer percentage or integer
    absolute input.
11. Amount/percentage zero is rejected; minimum is 1.
12. Percentage cannot exceed 100%.
13. Swap cannot use the same From and To resource.
14. Transfer cannot use the same From and To region.
15. Existing calculation/business/safety-margin logic is reused.
16. Calculated outputs may contain fractional values.
17. Rows validate sequentially against a temporary resource/DEC ledger.
18. Earlier rows consume resources/DEC available to later rows.
19. Action outputs are never added to the validation ledger.
20. A transfer into a currently empty region cannot make a later
    transfer out of that region valid.
21. Percentage instructions resolve from the current owned/source
    balance, not the remaining temporary plan balance.
22. Reordering immediately recalculates/revalidates the plan.
23. Invalid rows clearly identify the problem and invalidate execution.
24. A permanent empty final row exists and is not persisted.
25. A partially entered row makes the plan incomplete.
26. Incomplete plans cannot be saved or executed.
27. Complete but invalid plans may be saved but not executed.
28. Valid plans may be executed without saving.
29. Dirty plans provide Cancel, Save Only, Execute without saving, and
    Save & Execute as applicable.
30. Disabled execution actions explain why execution is unavailable.
31. Percentages are stored as percentages in saved plans.
32. Immediately before execution, the plan is recalculated and
    revalidated.
33. Execution uses an immutable snapshot with absolute resolved amounts.
34. Editing after execution begins cannot modify submitted actions.
35. All plan rows are submitted using existing transaction execution
    behavior.
36. Successful actions are not rolled back because another action fails.
37. Existing confirmation/verification and Today-panel reporting are
    reused.
38. Database ordering exactly represents displayed/execution ordering.
39. Database access is parameterized/ORM-based and safe from SQL
    injection.
40. Existing action logic is shared rather than duplicated.
41. Plans are owned by the session's player, resolved server-side; a
    client cannot read or write another player's plans.
42. At most 5 saved plans per player; the 6th save attempt shows a
    validation error naming the limit.
43. The validation ledger and every percentage base use stored balances
    only; ready (unharvested) resources are never spendable by a row.
44. Only GRAIN, WOOD, STONE and IRON are selectable.
45. Transfer and Swap rows display the estimated received amount, net of
    the trade-hub fee.
46. Before execution the user is told how many Keychain signatures the
    plan requires.
47. A rejected or failed broadcast chunk reports which rows were
    submitted and which were not, without rollback.
48. Run build and format:all fix outstanding issues
49. update current unreleased version in the changelog and add the information about the new features (short and concise)

------------------------------------------------------------------------

## 25. Out of Scope / Do Not Over-Engineer

Unless required by existing architecture, do **not** add:

-   Dependencies where one row waits for another row's output.
-   Virtual credit for resources produced by earlier rows.
-   Virtual credit for DEC produced by Sell.
-   Plan-level transaction rollback.
-   Automatic failed-row retry.
-   Plan version history.
-   Auto-save.
-   Complex multi-user/concurrent-edit locking.
-   Manual recalculation buttons.
-   Percentage Buy.
-   A new implementation of existing resource transaction logic.

The goal is a simple, predictable plan orchestrator over the
application's already implemented resource actions.
