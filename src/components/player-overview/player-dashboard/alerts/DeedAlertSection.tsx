"use client";

import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import { Box, Typography } from "@mui/material";
import { DeedAlertCard } from "../DeedAlertCard";

type Props = {
  alerts: DeedAlertsInfo[];
};

export const DeedAlertSection: React.FC<Props> = ({ alerts }: Props) => {
  return (
    <>
      <Typography variant="body1" sx={{ mb: 2 }}>
        These deeds need attention because the plots are either full or the
        buildings are finished.
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {alerts.map((alert) => (
          <DeedAlertCard key={alert.plotId} alert={alert} />
        ))}
      </Box>
    </>
  );
};
