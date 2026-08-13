# Feature request: Harvestable strategy for withdrawing from pool

Please review the current branch and implement a new strategy for the land/resource automation flow.
Entry point src/app/land-manager/harvest/page.tsx

## Goal

Add a new strategy that tries to make a resource **harvestable** by withdrawing from the pool first.
make_harvestable_strategies     String[] @default(["transfer", "swap", "buy_dec"])
add pool
make_harvestable_strategies     String[] @default(["pool", "transfer", "swap", "buy_dec"])
update default in code as well

pool become the first because that will be the cheapest when you have resource in the pool for more then 30 you evade the 10% tax that there is with transfer swap and buy

* The new **Make Harvestable / Withdraw from Pool** strategy should run first (or the user can switch around as they can now)

The idea is:

1. Try to withdraw enough resource from the pool so the resource becomes harvestable.
2. If that is not possible, continue with the next strategy.
3. Keep this behavior in both:

   * dry run
   * actual execution

---

## Withdrawal strategy behavior

When this strategy is enabled, it should attempt to withdraw from the pool using a percentage-based share calculation.

The amount to withdraw is based on the amount of resource needed, so we need to calculate the percentage of pool shares that correspond to the needed withdrawal.

### Important constraints

Only the portion that is **unlockable** can be used (the amount that is longer than 30 days in the pool).

Use this API to inspect the pool status:

```text
https://vapi.splinterlands.com/land/liquidity/pools/<player>/<resource>
```

Example:

```text
https://vapi.splinterlands.com/land/liquidity/pools/beaker007/WOOD
```

Example response:

```json
{
  "status": "success",
  "data": {
    "single": [
      {
        "player": "beaker007",
        "token": "DEC-WOOD",
        "balance": 65435.447
      },
      {
        "player": "beaker007",
        "token": "VESTING-WOOD",
        "balance": "11023.175"
      }
    ]
  }
}
```

### Pool lock rule

The amount under 30 days cannot be used.

This locked portion is:

```text
vesting-wood / dec-wood * 100
```

That represents the percentage that is still locked and therefore not withdrawable without penalty.

So:

* do **not** use that locked percentage for withdrawal;
* only withdraw from the unlockable portion;
* be careful about the extra 10% penalty for locked or unharvestable funds.

Please make sure this is handled correctly.

---

## Transaction operation

This is the withdrawal operation to use:

```json
{
  "operations": [
    [
      "custom_json",
      {
        "required_auths": [],
        "required_posting_auths": ["beaker007"],
        "id": "sm_land_operation",
        "json": "{\"op\":\"remove_liquidity\",\"region_uid\":\"PR-CEF-85\",\"resource_amount\":0,\"dec_amount\":0,\"shares_out\":0.001,\"resource_symbol\":\"WOOD\",\"app\":\"splinterlands/0.7.60\",\"n\":\"WLWMeNgJc2\"}"
      }
    ]
  ],
  "ref_block_num": 45351,
  "ref_block_prefix": 3367926922,
  "expiration": "2026-08-10T11:41:57",
  "extensions": [],
  "signatures": [
    "2021f960693c3a8f255f0552bbdfe625c9aa947c88f13659222fc38c5b1fab77c3515b2aa2875a2b3c63ceb427870ee672311b727527a049ec4eb2c700ecf66a3a"
  ]
}
```

Please generate the correct payload dynamically.

---

## Validation / transaction lookup

This transaction lookup structure is relevant for validating the result:

```json
{
  "trx_info": {
    "id": "0b8f30b8fcbca29224430fd579fafb373ce4243a",
    "block_id": "067db1305cb7c0567e17c26d4cbb4fded3c2e62c",
    "prev_block_id": "067db12faa2da2b31b083f34d2d63a8905b7141e",
    "type": "land_operation",
    "player": "beaker007",
    "data": "{\"op\":\"remove_liquidity\",\"region_uid\":\"PR-CEF-85\",\"resource_amount\":0,\"dec_amount\":0,\"shares_out\":0.001,\"resource_symbol\":\"WOOD\",\"app\":\"splinterlands/0.7.60\",\"n\":\"WLWMeNgJc2\"}",
    "success": true,
    "error": null,
    "block_num": 108900656,
    "created_date": "2026-08-10T11:32:21.000Z",
    "result": "{\"success\":true,\"result\":{\"success\":true,\"error\":\"\",\"balanceHistory\":[{\"player\":\"beaker007\",\"token\":\"DEC\",\"balance_end\":641336.45}],\"data\":{\"resource\":\"WOOD\",\"resource_amount\":1187.442,\"dec_amount\":28.629,\"region_uid\":\"PR-CEF-85\",\"region_name\":\"Xiang Pho\",\"dec_fee\":0,\"resource_fee\":0,\"external_withdrawal_id\":null,\"external_withdrawal_required\":false,\"external_withdrawal_token\":null,\"external_withdrawal_amount\":null,\"external_withdrawal_player\":null,\"external_transfer_account\":null}}}",
    "steem_price": null,
    "sbd_price": null
  }
}
```

Please make sure the execution flow validates withdrawal success correctly and refreshes any affected data after the transaction completes.
Take a look on the make harvestable transfer resource flow for the handling of transactions

---

## New alert rule (to Overall land manager alert panel)

This strategy is important because we want to keep enough resource in the pool to stay harvestable (with this strategy).

### Alert condition

When this strategy is enabled, show an alert if the player has **less than 5 weeks worth of resource** in the pool. resource that are needed for consume

I am not completely sure whether the weekly unlock cadence needs to be taken into account more explicitly, so please review that logic carefully and implement the best practical version.

The warning should help the user understand that the pool balance is getting too low to remain safely harvestable.

---

## Second strategy: Top Up Pools (post-processing resource action)

Add a new one-click post-processing action that maintains a rolling resource buffer in the liquidity pools.
You should be able to exclude one or more resource from this strategy (like in the other post processing i assume it will be a new part in the configuration part of the land manager)

### Goal

Resources deposited into a pool need to remain there for at least 30 days before they can be withdrawn without the 10% penalty.

This strategy is designed to be executed **once per week**, preferably on approximately the same day each week.

Each execution should add approximately one week's future resource consumption to the pools. Over time this creates a rolling pipeline of liquidity where older deposits continuously become unlockable and can later be used by the **Make Harvestable / Withdraw from Pool** strategy without paying the 10% penalty.

The user may execute the strategy more frequently than once per week. This is allowed, but each execution will perform another weekly top-up and can therefore result in more resource being stored than necessary.

Executing it less frequently than once per week can create a gap in the rolling 30-day liquidity pipeline and increase the risk that insufficient unlocked resource is available when it is needed.

The UI/dry run should make this behavior clear to the user:

> This strategy is intended to be run once per week, preferably on approximately the same day each week. Running it more frequently will add additional resource to the pools. Running it less frequently may reduce the available tax-free resource buffer.

### Weekly target

For each resource calculate:

```text
weekly_target = weekly_resource_consumption * 1.10
```

The additional 10% is a safety margin.

`weekly_resource_consumption` should represent the application's calculated consumption rate normalized to 7 days.

Do not derive the target from a hard-coded assumption about how often the user harvests.

The target represents the amount of resource that should actually be added to the pool during **this execution**.

For example:

```text
WOOD weekly consumption: 1,000
Safety margin: 10%
WOOD target this execution: 1,100
```

This is an incremental weekly top-up.

Do **not** interpret the target as:

```text
total_pool_balance should equal weekly_target
```

If the player already has several weeks of WOOD stored in the pool, this execution should still add another 1,100 WOOD.

The purpose is to continuously replenish the rolling liquidity pipeline.

---

### Multiple resources and regions

The system supports multiple resources across multiple regions.

Resources are region-specific and the required weekly target for a resource may need to be fulfilled using resource balances from multiple regions.

DEC is **account-wide**, not region-specific.

Therefore:

- process each resource independently;
- inspect all eligible regions containing that resource;
- use the player's single account-level DEC balance when planning liquidity additions;
- allow one resource target to result in multiple pool-add operations from different regions;
- do not assume that the complete target can be supplied by one region.

Example:

```text
WOOD weekly target: 1,100

Available resource:
Region A: 600 WOOD
Region B: 300 WOOD
Region C: 500 WOOD

Planned additions:
Region A -> 600 WOOD + required DEC
Region B -> 300 WOOD + required DEC
Region C -> 200 WOOD + required DEC

Total WOOD added: 1,100
```

These operations should be presented as one logical **WOOD top-up**, even when execution requires multiple pool-add transactions.

Use the existing region/resource/pool selection logic in the application wherever possible rather than introducing a separate model for determining which regions can supply a resource.

---

### Funding the liquidity additions

Adding resource to a pool requires:

```text
X resource + Y DEC
```

The strategy must calculate the complete plan before execution.

The DEC requirement must be calculated based on the actual pool/liquidity mechanics already used by the application.

Because DEC is account-wide, maintain one shared projected DEC balance while planning all resource and region operations.

The planner must not accidentally allocate the same DEC to multiple planned operations.

Prefer operations that avoid the 10% transfer/swap tax whenever possible.

#### Case 1 — Enough resource and enough account DEC

If sufficient resource is available across the eligible regions and the account has enough DEC to fund the target:

- use the available resources;
- use existing account DEC;
- create the required pool-add operations;
- do not perform an unnecessary resource sale/swap.

This is the preferred path because no taxed conversion is required.

#### Case 2 — Enough resource but insufficient DEC

If sufficient resource exists but the account does not contain enough DEC, calculate whether part of the resource can be sold/swapped to obtain the missing DEC.

Do not sell a fixed percentage.

Calculate the **minimum resource amount that must be converted**.

The calculation must account for:

- DEC currently available on the account;
- DEC required for the planned liquidity additions;
- the 10% tax/cost of obtaining DEC;
- resource consumed by the conversion;
- resource that must remain afterward for the liquidity additions.

The important condition is:

```text
resource before conversion
    - resource sold for DEC
    >= resource required for planned pool addition
```

and:

```text
existing DEC
    + net DEC received from conversion
    >= DEC required for planned pool additions
```

Only perform the conversion when both conditions can be satisfied.

#### Case 3 — Insufficient resource but sufficient DEC

If there is insufficient resource across the eligible regions but sufficient account DEC is available, determine whether the missing resource can be purchased using DEC through the existing application functionality.

Account for the applicable 10% tax/cost.

Only include the purchase when the resulting resource and DEC balances are sufficient to create the intended liquidity position.

#### Case 4 — Target cannot be funded

If the complete weekly target cannot be funded, do not perform unexpected conversions or silently treat a partial top-up as successful.

Skip that resource and clearly report why it could not be completed.

---

### Planning across resources

The action can process multiple resources in one execution.

For example:

```text
WOOD target:  1,100
STONE target:   850
GRAIN target: 1,400
```

Because DEC is shared across the account, planning one resource can affect whether another resource can be funded.

Therefore calculate the **complete top-up plan across all resources before executing transactions**.

The planner should maintain projected balances as operations are added:

```text
projected account DEC
projected resource balance per region
```

Each planned conversion or liquidity addition must update these projected balances.

Do not plan each resource independently against the same starting DEC balance.

If available DEC cannot fund every resource, produce a deterministic plan using the existing resource processing/order conventions in the application.

Clearly show resources that cannot be funded.

---

### Dry run

Dry run and actual execution must use the **same planning logic**.

The dry run should make it easy to understand exactly what the one-click action intends to do.

Group operations by resource and show the individual regions involved.

Example:

```text
WOOD

Weekly consumption: 1,000 WOOD
Target this execution: 1,100 WOOD

Available account DEC: 145 DEC

Planned additions:
  Region A: 600 WOOD + 14.2 DEC
  Region B: 300 WOOD + 7.1 DEC
  Region C: 200 WOOD + 4.8 DEC

Resource conversion: none
Estimated tax: 0

Total pool addition:
  1,100 WOOD
  26.1 DEC

Result: READY
```

When DEC needs to be generated:
Important in this case for the actual implementation the sell needs to be done first (Wait to be fully processed before next step add to pool)

```text
STONE

Weekly consumption: 800 STONE
Target this execution: 880 STONE

DEC required: 31.5 DEC
Projected DEC available: 12.0 DEC
Missing DEC: 19.5 DEC

Plan:
  Sell: X STONE
  Estimated tax: Y STONE
  Net DEC received: 19.5 DEC

Planned additions:
  Region D: ... STONE + ... DEC
  Region E: ... STONE + ... DEC

Total pool addition:
  880 STONE
  31.5 DEC

Result: READY
```

When the target cannot be achieved:

```text
IRON

Weekly consumption: 1,000 IRON
Target this execution: 1,100 IRON

Available resource: 1,050 IRON
Projected account DEC: 12 DEC
Required DEC: 27.4 DEC

Result: SKIPPED

Reason:
Insufficient DEC. Selling IRON to obtain the missing DEC would leave insufficient IRON to complete the 1,100 IRON target.
```

The actual execution should execute the same operations produced by the planner.

Do not independently calculate a different strategy during actual execution unless refreshed balances make the existing plan invalid. In that situation, invalidate/recalculate the affected plan rather than executing against stale balances.

---

### Pool safety warning

Add a simple warning to the Overall Land Manager alert panel when the resource stored in the pool falls below the recommended safety buffer.

Default safety buffer:

```text
safe_pool_buffer = weekly_resource_consumption * 5
```

Example:

> **Warning:** WOOD pool reserves are below the recommended 5-week consumption buffer. Top up the pool to maintain tax-free harvesting.

Keep the user-facing warning simple.
Only when the top up strategy is selected (a user might have disabled it)

The underlying calculation should use the existing pool data and distinguish where necessary between:

- total resource represented by the player's pool position;
- resource still within the 30-day lock period;
- resource that is currently unlockable without penalty.

The purpose of the warning is to indicate that the rolling pipeline is becoming too small, not to prevent execution.

---

### Relationship with Make Harvestable

**Top Up Pools** and **Make Harvestable / Withdraw from Pool** should work as two sides of the same rolling-buffer strategy:

```text
Harvest / process resources
        |
        v
Resources are consumed
        |
        v
Top Up Pools
Add ~110% of weekly consumption
        |
        v
New liquidity enters 30-day lock
        |
        v
Run Top Up Pools again next week
        |
        v
Rolling deposits mature over time
        |
        v
Older liquidity becomes tax-free
        |
        v
Make Harvestable can withdraw
matured liquidity when required
```

The implementation should preserve this rolling pipeline rather than trying to maintain a static pool balance.

---

### Execution requirements

The strategy must:

- support both dry run and actual execution;
- calculate the complete plan before submitting transactions;
- support multiple resources;
- support multiple regions contributing the same resource;
- treat DEC as one shared account-level balance;
- prevent the same projected DEC from being allocated more than once;
- prefer existing DEC over unnecessary taxed conversions;
- calculate the minimum conversion necessary when DEC is missing;
- account for the 10% tax/cost when conversions are required;
- generate multiple pool-add operations when multiple regions are needed;
- validate each transaction result;
- update projected balances during execution;
- refresh affected resource, pool, and account balance data after successful transactions;
- clearly report partial transaction failures;
- produce clear dry-run output grouped by resource;
- reuse the existing strategy pipeline, transaction handling, region/resource selection, caching, and error-handling patterns where possible.

---

## Implementation notes

Please make the strategy part of the existing execution order in a way that is easy to understand and maintain.

The strategy should:

* use cached pool data where possible;
* respect locked/unlockable pool portions;
* calculate the withdraw amount based on needed percentage of shares;
* validate the transaction result;
* refresh the relevant state after success;
* produce clear dry-run output.

---

## Final steps

Before finishing, please:

* run `build`
* run `format:all`
* fix all outstanding issues
* update the release notes or changelog
