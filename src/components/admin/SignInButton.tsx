"use client";

import { signIn } from "next-auth/react";
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function SignInPage() {
  return (
    <Container maxWidth="sm">
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Card
          variant="outlined"
          sx={{ p: 3, width: "100%", textAlign: "center" }}
        >
          <CardContent>
            <Typography variant="h5" component="h1" gutterBottom>
              Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Sign in with GitHub to access the admin dashboard.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GitHubIcon />}
              onClick={() => signIn("github", { callbackUrl: "/admin" })}
              sx={{ mt: 2 }}
              fullWidth
            >
              Sign in with GitHub
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
