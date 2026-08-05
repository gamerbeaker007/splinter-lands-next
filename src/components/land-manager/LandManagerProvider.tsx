"use client";

import LoginComponent from "@/components/auth/LoginComponent";
import ConfigDialog from "@/components/land-manager/config/ConfigDialog";
import AlertsPanel from "@/components/land-manager/shared/AlertsPanel";
import RegionResourceSummary from "@/components/land-manager/shared/RegionResourceSummary";
import TodayPanel from "@/components/land-manager/shared/TodayPanel";
import {
  LandManagerAuthStatus,
  LandManagerContextProvider,
  useLandManagerContext,
} from "@/lib/frontend/context/LandManagerContext";
import { LandManagerConfig } from "@/types/landManager";
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

interface Props {
  auth: LandManagerAuthStatus;
  initialConfig: LandManagerConfig;
  allRegions: SplProductionOverviewRegion[];
  children: ReactNode;
}

const NAV_TABS = [
  { label: "Harvest", href: "/land-manager/harvest" },
  { label: "Production", href: "/land-manager/production" },
  { label: "Worksite", href: "/land-manager/worksite" },
  { label: "Rental Overview", href: "/land-manager/rental" },
];

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
  const { auth, config, setConfig, allRegions, refreshKey, triggerRefresh } =
    useLandManagerContext();
  const pathname = usePathname();
  const [configOpen, setConfigOpen] = useState(false);

  if (!auth.authenticated) {
    return <NotLoggedIn />;
  }

  const activeTabIndex = NAV_TABS.findIndex((t) =>
    pathname?.startsWith(t.href)
  );
  const enabledCount = config.enabled_regions.length;

  return (
    <Box maxWidth={2400} mx="auto" py={3}>
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
          sx={{ mb: 2 }}
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

      <RegionResourceSummary
        regions={allRegions}
        enabledRegions={config.enabled_regions}
        refreshKey={refreshKey}
      />

      <TodayPanel refreshKey={refreshKey} />

      <AlertsPanel
        enabledRegions={config.enabled_regions}
        refreshKey={refreshKey}
      />

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

      <ConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        config={config}
        allRegions={allRegions}
        onSaved={(updated) => {
          setConfig(updated);
          triggerRefresh();
        }}
      />
    </Box>
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
      auth={auth}
      initialConfig={initialConfig}
      allRegions={allRegions}
    >
      <LandManagerShell>{children}</LandManagerShell>
    </LandManagerContextProvider>
  );
}
