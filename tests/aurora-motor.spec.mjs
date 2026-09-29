import { test, expect, openApp, createVault } from './fixtures.mjs';

// Motor da Aurora: etapas e intenções bem definidas, e cada frase vai parar à intenção certa.
// Se uma regra nova desviar uma frase antiga, este teste diz qual e para onde foi.
const SEED = () => {
  const day = 864e5, iso = d => new Date(Date.now() + d * day).toISOString().slice(0, 10);
  vault.push({ id: 'g', name: 'Gmail', cat: 'email', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY', url: 'gmail.com', createdAt: Date.now() - 800 * day },
    { id: 'n', name: 'Netflix', cat: 'social', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY', url: 'netflix.com' },
    { id: 's', name: 'Santander', cat: 'banco', user: '123456', pw: '1234', url: 'santander.pt' },
    { id: 'f', name: 'Facebook', cat: 'social', user: 'carlitos', pw: 'fb-pass-99!Zq', url: 'facebook.com' },
    { id: 'r', name: 'Revolut', cat: 'banco', user: '+351912345678', pw: 'Rv!2025-xyzQ', url: 'revolut.com' },
    { id: 'w', name: 'Intranet Empresa', cat: 'outro', user: 'c.silva', pw: 'Tr@b-2026-xyz' },
    { id: 'fin', name: 'Portal das Finanças', cat: 'outro', user: '123456789', pw: 'Fin#2026abc!', url: 'portaldasfinancas.gov.pt' });
  documents.push({ id: 'd', title: 'Cartão de Cidadão', cat: 'pessoal', expiry: iso(20) }, { id: 'd2', title: 'Escritura da casa', cat: 'casa' },
    { id: 'd3', title: 'Carta de condução', cat: 'pessoal', expiry: iso(400) }, { id: 'd4', title: 'Passaporte', cat: 'pessoal', expiry: iso(-5) },
    { id: 'e1', title: 'Fatura EDP agosto', cat: 'casa', text: 'EDP Comercial Fatura Total a pagar 52,10 EUR', facts: { kind: 'fatura', entity: 'EDP', total: 52.1, issueDate: iso(-30), dueDate: iso(3) }, textAt: 1, factsV: AV_FACTS_V },
    { id: 'e2', title: 'Fatura MEO setembro', cat: 'casa', text: 'MEO fatura internet fibra total 39,99', facts: { kind: 'fatura', entity: 'MEO', total: 39.99, issueDate: iso(-5) }, textAt: 1, factsV: AV_FACTS_V });
  bankCards.push({ id: 'b', bank: 'CGD', name: 'CGD Visa', number: '4111111111111111', expiry: '12/28', pin: '4321', cvv: '987' }, { id: 'b2', bank: 'Revolut', number: '5555555555554444', expiry: '03/27', pin: '1111', cvv: '123' });
  storeCards.push({ id: 'sc', name: 'Continente', number: '2600000012345' }, { id: 'sc2', name: 'Pingo Doce', number: '9990001112223' });
  notes.push({ id: 'no', title: 'Ideias para o jantar', body: 'bacalhau com natas' }, { id: 'no2', title: 'Código do portão', body: '4455#' });
  subscriptions.push({ id: 'u1', name: 'Spotify', amount: 7.99, cycle: 'monthly', renewDay: '9' }, { id: 'u2', name: 'Disney Plus', amount: 13.99, cycle: 'monthly', renewDay: '3' }, { id: 'u3', name: 'Amazon Prime', amount: 49.9, cycle: 'yearly', renewDay: '15' });
  assets.push({ id: 'v', kind: 'vehicle', name: 'Golf', plate: '12-AB-34', inspection: iso(34), insurance: iso(167), fuel: [{ id: 'q', date: iso(-40), liters: 40, euros: 70, km: 120000 }, { id: 'q2', date: iso(-10), liters: 35, euros: 62, km: 120600 }] },
    { id: 'wt', kind: 'warranty', name: 'TV Samsung', buyDate: iso(-2 * 365 + 25), years: 2, store: 'Worten', price: '599' },
    { id: 'li', kind: 'license', name: 'Microsoft Office', key: 'XXXXX-YYYYY-ZZZZZ' },
    { id: 'dt', kind: 'dates', name: 'Aniversário da Mãe', date: iso(12), yearly: true });
  wifiNets.push({ id: 'wn', name: 'Casa', ssid: 'MEO-1234', pw: 'wifi-pass', sec: 'WPA' }, { id: 'wn2', name: 'Escritório', ssid: 'NOS-Office', pw: 'office-2026', sec: 'WPA' });
  totp.push({ id: 't', name: 'GitHub', secret: 'JBSWY3DPEHPK3PXP', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1' }, { id: 't2', name: 'Binance', secret: 'JBSWY3DPEHPK3PXQ', type: 'totp', digits: 6, period: 30, algorithm: 'SHA1' });
  personalInfo.push({ id: 'p', name: 'Carlos Silva', fields: [{ id: 'f1', label: 'NIF', value: '123456789' }, { id: 'f2', label: 'IBAN', value: 'PT50000000000000000000000' }, { id: 'f3', label: 'Nº Utente', value: '987654321' }, { id: 'f4', label: 'Telemóvel', value: '912345678' }, { id: 'f5', label: 'Morada', value: 'Rua das Flores 10, Lisboa' }, { id: 'f6', label: 'Data de nascimento', value: '1990-05-17' }, { id: 'f7', label: 'Nº Segurança Social', value: '11223344556' }] },
    { id: 'p2', name: 'Ana Silva', fields: [{ id: 'a1', label: 'NIF', value: '987654321' }, { id: 'a2', label: 'Telemóvel', value: '934567890' }] });
  vaultName = 'Carlos';
  avDocRefreshFacts();   // o que o cofre faz 4 s depois de abrir, feito já (não depende da velocidade da máquina)
  renderAll();
};

// [frase, quem tem de responder] — AUR.trace: nome da intenção, «core:função» do motor base, «stage:etapa» ou «find:…»
const ROUTES = [
  ["preciso de entrar no gmail", "core:aurOpenEnt"],
  ["como entro no netflix", "core:aurOpenEnt"],
  ["qual e a pass do face", "core:aurOpenEnt"],
  ["esqueci-me da senha do revolut", "core:aurOpenEnt"],
  ["manda-me a password do banco", "conta.categoria"],
  ["mostra a senha das finanças", "core:aurOpenEnt"],
  ["password das financas", "core:aurOpenEnt"],
  ["qual o login das finanças", "core:aurOpenEnt"],
  ["qual o meu user do facebook", "core:aurOpenEnt"],
  ["com que email entro no netflix", "core:aurOpenEnt"],
  ["que email uso no spotify", "core:aurOpenEnt"],
  ["tenho conta na amazon?", "tenho.guardado"],
  ["tenho a password do instagram guardada?", "tenho.guardado"],
  ["onde tenho a password do revolut", "core:aurOpenEnt"],
  ["copia-me o utilizador do gmail", "core:aurCopyCmd"],
  ["cola a password do gmail", "core:aurOpenEnt"],
  ["dá-me a pass do wifi", "core:aurWifi"],
  ["qual a password da net", "core:aurWifi"],
  ["password do router", "core:aurWifi"],
  ["qual a rede wifi do escritorio", "core:aurOpenEnt"],
  ["gera-me uma password", "password.gerarAuditar"],
  ["preciso de uma password nova", "password.gerarAuditar"],
  ["inventa uma password segura", "password.gerarAuditar"],
  ["cria uma password com 12 letras", "password.gerarAuditar"],
  ["password facil de decorar", "core:aurGenerate"],
  ["muda a senha do facebook", "core:aurChangePw"],
  ["troca a password do netflix", "core:aurChangePw"],
  ["atualiza a password do santander para Abc123!xyz", "core:aurChangePw"],
  ["apaga a conta do facebook", "core:aurDelete"],
  ["elimina o netflix", "core:aurDelete"],
  ["quantas contas tenho no cofre", "core:aurCount"],
  ["quais sao as minhas contas de banco", "conta.categoria"],
  ["lista as minhas contas sociais", "conta.categoria"],
  ["mostra as contas de email", "conta.categoria"],
  ["tenho alguma password fraca", "core:aurAudit"],
  ["as minhas passwords são seguras?", "password.gerarAuditar"],
  ["qual é a password mais fraca", "core:aurAudit"],
  ["qual a pontuação de segurança", "core:aurAudit"],
  ["tenho contas com a mesma password?", "password.gerarAuditar"],
  ["alguma conta foi comprometida?", "seguranca.fuga"],
  ["qual o numero do cartao da cgd", "core:aurOpenEnt"],
  ["qual o pin da revolut", "cartao.segredo"],
  ["qual o pin do multibanco", "cartao.segredo"],
  ["quando expira o cartao da revolut", "cartao.validadeLista"],
  ["que cartoes tenho", "cartao.validadeLista"],
  ["os meus cartoes de credito", "cartao.validadeLista"],
  ["qual o cvv do visa", "cartao.segredo"],
  ["numero do cartao continente", "core:aurOpenEnt"],
  ["mostra o cartão do pingo doce", "core:aurOpenEnt"],
  ["codigo de barras do continente", "core:aurOpenEnt"],
  ["tenho cartão do lidl?", "tenho.guardado"],
  ["cartões que expiram este ano", "core:aurExpiry"],
  ["onde está o meu cartao de cidadao", "docs.pessoais"],
  ["quando caduca o passaporte", "core:aurExpiry"],
  ["o passaporte está válido?", "core:aurExpiry"],
  ["o que já expirou", "core:aurExpiry"],
  ["documentos expirados", "core:aurExpiry"],
  ["quando tenho de renovar a carta de conducao", "core:aurExpiry"],
  ["abre a escritura", "core:aurOpenEnt"],
  ["mostra os documentos pessoais", "docs.pessoais"],
  ["tenho a escritura da casa?", "tenho.guardado"],
  ["quanto foi a ultima conta da luz", "docs.dados"],
  ["quanto pago de internet", "docs.dados"],
  ["quando tenho de pagar a edp", "docs.dados"],
  ["quanto paguei à meo", "docs.dados"],
  ["faturas deste mês", "faturas.lista"],
  ["quanto gastei em faturas este mês", "docs.dados"],
  ["que faturas tenho por pagar", "faturas.lista"],
  ["adiciona um documento", "core:aurAdd"],
  ["digitaliza um documento", "core:aurAdd"],
  ["codigo do github", "core:aur2fa"],
  ["dá-me o código de verificação da binance", "core:aur2fa"],
  ["preciso do 2fa do github", "core:aur2fa"],
  ["codigos de autenticacao", "core:aur2fa"],
  ["adiciona um codigo 2fa", "core:aur2fa"],
  ["abre a nota do jantar", "core:aurOpenEnt"],
  ["qual é o código do portão", "core:aur2fa"],
  ["mostra as minhas notas", "core:aurGoTab"],
  ["cria uma nota a dizer comprar pão", "notas.rapida"],
  ["escreve uma nota: ligar ao canalizador", "notas.rapida"],
  ["procura bacalhau nas notas", "find:hits"],
  ["qual a minha morada", "core:aurInfo"],
  ["qual o meu telemovel", "core:aurInfo"],
  ["qual o numero de telefone da ana", "core:aurInfo"],
  ["qual o nif da ana", "core:aurInfo"],
  ["quando faço anos", "info.anosEmail"],
  ["qual a minha data de nascimento", "core:aurInfo"],
  ["qual o meu numero da seguranca social", "core:aurInfo"],
  ["dados da ana", "core:aurInfo"],
  ["muda o meu telemóvel para 919999999", "core:aurInfoSet"],
  ["adiciona o email da ana: ana@mail.pt", "info.anosEmail"],
  ["quanto pago de spotify", "core:aurSubs"],
  ["quais as minhas subscrições", "core:aurSubs"],
  ["quanto gasto por ano em subscrições", "core:aurSubs"],
  ["qual a subscricao mais cara", "subs.acoes"],
  ["quando renova o disney", "core:aurExpiry"],
  ["cancela o disney plus", "subs.acoes"],
  ["adiciona a subscrição da hbo por 9,99 por mês", "subs.acoes"],
  ["quando tenho de levar o carro à inspeção", "veiculo.datas"],
  ["quanto gasto de gasolina por mês", "core:aurFuel"],
  ["qual o consumo do golf", "core:aurFuel"],
  ["qual a matricula do carro", "core:aurInfo"],
  ["quando acaba o seguro", "veiculo.datas"],
  ["adiciona um abastecimento de 50 euros", "bens.detalhes"],
  ["a garantia da tv ainda está válida?", "core:aurExpiry"],
  ["onde comprei a tv", "bens.detalhes"],
  ["qual a chave do office", "bens.detalhes"],
  ["quando é o aniversário da mãe", "bens.detalhes"],
  ["lembra-me de pagar o IMI em novembro", "core:aurSchedule"],
  ["lembra-me amanhã de ligar ao banco", "core:aurSchedule"],
  ["o que tenho esta semana", "core:aurCal"],
  ["o que tenho amanhã", "core:aurCal"],
  ["próximos eventos", "core:aurCal"],
  ["mostra o calendário", "core:aurCal"],
  ["muda a palavra-passe mestra", "core:aurSettings"],
  ["ativa a biometria", "core:aurSettings"],
  ["bloqueia o cofre", "core"],
  ["grava tudo", "core"],
  ["faz uma copia de seguranca", "core"],
  ["exporta as passwords", "core:aurExport"],
  ["muda o tema para escuro", "core:aurTheme"],
  ["põe o tema rosa", "core:aurTheme"],
  ["modo escuro", "core:aurTheme"],
  ["esconde as passwords", "core:aurPriv"],
  ["muda a lingua para ingles", "core:aurLang"],
  ["onde está a reciclagem", "core:aurGoTab"],
  ["esvazia o lixo", "core:aurEmptyTrash"],
  ["recupera o facebook", "core:aurRestore"],
  ["arquiva o santander", "core:aurArchive"],
  ["ola aurora", "core:aurSmall"],
  ["bom dia", "core:aurSmall"],
  ["como estás", "conversa.social"],
  ["quem és tu", "conversa.social"],
  ["o que és", "conversa.social"],
  ["obrigado aurora", "core:aurSmall"],
  ["és fixe", "conversa.social"],
  ["ajuda-me", "help"],
  ["não percebi", "conversa.social"],
  ["estou perdido", "conversa.social"],
  ["como adiciono uma password", "ajuda.comoFazer"],
  ["como funciona o 2fa", "ajuda.comoFazer"],
  ["como partilho o wifi", "ajuda.comoFazer"],
  ["como importo passwords do chrome", "ajuda.comoFazer"],
  ["o meu cofre está seguro?", "ajuda.comoFazer"],
  ["onde ficam guardados os meus dados", "ajuda.comoFazer"],
  ["qual a pasword do gmial", "core:aurOpenEnt"],
  ["paswword do netflx", "core:aurOpenEnt"],
  ["qual o pim do cartao da cgd", "cartao.segredo"],
  ["codgo do github", "core:aur2fa"],
  ["qnd expira o cc", "core:aurExpiry"],
  ["qd e a inspecao do carro", "veiculo.datas"],
  ["qto gasto em subscricoes", "core:aurSubs"],
  ["q documentos tenho", "core:aurGoTab"],
  ["mostra-me tudo o que tenho sobre o carro", "tudo.sobre"],
  ["tudo sobre o golf", "tudo.sobre"],
  ["ajuda-me a encontrar a password do banco", "conta.categoria"],
  ["n me lembro da password do facebook", "core:aurOpenEnt"],
  ["pf da-me o nif", "core:aurInfo"],
  ["diz me o iban pf", "core:aurInfo"],
  ["bora ver os codigos", "core:aur2fa"],
  ["preciso de ligar ao santander, qual o numero?", "core:aurOpenEnt"],
  ["vou ao médico, qual o meu número de utente?", "core:aurInfo"],
  ["vou abastecer, quanto gastei da última vez?", "combustivel.ultimo"],
  ["estou no multibanco, qual o pin da cgd?", "cartao.segredo"],
  ["vou às compras ao continente", "core:aurOpenEnt"],
  ["vou viajar, o passaporte está em dia?", "core:aurExpiry"],
  ["o meu carro precisa de inspeção?", "veiculo.datas"],
  ["quando pago a próxima fatura da luz?", "docs.dados"],
  ["a netflix cobra quanto?", "conta.favDupPasta"],
  ["tenho de renovar alguma coisa?", "core:aurExpiry"],
  ["há algo a expirar?", "core:aurExpiry"],
  ["alguma coisa urgente?", "stage:avisos"],
  ["o que vence este mês", "core:aurExpiry"],
  ["estou a pagar muito em subscrições?", "core:aurSubs"],
  ["quanto gasto por mês no total", "gastos"],
  ["show me my gmail password", "core:aurOpenEnt"],
  ["what's the wifi password", "core:aurWifi"],
  ["when does my passport expire", "core:aurExpiry"],
  ["how much do i pay for spotify", "core:aurSubs"],
  ["what bills do i have to pay", "faturas.lista"],
  ["copy my iban", "core:aurCopyCmd"],
  ["add a note: buy milk", "notas.rapida"],
  ["what's my phone number", "core:aurInfo"],
  ["open my documents", "core:aurGoTab"],
  ["lock the app", "core"],
  ["which cards do i have", "cartao.validadeLista"],
  ["is my vault safe", "ajuda.comoFazer"],
  ["how do i import passwords", "ajuda.comoFazer"],
  ["põe o gmail nos favoritos", "conta.favDupPasta"],
  ["renomeia o netflix para Netflix Família", "core:aurRename"],
  ["muda o utilizador do facebook para carlos.silva", "core:aurChangeUser"],
  ["partilha a password do wifi de casa", "core:aurOpenEnt"],
  ["apaga a nota do jantar", "core:aurDelete"],
  ["duplica a entrada do gmail", "conta.favDupPasta"],
  ["move o netflix para a pasta entretenimento", "conta.favDupPasta"],
  ["abre as definições", "core:aurSettings"],
  ["abre a aba das garantias", "abas"],
  ["quantas notas tenho", "core:aurCount"],
  ["quantos documentos tenho", "core:aurCount"],
  ["qual foi a última password que mudei", "historico"],
  ["o que mudei hoje", "historico"],
  ["qual a password da rede de casa", "core:aurOpenEnt"],
  ["a password do wifi do escritório", "core:aurOpenEnt"],
  ["qual o nome da rede de casa", "diversos"],
  ["mostra o qr da rede de casa", "core:aurOpenEnt"],
  ["copia a password do wifi de casa", "core:aurCopyCmd"],
  ["quantas redes wifi tenho", "core:aurCount"],
  ["adiciona uma rede wifi", "core:aurAdd"],
  ["apaga a rede do escritório", "core:aurDelete"],
  ["mostra todos os códigos 2fa", "core:aur2fa"],
  ["copia o código da binance", "core:aur2fa"],
  ["quanto tempo falta para o código do github mudar", "diversos"],
  ["apaga o 2fa da binance", "core:aur2fa"],
  ["quantos códigos 2fa tenho", "core:aur2fa"],
  ["tenho 2fa no gmail?", "tenho.guardado"],
  ["o que está no arquivo", "core:aurGoTab"],
  ["mostra o arquivo", "core:aurGoTab"],
  ["o que apaguei", "historico"],
  ["mostra a reciclagem", "core:aurGoTab"],
  ["recupera o facebook", "core:aurRestore"],
  ["restaura tudo da reciclagem", "diversos"],
  ["arquiva a nota do jantar", "core:aurArchive"],
  ["tira o santander do arquivo", "core:aurRestore"],
  ["muda o idioma para português", "core:aurLang"],
  ["ativa o bloqueio automático", "diversos"],
  ["bloqueia depois de 5 minutos", "diversos"],
  ["desativa o modo privado", "core:aurPriv"],
  ["mostra as passwords", "core:aurGoTab"],
  ["abre as definições de segurança", "core:aurSettings"],
  ["sincroniza com o drive", "core"],
  ["liga o google drive", "core"],
  ["qual a versão da app", "diversos"],
  ["lê-me a nota do jantar", "diversos"],
  ["o que diz a nota do portão", "diversos"],
  ["edita a nota do jantar", "core:aurOpenEnt"],
  ["acrescenta à nota do jantar: comprar vinho", "diversos"],
  ["arquiva a nota do portão", "core:aurArchive"],
  ["quantas palavras tem a nota do jantar", "core:aurCount"],
  ["quanto tempo tenho o gmail", "diversos"],
  ["quando criei a conta do netflix", "diversos"],
  ["quantas contas de banco tenho", "diversos"],
  ["qual a conta mais recente", "diversos"],
  ["qual a password mais antiga", "seguranca.antigas"],
  ["mostra os favoritos", "diversos"],
  ["o gmail é favorito?", "diversos"],
  ["que sites tenho guardados", "diversos"],
  ["qual o site do santander", "diversos"],
  ["abre o site do revolut", "diversos"],
];

test.describe('Motor da Aurora', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(SEED);
    await page.evaluate(() => {
      window.avAuth = () => new Promise(() => {}); window.openReadMode = () => {};
      for (const f of ['lockApp', 'downloadBackupNow', 'saveFile', 'driveSyncNow', 'avGoSite', 'setLang', 'avTourStart']) window[f] = () => {};
      auroraOpen();
    });
  });

  test('etapas por ordem e intenções com nome único e prioridade', async ({ page }) => {
    const r = await page.evaluate(() => ({
      stages: AUR_STAGES.map(s => s.name),
      unique: new Set(AUR_INTENTS.map(i => i.name)).size === AUR_INTENTS.length,
      sorted: AUR_INTENTS.every((it, i, a) => !i || a[i - 1].prio <= it.prio),
      n: AUR_INTENTS.length,
    }));
    expect(r.stages).toEqual(['aprender', 'desfazer', 'avisos', 'conversa', 'alcunhas', 'ficheiros-tutorial']);
    expect(r.unique && r.sorted).toBe(true);
    expect(r.n).toBeGreaterThan(25);
  });

  test(`${ROUTES.length} frases vão parar à intenção certa`, async ({ page }) => {
    test.setTimeout(120_000);
    const wrong = await page.evaluate(async routes => {
      const snap = auruSnap('base'), out = [];
      for (const [q, want] of routes) {
        for (const k of Object.keys(snap.C)) AURU_COLS[k][1](snap.C[k].map(auruClone));
        AUR.pending = null; AURC.ctx = null; AURC.chips = null; AUR.last = null; AURU.stack = []; payloadExtras.aurMem = {};
        document.querySelectorAll('.modal-overlay.open,#read-modal.open').forEach(o => o.classList.remove('open'));
        aurQuick(q); await new Promise(r => setTimeout(r, 5));
        if (AUR.trace !== want) out.push(q + '  →  ' + AUR.trace + '  (esperado ' + want + ')');
      }
      return out;
    }, ROUTES);
    expect(wrong).toEqual([]);
  });

  test('o índice do cofre é guardado e só é refeito quando os dados mudam', async ({ page }) => {
    const r = await page.evaluate(() => {
      const a = aurIndex(); aurFrame('qual a password do gmail'); aurQuick('qual o meu nif');
      const same = aurIndex() === a;
      vault.push({ id: 'z', name: 'Zeta Novo', pw: 'x' });
      const grew = aurIndex() !== a && aurIndex().some(e => e.name === 'Zeta Novo');
      const b = aurIndex(); vault.find(v => v.id === 'z').name = 'Zeta Renomeado'; markUnsaved();
      const renamed = aurIndex() !== b && aurIndex().some(e => e.name === 'Zeta Renomeado');
      return { same, grew, renamed };
    });
    expect(r).toEqual({ same: true, grew: true, renamed: true });
  });
});
