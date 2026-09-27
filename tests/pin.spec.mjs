import { test, expect, openApp, createVault } from './fixtures.mjs';

test.describe('PIN de desbloqueio rápido', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page, 'rightpass');
    await page.evaluate(async () => { await saveFile({ auto: true }); });
  });

  test('PIN de 6 dígitos abre o cofre sem voltar a derivar a chave mestra', async ({ page }) => {
    const r = await page.evaluate(async () => {
      await savePinUnlock('482915');
      const rec = await idbGet('qu_pin');
      lockApp();
      await refreshQuickUnlock();
      const pinLen = quickAvail.pinLen, maxLen = document.getElementById('pin-input').maxLength;
      const res = await tryPin('482915');
      let derives = 0; const dk = deriveKey; deriveKey = (...a) => { derives++; return dk(...a); };
      await submitOpenVault(res.pw, res.qk);
      deriveKey = dk;
      return { len: rec.len, pinLen, maxLen, hasKey: !!(res.qk && res.qk.k), open: !!masterKey, derives };
    });
    expect(r).toEqual({ len: 6, pinLen: 6, maxLen: 6, hasKey: true, open: true, derives: 0 });
  });

  test('PIN errado conta as tentativas e bloqueia no limite', async ({ page }) => {
    const r = await page.evaluate(async () => {
      await savePinUnlock('482915');
      const all = await Promise.all(Array.from({ length: PIN_MAX_TRIES + 1 }, (_, i) => tryPin('00000' + i)));
      return { blocked: all.filter(x => x.blocked).length, gone: all.filter(x => x.gone).length, rec: await idbGet('qu_pin') };
    });
    expect(r.blocked).toBe(1);
    expect(r.gone).toBe(1);
    expect(r.rec).toBeUndefined();
  });

  test('PIN antigo de 4 dígitos continua a funcionar e pede um novo de 6', async ({ page }) => {
    await page.evaluate(async () => {
      const s = crypto.getRandomValues(new Uint8Array(16));
      const w = await wrapSecret(await pinKeyFrom('4821', s), 'rightpass');
      await idbSet('qu_pin', { salt: bytesToArr(s), iv: w.iv, wrapped: w.wrapped, expiresAt: null, tries: 0 });
      lockApp();
      await refreshQuickUnlock();
      setUnlockMode('pin');
      document.getElementById('pin-input').value = '4821';
      await onPinInput();
    });
    await expect(page.locator('#pinsetup-overlay')).toHaveClass(/open/, { timeout: 15_000 });
    await expect(page.locator('#pinsetup-intro')).toContainText('6 dígitos');
    const r = await page.evaluate(async () => {
      const rec = await idbGet('qu_pin');
      const txt = await unwrapSecret(await pinKeyFrom('4821', arrToBytes(rec.salt)), rec);
      document.getElementById('ps-pin1').value = document.getElementById('ps-pin2').value = '1234';
      await confirmPinSetup();
      const short = document.getElementById('ps-err').textContent;
      document.getElementById('ps-pin1').value = document.getElementById('ps-pin2').value = '730461';
      await confirmPinSetup();
      return { open: !!masterKey, refreshed: txt.startsWith('AVQ2:'), short, len: (await idbGet('qu_pin')).len };
    });
    expect(r).toEqual({ open: true, refreshed: true, short: 'O PIN tem de ter 6 dígitos.', len: 6 });
  });

  test('PINs fáceis de adivinhar são detetados', async ({ page }) => {
    const r = await page.evaluate(() => ['123456', '111111', '121212', '654321', '250390', '482915', '730461'].map(weakPin));
    expect(r).toEqual([true, true, true, true, true, false, false]);
  });

  test('PIN do cofre 2FA: 6 dígitos, e o antigo de 4 pede atualização', async ({ page }) => {
    const r = await page.evaluate(async () => {
      await setup2faVault('482915');
      const len6 = (await idbGet('t2_pin')).len;
      lock2faVault();
      const ok6 = (await open2faWithPin('482915')).ok;
      await set2faPin('4821', session2faRaw);
      const rec = await idbGet('t2_pin'); delete rec.len; await idbSet('t2_pin', rec);
      lock2faVault();
      await render2faUnlockPanel(true);
      const legacyLen = t2PinLen;
      document.getElementById('t2-pin-input').value = '4821';
      await on2faPinInput();
      return { len6, ok6, legacyLen, open: totpUnlocked };
    });
    expect(r).toEqual({ len6: 6, ok6: true, legacyLen: 4, open: true });
    await expect(page.locator('#t2setup-overlay')).toHaveClass(/open/);
    await expect(page.locator('#t2setup-intro')).toContainText('6 dígitos');
  });
});
