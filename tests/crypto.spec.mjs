import { test, expect, openApp, createVault, legacyVaultText, openVaultText } from './fixtures.mjs';

const DATA = { fmt: 2, vault: [{ id: 'a', name: 'Gmail', user: 'eu@exemplo.pt', pw: 'S3gura!', cat: 'email' }], totp: [] };

test.describe('Encriptação da chave mestra', () => {
  test('cofre antigo (200 000 iterações) abre, passa para 600 000 e volta a abrir', async ({ page }) => {
    await openApp(page);
    const legacy = await legacyVaultText(page, 'rightpass', DATA);
    await openVaultText(page, legacy, 'rightpass');
    expect(await page.evaluate(() => [!!masterKey, vault.length, curIter()])).toEqual([true, 1, 200000]);

    await page.waitForFunction(() => curIter() === 600000, null, { timeout: 15_000 });
    const saved = await page.evaluate(async () => {
      await saveFile({ auto: true });
      return JSON.parse((await localVaultGet()).json);
    });
    expect(saved.iter).toBe(600000);
    expect(saved.payload.v).toBe(3);
    expect(saved.salt).not.toEqual(JSON.parse(legacy).salt);

    await page.evaluate(() => lockApp());
    await openVaultText(page, JSON.stringify(saved), 'rightpass');
    expect(await page.evaluate(() => [!!masterKey, vault[0].name, curIter()])).toEqual([true, 'Gmail', 600000]);
  });

  test('cofre novo já nasce com 600 000 iterações', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    const c = await page.evaluate(async () => { await saveFile({ auto: true }); return JSON.parse(pendingVaultText); });
    expect(c.iter).toBe(600000);
  });

  test('palavra-passe errada é recusada e não deixa nenhuma chave definida', async ({ page }) => {
    await openApp(page);
    const legacy = await legacyVaultText(page, 'rightpass', DATA);
    await openVaultText(page, legacy, 'wrongpass');
    expect(await page.evaluate(() => [masterKey, masterPwRaw, vault.length])).toEqual([null, '', 0]);
  });

  test('exportação seletiva, sincronização e cópias antigas continuam compatíveis', async ({ page }) => {
    await openApp(page);
    const legacy = await legacyVaultText(page, 'rightpass', DATA);
    await openVaultText(page, legacy, 'rightpass');
    const r = await page.evaluate(async legacy => {
      exportSelection = new Set(['a']);
      document.getElementById('export-pw').value = 'partilha1';
      let out = null; const dv = downloadVault; downloadVault = c => { out = c; };
      await doSelectiveExport(); downloadVault = dv;
      await pushSnapshot(JSON.parse(legacy));
      const snaps = await getSnapshots();
      vault = [];
      await restoreSnapshot(snaps.findIndex(s => !s.container.iter));
      return {
        exportIter: out.iter,
        exportOpens: (await syncDecrypt(JSON.stringify(out), 'partilha1')).vault.length,
        legacySync: (await syncDecrypt(legacy, 'rightpass')).vault.length,
        restored: vault.length,
      };
    }, legacy);
    expect(r).toEqual({ exportIter: 600000, exportOpens: 1, legacySync: 1, restored: 1 });
  });

  test('mudar a palavra-passe mestra grava já com a nova', async ({ page }) => {
    await openApp(page);
    await createVault(page, 'abcd1234');
    const ok = await page.evaluate(async () => {
      openChangePwModal();
      document.getElementById('cp-current').value = 'abcd1234';
      document.getElementById('cp-new').value = 'zzzz9999';
      document.getElementById('cp-confirm').value = 'zzzz9999';
      downloadVault = () => {};
      await changeMasterPw();
      await new Promise(r => setTimeout(r, 300));
      const c = JSON.parse((await localVaultGet()).json);
      const data = await syncDecrypt(JSON.stringify(c), 'zzzz9999');
      return c.iter === 600000 && Array.isArray(data.vault);
    });
    expect(ok).toBe(true);
  });
});
