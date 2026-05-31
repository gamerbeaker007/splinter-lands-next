import { Box, Typography } from "@mui/material";
import FilterDeedTypeIcon from "./FilterDeedTypeIcon";

type Props = {
  options: string[];
};

export default function FilterDeedTypeGroup({ options }: Props) {
  if (options.length === 0) return null;
  return (
    <>
      <Typography variant="body2">Geography:</Typography>

      <Box sx={{ display: "flow", gap: 1 }}>
        {options.map((deedType) => (
          <FilterDeedTypeIcon key={deedType} name={deedType} />
        ))}
      </Box>
    </>
  );
}
