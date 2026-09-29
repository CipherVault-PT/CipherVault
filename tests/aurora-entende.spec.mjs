import { test, expect, openApp, createVault } from './fixtures.mjs';

// Aurora percebe o dia a dia: calão, erros, pedidos indiretos, «como faço…», inglês — tudo no âmbito da app
const SEED = () => {
  const day = 864e5, iso = d => new Date(Date.now() + d * day).toISOString().slice(0, 10);
  vault.push({ id: 'g', name: 'Gmail', cat: 'email', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY', url: 'gmail.com' },
    { id: 'n', name: 'Netflix', cat: 'social', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY', url: 'netflix.com' },
    { id: 's', name: 'Santander', cat: 'banco', user: '123456', pw: '1234', url: 'santander.pt' },
    { id: 'f', name: 'Facebook', cat: 'social', user: 'carlitos', pw: 'fb-pass-99!Zq', url: 'facebook.com' },
    { id: 'r', name: 'Revolut', cat: 'banco', user: '+351912345678', pw: 'Rv!2025-xyzQ', url: 'revolut.com' },
    { id: 'fin', name: 'Portal das Finanças', cat: 'outro', user: '123456789', pw: 'Fin#2026abc!', url: 'portaldasfinancas.gov.pt', pwUpdated: Date.now() - 3600e3 });
  documents.push({ id: 'd', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: iso(20) }, { id: 'd2', title: 'Escritura da casa', cat: 'casa' },
    { id: 'd4', title: 'Passaporte', cat: 'pessoal', expiry: iso(-5) },
    { id: 'e1', title: 'Fatura EDP agosto', cat: 'casa', text: 'EDP Comercial Fatura Total a pagar 52,10 EUR', facts: { kind: 'fatura', entity: 'EDP', total: 52.1, issueDate: iso(-30), dueDate: iso(3) }, textAt: 1 },
    { id: 'e2', title: 'Fatura MEO', cat: 'casa', text: 'MEO fatura internet fibra total 39,99', facts: { kind: 'fatura', entity: 'MEO', total: 39.99, issueDate: iso(-2) }, textAt: 1 });
  bankCards.push({ id: 'b', bank: 'CGD', name: 'CGD Visa', number: '4111111111111111', expiry: '12/28', pin: '4321', cvv: '987' }, { id: 'b2', bank: 'Revolut', number: '5555555555554444', expiry: '03/27', pin: '1111', cvv: '123' });
  storeCards.push({ id: 'sc', name: 'Continente', number: '2600000012345' });
  notes.push({ id: 'no', title: 'Ideias para o jantar', body: 'bacalhau com natas' });
  subscriptions.push({ id: 'u1', name: 'Spotify', amount: 7.99, cycle: 'monthly', renewDay: '9' }, { id: 'u2', name: 'Disney Plus', amount: 13.99, cycle: 'monthly', renewDay: '3' });
  assets.push({ id: 'v', kind: 'vehicle', name: 'Golf', plate: '12-AB-34', inspection: iso(34), insurance: iso(167), fuel: [{ id: 'q', date: iso(-40), liters: 40, euros: 70 }, { id: 'q2', date: iso(-10), liters: 35, euros: 62 }] },
    { id: 'wt', kind: 'warranty', name: 'TV Samsung', buyDate: iso(-600), years: 2, store: 'Worten', price: '599' },
    { id: 'li', kind: 'license', name: 'Microsoft Office', key: 'XXXXX-YYYYY-ZZZZZ' },
    { id: 'dt', kind: 'dates', name: 'Aniversário da Mãe', date: iso(12), yearly: true });
  wifiNets.push({ id: 'wn', name: 'Casa', ssid: 'MEO-1234', pw: 'wifi-pass', sec: 'WPA' }, { id: 'wn2', name: 'Escritório', ssid: 'NOS-Office', pw: 'office-2026', sec: 'WPA' });
  totp.push({ id: 't', name: 'GitHub', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1' });
  personalInfo.push({ id: 'p', name: 'Carlos Silva', fields: [{ id: 'f1', label: 'NIF', value: '123456789' }, { id: 'f3', label: 'Nº Utente', value: '987654321' }, { id: 'f6', label: 'Data de nascimento', value: '1990-05-17' }] },
    { id: 'p2', name: 'Ana Silva', fields: [{ id: 'a1', label: 'NIF', value: '987654321' }] });
  vaultName = 'Carlos';
  renderAll();
};

// [pedido, o que a resposta tem de conter]
const CASES = [
  // erros de escrita e calão
  ['qual a pasword do gmial', /Gmail[\s\S]*carlos@gmail\.com/],
  ['qual o pim do cartao da cgd', /PIN do cartão CGD/],
  ['qnd expira o cc', /Cartão de Cidadão expira/],
  ['n me lembro da password do facebook', /Facebook[\s\S]*carlitos/],
  ['bora ver os codigos', /2FA/],
  ['qual a password da net', /Qual rede/],
  ['ajuda-me a encontrar a password do banco', /Santander[\s\S]*Revolut/],
  // passwords
  ['tenho a password do instagram guardada?', /não tens Instagram guardado/],
  ['preciso de uma password nova', /Password forte \(20 caracteres\)/],
  ['cria uma password com 12 letras', /Password forte \(12 caracteres\)/],
  ['as minhas passwords são seguras?', /Pontuação[\s\S]*Fracas/],
  ['tenho contas com a mesma password?', /repetida[\s\S]*Gmail/],
  ['qual foi a última password que mudei', /última password que mudaste foi a de Portal das Finanças/],
  // cartões
  ['quando expira o cartao da revolut', /Revolut[\s\S]*válido até 03\/27/],
  ['que cartoes tenho', /Tens 2 cartões[\s\S]*CGD Visa[\s\S]*Revolut/],
  ['qual o cvv do visa', /CVV do cartão CGD/],
  ['tenho cartão do lidl?', /não tens Lidl guardado/],
  // documentos e faturas
  ['onde está o meu cartao de cidadao', /Abri o documento Cartão de Cidadão/],
  ['mostra os documentos pessoais', /Documentos pessoais \(2\)/],
  ['tenho a escritura da casa?', /Escritura da casa/],
  ['vou viajar, o passaporte está em dia?', /Passaporte expirou/],
  ['when does my passport expire', /Passaporte expired/],
  ['quanto foi a ultima conta da luz', /EDP[\s\S]*52,10/],
  ['faturas deste mês', /Faturas este mês \(1[\s\S]*MEO/],
  ['que faturas tenho por pagar', /por pagar \(1[\s\S]*EDP[\s\S]*pagar até/],
  ['what bills do i have to pay', /unpaid[\s\S]*EDP/],
  // notas
  ['procura bacalhau nas notas', /Ideias para o jantar/],
  // info
  ['quando faço anos', /17 de maio[\s\S]*faltam/],
  ['vou ao médico, qual o meu número de utente?', /987654321/],
  // subscrições
  ['qual a subscricao mais cara', /mais cara é Disney Plus/],
  ['a netflix cobra quanto?', /Netflix não está nas tuas subscrições/],
  // veículos e bens
  ['quando acaba o seguro', /Seguro[\s\S]*Golf/],
  ['vou abastecer, quanto gastei da última vez?', /Último abastecimento do Golf[\s\S]*62,00/],
  ['onde comprei a tv', /Worten/],
  ['qual a chave do office', /XXXXX-YYYYY-ZZZZZ/],
  ['quando é o aniversário da mãe', /Aniversário da Mãe[\s\S]*em 12 dias/],
  ['tudo sobre o golf', /Tudo o que tens sobre golf/],
  // «como faço…» e segurança
  ['como adiciono uma password', /Toca em ＋/],
  ['como funciona o 2fa', /segundo código/],
  ['como importo passwords do chrome', /CSV[\s\S]*Importar/],
  ['o meu cofre está seguro?', /AES-256/],
  ['onde ficam guardados os meus dados', /no teu dispositivo/],
  ['is my vault safe', /AES-256/],
  ['how do i import passwords', /Import/],
  // conversa
  ['como estás', /obrigada/],
  ['quem és tu', /Sou a Aurora/],
  ['não percebi', /Sem problema/],
  ['alguma coisa urgente?', /coisas para tratar/],
  ['modo escuro', /Temas escuros/],
  ['codigos de autenticacao', /códigos 2FA/],
  ['abre a aba das garantias', /Garantias/],
  ['lembra-me amanhã de ligar ao banco', /Vou agendar[\s\S]*Ligar ao banco/],
];

test.describe('Aurora percebe o dia a dia', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
    await page.evaluate(() => { window.avAuth = () => new Promise(() => {}); window.openReadMode = () => {}; auroraOpen(); });
  });

  const ask = (page, cases) => page.evaluate(async cases => {
    const out = [];
    for (const [q, reSrc] of cases) {
      const box = document.getElementById('aurora-msgs'), before = box.children.length;
      AUR.pending = null; aurQuick(q);
      await new Promise(r => setTimeout(r, 30));
      document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
      const txt = [...box.children].slice(before + 1).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ ');
      if (!new RegExp(reSrc).test(txt)) out.push(q + '  →  ' + txt.slice(0, 160));
    }
    return out;
  }, cases.map(([q, re]) => [q, re.source]));

  test(`${CASES.length} pedidos do dia a dia`, async ({ page }) => {
    expect(await ask(page, CASES)).toEqual([]);
  });

  test('ações numa frase: nota, favorito, duplicar, pasta, subscrição, email de outra pessoa', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const say = async q => { AUR.pending = null; aurQuick(q); await new Promise(r => setTimeout(r, 30)); };
      await say('cria uma nota a dizer comprar pão');
      await say('põe o gmail nos favoritos');
      await say('duplica a entrada do facebook');
      await say('move o netflix para a pasta entretenimento'); aurYes();
      await say('adiciona a subscrição da hbo por 9,99 por mês'); aurYes();
      await say('cancela o spotify'); aurYes();
      await say('adiciona o email da ana: ana@mail.pt'); aurYes();
      await say('renomeia o santander para Santander Particulares'); aurYes();
      const folder = vaultFolders.find(f => f.name === 'Entretenimento');
      return {
        note: notes.some(n => n.title === 'Comprar pão'),
        fav: vault.find(v => v.id === 'g').fav,
        dup: vault.some(v => v.name === 'Facebook (cópia)'),
        moved: !!folder && vault.find(v => v.id === 'n').folderId === folder.id,
        hbo: subscriptions.find(s => s.name === 'HBO')?.amount,
        spotify: subscriptions.some(s => s.name === 'Spotify'),
        email: personalInfo.find(p => p.id === 'p2').fields.find(f => f.label === 'Email')?.value,
        renamed: vault.find(v => v.id === 's').name,
        vaultCount: vault.length,
      };
    });
    expect(r).toEqual({ note: true, fav: true, dup: true, moved: true, hbo: 9.99, spotify: false, email: 'ana@mail.pt', renamed: 'Santander Particulares', vaultCount: 7 });
  });

  test('frases perigosas não criam nem apagam nada', async ({ page }) => {
    const before = await page.evaluate(() => vault.length);
    const r = await page.evaluate(async () => {
      for (const q of ['tenho a password do instagram guardada?', 'como adiciono uma password', 'cria uma password com 12 letras', 'põe o gmail nos favoritos', 'n me lembro da password do facebook']) {
        AUR.pending = null; aurQuick(q); await new Promise(r => setTimeout(r, 30));
      }
      return { n: vault.length, pending: !!AUR.pending, dates: assets.filter(a => a.kind === 'dates').length };
    });
    expect(r).toEqual({ n: before, pending: false, dates: 1 });
  });
});
