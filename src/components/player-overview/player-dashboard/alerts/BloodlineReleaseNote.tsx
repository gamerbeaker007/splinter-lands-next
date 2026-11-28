import { InfoOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

export function BloodlineReleaseNote() {
  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <InfoOutlined fontSize="small" aria-hidden />
      <Typography variant="body2">
        Preparation only: this alert is relevant when Land 1.99 is released, not
        currently.
      </Typography>
    </Stack>
  );
}
