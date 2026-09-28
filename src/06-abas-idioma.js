// ══ TABS ══
// ══ GRUPOS DE ABAS ══
const TAB_GROUPS={
  dashboard:['dashboard'],
  cofre:['vault','totp'],
  cards:['cards','store'],
  docs:['docs','notes','info'],
  bens:['warranty','license','vehicle','dates'],
  archive:['archive','trash']
};
let currentGroup='dashboard';
const lastLeafOf={dashboard:'dashboard',cofre:'vault',cards:'cards',docs:'docs',bens:'warranty',archive:'archive'};
function groupOfTab(tab){
  for(const g in TAB_GROUPS)if(TAB_GROUPS[g].includes(tab))return g;
  return 'dashboard';
}
let pendingGo=null;
try{const _u=new URLSearchParams(location.search);const _g=_u.get('go');if(_g)pendingGo=_g;}catch(e){}
function applyPendingGo(){
  if(!pendingGo)return;
  const g=pendingGo;pendingGo=null;
  setTimeout(()=>{
    try{
      if(g==='cal'){if(typeof openCalendar==='function')openCalendar();}
      else if(g==='add'){if(typeof avAddMenu==='function')avAddMenu();}
      else if(g==='note'){if(typeof avAddType==='function')avAddType('note');}
      else if(g==='share'){if(typeof avShareImport==='function')avShareImport();}
      else if(g==='search'){const si=document.getElementById('search-input');if(window.matchMedia&&matchMedia('(max-width:768px)').matches&&typeof tbToggleSearch==='function')tbToggleSearch();else if(si)si.focus();}
      else if(['vault','totp','store','cards','docs','notes','info','warranty','license','vehicle','dates'].includes(g))switchTab(g);
    }catch(e){}
  },700);
}
function switchGroup(g){
  if(!TAB_GROUPS[g])return;
  switchTab(lastLeafOf[g]||TAB_GROUPS[g][0]);
}
function renderTabNav(tab){
  const g=groupOfTab(tab);
  currentGroup=g;lastLeafOf[g]=tab;
  for(const gg in TAB_GROUPS){
    const gb=document.getElementById('grp-btn-'+gg);
    if(gb)gb.classList.toggle('active',gg===g);
  }
  const leaves=TAB_GROUPS[g];
  const bar=document.getElementById('subtabs');
  if(bar)bar.style.display=leaves.length>1?'flex':'none';
  ['dashboard','vault','notes','cards','store','info','archive','docs','totp','trash','warranty','license','vehicle','dates'].forEach(id=>{
    const b=document.getElementById('tab-btn-'+id);
    if(b){b.style.display=leaves.includes(id)?'':'none';b.classList.toggle('active',id===tab);}
  });
}
function switchTab(tab){
  ['dashboard','vault','notes','cards','store','info','archive','docs','totp','trash','warranty','license','vehicle','dates'].forEach(id=>{
    const tabEl=document.getElementById('tab-'+id);
    if(tabEl)tabEl.classList.remove('active');
  });
  {const nt=document.getElementById('tab-'+tab);if(nt)void nt.offsetHeight;} // 1 só recálculo (reinicia a animação de entrada)
  renderTabNav(tab);
  const active=document.getElementById('tab-'+tab);
  if(active)active.classList.add('active');
  if(tab==='dashboard')avOnce('dashboard',()=>renderDashboard());
  if(tab==='archive')avOnce('archive',()=>renderArchive());
  if(tab==='notes')avOnce('notes',()=>renderNotesList());
  if(tab==='cards')avOnce('cards',()=>renderBankCards());
  if(tab==='docs')avOnce('docs',()=>renderDocs());
  if(tab==='trash')avOnce('trash',()=>renderTrash());
  if(tab==='totp')renderTotp();
  if(tab==='info')avOnce('info',()=>renderInfo());
  if(tab==='store')avOnce('store',()=>renderStoreCards());
  if(['warranty','license','vehicle','dates'].includes(tab))avOnce(tab,renderAssets,tab);
  requestAnimationFrame(positionTabIndicator);
  requestAnimationFrame(applyStagger);
}

// ══ LANGUAGE ══
function setLang(lang){
  currentLang=lang;
  ['lang-pt','lang-pt-lock'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.toggle('active',lang==='pt');});
  ['lang-en','lang-en-lock'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.toggle('active',lang==='en');});
  document.documentElement.lang=lang;
  applyLangStatic();
  if(vault.length>=0){renderAll();}
}
// Atributos (textos de ajuda, títulos, nomes para leitores de ecrã) que ficavam em português com a app em inglês
const AV_LANG_ATTRS=[
  ['#search-input','placeholder','Pesquisar em tudo...','Search everything...'],
  ['#tb-more-btn','title','Mais opções','More options'],['#tb-more-btn','aria-label','Mais opções','More options'],
  ['#vault-newfolder-btn','title','Nova pasta','New folder'],['#vault-newfolder-btn','aria-label','Nova pasta','New folder'],
  ['.docview-close','title','Fechar','Close'],
  ['#doc-desc','placeholder','Sobre o que é, onde foi emitido, notas importantes...','What it is, where it was issued, important notes...'],
  ['#tf-account','placeholder','ex: carlos@gmail.com','e.g. carlos@gmail.com'],
  ['#tf-recovery','placeholder','Cola aqui os códigos de recuperação que o serviço te deu (um por linha)','Paste the recovery codes the service gave you (one per line)'],
  ['.tb-lock-btn','aria-label','Bloquear','Lock'],['#sort-select,#doc-sort','aria-label','Ordenar','Sort'],['.sidebar','aria-label','Categorias','Categories'],
  ['#picker-bg','aria-label','Cor de fundo','Background colour'],['#picker-accent','aria-label','Cor de destaque','Accent colour'],['#picker-text','aria-label','Cor do texto','Text colour'],
  ['#catmgr-color','aria-label','Cor da categoria','Category colour'],['#csv-input-app','aria-label','Importar ficheiro CSV','Import CSV file'],
  ['#card-overlay .btn-ghost[data-act="closeCardModal"]','text','Cancelar','Cancel'],
  ['#clipboard-toast-txt','text','Copiado — apaga em','Copied — clears in'],['.lk-eye','aria-label','Mostrar','Show']];
function avLangAttrs(){
  const en=currentLang==='en';
  AV_LANG_ATTRS.forEach(([sel,a,pt,enT])=>document.querySelectorAll(sel).forEach(el=>{if(a==='text')el.textContent=en?enT:pt;else el.setAttribute(a,en?enT:pt);}));
  if(typeof avA11yRelabel==='function')avA11yRelabel();
}
function applyLangStatic(){
  avLangAttrs();
  const s=(id,key)=>{const el=document.getElementById(id);if(el)el.textContent=t(key);};
  const h=(id,key)=>{const el=document.getElementById(id);if(el)el.innerHTML=t(key);};
  s('l-sub','sub');
  renderSub2();
  const b2fa=document.getElementById('l-badge-2fa');if(b2fa)b2fa.textContent=currentLang==='en'?'Built-in 2FA':'2FA Integrado';
  const osub=document.getElementById('l-btn-open-sub');if(osub)osub.textContent=currentLang==='en'?'I already have a .vault file':'Já tenho um ficheiro .vault';
  const nsub=document.getElementById('l-btn-new-sub');if(nsub)nsub.textContent=currentLang==='en'?'Start fresh — free and offline':'Começar do zero — grátis e offline';
  const pit=document.getElementById('pwa-install-txt');if(pit)pit.textContent=currentLang==='en'?'Install as app':'Instalar como app';
  const lct=document.getElementById('l-continue-title');if(lct)lct.textContent=currentLang==='en'?'Continue':'Continuar';
  const ldt=document.getElementById('l-demo-txt');if(ldt)ldt.textContent=currentLang==='en'?'View demo':'Ver demonstração';
  // ── Novo login 2 colunas ──
  {const en3=currentLang==='en';
   const t2=(id,txt)=>{const e=document.getElementById(id);if(e)e.textContent=txt;};
   t2('lnav-home',en3?'Home':'Início');
   t2('lnav-como',en3?'How to use':'Como usar');
   t2('lnav-seg',en3?'Security':'Segurança');
   t2('lnav-sobre',en3?'About':'Sobre');
   t2('lnav-offline',en3?'100% Offline':'100% Offline');
   t2('l-hero-eyebrow',en3?'◆ Encrypted · 100% Offline':'◆ Encriptado · 100% Offline');
   t2('l-hero-desc',en3?'Store passwords, documents, notes and cards with military-grade encryption. Everything stays on this device — never in the cloud, never on servers.':'Guarda passwords, documentos, notas e cartões com encriptação de nível militar. Tudo fica neste dispositivo — nunca na nuvem, nunca em servidores.');
   t2('l-hero-s1',en3?'Encryption':'Encriptação');
   t2('l-hero-s2',en3?'Offline':'Offline');
   t2('l-hero-s3',en3?'Servers':'Servidores');
   try{lockSubText();lockLangExtras();}catch(e){}
   t2('l-sobre-title',en3?'About Aurora Vault':'Sobre o Aurora Vault');
   const pw=document.getElementById('l-panel-welcome');if(pw)pw.innerHTML=(en3?'Welcome':'Bem-vindo')+'<span class="lhero-accent">.</span>';
   const ht=document.getElementById('l-hero-title');if(ht)ht.innerHTML=en3?'Personal Digital<br><span class="lhero-accent">Vault</span>':'Cofre Digital<br><span class="lhero-accent">Pessoal</span>';
   const sp1=document.getElementById('l-sobre-p1');if(sp1)sp1.innerHTML=en3?'<strong>Aurora Vault</strong> is a personal digital vault to keep everything that matters — passwords, documents, notes, cards and more — encrypted and fully under your control.':'O <strong>Aurora Vault</strong> é um cofre digital pessoal para guardares tudo o que é importante — passwords, documentos, notas, cartões e muito mais — encriptado e totalmente sob o teu controlo.';
   const sp2=document.getElementById('l-sobre-p2');if(sp2)sp2.innerHTML=en3?'It works <strong>without internet</strong>, without relying on any company or server. Your data is yours, stays with you, and no one else can touch it.':'Funciona <strong>sem internet</strong>, sem depender de nenhuma empresa ou servidor. Os teus dados são teus, ficam contigo, e ninguém mais lhes toca.';
  }
  h('l-first-use','firstUseInfo');
  // New login flow labels
  const btnOpenTxt=document.getElementById('l-btn-open-txt');if(btnOpenTxt)btnOpenTxt.textContent=currentLang==='en'?'Load vault':'Carregar cofre';
  const btnNewTxt=document.getElementById('l-btn-new-txt');if(btnNewTxt)btnNewTxt.textContent=currentLang==='en'?'Create vault':'Criar cofre';
  const openTitle=document.getElementById('l-open-title');if(openTitle)openTitle.textContent=currentLang==='en'?'Open Existing Vault':'Abrir Cofre Existente';
  const fileHint=document.getElementById('l-file-hint');if(fileHint)fileHint.textContent=currentLang==='en'?'Click to select your .vault file':'Clica para selecionar o ficheiro .vault';
  const fileHint2=document.getElementById('l-file-hint2');if(fileHint2)fileHint2.textContent=currentLang==='en'?'or drag here':'ou arrasta para aqui';
  const fileChosenLbl=document.getElementById('l-file-chosen-label');if(fileChosenLbl)fileChosenLbl.textContent=currentLang==='en'?'File loaded':'Ficheiro carregado';
  const masterLbl=document.getElementById('l-master-label');if(masterLbl)masterLbl.textContent=currentLang==='en'?'Master password':'Palavra-passe mestra';
  const unlockBtn=document.getElementById('l-unlock-btn');if(unlockBtn)unlockBtn.textContent=currentLang==='en'?'🔓 Unlock':'🔓 Desbloquear';
  const changeFile=document.getElementById('l-change-file-btn');if(changeFile)changeFile.textContent=currentLang==='en'?'📂 Other file':'📂 Outro ficheiro';
  const backBtn=document.getElementById('l-back-btn');if(backBtn)backBtn.textContent=currentLang==='en'?'← Back':'← Voltar';
  const backBtn2=document.getElementById('l-back-btn2');if(backBtn2)backBtn2.textContent=currentLang==='en'?'← Back':'← Voltar';
  const newTitle=document.getElementById('l-new-title');if(newTitle)newTitle.textContent=currentLang==='en'?'Create New Vault':'Criar Novo Cofre';
  const nnl=document.getElementById('l-new-name-label');if(nnl)nnl.textContent=currentLang==='en'?'Your name':'O teu nome';
  const nnh=document.getElementById('l-new-name-hint');if(nnh)nnh.textContent=currentLang==='en'?'To greet you when you open the app. Stored only in your vault.':'Para te saudar quando abrires a app. Fica guardado só no teu cofre.';
  const nni=document.getElementById('new-name');if(nni)nni.placeholder=currentLang==='en'?"What's your name?":'Como te chamas?';
  const newPwLbl=document.getElementById('l-new-pw-label');if(newPwLbl)newPwLbl.textContent=currentLang==='en'?'Choose a password':'Escolhe uma palavra-passe';
  const confPwLbl=document.getElementById('l-conf-pw-label');if(confPwLbl)confPwLbl.textContent=currentLang==='en'?'Confirm password':'Confirma a palavra-passe';
  const createBtn=document.getElementById('l-create-btn');if(createBtn)createBtn.textContent=currentLang==='en'?'✦ Create Vault':'✦ Criar Cofre';
  s('l-howto-title','howToTitle');
  s('tab-vault-txt','tabVault');s('tab-notes-txt','tabNotes');s('tab-archive-txt','tabArchive');
  {const gd=document.getElementById('grp-btn-dashboard');if(gd)gd.textContent=t('tabDash');}
  s('tb-new-txt','tbNew');s('tb-import-txt','tbImport');s('tb-save-txt','tbSave');s('tb-pdf-txt','tbPdf');
  const tbCsv=document.getElementById('tb-csv-txt');if(tbCsv)tbCsv.textContent=t('tbCsv');
  const tdocs=document.getElementById('tab-docs-txt');if(tdocs)tdocs.textContent=currentLang==='en'?'Documents':'Documentos';
  const ttrash=document.getElementById('tab-trash-txt');if(ttrash)ttrash.textContent=currentLang==='en'?'Recycle Bin':'Reciclagem';
  s('tb-changepw-txt','tbChangePw');s('tb-lock-txt','tbLock');
  // Modal labels
  document.getElementById('f-name-lbl').textContent=t('fName');document.getElementById('f-name').placeholder=t('fNamePh');
  const fIconLbl=document.getElementById('f-icon-lbl');if(fIconLbl)fIconLbl.textContent=t('fIcon');
  const fIconBtn=document.getElementById('f-icon-btn');if(fIconBtn)fIconBtn.textContent=t('fIconBtn');
  document.getElementById('f-cat-lbl').textContent=t('fCat');
  document.getElementById('f-user-lbl').textContent=t('fUser');document.getElementById('f-user').placeholder=t('fUserPh');
  document.getElementById('f-pw-lbl').textContent=t('fPw');document.getElementById('f-pw').placeholder=t('fPwPh');
  document.getElementById('f-pw-gen-txt').textContent=t('fPwGen');
  document.getElementById('f-url-lbl').textContent=t('fUrl');document.getElementById('f-url').placeholder=t('fUrlPh');
  document.getElementById('f-tags-lbl').innerHTML=`${t('fTags')} <span style="font-size:.5rem;color:var(--text-muted);letter-spacing:1px">(${currentLang==='en'?'Enter or comma to add':'Enter ou vírgula para adicionar'})</span>`;
  document.getElementById('f-attach-lbl').textContent=t('fAttach');
  document.getElementById('f-notes-lbl').textContent=t('fNotes');document.getElementById('f-notes').placeholder=t('fNotesPh');
  document.getElementById('modal-save-btn').textContent=t('btnSave');document.getElementById('modal-cancel-btn').textContent=t('btnCancel');
  document.getElementById('dup-warn').textContent=t('dupWarn');
  const si2=document.getElementById('search-input');if(si2)si2.placeholder=t('search');
  // Sort options
  const so=document.getElementById('sort-select');if(so){so.options[0].text=t('sortFav');so.options[1].text=t('sortName');so.options[2].text=t('sortDate');so.options[3].text=t('sortCat');}
  // Category options
  populateCatSelect();
  // CP modal
  s('cp-title','cpTitle');h('cp-info','cpInfo');s('cp-cur-lbl','cpCur');s('cp-new-lbl','cpNew');s('cp-conf-lbl','cpConf');s('cp-save-btn','cpSave');s('cp-cancel-btn','btnCancel');
  // PwGen
  s('pwgen-title','pwgenTitle');s('pwgen-result-lbl','pwgenResult');s('pwgen-use-btn','pwgenUse');s('pwgen-cancel-btn','btnCancel');s('pg-upper-lbl','pgUpper');s('pg-lower-lbl','pgLower');s('pg-numbers-lbl','pgNumbers');s('pg-symbols-lbl','pgSymbols');
  // Import
  s('import-title','importTitle');s('import-confirm-btn','importConfirm');s('import-cancel-btn','btnCancel');
  // Notes
  s('notes-title','notesTitle');s('notes-empty-txt','notesEmpty');
  s('archive-title','archiveTitle');
  // PWA
  // Settings
  applySettingsLang();
  // Cards
  const tcxt=document.getElementById('tab-cards-txt');if(tcxt)tcxt.textContent=t('tabCards');
  const ctitle=document.getElementById('cards-title');if(ctitle)ctitle.textContent=t('cardsTitle');
  const cadd=document.getElementById('cards-add-txt');if(cadd)cadd.textContent=t('cardsAdd');
  const cbank=document.getElementById('card-bank-lbl');if(cbank)cbank.textContent=t('cardBank');
  const cholder=document.getElementById('card-holder-lbl');if(cholder)cholder.textContent=t('cardHolder');
  const cnumber=document.getElementById('card-number-lbl');if(cnumber)cnumber.textContent=t('cardNumber');
  const cexpiry=document.getElementById('card-expiry-lbl');if(cexpiry)cexpiry.textContent=t('cardExpiry');
  const ctype=document.getElementById('card-type-lbl');if(ctype)ctype.textContent=t('cardType');
  const cpin=document.getElementById('card-pin-lbl');if(cpin)cpin.innerHTML=`${t('cardPin')} <span style="font-size:.5rem;color:var(--text-muted);letter-spacing:1px">${t('cardPinHint')}</span>`;
  const cnotes=document.getElementById('card-notes-lbl');if(cnotes)cnotes.textContent=t('cardNotes');
  const ccolor=document.getElementById('card-color-lbl');if(ccolor)ccolor.textContent=t('cardColor');
  const csave=document.getElementById('card-save-btn');if(csave)csave.textContent=t('cardSave');
  const cbankph=document.getElementById('card-bank');if(cbankph)cbankph.placeholder=t('cardBankPh');
  const cholderph=document.getElementById('card-holder');if(cholderph)cholderph.placeholder=t('cardHolderPh');
  const cnumberph=document.getElementById('card-number');if(cnumberph)cnumberph.placeholder=t('cardNumberPh');
  const cexpiryph=document.getElementById('card-expiry');if(cexpiryph)cexpiryph.placeholder=t('cardExpiry');
  const cnotesph=document.getElementById('card-notes');if(cnotesph)cnotesph.placeholder=t('cardNotesPh');
  const ctypesel=document.getElementById('card-type');if(ctypesel){ctypesel.options[0].text=t('cardTypeDebito');ctypesel.options[1].text=t('cardTypeCredito');ctypesel.options[2].text=t('cardTypePrepago');ctypesel.options[3].text=t('cardTypeOutro');}
  const dragTxt=document.getElementById('drag-overlay-txt');if(dragTxt)dragTxt.textContent=t('dragOverlay');
  const lockEncryptTxt=document.getElementById('lock-encrypt-txt');if(lockEncryptTxt)lockEncryptTxt.textContent=currentLang==='en'?'100% Encrypted — Your data never leaves your device':'100% Encriptado — Os teus dados nunca saem do teu dispositivo';
  const footerTxt=document.getElementById('footer-encrypt-txt');if(footerTxt)footerTxt.textContent=currentLang==='en'?'100% Encrypted — Your data never leaves your device':'100% Encriptado — Os teus dados nunca saem do teu dispositivo';
  // Security section
  const secTitle=document.getElementById('l-security-title');if(secTitle)secTitle.textContent=currentLang==='en'?'🔒 How does the security work?':'🔒 Como funciona a segurança?';
  const secTexts=currentLang==='en'?[
    ['Military Encryption','Passwords, documents, notes, cards and 2FA codes — all protected with <strong>AES-256-GCM</strong>, the same technology used by banks and governments. Impossible to break without your password.'],
    ['Local File','Passwords, documents, notes, cards and 2FA codes are stored in a single <strong>.vault</strong> file on your device. Everything yours, under your control, never leaves your device.'],
    ['Zero Servers','Aurora Vault stores passwords, documents, notes, cards and 2FA codes in a single encrypted file on your device. No servers, no cloud. GitHub only hosts the app code — your data always stays with you.'],
    ['Zero Knowledge','<strong>Nobody</strong> has access to your data — not the app creators, not GitHub, not any server. Only you, with your master password, can open the vault.'],
    ['Works Offline','After the first load, the app works <strong>without internet</strong>. Access your passwords, documents, notes and 2FA codes anywhere, without a connection. Your data never needs to be online.'],
    ['Your Key, Your Vault','The master password is <strong>never sent</strong> anywhere. It is used locally to encrypt and decrypt. If you lose it, there is no recovery — keep it on paper at home!'],
  ]:[
    ['Encriptação Militar','Passwords, documentos, notas, cartões e códigos 2FA — tudo protegido com <strong>AES-256-GCM</strong>, a mesma tecnologia usada por bancos e governos. Impossível de quebrar sem a tua palavra-passe.'],
    ['Ficheiro Local','Passwords, documentos, notas, cartões e códigos 2FA ficam num único ficheiro <strong>.vault</strong> no teu dispositivo. Tudo teu, sob o teu controlo, nunca sai do dispositivo.'],
    ['Zero Servidores','O Aurora Vault é uma <strong>app local</strong> para guardar passwords, documentos, notas, cartões e códigos 2FA. Sem servidores, sem base de dados online. O GitHub hospeda apenas o código — os teus dados ficam sempre no teu dispositivo.'],
    ['Zero Knowledge','<strong>Ninguém</strong> tem acesso aos teus dados — nem os criadores da app, nem o GitHub, nem qualquer servidor. Só tu, com a tua palavra-passe mestra, podes abrir o cofre.'],
    ['Funciona Offline','Após a primeira abertura, a app funciona <strong>sem internet</strong>. Consulta passwords, documentos, notas e códigos 2FA em qualquer lugar, sem ligação. Os teus dados nunca precisam de estar online.'],
    ['A tua Chave, o teu Cofre','A palavra-passe mestra <strong>nunca é enviada</strong> para lado nenhum. É usada localmente para encriptar e desencriptar. Se a perderes, não há recuperação — guarda-a num papel em casa!'],
  ];
  secTexts.forEach(([title,desc],i)=>{
    const t2=document.getElementById(`sec-t${i+1}`);if(t2)t2.textContent=title;
    const d=document.getElementById(`sec-d${i+1}`);if(d)d.innerHTML=desc;
  });
  // === Traduções em falta (auditoria de i18n) ===
  const _L=currentLang==='en';
  [
    ['sec-t1','Encriptação Militar','Military-grade Encryption',0],
    ['sec-d1','Passwords, documentos, notas, cartões e códigos 2FA — tudo protegido com <strong>AES-256-GCM</strong>, a mesma tecnologia usada por bancos e governos. Impossível de quebrar sem a tua palavra-passe.','Passwords, documents, notes, cards and 2FA codes — all protected with <strong>AES-256-GCM</strong>, the same technology used by banks and governments. Impossible to crack without your password.',1],
    ['sec-t2','Ficheiro Local','Local File',0],
    ['sec-d2','Passwords, documentos, notas, cartões e códigos 2FA ficam num único ficheiro <strong>.vault</strong> no teu dispositivo — pen, computador ou telemóvel. Tudo teu, sob o teu controlo, nunca sai do dispositivo.','Passwords, documents, notes, cards and 2FA codes live in a single <strong>.vault</strong> file on your device — USB stick, computer or phone. All yours, under your control, never leaves the device.',1],
    ['sec-t3','Zero Servidores','Zero Servers',0],
    ['sec-d3','O Aurora Vault é uma <strong>app local</strong> para guardar passwords, documentos, notas, cartões e códigos 2FA. Sem servidores, sem base de dados online. O GitHub hospeda apenas o código — os teus dados ficam sempre no teu dispositivo.','Aurora Vault is a <strong>local app</strong> for storing passwords, documents, notes, cards and 2FA codes. No servers, no online database. GitHub only hosts the code — your data always stays on your device.',1],
    ['sec-t4','Zero Knowledge','Zero Knowledge',0],
    ['sec-d4','<strong>Ninguém</strong> tem acesso aos teus dados — nem os criadores da app, nem o GitHub, nem qualquer servidor. Só tu, com a tua palavra-passe mestra, podes abrir o cofre.','<strong>Nobody</strong> has access to your data — not the app creators, not GitHub, not any server. Only you, with your master password, can open the vault.',1],
    ['sec-t5','Funciona Offline','Works Offline',0],
    ['sec-d5','Após a primeira abertura, a app funciona <strong>sem internet</strong>. Consulta as tuas passwords, documentos, notas e códigos 2FA em qualquer lugar, sem ligação. Os teus dados nunca precisam de estar online.','After the first open, the app works <strong>without internet</strong>. Check your passwords, documents, notes and 2FA codes anywhere, offline. Your data never needs to be online.',1],
    ['sec-t6','A tua Chave, o teu Cofre','Your Key, Your Vault',0],
    ['sec-d6','A palavra-passe mestra <strong>nunca é enviada</strong> para lado nenhum. É usada localmente para encriptar e desencriptar. Se a perderes, não há recuperação — guarda-a num papel em casa!','The master password is <strong>never sent</strong> anywhere. It is used locally to encrypt and decrypt. If you lose it, there is no recovery — keep it on paper at home!',1],
    ['dash-renewals-title','📅 Renovações','📅 Renewals',0],
    ['doc-expiry-lbl','Validade','Expiry',0],
    ['hc-score-cap','Pontuação de segurança','Security score',0],
    ['l-pin-label','PIN rápido','Quick PIN',0],
    ['pgm-words-lbl','Número de palavras:','Number of words:',0],
    ['pin-dur-lbl','Validade do PIN','PIN validity',0],
    ['s-snap-title','💾 Cópias de Segurança','💾 Backups',0],
    ['snap-title','💾 Cópias de Segurança','💾 Backups',0],
    ['snap-open-txt','Ver e restaurar cópias','View and restore backups',0],
    ['t2-setup-btn','Ativar proteção','Enable protection',0],
    ['t2-setup-sub','Fecha este separador com um PIN próprio e uma chave que a palavra-passe mestra não abre.','Lock this tab with its own PIN and a key the master password cannot open.',0],
    ['totp-modal-title','🔢 Novo Código 2FA','🔢 New 2FA Code',0],
    ['totp-shield-txt','Proteção','Protection',0],
    ['tbm-save','Guardar','Save',0],
    ['tbm-priv','Privado','Private',0],
    ['tbm-cal','Calendário','Calendar',0],
    ['tbm-set','Ajustes','Settings',0],
    ['tbm-lock','Bloquear','Lock',0],
    ['s-notif-title','🔔 Avisos de validades','🔔 Expiry alerts',0],
    ['s-notif-desc','Recebe um aviso quando um documento, cartão ou subscrição está prestes a expirar ou renovar (30, 7 e 2 dias antes).','Get an alert when a document, card or subscription is about to expire or renew (30, 7 and 2 days ahead).',0],
    ['s-notif-btn-txt','Avisos','Alerts',0],
    ['s-drive-title','☁️ Sincronizar com a Google Drive','☁️ Sync with Google Drive',0],
    ['s-drive-desc','Mantém o mesmo cofre no computador e no telemóvel. O que vai para a Drive é o ficheiro já encriptado — a Google nunca vê o conteúdo. Sem rede, a app usa a cópia guardada por dentro e envia as alterações quando voltares a ter ligação.','Keeps the same vault on your computer and phone. What goes to Drive is the already-encrypted file — Google never sees the contents. Offline, the app uses its internal copy and uploads your changes once you are back online.',0],
    ['s-drive-cid-lbl','Credencial da Google (Client ID)','Google credential (Client ID)',0],
    ['drive-save-cid-btn','Guardar credencial','Save credential',0],
    ['drive-upload-btn','☁️ Enviar o cofre atual para o Drive','☁️ Upload current vault to Drive',0],
    ['drive-forget-btn','Desligar e esquecer','Disconnect and forget',0],
    ['drive-link-btn','🔗 Usar um ficheiro já existente na Drive','🔗 Use a file already on Drive',0],
    ['drive-link-title','🔗 Ficheiros encontrados na Drive','🔗 Files found on Drive',0],
    ['drive-link-close-btn','Fechar','Close',0],
    ['grp-cofre-txt','Cofre','Vault',0],
    ['grp-cards-txt','Cartões','Cards',0],
    ['grp-docs-txt','Documentos','Documents',0],
    ['grp-archive-txt','Arquivo','Archive',0],
    ['tab-cards-txt','Bancários','Bank',0],
    ['grp-bens-txt','Bens','Assets',0],
    ['tab-warranty-txt','Garantias','Warranties',0],
    ['tab-license-txt','Licenças','Licenses',0],
    ['tab-vehicle-txt','Veículos','Vehicles',0],
    ['tab-dates-txt','Datas','Dates',0],
    ['warranty-tab-title','🧾 Garantias','🧾 Warranties',0],
    ['license-tab-title','🔑 Licenças de Software','🔑 Software Licenses',0],
    ['vehicle-tab-title','🚗 Veículos','🚗 Vehicles',0],
    ['dates-tab-title','🎂 Datas Importantes','🎂 Important Dates',0],
    ['warranty-add-txt','Adicionar garantia','Add warranty',0],
    ['license-add-txt','Adicionar licença','Add license',0],
    ['vehicle-add-txt','Adicionar veículo','Add vehicle',0],
    ['dates-add-txt','Adicionar data','Add date',0],
    ['f-attach-lbl','Anexos (imagens ou PDF)','Attachments (images or PDF)',0],
    ['warranty-intro','Guarda as tuas compras com garantia. A app avisa-te antes de expirar.','Keep track of your purchases under warranty. The app warns you before it expires.',0],
    ['license-intro','Chaves do Windows, Office, jogos e apps que compraste.','Keys for Windows, Office, games and apps you bought.',0],
    ['vehicle-intro','Seguro, inspeção e revisão — as datas entram no calendário.','Insurance, inspection and service — dates go into the calendar.',0],
    ['dates-intro','Aniversários e datas que não podes esquecer.','Birthdays and dates you cannot forget.',0],
  ].forEach(([id,pt,en,html])=>{const el=document.getElementById(id);if(el){if(html)el.innerHTML=_L?en:pt;else el.textContent=_L?en:pt;}});
  {const ec=document.getElementById('export-count');const ecv=ec?ec.textContent:'0';const edb=document.getElementById('export-do-btn');if(edb)edb.innerHTML='📤 '+(_L?'Export':'Exportar')+' (<span id="export-count">'+ecv+'</span>)';}
  try{renderNotifBtn();}catch(e){}
  try{if(document.getElementById('drive-state'))renderDriveSettings();}catch(e){}
  try{if(['warranty','license','vehicle','dates'].includes(currentGroup?lastLeafOf[currentGroup]:''))renderAssets(lastLeafOf[currentGroup]);}catch(e){}
  // Re-render
  renderBankCards();
  // HowTo
  renderHowTo();
}

// ══ RENDER ALL ══
function renderAll(){renderWifiBar();renderSidebar();renderCards();renderDashboard();renderNotesList();renderArchive();renderBankCards();renderDocs();renderTrash();renderTotp();renderHowTo();}

// ══ HOW TO ══
function renderHowTo(){
  const cards=T[currentLang].howCards;
  const el=document.getElementById('lock-how-grid');if(!el)return;
  el.innerHTML=cards.map(([num,title,text])=>`<div class="lock-how-card"><div style="font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--accent-dim);margin-bottom:5px;line-height:1">${num}</div><div style="font-size:.68rem;font-weight:600;color:var(--text);margin-bottom:4px">${title}</div><div style="font-size:.62rem;color:var(--text-muted);line-height:1.6">${text}</div></div>`).join('');
  const titleEl=document.getElementById('l-howto-title');if(titleEl)titleEl.textContent=t('howToTitle');
}
function openLoginModal(which){
  closeLoginModal();
  const map={como:'lmodal-como',seg:'lmodal-seg',sobre:'lmodal-sobre'};
  const el=document.getElementById(map[which]);if(el)el.classList.add('open');
  document.querySelectorAll('.lnav-link').forEach(l=>l.classList.remove('active'));
  const lk={como:'lnav-como',seg:'lnav-seg',sobre:'lnav-sobre'}[which];
  const lkEl=document.getElementById(lk);if(lkEl)lkEl.classList.add('active');
}
function closeLoginModal(){
  document.querySelectorAll('.login-modal').forEach(m=>m.classList.remove('open'));
  document.querySelectorAll('.lnav-link').forEach(l=>l.classList.remove('active'));
  const home=document.getElementById('lnav-home');if(home)home.classList.add('active');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLoginModal();});
function toggleLockHowTo(){const b=document.getElementById('lock-how-body'),a=document.getElementById('lock-how-arrow'),h=b&&b.style.display==='none';if(b){b.style.display=h?'block':'none';}if(a)a.textContent=h?'▲':'▼';}
function toggleSecurityInfo(){const b=document.getElementById('security-info-body'),a=document.getElementById('security-arrow'),h=b&&b.style.display==='none';if(b){b.style.display=h?'block':'none';}if(a)a.textContent=h?'▲':'▼';}

