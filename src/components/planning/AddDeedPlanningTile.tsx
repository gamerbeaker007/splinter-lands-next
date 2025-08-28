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
        width: 960, // Note this is matching with deed planner box
        height: 690, // Height is match manually
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "4px dashed",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.default",
        opacity: 0.85,
        cursor: "pointer",
        "&:hover": {
          borderColor: "primary.main",
          opacity: 1,
        },
      }}
      onClick={onAdd}
    >
      <CardActionArea
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <AddIcon sx={{ fontSize: 72, color: "text.secondary" }} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
