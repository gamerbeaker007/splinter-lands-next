"use client";

import { FilterInput } from "@/types/filters";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import { useEffect, useState } from "react";
import AttributeFilter from "./AttributeFilter";
import LocationFilter from "./LocationFilter";
import PlayerFilter from "./PlayerFilter";
import ResetFiltersButton from "./reset-filters/ResetFiltersButton";

type Props = {
  player?: string | null;
};
export default function FilterDrawer({ player }: Props) {
  const [availableOptions, setAvailableOptions] = useState<FilterInput | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(true);
  const query = player ? `?player=${encodeURIComponent(player)}` : "";
  console.log(`FilterDrawer player:  ${player}`);
  useEffect(() => {
    fetch(`/api/filters${query}`)
      .then((res) => res.json())
      .then(setAvailableOptions)
      .catch(console.error);
  }, [query]);

  useEffect(() => {
    const isLarge = window.innerWidth >= 1024;
    setDrawerOpen(isLarge);
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
          height: 125,
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={toggleDrawer}
          sx={{
            width: 20,
            minWidth: "auto",
            height: "100%",
            borderRadius: "10px 0 0 10px",
            writingMode: "vertical-rl",
            textOrientation: "sideways",
            boxShadow: 3,
          }}
        >
          Filter
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
          <LocationFilter options={availableOptions} />
          <AttributeFilter options={availableOptions} />
          <PlayerFilter options={availableOptions} />
        </Box>
        <ResetFiltersButton />
      </Drawer>
    </>
  );
}
