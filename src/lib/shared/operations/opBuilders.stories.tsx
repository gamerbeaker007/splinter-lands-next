import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import {
  buildAddLiquidityOp,
  buildBuyWithDecOp,
  buildDonationTransferOp,
  buildHarvestOp,
  buildRenewRentalOnBehalfOp,
  buildRentOnBehalfOp,
  buildSellResourceForDecOp,
  buildSetAuthorityOp,
  buildStakeDecRegionOp,
  buildStakeWorkersOp,
  buildSwapTokensOp,
  buildTaxCollectionOp,
} from "./opBuilders";
import { MAX_ITEM_SIZE_IN_OPERATION } from "../../../types/landManager";

// Hive consensus limits. Refs hive/libraries/protocol/include/hive/protocol/config.hpp:
//   HIVE_CUSTOM_OP_DATA_MAX_LENGTH = 8192   (max bytes of a custom_json `json` field)
//   HIVE_CUSTOM_OP_ID_MAX_LENGTH   = 32     (max bytes of the custom_json `id`)
// HIVE_TX_PRACTICAL_BYTES is the witness-enforced upper bound on a single
// transaction in practice (block-level max is 2 MB but most witness configs
// reject txs above 64 KB).
const HIVE_CUSTOM_OP_DATA_MAX_LENGTH = 8192;
const HIVE_CUSTOM_OP_ID_MAX_LENGTH = 32;
const HIVE_TX_PRACTICAL_BYTES = 65_536;
const MAX_OPS_PER_TX = 4;

type CustomJsonOp = [string, { id: string; json: string }];

const encoder = new TextEncoder();
const bytes = (s: string) => encoder.encode(s).length;

const USER = "alice";
const SERVICE_ACCOUNT = "splrental-svc"; // 13 chars, realistic shape
const REGION_A = "C9-REG-1111-2222-3333-4444";
const REGION_B = "C9-REG-5555-6666-7777-8888";
const DEED = "C9-DEED-AAAA-BBBB-CCCC-DDDD";

function makeUuid(prefix: string, i: number): string {
  // 36 chars (UUID-ish) — matches SPL marketplace / card UID shapes.
  const hex = i.toString(16).padStart(8, "0");
  return `${prefix}${hex}-aaaa-bbbb-cccc-dddddddddddd`;
}

function makeMarketIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => makeUuid("c9", i));
}

function makeWorkerCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    card_uid: makeUuid("ca", i),
    slot: i,
  }));
}

// 16-char Hive account names (max length) — worst case for size.
function makeAccount(i: number): string {
  const suffix = String(i);
  return ("a".repeat(16 - suffix.length) + suffix).slice(0, 16);
}

function makeRentalList(count: number): string[] {
  return Array.from({ length: count }, (_, i) => makeAccount(i));
}

// "Realistic max" inputs — what we expect the UI to actually produce.
// The renewal & rent-on-behalf flows both chunk to MAX_ITEM_SIZE_IN_OPERATION,
// so use that as the realistic upper bound for both.
const REALISTIC_RENTAL_AUTHORIZATIONS = 25;
const REALISTIC_RENEWAL_BATCH = MAX_ITEM_SIZE_IN_OPERATION;
const REALISTIC_RENT_ON_BEHALF_BATCH = MAX_ITEM_SIZE_IN_OPERATION;
const FULL_DEED_WORKER_SLOTS = 9;

interface OpRow {
  label: string;
  inputDescription: string;
  op: CustomJsonOp;
}

const FIXED_ROWS: OpRow[] = [
  {
    label: "buildHarvestOp",
    inputDescription: "single region",
    op: buildHarvestOp(USER, REGION_A) as CustomJsonOp,
  },
  {
    label: "buildSwapTokensOp",
    inputDescription: "cross-region swap WOOD→STONE",
    op: buildSwapTokensOp({
      username: USER,
      fromRegionUid: REGION_A,
      toRegionUid: REGION_B,
      fromSymbol: "WOOD",
      toSymbol: "STONE",
      inAmount: 12345.6789,
      outAmount1: 1000,
      outAmount2: 2000,
    }) as CustomJsonOp,
  },
  {
    label: "buildFeeTransferOp",
    inputDescription: "same-symbol fee transfer",
    op: buildDonationTransferOp(
      USER,
      REGION_A,
      REGION_B,
      "ToPlayer",
      "GRAIN",
      100,
      50,
      60
    ) as CustomJsonOp,
  },
  {
    label: "buildAddLiquidityOp",
    inputDescription: "deposit liquidity",
    op: buildAddLiquidityOp(USER, REGION_A, "WOOD", 1000, 250) as CustomJsonOp,
  },
  {
    label: "buildTaxCollectionOp",
    inputDescription: "collect taxes for one deed",
    op: buildTaxCollectionOp(USER, REGION_A, DEED) as CustomJsonOp,
  },
  {
    label: "buildSellResourceForDecOp",
    inputDescription: "sell resource for DEC",
    op: buildSellResourceForDecOp(
      USER,
      REGION_A,
      5000,
      0,
      "WOOD"
    ) as CustomJsonOp,
  },
  {
    label: "buildBuyWithDecOp",
    inputDescription: "buy resource with DEC",
    op: buildBuyWithDecOp(USER, REGION_A, 500, 0, "WOOD") as CustomJsonOp,
  },
  {
    label: "buildStakeDecRegionOp",
    inputDescription: "stake DEC into region",
    op: buildStakeDecRegionOp(USER, REGION_A, 100_000) as CustomJsonOp,
  },
];

const VARIABLE_ROWS: OpRow[] = [
  {
    label: "buildSetAuthorityOp (1)",
    inputDescription: "rental authority — 1 account",
    op: buildSetAuthorityOp(USER, makeRentalList(1)) as CustomJsonOp,
  },
  {
    label: `buildSetAuthorityOp (${REALISTIC_RENTAL_AUTHORIZATIONS})`,
    inputDescription: `rental authority — ${REALISTIC_RENTAL_AUTHORIZATIONS} accounts (realistic max)`,
    op: buildSetAuthorityOp(
      USER,
      makeRentalList(REALISTIC_RENTAL_AUTHORIZATIONS)
    ) as CustomJsonOp,
  },
  {
    label: `buildStakeWorkersOp (${FULL_DEED_WORKER_SLOTS})`,
    inputDescription: "stake workers — fully populated deed (9 slots)",
    op: buildStakeWorkersOp(
      USER,
      DEED,
      makeWorkerCards(FULL_DEED_WORKER_SLOTS)
    ) as CustomJsonOp,
  },
  {
    label: "buildRenewRentalOnBehalfOp (1)",
    inputDescription: "renew rental — 1 marketplace ID",
    op: buildRenewRentalOnBehalfOp(
      SERVICE_ACCOUNT,
      USER,
      makeMarketIds(1)
    ) as CustomJsonOp,
  },
  {
    label: `buildRenewRentalOnBehalfOp (${REALISTIC_RENEWAL_BATCH})`,
    inputDescription: `renew rental — ${REALISTIC_RENEWAL_BATCH} marketplace IDs (MAX_ITEM_SIZE_IN_OPERATION)`,
    op: buildRenewRentalOnBehalfOp(
      SERVICE_ACCOUNT,
      USER,
      makeMarketIds(REALISTIC_RENEWAL_BATCH)
    ) as CustomJsonOp,
  },
  {
    label: "buildRentOnBehalfOp (1)",
    inputDescription: "rent-on-behalf — 1 marketplace ID",
    op: buildRentOnBehalfOp(
      SERVICE_ACCOUNT,
      USER,
      makeMarketIds(1)
    ) as CustomJsonOp,
  },
  {
    label: `buildRentOnBehalfOp (${REALISTIC_RENT_ON_BEHALF_BATCH})`,
    inputDescription: `rent-on-behalf — ${REALISTIC_RENT_ON_BEHALF_BATCH} marketplace IDs (MAX_ITEM_SIZE_IN_OPERATION)`,
    op: buildRentOnBehalfOp(
      SERVICE_ACCOUNT,
      USER,
      makeMarketIds(REALISTIC_RENT_ON_BEHALF_BATCH)
    ) as CustomJsonOp,
  },
];

const ALL_ROWS: OpRow[] = [...FIXED_ROWS, ...VARIABLE_ROWS];

interface SizedRow extends OpRow {
  jsonBytes: number;
  idBytes: number;
  withinJsonLimit: boolean;
  withinIdLimit: boolean;
}

function sizeRow(row: OpRow): SizedRow {
  const jsonBytesLen = bytes(row.op[1].json);
  const idBytesLen = bytes(row.op[1].id);
  return {
    ...row,
    jsonBytes: jsonBytesLen,
    idBytes: idBytesLen,
    withinJsonLimit: jsonBytesLen <= HIVE_CUSTOM_OP_DATA_MAX_LENGTH,
    withinIdLimit: idBytesLen <= HIVE_CUSTOM_OP_ID_MAX_LENGTH,
  };
}

// Binary-search the largest list count whose op `json` still fits the
// per-op limit. Useful to know the headroom we have vs realistic max.
function findMaxCount(build: (count: number) => { json: string }): number {
  let lo = 1;
  let hi = 5000;
  let best = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const size = bytes(build(mid).json);
    if (size <= HIVE_CUSTOM_OP_DATA_MAX_LENGTH) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

const ceilings = {
  rental: findMaxCount(
    (n) => buildSetAuthorityOp(USER, makeRentalList(n))[1] as { json: string }
  ),
  renew: findMaxCount(
    (n) =>
      buildRenewRentalOnBehalfOp(
        SERVICE_ACCOUNT,
        USER,
        makeMarketIds(n)
      )[1] as { json: string }
  ),
  rentOnBehalf: findMaxCount(
    (n) =>
      buildRentOnBehalfOp(SERVICE_ACCOUNT, USER, makeMarketIds(n))[1] as {
        json: string;
      }
  ),
  workers: findMaxCount(
    (n) =>
      buildStakeWorkersOp(USER, DEED, makeWorkerCards(n))[1] as { json: string }
  ),
};

// 4-op worst case the user could realistically broadcast: four full renewal
// batches in one transaction. JSON-stringifying the array gives an upper
// bound on the wire size (binary serialization is smaller).
const WORST_CASE_OPS: CustomJsonOp[] = Array.from(
  { length: MAX_OPS_PER_TX },
  () =>
    buildRenewRentalOnBehalfOp(
      SERVICE_ACCOUNT,
      USER,
      makeMarketIds(REALISTIC_RENEWAL_BATCH)
    ) as CustomJsonOp
);
const WORST_CASE_TX_BYTES = bytes(JSON.stringify(WORST_CASE_OPS));

// Hypothetical absolute cap: 4 ops each saturating the per-op json limit.
const PER_OP_LIMIT_BUDGET = HIVE_CUSTOM_OP_DATA_MAX_LENGTH * MAX_OPS_PER_TX;

function statusChip(ok: boolean) {
  return (
    <Chip
      size="small"
      color={ok ? "success" : "error"}
      label={ok ? "WITHIN LIMIT" : "EXCEEDS LIMIT"}
    />
  );
}

const meta: Meta = {
  title: "Lib/opBuilders/Hive size limits",
};

export default meta;

type Story = StoryObj;

export const HiveSizeLimits: Story = {
  render: () => {
    const rows = ALL_ROWS.map(sizeRow);
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Hive custom_json size compliance
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Per-op <code>json</code> limit:{" "}
          <strong>
            {HIVE_CUSTOM_OP_DATA_MAX_LENGTH.toLocaleString()} bytes
          </strong>{" "}
          (HIVE_CUSTOM_OP_DATA_MAX_LENGTH). Per-op <code>id</code> limit:{" "}
          <strong>{HIVE_CUSTOM_OP_ID_MAX_LENGTH} bytes</strong>. Up to{" "}
          {MAX_OPS_PER_TX} ops per transaction. Practical transaction budget:{" "}
          <strong>{HIVE_TX_PRACTICAL_BYTES.toLocaleString()} bytes</strong>.
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
          Per-op size at realistic max input
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Builder</TableCell>
                <TableCell>Input</TableCell>
                <TableCell align="right">json bytes</TableCell>
                <TableCell align="right">% of limit</TableCell>
                <TableCell align="right">id bytes</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell>{r.inputDescription}</TableCell>
                  <TableCell align="right">
                    {r.jsonBytes.toLocaleString()} /{" "}
                    {HIVE_CUSTOM_OP_DATA_MAX_LENGTH.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {(
                      (r.jsonBytes / HIVE_CUSTOM_OP_DATA_MAX_LENGTH) *
                      100
                    ).toFixed(1)}
                    %
                  </TableCell>
                  <TableCell align="right">
                    {r.idBytes} / {HIVE_CUSTOM_OP_ID_MAX_LENGTH}
                  </TableCell>
                  <TableCell>
                    {statusChip(r.withinJsonLimit && r.withinIdLimit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle1" sx={{ mt: 4 }} gutterBottom>
          Headroom — largest list size that still fits one op
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Builder</TableCell>
                <TableCell>List field</TableCell>
                <TableCell align="right">Max items / op</TableCell>
                <TableCell align="right">
                  Max across {MAX_OPS_PER_TX} ops
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>buildSetAuthorityOp</TableCell>
                <TableCell>
                  <code>rental[]</code> (16-char account names)
                </TableCell>
                <TableCell align="right">{ceilings.rental}</TableCell>
                <TableCell align="right">
                  {ceilings.rental * MAX_OPS_PER_TX}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>buildRenewRentalOnBehalfOp</TableCell>
                <TableCell>
                  <code>items[]</code> (36-char market IDs)
                </TableCell>
                <TableCell align="right">{ceilings.renew}</TableCell>
                <TableCell align="right">
                  {ceilings.renew * MAX_OPS_PER_TX}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>buildRentOnBehalfOp</TableCell>
                <TableCell>
                  <code>items[]</code> (36-char market IDs, +player field)
                </TableCell>
                <TableCell align="right">{ceilings.rentOnBehalf}</TableCell>
                <TableCell align="right">
                  {ceilings.rentOnBehalf * MAX_OPS_PER_TX}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>buildStakeWorkersOp</TableCell>
                <TableCell>
                  <code>stake.cards[]</code> (36-char card UIDs)
                </TableCell>
                <TableCell align="right">{ceilings.workers}</TableCell>
                <TableCell align="right">
                  {ceilings.workers * MAX_OPS_PER_TX}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle1" sx={{ mt: 4 }} gutterBottom>
          {MAX_OPS_PER_TX}-op transaction — worst realistic case
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            {MAX_OPS_PER_TX} × buildRenewRentalOnBehalfOp(
            {REALISTIC_RENEWAL_BATCH} market IDs) →{" "}
            <strong>{WORST_CASE_TX_BYTES.toLocaleString()}</strong> bytes (JSON
            envelope, upper bound vs binary serialization).
          </Typography>
          <Box>
            {statusChip(WORST_CASE_TX_BYTES <= HIVE_TX_PRACTICAL_BYTES)} against{" "}
            {HIVE_TX_PRACTICAL_BYTES.toLocaleString()}-byte budget.
          </Box>
          <Typography variant="body2" color="text.secondary">
            Theoretical ceiling — 4 ops each saturating the{" "}
            {HIVE_CUSTOM_OP_DATA_MAX_LENGTH.toLocaleString()}-byte per-op cap ≈{" "}
            {PER_OP_LIMIT_BUDGET.toLocaleString()} bytes of payload, well under
            the {HIVE_TX_PRACTICAL_BYTES.toLocaleString()}-byte tx budget. The
            per-op <code>json</code> limit is the binding constraint, not the
            transaction size.
          </Typography>
        </Stack>
      </Box>
    );
  },
  play: async () => {
    // Every builder, fed its realistic-max input, must respect Hive's
    // per-op json and id limits.
    for (const row of ALL_ROWS.map(sizeRow)) {
      await expect(
        row.jsonBytes,
        `${row.label}: json field exceeds HIVE_CUSTOM_OP_DATA_MAX_LENGTH`
      ).toBeLessThanOrEqual(HIVE_CUSTOM_OP_DATA_MAX_LENGTH);
      await expect(
        row.idBytes,
        `${row.label}: id field exceeds HIVE_CUSTOM_OP_ID_MAX_LENGTH`
      ).toBeLessThanOrEqual(HIVE_CUSTOM_OP_ID_MAX_LENGTH);
    }

    // Realistic batch sizes should fit with comfortable headroom.
    await expect(ceilings.rental).toBeGreaterThan(
      REALISTIC_RENTAL_AUTHORIZATIONS
    );
    await expect(ceilings.renew).toBeGreaterThan(REALISTIC_RENEWAL_BATCH);
    await expect(ceilings.rentOnBehalf).toBeGreaterThan(
      REALISTIC_RENT_ON_BEHALF_BATCH
    );
    await expect(ceilings.workers).toBeGreaterThan(FULL_DEED_WORKER_SLOTS);

    // The configured MAX_ITEM_SIZE_IN_OPERATION must be safe for every
    // flow that chunks against it.
    await expect(ceilings.renew).toBeGreaterThanOrEqual(
      MAX_ITEM_SIZE_IN_OPERATION
    );
    await expect(ceilings.rentOnBehalf).toBeGreaterThanOrEqual(
      MAX_ITEM_SIZE_IN_OPERATION
    );

    // A 4-op worst-case transaction must fit the practical tx budget.
    await expect(WORST_CASE_TX_BYTES).toBeLessThanOrEqual(
      HIVE_TX_PRACTICAL_BYTES
    );
  },
};
