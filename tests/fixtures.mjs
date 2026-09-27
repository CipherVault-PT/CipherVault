import { test as base, expect } from '@playwright/test';

export { expect };

// Cada teste: página limpa, sem o ecrã de boas-vindas, diálogos aceites, sem depender da internet
// e a falhar se aparecer algum erro de JavaScript.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept().catch(() => {}));
    await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\//, r => r.abort());
    await page.addInitScript(() => {
      try { localStorage.setItem('cv_welcomed', '1'); localStorage.setItem('av_tour_offered', '1'); } catch (e) {}
    });
    await use(page);
    expect(errors, 'erros de JavaScript na página').toEqual([]);
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
