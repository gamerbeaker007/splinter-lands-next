"use client";
import ActiveTile from "@/app/components/ActiveTile";
import ThemeToggle from "./ThemeToggle";

export default function TopBar() {
    return (
        <div className="navbar bg-base-100 border-b">
            <ActiveTile />
            <div className="ml-auto">
                <ThemeToggle />
            </div>
        </div>
    );
}   
