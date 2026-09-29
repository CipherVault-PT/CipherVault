import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.mjs',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    // localhost (e não 127.0.0.1): contexto seguro para o service worker e para a biometria (WebAuthn)
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node tests/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: ['layout.spec.mjs', 'smoke.spec.mjs'] },
    // Safari do iPhone (motor WebKit): só no GitHub, onde o browser é instalado (PW_WEBKIT=1 para correr noutro sítio)
    ...(process.env.CI || process.env.PW_WEBKIT ? [{
      name: 'iphone', use: { ...devices['iPhone 14'] },
      testMatch: ['smoke.spec.mjs', 'layout.spec.mjs', 'crypto.spec.mjs', 'pin.spec.mjs', 'lock-ui.spec.mjs', 'vault-ui.spec.mjs',
        'ui-modals.spec.mjs', 'tabs-ui.spec.mjs', 'data-safety.spec.mjs', 'regressions.spec.mjs', 'a11y.spec.mjs', 'aurora.spec.mjs', 'aurora-conversa.spec.mjs'],
    }] : []),
  ],
});
