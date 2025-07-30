import React from "react";
import { ProductionInfo } from "@/types/productionInfo";
import { Box, Divider, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

type Props = {
  productionInfo: ProductionInfo;
  resource: string;
};

function tooltipContent(
  resource: string,
  totalConsumeSell: number,
  totalConsumeBuy: number,
  totalProduceSell: number,
  totalProduceBuy: number,
  netDEC: number,
) {
  return (
    <Box sx={{ p: 1.5, minWidth: 280 }}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
        DEC Economics Breakdown
      </Typography>

      {/* Sell Value Section */}
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        <strong>Sell Value</strong> – What you&#39;d earn by selling resources:
      </Typography>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">Consumed resources:</Typography>
        <Typography variant="body2" fontWeight="bold">
          {totalConsumeSell.toFixed(3)} DEC
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">Produced resource:</Typography>
        <Typography variant="body2" fontWeight="bold">
          {totalProduceSell.toFixed(3)} DEC
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Net DEC Gain */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">
          <ArrowForwardIcon
            fontSize="inherit"
            sx={{ verticalAlign: "middle", mr: 0.5 }}
          />
          Net DEC Gain:
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          color={netDEC >= 0 ? "green" : "error"}
        >
          {netDEC.toFixed(3)} /h
        </Typography>
      </Box>

      {/* Explanation Tips */}
      <Box mt={1} mb={1}>
        <Typography variant="caption" display="block" color="text.secondary">
          💡 <strong>Tip:</strong> If selling the consumed resources gives more
          DEC than selling the produced one, consider selling instead of using
          them.
        </Typography>
        {resource != "GRAIN" && (
          <Typography variant="caption" display="block" color="text.secondary">
            💰 You can also choose to{" "}
            <strong>buy the consumed resources</strong> — if the cost is low
            enough, it might still be profitable to produce and sell.
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Buy Cost Section */}
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        <strong>Buy Cost</strong> – What it costs to buy the resources:
      </Typography>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">Consumed resources:</Typography>
        <Typography variant="body2" fontWeight="bold">
          {totalConsumeBuy.toFixed(3)} DEC
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">Produced resource:</Typography>
        <Typography variant="body2" fontWeight="bold">
          {totalProduceBuy.toFixed(3)} DEC
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {resource === "AURA" && (
        <Typography variant="caption" color="text.secondary">
          📌 <strong>Note:</strong> For <strong>AURA</strong>, produced price is
          based on Midnight Potion estimation and may not reflect actual market
          price.
        </Typography>
      )}
    </Box>
  );
}

export const DECInfo: React.FC<Props> = ({ productionInfo, resource }) => {
  const { consume, produce, netDEC } = productionInfo;

  const totalConsumeSell = consume?.reduce((sum, r) => sum + r.sellPriceDEC, 0);
  const totalConsumeBuy = consume?.reduce((sum, r) => sum + r.buyPriceDEC, 0);

  return (
    <Box>
      <Typography fontSize="0.8rem" fontWeight="bold" mb={0.5}>
        Net Dec:
      </Typography>

      <Box
        display="inline-flex"
        flexDirection="column"
        alignItems="flex-start"
        gap={0.25}
      >
        <Box display="inline-flex" alignItems="center" gap={0.5}>
          <Tooltip
            title={tooltipContent(
              resource,
              totalConsumeSell,
              totalConsumeBuy,
              produce?.sellPriceDEC,
              produce?.buyPriceDEC,
              netDEC,
            )}
            placement="top"
            arrow
          >
            <Box display="flex" alignItems="center" sx={{ cursor: "help" }}>
              <Image
                src={RESOURCE_ICON_MAP["DEC"]}
                alt={resource}
                width={20}
                height={20}
              />
            </Box>
          </Tooltip>
          <Typography
            fontSize="0.625rem"
            fontWeight="bold"
            color={netDEC >= 0 ? "green" : "error"}
          >
            {netDEC.toFixed(3)} /h
          </Typography>
        </Box>

        {resource !== "AURA" && (
          <Typography variant="caption" color="gray" fontSize="0.625rem">
            (incl. hub fee)
          </Typography>
        )}
      </Box>
    </Box>
  );
};
