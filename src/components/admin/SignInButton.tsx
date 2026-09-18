"use client";

import { Box, Card, CardContent, Container, Typography } from "@mui/material";

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
            <Typography variant="body2" color="text.secondary">
              Sign in with your Splinterlands account via the Keychain login in
              the navigation bar. Admin access requires an authenticated account
              configured as the administrator.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
