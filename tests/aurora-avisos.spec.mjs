import { test, expect, openApp, createVault } from './fixtures.mjs';

// Aurora avisa sozinha: faturas a vencer, contas que sobem, validades, passwords repetidas, documentos por ler
const SEED = () => {
  const day = 864e5, iso = d => new Date(Date.now() + d * day).toISOString().slice(0, 10);
  vault.push({ id: 'g', name: 'Gmail', user: 'a', pw: 'Mesma#Pass2026' }, { id: 'n', name: 'Netflix', user: 'b', pw: 'Mesma#Pass2026' });
  documents.push(
    { id: 'e1', title: 'Fatura EDP julho', cat: 'casa', facts: { kind: 'fatura', entity: 'EDP', total: 40, issueDate: iso(-60) }, textAt: 1 },
    { id: 'e2', title: 'Fatura EDP agosto', cat: 'casa', facts: { kind: 'fatura', entity: 'EDP', total: 52.1, issueDate: iso(-10), dueDate: iso(2) }, textAt: 1 },
    { id: 'cc', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: iso(12) },
    { id: 'pdf', title: 'Contrato', cat: 'outro', file: { name: 'c.pdf', type: 'application/pdf', size: 10, data: 'data:application/pdf;base64,' } });
  subscriptions.push({ id: 's', name: 'Spotify', amount: 7.99, cycle: 'monthly', renewDay: String(new Date(Date.now() + day).getDate()) });
  renderAll();
};
const talk = (page, q) => page.evaluate(async q => {
  const box = document.getElementById('aurora-msgs'), before = box.children.length;
  aurQuick(q); await new Promise(r => setTimeout(r, 40));
  return [...box.children].slice(before).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ ');
}, q);

test.describe('Aurora avisa sozinha', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
  });

  test('lista de avisos, por ordem de urgência', async ({ page }) => {
    await page.evaluate(() => auroraOpen());
    const r = await talk(page, 'o que devo tratar?');
    expect(r).toMatch(/coisas para tratar/);
    expect(r).toMatch(/Fatura EDP \(\D*52,10\D*\) vence em 2 dias/);
    expect(r).toMatch(/fatura da EDP subiu 30%/);
    expect(r).toMatch(/Cartão de Cidadão expira em 12 dias/);
    expect(r).toMatch(/Spotify renova amanhã/);
    expect(r).toMatch(/2 contas partilham a mesma password \(Gmail, Netflix\)/);
    expect(r).toMatch(/1 documento que ainda não li/);
    expect(r.indexOf('vence em 2 dias')).toBeLessThan(r.indexOf('renova amanhã'));
    expect(await talk(page, 'avisos')).toMatch(/para tratar/);
    expect(await talk(page, 'what needs my attention')).toMatch(/to look at/);
  });

  test('a saudação mostra os avisos e a bolha mostra quantos são', async ({ page }) => {
    await page.evaluate(() => auroraOpen());
    await expect(page.locator('#aurora-msgs')).toContainText(/avisos para ti/);
    await expect.poll(() => page.evaluate(() => document.getElementById('aurora-fab').dataset.n)).toBe('4');
    await page.evaluate(() => { documents.find(d => d.id === 'e2').paid = true; renderAll(); });
    await expect.poll(() => page.evaluate(() => document.getElementById('aurora-fab').dataset.n)).toBe('3');
  });

  test('«já paguei», «lembra-me amanhã» e «ignorar» tiram o aviso', async ({ page }) => {
    await page.evaluate(() => auroraOpen());
    await talk(page, 'avisos');
    await page.locator('#aurora-msgs .a-btn', { hasText: 'Já paguei' }).last().click();
    expect(await page.evaluate(() => documents.find(d => d.id === 'e2').paid)).toBe(true);
    await page.locator('#aurora-msgs .aurora-msg', { hasText: 'Cartão de Cidadão' }).last().locator('.a-btn', { hasText: 'Lembra-me amanhã' }).click();
    await page.locator('#aurora-msgs .aurora-msg', { hasText: 'partilham' }).last().locator('.a-btn', { hasText: 'Ignorar' }).click();
    const r = await talk(page, 'avisos');
    expect(r).not.toMatch(/vence em 2 dias|Cartão de Cidadão|partilham/);
    expect(r).toMatch(/subiu/);
  });

  test('sem nada pendente: tudo em ordem', async ({ page }) => {
    await page.evaluate(() => { vault.length = 0; documents.length = 0; subscriptions.length = 0; renderAll(); auroraOpen(); });
    expect(await talk(page, 'tens avisos?')).toMatch(/tudo em ordem/);
  });
});
