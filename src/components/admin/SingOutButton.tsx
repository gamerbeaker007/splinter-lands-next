"use client";

import { Button } from "@mui/material";
import { signOut } from "next-auth/react";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function SignOutButton() {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<GitHubIcon />}
      onClick={() => signOut({ callbackUrl: "/" })}
      sx={{ mt: 2, width: "200px" }}
      fullWidth
    >
      Sign Out
    </Button>
  );
}
