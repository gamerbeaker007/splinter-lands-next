// components/ResourceInput.tsx
import { Box, TextField, Typography } from "@mui/material";
import Image from "next/image";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";

type Props = {
  resource: string;
  value: number;
  onChange: (value: number) => void;
};

export function ResourceInput({ resource, value, onChange }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minWidth={100}
      gap={1}
    >
      <Image
        src={RESOURCE_ICON_MAP[resource]}
        alt={resource}
        width={100}
        height={100}
      />
      <Typography variant="subtitle2">{resource}</Typography>
      <TextField
        type="text"
        value={value.toString()}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onChange(isNaN(val) ? 0 : val);
        }}
        size="small"
        sx={{
          width: "150px",
          "& input": {
            textAlign: "center",
          },
        }}
        slotProps={{
          input: {
            inputMode: "decimal",
          },
        }}
      />
    </Box>
  );
}
