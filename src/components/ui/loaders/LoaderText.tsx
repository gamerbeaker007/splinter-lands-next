import { Box } from "@mui/material";

export const LoadingText = () => (
  <Box
    component="span"
    sx={{
      "&::after": {
        content: '""',
        animation: "dots 1.5s steps(4, end) infinite",
      },
      "@keyframes dots": {
        "0%": { content: '""' },
        "25%": { content: '"."' },
        "50%": { content: '".."' },
        "75%, 100%": { content: '"..."' },
      },
    }}
  >
    Loading
  </Box>
);
