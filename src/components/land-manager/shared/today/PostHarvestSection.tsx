"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { PostHarvestActionSummary, TodayLogs } from "@/types/landManager";
import { Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import TodaySection from "./TodaySection";

type PostHarvestLog = NonNullable<TodayLogs["postHarvest"]>;
type ActionType = PostHarvestActionSummary["type"];

type Totals = {
  resource_amount: number;
  dec_amount: number;
  to_resource_amount: number;
};

/**
 * Aggregate the day's actions by (type, symbol). Top Up Pools shares this log
 * with Process Resources, so buys appear here too.
 */
function aggregate(
  actions: PostHarvestActionSummary[]
): Record<ActionType, Record<string, Totals>> {
  const buckets: Record<ActionType, Record<string, Totals>> = {
    sell_for_dec: {},
    buy_resource: {},
    add_to_pool: {},
    swap_resource: {},
    transfer: {},
    remove_from_pool: {},
  };
  for (const a of actions) {
    const bucket = buckets[a.type] ?? buckets.add_to_pool;
    // Build a key that distinguishes transfers to different regions and
    // swaps of the same symbol to different targets.
    let key: string;
    if (a.type === "transfer") {
      key = `${a.symbol}→${a.to_region_uid ?? ""}`;
    } else if (a.type === "swap_resource" && a.to_symbol) {
      key = `${a.symbol} → ${a.to_symbol}`;
    } else {
      key = a.symbol;
    }
    if (!bucket[key])
      bucket[key] = {
        resource_amount: 0,
        dec_amount: 0,
        to_resource_amount: 0,
      };
    bucket[key].resource_amount += a.resource_amount;
    bucket[key].dec_amount += a.dec_amount;
    bucket[key].to_resource_amount += a.to_resource_amount ?? 0;
  }
  return buckets;
}

const LABELS: Record<ActionType, (sym: string, v: Totals) => ReactNode> = {
  sell_for_dec: (sym, v) => (
    <>
      Sold: {renderResourceChip(sym as Resource, v.resource_amount)} →{" "}
      {renderResourceChip("DEC" as Resource, v.dec_amount)}
    </>
  ),
  buy_resource: (sym, v) => (
    <>
      Bought: {renderResourceChip("DEC" as Resource, v.dec_amount)} →{" "}
      {renderResourceChip(sym as Resource, v.resource_amount)}
    </>
  ),
  add_to_pool: (sym, v) => (
    <>
      Added: {renderResourceChip(sym as Resource, v.resource_amount)} |{" "}
      {renderResourceChip("DEC" as Resource, v.dec_amount)}
    </>
  ),
  // `sym` is already "FROM → TO" here.
  swap_resource: (sym, v) => {
    const [fromSymbol, toSymbol] = sym.split(" → ");
    return (
      <>
        Swapped: {renderResourceChip(fromSymbol as Resource, v.resource_amount)}{" "}
        → {renderResourceChip(toSymbol as Resource, v.to_resource_amount)}
      </>
    );
  },
  // `sym` is "SYMBOL→region_uid"
  transfer: (sym, v) => {
    const resource = sym.split("→")[0];
    return (
      <>
        Transferred:{" "}
        {renderResourceChip(resource as Resource, v.resource_amount)} (~
        {renderResourceChip(resource as Resource, v.to_resource_amount)}{" "}
        received)
      </>
    );
  },
  remove_from_pool: (sym, v) => (
    <>
      Withdrawn: {renderResourceChip(sym as Resource, v.resource_amount)} +{" "}
      {renderResourceChip("DEC" as Resource, v.dec_amount)}
    </>
  ),
};

/** Sells, buys, swaps and pool deposits made after the harvest. */
export default function PostHarvestSection({ log }: { log: PostHarvestLog }) {
  const buckets = aggregate(log.actions_json);

  return (
    <TodaySection
      title="Process Resources / Top Up Pools"
      runs={log.runs}
      txIds={log.transactions}
    >
      <Stack gap={0.25}>
        {Object.entries(buckets).flatMap(([type, bucket]) =>
          Object.entries(bucket).map(([sym, v]) => (
            <Typography
              key={`${type}-${sym}`}
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {LABELS[type as ActionType](sym, v)}
            </Typography>
          ))
        )}
      </Stack>
    </TodaySection>
  );
}
