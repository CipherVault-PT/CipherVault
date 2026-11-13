import { test, expect, openApp, createVault } from './fixtures.mjs';

// Aurora regista com campos ditos no pedido (v12.6): nota, password, 2FA, Wi-Fi, cartão de loja e info pessoal
test.describe('Aurora regista com campos', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => { window.openReadMode = () => {}; vaultName = 'Carlos Silva'; auroraOpen(); });
  });

  // envia o pedido, confirma se for preciso e devolve o que a Aurora respondeu (cada resposta separada por ‖)
  const ask = (page, q, confirm = true) => page.evaluate(async ([q, confirm]) => {
    const box = document.getElementById('aurora-msgs'), before = box.children.length;
    aurQuick(q); await new Promise(r => setTimeout(r, 30));
    const said = [...box.children].slice(before + 1).map(m => m.innerText.replace(/\s+/g, ' '));
    let after = '';
    if (confirm && AUR.pending && AUR.pending.ok) { const b2 = box.children.length; aurYes(); await new Promise(r => setTimeout(r, 20)); after = [...box.children].slice(b2).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ '); }
    document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
    return { said, after, trace: AUR.trace };
  }, [q, confirm]);
  const data = page => page.evaluate(() => ({
    notes: notes.map(n => [n.title, n.body]), vault: vault.map(v => [v.name, v.user, v.pw, v.url]),
    totp: totp.map(t => [t.name, t.secret]), wifi: wifiNets.map(w => [w.name, w.pw]), store: storeCards.map(s => [s.name, s.number]),
    info: personalInfo.map(p => [p.name, p.fields.map(f => f.label + '=' + f.value)]),
  }));

  test('nota com título e texto numa só resposta (não parte no «;» nem abre uma nota vazia)', async ({ page }) => {
    const r = await ask(page, 'Regista-me uma notas: Titulo : isto; texto: aquilo');
    expect(r.said).toHaveLength(1);
    expect(r.said[0]).toMatch(/Guardei a nota isto[\s\S]*aquilo/);
    await ask(page, 'cria uma nota com o título compras e o texto leite, ovos e pão');
    await ask(page, 'regista uma nota: título: filme; texto: ver o filme com o nome do pai; chave na mesa');
    await ask(page, 'anota: ligar ao canalizador amanhã');
    await ask(page, 'add a note: title: groceries; text: milk and bread');
    expect((await data(page)).notes).toEqual([['isto', 'aquilo'], ['compras', 'leite, ovos e pão'], ['filme', 'ver o filme com o nome do pai; chave na mesa'],
      ['Ligar ao canalizador amanhã', 'ligar ao canalizador amanhã'], ['groceries', 'milk and bread']]);
  });

  test('password: site, email e password (confirma antes de criar)', async ({ page }) => {
    const r = await ask(page, 'regista uma password: site netflix.com; email: ana@mail.pt; password: Abc123!x', false);
    expect(r.said.join(' ')).toMatch(/Vou criar este acesso[\s\S]*Netflix[\s\S]*ana@mail\.pt[\s\S]*Confirmas/);
    expect((await data(page)).vault).toEqual([]);
    await page.evaluate(() => aurYes());
    await ask(page, 'cria uma conta no spotify com o email ana@mail.pt e a password Sp0t!fy99');
    await ask(page, 'save a password: site: github.com; user: carlos-dev; password: Gh!2026xyz');
    const v = (await data(page)).vault;
    expect(v[0]).toEqual(['Netflix', 'ana@mail.pt', 'Abc123!x', 'netflix.com']);
    expect(v[1]).toEqual(['Spotify', 'ana@mail.pt', 'Sp0t!fy99', '']);
    expect(v[2]).toEqual(['Github', 'carlos-dev', 'Gh!2026xyz', 'github.com']);
    // sem password, gera uma forte
    await ask(page, 'guarda uma conta: nome Banco CTT; utilizador: 12345678');
    const ctt = (await data(page)).vault[3];
    expect(ctt.slice(0, 2)).toEqual(['Banco CTT', '12345678']);
    expect(ctt[2].length).toBeGreaterThanOrEqual(16);
  });

  test('2FA, Wi-Fi e cartão de loja', async ({ page }) => {
    expect((await ask(page, 'adiciona um código 2fa: nome Steam; chave 1234')).said.join(' ')).toMatch(/não parece válida/);
    await ask(page, 'adiciona um 2fa: nome GitHub; chave JBSW Y3DP EHPK 3PXP');
    await ask(page, 'nova rede wi-fi: nome Casa_5G; password: wifi-pass-1');
    await ask(page, 'regista um cartão de loja: nome Continente; número 2600000012345');
    const d = await data(page);
    expect(d.totp).toEqual([['GitHub', 'JBSWY3DPEHPK3PXP']]);
    expect(d.wifi).toEqual([['Casa_5G', 'wifi-pass-1']]);
    expect(d.store).toEqual([['Continente', '2600000012345']]);
  });

  test('info pessoal: vários campos para a tua ficha ou para outra pessoa', async ({ page }) => {
    await ask(page, 'regista info pessoal: NIF: 123456789; nº de utente: 987654321');
    await ask(page, 'adiciona info pessoal da Maria: telemóvel: 912345678');
    await ask(page, 'regista info pessoal: NIF: 111222333');
    expect((await data(page)).info).toEqual([['Carlos Silva', ['NIF=111222333', 'Nº de utente=987654321']], ['Maria', ['Telemóvel=912345678']]]);
  });

  test('sem campos, os pedidos de sempre continuam iguais', async ({ page }) => {
    expect((await ask(page, 'cria uma password com 12 letras', false)).said.join(' ')).toMatch(/Password forte \(12 caracteres\)/);
    expect((await ask(page, 'nova nota', false)).said.join(' ')).toMatch(/Abri uma nota nova/);
    expect((await ask(page, 'guarda a password do Gmail', false)).said.join(' ')).toMatch(/Vou criar este acesso[\s\S]*Gmail/);
    await page.evaluate(() => aurNo());
    expect((await ask(page, 'cria uma nota a dizer comprar pilhas')).said.join(' ')).toMatch(/Guardei a nota[\s\S]*comprar pilhas/i);
  });
});
