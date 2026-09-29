import { test, expect, openApp, createVault } from './fixtures.mjs';

// Aurora AI: pedidos escritos como uma pessoa escreve → resposta certa (tudo local, sem internet)
const SEED = () => {
  const day = 864e5, iso = d => new Date(Date.now() + d * day).toISOString().slice(0, 10);
  vault.push(
    { id: 'g', name: 'Gmail', cat: 'email', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY', url: 'gmail.com', createdAt: Date.now() - 800 * day },
    { id: 'n', name: 'Netflix', cat: 'social', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY', url: 'netflix.com', createdAt: Date.now() - 30 * day },
    { id: 's', name: 'Santander', cat: 'banco', user: '123456', pw: '1234', url: 'santander.pt', createdAt: Date.now() - 20 * day },
    { id: 'f', name: 'Facebook', cat: 'social', user: 'carlitos', pw: 'fb-pass-99!Zq', url: 'facebook.com', createdAt: Date.now() - 10 * day },
    { id: 'w', name: 'Intranet Empresa', cat: 'trabalho', user: 'c.silva', pw: 'Tr@b-2026-xyz', createdAt: Date.now() - 5 * day });
  documents.push({ id: 'd', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: iso(20) }, { id: 'd2', title: 'Escritura da casa', cat: 'casa' },
    { id: 'd3', title: 'Livrete', cat: 'outro', folderId: 'fc' });
  docFolders.push({ id: 'fc', name: 'Carro' });
  bankCards.push({ id: 'b', bank: 'CGD', number: '4111111111111111', expiry: '12/28', pin: '4321', cvv: '987' });
  subscriptions.push({ id: 'u1', name: 'Spotify', amount: 7.99, cycle: 'monthly', renewDay: '9' }, { id: 'u2', name: 'Disney Plus', amount: 13.99, cycle: 'monthly', renewDay: '3' });
  assets.push({ id: 'v', kind: 'vehicle', name: 'Golf', inspection: iso(34), insurance: iso(167), fuel: [{ id: 'q', date: iso(-40), liters: 40, euros: 70 }] },
    { id: 'wt', kind: 'warranty', name: 'TV Samsung', buyDate: iso(-2 * 365 + 25), years: 2 });
  wifiNets.push({ id: 'wn', name: 'Casa', ssid: 'MEO-1234', pw: 'wifi-pass', sec: 'WPA' });
  totp.push({ id: 't', name: 'GitHub', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1' });
  personalInfo.push({ id: 'p', name: 'Eu', fields: [{ id: 'f1', label: 'NIF', value: '123456789' }, { id: 'f2', label: 'IBAN', value: 'PT50000000000000000000000' }, { id: 'f3', label: 'Nº Utente', value: '987654321' }] });
  renderAll();
};

// [pedido, o que a resposta tem de conter (regex)]
const CASES = [
  // passwords e contas
  ['qual é a password do gmail', /Gmail[\s\S]*carlos@gmail\.com/],
  ['diz-me a senha do netflix', /Netflix/],
  ['dá-me o email da minha conta do banco', /Santander[\s\S]*123456/],
  ['qual o utilizador do banco', /Santander/],
  ['qual o login da minha conta do trabalho', /Intranet Empresa[\s\S]*c\.silva/],
  ['qual a password do banco santander', /Santander/],
  ['what is my netflix password', /Netflix[\s\S]*Password/],
  ['my bank account username', /Santander/],
  ['copia a password da netflix', /Copiei a password de Netflix/],
  ['quantas passwords tenho', /5 acessos/],
  // segurança
  ['tenho passwords fracas?', /fraca/],
  ['quais passwords estão repetidas', /repetida/],
  ['quais sites usam a mesma password que o gmail', /mesma password que Gmail[\s\S]*Netflix/],
  ['o netflix tem a mesma password que outra conta?', /mesma password que Netflix[\s\S]*Gmail/],
  ['which accounts use the same password as gmail', /same password as Gmail[\s\S]*Netflix/],
  ['o facebook tem password repetida?', /Nenhuma outra conta usa a mesma password que Facebook/],
  ['estou preocupado que me tenham roubado a password do email, o que faço?', /proteger Gmail[\s\S]*Netflix[\s\S]*2 passos/],
  ['acho que me hackearam o facebook', /proteger Facebook/],
  ['a minha conta do gmail foi pirateada', /proteger Gmail/],
  ['my email was hacked, what do i do', /secure Gmail/],
  ['roubaram-me uma password, o que faço?', /conta foi comprometida|De que conta/],
  ['verifica se as minhas passwords estão em fugas', /verificação de fugas/],
  ['check my passwords for leaks', /leak check/],
  ['a minha password do banco é segura?', /Santander[\s\S]*fraca/],
  ['quais as contas mais antigas', /Gmail — há 2 anos/],
  ['passwords que não mudo há mais de um ano', /Gmail/],
  ['contas que não uso há 3 anos', /Nenhuma password com mais de 3 anos/],
  ['gera uma password forte com 20 caracteres', /20 caracteres/],
  ['muda a password do gmail para uma nova', /Vou mudar a password de Gmail/],
  // cartões
  ['qual o pin do cartão da cgd', /Confirma que és tu para ver o PIN do cartão CGD/],
  ['diz-me o pin do meu cartão', /PIN do cartão CGD/],
  ['qual o cvv do cartão', /CVV do cartão CGD/],
  // documentos e validades
  ['quando expira o meu cartão de cidadão', /expira a[\s\S]*em 20 dias/],
  ['que documentos tenho da casa', /Escritura da casa/],
  ['documentos do carro', /Livrete/],
  ['tenho documentos sobre o barco?', /Não encontrei documentos sobre/],
  ['quantos documentos tenho', /3/],
  ['documentos que expiram este ano', /Cartão de Cidadão/],
  ['abre os documentos', /Documentos/],
  ['que garantias estão a acabar', /TV Samsung/],
  ['o que expira nos próximos 2 meses', /Cartão de Cidadão/],
  // veículos
  ['quando é a próxima inspeção do golf', /Inspeção[\s\S]*Golf — .*em 34 dias/],
  ['quando acaba o seguro do carro', /Seguro[\s\S]*Golf/],
  ['quando é a revisão do golf', /Revisão[\s\S]*sem data/],
  ['next car inspection', /Inspection[\s\S]*Golf/],
  ['quanto gastei em combustível', /Combustível[\s\S]*70/],
  ['lembra-me de renovar o seguro do carro a 15 de março', /Vou agendar[\s\S]*seguro do carro/],
  // subscrições, info, 2FA, wifi
  ['quanto gasto por mês em subscrições', /21,98/],
  ['qual o meu nif', /123456789/],
  ['qual o iban', /PT50/],
  ['qual é o meu número de utente', /987654321/],
  ['mostra o código 2fa do github', /GitHub/],
  ['qual a password do wifi de casa', /Wi-Fi[\s\S]*Casa/],
  // conversa e navegação
  ['o que consegues fazer', /O que eu sei fazer/],
  ['obrigado', /De nada/],
  ['resume o meu cofre', /Ponto de situação/],
  ['tenho alguma coisa para tratar esta semana?', /esta semana/],
  ['muda para o tema claro', /Temas claros/],
];

test.describe('Aurora AI percebe pedidos reais', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
    await page.evaluate(() => { window.avAuth = () => new Promise(() => {}); auroraOpen(); });   // o pedido de identidade fica à espera (não interessa aqui)
  });

  test(`${CASES.length} pedidos em português e inglês`, async ({ page }) => {
    const wrong = await page.evaluate(async cases => {
      const out = [];
      for (const [q, reSrc] of cases) {
        const box = document.getElementById('aurora-msgs'), before = box.children.length;
        AUR.pending = null;
        aurQuick(q);
        await new Promise(r => setTimeout(r, 30));
        const txt = [...box.children].slice(before + 1).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ ');
        if (!new RegExp(reSrc).test(txt)) out.push(q + '  →  ' + txt.slice(0, 160));
      }
      return out;
    }, CASES.map(([q, re]) => [q, re.source]));
    expect(wrong).toEqual([]);
  });
});
