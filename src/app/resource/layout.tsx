"use client";

import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Container } from "@mui/material";
import { useEffect, ReactNode } from "react";

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
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Resource Overview");
  }, [setTitle]);

  return (
    <>
      <PageNavTabs pages={pages} />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        {children}
      </Container>
    </>
  );
}
