import { test, expect, openApp, createVault } from './fixtures.mjs';

// Dados que saem do cofre: área de transferência, exportações em texto simples e ficheiros partilhados à espera
test.describe('Dados fora do cofre', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => {
      window.__clip = null; window.__clipFail = false;
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: v => (window.__clipFail && v === '' ? Promise.reject(new Error('Document is not focused')) : (window.__clip = v, Promise.resolve())),
      });
      window.__files = [];
      downloadBlob = (blob, name) => window.__files.push(name);
      vault.push({ id: 'a1', name: 'Gmail', cat: 'email', user: 'u', pw: 'Segredo#1' });
      renderAll();
    });
  });

  test('qualquer cópia (não só passwords) é apagada ao fim do tempo', async ({ page }) => {
    for (const msg of ['Número copiado', 'Copiado!', 'Código copiado']) {
      await page.evaluate(m => copyText('4111111111111111', m), msg);
      await expect.poll(() => page.evaluate(() => window.__clip)).toBe('4111111111111111');
      expect(await page.evaluate(() => clipClearAt > Date.now())).toBe(true);
      await page.evaluate(() => { clipClearAt = Date.now(); });
      await expect.poll(() => page.evaluate(() => window.__clip)).toBe('');
    }
  });

  test('se o browser recusar apagar (app em segundo plano), apaga ao voltar', async ({ page }) => {
    await page.evaluate(() => { window.__clipFail = true; copyText('Segredo#1', t('pwCopied')); });
    await expect.poll(() => page.evaluate(() => window.__clip)).toBe('Segredo#1');
    await page.evaluate(() => { clipClearAt = Date.now(); });
    await expect.poll(() => page.evaluate(() => clipClearPending)).toBe(true);
    expect(await page.evaluate(() => window.__clip)).toBe('Segredo#1');
    await page.evaluate(() => { window.__clipFail = false; window.dispatchEvent(new Event('focus')); });
    await expect.poll(() => page.evaluate(() => window.__clip)).toBe('');
    expect(await page.evaluate(() => clipClearPending)).toBe(false);
  });

  for (const kind of ['CSV', 'PDF']) {
    test(`exportar ${kind} em texto simples pede aviso e a palavra-passe mestra`, async ({ page }) => {
      const run = `export${kind}`;
      await page.evaluate(() => { window.__confirm = confirm; confirm = () => false; });
      await page.evaluate(fn => window[fn](), run);
      expect(await page.evaluate(() => window.__files.length)).toBe(0);
      expect(await page.locator('#av-auth.open').count()).toBe(0);

      await page.evaluate(() => { confirm = window.__confirm; });
      await page.evaluate(fn => { window[fn](); }, run);
      const inp = page.locator('#av-auth-in');
      await inp.fill('errada');
      await page.locator('#av-auth-go').click();
      await expect(page.locator('#av-auth-err')).not.toBeEmpty();
      expect(await page.evaluate(() => window.__files.length)).toBe(0);

      await inp.fill('test-pass-1');
      await page.locator('#av-auth-go').click();
      await expect.poll(() => page.evaluate(() => window.__files.length)).toBe(1);
    });
  }

  test('ficheiros partilhados à espera há mais de 1 hora são apagados', async ({ page }) => {
    const left = await page.evaluate(async () => {
      const put = async at => { const c = await caches.open('av-share'); await c.put('./__share/0', new Response('segredo'));
        await c.put('./__share/meta', new Response(JSON.stringify({ files: [{ key: './__share/0', name: 'a.pdf' }], at }))); };
      const count = async () => (await (await caches.open('av-share')).keys()).length;
      await put(Date.now() - 10 * 60000); await avSharePurgeOld(); const recent = await count();
      await put(Date.now() - 2 * 3600000); await avSharePurgeOld(); const old = await count();
      return { recent, old };
    });
    expect(left).toEqual({ recent: 2, old: 0 });
  });
});
