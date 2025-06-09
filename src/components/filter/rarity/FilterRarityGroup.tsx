import { Box, Typography } from "@mui/material";
import FilterRarityIcon from "./FilterRarityIcon";

type Props = {
  options: string[];
};

// Define custom sort order
const rarityOrder: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};

export default function FilterRarityGroup({ options }: Props) {
  const sortedOptions = [...options].sort((a, b) => {
    const aRank = rarityOrder[a.toLowerCase()] ?? Infinity;
    const bRank = rarityOrder[b.toLowerCase()] ?? Infinity;
    return aRank - bRank;
  });

  return (
    <>
      <Typography variant="body2">Rarity:</Typography>

      <Box sx={{ display: "flow", gap: 1 }}>
        {sortedOptions.map((rarity) => (
          <FilterRarityIcon key={rarity} name={rarity} />
        ))}
      </Box>
    </>
  );
}
