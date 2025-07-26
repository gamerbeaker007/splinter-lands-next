// app/layout.tsx
import SideBar from "@/components/side-bar/SideBar";
import TopBar from "@/components/top-bar/TopBar";
import { PageTitleProvider } from "@/lib/frontend/context/PageTitleContext";
import { ThemeProviderWrapper } from "@/lib/frontend/context/ThemeContext";
import Box from "@mui/material/Box";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProviderWrapper>
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
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
