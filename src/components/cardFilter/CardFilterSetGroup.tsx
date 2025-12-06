import { landCardSet } from "@/types/editions";
import { Box, Typography } from "@mui/material";
import CardFilterSetIcon from "./CardFilterSetIcon";

export default function CardFilterSetGroup() {
  return (
    <>
      <Typography variant="body2">Card Set:</Typography>

      <Box sx={{ display: "flow", gap: 1 }}>
        {landCardSet.map((set) => (
          <CardFilterSetIcon key={set} name={set} />
        ))}
      </Box>
    </>
  );
}
