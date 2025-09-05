import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { Tri } from "@/types/filters";
import { Box, Button, Typography } from "@mui/material";

type Props = {
  title: string;
  filterKey: "filter_on_land" | "filter_in_set" | "filter_on_wagon";
};

export default function CardTriFilter({ title, filterKey }: Props) {
  const { cardFilters, setCardFilters } = useCardFilters();

  const handleChange = (newValue: Tri) => {
    setCardFilters((prev) => {
      const newFilters = { ...prev };
      if (newValue === undefined) {
        delete newFilters[filterKey];
      } else {
        newFilters[filterKey] = newValue;
      }
      return newFilters;
    });
  };

  const value = cardFilters[filterKey];
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        mb: 1,
      }}
    >
      <Typography sx={{ minWidth: 100, mb: 0.5 }}>{title}:</Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant={value === "include" ? "contained" : "outlined"}
          color="success"
          size="small"
          onClick={() => handleChange("include")}
        >
          Include
        </Button>
        <Button
          variant={value === "exclude" ? "contained" : "outlined"}
          color="error"
          size="small"
          onClick={() => handleChange("exclude")}
        >
          Exclude
        </Button>
        <Button
          variant={
            value === "any" || value === undefined ? "contained" : "outlined"
          }
          color="primary"
          size="small"
          onClick={() => handleChange("any")}
        >
          Any
        </Button>
      </Box>
    </Box>
  );
}
