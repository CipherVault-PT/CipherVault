import { test, expect, openApp, createVault } from './fixtures.mjs';

// Passa por todos os separadores, janelas e modos sem erros (em computador e telemóvel)
test('percorrer a app inteira sem erros', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => { enterPresentationMode(); await new Promise(r => setTimeout(r, 300)); renderAll(); lockApp(); });
  await createVault(page, 'abcd1234');
  const failed = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms)); const bad = [];
    const step = async (n, f) => { try { await f(); } catch (e) { bad.push(n + ': ' + e.message); } await sleep(40); };
    vault.push({ id: 'x1', name: 'Gmail', user: "o'k", pw: '123456', cat: 'email', url: 'gmail.com', tags: ['a'], fields: [{ k: 'k', v: 'v' }], pwHistory: ['old1'] });
    bankCards.push({ id: 'b1', bank: 'CGD', expiry: '01/20', number: '4111 1111 1111 1111', pin: '1234' });
    documents.push({ id: 'd1', title: 'CC', expiry: '2020-01-01', date: '2019-01-01', cat: 'pessoal' });
    subscriptions.push({ id: 's1', name: 'Net', amount: 9.99, cycle: 'monthly', renewDay: '3' });
    storeCards.push({ id: 'sc1', name: 'Lidl', number: '12345', color: '#c9a84c' });
    assets.push({ id: 'a1', kind: 'vehicle', name: 'Golf', insurance: '2030-01-01', fuel: [] });
    wifiNets.push({ id: 'w1', name: 'Casa', ssid: 'Casa5G', pw: 'x', sec: 'WPA' });
    markUnsaved();
    for (const tab of ['dashboard', 'vault', 'totp', 'cards', 'store', 'docs', 'notes', 'info', 'warranty', 'license', 'vehicle', 'dates', 'archive', 'trash']) await step('tab ' + tab, () => switchTab(tab));
    await step('definições', () => { openSettings(); ['aspeto', 'seguranca', 'dados', 'heranca', 'sobre'].forEach(switchSettingsTab); closeSettings(); });
    await step('calendário', () => { openCalendar(); calShiftMonth(1); calShiftMonth(-1); closeCalendar(); });
    await step('auditoria', () => { openHealthCheck(); closeHealthCheck(); });
    await step('leitura', () => { openReadMode('x1'); closeReadMode(); });
    await step('gerador', () => { openPwGen(); setPwGenMode('memorable'); setPwGenMode('random'); closePwGen(); });
    await step('pesquisa', () => { const si = document.getElementById('search-input'); si.value = 'gma'; onSearchInput(); closeGlobalSearch(); });
    await step('idioma', () => { setLang('en'); renderAll(); setLang('pt'); });
    await step('tema', () => { toggleTheme(); applyThemePreset('oled'); toggleTheme(); });
    await step('fundos', async () => { for (const m of BG_STYLES) { setBackground(m); await sleep(40); } setBackground('net'); });
    await step('exportar', () => { openSelectiveExport(); exportSelectAll(true); closeSelectiveExport(); });
    await step('wifi', () => { openWifiNetQR('w1'); closeQrModal(); });
    await step('código de barras', () => { showBarcode('sc1'); closeBarcode(); });
    await step('aurora', async () => { auroraOpen(); await sleep(100); auroraClose && auroraClose(); });
    await step('gravar', () => saveFile({ auto: true }));
    return bad;
  });
  expect(failed).toEqual([]);
});
