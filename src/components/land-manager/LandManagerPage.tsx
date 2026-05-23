"use client";

import LoginComponent from "@/components/auth/LoginComponent";
import AlertsPanel from "@/components/land-manager/AlertsPanel";
import BulkActionPanel from "@/components/land-manager/bulk-operations/BulkActionPanel";
import ConfigDialog from "@/components/land-manager/ConfigDialog";
import MythicOverview from "@/components/land-manager/MythicOverview";
import RegionOverview from "@/components/land-manager/RegionOverview";
import RegionResourceSummary from "@/components/land-manager/RegionResourceSummary";
import RentalAuthorityCard from "@/components/land-manager/RentalAuthorityCard";
import RentalOverview from "@/components/land-manager/RentalOverview";
import TodayPanel from "@/components/land-manager/TodayPanel";
import { useRentalAuthorityStatus } from "@/hooks/useRentalAuthorityStatus";
import { getPlayerMythicDeeds } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  DEFAULT_POST_HARVEST_STRATEGY,
  DEFAULT_RENTAL_CONFIG,
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
      post_harvest_excluded_resources: [],
      mythic_fee_accepted: false,
      rental: DEFAULT_RENTAL_CONFIG,
    }
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [regionRefreshKey, setRegionRefreshKey] = useState(0);
  const authorityHook = useRentalAuthorityStatus();
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

      {/* Experimental feature disclaimer */}
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Experimental Feature
        </Typography>
        <Typography variant="body2">
          The Land Manager is still experimental. Some operations may produce
          unexpected results or errors in edge cases. A few tips to get started
          safely:
        </Typography>
        <Box component="ul" sx={{ mt: 0.5, mb: 0.5, pl: 2 }}>
          <li>
            <Typography variant="body2">
              Start with <strong>one or two regions</strong> before enabling all
              of them.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Always run <strong>Dry Run</strong> first to review exactly what
              operations will be executed — then confirm with{" "}
              <strong>Execute</strong>.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              If something does not behave as expected, please reach out to{" "}
              <strong>beaker007</strong> with details of what happened.
            </Typography>
          </li>
        </Box>
      </Alert>

      <RentalAuthorityCard authority={authorityHook} />

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
        refreshKey={regionRefreshKey}
      />

      <BulkActionPanel
        username={auth.username ?? ""}
        regions={allRegions}
        enabledRegions={currentConfig.enabled_regions}
        strategies={currentConfig.make_harvestable_strategies}
        harvestAck={currentConfig.fee_accepted}
        postHarvestStrategy={currentConfig.post_harvest_strategy}
        postHarvestExcludedResources={
          currentConfig.post_harvest_excluded_resources
        }
        mythicFeeAccepted={currentConfig.mythic_fee_accepted}
        hasMythics={
          enabledMythicDeeds !== null && enabledMythicDeeds.length > 0
        }
        rental={currentConfig.rental}
        authorityStatus={authorityHook.status}
        refreshKey={regionRefreshKey}
        onSuccess={() => setRegionRefreshKey((k) => k + 1)}
      />

      <TodayPanel refreshKey={regionRefreshKey} />

      <AlertsPanel
        enabledRegions={currentConfig.enabled_regions}
        refreshKey={regionRefreshKey}
      />

      <MythicOverview deeds={enabledMythicDeeds} />

      {/* Per-region overview with harvestable resources */}
      <RegionOverview
        username={auth.username ?? ""}
        regions={allRegions}
        enabledRegions={currentConfig.enabled_regions}
        refreshKey={regionRefreshKey}
      />

      <RentalOverview
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
