import { Box, Skeleton, Typography } from "@mui/material";

export default function CollectionLoading() {
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        borderRadius: 1,
        overflow: "auto",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      <Skeleton variant="rectangular" width={150} height={36} sx={{ mb: 2 }} />

      <Typography variant="h5" gutterBottom>
        <Skeleton width={200} />
      </Typography>

      <Typography variant="body2" gutterBottom>
        <Skeleton width="80%" />
        <Skeleton width="70%" />
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    </Box>
  );
}
