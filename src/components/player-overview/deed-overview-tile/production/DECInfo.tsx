import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { ProductionInfo } from "@/types/productionInfo";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Divider, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

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
        <strong>Sell Value:</strong>
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
      {/* Net DEC Gain (producing with owned resources) */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
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
      <Typography variant="caption" display="block" color="text.secondary">
        (using owned resources)
      </Typography>
      <Typography
        variant="caption"
        display="block"
        color="text.secondary"
        mt={0.5}
      >
        💡 <strong>Tip:</strong> If{" "}
        <strong>selling the consumed resources</strong> gives more DEC than{" "}
        <strong>selling the produced resource</strong>, it may be more
        profitable to sell them directly instead of producing.
      </Typography>
      <Divider sx={{ my: 1 }} />
      {/* Net DEC Gain (if you buy the consumed resources) */}
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        <strong>Buy Cost:</strong>
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
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          <ArrowForwardIcon
            fontSize="inherit"
            sx={{ verticalAlign: "middle", mr: 0.5 }}
          />
          Net DEC Gain:
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          color={totalProduceSell - totalConsumeBuy >= 0 ? "green" : "error"}
        >
          {(totalProduceSell - totalConsumeBuy).toFixed(3)} /h
        </Typography>
      </Box>
      <Typography variant="caption" display="block" color="text.secondary">
        (if buying inputs, selling produced)
      </Typography>
      <Typography
        variant="caption"
        display="block"
        color="text.secondary"
        mt={0.5}
      >
        💡 <strong>Info:</strong> This shows your net DEC gain if you{" "}
        <strong>buy the consumed resources</strong> and{" "}
        <strong>sell the produced resource</strong>. Useful to estimate profit
        when you don&#39;t already own the inputs.
      </Typography>
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
