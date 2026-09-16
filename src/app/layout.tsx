// app/layout.tsx
import FilterPanelHost from "@/components/filter/panel/FilterPanelHost";
import SideBar from "@/components/side-bar/SideBar";
import TestModeChip from "@/components/test-mode/TestModeChip";
import TopBar from "@/components/top-bar/TopBar";
import { AuthProvider } from "@/lib/frontend/context/AuthContext";
import { PageTitleProvider } from "@/lib/frontend/context/PageTitleContext";
import { PlayerProvider } from "@/lib/frontend/context/PlayerContext";
import { ThemeSetup } from "@/lib/frontend/context/ThemeSetup";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Box from "@mui/material/Box";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        <AppRouterCacheProvider>
          <ThemeSetup>
            <AuthProvider>
              <PageTitleProvider>
                <PlayerProvider>
                  <Box display="flex" height="100vh" overflow="hidden">
                    <SideBar />
                    <Box
                      display="flex"
                      flexDirection="column"
                      flexGrow={1}
                      minWidth={0}
                    >
                      <TopBar />
                      {/* Content row: `main` shrinks as a flex sibling of the
                          filter panel slot, so an open panel never hides it. */}
                      <Box
                        position="relative"
                        display="flex"
                        flexGrow={1}
                        minHeight={0}
                        minWidth={0}
                      >
                        <Box
                          component="main"
                          flexGrow={1}
                          overflow="auto"
                          minWidth={0}
                        >
                          {children}
                        </Box>
                        <FilterPanelHost />
                      </Box>
                    </Box>
                  </Box>
                  <TestModeChip />
                </PlayerProvider>
              </PageTitleProvider>
            </AuthProvider>
          </ThemeSetup>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
