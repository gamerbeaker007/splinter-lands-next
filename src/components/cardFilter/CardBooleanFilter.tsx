import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { Box, Button, Typography } from "@mui/material";

type Props = {
  title: string;
  filterKey:
    | "filter_on_land"
    | "filter_in_set"
    | "filter_on_wagon"
    | "filter_delegated"
    | "filter_owned";
};

export default function CardBooleanFilter({ title, filterKey }: Props) {
  const { cardFilters, setCardFilters } = useCardFilters();

  const handleChange = (newValue: boolean | undefined) => {
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
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Button
          variant={value === true ? "contained" : "outlined"}
          color="success"
          size="small"
          sx={{ fontSize: "0.8rem", minWidth: 50, py: 0.2, px: 1 }}
          onClick={() => handleChange(value === true ? undefined : true)}
        >
          Yes
        </Button>
        <Button
          variant={value === false ? "contained" : "outlined"}
          color="error"
          size="small"
          sx={{ fontSize: "0.8rem", minWidth: 50, py: 0.2, px: 1 }}
          onClick={() => handleChange(value === false ? undefined : false)}
        >
          No
        </Button>
      </Box>
    </Box>
  );
}
