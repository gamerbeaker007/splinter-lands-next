import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { CSSSize } from "@/types/cssSize";
import { ProductionInfo } from "@/types/productionInfo";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Divider, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  productionInfo?: ProductionInfo;
  resource: string;
  includeFee?: boolean;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
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

export const DECInfo: React.FC<Props> = ({
  productionInfo,
  resource,
  includeFee = true,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  const { consume, produce, netDEC } = productionInfo ?? {
    consume: null,
    produce: null,
    netDEC: 0,
  };

  const totalConsumeSell =
    consume?.reduce((sum, r) => sum + r.sellPriceDEC, 0) ?? 0;
  const totalConsumeBuy =
    consume?.reduce((sum, r) => sum + r.buyPriceDEC, 0) ?? 0;

  const totalProduceSell =
    produce?.reduce((sum, r) => sum + r.sellPriceDEC, 0) ?? 0;
  const totalProduceBuy =
    produce?.reduce((sum, r) => sum + r.buyPriceDEC, 0) ?? 0;

  const isTax = resource === "TAX";

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "left",
      }}
    >
      <Typography fontSize="1.0rem" fontWeight="bold" color={"white"} mb={0.5}>
        Net Dec:
      </Typography>

      <Box display="inline-flex" flexDirection="column" alignItems="flex-start">
        <Box display="inline-flex" alignItems="center" gap={0.2}>
          <Tooltip
            title={tooltipContent(
              resource,
              totalConsumeSell,
              totalConsumeBuy,
              totalProduceSell,
              totalProduceBuy,
              netDEC,
            )}
            placement="top"
            arrow
          >
            <Box display="flex" alignItems="center" sx={{ cursor: "help" }}>
              <Image
                src={RESOURCE_ICON_MAP["DEC"]}
                alt={resource}
                width={35}
                height={35}
              />
            </Box>
          </Tooltip>
          <Typography
            fontSize="1.0rem"
            fontWeight="bold"
            color={netDEC >= 0 ? "green" : "error"}
          >
            {netDEC.toFixed(3)} {isTax ? "" : "/h"}
          </Typography>
        </Box>

        {resource !== "AURA" && includeFee && (
          <Typography variant="caption" color="gray" fontSize="0.625rem">
            {isTax ? "" : "(incl. hub fee)"}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
