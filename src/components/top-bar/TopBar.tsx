"use client";

import ActiveTile from "./ActiveTile";
import CacheStatusDot from "./CacheStatusDot";
import ThemeToggle from "./ThemeToggle";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function TopBar() {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
        {/* Left side */}
        <Typography variant="h6" fontWeight="bold">
          Dashboard
        </Typography>

        {/* Right side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CacheStatusDot />
          <ActiveTile />
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
