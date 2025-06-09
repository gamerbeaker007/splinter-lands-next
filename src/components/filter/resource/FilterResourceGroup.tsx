import { Box, Typography } from "@mui/material";
import FilterResourceIcon from "./FilterResourceIcon";

type Props = {
  options: string[];
};

// Define custom sort order
const resourceOrder: Record<string, number> = {
  grain: 0,
  wood: 1,
  stone: 2,
  iron: 3,
  aura: 4,
  tax: 5,
  research: 6,
  sps: 7,
};

export default function FilterResourceGroup({ options }: Props) {
  const sortedOptions = [...options].sort((a, b) => {
    const aRank = resourceOrder[a.toLowerCase()] ?? Infinity;
    const bRank = resourceOrder[b.toLowerCase()] ?? Infinity;
    return aRank - bRank;
  });
  return (
    <>
      <Typography variant="body2">Resource:</Typography>

      <Box sx={{ display: "flow", gap: 1 }}>
        {sortedOptions.map((resource) => (
          <FilterResourceIcon key={resource} name={resource} />
        ))}
      </Box>
    </>
  );
}
