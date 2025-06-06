"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiHome, FiMap, FiUsers, FiDatabase } from "react-icons/fi";

const links = [
  { href: "/", label: "Home", icon: <FiHome /> },
  { href: "/resource", label: "Resource", icon: <FiDatabase /> },
  { href: "/region-overview", label: "Region Overview", icon: <FiMap /> },
  {
    href: "/region-production-overview",
    label: "Region Production",
    icon: <FiMap />,
  },
  { href: "/player-overview", label: "Player Overview", icon: <FiUsers /> },
];

export default function SideBar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`bg-base-200 text-base-content h-full transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"}`}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <span className="text-xl font-bold">
            <div className="text-xl font-semibold">Land Stats</div>
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-ghost btn-square"
        >
          <FiMenu size={20} />
        </button>
      </div>
      <ul className="menu px-5">
        {links.map(({ href, label, icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-base-300"
            >
              {icon}
              {!collapsed && <span>{label}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
