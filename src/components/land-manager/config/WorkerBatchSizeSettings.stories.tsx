import BuyEmptyWorkersSection from "@/components/land-manager/config/BuyEmptyWorkersSection";
import RentEmptyWorkersSection from "@/components/land-manager/config/RentEmptyWorkersSection";
import { DEFAULT_BUY_CONFIG, DEFAULT_RENTAL_CONFIG } from "@/types/landManager";
import type { Meta, StoryObj } from "@storybook/react";
import { Grid, Paper, Stack, Typography } from "@mui/material";

function WorkerBatchSizeSettingsStory() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 1100, p: 3 }}>
      <Typography variant="h5">Plots per run</Typography>
      <Typography color="text.secondary">
        Both flows use the same 1–100 plot slider and enforce the selected
        maximum during processing.
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <RentEmptyWorkersSection
              layout="flat"
              rental={{ ...DEFAULT_RENTAL_CONFIG, rental_batch_size: 100 }}
              onChange={() => {}}
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <BuyEmptyWorkersSection
              layout="flat"
              buy={{ ...DEFAULT_BUY_CONFIG, buy_batch_size: 100 }}
              onChange={() => {}}
            />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

const meta: Meta<typeof WorkerBatchSizeSettingsStory> = {
  title: "Land Manager/Production/Worker Batch Size",
  component: WorkerBatchSizeSettingsStory,
};

export default meta;
type Story = StoryObj<typeof WorkerBatchSizeSettingsStory>;

export const BothFlowsAtMaximum: Story = {};
