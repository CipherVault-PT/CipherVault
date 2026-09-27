import { test, expect, openApp } from './fixtures.mjs';

// Ecrã de entrada usado como uma pessoa usa: cliques e teclado (sem chamar funções por dentro)
test.describe('Ecrã de entrada', () => {
  test('não tem código dentro do HTML (onclick, oninput…)', async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => refreshQuickUnlock());
    const inline = await page.evaluate(() => [...document.querySelectorAll('#lock-screen *')]
      .flatMap(el => [...el.attributes].filter(a => /^on/i.test(a.name)).map(a => (el.id || el.tagName) + ' ' + a.name)));
    expect(inline).toEqual([]);
  });

  test('criar um cofre novo com cliques e Enter', async ({ page }) => {
    await openApp(page);
    await page.locator('[data-act="startNewVault"]').first().click();
    await page.locator('#new-name').fill('Carlos');
    await page.locator('#new-name').press('Enter');
    await expect(page.locator('#new-pw1')).toBeFocused();
    await page.locator('#new-pw1').fill('Cofre-Novo-2031');
    await page.locator('#new-pw1').press('Enter');
    await expect(page.locator('#new-pw2')).toBeFocused();
    await page.locator('#new-pw2').fill('Cofre-Novo-2031');
    await expect(page.locator('#new-pw-match')).toContainText('✓');
    await page.locator('#new-pw2').press('Enter');
    await page.waitForFunction(() => !!masterKey);
    await expect(page.locator('#app')).toBeVisible();
  });

  test('abrir um cofre escolhido no disco e rejeitar a palavra-passe errada', async ({ page }) => {
    await openApp(page);
    const file = await page.evaluate(async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey('certa-123', salt, KDF_ITER);
      return JSON.stringify(mkContainer({ salt, iter: KDF_ITER }, await encrypt(key, { fmt: 2, vault: [{ id: 'a', name: 'Banco', pw: 'x', cat: 'banco' }], totp: [] })));
    });
    await page.locator('[data-act="startOpenVault"]').first().click();
    // (no Chrome o botão abre o seletor nativo de ficheiros; aqui usa-se o campo de ficheiro, o mesmo dos outros browsers)
    await page.locator('#file-input').setInputFiles({ name: 'meu.vault', mimeType: 'application/octet-stream', buffer: Buffer.from(file) });
    await expect(page.locator('#open-step-pw')).toBeVisible();
    await page.locator('#master-pw').fill('errada-000');
    await page.locator('#master-pw').press('Enter');
    await expect(page.locator('#lock-error')).not.toBeEmpty();
    expect(await page.evaluate(() => masterKey)).toBeNull();
    await page.locator('#master-pw').fill('certa-123');
    await page.locator('#master-pw').press('Enter');
    await page.waitForFunction(() => !!masterKey && vault.length === 1);
  });

  test('idioma, janelas de informação e o olho da palavra-passe', async ({ page }) => {
    await openApp(page);
    await page.locator('[data-act="setLang"][data-arg="en"]').first().click();
    expect(await page.evaluate(() => currentLang)).toBe('en');
    await page.locator('[data-act="setLang"][data-arg="pt"]').first().click();
    await page.locator('[data-act="openLoginModal"][data-arg="seg"]').first().click();
    await expect(page.locator('#lmodal-seg')).toHaveClass(/open/);
    await page.locator('#lmodal-seg').click({ position: { x: 5, y: 5 } }); // fundo escuro fecha
    await expect(page.locator('#lmodal-seg')).not.toHaveClass(/open/);
    await page.locator('[data-act="startOpenVault"]').first().click();
    await page.evaluate(() => { pendingVaultText = '{}'; document.getElementById('open-step-file').style.display = 'none'; document.getElementById('open-step-pw').style.display = 'block'; setUnlockMode('master'); });
    const eye = page.locator('[data-act="lockToggleEye"][data-arg="master-pw"]');
    await eye.click();
    await expect(page.locator('#master-pw')).toHaveAttribute('type', 'text');
    await eye.click();
    await expect(page.locator('#master-pw')).toHaveAttribute('type', 'password');
  });

  test('PIN escrito no teclado abre o cofre', async ({ page }) => {
    await openApp(page);
    await page.evaluate(async () => {
      startNewVault(); document.getElementById('new-pw1').value = document.getElementById('new-pw2').value = 'rightpass';
      await submitNewVault(); await saveFile({ auto: true }); await savePinUnlock('482915'); lockApp();
      // como depois de escolher o ficheiro do cofre: passo da palavra-passe/PIN visível
      const vaultText = pendingVaultText; startOpenVault(); pendingVaultText = vaultText; document.getElementById('open-step-file').style.display = 'none'; document.getElementById('open-step-pw').style.display = 'block';
      await refreshQuickUnlock(); setUnlockMode('pin');
    });
    await expect(page.locator('#pin-input')).toBeVisible();
    await page.locator('#pin-input').pressSequentially('482915');
    await page.waitForFunction(() => !!masterKey);
  });
});
