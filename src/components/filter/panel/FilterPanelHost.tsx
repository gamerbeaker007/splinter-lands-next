"use client";

import Box from "@mui/material/Box";
import { useEffect, useRef } from "react";
import {
  FILTER_PANEL_BUTTON_SLOT_ID,
  FILTER_PANEL_SLOT_ID,
  FILTER_PANEL_WIDTH_VAR,
} from "./filterPanelLayout";

/**
 * Layout anchors for the filter panel, rendered once beside `main`.
 *
 * The docked panel is a real flex item rather than a fixed overlay, so `main`
 * genuinely narrows when the panel opens. That keeps content from hiding behind
 * the panel and lets inner scroll containers (tables, charts) size themselves
 * correctly without page-level offsets or horizontal scrolling workarounds.
 *
 * Both slots collapse to zero width when no panel is open, and on small screens
 * where the panel becomes an overlay drawer instead.
 */
export default function FilterPanelHost() {
  const slotRef = useRef<HTMLElement>(null);

  // Docking the panel resizes `main` without the window changing, so anything
  // that only listens for `window.resize` (Plotly's `useResizeHandler`, among
  // others) would keep its old dimensions. Watching the slot covers the whole
  // open/close animation as well as desktop↔mobile switches; browser resizes
  // already fire the event themselves.
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || typeof ResizeObserver === "undefined") return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      // The width transition fires many callbacks; coalesce to one a frame.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        window.dispatchEvent(new Event("resize"))
      );
    });

    observer.observe(slot);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <Box
        id={FILTER_PANEL_SLOT_ID}
        component="aside"
        ref={slotRef}
        sx={{
          flex: `0 0 var(${FILTER_PANEL_WIDTH_VAR}, 0px)`,
          width: `var(${FILTER_PANEL_WIDTH_VAR}, 0px)`,
          minWidth: 0,
          overflow: "hidden",
          transition: "flex-basis 0.25s ease, width 0.25s ease",
        }}
      />
      <Box
        id={FILTER_PANEL_BUTTON_SLOT_ID}
        sx={{
          position: "absolute",
          top: 8,
          right: `var(${FILTER_PANEL_WIDTH_VAR}, 0px)`,
          zIndex: 5,
          transition: "right 0.25s ease",
        }}
      />
    </>
  );
}
