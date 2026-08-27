"use client";

import { TodayLogs } from "@/types/landManager";
import { Stack } from "@mui/material";
import StatChip from "./StatChip";
import TodaySection from "./TodaySection";

type WorkerLog = NonNullable<TodayLogs["worker"]>;

/** Cards staked onto plots, from either the rent or the buy flow. */
export default function StakedWorkersSection({ log }: { log: WorkerLog }) {
  return (
    <TodaySection title="Workers Staked" txIds={log.stake_transactions}>
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        <StatChip label={`Staked: ${log.staked_count}`} />
      </Stack>
    </TodaySection>
  );
}
