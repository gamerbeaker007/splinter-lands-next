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

import { ProductionInfo, ResourceWithDEC } from "@/types/productionInfo";
import { SplCardDetails } from "@/types/splCardDetails";
import { useEffect } from "react";
import Planner from "./planner/Planner";

export type Props = {
  index: number;
  cardDetails: SplCardDetails[];
  onChange: (index: number, info: ProductionInfo) => void;
  onDelete?: (index: number) => void;
  deletable?: boolean;
};

// super simple placeholder: emits a stable ProductionInfo once on mount
export function DeedPlanning({
  index,
  cardDetails,
  onChange,
  onDelete,
  deletable,
}: Props) {
  useEffect(() => {
    const sampleProduce: ResourceWithDEC = {
      resource: "GRAIN",
      amount: 0,
      buyPriceDEC: 0,
      sellPriceDEC: 0,
    };

    const sample: ProductionInfo = {
      consume: [],
      produce: sampleProduce,
      netDEC: 0,
    };
    onChange(index, sample);
  }, [index, onChange]);

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2, // rounded corners
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
          <Planner cardDetails={cardDetails} />
        </Stack>
      </CardContent>
    </Card>
  );
}
