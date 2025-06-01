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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex flex-col flex-grow">
          <TopBar />
        </div>
        <div className="flex h-screen overflow-hidden">
          <SideBar />
          <main className="p-4 flex-grow overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
