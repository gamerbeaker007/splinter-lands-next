"use client";

import { usePlayerAlerts } from "@/hooks/action-based/usePlayerAlerts";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import {
  AssignmentInd,
  Block,
  Landscape,
  RemoveCircleOutline,
  Store,
  Warning,
} from "@mui/icons-material";
import BoltIcon from "@mui/icons-material/Bolt";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { AlertSectionSkeleton } from "./AlertSectionSkeleton";
import { AssignedWorkersAlerts } from "./AssingedWorkersAlerts";
import { DeedAlertSection } from "./DeedAlertSection";
import { NegativeDECAlerts } from "./NegativeDECAlerts";
import { NoWorkersAlerts } from "./NoWorkersAlerts";
import { PowerCoreAlerts } from "./PowerCoreAlerts";
import { TerrainBoostsCard } from "./TerrainBoostsCard";

type Props = {
  alerts: DeedAlertsInfo[];
  player: string;
  force: boolean;
};

export default function AlertSection({ alerts, player, force }: Props) {
  const { cardAlerts, loading, error } = usePlayerAlerts(player, force);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  if (loading) return <AlertSectionSkeleton />;
  if (error) return <div>Error loading alerts: {error}</div>;
  if (!cardAlerts) return <div>No alerts available.</div>;

  // Button configs
  const buttons = [
    {
      key: "finishedBuilding",
      label: "Finished/Full",
      alertsCount: alerts.length,
      icon: <Store fontSize="large" />,
      dialogTitle: "Finished Building / Full Store",
      dialogContent: <DeedAlertSection alerts={alerts} />,
    },
    {
      key: "AssignedWorkersAlert",
      label: "Missing Workers",
      alertsCount: cardAlerts?.assignedWorkersAlerts?.length ?? 0,
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
      alertsCount: cardAlerts?.noWorkersAlerts?.length ?? 0,
      icon: <Warning fontSize="large" />,
      dialogTitle: "No Workers Assigned",
      dialogContent: (
        <NoWorkersAlerts noWorkersAlerts={cardAlerts?.noWorkersAlerts} />
      ),
    },
    {
      key: "NegativeTerrainBoost",
      label: "Negative Boost",
      alertsCount: cardAlerts?.terrainBoostAlerts.negative?.length ?? 0,
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
      alertsCount: cardAlerts?.terrainBoostAlerts.zeroNonNeutral?.length ?? 0,
      icon: <RemoveCircleOutline fontSize="large" />,
      dialogTitle: "Zero terrain boost (not neutral)",
      dialogContent: (
        <TerrainBoostsCard
          terrainBoosts={cardAlerts.terrainBoostAlerts.zeroNonNeutral}
        />
      ),
    },
    {
      key: "NegativeDECAlertsNaturalResource",
      label: "Negative DEC",
      subLabel: "Natural Resource",
      alertsCount: cardAlerts?.negativeDECNaturalResourceDeeds.length ?? 0,
      icon: <Warning fontSize="large" />,
      dialogTitle: "Deeds with Negative DEC Production Natural resource",
      dialogContent: (
        <NegativeDECAlerts
          negativeDECAlerts={cardAlerts.negativeDECNaturalResourceDeeds}
        />
      ),
    },
    {
      key: "NegativeDECAlertsOtherResource",
      label: "Negative DEC",
      subLabel: "Other Resource",
      alertsCount: cardAlerts?.negativeDECOtherResourceDeeds.length ?? 0,
      icon: <Warning fontSize="large" />,
      dialogTitle: "Deeds with Negative DEC Production Non Natural resource",
      dialogContent: (
        <NegativeDECAlerts
          negativeDECAlerts={cardAlerts.negativeDECOtherResourceDeeds}
        />
      ),
    },
    {
      key: "UnusedPowerSource",
      label: "Unused Power",
      alertsCount: cardAlerts?.unusedPowerSource ?? 0,
      icon: <BoltIcon fontSize="large" />,
      dialogTitle: "Unused Power Core",
      dialogContent: (
        <Typography variant="body1">
          You have {cardAlerts?.unusedPowerSource} unused power source(s).
        </Typography>
      ),
    },
    {
      key: "noPowerSource",
      label: "No Power",
      alertsCount: cardAlerts?.noPowerSource.length ?? 0,
      icon: <BoltIcon fontSize="large" />,
      dialogTitle: "No Power Core",
      dialogContent: (
        <PowerCoreAlerts powerCoreAlerts={cardAlerts?.noPowerSource} />
      ),
    },
    {
      key: "DoublePower",
      label: "Double Power",
      alertsCount: cardAlerts?.powerCoreWhileEnergized.length ?? 0,
      icon: <BoltIcon fontSize="large" />,
      dialogTitle: "Double Power (Power Core while Energized)",
      dialogContent: (
        <PowerCoreAlerts
          powerCoreAlerts={cardAlerts?.powerCoreWhileEnergized}
        />
      ),
    },
    {
      key: "ZeroNeutralTerrainBoost",
      label: "Zero Boost (Neutral)",
      alertsCount: cardAlerts?.terrainBoostAlerts.zeroNeutral?.length ?? 0,
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
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ width: "100%" }}
      >
        {buttons.map((btn) => {
          if (btn.alertsCount === 0) return null;
          return (
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
              <Box mt={1} fontSize={10} fontWeight="bold">
                {btn.label}
              </Box>
              {btn.subLabel && (
                <Box fontSize={8} color="text.secondary">
                  {btn.subLabel}
                </Box>
              )}
              <Box fontSize={10} color="text.secondary">
                ({btn.alertsCount})
              </Box>
            </Button>
          );
        })}
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
}
