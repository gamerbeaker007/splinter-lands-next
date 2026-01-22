"use client";

import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Box, Container } from "@mui/material";
import { ReactNode } from "react";

const pages = [
  { key: "rankings", label: "Rankings", path: "/player-efficiency/rankings" },
  {
    key: "productionRankings",
    label: "Production Rankings",
    path: "/player-efficiency/productionRankings",
  },
  { key: "dec", label: "DEC", path: "/player-efficiency/dec" },
  { key: "lde", label: "LDE", path: "/player-efficiency/lde" },
  { key: "lce", label: "LCE", path: "/player-efficiency/lce" },
  { key: "lpe", label: "LPE", path: "/player-efficiency/lpe" },
];

type PlayerEfficiencyLayoutProps = {
  children: ReactNode;
};

export default function PlayerEfficiencyLayout({
  children,
}: PlayerEfficiencyLayoutProps) {
  usePageTitle("Player Efficiency");

  return (
    <>
      <PageNavTabs pages={pages} />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={2}>
          <PlayerInput />
        </Box>
        <Box mt={4}>{children}</Box>
      </Container>
    </>
  );
}
