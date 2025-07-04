"use client";

import { formatNumberWithSuffix } from "@/lib/formatters";
import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import Image from "next/image";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";

type ResourceCardRow = {
  supply: number;
  trade_hub_supply: number;
  daily_production: number;
  daily_consume: number;
  consumes: Record<string, number>;
};

type Props = {
  resourceName: string;
  row: ResourceCardRow;
};

export function ResourceCard({ resourceName, row }: Props) {
  const {
    supply,
    trade_hub_supply,
    daily_production,
    daily_consume,
    consumes,
  } = row;

  const iconUrl = RESOURCE_ICON_MAP[resourceName] || "";

  const dailyCosts: Record<string, number> = {
    GRAIN: consumes?.grain ?? 0,
    WOOD: consumes?.wood ?? 0,
    STONE: consumes?.stone ?? 0,
    IRON: consumes?.iron ?? 0,
  };

  const totalSupplyText =
    supply === 0
      ? "N/A"
      : formatNumberWithSuffix(Number(supply) + Number(trade_hub_supply));

  const supplyText =
    supply === 0 ? "N/A" : formatNumberWithSuffix(Number(supply));

  const hubSupplyText =
    trade_hub_supply === 0
      ? "N/A"
      : formatNumberWithSuffix(Number(trade_hub_supply));

  return (
    <Card variant="outlined" sx={{ minWidth: 250 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={iconUrl}
            alt={resourceName}
            sx={{ width: 35, height: 35, mr: 1 }}
          />
          <Typography variant="h6">{resourceName}</Typography>
        </Box>

        <Box mb={1}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2">
              <strong>Total Supply</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                fontWeight: "bold",
                color: "success.main",
              }}
            >
              {totalSupplyText}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            (supply: {supplyText}, hub: {hubSupplyText})
          </Typography>
        </Box>

        {[
          ["Produced Daily", daily_production],
          ["Consumed Daily", daily_consume],
        ].map(([label, value]) => (
          <Box
            key={label}
            display="flex"
            justifyContent="space-between"
            mb={0.5}
          >
            <Typography variant="body2">{label}:</Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                fontWeight: "bold",
                color: "success.main",
              }}
            >
              {value === 0 ? "N/A" : formatNumberWithSuffix(Number(value))}
            </Typography>
          </Box>
        ))}

        <Box mt={2}>
          <Typography variant="subtitle2">Consumes:</Typography>
          {Object.entries(dailyCosts).map(([res, val]) =>
            val > 0 ? (
              <Box
                key={res}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml={1}
                mt={0.5}
              >
                <Box display="flex" alignItems="center">
                  <Image
                    src={RESOURCE_ICON_MAP[res]}
                    alt={res}
                    width={16}
                    height={16}
                  />
                  <Typography variant="body2" ml={1}>
                    {res}:
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    color: "success.main",
                  }}
                >
                  {formatNumberWithSuffix(Number(val))}
                </Typography>
              </Box>
            ) : null,
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
