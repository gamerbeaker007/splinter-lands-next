"use client";

import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { FiDatabase, FiHome, FiMap, FiMenu, FiUsers } from "react-icons/fi";
import { GrPlan } from "react-icons/gr";
import { MdOutlineLeaderboard } from "react-icons/md";
import { RiPlantLine } from "react-icons/ri";
import Link from "../ui/LinkWrapper";

const links = [
  { href: "/", label: "Home", icon: <FiHome /> },
  { href: "/resource/conversion", label: "Resource", icon: <FiDatabase /> },
  {
    href: "/region-overview/activity",
    label: "Region Overview",
    icon: <FiMap />,
  },
  {
    href: "/player-efficiency/rankings",
    label: "Player Efficiency",
    icon: <MdOutlineLeaderboard />,
  },
  {
    href: "/player-overview/dashboard",
    label: "Player Overview",
    icon: <FiUsers />,
  },
  {
    href: "/planning",
    label: "Land Planning",
    icon: <GrPlan />,
  },
  {
    href: "/land-manager",
    label: "Land Manager",
    icon: <RiPlantLine />,
  },
];

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 50;

export default function SideBar() {
  const [collapsed, setCollapsed] = useState(true);

  const drawerWidth = collapsed
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          transition: "width 0.3s ease-in-out",
          overflowX: "hidden",
        },
      }}
    >
      {/* Dense like the TopBar toolbar, so the divider lines up with the
          bottom of the top bar. */}
      <Toolbar
        variant="dense"
        disableGutters
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 0 : 2,
        }}
      >
        {!collapsed && (
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            Land Stats
          </Typography>
        )}
        <Tooltip
          title={collapsed ? "Expand menu" : "Collapse menu"}
          placement="right"
        >
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <FiMenu size={18} />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider />
      <List suppressHydrationWarning>
        {links.map(({ href, label, icon }) => (
          <ListItem key={href} disablePadding sx={{ display: "block" }}>
            {/* The label is hidden while collapsed, so the tooltip carries it. */}
            <Tooltip title={collapsed ? label : ""} placement="right" arrow>
              <ListItemButton
                suppressHydrationWarning // To avoid hydration mismatch due to hive keychain sdk extension
                component={Link}
                href={href}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: 2,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2,
                    justifyContent: "center",
                  }}
                >
                  {icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={label} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
