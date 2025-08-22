"use client";

import * as React from "react";
import { Card, CardActionArea, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

type AddDeedTileProps = {
  onAdd: () => void;
};

export function AddDeedPlanningTile({ onAdd }: AddDeedTileProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2, // rounded corners
        opacity: 0.8, // requested opacity
      }}
    >
      <CardActionArea
        onClick={onAdd}
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <AddIcon sx={{ fontSize: 64 }} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
