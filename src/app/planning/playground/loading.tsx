import { Alert, Box, Skeleton, Stack } from "@mui/material";

export default function PlaygroundPageSkeleton() {
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Alert severity="info">
        Loading card details, region tax rates, and SPS ratio — this may take a
        moment.
      </Alert>
      <Box>
        <Skeleton variant="rectangular" height={120} />
      </Box>
      <Box>
        <Skeleton variant="rectangular" height={60} />
      </Box>
      <Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    </Stack>
  );
}
