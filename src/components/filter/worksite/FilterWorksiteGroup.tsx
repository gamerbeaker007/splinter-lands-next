import { worksiteTypeOptions } from "@/types/planner/primitives";
import { Box, Typography } from "@mui/material";
import FilterWorksiteIcon from "./FilterWorksiteIcon";

type Props = {
  options: string[];
};

const worksiteOrder: Record<string, number> = Object.fromEntries(
  worksiteTypeOptions.map((w, i) => [w, i])
);

export default function FilterWorksiteGroup({ options }: Props) {
  if (options.length === 0) return null;

  const sortedOptions = [...options].sort(
    (a, b) => (worksiteOrder[a] ?? Infinity) - (worksiteOrder[b] ?? Infinity)
  );

  return (
    <>
      <Typography variant="body2">Worksite:</Typography>
      <Box sx={{ display: "flow", gap: 1 }}>
        {sortedOptions.map((worksite) => (
          <FilterWorksiteIcon key={worksite} name={worksite} />
        ))}
      </Box>
    </>
  );
}
