// app/layout.tsx
import SideBar from "@/components/side-bar/SideBar";
import TopBar from "@/components/top-bar/TopBar";
import { AuthProvider } from "@/lib/frontend/context/AuthContext";
import { PageTitleProvider } from "@/lib/frontend/context/PageTitleContext";
import theme from "@/lib/frontend/themes/themes";
import {
  CssBaseline,
  InitColorSchemeScript,
  ThemeProvider,
} from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Box from "@mui/material/Box";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <InitColorSchemeScript attribute="class" />
      </head>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <AuthProvider>
              <PageTitleProvider>
                <Box display="flex" height="100vh" overflow="hidden">
                  <SideBar />
                  <Box display="flex" flexDirection="column" flexGrow={1}>
                    <TopBar />
                    <Box component="main" flexGrow={1} overflow="auto">
                      {children}
                    </Box>
                  </Box>
                </Box>
              </PageTitleProvider>
            </AuthProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
