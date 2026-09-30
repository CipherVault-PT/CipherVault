import { test, expect, openApp, createVault } from './fixtures.mjs';

// Cofre de passwords usado com cliques (cada botão dos cartões, barra lateral, pastas, arrastar)
const SEED = () => {
  vaultFolders.push({ id: 'f1', name: 'Trabalho', icon: '💼' });
  vault.push(
    { id: 'a1', name: 'Gmail', cat: 'email', user: "o'neil@mail.pt", pw: 'Segredo#1', url: 'gmail.com', tags: ["it's"], fields: [{ k: 'PIN', v: '4321' }], pwHistory: ['Antiga#0'], order: 0 },
    { id: 'b2', name: 'Banco', cat: 'banco', user: 'eu', pw: 'Banco#2', order: 1 },
    { id: 'c3', name: 'Intranet', cat: 'trabalho', user: 'eu', pw: 'Intra#3', folderId: 'f1', order: 2 },
  );
  renderAll(); switchTab('vault');
};

test.describe('Cofre de passwords', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
    await page.evaluate(() => avFlushChunks && avFlushChunks());
  });

  test('não tem código dentro do HTML', async ({ page }) => {
    const found = async () => page.evaluate(() => [...document.querySelectorAll('#tab-vault *, .sidebar *')]
      .flatMap(el => [...el.attributes].filter(a => /^on/i.test(a.name)).map(a => (el.id || el.className) + ' ' + a.name)));
    expect(await found()).toEqual([]);
    await page.evaluate(() => { openVaultFolder('f1'); setView('compact'); });
    expect(await found()).toEqual([]);
  });

  test('botões de cada entrada', async ({ page }) => {
    const card = page.locator('#card-a1');
    // Rever, Mover, Arquivar e Apagar ficam no menu «⋯» de cada entrada
    const fromMenu = async (id, act) => {
      await page.locator(`#card-${id} .cbx-more`).click();
      await page.locator(`body > .cbx-menu [data-act="${act}"]`).click();
    };
    const copied = [];
    await page.exposeFunction('__copied', v => copied.push(v));
    await page.evaluate(() => { const o = copyText; copyText = (v, m) => { window.__copied(v); return o(v, m); }; });

    await card.locator('[data-act="copyText"]').first().click();                 // utilizador (com apóstrofo)
    await card.locator('[data-act="togglePw"]').click();                         // mostrar password
    await expect(page.locator('#pw-a1')).toHaveText('Segredo#1');
    await card.locator('[data-act="copyText"][data-arg2="✓"]').click();         // campo extra
    await card.locator('[data-act="toggleHistory"]').click();
    await card.locator('[data-act="toggleHistPw"]').click();
    await expect(page.locator('#hist-pw-a1-0')).toHaveText('Antiga#0');
    await expect.poll(() => copied).toEqual(["o'neil@mail.pt", '4321']);

    await card.locator('[data-act="toggleFav"]').click();
    expect(await page.evaluate(() => vault.find(v => v.id === 'a1').fav)).toBe(true);
    await fromMenu('a1', 'toggleReviewed');
    expect(await page.evaluate(() => !!vault.find(v => v.id === 'a1').reviewedAt)).toBe(true);

    await page.locator('#card-a1 [data-act="editEntry"]').click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/open/);
    await expect(page.locator('#f-name')).toHaveValue('Gmail');
    await page.evaluate(() => closeModal());

    await page.locator('#card-a1 [data-act="openReadMode"]').click();
    await expect(page.locator('#read-modal')).toHaveClass(/open/);
    await page.evaluate(() => closeReadMode());

    await fromMenu('b2', 'archiveEntry');
    expect(await page.evaluate(() => vault.find(v => v.id === 'b2').archived)).toBe(true);
    await fromMenu('a1', 'deleteEntry');                                           // confirmação aceite
    expect(await page.evaluate(() => vault.some(v => v.id === 'a1'))).toBe(false);
  });

  test('categorias, etiquetas, pastas e vista', async ({ page }) => {
    await page.locator('.sidebar [data-act="selectCat"][data-arg="banco"]').click();
    expect(await page.evaluate(() => currentCat)).toBe('banco');
    await expect(page.locator('#card-b2')).toBeVisible();
    await expect(page.locator('#card-a1')).toHaveCount(0);
    // no telemóvel as etiquetas não aparecem na barra (só as categorias, em fila)
    if ((page.viewportSize()?.width ?? 1280) > 768) {
      await page.locator('.sidebar [data-act="selectTag"][data-arg="it\'s"]').click();
      expect(await page.evaluate(() => currentTag)).toBe("it's");
      await page.locator('.sidebar [data-act="selectTag"][data-arg=""]').click();
    }
    await page.locator('.sidebar [data-act="selectCat"][data-arg="all"]').click();

    await page.locator('.folder-card[data-act="openVaultFolder"]').click();
    expect(await page.evaluate(() => currentVaultFolderId)).toBe('f1');
    await expect(page.locator('#card-c3')).toBeVisible();
    await page.locator('#vault-breadcrumb [data-act="goToVaultFolder"][data-null]').click();
    expect(await page.evaluate(() => currentVaultFolderId)).toBeNull();

    await page.locator('#view-compact').click();
    await expect(page.locator('#view-compact')).toHaveClass(/active/);
    await page.locator('#view-normal').click();
    await page.locator('#sort-select').selectOption('name');
    expect(await page.evaluate(() => [...document.querySelectorAll('#cards-grid .entry-card')].map(c => c.id))).toEqual(['card-b2', 'card-a1']);
  });

  test('arrastar um cartão muda a ordem', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) <= 768, 'arrastar para reordenar é com rato (computador)');
    await page.locator('#card-b2').dragTo(page.locator('#card-a1'));
    const order = await page.evaluate(() => vault.filter(v => !v.folderId).sort((a, b) => a.order - b.order).map(v => v.id));
    expect(order).toEqual(['b2', 'a1']);
    expect(await page.evaluate(() => hasUnsaved)).toBe(true);
  });

  test('ids e textos com aspas não executam código', async ({ page }) => {
    await page.evaluate(() => {
      vault.push({ id: `x'");window.__xss=1;//`, name: '"><img src=x onerror=window.__xss=2>', cat: 'email', user: `'");window.__xss=3;//`, pw: 'p', fields: [{ k: 'k', v: `');window.__xss=4;//` }] });
      renderAll(); avFlushChunks();
    });
    const card = page.locator('.entry-card', { hasText: '"><img' });
    await card.locator('[data-act="togglePw"]').click();
    await card.locator('[data-act="copyText"]').first().click();
    await card.locator('[data-act="copyText"][data-arg2="✓"]').click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
});
