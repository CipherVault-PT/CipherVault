import { test, expect, openApp, createVault, modalSettled } from './fixtures.mjs';

// Disposição «Nova» (v12.4): Início em galeria e Cofre em lista com folha da conta; a «Anterior» continua disponível
const nova = page => page.addInitScript(() => { if (!sessionStorage.getItem('__nova')) { sessionStorage.setItem('__nova', '1'); localStorage.setItem('av_layout', 'nova'); } });

async function seed(page) {
  await page.evaluate(() => {
    const now = Date.now(), day = 864e5;
    const d = [['Gmail', 'ana@gmail.com', 'email', 'https://mail.google.com'], ['Banco', '1234', 'banco', 'https://banco.pt'],
      ['Steam', 'jogador_um', 'jogos', 'https://store.steampowered.com'], ['Netflix', 'ana@gmail.com', 'social', 'https://netflix.com']];
    d.forEach((x, i) => vault.push({ id: 'n' + i, name: x[0], user: x[1], pw: i === 1 ? '123456' : 'Xk9!fA2#pQ' + i, cat: x[2], url: x[3], created: now - i * day, updated: now - i * day, fav: i === 0 }));
    documents.push({ id: 'd1', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: new Date(now + 20 * day).toISOString().slice(0, 10) });
    localStorage.setItem('av_recent', JSON.stringify(['n2', 'n0']));
    renderAll(); switchTab('dashboard');
  });
}

test.describe('Disposição Nova', () => {
  test('Início: boas-vindas, usadas recentemente e o que expira', async ({ page }) => {
    await nova(page);
    await openApp(page);
    await createVault(page);
    await seed(page);
    const hero = page.locator('#avn-home .avn-hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('.avn-gem svg').first()).toBeVisible();
    await expect(hero.locator('.avn-st.warn')).toBeVisible();
    const rec = page.locator('#avn-home2 .avn-rc');
    await expect(page.locator('#avn-home2 .avn-rail-h').first()).toContainText('Usadas recentemente');
    expect(await rec.locator('b').allTextContents()).toEqual(['Steam', 'Gmail', 'Banco', 'Netflix']);
    await expect(page.locator('#avn-home2 .avn-exp')).toContainText('Cartão de Cidadão');
    // a galeria fica logo a seguir às boas-vindas, antes dos avisos e dos primeiros passos
    expect(await page.evaluate(() => [...document.querySelector('#tab-dashboard .dashboard').children].slice(0, 3).map(c => c.id))).toEqual(['avn-home', 'avn-home2', 'dash-greeting']);
    await rec.first().click();
    await expect(page.locator('#avn-sheet.open .avn-sh-t')).toContainText('Steam');
  });

  test('Cofre: linhas simples e a folha da conta com copiar, mostrar e ações', async ({ page }) => {
    await nova(page);
    await openApp(page);
    await createVault(page);
    await seed(page);
    await page.evaluate(() => { switchTab('vault'); const s = document.getElementById('sort-select'); s.value = 'name'; renderCards(); });
    const card = page.locator('#card-n2');
    await expect(card.locator('.avn-sub')).toHaveText('jogador_um');
    await expect(card.locator('.avn-copy')).toBeVisible();
    expect(await card.evaluate(c => [...c.querySelectorAll('.card-field,.card-actions')].filter(n => n.offsetParent).length)).toBe(0);
    expect(await page.locator('#cards-grid .entry-card[data-l]').evaluateAll(cs => cs.map(c => c.dataset.l))).toEqual(['B', 'G', 'N', 'S']);

    await card.locator('.card-name').click();
    const sheet = page.locator('#avn-sheet.open');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('jogador_um');
    await expect(page.locator('#avn-pw')).toHaveText('••••••••••');
    await sheet.locator('.avn-ib[data-act="avnPw"]').click();
    await expect(page.locator('#avn-pw')).toHaveText('Xk9!fA2#pQ2');
    expect(await page.evaluate(() => document.activeElement?.classList.contains('avn-x'))).toBe(false);

    await page.keyboard.press('Escape');
    await expect(page.locator('#avn-sheet')).not.toHaveClass(/open/);

    // teclado: Enter abre a folha da linha com foco, Escape fecha e o foco volta à linha
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(sheet).toContainText('jogador_um');
    await page.keyboard.press('Escape');
    await expect(page.locator('#avn-sheet')).not.toHaveClass(/open/);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('card-n2');

    await card.locator('.card-name').click();
    await sheet.locator('.avn-a[data-arg="editEntry"]').click();
    await expect(page.locator('#avn-sheet')).not.toHaveClass(/open/);
    await expect(page.locator('#modal-overlay')).toHaveClass(/open/);
    expect(await page.inputValue('#f-name')).toBe('Steam');
  });

  test('Definições → Aspeto: trocar para a Anterior volta aos cartões e fica guardado', async ({ page }) => {
    await nova(page);
    await openApp(page);
    await createVault(page);
    await seed(page);
    await page.evaluate(() => setLayout('atual'));
    expect(await page.evaluate(() => [document.documentElement.dataset.layout, localStorage.getItem('av_layout')])).toEqual(['atual', 'atual']);
    await expect(page.locator('#avn-home .avn-hero')).toHaveCount(0);
    await page.evaluate(() => switchTab('vault'));
    await expect(page.locator('#card-n2 .card-actions')).toBeVisible();
    await expect(page.locator('#card-n2 .avn-sub')).toBeHidden();
    await page.locator('#card-n2 .card-name').click();
    await expect(page.locator('#avn-sheet.open')).toHaveCount(0);
    await page.reload();
    await page.waitForFunction(() => typeof submitOpenVault === 'function');
    expect(await page.evaluate(() => document.documentElement.dataset.layout)).toBe('atual');
  });

  test('no Clássico fica sempre a disposição de antes', async ({ page }) => {
    await nova(page);
    await page.addInitScript(() => localStorage.setItem('av_skin', 'classico'));
    await openApp(page);
    await createVault(page);
    await seed(page);
    await expect(page.locator('#avn-home .avn-hero')).toHaveCount(0);
    await page.evaluate(() => switchTab('vault'));
    await expect(page.locator('#card-n2 .card-actions')).toBeVisible();
  });

  test('sem deslocamento horizontal no telemóvel', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'só no telemóvel');
    await nova(page);
    await openApp(page);
    await createVault(page);
    await seed(page);
    for (const tab of ['dashboard', 'vault']) {
      await page.evaluate(t => switchTab(t), tab);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), tab).toBeLessThanOrEqual(0);
    }
    await page.locator('#card-n0 .card-name').click();
    await modalSettled(page);
    const box = await page.locator('#avn-sheet .avn-sheet').boundingBox();
    const vw = page.viewportSize().width;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
  });
});
