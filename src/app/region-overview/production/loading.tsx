import { Box, Skeleton } from "@mui/material";

export default function ProductionLoading() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width={200} height={40} sx={{ mb: 3 }} />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Skeleton variant="rectangular" width={250} height={100} />
        <Skeleton variant="rectangular" width={250} height={100} />
      </Box>

      <Skeleton
        variant="rectangular"
        width="100%"
        height={400}
        sx={{ mb: 4 }}
      />

      <Skeleton variant="rectangular" width={300} height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={300} />
    </Box>
  );
}
