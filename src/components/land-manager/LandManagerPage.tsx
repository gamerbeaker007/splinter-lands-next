"use client";

import LoginComponent from "@/components/auth/LoginComponent";
import BulkActionPanel from "@/components/land-manager/BulkActionPanel";
import ConfigDialog from "@/components/land-manager/ConfigDialog";
import MythicOverview from "@/components/land-manager/MythicOverview";
import RegionOverview from "@/components/land-manager/RegionOverview";
import RegionResourceSummary from "@/components/land-manager/RegionResourceSummary";
import TodayPanel from "@/components/land-manager/TodayPanel";
import { getPlayerMythicDeeds } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  DEFAULT_POST_HARVEST_STRATEGY,
  LandManagerConfig,
  MythicDeed,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Settings as SettingsIcon } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface AuthStatus {
  authenticated: boolean;
  username: string | null | undefined;
}

interface Props {
  auth: AuthStatus;
  config: LandManagerConfig | null;
  allRegions: SplProductionOverviewRegion[];
}

function NotLoggedIn() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h4" fontWeight="bold">
        Land Manager
      </Typography>
      <Typography color="text.secondary" maxWidth={480}>
        Sign in with Hive Keychain to manage your Splinterlands land regions —
        harvest resources, configure actions, and track runs.
      </Typography>
      <LoginComponent />
    </Box>
  );
}

export default function LandManagerPage({ auth, config, allRegions }: Props) {
  const [currentConfig, setCurrentConfig] = useState<LandManagerConfig>(
    config ?? {
      player: auth.username ?? "",
      enabled_regions: [],
      make_harvestable_strategies: DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
      fee_accepted: false,
      post_harvest_strategy: DEFAULT_POST_HARVEST_STRATEGY,
      mythic_fee_accepted: false,
    }
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [regionRefreshKey, setRegionRefreshKey] = useState(0);
  const [allMythicDeeds, setAllMythicDeeds] = useState<MythicDeed[] | null>(
    null
  );

  useEffect(() => {
    getPlayerMythicDeeds().then(setAllMythicDeeds);
  }, [regionRefreshKey]);

  const enabledMythicDeeds =
    allMythicDeeds?.filter((d) =>
      currentConfig.enabled_regions.includes(d.region_number)
    ) ?? null;

  if (!auth.authenticated) {
    return <NotLoggedIn />;
  }

  const enabledCount = currentConfig.enabled_regions.length;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Stack direction="row" alignItems="center" gap={2}>
          <Typography variant="h4" fontWeight="bold">
            Land Manager
          </Typography>
          {auth.username && (
            <Chip
              avatar={
                <Avatar
                  src={`https://d36mxiodymuqjm.cloudfront.net/website/icons/avatars/avatar_${auth.username}.jpg`}
                  alt={auth.username}
                />
              }
              label={auth.username}
              variant="outlined"
              size="small"
            />
          )}
        </Stack>
        <Tooltip title="Configure regions & settings">
          <IconButton onClick={() => setConfigOpen(true)} color="inherit">
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Region status banner */}
      {enabledCount === 0 ? (
        <Alert
          severity="info"
          action={
            <Button
              size="small"
              color="inherit"
              onClick={() => setConfigOpen(true)}
            >
              Open Config
            </Button>
          }
        >
          No regions selected. Click <strong>Config</strong> to choose which of
          your regions to manage.
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" mb={1}>
          Showing {enabledCount} enabled region{enabledCount === 1 ? "" : "s"}.{" "}
          <Button
            size="small"
            onClick={() => setConfigOpen(true)}
            sx={{ ml: 0.5, p: 0, minWidth: 0, textTransform: "none" }}
          >
            Edit config
          </Button>
        </Typography>
      )}

      {/* Resource balance summary + bulk action buttons */}
      <RegionResourceSummary
        regions={allRegions}
        enabledRegions={currentConfig.enabled_regions}
      />

      <BulkActionPanel
        username={auth.username ?? ""}
        regions={allRegions}
        enabledRegions={currentConfig.enabled_regions}
        strategies={currentConfig.make_harvestable_strategies}
        harvestAck={currentConfig.fee_accepted}
        postHarvestStrategy={currentConfig.post_harvest_strategy}
        mythicFeeAccepted={currentConfig.mythic_fee_accepted}
        hasMythics={
          enabledMythicDeeds !== null && enabledMythicDeeds.length > 0
        }
        onSuccess={() => setRegionRefreshKey((k) => k + 1)}
      />

      <TodayPanel refreshKey={regionRefreshKey} />

      <MythicOverview deeds={enabledMythicDeeds} />

      {/* Per-region overview with harvestable resources */}
      <RegionOverview
        username={auth.username ?? ""}
        regions={allRegions}
        enabledRegions={currentConfig.enabled_regions}
        refreshKey={regionRefreshKey}
      />

      {/* Config dialog */}
      <ConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        config={currentConfig}
        allRegions={allRegions}
        onSaved={setCurrentConfig}
      />
    </Box>
  );
}
