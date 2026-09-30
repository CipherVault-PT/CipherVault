import { test, expect, openApp, createVault } from './fixtures.mjs';

// Ações dos cartões numa só linha, menu «⋯» e pequenos erros visuais apanhados na revisão ecrã a ecrã
test.describe('Aspeto: ações dos cartões', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => {
      vault.push({ id: 'a1', name: 'Gmail', cat: 'email', user: 'u@gmail.com', pw: 'Gm#2024abcXY!', url: 'https://gmail.com' },
        { id: 'a2', name: 'Netflix', cat: 'social', user: 'u', pw: 'x', url: 'netflix.com' });
      documents.push({ id: 'd1', title: 'Recibo', cat: 'pessoal', file: { name: 'r.pdf', type: 'application/pdf', data: 'data:application/pdf;base64,JVBERi0xLjQK' } });
      assets.push({ id: 'v1', kind: 'vehicle', name: 'Golf', plate: 'AA-12-BB' });
      renderAll(); switchTab('vault');
    });
  });

  test('cartão do cofre: uma linha com a ação principal, ícones e o menu «⋯»', async ({ page }) => {
    const card = page.locator('.entry-card', { hasText: 'Gmail' }).first();
    const row = card.locator('.card-actions.cbx');
    await expect(row).toBeVisible();
    await expect(row.locator('.cbx-main')).toHaveText('Ir para o site');
    await expect(row.locator(':scope > .card-btn')).toHaveCount(4);
    const box = await row.boundingBox(), first = await row.locator('.cbx-main').boundingBox(), more = await row.locator('.cbx-more').boundingBox();
    expect(Math.abs(first.y - more.y)).toBeLessThan(2);
    expect(more.x + more.width).toBeLessThanOrEqual(box.x + box.width + 1);
    const menu = page.locator('body > .cbx-menu:not([hidden])');
    await expect(async () => {
      if (!(await menu.count())) await row.locator('.cbx-more').click();
      await expect(menu).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });
    await expect(menu.locator('.card-btn')).toHaveText(['Rever', 'Mover', 'Arquivar', 'Apagar']);
    await expect(row.locator('.cbx-more')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    const archived = () => page.evaluate(() => !!vault.find(v => v.id === 'a1').archived);
    await expect(async () => {
      if (!(await archived())) {
        await row.locator('.cbx-more').click();
        await page.locator('body > .cbx-menu .card-btn', { hasText: 'Arquivar' }).click({ timeout: 2000 });
      }
      expect(await archived()).toBe(true);
    }).toPass({ timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => vault.find(v => v.id === 'a1').archived)).toBe(true);
    await expect(page.locator('body > .cbx-menu')).toHaveCount(0);
  });

  test('Netflix não fica com o logótipo do X', async ({ page }) => {
    expect(await page.evaluate(() => getBrandIcon({ name: 'Netflix', url: 'netflix.com' }) === getBrandIcon({ name: 'Twitter', url: 'x.com' }))).toBe(false);
    expect(await page.evaluate(() => !!getBrandIcon({ name: 'Conta', url: 'https://x.com/eu' }))).toBe(true);
  });

  test('documento sem tamanho guardado não mostra «NaN»', async ({ page }) => {
    await page.evaluate(() => switchTab('docs'));
    await expect(page.locator('#tab-docs')).toContainText('r.pdf');
    await expect(page.locator('#tab-docs')).not.toContainText('NaN');
  });

  test('veículos, garantias…: o botão Editar de cada cartão aparece', async ({ page }) => {
    await page.evaluate(() => switchTab('vehicle'));
    await expect(page.locator('#vehicle-content [data-act="openAssetModal"][data-arg2="v1"]')).toBeVisible();
  });
});
