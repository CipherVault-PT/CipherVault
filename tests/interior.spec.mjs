import { test, expect, openApp, createVault, modalSettled } from './fixtures.mjs';

// Disposição «Nova» (v12.4/v12.5): Início com boas-vindas, Aurora e o que expira (sem contas); Cofre em lista com folha da conta; a «Anterior» continua disponível
const nova = page => page.addInitScript(() => { if (!sessionStorage.getItem('__nova')) { sessionStorage.setItem('__nova', '1'); localStorage.setItem('av_layout', 'nova'); } });

async function seed(page) {
  await page.evaluate(() => {
    const now = Date.now(), day = 864e5;
    const d = [['Gmail', 'ana@gmail.com', 'email', 'https://mail.google.com'], ['Banco', '1234', 'banco', 'https://banco.pt'],
      ['Steam', 'jogador_um', 'jogos', 'https://store.steampowered.com'], ['Netflix', 'ana@gmail.com', 'social', 'https://netflix.com']];
    d.forEach((x, i) => vault.push({ id: 'n' + i, name: x[0], user: x[1], pw: i === 1 ? '123456' : 'Xk9!fA2#pQ' + i, cat: x[2], url: x[3], created: now - i * day, updated: now - i * day, fav: i === 0 }));
    documents.push({ id: 'd1', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: new Date(now + 20 * day).toISOString().slice(0, 10) });
    renderAll(); switchTab('dashboard');
  });
}

test.describe('Disposição Nova', () => {
  test('Início: boas-vindas, Aurora logo a seguir e o que expira — sem mostrar contas', async ({ page }) => {
    await nova(page);
    await openApp(page);
    await createVault(page);
    await seed(page);
    const hero = page.locator('#avn-home .avn-hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('.avn-gem svg').first()).toBeVisible();
    await expect(hero.locator('.avn-st.warn')).toBeVisible();
    await expect(page.locator('#avn-home2 .avn-exp')).toContainText('Cartão de Cidadão');
    // as contas ficam no Cofre: o Início não mostra nomes nem utilizadores
    const home = await page.evaluate(() => ['avn-home', 'avn-home2'].map(id => document.getElementById(id).innerText).join(' '));
    for (const s of ['Steam', 'jogador_um', 'Gmail', 'ana@gmail.com']) expect(home).not.toContain(s);
    // ordem: boas-vindas, saudação com a Aurora, (primeiros passos) e o que expira
    await expect.poll(() => page.evaluate(() => [...document.querySelector('#tab-dashboard .dashboard').children].map(c => c.id).filter(id => id && id !== 'av-onboard').slice(0, 3)))
      .toEqual(['avn-home', 'dash-greeting', 'avn-home2']);
    const aur = page.locator('#dash-greeting .aur-launch');
    if (await aur.isVisible()) {
      const [h, a, x] = await Promise.all(['#avn-home .avn-hero', '#dash-greeting .aur-launch', '#avn-home2'].map(s => page.locator(s).boundingBox()));
      expect(a.y).toBeGreaterThanOrEqual(h.y + h.height);
      expect(a.y - (h.y + h.height)).toBeLessThan(40);
      expect(x.y).toBeGreaterThan(a.y);
    }
    // no computador: avisos e Wi-Fi numa coluna à direita das boas-vindas (como no Clássico), não empilhados por baixo
    // (com e sem redes Wi-Fi: sem elas, os avisos vêm sozinhos)
    if (page.viewportSize().width >= 1100) {
      for (const side of ['#aur-alerts', '#av-side']) {
        if (side === '#av-side') await page.evaluate(() => { wifiNets.push({ id: 'w1', name: 'Casa', ssid: 'Casa', pw: 'x', sec: 'WPA' }); renderAll(); switchTab('dashboard'); });
        const [h, s, a] = await Promise.all(['#avn-home .avn-hero', side, '#dash-greeting .aur-launch'].map(q => page.locator(q).boundingBox()));
        expect(s.x, side).toBeGreaterThanOrEqual(h.x + h.width);
        expect(s.y, side).toBeLessThan(h.y + h.height);
        expect(a.y - (h.y + h.height), side).toBeLessThan(40);
      }
    }
    // já não se guarda um histórico das contas usadas
    await page.evaluate(() => { switchTab('vault'); avnOpen('n2'); avCopyPw('n2'); });
    expect(await page.evaluate(() => localStorage.getItem('av_recent'))).toBeNull();
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

  test('mudar para o Clássico com o cofre aberto não mistura as duas disposições (e voltar repõe a nova)', async ({ page }) => {
    await nova(page);
    await openApp(page);
    await createVault(page);
    await seed(page);
    await expect(page.locator('#avn-home .avn-hero')).toBeVisible();
    await page.evaluate(() => setSkin('classico'));
    await expect(page.locator('#avn-home')).toBeHidden();
    await expect(page.locator('#avn-home2')).toBeHidden();
    await expect(page.locator('#dash-greeting .dash-greet-left')).toBeVisible();
    await page.evaluate(() => switchTab('vault'));
    await expect(page.locator('#card-n2 .card-actions')).toBeVisible();
    await expect(page.locator('#card-n2 .avn-sub')).toBeHidden();
    await page.locator('#card-n2 .card-name').click();
    await expect(page.locator('#avn-sheet.open')).toHaveCount(0);
    await page.evaluate(() => { setSkin('safira'); switchTab('dashboard'); });
    await expect(page.locator('#avn-home .avn-hero')).toBeVisible();
    await expect(page.locator('#dash-greeting .dash-greet-left')).toBeHidden();
  });

  test('o botão «•••» no fundo da barra lateral abre as abas visíveis dentro do ecrã', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'a barra lateral é só no computador');
    await nova(page);
    await openApp(page);
    await createVault(page);
    await page.locator('#grp-gear').click();
    const pop = page.locator('#av-tabs-pop.open');
    await expect(pop).toBeVisible();
    const r = await pop.boundingBox(), vp = page.viewportSize();
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.y + r.height).toBeLessThanOrEqual(vp.height);
    expect(r.x + r.width).toBeLessThanOrEqual(vp.width);
    await expect(pop).toContainText('Abas visíveis');
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
