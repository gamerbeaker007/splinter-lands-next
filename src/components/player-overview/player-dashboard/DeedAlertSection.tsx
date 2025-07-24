"use client";

import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { DeedAlertCard } from "./DeedAlertCard";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Image from "next/image";
import { alert_gif_url } from "@/lib/shared/statics_icon_urls";

type Props = {
  alerts: DeedAlertsInfo[];
};

export const DeedAlertSection: React.FC<Props> = ({ alerts }: Props) => {
  return (
    <Accordion
      defaultExpanded
      slotProps={{ transition: { timeout: 200 } }}
      sx={{
        border: "1px solid",
        borderRadius: 1,
        borderColor: "divider",
        boxShadow: "none",
        backgroundColor: "transparent",
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h5">
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Image
              src={alert_gif_url}
              alt={"Alert"}
              width={25}
              height={25}
              style={{ marginLeft: 10, marginRight: 10 }}
            />
            Alerts!
            <Image
              src={alert_gif_url}
              alt={"Alert"}
              width={25}
              height={25}
              style={{ marginLeft: 10, marginRight: 10 }}
            />
          </Box>
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body1" sx={{ mb: 2 }}>
          These deeds need attention because the plots are either full or the
          buildings are finished.
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {alerts.map((alert) => (
            <DeedAlertCard key={alert.plotId} alert={alert} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
