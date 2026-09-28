import { test, expect, openApp, createVault, legacyVaultText, openVaultText } from './fixtures.mjs';

// Bugs já corrigidos: cada teste garante que não voltam.
test.describe('Regressões', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('bloquear limpa tudo e um cofre novo não herda nada do anterior', async ({ page }) => {
    const legacy = await legacyVaultText(page, 'rightpass', {
      fmt: 2, vault: [{ id: 'a', name: 'Gmail', pw: 'x', cat: 'email' }], personalInfo: [{ id: 'p', name: 'Eu', fields: [] }],
      subscriptions: [{ id: 's', name: 'Netflix', amount: 10, cycle: 'monthly', renewDay: '5' }], storeCards: [{ id: 'sc', name: 'Lidl', number: '1' }],
      assets: [{ id: 'as', kind: 'dates', name: 'Aniversário', date: '2020-01-01', yearly: true }], vaultName: 'Carlos', totp: [],
    });
    await openVaultText(page, legacy, 'rightpass');
    const r = await page.evaluate(async () => {
      const opened = vault.length === 1 && personalInfo.length === 1 && vaultName === 'Carlos' && Object.keys(payloadExtras).length === 0;
      lockApp();
      const cleared = !masterKey && !personalInfo.length && !subscriptions.length && !storeCards.length && !assets.length && vaultName === '';
      return { opened, cleared };
    });
    expect(r).toEqual({ opened: true, cleared: true });
    await createVault(page, 'newvault99');
    expect(await page.evaluate(() => vault.length + personalInfo.length + (vaultFileHandle === null ? 0 : 1))).toBe(0);
  });

  test('palavra-passe errada + Ctrl+S no ecrã de entrada não grava um cofre vazio', async ({ page }) => {
    const legacy = await legacyVaultText(page, 'rightpass', { fmt: 2, vault: [{ id: 'a', name: 'X', pw: 'x', cat: 'email' }], totp: [] });
    await openVaultText(page, legacy, 'wrongpass');
    const r = await page.evaluate(async () => { await saveFile({ auto: true }); return { key: masterKey, local: await localVaultGet() }; });
    expect(r.key).toBeNull();
    expect(r.local).toBeFalsy();
  });

  test('gravações em simultâneo não perdem alterações feitas a meio', async ({ page }) => {
    // cofre guardado na app (como no telemóvel): aí a gravação automática marca mesmo o cofre como gravado
    await page.addInitScript(() => { delete window.showOpenFilePicker; });
    await openApp(page);
    await createVault(page);
    const r = await page.evaluate(async () => {
      const all = await Promise.all([saveFile({ auto: true }), saveFile({ auto: true }), saveFile({ auto: true })]);
      const clean = !hasUnsaved;
      // alteração feita enquanto a gravação está a encriptar: tem de ficar por gravar
      const enc = encrypt; let once = true;
      encrypt = async (...a) => { if (once) { once = false; markUnsaved(); } return enc(...a); };
      markUnsaved(); await saveFile({ auto: true }); encrypt = enc;
      return { n: all.length, clean, kept: hasUnsaved, local: !!JSON.parse((await localVaultGet()).json).payload };
    });
    expect(r).toEqual({ n: 3, clean: true, kept: true, local: true });
  });

  test('entradas: editar, validar nome, histórico e textos certos', async ({ page }) => {
    await createVault(page);
    const r = await page.evaluate(() => {
      let lastToast = ''; const ot = toast; toast = m => { lastToast = m; ot(m); };
      openModal(); document.getElementById('f-name').value = 'Site'; document.getElementById('f-pw').value = ''; saveEntry();
      const e1 = vault[vault.length - 1];
      openModal(e1.id); document.getElementById('f-pw').value = 'NewPass1!'; saveEntry();
      const editToast = lastToast === t('toastUpdated');
      const noEmptyHistory = (vault.find(v => v.id === e1.id).pwHistory || []).every(Boolean);
      let alerted = ''; const oa = window.alert; window.alert = m => { alerted = m; };
      openModal(); document.getElementById('f-name').value = ''; saveEntry(); window.alert = oa; closeModal();
      return { editToast, noEmptyHistory, nameMsg: alerted === t('nameRequired'), cardSave: t('cardSave') !== 'cardSave' };
    });
    expect(r).toEqual({ editToast: true, noEmptyHistory: true, nameMsg: true, cardSave: true });
  });

  test('textos com apóstrofos e aspas não partem botões (copiar, tags, códigos de recuperação)', async ({ page }) => {
    await createVault(page);
    const r = await page.evaluate(async () => {
      totp.push({ id: 't8', name: 'Banco', account: '', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', algorithm: 'SHA256', digits: 8, period: 60, counter: null, recovery: "A1\nB'2\"x" });
      openTotpModal('t8'); await new Promise(r => setTimeout(r, 20)); saveTotp();
      const t8 = totp.find(x => x.id === 't8');
      switchTab('totp'); renderTotp(); await new Promise(r => setTimeout(r, 50));
      let copied = null; const oc = copyText; copyText = x => { copied = x; };
      document.querySelector('#totp-grid .totp-recovery .card-btn').click();
      copyText = oc;
      vault.push({ id: 'tg', name: 'T', cat: 'email', tags: ["it's"], pw: 'x' }); renderSidebar();
      [...document.querySelectorAll('#sidebar-tags .cat-item')].find(el => el.textContent.includes("it's")).click();
      return { params: t8.digits === 8 && t8.algorithm === 'SHA256' && t8.period === 60, copied, tag: currentTag };
    });
    expect(r).toEqual({ params: true, copied: "A1\nB'2\"x", tag: "it's" });
  });

  test('segurança: links, anexos HTML, histórico de passwords e nomes com HTML', async ({ page }) => {
    await createVault(page);
    const r = await page.evaluate(() => {
      const hrefs = [siteHref('gmail.com'), siteHref('javascript:alert(1)'), siteHref('HTTP://X.com')];
      let opened = null; const wo = window.open; window.open = (...a) => { opened = a; return null; };
      goToSiteEntry('example.com', '');
      let dl = null; const odb = downloadBlob; downloadBlob = (b, n) => { dl = b.type; };
      let openedAtt = false; window.open = () => { openedAtt = true; return null; };
      openAttachData({ name: 'x.html', type: 'text/html', data: 'data:text/html;base64,' + btoa('<script>alert(1)</script>') });
      window.open = wo; downloadBlob = odb;
      vault.push({ id: 'hh', name: '<img src=x onerror=window.__xss=1>', cat: 'email', pw: 'cur', pwHistory: ['OldSecret#1'] });
      subscriptions.push({ id: 's', name: '<img src=x onerror=window.__xss=1>', amount: 1, cycle: 'monthly', renewDay: String(new Date().getDate()) });
      switchTab('vault'); renderCards(); avFlushChunks(); renderDashboard();
      return {
        hrefs, noopener: /noopener/.test(opened[2] || ''),
        attachDownloaded: !openedAtt && dl === 'application/octet-stream',
        historyHidden: !document.getElementById('cards-grid').innerHTML.includes('OldSecret#1'),
      };
    });
    expect(r.hrefs[0]).toBe('https://gmail.com');
    expect(r.hrefs[1]).not.toMatch(/^javascript:/i);
    expect(r.hrefs[2]).toMatch(/^http:\/\/x\.com/i);
    expect(r.noopener).toBe(true);
    expect(r.attachDownloaded).toBe(true);
    expect(r.historyHidden).toBe(true);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test('importação CSV: aspas, vírgulas, várias linhas e colunas de outros gestores', async ({ page }) => {
    const r = await page.evaluate(() => {
      const rows = parseCSV('"url","username","password","httpRealm"\r\n"https://a.com","bob","p,w""1",""\r\n');
      const cc = csvColumns(rows[0]);
      const rows2 = parseCSV('name,url,username,password,note\nX,https://x,u,pw,"line1\nline2"\n');
      return { pw: rows[1][cc.c.pw], user: rows[1][cc.c.user], url: rows[1][cc.c.url], note: rows2[1][4], n: rows2.length };
    });
    expect(r).toEqual({ pw: 'p,w"1', user: 'bob', url: 'https://a.com', note: 'line1\nline2', n: 2 });
  });

  test('veículo: editar não apaga os abastecimentos', async ({ page }) => {
    await createVault(page);
    const n = await page.evaluate(() => {
      assets.push({ id: 'a1', kind: 'vehicle', name: 'Golf', insurance: '2030-01-01', fuel: [] });
      openFuelModal('a1');
      document.getElementById('fuel-liters').value = '40'; document.getElementById('fuel-euros').value = '60'; document.getElementById('fuel-km').value = '1000';
      addFuel(); closeFuelModal();
      openAssetModal('vehicle', 'a1'); saveAsset();
      return assets[0].fuel.length;
    });
    expect(n).toBe(1);
  });

  test('aleatoriedade sem viés e base de dados local', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const cnt = new Array(70).fill(0); for (let i = 0; i < 70000; i++) cnt[randIndex(70)]++;
      await idbSet('zz', { a: 1 }); const g = await idbGet('zz'); await idbDel('zz');
      return { spread: Math.min(...cnt) > 800 && Math.max(...cnt) < 1200, idb: g.a === 1 && (await idbGet('zz')) === undefined };
    });
    expect(r).toEqual({ spread: true, idb: true });
  });

  test('arrastar um ficheiro para o ecrã de entrada prepara-o para abrir', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const f = new File(['{}'], 'meu.vault');
      const dt = new DataTransfer(); dt.items.add(f);
      document.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 100));
      return { kept: pendingVaultFile === f, step: document.getElementById('open-step-pw').style.display };
    });
    expect(r).toEqual({ kept: true, step: 'block' });
  });
});

test('nenhum ecrã mostra código por engano (${…}) e os textos de ajuda mudam de idioma', async ({ page }) => {
  await openApp(page);
  await createVault(page);
  await page.evaluate(() => {
    documents.push({ id: 'dx', title: 'Sem ficheiro', cat: 'pessoal' }); vault.push({ id: 'ax', name: 'A', cat: 'email', pw: 'x' });
    totp.push({ id: 'tx', name: 'G', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1' }); renderAll();
  });
  for (const lang of ['pt', 'en']) {
    const leaks = await page.evaluate(async lang => {
      setLang(lang); const out = [];
      const tabs = [...new Set([...document.querySelectorAll('[data-act="switchTab"]')].map(b => b.dataset.arg).filter(Boolean))];
      for (const t of tabs) { switchTab(t); await new Promise(r => setTimeout(r, 80)); if (document.body.innerText.includes('${')) out.push(t); }
      return out;
    }, lang);
    expect(leaks, lang).toEqual([]);
  }
  const attrs = await page.evaluate(() => ({
    search: document.getElementById('search-input').placeholder, lock: document.querySelector('.tb-lock-btn').getAttribute('aria-label'),
    close: document.querySelector('.docview-close').title, cancel: document.querySelector('#card-overlay .btn-ghost[data-act="closeCardModal"]').textContent.trim(),
  }));
  expect(attrs).toEqual({ search: 'Search everything...', lock: 'Lock', close: 'Close', cancel: 'Cancel' });
});
