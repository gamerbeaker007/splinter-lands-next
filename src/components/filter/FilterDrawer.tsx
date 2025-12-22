"use client";

import { getAvailableFilterValues } from "@/lib/backend/actions/filter/filter-actions";
import { EnableFilterOptions, FilterInput } from "@/types/filters";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import { useEffect, useState } from "react";
import AttributeFilter from "./AttributeFilter";
import LocationFilter from "./LocationFilter";
import PlayerFilter from "./PlayerFilter";
import ResetFiltersButton from "./reset-filters/ResetFiltersButton";
import Sorting from "./Sorting";

type Props = {
  player?: string | null;
  filtersEnabled?: Partial<EnableFilterOptions>;
};
export default function FilterDrawer({ player, filtersEnabled }: Props) {
  const [availableOptions, setAvailableOptions] = useState<FilterInput | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAvailableFilterValues(player ?? null);
        setAvailableOptions(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [player]);

  useEffect(() => {
    (async () => {
      const isLarge = window.innerWidth >= 1024;
      setDrawerOpen(isLarge);
    })();
  }, []);

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  if (!availableOptions) return <div>Loading filters...</div>;

  return (
    <>
      {/* Vertical toggle button */}
      <Box
        sx={{
          position: "fixed",
          top: "100px",
          right: drawerOpen ? 300 : 0,
          zIndex: 1301,
          height: 100,
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={toggleDrawer}
          disableRipple
          disableElevation
          sx={{
            width: 30,
            minWidth: "30px",
            padding: 0,
            height: "100%",
            borderRadius: "15px 0 0 15px",
            writingMode: "vertical-rl",
            textOrientation: "sideways",
            boxShadow: 3,
            overflow: "hidden",
          }}
        >
          <Typography
            variant="body1"
            fontSize={14}
            fontWeight="bold"
            sx={{
              transition: "all 0.3s ease-in-out",
              transform: drawerOpen ? "scale(1)" : "scale(0.8)",
              opacity: drawerOpen ? 1 : 0.5,
            }}
          >
            Filter
          </Typography>
        </Button>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        variant="persistent"
        sx={{
          width: 300,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 300,
            top: "100px",
            height: "calc(100vh - 100px)",
            boxSizing: "border-box",
            p: 2,
          },
        }}
      >
        <Box
          sx={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {(filtersEnabled?.regions !== false ||
            filtersEnabled.tracts !== false ||
            filtersEnabled.plots !== false) && (
            <LocationFilter
              options={availableOptions}
              showRegion={filtersEnabled?.regions ?? true}
              showTract={filtersEnabled?.tracts ?? true}
              showPlot={filtersEnabled?.plots ?? true}
            />
          )}
          {filtersEnabled?.attributes !== false && (
            <AttributeFilter options={availableOptions} />
          )}
          {filtersEnabled?.player !== false && (
            <PlayerFilter options={availableOptions} />
          )}

          {filtersEnabled?.sorting !== false && <Sorting />}
        </Box>
        <ResetFiltersButton />
      </Drawer>
    </>
  );
}
