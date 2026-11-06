import { UnassignedStakeItem } from "@/types/playerAlerts";
import { Stack, Typography } from "@mui/material";
import React from "react";

interface Props {
  items: UnassignedStakeItem[];
}

/** Owned titles / totems that are not staked on any plot, per kind. */
export const UnassignedStakeItemsAlert: React.FC<Props> = ({ items }) => (
  <Stack mt={2} gap={0.5}>
    {items.map((item) => (
      <Typography key={item.name} variant="body1">
        {item.count}× {item.name}
      </Typography>
    ))}
  </Stack>
);
