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

This is a **separate action** from Make Harvestable and Harvest:

```text
Make Harvestable
        |
        v
     Harvest
        |
        v
   Top Up Pools
```

The Top Up Pools action takes resource that is available after harvesting and adds it back into the liquidity pool together with the required amount of account-wide DEC.

A liquidity pool top-up requires both sides of the liquidity position:

```text
resource + equal-value DEC
```

“Equal-value” means the resource and DEC contribute the same value to the liquidity pool; it does **not** mean the numeric number of resource units must equal the numeric DEC amount.

The action should process the configured resources independently, while using the player's single account-wide DEC balance.

### Top Up Pool strategies

Top Up Pools must use the same **ordered preferred/fallback strategy model** that already exists for `make_harvestable_strategies`.

The player can:

- enable or disable individual Top Up Pool strategies;
- choose their order;
- use the first strategy as the preferred strategy;
- use later enabled strategies only as fallbacks when the earlier strategy cannot complete the full target.

A disabled strategy must never be used implicitly as a fallback.

The initial supported strategy names are:

```text
use_owned_dec
buy_resources
sell_resource
```

Example configuration:

```text
 top_up_pool_strategies = ["use_owned_dec", "buy_resources", "sell_resource"]
```

This means:

1. first try to use DEC already in the wallet and existing resource;
2. if that cannot complete the target, try to buy the missing resource while retaining enough DEC for the pool deposit;
3. if that still cannot complete the target, try selling additional resource to generate the DEC required for the pool deposit.

The player may remove any strategy from the list or reorder the remaining strategies.

For example:

```text
["use_owned_dec"]
```

means never buy resources and never sell resources to generate DEC. If the target cannot be funded with the currently owned resource and wallet DEC, skip that resource.

```text
["buy_resources"]
```

means acquire the missing resource through the buy-resource path. The purchase itself consumes DEC, so the planner must reserve enough DEC to both buy the missing resource and fund the equal-value DEC side of the pool deposit. If the complete target cannot be funded, skip.

```text
["sell_resource"]
```

means do not use existing wallet DEC for the pool top-up. Generate the DEC required for the top-up by selling resource, then add the full target amount to the pool. If the required amount cannot be generated while still leaving enough resource for the full pool deposit, skip.

The planner must treat the selected strategy order as a hard constraint. It must not silently switch to a disabled or later strategy unless the earlier enabled strategy has been determined to be unable to complete the full target.

### Strategy: `use_owned_dec`

Use resource that is already available to the player and use DEC already in the player's wallet to fund the equal-value DEC side of the pool deposit.

If the player has enough resource and enough wallet DEC for the complete target:

- use the available resource;
- use the required amount of existing account DEC;
- create the pool-add operation(s);
- do not buy or sell resource unnecessarily.

If either the resource or DEC requirement cannot be fully satisfied, this strategy fails for that resource and the planner moves to the next enabled fallback strategy.

### Strategy: `buy_resources`

Use this strategy when the player does not own enough of the resource needed for the full pool top-up.

The planner must calculate how much resource is missing and buy only the amount necessary to complete the target.

The purchase itself requires DEC, so the planner must account for the complete transaction economics:

- DEC currently available in the wallet;
- DEC required for the pool deposit;
- DEC required to purchase the missing resource;
- any existing application purchase costs/taxes;
- the resulting resource balance;
- the DEC that must remain available for the pool deposit.

The strategy may only proceed when both the resource purchase and the subsequent pool deposit can be fully funded.

Do not buy resource if the purchase would leave insufficient DEC for the corresponding pool deposit.

Do not perform a partial purchase/top-up and report it as success.

### Strategy: `sell_resource`

Use this strategy when additional DEC must be generated from resource in order to complete the pool top-up.

Because the pool requires an equal-value resource and DEC deposit, the planner must account for the fact that selling resource reduces the amount available to deposit.

The planner must calculate the **minimum amount of resource that must be sold** so that, after the sale and any applicable 10% cost/tax, enough DEC exists to fund the full equal-value DEC side of the pool deposit while enough resource still remains to fund the full resource side of the deposit.

In practical terms, this will commonly require selling approximately **2x the amount of resource represented by the missing DEC**, because roughly half of the available value must remain as resource for the pool deposit and the other half can be converted into DEC. The exact amount must be calculated from the actual conversion mechanics and applicable cost/tax, not from a hard-coded 2x multiplier.

The planner must satisfy both conditions:

```text
resource after sale
    >= resource required for pool addition
```

and:

```text
DEC after sale
    >= DEC required for pool addition
```

Only perform the sale when both conditions can be satisfied.

The actual execution order is important:

```text
SELL RESOURCE
      |
      v
WAIT / VALIDATE SALE RESULT
      |
      v
ADD RESOURCE + DEC TO POOL
```

The pool-add transaction must not be submitted before the resource sale has been fully processed and the resulting DEC balance has been confirmed.

### Weekly target

This strategy is designed to be executed **once per week**, preferably on approximately the same day each week.

Each execution should add approximately one week's future resource consumption to the pools. Over time this creates a rolling pipeline of liquidity where older deposits continuously become unlockable and can later be used by the Make Harvestable / Withdraw from Pool strategy without paying the 10% penalty.

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

Total added: 1,100 (WOOD) x (DEC)
```

These operations should be presented as one logical **WOOD top-up**, even when execution requires multiple pool-add transactions.

Use the existing region/resource/pool selection logic in the application wherever possible rather than introducing a separate model for determining which regions can supply a resource.

### Funding and fallback planning

The strategy planner must first calculate whether the preferred enabled strategy can complete the **entire weekly target** for a resource.

If it can, use that strategy and do not invoke later strategies.

If it cannot, move to the next enabled strategy and recalculate the resource plan using the projected balances at that point.

The planner must not combine two strategies for the same resource unless that is explicitly represented by separate strategy steps in the configured strategy list.

For example, with:

```text
["use_owned_dec", "buy_resources", "sell_resource"]
```

and insufficient owned resource:

```text
use_owned_dec -> cannot complete full target
buy_resources -> can complete full target
```

then execute `buy_resources` and stop. Do not also sell resource merely because selling would also be possible.

If no enabled strategy can complete the full target:

- skip that resource;
- do not perform partial or unexpected conversions;
- clearly report which strategies were attempted and why each one could not complete the target.

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

Each planned purchase, conversion, or liquidity addition must update these projected balances.

Do not plan each resource independently against the same starting DEC balance.

If available DEC cannot fund every resource, produce a deterministic plan using the existing resource processing/order conventions in the application.

Clearly show resources that cannot be funded.

### Dry run

Dry run and actual execution must use the **same planning logic**.

The dry run should make it easy to understand exactly what the one-click action intends to do.

Group operations by resource and show the individual regions involved.

Example:

```text
WOOD

Weekly consumption: 1,000 WOOD
Target this execution: 1,100 WOOD

Selected strategy: use_owned_dec

Available account DEC: 145 DEC

Planned additions:
  Region A: 600 WOOD + required DEC
  Region B: 300 WOOD + required DEC
  Region C: 200 WOOD + required DEC

Resource acquisition: none
Resource sale: none
Estimated tax: 0

Total pool addition:
  1,100 WOOD
  equal-value DEC

Result: READY
```

When `buy_resources` is selected:

```text
STONE

Weekly consumption: 800 STONE
Target this execution: 880 STONE

Selected strategy: buy_resources

Available STONE: 700
Missing STONE: 180

Plan:
  Buy: 180 STONE
  DEC required for purchase: X
  DEC required for pool addition: Y

Planned additions:
  Region D: ... STONE + ... DEC
  Region E: ... STONE + ... DEC

Result: READY
```

When `sell_resource` is selected:

```text
STONE

Weekly consumption: 800 STONE
Target this execution: 880 STONE

Selected strategy: sell_resource

Available STONE: X
Required pool resource: 880
DEC currently available: Y
DEC required for pool addition: Z
Missing DEC: Z-Y

Plan:
  Sell: minimum calculated STONE amount
  Estimated conversion cost/tax: Y STONE
  Net DEC received: enough to cover the missing DEC

Planned additions:
  Region D: ... STONE + ... DEC
  Region E: ... STONE + ... DEC

Result: READY
```

When the target cannot be achieved by any enabled strategy:

```text
IRON

Weekly consumption: 1,000 IRON
Target this execution: 1,100 IRON

Strategies:
  use_owned_dec -> FAILED: insufficient resource
  buy_resources -> FAILED: insufficient DEC for resource purchase + pool deposit
  sell_resource -> FAILED: selling enough IRON would leave less than 1,100 IRON for the pool

Result: SKIPPED
```

The actual execution should execute the same operations produced by the planner.

Do not independently calculate a different strategy during actual execution unless refreshed balances make the existing plan invalid. In that situation, invalidate/recalculate the affected plan rather than executing against stale balances.

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

### Relationship with Make Harvestable

**Top Up Pools** and **Make Harvestable / Withdraw from Pool** are separate actions that form opposite sides of a rolling-buffer strategy.

```text
Make Harvestable
        |
        v
     Harvest
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

Top Up Pools must not be implemented as part of the Make Harvestable action. They are separate actions and separate user configuration.

### Actual pool add action
example oeration

{"operations":[["custom_json",{"required_auths":[],"required_posting_auths":["beaker007"],"id":"sm_land_operation","json":"{\"op\":\"add_liquidity\",\"region_uid\":\"PR-CEF-85\",\"resource_amount\":1000,\"dec_amount\":23.222,\"shares_out\":0,\"resource_symbol\":\"WOOD\",\"app\":\"splinterlands/0.7.60\",\"n\":\"eJxmbz6vMc\"}"}]],"ref_block_num":64307,"ref_block_prefix":211574942,"expiration":"2026-08-13T10:24:18","extensions":[],"signatures":["1f13c9c19218827bb23090b23fe80ae618a96c191cf304b96a3482e50f2c3f74c357fc5804ddc2c164adcacd27214610b7b1b1e6d434376d8e8187d09f10e4737e"]}

Verify trx exmaple:
{
  "trx_info": {
    "id": "0197c1b56764627e3d3d20859ae7dffcc8e2fe0a",
    "block_id": "067efb58fb48417d2504041ea908bb160238a757",
    "prev_block_id": "067efb57a208bd79076a1463f3362ed72964f829",
    "type": "land_operation",
    "player": "beaker007",
    "data": "{\"op\":\"add_liquidity\",\"region_uid\":\"PR-CEF-85\",\"resource_amount\":1000,\"dec_amount\":23.222,\"shares_out\":0,\"resource_symbol\":\"WOOD\",\"app\":\"splinterlands/0.7.60\",\"n\":\"eJxmbz6vMc\"}",
    "success": true,
    "error": null,
    "block_num": 108985176,
    "created_date": "2026-08-13T10:16:06.000Z",
    "result": "{\"success\":true,\"result\":{\"success\":true,\"error\":\"\",\"balanceHistory\":[{\"player\":\"beaker007\",\"token\":\"DEC\",\"balance_end\":563961.006}],\"data\":{\"resource\":\"WOOD\",\"resource_amount\":1000,\"dec_amount\":23.222,\"region_uid\":\"PR-CEF-85\",\"region_name\":\"Xiang Pho\"}}}",
    "steem_price": null,
    "sbd_price": null
  }
}

## Execution requirements

The strategy must:

- support both dry run and actual execution;
- calculate the complete plan before submitting transactions;
- support multiple resources;
- support multiple regions contributing the same resource;
- treat DEC as one shared account-level balance;
- prevent the same projected DEC from being allocated more than once;
- respect the configured Top Up Pool strategy order and never use a disabled strategy (similar as make havestable);
- calculate the exact amount required by the selected strategy, including the minimum resource sale when `sell_resource` is used;
- account for the 10% tax/cost wherever the selected purchase or sale mechanism applies;
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
