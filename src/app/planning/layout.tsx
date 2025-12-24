"use client";

import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import { Container } from "@mui/material";
import { ReactNode } from "react";

type PlanningLayoutProps = {
  children: ReactNode;
};

const pages = [
  { key: "planning", label: "Planning", path: "/planning" },
  { key: "playground", label: "Playground", path: "/planning/playground" },
];

export default function PlanningLayout({ children }: PlanningLayoutProps) {
  return (
    <>
      <PageNavTabs pages={pages} />
      <Container maxWidth={false} sx={{ px: { xs: 1, md: 3, lg: 6 } }}>
        {children}
      </Container>
    </>
  );
}
