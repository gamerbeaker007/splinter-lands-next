"use client";

import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Box, Container } from "@mui/material";
import { ReactNode, Suspense } from "react";

type ResourceLayoutProps = {
  children: ReactNode;
};

const pages = [
  { key: "conversion", label: "Conversion", path: "/resource/conversion" },
  { key: "supply", label: "Supply", path: "/resource/supply" },
  { key: "tradehub", label: "TradeHub", path: "/resource/tradehub" },
  {
    key: "tradehub-positions",
    label: "TradeHub Positions",
    path: "/resource/tradehub-positions",
  },
  { key: "burn", label: "Burned Resources 🔥", path: "/resource/burn" },
];

export default function ResourceLayout({ children }: ResourceLayoutProps) {
  usePageTitle("Resource Overview");

  return (
    <>
      <Suspense fallback={<Box sx={{ height: 48 }} />}>
        <PageNavTabs pages={pages} />
      </Suspense>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        {children}
      </Container>
    </>
  );
}
