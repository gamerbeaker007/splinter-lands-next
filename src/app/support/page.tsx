import SupportFeature from "@/components/support/SupportFeature";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support spl-stats.com | Splinter Lands",
  description:
    "Vote for the spl-stats.com validator and support this project with donations to beaker007.",
};

export default function SupportPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Support Splinter-Lands Project
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vote for the <strong>spl-stats.com</strong> validator and/or donate
          directly to <strong>beaker007</strong>.
        </Typography>
      </Box>
      <SupportFeature />
    </Container>
  );
}
