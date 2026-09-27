import { test, expect, openApp, createVault } from './fixtures.mjs';

const seed = () => {
  for (let i = 0; i < 12; i++) vault.push({ id: 'e' + i, name: 'Conta com um nome bastante comprido ' + i, cat: 'email', user: 'utilizador' + i + '@exemplo.com', pw: 'Str0ng!Pass' + i, url: 'https://site' + i + '.com', createdAt: Date.now() });
  documents.push({ id: 'd1', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: '2026-12-01', createdAt: Date.now() });
  bankCards.push({ id: 'b1', bank: 'Caixa Geral de Depósitos', holder: 'NOME', number: '4111 1111 1111 1111', expiry: '12/28', color: '#1b5e20' });
  vaultName = 'Teste';
  renderAll();
};

for (const theme of ['dark', 'light']) {
  test(`nada sai da largura do ecrã (tema ${theme})`, async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('cv_theme_mode', t), theme);
    await openApp(page);
    await createVault(page);
    await page.evaluate(seed);
    for (const tab of ['dashboard', 'vault', 'cards', 'docs', 'notes', 'totp']) {
      const over = await page.evaluate(tab => {
        switchTab(tab);
        const W = document.documentElement.clientWidth, out = [];
        document.querySelectorAll('#app *').forEach(el => {
          if (!el.offsetParent || el.closest('#aurora-panel,.sidebar,.tabs,#subtabs,.cat-chips,.tab-scroll,[class*="scroll"]')) return;
          const cs = getComputedStyle(el); if (cs.position === 'fixed') return;
          const r = el.getBoundingClientRect(); if (r.width && r.right > W + 1) out.push(el.id || el.className || el.tagName);
        });
        return out.slice(0, 5);
      }, tab);
      expect(over, `separador ${tab}`).toEqual([]);
    }
  });
}

test('tema claro: texto em destaque legível e barra de topo clara', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cv_theme_mode', 'light'));
  await openApp(page);
  await createVault(page);
  const r = await page.evaluate(() => {
    const px = c => { const d = document.createElement('div'); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color.match(/\d+/g).map(Number); d.remove(); return v; };
    const cs = getComputedStyle(document.documentElement);
    const ink = px(cs.getPropertyValue('--accent-ink')), bg = px(cs.getPropertyValue('--bg')), card = px(cs.getPropertyValue('--card'));
    const top = getComputedStyle(document.querySelector('.topbar')).backgroundColor.match(/\d+/g).map(Number);
    return { ratio: Math.min(contrastRatio(ink, bg), contrastRatio(ink, card)), topLum: relLum(top) };
  });
  expect(r.ratio).toBeGreaterThanOrEqual(4.5);
  expect(r.topLum).toBeGreaterThan(0.5);
});

test('barra de segurança sem espaços vazios quando não há resultados de fugas', async ({ page }) => {
  await openApp(page);
  await createVault(page);
  const hidden = await page.evaluate(() => {
    switchTab('vault');
    return ['breach-status', 'breach-results'].map(id => getComputedStyle(document.getElementById(id)).display);
  });
  expect(hidden).toEqual(['none', 'none']);
});

test('as fontes da app vêm deste site e carregam', async ({ page }) => {
  await openApp(page);
  const loaded = await page.evaluate(async () => { await document.fonts.ready; return [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))].sort(); });
  expect(loaded).toEqual(expect.arrayContaining(['JetBrains Mono', 'Playfair Display']));
});
