import { test as base, expect } from '@playwright/test';

export { expect };

// Cada teste: página limpa, sem o ecrã de boas-vindas, diálogos aceites, sem depender da internet
// e a falhar se aparecer algum erro de JavaScript.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [], external = [];
    // (o WebKit relata como erro da página a verificação automática do service worker interrompida por um recarregamento)
    page.on('pageerror', e => { if (!/sw\.js due to access control checks/.test(e.message)) errors.push(e.message); });
    // A app não pode falar com servidores de terceiros (só o Drive e a verificação de fugas, que os testes simulam)
    page.on('request', r => { const u = new URL(r.url()); if (/^https?:$/.test(u.protocol) && u.hostname !== 'localhost') external.push(u.hostname); });
    page.on('dialog', d => d.accept().catch(() => {}));
    await page.addInitScript(() => {
      try { localStorage.setItem('cv_welcomed', '1'); localStorage.setItem('av_tour_offered', '1'); } catch (e) {}
    });
    await page.addInitScript(() => {
      window.__csp = [];
      document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
    });
    await use(page);
    expect(errors, 'erros de JavaScript na página').toEqual([]);
    expect(external.filter(h => !['example.invalid', 'www.googleapis.com', 'api.pwnedpasswords.com'].includes(h)), 'pedidos a servidores de terceiros').toEqual([]);
    const csp = await page.evaluate(() => window.__csp || []).catch(() => []);
    expect(csp, 'bloqueios da política de segurança (CSP)').toEqual([]);
  },
});

export async function openApp(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof submitOpenVault === 'function' && typeof AuroraBG !== 'undefined');
}

export async function createVault(page, pw = 'test-pass-1') {
  await page.evaluate(async pw => {
    startNewVault();
    document.getElementById('new-pw1').value = pw;
    document.getElementById('new-pw2').value = pw;
    await submitNewVault();
  }, pw);
  await page.waitForFunction(() => !!masterKey && getComputedStyle(document.getElementById('app')).display !== 'none');
}

// Cofre no formato antigo (PBKDF2 com 200 000 iterações, sem «iter» no ficheiro)
export async function legacyVaultText(page, pw, data) {
  return page.evaluate(async ([pw, data]) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), { name: 'PBKDF2' }, false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return JSON.stringify({ salt: Array.from(salt), payload: await encrypt(key, data) });
  }, [pw, data]);
}

export async function openVaultText(page, text, pw) {
  await page.evaluate(async ([text, pw]) => {
    pendingVaultText = text;
    document.getElementById('master-pw').value = pw;
    await submitOpenVault();
  }, [text, pw]);
}
