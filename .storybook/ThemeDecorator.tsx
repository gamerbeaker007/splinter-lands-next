// .storybook/ThemeDecorator.tsx
import { CssBaseline, ThemeProvider } from "@mui/material";
import { getCustomTheme } from "../src/lib/frontend/themes/themes";

export const withMuiTheme = (Story, context) => {
  const mode = context.globals.themeMode;
  const theme = getCustomTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Story />
    </ThemeProvider>
  );
};
