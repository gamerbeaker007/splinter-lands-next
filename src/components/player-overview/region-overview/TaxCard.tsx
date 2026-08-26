import { formatCompactNumber } from "@/lib/formatters";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";
import React from "react";

export type TaxData = {
  region_uid: string;
  tract_number: number;
  type: string;
  capture_rate: number;
  resources: {
    token: string;
    total_rewards_per_hour: number;
    total_tax: number;
    captured: number;
    dec: number;
  }[];
};

type Props = {
  data: TaxData;
};

export const TaxCard: React.FC<Props> = ({ data }) => {
  const columns = data.resources.length + 1; // +1 for label column

  return (
    <Box sx={{ width: "600px", flexShrink: 0 }}>
      <Card variant="outlined" sx={{ width: "100%", mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tax Region: {data.region_uid} (Tract:{data.tract_number})
          </Typography>
          <Typography variant="body1" gutterBottom>
            {data.type}
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns={`repeat(${data.resources.length})`} // 150px for labels
            minWidth={0} // allow children to shrink if needed
            gap={1}
            alignItems="center"
          >
            {/* Header Row */}
            <Box />
            {data.resources.map((res, idx) => (
              <Box textAlign="center" key={idx}>
                <Avatar
                  src={RESOURCE_ICON_MAP[res.token.toUpperCase()]}
                  sx={{ width: 25, height: 25, mx: "auto", mb: 0.5 }}
                />
                <Typography variant="caption">
                  {res.token.toLowerCase()}
                </Typography>
              </Box>
            ))}

            {/* Total rewards per hour collect by all players */}
            <Typography>Produce /hr</Typography>
            {data.resources.map((res, idx) => (
              <Typography key={idx} align="center">
                {formatCompactNumber(res.total_rewards_per_hour, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
            ))}
            <Divider sx={{ gridColumn: `1 / span ${columns}`, my: 1 }} />

            {/* Total tax payed by the players */}
            <Typography>Tax (10%)</Typography>
            {data.resources.map((res, idx) => (
              <Typography key={idx} align="center">
                {formatCompactNumber(res.total_tax ?? 0, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
            ))}
            <Divider sx={{ gridColumn: `1 / span ${columns}`, my: 1 }} />

            {/* Total Tax captured */}
            <Typography>
              Captured ({(data.capture_rate * 100).toFixed(1)}%)
            </Typography>
            {data.resources.map((res, idx) => (
              <Typography key={idx} align="center">
                {formatCompactNumber(res.captured ?? 0, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
            ))}
            <Divider sx={{ gridColumn: `1 / span ${columns}`, my: 1 }} />

            {/* Tax captured Valued in DEC*/}
            <Typography>Captured Tax (DEC)</Typography>
            {data.resources.map((res, idx) => (
              <Typography key={idx} align="center">
                {formatCompactNumber(res.dec ?? 0, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
            ))}
            <Divider sx={{ gridColumn: `1 / span ${columns}`, my: 1 }} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
