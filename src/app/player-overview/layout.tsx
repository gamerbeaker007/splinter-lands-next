"use client";

import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { CardFilterProvider } from "@/lib/frontend/context/CardFilterContext";
import {
  FilterProvider,
  useFilters,
} from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { Alert, Box, Container } from "@mui/material";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PlayerOverviewContextType = {
  selectedPlayer: string;
  setSelectedPlayer: (player: string) => void;
  playerData: SplPlayerDetails | null;
  error: string | null;
};

const PlayerOverviewContext = createContext<PlayerOverviewContextType | null>(
  null
);

export function usePlayerOverview() {
  const context = useContext(PlayerOverviewContext);
  if (!context) {
    throw new Error(
      "usePlayerOverview must be used within PlayerOverviewLayout"
    );
  }
  return context;
}

const pages = [
  {
    key: "dashboard",
    label: "Player Dashboard",
    path: "/player-overview/dashboard",
  },
  {
    key: "overview",
    label: "Region Overview",
    path: "/player-overview/overview",
  },
  { key: "deed", label: "Deed", path: "/player-overview/deed" },
  {
    key: "collection",
    label: "Collection",
    path: "/player-overview/collection",
  },
];

type PlayerOverviewLayoutProps = {
  children: ReactNode;
};

function PlayerOverviewLayoutInner({ children }: PlayerOverviewLayoutProps) {
  const { setTitle } = usePageTitle();
  const { resetFilters } = useFilters();

  // Read initial player from URL on mount only
  const initialPlayer = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("player")?.trim() || "";
    }
    return "";
  }, []);

  const [selectedPlayer, setSelectedPlayer] = useState<string>(initialPlayer);
  const [playerData, setPlayerData] = useState<SplPlayerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevPlayer = useRef<string | null>(null);

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
    (async () => {
      if (!selectedPlayer || selectedPlayer.trim() === "") {
        setPlayerData(null);
        setError(null);
        return;
      }

      void fetch(
        `/api/player/details?player=${encodeURIComponent(selectedPlayer)}`
      )
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
    })();
  }, [selectedPlayer]);

  return (
    <PlayerOverviewContext.Provider
      value={{ selectedPlayer, setSelectedPlayer, playerData, error }}
    >
      <PageNavTabs pages={pages} />
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
          <Box mt={4} mb={4}>
            {children}
          </Box>
        )}
      </Container>
    </PlayerOverviewContext.Provider>
  );
}

export default function PlayerOverviewLayout({
  children,
}: PlayerOverviewLayoutProps) {
  return (
    <FilterProvider>
      <CardFilterProvider>
        <PlayerOverviewLayoutInner>{children}</PlayerOverviewLayoutInner>
      </CardFilterProvider>
    </FilterProvider>
  );
}
