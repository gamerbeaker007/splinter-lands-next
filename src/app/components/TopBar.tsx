"use client";
import ThemeToggle from "./ThemeToggle";
import DataTile from "@/app/components/DataTile";

export default function TopBar() {
  return (
      <div className="navbar bg-base-100 border-b">
          <DataTile/>
          <div className="ml-auto">
              <ThemeToggle/>
          </div>
      </div>
  );
}   
