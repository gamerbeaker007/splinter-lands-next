"use client";

import { Box, type SxProps, type Theme } from "@mui/material";

interface Props {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Thin wrapper that makes wide tables scroll horizontally on mobile while
 * looking natural on desktop. The scrollbar is rendered subtly so it doesn't
 * take up visual space on large screens.
 */
export default function ScrollableTableContainer({ children, sx }: Props) {
  return (
    <Box
      sx={{
        overflowX: "auto",
        // Smooth momentum scrolling on iOS.
        WebkitOverflowScrolling: "touch",
        // Subtle thin scrollbar for desktops that show one.
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: "action.selected",
          borderRadius: 2,
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
