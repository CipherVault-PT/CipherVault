import { test, expect, openApp, createVault } from './fixtures.mjs';

// Aurora segue a conversa: seguimentos, pronomes, pedidos compostos, escolhas e «repete»
const SEED = () => {
  const day = 864e5, iso = d => new Date(Date.now() + d * day).toISOString().slice(0, 10);
  vault.push(
    { id: 'g', name: 'Gmail', cat: 'email', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY', url: 'gmail.com' },
    { id: 'n', name: 'Netflix', cat: 'social', user: 'carlos.netflix', pw: 'Nf-2025!qwerty', url: 'netflix.com' },
    { id: 'f', name: 'Facebook', cat: 'social', user: 'carlitos', pw: 'fb-pass-99!Zq', url: 'facebook.com' });
  documents.push({ id: 'd', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: iso(20) });
  bankCards.push({ id: 'b', bank: 'CGD', number: '4111111111111111', expiry: '12/28', pin: '4321', cvv: '987' });
  subscriptions.push({ id: 'u1', name: 'Spotify', amount: 7.99, cycle: 'monthly', renewDay: '9' });
  assets.push({ id: 'v', kind: 'vehicle', name: 'Golf', inspection: iso(34), insurance: iso(167), fuel: [] });
  personalInfo.push({ id: 'p', name: 'Eu', fields: [{ id: 'f1', label: 'NIF', value: '123456789' }, { id: 'f2', label: 'IBAN', value: 'PT50000000000000000000000' }] });
  renderAll();
};

test.describe('Aurora segue a conversa', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
    await page.evaluate(() => { window.avAuth = () => new Promise(() => {}); window.openReadMode = () => {}; auroraOpen(); });
  });

  // envia uma conversa e devolve as respostas de cada pedido
  const talk = (page, qs) => page.evaluate(async qs => {
    const box = document.getElementById('aurora-msgs'), out = [];
    for (const q of qs) {
      const before = box.children.length;
      if (q === '!sim') aurYes(); else aurQuick(q);
      await new Promise(r => setTimeout(r, 40));
      out.push([...box.children].slice(before).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ '));
    }
    return out;
  }, qs);

  test('seguimentos: outra conta, outro dado, outro período, outro assunto', async ({ page }) => {
    let r = await talk(page, ['qual é a password do gmail', 'e do netflix?', 'e a do facebook?']);
    expect(r[1]).toMatch(/Netflix[\s\S]*carlos\.netflix/);
    expect(r[2]).toMatch(/Facebook[\s\S]*carlitos/);
    r = await talk(page, ['what is my gmail password', 'and for netflix?']);
    expect(r[1]).toMatch(/Netflix[\s\S]*carlos\.netflix/);
    r = await talk(page, ['qual o pin do cartão da cgd', 'e o cvv?']);
    expect(r[1]).toMatch(/CVV do cartão CGD/);
    r = await talk(page, ['quando é a próxima inspeção do golf', 'e o seguro?']);
    expect(r[1]).toMatch(/Seguro[\s\S]*Golf/);
    r = await talk(page, ['o que expira nos próximos 10 dias', 'e nos próximos 2 meses?']);
    expect(r[0]).not.toMatch(/Cartão de Cidadão/);
    expect(r[1]).toMatch(/Cartão de Cidadão/);
    r = await talk(page, ['qual o meu nif', 'e o iban?']);
    expect(r[1]).toMatch(/PT50/);
  });

  test('pronomes: «copia-a», «a password dele», «apaga-o»', async ({ page }) => {
    let r = await talk(page, ['mostra o netflix', 'copia a password dele']);
    expect(r[1]).toMatch(/Copiei a password de Netflix/);
    r = await talk(page, ['qual o utilizador do facebook', 'copia-a']);
    expect(r[1]).toMatch(/Copiei [\s\S]*Facebook/);
    r = await talk(page, ['mostra o gmail', 'apaga-o']);
    expect(r[1]).toMatch(/Gmail/);
    expect(r[1]).toMatch(/Confirmar|Apagar|reciclagem/i);
  });

  test('pedidos compostos, também com confirmação pelo meio', async ({ page }) => {
    let r = await talk(page, ['mostra o gmail e depois copia a password']);
    expect(r[0]).toMatch(/Copiei a password de Gmail/);
    r = await talk(page, ['mostra a password do facebook e copia-a']);
    expect(r[0]).toMatch(/Copiei a password de Facebook/);
    r = await talk(page, ['muda a password do gmail para uma nova e depois copia-a', '!sim']);
    expect(r[0]).toMatch(/Depois disto: «copia-a»/);
    expect(r[1]).toMatch(/Copiei a password de Gmail/);
    expect(await page.evaluate(() => vault.find(v => v.id === 'g').pw)).not.toBe('Gm#2024abcXY');
    // nomes com «e» não se partem
    r = await talk(page, ['documentos de identificação e residência']);
    expect(r[0]).not.toMatch(/Depois disto/);
  });

  test('gera uma password e guarda-a numa conta (existente ou nova)', async ({ page }) => {
    let r = await talk(page, ['gera uma password forte com 24 caracteres e guarda-a no netflix', '!sim']);
    expect(r[0]).toMatch(/24 caracteres[\s\S]*Netflix/);
    expect(await page.evaluate(() => vault.find(v => v.id === 'n').pw.length)).toBe(24);
    r = await talk(page, ['gera uma password e guarda na Amazon', '!sim']);
    expect(await page.evaluate(() => (vault.find(v => v.name === 'Amazon') || {}).pw?.length)).toBe(20);
  });

  test('escolher da lista por ordem e «repete»', async ({ page }) => {
    await page.evaluate(() => { vault.push({ id: 'l1', name: 'Loja Online Norte', user: 'norte@mail.pt', pw: 'x-Norte-2026' }, { id: 'l2', name: 'Loja Online Sul', user: 'sul@mail.pt', pw: 'x-Sul-2026' }); renderAll(); });
    let r = await talk(page, ['password da loja online', 'o segundo']);
    expect(r[0]).toMatch(/qual é/);
    expect(r[1]).toMatch(/sul@mail\.pt/);
    r = await talk(page, ['qual o meu nif', 'repete']);
    expect(r[1]).toMatch(/123456789/);
  });
});
