import { test, expect, openApp, createVault } from './fixtures.mjs';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Acessibilidade (axe-core): nenhum problema crítico ou sério — botões e campos com nome, contraste legível…
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const RULES = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, resultTypes: ['violations'] };
const check = (page, sel) => page.evaluate(async ([sel, RULES]) => {
  // espera que acabem as animações de entrada (a meio, os elementos ainda estão semitransparentes)
  await Promise.all(document.getAnimations().filter(a => a.effect && a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
  await new Promise(r => (window.requestIdleCallback || setTimeout)(r, { timeout: 800 }));
  const r = await axe.run(sel ? { include: [[sel]] } : document, RULES);
  return r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => v.id + ': ' + v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', '));
}, [sel, RULES]);

test('ecrã de entrada, separadores e janelas sem problemas graves de acessibilidade', async ({ page }) => {
  test.setTimeout(150_000);
  await openApp(page);
  await page.evaluate(AXE);
  expect(await check(page)).toEqual([]);
  await createVault(page);
  await page.evaluate(() => {
    vault.push({ id: 'a1', name: 'Gmail', cat: 'email', user: 'u', pw: 'p', url: 'gmail.com' });
    bankCards.push({ id: 'b1', bank: 'CGD', number: '4111111111111111', expiry: '12/28' });
    totp.push({ id: 't1', name: 'G', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1' });
    notes.push({ id: 'n1', title: 'N', body: 'b' }); documents.push({ id: 'd1', title: 'CC', cat: 'pessoal' });
    storeCards.push({ id: 's1', name: 'Lidl', number: '123' }); renderAll();
  });
  const found = [];
  for (const t of ['dashboard', 'vault', 'cards', 'docs', 'totp', 'notes', 'store']) {
    await page.evaluate(t => switchTab(t), t);
    (await check(page, '#app')).forEach(v => found.push('aba ' + t + ' → ' + v));
  }
  for (const f of ['openModal()', 'openPwGen()', 'openChangePwModal()', 'openCardModal()', 'openDocModal()', 'openStoreModal()', 'openSubModal()', 'openSettings()']) {
    await page.evaluate(f => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); (0, eval)(f); }, f);
    (await check(page, '.modal-overlay.open')).forEach(v => found.push(f + ' → ' + v));
  }
  expect(found).toEqual([]);
});
