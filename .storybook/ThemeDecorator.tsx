// .storybook/ThemeDecorator.tsx
import { CssBaseline, ThemeProvider } from "@mui/material";
import { getCustomTheme } from "../src/lib/themes/themes"; // Your theme fn

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
