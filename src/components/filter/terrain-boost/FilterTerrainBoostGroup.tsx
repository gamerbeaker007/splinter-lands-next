import { CardElement, cardElementOptions } from "@/types/planner";
import { Box, Typography } from "@mui/material";
import FilterTerrainBoostIcon from "./FilterTerrainBoostIcon";

type Props = {
  options?: CardElement[];
};

// Define custom sort order
const elementOrder: Record<CardElement, number> = {
  fire: 0,
  water: 1,
  life: 2,
  death: 3,
  earth: 4,
  dragon: 5,
  neutral: 6,
};

export default function FilterTerrainBoostGroup({ options }: Props) {
  const rawOptions =
    options && options.length > 0
      ? options
      : cardElementOptions.filter(
          (element): element is Exclude<CardElement, "neutral"> =>
            element !== "neutral"
        );

  const sortedOptions = [...rawOptions].sort((a, b) => {
    const aRank = elementOrder[a] ?? Infinity;
    const bRank = elementOrder[b] ?? Infinity;
    return aRank - bRank;
  });

  return (
    <>
      <Typography variant="body2">Positive Terrain Boost:</Typography>

      <Box sx={{ display: "flow", gap: 1 }}>
        {sortedOptions.map((element) => (
          <FilterTerrainBoostIcon key={element} name={element} />
        ))}
      </Box>
    </>
  );
}
