"use client";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
} from "@mui/material";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { RegionLiquidityInfo } from "@/types/regionLiquidityInfo";
import { PlayerTradeHubPosition } from "@/generated/prisma";
import { InfoItem } from "@/components/resource/trade-hub-positions/InfoItem";
import { formatNumberWithSuffix } from "@/lib/formatters";

type Props = {
  resource: string;
  liquidityInfo: RegionLiquidityInfo[];
  liquidityPoolInfo: PlayerTradeHubPosition[];
};

export function ResourceOverviewCard({
  resource,
  liquidityInfo,
  liquidityPoolInfo,
}: Props) {
  const iconUrl = RESOURCE_ICON_MAP[resource] || "";
  const resourceName = resource === "" ? "Unknown Resource" : resource;

  const resourceKey = resource.toLowerCase() as keyof RegionLiquidityInfo;

  const totalFromLiquidityInfo = liquidityInfo.reduce(
    (sum, info) => sum + Number(info[resourceKey] ?? 0),
    0
  );

  const poolMatches = liquidityPoolInfo.filter((pos) =>
    pos.token.includes(resource)
  );

  const totalFromPool = poolMatches.reduce(
    (sum, pos) => sum + pos.resource_quantity,
    0
  );

  const totalDECFromPool = poolMatches.reduce(
    (sum, pos) => sum + pos.dec_quantity,
    0
  );

  const totalPercentage = poolMatches.reduce(
    (sum, pos) => sum + pos.share_percentage,
    0
  );

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        width: 250,
        overflow: "hidden",
        borderRadius: "50px 0px 50px 0px",
      }}
    >
      {/* Background Icon */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${iconUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          zIndex: 0,
        }}
      />

      <CardContent sx={{ position: "relative", zIndex: 1 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Avatar
            src={iconUrl}
            alt={resourceName}
            sx={{ width: 35, height: 35, mr: 1 }}
          />
          <Typography variant="h6">{resourceName}</Typography>
        </Box>

        <InfoItem
          title="Total"
          text={formatNumberWithSuffix(totalFromLiquidityInfo)}
          fontSize={16}
        />

        <Typography variant="caption" color="text.secondary">
          (Liquid: {formatNumberWithSuffix(totalFromLiquidityInfo)}, Pool:{" "}
          {formatNumberWithSuffix(totalFromPool)})
        </Typography>

        <Divider sx={{ my: 1 }} />

        {liquidityInfo.map((info) => (
          <InfoItem
            key={info.uid}
            title={info.name}
            text={`${formatNumberWithSuffix((info[resourceKey] as number) ?? 0)}`}
            fontSize={14}
          />
        ))}

        {totalFromPool > 0 && (
          <>
            <Divider sx={{ my: 1 }} />

            <InfoItem
              title="LP Total"
              text={formatNumberWithSuffix(totalFromPool)}
              fontSize={16}
            />
            <InfoItem
              title="Share"
              text={`${totalPercentage.toFixed(2)}%`}
              fontSize={14}
            />
            <InfoItem
              title="DEC"
              text={formatNumberWithSuffix(totalDECFromPool)}
              fontSize={14}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
