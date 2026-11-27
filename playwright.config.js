// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'npx serve -l 4173 dist',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ]
});
