import { test, expect, openApp, createVault, modalSettled } from './fixtures.mjs';

// «Novo código 2FA» → «Ler QR» → «Ler de uma imagem»: o leitor tem de abrir por cima da janela do código,
// os campos têm de aparecer preenchidos e o código guardado leva os dígitos/algoritmo/período do QR
const URI = 'otpauth://totp/Exemplo:ana%40exemplo.pt?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Exemplo&digits=8&algorithm=SHA256&period=60';

async function qrPng(page, text) {
  const b64 = await page.evaluate(text => {
    const m = CVQR.matrix(text), s = 6, q = 4, c = document.createElement('canvas');
    c.width = c.height = (m.length + 2 * q) * s;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#000';
    m.forEach((r, i) => r.forEach((v, j) => { if (v) x.fillRect((j + q) * s, (i + q) * s, s, s); }));
    return c.toDataURL('image/png').split(',')[1];
  }, text);
  return { name: 'qr.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

async function openScanner(page) {
  await page.evaluate(() => { switchTab('totp'); openTotpModal(); });
  await expect(page.locator('#totp-overlay')).toHaveClass(/open/);
  await modalSettled(page);
  await page.locator('#tf-scan-btn').click();
  await expect(page.locator('#qrscan-overlay')).toHaveClass(/open/);
  await modalSettled(page);
}

async function pickImage(page, file) {
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#qrscan-file-btn').click();
  await (await chooser).setFiles(file);
}

test.describe('2FA: ler o QR de uma imagem', () => {
  test.beforeEach(async ({ page }) => { await openApp(page); await createVault(page); });

  test('o leitor abre por cima e o código fica guardado com as definições do QR', async ({ page }) => {
    const file = await qrPng(page, URI);
    await openScanner(page);
    const onTop = await page.evaluate(() => {
      const r = document.getElementById('qrscan-file-btn').getBoundingClientRect();
      return !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('#qrscan-overlay');
    });
    expect(onTop).toBe(true);
    expect((await page.locator('#qrscan-file-btn').boundingBox()).height).toBeGreaterThan(30);

    await pickImage(page, file);
    await expect(page.locator('#qrscan-overlay')).not.toHaveClass(/open/);
    await expect(page.locator('#totp-overlay')).toHaveClass(/open/);
    await expect(page.locator('#tf-name')).toHaveValue('Exemplo');
    await expect(page.locator('#tf-account')).toHaveValue('ana@exemplo.pt');
    await expect(page.locator('#tf-secret')).toHaveValue('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP');

    await page.locator('#totp-save-btn').click();
    await expect(page.locator('#totp-overlay')).not.toHaveClass(/open/);
    const saved = await page.evaluate(() => totp.map(({ name, account, digits, algorithm, period }) => ({ name, account, digits, algorithm, period })));
    expect(saved).toEqual([{ name: 'Exemplo', account: 'ana@exemplo.pt', digits: 8, algorithm: 'SHA256', period: 60 }]);
    await expect(page.locator('#totp-grid')).toContainText('Exemplo');
  });

  test('se a janela do código foi fechada entretanto, volta a abrir já preenchida', async ({ page }) => {
    const file = await qrPng(page, URI);
    await openScanner(page);
    await page.evaluate(() => closeTotpModal());
    await pickImage(page, file);
    await expect(page.locator('#totp-overlay')).toHaveClass(/open/);
    await expect(page.locator('#tf-name')).toHaveValue('Exemplo');
    await expect(page.locator('#tf-secret')).toHaveValue('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP');
  });

  test('um segredo escrito à mão depois de ler o QR não herda as definições do QR', async ({ page }) => {
    const file = await qrPng(page, URI);
    await openScanner(page);
    await pickImage(page, file);
    await expect(page.locator('#tf-name')).toHaveValue('Exemplo');
    await page.locator('#tf-secret').fill('GEZDGNBVGY3TQOJQ');
    await page.locator('#totp-save-btn').click();
    const t = await page.evaluate(() => ({ digits: totp[0].digits, algorithm: totp[0].algorithm, period: totp[0].period }));
    expect(t).toEqual({ digits: 6, algorithm: 'SHA1', period: 30 });
  });
});

test('com o cofre 2FA bloqueado, um QR lido não abre a janela nem grava nada', async ({ page }) => {
  await openApp(page); await createVault(page);
  const r = await page.evaluate(async uri => {
    await setup2faVault('482915');
    lock2faVault();
    qrScanMode = 'totp';
    const ok = handleScannedQr(uri);
    document.getElementById('tf-name').value = 'X'; document.getElementById('tf-secret').value = 'JBSWY3DPEHPK3PXP';
    saveTotp();
    return { ok, open: document.getElementById('totp-overlay').classList.contains('open'), n: totp.length };
  }, URI);
  expect(r).toEqual({ ok: true, open: false, n: 0 });
});
