import "./globals.css";
import SideBar from "@/components/SideBar";
import TopBar from "@/components/TopBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
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
