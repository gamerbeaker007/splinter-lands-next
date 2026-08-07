import FilterIcon from "@/components/filter/FilterIcon";
import { Box, Button, Typography } from "@mui/material";

type IconFilterGroupProps<T extends string> = {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  getImage: (value: T) => string;
  noneLabel?: string;
  noneActive?: boolean;
  onSelectNone?: () => void;
};

export default function IconFilterGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
  getImage,
  noneLabel,
  noneActive,
  onSelectNone,
}: Readonly<IconFilterGroupProps<T>>) {
  return (
    <Box mt={1}>
      <Typography variant="body2">{label}:</Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.2 }}>
        {onSelectNone && noneLabel && (
          <Button
            size="small"
            variant={noneActive ? "contained" : "outlined"}
            color={noneActive ? "primary" : "inherit"}
            onClick={onSelectNone}
            sx={{ minHeight: 35 }}
          >
            {noneLabel}
          </Button>
        )}

        {options.map((option) => (
          <FilterIcon
            key={option}
            name={option}
            isActive={selected.includes(option)}
            image={getImage(option)}
            onChange={() => onToggle(option)}
          />
        ))}
      </Box>
    </Box>
  );
}
