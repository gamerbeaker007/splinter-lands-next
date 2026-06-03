"use client";

import LoginComponent from "@/components/auth/LoginComponent";
import FilterDrawer from "@/components/filter/FilterDrawer";
import AlertsPanel from "@/components/land-manager/AlertsPanel";
import BulkActionPanel from "@/components/land-manager/bulk-operations/BulkActionPanel";
import BulkDecActionsPanel from "@/components/land-manager/bulk-operations/BulkDecActionsPanel";
import BulkRentalPanel from "@/components/land-manager/bulk-operations/BulkRentalPanel";
import ConfigDialog from "@/components/land-manager/ConfigDialog";
import MythicOverview from "@/components/land-manager/MythicOverview";
import RegionOverview from "@/components/land-manager/RegionOverview";
import RegionResourceSummary from "@/components/land-manager/RegionResourceSummary";
import RentalAuthorityCard from "@/components/land-manager/RentalAuthorityCard";
import RentalOverview from "@/components/land-manager/RentalOverview";
import TodayPanel from "@/components/land-manager/TodayPanel";
import WorksiteTab from "@/components/land-manager/worksites/WorksiteTab";
import { useRentalAuthorityStatus } from "@/hooks/useRentalAuthorityStatus";
import { getPlayerMythicDeeds } from "@/lib/backend/actions/land-manager/overview-actions";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { NATURAL_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  DEFAULT_DONATION_CONFIG,
  DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
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
  Tab,
  Tabs,
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
      donation: DEFAULT_DONATION_CONFIG,
      post_harvest_strategy: DEFAULT_POST_HARVEST_STRATEGY,
      post_harvest_excluded_resources: [],
      post_harvest_sell_pct: DEFAULT_POST_HARVEST_SELL_PCT,
      post_harvest_pool_pct: DEFAULT_POST_HARVEST_POOL_PCT,
      rental: DEFAULT_RENTAL_CONFIG,
    }
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [regionRefreshKey, setRegionRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
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
  const handleSuccess = () => setRegionRefreshKey((k) => k + 1);
  const donation = currentConfig.donation;
  const donationEnabled = donation.enabled && donation.pct > 0;

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

      {/* ── Common top sections ─────────────────────────────────────────── */}

      {/* Resource balance summary */}
      <RegionResourceSummary
        regions={allRegions}
        enabledRegions={currentConfig.enabled_regions}
        refreshKey={regionRefreshKey}
      />

      {/* Today's activity log */}
      <TodayPanel refreshKey={regionRefreshKey} />

      <AlertsPanel
        enabledRegions={currentConfig.enabled_regions}
        refreshKey={regionRefreshKey}
      />

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label="Harvest" />
        <Tab label="Rental" />
        <Tab label="DEC Actions" />
        <Tab label="Worksites" />
      </Tabs>

      {/* ── Harvest tab ─────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <>
          <Stack direction="row" alignItems="center" mb={1.5}>
            {donationEnabled ? (
              <Tooltip
                title={
                  <Stack spacing={1} sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={700}>
                      Donation {donation.pct}%
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      Daily caps
                    </Typography>
                    <Stack spacing={0.5}>
                      {NATURAL_RESOURCES.map((symbol) => {
                        const cap = Number(donation.daily_caps?.[symbol] ?? 0);
                        return (
                          <Stack
                            key={symbol}
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                          >
                            <Box
                              component="img"
                              src={RESOURCE_ICON_MAP[symbol]}
                              alt={symbol}
                              sx={{ width: 16, height: 16 }}
                            />
                            <Typography variant="caption">
                              {cap.toLocaleString()}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Donation applies to all harvest operations and can be
                      adjusted in the config.
                    </Typography>
                  </Stack>
                }
              >
                <Chip
                  size="small"
                  label="Donation Enabled"
                  sx={{
                    fontWeight: 600,
                    bgcolor: "success.main",
                    color: "common.white",
                  }}
                />
              </Tooltip>
            ) : (
              <Chip
                size="small"
                label="Donation Disabled"
                sx={{
                  fontWeight: 600,
                  bgcolor: "warning.main",
                  color: "common.white",
                }}
              />
            )}
          </Stack>

          <BulkActionPanel
            username={auth.username ?? ""}
            regions={allRegions}
            enabledRegions={currentConfig.enabled_regions}
            strategies={currentConfig.make_harvestable_strategies}
            donation={currentConfig.donation}
            postHarvestStrategy={currentConfig.post_harvest_strategy}
            postHarvestExcludedResources={
              currentConfig.post_harvest_excluded_resources
            }
            postHarvestSellPct={currentConfig.post_harvest_sell_pct}
            postHarvestPoolPct={currentConfig.post_harvest_pool_pct}
            hasMythics={
              enabledMythicDeeds !== null && enabledMythicDeeds.length > 0
            }
            onSuccess={handleSuccess}
          />

          <MythicOverview deeds={enabledMythicDeeds} />

          {/* Per-region overview with harvestable resources */}
          <RegionOverview
            username={auth.username ?? ""}
            regions={allRegions}
            enabledRegions={currentConfig.enabled_regions}
            donation={currentConfig.donation}
            refreshKey={regionRefreshKey}
          />
        </>
      )}

      {/* ── Rental tab ──────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <FilterProvider>
          {/* player=null → categorical filters show site-wide options;
              RentalOverview narrows regions/tracts/plots via locationOverride. */}
          <FilterDrawer
            player={null}
            filtersEnabled={{
              regions: true,
              attributes: true,
              player: false,
              sorting: false,
            }}
          />
          <RentalAuthorityCard authority={authorityHook} />

          <BulkRentalPanel
            username={auth.username ?? ""}
            enabledRegions={currentConfig.enabled_regions}
            rental={currentConfig.rental}
            authorityStatus={authorityHook.status}
            refreshKey={regionRefreshKey}
            onSuccess={handleSuccess}
          />

          <RentalOverview
            username={auth.username ?? ""}
            enabledRegions={currentConfig.enabled_regions}
            refreshKey={regionRefreshKey}
            onSuccess={handleSuccess}
          />
        </FilterProvider>
      )}

      {/* ── DEC Actions tab ───────────────────────────────────────────── */}
      {activeTab === 2 && (
        <BulkDecActionsPanel
          username={auth.username ?? ""}
          enabledRegions={currentConfig.enabled_regions}
          refreshKey={regionRefreshKey}
          onSuccess={handleSuccess}
        />
      )}

      {/* ── Worksites tab ─────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <WorksiteTab
          username={auth.username ?? ""}
          enabledRegions={currentConfig.enabled_regions}
          strategies={currentConfig.make_harvestable_strategies}
          onSuccess={handleSuccess}
        />
      )}

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
