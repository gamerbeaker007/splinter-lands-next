import { getSplMaintenanceStatus } from "@/lib/backend/actions/auth-actions";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { ReactNode } from "react";

type MaintenanceGuardProps = {
  children: ReactNode;
};

export async function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { maintenance } = await getSplMaintenanceStatus();

  if (maintenance) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}

function MaintenanceScreen() {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Card
        elevation={6}
        sx={{
          maxWidth: 550,
          width: "100%",
          borderRadius: 4,
          textAlign: "center",
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <BuildCircleOutlinedIcon
            sx={{
              fontSize: 72,
              color: "warning.main",
              mb: 2,
            }}
          />

          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Maintenance
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Splinterlands is currently undergoing scheduled maintenance.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Please reload this page in a few minutes and try again.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
