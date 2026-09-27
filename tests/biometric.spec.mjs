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
