"use client";

import LoginComponent from "@/components/auth/LoginComponent";
import AlertsTabLabel from "@/components/land-manager/alerts/AlertsTabLabel";
import { LandManagerAlertsProvider } from "@/components/land-manager/alerts/LandManagerAlertsProvider";
import ConfigDialog from "@/components/land-manager/config/ConfigDialog";
import {
  LandManagerAuthStatus,
  LandManagerContextProvider,
  useLandManagerContext,
} from "@/lib/frontend/context/LandManagerContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { LandManagerConfig } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  Settings as SettingsIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface Props {
  auth: LandManagerAuthStatus;
  initialConfig: LandManagerConfig;
  allRegions: SplProductionOverviewRegion[];
  children: ReactNode;
}

const NAV_TABS: { label: ReactNode; href: string }[] = [
  { label: "Harvest", href: "/land-manager/harvest" },
  { label: "Production", href: "/land-manager/production" },
  { label: "Worksite", href: "/land-manager/worksite" },
  { label: "Rental Overview", href: "/land-manager/rental" },
  { label: <AlertsTabLabel />, href: "/land-manager/alerts" },
];

function ExperimentalNotice() {
  return (
    <Box sx={{ p: 0.5 }}>
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
            Every action shows you its plan first. Buttons ending in{" "}
            <strong>…</strong> open a dialog listing exactly which operations
            will run — nothing is broadcast until you press{" "}
            <strong>Confirm &amp; Execute</strong>. Read the plan before
            confirming.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            If something does not behave as expected, please reach out to{" "}
            <strong>beaker007</strong> with details of what happened.
          </Typography>
        </li>
      </Box>
    </Box>
  );
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

function LandManagerShell({ children }: { children: ReactNode }) {
  const {
    auth,
    config,
    setConfig,
    allRegions,
    triggerRefresh,
    configDialogOpen,
    configDialogSection,
    openConfigDialog,
    closeConfigDialog,
  } = useLandManagerContext();
  const pathname = usePathname();
  usePageTitle("Land Manager");

  if (!auth.authenticated) {
    return <NotLoggedIn />;
  }

  const activeTabIndex = NAV_TABS.findIndex((t) =>
    pathname?.startsWith(t.href)
  );

  return (
    <LandManagerAlertsProvider>
      <Box maxWidth={2400} mx="auto" py={2}>
        {/* Header — the page title itself lives in the top bar. */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Stack direction="row" alignItems="center" gap={1}>
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
            <Tooltip
              title={<ExperimentalNotice />}
              arrow
              slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
            >
              <Chip
                icon={<WarningAmberIcon />}
                label="Experimental"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ cursor: "help" }}
              />
            </Tooltip>
          </Stack>
          <Tooltip title="Configure regions & settings">
            <IconButton onClick={() => openConfigDialog()} color="inherit">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider sx={{ mb: 1 }} />

        {/* Navigation tabs */}
        <Tabs
          value={activeTabIndex === -1 ? false : activeTabIndex}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          {NAV_TABS.map((tab) => (
            <Tab
              key={tab.href}
              label={tab.label}
              component={Link}
              href={tab.href}
            />
          ))}
        </Tabs>

        {/* Page-specific content */}
        {children}

        {/* The dialog seeds its edit state from `config` on mount, so remount
            it when the enabled regions are saved elsewhere (the Harvest page's
            region chips) — otherwise it would reopen with, and re-save, stale
            regions. */}
        <ConfigDialog
          key={config.enabled_regions.join(",")}
          open={configDialogOpen}
          onClose={closeConfigDialog}
          config={config}
          allRegions={allRegions}
          focusedSection={configDialogSection}
          onSaved={(updated) => {
            setConfig(updated);
            triggerRefresh();
          }}
        />
      </Box>
    </LandManagerAlertsProvider>
  );
}

export default function LandManagerProvider({
  auth,
  initialConfig,
  allRegions,
  children,
}: Props) {
  return (
    <LandManagerContextProvider
      key={auth.username ?? "anonymous"}
      auth={auth}
      initialConfig={initialConfig}
      allRegions={allRegions}
    >
      <LandManagerShell>{children}</LandManagerShell>
    </LandManagerContextProvider>
  );
}
