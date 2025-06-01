"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiHome, FiMap, FiUsers, FiDatabase } from "react-icons/fi";
import clsx from "clsx";

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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={clsx(
        "bg-base-200 text-base-content h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && <span className="text-xl font-bold">Menu</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-ghost btn-square"
        >
          <FiMenu size={20} />
        </button>
      </div>
      <ul className="menu px-2">
        {mounted &&
          links.map(({ href, label, icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-base-300",
                  pathname === href && "bg-base-300",
                )}
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
