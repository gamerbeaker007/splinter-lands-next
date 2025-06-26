import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Divider,
} from "@mui/material";
import { resourceIconMapping } from "@/scripts/lib/utils/statics";

export type RegionData = {
  title: string;
  totals?: boolean | null;
  resources: {
    name: string;
    count: number;
    produce: number;
    consume?: number | null;
    net: number;
  }[];
};

type Props = {
  data: RegionData;
};

export const RegionCard: React.FC<Props> = ({ data }) => {
  const columns = data.resources.length + 1; // +1 for label column

  const formatValue = (val: number) => val.toFixed(2);
  const getColor = (value: number) =>
    value > 0 ? "green" : value < 0 ? "red" : "gray";

  return (
    <Box sx={{ width: "600px", flexShrink: 0 }}>
      <Card variant="outlined" sx={{ width: "100%", mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {data.title}
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
                  src={resourceIconMapping[res.name.toLowerCase()]}
                  sx={{ width: 25, height: 25, mx: "auto", mb: 0.5 }}
                />
                <Typography variant="caption">
                  {res.name}
                  <br />({res.count})
                </Typography>
              </Box>
            ))}

            {/* Produce Row */}
            <Typography>{data.totals ? "Total Net" : "Produce"}</Typography>
            {data.resources.map((res, idx) => (
              <Typography
                key={idx}
                align="center"
                sx={{ color: getColor(res.produce) }}
              >
                {formatValue(res.produce)}
              </Typography>
            ))}
            <Divider sx={{ gridColumn: `1 / span ${columns}`, my: 1 }} />

            {data.totals ? null : (
              <>
                {/* Cost Row */}
                <Typography>Consume</Typography>
                {data.resources.map((res, idx) => (
                  <Typography
                    key={idx}
                    align="center"
                    sx={{ color: getColor(res.consume ?? 0) }}
                  >
                    {formatValue(res.consume ?? 0)}
                  </Typography>
                ))}
                <Divider sx={{ gridColumn: `1 / span ${columns}`, my: 1 }} />
              </>
            )}

            {/* Total Row */}
            <Typography>{data.totals ? "Total net (DEC)" : "Total"}</Typography>
            {data.resources.map((res, idx) => (
              <Typography
                key={idx}
                align="center"
                sx={{ color: getColor(res.net) }}
              >
                {formatValue(res.net)}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
