"use client";

import { Portal, Snackbar, Stack } from "@mui/material";
import { Children, type ReactNode } from "react";

interface Props {
  /** Float above the page instead of rendering inline. */
  floating: boolean;
  /** The feedback (Alerts); null / false children count as nothing to show. */
  children: ReactNode;
}

/**
 * Action feedback for controls that may live in a menu: the menu closes before
 * the action runs, so inline Alerts there are never seen. Floating, they are
 * portalled into a snackbar that stays until the Alert is closed.
 */
export default function FloatingFeedback({ floating, children }: Props) {
  if (!floating) return <>{children}</>;
  return (
    <Portal>
      <Snackbar
        open={Children.toArray(children).length > 0}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Stack gap={1} sx={{ maxWidth: 560 }}>
          {children}
        </Stack>
      </Snackbar>
    </Portal>
  );
}
