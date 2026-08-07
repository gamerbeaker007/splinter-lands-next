"use client";

import { ACTION_META } from "@/components/land-manager/production/ConfirmActionDialog";
import { ProductionRow } from "@/components/land-manager/production/productionTypes";
import RenewRentalsActionControl from "@/components/land-manager/production/rental-actions/RenewRentalsActionControl";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { ProductionActionKind } from "@/hooks/useProductionPlotActions";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import DecPowerRow from "./dec-actions/DecPowerRow";

interface Props {
  username: string;
  filteredRows: ProductionRow[];
  loading: boolean;
  busy: boolean;
  regionData: Pick<
    ReturnType<typeof useLandManagerRegionData>,
    "globalShortfall" | "globalExcess"
  >;
  decAnyBusy: boolean;
  onStakeBusy: (busy: boolean) => void;
  onUnstakeBusy: (busy: boolean) => void;
  onSuccess: () => void;
  onOpenBulkConfirm: (
    kind: ProductionActionKind,
    rows: ProductionRow[]
  ) => void;
  actionableRows: (
    kind: ProductionActionKind,
    rows: ProductionRow[]
  ) => ProductionRow[];
}

export default function BulkActionsAccordion({
  username,
  filteredRows,
  loading,
  busy,
  regionData,
  decAnyBusy,
  onStakeBusy,
  onUnstakeBusy,
  onSuccess,
  onOpenBulkConfirm,
  actionableRows,
}: Props) {
  return (
    <Accordion sx={{ mt: 2 }} TransitionProps={{ unmountOnExit: true }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" fontWeight={700}>
          Bulk Actions
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
        >
          Plot actions - {filteredRows.length} filtered plot
          {filteredRows.length !== 1 ? "s" : ""}:
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
          {(
            [
              "powerOn",
              "unpower",
              "removeWorkers",
              "empty",
            ] as ProductionActionKind[]
          ).map((kind) => {
            const targets = actionableRows(kind, filteredRows);
            const meta = ACTION_META[kind];
            return (
              <Button
                key={kind}
                size="small"
                variant="outlined"
                color={meta.destructive ? "error" : "success"}
                disabled={loading || busy || targets.length === 0}
                onClick={() => onOpenBulkConfirm(kind, targets)}
              >
                {meta.title} ({targets.length})
              </Button>
            );
          })}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
        >
          DEC Power:
        </Typography>
        <Stack direction="column" gap={0.5} mb={1.5}>
          <DecPowerRow
            username={username}
            direction="up"
            availableTotal={Math.ceil(regionData.globalShortfall)}
            anyBusy={decAnyBusy}
            onBusyChange={onStakeBusy}
            onSuccess={onSuccess}
          />
          <DecPowerRow
            username={username}
            direction="down"
            availableTotal={Math.floor(regionData.globalExcess)}
            anyBusy={decAnyBusy}
            onBusyChange={onUnstakeBusy}
            onSuccess={onSuccess}
          />
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
        >
          Rentals:
        </Typography>
        <RenewRentalsActionControl username={username} onSuccess={onSuccess} />
      </AccordionDetails>
    </Accordion>
  );
}
