import type { Preview } from "@storybook/nextjs-vite";
import { withMuiTheme } from "./ThemeDecorator";

export const decorators = [withMuiTheme];

export const globalTypes = {
  themeMode: {
    name: "Theme",
    description: "Global theme for components",
    defaultValue: "dark",
    toolbar: {
      icon: "circlehollow",
      items: [
        { value: "light", title: "Light (Cupcake)" },
        { value: "dark", title: "Dark (Night)" },
      ],
    },
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
