import { test, expect, openApp, createVault } from './fixtures.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

// Lê um ZIP sem compressão (como o que a app faz) e valida o CRC de cada ficheiro
function unzipStored(buf) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = u8 => { let c = 0xFFFFFFFF; for (const b of u8) c = crcT[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  let e = buf.length - 22; while (buf.readUInt32LE(e) !== 0x06054b50) e--;
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const out = {};
  for (let i = 0; i < n; i++) {
    const size = buf.readUInt32LE(p + 24), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42), want = buf.readUInt32LE(p + 16);
    const name = buf.toString('utf8', p + 46, p + 46 + nl);
    const lnl = buf.readUInt16LE(off + 26), lxl = buf.readUInt16LE(off + 28), data = buf.subarray(off + 30 + lnl + lxl, off + 30 + lnl + lxl + size);
    if (crc(data) !== want) throw new Error('CRC errado: ' + name);
    out[name] = data; p += 46 + nl + xl + cl;
  }
  return out;
}

test('kit para a pen: descarrega, abre a partir dos ficheiros sem internet e o cofre abre', async ({ page, browser }) => {
  await openApp(page);
  await createVault(page);
  await page.evaluate(async () => {
    vault.push({ id: 'g', name: 'Gmail', user: 'eu@gmail.com', pw: 'Segredo#1' }); markUnsaved(); await saveFile({ auto: true });
    openSettings(); switchSettingsTab('seguranca');
  });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#s-pen-btn').click()]);
  expect(dl.suggestedFilename()).toMatch(/^aurora-vault-pen-\d{4}-\d{2}-\d{2}\.zip$/);
  const files = unzipStored(readFileSync(await dl.path()));
  const names = Object.keys(files);
  for (const f of ['ABRIR-AQUI.html', 'app.js', 'styles.css', 'js/crypto.js', 'ciphervault.vault', 'LEIA-ME.txt']) expect(names).toContain('Aurora Vault/' + f);
  expect(names.some(n => n.includes('tesseract'))).toBe(false);
  expect(files['Aurora Vault/styles.css'].toString()).not.toMatch(/url\(vendor\/fonts/);

  const dir = mkdtempSync(join(tmpdir(), 'av-pen-'));
  for (const [n, d] of Object.entries(files)) { const f = join(dir, n); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, d); }
  const ctx = await browser.newContext({ offline: true });
  const pen = await ctx.newPage();
  const errs = [];
  pen.on('pageerror', e => errs.push(e.message));
  pen.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pen.goto(pathToFileURL(join(dir, 'Aurora Vault', 'ABRIR-AQUI.html')).href);
  await pen.waitForFunction(() => typeof submitOpenVault === 'function');
  const vaultText = files['Aurora Vault/ciphervault.vault'].toString();
  const r = await pen.evaluate(async t => {
    await document.fonts.ready;
    startOpenVault(); pendingVaultText = t; document.getElementById('master-pw').value = 'test-pass-1'; await submitOpenVault();
    await new Promise(r => setTimeout(r, 1200));
    return { open: !!masterKey, gmail: vault.find(v => v.name === 'Gmail')?.pw, font: document.fonts.check('16px "JetBrains Mono"') };
  }, vaultText);
  expect(r).toEqual({ open: true, gmail: 'Segredo#1', font: true });
  expect(errs.filter(e => !/service ?worker|serviceWorker/i.test(e))).toEqual([]);
  await ctx.close();
});
