"use client";

import { logoutAction } from "@/lib/backend/actions/auth-actions";
import LogoutIcon from "@mui/icons-material/Logout";
import { Button } from "@mui/material";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await logoutAction();
    window.location.href = "/";
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<LogoutIcon />}
      onClick={handleSignOut}
      sx={{ mt: 2, width: "200px" }}
    >
      Sign Out
    </Button>
  );
}
