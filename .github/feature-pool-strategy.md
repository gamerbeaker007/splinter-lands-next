# Feature request: Harvestable strategy for withdrawing from pool

Please review the current branch and implement a new strategy for the land/resource automation flow.

## Goal

Add a new strategy that tries to make a resource **harvestable** by withdrawing from the pool first.

This strategy should be inserted **before the last existing strategy**.

* The current last strategy is **Buy with DEC**
* The new **Make Harvestable / Withdraw from Pool** strategy should run before that

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

Only the portion that is **unlockable** can be used.

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

When this strategy is enabled, show an alert if the player has **less than 5 weeks worth of resource** in the pool.

I am not completely sure whether the weekly unlock cadence needs to be taken into account more explicitly, so please review that logic carefully and implement the best practical version.

The warning should help the user understand that the pool balance is getting too low to remain safely harvestable.

---

## Second strategy: fill the pool (post processing resource part)

Please also add a strategy that can **process resource to fill up the pool** so it add to the pool at least:

* **110% of weekly consumption of the resource**

The preferred approach should be:

1. sell some amount for DEC to match the resource need to store to reach 110% weekly consume and store that;
2. if that is not feasible, store with DEC in the balance;
3. if that is still not possible report that in dry run and actual plan skip that resource.

This should also work in both:

* dry run
* actual execution

Please keep the logic consistent with the rest of the strategy pipeline.

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
