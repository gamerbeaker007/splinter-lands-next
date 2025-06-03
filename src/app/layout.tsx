import "./globals.css";
import SideBar from "@/components/side-bar/SideBar";
import ThemeInitScript from "@/components/top-bar/ThemInitScript";
import TopBar from "@/components/top-bar/TopBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <ThemeInitScript />
      </head>
      <body>
        <div className="flex h-screen overflow-hidden">
          <SideBar />
          <div className="flex flex-col flex-grow">
            <TopBar />
            <main className="p-2 flex-grow overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
