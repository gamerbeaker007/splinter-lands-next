import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';


export default defineConfig({
  plugins: [],

  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),            // ⬅️ use the provider function
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
});
