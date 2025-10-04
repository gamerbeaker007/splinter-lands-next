import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { Box, Button, Typography } from "@mui/material";

type Props = {
  title: string;
  filterKey:
    | "filter_on_land"
    | "filter_in_set"
    | "filter_on_wagon"
    | "filter_delegated"
    | "filter_owned"
    | "filter_land_cooldown"
    | "filter_survival_cooldown";
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

  const fontSizeSmall = "0.8rem"; // Defining constant for small font size

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
      }}
    >
      <Typography sx={{ fontSize: fontSizeSmall }}>{title}:</Typography>
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
        }}
      >
        <Button
          variant={value === true ? "contained" : "outlined"}
          color="success"
          size="small"
          sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
          onClick={() => handleChange(value === true ? undefined : true)}
        >
          Yes
        </Button>
        <Button
          variant={value === false ? "contained" : "outlined"}
          color="error"
          size="small"
          sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
          onClick={() => handleChange(value === false ? undefined : false)}
        >
          No
        </Button>
      </Box>
    </Box>
  );
}
