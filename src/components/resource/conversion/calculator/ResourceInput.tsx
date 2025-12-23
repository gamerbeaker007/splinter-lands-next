// components/ResourceInput.tsx
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { Box, TextField, Typography } from "@mui/material";
import Image from "next/image";

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
      minWidth={75}
      gap={1}
    >
      <Image
        src={RESOURCE_ICON_MAP[resource]}
        alt={resource}
        width={75}
        height={75}
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
            fontSize: "0.8rem",
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
