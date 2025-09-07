import { Box, Typography } from "@mui/material";
import CardFilterRarityIcon from "./CardFilterRarityIcon";
import { cardRarityOptions } from "@/types/planner";

export default function CardFilterRarityGroup() {
  return (
    <>
      <Typography variant="body2">Rarity:</Typography>

      <Box sx={{ display: "flow", gap: 1 }}>
        {cardRarityOptions.map((rarity) => (
          <CardFilterRarityIcon key={rarity} name={rarity} />
        ))}
      </Box>
    </>
  );
}
