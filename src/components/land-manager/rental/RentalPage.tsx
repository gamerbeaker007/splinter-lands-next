"use client";

import AuthorityControl from "@/components/land-manager/production/rental-actions/AuthorityControl";
import RenewRentalsActionControl from "@/components/land-manager/production/rental-actions/RenewRentalsActionControl";
import RentalOverview from "@/components/land-manager/rental/RentalOverview";
import { useRentalAuthorityStatus } from "@/hooks/useRentalAuthorityStatus";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { Box, Divider, Stack, Typography } from "@mui/material";

function RentalOverviewPageContent() {
  const { auth, refreshKey, triggerRefresh } = useLandManagerContext();
  const username = auth.username ?? "";
  const rentalAuthorityHook = useRentalAuthorityStatus();

  return (
    <Box>
      {/* Rental Authority */}
      <AuthorityControl
        authority={rentalAuthorityHook}
        label="Rental Authority"
        actionNoun="rental"
        opName="sm_market_rent"
      />

      <Divider sx={{ my: 2 }} />

      {/* Renew Rentals */}
      <Stack direction="row" gap={2} alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={700}>
          Renew Rentals
        </Typography>
        <RenewRentalsActionControl
          username={username}
          onSuccess={triggerRefresh}
        />
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Rental table */}
      <RentalOverview
        username={username}
        refreshKey={refreshKey}
        onSuccess={triggerRefresh}
      />
    </Box>
  );
}

export default function RentalOverviewPage() {
  return <RentalOverviewPageContent />;
}
