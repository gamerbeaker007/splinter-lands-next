// app/layout.tsx
import SideBar from "@/components/side-bar/SideBar";
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
                      <Box
                        component="main"
                        flexGrow={1}
                        overflow="auto"
                        minWidth={0}
                      >
                        {children}
                      </Box>
                    </Box>
                  </Box>
                </PlayerProvider>
              </PageTitleProvider>
            </AuthProvider>
          </ThemeSetup>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
