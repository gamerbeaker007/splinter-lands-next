"use client";

import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  FILTER_PANEL_BUTTON_SLOT_ID,
  FILTER_PANEL_DESKTOP_QUERY,
  FILTER_PANEL_SLOT_ID,
  FILTER_PANEL_WIDTH,
  FILTER_PANEL_WIDTH_VAR,
} from "./filterPanelLayout";

const subscribeNoop = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

type Props = {
  /** Panel heading, also used for the toggle button's tooltip / aria-label. */
  title: string;
  /** Number of filters currently narrowing the data; badges the toggle button. */
  activeCount: number;
  /** Filter data is being (re)fetched. Never hides the panel. */
  loading?: boolean;
  /**
   * False while the filter controls cannot be rendered at all (first load).
   * Skeletons take their place; the header and close control stay put.
   */
  ready?: boolean;
  children: ReactNode;
  /** Pinned to the bottom of the panel, outside the scroll area. */
  footer?: ReactNode;
};

export default function FilterPanelShell({
  title,
  activeCount,
  loading = false,
  ready = true,
  children,
  footer,
}: Props) {
  const isDesktop = useMediaQuery(FILTER_PANEL_DESKTOP_QUERY, {
    defaultMatches: false,
  });
  const [open, setOpen] = useState(false);

  // Docked by default on desktop, collapsed on mobile. Adjusting during render
  // (rather than in an effect) means no frame is ever committed with the mobile
  // overlay drawer inheriting a stale desktop "open" — that transient modal was
  // what left a backdrop swallowing clicks on the toggle button.
  const [lastBreakpoint, setLastBreakpoint] = useState<boolean | null>(null);
  if (lastBreakpoint !== isDesktop) {
    setLastBreakpoint(isDesktop);
    setOpen(isDesktop);
  }

  const dockedOpen = isDesktop && open;

  // Publish the docked width so the layout slot beside `main` reserves room.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      FILTER_PANEL_WIDTH_VAR,
      dockedOpen ? `${FILTER_PANEL_WIDTH}px` : "0px"
    );
    return () => root.style.setProperty(FILTER_PANEL_WIDTH_VAR, "0px");
  }, [dockedOpen]);

  // The layout anchors live in the root layout, so they are in the document by
  // the time this component renders on the client. Resolve them only after
  // hydration so server and client agree on the first pass.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    getHydratedSnapshot,
    getServerSnapshot
  );
  const panelSlot = hydrated
    ? document.getElementById(FILTER_PANEL_SLOT_ID)
    : null;
  const buttonSlot = hydrated
    ? document.getElementById(FILTER_PANEL_BUTTON_SLOT_ID)
    : null;

  const body = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header — stays visible while loading */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.5,
          flexShrink: 0,
        }}
      >
        <FilterListIcon color="error" fontSize="small" />
        <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {activeCount > 0 && (
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 10,
              bgcolor: "error.main",
              color: "error.contrastText",
              fontWeight: "bold",
            }}
          >
            {activeCount}
          </Typography>
        )}
        <Tooltip title="Close filters">
          <IconButton
            size="small"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Reserve the progress bar's height always, so toggling loading on and
          off does not nudge the panel content up and down. */}
      <Box sx={{ height: 4, flexShrink: 0 }}>
        {loading && <LinearProgress color="error" sx={{ height: 4 }} />}
      </Box>
      <Divider />

      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          // Existing values stay readable while refreshing, but cannot be
          // changed against stale option lists.
          opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? "none" : "auto",
          transition: "opacity 0.2s ease",
        }}
        aria-busy={loading}
      >
        {ready ? (
          children
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="rounded" height={40} />
            <Skeleton variant="rounded" height={40} />
            <Skeleton variant="text" width="55%" height={28} />
            <Skeleton variant="rounded" height={72} />
            <Skeleton variant="text" width="35%" height={28} />
            <Skeleton variant="rounded" height={96} />
          </Box>
        )}
      </Box>

      {footer && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1.5, flexShrink: 0 }}>{footer}</Box>
        </>
      )}
    </Box>
  );

  const toggleButton = (
    <Box mt={6}>
      <Tooltip
        title={
          activeCount > 0
            ? `Show ${title} (${activeCount} active)`
            : `Show ${title}`
        }
        placement="left"
      >
        <Badge
          badgeContent={activeCount}
          color="error"
          overlap="rectangular"
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          sx={{
            "& .MuiBadge-badge": {
              border: "2px solid",
              borderColor: "background.default",
            },
          }}
        >
          <IconButton
            aria-label={`Show ${title}${
              activeCount > 0 ? `, ${activeCount} active` : ""
            }`}
            onClick={() => setOpen(true)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "8px 0 0 8px",
              bgcolor: "error.main",
              color: "error.contrastText",
              boxShadow: 3,
              "&:hover": { bgcolor: "error.dark" },
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Badge>
      </Tooltip>
    </Box>
  );

  return (
    <>
      {/* Toggle — only while closed; the panel header owns closing. It is
          portaled into the layout row, so it sits at the right edge of the
          content area at every viewport size and is never layered under a
          drawer/modal root. */}
      {!open && buttonSlot && createPortal(toggleButton, buttonSlot)}

      {isDesktop
        ? panelSlot &&
          createPortal(
            <Box
              aria-label={title}
              sx={{
                // Fixed content width so the slot's width transition slides the
                // panel in and out instead of squashing its contents.
                width: FILTER_PANEL_WIDTH,
                height: "100%",
                flexShrink: 0,
                bgcolor: "background.paper",
                borderLeft: "1px solid",
                borderColor: "divider",
                // Clipped by the collapsed slot while closed, but clipping alone
                // still leaves the controls focusable — hide them once the
                // collapse animation has finished.
                visibility: dockedOpen ? "visible" : "hidden",
                transition: dockedOpen
                  ? "visibility 0s"
                  : "visibility 0s linear 0.25s",
              }}
            >
              {body}
            </Box>,
            panelSlot
          )
        : null}

      {/* Mobile overlay — fully unmounted while closed so no backdrop or focus
          trap can linger after a breakpoint change. */}
      {!isDesktop && (
        <Drawer
          anchor="right"
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          slotProps={{
            paper: {
              sx: {
                width: "88vw",
                maxWidth: FILTER_PANEL_WIDTH,
                backgroundImage: "none",
              },
            },
          }}
        >
          {body}
        </Drawer>
      )}
    </>
  );
}
