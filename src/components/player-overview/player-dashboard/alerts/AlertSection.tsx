"use client";

import { usePlayerAlerts } from "@/hooks/usePlayerAlerts";
import { countUnassigned } from "@/lib/shared/player/playerAlerts";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import {
  AssignmentInd,
  Block,
  FormatColorReset,
  Grass,
  KeyboardDoubleArrowUp,
  Landscape,
  MilitaryTech,
  RemoveCircleOutline,
  Store,
  Token,
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
import { MissingBloodLineBoostAlerts } from "./MissingBloodLineBoostAlerts";
import { NegativeDECAlerts } from "./NegativeDECAlerts";
import { NoWorkersAlerts } from "./NoWorkersAlerts";
import { PowerCoreAlerts } from "./PowerCoreAlerts";
import { RationingLiteAlerts } from "./RationingLiteAlerts";
import { TerrainBoostsCard } from "./TerrainBoostsCard";
import { TooMuchPPAlerts } from "./TooMuchPPAlerts";
import { UnassignedStakeItemsAlert } from "./UnassignedStakeItemsAlert";

type Props = {
  finishedFullAlerts: DeedAlertsInfo[];
  player: string;
  force: boolean;
};

export default function AlertSection({
  finishedFullAlerts,
  player,
  force,
}: Props) {
  const { playerAlerts, loading, error } = usePlayerAlerts(player, force);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  if (loading) return <AlertSectionSkeleton />;
  if (error) return <div>Error loading alerts: {error}</div>;
  if (!playerAlerts) return <div>No alerts available.</div>;

  // Button configs
  const buttons = [
    {
      key: "finishedBuilding",
      label: "Finished/Full",
      alertsCount: finishedFullAlerts.length,
      icon: <Store fontSize="large" />,
      dialogTitle: "Finished Building / Full Store",
      dialogContent: <DeedAlertSection alerts={finishedFullAlerts} />,
    },
    {
      key: "AssignedWorkersAlert",
      label: "Missing Workers",
      alertsCount: playerAlerts?.assignedWorkersAlerts?.length ?? 0,
      icon: <AssignmentInd fontSize="large" />,
      dialogTitle: "Assigned Workers Alert",
      dialogContent: (
        <AssignedWorkersAlerts
          assignedWorkersAlerts={playerAlerts.assignedWorkersAlerts}
        />
      ),
    },
    {
      key: "NotAssignedWorkers",
      label: "No Workers",
      alertsCount: playerAlerts?.noWorkersAlerts?.length ?? 0,
      icon: <Warning fontSize="large" />,
      dialogTitle: "No Workers Assigned",
      dialogContent: (
        <NoWorkersAlerts noWorkersAlerts={playerAlerts?.noWorkersAlerts} />
      ),
    },
    {
      key: "NegativeTerrainBoost",
      label: "Negative Boost",
      alertsCount: playerAlerts?.terrainBoostAlerts.negative?.length ?? 0,
      icon: <Landscape fontSize="large" />,
      dialogTitle: "Cards assigned to terrain with negative boost",
      dialogContent: (
        <TerrainBoostsCard
          terrainBoosts={playerAlerts.terrainBoostAlerts.negative}
        />
      ),
    },
    {
      key: "ZeroNonNeutralTerrainBoost",
      label: "Zero Boost",
      alertsCount: playerAlerts?.terrainBoostAlerts.zeroNonNeutral?.length ?? 0,
      icon: <RemoveCircleOutline fontSize="large" />,
      dialogTitle: "Zero terrain boost (not neutral)",
      dialogContent: (
        <TerrainBoostsCard
          terrainBoosts={playerAlerts.terrainBoostAlerts.zeroNonNeutral}
        />
      ),
    },
    {
      key: "NegativeDECAlertsNaturalResource",
      label: "Negative DEC",
      subLabel: "Natural Resource",
      alertsCount: playerAlerts?.negativeDECNaturalResourceDeeds.length ?? 0,
      icon: <Warning fontSize="large" />,
      dialogTitle: "Deeds with Negative DEC Production Natural resource",
      dialogContent: (
        <NegativeDECAlerts
          negativeDECAlerts={playerAlerts.negativeDECNaturalResourceDeeds}
        />
      ),
    },
    {
      key: "NegativeDECAlertsOtherResource",
      label: "Negative DEC",
      subLabel: "Other Resource",
      alertsCount: playerAlerts?.negativeDECOtherResourceDeeds.length ?? 0,
      icon: <Warning fontSize="large" />,
      dialogTitle: "Deeds with Negative DEC Production Non Natural resource",
      dialogContent: (
        <NegativeDECAlerts
          negativeDECAlerts={playerAlerts.negativeDECOtherResourceDeeds}
        />
      ),
    },
    {
      key: "UnusedPowerSource",
      label: "Unused Power",
      alertsCount: playerAlerts.stakeItems.unusedPowerCores,
      icon: <BoltIcon fontSize="large" />,
      dialogTitle: "Unused Power Core",
      dialogContent: (
        <Typography variant="body1">
          You have {playerAlerts.stakeItems.unusedPowerCores} unused power
          source(s).
        </Typography>
      ),
    },
    {
      key: "noPowerSource",
      label: "No Power",
      alertsCount: playerAlerts?.noPowerSource.length ?? 0,
      icon: <BoltIcon fontSize="large" />,
      dialogTitle: "No Power Core",
      dialogContent: (
        <PowerCoreAlerts powerCoreAlerts={playerAlerts?.noPowerSource} />
      ),
    },
    {
      key: "UnassignedTitles",
      label: "Unassigned Titles",
      alertsCount: countUnassigned(playerAlerts.stakeItems.unassignedTitles),
      icon: <MilitaryTech fontSize="large" />,
      dialogTitle: "Titles not assigned to a plot",
      dialogContent: (
        <UnassignedStakeItemsAlert
          items={playerAlerts.stakeItems.unassignedTitles}
        />
      ),
    },
    {
      key: "UnassignedTotems",
      label: "Unassigned Totems",
      alertsCount: countUnassigned(playerAlerts.stakeItems.unassignedTotems),
      icon: <Token fontSize="large" />,
      dialogTitle: "Totems not assigned to a plot",
      dialogContent: (
        <UnassignedStakeItemsAlert
          items={playerAlerts.stakeItems.unassignedTotems}
        />
      ),
    },
    {
      key: "DoublePower",
      label: "Double Power",
      alertsCount: playerAlerts?.powerCoreWhileEnergized.length ?? 0,
      icon: <BoltIcon fontSize="large" />,
      dialogTitle: "Double Power (Power Core while Energized)",
      dialogContent: (
        <PowerCoreAlerts
          powerCoreAlerts={playerAlerts?.powerCoreWhileEnergized}
        />
      ),
    },
    {
      key: "MissingBloodlineBoost",
      label: "Missing Bloodline Boost",
      alertsCount: playerAlerts?.missingBloodLineBoost.length ?? 0,
      icon: <FormatColorReset fontSize="large" />,
      dialogTitle: "Deeds Missing Bloodline Boost",
      dialogContent: (
        <MissingBloodLineBoostAlerts
          missingBloodLineBoostAlerts={playerAlerts?.missingBloodLineBoost}
        />
      ),
    },
    {
      key: "TooMuchBasePP",
      label: "Too Much Base PP",
      alertsCount: playerAlerts?.tooMuchBasePP.length ?? 0,
      icon: <KeyboardDoubleArrowUp fontSize="large" />,
      dialogTitle: "Deeds with Base PP > 100K ",
      // <TooMuchBasePPAlerts tooMuchBasePP={playerAlerts?.tooMuchBasePP} />
      dialogContent: (
        <TooMuchPPAlerts tooMuchBasePP={playerAlerts?.tooMuchBasePP} />
      ),
    },
    {
      key: "RationingLiteAlert",
      label: "Rationing Lite Alert",
      alertsCount: playerAlerts?.rationingLiteAlerts.length ?? 0,
      icon: <Grass fontSize="large" />,
      dialogTitle: "Rationing Lite Alert While More Then 20K Base PP",
      dialogContent: (
        <RationingLiteAlerts
          rationingLiteAlerts={playerAlerts.rationingLiteAlerts}
        />
      ),
    },
    {
      key: "ZeroNeutralTerrainBoost",
      label: "Zero Boost (Neutral)",
      alertsCount: playerAlerts?.terrainBoostAlerts.zeroNeutral?.length ?? 0,
      icon: <Block fontSize="large" />,
      dialogTitle: "Zero terrain boost (neutral)",
      dialogContent: (
        <TerrainBoostsCard
          terrainBoosts={playerAlerts.terrainBoostAlerts.zeroNeutral}
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
