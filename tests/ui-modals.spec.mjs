import { test, expect, openApp, createVault, modalSettled } from './fixtures.mjs';
import { readFileSync } from 'node:fs';

const SEED = () => {
  vault.push({ id: 'a1', name: 'Gmail', cat: 'email', user: 'u', pw: 'Pw#12345', url: 'gmail.com' });
  storeCards.push({ id: 's1', name: 'Lidl', number: '123' });
  subscriptions.push({ id: 'u1', name: 'Net', amount: 9, cycle: 'monthly', renewDay: '3' });
  wifiNets.push({ id: 'w1', name: 'Casa', ssid: 'CasaNet', pw: 'x', sec: 'WPA' });
  renderAll();
};

test.describe('Janelas, definições e menus', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
  });

  test('o index.html não tem código dentro de nenhum elemento', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(html.match(/<[a-z][^>]*\son[a-z]+=["'][^>]*>/gi) || []).toEqual([]);
  });

  test('nenhuma janela, definição ou menu gera código dentro do HTML', async ({ page }) => {
    const found = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms)), out = new Set();
      const scan = () => document.querySelectorAll('.modal-overlay.open *, #read-modal.open *, .topbar *, #tb-more-menu *, .av-pop.open *')
        .forEach(el => [...el.attributes].filter(a => /^on/i.test(a.name)).forEach(a => out.add((el.closest('[id]') || {}).id + ' ' + a.name)));
      const close = () => document.querySelectorAll('.modal-overlay.open,#read-modal.open').forEach(o => o.classList.remove('open'));
      const steps = [
        async () => { openSettings(); for (const t of ['geral', 'aspeto', 'seguranca', 'dados', 'heranca', 'sobre']) { switchSettingsTab(t); await sleep(60); scan(); } },
        () => openModal(), () => openModal('a1'), () => openPwGen(), () => openChangePwModal(), () => openFolderModal(null, 'vault'),
        () => openMoveModal('a1', 'vault'), () => openReadMode('a1'), () => openCardModal(), () => openDocModal(), () => openTotpModal(),
        () => openHealthCheck(), () => openCalendar(), () => openSelectiveExport(), () => openSnapshotModal(), () => openLegacyModal(),
        () => openWifiManager(), () => openSubsScreen(), () => openStoreModal(), () => openSubModal(), () => showBarcode('s1'),
        () => openWifiNetQR('w1'), () => tbToggleMore(), () => avAddMenu(),
      ];
      for (const f of steps) { close(); await f(); await sleep(120); scan(); }
      return [...out];
    });
    expect(found).toEqual([]);
  });

  test('definições: separadores, tema, fundo e cor com cliques; fundo escuro fecha', async ({ page }) => {
    await page.evaluate(() => openSettings());
    await page.locator('#settings-overlay [data-act="switchSettingsTab"][data-arg="seguranca"]').click();
    await expect(page.locator('#settings-overlay [data-act="switchSettingsTab"][data-arg="seguranca"]')).toHaveClass(/active/);
    await page.locator('#settings-overlay [data-act="switchSettingsTab"][data-arg="aspeto"]').click();
    await page.locator('#settings-overlay [data-act="applyThemePreset"]').nth(1).click();
    await page.locator('#settings-overlay [data-act="setBackground"][data-arg="stars"]').click();
    expect(await page.evaluate(() => currentBg)).toBe('stars');
    await page.locator('#s-colors-title').click();   // cores personalizadas estão recolhidas
    await page.locator('#settings-overlay [data-act="pickPresetColor"]').first().click();
    await page.locator('#settings-overlay').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#settings-overlay')).not.toHaveClass(/open/);
  });

  test('menu «⋯»: a opção faz a ação e o menu fecha; espaço vazio não fecha', async ({ page }) => {
    await page.evaluate(() => tbToggleMore());
    await expect(page.locator('#tb-more-menu')).toHaveClass(/open/);
    await page.locator('#tb-more-menu .tbm-lang span').first().click();
    await expect(page.locator('#tb-more-menu')).toHaveClass(/open/);
    await page.locator('#tb-more-menu [data-args*="openCalendar"]').click();
    await expect(page.locator('#tb-more-menu')).not.toHaveClass(/open/);
    await expect(page.locator('#calendar-overlay')).toHaveClass(/open/);
  });

  test('menu «+»: escolher um tipo abre a janela certa e o menu fecha', async ({ page }) => {
    await page.evaluate(() => avAddMenu());
    await expect(page.locator('#av-add-pop')).toHaveClass(/open/);
    await page.locator('#av-add-pop [data-act="avAddType"]').first().click();
    await expect(page.locator('#av-add-pop')).not.toHaveClass(/open/);
    await expect(page.locator('.modal-overlay.open').first()).toBeVisible();   // abre ~80 ms depois de o menu fechar
  });

  test('entrada nova: força da password, gerador e campos', async ({ page }) => {
    await page.evaluate(() => openModal());
    await expect(page.locator('#f-pw')).toBeVisible();
    await page.locator('#f-pw').fill('abc');
    await expect(page.locator('#pw-strength-label')).not.toHaveText('');
    const weak = await page.locator('#pw-strength-label').textContent();
    await page.locator('#f-pw').fill('Muito-Forte#2031!xQ');
    await expect(page.locator('#pw-strength-label')).not.toHaveText(weak);
    await page.evaluate(() => { closeModal(); openPwGen(); });
    const before = await page.locator('#pwgen-result').inputValue();
    await page.locator('#pwgen-overlay input[type=checkbox][data-change="updatePwGen"]:visible').first().click();
    expect(await page.locator('#pwgen-result').inputValue()).not.toBe(before);
  });

  test('pesquisa: escrever filtra e Escape fecha', async ({ page }) => {
    const si = page.locator('#search-input');
    if (!(await si.isVisible())) await page.locator('#tb-search-btn').click();   // no telemóvel a pesquisa abre por um botão
    await si.fill('gmail');
    await expect(page.locator('#global-search-results, .gs-results, [id*="search-res"]').first()).toBeVisible();
    await si.press('Escape');
    await expect(si).not.toBeFocused();
  });

  test('caixas que ativam botões e botões que abrem campos de ficheiro', async ({ page }) => {
    await page.evaluate(() => showRecoveryModal('ABCD-EFGH-JKLM-NPQR-STUV', false));
    await modalSettled(page);
    const done = page.locator('#t2rec-done');
    await expect(done).toBeDisabled();
    await page.locator('#t2rec-ack').check();
    await expect(done).toBeEnabled();
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); openSettings(); switchSettingsTab('dados'); });
    const target = await page.locator('#settings-overlay [data-click]').first().getAttribute('data-click');
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#settings-overlay [data-click]').first().click();
    const fc = await chooser;
    expect(await fc.element().getAttribute('id')).toBe(target);
  });
});
