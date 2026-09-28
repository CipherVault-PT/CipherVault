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

  test('primeira vez: palavra-passe à vista e «Criar cofre» só pede a confirmação', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#start-pw')).toBeVisible();
    await page.locator('[data-act="lockStartNew"]').click();              // sem palavra-passe: avisa e não avança
    await expect(page.locator('#lock-error')).not.toBeEmpty();
    await expect(page.locator('#login-state-new')).toBeHidden();
    await page.locator('#start-pw').fill('Cofre-Novo-2031');
    await page.locator('[data-act="lockStartNew"]').click();
    await expect(page.locator('#new-pw1')).toHaveValue('Cofre-Novo-2031');
    await expect(page.locator('#new-pw2')).toBeFocused();
    await page.locator('#new-pw2').fill('Cofre-Novo-2031');
    await expect(page.locator('#new-pw-match')).toContainText('✓');
    await page.locator('#new-pw2').press('Enter');
    await page.waitForFunction(() => !!masterKey);
    await expect(page.locator('#app')).toBeVisible();
  });

  test('«Carregar cofre» usa a palavra-passe escrita no início e rejeita a errada', async ({ page }) => {
    await openApp(page);
    const file = await page.evaluate(async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey('certa-123', salt, KDF_ITER);
      return JSON.stringify(mkContainer({ salt, iter: KDF_ITER }, await encrypt(key, { fmt: 2, vault: [{ id: 'a', name: 'Banco', pw: 'x', cat: 'banco' }], totp: [] })));
    });
    await page.locator('#start-pw').fill('errada-000');
    await page.locator('[data-act="lockStartOpen"]').click();
    // (no Chrome o botão abre o seletor nativo de ficheiros; aqui usa-se o campo de ficheiro, o mesmo dos outros browsers)
    await page.locator('#file-input').setInputFiles({ name: 'meu.vault', mimeType: 'application/octet-stream', buffer: Buffer.from(file) });
    await expect(page.locator('#open-step-pw')).toBeVisible();
    await expect(page.locator('#lock-error')).not.toBeEmpty();           // tentou logo com a palavra-passe escrita
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
    await page.locator('[data-act="lockStartOpen"]').first().click();
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

// Cofre memorizado neste dispositivo (browsers sem acesso direto a ficheiros, como o Chrome no Android)
test.describe('Ecrã de entrada com cofre memorizado', () => {
  const remembered = async (page, extra = '') => {
    await page.addInitScript(() => { delete window.showOpenFilePicker; });
    await openApp(page);
    await page.evaluate(new Function(`return (async () => { startNewVault(); document.getElementById('new-pw1').value = document.getElementById('new-pw2').value = 'rightpass';
      await submitNewVault(); await saveFile({ auto: true }); ${extra} })()`));
    await page.reload();
    await page.waitForFunction(() => typeof lockSwipeNeed !== 'undefined' && lockOnPwStep());
  };
  const swipeUp = async page => {
    const b = await page.locator('#lk-swipe').boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(x, y - i * 20);
    await page.mouse.up();
  };

  test('mostra «desliza para cima»; deslizar mostra o PIN e o PIN abre o cofre', async ({ page }) => {
    await remembered(page, `await savePinUnlock('482915');`);
    await expect(page.locator('#lk-swipe')).toBeVisible();
    await expect(page.locator('#pin-input')).toBeHidden();
    await expect(page.locator('#l-enter-btn')).toBeHidden();
    await swipeUp(page);
    await expect(page.locator('#lk-swipe')).toBeHidden();
    await expect(page.locator('#pin-input')).toBeFocused();
    await page.locator('#pin-input').pressSequentially('482915');
    await page.waitForFunction(() => !!masterKey);
  });

  test('sem PIN nem impressão digital: depois de deslizar pede a palavra-passe mestra', async ({ page }) => {
    await remembered(page);
    await expect(page.locator('#master-pw')).toBeHidden();
    await page.locator('#lk-swipe').focus();
    await page.keyboard.press('Enter');                                    // também dá pelo teclado
    await expect(page.locator('#master-pw')).toBeFocused();
    await page.locator('#master-pw').fill('rightpass');
    await page.locator('#master-pw').press('Enter');
    await page.waitForFunction(() => !!masterKey);
  });

  test('com impressão digital: só a pede depois de deslizar; ao bloquear volta a pedir para deslizar', async ({ page }) => {
    await remembered(page, `await savePinUnlock('482915');`);
    await page.evaluate(async () => {
      window.__bio = 0; bioSupported = async () => true; doBioUnlock = () => { window.__bio++; };
      await idbSet('qu_bio', { credId: new Uint8Array(8), salt: new Uint8Array(16), iv: new Uint8Array(12), wrapped: new Uint8Array(32) });
      await refreshQuickUnlock(true);
    });
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__bio)).toBe(0);               // não pede sozinha ao abrir
    await expect(page.locator('#bio-btn')).toBeHidden();
    await swipeUp(page);
    await expect.poll(() => page.evaluate(() => window.__bio)).toBe(1);
    await page.evaluate(async () => { await submitOpenVault('rightpass'); });
    await page.waitForFunction(() => !!masterKey);
    await page.evaluate(() => lockApp());
    await expect(page.locator('#lk-swipe')).toBeVisible();
  });
});
