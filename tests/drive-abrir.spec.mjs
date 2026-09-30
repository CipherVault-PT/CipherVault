import { test, expect, openApp, createVault } from './fixtures.mjs';

// Com o Drive ligado, desbloquear usa a cópia encriptada interna: o Chrome no Android não volta a perguntar pelo ficheiro
test.describe('Abrir pela cópia sincronizada com o Drive', () => {
  const setup = async (page, handleName, driveOff = false) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(async ([handleName, driveOff]) => {
      window.__asked = 0;
      const fake = name => ({ name, kind: 'file', queryPermission: async () => 'prompt', requestPermission: async () => { window.__asked++; return 'denied'; },
        getFile: async () => { throw new Error('sem autorização'); } });
      dCfg('on', '1'); dCfg('cid', 'teste.apps.googleusercontent.com');
      driveCheckOnOpen = async () => false; driveAfterSave = async () => {};
      vaultFileHandle = fake('ciphervault.vault');
      vault.push({ id: 'g', name: 'Gmail', user: 'eu', pw: 'x' }); markUnsaved();
      await saveFile({ auto: true });
      const orig = idbGet, h = fake(handleName);
      idbGet = k => k === 'vaultHandle' ? Promise.resolve(h) : orig(k);
      if (driveOff) dCfg('on', null);
      lockApp(); pendingVaultFile = null; pendingVaultText = null;
      await lockDirectInit();
    }, [handleName, driveOff]);
  };

  test('desbloqueia sem pedir autorização do ficheiro', async ({ page }) => {
    await setup(page, 'ciphervault.vault');
    await expect(page.locator('#l-file-name')).toContainText('sincronizado com o Drive');
    await page.evaluate(async () => { document.getElementById('master-pw').value = 'test-pass-1'; await submitOpenVault(); });
    await page.waitForFunction(() => !!masterKey);
    expect(await page.evaluate(() => ({ asked: window.__asked, gmail: vault.some(v => v.name === 'Gmail') }))).toEqual({ asked: 0, gmail: true });
  });

  test('outro ficheiro de cofre: não usa a cópia (volta a pedir o ficheiro)', async ({ page }) => {
    await setup(page, 'outro-cofre.vault');
    expect(await page.evaluate(() => pendingVaultText)).toBeNull();
    await expect(page.locator('#l-file-name')).not.toContainText('sincronizado');
  });

  test('Drive desligado: continua a abrir pelo ficheiro, como antes', async ({ page }) => {
    await setup(page, 'ciphervault.vault', true);
    expect(await page.evaluate(() => pendingVaultText)).toBeNull();
  });
});
