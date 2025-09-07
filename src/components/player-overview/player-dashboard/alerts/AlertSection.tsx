import React, { useState } from "react";
import { usePlayerCardAlerts } from "@/hooks/usePlayerCardAlerts";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import { NoWorkersAlerts } from "./NoWorkersAlerts";
import { AssignedWorkersAlerts } from "./AssingedWorkersAlerts";
import { DeedAlertSection } from "./DeedAlertSection";
import { TerrainBoostsCard } from "./TerrainBoostsCard";
import {
  AssignmentInd,
  Warning,
  Store,
  Landscape,
  RemoveCircleOutline,
  Block,
} from "@mui/icons-material";

type Props = {
  alerts: DeedAlertsInfo[];
  player: string;
  force: boolean;
};

const AlertSection: React.FC<Props> = ({ alerts, player, force }) => {
  const { cardAlerts, loading, error } = usePlayerCardAlerts(player, force);

  // Dialog state
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  if (loading) return <div>Loading alerts...</div>;
  if (error) return <div>Error loading alerts: {error}</div>;
  if (!cardAlerts) return <div>No alerts available.</div>;

  // Button configs
  const buttons = [
    {
      key: "finishedBuilding",
      label: "Finished/Full",
      short: `(${alerts.length})`,
      icon: <Store fontSize="large" />,
      dialogTitle: "Finished Building / Full Store",
      dialogContent: <DeedAlertSection alerts={alerts} />,
    },
    {
      key: "AssignedWorkersAlert",
      label: "Assigned Workers",
      short: `(${cardAlerts?.assignedWorkersAlerts?.length ?? 0})`,
      icon: <AssignmentInd fontSize="large" />,
      dialogTitle: "Assigned Workers Alert",
      dialogContent: (
        <AssignedWorkersAlerts
          assignedWorkersAlerts={cardAlerts.assignedWorkersAlerts}
        />
      ),
    },
    {
      key: "NotAssignedWorkers",
      label: "No Workers",
      short: `(${cardAlerts?.noWorkersAlerts?.length ?? 0})`,
      icon: <Warning fontSize="large" />,
      dialogTitle: "No Workers Assigned",
      dialogContent: (
        <NoWorkersAlerts noWorkersAlerts={cardAlerts?.noWorkersAlerts} />
      ),
    },
    {
      key: "NegativeTerrainBoost",
      label: "Negative Boost",
      short: ` (${cardAlerts?.terrainBoostAlerts.negative?.length ?? 0})`,
      icon: <Landscape fontSize="large" />,
      dialogTitle: "Cards assigned to terrain with negative boost",
      dialogContent: (
        <TerrainBoostsCard
          terrainBoosts={cardAlerts.terrainBoostAlerts.negative}
        />
      ),
    },
    {
      key: "ZeroNonNeutralTerrainBoost",
      label: "Zero Boost",
      short: `(${cardAlerts?.terrainBoostAlerts.zeroNonNeutral?.length ?? 0})`,
      icon: <RemoveCircleOutline fontSize="large" />,
      dialogTitle: "Zero terrain boost (not neutral)",
      dialogContent: (
        <TerrainBoostsCard
          terrainBoosts={cardAlerts.terrainBoostAlerts.zeroNonNeutral}
        />
      ),
    },
    {
      key: "ZeroNeutralTerrainBoost",
      label: "Zero Neutral",
      short: `(${cardAlerts?.terrainBoostAlerts.zeroNeutral?.length ?? 0})`,
      icon: <Block fontSize="large" />,
      dialogTitle: "Zero terrain boost (neutral)",
      dialogContent: (
        <TerrainBoostsCard
          terrainBoosts={cardAlerts.terrainBoostAlerts.zeroNeutral}
        />
      ),
    },
  ];

  return (
    <Box width="100%" display="flex" flexWrap="wrap" gap={2}>
      <Typography variant="h5">Alerts</Typography>
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ width: "100%" }}
      >
        {buttons.map((btn) => (
          <Button
            key={btn.key}
            color="inherit"
            variant="contained"
            onClick={() => setOpenDialog(btn.key)}
            sx={{
              maxWidth: 200,
              width: { xs: "100%", sm: "auto" },
              flex: "1 1 200px",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {btn.icon}
            <Box mt={1} fontWeight="bold">
              {btn.label}
            </Box>
            <Box fontSize="small" color="text.secondary">
              {btn.short}
            </Box>
          </Button>
        ))}
      </Stack>
      {buttons.map((btn) => (
        <Dialog
          key={btn.key}
          open={openDialog === btn.key}
          onClose={() => setOpenDialog(null)}
          fullWidth
          maxWidth={false}
          slotProps={{
            paper: {
              sx: {
                width: "80vw",
                maxWidth: "80vw",
                maxHeight: "80vh",
              },
            },
          }}
        >
          <DialogTitle>{btn.dialogTitle}</DialogTitle>
          <DialogContent>{btn.dialogContent}</DialogContent>
        </Dialog>
      ))}
    </Box>
  );
};

export default AlertSection;
