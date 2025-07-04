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
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { FiDatabase, FiHome, FiMap, FiMenu, FiUsers } from "react-icons/fi";

const links = [
  { href: "/", label: "Home", icon: <FiHome /> },
  { href: "/resource", label: "Resource", icon: <FiDatabase /> },
  { href: "/region-overview", label: "Region Overview", icon: <FiMap /> },
  { href: "/player-overview", label: "Player Overview", icon: <FiUsers /> },
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
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: collapsed ? "column" : "row", // align vertically in collapsed mode
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          minHeight: 64,
          px: collapsed ? 1 : 2,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" noWrap>
            Land Stats
          </Typography>
        )}
        <IconButton onClick={() => setCollapsed(!collapsed)}>
          <FiMenu />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {links.map(({ href, label, icon }) => (
          <ListItem key={href} disablePadding sx={{ display: "block" }}>
            <ListItemButton
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
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
