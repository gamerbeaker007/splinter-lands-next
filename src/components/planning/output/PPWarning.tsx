import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Tooltip, Typography } from "@mui/material";

export default function PPWarning() {
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            Base PP Too High
          </Typography>
          <Typography variant="body2">
            Your current selection exceeds the maximum allowed base PP. SPL caps
            base PP at 100,000. Calclation based on the 100,000 cap.
          </Typography>
        </Box>
      }
      placement="right"
      arrow
    >
      <WarningAmberIcon
        fontSize="small"
        sx={{
          color: "warning.main",
          verticalAlign: "middle",
          cursor: "help",
        }}
      />
    </Tooltip>
  );
}
