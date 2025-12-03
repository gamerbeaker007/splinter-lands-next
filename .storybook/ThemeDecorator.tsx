// .storybook/ThemeDecorator.tsx
import {
  CssBaseline,
  InitColorSchemeScript,
  ThemeProvider,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import type { Decorator } from "@storybook/react";
import React from "react";
import theme from "../src/lib/frontend/themes/themes";

function ColorSchemeSync({
  mode,
  children,
}: {
  mode: "light" | "dark";
  children: React.ReactNode;
}) {
  const { setMode } = useColorScheme();

  React.useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  return <>{children}</>;
}

export const withMuiTheme: Decorator = (Story, context) => {
  const mode = (context.globals.themeMode as "light" | "dark") || "dark";

  return (
    <>
      {/* Uses class-based selector because you configured colorSchemeSelector: 'class' */}
      <InitColorSchemeScript attribute="class" />

      <ThemeProvider theme={theme}>
        <ColorSchemeSync mode={mode}>
          <CssBaseline />
          <Story />
        </ColorSchemeSync>
      </ThemeProvider>
    </>
  );
};
