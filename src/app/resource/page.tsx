"use client";
import NavTabs from "@/components/nav-tabs/NavTabs";
import { ConversionPage } from "@/components/resource/conversion/ConversionPage";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Page } from "@/types/Page";
import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";

const pages: Page[] = [{ label: "Conversion", component: <ConversionPage /> }];

export default function ResourcePage() {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTitle("Resource Overview");
  }, [setTitle]);

  return (
    <>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <NavTabs
          pages={pages}
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        />
        <Box mt={4}>{pages[activeTab].component}</Box>
      </Container>
    </>
  );
}
