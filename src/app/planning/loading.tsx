import { CircularProgress, Container, Stack, Typography } from "@mui/material";

export default function PlanningPageSkeleton() {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Stack
        spacing={3}
        alignItems="center"
        justifyContent="center"
        minHeight="40vh"
        mt={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading planning data…
        </Typography>
      </Stack>
    </Container>
  );
}
