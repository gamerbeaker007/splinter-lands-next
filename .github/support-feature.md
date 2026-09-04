# Feature Specification — Validator Support, Voting & Donations

## 1. Objective

Implement a new **Support** feature in both projects:

* `VsCodeProjects/spl-stats-next`
* `VsCodeProjects/splinter-lands-next`

The feature must provide the same user-facing functionality in both applications while following each application's existing architecture and implementation patterns.

The feature allows users to:

1. Vote for the Splinterlands validator `beaker007`.
2. See whether they already vote for `beaker007`.
3. See their existing validator votes when all 10 vote slots are occupied.
4. Unvote another validator to make room for `beaker007`.
5. Donate DEC, SPS, HIVE, or HBD to `beaker007`.
6. See their available balance for each donation currency.
7. Access the feature through a dedicated `/support` page.
8. Access the same functionality from a Support/Donate button in the application's top navigation.

Each application must record its own donations in its own existing Prisma database.

---

# 2. Important Implementation Principle

Before implementing anything, inspect both repositories.

Do not introduce new transaction, authentication, balance, API, database, modal, or notification infrastructure when equivalent functionality already exists.

Specifically inspect both projects for existing implementations of:

* Authentication/login.
* Logged-in Hive/Splinterlands account state.
* Hive Keychain integration.
* Active-key broadcasts.
* Custom JSON operations.
* `sm_token_transfer`.
* DEC transfers.
* SPS transfers.
* HIVE/HBD transfers.
* Transaction IDs.
* Splinterlands transaction lookup.
* Transaction confirmation/retry logic.
* DEC/SPS balances.
* HIVE/HBD balances.
* Splinterlands price data.
* Prisma models.
* Prisma API routes/server actions.
* Modal/dialog components.
* Top navigation.
* Responsive/mobile navigation.
* Toasts/notifications.
* Icons/token icons.

Reuse existing helpers and conventions wherever possible.

The two projects may have different internal implementations. Do not blindly copy code between them. Keep the **behavior and UX consistent**, but integrate correctly with each application's architecture.

---

# 3. Validator

The validator being promoted is always:

`beaker007`

This should preferably be represented by a constant rather than repeatedly hardcoded throughout the implementation.

For example conceptually:

```ts
const SUPPORT_VALIDATOR = "beaker007";
```

---

# 4. Donation Recipient

All donations go to:

`beaker007`

This applies to:

* DEC
* SPS
* HIVE
* HBD

The sender is always the currently logged-in account.

Any other usernames appearing in example transactions, such as `shinoumonk`, are example senders only and must NOT be used as donation recipients.

---

# 5. Dedicated Support Page

Create the following direct route in BOTH applications:

`/support`

This route must be directly linkable.

The goal is that a link such as:

`https://<application>/support`

can be shared externally and brings the visitor directly to the validator voting and donation experience.

Do not require users to first navigate through another page or manually open another dialog.

---

# 6. Support Dialog

Add a **Support/Donate** button to the top navigation in both applications.

Use an appropriate icon from the icon system already used by each application, such as:

* Heart
* Gift
* Support
* Donation

Clicking this button opens the Support feature in a dialog/modal.

The modal and `/support` page must use the **same underlying components and business logic**.

Do not maintain separate voting and donation implementations for the page and modal.

A structure conceptually similar to this is preferred:

```text
SupportFeature
├── ValidatorSupport
│   ├── ValidatorVoteStatus
│   ├── VoteButton
│   └── ValidatorVoteList
└── DonationSection
    └── DonationOption
```

Adapt this to the architecture of each project.

---

# 7. Mobile Top Navigation

The new Support button requires additional room in the top navigation.

On mobile/small screens:

* Hide/remove the current page name/title from the top bar.
* Keep important navigation/actions visible.
* Keep the Support/Donate button accessible.
* Prevent horizontal overflow.
* Prevent buttons from overlapping.
* Maintain appropriate touch target sizes.

Desktop should continue showing the page name/title unless the existing responsive design provides a better convention.

---

# 8. Authentication

The Support page itself must remain accessible when the visitor is not logged in.

Voting and donations require authentication.

When the visitor is not logged in:

* Show the Support interface.
* Explain that login is required to vote or donate.
* Display the application's existing login functionality prominently.
* Do not implement a second login system specifically for this feature.

After successful login, the Support interface should update to the authenticated state without requiring the user to manually navigate away and return.

Use the existing authentication/account state from each application.

---

# 9. Validator Voting UI

The validator voting section should be the most prominent part of the page/dialog.

Center the primary vote action.

Suggested content:

## Support the beaker007 Validator

Vote for the **beaker007** validator to support this project and its continued development.

**[ Vote for beaker007 ]**

Use a suitable vote/support icon where appropriate.

The interface should make it very clear that the user is voting for:

`beaker007`

---

# 10. Retrieve Existing Validator Votes

Retrieve the logged-in user's existing validator votes using:

`GET https://validator.spl-stats.com/votes_by_account?account={username}`

`{username}` MUST be the currently logged-in account.

Do NOT hardcode `beaker007` as the voter.

Example:

```text
https://validator.spl-stats.com/votes_by_account?account=beaker007
```

Example response:

```json
[
  {
    "voter": "beaker007",
    "validator": "beaker007",
    "vote_weight": "555684.518"
  },
  {
    "voter": "beaker007",
    "validator": "spiritfest",
    "vote_weight": "555684.518"
  }
]
```

Use this response to determine:

* Whether the user already votes for `beaker007`.
* How many validators they currently vote for.
* Which validators they currently vote for.

Include proper:

* Loading state.
* Empty state.
* API error state.

Do not treat an API failure as meaning the player has zero votes.

---

# 11. Validator Vote Limit

A player can vote for a maximum of:

**10 validators**

The UI must behave differently depending on the current vote state.

---

# 12. State: User Already Votes for beaker007

If any returned validator record contains:

```text
validator === "beaker007"
```

the user already supports the validator.

Do not show the normal vote action as though another vote is necessary.

Show a positive confirmation such as:

> Thank you for supporting this project. You have already voted for the **beaker007** validator.

The donation section remains available.

---

# 13. State: User Has Fewer Than 10 Votes

When:

* User does NOT vote for `beaker007`.
* Existing validator vote count is less than 10.

Show the primary:

**Vote for beaker007**

button.

After successful voting:

1. Show success feedback.
2. Re-fetch validator votes.
3. Update the UI automatically.
4. Display the "already voted" thank-you state.

Use the application's existing toast/notification system where available.

---

# 14. State: User Has 10 Votes

When:

* User has exactly 10 validator votes.
* None is `beaker007`.

Do NOT show the vote button as immediately actionable.

Explain:

> You are already voting for 10 validators. To support beaker007, first remove one of your existing validator votes.

Display all 10 validators.

Each validator must have an explicit:

**Unvote**

action.

Conceptually:

| Validator   | Action |
| ----------- | ------ |
| validator-a | Unvote |
| validator-b | Unvote |
| validator-c | Unvote |

On mobile, use a responsive list/card layout rather than forcing a wide table.

Never automatically choose which validator to remove.

The user must explicitly select the validator they want to unvote.

After successful unvote:

1. Show success feedback.
2. Re-fetch validator votes.
3. The user now has an available slot.
4. Display the **Vote for beaker007** action.

Do not automatically vote for `beaker007` after the unvote unless the user explicitly performs the vote action.

---

# 15. Vote Operation

Voting requires active authority using the application's existing Hive Keychain/broadcast mechanism.

Operation:

`sm_approve_validator`

Payload:

```json
{
  "account_name": "beaker007"
}
```

The currently logged-in user signs the operation.

Use the existing transaction/custom JSON broadcast implementation in each application.

Do not create a completely separate Keychain integration.

---

# 16. Unvote Operation

Unvoting also requires active authority.

Operation:

`sm_unapprove_validator`

Payload:

```json
{
  "account_name": "<validator-to-unvote>"
}
```

The `account_name` must be the validator explicitly selected by the user.

The logged-in user signs the operation.

After success, re-fetch validator votes.

---

# 17. Transaction UX

Voting, unvoting, and donations must provide clear transaction states.

While awaiting Keychain:

* Disable the relevant action.
* Prevent double submissions.
* Show a pending/loading state.

When Keychain is cancelled:

* Return cleanly to the previous state.
* Do not show success.
* Do not create database records.

When the transaction fails:

* Show a useful error.
* Allow the user to retry.

When successful:

* Show clear confirmation.
* Refresh relevant state.

Do not leave buttons enabled while the same operation is already pending.

---

# 18. Donation Section

Below the validator section, create:

## Support the Project with a Donation

Allow donations using:

* DEC
* SPS
* HIVE
* HBD

Use recognizable token/currency icons where available.

Each currency should show:

1. Icon.
2. Currency name.
3. User's current balance.
4. Amount input.
5. Donate button.

Conceptually:

```text
DEC
Balance: 12,345.678 DEC
[ Amount                  ] [ Donate ]

SPS
Balance: 123.456 SPS
[ Amount                  ] [ Donate ]

HIVE
Balance: 50.123 HIVE
[ Amount                  ] [ Donate ]

HBD
Balance: 10.000 HBD
[ Amount                  ] [ Donate ]
```

The exact visual implementation should match each application's design system.

---

# 19. Donation Balance Retrieval

Display available balances for:

* DEC
* SPS
* HIVE
* HBD

Before implementing new API calls, inspect both applications for existing balance-fetching functionality.

For DEC/SPS:

Reuse existing Splinterlands player/token balance logic where possible.

For HIVE/HBD:

Check whether Hive account balances are already loaded anywhere in the application.

Reuse those mechanisms where possible.

Balance retrieval failures should not crash the Support page.

---

# 20. Donation Input Validation

Donation amount inputs must:

* Accept numeric values.
* Accept appropriate decimal values.
* Reject zero.
* Reject negative values.
* Reject invalid strings.
* Reject non-finite values.
* Prevent donation attempts larger than the known available balance.
* Respect the precision expected by the corresponding blockchain operation.

Do validation before opening Keychain where possible.

The blockchain/API error remains the final authority if a balance changed between loading the page and broadcasting the transaction.

---

# 21. Donation Confirmation

Before broadcasting a donation, make it clear what the user is about to do.

Show/confirm:

* Currency.
* Amount.
* Recipient: `beaker007`.

For example:

> Donate 100 DEC to beaker007?

Do not silently trigger financial transactions.

Use the application's existing confirmation-dialog conventions if available.

---

# 22. Donation Memo

Use:

`donation to spl-stats.com`

as the donation memo for all supported currencies unless an existing transaction implementation requires a specific compatible format.

---

# 23. DEC/SPS Donations

DEC and SPS use Splinterlands token transfers.

Custom JSON ID:

`sm_token_transfer`

Conceptual operation:

```json
[
  [
    "custom_json",
    {
      "required_auths": [
        "<logged-in-user>"
      ],
      "required_posting_auths": [],
      "id": "sm_token_transfer",
      "json": "{\"token\":\"DEC\",\"to\":\"beaker007\",\"qty\":1,\"memo\":\"donation to spl-stats.com\",\"app\":\"<existing-app-identifier>\",\"n\":\"<nonce>\"}"
    }
  ]
]
```

Requirements:

* `required_auths` = logged-in account.
* `token` = `DEC` or `SPS`.
* `to` = `beaker007`.
* `qty` = entered donation amount.
* `memo` = `donation to spl-stats.com`.
* `app` = the correct existing app identifier for that application.
* `n` = generated using the existing nonce convention.

Do NOT blindly use:

`splinterlands/0.7.60`

simply because it appears in the example transaction.

Inspect how broadcasts are currently sent by each application and use that application's existing app identifier/convention.

---

# 24. HIVE/HBD Donations

HIVE and HBD use standard Hive transfers requiring active authority.

HIVE example:

```json
[
  [
    "transfer",
    {
      "from": "<logged-in-user>",
      "to": "beaker007",
      "amount": "1.000 HIVE",
      "memo": "donation to spl-stats.com"
    }
  ]
]
```

HBD example:

```json
[
  [
    "transfer",
    {
      "from": "<logged-in-user>",
      "to": "beaker007",
      "amount": "1.000 HBD",
      "memo": "donation to spl-stats.com"
    }
  ]
]
```

Requirements:

* `from` = logged-in user.
* `to` = `beaker007`.
* Correct HIVE/HBD precision must be used.
* Active-key authorization is required.
* Reuse the existing Keychain/broadcast infrastructure.

---

# 25. Donation Database

Each application records donations in its **own existing Prisma database**.

Do NOT create a shared donation database.

Inspect each application's existing Prisma naming conventions before adding the model.

The donation record must contain at minimum:

| Field       | Description                   |
| ----------- | ----------------------------- |
| `date`      | Donation/blockchain timestamp |
| `username`  | Donating account              |
| `currency`  | DEC, SPS, HIVE, or HBD        |
| `amount`    | Donated amount                |
| `usd_value` | USD value at donation time    |
| `tx`        | Blockchain transaction ID     |

A possible Prisma model is:

```prisma
model Donation {
  id        Int      @id @default(autoincrement())
  date      DateTime @default(now())
  username  String
  currency  String
  amount    Decimal
  usd_value Decimal
  tx        String   @unique
}
```

Adapt:

* Naming.
* IDs.
* Decimal precision.
* Mapping.
* Timestamps.

to the conventions already present in each project.

Create the appropriate Prisma migration in BOTH projects.

---

# 26. Transaction ID Must Be Unique

The `tx` field must be unique.

A blockchain transaction may create at most one donation record.

Implement idempotency at:

1. Database level through a unique constraint.
2. Server/API level where appropriate.

If the same transaction is submitted twice, do NOT create duplicate donations.

Return the existing donation or an appropriate "already recorded" result.

---

# 27. Donation Recording Must Be Server-Side

The browser must NOT be allowed to arbitrarily create trusted donation records.

Create or reuse a server-side API route/server action responsible for validating and storing the donation.

The client should submit the transaction information/result after a successful wallet operation.

For DEC/SPS, the transaction ID is used to independently retrieve the authoritative transaction from Splinterlands.

Derive authoritative donation data server-side whenever possible.

---

# 28. USD Price Source

Use:

`https://prices.splinterlands.com/prices`

in both applications to determine the current USD value of the donated currency.

Use the price corresponding to:

* DEC
* SPS
* HIVE
* HBD

Calculate:

```text
usd_value = verified donation amount × current USD token price
```

The USD value represents the approximate value at the time the donation is recorded.

Persist this value.

Do NOT dynamically recalculate historical donation values when prices change later.

If either application already wraps/caches this endpoint, reuse that functionality.

The price should preferably be retrieved server-side when the donation is recorded rather than trusting a USD value supplied by the browser.

---

# 29. Price Retrieval Failure

Do not silently store an incorrect USD value if the price API fails.

Handle the failure explicitly.

Prefer either:

1. A small bounded retry using existing application patterns, or
2. Return a temporary recording/price error and allow retry.

Do not invent a price.

Do not trust a client-supplied USD value as the authoritative fallback.

---

# 30. DEC/SPS Transaction Verification

Successful DEC and SPS donations MUST be verified server-side before being inserted into Prisma.

Use:

`GET https://api.splinterlands.com/transactions/lookup?trx_id={transactionId}`

Example:

```text
https://api.splinterlands.com/transactions/lookup?trx_id=b6027ec22f2569f936d61ad7eef85ffa59590d70
```

Example response structure:

```json
{
  "trx_info": {
    "id": "b6027ec22f2569f936d61ad7eef85ffa59590d70",
    "block_id": "06852625c9d5a0235848651a1c15e1605e944010",
    "prev_block_id": "0685262488247e4cbd8ae67444c314c0641e1e68",
    "type": "token_transfer",
    "player": "shinoumonk",
    "data": "{\"token\":\"DEC\",\"to\":\"beaker007\",\"qty\":1,\"memo\":\"beaker007\",\"app\":\"splinterlands/0.7.60\",\"n\":\"ILU31Izwzf\"}",
    "success": true,
    "error": null,
    "block_num": 109389349,
    "created_date": "2026-08-27T11:58:45.000Z",
    "result": "{\"success\":true,\"from\":\"shinoumonk\",\"to\":\"beaker007\",\"amount\":1,\"token\":\"DEC\",\"trx_id\":\"b6027ec22f2569f936d61ad7eef85ffa59590d70\",\"type\":\"token_transfer\",\"created_date\":\"2026-08-27T11:58:45.000Z\"}"
  }
}
```

---

# 31. DEC/SPS Verification Requirements

Before storing the donation, verify at minimum:

### Transaction identity

```text
trx_info.id === submitted transaction ID
```

### Transaction succeeded

```text
trx_info.success === true
```

### Correct transaction type

```text
trx_info.type === "token_transfer"
```

### Correct sender

The transaction sender/player must correspond to the authenticated/donating account.

Where both `player` and parsed `result.from` are available, ensure they are consistent.

### Correct recipient

The parsed transaction must contain:

```text
to === "beaker007"
```

### Supported token

Token must be:

```text
DEC
```

or:

```text
SPS
```

Reject all other tokens.

### Positive amount

The verified amount must be greater than zero.

### Transaction result

If `result` contains its own success value, verify:

```text
result.success === true
```

### Transaction ID consistency

If the parsed result contains `trx_id`, ensure it matches the requested transaction ID.

### Duplicate protection

Ensure the transaction ID does not already exist in the application's Donation table.

---

# 32. Do Not Trust DEC/SPS Client Data

For DEC/SPS, derive as much authoritative data as possible from the verified Splinterlands transaction.

Do not trust the browser for:

* Username.
* Recipient.
* Currency.
* Amount.
* Success status.
* Transaction date.
* USD value.

Prefer deriving:

```text
username
currency
amount
date
tx
```

from the verified transaction.

Then retrieve the current USD price server-side and calculate:

```text
usd_value
```

---

# 33. DEC/SPS Transaction Lookup Delay

The Splinterlands transaction may not be available from the lookup endpoint immediately after Keychain successfully broadcasts it.

Account for indexing delay.

Do NOT report a valid donation as permanently failed simply because the first lookup returns nothing.

Use a small bounded retry strategy.

Conceptually:

```text
Lookup transaction
       ↓
Found?
  yes → verify
  no
       ↓
wait briefly
       ↓
retry
       ↓
limited number of attempts
```

Reuse any existing transaction confirmation/retry implementation if already present.

Do not retry indefinitely.

If the transaction still cannot be found, return an appropriate state such as:

> Your transaction was broadcast successfully but is still being confirmed.

Do not store it as verified until lookup succeeds.

---

# 34. DEC/SPS Donation Flow

The complete flow should be:

```text
User enters donation
        ↓
Validate input
        ↓
Check known balance
        ↓
Show confirmation
        ↓
User confirms
        ↓
Open Keychain
        ↓
Broadcast sm_token_transfer
        ↓
Broadcast successful?
   ├── No → show error/cancelled
   └── Yes
        ↓
Receive transaction ID
        ↓
Send transaction ID to server
        ↓
Lookup transaction through Splinterlands API
        ↓
Not indexed yet?
        ↓
Bounded retry
        ↓
Verify transaction
        ↓
Extract authoritative donation details
        ↓
Fetch USD price
        ↓
Calculate USD value
        ↓
Check transaction ID uniqueness
        ↓
Store using Prisma
        ↓
Return success
        ↓
Show success notification
        ↓
Refresh token balance
```

---

# 35. HIVE/HBD Verification

For the initial implementation, HIVE and HBD do not require a separate blockchain lookup implementation.

Trust the successful result returned by the application's existing Hive Keychain/broadcast mechanism.

Only proceed when:

* Broadcast reports success.
* A usable transaction ID is returned.
* The transaction constructed by the application was addressed to `beaker007`.
* Currency is HIVE or HBD.
* Amount is positive.

If the wallet transaction is:

* Cancelled.
* Rejected.
* Failed.
* Missing a usable transaction ID.

do NOT create a donation record.

If either application already has a reliable Hive transaction lookup/verification mechanism, reuse it.

Do not build a large new Hive verification subsystem solely for this feature.

---

# 36. HIVE/HBD Donation Flow

Conceptually:

```text
User enters amount
        ↓
Validate amount
        ↓
Check known balance
        ↓
Show confirmation
        ↓
User confirms
        ↓
Keychain Hive transfer
        ↓
Successful broadcast?
   ├── No → no database record
   └── Yes
        ↓
Obtain transaction ID
        ↓
Send successful donation result to server
        ↓
Validate supported currency/input
        ↓
Check transaction ID uniqueness
        ↓
Fetch current USD price
        ↓
Calculate USD value
        ↓
Store donation using Prisma
        ↓
Return success
        ↓
Refresh balance
```

---

# 37. Security Requirements

Never request, handle, transmit, or store Hive private keys.

All blockchain authorization must use the existing wallet/Hive Keychain integration.

Voting, unvoting, and donations require the appropriate active-key authorization.

The backend must never blindly trust arbitrary client-submitted donation data.

For DEC/SPS, use the Splinterlands transaction as the authoritative source.

For HIVE/HBD, apply all practical server-side validation and rely on the successful wallet broadcast result for the first implementation.

Transaction IDs must be unique.

Do not expose sensitive server/database configuration to the client.

---

# 38. Donation Success

After a donation is successfully broadcast, verified where required, and recorded:

* Show a clear success message.
* Include the currency and amount where appropriate.
* Clear/reset the amount input.
* Refresh the relevant balance.
* Keep the user on the Support page/dialog.

Example:

> Thank you! Your donation of 100 DEC has been received.

---

# 39. Donation Failure

Handle at least:

* Invalid amount.
* Insufficient known balance.
* Wallet/Keychain unavailable.
* User cancels Keychain.
* Broadcast fails.
* Splinterlands transaction cannot yet be found.
* Splinterlands transaction failed.
* Transaction sender mismatch.
* Transaction recipient mismatch.
* Token mismatch.
* Amount mismatch.
* Duplicate transaction.
* Price API failure.
* Database failure.

Provide user-friendly messages.

Technical details can be logged according to the applications' existing logging conventions.

---

# 40. Loading States

The Support feature should not feel blocked while unrelated information loads.

Use appropriate independent loading states for:

* Authentication.
* Validator votes.
* DEC balance.
* SPS balance.
* HIVE balance.
* HBD balance.
* Vote transaction.
* Unvote transaction.
* Donation transaction.

Avoid one global spinner that unnecessarily hides the entire page if only one balance request is loading.

---

# 41. Support Page State Summary

## Not logged in

Show:

* Support information.
* Validator being supported.
* Login action.
* Donation currencies.

Disable/protect actions requiring login.

## Logged in, votes loading

Show appropriate validator loading state.

## Already votes for beaker007

Show:

> Thank you for supporting this project. You have already voted for the **beaker007** validator.

Keep donations available.

## Does not vote for beaker007 + fewer than 10 votes

Show:

**Vote for beaker007**

## Does not vote for beaker007 + 10 votes

Show:

* Explanation of the 10-validator limit.
* Existing 10 validators.
* Unvote button for each.

## After unvote

Refresh votes and show:

**Vote for beaker007**

## Donation transaction pending

Disable the affected donation controls and show progress.

## Donation successful

Show confirmation and refresh balance.

---

# 42. Responsive Support UI

The Support page and dialog must work properly on:

* Desktop.
* Tablet.
* Mobile.

On narrow screens:

* Stack donation controls where necessary.
* Do not allow amount fields/buttons to overflow.
* Keep validator unvote actions readable.
* Ensure dialog content can scroll vertically.
* Avoid horizontal scrolling.
* Keep primary actions easy to tap.

---

# 43. Accessibility

Follow the existing application's accessibility conventions.

At minimum:

* Buttons need meaningful labels.
* Icon-only top-bar buttons require accessible names/tooltips where appropriate.
* Inputs require labels.
* Pending/disabled states must be understandable.
* Errors should be associated with the relevant controls.
* Do not communicate transaction state using color alone.
* Modal/dialog keyboard behavior should use the existing accessible dialog implementation.

---

# 44. Suggested Shared Constants

Where appropriate, centralize feature constants rather than scattering literals throughout the code.

Conceptually:

```ts
const SUPPORT_VALIDATOR = "beaker007";
const DONATION_ACCOUNT = "beaker007";
const DONATION_MEMO = "donation to spl-stats.com";
const MAX_VALIDATOR_VOTES = 10;

const SUPPORTED_DONATION_CURRENCIES = [
  "DEC",
  "SPS",
  "HIVE",
  "HBD",
] as const;
```

Follow each project's existing configuration conventions.

---

# 45. Tests

Add/update tests according to the existing test setup in each repository.

At minimum cover important business logic.

## Validator tests

Test:

* Vote response containing `beaker007`.
* Vote response without `beaker007`.
* Zero existing votes.
* Nine existing votes.
* Ten existing votes.
* Vote API failure.
* Successful vote.
* Failed vote.
* Cancelled vote.
* Successful unvote.
* Failed unvote.

## Donation validation tests

Test:

* Valid DEC amount.
* Valid SPS amount.
* Valid HIVE amount.
* Valid HBD amount.
* Zero amount.
* Negative amount.
* Invalid amount.
* Amount exceeding known balance.

## DEC/SPS verification tests

Test:

* Valid successful transaction.
* Unknown transaction.
* Failed transaction.
* Wrong sender.
* Wrong recipient.
* Wrong token.
* Invalid amount.
* Mismatching transaction ID.
* Duplicate transaction ID.
* Transaction unavailable initially but found on retry.

## Donation storage tests

Test:

* Correct username.
* Correct currency.
* Correct amount.
* Correct USD calculation.
* Correct transaction ID.
* Duplicate transaction cannot create another record.

---

# 46. Manual Testing Checklist

Test the complete feature in BOTH applications.

### Authentication

* [ ] `/support` loads while logged out.
* [ ] Login action is visible.
* [ ] Login works.
* [ ] Support UI updates after login.

### Validator voting

* [ ] Current validator votes load.
* [ ] Existing `beaker007` vote is detected.
* [ ] Thank-you message appears.
* [ ] User with fewer than 10 votes can vote.
* [ ] Vote requires Keychain active authority.
* [ ] Successful vote refreshes state.
* [ ] Cancelled vote changes nothing.
* [ ] User with 10 votes sees all current validators.
* [ ] Each existing validator has an Unvote action.
* [ ] User chooses which validator to unvote.
* [ ] Successful unvote refreshes state.
* [ ] Vote for `beaker007` becomes available afterward.

### DEC

* [ ] DEC balance displays.
* [ ] DEC donation sends to `beaker007`.
* [ ] Memo is correct.
* [ ] Successful transaction is looked up.
* [ ] Transaction is verified server-side.
* [ ] Donation is stored.
* [ ] USD value is stored.
* [ ] Balance refreshes.

### SPS

* [ ] SPS balance displays.
* [ ] SPS donation sends to `beaker007`.
* [ ] Successful transaction is looked up.
* [ ] Transaction is verified server-side.
* [ ] Donation is stored.
* [ ] USD value is stored.
* [ ] Balance refreshes.

### HIVE

* [ ] HIVE balance displays.
* [ ] HIVE transfer sends to `beaker007`.
* [ ] Successful broadcast returns transaction ID.
* [ ] Donation is stored.
* [ ] USD value is stored.
* [ ] Cancelled transaction creates no donation.

### HBD

* [ ] HBD balance displays.
* [ ] HBD transfer sends to `beaker007`.
* [ ] Successful broadcast returns transaction ID.
* [ ] Donation is stored.
* [ ] USD value is stored.
* [ ] Cancelled transaction creates no donation.

### Navigation

* [ ] Support/Donate button appears in both top bars.
* [ ] Button opens Support dialog.
* [ ] Dialog has same functionality as `/support`.
* [ ] Desktop page title remains visible.
* [ ] Mobile page title is hidden.
* [ ] Mobile navigation does not overflow.

---

# 47. Acceptance Criteria

The feature is considered complete only when all of the following are true:

1. `/support` exists in both applications.
2. `/support` can be directly linked externally.
3. Support/Donate button exists in both top navigation bars.
4. Top-bar button opens the Support dialog.
5. Page and dialog reuse the same underlying feature implementation.
6. Logged-out users can access the Support interface.
7. Logged-out users can log in from the Support experience.
8. Validator votes are retrieved for the logged-in account.
9. Existing `beaker007` votes are detected.
10. Existing supporters receive the thank-you state.
11. Users with fewer than 10 votes can vote for `beaker007`.
12. Voting uses active authority through the existing wallet infrastructure.
13. Users with 10 votes see their current validators.
14. Users explicitly choose which validator to unvote.
15. Unvote uses active authority.
16. Vote state refreshes after vote/unvote operations.
17. DEC balance is displayed.
18. SPS balance is displayed.
19. HIVE balance is displayed.
20. HBD balance is displayed.
21. DEC can be donated to `beaker007`.
22. SPS can be donated to `beaker007`.
23. HIVE can be donated to `beaker007`.
24. HBD can be donated to `beaker007`.
25. Donation inputs are validated.
26. Known insufficient balances are rejected before broadcast.
27. Donations require explicit user confirmation.
28. DEC transactions are verified using Splinterlands transaction lookup.
29. SPS transactions are verified using Splinterlands transaction lookup.
30. Splinterlands lookup handles reasonable indexing delay.
31. Fake/invalid DEC/SPS transaction IDs cannot create donations.
32. Failed DEC/SPS transactions cannot create donations.
33. DEC/SPS transfers to another recipient cannot create donations.
34. HIVE/HBD are recorded only following a successful wallet broadcast with transaction ID.
35. Every stored donation contains date, username, currency, amount, USD value, and transaction ID.
36. USD prices come from `prices.splinterlands.com/prices`.
37. USD value represents the donation value at recording time.
38. Transaction IDs are unique.
39. Duplicate submissions do not create duplicate donations.
40. Each application uses its own Prisma database.
41. Appropriate Prisma migration exists in each application.
42. Failed/cancelled transactions do not create successful donation records.
43. Successful donations refresh the relevant balance where possible.
44. Mobile top navigation hides the page name/title.
45. Mobile navigation remains usable without horizontal overflow.
46. Page/dialog work correctly on mobile and desktop.
47. Existing application functionality is not broken.
48. Relevant automated tests are added/updated.

---

# 48. Recommended Implementation Order

Implement the feature incrementally.

### Phase 1 — Repository Analysis

Inspect both repositories and identify:

* Authentication.
* Account state.
* Keychain integration.
* Transaction helpers.
* Balance APIs.
* Price APIs.
* Prisma architecture.
* Dialog implementation.
* Navigation implementation.

Do this before creating new abstractions.

### Phase 2 — Validator Data

Implement/reuse:

* Validator votes API request.
* Vote-state determination.
* Loading/error handling.

### Phase 3 — Validator UI

Implement:

* Support heading.
* Already-supported state.
* Vote action.
* 10-vote state.
* Existing validator list.
* Unvote actions.

### Phase 4 — Validator Transactions

Implement:

* `sm_approve_validator`.
* `sm_unapprove_validator`.
* Transaction states.
* Vote refresh after success.

### Phase 5 — Donation UI

Implement:

* DEC.
* SPS.
* HIVE.
* HBD.
* Icons.
* Balances.
* Amount inputs.
* Validation.
* Confirmation.

### Phase 6 — Donation Broadcasts

Implement/reuse:

* DEC/SPS `sm_token_transfer`.
* HIVE transfer.
* HBD transfer.
* Existing application identifiers.
* Existing nonce generation.
* Transaction ID handling.

### Phase 7 — Prisma

In each project:

* Add Donation model.
* Add unique transaction constraint.
* Create migration.
* Add server-side recording API/action.

### Phase 8 — DEC/SPS Verification

Implement/reuse:

* Splinterlands transaction lookup.
* Transaction parsing.
* Validation.
* Bounded retry.
* Idempotency.

### Phase 9 — USD Values

Implement/reuse:

`https://prices.splinterlands.com/prices`

Calculate and persist donation-time USD value server-side.

### Phase 10 — Support Route

Add:

`/support`

using the reusable Support feature.

### Phase 11 — Navigation Dialog

Add Support/Donate top-bar action and reusable dialog.

### Phase 12 — Responsive Navigation

Hide page name/title on small screens and verify navigation does not overflow.

### Phase 13 — Testing

Run:

* Existing tests.
* New tests.
* Type checking.
* Linting.
* Production build where applicable.

Manually verify Keychain-dependent flows.

---

# 49. Instructions for Claude

Implement this feature completely in BOTH:

* `VsCodeProjects/spl-stats-next`
* `VsCodeProjects/splinter-lands-next`

Start by inspecting both repositories rather than immediately writing code.

Reuse existing architecture wherever possible.

In particular, search for existing implementations before introducing anything new for:

* Authentication.
* Hive Keychain.
* Active-key transactions.
* Custom JSON.
* `sm_token_transfer`.
* DEC/SPS transfers.
* HIVE/HBD transfers.
* Balance retrieval.
* Transaction lookup.
* Transaction retry/confirmation.
* Splinterlands price retrieval.
* Prisma.
* API routes/server actions.
* Dialogs.
* Navigation.
* Notifications.
* Token icons.

If transaction lookup or transfer verification already exists, extend/reuse it instead of implementing a parallel system.

Keep the feature behavior consistent between both applications, but respect differences in their codebases.

Do not replace working existing infrastructure merely to make the implementations identical.

Do not change unrelated functionality.

Keep changes scoped to this feature.

Use existing styling/design patterns so the feature looks native to each application.

After implementation:

1. Run the relevant tests.
2. Run type checking.
3. Run linting.
4. Run production builds if available.
5. Fix issues introduced by the implementation.
6. Review the final diff for unrelated changes.
7. Report separately for each repository:

    * Files added.
    * Files modified.
    * Prisma changes/migrations.
    * APIs/server actions added.
    * Existing utilities reused.
    * Tests added/updated.
    * Validation/build results.
    * Any remaining limitations.

If something in an existing application contradicts this specification because of an established architectural requirement, prefer the existing architecture where technically necessary and clearly document the deviation rather than inventing an incompatible parallel implementation.
