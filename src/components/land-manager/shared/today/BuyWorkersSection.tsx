"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { TodayLogs } from "@/types/landManager";
import { Stack } from "@mui/material";
import StatChip from "./StatChip";
import TodaySection from "./TodaySection";

type WorkerLog = NonNullable<TodayLogs["worker"]>;

/** Cards bought outright as workers today, in DEC and in USD. */
export default function BuyWorkersSection({ log }: { log: WorkerLog }) {
  return (
    <TodaySection title="Buy Workers" txIds={log.purchase_transactions}>
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        <StatChip label={`Bought: ${log.bought_count}`} />
        {renderResourceChip("DEC", log.buy_total_dec)}
        <StatChip label={`$${log.buy_total_usd.toFixed(2)}`} />
      </Stack>
    </TodaySection>
  );
}
