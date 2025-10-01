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
import LoginComponent from "../auth/LoginComponent";

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
        variant="dense"
        sx={{
          display: { xs: "flow", sm: "flex" },
          justifyContent: "space-between",
        }}
      >
        {/* Left side */}
        <Typography variant="body2" fontWeight="bold" fontSize={20}>
          {title}
        </Typography>

        {/* Right side */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <CacheStatusDot />
          <ActiveTile />
          <ThemeToggle />
          <Link href="/admin">
            <GitHubIcon sx={{ mt: 1 }} />
          </Link>
          <LoginComponent />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
