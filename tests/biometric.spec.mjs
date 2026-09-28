import { test, expect, openApp, createVault } from './fixtures.mjs';

// Autenticador virtual do Chromium com a extensão PRF (a mesma que a impressão digital usa para encriptar)
test('biometria desbloqueia de imediato com a chave guardada', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'autenticador virtual só existe no Chromium');
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true },
  });
  await openApp(page);
  await createVault(page, 'biopass1');
  const r = await page.evaluate(async () => {
    await saveFile({ auto: true });
    const saved = await saveBioUnlock();
    lockApp();
    const b = await tryBio();
    let derives = 0; const dk = deriveKey; deriveKey = (...a) => { derives++; return dk(...a); };
    await submitOpenVault(b.pw, b.qk);
    deriveKey = dk;
    return { saved: saved.ok, pw: b.pw, open: !!masterKey, derives };
  });
  expect(r).toEqual({ saved: true, pw: 'biopass1', open: true, derives: 0 });
});

// Cofre memorizado + impressão digital configurada: sem botão; deslizar para cima pede logo a impressão digital e entra
for (const ok of [true, false]) {
  test(`deslizar para cima pede logo a impressão digital (${ok ? 'aceite → entra' : 'recusada → volta o «desliza» com «Usar PIN»'})`, async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'autenticador virtual só existe no Chromium');
    await page.addInitScript(() => { delete window.showOpenFilePicker; });
    const cdp = await context.newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
      options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true },
    });
    await openApp(page);
    await createVault(page, 'biopass1');
    await page.evaluate(async () => { await saveFile({ auto: true }); await savePinUnlock('482915'); const r = await saveBioUnlock(); if (!r.ok) throw new Error('bio'); });
    await page.reload();
    await page.waitForFunction(() => typeof lockSwipeNeed !== 'undefined' && lockOnPwStep() && unlockMode === 'bio');
    await expect(page.locator('#lk-swipe')).toBeVisible();
    await expect(page.locator('#bio-btn')).toBeHidden();
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => !!masterKey)).toBe(false);          // não pede nem entra sozinha
    if (!ok) await cdp.send('WebAuthn.setUserVerified', { authenticatorId, isUserVerified: false });
    const b = await page.locator('#lk-swipe').boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(x, y - i * 20);
    await page.mouse.up();
    if (ok) {
      await page.waitForFunction(() => !!masterKey && vault !== undefined);
      await expect(page.locator('#bio-btn')).toBeHidden();
    } else {
      await expect(page.locator('#lk-swipe')).toBeVisible();
      await expect(page.locator('#lk-swipe-txt')).toContainText(/outra vez|again/);
      await expect(page.locator('#bio-btn')).toBeHidden();
      await page.locator('#unlock-links [data-act="setUnlockMode"][data-arg="pin"]').click();
      await page.locator('#pin-input').pressSequentially('482915');
      await page.waitForFunction(() => !!masterKey);
    }
  });
}
