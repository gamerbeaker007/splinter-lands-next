"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { Prices } from "@/types/price";
import { ProductionInfo } from "@/types/productionInfo";
import { SplCardDetails } from "@/types/splCardDetails";
import Planner from "./planner/Planner";
import { useCallback } from "react";
import { RegionTax } from "@/types/regionTax";
import { LowestMarketData } from "@/types/planner/market/market";

export type Props = {
  index: number;
  cardDetails: SplCardDetails[];
  prices: Prices;
  spsRatio: number;
  regionTax: RegionTax[] | null;
  marketData: LowestMarketData | null;
  onChange: (index: number, info: ProductionInfo) => void;
  onDelete?: (index: number) => void;
  deletable?: boolean;
};

export function DeedPlanning({
  index,
  cardDetails,
  prices,
  spsRatio,
  regionTax,
  marketData,
  onChange,
  onDelete,
  deletable,
}: Props) {
  const emitPlanChange = useCallback(
    (info: ProductionInfo) => onChange(index, info),
    [index, onChange],
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        position: "relative",
      }}
    >
      {/* Show red cross only if deletable */}
      {deletable && onDelete && (
        <IconButton
          aria-label="delete"
          onClick={() => onDelete(index)}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            color: "error.main",
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        {/* <Planner /> */}
        <Stack spacing={1}>
          <Typography variant="subtitle1">
            Deed Planning #{index + 1}
          </Typography>
          <Divider />
          <Planner
            cardDetails={cardDetails}
            prices={prices}
            spsRatio={spsRatio}
            regionTax={regionTax}
            marketData={marketData}
            onPlanChange={emitPlanChange}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
