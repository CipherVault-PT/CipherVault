import { test, expect, openApp, createVault } from './fixtures.mjs';

const toLock = page => page.evaluate(async () => {
  await saveFile({ auto: true }); lockApp();
  const text = pendingVaultText; startOpenVault(); pendingVaultText = text;
});
const enter = (page, pw) => page.evaluate(async pw => { document.getElementById('master-pw').value = pw; await submitOpenVault(); }, pw);

test.describe('Aviso de tentativas falhadas', () => {
  test.beforeEach(async ({ page }) => { await openApp(page); await createVault(page); });

  test('tentativas de outra altura aparecem ao entrar (e depois desaparecem)', async ({ page }) => {
    await toLock(page);
    await page.evaluate(() => {
      const y = Date.now() - 864e5;
      localStorage.setItem('av_fails', JSON.stringify([{ t: y - 60e3, k: 'pw' }, { t: y, k: 'pin' }]));
    });
    await enter(page, 'test-pass-1');
    await expect(page.locator('#av-nudge')).toContainText('2 tentativas erradas', { timeout: 8000 });
    await expect(page.locator('#av-nudge')).toContainText('ontem às');
    expect(await page.evaluate(() => localStorage.getItem('av_fails'))).toBeNull();
  });

  test('os meus enganos de agora mesmo não contam', async ({ page }) => {
    await toLock(page);
    await enter(page, 'errada-123');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('av_fails')).length)).toBe(1);
    await enter(page, 'test-pass-1');
    await page.waitForFunction(() => !!masterKey);
    await page.waitForTimeout(3000);
    await expect(page.locator('#av-nudge', { hasText: 'tentativa' })).toHaveCount(0);
  });
});

test.describe('Verificação da cópia no Drive', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page); await createVault(page);
    await page.evaluate(async () => {
      dCfg('on', '1'); dCfg('cid', 'teste.apps.googleusercontent.com'); dCfg('fid', 'abc');
      driveAfterSave = async () => {}; await saveFile({ auto: true });
    });
  });

  test('a cópia abre com a palavra-passe: fica registado, sem avisos', async ({ page }) => {
    const r = await page.evaluate(async () => { const t = pendingVaultText; driveDownload = async () => t; return avBackupCheck(true); });
    expect(r).toBe(true);
    expect(await page.evaluate(() => avBackupLine())).toContain('abre com a tua palavra-passe');
  });

  test('a cópia não abre: avisa e propõe gravar', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const c = JSON.parse(pendingVaultText); c.payload.data = c.payload.data.slice(0, -8) + 'AAAAAAAA';
      driveDownload = async () => JSON.stringify(c); return avBackupCheck(true);
    });
    expect(r).toBe(false);
    await expect(page.locator('#av-nudge')).toContainText('não abre');
    await expect(page.locator('#av-nudge .av-nudge-b')).toHaveText('Gravar agora');
  });

  test('sem rede: não conta como falha', async ({ page }) => {
    const r = await page.evaluate(async () => { driveDownload = async () => { throw new Error('rede'); }; return avBackupCheck(true); });
    expect(r).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('av_bkcheck'))).toBeNull();
  });
});

test.describe('Folha de herança: códigos de recuperação e cópia no Drive', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page); await createVault(page);
    await page.evaluate(() => {
      totp.push({ id: 't1', name: 'Google', issuer: 'Google', account: 'eu@gmail.com', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1', recovery: 'abcd-1234\nefgh-5678' });
      dCfg('on', '1'); dCfg('cid', 'teste.apps.googleusercontent.com'); dCfg('hint', 'eu@gmail.com');
      renderAll(); openLegacyModal();
    });
  });

  const sheet = async page => {
    const [pop] = await Promise.all([page.waitForEvent('popup'), page.evaluate(() => generateLegacyDoc())]);
    await pop.waitForLoadState();
    return pop.locator('body').innerText();
  };

  test('por defeito não inclui os códigos, mas indica a cópia no Drive', async ({ page }) => {
    await expect(page.locator('#legacy-recbox-lbl')).toContainText('(1)');
    const txt = await sheet(page);
    expect(txt).not.toContain('abcd-1234');
    expect(txt).toContain('Google Drive');
    expect(txt).toContain('eu@gmail.com');
  });

  test('com a opção ligada, os códigos aparecem na folha', async ({ page }) => {
    await page.locator('#legacy-recbox').check();
    const txt = await sheet(page);
    expect(txt).toContain('Códigos de recuperação');
    expect(txt).toContain('abcd-1234');
    expect(txt).toContain('efgh-5678');
  });

  test('2FA trancado: a opção fica desativada com explicação', async ({ page }) => {
    await page.evaluate(() => { closeLegacyModal(); totpRecWrap = {}; totpUnlocked = false; openLegacyModal(); });
    await expect(page.locator('#legacy-recbox')).toBeDisabled();
    await expect(page.locator('#legacy-recwarn')).toContainText('trancado');
  });

  test('contas 2FA sem códigos guardados: a opção explica em vez de desaparecer', async ({ page }) => {
    await page.evaluate(() => { closeLegacyModal(); totp.forEach(t => delete t.recovery); openLegacyModal(); });
    await expect(page.locator('#legacy-rec-row')).toBeVisible();
    await expect(page.locator('#legacy-recbox')).toBeDisabled();
    await expect(page.locator('#legacy-recwarn')).toContainText('A tua conta 2FA não tem códigos de recuperação');
  });

  test('separador 2FA protegido: a folha explica o código de recuperação 2FA (e dá espaço para o escrever)', async ({ page }) => {
    await page.evaluate(() => { closeLegacyModal(); totpRecWrap = {}; totpUnlocked = true; openLegacyModal(); });
    await expect(page.locator('#legacy-pwbox-lbl')).toContainText('código de recuperação 2FA');
    let txt = await sheet(page);
    expect(txt).toContain('O separador 2FA tem um fecho próprio');
    expect(txt).toContain('não está escrito nesta folha');
    await page.evaluate(() => openLegacyModal());
    await page.locator('#legacy-pwbox').check();
    txt = await sheet(page);
    expect(txt).toContain('Escreve aqui à mão o código de recuperação 2FA');
  });

  test('sem proteção no separador 2FA: a secção não aparece', async ({ page }) => {
    expect(await sheet(page)).not.toContain('fecho próprio');
  });
});
