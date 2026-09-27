import { test, expect, openApp, createVault } from './fixtures.mjs';

// O fundo animado é o que mais gasta bateria: estes limites impedem que volte a correr sem necessidade.
test.describe('Fundo animado', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
  });

  const drawsIn = (page, ms) => page.evaluate(async ms => {
    const d0 = AuroraBG.draws(); await new Promise(r => setTimeout(r, ms)); return AuroraBG.draws() - d0;
  }, ms);

  test('modos suaves a ~30 imagens por segundo e em meia resolução', async ({ page }) => {
    await page.evaluate(() => setBackground('aurora'));
    await page.waitForTimeout(300);
    const n = await drawsIn(page, 2000);
    expect(n).toBeGreaterThan(20);
    expect(n).toBeLessThanOrEqual(66);
    const r = await page.evaluate(() => { const c = document.getElementById('bg-net'); return c.width / c.clientWidth; });
    expect(r).toBeCloseTo(0.5, 1);
  });

  test('para com uma janela aberta por cima e volta quando fecha', async ({ page }) => {
    await page.evaluate(() => { setBackground('net'); openSettings(); });
    await page.waitForTimeout(800);
    expect(await drawsIn(page, 1500)).toBe(0);
    await page.evaluate(() => closeSettings());
    await page.waitForTimeout(800);
    expect(await drawsIn(page, 1000)).toBeGreaterThan(5);
  });

  test('para sem atividade e volta ao primeiro movimento', async ({ page }) => {
    await page.evaluate(() => { setBackground('net'); AV_IDLE.ms = 500; });
    await page.waitForTimeout(1200);
    expect(await drawsIn(page, 1000)).toBe(0);
    await page.mouse.move(200, 200);
    await page.mouse.move(260, 240);
    await page.evaluate(() => { AV_IDLE.ms = 60000; });
    await page.waitForTimeout(300);
    expect(await drawsIn(page, 1000)).toBeGreaterThan(5);
  });

  test('animações do painel da Aurora ficam paradas enquanto está fechado', async ({ page }) => {
    const running = await page.evaluate(() => document.getAnimations()
      .filter(a => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#aurora-panel')).length);
    expect(running).toBe(0);
  });
});
