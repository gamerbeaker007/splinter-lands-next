import { Box, Tooltip, Typography } from "@mui/material";
import React from "react";

type Props = {
  title: string;
  price: string | null; // represented price either local or formatted with suffix
  currency: string;
  subTitle?: string;
  warning?: string | null;
};

export default function PriceItem({
  title,
  subTitle,
  price,
  currency,
  warning,
}: Props) {
  return (
    <Box mt={1}>
      <Typography variant="body2" color="text.secondary">
        {title}:
      </Typography>
      <Typography variant="body1" color="success.main">
        {price ? `${price} ${currency}` : "N/A"}
      </Typography>
      {subTitle && (
        <Typography variant="body1" color="secondary">
          {subTitle}
        </Typography>
      )}

      {warning && (
        <Tooltip title={warning}>
          <Typography variant="caption" color="warning.main">
            {warning}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
