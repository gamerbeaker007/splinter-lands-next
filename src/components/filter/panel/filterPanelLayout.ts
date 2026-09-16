/** Width of the docked desktop panel. Also the max width of the mobile drawer. */
export const FILTER_PANEL_WIDTH = 320;

/**
 * CSS variable published by FilterPanelShell and consumed by FilterPanelHost.
 * It is the single source of truth for how much room the docked panel takes,
 * so `main` shrinks as a flex sibling instead of pages offsetting themselves.
 */
export const FILTER_PANEL_WIDTH_VAR = "--filter-panel-width";

/** Flex slot in the app layout that the docked desktop panel portals into. */
export const FILTER_PANEL_SLOT_ID = "filter-panel-slot";

/** Anchor at the right edge of the content area for the filter toggle button. */
export const FILTER_PANEL_BUTTON_SLOT_ID = "filter-panel-button-slot";

/** Above this width the panel docks beside the content instead of overlaying it. */
export const FILTER_PANEL_DESKTOP_QUERY = "(min-width:1024px)";
