"use client";

import {
  renderResourceChip,
  renderResourceIcon,
} from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { ActionSummary, TodayLogs } from "@/types/landManager";
import { Box, Stack, Typography } from "@mui/material";
import TodaySection from "./TodaySection";

type MakeHarvestableLog = NonNullable<TodayLogs["makeHarvestable"]>;

const toLabel: Record<string, string> = {
  transfer: "Transfer",
  swap: "Swap",
  buy_dec: "Buy with DEC",
  pool: "Pool withdrawal",
};

function getLabel(type: string): string {
  return toLabel[type] ?? "Unknown type";
}

function renderRow(a: ActionSummary): React.ReactNode {
  switch (a.type) {
    case "pool":
      return (
        // For pool withdrawals in_amount is a share FRACTION of the
        // position, not a resource amount.
        <Box
          component="span"
          gap={0.5}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            verticalAlign: "middle",
          }}
        >
          {getLabel(a.type)}: {renderResourceIcon(a.to_symbol as Resource)}{" "}
          {(a.in_amount * 100).toFixed(1)}% of position →{" "}
          {renderResourceChip(a.to_symbol as Resource, a.out_amount)} in{" "}
          <strong>{a.to_region}</strong>
        </Box>
      );
    case "buy_dec":
      return (
        <>
          {getLabel(a.type)}:{" "}
          {renderResourceChip(a.from_symbol as Resource, a.in_amount)} → to{" "}
          {a.to_region}{" "}
          {renderResourceChip(a.to_symbol as Resource, a.out_amount)}
        </>
      );
    default:
      return (
        <>
          {getLabel(a.type)}: from {a.from_region}{" "}
          {renderResourceChip(a.from_symbol as Resource, a.in_amount)} → to{" "}
          {a.to_region}{" "}
          {renderResourceChip(a.to_symbol as Resource, a.out_amount)}
        </>
      );
  }
}

/** The moves made to get resources into the regions that needed them. */
export default function MakeHarvestableSection({
  log,
}: {
  log: MakeHarvestableLog;
}) {
  return (
    <TodaySection
      title="Make Harvestable"
      runs={log.runs}
      txIds={log.transactions}
    >
      <Stack gap={0.25}>
        {log.actions_json.map((a, i) => {
          return (
            <Typography
              key={i}
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {renderRow(a)}
            </Typography>
          );
        })}
      </Stack>
    </TodaySection>
  );
}
