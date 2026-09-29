import { test, expect, openApp, createVault } from './fixtures.mjs';

// Segurança da Aurora: nada fica para trás ao bloquear, nada de dados em claro no browser, nada de HTML injetado
test.describe('Aurora: segurança', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => {
      vault.push({ id: 'g', name: 'Gmail', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY' });
      personalInfo.push({ id: 'p', name: 'Eu', fields: [{ id: 'f', label: 'NIF', value: '123456789' }] });
      documents.push({ id: 'cc', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) });
      renderAll(); auroraOpen();
    });
  });
  const say = (page, q) => page.evaluate(async q => { AUR.pending = null; aurQuick(q); await new Promise(r => setTimeout(r, 40)); }, q);

  test('ao bloquear, a conversa e tudo o que a Aurora tinha em memória desaparecem', async ({ page }) => {
    await say(page, 'qual o meu nif');
    await say(page, 'renomeia o gmail para Gmail Pessoal'); await page.evaluate(() => aurYes());
    await page.locator('#aurora-input').pressSequentially('pass gm');
    await expect(page.locator('#aurora-sugg .a-sug').first()).toBeVisible();
    expect(await page.locator('#aurora-msgs').innerText()).toContain('123456789');
    const r = await page.evaluate(() => {
      AUR.hist.push('muda a password para segredo');
      lockApp();
      return {
        msgs: document.getElementById('aurora-msgs').innerHTML, sugg: document.getElementById('aurora-sugg').innerHTML,
        undo: AURU.stack.length, hist: AUR.hist.length, acts: AUR.acts.length, idx: AUR_IDX, last: AUR.last, ctx: AURC.ctx, lastQ: AURM.lastQ,
      };
    });
    expect(r).toEqual({ msgs: '', sugg: '', undo: 0, hist: 0, acts: 0, idx: null, last: null, ctx: null, lastQ: '' });
  });

  test('«Lembra-me amanhã»/«Ignorar» ficam dentro do cofre, não no browser (e os antigos são migrados)', async ({ page }) => {
    await page.evaluate(() => { localStorage.setItem('av_aur_snooze', JSON.stringify({ 'ev:doc:Antigo:2026-01-01': Date.now() + 864e5 })); payloadExtras.aurMem = {}; });
    await say(page, 'avisos');
    await page.locator('#aurora-msgs .aurora-msg', { hasText: 'Cartão de Cidadão' }).last().locator('.a-btn', { hasText: 'Ignorar' }).click();
    const r = await page.evaluate(async () => {
      const keys = Object.keys(payloadExtras.aurMem.snooze || {});
      await saveFile({ auto: true });
      const json = pendingVaultText, dec = await decrypt(masterKey, JSON.parse(json).payload);
      return { ls: localStorage.getItem('av_aur_snooze'), keys, plain: json.includes('Cidad'), inside: JSON.stringify(dec).includes('ev:doc:Cart') };
    });
    expect(r.ls).toBeNull();
    expect(r.keys.some(k => k.includes('Antigo'))).toBe(true);
    expect(r.keys.some(k => k.includes('Cartão de Cidadão'))).toBe(true);
    expect(r).toMatchObject({ plain: false, inside: true });
    const before = await page.locator('#aurora-msgs .aurora-msg').count();
    await say(page, 'avisos');
    const after = await page.locator('#aurora-msgs .aurora-msg').evaluateAll((els, n) => els.slice(n).map(e => e.innerText).join('\n'), before);
    expect(after).not.toMatch(/Cartão de Cidadão/);
  });

  test('dados do cofre com HTML não se transformam em código na conversa', async ({ page }) => {
    const bad = '<img src=x onerror="window.__xss=1">';
    await page.evaluate(bad => {
      activityLog.unshift({ action: bad, name: bad, icon: bad, ts: Date.now() });
      bankCards.push({ id: 'b', bank: bad, name: bad, number: '4111111111111111', expiry: bad });
      vault.push({ id: 'x', name: bad, user: bad, pw: 'x', url: bad });
      documents.push({ id: 'd', title: bad, text: bad + ' contrato com rescisao e fidelizacao ate 01/01/2030 no valor de 10,00 EUR. ' + bad.repeat(10), textAt: 1, factsV: 9 });
      renderAll();
    }, bad);
    for (const q of ['o que mudei hoje', 'que cartões tenho', 'que sites tenho guardados', 'resume o contrato', 'tudo sobre o img', 'arruma o meu cofre', 'avisos'])
      await say(page, q);
    const r = await page.evaluate(() => ({ imgs: document.querySelectorAll('#aurora-msgs img').length, xss: !!window.__xss }));
    expect(r).toEqual({ imgs: 0, xss: false });
  });

  test('frases não percebidas: passwords só com letras e símbolos também ficam tapadas', async ({ page }) => {
    const list = await page.evaluate(() => {
      aurMissLog('muda a password do zorglub para Gatinho!', 'test');
      aurMissLog('zorglub pin: 4321 xpto', 'test');
      return (payloadExtras.aurMem.missed || []).map(x => x.q).join(' | ');
    });
    expect(list).not.toMatch(/Gatinho|4321/);
    expect(list).toMatch(/para «…»/);
  });
});
