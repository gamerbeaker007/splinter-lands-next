"use client";
import NavTabs from "@/components/nav-tabs/NavTabs";
import { ConversionPage } from "@/components/resource/conversion/ConversionPage";
import { SupplyPage } from "@/components/resource/supply/SupplyPage";
import TradeHubPositionPage from "@/components/resource/trade-hub-positions/TradeHubPositionsPage";
import { TradeHubPage } from "@/components/resource/trade-hub/TradeHubPage";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Page } from "@/types/Page";
import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";

const pages: Page[] = [
  { label: "Conversion", component: <ConversionPage /> },
  { label: "Supply", component: <SupplyPage /> },
  { label: "TradeHub", component: <TradeHubPage /> },
  { label: "TradeHub Positions", component: <TradeHubPositionPage /> },
];

export default function ResourcePage() {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTitle("Resource Overview");
  }, [setTitle]);

  return (
    <>
      <NavTabs
        pages={pages}
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
      />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={4}>{pages[activeTab].component}</Box>
      </Container>
    </>
  );
}
