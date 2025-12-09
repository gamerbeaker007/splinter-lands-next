"use client";

import NavTabs from "@/components/nav-tabs/NavTabs";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Page } from "@/types/Page";
import { Box } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";

interface PlanningTabNavigationProps {
  planningTab: ReactNode;
  playgroundTab: ReactNode;
}

export default function PlanningTabNavigation({
  planningTab,
  playgroundTab,
}: PlanningTabNavigationProps) {
  const { setTitle } = usePageTitle();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setTitle("Land Planning");
  }, [setTitle]);

  const pages: Page[] = useMemo(
    () => [
      {
        key: "planning",
        label: "Planning",
        component: planningTab,
      },
      {
        key: "playground",
        label: "Playground",
        component: playgroundTab,
      },
    ],
    [planningTab, playgroundTab]
  );

  const tabKey = useMemo(() => {
    return (searchParams.get("tab") ?? "planning").toLowerCase().trim();
  }, [searchParams]);

  const activeTab = useMemo(() => {
    const idx = pages.findIndex((p) => p.key === tabKey);
    return idx === -1 ? 0 : idx;
  }, [pages, tabKey]);

  const handleTabChange = (_: unknown, newValue: number) => {
    const newKey = pages[newValue]?.key ?? "planning";
    const params = new URLSearchParams(searchParams.toString());
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
      <Box mt={2}>
        <NavTabs pages={pages} value={activeTab} onChange={handleTabChange} />
      </Box>
      <Box>{activePage.component}</Box>
    </>
  );
}
