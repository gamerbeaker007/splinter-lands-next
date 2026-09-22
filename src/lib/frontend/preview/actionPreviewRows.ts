import { ActionPreviewAmount, ActionPreviewRow } from "@/types/actionPreview";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import {
  ActionSummary,
  MakeHarvestableStrategy,
  PostHarvestActionSummary,
  TopUpPoolPlan,
  TopUpPoolStrategy,
} from "@/types/landManager";

// ─────────────────────────────────────────────────────────────────────────────
// Turning a plan into preview rows.
//
// Pure: every function here takes what the planner already produced and only
// re-shapes it. Nothing is re-derived, so a row can never claim something the
// plan itself would not do.
// ─────────────────────────────────────────────────────────────────────────────

/** Amounts below this round to nothing on-chain and would only add noise. */
const MIN_SHOWN_AMOUNT = 0.001;

/** Accumulate `amount` of `symbol` into an amount list, in first-seen order. */
function add(list: ActionPreviewAmount[], symbol: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const existing = list.find((a) => a.symbol === symbol);
  if (existing) existing.amount += amount;
  else list.push({ symbol, amount });
}

/**
 * Resource reading order, shared by every row so a symbol always sits in the
 * same place: production order first, then anything unrecognised, then DEC.
 *
 * DEC is deliberately last everywhere. It is the currency rather than a
 * resource, and it is the number that flips sign between actions (income from a
 * pool withdrawal, cost of a purchase), so it reads best as the closing term.
 */
function symbolRank(symbol: string): number {
  if (symbol === "DEC") return PRODUCING_RESOURCES.length + 1;
  const index = PRODUCING_RESOURCES.indexOf(symbol);
  return index === -1 ? PRODUCING_RESOURCES.length : index;
}

function sortAmounts(amounts: ActionPreviewAmount[]): ActionPreviewAmount[] {
  return [...amounts].sort(
    (a, b) => symbolRank(a.symbol) - symbolRank(b.symbol)
  );
}

/** Drop rows that ended up carrying nothing worth showing, and order the rest. */
function prune(rows: ActionPreviewRow[]): ActionPreviewRow[] {
  for (const row of rows) {
    row.spend = sortAmounts(
      row.spend.filter((a) => a.amount >= MIN_SHOWN_AMOUNT)
    );
    row.receive = sortAmounts(
      row.receive.filter((a) => a.amount >= MIN_SHOWN_AMOUNT)
    );
  }
  return rows.filter((r) => r.spend.length > 0 || r.receive.length > 0);
}

/**
 * Fetch (or create) the row for `key`, keeping the order the caller declared
 * rather than the order the plan happened to produce.
 */
function rowFor(
  rows: Map<string, ActionPreviewRow>,
  key: string,
  label: string
): ActionPreviewRow {
  let row = rows.get(key);
  if (!row) {
    row = { key, label, spend: [], receive: [] };
    rows.set(key, row);
  }
  return row;
}

// ── Make Harvestable ─────────────────────────────────────────────────────────

const MAKE_HARVESTABLE_ROW_LABELS: Record<MakeHarvestableStrategy, string> = {
  pool: "Pool (Withdraw)",
  transfer: "Transfer",
  swap: "Swap",
  buy_dec: "Buy",
};

const MAKE_HARVESTABLE_ROW_ORDER: MakeHarvestableStrategy[] = [
  "pool",
  "transfer",
  "swap",
  "buy_dec",
];

/**
 * One row per strategy that contributed, summed over every region.
 *
 * `transfer` shows only what arrives: the resource moves between the player's
 * own regions, so the region it left is not a cost. `swap` and `buy_dec` pay
 * for what they deliver, so both sides are shown.
 */
export function makeHarvestablePreviewRows(
  actions: ActionSummary[]
): ActionPreviewRow[] {
  const rows = new Map<string, ActionPreviewRow>();
  for (const key of MAKE_HARVESTABLE_ROW_ORDER) {
    if (actions.some((a) => a.type === key))
      rowFor(rows, key, MAKE_HARVESTABLE_ROW_LABELS[key]);
  }

  for (const action of actions) {
    const row = rowFor(
      rows,
      action.type,
      MAKE_HARVESTABLE_ROW_LABELS[action.type] ?? action.type
    );
    switch (action.type) {
      case "pool":
        // Withdrawing matured liquidity returns both sides of the position.
        add(row.receive, action.to_symbol, action.out_amount);
        add(row.receive, "DEC", action.dec_amount ?? 0);
        break;
      case "transfer":
        add(row.receive, action.to_symbol, action.out_amount);
        break;
      case "swap":
        add(row.spend, action.from_symbol, action.in_amount);
        add(row.receive, action.to_symbol, action.out_amount);
        break;
      case "buy_dec":
        add(row.spend, "DEC", action.in_amount);
        add(row.receive, action.to_symbol, action.out_amount);
        break;
    }
  }
  return prune([...rows.values()]);
}

// ── Harvest All / Harvest Mythics ────────────────────────────────────────────

/**
 * What the harvest itself yields, and what the donation gives away from it.
 * Both are read straight off the plan, so the donation row already reflects the
 * daily caps and balance caps the planner applied.
 */
export function harvestPreviewRows(
  harvested: Record<string, number>,
  donated: Record<string, number> = {},
  /** Names the first row — "Harvest" for regions, "Taxes" for mythic deeds. */
  harvestLabel = "Harvest"
): ActionPreviewRow[] {
  const harvestRow: ActionPreviewRow = {
    key: "harvest",
    label: harvestLabel,
    spend: [],
    receive: [],
  };
  for (const [symbol, amount] of Object.entries(harvested))
    add(harvestRow.receive, symbol, amount);

  const donationRow: ActionPreviewRow = {
    key: "donation",
    label: "Donation",
    spend: [],
    receive: [],
  };
  for (const [symbol, amount] of Object.entries(donated))
    add(donationRow.spend, symbol, amount);

  return prune([harvestRow, donationRow]);
}

// ── Top Up Pools ─────────────────────────────────────────────────────────────

const TOP_UP_ROW_LABELS: Record<TopUpPoolStrategy, string> = {
  use_owned_dec: "Resources",
  swap_resource: "Swap",
  sell_resource: "Sell",
  buy_resources: "Buy",
};

const TOP_UP_ROW_ORDER: TopUpPoolStrategy[] = [
  "use_owned_dec",
  "swap_resource",
  "sell_resource",
  "buy_resources",
];

/**
 * One row per strategy — what that strategy alone trades — plus the deposit it
 * all funds.
 *
 * The strategy rows are the trades broadcast in phase 1; the deposit row is
 * phase 2, and it is a pure cost: resource AND DEC leave the player and become
 * a liquidity position that only matures after the 30-day lock.
 */
export function topUpPreviewRows(plan: TopUpPoolPlan): ActionPreviewRow[] {
  const rows = new Map<string, ActionPreviewRow>();
  const ready = plan.resources.filter((r) => r.status === "READY");
  for (const key of TOP_UP_ROW_ORDER) {
    const used = ready.some((r) => r.contributing_strategies.includes(key));
    if (used) rowFor(rows, key, TOP_UP_ROW_LABELS[key]);
  }

  for (const resource of ready) {
    for (const step of resource.funding) {
      switch (step.kind) {
        case "sell": {
          const row = rowFor(
            rows,
            "sell_resource",
            TOP_UP_ROW_LABELS.sell_resource
          );
          add(row.spend, step.from_symbol, step.amount);
          add(row.receive, "DEC", step.dec_out);
          break;
        }
        case "buy": {
          const row = rowFor(
            rows,
            "buy_resources",
            TOP_UP_ROW_LABELS.buy_resources
          );
          add(row.spend, "DEC", step.dec_in);
          add(row.receive, resource.symbol, step.resource_out);
          break;
        }
        case "swap": {
          const row = rowFor(
            rows,
            "swap_resource",
            TOP_UP_ROW_LABELS.swap_resource
          );
          add(row.spend, step.from_symbol, step.in_amount);
          add(row.receive, resource.symbol, step.resource_out);
          break;
        }
      }
    }

    // `use_owned_dec` broadcasts no trade of its own, so unlike the strategies
    // above it has no funding step to read. Its whole cost is what the attempt
    // recorded: resource the player already held, plus the wallet DEC deposited
    // beside it.
    const ownedAttempts = resource.attempts.filter(
      (a) => a.strategy === "use_owned_dec" && a.ok
    );
    const owned = ownedAttempts.reduce((sum, a) => sum + a.covered, 0);
    const ownedDec = ownedAttempts.reduce((sum, a) => sum + a.dec_used, 0);
    if (owned > 0 || ownedDec > 0) {
      const row = rowFor(
        rows,
        "use_owned_dec",
        TOP_UP_ROW_LABELS.use_owned_dec
      );
      add(row.spend, resource.symbol, owned);
      add(row.spend, "DEC", ownedDec);
    }
  }

  const deposit: ActionPreviewRow = {
    key: "deposit",
    label: "Into pools",
    spend: [],
    receive: [],
    note: "locked 30 days",
  };
  for (const resource of ready) {
    add(deposit.spend, resource.symbol, resource.total_resource);
    add(deposit.spend, "DEC", resource.total_dec);
  }

  // Keep the configured strategy order, then the deposit they all feed.
  const ordered = TOP_UP_ROW_ORDER.map((key) => rows.get(key)).filter(
    (r): r is ActionPreviewRow => !!r
  );
  return prune([...ordered, deposit]);
}

// ── Process Resources ────────────────────────────────────────────────────────

const POST_HARVEST_ROW_LABELS: Record<
  PostHarvestActionSummary["type"],
  string
> = {
  sell_for_dec: "Sell",
  add_to_pool: "Into pools",
  buy_resource: "Buy",
  swap_resource: "Swap",
  transfer: "Transfer",
  remove_from_pool: "From pools",
  stake_dec: "Stake DEC",
};

const POST_HARVEST_ROW_ORDER: PostHarvestActionSummary["type"][] = [
  "sell_for_dec",
  "swap_resource",
  "buy_resource",
  "transfer",
  "remove_from_pool",
  "add_to_pool",
  "stake_dec",
];

/** One row per kind of post-harvest action, summed over every region. */
export function processResourcesPreviewRows(
  actions: PostHarvestActionSummary[]
): ActionPreviewRow[] {
  const rows = new Map<string, ActionPreviewRow>();

  for (const action of actions) {
    const row = rowFor(
      rows,
      action.type,
      POST_HARVEST_ROW_LABELS[action.type] ?? action.type
    );
    switch (action.type) {
      case "sell_for_dec":
        add(row.spend, action.symbol, action.resource_amount);
        add(row.receive, "DEC", action.dec_amount);
        break;
      case "add_to_pool":
        add(row.spend, action.symbol, action.resource_amount);
        add(row.spend, "DEC", action.dec_amount);
        break;
      case "buy_resource":
        add(row.spend, "DEC", action.dec_amount);
        add(row.receive, action.symbol, action.resource_amount);
        break;
      case "swap_resource":
        add(row.spend, action.symbol, action.resource_amount);
        add(
          row.receive,
          action.to_symbol ?? action.symbol,
          action.to_resource_amount ?? 0
        );
        break;
      case "transfer":
        // Between the player's own regions: only what arrives is news.
        add(
          row.receive,
          action.to_symbol ?? action.symbol,
          action.to_resource_amount ?? action.resource_amount
        );
        break;
      case "remove_from_pool":
        add(row.receive, action.symbol, action.resource_amount);
        add(row.receive, "DEC", action.dec_amount);
        break;
      case "stake_dec":
        add(row.spend, "DEC", action.dec_amount);
        break;
    }
  }

  const ordered = POST_HARVEST_ROW_ORDER.map((key) => rows.get(key)).filter(
    (r): r is ActionPreviewRow => !!r
  );
  return prune(ordered);
}
