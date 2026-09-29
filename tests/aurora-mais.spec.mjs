import { test, expect, openApp, createVault } from './fixtures.mjs';

// Aurora: «desfaz», gastos do mês e comparação, «arruma o meu cofre», sugestões enquanto escreves
const SEED = () => {
  const d = new Date(), z = x => String(x).padStart(2, '0'), iso = (y, m, dd) => y + '-' + z(m + 1) + '-' + z(dd);
  const ym = [d.getFullYear(), d.getMonth()], pm = d.getMonth() === 0 ? [d.getFullYear() - 1, 11] : [d.getFullYear(), d.getMonth() - 1];
  vault.push({ id: 'g', name: 'Gmail', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY!' },
    { id: 'g2', name: 'Gmail', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY!', createdAt: Date.now() - 5e8 },
    { id: 'x', name: 'Loja Velha', user: 'eu', pw: '' },
    { id: 'n', name: 'Netflix', user: 'carlos', pw: 'Nf-2025!qwerty' });
  bankCards.push({ id: 'b', bank: 'CGD', number: '4111111111111111', expiry: '01/20' });
  notes.push({ id: 'e', title: '', body: '' });
  documents.push({ id: 'b1', title: 'Fatura EDP 1', facts: { kind: 'fatura', entity: 'EDP', total: 60, issueDate: iso(...ym, 1) }, textAt: 1 },
    { id: 'b2', title: 'Fatura EDP 2', facts: { kind: 'fatura', entity: 'EDP', total: 40, issueDate: iso(...pm, 1) }, textAt: 1 });
  subscriptions.push({ id: 's', name: 'Spotify', amount: 10, cycle: 'monthly', renewDay: '9' });
  assets.push({ id: 'v', kind: 'vehicle', name: 'Golf', fuel: [{ id: 'f', date: iso(...ym, 1), liters: 30, euros: 50 }, { id: 'f2', date: iso(...pm, 2), liters: 40, euros: 70 }] });
  renderAll();
};

test.describe('Aurora: desfazer, gastos, limpeza e sugestões', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
    await page.evaluate(() => { window.openReadMode = () => {}; auroraOpen(); });
  });

  const say = (page, q) => page.evaluate(async q => {
    const box = document.getElementById('aurora-msgs'), before = box.children.length;
    AUR.pending = null; aurQuick(q); await new Promise(r => setTimeout(r, 40));
    return [...box.children].slice(before + 1).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ ');
  }, q);

  test('«desfaz» anula mudanças feitas pela conversa (também depois de confirmar)', async ({ page }) => {
    await say(page, 'renomeia o netflix para Netflix Família');
    await page.evaluate(() => aurYes());
    expect(await page.evaluate(() => vault.find(v => v.id === 'n').name)).toBe('Netflix Família');
    await say(page, 'cria uma nota a dizer comprar pão');
    expect(await page.evaluate(() => notes.length)).toBe(2);
    expect(await say(page, 'desfaz')).toMatch(/Desfiz: «cria uma nota a dizer comprar pão»/);
    expect(await page.evaluate(() => notes.length)).toBe(1);
    expect(await say(page, 'desfaz')).toMatch(/Desfiz/);
    expect(await page.evaluate(() => vault.find(v => v.id === 'n').name)).toBe('Netflix');
    // perguntas não criam pontos de desfazer
    await say(page, 'qual a password do gmail');
    expect(await say(page, 'desfaz')).toMatch(/Não há nada para desfazer/);
  });

  test('gastos do mês no total e comparação com o mês passado', async ({ page }) => {
    expect(await say(page, 'quanto gastei este mês no total')).toMatch(/gastaste €?120,00[\s\S]*Faturas: €?60,00[\s\S]*Subscrições: €?10,00[\s\S]*Combustível: €?50,00/);
    const c = await say(page, 'compara com o mês passado');
    expect(c).toMatch(/Faturas: €?60,00 \(\+€?20,00\)[\s\S]*Combustível: €?50,00 \(−€?20,00\)[\s\S]*Total: €?120,00/);
    expect(c).toMatch(/igual ao mês passado/);
    // pedidos específicos continuam a ir para o sítio certo
    expect(await say(page, 'quanto gastei em combustível')).toMatch(/Combustível/);
  });

  test('«arruma o meu cofre»: um problema de cada vez', async ({ page }) => {
    expect(await say(page, 'arruma o meu cofre')).toMatch(/Encontrei 5 coisas[\s\S]*1\/5[\s\S]*Gmail está repetida 2 vezes/);
    const click = async label => { await page.locator('#aurora-msgs .aurora-msg').last().locator('.a-btn', { hasText: label }).click(); await page.waitForTimeout(40); };
    await click('Sim, limpar');
    await expect(page.locator('#aurora-msgs .aurora-msg').last()).toContainText('2/5');
    await click('Apagar entrada');
    await expect(page.locator('#aurora-msgs .aurora-msg').last()).toContainText('cartão CGD expirou');
    await click('Arquivar');
    await click('Apagar');
    await expect(page.locator('#aurora-msgs .aurora-msg').last()).toContainText('passwords fracas ou repetidas');
    await click('Saltar');
    await expect(page.locator('#aurora-msgs .aurora-msg').last()).toContainText('resolvi 4 de 5');
    const r = await page.evaluate(() => ({ gmail: vault.filter(v => v.name === 'Gmail').length, loja: vault.some(v => v.id === 'x'), card: bankCards[0].archived, notes: notes.length }));
    expect(r).toEqual({ gmail: 1, loja: false, card: true, notes: 0 });
    // e dá para desfazer o último passo
    expect(await say(page, 'desfaz')).toMatch(/Desfiz/);
    expect(await page.evaluate(() => notes.length)).toBe(1);
  });

  test('sugestões enquanto escreves, com os nomes do cofre', async ({ page }) => {
    const inp = page.locator('#aurora-input');
    await inp.pressSequentially('pass net');
    await expect(page.locator('#aurora-sugg .a-sug').first()).toHaveText('password do Netflix');
    await inp.fill(''); await inp.pressSequentially('gast');
    await expect(page.locator('#aurora-sugg')).toContainText('quanto gastei este mês no total');
    await inp.fill(''); await inp.pressSequentially('pass net');
    await page.locator('#aurora-sugg .a-sug').first().click();
    await expect(page.locator('#aurora-msgs')).toContainText('carlos');
    await expect(page.locator('#aurora-sugg')).toBeHidden();
    await inp.pressSequentially('arru'); await inp.press('Tab');
    await expect(inp).toHaveValue('arruma o meu cofre ');
  });
});
