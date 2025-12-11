"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect } from "react";

export default function CollectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Collection error:", error);
  }, [error]);

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        borderRadius: 1,
        p: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        Failed to Load Collection
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {error.message || "An unexpected error occurred"}
      </Typography>
      <Button variant="contained" onClick={reset}>
        Try Again
      </Button>
    </Box>
  );
}
