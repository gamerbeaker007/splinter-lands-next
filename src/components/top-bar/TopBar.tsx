"use client";

import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import ActiveTile from "./ActiveTile";
import CacheStatusDot from "./CacheStatusDot";
import ThemeToggle from "./ThemeToggle";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import Link from "@mui/material/Link";

export default function TopBar() {
  const { title } = usePageTitle();

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar
        sx={{
          display: { xs: "flow", sm: "flex" },
          justifyContent: "space-between",
          py: 1,
        }}
      >
        {/* Left side */}
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>

        {/* Right side */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <CacheStatusDot />
          <ActiveTile />
          <ThemeToggle />
          <Link href="/admin">
            <GitHubIcon sx={{ mt: 1 }} />
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
