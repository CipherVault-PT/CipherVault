import { test, expect, openApp, createVault } from './fixtures.mjs';

// Definições simplificadas: 5 separadores, categorias no Cofre, sem personalização do ícone da app
test.describe('Definições organizadas', () => {
  test.beforeEach(async ({ page }) => { await openApp(page); await createVault(page); });

  test('cinco separadores, a abrir em «Geral»; a Herança está em Segurança', async ({ page }) => {
    await page.evaluate(() => openSettings());
    await expect(page.locator('.settings-nav-btn')).toHaveText([/Geral/, /Aspeto/, /Segurança/, /Dados/, /Sobre/]);
    await expect(page.locator('.settings-pane.active')).toHaveAttribute('data-spane', 'geral');
    await page.evaluate(() => switchSettingsTab('heranca'));
    await expect(page.locator('.settings-pane.active')).toHaveAttribute('data-spane', 'seguranca');
    await expect(page.locator('.settings-pane.active #s-heranca-title')).toBeVisible();
  });

  test('no telemóvel os cinco separadores cabem no ecrã', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.evaluate(() => openSettings());
    const r = await page.evaluate(() => { const nav = document.getElementById('settings-nav').getBoundingClientRect();
      return [...document.querySelectorAll('.settings-nav-btn')].every(b => { const x = b.getBoundingClientRect(); return x.left >= nav.left - 1 && x.right <= nav.right + 1; }); });
    expect(r).toBe(true);
  });

  test('cada secção está no separador certo', async ({ page }) => {
    const where = await page.evaluate(() => Object.fromEntries(['s-name-title', 's-use-title', 's-notif-title', 's-themes-title', 's-bg-title', 's-colors-title',
      's-changepw-title', 's-quick-title', 's-timeout-title', 's-heranca-title', 's-drive-title', 's-snap-title', 's-csv-title', 's-export-title', 's-diag-title']
      .map(id => [id, document.getElementById(id).closest('.settings-pane').dataset.spane])));
    expect(where).toEqual({ 's-name-title': 'geral', 's-use-title': 'geral', 's-notif-title': 'geral', 's-themes-title': 'aspeto', 's-bg-title': 'aspeto', 's-colors-title': 'aspeto',
      's-changepw-title': 'seguranca', 's-quick-title': 'seguranca', 's-timeout-title': 'seguranca', 's-heranca-title': 'seguranca',
      's-drive-title': 'dados', 's-snap-title': 'dados', 's-csv-title': 'dados', 's-export-title': 'dados', 's-diag-title': 'sobre' });
  });

  test('cores personalizadas ficam recolhidas', async ({ page }) => {
    await page.evaluate(() => { openSettings(); switchSettingsTab('aspeto'); });
    await expect(page.locator('#s-colors-adv')).not.toHaveAttribute('open', '');
    await expect(page.locator('#picker-bg')).toBeHidden();
    await page.locator('#s-colors-title').click();
    await expect(page.locator('#picker-bg')).toBeVisible();
  });

  test('ícone da app: sempre o oficial (a personalização antiga é ignorada)', async ({ page }) => {
    await expect(page.locator('#pwa-emoji')).toHaveCount(0);
    const r = await page.evaluate(() => { localStorage.setItem('cv_pwa', JSON.stringify({ name: 'X', emoji: '🔒' })); const p = getPwaPrefs(); return { p, left: localStorage.getItem('cv_pwa') }; });
    expect(r).toEqual({ p: { name: 'Aurora Vault', emoji: '' }, left: null });
  });

  test('gravação automática: interruptor Ligada/Desligada', async ({ page }) => {
    await page.evaluate(() => openSettings());
    const on = () => page.evaluate(() => autoSaveOn());
    const start = await on();
    await page.locator(start ? '#s-autosave-off' : '#s-autosave-on').click();
    expect(await on()).toBe(!start);
    await expect(page.locator(start ? '#s-autosave-off' : '#s-autosave-on')).toHaveClass(/on/);
  });

  test('Google Drive: só os botões que fazem sentido', async ({ page }) => {
    const vis = () => page.evaluate(() => { renderDriveSettings(); return ['drive-upload-btn', 'drive-link-btn', 'drive-toggle-btn', 'drive-hist-btn', 'drive-forget-btn']
      .filter(id => document.getElementById(id).style.display !== 'none'); });
    await page.evaluate(() => openSettings());
    expect(await vis()).toEqual(['drive-link-btn']);
    await page.evaluate(() => dCfg('cid', 'meu.apps.googleusercontent.com'));
    expect(await vis()).toEqual(['drive-upload-btn', 'drive-link-btn', 'drive-forget-btn']);
    await page.evaluate(() => dCfg('fid', 'abc'));
    expect(await vis()).toEqual(['drive-toggle-btn', 'drive-hist-btn', 'drive-forget-btn']);
  });
});

test.describe('Categorias no Cofre', () => {
  test.beforeEach(async ({ page }) => { await openApp(page); await createVault(page); await page.evaluate(() => switchTab('vault')); });

  test('criar uma categoria a partir do Cofre, com ícone escolhido num toque', async ({ page }) => {
    await page.locator('.cat-item.cat-manage').first().click();
    await expect(page.locator('#cats-overlay')).toHaveClass(/open/);
    await page.locator('.catmgr-ic', { hasText: '🎮' }).click();
    await expect(page.locator('.catmgr-ic', { hasText: '🎮' })).toHaveAttribute('aria-checked', 'true');
    await page.fill('#catmgr-name', 'Jogos');
    await page.locator('#catmgr-add-btn').click();
    expect(await page.evaluate(() => customCats.map(c => c.icon + c.name))).toEqual(['🎮Jogos']);
    await expect(page.locator('.cat-item', { hasText: 'Jogos' }).first()).toContainText('🎮');
    await expect(page.locator('.catmgr-ic', { hasText: '📁' })).toHaveAttribute('aria-checked', 'true');
  });

  test('as categorias já não estão nas definições', async ({ page }) => {
    expect(await page.evaluate(() => !!document.getElementById('catmgr-list').closest('#settings-overlay'))).toBe(false);
  });
});
