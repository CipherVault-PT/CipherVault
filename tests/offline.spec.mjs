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

test('o service worker guarda os ficheiros com a versão que a página usa (sem descarregar tudo 2 vezes)', async ({ page }) => {
  await openApp(page);
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20_000 });
  await page.waitForFunction(async () => (await caches.keys()).includes('av-img-v1') && (await (await caches.open('av-img-v1')).keys()).length > 0, null, { timeout: 20_000 });
  const r = await page.evaluate(async () => {
    const keys = async n => (await (await caches.open(n)).keys()).map(k => new URL(k.url).pathname + new URL(k.url).search);
    const used = [...document.querySelectorAll('link[rel=stylesheet][href^="styles"],script[src^="app.js"]')].map(e => '/' + e.getAttribute(e.src ? 'src' : 'href'));
    return { app: await keys('av-app-v2'), img: await keys('av-img-v1'), used };
  });
  for (const u of r.used) expect(r.app).toContain(u);
  expect(r.app).not.toContain('/app.js');
  expect(r.img.length).toBe(1); // só a foto que este ecrã usa
});

test('ícone da app: escudo AV em PNG no manifesto, favicon e ícone Apple', async ({ page }) => {
  await openApp(page);
  const r = await page.evaluate(async () => {
    const mf = await (await fetch(document.getElementById('pwa-manifest').href)).json();
    const size = src => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth + 'x' + i.naturalHeight); i.onerror = () => res('erro'); i.src = src; });
    const icons = [];
    for (const ic of mf.icons) icons.push({ purpose: ic.purpose, type: ic.type, declared: ic.sizes, real: await size(ic.src), file: ic.src.split('/').pop() });
    const links = [...document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]')];
    const linkSizes = [];
    for (const l of links) linkSizes.push(await size(l.href));
    return { icons, linkSizes };
  });
  expect(r.icons.map(i => i.purpose).sort()).toEqual(['any', 'any', 'maskable']);
  for (const i of r.icons) { expect(i.type).toBe('image/png'); expect(i.real).toBe(i.declared); expect(i.file).toMatch(/^av-icon-/); }
  expect(r.linkSizes).toHaveLength(3);
  expect(r.linkSizes).not.toContain('erro');
});

test('o Chrome aceita o manifesto: endereço de arranque válido e sem erros', async ({ page, context }) => {
  await openApp(page);
  const cdp = await context.newCDPSession(page);
  const m = await cdp.send('Page.getAppManifest');
  expect(m.errors).toEqual([]);
  const errs = (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors.map(e => e.errorId).filter(e => e !== 'in-incognito');
  expect(errs.filter(e => /manifest|start-url|icon/.test(e))).toEqual([]);
});
