import PlayerDashboardPage from "@/components/player-overview/player-dashboard/PlayerDashboardPage";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { EnableFilterOptions } from "@/types/filters";
import { Page } from "@/types/Page";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { Alert, Box, Container } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import FilterDrawer from "../filter/FilterDrawer";
import NavTabs from "../nav-tabs/NavTabs";
import DeedOverview from "./DeedOverview";
import PlayerInput from "./PlayerInput";
import PlayerRegionOverview from "./region-overview/PlayerRegionOverview";

const defaultFilterConfig: EnableFilterOptions = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: false,
  sorting: false,
};

const defaultWithSortingFilterConfig: EnableFilterOptions = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: false,
  sorting: true,
};

export default function PlayerPageInner() {
  const { setTitle } = usePageTitle();
  const { resetFilters } = useFilters();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [playerData, setPlayerData] = useState<SplPlayerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevPlayer = useRef<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pages: Page[] = useMemo(
    () => [
      {
        key: "dashboard",
        label: "Player Dashboard",
        component: <PlayerDashboardPage player={selectedPlayer} />,
      },
      {
        key: "overview",
        label: "Region Overview",
        component: <PlayerRegionOverview player={selectedPlayer} />,
        filterOptions: defaultFilterConfig,
      },
      {
        key: "deed",
        label: "Deed",
        component: <DeedOverview player={selectedPlayer} />,
        filterOptions: defaultWithSortingFilterConfig,
      },
    ],
    [selectedPlayer],
  );

  const tabKey = useMemo(() => {
    return (searchParams.get("tab") ?? "dashboard").toLowerCase().trim();
  }, [searchParams]);

  const activeTab = useMemo(() => {
    const idx = pages.findIndex((p) => p.key === tabKey);
    return idx === -1 ? 0 : idx;
  }, [pages, tabKey]);

  useEffect(() => {
    setTitle("Player Overview");
  }, [setTitle]);

  useEffect(() => {
    if (selectedPlayer && selectedPlayer !== prevPlayer.current) {
      resetFilters();
      prevPlayer.current = selectedPlayer;
    }
  }, [selectedPlayer, resetFilters]);

  useEffect(() => {
    if (!selectedPlayer || selectedPlayer.trim() === "") {
      setPlayerData(null);
      setError(null);
      return;
    }

    fetch(`/api/player/details?player=${encodeURIComponent(selectedPlayer)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json?.error) {
          throw new Error(json?.error || "Unknown error");
        }
        setPlayerData(json);
        setError(null);
      })
      .catch(() => {
        setPlayerData(null);
        setError(`Unable to find player: ${selectedPlayer}`);
      });
  }, [selectedPlayer]);

  const handleTabChange = (_: unknown, newValue: number) => {
    const newKey = pages[newValue]?.key ?? "dashboard";
    const params = new URLSearchParams(searchParams.toString());
    if (selectedPlayer.trim()) params.set("player", selectedPlayer.trim());
    params.set("tab", newKey);

    const nextQs = params.toString();
    const currentQs = searchParams.toString();
    if (nextQs !== currentQs) {
      router.replace(`${pathname}?${nextQs}`, { scroll: false });
    }
  };

  const activePage = pages[activeTab];
  return (
    <>
      <NavTabs pages={pages} value={activeTab} onChange={handleTabChange} />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={2}>
          <PlayerInput onPlayerChange={setSelectedPlayer} />
        </Box>

        {error && (
          <Box mt={4}>
            <Alert severity="warning">{error}</Alert>
          </Box>
        )}

        {!error && playerData && selectedPlayer && (
          <>
            {activePage.filterOptions && (
              <FilterDrawer
                player={selectedPlayer}
                filtersEnabled={activePage.filterOptions}
              />
            )}
            <Box mt={4} mb={4}>
              {activePage.component}
            </Box>
          </>
        )}
      </Container>
    </>
  );
}
