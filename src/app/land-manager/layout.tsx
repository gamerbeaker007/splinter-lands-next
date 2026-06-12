"use client";

import { Container } from "@mui/material";
import { ReactNode } from "react";

type landManagerProps = {
  children: ReactNode;
};

export default function PlanningLayout({ children }: landManagerProps) {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 1, md: 3, lg: 6 } }}>
      {children}
    </Container>
  );
}
