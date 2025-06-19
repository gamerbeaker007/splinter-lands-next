"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import NavTabs from "@/components/nav-tabs/NavTabs";
import DeedOverview from "@/components/player-overview/DeedOverview";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";

export default function PlayerPage() {
  const { setTitle } = usePageTitle();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTitle("Player Overview");
  }, [setTitle]);

  const pages = [
    { label: "Region Overview", component: <div>TODO</div> },
    { label: "Resource Overview", component: <div>TODO</div> },
    {
      label: "Deed",
      component: <DeedOverview player={selectedPlayer} />,
    },
  ];

  return (
    <FilterProvider>
      <Container>
        {selectedPlayer && <FilterDrawer player={selectedPlayer} />}

        <NavTabs
          pages={pages}
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        />

        <Box mt={2}>
          <PlayerInput onPlayerChange={setSelectedPlayer} />
        </Box>

        <Box mt={4}>{pages[activeTab].component}</Box>
      </Container>
    </FilterProvider>
  );
}
