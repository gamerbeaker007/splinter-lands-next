import { Box, Skeleton, Stack } from "@mui/material";

export function AlertSectionSkeleton() {
  return (
    <Stack spacing={2} direction={"row"}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            padding: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            alignItems: "center",
            width: 200,
            height: 150,
          }}
        >
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </Box>
      ))}
    </Stack>
  );
}
