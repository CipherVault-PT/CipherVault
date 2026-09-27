import { test, expect, openApp } from './fixtures.mjs';

test('a app abre sem internet depois da primeira visita', async ({ page, context }) => {
  await openApp(page);
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20_000 });
  await page.reload();
  await page.waitForFunction(async () => (await caches.keys()).includes('av-app-v2'));
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => typeof submitNewVault === 'function');
  const r = await page.evaluate(() => ({
    version: APP_VERSION,
    styled: getComputedStyle(document.getElementById('lock-screen')).display === 'flex',
  }));
  await context.setOffline(false);
  expect(r.styled).toBe(true);
  expect(r.version).toMatch(/^\d+\.\d+$/);
});

test('o leitor de QR só é descarregado quando é preciso', async ({ page }) => {
  await openApp(page);
  expect(await page.evaluate(() => typeof jsQR)).toBe('undefined');
  const r = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = c.height = 50;
    const found = await avMakeQrDetector().detect(c);
    return { loaded: typeof jsQR === 'function', found: found.length };
  });
  expect(r).toEqual({ loaded: true, found: 0 });
});
