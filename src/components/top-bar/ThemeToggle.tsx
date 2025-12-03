"use client";

import { useMediaQuery } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { useColorScheme } from "@mui/material/styles";
import { LuMoon, LuSun } from "react-icons/lu";

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  // detect OS preference
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  // resolve actual mode
  const resolvedMode =
    mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  if (!mode) return null; // required for MUI hydration safety

  const isDark = resolvedMode === "dark";

  return (
    <IconButton
      aria-label="Toggle theme"
      onClick={() => setMode(isDark ? "light" : ("dark" as typeof mode))}
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
