import { Box, Typography } from "@mui/material";
import FilterPlotStatusIcon from "./FilterPlotStatusIcon";

type Props = {
  options: string[];
};

// Define custom sort order
const plotStatusOrder: Record<string, number> = {
  natural: 0,
  magical: 1,
  occupied: 2,
  kingdom: 3,
  unknown: 4,
};

export default function FilterPlotStatusGroup({ options }: Props) {
  const sortedOptions = [...options].sort((a, b) => {
    const aRank = plotStatusOrder[a.toLowerCase()] ?? Infinity;
    const bRank = plotStatusOrder[b.toLowerCase()] ?? Infinity;
    return aRank - bRank;
  });

  return (
    <>
      <Typography variant="body2">Rarity:</Typography>

      <Box sx={{ display: "flow", gap: 1 }}>
        {sortedOptions.map((plotStatus) => (
          <FilterPlotStatusIcon key={plotStatus} name={plotStatus} />
        ))}
      </Box>
    </>
  );
}
