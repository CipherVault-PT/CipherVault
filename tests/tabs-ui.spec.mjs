import { test, expect, openApp, createVault } from './fixtures.mjs';
import { readFileSync } from 'node:fs';

// Separadores, painel, Aurora e restantes ecrãs: nada de código dentro do HTML, e os botões funcionam com cliques
const SEED = () => {
  vault.push({ id: 'a1', name: "O'Brien", cat: 'email', user: 'u', pw: 'p', url: 'gmail.com', tags: ['x'] });
  documents.push({ id: 'd1', title: 'CC', cat: 'pessoal', expiry: '2026-10-10', file: { name: 'a.pdf', type: 'application/pdf', data: 'data:application/pdf;base64,JVBERi0=' } });
  bankCards.push({ id: 'b1', bank: 'CGD', number: '4111111111111111', expiry: '12/28', pin: '1234' });
  storeCards.push({ id: 's1', name: 'Lidl', number: '123' });
  subscriptions.push({ id: 'u1', name: 'Net', amount: 9, cycle: 'monthly', renewDay: '3' });
  assets.push({ id: 'v1', kind: 'vehicle', name: 'Golf', fuel: [{ id: 'q1', date: '2026-01-01', liters: 10, price: 15 }] });
  wifiNets.push({ id: 'w1', name: 'Casa', ssid: 'C', pw: 'x', sec: 'WPA' });
  totp.push({ id: 't1', name: 'G', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1', recovery: 'abc' });
  personalInfo.push({ id: 'p1', name: 'Eu', fields: [{ id: 'f', label: 'NIF', value: '123', sensitive: true }] });
  renderAll();
};

test.describe('Separadores e painel', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
  });

  test('o código da app não gera handlers dentro do HTML', () => {
    const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
    expect(src.match(/\son(click|input|change|keydown|keyup|submit|error|load|focus|blur|mouse\w*|touch\w*|drag\w*|drop)=/g) || []).toEqual([]);
    expect(src.match(/setAttribute\(\s*['"]on/g) || []).toEqual([]);
  });

  test('todas as ações permitidas existem', async ({ page }) => {
    expect(await page.evaluate(() => [...AV_ACTS].filter(n => typeof window[n] !== 'function'))).toEqual([]);
  });

  test('nenhum separador ou painel tem código dentro do HTML', async ({ page }) => {
    const found = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms)), out = new Set();
      const scan = () => document.querySelectorAll('*').forEach(el => [...el.attributes]
        .filter(a => /^on/i.test(a.name)).forEach(a => out.add((el.closest('[id]') || {}).id + ' ' + a.name)));
      const tabs = [...new Set([...document.querySelectorAll('[data-act="switchTab"]')].map(b => b.dataset.arg).filter(Boolean))];
      for (const t of tabs) { switchTab(t); await sleep(150); scan(); }
      for (const f of [() => auroraOpen(), () => openReadMode('d1'), () => openSnapshotModal(), () => avWalOpen('s1'), () => open2faManager(), () => avGaOpen(), () => avTourStart()]) {
        await f(); await sleep(150); scan();
      }
      return [...out];
    });
    expect(found).toEqual([]);
  });

  test('documentos, 2FA, dados pessoais e cartões com cliques', async ({ page }) => {
    await page.evaluate(() => switchTab('docs'));
    await page.locator('#tab-docs [data-act="openDocModal"][data-arg="d1"]').first().click();
    await expect(page.locator('.modal-overlay.open')).toHaveCount(1);
    await page.evaluate(() => document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')));

    await page.evaluate(() => switchTab('totp'));
    const copied = [];
    await page.exposeFunction('__copied', v => copied.push(v));
    await page.evaluate(() => { const o = copyText; copyText = (v, m) => { window.__copied(v); return o(v, m); }; });
    await page.locator('#tab-totp [data-act="toggleTotpRecovery"]').first().click();
    await page.locator('#tab-totp [data-act="copyText"]').first().click();
    expect(copied).toContain('abc');

    await page.evaluate(() => switchTab('info'));
    await page.locator('#tab-info [data-act="toggleInfoMask"]').first().click();
    await expect(page.locator('#tab-info')).toContainText('123');

    await page.evaluate(() => switchTab('cards'));
    const pin = page.locator('#tab-cards [data-act="avCardPinTap"]').first();
    if (await pin.count()) { await pin.click(); await expect(pin).toContainText('1234'); }
  });

  test('lixo: apagar e restaurar com cliques', async ({ page }) => {
    await page.evaluate(() => { deleteEntry('a1'); switchTab('trash'); });
    await page.locator('#tab-trash [data-act="restoreTrashItem"]').first().click();
    expect(await page.evaluate(() => vault.some(e => e.id === 'a1'))).toBe(true);
  });
});
