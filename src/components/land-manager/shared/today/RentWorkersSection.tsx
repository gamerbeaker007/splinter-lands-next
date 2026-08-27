"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { TodayLogs } from "@/types/landManager";
import { Stack } from "@mui/material";
import StatChip from "./StatChip";
import TodaySection from "./TodaySection";

type WorkerLog = NonNullable<TodayLogs["worker"]>;

/** Cards rented as workers today, and what they cost. */
export default function RentWorkersSection({ log }: { log: WorkerLog }) {
  return (
    <TodaySection title="Rent Workers" txIds={log.rent_transactions}>
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        <StatChip label={`Rented: ${log.rented_count}`} />
        {renderResourceChip("DEC", log.rent_total_dec)}
      </Stack>
    </TodaySection>
  );
}
