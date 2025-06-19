"use client";

import { useThemeContext } from "@/lib/frontend/context/ThemeContext";
import { LuMoon, LuSun } from "react-icons/lu";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { mode, toggleTheme } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = mode === "dark";

  return (
    <IconButton
      aria-label="Toggle theme"
      onClick={toggleTheme}
      sx={{
        width: 50,
        height: 24,
        bgcolor: "skyblue",
        borderRadius: "999px",
        px: 0.5,
        position: "relative",
        transition: "background-color 0.3s ease-in-out",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 4,
          left: isDark ? "calc(100% - 20px)" : "4px",
          width: 16,
          height: 16,
          bgcolor: "white",
          borderRadius: "50%",
          boxShadow: 2,
          transition: "left 0.3s ease-in-out",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: 6,
          transform: "translateY(-50%)",
          fontSize: 12,
          color: "white",
        }}
      >
        <LuSun />
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          right: 6,
          transform: "translateY(-50%)",
          fontSize: 12,
          color: "white",
        }}
      >
        <LuMoon />
      </Box>
    </IconButton>
  );
}
