"use client";

import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import ActiveTile from "./ActiveTile";
import CacheStatusDot from "./CacheStatusDot";
import ThemeToggle from "./ThemeToggle";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LoginComponent from "../auth/LoginComponent";
import SupportDialog from "../support/SupportDialog";
import { useState } from "react";

export default function TopBar() {
  const { title } = usePageTitle();
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar
        variant="dense"
        sx={{
          display: { xs: "flow", sm: "flex" },
          justifyContent: "space-between",
        }}
      >
        {/* Left side — hidden on mobile to prevent overflow */}
        <Typography
          variant="body2"
          fontWeight="bold"
          fontSize={20}
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {title}
        </Typography>

        {/* Right side */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "nowrap",
          }}
        >
          <CacheStatusDot />
          <ActiveTile />
          <ThemeToggle />
          <Tooltip title="Support beaker007">
            <IconButton
              size="small"
              onClick={() => setSupportOpen(true)}
              aria-label="Support beaker007 validator"
              color="error"
            >
              <FavoriteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <LoginComponent compact />
        </Box>
      </Toolbar>

      <SupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
    </AppBar>
  );
}
