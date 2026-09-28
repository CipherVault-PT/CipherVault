// ══ STATE ══
(function(){
  try{
    if(location.hash&&location.hash.indexOf('access_token')>=0&&window.opener){
      window.opener.postMessage({avOAuth:location.hash},location.origin);
      window.close();
    }
  }catch(e){}
})();
const APP_VERSION='10.11';
let vault=[],notes=[],masterKey=null,masterPwRaw='',currentCat='all',currentTag='',editingId=null;
let activityLog=[];
let trash=[];
let totp=[];let customCats=[];let docFolders=[];let currentFolderId=null;let vaultFolders=[];let currentVaultFolderId=null;let wifiNets=[];let editingWifiId=null;let legacyNote='';let legacyOwner='';
let totpEnc=null,totpRecWrap=null,totpKey=null,totpUnlocked=false;
const VAULT_FMT=2;
const KNOWN_KEYS=['savedAt','fmt','vault','notes','bankCards','activityLog','documents','trash','totp','customCats','docFolders','vaultFolders','wifiNets','legacyNote','legacyOwner','totpEnc','totpRecWrap','personalInfo','subscriptions','storeCards','assets','vaultName'];
let payloadExtras={},vaultReadOnly=false;let currentDocSort='added';let lastSavedAt=null;let totpCounters={};
let failedAttempts=0,lockedOut=false,autoLockCountdown=null,autoLockSeconds=300,autoLockSecondsLeft=300;
let currentTheme='dark',currentLang='pt',currentView='normal',currentAccent='gold';
let pendingImport=[],editingNoteId=null,entryTags=[],entryAttachment=null;
let entryAttachments=[],assetAttachments=[];
const MAX_ATTEMPTS=5;
const CATS={all:{icon:'◈'},email:{icon:'📧'},banco:{icon:'🏦'},jogo:{icon:'🎮'},social:{icon:'💬'},trabalho:{icon:'💼'},outro:{icon:'📁'}};

// ══ TRANSLATIONS ══
const T={
  pt:{
    sub:'Cofre Digital Pessoal',sub2:'Passwords · Documentos · Notas · Cartões',masterLabel:'Palavra-passe mestra',hint:'Mínimo 4 caracteres',
    openVault:'📂 Abrir Cofre',newVault:'✦ Novo Cofre',
    firstUseInfo:'<strong>Primeiro uso?</strong> Escreve a palavra-passe que queres usar e toca em <strong>Criar cofre</strong>.<br>Já tens um cofre? Escreve a palavra-passe dele e toca em <strong>Carregar cofre</strong> para escolher o ficheiro <em>.vault</em>.',
    howToTitle:'📖 Como usar o Aurora Vault',
    howCards:[
      ['01','Cria o Cofre','Clica <strong>Novo Cofre</strong> e define a tua palavra-passe mestra — a única chave que precisas de decorar.'],
      ['02','Guarda Tudo','Passwords, <strong>notas seguras</strong>, cartões bancários e <strong>documentos</strong> reais (PDF, imagens, Word...) — tudo num só sítio.'],
      ['03','Autenticador 2FA','Lê o <strong>QR code</strong> dos sites com a câmara e a app gera os códigos de 6 dígitos — como o Google Authenticator.'],
      ['04','Encontra Rápido','Pesquisa <strong>em tudo</strong> na barra do topo, marca favoritos e vê alertas de passwords fracas e documentos a expirar.'],
      ['05','Faz Teu','Cores totalmente personalizáveis, <strong>categorias próprias</strong>, QR do WiFi para visitas, PT/EN — e uma reciclagem de 30 dias.'],
      ['06','Guardar Ficheiro','<strong>Ctrl+S</strong> descarrega o <strong>.vault</strong> encriptado + um backup com data. Guarda na pen ou na cloud — só tu o abres.'],
    ],
    tbNew:'Nova entrada',tbImport:'Importar CSV',tbSave:'Guardar ficheiro',tbPdf:'Exportar PDF',tbCsv:'Exportar CSV',tbChangePw:'Alterar pass',tbLock:'Bloquear',
    tabDash:'📊 Dashboard',tabVault:'Cofre',tabNotes:'Notas',tabArchive:'Arquivo',
    allEntries:'Todas as Entradas',search:'Pesquisar em tudo...',
    sortFav:'⭐ Favoritos',sortName:'A→Z',sortDate:'📅 Recentes',sortCat:'📁 Categoria',
    catAll:'Todas',catEmail:'Email',catBanco:'Banco',catJogo:'Jogo',catSocial:'Social',catTrabalho:'Trabalho',catOutro:'Outro',
    dashTotal:'Total',dashWeak:'Fracas',dashDups:'Repetidas',dashOld:'Antigas',dashFavs:'Favoritos',
    alertEmpty:'O teu cofre está vazio.',alertEmptySub:'Toca em «＋ Adicionar», em cima, para começar.',
    alertWeak:'password(s) fraca(s) detetada(s).',alertCommon:'conta(s) com passwords muito comuns!',alertDups:'conta(s) com passwords repetidas.',alertOld:'password(s) com mais de 6 meses.',alertDupEntries:'entrada(s) duplicada(s).',
    alertGood:'Tudo em ordem! O teu cofre está seguro.',alertGoodSub:'Continua assim.',
    scoreLabels:['Crítico','Fraco','Razoável','Bom','Excelente'],
    modalNew:'Nova Entrada',modalEdit:'Editar Entrada',
    fName:'Nome / Serviço',fNamePh:'ex: Gmail',fIcon:'Ícone',fIconBtn:'Escolher',fCat:'Categoria',fUser:'Utilizador / Email',fUserPh:'utilizador@exemplo.com',
    fPw:'Palavra-passe',fPwPh:'palavra-passe',fPwGen:'Gerar',fUrl:'URL',fUrlPh:'https://exemplo.com',
    fTags:'Tags',fAttach:'Anexo (imagem)',fNotes:'Notas',fNotesPh:'Informação adicional...',
    btnSave:'Guardar',btnCancel:'Cancelar',
    pwVeryWeak:'Muito fraca',pwWeak:'Fraca',pwMedium:'Média',pwGood:'Boa',pwStrong:'Forte',
    dupWarn:'⚠️ Esta password já está a ser usada noutra conta!',
    cardUser:'Utilizador',cardPw:'Password',cardUrl:'URL',cardNotes:'Notas',
    btnEdit:'Editar',btnDel:'Apagar',btnArchive:'Arquivar',btnRestore:'Restaurar',btnGoSite:'Ir para o site',btnRead:'Ver',
    globalSearchResults:'Resultados da pesquisa',globalSearchEmpty:'Nenhum resultado para',
    welcomeSteps:[
      {icon:'⬡',title:'Aurora Vault',text:'Bem-vindo ao teu <strong>cofre digital pessoal</strong>.<br>Guarda passwords, documentos, notas, cartões bancários e muito mais.<br><br><strong>100% encriptado, 100% offline, 100% teu.</strong>'},
      {icon:'🔐',title:'O teu Cofre',text:'Guarda os teus <strong>utilizadores e passwords</strong> no separador <strong>Cofre</strong>.<br><br>Organiza por categorias e adiciona <strong>tags personalizadas</strong> para encontrar tudo rapidamente.'},
      {icon:'💳',title:'Cartões & Notas',text:'Guarda os teus <strong>cartões bancários com PIN</strong> no separador Cartões.<br><br>Usa as <strong>Notas seguras</strong> para PINs, IBANs, documentos ou qualquer texto encriptado.'},
      {icon:'💾',title:'Guarda sempre!',text:'Após cada alteração, clica em <strong>Guardar ficheiro</strong> na barra de topo.<br><br>Ficheiro <strong>ciphervault.vault</strong> encriptado com <strong>AES-256-GCM</strong>.<br><br>⚠️ <strong>Nunca percas a palavra-passe mestra</strong> — não há recuperação.'},
    ],
    wBtnStart:'Começar →',wBtnNext:'Seguinte →',wBtnPrev:'← Anterior',wBtnSkip:'Saltar',wBtnDone:'Entendido! 🎉',
    dragOverlay:'⬡ Largar para abrir cofre',
    pwHistory:'Histórico de passwords',
    favAdd:'Marcar favorito',favRemove:'Remover favorito',
    pwOld:'⏰ Password antiga (+6 meses)',pwRecent:'✓ Atualizada recentemente',
    emptyState:'Nenhuma entrada encontrada',emptyArchive:'Arquivo vazio',
    notesTitle:'Notas',notesEmpty:'Seleciona ou cria uma nota',notesNew:'Nova Nota',
    noteTitlePh:'Título da nota...',noteBodyPh:'Escreve aqui...',
    btnSaveNote:'Guardar nota',btnDelNote:'Apagar nota',
    archiveTitle:'Arquivo',
    settingsTitle:'⚙️ Definições',sTheme:'Tema',sAccent:'Cor de Destaque',sTimeout:'Auto-lock (minutos de inatividade)',sDark:'🌙 Escuro',sLight:'☀️ Claro',sClose:'Fechar',
    cpTitle:'🔑 Alterar Palavra-passe Mestra',cpInfo:'Será gerado um novo <strong style="color:var(--accent-ink)">ciphervault.vault</strong>. Substitui o antigo na pen!',
    cpCur:'Palavra-passe atual',cpNew:'Nova palavra-passe',cpConf:'Confirmar nova',cpSave:'Alterar e Guardar',
    cpErrWrong:'A palavra-passe atual está incorreta!',cpErrShort:'Mínimo 4 caracteres!',cpErrMatch:'As palavras-passe não coincidem!',cpErrSame:'A nova password é igual à atual!',
    pwgenTitle:'⚙️ Gerador Avançado',pwgenLen:'Comprimento: ',pwgenResult:'Password Gerada',pwgenUse:'Usar esta password',
    pgUpper:'A-Z',pgLower:'a-z',pgNumbers:'0-9',pgSymbols:'!@#$',
    importTitle:'📥 Importar do Chrome',importConfirm:'Importar tudo',
    toastSaved:'Cofre guardado! ✓',toastLocked:'Bloqueado por inatividade.',toastPwChanged:'Password alterada! ✓',
    toastAdded:'Entrada adicionada!',toastUpdated:'Entrada atualizada!',toastDeleted:'Entrada apagada.',
    toastArchived:'Entrada arquivada.',toastRestored:'Entrada restaurada.',
    toastInstalled:'Aurora Vault instalado! ✓',toastNoteSaved:'Nota guardada! ✓',toastNoteDeleted:'Nota apagada.',
    confirmDelete:'Apagar esta entrada?',confirmDeleteNote:'Apagar esta nota?',
    lockErr:'Palavra-passe incorreta ou ficheiro inválido.',lockErrTooMany:'Demasiadas tentativas! Cofre bloqueado.',
    lockErrReload:'🔒 Recarrega a página para tentar novamente.',lockErrRemaining:'tentativa(s) restante(s).',
    lockMinChars:'Mínimo 4 caracteres!',lockFirstRequired:'Insere a palavra-passe primeiro!',
    sbCats:'Categorias',sbTags:'Tags',tagAll:'Todas as Tags',
    userCopied:'Utilizador copiado!',pwCopied:'Password copiada!',
    pwaTitle:'📲 Instalar Aurora Vault',pwaSub:'Instala como app!',pwaInstall:'Instalar',pwaDismiss:'Agora não',
    toNever:'∞ Nunca',
    // CARDS
    tabCards:'Cartões',cardsTitle:'Cartões Bancários',cardsAdd:'Adicionar cartão',
    cardModalNew:'💳 Novo Cartão',cardModalEdit:'💳 Editar Cartão',
    cardBank:'Banco / Emissor',cardBankPh:'ex: Santander, CGD, Visa...',
    cardHolder:'Nome no cartão',cardHolderPh:'ex: CARLOS SILVA',
    cardNumber:'Número do cartão',cardNumberPh:'**** **** **** 1234',
    cardExpiry:'Validade',cardType:'Tipo',
    cardTypeDebito:'💳 Débito',cardTypeCredito:'💰 Crédito',cardTypePrepago:'🎫 Pré-pago',cardTypeOutro:'📋 Outro',
    cardPin:'PIN',cardPinHint:'(encriptado)',
    cardNotes:'Notas',cardNotesPh:'IBAN, limite, observações...',
    cardColor:'Cor do cartão',
    cardExpired:'Cartão expirado!',cardExpiringSoon:'Cartão expira em breve',cardDaysLeft:'dias restantes',
    cardAdded:'Cartão adicionado!',cardUpdated:'Cartão atualizado!',cardDeleted:'Cartão apagado.',
    cardConfirmDelete:'Apagar este cartão?',cardEmpty:'Ainda não tens cartões.',
    cardSave:'Guardar',cardRequired:'Indica o banco / emissor do cartão!',nameRequired:'O nome é obrigatório!',
    cardTypeLabels:{debito:'Débito',credito:'Crédito',prepago:'Pré-pago',outro:'Outro'},
  },
  en:{
    sub:'Your Personal Digital Vault',sub2:'Passwords · Documents · Notes · Cards',masterLabel:'Master password',hint:'Minimum 4 characters',
    openVault:'📂 Open Vault',newVault:'✦ New Vault',
    firstUseInfo:'<strong>First time?</strong> Type the password you want to use and tap <strong>Create vault</strong>.<br>Already have a vault? Type its password and tap <strong>Load vault</strong> to choose your <em>.vault</em> file.',
    howToTitle:'📖 How to use Aurora Vault',
    howCards:[
      ['01','Create the Vault','Click <strong>New Vault</strong> and set your master password — the only key you need to remember.'],
      ['02','Store Everything','Passwords, <strong>secure notes</strong>, bank cards and real <strong>documents</strong> (PDF, images, Word...) — all in one place.'],
      ['03','2FA Authenticator','Scan the sites\' <strong>QR code</strong> with your camera and the app generates the 6-digit codes — like Google Authenticator.'],
      ['04','Find It Fast','Search <strong>everything</strong> from the top bar, pin favourites and get alerts for weak passwords and expiring documents.'],
      ['05','Make It Yours','Fully customisable colours, <strong>your own categories</strong>, WiFi QR for guests, PT/EN — and a 30-day recycle bin.'],
      ['06','Save the File','<strong>Ctrl+S</strong> downloads the encrypted <strong>.vault</strong> + a dated backup. Keep it on a drive or cloud — only you can open it.'],
    ],
    tbNew:'New entry',tbImport:'Import CSV',tbSave:'Save file',tbPdf:'Export PDF',tbCsv:'Export CSV',tbChangePw:'Change pass',tbLock:'Lock',
    tabDash:'📊 Dashboard',tabVault:'Vault',tabNotes:'Notes',tabArchive:'Archive',
    allEntries:'All Entries',search:'Search everything...',
    sortFav:'⭐ Favourites',sortName:'A→Z',sortDate:'📅 Recent',sortCat:'📁 Category',
    catAll:'All',catEmail:'Email',catBanco:'Bank',catJogo:'Game',catSocial:'Social',catTrabalho:'Work',catOutro:'Other',
    dashTotal:'Total',dashWeak:'Weak',dashDups:'Repeated',dashOld:'Old',dashFavs:'Favourites',
    alertEmpty:'Your vault is empty.',alertEmptySub:'Tap “＋ Add” at the top to get started.',
    alertWeak:'weak password(s) detected.',alertCommon:'account(s) with very common passwords!',alertDups:'account(s) with repeated passwords.',alertOld:'password(s) not updated in over 6 months.',alertDupEntries:'duplicate entr(y/ies).',
    alertGood:'All good! Your vault is secure.',alertGoodSub:'Keep it up.',
    scoreLabels:['Critical','Weak','Fair','Good','Excellent'],
    modalNew:'New Entry',modalEdit:'Edit Entry',
    fName:'Name / Service',fNamePh:'e.g. Gmail',fIcon:'Icon',fIconBtn:'Choose',fCat:'Category',fUser:'Username / Email',fUserPh:'user@example.com',
    fPw:'Password',fPwPh:'password',fPwGen:'Generate',fUrl:'URL',fUrlPh:'https://example.com',
    fTags:'Tags',fAttach:'Attachment (image)',fNotes:'Notes',fNotesPh:'Additional info...',
    btnSave:'Save',btnCancel:'Cancel',
    pwVeryWeak:'Very weak',pwWeak:'Weak',pwMedium:'Medium',pwGood:'Good',pwStrong:'Strong',
    dupWarn:'⚠️ This password is already used in another account!',
    cardUser:'Username',cardPw:'Password',cardUrl:'URL',cardNotes:'Notes',
    btnEdit:'Edit',btnDel:'Delete',btnArchive:'Archive',btnRestore:'Restore',btnGoSite:'Go to site',btnRead:'View',
    globalSearchResults:'Search results',globalSearchEmpty:'No results for',
    welcomeSteps:[
      {icon:'⬡',title:'Aurora Vault',text:'Welcome to your <strong>personal digital vault</strong>.<br>Store passwords, documents, notes, bank cards and more.<br><br><strong>100% encrypted, 100% offline, 100% yours.</strong>'},
      {icon:'🔐',title:'Your Vault',text:'Store your <strong>usernames and passwords</strong> in the <strong>Vault</strong> tab.<br><br>Organise by category and add <strong>custom tags</strong> to find everything quickly.'},
      {icon:'💳',title:'Cards & Notes',text:'Store your <strong>bank cards with PIN</strong> in the Cards tab.<br><br>Use <strong>Secure Notes</strong> for PINs, IBANs, documents or any encrypted text.'},
      {icon:'💾',title:'Always save!',text:'After every change, click <strong>Save file</strong> in the top bar.<br><br>A <strong>ciphervault.vault</strong> file encrypted with <strong>AES-256-GCM</strong> will be created.<br><br>⚠️ <strong>Never lose your master password</strong> — there is no recovery.'},
    ],
    wBtnStart:'Get started →',wBtnNext:'Next →',wBtnPrev:'← Back',wBtnSkip:'Skip',wBtnDone:'Got it! 🎉',
    dragOverlay:'⬡ Drop to open vault',
    pwHistory:'Password history',
    favAdd:'Add to favourites',favRemove:'Remove favourite',
    pwOld:'⏰ Old password (+6 months)',pwRecent:'✓ Recently updated',
    emptyState:'No entries found',emptyArchive:'Archive is empty',
    notesTitle:'Notes',notesEmpty:'Select or create a note',notesNew:'New Note',
    noteTitlePh:'Note title...',noteBodyPh:'Write here...',
    btnSaveNote:'Save note',btnDelNote:'Delete note',
    archiveTitle:'Archive',
    settingsTitle:'⚙️ Settings',sTheme:'Theme',sAccent:'Accent Colour',sTimeout:'Auto-lock (minutes of inactivity)',sDark:'🌙 Dark',sLight:'☀️ Light',sClose:'Close',
    cpTitle:'🔑 Change Master Password',cpInfo:'A new <strong style="color:var(--accent-ink)">ciphervault.vault</strong> will be generated. Replace the old one on your drive!',
    cpCur:'Current password',cpNew:'New password',cpConf:'Confirm new',cpSave:'Change & Save',
    cpErrWrong:'Current password is incorrect!',cpErrShort:'Minimum 4 characters!',cpErrMatch:'Passwords do not match!',cpErrSame:'New password is the same as current!',
    pwgenTitle:'⚙️ Advanced Generator',pwgenLen:'Length: ',pwgenResult:'Generated Password',pwgenUse:'Use this password',
    pgUpper:'A-Z',pgLower:'a-z',pgNumbers:'0-9',pgSymbols:'!@#$',
    importTitle:'📥 Import from Chrome',importConfirm:'Import all',
    toastSaved:'Vault saved! ✓',toastLocked:'Locked due to inactivity.',toastPwChanged:'Password changed! ✓',
    toastAdded:'Entry added!',toastUpdated:'Entry updated!',toastDeleted:'Entry deleted.',
    toastArchived:'Entry archived.',toastRestored:'Entry restored.',
    toastInstalled:'Aurora Vault installed! ✓',toastNoteSaved:'Note saved! ✓',toastNoteDeleted:'Note deleted.',
    confirmDelete:'Delete this entry?',confirmDeleteNote:'Delete this note?',
    lockErr:'Incorrect password or invalid file.',lockErrTooMany:'Too many attempts! Vault locked.',
    lockErrReload:'🔒 Reload the page to try again.',lockErrRemaining:'attempt(s) remaining.',
    lockMinChars:'Minimum 4 characters!',lockFirstRequired:'Enter your password first!',
    sbCats:'Categories',sbTags:'Tags',tagAll:'All Tags',
    userCopied:'Username copied!',pwCopied:'Password copied!',
    pwaTitle:'📲 Install Aurora Vault',pwaSub:'Install as an app!',pwaInstall:'Install',pwaDismiss:'Not now',
    toNever:'∞ Never',
    // CARDS
    tabCards:'Cards',cardsTitle:'Bank Cards',cardsAdd:'Add card',
    cardModalNew:'💳 New Card',cardModalEdit:'💳 Edit Card',
    cardBank:'Bank / Issuer',cardBankPh:'e.g. Barclays, Visa...',
    cardHolder:'Name on card',cardHolderPh:'e.g. CARLOS SILVA',
    cardNumber:'Card number',cardNumberPh:'**** **** **** 1234',
    cardExpiry:'Expiry',cardType:'Type',
    cardTypeDebito:'💳 Debit',cardTypeCredito:'💰 Credit',cardTypePrepago:'🎫 Prepaid',cardTypeOutro:'📋 Other',
    cardPin:'PIN',cardPinHint:'(encrypted)',
    cardNotes:'Notes',cardNotesPh:'IBAN, limit, notes...',
    cardColor:'Card colour',
    cardExpired:'Card expired!',cardExpiringSoon:'Card expiring soon',cardDaysLeft:'days left',
    cardAdded:'Card added!',cardUpdated:'Card updated!',cardDeleted:'Card deleted.',
    cardConfirmDelete:'Delete this card?',cardEmpty:'No cards yet.',
    cardSave:'Save',cardRequired:'Enter the card bank / issuer!',nameRequired:'Name is required!',
    cardTypeLabels:{debito:'Debit',credito:'Credit',prepago:'Prepaid',outro:'Other'},
  }
};
function t(k){return(T[currentLang]||T.pt)[k]||k;}

// ══ CRYPTO ══ → js/crypto.js

// ══ INDEXEDDB KV (handles de ficheiros) ══
// Uma só ligação reutilizada (antes abria-se uma nova em cada leitura/escrita e nenhuma era fechada)
let _idbP=null;
function idbOpen(){
  if(_idbP)return _idbP;
  _idbP=new Promise((res,rej)=>{
    const r=indexedDB.open('ciphervault',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('kv');
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();_idbP=null;};db.onclose=()=>{_idbP=null;};res(db);};
    r.onerror=()=>{_idbP=null;rej(r.error);};
  });
  return _idbP;
}
function idbTx(mode,run){
  const attempt=retry=>idbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction('kv',mode);
    tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('abort'));
    run(tx.objectStore('kv'),tx,res,rej);
  })).catch(e=>{if(retry&&e&&e.name==='InvalidStateError'){_idbP=null;return attempt(false);}throw e;});
  return attempt(true);
}
async function idbSet(k,v){return idbTx('readwrite',(st,tx,res)=>{st.put(v,k);tx.oncomplete=()=>res();});}
async function idbGet(k){return idbTx('readonly',(st,tx,res,rej)=>{const rq=st.get(k);rq.onsuccess=()=>res(rq.result);rq.onerror=()=>rej(rq.error);});}
async function idbDel(k){return idbTx('readwrite',(st,tx,res)=>{st.delete(k);tx.oncomplete=()=>res();});}

// ══ FILE SYSTEM ACCESS ══
let vaultFileHandle=null;
const FSA_OK='showOpenFilePicker' in window;
async function refreshContinueBtn(){
  const wrap=document.getElementById('l-continue-wrap');if(!wrap)return;
  if(!FSA_OK){wrap.style.display='none';return;}
  try{
    const h=await idbGet('vaultHandle');
    if(h){
      wrap.style.display='flex';
      document.getElementById('l-continue-name').textContent=h.name;
    }else wrap.style.display='none';
  }catch(e){wrap.style.display='none';}
}
async function showFileMeta(file){
  const el=document.getElementById('l-file-meta');
  if(!el||!file)return;
  const en=currentLang==='en';
  const warn=[];let ago='';
  if(file.lastModified){
    const diff=Date.now()-file.lastModified,days=Math.floor(diff/86400000),hrs=Math.floor(diff/3600000);
    if(days>=1)ago=en?`${days} day(s) ago`:`há ${days} dia(s)`;
    else if(hrs>=1)ago=en?`${hrs}h ago`:`há ${hrs}h`;
    else ago=en?'less than 1h ago':'há menos de 1h';
    if(days>=30)warn.push('⚠️ '+(en?'This copy is over a month old.':'Esta cópia tem mais de um mês.'));
  }
  try{
    const obj=JSON.parse(await file.text());
    const fmt=obj&&obj.payload&&obj.payload.v?obj.payload.v:1;
    if(fmt>3)warn.push('<span style="color:var(--red)">⚠️ '+(en?'Saved by a newer app version.':'Gravado por uma versão mais recente da app.')+'</span>');
  }catch(e){}
  const fn=document.getElementById('l-file-name');
  if(fn)fn.textContent=file.name+(ago?' · '+(en?'saved ':'gravado ')+ago:'');
  el.innerHTML=warn.map(w=>'<div>'+w+'</div>').join('');
  el.style.display=warn.length?'block':'none';
}
async function continueLastVault(){
  if(lockedOut)return;
  try{
    const h=await idbGet('vaultHandle');if(!h)return;
    let perm=await h.queryPermission({mode:'readwrite'});
    if(perm!=='granted')perm=await h.requestPermission({mode:'readwrite'});
    if(perm!=='granted'){toast(currentLang==='en'?'Permission denied.':'Permissão negada.');return;}
    vaultFileHandle=h;lockSwipeNeed=false;
    const file=await h.getFile();
    pendingVaultFile=file;
    document.getElementById('login-state-initial').style.display='none';
    document.getElementById('login-state-open').style.display='block';
    document.getElementById('open-step-file').style.display='none';
    document.getElementById('open-step-pw').style.display='block';
    document.getElementById('l-file-name').textContent='📁 '+file.name;
    document.getElementById('master-pw').value='';
    showFileMeta(file);
    refreshQuickUnlock(true);
  }catch(e){
    toast(currentLang==='en'?'Could not open the file.':'Não foi possível abrir o ficheiro.');
    try{await idbDel('vaultHandle');}catch(_){}
    refreshContinueBtn();
  }
}
async function forgetLastVault(ev){
  if(ev)ev.stopPropagation();
  try{await idbDel('vaultHandle');}catch(e){}
  vaultFileHandle=null;
  refreshContinueBtn();
  toast(currentLang==='en'?'File forgotten.':'Ficheiro esquecido.');
}
async function pickVaultFile(){
  if(!FSA_OK){document.getElementById('file-input').click();return;}
  try{
    const[h]=await window.showOpenFilePicker({types:[{description:'Aurora Vault',accept:{'application/octet-stream':['.vault','.cofre']}}]});
    vaultFileHandle=h;
    try{await idbSet('vaultHandle',h);}catch(e){}
    const file=await h.getFile();
    pendingVaultText=null;lockHeldPw=null;
    pendingVaultFile=file;
    document.getElementById('open-step-file').style.display='none';
    document.getElementById('open-step-pw').style.display='block';
    document.getElementById('l-file-name').textContent=file.name;
    document.getElementById('master-pw').value='';
    showFileMeta(file);lockSubText();
    refreshQuickUnlock(true);lockUseTypedPw();
  }catch(e){/* cancelado */}
}

// ══ DESBLOQUEIO RÁPIDO (PIN 24h + biometria WebAuthn PRF) ══
const PIN_MAX_TRIES=5,PIN_ITER=600000;
const PIN_DURATIONS={'1':1,'7':7,'30':30,'never':null};
function pinDurationKey(){try{return localStorage.getItem('cv_pin_days')||'30';}catch(e){return '30';}}
function pinDurationMs(){const d=PIN_DURATIONS[pinDurationKey()];return d===null||d===undefined?null:d*86400000;}
function pinExpiryFromNow(){const ms=pinDurationMs();return ms===null?null:Date.now()+ms;}
function pinDurationLabel(k){
  const en=currentLang==='en';
  return{'1':en?'1 day':'1 dia','7':en?'7 days':'7 dias','30':en?'30 days':'30 dias','never':en?'Never expires':'Sem expirar'}[k]||k;
}
function bytesToArr(u8){return Array.from(u8);}
function arrToBytes(a){return new Uint8Array(a);}
async function pinKeyFrom(pin,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode('cvpin:'+pin),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:PIN_ITER,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function wrapSecret(key,text){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(text)));
  return{iv:bytesToArr(iv),wrapped:bytesToArr(ct)};
}
async function unwrapSecret(key,rec){
  const out=await crypto.subtle.decrypt({name:'AES-GCM',iv:arrToBytes(rec.iv)},key,arrToBytes(rec.wrapped));
  return new TextDecoder().decode(out);
}
function pinEnabledFlag(v){
  try{if(v===undefined)return localStorage.getItem('cv_pin_on')==='1';localStorage.setItem('cv_pin_on',v?'1':'0');}catch(e){}
  return !!v;
}
/* O PIN e a biometria guardam (encriptados) a palavra-passe e a chave já derivada do cofre:
   assim abrir com PIN custa uma só derivação e a biometria é imediata. Registos antigos só têm a palavra-passe. */
const PIN_LEN=6;
let _quKeys={};
// Tudo o que lê e regrava os registos do PIN/biometria corre em fila: em paralelo, um sobrepunha-se ao outro
// (e o contador de tentativas do PIN era contornável)
let _pinQ=Promise.resolve();
function pinSerial(fn){return function(...a){const p=_pinQ.then(()=>fn(...a));_pinQ=p.catch(()=>{});return p;};}
const b64e=u8=>btoa(String.fromCharCode(...u8));
const b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function quickSecret(){
  const raw=masterKey&&KEY_RAW.get(masterKey);
  if(!raw||!window._salt)return masterPwRaw;
  return 'AVQ2:'+JSON.stringify({pw:masterPwRaw,k:b64e(raw),s:b64e(window._salt),i:curIter()});
}
function parseQuickSecret(txt){
  if(!txt.startsWith('AVQ2:'))return{pw:txt};
  const o=JSON.parse(txt.slice(5));return{pw:o.pw,qk:o};
}
function quickFresh(qk){return !!(qk&&masterKey&&window._salt&&qk.i===curIter()&&qk.s===b64e(window._salt));}
const refreshQuickSecrets=pinSerial(async function(){
  if(!masterPwRaw||!masterKey)return;
  const sec=quickSecret();
  try{
    const kp=_quKeys.pin,rec=kp&&await getPinRec();
    if(rec&&sameBytes(rec.salt,kp.salt)){const w=await wrapSecret(kp.key,sec);rec.iv=w.iv;rec.wrapped=w.wrapped;await idbSet('qu_pin',rec);}
  }catch(e){}
  try{
    const kb=_quKeys.bio,rec=kb&&await idbGet('qu_bio');
    if(rec&&sameBytes(rec.credId,kb.credId)){const w=await wrapSecret(kb.key,sec);rec.iv=w.iv;rec.wrapped=w.wrapped;await idbSet('qu_bio',rec);}
  }catch(e){}
});
const savePinUnlock=pinSerial(async function(pin){
  if(!masterPwRaw)return false;
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await pinKeyFrom(pin,salt);
  const w=await wrapSecret(key,quickSecret());
  await idbSet('qu_pin',{salt:bytesToArr(salt),iv:w.iv,wrapped:w.wrapped,expiresAt:pinExpiryFromNow(),tries:0,len:pin.length});
  _quKeys.pin={key,salt:bytesToArr(salt)};
  pinEnabledFlag(true);
  return true;
});
async function getPinRec(){
  try{
    const rec=await idbGet('qu_pin');
    if(!rec)return null;
    if(rec.expiresAt&&Date.now()>rec.expiresAt){await idbDel('qu_pin');return null;}
    return rec;
  }catch(e){return null;}
}
const tryPin=pinSerial(tryPinRun);
async function tryPinRun(pin){
  const rec=await getPinRec();
  if(!rec)return{gone:true};
  try{
    const key=await pinKeyFrom(pin,arrToBytes(rec.salt));
    const q=parseQuickSecret(await unwrapSecret(key,rec));
    rec.tries=0;rec.expiresAt=pinExpiryFromNow();await idbSet('qu_pin',rec);
    _quKeys.pin={key,salt:rec.salt};
    return{...q,len:rec.len||4};
  }catch(e){
    rec.tries=(rec.tries||0)+1;
    if(rec.tries>=PIN_MAX_TRIES){await idbDel('qu_pin');return{blocked:true};}
    await idbSet('qu_pin',rec);
    return{left:PIN_MAX_TRIES-rec.tries};
  }
}
const clearPinUnlock=pinSerial(async function(keepFlag){
  try{await idbDel('qu_pin');}catch(e){}
  if(!keepFlag)pinEnabledFlag(false);
});
// ── Biometria ──
async function bioSupported(){
  if(!window.PublicKeyCredential||!window.isSecureContext)return false;
  try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch(e){return false;}
}
async function prfEval(credIdArr,saltArr){
  const assertion=await navigator.credentials.get({publicKey:{
    challenge:crypto.getRandomValues(new Uint8Array(32)),
    allowCredentials:[{type:'public-key',id:arrToBytes(credIdArr)}],
    userVerification:'required',timeout:60000,
    extensions:{prf:{eval:{first:arrToBytes(saltArr)}}}
  }});
  const r=assertion?.getClientExtensionResults?.();
  const first=r&&r.prf&&r.prf.results&&r.prf.results.first;
  return first?new Uint8Array(first):null;
}
async function prfToKey(bytes){
  return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function saveBioUnlock(){
  if(!masterPwRaw)return{err:'nopw'};
  if(!await bioSupported())return{err:'unsupported'};
  let cred;
  try{
    cred=await navigator.credentials.create({publicKey:{
      challenge:crypto.getRandomValues(new Uint8Array(32)),
      rp:{name:'Aurora Vault',id:location.hostname},
      user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'Aurora Vault',displayName:'Aurora Vault'},
      pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'preferred'},
      timeout:60000,extensions:{prf:{}}
    }});
  }catch(e){return{err:e&&e.name==='NotAllowedError'?'cancelled':'create'};}
  if(!cred)return{err:'create'};
  const ext=cred.getClientExtensionResults?.();
  if(ext&&ext.prf&&ext.prf.enabled===false)return{err:'noprf'};
  const credId=bytesToArr(new Uint8Array(cred.rawId));
  const salt=bytesToArr(crypto.getRandomValues(new Uint8Array(32)));
  let prf;
  try{prf=await prfEval(credId,salt);}catch(e){return{err:'noprf'};}
  if(!prf)return{err:'noprf'};
  const key=await prfToKey(prf);
  const w=await wrapSecret(key,quickSecret());
  await pinSerial(()=>idbSet('qu_bio',{credId,salt,iv:w.iv,wrapped:w.wrapped}))();
  _quKeys.bio={key,credId};
  return{ok:true};
}
async function tryBio(){
  let rec;
  try{rec=await idbGet('qu_bio');}catch(e){rec=null;}
  if(!rec)return{gone:true};
  let prf;
  try{prf=await prfEval(rec.credId,rec.salt);}
  catch(e){return{err:e&&e.name==='NotAllowedError'?'cancelled':'failed'};}
  if(!prf)return{err:'failed'};
  try{
    const key=await prfToKey(prf);
    const q=parseQuickSecret(await unwrapSecret(key,rec));
    _quKeys.bio={key,credId:rec.credId};
    return q;
  }catch(e){return{err:'failed'};}
}
const touchPinExpiry=pinSerial(async function(){
  try{
    const rec=await idbGet('qu_pin');
    if(!rec)return;
    rec.expiresAt=pinExpiryFromNow();
    await idbSet('qu_pin',rec);
  }catch(e){}
});
async function setPinDuration(v){
  try{localStorage.setItem('cv_pin_days',v);}catch(e){}
  await touchPinExpiry();
  renderQuickSettings();
  const en=currentLang==='en';
  toast((en?'PIN validity: ':'Validade do PIN: ')+pinDurationLabel(v));
}
const clearBioUnlock=pinSerial(async function(){try{await idbDel('qu_bio');}catch(e){}});
async function clearQuickUnlock(){_quKeys={};await clearPinUnlock();await clearBioUnlock();}

// ── UI do ecrã de login ──
let unlockMode='master',quickAvail={bio:false,pin:false,pinLen:PIN_LEN},_pinUpgradeDue=false;
async function refreshQuickUnlock(auto){
  if(!document.getElementById('quick-unlock'))return;
  let bioRec=null;
  try{bioRec=await idbGet('qu_bio');}catch(e){}
  quickAvail.bio=!!bioRec&&await bioSupported();
  const pinRec=await getPinRec();
  quickAvail.pin=!!pinRec;quickAvail.pinLen=(pinRec&&pinRec.len)||4;
  { /* respeita o modo que a pessoa escolheu neste ecrã de entrada (a preparação do ecrã corre várias vezes e apagava a escolha) */
    const pf=(typeof _avUserMode!=='undefined')?_avUserMode:null;
    unlockMode=(pf&&(pf==='master'||(pf==='pin'&&quickAvail.pin)||(pf==='bio'&&quickAvail.bio)))?pf:(quickAvail.bio?'bio':(quickAvail.pin?'pin':'master'));}
  applyUnlockMode(auto===true);
}
function applyUnlockMode(autoBio){
  const en=currentLang==='en';
  const q=document.getElementById('quick-unlock');
  const bioBtn=document.getElementById('bio-btn');
  const pinEntry=document.getElementById('pin-entry');
  const masterEntry=document.getElementById('master-entry');
  const links=document.getElementById('unlock-links');
  if(!q||!bioBtn||!pinEntry||!masterEntry||!links)return;
  bioBtn.style.display='none';
  pinEntry.style.display=unlockMode==='pin'?'block':'none';
  masterEntry.style.display=unlockMode==='master'?'block':'none';
  q.style.display=unlockMode==='pin'?'block':'none';
  const bt=document.getElementById('bio-btn-txt');
  if(bt)bt.textContent=en?'Unlock with biometrics':'Desbloquear com biometria';
  const pl=document.getElementById('l-pin-label');
  if(pl)pl.textContent=en?'Enter your PIN':'Introduz o teu PIN';
  const parts=[];
  if(unlockMode!=='bio'&&quickAvail.bio)parts.push(`<button class="unlock-link" data-act="setUnlockMode" data-arg="bio">${en?'Use biometrics':'Usar biometria'}</button>`);
  if(unlockMode!=='pin'&&quickAvail.pin)parts.push(`<button class="unlock-link" data-act="setUnlockMode" data-arg="pin">${en?'Use PIN':'Usar PIN'}</button>`);
  if(unlockMode!=='master')parts.push(`<button class="unlock-link" data-act="setUnlockMode" data-arg="master">${en?'Recover access':'Recuperar acesso'}</button>`);
  parts.push(`<button class="unlock-link" data-act="lockOtherVault">${en?'Other vault':'Outro cofre'}</button>`);
  const eb=document.getElementById('l-enter-btn');if(eb)eb.style.display=unlockMode==='bio'?'none':'';
  const et=document.getElementById('l-enter-txt');if(et)et.textContent=en?'Enter the Vault':'Entrar no Cofre';
  const ml=document.getElementById('l-master-label');if(ml)ml.textContent=en?'Master password':'Palavra-passe mestra';
  links.innerHTML=parts.join('<span class="link-sep">·</span>');
  links.style.display=parts.length?'flex':'none';
  if(unlockMode==='pin'){
    const pi=document.getElementById('pin-input');
    if(pi){pi.value='';pi.type='password';pi.maxLength=quickAvail.pinLen;pi.placeholder='•'.repeat(quickAvail.pinLen);const pe=document.getElementById('pin-err');if(pe)pe.textContent='';setTimeout(()=>pi.focus(),120);}
  }
  if(unlockMode==='master')setTimeout(()=>{const mp=document.getElementById('master-pw');if(mp)mp.focus();},120);
  if(unlockMode==='bio'&&!lockBioPrompting){if(autoBio&&!lockSwipeNeed){lockSwipeApply();return lockBioStart();}lockSwipeNeed=true;}
  lockSwipeApply();
}
let _avUserMode=null;
function setUnlockMode(m){
  _avUserMode=m;unlockMode=m;lockSwipeRetry=false;
  if(m==='bio'){lockSwipeNeed=false;return lockBioStart();}
  lockSwipeNeed=false;applyUnlockMode(false);
}
async function onPinInput(){
  const el=document.getElementById('pin-input');
  el.value=el.value.replace(/\D/g,'');
  if(el.value.length<quickAvail.pinLen)return;
  if(!(await lockEnsureFile()))return;
  const pin=el.value.slice(0,quickAvail.pinLen);el.value='';
  const en=currentLang==='en';
  const err=document.getElementById('pin-err');
  const res=await tryPin(pin);
  if(res.pw){err.textContent='';_pinUpgradeDue=res.len<PIN_LEN;submitOpenVault(res.pw,res.qk);return;}
  if(res.blocked){
    err.textContent=en?'Too many attempts — PIN disabled.':'Demasiadas tentativas — PIN desativado.';
    setTimeout(refreshQuickUnlock,1600);return;
  }
  if(res.gone){err.textContent=en?'PIN expired. Use the master password.':'O PIN expirou. Usa a chave mestra.';setTimeout(refreshQuickUnlock,1600);return;}
  err.textContent=(en?'Wrong PIN. ':'PIN errado. ')+(en?`${res.left} attempt(s) left.`:`Restam ${res.left} tentativa(s).`);
  setTimeout(()=>{const pi=document.getElementById('pin-input');if(pi)pi.focus();},60);
}
let bioBusy=false;
async function doBioUnlock(isAuto){
  if(bioBusy||unlockMode!=='bio')return 'busy';
  bioBusy=true;
  const en=currentLang==='en';
  try{
    if(!pendingVaultFile&&!pendingVaultText&&!(await lockEnsureFile()))return 'fail';
    const res=await tryBio();
    if(res.pw){submitOpenVault(res.pw,res.qk);return 'ok';}
    if(res.gone){refreshQuickUnlock();return 'gone';}
    if(res.err==='cancelled')return 'cancel';
    toast(en?'Biometrics failed. Try again or use the PIN.':'Biometria falhou. Tenta outra vez ou usa o PIN.');
    return 'fail';
  }finally{bioBusy=false;}
}

// ── Configuração (Definições) ──
function openPinSetup(renew){
  const en=currentLang==='en';
  if(!masterPwRaw){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  document.getElementById('pinsetup-title').textContent=en?'🔢 Quick PIN':'🔢 PIN Rápido';
  document.getElementById('pinsetup-intro').textContent=renew==='upgrade'
    ?(en?'For extra security the PIN now has 6 digits. Choose a new one — your current PIN keeps working until you do.':'Para mais segurança, o PIN passa a ter 6 dígitos. Escolhe um novo — o PIN atual continua a funcionar até o fazeres.')
    :renew
    ?(en?'Your PIN expired. Set it again to keep using it on this device.':'O teu PIN expirou. Define-o outra vez para continuares a usá-lo neste dispositivo.')
    :(en?`A 6-digit PIN to reopen this vault on this device (${pinDurationLabel(pinDurationKey()).toLowerCase()}). The master password always works as a fallback.`:`Um PIN de 6 dígitos para reabrir este cofre neste dispositivo (${pinDurationLabel(pinDurationKey()).toLowerCase()}). A chave mestra funciona sempre como alternativa.`);
  document.getElementById('ps-pin1-lbl').textContent=en?'PIN (6 digits)':'PIN (6 dígitos)';
  document.getElementById('ps-pin2-lbl').textContent=en?'Confirm PIN':'Confirmar PIN';
  document.getElementById('ps-ok-btn').textContent=en?'Enable':'Ativar';
  document.getElementById('ps-cancel-btn').textContent=renew?(en?'Later':'Mais tarde'):(en?'Cancel':'Cancelar');
  ['ps-pin1','ps-pin2'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('ps-err').textContent='';
  document.getElementById('pinsetup-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('ps-pin1').focus(),100);
}
// Sequências, repetições e datas de nascimento (DDMMAA / AAAA) são as primeiras a ser tentadas
function weakPin(p){
  if(/^(\d)\1+$/.test(p)||/^(\d\d)\1+$/.test(p)||/^(\d{3})\1$/.test(p))return true;
  const up='01234567890',dn='09876543210';if(up.includes(p)||dn.includes(p))return true;
  if(p.length===6){const d=+p.slice(0,2),m=+p.slice(2,4);if(d>=1&&d<=31&&m>=1&&m<=12)return true;if(/^(19|20)\d\d/.test(p.slice(2))&&+p.slice(0,2)<=12)return true;}
  return ['123123','112233','121212','159753','147258','258369','696969','102030'].includes(p);
}
function closePinSetup(){document.getElementById('pinsetup-overlay').classList.remove('open');}
async function confirmPinSetup(){
  const en=currentLang==='en';
  const p1=document.getElementById('ps-pin1').value.replace(/\D/g,'');
  const p2=document.getElementById('ps-pin2').value.replace(/\D/g,'');
  const err=document.getElementById('ps-err');
  if(p1.length!==PIN_LEN){err.textContent=en?'The PIN must have 6 digits.':'O PIN tem de ter 6 dígitos.';return;}
  if(p1!==p2){err.textContent=en?'The PINs do not match.':'Os PINs não coincidem.';return;}
  if(weakPin(p1)){
    if(!confirm(en?'That PIN is very easy to guess. Use it anyway?':'Esse PIN é muito fácil de adivinhar. Usar mesmo assim?'))return;
  }
  const ok=await savePinUnlock(p1);
  if(!ok){err.textContent=en?'Could not save the PIN.':'Não foi possível guardar o PIN.';return;}
  closePinSetup();renderQuickSettings();
  toast(en?'PIN enabled ✓':'PIN ativado ✓');
}
async function doBioSetup(){
  const en=currentLang==='en';
  let rec=null;try{rec=await idbGet('qu_bio');}catch(e){}
  if(rec){
    if(!confirm(en?'Remove biometric unlock from this device?':'Remover o desbloqueio por biometria deste dispositivo?'))return;
    await clearBioUnlock();renderQuickSettings();
    toast(en?'Biometrics removed.':'Biometria removida.');return;
  }
  if(!await bioSupported()){
    toast(en?'No biometric sensor available on this device/browser.':'Sem sensor biométrico disponível neste dispositivo/browser.');return;
  }
  toast(en?'Confirm with your biometrics...':'Confirma com a tua biometria...');
  const res=await saveBioUnlock();
  if(res.ok){renderQuickSettings();toast(en?'Biometric unlock enabled ✓':'Desbloqueio por biometria ativado ✓');return;}
  if(res.err==='cancelled')return;
  if(res.err==='noprf'){
    toast(en?'This device does not support encryption via biometrics (WebAuthn PRF).':'Este dispositivo não suporta encriptação por biometria (WebAuthn PRF).');
    await clearBioUnlock();return;
  }
  toast(en?'Could not enable biometrics.':'Não foi possível ativar a biometria.');
}
function renderExportSettings(){
  const en=currentLang==='en';
  const t1=document.getElementById('s-export-title');
  if(t1)t1.textContent=en?'📤 Share selected entries':'📤 Partilhar entradas selecionadas';
  const ot=document.getElementById('export-open-txt');
  if(ot)ot.textContent=en?'Choose & export':'Escolher e exportar';
  const desc=document.getElementById('export-desc');
  if(desc)desc.textContent=en?'Export a few entries as their own encrypted file — to give family or a colleague only what they need.':'Exporta algumas entradas como um ficheiro encriptado próprio — para dares à família ou a um colega só o que precisam.';
}
async function renderSnapshotSettings(){
  const en=currentLang==='en';
  const t1=document.getElementById('s-snap-title');
  if(t1)t1.textContent=en?'💾 Backups':'💾 Cópias de Segurança';
  const ot=document.getElementById('snap-open-txt');
  if(ot)ot.textContent=en?'View & restore snapshots':'Ver e restaurar cópias';
  const list=await getSnapshots();
  const desc=document.getElementById('snap-desc');
  if(desc)desc.textContent=en
    ?`${list.length} of ${SNAP_KEEP} snapshots kept on this device, encrypted. A new one is saved each time you save the vault.`
    :`${list.length} de ${SNAP_KEEP} cópias guardadas neste dispositivo, encriptadas. É criada uma nova sempre que gravas o cofre.`;
}
async function renderQuickSettings(){
  const st=document.getElementById('quick-status');if(!st)return;
  const en=currentLang==='en';
  document.getElementById('s-quick-title').textContent=en?'🔓 Quick Unlock':'🔓 Desbloqueio Rápido';
  const pinRec=await getPinRec();
  let bioRec=null;try{bioRec=await idbGet('qu_bio');}catch(e){}
  const bioOk=await bioSupported();
  const lines=[];
  if(pinRec){
    let when;
    if(!pinRec.expiresAt)when=en?'no expiry':'sem expirar';
    else{
      const ms=Math.max(0,pinRec.expiresAt-Date.now());
      const days=Math.floor(ms/86400000);
      when=days>=1
        ?(en?`${days} day(s) left`:`faltam ${days} dia(s)`)
        :(en?`~${Math.max(1,Math.round(ms/3600000))}h left`:`faltam ~${Math.max(1,Math.round(ms/3600000))}h`);
    }
    lines.push(`🔢 <strong style="color:var(--accent-ink)">${en?'PIN active':'PIN ativo'}</strong> — ${when}`);
  }else lines.push(`🔢 ${en?'PIN not set':'PIN não configurado'}`);
  if(bioRec)lines.push(`👆 <strong style="color:var(--accent-ink)">${en?'Biometrics active':'Biometria ativa'}</strong> ${en?'on this device':'neste dispositivo'}`);
  else lines.push(`👆 ${bioOk?(en?'Biometrics available — not enabled':'Biometria disponível — por ativar'):(en?'No biometric sensor here':'Sem sensor biométrico aqui')}`);
  st.innerHTML=lines.join('<br>');
  document.getElementById('pin-cfg-txt').textContent=pinRec?(en?'Change / remove PIN':'Alterar / remover PIN'):(en?'Set up PIN':'Configurar PIN');
  const bcb=document.getElementById('bio-cfg-btn');
  document.getElementById('bio-cfg-txt').textContent=bioRec?(en?'Remove biometrics':'Remover biometria'):(en?'Enable biometrics':'Ativar biometria');
  if(bcb)bcb.style.opacity=(bioOk||bioRec)?'1':'.5';
  const durSel=document.getElementById('pin-dur');
  if(durSel){
    durSel.innerHTML=Object.keys(PIN_DURATIONS).map(k=>`<option value="${k}">${pinDurationLabel(k)}</option>`).join('');
    durSel.value=pinDurationKey();
  }
  const durLbl=document.getElementById('pin-dur-lbl');
  if(durLbl)durLbl.textContent=en?'PIN validity':'Validade do PIN';
  const durRow=document.getElementById('pin-dur-row');
  if(durRow)durRow.style.display=pinRec?'flex':'none';
  document.getElementById('quick-note').textContent=en
    ?'Stored only in this browser, encrypted. The master password is always required on new devices and after the PIN expires.'
    :'Guardado só neste browser, encriptado. A chave mestra continua sempre a ser precisa em dispositivos novos e depois de o PIN expirar.';
}
async function maybePromptPinRenew(){
  if(!pinEnabledFlag())return;
  const rec=await getPinRec();
  if(rec)return;
  setTimeout(()=>{if(masterKey&&!presentationMode)openPinSetup(true);},1200);
}

// ══ COFRE 2FA — CHAVE INDEPENDENTE DA CHAVE MESTRA ══
const RC_ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const T2_MAX_TRIES=5,T2_PIN_ITER=600000,T2_REC_ITER=210000;
function genRecoveryCode(){
  const b=crypto.getRandomValues(new Uint8Array(20));
  let s='';
  for(let i=0;i<20;i++)s+=RC_ALPHABET[b[i]&31];
  return s.match(/.{4}/g).join('-');
}
function rcNormalize(s){
  return String(s||'').toUpperCase().split('').filter(ch=>RC_ALPHABET.includes(ch)).join('');
}
function rcValid(s){return rcNormalize(s).length===20;}
async function deriveRecKey(code,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode('cv2fa-rec:'+rcNormalize(code)),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:T2_REC_ITER,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function derive2faPinKey(pin,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode('cv2fa-pin:'+pin),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:T2_PIN_ITER,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function importTotpKey(b64){
  return crypto.subtle.importKey('raw',await b64ToU8(b64),{name:'AES-GCM'},false,['encrypt','decrypt']);
}
let totpSig=null;
async function encryptTotpArray(){
  if(!totpKey)return totpEnc;
  try{totpSig=syncStable(totp);}catch(e){}
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const bytes=new TextEncoder().encode(JSON.stringify(totp));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},totpKey,bytes));
  return{v:1,iv:await u8ToB64(iv),data:await u8ToB64(ct)};
}
async function decryptTotpArray(key,blob){
  if(!blob)return [];
  const iv=await b64ToU8(blob.iv),ct=await b64ToU8(blob.data);
  const out=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
  const arr=JSON.parse(new TextDecoder().decode(out));
  return Array.isArray(arr)?arr:[];
}
// ── Ativar a proteção ──
async function setup2faVault(pin){
  const raw=crypto.getRandomValues(new Uint8Array(32));
  const rawB64=await u8ToB64(raw);
  totpKey=await importTotpKey(rawB64);
  const code=genRecoveryCode();
  const rSalt=crypto.getRandomValues(new Uint8Array(16));
  const rKey=await deriveRecKey(code,rSalt);
  const rw=await wrapSecret(rKey,rawB64);
  totpRecWrap={salt:bytesToArr(rSalt),iv:rw.iv,wrapped:rw.wrapped};
  totpEnc=await encryptTotpArray();
  totpUnlocked=true;
  session2faRaw=rawB64;
  if(pin)await set2faPin(pin,rawB64);
  markUnsaved();
  return code;
}
async function set2faPin(pin,rawB64){
  if(!rawB64){
    if(!totpKey)return false;
    rawB64=session2faRaw;
  }
  if(!rawB64)return false;
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await derive2faPinKey(pin,salt);
  const w=await wrapSecret(key,rawB64);
  await idbSet('t2_pin',{salt:bytesToArr(salt),iv:w.iv,wrapped:w.wrapped,tries:0,len:pin.length});
  const check=await idbGet('t2_pin');
  return !!(check&&check.wrapped);
}
let session2faRaw=null;
// ── Abrir ──
const open2faWithPin=pinSerial(open2faWithPinRun);
async function open2faWithPinRun(pin){
  let rec;try{rec=await idbGet('t2_pin');}catch(e){rec=null;}
  if(!rec)return{gone:true};
  let rawB64=null;
  // Fase 1 — só validar o PIN. Um erro AQUI é mesmo PIN errado.
  try{
    const key=await derive2faPinKey(pin,arrToBytes(rec.salt));
    rawB64=await unwrapSecret(key,rec);
  }catch(e){
    rec.tries=(rec.tries||0)+1;
    if(rec.tries>=T2_MAX_TRIES){await idbDel('t2_pin');return{blocked:true};}
    await idbSet('t2_pin',rec);
    return{left:T2_MAX_TRIES-rec.tries};
  }
  // PIN correto: repõe o contador antes de mais nada
  try{rec.tries=0;await idbSet('t2_pin',rec);}catch(e){}
  // Fase 2 — decifrar. Um erro aqui NÃO é culpa do PIN e nunca o apaga.
  try{
    return{...await finish2faUnlock(rawB64),len:rec.len||4};
  }catch(e){
    return{decryptFailed:true};
  }
}
async function open2faWithRecovery(code){
  if(!totpRecWrap)return{err:true};
  if(!rcValid(code))return{invalid:true};
  try{
    const key=await deriveRecKey(code,arrToBytes(totpRecWrap.salt));
    const rawB64=await unwrapSecret(key,totpRecWrap);
    return await finish2faUnlock(rawB64);
  }catch(e){return{wrong:true};}
}
async function open2faWithBio(){
  let rec;try{rec=await idbGet('t2_bio');}catch(e){rec=null;}
  if(!rec)return{gone:true};
  let prf;
  try{prf=await prfEval(rec.credId,rec.salt);}
  catch(e){return{err:e&&e.name==='NotAllowedError'?'cancelled':'failed'};}
  if(!prf)return{err:'failed'};
  try{
    const key=await prfToKey(prf);
    const rawB64=await unwrapSecret(key,rec);
    return await finish2faUnlock(rawB64);
  }catch(e){return{err:'failed'};}
}
async function set2faBio(){
  if(!session2faRaw)return{err:'locked'};
  if(!await bioSupported())return{err:'unsupported'};
  let cred;
  try{
    cred=await navigator.credentials.create({publicKey:{
      challenge:crypto.getRandomValues(new Uint8Array(32)),
      rp:{name:'Aurora Vault 2FA',id:location.hostname},
      user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'Aurora Vault-2FA',displayName:'Aurora Vault 2FA'},
      pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'preferred'},
      timeout:60000,extensions:{prf:{}}
    }});
  }catch(e){return{err:e&&e.name==='NotAllowedError'?'cancelled':'create'};}
  if(!cred)return{err:'create'};
  const ext=cred.getClientExtensionResults?.();
  if(ext&&ext.prf&&ext.prf.enabled===false)return{err:'noprf'};
  const credId=bytesToArr(new Uint8Array(cred.rawId));
  const salt=bytesToArr(crypto.getRandomValues(new Uint8Array(32)));
  let prf;
  try{prf=await prfEval(credId,salt);}catch(e){return{err:'noprf'};}
  if(!prf)return{err:'noprf'};
  const key=await prfToKey(prf);
  const w=await wrapSecret(key,session2faRaw);
  await idbSet('t2_bio',{credId,salt,iv:w.iv,wrapped:w.wrapped});
  return{ok:true};
}
async function finish2faUnlock(rawB64){
  totpKey=await importTotpKey(rawB64);
  session2faRaw=rawB64;
  totp=await decryptTotpArray(totpKey,totpEnc);
  try{totpSig=syncStable(totp);}catch(e){}
  totpUnlocked=true;
  return{ok:true};
}
function lock2faVault(){
  totp=[];totpKey=null;totpUnlocked=false;session2faRaw=null;
}
async function clear2faDevice(){
  try{await idbDel('t2_pin');}catch(e){}
  try{await idbDel('t2_bio');}catch(e){}
}
async function check2faMismatch(){
  try{
    if(totpRecWrap)return;
    const hasDev=(await idbGet('t2_pin'))||(await idbGet('t2_bio'));
    if(!hasDev)return;
    const en=currentLang==='en';
    setTimeout(()=>{
      alert(en
        ?'⚠️ This device remembers a protected 2FA vault, but the file you just opened has no protection.\n\nThis usually means the file is an older copy — the one you saved after enabling protection may be somewhere else (check your Downloads folder).\n\nNothing was deleted from this file.'
        :'⚠️ Este dispositivo tem memória de um cofre 2FA protegido, mas o ficheiro que acabaste de abrir não tem proteção nenhuma.\n\nNormalmente isto significa que este ficheiro é uma cópia mais antiga — o que gravaste depois de ativar a proteção pode estar noutro sítio (vê as Transferências).\n\nNada foi apagado deste ficheiro.');
    },900);
  }catch(e){}
}
function checkVaultFormat(){
  if(!vaultReadOnly)return;
  const en=currentLang==='en';
  setTimeout(()=>{
    alert(en
      ?'⚠️ This vault was saved by a NEWER version of Aurora Vault.\n\nSaving from here would delete data this version does not understand. Saving is disabled until you update the app (reload the page twice).'
      :'⚠️ Este cofre foi gravado por uma versão MAIS RECENTE do Aurora Vault.\n\nGravar a partir daqui apagaria dados que esta versão não entende. A gravação fica bloqueada até atualizares a app (recarrega a página duas vezes).');
  },700);
}
async function has2faPin(){try{return !!(await idbGet('t2_pin'));}catch(e){return false;}}
async function has2faBio(){try{return !!(await idbGet('t2_bio'));}catch(e){return false;}}

// ══ COFRE 2FA — INTERFACE ══
let t2Mode='pin',t2PendingCode=null,t2ReviewMode=false,t2PinLen=PIN_LEN,_t2PinUpgradeDue=false;
function t2Err(msg){const e=document.getElementById('t2-err');if(e)e.textContent=msg||'';}
async function render2faGate(){
  const lockedEl=document.getElementById('totp-locked');
  if(!lockedEl)return;
  const en=currentLang==='en';
  const setupEl=document.getElementById('totp-setup');
  const grid=document.getElementById('totp-grid');
  const addBtn=document.getElementById('totp-add-btn');
  const info=document.getElementById('totp-info');
  const shield=document.getElementById('totp-shield-btn');
  const isProtected=!!totpRecWrap;
  const locked=isProtected&&!totpUnlocked;
  lockedEl.style.display=locked?'block':'none';
  if(setupEl)setupEl.style.display=(!isProtected&&!presentationMode)?'block':'none';
  if(grid)grid.style.display=locked?'none':'grid';
  if(addBtn)addBtn.style.display=locked?'none':'';
  if(info)info.style.display=locked?'none':'';
  if(shield)shield.style.display=presentationMode?'none':'';
  const st=document.getElementById('totp-shield-txt');
  if(st)st.textContent=en?'Protection':'Proteção';
  const sTitle=document.getElementById('t2-setup-title');
  if(sTitle)sTitle.textContent=en?'Protect your 2FA vault':'Protege o teu cofre 2FA';
  const sSub=document.getElementById('t2-setup-sub');
  if(sSub)sSub.textContent=en
    ?'Close this tab behind its own PIN, with a key the master password cannot open.'
    :'Fecha este separador com um PIN próprio e uma chave que a palavra-passe mestra não abre.';
  const sBtn=document.getElementById('t2-setup-btn');
  if(sBtn)sBtn.textContent=en?'Enable protection':'Ativar proteção';
  if(locked)await render2faUnlockPanel(true);
}
async function render2faUnlockPanel(reset){
  const en=currentLang==='en';
  const hasBio=(await has2faBio())&&(await bioSupported());
  let pinRec=null;try{pinRec=await idbGet('t2_pin');}catch(e){}
  const hasPin=!!pinRec;t2PinLen=(pinRec&&pinRec.len)||4;
  if(reset)t2Mode=hasBio?'bio':(hasPin?'pin':'rec');
  if(t2Mode==='bio'&&!hasBio)t2Mode=hasPin?'pin':'rec';
  if(t2Mode==='pin'&&!hasPin)t2Mode=hasBio?'bio':'rec';
  document.getElementById('t2-lock-title').textContent=en?'2FA vault protected':'Cofre 2FA protegido';
  document.getElementById('t2-lock-sub').textContent=en
    ?'Your codes are encrypted with a key separate from the master password.'
    :'Os teus códigos estão encriptados com uma chave separada da chave mestra.';
  document.getElementById('t2-bio-txt').textContent=en?'Open with biometrics':'Abrir com biometria';
  document.getElementById('t2-rec-btn').textContent=en?'Open 2FA vault':'Abrir cofre 2FA';
  document.getElementById('t2-bio-btn').style.display=t2Mode==='bio'?'block':'none';
  document.getElementById('t2-pin-wrap').style.display=t2Mode==='pin'?'block':'none';
  document.getElementById('t2-rec-wrap').style.display=t2Mode==='rec'?'block':'none';
  if(reset)t2Err('');
  const parts=[];
  if(t2Mode!=='bio'&&hasBio)parts.push(`<button class="unlock-link" data-act="set2faMode" data-arg="bio">👆 ${en?'Use biometrics':'Usar biometria'}</button>`);
  if(t2Mode!=='pin'&&hasPin)parts.push(`<button class="unlock-link" data-act="set2faMode" data-arg="pin">🔢 ${en?'Enter PIN':'Introduzir PIN'}</button>`);
  if(t2Mode!=='rec')parts.push(`<button class="unlock-link" data-act="set2faMode" data-arg="rec">🔑 ${en?'Recovery code':'Código de recuperação'}</button>`);
  document.getElementById('t2-links').innerHTML=parts.join('<span class="link-sep">·</span>');
  if(t2Mode==='pin'){const i=document.getElementById('t2-pin-input');if(i){i.value='';i.maxLength=t2PinLen;i.placeholder='•'.repeat(t2PinLen);setTimeout(()=>i.focus(),120);}}
  if(t2Mode==='rec'){const i=document.getElementById('t2-rec-input');if(i&&reset)i.value='';}
  if(!hasPin&&!hasBio){
    document.getElementById('t2-lock-sub').textContent=en
      ?'This browser has no PIN saved for the 2FA vault. Use the recovery code — you can set a PIN right after.'
      :'Este browser não tem PIN guardado para o cofre 2FA. Usa o código de recuperação — podes definir um PIN logo a seguir.';
  }
}
function set2faMode(m){t2Mode=m;t2Err('');render2faUnlockPanel(false);}
async function on2faPinInput(){
  const el=document.getElementById('t2-pin-input');
  el.value=el.value.replace(/\D/g,'');
  if(el.value.length<t2PinLen)return;
  const pin=el.value.slice(0,t2PinLen);el.value='';
  const en=currentLang==='en';
  const res=await open2faWithPin(pin);
  if(res.ok){_t2PinUpgradeDue=res.len<PIN_LEN;after2faUnlock();return;}
  if(res.blocked){t2Err(en?'Too many attempts. Use the recovery code.':'Demasiadas tentativas. Usa o código de recuperação.');t2Mode='rec';render2faUnlockPanel(false);return;}
  if(res.gone){t2Mode='rec';render2faUnlockPanel(true);return;}
  if(res.decryptFailed){
    t2Err(en?'PIN correct, but the 2FA data could not be read. Use the recovery code.':'PIN correto, mas não foi possível ler os dados 2FA. Usa o código de recuperação.');
    return;
  }
  t2Err((en?'Wrong PIN. ':'PIN errado. ')+(en?`${res.left} left.`:`Restam ${res.left}.`));
  setTimeout(()=>{const i=document.getElementById('t2-pin-input');if(i)i.focus();},60);
}
async function do2faBioUnlock(){
  const en=currentLang==='en';
  const res=await open2faWithBio();
  if(res.ok){after2faUnlock();return;}
  if(res.gone){render2faUnlockPanel(true);return;}
  if(res.err==='cancelled')return;
  t2Err(en?'Biometrics failed. Try the PIN.':'Biometria falhou. Tenta o PIN.');
}
function on2faRecInput(){
  const el=document.getElementById('t2-rec-input');
  const raw=rcNormalize(el.value).slice(0,20);
  el.value=raw.length?raw.match(/.{1,4}/g).join('-'):'';
}
async function do2faRecoveryUnlock(){
  const en=currentLang==='en';
  const code=document.getElementById('t2-rec-input').value;
  if(!rcValid(code)){t2Err(en?'The code must have 20 characters.':'O código tem de ter 20 caracteres.');return;}
  const res=await open2faWithRecovery(code);
  if(res.ok){after2faUnlock();return;}
  t2Err(en?'Wrong recovery code.':'Código de recuperação errado.');
}
function after2faUnlock(){
  t2Err('');
  renderTotp();
  toast(currentLang==='en'?'2FA vault open ✓':'Cofre 2FA aberto ✓');
  offerDevicePin();
}
async function offerDevicePin(){
  if(presentationMode||!totpUnlocked)return;
  if(_t2PinUpgradeDue){
    _t2PinUpgradeDue=false;
    setTimeout(()=>{if(!totpUnlocked)return;t2SetupMode='change';open2faSetup('upgrade');},700);
    return;
  }
  if(await has2faPin())return;
  if(await has2faBio())return;
  const en=currentLang==='en';
  setTimeout(()=>{
    if(!totpUnlocked)return;
    t2SetupMode='change';
    open2faSetup(true);
  },700);
}
// ── Configuração ──
function open2faSetup(isDeviceOnly){
  const en=currentLang==='en';
  if(presentationMode){toast(en?'Not available in demo mode.':'Indisponível no modo demonstração.');return;}
  const devOnly=!!isDeviceOnly||t2SetupMode==='change';
  document.getElementById('t2setup-title').textContent=devOnly
    ?(en?'🔢 PIN for this device':'🔢 PIN para este dispositivo')
    :(en?'🛡️ Protect the 2FA vault':'🛡️ Proteger o cofre 2FA');
  document.getElementById('t2setup-intro').textContent=isDeviceOnly==='upgrade'
    ?(en?'For extra security the 2FA PIN now has 6 digits. Choose a new one — the current PIN keeps working until you do.'
        :'Para mais segurança, o PIN do 2FA passa a ter 6 dígitos. Escolhe um novo — o PIN atual continua a funcionar até o fazeres.')
    :devOnly
    ?(en?'This device has no PIN yet, so it asks for the recovery code every time. Set a PIN and it will open with 6 digits from now on.'
        :'Este dispositivo ainda não tem PIN, por isso pede sempre o código de recuperação. Define um PIN e passa a abrir com 6 dígitos.')
    :(en?'Choose a PIN for this device. You will then get a recovery code — the only other way in, and the only one that works on a new device.'
        :'Escolhe um PIN para este dispositivo. A seguir recebes um código de recuperação — a única outra forma de entrar, e a única que funciona num dispositivo novo.');
  document.getElementById('t2s-pin1-lbl').textContent=en?'2FA tab PIN (6 digits)':'PIN do separador 2FA (6 dígitos)';
  document.getElementById('t2s-pin2-lbl').textContent=en?'Confirm PIN':'Confirmar PIN';
  document.getElementById('t2s-ok-btn').textContent=en?'Enable':'Ativar';
  document.getElementById('t2s-cancel-btn').textContent=devOnly?(en?'Later':'Mais tarde'):(en?'Cancel':'Cancelar');
  document.getElementById('t2s-ok-btn').textContent=devOnly?(en?'Set PIN':'Definir PIN'):(en?'Enable':'Ativar');
  ['t2s-pin1','t2s-pin2'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('t2s-err').textContent='';
  document.getElementById('t2setup-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('t2s-pin1').focus(),100);
}
function close2faSetup(){document.getElementById('t2setup-overlay').classList.remove('open');t2SetupMode='new';}
async function confirm2faSetup(){
  const en=currentLang==='en';
  const p1=document.getElementById('t2s-pin1').value.replace(/\D/g,'');
  const p2=document.getElementById('t2s-pin2').value.replace(/\D/g,'');
  const err=document.getElementById('t2s-err');
  if(p1.length!==PIN_LEN){err.textContent=en?'The PIN must have 6 digits.':'O PIN tem de ter 6 dígitos.';return;}
  if(p1!==p2){err.textContent=en?'The PINs do not match.':'Os PINs não coincidem.';return;}
  if(weakPin(p1)&&!confirm(en?'That PIN is very easy to guess. Use it anyway?':'Esse PIN é muito fácil de adivinhar. Usar mesmo assim?'))return;
  if(pinEnabledFlag()){
    const rec=await getPinRec();
    if(rec){
      try{
        const k=await pinKeyFrom(p1,arrToBytes(rec.salt));
        await unwrapSecret(k,rec);
        if(!confirm(en?'That is the same PIN you use to open the app. Using a different one is safer. Continue anyway?':'Esse é o mesmo PIN que usas para abrir a app. Usar um diferente é mais seguro. Continuar mesmo assim?'))return;
      }catch(e){}
    }
  }
  err.textContent='';
  if(t2SetupMode==='change'){
    const ok=await set2faPin(p1);
    t2SetupMode='new';
    close2faSetup();
    if(ok)toast(en?'PIN saved on this device ✓':'PIN guardado neste dispositivo ✓');
    else alert(en?'The PIN could NOT be saved in this browser. Check that site data is not blocked.':'O PIN NÃO ficou guardado neste browser. Verifica se os dados do site não estão bloqueados.');
    return;
  }
  const code=await setup2faVault(p1);
  close2faSetup();
  renderTotp();
  showRecoveryModal(code,false);
  try{await saveFile();}catch(e){}
}
// ── Código de recuperação ──
function showRecoveryModal(code,isReview){
  const en=currentLang==='en';
  t2PendingCode=code;t2ReviewMode=!!isReview;
  document.getElementById('t2rec-title').textContent=en?'🔑 Recovery code':'🔑 Código de recuperação';
  document.getElementById('t2rec-intro').textContent=isReview
    ?(en?'This is your current recovery code. It opens the 2FA vault on any device.':'Este é o teu código de recuperação atual. Abre o cofre 2FA em qualquer dispositivo.')
    :(en?'Protection is on. Write this code down now — it is the only way into the 2FA vault on a new device.':'Proteção ativada. Escreve este código agora — é a única forma de entrar no cofre 2FA num dispositivo novo.');
  document.getElementById('t2rec-code').textContent=code;
  document.getElementById('t2rec-warn').innerHTML=en
    ?'Keep it on paper, away from the vault file. The master password does <b>not</b> open the 2FA vault.'
    :'Guarda-o em papel, longe do ficheiro do cofre. A palavra-passe mestra <b>não</b> abre o cofre 2FA.';
  document.getElementById('t2rec-copy').textContent=en?'📋 Copy':'📋 Copiar';
  document.getElementById('t2rec-print').textContent=en?'🖨️ Print':'🖨️ Imprimir';
  document.getElementById('t2rec-ack-lbl').textContent=en?'I saved the code somewhere safe':'Guardei o código num sítio seguro';
  document.getElementById('t2rec-done').textContent=en?'Done':'Concluído';
  const ack=document.getElementById('t2rec-ack');
  ack.checked=!!isReview;
  document.getElementById('t2rec-done').disabled=!isReview;
  document.getElementById('t2rec-overlay').classList.add('open');
}
function closeRecoveryModal(){
  document.getElementById('t2rec-overlay').classList.remove('open');
  t2PendingCode=null;
}
function copyRecoveryCode(){
  if(t2PendingCode)copyText(t2PendingCode,currentLang==='en'?'Code copied ✓':'Código copiado ✓');
}
function printRecoveryCode(){
  if(!t2PendingCode)return;
  const en=currentLang==='en';
  const now=new Date().toLocaleDateString(en?'en-GB':'pt-PT',{year:'numeric',month:'long',day:'numeric'});
  const html=`<!DOCTYPE html><html lang="${en?'en':'pt'}"><head><meta charset="UTF-8"><title>${en?'2FA recovery code':'Código de recuperação 2FA'}</title>
<style>@page{size:A4;margin:20mm}body{font-family:Georgia,serif;color:#111;padding:30px;line-height:1.6}
h1{font-size:19pt;border-bottom:2px solid #111;padding-bottom:8px}
.code{font-family:'Courier New',monospace;font-size:20pt;font-weight:bold;letter-spacing:3px;border:2px dashed #111;padding:22px;text-align:center;margin:22px 0}
.w{background:#fff4f4;border:2px solid #c00;padding:11px 14px;color:#900;font-weight:bold;font-size:11pt}
.pbtn{position:fixed;top:14px;right:14px;padding:11px 20px;font-family:system-ui;background:#111;color:#fff;border:0;border-radius:5px;cursor:pointer}
@media print{.pbtn{display:none}body{padding:0}}</style></head><body>
<button class="pbtn">🖨️ ${en?'Print':'Imprimir'}</button>
<h1>${en?'2FA recovery code — Aurora Vault':'Código de recuperação 2FA — Aurora Vault'}</h1>
<p>${en?'This code opens the 2FA vault (verification codes) on any device. It is independent from the master password.':'Este código abre o cofre 2FA (códigos de verificação) em qualquer dispositivo. É independente da palavra-passe mestra.'}</p>
<div class="code">${esc(t2PendingCode)}</div>
<div class="w">⚠️ ${en?'Without this code and without the device PIN, the 2FA codes cannot be recovered. Not even the master password opens them.':'Sem este código e sem o PIN do dispositivo, os códigos 2FA não podem ser recuperados. Nem a palavra-passe mestra os abre.'}</div>
<p style="margin-top:22px;font-size:10pt;color:#666">${en?'Generated on':'Gerado a'} ${now}</p>
</body></html>`;
  const w=window.open('','_blank');
  if(!w){toast(en?'Allow pop-ups to print.':'Permite pop-ups para imprimir.');return;}
  w.document.write(html);w.document.close();{const pb=w.document.querySelector('.pbtn');if(pb)pb.addEventListener('click',()=>w.print());}
}

// ══ COFRE 2FA — GESTOR ══
let t2SetupMode='new';
function open2faManager(){render2faManager();document.getElementById('t2mgr-overlay').classList.add('open');}
function close2faManager(){document.getElementById('t2mgr-overlay').classList.remove('open');}
async function render2faManager(){
  const en=currentLang==='en';
  document.getElementById('t2mgr-title').textContent=en?'🛡️ 2FA vault protection':'🛡️ Proteção do cofre 2FA';
  document.getElementById('t2mgr-close').textContent=en?'Close':'Fechar';
  const isProt=!!totpRecWrap, hasPin=await has2faPin(), hasBio=await has2faBio(), bioOk=await bioSupported();
  const S=[],A=[];
  const btn=(fn,label,danger)=>`<button class="btn ${danger?'btn-ghost':'btn-ghost'}" ${avActAttrs(fn)} style="width:100%;padding:12px;text-align:left;justify-content:flex-start${danger?';color:var(--red);border-color:var(--red)':''}">${label}</button>`;
  if(!isProt){
    S.push(en?'The 2FA vault is <b>not protected</b> — codes are encrypted with the master password only.':'O cofre 2FA <b>não está protegido</b> — os códigos estão encriptados apenas com a chave mestra.');
    A.push(btn('t2mgrSetup()','🛡️ '+(en?'Enable protection':'Ativar proteção')));
  }else if(!totpUnlocked){
    S.push(en?'🛡️ <b style="color:var(--accent-ink)">Protected</b> and closed.':'🛡️ <b style="color:var(--accent-ink)">Protegido</b> e fechado.');
    S.push('🔢 '+(hasPin?(en?'PIN saved on this device':'PIN guardado neste dispositivo'):(en?'<b style="color:var(--red)">No PIN on this device</b>':'<b style="color:var(--red)">Sem PIN neste dispositivo</b>')));
    S.push('👆 '+(hasBio?(en?'Biometrics saved here':'Biometria guardada aqui'):(en?'No biometrics here':'Sem biometria aqui')));
    S.push('<span style="font-size:.9em;opacity:.8">'+(en?'Open the vault to manage it.':'Abre o cofre para o gerires.')+'</span>');
  }else{
    S.push('🛡️ <b style="color:var(--accent-ink)">'+(en?'Protected':'Protegido')+'</b> — '+(en?'independent key':'chave independente'));
    S.push('🔢 '+(hasPin?(en?'PIN set on this device':'PIN definido neste dispositivo'):(en?'No PIN on this device':'Sem PIN neste dispositivo')));
    S.push('👆 '+(hasBio?(en?'Biometrics active here':'Biometria ativa aqui'):(bioOk?(en?'Biometrics available':'Biometria disponível'):(en?'No biometric sensor here':'Sem sensor biométrico aqui'))));
    A.push(btn('regen2faRecovery()','🔑 '+(en?'New recovery code':'Novo código de recuperação')));
    A.push(btn('change2faPin()','🔢 '+(hasPin?(en?'Change PIN':'Alterar PIN'):(en?'Set PIN':'Definir PIN'))));
    if(bioOk||hasBio)A.push(btn('toggle2faBio()','👆 '+(hasBio?(en?'Remove biometrics':'Remover biometria'):(en?'Enable biometrics':'Ativar biometria'))));
    A.push(btn('disable2faProtection()','⚠️ '+(en?'Disable protection':'Desativar proteção'),true));
  }
  document.getElementById('t2mgr-status').innerHTML=S.join('<br>');
  document.getElementById('t2mgr-actions').innerHTML=A.join('');
}
async function regen2faRecovery(){
  const en=currentLang==='en';
  if(!session2faRaw)return;
  if(!confirm(en?'A new code will be generated and the old one stops working. Continue?':'Vai ser gerado um código novo e o antigo deixa de funcionar. Continuar?'))return;
  const code=genRecoveryCode();
  const rSalt=crypto.getRandomValues(new Uint8Array(16));
  const rKey=await deriveRecKey(code,rSalt);
  const rw=await wrapSecret(rKey,session2faRaw);
  totpRecWrap={salt:bytesToArr(rSalt),iv:rw.iv,wrapped:rw.wrapped};
  markUnsaved();
  close2faManager();
  showRecoveryModal(code,false);
}
function change2faPin(){
  t2SetupMode='change';
  close2faManager();
  open2faSetup();
}
async function toggle2faBio(){
  const en=currentLang==='en';
  if(await has2faBio()){
    if(!confirm(en?'Remove biometric access to the 2FA vault on this device?':'Remover o acesso por biometria ao cofre 2FA neste dispositivo?'))return;
    try{await idbDel('t2_bio');}catch(e){}
    render2faManager();toast(en?'Biometrics removed.':'Biometria removida.');return;
  }
  toast(en?'Confirm with your biometrics...':'Confirma com a tua biometria...');
  const res=await set2faBio();
  if(res.ok){render2faManager();toast(en?'Biometrics enabled ✓':'Biometria ativada ✓');return;}
  if(res.err==='cancelled')return;
  if(res.err==='noprf'){toast(en?'This device cannot encrypt via biometrics.':'Este dispositivo não consegue encriptar por biometria.');try{await idbDel('t2_bio');}catch(e){}return;}
  toast(en?'Could not enable biometrics.':'Não foi possível ativar a biometria.');
}
async function disable2faProtection(){
  const en=currentLang==='en';
  if(!totpUnlocked)return;
  if(!confirm(en?'The 2FA codes go back to being protected by the master password only. Continue?':'Os códigos 2FA voltam a ficar protegidos apenas pela chave mestra. Continuar?'))return;
  totpRecWrap=null;totpEnc=null;totpKey=null;session2faRaw=null;totpUnlocked=false;
  await clear2faDevice();
  markUnsaved();
  close2faManager();
  renderTotp();
  toast(en?'Protection disabled.':'Proteção desativada.');
}

// ══ LOCK SCREEN ══
function toggleField(id){const i=document.getElementById(id);i.type=i.type==='password'?'text':'password';}

// ══ LOGIN FLOW ══
let pendingVaultFile=null;
let pendingVaultText=null;

function backToInitial(){
  pendingVaultFile=null;pendingVaultText=null;lockHeldPw=null;lockTypedPw='';
  document.getElementById('login-state-initial').style.display='block';
  document.getElementById('login-state-open').style.display='none';
  document.getElementById('login-state-new').style.display='none';
  document.getElementById('lock-error').textContent='';
  document.getElementById('attempts-warn').textContent='';
  lockSubText();lockMineLinks();
}
function startOpenVault(){
  if(lockedOut)return;
  lockSwipeNeed=false;
  pendingVaultFile=null;pendingVaultText=null;lockHeldPw=null;
  document.getElementById('login-state-initial').style.display='none';
  document.getElementById('login-state-open').style.display='block';
  document.getElementById('open-step-file').style.display='block';
  document.getElementById('open-step-pw').style.display='none';
  lockSubText();
  try{pickVaultFile();}catch(e){}
}
function startNewVault(){
  if(lockedOut)return;
  pendingVaultFile=null;pendingVaultText=null;lockHeldPw=null;
  document.getElementById('login-state-initial').style.display='none';
  document.getElementById('login-state-new').style.display='block';
  document.getElementById('new-pw1').value='';
  document.getElementById('new-pw2').value='';
  document.getElementById('new-pw-match').textContent='';
  setTimeout(()=>document.getElementById('new-pw1').focus(),100);
}
function backToFileStep(){
  pendingVaultFile=null;pendingVaultText=null;
  const fm=document.getElementById('l-file-meta');if(fm)fm.style.display='none';
  document.getElementById('open-step-file').style.display='block';
  document.getElementById('open-step-pw').style.display='none';
  document.getElementById('lock-error').textContent='';
}
function onFileSelected(e){
  const file=e.target.files[0];if(!file)return;
  pendingVaultText=null;lockHeldPw=null;
  pendingVaultFile=file;
  // Show password step
  document.getElementById('open-step-file').style.display='none';
  document.getElementById('open-step-pw').style.display='block';
  document.getElementById('l-file-name').textContent=file.name;
  document.getElementById('master-pw').value='';
  showFileMeta(file);lockSubText();
  refreshQuickUnlock(true);lockUseTypedPw();
  e.target.value='';
}
async function submitOpenVault(pwArg,qk){
  if(lockedOut)return;
  if(!pendingVaultFile&&!pendingVaultText){
    if(typeof pwArg==='string'){lockHeldPw=pwArg;lockHeldQk=qk||null;}
    if(!(await lockEnsureFile()))return;
  }
  lockHeldPw=null;lockHeldQk=null;
  if(!pendingVaultFile&&!pendingVaultText)return;
  const quick=typeof pwArg==='string';
  const pw=quick?pwArg:document.getElementById('master-pw').value;
  if(!quick&&pw.length<4){setLockError(t('lockMinChars'));return;}
  if(_openBusy)return;
  _openBusy=true;
  let text,salt,iter,key,data;
  try{
    text=((quick||!pendingVaultFile)&&pendingVaultText)?pendingVaultText:await pendingVaultFile.text();
    const container=JSON.parse(text);
    salt=new Uint8Array(container.salt);iter=containerIter(container);
    // Chave guardada no PIN/biometria para este mesmo salt → sem PBKDF2
    if(qk&&qk.k&&qk.i===iter&&qk.s===b64e(salt)){
      try{key=await importRawKey(b64d(qk.k));data=await decrypt(key,container.payload);}catch(e){key=null;}
    }
    if(!key){key=await deriveKey(pw,salt,iter);data=await decrypt(key,container.payload);}
  }catch{
    _openBusy=false;
    if(quick){
      await clearQuickUnlock();
      await refreshQuickUnlock();
      setLockError(currentLang==='en'
        ?'Saved unlock no longer matches this vault — use the master password.'
        :'O desbloqueio guardado já não corresponde a este cofre — usa a chave mestra.');
      return;
    }
    handleFailedAttempt();
    return;
  }
  _openBusy=false;
  // Só depois de desencriptar com sucesso: com uma palavra-passe errada a chave ficava definida e um Ctrl+S
  // no ecrã de entrada gravava um cofre vazio (com a chave errada) por cima do ficheiro verdadeiro.
  window._salt=salt;window._iter=iter;masterPwRaw=pw;masterKey=key;
  if(quick&&!quickFresh(qk))refreshQuickSecrets();
  try{
    vault=data.vault||data||[];notes=data.notes||[];bankCards=data.bankCards||[];activityLog=data.activityLog||[];documents=data.documents||[];trash=data.trash||[];totp=data.totp||[];customCats=data.customCats||[];docFolders=data.docFolders||[];currentFolderId=null;vaultFolders=data.vaultFolders||[];currentVaultFolderId=null;wifiNets=data.wifiNets||[];legacyNote=data.legacyNote||'';legacyOwner=data.legacyOwner||'';personalInfo=data.personalInfo||[];subscriptions=data.subscriptions||[];storeCards=data.storeCards||[];assets=data.assets||[];vaultName=data.vaultName||'';
  totpRecWrap=data.totpRecWrap||null;totpEnc=data.totpEnc||null;totpKey=null;totpUnlocked=false;
  totp=totpRecWrap?[]:(data.totp||[]);cleanOldTrash();
  payloadExtras={};
  Object.keys(data).forEach(k=>{if(!KNOWN_KEYS.includes(k))payloadExtras[k]=data[k];});
  vaultReadOnly=(Number(data.fmt)||1)>VAULT_FMT;
  check2faMismatch();
  checkVaultFormat();
    pendingVaultText=text;failedAttempts=0;doUnlock();touchPinExpiry();maybePromptPinRenew();
    setTimeout(()=>{try{maybeUpgradeKdf();}catch(e){}},1500);
    if(_pinUpgradeDue){_pinUpgradeDue=false;setTimeout(()=>{if(masterKey&&!presentationMode)openPinSetup('upgrade');},1600);}
    setTimeout(()=>{try{renderNotifBtn();checkNotifs();}catch(e){}},2500);
    applyPendingGo();
    setTimeout(()=>{try{driveCheckOnOpen();}catch(e){}},500);
  }catch(e){
    console.error('open vault:',e);
    masterKey=null;masterPwRaw='';window._iter=0;
    setLockError(currentLang==='en'?'The vault could not be loaded.':'Não foi possível carregar o cofre.');
  }
}
let _openBusy=false;
function pickPresetColor(type,color){applyColor(type,color);const p=document.getElementById('picker-'+type);if(p)p.value=color;renderPresetHighlights();}
function pickFlag(id){selectedFlag=id;renderFlagPicker();}
function pickStoreColor(c){selectedStoreColor=c;renderStoreColors();}
function pickSubColor(c){selectedSubColor=c;renderSubColors();}
function fillField(id,v){const el=document.getElementById(id);if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}}
function hcGoEntry(id){closeHealthCheck();goToEntry(id);}
function readShare(id){closeReadMode();openShareModal(id);}
function readEdit(id){closeReadMode();editEntry(id);}
function avAddAurora(){avAddClose();if(typeof auroraOpen==='function')auroraOpen();}
// Chamada escrita como texto («fn('x')») → atributos data-act/data-args (para geradores que recebem a ação em texto)
function avActAttrs(call){
  const m=/^(\w+)\((.*)\)$/.exec(String(call).trim());if(!m){console.warn('avActAttrs:',call);return '';}
  const args=m[2].trim()?m[2].split(',').map(a=>{a=a.trim();return /^'.*'$/.test(a)?a.slice(1,-1):a==='null'?null:a==='true'?true:a==='false'?false:Number(a);}):[];
  return 'data-act="'+m[1]+'"'+(args.length?' data-args="'+esc(JSON.stringify(args))+'"':'');
}
function t2mgrSetup(){close2faManager();open2faSetup();}
function openSettingsTab(t){openSettings();if(typeof switchSettingsTab==='function')switchSettingsTab(t);}
function auroraOpenSafe(){if(typeof auroraOpen==='function')auroraOpen();}
function gsOpenEntry(id){closeGlobalSearch();editEntry(id);}
function gsOpenNote(id){closeGlobalSearch();switchTab('notes');setTimeout(()=>selectNote(id),150);}
function gsOpenCards(){closeGlobalSearch();switchTab('cards');}
function closeSyncModal(){const m=document.getElementById('sync-modal');if(m)m.classList.remove('open');}
function setEntryField(i,key,v){if(entryFields[i])entryFields[i][key]=v;}
function readOpenDoc(id){closeReadMode();switchTab('docs');setTimeout(()=>openDocModal(id),150);}
function readGoFolder(id){closeReadMode();switchTab('docs');goToFolder(id||null);}
function auroraHeadTap(){if(window.matchMedia('(max-width:760px)').matches)auroraToggleMin();}
function aurLaunchKey(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();auroraOpen();}}
function avGaScan(){avGaClose();openQrScanner('gauth');}
function avWalEdit(id){avWalClose(true);editStoreCard(id);}
function avWalDelete(id){avWalClose(true);deleteStoreCard(id);}
function avAlToggleAll(){AV_AL_ALL=!AV_AL_ALL;aurAlertsRender();}
function avCardPinTap(id,el){avCardPin(el,id);}
function onEntryPwInput(){checkPwStrength();checkDuplicate();}
function totpOpenGaImport(){closeTotpModal();avGaOpen();}
function onNewPw1Input(){checkNewPwMatch();renderPwStrength('new-pw1','new-pw-strength');}
function checkNewPwMatch(){
  const p1=document.getElementById('new-pw1').value;
  const p2=document.getElementById('new-pw2').value;
  const el=document.getElementById('new-pw-match');
  if(!p2){el.textContent='';return;}
  if(p1===p2){
    el.textContent='✓ '+(currentLang==='en'?'Passwords match!':'Passwords iguais!');
    el.style.color='var(--green)';
  }else{
    el.textContent='✗ '+(currentLang==='en'?'Passwords do not match':'Passwords diferentes');
    el.style.color='var(--red)';
  }
}
async function submitNewVault(){
  if(lockedOut)return;
  const p1=document.getElementById('new-pw1').value;
  const p2=document.getElementById('new-pw2').value;
  if(p1.length<4){setLockError(t('lockMinChars'));return;}
  if(p1!==p2){setLockError(currentLang==='en'?'Passwords do not match!':'As passwords não coincidem!');return;}
  // O cofre novo não pode herdar o destino de gravação do anterior (ficheiro memorizado, cópia no dispositivo, Drive)
  if(!FSA_OK||driveOn()){
    const en=currentLang==='en',msgs=[];
    let hasLocal=false;try{const l=await localVaultGet();hasLocal=!!(l&&l.json);}catch(e){}
    if(!FSA_OK&&hasLocal)msgs.push(en?'This device already stores a vault — the new one will replace it here (export a copy of the old one first).':'Este dispositivo já guarda um cofre — o novo vai substituí-lo aqui (exporta antes uma cópia do antigo).');
    if(driveOn())msgs.push(en?'Google Drive sync will be turned off on this device, so the vault on Drive is not replaced.':'A sincronização com o Google Drive fica desligada neste dispositivo, para o cofre que está no Drive não ser substituído.');
    if(msgs.length&&!confirm(msgs.join('\n\n')+'\n\n'+(en?'Continue?':'Continuar?')))return;
    if(driveOn())dCfg('on',null);
  }
  vaultFileHandle=null;pendingVaultFile=null;pendingVaultText=null;
  resetVaultState();
  masterPwRaw=p1;
  const nm=document.getElementById('new-name');
  vaultName=nm?nm.value.trim():'';
  const salt=crypto.getRandomValues(new Uint8Array(16));
  masterKey=await deriveKey(p1,salt,KDF_ITER);
  window._salt=salt;window._iter=KDF_ITER;
  try{localStorage.setItem('av_mode','simple');localStorage.removeItem('av_onb_hide');}catch(e){}
  doUnlock();
}
// Keep old names as aliases for drag-drop compatibility
async function newVault(){submitNewVault();}
function loadFile(){startOpenVault();}
async function onFileChosen(e){onFileSelected(e);}
function handleFailedAttempt(){
  failedAttempts++;const rem=MAX_ATTEMPTS-failedAttempts;
  if(failedAttempts>=MAX_ATTEMPTS){lockedOut=true;setLockError(t('lockErrTooMany'));document.getElementById('attempts-warn').textContent=t('lockErrReload');document.getElementById('master-pw').disabled=true;return;}
  setLockError(t('lockErr'));document.getElementById('attempts-warn').textContent=`⚠️ ${rem} ${t('lockErrRemaining')}`;
}
function setLockError(msg){document.getElementById('lock-error').textContent=msg;setTimeout(()=>document.getElementById('lock-error').textContent='',4000);}

function doUnlock(){
  const lockScreen=document.getElementById('lock-screen');
  const app=document.getElementById('app');
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Dispara a animação de entrada com o escudo grande
  const vdEarly=document.getElementById('vault-door');
  if(vdEarly&&!reduce){vdEarly.classList.remove('show');void vdEarly.offsetWidth;vdEarly.classList.add('show');}
  const unlockDelay=reduce?300:1000;
  lockScreen.style.transition='opacity .4s ease';
  const unlockKey=masterKey;
  const stillOpen=()=>!!masterKey&&masterKey===unlockKey;
  setTimeout(()=>{if(stillOpen())lockScreen.style.opacity='0';},reduce?0:150);
  setTimeout(()=>{
    if(!stillOpen()){lockScreen.style.opacity='1';lockScreen.style.transition='';const vd=document.getElementById('vault-door');if(vd)vd.classList.remove('show');return;}
    lockScreen.style.display='none';
    lockScreen.style.opacity='1';
    lockScreen.style.transition='';
    // Make sure app is fully reset before showing
    app.style.display='';
    app.classList.remove('visible');
    // Force reflow
    void app.offsetHeight;
    app.classList.add('visible');
    const vd=document.getElementById('vault-door');
    if(vd&&!reduce){setTimeout(()=>vd.classList.remove('show'),700);}
    const fl=document.getElementById('unlock-flash');
    if(fl){fl.classList.remove('play');void fl.offsetWidth;fl.classList.add('play');}
    setTimeout(positionTabIndicator,80);
    document.getElementById('master-pw').value='';
    try{renderAll();}catch(e){console.warn('renderAll error:',e);}
    startAutoLock();
    switchTab('dashboard');
    setTimeout(()=>checkFirstTime(),600);
  },unlockDelay);
}
// Apaga da memória TODOS os dados do cofre (antes ficavam para trás info pessoal, subscrições, cartões de loja,
// bens e o nome — e um cofre novo criado a seguir herdava-os)
function resetVaultState(){
  vault=[];notes=[];bankCards=[];activityLog=[];documents=[];trash=[];totp=[];customCats=[];docFolders=[];currentFolderId=null;vaultFolders=[];currentVaultFolderId=null;wifiNets=[];legacyNote='';legacyOwner='';
  personalInfo=[];subscriptions=[];storeCards=[];assets=[];vaultName='';
  totpEnc=null;totpRecWrap=null;totpKey=null;totpUnlocked=false;session2faRaw=null;payloadExtras={};vaultReadOnly=false;
  pendingImportData=[];pendingDocFile=null;entryAttachment=null;entryAttachments=[];assetAttachments=[];entryFields=[];
}
function lockApp(){
  if(presentationMode){exitPresentationMode();return;}
  try{closeGlobalSearch();}catch(e){}
  try{closeQrScanner();}catch(e){}
  resetVaultState();masterKey=null;masterPwRaw='';window._iter=0;_quKeys={};currentCat='all';currentTag='';
  hasUnsaved=false;editingNoteId=null;editingId=null;
  stopAutoLock();
  const app=document.getElementById('app');
  app.classList.remove('visible');
  app.style.display='none';
  const lockScreen=document.getElementById('lock-screen');
  lockScreen.style.display='flex';
  lockScreen.style.opacity='1';
  const icon=document.getElementById('vault-icon');
  icon.classList.remove('unlocking');
  icon.style.opacity='1';
  icon.style.transform='';
  // Close any open modals
  document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  document.getElementById('welcome-screen').classList.remove('show');
  const pwStep=document.getElementById('open-step-pw');
  if(pwStep&&pwStep.style.display!=='none'){lockSwipeNeed=true;lockSwipeRetry=false;refreshQuickUnlock(false);}
  try{lockSubText();auroraSkyStart();}catch(e){}
  try{avFlushNow();}catch(e){}
}

// ══ AUTO-LOCK ══
function startAutoLock(){
  stopAutoLock();
  if(autoLockSeconds===0){document.getElementById('autolock-badge').style.display='none';return;}
  autoLockSecondsLeft=autoLockSeconds;
  autoLockCountdown=setInterval(()=>{autoLockSecondsLeft--;if(autoLockSecondsLeft<=0){stopAutoLock();lockApp();toast(t('toastLocked'));}},1000);
  ['mousemove','keydown','click','touchstart'].forEach(ev=>document.addEventListener(ev,resetAutoLock,{passive:true}));
}
function resetAutoLock(){autoLockSecondsLeft=autoLockSeconds;}
function stopAutoLock(){
  clearInterval(autoLockCountdown);autoLockCountdown=null;
  document.getElementById('autolock-badge').style.display='none';
  ['mousemove','keydown','click','touchstart'].forEach(ev=>document.removeEventListener(ev,resetAutoLock));
}
function updateAutoLockBadge(){const m=Math.floor(autoLockSecondsLeft/60),s=autoLockSecondsLeft%60;document.getElementById('autolock-badge').textContent=`🔒 ${m}:${s.toString().padStart(2,'0')}`;}
function setTimeout2(mins){
  autoLockSeconds=mins*60;
  document.querySelectorAll('.timeout-btn').forEach(b=>b.classList.remove('active'));
  const map={0:'to-0',1:'to-1',5:'to-5',10:'to-10',30:'to-30'};
  const el=document.getElementById(map[mins]);if(el)el.classList.add('active');
  if(autoLockCountdown)startAutoLock();
}

// ══ THEME / ACCENT ══
// ══ THEME & COLOR SYSTEM ══
// Each theme stores its own bg, accent, text colors
const DEFAULT_COLORS = {
  dark:  { bg:'#0a0e1a', accent:'#c9a84c', text:'#e8e4d8' },
  light: { bg:'#f0ede8', accent:'#c9a84c', text:'#1e1c1a' }
};
let themeColors = {
  dark:  {...DEFAULT_COLORS.dark},
  light: {...DEFAULT_COLORS.light}
};
// Load saved colors from localStorage
try{
  const saved=localStorage.getItem('cv_theme_colors');
  if(saved){const parsed=JSON.parse(saved);if(parsed.dark&&parsed.light)themeColors=parsed;}
  const savedTheme=localStorage.getItem('cv_theme_mode');
  if(savedTheme)currentTheme=savedTheme;
}catch(e){}
let settingsActiveTheme = 'dark'; // which theme tab is showing in settings

// Preset palette for pickers
const BG_PRESETS_DARK  = ['#0a0e1a','#080808','#0d0f14','#0a1410','#160a0e','#0e1118','#1a1510','#1a0e0a'];
const BG_PRESETS_LIGHT = ['#f0ede8','#ffffff','#f5f0e8','#e8f0e8','#f0e8e8','#e8eaf0','#fafafa','#f8f4e8'];
const ACCENT_PRESETS   = ['#c9a84c','#4c8caf','#4caf82','#e05252','#9b6ec7','#e08840','#e0c850','#50c8c8'];
const TEXT_PRESETS_DARK  = ['#e8e4d8','#ffffff','#d4d0c8','#c8d4e0','#d0e0c8','#e0c8c8','#c8c8e0','#b0b0b0'];
const TEXT_PRESETS_LIGHT = ['#1e1c1a','#000000','#2a2824','#1a2030','#1a3020','#301a1a','#1a1a30','#3a3630'];

function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16);
  const g=parseInt(hex.slice(3,5),16);
  const b=parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
function darkenHex(hex, factor=0.6){
  const r=Math.round(parseInt(hex.slice(1,3),16)*factor);
  const g=Math.round(parseInt(hex.slice(3,5),16)*factor);
  const b=Math.round(parseInt(hex.slice(5,7),16)*factor);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function lightenHex(hex, factor=1.3){
  const r=Math.min(255,Math.round(parseInt(hex.slice(1,3),16)*factor));
  const g=Math.min(255,Math.round(parseInt(hex.slice(3,5),16)*factor));
  const b=Math.min(255,Math.round(parseInt(hex.slice(5,7),16)*factor));
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function saveThemeColors(){
  try{localStorage.setItem('cv_theme_colors',JSON.stringify(themeColors));}catch(e){}
}
// Texto na cor de destaque com contraste legível (WCAG AA, 4,5:1) sobre fundo, painéis e cartões:
// o dourado por omissão sobre o tema claro ficava a ~2:1. No tema escuro fica praticamente sempre igual à cor escolhida.
function relLum(rgb){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(rgb[0])+.7152*f(rgb[1])+.0722*f(rgb[2]);}
function contrastRatio(a,b){const x=relLum(a),y=relLum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function accentInk(accent,bgs){
  const[h,s,l]=hexToHslArr(accent),dark=relLum(bgs[0])<.4;
  for(let i=0;i<=34;i++){
    const rgb=hslToRgbArr(h,s,dark?Math.min(1,l+i*.02):Math.max(0,l-i*.02));
    if(bgs.every(b=>contrastRatio(rgb,b)>=4.5))return`rgb(${rgb.join(',')})`;
  }
  return dark?'#ffffff':'#000000';
}
function hexToHslArr(hex){const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0;const l=(max+min)/2;if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h/=6;}return[h*360,s,l];}
function hslToRgbArr(h,s,l){h=(((h%360)+360)%360)/360;const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};let r,g,b;if(s===0){r=g=b=l;}else{const q=l<0.5?l*(1+s):l+s-l*s;const p=2*l-q;r=f(p,q,h+1/3);g=f(p,q,h);b=f(p,q,h-1/3);}return[Math.round(r*255),Math.round(g*255),Math.round(b*255)];}
function applyThemeColors(theme){
  const c=themeColors[theme];
  const root=document.documentElement;
  // Apply bg variants
  const bgR=parseInt(c.bg.slice(1,3),16);
  const bgG=parseInt(c.bg.slice(3,5),16);
  const bgB=parseInt(c.bg.slice(5,7),16);
  const isDark=theme==='dark';
  const panelFactor=isDark?1.3:0.95;
  const borderFactor=isDark?1.8:0.92;
  const cardFactor=isDark?1.15:0.97;
  const panelR=Math.min(255,Math.round(bgR*panelFactor));
  const panelG=Math.min(255,Math.round(bgG*panelFactor));
  const panelB=Math.min(255,Math.round(bgB*panelFactor));
  const borderR=Math.min(255,Math.round(bgR*borderFactor));
  const borderG=Math.min(255,Math.round(bgG*borderFactor));
  const borderB=Math.min(255,Math.round(bgB*borderFactor));
  const cardR=Math.min(255,Math.round(bgR*cardFactor));
  const cardG=Math.min(255,Math.round(bgG*cardFactor));
  const cardB=Math.min(255,Math.round(bgB*cardFactor));
  root.style.setProperty('--bg',c.bg);
  root.style.setProperty('--panel',`rgb(${panelR},${panelG},${panelB})`);
  root.style.setProperty('--border',`rgb(${borderR},${borderG},${borderB})`);
  root.style.setProperty('--card',`rgb(${cardR},${cardG},${cardB})`);
  root.style.setProperty('--panel-glass',`rgba(${panelR},${panelG},${panelB},.9)`);
  root.style.setProperty('--card-glass',`rgba(${cardR},${cardG},${cardB},.85)`);
  root.style.setProperty('--text',c.text);
  // text-muted = 60% do caminho entre o fundo e o texto (a 50% ficava abaixo do contraste mínimo legível, 4,5:1)
  const textR=parseInt(c.text.slice(1,3),16);
  const textG=parseInt(c.text.slice(3,5),16);
  const textB=parseInt(c.text.slice(5,7),16);
  const mix=(t,b)=>Math.round(b+(t-b)*0.6);
  const mutedR=mix(textR,bgR),mutedG=mix(textG,bgG),mutedB=mix(textB,bgB);
  root.style.setProperty('--text-muted',`rgb(${mutedR},${mutedG},${mutedB})`);
  // Accent
  root.style.setProperty('--accent',c.accent);
  root.style.setProperty('--accent-dim',darkenHex(c.accent,0.65));
  root.style.setProperty('--accent-rgb',hexToRgb(c.accent));
  try{const[h2,s2,l2]=hexToHslArr(c.accent);const[r2,g2,b2]=hslToRgbArr(h2+42,s2,l2);root.style.setProperty('--accent2-rgb',`${r2},${g2},${b2}`);}catch(e){}
  try{root.style.setProperty('--accent-ink',accentInk(c.accent,[[bgR,bgG,bgB],[cardR,cardG,cardB],[panelR,panelG,panelB]]));}catch(e){}
  // Fixed vars
  const isDarkTheme=theme==='dark';
  root.style.setProperty('--red',isDarkTheme?'#e05252':'#b03020');
  root.style.setProperty('--green',isDarkTheme?'#4caf82':'#2a8a50');
  root.style.setProperty('--shadow',isDarkTheme?'rgba(0,0,0,.5)':'rgba(0,0,0,.15)');
}

function toggleTheme(){setTheme(currentTheme==='dark'?'light':'dark');}
function setTheme(t2){
  currentTheme=t2;
  document.documentElement.setAttribute('data-theme',t2);
  {const tb=document.getElementById('theme-btn');if(tb)tb.textContent=t2==='dark'?'🌙':'☀️';}
  applyThemeColors(t2);
  try{localStorage.setItem('cv_theme_mode',t2);}catch(e){}
  // Update settings tab if open
  const tabD=document.getElementById('s-tab-dark');
  const tabL=document.getElementById('s-tab-light');
  if(tabD)tabD.classList.toggle('active',t2==='dark');
  if(tabL)tabL.classList.toggle('active',t2==='light');
  settingsActiveTheme=t2;
}

// ══ SETTINGS COLOR PICKER ══
function switchSettingsTheme(theme){
  settingsActiveTheme=theme;
  setTheme(theme);
  refreshColorPickers();
  document.getElementById('s-tab-dark')?.classList.toggle('active',theme==='dark');
  document.getElementById('s-tab-light')?.classList.toggle('active',theme==='light');
}

function livePreviewColor(type, value){
  // Just update the preview bar live
  updatePreviewBar();
}

function applyColor(type, value){
  themeColors[settingsActiveTheme][type]=value;
  applyThemeColors(settingsActiveTheme);
  updatePreviewBar();
  renderPresetHighlights();
  saveThemeColors();
  buildManifest();
}

function updatePreviewBar(){
  const bar=document.getElementById('color-preview-bar');
  if(!bar)return;
  const c=themeColors[settingsActiveTheme];
  bar.style.background=c.bg;
  bar.style.borderColor=c.accent;
  bar.querySelector('span').style.color=c.accent;
}

const THEME_PRESETS=[
  {id:'aurora',name:'Aurora',emoji:'🌠',dark:true,bg:'#0a0e1a',accent:'#c9a84c',text:'#e8e4d8'},
  {id:'meianoite',name:'Meia-noite',emoji:'🌙',dark:true,bg:'#080810',accent:'#4c8caf',text:'#c8d4e0'},
  {id:'floresta',name:'Floresta',emoji:'🌲',dark:true,bg:'#0a1410',accent:'#4caf82',text:'#d0e0c8'},
  {id:'oceano',name:'Oceano',emoji:'🌊',dark:true,bg:'#0a1018',accent:'#3a9bc7',text:'#c8dae0'},
  {id:'porsol',name:'Pôr do sol',emoji:'🌅',dark:true,bg:'#160a0e',accent:'#e08840',text:'#e0d0c8'},
  {id:'rubi',name:'Rubi',emoji:'💎',dark:true,bg:'#140a0e',accent:'#e05270',text:'#e0c8d0'},
  {id:'ametista',name:'Ametista',emoji:'🔮',dark:true,bg:'#100a16',accent:'#9b6ec7',text:'#d4c8e0'},
  {id:'esmeralda',name:'Esmeralda',emoji:'✨',dark:true,bg:'#081410',accent:'#2ec98a',text:'#c8e0d4'},
  {id:'classico',name:'Clássico Claro',emoji:'☀️',dark:false,bg:'#f0ede8',accent:'#c9a84c',text:'#1e1c1a'},
  {id:'papel',name:'Papel',emoji:'📄',dark:false,bg:'#faf8f2',accent:'#a0864c',text:'#2a2824'},
  {id:'menta',name:'Menta',emoji:'🍃',dark:false,bg:'#eef5f0',accent:'#3a9b6e',text:'#1a3020'},
  {id:'ceu',name:'Céu',emoji:'☁️',dark:false,bg:'#eef2f8',accent:'#4c7caf',text:'#1a2030'},
];
function applyThemePreset(id){
  const th=THEME_PRESETS.find(t=>t.id===id);
  if(!th)return;
  const mode=th.dark?'dark':'light';
  // Guardar as cores no modo do tema
  themeColors[mode]={bg:th.bg,accent:th.accent,text:th.text};
  // Trocar para esse modo e aplicar
  currentTheme=mode;
  settingsActiveTheme=mode;
  document.documentElement.setAttribute('data-theme',mode);
  const tb=document.getElementById('theme-btn');if(tb)tb.textContent=mode==='dark'?'🌙':'☀️';
  try{localStorage.setItem('cv_theme_mode',mode);}catch(e){}
  applyThemeColors(mode);
  saveThemeColors();
  refreshColorPickers();
  buildManifest();
  renderThemeGrid();
  toast((currentLang==='en'?'Theme applied: ':'Tema aplicado: ')+th.emoji+' '+th.name);
}
function renderThemeGrid(){
  const grid=document.getElementById('theme-grid');
  if(!grid)return;
  const curBg=(getComputedStyle(document.documentElement).getPropertyValue('--bg')||'').trim().toLowerCase();
  grid.innerHTML=THEME_PRESETS.map(th=>{
    const active=curBg===th.bg.toLowerCase();
    return `<button class="theme-chip${active?' active':''}" data-act="applyThemePreset" data-arg="${esc(th.id)}" style="--tc-bg:${th.bg};--tc-accent:${th.accent}">
      <span class="theme-chip-preview"><span class="theme-chip-dot" style="background:${th.accent}"></span></span>
      <span class="theme-chip-name">${th.emoji} ${th.name}</span>
    </button>`;
  }).join('');
}
function buildPresets(containerId, presets, type){
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=presets.map(color=>`
    <div class="color-preset" style="background:${color}" title="${color}"
      data-act="pickPresetColor" data-arg="${esc(type)}" data-arg2="${esc(color)}">
    </div>`).join('');
}

function renderPresetHighlights(){
  const c=themeColors[settingsActiveTheme];
  ['bg','accent','text'].forEach(type=>{
    const val=c[type];
    document.querySelectorAll(`#presets-${type} .color-preset`).forEach(el=>{
      el.classList.toggle('active',el.style.background===val||el.getAttribute('title')===val);
    });
  });
}

function refreshColorPickers(){
  const c=themeColors[settingsActiveTheme];
  const pb=document.getElementById('picker-bg');if(pb)pb.value=c.bg;
  const pa=document.getElementById('picker-accent');if(pa)pa.value=c.accent;
  const pt=document.getElementById('picker-text');if(pt)pt.value=c.text;
  // Rebuild presets for active theme
  const isDark=settingsActiveTheme==='dark';
  buildPresets('presets-bg', isDark?BG_PRESETS_DARK:BG_PRESETS_LIGHT, 'bg');
  buildPresets('presets-accent', ACCENT_PRESETS, 'accent');
  buildPresets('presets-text', isDark?TEXT_PRESETS_DARK:TEXT_PRESETS_LIGHT, 'text');
  renderThemeGrid();
  renderPresetHighlights();
  updatePreviewBar();
}

function resetColors(){
  themeColors[settingsActiveTheme]={...DEFAULT_COLORS[settingsActiveTheme]};
  applyThemeColors(settingsActiveTheme);
  refreshColorPickers();
  saveThemeColors();
}

// Keep old setAccent as no-op for compatibility
function setAccent(){}
function setBg(){}
function setAccentOld(name,color,dim,rgb){
  const r=document.documentElement;
  r.style.setProperty('--accent',color);r.style.setProperty('--accent-dim',dim);r.style.setProperty('--accent-rgb',rgb);
}

// ══ PROFILE EMOJI ══
let profileEmoji='😊';
const PROFILE_EMOJIS=['😊','😎','🤠','🧙','🦊','🐺','🦁','🐯','🦅','🐉','👾','🤖','👨‍💻','👩‍💻','🧑‍🚀','🥷','🦸','🧛','🎭','🔐','⚡','🌟','💎','🔥','🌊','🍀','🎯','🚀','🏆','💫'];
function openProfilePicker(){
  const grid=document.getElementById('profile-emoji-grid');
  grid.innerHTML=PROFILE_EMOJIS.map(e=>`<div class="emoji-opt${e===profileEmoji?' selected':''}" data-act="selectProfileEmoji" data-arg="${esc(e)}">${e}</div>`).join('');
  document.getElementById('profile-overlay').classList.add('open');
}
function selectProfileEmoji(e){
  profileEmoji=e;

  document.querySelectorAll('#profile-emoji-grid .emoji-opt').forEach(el=>el.classList.toggle('selected',el.textContent===e));
}
function closeProfilePicker(){document.getElementById('profile-overlay').classList.remove('open');}

// ══ ENTRY EMOJI ══
let entryEmoji='⭐';
const ENTRY_EMOJIS=['⭐','🔐','🏦','📧','💬','🎮','💼','🛒','✈️','🏠','🚗','💊','📚','🎵','📺','☁️','🔑','💳','🌐','📱','💡','🎨','🏋️','🍕','🎁','🔒','📝','💰','🛡️','⚙️'];
function toggleEmojiPicker(){
  const wrap=document.getElementById('emoji-picker-wrap');
  const isOpen=wrap.style.display!=='none';
  if(!isOpen){
    const picker=document.getElementById('emoji-picker');
    picker.innerHTML=ENTRY_EMOJIS.map(e=>`<div class="emoji-opt${e===entryEmoji?' selected':''}" data-act="selectEntryEmoji" data-arg="${esc(e)}">${e}</div>`).join('');
  }
  wrap.style.display=isOpen?'none':'block';
}
function selectEntryEmoji(e){
  entryEmoji=e;
  document.getElementById('f-icon-preview').textContent=e;
  document.querySelectorAll('#emoji-picker .emoji-opt').forEach(el=>el.classList.toggle('selected',el.textContent===e));
}

// ══ NOTE CHAR COUNTER ══
function updateNoteCharCount(){
  const body=document.getElementById('ne-body');
  const counter=document.getElementById('note-char-count');
  if(!body||!counter)return;
  const len=body.value.length;
  counter.textContent=`${len} ${currentLang==='en'?'characters':'caracteres'}`;
}

// ══ EXPORT CSV ══
async function exportCSV(){
  if(!await avPlainExportOk('CSV'))return;
  const active=vault.filter(e=>!e.archived);
  const headers=['Name','Category','Username','Password','URL','Notes','Tags'];
  const rows=active.map(e=>[
    e.name||'',getCatLabel(e.cat)||'',e.user||'',e.pw||'',e.url||'',
    (e.notes||'').replace(/\n/g,' '),(e.tags||[]).join(';')
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv=[headers.join(','),...rows].join('\n');
  downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'ciphervault_export.csv');
  toast(currentLang==='en'?'CSV exported! ✓':'CSV exportado! ✓');
}
// ══ SETTINGS ══
let currentSettingsTab='aspeto';
function switchSettingsTab(tab){
  currentSettingsTab=tab;
  document.querySelectorAll('.settings-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.stab===tab));
  document.querySelectorAll('.settings-pane').forEach(p=>p.classList.toggle('active',p.dataset.spane===tab));
  // Scroll para o topo do modal ao trocar de aba
  const modal=document.querySelector('#settings-overlay .modal');
  if(modal)modal.scrollTop=0;
}
function openSettings(){
  try{setTimeout(()=>renderDriveSettings(),60);}catch(e){}
  applySettingsLang();
  switchSettingsTab('aspeto');
  renderBgPicker();
  const ni=document.getElementById('s-name-input');if(ni)ni.value=vaultName||'';
  settingsActiveTheme=currentTheme;
  document.getElementById('s-tab-dark')?.classList.toggle('active',currentTheme==='dark');
  document.getElementById('s-tab-light')?.classList.toggle('active',currentTheme==='light');
  refreshColorPickers();
  renderQuickSettings();
  renderSnapshotSettings();
  renderExportSettings();
  renderVaultInfo();
  renderCatManager();
  const lh=document.getElementById('s-lockhide');if(lh)lh.checked=lockHideOn;
  const pp=getPwaPrefs();
  const pn=document.getElementById('pwa-name');if(pn)pn.value=pp.name;
  const pe=document.getElementById('pwa-emoji');if(pe)pe.value=pp.emoji||'';
  document.getElementById('settings-overlay').classList.add('open');
}
function closeSettings(){document.getElementById('settings-overlay').classList.remove('open');}
function applySettingsLang(){
  const s=(id,txt)=>{const el=document.getElementById(id);if(el)el.textContent=txt;};
  s('settings-title',t('settingsTitle'));
  s('s-colors-title',currentLang==='en'?'Customise Colors':'Personalizar Cores');
  s('s-bg-label',currentLang==='en'?'Background':'Cor de Fundo');
  s('s-accent-label',currentLang==='en'?'Highlight Color':'Cor de Destaque');
  s('s-text-label',currentLang==='en'?'Text Color':'Cor do Texto');
  s('s-dark-label',currentLang==='en'?'Dark':'Escuro');
  s('s-light-label',currentLang==='en'?'Light':'Claro');
  s('s-reset-btn',currentLang==='en'?'↺ Reset to defaults':'↺ Repor cores padrão');
  s('s-vaultinfo-title',currentLang==='en'?'📊 Vault Info':'📊 Info do Cofre');
  s('s-pwa-title',currentLang==='en'?'📲 Installed App':'📲 App Instalada');
  const pwn=document.getElementById('pwa-note');if(pwn)pwn.textContent=currentLang==='en'?'The icon uses your current colors. Reinstall the app to apply the new icon/name.':'O ícone usa as tuas cores atuais. Reinstala a app para aplicar o novo ícone/nome.';
  s('s-lockhide-lbl',currentLang==='en'?'Lock when minimised / switching apps':'Bloquear ao minimizar / mudar de app');
  const en_s=currentLang==='en';
  // Nav das abas
  s('snav-aspeto',en_s?'Appearance':'Aspeto');
  s('snav-seguranca',en_s?'Security':'Segurança');
  s('snav-dados',en_s?'Data':'Dados');
  s('snav-heranca',en_s?'Legacy':'Herança');
  s('snav-sobre',en_s?'About':'Sobre');
  // Aba Dados
  s('s-csv-title',en_s?'📄 Import / Export':'📄 Importar / Exportar');
  const cd=document.getElementById('s-csv-desc');if(cd)cd.textContent=en_s?'Import or export your entries as CSV, or generate a PDF of the vault.':'Importa ou exporta as tuas entradas em CSV, ou gera um PDF do cofre.';
  s('s-csv-import-txt',en_s?'⬆️ Import CSV':'⬆️ Importar CSV');
  s('s-csv-export-txt',en_s?'⬇️ Export CSV':'⬇️ Exportar CSV');
  s('s-pdf-export-txt',en_s?'📄 Export PDF':'📄 Exportar PDF');
  s('s-timeout-title',en_s?'⏱️ Auto-lock':'⏱️ Auto-bloqueio');
  // Aba Segurança
  s('s-changepw-title',en_s?'🔑 Master password':'🔑 Palavra-passe mestra');
  const cpd=document.getElementById('s-changepw-desc');if(cpd)cpd.textContent=en_s?'Change the password that protects the whole vault.':'Muda a palavra-passe que protege todo o cofre.';
  s('s-changepw-btn-txt',en_s?'🔑 Change password':'🔑 Alterar palavra-passe');
  // Aba Herança
  s('s-heranca-title',en_s?'📜 Digital Legacy':'📜 Herança Digital');
  const hd=document.getElementById('s-heranca-desc');if(hd)hd.textContent=en_s?'A document for your family to access your accounts and what matters, should something happen to you. Fill in the details and generate a PDF to keep safe.':'Um documento para a tua família aceder às tuas contas e ao que é importante, caso te aconteça alguma coisa. Preenche os dados e gera um PDF para guardar em segurança.';
  s('s-heranca-btn-txt',en_s?'📜 Open Digital Legacy':'📜 Abrir Herança Digital');
  s('s-bg-title',en_s?'🌌 Animated Background':'🌌 Fundo Animado');
  const bgd=document.getElementById('s-bg-desc');if(bgd)bgd.textContent=en_s?"Choose your app's visual ambiance. Each one is lightweight and adapts to your colours.":'Escolhe o ambiente visual da tua app. Cada um é leve e adapta-se às tuas cores.';
  const pgd=document.getElementById('pgm-desc');if(pgd)pgd.textContent=en_s?'Easy-to-remember words, separated with a number. Strong and memorable.':'Palavras fáceis de decorar, separadas e com número. Fortes e memoráveis.';
  s('pgm-random-lbl',en_s?'Random':'Aleatória');
  s('pgm-memorable-lbl',en_s?'Memorable':'Memorável');
  s('pgm-cap-lbl',en_s?'Capitals':'Maiúsculas');
  s('pgm-num-lbl',en_s?'Number':'Número');
  s('f-flag-lbl',en_s?'Label':'Etiqueta');
  s('hc-btn-txt',en_s?'Health check':'Auditoria');
  s('s-name-title',en_s?'👤 Your name':'👤 O teu nome');
  const nmd=document.getElementById('s-name-desc');if(nmd)nmd.textContent=en_s?'Used to greet you on the home screen. Stored only in your vault.':'Usado para te saudar no ecrã inicial. Guardado só no teu cofre.';
  renderBgPicker();
  // ── Documentos: cabeçalho, filtros, modal ──
  const en2=currentLang==='en';
  const setTxt=(id,txt)=>{const el=document.getElementById(id);if(el)el.textContent=txt;};
  setTxt('docs-title',en2?'Documents':'Documentos');
  setTxt('docs-add-txt',en2?'Add document':'Adicionar documento');
  setTxt('docs-newfolder-txt',en2?'New folder':'Nova pasta');
  setTxt('vf-all-txt',en2?'All':'Todos');
  setTxt('vf-expiring-txt',en2?'Expiring':'A expirar');
  setTxt('vf-expired-txt',en2?'Expired':'Expirados');
  setTxt('vf-ok-txt',en2?'Valid':'Válidos');
  setTxt('vf-noexpiry-txt',en2?'No expiry':'Sem validade');
  setTxt('doc-title-lbl',en2?'Title':'Título');
  setTxt('doc-cat-lbl',en2?'Category':'Categoria');
  setTxt('doc-date-lbl',en2?'Document date':'Data do documento');
  setTxt('doc-desc-lbl',en2?'Description':'Descrição');
  setTxt('doc-file-lbl',en2?'File':'Ficheiro');
  setTxt('im-label-lbl',en2?'Name':'Nome');
  setTxt('im-value-lbl',en2?'Value':'Valor');
  setTxt('im-sensitive-lbl',en2?'Hide by default (show on tap)':'Ocultar por omissão (mostrar só ao tocar)');
  setTxt('im-save',en2?'Save':'Guardar');
  setTxt('im-cancel',en2?'Cancel':'Cancelar');
  setTxt('tab-info-txt',en2?'Info':'Info');
  setTxt('info-add-txt',en2?'New person':'Nova pessoa');
  setTxt('sub-name-lbl',en2?'Name':'Nome');
  setTxt('sub-amount-lbl',en2?'Amount (€)':'Valor (€)');
  setTxt('sub-cycle-lbl',en2?'Billing':'Periodicidade');
  setTxt('sub-day-lbl',en2?'Billing day (1-31)':'Dia de cobrança (1-31)');
  setTxt('sub-date-lbl',en2?'Renewal date':'Data de renovação');
  setTxt('sub-color-lbl',en2?'Colour':'Cor');
  setTxt('sub-save',en2?'Save':'Guardar');
  setTxt('sub-cancel',en2?'Cancel':'Cancelar');
  setTxt('sc-name-lbl',en2?'Store':'Loja');
  setTxt('sc-number-lbl',en2?'Card number':'Número do cartão');
  setTxt('sc-number-hint',en2?'Type the digits shown on your card (under the barcode).':'Escreve os dígitos que aparecem no teu cartão (por baixo do código de barras).');
  setTxt('sc-color-lbl',en2?'Colour':'Cor');
  setTxt('sc-save',en2?'Save':'Guardar');
  setTxt('sc-cancel',en2?'Cancel':'Cancelar');
  setTxt('barcode-close',en2?'Close':'Fechar');
  setTxt('tb-privacy-txt',en2?'Privacy mode':'Modo de privacidade');
  setTxt('tab-store-txt',en2?'Store Cards':'Cartões Loja');
  setTxt('store-tab-add-txt',en2?'Add card':'Adicionar cartão');
  const scOpts=document.getElementById('sub-cycle');
  if(scOpts&&scOpts.options.length===2){scOpts.options[0].textContent=en2?'Monthly':'Mensal';scOpts.options[1].textContent=en2?'Yearly':'Anual';}
  setTxt('doc-drop-text',en2?'Click or drag the file here':'Clica ou arrasta o ficheiro aqui');
  setTxt('doc-save-btn',en2?'Save document':'Guardar documento');
  setTxt('doc-cancel-btn',en2?'Cancel':'Cancelar');
  const del2=document.getElementById('doc-expiry-lbl');
  if(del2)del2.innerHTML=(en2?'Expiry':'Validade')+' <span style="font-size:.56rem;color:var(--text-muted)">('+(en2?'optional':'opcional')+')</span>';
  populateDocCatSelect();
  // ── Dashboard / gerador / demo ──
  setTxt('dash-alerts-title',en2?'Alerts & Report':'Alertas & Relatório');
  setTxt('pwgen-len-lbl',en2?'Length:':'Comprimento:');
  setTxt('pres-exit-btn',en2?'✕ Exit':'✕ Sair');
  const dfl=document.getElementById('doc-folder-lbl');if(dfl)dfl.textContent=en2?'Folder':'Pasta';
  setTxt('f-folder-lbl',en2?'Folder':'Pasta');
  setTxt('f-wifi-lbl',en2?'📶 This is a WiFi network (generates a shareable QR)':'📶 É uma rede WiFi (gera QR para partilhar)');
  setTxt('vault-newfolder-txt',en2?'New folder':'Nova pasta');
  setTxt('tb-kit-txt',en2?'Digital Legacy':'Herança Digital');
  const scb=document.getElementById('search-clear');if(scb)scb.title=en2?'Clear':'Limpar';
  setTxt('tb-backup-txt',en2?'Download backup':'Descarregar cópia');
  setTxt('tb-settings-txt',en2?'Settings':'Definições');
  setTxt('tb-sync-txt',en2?'Sync':'Sincronizar');setTxt('tbm-sync',en2?'Sync':'Sinc.');
  const sib=document.getElementById('drive-sync-btn');if(sib)sib.title=en2?'Sync now':'Sincronizar agora';
  setTxt('tb-cal-txt',en2?'Calendar':'Calendário');
  setTxt('tb-privacy-txt',en2?'Privacy mode':'Modo de privacidade');
  setTxt('tb-theme-txt',en2?'Light / dark theme':'Tema claro/escuro');
  const tbm=document.getElementById('tb-more');if(tbm)tbm.title=en2?'More options':'Mais opções';
  renderWifiBar();
  try{renderQuickSettings();}catch(e){}
  const trl=document.getElementById('tf-recovery-lbl');if(trl)trl.innerHTML='🔑 '+(currentLang==='en'?'Recovery codes':'Códigos de recuperação')+' <span style="font-size:.5rem;color:var(--text-muted)">('+(currentLang==='en'?'optional':'opcional')+')</span>';
  const trh=document.getElementById('tf-recovery-hint');if(trh)trh.textContent=currentLang==='en'?'Many services give backup codes in case you lose your phone. Store them here, inside the protected 2FA vault.':'Muitos serviços dão códigos de emergência para o caso de perderes o telemóvel. Guarda-os aqui, dentro do cofre 2FA protegido.';
  const ffl=document.getElementById('f-fields-lbl');if(ffl)ffl.innerHTML=(currentLang==='en'?'Extra fields':'Campos extra')+' <span style="font-size:.5rem;color:var(--text-muted)">('+(currentLang==='en'?'optional':'opcional')+')</span>';
  const ffa=document.getElementById('f-fields-add');if(ffa)ffa.textContent=(currentLang==='en'?'＋ Add field':'＋ Adicionar campo');
  s('s-cats-title',currentLang==='en'?'🎨 Custom Categories':'🎨 Categorias Personalizadas');
  s('s-timeout-title',t('sTimeout'));
  s('s-close-btn',t('sClose'));
  s('to-0',t('toNever'));
}

// ══ INDICADOR DE TABS ══
function positionTabIndicator(){
  const ind=document.getElementById('tab-indicator');if(!ind)return;
  const act=document.querySelector('.tab-btn.active');
  if(!act||!act.offsetWidth){ind.style.opacity='0';return;}
  ind.style.opacity='1';
  ind.style.width=act.offsetWidth+'px';
  ind.style.transform=`translateX(${act.offsetLeft}px)`;
}
window.addEventListener('resize',positionTabIndicator);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(positionTabIndicator);

// ══ SPOTLIGHT ══
if(window.matchMedia&&matchMedia('(hover:hover)').matches){
  let spotEvt=null,spotPending=false;
  document.addEventListener('pointermove',e=>{
    spotEvt=e;
    if(spotPending)return;
    spotPending=true;
    requestAnimationFrame(()=>{
      spotPending=false;
      const ev=spotEvt;if(!ev)return;
      const card=ev.target.closest?.('.entry-card,.doc-card,.totp-card,.dash-card,.trash-card,.fav-quick,.lock-how-card');
      if(!card)return;
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',(ev.clientX-r.left)+'px');
      card.style.setProperty('--my',(ev.clientY-r.top)+'px');
    });
  },{passive:true});
}

// ══ CONTAGEM ANIMADA DOS NÚMEROS ══
function animateDashNums(){
  document.querySelectorAll('#dash-stats .dash-card-num').forEach(el=>{
    const target=parseInt(el.textContent,10);
    if(isNaN(target)||target<=0)return;
    const dur=450,start=performance.now();
    function step(now){
      const p=Math.min((now-start)/dur,1);
      el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

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

// ══ DASHBOARD ══
// ══ COMMON PASSWORDS (top 200) ══
const COMMON_PWS=new Set(['123456','password','123456789','12345678','12345','1234567','1234567890','qwerty','abc123','111111','123123','admin','letmein','welcome','monkey','1234','dragon','master','login','pass','iloveyou','sunshine','princess','football','shadow','superman','michael','jessica','charlie','donald','password1','qwerty123','baseball','soccer','hockey','batman','trustno1','hello','freedom','whatever','qazwsx','654321','555555','lovely','7777777','888888','pass1','password123','1q2w3e4r','1qaz2wsx','zxcvbn','asdfgh','qwertyuiop','123qwe','1q2w3e','passw0rd','p@ssword','p@ss','pass@word','test','guest','default','root','toor','alpine','changeme','abc','abc1234','asd123','zxc123','qwe123','aaa111','111222333','123abc','abcdef','asdasd','qweqwe','zxczxc','111111111','000000','11111111','22222222','33333333','44444444','55555555','66666666','77777777','88888888','99999999','00000000','10203040','12341234','11223344','99887766','pass123','pass1234','pass12345','teste','senha','senhas','portugal','porto','lisboa','benfica','sporting','porto123','braga','faro','setubal','coimbra','aveiro','leiria','viseu','guarda','evora','beja','viana','caldas']);

function isCommonPassword(pw){if(!pw)return false;return COMMON_PWS.has(pw.toLowerCase());}

function getPwScore(pw){if(!pw)return 0;let s=0;if(pw.length>=8)s++;if(pw.length>=12)s++;if(/[A-Z]/.test(pw))s++;if(/[0-9]/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;return s;}
function calcSecurityScore(){
  const active=vault.filter(e=>!e.archived);const total=active.length;if(total===0)return 0;
  const weak=active.filter(e=>getPwScore(e.pw)<2).length;
  const pwMap={};active.forEach(e=>{if(e.pw)pwMap[e.pw]=(pwMap[e.pw]||0)+1;});
  const dups=active.filter(e=>e.pw&&pwMap[e.pw]>1).length;
  const now=Date.now();const old=active.filter(e=>e.pwUpdated&&(now-e.pwUpdated)>180*86400000).length;
  let score=100;score-=Math.round((weak/total)*40);score-=Math.round((dups/total)*30);score-=Math.round((old/total)*20);if(total<3)score-=10;
  return Math.max(0,Math.min(100,score));
}
function updateWalletTiles(){/* substituído por renderSubsSection + aba Cartões Loja */}

function runHealthCheck(){
  const active=vault.filter(e=>!e.archived);
  const total=active.length;
  const weak=active.filter(e=>getPwScore(e.pw)<2);
  const pwMap={};active.forEach(e=>{if(e.pw)pwMap[e.pw]=(pwMap[e.pw]||0)+1;});
  const dups=active.filter(e=>e.pw&&pwMap[e.pw]>1);
  const now=Date.now();
  const old=active.filter(e=>e.pwUpdated&&(now-e.pwUpdated)>180*86400000);
  // Contas sem 2FA associado (não têm entrada TOTP com nome parecido)
  const totpNames=(totp||[]).map(t=>(t.label||t.issuer||'').toLowerCase());
  const no2fa=active.filter(e=>{
    const n=(e.name||'').toLowerCase();
    return n&&!totpNames.some(tn=>tn&&(tn.includes(n)||n.includes(tn)));
  });
  // Bem-estar: revistas vs por rever (revisão "expira" após 90 dias)
  const reviewed=active.filter(e=>e.reviewedAt&&(now-e.reviewedAt)<90*86400000);
  const toReview=active.filter(e=>!e.reviewedAt||(now-e.reviewedAt)>=90*86400000);
  return {total,weak,dups,old,no2fa,reviewed,toReview,score:calcSecurityScore()};
}
function renderHealthCharts(r){
  const en=currentLang==='en';
  const active=vault.filter(e=>!e.archived);
  let strong=0,medium=0,weak=0;
  active.forEach(e=>{if(!e.pw)return;const s=getPwScore(e.pw);if(s>=4)strong++;else if(s>=2)medium++;else weak++;});
  const totalPw=strong+medium+weak;
  if(!totalPw)return '';
  const C=2*Math.PI*50;
  const segs=[{v:strong,c:'#4caf82',l:en?'Strong':'Fortes'},{v:medium,c:'var(--accent)',l:en?'Medium':'Médias'},{v:weak,c:'#e05252',l:en?'Weak':'Fracas'}];
  let off=0;
  const circles=segs.filter(s=>s.v>0).map(s=>{const len=s.v/totalPw*C;const el='<circle cx="60" cy="60" r="50" fill="none" stroke="'+s.c+'" stroke-width="13" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 60 60)"/>';off+=len;return el;}).join('');
  const pctStrong=Math.round(strong/totalPw*100);
  const legend=segs.map(s=>'<div class="hc-leg-row"><span class="hc-leg-dot" style="background:'+s.c+'"></span><span class="hc-leg-l">'+s.l+'</span><span class="hc-leg-v">'+s.v+'</span></div>').join('');
  // Barras de problemas
  const probs=[
    {l:en?'Weak':'Fracas',v:r.weak.length,c:'#e05252'},
    {l:en?'Reused':'Repetidas',v:r.dups.length,c:'#e0a052'},
    {l:en?'Old':'Antigas',v:r.old.length,c:'#c9a84c'},
    {l:en?'No 2FA':'Sem 2FA',v:r.no2fa.length,c:'#8a8f9e'},
  ];
  const maxP=Math.max(1,...probs.map(p=>p.v));
  const bars=probs.map(p=>'<div class="hc-bar-row"><span class="hc-bar-l">'+p.l+'</span><span class="hc-bar-track"><span class="hc-bar-fill" style="width:'+(p.v/maxP*100)+'%;background:'+p.c+'"></span></span><span class="hc-bar-v">'+p.v+'</span></div>').join('');
  return '<div class="hc-charts">'+
    '<div class="hc-chart-card">'+
      '<div class="hc-chart-title">'+(en?'Password strength':'Força das palavras-passe')+'</div>'+
      '<div class="hc-donut-wrap">'+
        '<svg class="hc-donut" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="13"/>'+circles+'</svg>'+
        '<div class="hc-donut-center"><span class="hc-donut-pct">'+pctStrong+'%</span><span class="hc-donut-sub">'+(en?'strong':'fortes')+'</span></div>'+
      '</div>'+
      '<div class="hc-legend">'+legend+'</div>'+
    '</div>'+
    '<div class="hc-chart-card">'+
      '<div class="hc-chart-title">'+(en?'Issues found':'Problemas encontrados')+'</div>'+
      '<div class="hc-bars">'+bars+'</div>'+
    '</div>'+
  '</div>';
}
function openHealthCheck(){
  const en=currentLang==='en';
  const r=runHealthCheck();
  const scoreColor=r.score>=80?'#4caf82':r.score>=50?'var(--accent)':'#e05252';
  const scoreLbl=r.score>=80?(en?'Excellent':'Excelente'):r.score>=60?(en?'Good':'Bom'):r.score>=40?(en?'Fair':'Razoável'):(en?'Needs work':'A melhorar');
  const issues=[];
  if(r.weak.length)issues.push({ico:'⚠️',cls:'warn',title:en?`${r.weak.length} weak password${r.weak.length>1?'s':''}`:`${r.weak.length} ${r.weak.length>1?'palavras-passe fracas':'palavra-passe fraca'}`,desc:en?'Short or simple — easy to guess.':'Curtas ou simples — fáceis de adivinhar.',items:r.weak});
  if(r.dups.length)issues.push({ico:'🔁',cls:'warn',title:en?`${r.dups.length} reused password${r.dups.length>1?'s':''}`:`${r.dups.length} ${r.dups.length>1?'palavras-passe repetidas':'palavra-passe repetida'}`,desc:en?'Same password in several accounts.':'Mesma palavra-passe em várias contas.',items:r.dups});
  if(r.old.length)issues.push({ico:'📅',cls:'warn',title:en?`${r.old.length} old password${r.old.length>1?'s':''}`:`${r.old.length} ${r.old.length>1?'palavras-passe antigas':'palavra-passe antiga'}`,desc:en?'Not changed in over 6 months.':'Sem mudança há mais de 6 meses.',items:r.old});
  if(r.no2fa.length)issues.push({ico:'🔓',cls:'info',title:en?`${r.no2fa.length} without 2FA`:`${r.no2fa.length} sem 2FA`,desc:en?'Consider adding two-factor codes.':'Considera adicionar códigos de dois fatores.',items:r.no2fa.slice(0,10)});

  let body;
  if(!r.total){
    body=`<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:.8rem">${en?'Your vault is empty. Add some entries to run a health check.':'O teu cofre está vazio. Adiciona entradas para correr uma auditoria.'}</div>`;
  }else if(!issues.length){
    body=`<div class="hc-perfect">
      <div style="font-size:2.6rem">🎉</div>
      <div style="font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--green);margin:8px 0">${en?'All good!':'Está tudo bem!'}</div>
      <div style="font-size:.76rem;color:var(--text-muted);line-height:1.7">${en?'No weak, reused or old passwords found. Keep it up!':'Sem palavras-passe fracas, repetidas ou antigas. Continua assim!'}</div>
    </div>`;
  }else{
    body=issues.map(iss=>`
      <div class="hc-issue ${iss.cls}">
        <div class="hc-issue-head">
          <span class="hc-issue-ico">${iss.ico}</span>
          <div style="flex:1;min-width:0">
            <div class="hc-issue-title">${iss.title}</div>
            <div class="hc-issue-desc">${iss.desc}</div>
          </div>
        </div>
        <div class="hc-issue-items">
          ${iss.items.map(e=>`<button class="hc-chip" data-act="hcGoEntry" data-arg="${esc(e.id)}">${esc(e.name||'—')}</button>`).join('')}
        </div>
      </div>`).join('');
  }
  document.getElementById('hc-score-num').textContent=r.score;
  document.getElementById('hc-score-num').style.color=scoreColor;
  document.getElementById('hc-score-ring').style.background=`conic-gradient(${scoreColor} ${r.score*3.6}deg, var(--border) 0deg)`;
  document.getElementById('hc-score-lbl').textContent=scoreLbl;
  document.getElementById('hc-score-lbl').style.color=scoreColor;
  // Barra de progresso de revisão (bem-estar)
  const revPct=r.total?Math.round(r.reviewed.length/r.total*100):0;
  const wellBar=r.total?`
    <div class="hc-wellness">
      <div class="hc-well-head">
        <span>${en?'🧘 Review progress':'🧘 Progresso de revisão'}</span>
        <span class="hc-well-num">${r.reviewed.length}/${r.total}</span>
      </div>
      <div class="hc-well-track"><div class="hc-well-fill" style="width:${revPct}%"></div></div>
      <div class="hc-well-hint">${r.toReview.length?(en?`${r.toReview.length} account${r.toReview.length>1?'s':''} to review`:`${r.toReview.length} ${r.toReview.length>1?'contas por rever':'conta por rever'}`):(en?'All accounts reviewed! 🎉':'Todas as contas revistas! 🎉')}</div>
    </div>`:'';
  document.getElementById('hc-body').innerHTML=(r.total?renderHealthCharts(r):'')+wellBar+body;
  document.getElementById('hc-title').textContent=en?'🩺 Health Check':'🩺 Auditoria de Segurança';
  document.getElementById('healthcheck-overlay').classList.add('open');
}
function closeHealthCheck(){document.getElementById('healthcheck-overlay').classList.remove('open');}
function positionBreachTip(helpEl){
  const tip=document.getElementById('breach-tip');
  if(!tip||!helpEl)return;
  const r=helpEl.getBoundingClientRect();
  const margin=10;
  // Larguras/alturas do balão (já tem conteúdo, mede-se na posição atual)
  const tw=tip.offsetWidth||Math.min(330,window.innerWidth*0.92);
  const th=tip.offsetHeight||140;
  // Horizontal: alinhar a direita do balão com a direita do "?", sem sair do ecrã
  let left=r.right-tw;
  if(left<margin)left=margin;
  if(left+tw>window.innerWidth-margin)left=window.innerWidth-margin-tw;
  // Vertical: por cima do "?"; se não couber em cima, por baixo
  let top=r.top-th-10;
  if(top<margin)top=r.bottom+10;
  tip.style.left=left+'px';
  tip.style.top=top+'px';
}
function renderVaultSecureBar(){
  const bar=document.getElementById('vault-securebar');
  if(!bar)return;
  const en=currentLang==='en';
  const active=vault.filter(e=>!e.archived);
  const total=active.length,favs=active.filter(e=>e.fav).length;
  const weak=active.filter(e=>getPwScore(e.pw)<2).length;
  const pwMap={};active.forEach(e=>{if(e.pw)pwMap[e.pw]=(pwMap[e.pw]||0)+1;});
  const dups=active.filter(e=>e.pw&&pwMap[e.pw]>1).length;
  const now=Date.now();const old=active.filter(e=>e.pwUpdated&&(now-e.pwUpdated)>180*86400000).length;
  const score=calcSecurityScore();
  const scoreColor=score>=80?'#4caf82':score>=50?'var(--accent)':'#e05252';
  const scoreInk=score>=80?'var(--green)':score>=50?'var(--accent-ink)':'var(--red)';
  const scoreIdx=score>=80?4:score>=60?3:score>=40?2:score>=20?1:0;
  let scoreLbl='';try{scoreLbl=(T[currentLang].scoreLabels||T.pt.scoreLabels)[scoreIdx];}catch(e){}
  const circ=2*Math.PI*22;
  const off=circ-(score/100)*circ;
  bar.innerHTML=`
    <div class="vsb-score">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--border)" stroke-width="5"/>
        <circle cx="26" cy="26" r="22" fill="none" stroke="${scoreColor}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}" transform="rotate(-90 26 26)"/>
      </svg>
      <div class="vsb-score-num" style="color:${scoreInk}">${score}</div>
    </div>
    <div class="vsb-score-lbl" style="color:${scoreInk}">${scoreLbl}</div>
    <div class="vsb-divider"></div>
    <div class="vsb-stats">
      <div class="vsb-stat"><span class="vsb-num">${total}</span><span class="vsb-lbl">${t('dashTotal')}</span></div>
      <div class="vsb-stat ${weak>0?'warn':''}"><span class="vsb-num">${weak}</span><span class="vsb-lbl">${t('dashWeak')}</span></div>
      <div class="vsb-stat ${dups>0?'warn':''}"><span class="vsb-num">${dups}</span><span class="vsb-lbl">${t('dashDups')}</span></div>
      <div class="vsb-stat ${old>0?'warn':''}"><span class="vsb-num">${old}</span><span class="vsb-lbl">${t('dashOld')}</span></div>
      <div class="vsb-stat"><span class="vsb-num">${favs}</span><span class="vsb-lbl">${t('dashFavs')}</span></div>
      <div class="vsb-stat"><span class="vsb-num" style="font-size:.9rem">🔒</span><span class="vsb-lbl">AES-256</span></div>
    </div>
    <div class="vsb-breach">
      <button class="breach-cta" id="hc-btn" data-act="openHealthCheck" style="padding:9px 14px;font-size:.58rem;background:transparent;color:var(--accent-ink);border:1px solid var(--accent-dim)">🩺 <span id="hc-btn-txt">${en?'Health check':'Auditoria'}</span></button>
      <button class="breach-cta" id="breach-btn" data-act="checkBreaches" style="padding:9px 14px;font-size:.58rem">🛡️ <span id="breach-btn-txt">${en?'Check leaks':'Verificar fugas'}</span></button>
      <span class="breach-help" tabindex="0" data-hover="positionBreachTip">?<span class="breach-tip" id="breach-tip"></span></span>
    </div>
    <div id="breach-status" style="font-size:.66rem;color:var(--text-muted);width:100%;text-align:center;margin-top:4px"></div>
    <div id="breach-results" style="width:100%;margin-top:8px"></div>
  `;
  renderBreachTip();
  refreshBreachButton();
}
function renderDashboard(){
  renderVaultSecureBar();
  updateWalletTiles();
  renderMonthlyReport();
  const active=vault.filter(e=>!e.archived);const total=active.length,favs=active.filter(e=>e.fav).length;
  const weak=active.filter(e=>getPwScore(e.pw)<2).length;
  const pwMap={};active.forEach(e=>{if(e.pw)pwMap[e.pw]=(pwMap[e.pw]||0)+1;});
  const dups=active.filter(e=>e.pw&&pwMap[e.pw]>1).length;
  const now=Date.now();const old=active.filter(e=>e.pwUpdated&&(now-e.pwUpdated)>180*86400000).length;
  const alerts=[];
  if(total===0)alerts.push({type:'warn',icon:'💡',text:t('alertEmpty'),sub:t('alertEmptySub')});
  const common=active.filter(e=>isCommonPassword(e.pw));
  // Os nomes vêm do cofre (e de ficheiros/CSV importados): têm de ser escapados antes de irem para o innerHTML
  const namesOf=list=>list.map(e=>esc(e.name)).join(', ');
  if(weak>0){const names=namesOf(active.filter(e=>getPwScore(e.pw)<2));alerts.push({type:'danger',icon:'⚠️',text:`${weak} ${t('alertWeak')}`,sub:names});}
  if(common.length>0){const names=namesOf(common);alerts.push({type:'danger',icon:'🚨',text:`${common.length} ${t('alertCommon')}`,sub:names});}
  if(dups>0){const names=namesOf(active.filter(e=>e.pw&&pwMap[e.pw]>1));alerts.push({type:'danger',icon:'🔁',text:`${dups} ${t('alertDups')}`,sub:names});}
  if(old>0){const names=namesOf(active.filter(e=>e.pwUpdated&&(now-e.pwUpdated)>180*86400000));alerts.push({type:'warn',icon:'⏰',text:`${old} ${t('alertOld')}`,sub:names});}
  // Entradas duplicadas (mesmo nome + utilizador) — típico de importações repetidas
  const dupEntries=findDuplicateEntries();
  if(dupEntries.length>0){
    const names=namesOf(dupEntries);
    alerts.push({type:'warn',icon:'👥',text:`${dupEntries.length} ${t('alertDupEntries')}`,sub:names,action:'dedupe'});
  }
  if(weak===0&&common.length===0&&dups===0&&old===0&&dupEntries.length===0&&total>0)alerts.push({type:'good',icon:'✅',text:t('alertGood'),sub:t('alertGoodSub')});
  // Card expiry alerts
  bankCards.forEach(card=>{
    if(card.archived)return;
    // Um cartão «MM/AA» é válido até ao ÚLTIMO dia desse mês (antes contava-se a partir do dia 1)
    const exp=cardExpiryToDate(card.expiry);
    if(!exp)return;
    const daysLeft=calDaysUntil(exp);
    if(daysLeft<0)alerts.push({type:'danger',icon:'💳',text:`${esc(card.bank)}: ${t('cardExpired')}`,sub:esc(card.expiry)});
    else if(daysLeft<=60)alerts.push({type:'warn',icon:'💳',text:`${esc(card.bank)}: ${t('cardExpiringSoon')}`,sub:`${esc(card.expiry)} — ${daysLeft} ${t('cardDaysLeft')}`});
  });
  // Document expiry alerts
  documents.forEach(doc=>{
    if(!doc.expiry)return;
    const status=getExpiryStatus(doc.expiry);
    if(!status)return;
    if(status.cls==='expired')alerts.push({type:'danger',icon:'📁',text:`${esc(doc.title)}: ${currentLang==='en'?'Document expired!':'Documento expirado!'}`,sub:esc(doc.expiry)});
    else if(status.cls==='soon')alerts.push({type:'warn',icon:'📁',text:`${esc(doc.title)}: ${status.label}`,sub:esc(doc.expiry)});
  });
  // Renovações de subscrições
  (subscriptions||[]).forEach(s=>{
    try{
      const d=subNextCharge(s);if(!d)return;
      const n=calDaysUntil(d);
      if(n<0||n>14)return;
      const val=s.amount?' · '+fmtMoney(parseFloat(s.amount)||0):'';
      alerts.push({type:n<=3?'danger':'warn',icon:'🔄',
        text:esc(s.name||'')+': '+(currentLang==='en'?'renews':'renova')+' '+calWhenLabel(n),sub:d.toLocaleDateString(currentLang==='en'?'en-GB':'pt-PT',{day:'2-digit',month:'2-digit',year:'numeric'})+val});
    }catch(e){}
  });
  // Grupo Bens: garantias, licenças, veículos e datas
  (assets||[]).forEach(as=>{
    try{
      const ic={warranty:'🧾',license:'🔑',vehicle:'🚗',dates:'🎂'}[as.kind]||'📌';
      assetDates(as).forEach(ev=>{
        const n=calDaysUntil(ev.date);
        if(n>30)return;
        const nome=esc(as.name||'')+(ev.sub?' ('+esc(ev.sub)+')':'');
        if(n<0){
          if(n<-90)return;
          alerts.push({type:'danger',icon:ic,text:nome+': '+(currentLang==='en'?'expired!':'expirou!'),sub:ev.date.toLocaleDateString(currentLang==='en'?'en-GB':'pt-PT',{day:'2-digit',month:'2-digit',year:'numeric'})});
        }else alerts.push({type:n<=7?'danger':'warn',icon:ic,text:nome+': '+calWhenLabel(n),sub:ev.date.toLocaleDateString(currentLang==='en'?'en-GB':'pt-PT',{day:'2-digit',month:'2-digit',year:'numeric'})});
      });
    }catch(e){}
  });
  document.getElementById('dash-alerts').innerHTML=alerts.map(a=>`<div class="dash-alert ${a.type}${a.action?' clickable':''}"${a.action==='dedupe'?' data-act="openDedupeModal"':''}><span class="dash-alert-icon">${a.icon}</span><div class="dash-alert-text">${a.text}${a.sub?`<small>${a.sub}</small>`:''}</div>${a.action==='dedupe'?`<span class="dash-alert-cta">${currentLang==='en'?'Fix →':'Resolver →'}</span>`:''}</div>`).join('');
  // Badge do cartão de alertas: nº de problemas (ou ✓ se tudo bem)
  const problems=alerts.filter(a=>a.type==='danger'||a.type==='warn').length;
  const aBadge=document.getElementById('alerts-badge');
  if(aBadge){
    if(problems>0){aBadge.textContent=problems;aBadge.className='dcard-badge warn';}
    else{aBadge.textContent='✓';aBadge.className='dcard-badge ok';}
  }
  // Títulos dos cartões (traduzidos)
  const dcEn=currentLang==='en';
  const setT=(id,pt,en)=>{const el=document.getElementById(id);if(el)el.textContent=dcEn?en:pt;};
  setT('dcard-alerts-title','Alertas & Relatório','Alerts & Report');
  setT('dcard-report-title','Relatório do Mês','Monthly Report');
  setT('cal-open-txt','Ver calendário de renovações','View renewals calendar');
  setT('calendar-title','📅 Calendário','📅 Calendar');
  setT('cal-sub','Renovações, validades e feriados ao longo do mês.','Renewals, expiries and holidays through the month.');
  setT('cal-leg-renew','Renovação','Renewal');
  setT('cal-leg-doc','Validade documento','Document expiry');
  setT('cal-leg-card','Validade cartão','Card expiry');
  setT('cal-leg-holiday','Feriado','Holiday');
  setT('cal-ics-txt','Adicionar ao calendário do telemóvel','Add to phone calendar');
  setT('s-themes-title','🎨 Temas Predefinidos','🎨 Preset Themes');
  setT('dcard-favs-title','Favoritos','Favourites');
  setT('dcard-cats-title','Entradas por categoria','Entries by category');
  setT('dcard-oldest-title','Passwords mais antigas','Oldest passwords');
  setT('dcard-activity-title','Atividade recente','Recent activity');

  renderGreeting();
  renderRenewals();
  renderSubsSection();
  applyDashCardStates();
  refreshBreachButton();
  // ── FAVORITOS ──
  renderWifiBar();
  const favList=active.filter(e=>e.fav).slice(0,8);
  const favsWrap=document.getElementById('dcard-favs');
  const favBadge=document.getElementById('favs-badge');
  if(favBadge)favBadge.textContent=favList.length||'';
  if(favsWrap){
    favsWrap.style.display=favList.length?'block':'none';
    const favsEl=document.getElementById('dash-favs');
    if(favsEl)favsEl.innerHTML=favList.map(e=>{
      const ic=e.icon&&e.icon!=='⭐'?e.icon:(getServiceIcon(e.name)||'🔐');
      return `<div class="fav-quick" data-act="openReadMode" data-arg="${esc(e.id)}">
        <span class="fav-quick-icon">${ic}</span>
        <div class="fav-quick-name">${esc(e.name)}</div>
        <span class="fav-quick-arrow">→</span>
      </div>`;
    }).join('');
  }

  // ── CATEGORY CHART ──
  const chartTitle=document.getElementById('dash-chart-title');
  if(chartTitle)chartTitle.textContent=currentLang==='en'?'📊 Entries by category':'📊 Entradas por categoria';
  const chartEl=document.getElementById('dash-cat-chart');
  if(chartEl&&total>0){
    const catEntries=allEntryCats().map(ci=>({...ci,count:active.filter(e=>e.cat===ci.key).length}))
      .filter(ci=>ci.count>0).sort((a,b)=>b.count-a.count);
    const max=Math.max(...catEntries.map(c=>c.count));
    chartEl.innerHTML=catEntries.map(c=>`
      <div class="cat-bar-row">
        <div class="cat-bar-label">${c.icon} ${c.label}</div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:0%;background:${c.color}" data-target="${Math.round((c.count/max)*100)}"></div>
        </div>
        <div class="cat-bar-count">${c.count}</div>
      </div>`).join('');
    // Animate bars
    setTimeout(()=>{
      chartEl.querySelectorAll('.cat-bar-fill').forEach(bar=>{
        bar.style.width=bar.dataset.target+'%';
      });
    },50);
  } else if(chartEl){
    chartEl.innerHTML=`<div style="font-size:.72rem;color:var(--text-muted);padding:10px 0">${currentLang==='en'?'No entries yet.':'Sem entradas ainda.'}</div>`;
  }

  // ── OLDEST PASSWORDS ──
  const withDates=active.filter(e=>e.pwUpdated).sort((a,b)=>a.pwUpdated-b.pwUpdated).slice(0,5);
  const oldestTitle=document.getElementById('dash-oldest-title');
  if(oldestTitle)oldestTitle.textContent=currentLang==='en'?'⏳ Oldest passwords':'⏳ Passwords mais antigas';
  const oldestList=document.getElementById('dash-oldest-list');
  if(oldestList){
    if(!withDates.length){
      oldestList.innerHTML=`<div style="font-size:.72rem;color:var(--text-muted);padding:10px 0">${currentLang==='en'?'No data yet.':'Sem dados ainda.'}</div>`;
    } else {
      const enO=currentLang==='en';
      oldestList.innerHTML=withDates.map(e=>{
        const days=Math.floor((Date.now()-e.pwUpdated)/86400000);
        const dc=days>180?'color:var(--red)':days>90?'color:var(--accent-ink)':'color:var(--green)';
        const nudge=days>180?`<span class="oldest-nudge">${enO?'consider changing':'considera trocar'}</span>`:'';
        return `<div class="oldest-item clickable" data-act="goToEntry" data-arg="${esc(e.id)}" title="${enO?'Open entry':'Abrir entrada'}">
          <div class="oldest-days" style="${dc}">${days}</div>
          <div style="flex:1;min-width:0"><div class="oldest-name">${esc(e.name)}</div><div class="oldest-label">${enO?'days without update':'dias sem atualizar'}${nudge}</div></div>
          <span class="oldest-arrow">→</span>
        </div>`;
      }).join('');
    }
  }

  // ── ACTIVITY LOG ──
  const actTitle=document.getElementById('dash-activity-title');
  if(actTitle)actTitle.textContent=currentLang==='en'?'📋 Recent activity':'📋 Atividade recente';
  const actList=document.getElementById('dash-activity-list');
  if(actList){
    if(!activityLog.length){
      actList.innerHTML=`<div style="font-size:.72rem;color:var(--text-muted);padding:10px 0">${currentLang==='en'?'No activity yet.':'Sem atividade ainda.'}</div>`;
    } else {
      const actionLabels={
        add:currentLang==='en'?'Added':'Adicionado',
        edit:currentLang==='en'?'Edited':'Editado',
        delete:currentLang==='en'?'Deleted':'Apagado',
        archive:currentLang==='en'?'Archived':'Arquivado',
        restore:currentLang==='en'?'Restored':'Restaurado',
      };
      actList.innerHTML=activityLog.slice(0,8).map(a=>`
        <div class="activity-item">
          <span class="activity-icon">${a.icon||'📝'}</span>
          <div class="activity-text"><strong>${actionLabels[a.action]||a.action}</strong> ${esc(a.name)}</div>
          <span class="activity-time">${timeAgo(a.ts)}</span>
        </div>`).join('');
    }
  }
}

// ══ SIDEBAR ══
function getCatLabel(key){const cu=customCats.find(x=>x.key===key);if(cu)return cu.name;const m={all:'catAll',email:'catEmail',banco:'catBanco',jogo:'catJogo',social:'catSocial',trabalho:'catTrabalho',outro:'catOutro'};return t(m[key])||key;}
const BUILTIN_CAT_COLORS={email:'#4c8caf',banco:'#4caf82',jogo:'#af7a4c',social:'#9b6ec7',trabalho:'#afa04c',outro:'#888888'};
function vaultCatInfo(key){
  if(CATS[key]&&key!=='all')return{key,icon:CATS[key].icon,label:getCatLabel(key),color:BUILTIN_CAT_COLORS[key]||'#888888',custom:false};
  const cu=customCats.find(x=>x.key===key);
  if(cu)return{key,icon:cu.icon||'📁',label:cu.name,color:cu.color||'#888888',custom:true};
  return{key:'outro',icon:'📁',label:getCatLabel('outro'),color:'#888888',custom:false};
}
function allEntryCats(){return Object.keys(CATS).filter(k=>k!=='all').map(k=>vaultCatInfo(k)).concat(customCats.map(cu=>vaultCatInfo(cu.key)));}
function renderSidebar(){
  const el=document.getElementById('sidebar-cats');
  const active=vault.filter(e=>!e.archived);
  document.getElementById('sb-cats-title').textContent=t('sbCats');
  const catCount={};active.forEach(e=>{catCount[e.cat]=(catCount[e.cat]||0)+1;});
  const sideCats=[{key:'all',icon:CATS.all.icon,label:getCatLabel('all')}].concat(allEntryCats());
  // Uma só escrita no DOM (o «innerHTML +=» dentro do ciclo voltava a analisar tudo a cada item)
  el.innerHTML=sideCats.map(({key,icon,label})=>{
    const count=key==='all'?active.length:(catCount[key]||0);
    return `<div class="cat-item ${currentCat===key&&!currentTag?'active':''}" data-act="selectCat" data-arg="${esc(key)}"><span>${icon}</span><span>${esc(label)}</span><span class="cat-count">${count}</span></div>`;
  }).join('');
  // Tags sidebar
  const tagsEl=document.getElementById('sidebar-tags');
  document.getElementById('sb-tags-title').textContent=t('sbTags');
  const allTags=[...new Set(active.flatMap(e=>e.tags||[]))];
  tagsEl.innerHTML=allTags.length
    ?`<div class="cat-item" data-act="selectTag" data-arg=""><span>🏷️</span><span>${t('tagAll')}</span></div>`
      +allTags.map(tag=>`<div class="cat-item ${currentTag===tag?'active':''}" data-act="selectTag" data-arg="${esc(tag)}"><span>🏷️</span><span>${esc(tag)}</span></div>`).join('')
    :'';
}
function selectCat(cat){currentCat=cat;currentTag='';document.getElementById('content-title').textContent=cat==='all'?t('allEntries'):getCatLabel(cat);renderSidebar();renderCards();}
function selectTag(tag){currentTag=tag;currentCat='all';document.getElementById('content-title').textContent=tag||t('allEntries');renderSidebar();renderCards();}

// ══ VIEW TOGGLE ══
function setView(view){
  currentView=view;
  const grid=document.getElementById('cards-grid');
  grid.classList.toggle('compact',view==='compact');
  document.getElementById('view-normal').classList.toggle('active',view==='normal');
  document.getElementById('view-compact').classList.toggle('active',view==='compact');
}

// ══ CARDS (DRAG & DROP) ══
let dragSrcId=null;
function renderCards(){
  renderVaultSecureBar();
  const q=document.getElementById('search-input').value.toLowerCase();
  const sortVal=document.getElementById('sort-select').value;
  const now=Date.now();
  const vFilterActive=!!q||!!currentTag||currentCat!=='all';
  let filtered=vault.filter(e=>!e.archived).filter(e=>{
    const matchCat=currentCat==='all'||e.cat===currentCat;
    const matchTag=!currentTag||(e.tags||[]).includes(currentTag);
    const matchQ=!q||e.name.toLowerCase().includes(q)||(e.user||'').toLowerCase().includes(q);
    const matchFolder=vFilterActive||(e.folderId||null)===(currentVaultFolderId||null);
    return matchCat&&matchTag&&matchQ&&matchFolder;
  });
  renderVaultBreadcrumb(vFilterActive);
  filtered.sort((a,b)=>{
    if(sortVal==='fav'){if(b.fav!==a.fav)return(b.fav?1:0)-(a.fav?1:0);return(a.order||0)-(b.order||0);}
    if(sortVal==='name')return a.name.localeCompare(b.name);
    if(sortVal==='date')return(b.createdAt||0)-(a.createdAt||0);
    if(sortVal==='cat')return a.cat.localeCompare(b.cat);
    return(a.order||0)-(b.order||0);
  });
  const grid=document.getElementById('cards-grid');
  grid.classList.toggle('compact',currentView==='compact');
  const enV=currentLang==='en';
  const activeAll=vault.filter(e=>!e.archived);
  const vSubFolders=vFilterActive?[]:vaultFolders.filter(f=>(f.parentId||null)===(currentVaultFolderId||null)).sort((a,b)=>a.name.localeCompare(b.name));
  const vFoldersHtml=vSubFolders.map(f=>{
    const cnt=folderDirectCounts(f.id,vaultFolders,activeAll);
    const parts=[];
    if(cnt.folders)parts.push(`${cnt.folders} ${enV?(cnt.folders===1?'folder':'folders'):(cnt.folders===1?'pasta':'pastas')}`);
    parts.push(`${cnt.docs} ${enV?(cnt.docs===1?'entry':'entries'):(cnt.docs===1?'entrada':'entradas')}`);
    return `<div class="folder-card" data-act="openVaultFolder" data-arg="${esc(f.id)}" title="${esc(f.name)}">
      <div class="folder-icon">${f.icon||'📁'}</div>
      <div class="folder-info"><div class="folder-name">${esc(f.name)}</div><div class="folder-count">${parts.join(' · ')}</div></div>
      <div class="folder-menu">
        <button class="card-btn" data-act="openFolderModal" data-arg="${esc(f.id)}" data-arg2="vault" title="${enV?'Rename':'Renomear'}">✏️</button>
        <button class="card-btn danger" data-act="deleteFolder" data-arg="${esc(f.id)}" data-arg2="vault" title="${enV?'Delete':'Apagar'}">🗑️</button>
      </div>
    </div>`;
  }).join('');
  if(!filtered.length&&!vSubFolders.length){
    grid.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><p>${currentVaultFolderId&&!vFilterActive?(enV?'This folder is empty.':'Esta pasta está vazia.'):t('emptyState')}</p></div>`;
    return;
  }
  const __cards=filtered.map(entry=>{
    const bc=`badge-${entry.cat}`,cl=getCatLabel(entry.cat);
    const isOld=entry.pwUpdated&&(now-entry.pwUpdated)>180*86400000;
    const isRecent=entry.pwUpdated&&(now-entry.pwUpdated)<30*86400000;
    const ageBadge=isOld?`<span class="pw-age-badge old">${t('pwOld')}</span>`:isRecent?`<span class="pw-age-badge recent">${t('pwRecent')}</span>`:'';
    const isWeak=entry.pw&&getPwScore(entry.pw)<2;
    const weakBadge=isWeak?`<span class="pw-age-badge weak" title="${currentLang==='en'?'Weak password':'Password fraca'}">⚠️ ${currentLang==='en'?'Weak':'Fraca'}</span>`:'';
    const tagsHtml=(entry.tags||[]).map(tag=>`<span class="card-tag">${esc(tag)}</span>`).join('');
    const userIcon=entry.icon&&entry.icon!=='⭐'?entry.icon:null;
    const brandSvg=userIcon?null:getBrandIcon(entry);
    const svcIcon=userIcon?userIcon:(brandSvg?`<span class="brand-logo">${brandSvg}</span>`:getServiceIcon(entry.name));
    const ci=vaultCatInfo(entry.cat);
    return `<div class="entry-card cat-${esc(entry.cat)}${entry.fav?' is-fav':''}" id="card-${esc(entry.id)}"${ci.custom?` style="border-left:3px solid ${esc(ci.color)}"`:''} draggable="true" data-dnd="vault" data-arg="${esc(entry.id)}">
      <div class="card-top">
        <div class="card-badge-row">
          ${svcIcon?`<span class="service-icon">${svcIcon}</span>`:avMono(entry.name)}
          <span class="card-cat-badge" style="background:${ci.color}26;color:${ci.color}">${ci.icon} ${esc(ci.label)}</span>
          ${tagsHtml}
        </div>
        <button class="fav-btn${entry.fav?' active':''}" data-act="toggleFav" data-arg="${esc(entry.id)}" title="${entry.fav?t('favRemove'):t('favAdd')}">${entry.fav?'⭐':'☆'}</button>
      </div>
      <div class="card-name">${entry.flag?`<span class="entry-flag-dot" style="background:${(ENTRY_FLAGS.find(f=>f.id===entry.flag)||{}).color||'transparent'}"></span>`:''}${esc(entry.name)}</div><div class="pw-badges">${weakBadge}${ageBadge}</div>
      ${vFilterActive&&entry.folderId?`<div class="doc-loc">📍 ${esc(scopePathLabel(entry.folderId,'vault'))}</div>`:''}
      ${(()=>{const ats=normalizeAttachments(entry);const im=ats.find(x=>(x.type||'').startsWith('image/'));return im?`<img class="card-attachment" src="${esc(im.data)}" alt="anexo">`:'';})()}
      ${entry.user?`<div class="card-field"><span class="card-field-label">${t('cardUser')}</span><div class="card-field-inner"><span class="card-field-value">${esc(entry.user)}</span><button class="card-btn" data-act="copyText" data-arg="${esc(entry.user)}" data-arg2="${esc(t('userCopied'))}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div>`:''}
      ${entry.pw?`<div class="card-field"><span class="card-field-label">${t('cardPw')}</span><div class="card-field-inner"><span class="card-field-value masked" id="pw-${esc(entry.id)}">••••••••</span><button class="card-btn" data-act="togglePw" data-arg="${esc(entry.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="card-btn" data-act="avCopyPw" data-arg="${esc(entry.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div>`:''}
      ${entry.url?`<div class="card-field"><span class="card-field-label">${t('cardUrl')}</span><div class="card-field-inner"><a${siteHref(entry.url)?` href="${esc(siteHref(entry.url))}"`:''} target="_blank" rel="noopener noreferrer" class="card-field-value" style="color:var(--accent-dim);text-decoration:none;font-size:.7rem">${esc(entry.url)}</a></div></div>`:''}
      ${(entry.fields||[]).map(f=>`<div class="card-field"><span class="card-field-label">${esc(f.k)}</span><div class="card-field-inner"><span class="card-field-value">${esc(f.v)}</span><button class="card-btn" data-act="copyText" data-arg="${esc(f.v)}" data-arg2="✓"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div>`).join('')}
      ${entry.notes?`<div class="card-field"><span class="card-field-label">${t('cardNotes')}</span><div class="card-field-inner"><span class="card-field-value" style="white-space:normal;font-size:.65rem;color:var(--text-muted)">${esc(entry.notes)}</span></div></div>`:''}
      ${entry.pwHistory&&entry.pwHistory.length?`<div class="card-field"><span class="card-field-label" style="cursor:pointer" data-act="toggleHistory" data-arg="${esc(entry.id)}">🕒 ${t('pwHistory')} (${entry.pwHistory.length})</span><div id="hist-${esc(entry.id)}" style="display:none;margin-top:4px;display:flex;flex-direction:column;gap:3px;display:none">${entry.pwHistory.map((p,i)=>`<div style="display:flex;align-items:center;gap:6px;font-size:.65rem;color:var(--text-muted)"><span style="width:14px;opacity:.5">${i+1}.</span><span class="card-field-value masked" id="hist-pw-${esc(entry.id)}-${i}">••••••••</span><button class="card-btn" data-act="toggleHistPw" data-arg="${esc(entry.id)}" data-arg2="${i}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="card-btn" data-act="avCopyHistPw" data-arg="${esc(entry.id)}" data-arg2="${i}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>`).join('')}</div></div>`:''}
      ${attachChips(entry,'vault')}
      <div class="card-actions">
        ${entry.url?`<button class="card-btn" data-act="avGoSite" data-arg="${esc(entry.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> ${t('btnGoSite')}</button>`:''}
        ${isWifiEntry(entry)?`<button class="card-btn" data-act="openWifiQR" data-arg="${esc(entry.id)}">📶 QR</button>`:''}
        <button class="card-btn" data-act="openReadMode" data-arg="${esc(entry.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${t('btnRead')}</button>
        <button class="card-btn" data-act="editEntry" data-arg="${esc(entry.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${t('btnEdit')}</button>
        <button class="card-btn${entry.reviewedAt?' reviewed':''}" data-act="toggleReviewed" data-arg="${esc(entry.id)}" title="${entry.reviewedAt?reviewedLabel(entry.reviewedAt):(currentLang==='en'?'Mark as reviewed':'Marcar como revista')}">${entry.reviewedAt?'✅':'☑️'} ${entry.reviewedAt?(currentLang==='en'?'Reviewed':'Revista'):(currentLang==='en'?'Review':'Rever')}</button>
        <button class="card-btn" data-act="openMoveModal" data-arg="${esc(entry.id)}" data-arg2="vault">📂 ${currentLang==='en'?'Move':'Mover'}</button>
        <button class="card-btn" data-act="archiveEntry" data-arg="${esc(entry.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> ${t('btnArchive')}</button>
        <button class="card-btn danger" data-act="deleteEntry" data-arg="${esc(entry.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg> ${t('btnDel')}</button>
      </div>
    </div>`;
  });
  avChunkRender(grid,vFoldersHtml,__cards);
}

// ══ DRAG & DROP ══
function dragStart(e,id){
  if(e.target.tagName==='BUTTON'||e.target.closest('button')){e.preventDefault();return;}
  dragSrcId=id;
  setTimeout(()=>{const el=document.getElementById('card-'+id);if(el)el.classList.add('dragging');},0);
}
// O «dragover» dispara dezenas de vezes por segundo: só mexe no cartão que muda (antes percorria todos)
let _dragOverEl=null;
function dragOver(e,id){
  e.preventDefault();
  const el=document.getElementById('card-'+id),tgt=el&&id!==dragSrcId?el:null;
  if(tgt===_dragOverEl)return;
  if(_dragOverEl)_dragOverEl.classList.remove('drag-over');
  _dragOverEl=tgt;if(tgt)tgt.classList.add('drag-over');
}
function dragDrop(targetId){
  if(!dragSrcId||dragSrcId===targetId)return;
  const srcIdx=vault.findIndex(v=>v.id===dragSrcId);
  const tgtIdx=vault.findIndex(v=>v.id===targetId);
  if(srcIdx<0||tgtIdx<0)return;
  const [removed]=vault.splice(srcIdx,1);vault.splice(tgtIdx,0,removed);
  vault.forEach((e,i)=>e.order=i);
  renderCards();renderSidebar();markUnsaved();
}
function dragEnd(){dragSrcId=null;_dragOverEl=null;document.querySelectorAll('.entry-card.dragging,.entry-card.drag-over').forEach(c=>{c.classList.remove('dragging');c.classList.remove('drag-over');});}

function toggleHistory(id){const el=document.getElementById('hist-'+id);if(el)el.style.display=el.style.display==='none'?'flex':'none';}
// As passwords antigas já não vão escritas no HTML dos botões: são lidas do cofre quando precisas
function histPwOf(entryId,idx){const e=vault.find(x=>x.id===entryId);return e&&e.pwHistory?e.pwHistory[idx]||'':'';}
function toggleHistPw(entryId,idx){const el=document.getElementById(`hist-pw-${entryId}-${idx}`);if(!el)return;if(el.classList.contains('masked')){el.textContent=histPwOf(entryId,idx);el.classList.remove('masked');}else{el.textContent='••••••••';el.classList.add('masked');}}
function avCopyHistPw(entryId,idx){const pw=histPwOf(entryId,idx);if(pw)copyText(pw,t('pwCopied'));}

function togglePw(id,pw){if(pw===undefined){const e=vault.find(x=>x.id===id);pw=e?e.pw:'';}const el=document.getElementById('pw-'+id);if(el.classList.contains('masked')){el.textContent=pw;el.classList.remove('masked');}else{el.textContent='••••••••';el.classList.add('masked');}}

// ══ SERVICE ICONS ══
const SERVICE_ICONS={
  gmail:'📧',google:'🌐',youtube:'▶️',facebook:'👤',instagram:'📸',twitter:'🐦',
  x:'🐦',linkedin:'💼',github:'🐙',discord:'🎮',spotify:'🎵',netflix:'🎬',
  amazon:'📦',apple:'🍎',microsoft:'🪟',paypal:'💳',ebay:'🛍️',
  twitch:'🎮',reddit:'🔴',pinterest:'📌',snapchat:'👻',tiktok:'🎵',
  whatsapp:'💬',telegram:'✈️',slack:'💬',zoom:'📹',dropbox:'📦',
  steam:'🎮',epic:'🎮',playstation:'🎮',xbox:'🎮',nintendo:'🎮',
  santander:'🏦',cgd:'🏦',mbway:'💳',multibanco:'💳',millennium:'🏦',
  novobanco:'🏦',bpi:'🏦',bcp:'🏦',montepio:'🏦',
  outlook:'📧',hotmail:'📧',yahoo:'📧',icloud:'☁️',
};
// Chaves curtas (x, cgd, bpi, bcp) só contam como palavra inteira — «Xpto» não é o X/Twitter.
// As expressões são compiladas uma vez (antes, a cada entrada de cada render).
function wordKeyMatcher(key){return key.length<=3?new RegExp('(^|[^a-z0-9])'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)','i'):key;}
function keyMatches(m,hay){return typeof m==='string'?hay.includes(m):m.test(hay);}
let _svcMatchers=null;
function getServiceIcon(name){
  if(!name)return null;
  const lower=String(name).toLowerCase();
  if(!_svcMatchers)_svcMatchers=Object.entries(SERVICE_ICONS).map(([key,icon])=>({m:wordKeyMatcher(key),icon}));
  for(const s of _svcMatchers)if(keyMatches(s.m,lower))return s.icon;
  return null;
}

// ══ UNSAVED STATE ══
let hasUnsaved=false;
function markUnsaved(){
  if(presentationMode)return;
  hasUnsaved=true;
  const btn=document.querySelector('.btn-save-file');
  if(btn)btn.classList.add('has-changes');
}
function markSaved(){
  hasUnsaved=false;
  const btn=document.querySelector('.btn-save-file');
  if(btn)btn.classList.remove('has-changes');
}
// Cofres grandes: espera que se acabe de escrever e desenha no máximo GS_MAX resultados por secção
let _gsT=0;const GS_MAX=60;
function onSearchInput(){
  clearTimeout(_gsT);
  if(vault.length+notes.length+documents.length>300){_gsT=setTimeout(gsRun,150);const si=document.getElementById('search-input'),clr=document.getElementById('search-clear');if(clr&&si)clr.style.display=si.value?'block':'none';return;}
  gsRun();
}
function gsRun(){
  const si=document.getElementById('search-input');
  const q=si.value.toLowerCase().trim();
  const clr=document.getElementById('search-clear');
  if(clr)clr.style.display=si.value?'block':'none';
  const resultsEl=document.getElementById('global-search-results');
  const mainEl=document.querySelector('.main');
  if(!q){resultsEl.style.display='none';if(mainEl)mainEl.style.display='';return;}
  if(mainEl)mainEl.style.display='none';
  const vaultMatches=vault.filter(e=>!e.archived&&(
    e.name.toLowerCase().includes(q)||(e.user||'').toLowerCase().includes(q)||
    (e.url||'').toLowerCase().includes(q)||(e.notes||'').toLowerCase().includes(q)||
    (e.tags||[]).some(tag=>tag.toLowerCase().includes(q))||
    (e.fields||[]).some(f=>(f.k||'').toLowerCase().includes(q)||(f.v||'').toLowerCase().includes(q))
  ));
  const noteMatches=notes.filter(n=>(n.title||'').toLowerCase().includes(q)||(n.body||'').toLowerCase().includes(q));
  const cardMatches=bankCards.filter(c=>(c.bank||'').toLowerCase().includes(q)||(c.holder||'').toLowerCase().includes(q)||(c.notes||'').toLowerCase().includes(q));
  const docMatches=documents.filter(d=>(d.title||'').toLowerCase().includes(q)||(d.desc||'').toLowerCase().includes(q)||(d.cat||'').toLowerCase().includes(q));
  const total=vaultMatches.length+noteMatches.length+cardMatches.length+docMatches.length;
  resultsEl.style.display='block';
  if(!total){resultsEl.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>${t('globalSearchEmpty')} "<strong>${esc(q)}</strong>"</p></div>`;return;}
  let html=`<div style="font-size:.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:14px">${t('globalSearchResults')}: <strong style="color:var(--accent-ink)">${total}</strong></div>`;
  if(vaultMatches.length){
    html+=`<div style="font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">🔐 ${t('tabVault')} (${vaultMatches.length})</div>`;
    html+=`<div class="cards-grid" style="margin-bottom:18px">${vaultMatches.slice(0,GS_MAX).map(e=>`<div class="entry-card" data-act="gsOpenEntry" data-arg="${esc(e.id)}" style="cursor:pointer"><div class="card-top"><span class="card-cat-badge" style="background:${vaultCatInfo(e.cat).color}26;color:${vaultCatInfo(e.cat).color}">${vaultCatInfo(e.cat).icon} ${esc(vaultCatInfo(e.cat).label)}</span>${e.fav?'⭐':''}</div><div class="card-name">${esc(e.name)}</div>${e.user?`<div style="font-size:.75rem;color:var(--text-muted)">${esc(e.user)}</div>`:''}</div>`).join('')}</div>`;
  }
  if(noteMatches.length){
    html+=`<div style="font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">📝 ${t('tabNotes')} (${noteMatches.length})</div>`;
    html+=`<div class="cards-grid" style="margin-bottom:18px">${noteMatches.slice(0,GS_MAX).map(n=>`<div class="entry-card" data-act="gsOpenNote" data-arg="${esc(n.id)}" style="cursor:pointer"><div class="card-name">${esc(n.title||'...')}</div><div style="font-size:.75rem;color:var(--text-muted)">${esc((n.body||'').slice(0,60))}</div></div>`).join('')}</div>`;
  }
  if(cardMatches.length){
    html+=`<div style="font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">💳 ${t('tabCards')} (${cardMatches.length})</div>`;
    html+=`<div class="cards-grid" style="margin-bottom:18px">${cardMatches.slice(0,GS_MAX).map(c=>`<div class="entry-card" data-act="gsOpenCards" style="cursor:pointer"><div class="card-name">${esc(c.bank)}</div><div style="font-size:.75rem;color:var(--text-muted)">${esc(c.holder||'')} ${c.expiry?'· '+esc(c.expiry):''}</div></div>`).join('')}</div>`;
  }
  if(docMatches.length){
    html+=`<div style="font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">📁 ${currentLang==='en'?'Documents':'Documentos'} (${docMatches.length})</div>`;
    html+=`<div class="cards-grid">${docMatches.slice(0,GS_MAX).map(d=>`<div class="entry-card" data-act="openDocPreview" data-arg="${esc(d.id)}" style="cursor:pointer"><div class="card-name">${esc(d.title)}</div><div style="font-size:.75rem;color:var(--text-muted)">${getDocCatLabel(d.cat)} ${d.expiry?'· '+esc(d.expiry):''}</div><div class="doc-loc">📍 ${esc(folderPathLabel(d.folderId||null))}</div></div>`).join('')}</div>`;
  }
  const cut=[vaultMatches,noteMatches,cardMatches,docMatches].reduce((n,a)=>n+Math.max(0,a.length-GS_MAX),0);
  if(cut)html+=`<div style="font-size:.7rem;color:var(--text-muted);text-align:center;margin:6px 0 14px">${currentLang==='en'?`+${cut} more — keep typing to narrow it down`:`+${cut} — escreve mais para afinar`}</div>`;
  resultsEl.innerHTML=html;
}
function closeGlobalSearch(){
  clearTimeout(_gsT);
  const si=document.getElementById('search-input');
  if(si){si.value='';si.blur();}
  const clr=document.getElementById('search-clear');
  if(clr)clr.style.display='none';
  const resEl=document.getElementById('global-search-results');
  if(resEl){resEl.style.display='none';resEl.innerHTML='';}
  const mainEl=document.querySelector('.main');
  if(mainEl)mainEl.style.display='';
  window.scrollTo({top:0,behavior:'instant'});
}
function scrollToCard(id){
  avFlushChunks();
  const el=document.getElementById('card-'+id);
  if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  // Flash highlight
  el.style.transition='box-shadow .1s';
  el.style.boxShadow='0 0 0 3px var(--accent)';
  setTimeout(()=>{el.style.boxShadow='';},1500);
}
function scrollToDoc(id){
  renderDocs();
  setTimeout(()=>{
    // Find card by looking for the doc title
    const d=documents.find(doc=>doc.id===id);
    if(!d)return;
    const cards=document.querySelectorAll('#docs-grid .doc-card');
    cards.forEach(card=>{
      const title=card.querySelector('.doc-card-title');
      if(title&&title.textContent===d.title){
        card.scrollIntoView({behavior:'smooth',block:'center'});
        card.style.transition='box-shadow .1s';
        card.style.boxShadow='0 0 0 3px var(--accent)';
        setTimeout(()=>{card.style.boxShadow='';},1500);
      }
    });
  },100);
}

// ══ ACTIVITY LOG ══

// ══ CALENDÁRIO DE RENOVAÇÕES, VALIDADES E FERIADOS ══
let calYear, calMonth;

// Cálculo da Páscoa (Meeus/Jones/Butcher) para os feriados móveis
function calEaster(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,da);
}
// Feriados nacionais portugueses
function calHolidays(y){
  const e=calEaster(y),off=n=>{const dt=new Date(e);dt.setDate(dt.getDate()+n);return dt;};
  const en=currentLang==='en';
  return [
    {d:new Date(y,0,1),n:en?'New Year':'Ano Novo'},
    {d:off(-47),n:'Carnaval'},
    {d:off(-2),n:en?'Good Friday':'Sexta-feira Santa'},
    {d:off(0),n:en?'Easter':'Páscoa'},
    {d:new Date(y,3,25),n:en?'Freedom Day':'Dia da Liberdade'},
    {d:new Date(y,4,1),n:en?'Labour Day':'Dia do Trabalhador'},
    {d:off(60),n:en?'Corpus Christi':'Corpo de Deus'},
    {d:new Date(y,5,10),n:en?'Portugal Day':'Dia de Portugal'},
    {d:new Date(y,7,15),n:en?'Assumption':'Assunção de Nossa Senhora'},
    {d:new Date(y,9,5),n:en?'Republic Day':'Implantação da República'},
    {d:new Date(y,10,1),n:en?"All Saints":'Todos os Santos'},
    {d:new Date(y,11,1),n:en?'Restoration of Independence':'Restauração da Independência'},
    {d:new Date(y,11,8),n:en?'Immaculate Conception':'Imaculada Conceição'},
    {d:new Date(y,11,25),n:en?'Christmas':'Natal'},
  ];
}
function calCollectEvents(){
  const events=[];
  (subscriptions||[]).forEach(s=>{
    const d=subNextCharge(s);
    if(d)events.push({date:d,type:'renew',label:s.name||'Subscrição',color:'var(--accent)',amount:s.amount,cycle:s.cycle});
  });
  (documents||[]).forEach(dc=>{
    if(dc.expiry){const d=new Date(dc.expiry);if(!isNaN(d))events.push({date:d,type:'doc',label:dc.name||dc.title||'Documento',color:'#4c8caf'});}
  });
  (bankCards||[]).forEach(bc=>{
    if(bc.expiry&&/^\d{2}\/\d{2}$/.test(bc.expiry)){const[mm,aa]=bc.expiry.split('/');const d=new Date(2000+parseInt(aa),parseInt(mm),0);if(!isNaN(d))events.push({date:d,type:'card',label:bc.name||bc.bank||'Cartão',color:'#e05270'});}
  });
  (assets||[]).forEach(as=>{
    const kindType={warranty:'warranty',license:'license',vehicle:'vehicle',dates:'date'}[as.kind];
    const kindColor={warranty:'#6fae7a',license:'#c98fd0',vehicle:'#5aa9c9',dates:'#e0a052'}[as.kind];
    assetDates(as).forEach(d=>{
      events.push({date:d.date,type:kindType,label:(as.name||'')+(d.sub?' ('+d.sub+')':''),color:kindColor});
    });
  });
  return events;
}
// Todos os eventos de um ano (utilizador + feriados)
function calAllEvents(y){
  const ev=calCollectEvents().slice();
  calHolidays(y).forEach(h=>ev.push({date:h.d,type:'holiday',label:h.n,color:'#9d7bd8'}));
  return ev;
}
function calDaysUntil(date){
  const t=new Date();t.setHours(0,0,0,0);
  const d=new Date(date);d.setHours(0,0,0,0);
  return Math.round((d-t)/86400000);
}
function calWhenLabel(n){
  const en=currentLang==='en';
  if(n===0)return en?'today':'hoje';
  if(n===1)return en?'tomorrow':'amanhã';
  if(n>1)return en?('in '+n+' days'):('em '+n+' dias');
  if(n===-1)return en?'yesterday':'ontem';
  return en?(-n+' days ago'):('há '+(-n)+' dias');
}
const CAL_ICON={renew:'🔄',doc:'📄',card:'💳',holiday:'🎉',warranty:'🧾',license:'🔑',vehicle:'🚗',date:'🎂'};
function calTypeLabel(t){
  const en=currentLang==='en';
  return (en?{renew:'Renewal',doc:'Document expiry',card:'Card expiry',holiday:'Holiday',warranty:'Warranty',license:'License',vehicle:'Vehicle',date:'Important date'}
            :{renew:'Renovação',doc:'Validade de documento',card:'Validade de cartão',holiday:'Feriado',warranty:'Garantia',license:'Licença',vehicle:'Veículo',date:'Data importante'})[t]||'';
}
function openCalendar(){
  const now=new Date();
  calYear=now.getFullYear();calMonth=now.getMonth();
  renderCalendar();renderUpcoming();
  document.getElementById('calendar-overlay').classList.add('open');
}
function closeCalendar(){
  document.getElementById('calendar-overlay').classList.remove('open');
  const det=document.getElementById('cal-day-detail');if(det)det.innerHTML='';
}
function calShiftMonth(delta){
  calMonth+=delta;
  if(calMonth<0){calMonth=11;calYear--;}else if(calMonth>11){calMonth=0;calYear++;}
  renderCalendar();
  const det=document.getElementById('cal-day-detail');if(det)det.innerHTML='';
}
function renderCalendar(){
  const en=currentLang==='en';
  const monthNames=en?['January','February','March','April','May','June','July','August','September','October','November','December']:['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const weekDays=en?['S','M','T','W','T','F','S']:['D','S','T','Q','Q','S','S'];
  document.getElementById('cal-month-label').textContent=monthNames[calMonth]+' '+calYear;
  document.getElementById('cal-weekdays').innerHTML=weekDays.map(d=>'<span class="cal-wd">'+d+'</span>').join('');
  const events=calAllEvents(calYear).filter(e=>e.date.getFullYear()===calYear&&e.date.getMonth()===calMonth);
  const byDay={};events.forEach(e=>{const day=e.date.getDate();(byDay[day]=byDay[day]||[]).push(e);});
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const today=new Date();today.setHours(0,0,0,0);
  let html='';
  // SEMPRE 42 células (6 linhas) → altura constante, as setas não saltam
  for(let cell=0;cell<42;cell++){
    const day=cell-firstDay+1;
    if(day<1||day>daysInMonth){html+='<span class="cal-day empty"></span>';continue;}
    const dayEvents=byDay[day]||[];
    const isToday=new Date(calYear,calMonth,day).getTime()===today.getTime();
    const isHoliday=dayEvents.some(e=>e.type==='holiday');
    const dots=dayEvents.slice(0,4).map(e=>'<span class="cal-dot" style="background:'+e.color+'"></span>').join('');
    html+='<button class="cal-day'+(isToday?' today':'')+(isHoliday?' holiday':'')+(dayEvents.length?' has-events':'')+'" '+(dayEvents.length?'data-act="calShowDay" data-args="['+(day)+']"':'')+'>'+
      '<span class="cal-day-num">'+day+'</span>'+
      (dots?'<span class="cal-dots">'+dots+'</span>':'')+
    '</button>';
  }
  document.getElementById('cal-grid').innerHTML=html;
}
function calShowDay(day){
  const events=calAllEvents(calYear).filter(e=>e.date.getFullYear()===calYear&&e.date.getMonth()===calMonth&&e.date.getDate()===day).sort((a,b)=>a.date-b.date);
  const box=document.getElementById('cal-day-detail');
  if(!events.length){box.innerHTML='';return;}
  const en=currentLang==='en';
  const n=calDaysUntil(new Date(calYear,calMonth,day));
  box.innerHTML='<div class="cal-detail-head">'+day+' '+document.getElementById('cal-month-label').textContent+' · <span style="color:var(--text-muted);font-size:.7rem">'+calWhenLabel(n)+'</span></div>'+
    events.map(e=>{
      let extra='';
      if(e.type==='renew'&&e.amount)extra='<span class="cal-detail-amount">'+fmtMoney(parseFloat(e.amount)||0)+(e.cycle==='yearly'?(en?'/yr':'/ano'):(en?'/mo':'/mês'))+'</span>';
      return '<div class="cal-detail-item">'+
        '<span class="cal-detail-ic">'+(CAL_ICON[e.type]||'•')+'</span>'+
        '<span class="cal-detail-main"><span class="cal-detail-label">'+esc(e.label)+'</span><span class="cal-detail-type">'+calTypeLabel(e.type)+'</span></span>'+
        extra+
      '</div>';
    }).join('');
}
// Lista dos próximos eventos (a partir de hoje)
function exportCalendarIcs(){
  const en=currentLang==='en';
  const today=new Date();today.setHours(0,0,0,0);
  const y=today.getFullYear();
  let all=calAllEvents(y).concat(calAllEvents(y+1));
  all=all.filter(e=>{const d=new Date(e.date);d.setHours(0,0,0,0);return d>=today&&e.type!=='holiday';});
  if(!all.length){toast(en?'No events to export.':'Não há eventos para exportar.');return;}
  const pad=n=>String(n).padStart(2,'0');
  const fmtD=d=>d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());
  const stamp=new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const esc2=s=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const typeTxt={renew:en?'Renewal':'Renovação',doc:en?'Document expiry':'Validade de documento',card:en?'Card expiry':'Validade de cartão',warranty:en?'Warranty':'Garantia',license:en?'License':'Licença',vehicle:en?'Vehicle':'Veículo',date:en?'Important date':'Data importante'};
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aurora Vault//PT','CALSCALE:GREGORIAN','METHOD:PUBLISH',
           'X-WR-CALNAME:'+(en?'Aurora Vault':'Aurora Vault')];
  all.forEach((e,i)=>{
    const d=new Date(e.date);const nx=new Date(d);nx.setDate(nx.getDate()+1);
    let title=(CAL_ICON[e.type]||'')+' '+e.label;
    if(e.type==='renew'&&e.amount)title+=' — '+fmtMoney(parseFloat(e.amount)||0);
    L.push('BEGIN:VEVENT');
    L.push('UID:av-'+fmtD(d)+'-'+i+'@auroravault');
    L.push('DTSTAMP:'+stamp);
    L.push('DTSTART;VALUE=DATE:'+fmtD(d));
    L.push('DTEND;VALUE=DATE:'+fmtD(nx));
    L.push('SUMMARY:'+esc2(title));
    L.push('DESCRIPTION:'+esc2((typeTxt[e.type]||'')+' — Aurora Vault'));
    L.push('TRANSP:TRANSPARENT');
    L.push('BEGIN:VALARM','TRIGGER:-P2D','ACTION:DISPLAY','DESCRIPTION:'+esc2(title),'END:VALARM');
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  const blob=new Blob([L.join('\r\n')],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='aurora-vault-'+fmtD(today)+'.ics';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  toast(en?`${all.length} events exported.`:`${all.length} eventos exportados.`);
}
// ══ NOTIFICAÇÕES DE VALIDADES/RENOVAÇÕES ══
let notifsOn=false;try{notifsOn=localStorage.getItem('av_notifs')==='1';}catch(e){}   // sem try, armazenamento bloqueado parava o script todo
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
async function toggleNotifs(){
  const en=currentLang==='en';
  if(notifsOn){notifsOn=false;lsSet('av_notifs','0');renderNotifBtn();toast(en?'Notifications off.':'Notificações desligadas.');return;}
  if(!('Notification' in window)){toast(en?'Not supported on this device.':'Não suportado neste dispositivo.');return;}
  let p=Notification.permission;
  if(p!=='granted')p=await Notification.requestPermission();
  if(p!=='granted'){toast(en?'Permission denied.':'Permissão negada.');return;}
  notifsOn=true;lsSet('av_notifs','1');renderNotifBtn();
  toast(en?'Notifications on.':'Notificações ligadas.');
  checkNotifs();
}
function renderNotifBtn(){
  const el=document.getElementById('notif-state');if(!el)return;
  const en=currentLang==='en';
  el.textContent=notifsOn?(en?'On':'Ligadas'):(en?'Off':'Desligadas');
  el.style.color=notifsOn?'var(--green)':'var(--text-muted)';
}
function checkNotifs(){
  if(!notifsOn||!('Notification' in window)||Notification.permission!=='granted')return;
  if(typeof calAllEvents!=='function')return;
  const en=currentLang==='en';
  const today=new Date();today.setHours(0,0,0,0);
  const y=today.getFullYear();
  let all=[];
  try{all=calAllEvents(y).concat(calAllEvents(y+1));}catch(e){return;}
  let seen={};try{seen=JSON.parse(localStorage.getItem('av_notif_seen')||'{}')||{};}catch(e){}
  const todayKey=today.toISOString().slice(0,10);
  // esquece avisos com mais de 60 dias (antes o registo crescia para sempre)
  const oldest=new Date(today.getTime()-60*86400000).toISOString().slice(0,10);
  Object.keys(seen).forEach(k=>{if(!(seen[k]>=oldest))delete seen[k];});
  let sent=0;
  all.forEach(e=>{
    if(e.type==='holiday')return;
    const d=new Date(e.date);d.setHours(0,0,0,0);
    const days=Math.round((d-today)/86400000);
    if(days<0||days>30)return;
    // avisa a 30, 7, 2 e 0 dias
    if(![30,7,2,0].includes(days))return;
    const key=e.type+'|'+e.label+'|'+d.toISOString().slice(0,10)+'|'+days;
    if(seen[key]===todayKey)return;
    if(sent>=3)return;
    const when=days===0?(en?'today':'hoje'):days===1?(en?'tomorrow':'amanhã'):(en?`in ${days} days`:`em ${days} dias`);
    const typeTxt=calTypeLabel(e.type);   // antes, garantias/licenças/veículos/datas apareciam como «Validade de cartão»
    const title='Aurora Vault — '+typeTxt,opts={body:e.label+' · '+when,icon:'icon-192.png',tag:key};
    try{new Notification(title,opts);}
    catch(err){   // Android: o construtor não existe, só via service worker
      if(!(navigator.serviceWorker&&navigator.serviceWorker.controller))return;
      navigator.serviceWorker.ready.then(r=>r.showNotification(title,opts)).catch(()=>{});
    }
    seen[key]=todayKey;sent++;
  });
  lsSet('av_notif_seen',JSON.stringify(seen));
}
function renderUpcoming(){
  const box=document.getElementById('cal-upcoming');if(!box)return;
  const en=currentLang==='en';
  const today=new Date();today.setHours(0,0,0,0);
  const y=today.getFullYear();
  let all=calAllEvents(y).concat(calAllEvents(y+1));
  all=all.filter(e=>{const d=new Date(e.date);d.setHours(0,0,0,0);return d>=today;}).sort((a,b)=>a.date-b.date).slice(0,6);
  const months=en?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  let inner='<div class="cal-up-title">'+(en?'Upcoming':'Próximos eventos')+'</div>';
  if(!all.length){inner+='<div style="font-size:.7rem;color:var(--text-muted)">'+(en?'Nothing coming up.':'Nada à vista.')+'</div>';}
  else inner+=all.map(e=>{
    const d=new Date(e.date);const n=calDaysUntil(d);
    let extra='';
    if(e.type==='renew'&&e.amount)extra='<span class="cal-detail-amount">'+fmtMoney(parseFloat(e.amount)||0)+'</span>';
    return '<div class="cal-up-item">'+
      '<span class="cal-up-date"><span class="cal-up-day">'+d.getDate()+'</span><span class="cal-up-mon">'+months[d.getMonth()]+'</span></span>'+
      '<span class="cal-detail-ic">'+(CAL_ICON[e.type]||'•')+'</span>'+
      '<span class="cal-detail-main"><span class="cal-detail-label">'+esc(e.label)+'</span><span class="cal-detail-type">'+calTypeLabel(e.type)+' · '+calWhenLabel(n)+'</span></span>'+
      extra+
    '</div>';
  }).join('');
  box.innerHTML=inner;
}
function renderMonthlyReport(){
  const el=document.getElementById('dash-report');
  if(!el)return;
  const en=currentLang==='en';
  const now=Date.now();
  const monthAgo=now-30*86400000;
  const active=vault.filter(e=>!e.archived);
  // Contagens do último mês a partir do registo de atividade
  const recent=(activityLog||[]).filter(a=>a.ts>=monthAgo);
  const added=recent.filter(a=>a.action==='add').length;
  const edited=recent.filter(a=>a.action==='edit').length;
  // Contas criadas no último mês
  const newAccounts=active.filter(e=>e.createdAt&&e.createdAt>=monthAgo).length;
  // Passwords alteradas no último mês
  const pwChanged=active.filter(e=>e.pwUpdated&&e.pwUpdated>=monthAgo).length;
  // Revistas no último mês
  const reviewed=active.filter(e=>e.reviewedAt&&e.reviewedAt>=monthAgo).length;
  // Pontuação de segurança atual
  const score=calcSecurityScore();
  const monthName=new Date().toLocaleDateString(en?'en-US':'pt-PT',{month:'long'});
  const stats=[
    {icon:'➕',n:newAccounts,label:en?'new accounts':'contas novas'},
    {icon:'✏️',n:edited,label:en?'entries edited':'entradas editadas'},
    {icon:'🔑',n:pwChanged,label:en?'passwords changed':'passwords alteradas'},
    {icon:'✅',n:reviewed,label:en?'accounts reviewed':'contas revistas'},
  ];
  let msg='';
  if(newAccounts+edited+pwChanged+reviewed===0){
    msg=en?'Quiet month — no changes yet. 😌':'Mês tranquilo — ainda sem alterações. 😌';
  }else if(score>=80){
    msg=en?'Great work keeping things secure! 🎉':'Bom trabalho a manter tudo seguro! 🎉';
  }else if(pwChanged>0||reviewed>0){
    msg=en?'Nice progress this month. Keep it up! 💪':'Bom progresso este mês. Continua! 💪';
  }else{
    msg=en?'Tip: review a weak password to boost your score. 🔒':'Dica: revê uma password fraca para subir a pontuação. 🔒';
  }
  el.innerHTML=`
    <div class="report-head">
      <span class="report-month">${monthName.charAt(0).toUpperCase()+monthName.slice(1)}</span>
      <span class="report-score">${en?'Security':'Segurança'}: <b>${score}%</b></span>
    </div>
    <div class="report-stats">
      ${stats.map(s=>`<div class="report-stat"><span class="report-stat-icon">${s.icon}</span><span class="report-stat-n">${s.n}</span><span class="report-stat-label">${s.label}</span></div>`).join('')}
    </div>
    <div class="report-msg">${msg}</div>`;
}
function logActivity(action, name, icon='📝'){
  activityLog.unshift({action, name, icon, ts:Date.now()});
  if(activityLog.length>50)activityLog=activityLog.slice(0,50);
}
function timeAgo(ts){
  const diff=Date.now()-ts;
  const mins=Math.floor(diff/60000);
  const hours=Math.floor(diff/3600000);
  const days=Math.floor(diff/86400000);
  if(mins<1)return currentLang==='en'?'just now':'agora mesmo';
  if(mins<60)return currentLang==='en'?`${mins}m ago`:`há ${mins}m`;
  if(hours<24)return currentLang==='en'?`${hours}h ago`:`há ${hours}h`;
  if(days===1)return currentLang==='en'?'yesterday':'ontem';
  if(days<7)return currentLang==='en'?`${days} days ago`:`há ${days} dias`;
  return new Date(ts).toLocaleDateString();
}

// ══ USERNAME GENERATOR ══
function generateUsername(){
  const adj=['swift','brave','calm','dark','wise','bold','cool','iron','neo','ace','max','sky','red','blue'];
  const noun=['wolf','hawk','fox','bear','lynx','raven','tiger','shark','eagle','dragon','pixel','echo','nova','cyber'];
  const a=adj[Math.floor(Math.random()*adj.length)];
  const n=noun[Math.floor(Math.random()*noun.length)];
  const num=Math.floor(Math.random()*9000)+1000;
  document.getElementById('f-user').value=`${a}_${n}${num}`;
}

// ══ GO TO SITE ══
// Endereço seguro para abrir: sem esquema → https://; bloqueia javascript:, data:, etc.
function siteHref(u){
  u=String(u||'').trim();if(!u)return '';
  const m=u.match(/^([a-z][a-z0-9+.-]*):(\/\/)?/i);
  const isScheme=m&&(m[2]||/^(mailto|tel|sms|javascript|data|vbscript|blob|file|about)$/i.test(m[1]));
  if(!isScheme)return 'https://'+u.replace(/^\/+/,'');
  return /^(javascript|data|vbscript|blob|file|about)$/i.test(m[1])?'':u;
}
// «noopener»: o site aberto deixa de poder redirecionar este separador (reverse tabnabbing).
// A password copiada passa a ser apagada da área de transferência ao fim de 30 s, como nos outros botões.
function goToSite(){
  const url=document.getElementById('f-url').value.trim();
  if(!url){toast(currentLang==='en'?'Enter a URL first!':'Insere um URL primeiro!');return;}
  goToSiteEntry(url,document.getElementById('f-pw').value);
}
function goToSiteEntry(url,pw){
  if(pw)copyText(pw,t('pwCopied'));
  const h=siteHref(url);if(h)window.open(h,'_blank','noopener');
}
function toggleFav(id){const e=vault.find(v=>v.id===id);if(e){e.fav=!e.fav;renderCards();renderSidebar();renderDashboard();markUnsaved();}}
function toggleReviewed(id){
  const e=vault.find(v=>v.id===id);
  if(e){
    e.reviewedAt=e.reviewedAt?null:Date.now();
    renderCards();markUnsaved();
    toast(e.reviewedAt?(currentLang==='en'?'✅ Marked as reviewed':'✅ Marcada como revista'):(currentLang==='en'?'Review mark removed':'Marca de revisão removida'));
  }
}
function reviewedLabel(ts){
  if(!ts)return '';
  const days=Math.floor((Date.now()-ts)/86400000);
  const en=currentLang==='en';
  if(days===0)return en?'Reviewed today':'Revista hoje';
  if(days===1)return en?'Reviewed yesterday':'Revista ontem';
  if(days<30)return en?`Reviewed ${days} days ago`:`Revista há ${days} dias`;
  const months=Math.floor(days/30);
  if(months<12)return en?`Reviewed ${months} month${months>1?'s':''} ago`:`Revista há ${months} ${months>1?'meses':'mês'}`;
  const years=Math.floor(days/365);
  return en?`Reviewed ${years} year${years>1?'s':''} ago`:`Revista há ${years} ano${years>1?'s':''}`;
}
function archiveEntry(id){const e=vault.find(v=>v.id===id);if(e){logActivity('archive',e.name,'📦');e.archived=true;renderAll();toast(t('toastArchived'));markUnsaved();}}
let clipboardTimerInterval=null,clipClearAt=0,clipClearPending=false;
// Tudo o que sai do cofre é sensível (passwords, cartões, CVV, códigos 2FA, chaves): apaga-se sempre ao fim de 30 s
function copyText(text,msg){
  navigator.clipboard.writeText(text).then(()=>{
    toast(msg);
    startClipboardTimer();
  }).catch(()=>toast(currentLang==='en'?'Could not copy — try again.':'Não foi possível copiar — tenta outra vez.'));
}
// Com a app em segundo plano o browser recusa mexer na área de transferência: fica pendente e apaga-se ao voltar
function clipClearNow(){
  return navigator.clipboard.writeText('').then(()=>{clipClearPending=false;clipClearAt=0;},()=>{clipClearPending=true;});
}
function startClipboardTimer(){
  if(clipboardTimerInterval)clearInterval(clipboardTimerInterval);
  clipClearAt=Date.now()+30000;clipClearPending=false;
  const toastEl=document.getElementById('clipboard-toast');
  const timerEl=document.getElementById('clipboard-timer');
  const txtEl=document.getElementById('clipboard-toast-txt');
  txtEl.textContent=currentLang==='en'?'Copied — clears in':'Copiado — apaga em';
  const tick=()=>{
    const secs=Math.max(0,Math.ceil((clipClearAt-Date.now())/1000));timerEl.textContent=secs;
    if(secs<=0){
      clearInterval(clipboardTimerInterval);clipboardTimerInterval=null;
      toastEl.classList.remove('show');
      clipClearNow();
    }
  };
  toastEl.classList.add('show');tick();
  clipboardTimerInterval=setInterval(tick,1000);
}
{const retry=()=>{if(!document.hidden&&clipClearPending)clipClearNow();};
  document.addEventListener('visibilitychange',retry);window.addEventListener('focus',retry);}
// Exportar em texto simples (todas as passwords legíveis): aviso + confirmar identidade
async function avPlainExportOk(kind){
  const en=currentLang==='en';
  if(!confirm(en?`⚠️ The ${kind} file will contain ALL your passwords in plain text — anyone who opens it can read them.\n\nKeep it safe and delete it when you no longer need it. Continue?`
    :`⚠️ O ficheiro ${kind} vai ter TODAS as tuas passwords em texto simples — quem o abrir consegue lê-las.\n\nGuarda-o num sítio seguro e apaga-o quando já não precisares. Continuar?`))return false;
  return avAuth(en?`Export passwords to ${kind}`:`Exportar passwords para ${kind}`);
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

// ══ ARCHIVE ══
function renderArchive(){
  const grid=document.getElementById('archive-grid');
  const en=currentLang==='en';
  const aVault=vault.filter(e=>e.archived);
  const aDocs=documents.filter(d=>d.archived);
  const aCards=bankCards.filter(cd=>cd.archived);
  const aNotes=notes.filter(n=>n.archived);
  const total=aVault.length+aDocs.length+aCards.length+aNotes.length;
  if(!total){grid.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg><p>${t('emptyArchive')}</p></div>`;return;}
  const restoreSvg='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>';
  const delSvg='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>';
  let html='';
  const section=(icon,label,count,cardsHtml)=>`
    <div class="archive-section">
      <div class="archive-section-head"><span>${icon} ${label}</span><span class="archive-count">${count}</span></div>
      <div class="archive-section-grid">${cardsHtml}</div>
    </div>`;
  // Contas / passwords
  if(aVault.length){
    const cards=aVault.map(e=>`
      <div class="entry-card" style="opacity:.85" id="arc-${e.id}">
        <div class="card-top"><span class="card-cat-badge" style="background:${vaultCatInfo(e.cat).color}26;color:${vaultCatInfo(e.cat).color}">${vaultCatInfo(e.cat).icon} ${esc(vaultCatInfo(e.cat).label)}</span></div>
        <div class="card-name">${esc(e.name)}</div>
        ${e.user?`<div class="card-field"><span class="card-field-label">${t('cardUser')}</span><div class="card-field-inner"><span class="card-field-value">${esc(e.user)}</span></div></div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreEntry" data-arg="${esc(e.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteEntry" data-arg="${esc(e.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('🔐',en?'Accounts / passwords':'Contas / palavras-passe',aVault.length,cards);
  }
  // Documentos
  if(aDocs.length){
    const cards=aDocs.map(d=>`
      <div class="entry-card" style="opacity:.85">
        <div class="card-name">${d.icon||'📄'} ${esc(d.title||'')}</div>
        ${d.expiry?`<div class="card-field"><span class="card-field-label">${en?'Expiry':'Validade'}</span><div class="card-field-inner"><span class="card-field-value">${esc(d.expiry)}</span></div></div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreDoc" data-arg="${esc(d.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteDoc" data-arg="${esc(d.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('📁',en?'Documents':'Documentos',aDocs.length,cards);
  }
  // Cartões
  if(aCards.length){
    const cards=aCards.map(cd=>`
      <div class="entry-card" style="opacity:.85">
        <div class="card-name">💳 ${esc(cd.name||cd.bank||'')}</div>
        ${cd.expiry?`<div class="card-field"><span class="card-field-label">${en?'Valid thru':'Validade'}</span><div class="card-field-inner"><span class="card-field-value">${esc(cd.expiry)}</span></div></div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreCard" data-arg="${esc(cd.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteCard" data-arg="${esc(cd.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('💳',en?'Bank cards':'Cartões bancários',aCards.length,cards);
  }
  // Notas
  if(aNotes.length){
    const cards=aNotes.map(n=>`
      <div class="entry-card" style="opacity:.85">
        <div class="card-name">📝 ${esc(n.title||(en?'Untitled note':'Nota sem título'))}</div>
        ${n.body?`<div style="font-size:.62rem;color:var(--text-muted);padding:6px 2px;line-height:1.5">${esc(n.body.slice(0,60))}${n.body.length>60?'…':''}</div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreNote" data-arg="${esc(n.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteNoteById" data-arg="${esc(n.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('📝',en?'Notes':'Notas',aNotes.length,cards);
  }
  grid.innerHTML=html;
}
function deleteNoteById(id){
  const en=currentLang==='en';
  if(!confirm(en?'Move this note to the recycle bin?':'Mover esta nota para a reciclagem?'))return;
  const n=notes.find(x=>x.id===id);
  if(n){logActivity('delete',n.title||'Nota','🗑️');trash.unshift({type:'note',data:n,deletedAt:Date.now()});}
  notes=notes.filter(x=>x.id!==id);
  renderAll();toast(en?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}
function restoreEntry(id){const e=vault.find(v=>v.id===id);if(e){logActivity('restore',e.name,'♻️');delete e.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}
function archiveDoc(id){const d=documents.find(x=>x.id===id);if(d){logActivity('archive',d.title,'📦');d.archived=true;renderAll();toast(t('toastArchived'));markUnsaved();}}
function restoreDoc(id){const d=documents.find(x=>x.id===id);if(d){logActivity('restore',d.title,'♻️');delete d.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}
function archiveCard(id){const cd=bankCards.find(x=>x.id===id);if(cd){logActivity('archive',cd.name,'📦');cd.archived=true;renderAll();toast(t('toastArchived'));markUnsaved();}}
function restoreCard(id){const cd=bankCards.find(x=>x.id===id);if(cd){logActivity('restore',cd.name,'♻️');delete cd.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}
function archiveNote(id){const n=notes.find(x=>x.id===id);if(n){logActivity('archive',n.title||'Nota','📦');n.archived=true;if(editingNoteId===id){editingNoteId=null;hideNoteEditor();}renderAll();toast(t('toastArchived'));markUnsaved();}}
function archiveCurrentNote(){if(editingNoteId)archiveNote(editingNoteId);}
function restoreNote(id){const n=notes.find(x=>x.id===id);if(n){logActivity('restore',n.title||'Nota','♻️');delete n.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}

// ══ ENTRY MODAL ══
function openModal(id=null){
  editingId=id;entryTags=[];entryAttachment=null;entryAttachments=[];entryEmoji='⭐';
  document.getElementById('modal-title').textContent=id?t('modalEdit'):t('modalNew');
  populateCatSelect();
  if(id){
    const e=vault.find(v=>v.id===id);
    document.getElementById('f-name').value=e.name||'';document.getElementById('f-cat').value=e.cat||'outro';
    document.getElementById('f-user').value=e.user||'';document.getElementById('f-pw').value=e.pw||'';
    document.getElementById('f-url').value=e.url||'';document.getElementById('f-notes').value=e.notes||'';
    entryTags=[...(e.tags||[])];entryAttachment=e.attachment||null;entryAttachments=normalizeAttachments(e);
    entryFields=(e.fields||[]).map(f=>({k:f.k||'',v:f.v||''}));
    populateEntryFolderSelect(e.folderId||'');
    const wf=document.getElementById('f-wifi');if(wf)wf.checked=isWifiEntry(e);
    entryEmoji=e.icon||'⭐';
    selectedFlag=e.flag||'';
  }else{
    ['f-name','f-user','f-pw','f-url','f-notes'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('f-cat').value='email';
    selectedFlag='';
    populateEntryFolderSelect(currentVaultFolderId||'');
    const wf2=document.getElementById('f-wifi');if(wf2)wf2.checked=false;
    entryFields=[];
  }
  document.getElementById('f-icon-preview').textContent=entryEmoji;
  document.getElementById('emoji-picker-wrap').style.display='none';
  renderTagPills();renderFieldRows();renderAttachList('entry');renderFlagPicker();
  checkPwStrength();checkDuplicate();
  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('f-name').focus(),100);
}
function editEntry(id){openModal(id);}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');editingId=null;entryTags=[];entryAttachments=[];entryAttachment=null;entryFields=[];}
function saveEntry(){
  const name=document.getElementById('f-name').value.trim();
  if(!name){alert(t('nameRequired'));return;}
  const pw=document.getElementById('f-pw').value;
  const existing=editingId?vault.find(v=>v.id===editingId):null;
  const wasEditing=!!existing;
  const pwChanged=!existing||existing.pw!==pw;
  const entry={
    ...(existing||{}),attachment:undefined,
    id:editingId||Date.now().toString(36),name,cat:document.getElementById('f-cat').value,
    user:document.getElementById('f-user').value.trim(),pw,url:document.getElementById('f-url').value.trim(),
    notes:document.getElementById('f-notes').value.trim(),tags:[...entryTags],flag:selectedFlag||'',
    fields:entryFields.map(f=>({k:f.k.trim(),v:f.v.trim()})).filter(f=>f.k||f.v),
    folderId:(document.getElementById('entry-folder')?.value||'')||null,
    isWifi:!!document.getElementById('f-wifi')?.checked,
    attachments:entryAttachments,fav:existing?existing.fav:false,archived:false,icon:entryEmoji,
    createdAt:existing?existing.createdAt:Date.now(),order:existing?existing.order:vault.length,
    pwUpdated:pwChanged?Date.now():(existing?existing.pwUpdated:Date.now()),
    pwHistory:pwChanged&&existing?([existing.pw,...(existing.pwHistory||[])].filter(Boolean).slice(0,3)):(existing?existing.pwHistory||[]:null),
    reviewedAt:existing?existing.reviewedAt||null:null,
  };
  const idx=wasEditing?vault.indexOf(existing):-1;
  if(idx>=0)vault[idx]=entry;else vault.push(entry);
  logActivity(wasEditing?'edit':'add', name, entryEmoji||'📝');
  closeModal();renderAll();toast(wasEditing?t('toastUpdated'):t('toastAdded'));markUnsaved();
}
function deleteEntry(id){
  if(!confirm(currentLang==='en'?'Move this entry to the recycle bin?':'Mover esta entrada para a reciclagem?'))return;
  const e=vault.find(v=>v.id===id);
  if(e){logActivity('delete',e.name,'🗑️');trash.unshift({type:'vault',data:e,deletedAt:Date.now()});}
  vault=vault.filter(v=>v.id!==id);renderAll();
  toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}

// ══ TAGS ══
function renderTagPills(){
  const pillsEl=document.getElementById('tag-pills');
  if(!pillsEl)return;
  pillsEl.innerHTML=entryTags.map(tag=>
    `<span class="tag-pill">${esc(tag)}<button type="button" data-act="removeTag" data-arg="${esc(tag)}">✕</button></span>`
  ).join('');
}
function handleTagKey(e){
  if(e.key==='Enter'||e.key===','){
    e.preventDefault();
    const val=e.target.value.trim().replace(/,/g,'');
    if(val&&!entryTags.includes(val)){entryTags.push(val);renderTagPills();}
    e.target.value='';
  }
}
function removeTag(tag){entryTags=entryTags.filter(t2=>t2!==tag);renderTagPills();}

// ══ ATTACHMENT ══
// ══ ANEXOS (múltiplos, imagens + PDF) ══
// Cada anexo: {id,name,type,size,data}
function fmtSize(b){
  if(!b&&b!==0)return '';
  if(b<1024)return b+' B';
  if(b<1048576)return (b/1024).toFixed(0)+' KB';
  return (b/1048576).toFixed(1)+' MB';
}
function attachListOf(ctx){return ctx==='asset'?assetAttachments:entryAttachments;}
function setAttachList(ctx,arr){if(ctx==='asset')assetAttachments=arr;else entryAttachments=arr;}
// Converte formato antigo (1 imagem em .attachment) para o novo
function normalizeAttachments(o){
  if(o&&Array.isArray(o.attachments))return o.attachments.slice();
  if(o&&o.attachment)return [{id:'old',name:'anexo.jpg',type:'image/jpeg',size:0,data:o.attachment}];
  return [];
}
function compressImage(file,cb){
  const rd=new FileReader();
  rd.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const MAX=1600;let w=img.width,h=img.height;
        if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r);}
        const cv=document.createElement('canvas');cv.width=w;cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        cb(cv.toDataURL('image/jpeg',0.82));
      }catch(err){cb(e.target.result);}
    };
    img.onerror=()=>cb(e.target.result);
    img.src=e.target.result;
  };
  rd.readAsDataURL(file);
}
function handleAttachment(ev,ctx){
  ctx=ctx||'entry';
  const en=currentLang==='en';
  const files=Array.from(ev.target.files||[]);
  if(!files.length)return;
  const MAXF=8*1024*1024;
  let pend=files.length;
  files.forEach(file=>{
    if(file.size>MAXF){
      toast(en?('Too big (max 8 MB): '+file.name):('Demasiado grande (máx 8 MB): '+file.name));
      if(--pend===0)renderAttachList(ctx);
      return;
    }
    const done=data=>{
      const list=attachListOf(ctx);
      list.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),
                 name:file.name,type:file.type||'application/octet-stream',
                 size:Math.round((data.length||0)*0.75),data});
      if(--pend===0)renderAttachList(ctx);
    };
    if(file.type&&file.type.startsWith('image/'))compressImage(file,done);
    else{const rd=new FileReader();rd.onload=e=>done(e.target.result);rd.onerror=()=>{if(--pend===0)renderAttachList(ctx);};rd.readAsDataURL(file);}
  });
  ev.target.value='';
}
function attachIcon(t){
  if(!t)return '📎';
  if(t.startsWith('image/'))return '🖼️';
  if(t==='application/pdf')return '📕';
  return '📎';
}
function renderAttachList(ctx){
  ctx=ctx||'entry';
  const box=document.getElementById(ctx==='asset'?'asset-attach-list':'attach-list');
  if(!box)return;
  const en=currentLang==='en';
  const list=attachListOf(ctx);
  if(!list.length){box.innerHTML='';return;}
  const total=list.reduce((s,a)=>s+(a.size||0),0);
  box.innerHTML=list.map((a,i)=>
    '<div class="att-row">'+
      '<span class="att-ic">'+attachIcon(a.type)+'</span>'+
      '<span class="att-name" title="'+esc(a.name)+'">'+esc(a.name)+'</span>'+
      '<span class="att-size">'+fmtSize(a.size)+'</span>'+
      '<button type="button" class="att-btn" data-act="openAttachment" data-args="['+esc(JSON.stringify(ctx))+','+(i)+']">'+(en?'Open':'Abrir')+'</button>'+
      '<button type="button" class="att-btn danger" data-act="removeAttachment" data-args="['+esc(JSON.stringify(ctx))+','+(i)+']">✕</button>'+
    '</div>').join('')+
    '<div class="att-total">'+list.length+' '+(en?'file(s)':'ficheiro(s)')+' · '+fmtSize(total)+
    (total>3*1024*1024?' <span style="color:var(--accent-ink)">'+(en?'— heavy, the vault file grows':'— pesado, o ficheiro do cofre cresce')+'</span>':'')+'</div>';
}
// Só tipos inofensivos abrem no browser; o resto (HTML, SVG…) é descarregado. Um blob abre com a origem da app:
// um anexo HTML/SVG (ex.: vindo de um ficheiro partilhado) corria código com acesso ao cofre aberto.
const ATT_VIEW_OK=/^(image\/(png|jpe?g|gif|webp|bmp|avif)|application\/pdf|text\/plain)$/i;
function openAttachData(a){
  if(!a||typeof a.data!=='string')return;
  try{
    const parts=a.data.split(',');
    const bin=atob(parts[1]);
    const arr=new Uint8Array(bin.length);
    for(let k=0;k<bin.length;k++)arr[k]=bin.charCodeAt(k);
    const viewable=ATT_VIEW_OK.test(a.type||'');
    const blob=new Blob([arr],{type:viewable?a.type:'application/octet-stream'});
    if(!viewable){downloadBlob(blob,a.name||'anexo');return;}
    const url=URL.createObjectURL(blob);
    const w=window.open(url,'_blank');if(w)try{w.opener=null;}catch(e){}
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){
    if(!/^data:image\//i.test(a.data))return;
    const w=window.open();if(w){try{w.opener=null;}catch(_){}w.document.write('<img src="'+esc(a.data)+'" style="max-width:100%">');}
  }
}
function openAttachment(ctx,i){openAttachData(attachListOf(ctx)[i]);}
function openAttachmentBy(kind,id,i){
  const o=kind==='asset'?(assets||[]).find(x=>x.id===id):(vault||[]).find(x=>x.id===id);
  if(!o)return;
  openAttachData(normalizeAttachments(o)[i]);
}
function attachChips(o,kind){
  const list=normalizeAttachments(o);
  if(!list.length)return '';
  return '<div class="att-chips">'+list.map((a,i)=>
    '<button class="att-chip" data-act="openAttachmentBy" data-arg="'+esc(kind)+'" data-arg2="'+esc(o.id)+'" data-arg3="'+i+'" title="'+esc(a.name||'')+'">'+
    attachIcon(a.type)+' <span>'+esc(a.name||'')+'</span></button>').join('')+'</div>';
}
function removeAttachment(ctx,i){
  ctx=ctx||'entry';
  const list=attachListOf(ctx);
  if(typeof i!=='number'){setAttachList(ctx,[]);renderAttachList(ctx);return;}
  list.splice(i,1);renderAttachList(ctx);
}


// ══ PW STRENGTH ══
function checkPwStrength(){
  const pw=document.getElementById('f-pw').value,score=getPwScore(pw);
  const bar=document.getElementById('pw-strength-bar'),lbl=document.getElementById('pw-strength-label');
  if(!pw){bar.style.width='0';lbl.textContent='';return;}
  if(isCommonPassword(pw)){
    bar.style.width='10%';bar.style.background='#e05252';
    lbl.textContent=currentLang==='en'?'🚨 Very common password!':'🚨 Password muito comum!';
    lbl.style.color='#e05252';return;
  }
  const lvls=[{w:'15%',c:'#e05252',k:'pwVeryWeak'},{w:'30%',c:'#e08852',k:'pwWeak'},{w:'55%',c:'#e0c852',k:'pwMedium'},{w:'80%',c:'#82c852',k:'pwGood'},{w:'100%',c:'#4caf82',k:'pwStrong'}];
  const lvl=lvls[Math.min(score,4)];bar.style.width=lvl.w;bar.style.background=lvl.c;lbl.textContent=t(lvl.k);lbl.style.color=lvl.c;
}
function goToEntry(id){
  const e=vault.find(v=>v.id===id);
  if(!e)return;
  if(e.archived){delete e.archived;markUnsaved();}
  currentVaultFolderId=e.folderId||null;
  switchTab('vault');
  setTimeout(()=>{
    avFlushChunks();
    const card=document.getElementById('card-'+id);
    if(card){
      card.scrollIntoView({behavior:'smooth',block:'center'});
      card.classList.add('entry-flash');
      setTimeout(()=>card.classList.remove('entry-flash'),1600);
    }
  },200);
}
let exportSelection=new Set();
function openSelectiveExport(){
  const en=currentLang==='en';
  exportSelection=new Set();
  document.getElementById('export-title').textContent=en?'📤 Share selected entries':'📤 Partilhar entradas selecionadas';
  document.getElementById('export-intro').textContent=en
    ?'Pick the entries to include. They are exported as their own encrypted .vault file with a password you choose — perfect for handing a few accounts to family without sharing everything.'
    :'Escolhe as entradas a incluir. Serão exportadas como um ficheiro .vault encriptado próprio, com uma palavra-passe à tua escolha — ideal para dar algumas contas à família sem partilhar tudo.';
  document.getElementById('export-all-btn').textContent=en?'Select all':'Selecionar todas';
  document.getElementById('export-none-btn').textContent=en?'Clear':'Limpar';
  document.getElementById('export-pw-lbl').textContent=en?'Password for the exported file':'Palavra-passe para o ficheiro exportado';
  document.getElementById('export-pw-hint').textContent=en?'Whoever receives the file needs this password to open it. Choose a strong one and share it separately.':'Quem receber o ficheiro precisa desta palavra-passe para o abrir. Escolhe uma forte e partilha-a à parte.';
  document.getElementById('export-close-btn').textContent=en?'Close':'Fechar';
  document.getElementById('export-pw').value='';
  document.getElementById('export-err').textContent='';
  renderExportList();
  updateExportCount();
  document.getElementById('export-overlay').classList.add('open');
}
function closeSelectiveExport(){document.getElementById('export-overlay').classList.remove('open');}
function renderExportList(){
  const en=currentLang==='en';
  const items=vault.filter(e=>!e.archived).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const el=document.getElementById('export-list');
  if(!items.length){el.innerHTML=`<div style="font-size:.72rem;color:var(--text-muted);text-align:center;padding:16px">${en?'No entries to export.':'Sem entradas para exportar.'}</div>`;return;}
  el.innerHTML=items.map(e=>{
    const ci=vaultCatInfo(e.cat);
    const on=exportSelection.has(e.id);
    return `<label class="export-row ${on?'on':''}">
      <input type="checkbox" ${on?'checked':''} data-change="toggleExportEntry" data-arg="${esc(e.id)}" style="accent-color:var(--accent);width:16px;height:16px;flex-shrink:0">
      <span style="flex-shrink:0">${ci.icon}</span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name||'')}</span>
      <span style="font-size:.6rem;color:var(--text-muted);white-space:nowrap">${esc(e.user||'')}</span>
    </label>`;
  }).join('');
}
function toggleExportEntry(id){
  if(exportSelection.has(id))exportSelection.delete(id);else exportSelection.add(id);
  const items=vault.filter(e=>!e.archived);
  renderExportList();updateExportCount();
}
function exportSelectAll(all){
  exportSelection=new Set(all?vault.filter(e=>!e.archived).map(e=>e.id):[]);
  renderExportList();updateExportCount();
}
function updateExportCount(){
  const el=document.getElementById('export-count');
  if(el)el.textContent=exportSelection.size;
}
async function doSelectiveExport(){
  const en=currentLang==='en';
  const err=document.getElementById('export-err');
  const pw=document.getElementById('export-pw').value;
  if(!exportSelection.size){err.textContent=en?'Select at least one entry.':'Seleciona pelo menos uma entrada.';return;}
  if(pw.length<4){err.textContent=en?'Choose a password (4+ characters).':'Escolhe uma palavra-passe (4+ caracteres).';return;}
  err.textContent='';
  const chosen=vault.filter(e=>exportSelection.has(e.id)).map(e=>{
    const{id,name,cat,user,pw,url,notes,tags,fields,icon}=e;
    return{id,name,cat,user,pw,url,notes,tags,fields,icon,fav:false,archived:false,createdAt:Date.now(),order:0};
  });
  try{
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const key=await deriveKey(pw,salt,KDF_ITER);
    // Mini-cofre: só entradas escolhidas, mesmo formato do .vault normal
    const payloadObj={fmt:VAULT_FMT,vault:chosen,notes:[],bankCards:[],activityLog:[],documents:[],trash:[],customCats:[],docFolders:[],vaultFolders:[],wifiNets:[],legacyNote:'',legacyOwner:'',totp:[]};
    const payload=await encrypt(key,payloadObj);
    const container=mkContainer({salt,iter:KDF_ITER},payload);
    const d=new Date();const pad=n=>String(n).padStart(2,'0');
    const stamp=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    downloadVault(container,`ciphervault_partilha_${stamp}.vault`);
    toast(en?`Exported ${chosen.length} entries ✓`:`Exportadas ${chosen.length} entradas ✓`);
    closeSelectiveExport();
  }catch(e){
    err.textContent=en?'Export failed. Try again.':'A exportação falhou. Tenta de novo.';
  }
}
function findDuplicateEntries(){
  // Agrupa entradas ativas por (nome+utilizador) normalizado; devolve grupos com 2+
  const groups={};
  vault.filter(e=>!e.archived).forEach(e=>{
    const key=((e.name||'').trim().toLowerCase())+'|'+((e.user||'').trim().toLowerCase());
    if(!key.trim()||key==='|')return;
    (groups[key]=groups[key]||[]).push(e);
  });
  return Object.values(groups).filter(g=>g.length>1).map(g=>({name:g[0].name||'(sem nome)',user:g[0].user||'',entries:g}));
}
function openDedupeModal(){
  const en=currentLang==='en';
  const groups=findDuplicateEntries();
  if(!groups.length){toast(en?'No duplicates found.':'Sem duplicados.');return;}
  document.getElementById('dedupe-title').textContent=en?'👥 Duplicate entries':'👥 Entradas duplicadas';
  document.getElementById('dedupe-intro').textContent=en
    ?'These entries share the same name and username. Keep one of each and remove the extras (they go to the recycle bin).'
    :'Estas entradas têm o mesmo nome e utilizador. Mantém uma de cada e remove as repetidas (vão para a reciclagem).';
  document.getElementById('dedupe-close').textContent=en?'Close':'Fechar';
  renderDedupeList();
  document.getElementById('dedupe-overlay').classList.add('open');
}
function closeDedupeModal(){document.getElementById('dedupe-overlay').classList.remove('open');}
function renderDedupeList(){
  const en=currentLang==='en';
  const groups=findDuplicateEntries();
  const el=document.getElementById('dedupe-list');
  if(!groups.length){el.innerHTML=`<div style="font-size:.74rem;color:var(--text-muted);text-align:center;padding:16px">${en?'No duplicates left ✓':'Sem duplicados ✓'}</div>`;return;}
  el.innerHTML=groups.map(g=>{
    const rows=g.entries.map((e,i)=>{
      const cat=vaultCatInfo(e.cat);
      const when=e.pwUpdated?new Date(e.pwUpdated).toLocaleDateString(en?'en-GB':'pt-PT'):'—';
      return `<div class="dedupe-entry">
        <div style="flex:1;min-width:0">
          <div style="font-size:.78rem;color:var(--text)">${cat.icon} ${esc(e.name||'')} ${i===0?`<span style="color:var(--green);font-size:.6rem">· ${en?'keep':'manter'}</span>`:''}</div>
          <div style="font-size:.62rem;color:var(--text-muted);margin-top:2px">${esc(e.user||'—')} · ${en?'updated':'atualizada'} ${when}</div>
        </div>
        ${i>0?`<button class="snap-restore" style="border-color:var(--red);color:var(--red)" data-act="removeDuplicate" data-arg="${esc(e.id)}">${en?'Remove':'Remover'}</button>`:''}
      </div>`;
    }).join('');
    return `<div class="dedupe-group"><div class="dedupe-group-head">${esc(g.name)} — ${g.entries.length}×</div>${rows}</div>`;
  }).join('');
}
function removeDuplicate(id){
  const e=vault.find(v=>v.id===id);
  if(e){logActivity('delete',e.name,'🗑️');trash.unshift({type:'vault',data:e,deletedAt:Date.now()});vault=vault.filter(v=>v.id!==id);}
  markUnsaved();renderDedupeList();renderAll();
  toast(currentLang==='en'?'Duplicate removed':'Duplicado removido');
}
function checkDuplicate(){
  const pw=document.getElementById('f-pw').value,warn=document.getElementById('dup-warn');
  if(!pw){warn.classList.remove('show');return;}
  warn.classList.toggle('show',vault.filter(e=>!e.archived).some(e=>e.pw===pw&&e.id!==editingId));
}
// Índice aleatório uniforme em [0,n): rejeita os valores que dariam viés («byte % 70» favorecia os 46 primeiros caracteres)
function randIndex(n){const lim=Math.floor(0x100000000/n)*n,b=new Uint32Array(1);do{crypto.getRandomValues(b);}while(b[0]>=lim);return b[0]%n;}
function randomString(chars,len){let s='';for(let i=0;i<len;i++)s+=chars[randIndex(chars.length)];return s;}
function generatePw(){
  const pw=randomString('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',20);
  document.getElementById('f-pw').value=pw;checkPwStrength();checkDuplicate();
}

// ══ ADVANCED PW GEN ══
function openPwGen(){updatePwGen();document.getElementById('pwgen-overlay').classList.add('open');}
function closePwGen(){document.getElementById('pwgen-overlay').classList.remove('open');}
const PASSPHRASE_WORDS=['casa','gato','livro','porta','mesa','janela','flor','rio','ponte','monte','estrela','peixe','pao','vento','chuva','sol','lua','fogo','terra','mar','arvore','folha','pedra','ouro','prata','ferro','vidro','papel','tinta','musica','danca','festa','tempo','noite','manha','tarde','verde','azul','preto','branco','forte','rapido','lento','alto','baixo','grande','pequeno','doce','amargo','quente','frio','novo','velho','claro','escuro','leve','pesado','limpo','sujo','cheio','vazio','aberto','calmo','feliz','bravo','tigre','leao','aguia','lobo','urso','cavalo','coelho','raposa','coruja','falcao','golfinho','baleia','tubarao','abelha','formiga','aranha','borboleta','montanha','floresta','deserto','oceano','ilha','vale','planicie','caverna','vulcao','trovao','relampago','nuvem','neve','gelo','orvalho','bruma','aurora','cometa','planeta','galaxia','foguete','castelo','torre','muralha','espada','escudo','coroa','anel','joia','tesouro','mapa','bussola','ancora','vela','remo','farol','sino','tambor','flauta','guitarra','violino','piano','pincel','moldura','estatua'];
const PGMODE={m:'random'};
function setPwGenMode(mode){
  PGMODE.m=mode;
  document.getElementById('pgm-random').classList.toggle('active',mode==='random');
  document.getElementById('pgm-memorable').classList.toggle('active',mode==='memorable');
  document.getElementById('pgmode-random').style.display=mode==='random'?'block':'none';
  document.getElementById('pgmode-memorable').style.display=mode==='memorable'?'block':'none';
  updatePwGen();
}
function updatePwGen(){
  let pw='';
  if(PGMODE.m==='memorable'){
    const nWords=parseInt(document.getElementById('pgm-words').value);
    {const e=document.getElementById('pgm-words-val');if(e)e.textContent=nWords;}
    const cap=document.getElementById('pgm-cap').checked;
    const num=document.getElementById('pgm-num').checked;
    const words=[];
    for(let i=0;i<nWords;i++){
      let w=PASSPHRASE_WORDS[randIndex(PASSPHRASE_WORDS.length)];
      if(cap)w=w.charAt(0).toUpperCase()+w.slice(1);
      words.push(w);
    }
    pw=words.join('-');
    if(num)pw+='-'+(randIndex(90)+10);
  }else{
    const len=parseInt(document.getElementById('pwgen-len').value);
    {const e=document.getElementById('pwgen-len-val');if(e)e.textContent=len;}
    let chars='';
    if(document.getElementById('pg-upper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if(document.getElementById('pg-lower').checked)chars+='abcdefghijklmnopqrstuvwxyz';
    if(document.getElementById('pg-numbers').checked)chars+='0123456789';
    if(document.getElementById('pg-symbols').checked)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
    if(!chars)chars='abcdefghijklmnopqrstuvwxyz';
    pw=randomString(chars,len);
  }
  document.getElementById('pwgen-result').value=pw;
  // Força: para frases longas, o comprimento garante força
  let score=getPwScore(pw);
  if(PGMODE.m==='memorable'&&pw.length>=18)score=Math.max(score,4);
  const lvls=[{w:'15%',c:'#e05252',k:'pwVeryWeak'},{w:'30%',c:'#e08852',k:'pwWeak'},{w:'55%',c:'#e0c852',k:'pwMedium'},{w:'80%',c:'#82c852',k:'pwGood'},{w:'100%',c:'#4caf82',k:'pwStrong'}];
  const lvl=lvls[Math.min(score,4)];
  const bar=document.getElementById('pwgen-bar'),lbl=document.getElementById('pwgen-label');
  bar.style.width=lvl.w;bar.style.background=lvl.c;lbl.textContent=t(lvl.k);lbl.style.color=lvl.c;
}
function usePwGen(){document.getElementById('f-pw').value=document.getElementById('pwgen-result').value;checkPwStrength();checkDuplicate();closePwGen();}

// ══ NOTES ══
function renderNotesList(){
  const el=document.getElementById('notes-list-items');el.innerHTML='';
  const titleEl=document.getElementById('notes-title');if(titleEl)titleEl.textContent=t('notesTitle');
  if(!notes.filter(n=>!n.archived).length){
    el.innerHTML=`<div style="padding:14px;font-size:.62rem;color:var(--text-muted);text-align:center">${currentLang==='en'?'No notes yet':'Sem notas'}</div>`;
    hideNoteEditor();return;
  }
  notes.filter(n=>!n.archived).forEach(note=>{
    const div=document.createElement('div');
    div.className=`note-item${editingNoteId===note.id?' active':''}`;
    div.innerHTML=`<div class="note-item-title">${esc(note.title||'...')}</div><div class="note-item-preview">${esc((note.body||'').slice(0,40))}</div>`;
    div.onclick=()=>selectNote(note.id);
    el.appendChild(div);
  });
}
function hideNoteEditor(){
  document.getElementById('notes-empty').style.display='flex';
  document.getElementById('ne-title').style.display='none';
  document.getElementById('ne-body').style.display='none';
  document.getElementById('ne-actions').style.display='none';
}
function showNoteEditor(note){
  document.getElementById('notes-empty').style.display='none';
  const titleEl=document.getElementById('ne-title');
  const bodyEl=document.getElementById('ne-body');
  const actionsEl=document.getElementById('ne-actions');
  titleEl.style.display='block';titleEl.value=note.title||'';titleEl.placeholder=t('noteTitlePh');
  bodyEl.style.display='flex';bodyEl.value=note.body||'';bodyEl.placeholder=t('noteBodyPh');
  actionsEl.style.display='flex';
  const counter=document.getElementById('note-char-count');
  if(counter){counter.style.display='block';counter.textContent=`${(note.body||'').length} ${currentLang==='en'?'characters':'caracteres'}`;}
  document.getElementById('ne-save-btn').textContent=t('btnSaveNote');
  document.getElementById('ne-del-btn').textContent=t('btnDelNote');
  const arcBtn=document.getElementById('ne-archive-btn');
  if(arcBtn)arcBtn.textContent='📦 '+t('btnArchive');
}
function newNote(){
  const note={id:Date.now().toString(36),title:'',body:'',createdAt:Date.now()};
  notes.push(note);editingNoteId=note.id;renderNotesList();showNoteEditor(note);
  document.getElementById('ne-title').focus();
}
function selectNote(id){
  editingNoteId=id;
  const note=notes.find(n=>n.id===id);
  if(note){renderNotesList();showNoteEditor(note);}
}
function saveNote(){
  const note=notes.find(n=>n.id===editingNoteId);if(!note)return;
  note.title=document.getElementById('ne-title').value;
  note.body=document.getElementById('ne-body').value;
  renderNotesList();toast(t('toastNoteSaved'));markUnsaved();
}
function deleteCurrentNote(){
  if(!editingNoteId)return;
  if(!confirm(currentLang==='en'?'Move this note to the recycle bin?':'Mover esta nota para a reciclagem?'))return;
  const n=notes.find(nn=>nn.id===editingNoteId);
  if(n){logActivity('delete',n.title||'...','🗑️');trash.unshift({type:'note',data:n,deletedAt:Date.now()});}
  notes=notes.filter(nn=>nn.id!==editingNoteId);
  editingNoteId=null;renderNotesList();hideNoteEditor();
  toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movida para a reciclagem 🗑️');markUnsaved();
}

// ══ BANK CARDS ══
let bankCards=[];let editingCardId=null;let selectedCardColor='#1a237e';

function openCardModal(id=null){
  editingCardId=id;selectedCardColor='#1a237e';
  document.getElementById('card-modal-title').textContent=id?t('cardModalEdit'):t('cardModalNew');
  if(id){
    const c=bankCards.find(c=>c.id===id);
    document.getElementById('card-bank').value=c.bank||'';
    document.getElementById('card-holder').value=c.holder||'';
    document.getElementById('card-number').value=c.number||'';
    document.getElementById('card-expiry').value=c.expiry||'';
    document.getElementById('card-type').value=c.type||'debito';
    document.getElementById('card-pin').value=c.pin||'';
    {const cv=document.getElementById('card-cvv');if(cv)cv.value=c.cvv||'';}
    document.getElementById('card-notes').value=c.notes||'';
    selectedCardColor=c.color||'#1a237e';
  }else{
    ['card-bank','card-holder','card-number','card-expiry','card-pin','card-cvv','card-notes'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    document.getElementById('card-type').value='debito';
  }
  document.querySelectorAll('.card-color-swatch').forEach(s=>{s.classList.toggle('active',s.dataset.color===selectedCardColor);});
  document.getElementById('card-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('card-bank').focus(),100);
}
function closeCardModal(){document.getElementById('card-overlay').classList.remove('open');editingCardId=null;}
function selectCardColor(color){
  selectedCardColor=color;
  document.querySelectorAll('.card-color-swatch').forEach(s=>s.classList.toggle('active',s.dataset.color===color));
}
function formatCardNumber(el){
  let v=el.value.replace(/\D/g,'').slice(0,16);
  el.value=v.replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(el){
  let v=el.value.replace(/\D/g,'').slice(0,4);
  if(v.length>=2)v=v.slice(0,2)+'/'+v.slice(2);
  el.value=v;
}
function saveCard(){
  const bank=document.getElementById('card-bank').value.trim();
  if(!bank){alert(t('cardRequired'));return;}
  const existing=editingCardId?bankCards.find(c=>c.id===editingCardId):null;
  const card={
    ...(existing||{}),
    id:editingCardId||Date.now().toString(36),
    bank,holder:document.getElementById('card-holder').value.trim(),
    number:document.getElementById('card-number').value.trim(),
    expiry:document.getElementById('card-expiry').value.trim(),
    type:document.getElementById('card-type').value,
    pin:document.getElementById('card-pin').value,
    cvv:(document.getElementById('card-cvv')||{}).value||'',
    notes:document.getElementById('card-notes').value.trim(),
    color:selectedCardColor,createdAt:existing&&existing.createdAt||Date.now(),
  };
  const idx=existing?bankCards.indexOf(existing):-1;
  if(idx>=0)bankCards[idx]=card;else bankCards.push(card);
  closeCardModal();renderBankCards();
  toast(existing?t('cardUpdated'):t('cardAdded'));markUnsaved();
}
function deleteCard(id){
  if(!confirm(currentLang==='en'?'Move this card to the recycle bin?':'Mover este cartão para a reciclagem?'))return;
  const cd=bankCards.find(cc=>cc.id===id);
  if(cd){logActivity('delete',cd.bank,'🗑️');trash.unshift({type:'card',data:cd,deletedAt:Date.now()});}
  bankCards=bankCards.filter(cc=>cc.id!==id);renderBankCards();
  toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}
function renderBankCards(){
  const grid=document.getElementById('cards-grid-area');
  const activeCards=bankCards.filter(cd=>!cd.archived);
  if(!activeCards.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><p>${t('cardEmpty')}</p></div>`;
    return;
  }
  grid.innerHTML=activeCards.map(card=>{
    const typeLabels=t('cardTypeLabels');
    const maskedNum=card.number?card.number.replace(/\d(?=\d{4})/g,'•'):'•••• •••• •••• ••••';
    return `<div class="bank-card-wrap">
      <div class="bank-card" style="background:linear-gradient(135deg,${card.color},${card.color}dd)">
        <div class="bank-card-top">
          <span class="bank-card-bank">${esc(card.bank)}</span>
          <span class="bank-card-type-badge">${typeLabels[card.type]||card.type}</span>
        </div>
        <div class="bank-card-chip"></div>
        <div class="bank-card-number">${esc(maskedNum)}</div>
        <div class="bank-card-bottom">
          <span class="bank-card-holder">${esc(card.holder||'—')}</span>
          <div class="bank-card-expiry-wrap">
            <span class="bank-card-expiry-label">VALID THRU</span>
            <span class="bank-card-expiry">${esc(card.expiry||'—/—')}</span>
          </div>
        </div>
      </div>
      <div class="bank-card-actions">
        ${card.pin?`<div style="display:flex;align-items:center;gap:6px;background:var(--panel);border:1px solid var(--border);border-radius:2px;padding:5px 10px;flex:1">
          <span style="font-size:.52rem;letter-spacing:2px;color:var(--text-muted)">PIN</span>
          <span class="pin-reveal" id="pin-${card.id}">${esc(card.pin)}</span>
          <span style="font-size:.52rem;letter-spacing:2px;color:var(--text-muted)" id="pin-masked-${card.id}">••••</span>
          <button class="card-btn" id="pin-btn-${card.id}" data-act="togglePin" data-arg="${esc(card.id)}" style="margin-left:auto">👁️</button>
        </div>`:''}
        <button class="card-btn" data-act="openCardModal" data-arg="${esc(card.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${t('btnEdit')}</button>
        <button class="card-btn" data-act="archiveCard" data-arg="${esc(card.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg> ${t('btnArchive')}</button>
        <button class="card-btn danger" data-act="deleteCard" data-arg="${esc(card.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg> ${t('btnDel')}</button>
      </div>
      ${card.notes?`<div style="font-size:.62rem;color:var(--text-muted);padding:8px 2px;line-height:1.5">${esc(card.notes)}</div>`:''}
    </div>`;
  }).join('');
}
function togglePin(id){
  const pinEl=document.getElementById('pin-'+id);
  const maskedEl=document.getElementById('pin-masked-'+id);
  const btn=document.getElementById('pin-btn-'+id);
  if(pinEl.style.display==='inline'){pinEl.style.display='none';maskedEl.style.display='inline';btn.textContent='👁️';}
  else{pinEl.style.display='inline';maskedEl.style.display='none';btn.textContent='🙈';}
}

// ══ CHANGE MASTER PW ══
function openChangePwModal(){
  if(presentationMode){toast(currentLang==='en'?'Not available in demo mode.':'Indisponível no modo demonstração.');return;}
  ['cp-current','cp-new','cp-confirm'].forEach(id=>document.getElementById(id).value='');document.getElementById('cp-error').textContent='';document.getElementById('changepw-overlay').classList.add('open');setTimeout(()=>document.getElementById('cp-current').focus(),100);}
function closeChangePwModal(){document.getElementById('changepw-overlay').classList.remove('open');}
async function changeMasterPw(){
  const cur=document.getElementById('cp-current').value,np=document.getElementById('cp-new').value,cf=document.getElementById('cp-confirm').value,err=document.getElementById('cp-error');
  if(cur!==masterPwRaw){err.textContent=t('cpErrWrong');return;}if(np.length<4){err.textContent=t('cpErrShort');return;}if(np!==cf){err.textContent=t('cpErrMatch');return;}if(np===cur){err.textContent=t('cpErrSame');return;}
  const salt=crypto.getRandomValues(new Uint8Array(16)),key=await deriveKey(np,salt,KDF_ITER);
  if(totpUnlocked)totpEnc=await encryptTotpArray();
  const payload=await encrypt(key,vaultPayload());downloadVault(mkContainer({salt,iter:KDF_ITER},payload));
  masterKey=key;masterPwRaw=np;window._salt=salt;window._iter=KDF_ITER;clearQuickUnlock();closeChangePwModal();toast(t('toastPwChanged'));
  // O ficheiro do cofre, a cópia interna e o Drive ainda estão com a palavra-passe antiga: regravar já com a nova
  // (antes ficavam assim até à próxima alteração — e ao reabrir, a palavra-passe nova «não funcionava»)
  markUnsaved();
  try{await saveFile({auto:true});}catch(e){}
}

// ══ SAVE FILE ══
// ══ BENS: garantias, licenças, veículos, datas ══
const ASSET_SCHEMA={
  warranty:{icon:'🧾',title:['Garantia','Warranty'],fields:[
    {k:'name',l:['Produto','Product'],t:'text',req:1,ph:['Ex: Máquina de lavar Bosch','e.g. Bosch washing machine']},
    {k:'store',l:['Loja','Store'],t:'text',ph:['Ex: Worten','e.g. Currys']},
    {k:'buyDate',l:['Data de compra','Purchase date'],t:'date',req:1},
    {k:'years',l:['Anos de garantia','Warranty years'],t:'number',req:1,ph:['2','2']},
    {k:'price',l:['Valor pago (€)','Price paid (€)'],t:'number'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]},
  license:{icon:'🔑',title:['Licença','License'],fields:[
    {k:'name',l:['Software','Software'],t:'text',req:1,ph:['Ex: Windows 11 Pro','e.g. Windows 11 Pro']},
    {k:'key',l:['Chave / Serial','Key / Serial'],t:'text',req:1},
    {k:'email',l:['Conta associada','Linked account'],t:'text'},
    {k:'buyDate',l:['Data de compra','Purchase date'],t:'date'},
    {k:'expiry',l:['Validade (se tiver)','Expiry (if any)'],t:'date'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]},
  vehicle:{icon:'🚗',title:['Veículo','Vehicle'],fields:[
    {k:'name',l:['Veículo','Vehicle'],t:'text',req:1,ph:['Ex: Golf 1.6 TDI','e.g. Golf 1.6 TDI']},
    {k:'plate',l:['Matrícula','Plate'],t:'text'},
    {k:'insurance',l:['Seguro até','Insurance until'],t:'date'},
    {k:'inspection',l:['Inspeção até','Inspection until'],t:'date'},
    {k:'service',l:['Próxima revisão','Next service'],t:'date'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]},
  dates:{icon:'🎂',title:['Data','Date'],fields:[
    {k:'name',l:['O que é','What is it'],t:'text',req:1,ph:['Ex: Aniversário da Aurora','e.g. Anna birthday']},
    {k:'date',l:['Data','Date'],t:'date',req:1},
    {k:'yearly',l:['Repete todos os anos','Repeats every year'],t:'check'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]}
};

// datas que cada bem gera (para calendário e avisos)
function assetDates(a){
  const en=currentLang==='en';
  const out=[];
  const mk=(v,sub)=>{if(!v)return;const d=new Date(v);if(!isNaN(d))out.push({date:d,sub});};
  if(a.kind==='warranty'&&a.buyDate&&a.years){
    const d=new Date(a.buyDate);
    if(!isNaN(d)){d.setFullYear(d.getFullYear()+(parseInt(a.years)||0));out.push({date:d,sub:en?'warranty ends':'fim da garantia'});}
  }
  if(a.kind==='license')mk(a.expiry,en?'license expires':'licença expira');
  if(a.kind==='vehicle'){
    mk(a.insurance,en?'insurance':'seguro');
    mk(a.inspection,en?'inspection':'inspeção');
    mk(a.service,en?'service':'revisão');
  }
  if(a.kind==='dates'&&a.date){
    const d=new Date(a.date);
    if(!isNaN(d)){
      if(a.yearly){
        const t=new Date();t.setHours(0,0,0,0);
        const n=new Date(t.getFullYear(),d.getMonth(),d.getDate());
        if(n<t)n.setFullYear(n.getFullYear()+1);
        out.push({date:n,sub:''});
      }else out.push({date:d,sub:''});
    }
  }
  return out;
}

function assetNextDate(a){
  const ds=assetDates(a);if(!ds.length)return null;
  const t=new Date();t.setHours(0,0,0,0);
  const fut=ds.filter(x=>x.date>=t).sort((x,y)=>x.date-y.date);
  return fut.length?fut[0]:ds.sort((x,y)=>y.date-x.date)[0];
}

function renderAssets(kind){
  const box=document.getElementById(kind+'-content');if(!box)return;
  const en=currentLang==='en';
  const list=(assets||[]).filter(a=>a.kind===kind);
  if(!list.length){
    box.innerHTML='<div class="av-empty" style="text-align:center;padding:50px 20px;color:var(--text-muted)"><div style="font-size:2.4rem;margin-bottom:12px;opacity:.5">'+ASSET_SCHEMA[kind].icon+'</div><div style="font-size:.78rem">'+(en?'Nothing here yet.':'Ainda não há nada aqui.')+'</div></div>';
    return;
  }
  const sorted=list.slice().sort((a,b)=>{
    const x=assetNextDate(a),y=assetNextDate(b);
    if(!x&&!y)return (a.name||'').localeCompare(b.name||'');
    if(!x)return 1;if(!y)return -1;return x.date-y.date;
  });
  box.innerHTML='<div class="asset-grid">'+sorted.map(a=>{
    const nx=assetNextDate(a);
    let badge='';
    if(nx){
      const n=calDaysUntil(nx.date);
      const col=n<0?'var(--red)':n<=30?'var(--accent)':'var(--text-muted)';
      const txt=(nx.sub?esc(nx.sub)+' · ':'')+calWhenLabel(n);
      badge='<div class="asset-when" style="color:'+col+'">'+txt+'</div>';
    }
    let meta=[];
    if(a.kind==='warranty'){if(a.store)meta.push(esc(a.store));if(a.price)meta.push(fmtMoney(parseFloat(a.price)||0));}
    if(a.kind==='license'){if(a.email)meta.push(esc(a.email));}
    if(a.kind==='vehicle'){if(a.plate)meta.push(esc(a.plate));}

    let keyRow='';
    if(a.kind==='license'&&a.key){
      keyRow='<div class="asset-key"><span class="asset-key-val" id="ak-'+a.id+'">••••••••••••</span>'+
        '<button class="asset-mini" data-act="toggleAssetKey" data-arg="'+esc(a.id)+'" id="akb-'+a.id+'">'+(en?'Show':'Ver')+'</button>'+
        '<button class="asset-mini" data-act="copyAssetKey" data-arg="'+esc(a.id)+'">'+(en?'Copy':'Copiar')+'</button></div>';
    }
    return '<div class="asset-card">'+
      '<div class="asset-head"><span class="asset-ic">'+ASSET_SCHEMA[kind].icon+'</span>'+
        '<span class="asset-name">'+esc(a.name||'')+'</span>'+
        '<span class="asset-acts"><button class="asset-mini" data-act="openAssetModal" data-arg="'+esc(kind)+'" data-arg2="'+esc(a.id)+'">'+(en?'Edit':'Editar')+'</button>'+
        '<button class="asset-mini danger" data-act="deleteAsset" data-arg="'+esc(a.id)+'">'+(en?'Delete':'Apagar')+'</button></span></div>'+
      (meta.length?'<div class="asset-meta">'+meta.join(' · ')+'</div>':'')+
      keyRow+badge+
      (a.kind==='vehicle'?'<button class="asset-mini" style="margin-top:8px" data-act="openFuelModal" data-arg="'+esc(a.id)+'">⛽ '+(en?'Refuelling':'Abastecimentos')+((a.fuel&&a.fuel.length)?' ('+a.fuel.length+')':'')+'</button>':'')+
      attachChips(a,'asset')+
      (a.notes?'<div class="asset-notes">'+esc(a.notes)+'</div>':'')+
    '</div>';
  }).join('')+'</div>';
}

function toggleAssetKey(id){
  const a=assets.find(x=>x.id===id);if(!a)return;
  const el=document.getElementById('ak-'+id),btn=document.getElementById('akb-'+id);
  const en=currentLang==='en';
  if(!el)return;
  if(el.dataset.shown==='1'){el.textContent='••••••••••••';el.dataset.shown='0';if(btn)btn.textContent=en?'Show':'Ver';}
  else{el.textContent=a.key||'';el.dataset.shown='1';if(btn)btn.textContent=en?'Hide':'Ocultar';}
}
function copyAssetKey(id){
  const a=assets.find(x=>x.id===id);if(!a||!a.key)return;
  copyText(a.key,currentLang==='en'?'Key copied!':'Chave copiada!');
}

function openAssetModal(kind,id){
  const en=currentLang==='en';
  currentAssetKind=kind;editingAssetId=id||null;
  const sch=ASSET_SCHEMA[kind];
  const a=id?assets.find(x=>x.id===id):null;
  assetAttachments=a?normalizeAttachments(a):[];
  document.getElementById('asset-modal-title').textContent=sch.icon+' '+(id?(en?'Edit ':'Editar '):(en?'New ':'Nova '))+sch.title[en?1:0];
  const box=document.getElementById('asset-fields');
  box.innerHTML=sch.fields.map(f=>{
    const v=a?(a[f.k]||''):'';
    const lbl=f.l[en?1:0]+(f.req?' *':'');
    if(f.t==='check'){
      return '<div class="form-group"><label style="display:flex;align-items:center;gap:9px;cursor:pointer"><input type="checkbox" id="as-'+f.k+'"'+(a&&a[f.k]?' checked':'')+' style="width:auto;margin:0"> <span>'+lbl+'</span></label></div>';
    }
    if(f.t==='textarea'){
      return '<div class="form-group"><label>'+lbl+'</label><textarea id="as-'+f.k+'" rows="2">'+esc(v)+'</textarea></div>';
    }
    const ph=f.ph?' placeholder="'+esc(f.ph[en?1:0])+'"':'';
    const step=f.t==='number'?' step="any"':'';
    return '<div class="form-group"><label>'+lbl+'</label><input type="'+f.t+'" id="as-'+f.k+'" value="'+esc(v)+'"'+ph+step+'></div>';
  }).join('')+
    '<div class="form-group"><label>'+(en?'Attachments (images or PDF)':'Anexos (imagens ou PDF)')+'</label>'+
    '<input type="file" id="asset-attach-input" accept="image/*,application/pdf" multiple data-change="handleAttachment" data-ev data-arg="asset" style="font-size:.7rem">'+
    '<div id="asset-attach-list" class="att-list"></div></div>';
  renderAttachList('asset');
  document.getElementById('asset-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('asset-save-btn').textContent=en?'Save':'Guardar';
  document.getElementById('asset-overlay').classList.add('open');
}
function closeAssetModal(){document.getElementById('asset-overlay').classList.remove('open');editingAssetId=null;assetAttachments=[];}

function saveAsset(){
  const en=currentLang==='en';
  const kind=currentAssetKind,sch=ASSET_SCHEMA[kind];
  // Ao editar, parte do bem existente: antes os campos fora do formulário (ex.: abastecimentos do veículo) perdiam-se
  const prev=editingAssetId?assets.find(x=>x.id===editingAssetId):null;
  const obj={...(prev||{}),id:editingAssetId||Date.now().toString(36),kind};
  for(const f of sch.fields){
    const el=document.getElementById('as-'+f.k);if(!el)continue;
    const val=f.t==='check'?el.checked:el.value.trim();
    if(f.req&&!val){toast(en?('Fill in: '+f.l[1]):('Preenche: '+f.l[0]));el.focus();return;}
    obj[f.k]=val;
  }
  obj.attachments=assetAttachments;
  if(editingAssetId){const i=assets.findIndex(x=>x.id===editingAssetId);if(i>=0)assets[i]=obj;logActivity('edit',obj.name,sch.icon);}
  else{assets.push(obj);logActivity('add',obj.name,sch.icon);}
  closeAssetModal();renderAssets(kind);markUnsaved();
  toast(en?'Saved!':'Guardado!');
}

function deleteAsset(id){
  const en=currentLang==='en';
  const a=assets.find(x=>x.id===id);if(!a)return;
  if(!confirm(en?('Delete "'+a.name+'"?'):('Apagar "'+a.name+'"?')))return;
  const kind=a.kind;
  assets=assets.filter(x=>x.id!==id);
  logActivity('delete',a.name,'🗑️');
  renderAssets(kind);markUnsaved();
  toast(en?'Deleted.':'Apagado.');
}

// ══ ABASTECIMENTOS (por veículo) ══
let fuelVehicleId=null;
function openFuelModal(vid){
  fuelVehicleId=vid;
  const v=(assets||[]).find(x=>x.id===vid);if(!v)return;
  const en=currentLang==='en';
  document.getElementById('fuel-modal-title').textContent='⛽ '+(en?'Refuelling — ':'Abastecimentos — ')+(v.name||'');
  document.getElementById('fuel-date').value=new Date().toISOString().slice(0,10);
  ['fuel-liters','fuel-euros','fuel-km'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('fuel-lbl-date').textContent=en?'Date':'Data';
  document.getElementById('fuel-lbl-liters').textContent=en?'Litres':'Litros';
  document.getElementById('fuel-lbl-euros').textContent=en?'Amount (€)':'Valor (€)';
  document.getElementById('fuel-lbl-km').textContent=en?'Odometer (km)':'Quilómetros (conta-km)';
  document.getElementById('fuel-add-btn').textContent=en?'Add':'Adicionar';
  document.getElementById('fuel-close-btn').textContent=en?'Close':'Fechar';
  renderFuel();
  document.getElementById('fuel-overlay').classList.add('open');
}
function closeFuelModal(){document.getElementById('fuel-overlay').classList.remove('open');fuelVehicleId=null;}

function fuelStats(list){
  // método do depósito cheio: consumo entre abastecimentos consecutivos
  const s=list.slice().filter(f=>f.km).sort((a,b)=>a.km-b.km);
  const out={rows:[],avg:null,kmTotal:0,litTotal:0,eurTotal:0,eurPer100:null,perMonth:null};
  list.forEach(f=>{out.eurTotal+=parseFloat(f.euros)||0;});
  for(let i=1;i<s.length;i++){
    const dk=s[i].km-s[i-1].km;
    const li=parseFloat(s[i].liters)||0;
    if(dk>0&&li>0){
      out.rows.push({id:s[i].id,cons:li/dk*100});
      out.kmTotal+=dk;out.litTotal+=li;
    }
  }
  if(out.kmTotal>0&&out.litTotal>0){
    out.avg=out.litTotal/out.kmTotal*100;
    const eurNoFirst=s.slice(1).reduce((a,f)=>a+(parseFloat(f.euros)||0),0);
    if(eurNoFirst>0)out.eurPer100=eurNoFirst/out.kmTotal*100;
  }
  // custo médio por mês
  const ds=list.map(f=>new Date(f.date)).filter(d=>!isNaN(d)).sort((a,b)=>a-b);
  if(ds.length>=2){
    const meses=Math.max(1,(ds[ds.length-1]-ds[0])/(30.44*86400000));
    out.perMonth=out.eurTotal/meses;
  }
  return out;
}

function renderFuel(){
  const v=(assets||[]).find(x=>x.id===fuelVehicleId);if(!v)return;
  const en=currentLang==='en';
  const list=(v.fuel||[]).slice();
  const box=document.getElementById('fuel-list');
  const st=fuelStats(list);
  const sBox=document.getElementById('fuel-stats');
  if(list.length<2){
    sBox.innerHTML='<div class="fuel-hint">'+(en?'Add at least two refuels (with odometer) to see real consumption.':'Regista pelo menos dois abastecimentos (com os quilómetros) para veres o consumo real.')+'</div>';
  }else{
    sBox.innerHTML='<div class="fuel-stats">'+
      '<div class="fuel-stat"><span class="fuel-v">'+(st.avg?st.avg.toFixed(1):'—')+'</span><span class="fuel-l">'+(en?'L/100km':'L/100km')+'</span></div>'+
      '<div class="fuel-stat"><span class="fuel-v">'+(st.eurPer100?fmtMoney(st.eurPer100):'—')+'</span><span class="fuel-l">'+(en?'per 100km':'por 100km')+'</span></div>'+
      '<div class="fuel-stat"><span class="fuel-v">'+(st.perMonth?fmtMoney(st.perMonth):'—')+'</span><span class="fuel-l">'+(en?'per month':'por mês')+'</span></div>'+
      '<div class="fuel-stat"><span class="fuel-v">'+fmtMoney(st.eurTotal)+'</span><span class="fuel-l">'+(en?'total':'total')+'</span></div>'+
      '</div>';
  }
  if(!list.length){box.innerHTML='<div class="fuel-hint">'+(en?'No refuels yet.':'Ainda não há abastecimentos.')+'</div>';return;}
  const consOf={};st.rows.forEach(r=>consOf[r.id]=r.cons);
  const sorted=list.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  box.innerHTML=sorted.map(f=>{
    const d=new Date(f.date);
    const ds=isNaN(d)?'':d.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'2-digit',year:'2-digit'});
    const c=consOf[f.id];
    return '<div class="fuel-row">'+
      '<span class="fuel-date">'+ds+'</span>'+
      '<span class="fuel-main">'+(parseFloat(f.liters)||0).toFixed(1)+' L · '+fmtMoney(parseFloat(f.euros)||0)+(f.km?' · '+f.km+' km':'')+'</span>'+
      (c?'<span class="fuel-cons">'+c.toFixed(1)+'</span>':'')+
      '<button class="att-btn danger" data-act="deleteFuel" data-arg="'+esc(f.id)+'">✕</button>'+
    '</div>';
  }).join('');
}

function addFuel(){
  const en=currentLang==='en';
  const v=(assets||[]).find(x=>x.id===fuelVehicleId);if(!v)return;
  const date=document.getElementById('fuel-date').value;
  const liters=document.getElementById('fuel-liters').value.trim();
  const euros=document.getElementById('fuel-euros').value.trim();
  const km=document.getElementById('fuel-km').value.trim();
  if(!date||!liters||!euros){toast(en?'Date, litres and amount are required.':'Data, litros e valor são obrigatórios.');return;}
  if(!v.fuel)v.fuel=[];
  v.fuel.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),date,liters,euros,km:km?parseInt(km):null});
  ['fuel-liters','fuel-euros','fuel-km'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  renderFuel();renderAssets('vehicle');markUnsaved();
  toast(en?'Added.':'Adicionado.');
}
function deleteFuel(fid){
  const v=(assets||[]).find(x=>x.id===fuelVehicleId);if(!v||!v.fuel)return;
  v.fuel=v.fuel.filter(f=>f.id!==fid);
  renderFuel();renderAssets('vehicle');markUnsaved();
}

// ══ SINCRONIZAÇÃO COM A GOOGLE DRIVE ══
// Config não sensível em localStorage; token só em memória.
const DRIVE_NAME='ciphervault.vault';
let driveToken=null,driveTokenExp=0,driveBusy=false;
function dCfg(k,v){
  if(v===undefined)return localStorage.getItem('av_drive_'+k)||'';
  if(v===null)localStorage.removeItem('av_drive_'+k);else localStorage.setItem('av_drive_'+k,v);
}
function driveOn(){return dCfg('on')==='1'&&!!dCfg('cid');}

// ── cópia local (dentro da app, sempre atualizada) ──
async function localVaultSave(json,pending){
  try{await idbSet('av_local',{json,at:Date.now(),pending:!!pending});}catch(e){}
}
async function localVaultGet(){try{return await idbGet('av_local');}catch(e){return null;}}

// ── autorização (sem carregar scripts da Google) ──
function driveAuth(interactive){
  return new Promise((resolve,reject)=>{
    const cid=dCfg('cid');
    if(!cid)return reject(new Error('sem-id'));
    if(driveToken&&Date.now()<driveTokenExp-60000)return resolve(driveToken);
    if(!interactive)return reject(new Error('sem-token'));
    const redirect=location.origin+location.pathname;
    const state=Math.random().toString(36).slice(2);
    const url='https://accounts.google.com/o/oauth2/v2/auth'+
      '?client_id='+encodeURIComponent(cid)+
      '&redirect_uri='+encodeURIComponent(redirect)+
      '&response_type=token'+
      '&scope='+encodeURIComponent('https://www.googleapis.com/auth/drive.file')+
      (dCfg('hint')?'&login_hint='+encodeURIComponent(dCfg('hint')):'')+
      '&include_granted_scopes=true&state='+state;
    const w=window.open(url,'av_oauth','width=500,height=660');
    if(!w)return reject(new Error('popup-bloqueado'));
    let done=false;
    const onMsg=ev=>{
      if(ev.origin!==location.origin||!ev.data||!ev.data.avOAuth)return;
      const p=new URLSearchParams(String(ev.data.avOAuth).replace(/^#/,''));
      if(p.get('state')!==state)return;
      const tok=p.get('access_token');
      window.removeEventListener('message',onMsg);done=true;
      if(!tok)return reject(new Error(p.get('error')||'sem-token'));
      driveToken=tok;driveTokenExp=Date.now()+(parseInt(p.get('expires_in')||'3600')*1000);
      resolve(tok);
    };
    window.addEventListener('message',onMsg);
    const iv=setInterval(()=>{
      if(done||!w||w.closed){clearInterval(iv);if(!done){window.removeEventListener('message',onMsg);reject(new Error('cancelado'));}}
    },600);
  });
}

// ── chamadas à API ──
async function dApi(url,opts,interactive){
  const tok=await driveAuth(interactive!==false);
  opts=opts||{};opts.headers=Object.assign({},opts.headers,{Authorization:'Bearer '+tok});
  const r=await fetch(url,opts);
  if(r.status===401){driveToken=null;const t2=await driveAuth(true);opts.headers.Authorization='Bearer '+t2;return fetch(url,opts);}
  return r;
}
async function driveCaptureHint(){
  if(dCfg('hint'))return; // já sabemos a conta
  try{
    const r=await dApi('https://www.googleapis.com/drive/v3/about?fields=user',{},false);
    if(r&&r.ok){const j=await r.json();const em=j&&j.user&&j.user.emailAddress;if(em)dCfg('hint',em);}
  }catch(e){}
}
async function driveMeta(interactive){
  const fid=dCfg('fid');if(!fid)return null;
  const r=await dApi('https://www.googleapis.com/drive/v3/files/'+fid+'?fields=id,name,modifiedTime,size,version',{},interactive);
  if(!r.ok)return null;
  driveCaptureHint(); // guarda o email da conta (1x) para saltar o seletor de contas
  return r.json();
}
async function driveDownload(interactive){
  const fid=dCfg('fid');if(!fid)throw new Error('sem-ficheiro');
  const r=await dApi('https://www.googleapis.com/drive/v3/files/'+fid+'?alt=media',{},interactive);
  if(!r.ok)throw new Error('download '+r.status);
  return r.text();
}
async function driveUpload(json,interactive){
  const fid=dCfg('fid');
  const meta={name:DRIVE_NAME,mimeType:'application/octet-stream'};
  const bnd='avb'+Math.random().toString(36).slice(2);
  const body='--'+bnd+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+
             '\r\n--'+bnd+'\r\nContent-Type: application/octet-stream\r\n\r\n'+json+'\r\n--'+bnd+'--';
  const url=fid
    ? 'https://www.googleapis.com/upload/drive/v3/files/'+fid+'?uploadType=multipart&fields=id,modifiedTime,version'
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime,version';
  const r=await dApi(url,{method:fid?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+bnd},body},interactive);
  if(!r.ok)throw new Error('upload '+r.status);
  const j=await r.json();
  if(j.id)dCfg('fid',j.id);
  if(j.modifiedTime)dCfg('mtime',j.modifiedTime);
  if(j.version!=null)dCfg('ver',String(j.version));
  await syncBaseSave(json);
  return j;
}

// ── recarregar o cofre a partir de um container descarregado ──
async function applyContainerText(text){
  const container=JSON.parse(text);
  const salt=new Uint8Array(container.salt),iter=containerIter(container);
  const key=await deriveKey(masterPwRaw,salt,iter);
  const data=await decrypt(key,container.payload);
  const changed=key!==masterKey;
  window._salt=salt;window._iter=iter;masterKey=key;
  if(changed){refreshQuickSecrets();setTimeout(()=>{try{maybeUpgradeKdf();}catch(e){}},1500);}
  syncApplyData(data);
  pendingVaultText=text;
  await localVaultSave(text,false);
  renderAll();
  return data.savedAt||0;
}
function syncApplyData(data){
  vault=data.vault||[];notes=data.notes||[];bankCards=data.bankCards||[];activityLog=data.activityLog||[];documents=data.documents||[];trash=data.trash||[];customCats=data.customCats||[];docFolders=data.docFolders||[];currentFolderId=null;vaultFolders=data.vaultFolders||[];currentVaultFolderId=null;wifiNets=data.wifiNets||[];legacyNote=data.legacyNote||'';legacyOwner=data.legacyOwner||'';personalInfo=data.personalInfo||[];subscriptions=data.subscriptions||[];storeCards=data.storeCards||[];assets=data.assets||[];vaultName=data.vaultName||'';
  totpRecWrap=data.totpRecWrap||null;totpEnc=data.totpEnc||null;totpKey=null;totpUnlocked=false;
  totp=totpRecWrap?[]:(data.totp||[]);
  payloadExtras={};
  Object.keys(data).forEach(k=>{if(!KNOWN_KEYS.includes(k))payloadExtras[k]=data[k];});
}

// ── orquestração (sincronização blindada) ──
/* Regras: (1) nunca carregar do Drive por cima de alterações por gravar; (2) antes de enviar, confirmar se o
   Drive mudou desde a última sincronização — se mudou, juntar item a item (3 vias: base comum, este dispositivo,
   Drive) e só depois enviar; (3) antes de substituir, guardar cópia no histórico do Drive; (4) travão se uma
   gravação for eliminar mais de metade dos itens. */
function syncErrMsg(e){
  const en=currentLang==='en',m=e&&e.message;
  if(m==='remote-pw')return en?'The vault on Drive was changed with a different master password — nothing was merged or replaced.':'O cofre no Drive foi alterado com outra palavra-passe mestra — não juntei nem substituí nada.';
  if(m==='guard')return en?'Upload to Drive held back — confirm it by saving again.':'Envio para o Drive travado — confirma gravando outra vez.';
  return '';
}
async function driveAfterSave(json){
  if(!driveOn())return;
  try{
    driveBusy=true;renderDriveChip();
    await driveSafeUpload(json,false);
    driveBusy=false;renderDriveChip('ok');
  }catch(e){
    driveBusy=false;
    try{await localVaultSave(pendingVaultText||json,true);}catch(_){}
    renderDriveChip('pend');
    const msg=syncErrMsg(e);if(msg)toast(msg);
  }
}
async function driveSafeUpload(json,interactive){
  const m=await driveMeta(interactive);
  if(!m)throw new Error('meta');
  const known=dCfg('ver');let rep=null;
  if(known&&m.version!=null&&String(m.version)!==String(known)){
    const res=await driveMergeRemote(m,interactive);
    json=res.json;rep=res.rep;
  }
  if(!(await syncGuard()))throw new Error('guard');
  try{await driveSnapshot(m,interactive,!!(rep&&rep.conflicts.length));}catch(e){}
  const j=await driveUpload(json,interactive);
  await localVaultSave(json,false);
  dCfg('cnt',String(syncCount(vaultPayload())));
  if(rep)syncReport(rep);
  return j;
}
async function driveMergeRemote(m,interactive){
  const rtxt=await driveDownload(interactive);
  let R;try{R=await syncDecrypt(rtxt,masterPwRaw);}catch(e){throw new Error('remote-pw');}
  let B=null;try{const bt=await idbGet('av_base');if(bt)B=await syncDecrypt(bt,masterPwRaw);}catch(e){B=null;}
  if(totpUnlocked&&(!totpEnc||syncStable(totp)!==totpSig)){try{totpEnc=await encryptTotpArray();}catch(e){}}
  const L=vaultPayload();
  const {data,rep}=syncMerge(B,L,R);
  if(totpUnlocked&&totpKey&&L.totpRecWrap&&syncEq(L.totpRecWrap,R.totpRecWrap)&&R.totpEnc&&!syncEq(L.totpEnc,R.totpEnc)){
    try{
      const rt=await decryptTotpArray(totpKey,R.totpEnc);
      let bt=null;if(B&&B.totpEnc&&syncEq(B.totpRecWrap,L.totpRecWrap)){try{bt=await decryptTotpArray(totpKey,B.totpEnc);}catch(e){}}
      rep.conflicts=rep.conflicts.filter(c=>c.key!=='2fa');
      const lt=totp.slice();
      const mt=(syncIsIdArr(lt)||syncIsIdArr(rt))?syncMergeIdArr(bt,lt,rt,rep,'2fa'):syncMergeSetArr(bt,lt,rt);
      totp=mt;totpEnc=await encryptTotpArray();
      data.totpEnc=totpEnc;data.totpRecWrap=L.totpRecWrap;
      rep.totpMerged=true;
    }catch(e){}
  }
  try{if(pendingVaultText)await pushSnapshot(JSON.parse(pendingVaultText));}catch(e){}
  const totpChanged=!rep.totpMerged&&(!syncEq(data.totpEnc,L.totpEnc)||!syncEq(data.totp,L.totp));
  const keepTotp=rep.totpMerged?{t:totp,k:totpKey,u:totpUnlocked,s:totpSig}:null;
  syncApplyData(data);
  if(keepTotp){totp=keepTotp.t;totpKey=keepTotp.k;totpUnlocked=keepTotp.u;totpSig=keepTotp.s;}
  else if(totpChanged&&totpRecWrap){totpKey=null;totpUnlocked=false;totp=[];}
  const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
  const json=JSON.stringify(mkContainer(ks,p));
  pendingVaultText=json;
  await syncBaseSave(rtxt);if(m&&m.version!=null)dCfg('ver',String(m.version));
  await localVaultSave(json,true);
  try{await syncWriteLocalFile(json);}catch(e){}
  if(typeof renderAll==='function')renderAll();
  return {json,rep};
}
async function syncWriteLocalFile(json){
  if(!vaultFileHandle)return;
  const perm=await vaultFileHandle.queryPermission({mode:'readwrite'});
  if(perm!=='granted')return;
  const w=await vaultFileHandle.createWritable();await w.write(json);await w.close();
}
async function driveApplyRemote(m,interactive){
  const txt=await driveDownload(interactive);
  try{if(pendingVaultText)await pushSnapshot(JSON.parse(pendingVaultText));}catch(e){}
  await applyContainerText(txt);
  await syncBaseSave(txt);
  dCfg('mtime',m.modifiedTime);if(m.version!=null)dCfg('ver',String(m.version));
  dCfg('cnt',String(syncCount(vaultPayload())));
  try{await syncWriteLocalFile(txt);}catch(e){}
}
function driveRemoteNewer(m){
  const kv=dCfg('ver');
  if(kv&&m.version!=null)return String(m.version)!==String(kv);
  const remote=new Date(m.modifiedTime).getTime(),known=dCfg('mtime')?new Date(dCfg('mtime')).getTime():0;
  return remote>known+2000;
}
let _syncHeldToast=0;
function driveHoldForUnsaved(){
  renderDriveChip('old');
  if(Date.now()-_syncHeldToast>60000){_syncHeldToast=Date.now();toast(currentLang==='en'?'Newer version on Drive — it will be merged when you save.':'Há uma versão mais recente no Drive — junto-a quando gravares.');}
}
async function driveCheckOnOpen(){
  if(!driveOn()||!navigator.onLine)return false;
  const en=currentLang==='en';
  try{
    const loc=await localVaultGet();
    if(loc&&loc.pending){ // alterações locais por enviar → enviar em segurança (junta se o Drive mudou)
      try{
        driveBusy=true;renderDriveChip();
        await driveSafeUpload(loc.json,true);
        driveBusy=false;renderDriveChip('ok');
      }catch(e){driveBusy=false;renderDriveChip('pend');const msg=syncErrMsg(e);if(msg)toast(msg);}
      return false;
    }
    driveBusy=true;renderDriveChip();
    const m=await driveMeta(true); // interativo: garante o token do Drive logo ao entrar
    if(!m){driveBusy=false;renderDriveChip('off');return false;}
    if(driveRemoteNewer(m)){
      if(hasUnsaved){driveBusy=false;driveHoldForUnsaved();return false;}
      await driveApplyRemote(m,true);
      driveBusy=false;renderDriveChip('ok');
      toast(en?'Synced with Drive.':'Sincronizado com o Drive.');
      return true;
    }else{driveBusy=false;renderDriveChip('ok');if(m.version!=null&&!dCfg('ver'))dCfg('ver',String(m.version));return false;}
  }catch(e){driveBusy=false;renderDriveChip('off');}
  return false;
}
let _driveFocusBusy=false,_driveFocusT=0;
async function driveCheckOnFocus(){
  if(!driveOn()||!masterKey||presentationMode)return;
  if(_driveFocusBusy)return;
  if(document.querySelector('.modal-overlay.open'))return; // não interromper uma edição em curso
  const now=Date.now();
  if(now-_driveFocusT<4000)return; // debounce
  _driveFocusT=now;
  const en=currentLang==='en';
  try{
    _driveFocusBusy=true;
    const loc=await localVaultGet();
    if(loc&&loc.pending){renderDriveChip('pend');_driveFocusBusy=false;return;} // há alterações locais por enviar → não carregar
    const m=await driveMeta(false);
    if(!m){_driveFocusBusy=false;return;}
    if(driveRemoteNewer(m)){
      if(hasUnsaved){driveHoldForUnsaved();_driveFocusBusy=false;return;} // nunca por cima do que está por gravar
      driveBusy=true;renderDriveChip();
      await driveApplyRemote(m,true);
      driveBusy=false;renderDriveChip('ok');
      toast(en?'Updated from Drive.':'Atualizado do Drive.');
    }else{renderDriveChip('ok');}
  }catch(e){driveBusy=false;renderDriveChip('off');}
  _driveFocusBusy=false;
}
async function driveFlushPending(silent){
  if(!driveOn())return;
  const loc=await localVaultGet();
  if(!loc||!loc.pending)return;
  try{
    driveBusy=true;renderDriveChip();
    await driveSafeUpload(loc.json,false);
    driveBusy=false;renderDriveChip('ok');
    if(!silent)toast(currentLang==='en'?'Pending changes sent to Drive.':'Alterações pendentes enviadas para o Drive.');
  }catch(e){driveBusy=false;renderDriveChip('pend');const msg=syncErrMsg(e);if(msg&&!silent)toast(msg);}
}

/* ══ JUNÇÃO DE VERSÕES (3 vias: base comum da última sincronização · este dispositivo · Drive) ══ */
function syncStable(v){
  if(v===undefined)return 'u';
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(syncStable).join(',')+']';
  return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+syncStable(v[k])).join(',')+'}';
}
function syncEq(a,b){return syncStable(a)===syncStable(b);}
function syncIsIdArr(x){return Array.isArray(x)&&x.length>0&&x.every(o=>o&&typeof o==='object'&&!Array.isArray(o)&&o.id!=null);}
function syncItemName(o){return String((o&&(o.name||o.title||o.label||o.bank||o.store||o.ssid||o.issuer))||'').slice(0,60);}
function syncMergeIdArr(b,l,r,rep,key){
  const mapOf=a=>{const m=new Map();(a||[]).forEach(o=>{if(o&&o.id!=null)m.set(String(o.id),o);});return m;};
  const B=b?mapOf(b):null,L=mapOf(l),R=mapOf(r),out=[],seen=new Set();
  const decide=id=>{
    const lo=L.get(id),ro=R.get(id),bo=B?B.get(id):undefined;
    if(lo&&ro){
      if(syncEq(lo,ro))return lo;
      if(bo&&syncEq(lo,bo)){rep.updated++;return ro;}
      if(bo&&syncEq(ro,bo))return lo;
      rep.conflicts.push({key,name:syncItemName(lo)});return lo;
    }
    if(lo){if(bo){if(syncEq(lo,bo)){rep.removed++;return null;}return lo;}return lo;}
    if(ro){if(bo){if(syncEq(ro,bo))return null;rep.updated++;return ro;}rep.added++;return ro;}
    return null;
  };
  [l||[],r||[]].forEach(arr=>arr.forEach(o=>{if(!o||o.id==null)return;const id=String(o.id);if(seen.has(id))return;seen.add(id);const v=decide(id);if(v)out.push(v);}));
  return out;
}
function syncMergeSetArr(b,l,r){
  const k=syncStable,L=l||[],R=r||[],Bs=b?new Set(b.map(k)):null,Ls=new Set(L.map(k)),Rs=new Set(R.map(k)),out=[],seen=new Set();
  const keep=(x,inOther)=>{const s=k(x);if(seen.has(s))return;if(inOther||!Bs||!Bs.has(s)){seen.add(s);out.push(x);}};
  L.forEach(x=>keep(x,Rs.has(k(x))));R.forEach(x=>keep(x,Ls.has(k(x))));
  const tsOf=x=>x&&typeof x==='object'?(+x.ts||+x.deletedAt||+x.at||0):0;
  if(out.length&&out.every(x=>tsOf(x)>0))out.sort((a,c)=>tsOf(c)-tsOf(a));
  return out;
}
const SYNC_TOTP=['totpEnc','totpRecWrap','totp'];
function syncMerge(B,L,R){
  const rep={added:0,updated:0,removed:0,conflicts:[]},data={};
  const keys=new Set([...Object.keys(L||{}),...Object.keys(R||{})]);
  keys.forEach(k=>{
    if(SYNC_TOTP.includes(k))return;
    const l=L[k],r=R[k],b=B?B[k]:undefined;
    if(k==='savedAt'){data[k]=Date.now();return;}
    if(k==='fmt'){data[k]=Math.max(+l||0,+r||0)||l||r;return;}
    if(syncIsIdArr(l)||syncIsIdArr(r)||(Array.isArray(l)&&Array.isArray(r)&&syncIsIdArr(b))){data[k]=syncMergeIdArr(Array.isArray(b)?b:null,Array.isArray(l)?l:[],Array.isArray(r)?r:[],rep,k);return;}
    if(Array.isArray(l)&&Array.isArray(r)){let m=syncMergeSetArr(Array.isArray(b)?b:null,l,r);if(k==='activityLog')m=m.slice(0,Math.max(l.length,r.length,50));data[k]=m;return;}
    if(syncEq(l,r)){data[k]=l;return;}
    if(B&&syncEq(l,b)){data[k]=r===undefined?l:r;return;}
    if(B&&syncEq(r,b)){data[k]=l;return;}
    if(l===undefined){data[k]=r;return;}if(r===undefined){data[k]=l;return;}
    rep.conflicts.push({key:k,name:''});data[k]=l;
  });
  const g=o=>o?{e:o.totpEnc,w:o.totpRecWrap,t:o.totp}:{};
  const lg=g(L),rg=g(R),bg=g(B);let pick=lg;
  if(!syncEq(lg,rg)){
    if(B&&syncEq(lg,bg))pick=rg;else if(B&&syncEq(rg,bg))pick=lg;
    else if(lg.e===undefined&&lg.t===undefined)pick=rg;
    else if(!(rg.e===undefined&&rg.t===undefined))rep.conflicts.push({key:'2fa',name:''});
  }
  if(pick.e!==undefined)data.totpEnc=pick.e;if(pick.w!==undefined)data.totpRecWrap=pick.w;if(pick.t!==undefined&&pick.w===undefined)data.totp=pick.t;
  return {data,rep};
}
async function syncDecrypt(text,pw){const c=JSON.parse(text);const key=await deriveKey(pw,new Uint8Array(c.salt),containerIter(c));return await decrypt(key,c.payload);}
async function syncBaseSave(json){try{await idbSet('av_base',json);}catch(e){}}
function syncCount(d){if(!d)return 0;return ['vault','notes','documents','bankCards','storeCards','assets','subscriptions','wifiNets','personalInfo'].reduce((s,k)=>s+(Array.isArray(d[k])?d[k].length:0),0);}
async function syncGuard(){
  const prev=+dCfg('cnt')||0,now=syncCount(vaultPayload());
  if(prev<10||now>=prev*.5)return true;
  const en=currentLang==='en';
  const ok=confirm(en?`This save removes many items at once (${prev} → ${now}).\n\nSend it to Drive anyway? (If you cancel, Drive keeps the previous version.)`:`Esta gravação elimina muitos itens de uma vez (${prev} → ${now}).\n\nEnviar mesmo assim para o Drive? (Se cancelares, o Drive fica com a versão anterior.)`);
  if(ok)dCfg('cnt',String(now));
  return ok;
}
const SYNC_KEY_LBL={vault:['Passwords','Passwords'],notes:['Notas','Notes'],documents:['Documentos','Documents'],bankCards:['Cartões','Cards'],storeCards:['Cartões de loja','Store cards'],assets:['Bens','Assets'],subscriptions:['Subscrições','Subscriptions'],wifiNets:['Wi-Fi','Wi-Fi'],personalInfo:['Info','Info'],'2fa':['Códigos 2FA','2FA codes'],vaultName:['Nome do cofre','Vault name']};
function syncReport(rep){
  const en=currentLang==='en',parts=[];
  if(rep.added)parts.push('+'+rep.added+(en?' new':' novos'));
  if(rep.updated)parts.push(rep.updated+(en?' updated':' atualizados'));
  if(rep.removed)parts.push(rep.removed+(en?' removed':' removidos'));
  toast((en?'Merged changes from another device':'Juntei as alterações de outro dispositivo')+(parts.length?' ('+parts.join(' · ')+')':'')+'.');
  try{logActivity('edit',(en?'Drive sync: merged':'Sincronização: versões juntas')+(parts.length?' ('+parts.join(' · ')+')':''),'☁️');}catch(e){}
  if(!rep.conflicts.length)return;
  const lines=rep.conflicts.slice(0,12).map(c=>{const L=SYNC_KEY_LBL[c.key];return '• '+(L?(en?L[1]:L[0]):c.key)+(c.name?' — <b>'+esc(c.name)+'</b>':'');}).join('<br>');
  syncModal((en?'⚠️ Edited on both devices':'⚠️ Editado nos dois dispositivos'),
    (en?'These items were changed here and on another device at the same time. I kept <b>this device\'s version</b>; the other one is in the Drive history (Settings → Data → Version history).':'Estes itens foram alterados aqui e noutro dispositivo ao mesmo tempo. Ficou a <b>versão deste dispositivo</b>; a outra está no histórico do Drive (Definições → Dados → Histórico de versões).')+'<div style="margin-top:12px;line-height:1.9">'+lines+'</div>');
}
function syncModal(title,html,extra){
  let ov=document.getElementById('sync-modal');
  if(!ov){ov=document.createElement('div');ov.id='sync-modal';ov.className='modal-overlay';ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open');});document.body.appendChild(ov);}
  const en=currentLang==='en';
  ov.innerHTML='<div class="modal" style="max-width:520px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div style="font-family:\'Playfair Display\',serif;font-size:1.15rem;color:var(--text)">'+title+'</div><button class="btn btn-ghost" style="padding:6px 12px" data-act="closeSyncModal">'+(en?'Close':'Fechar')+'</button></div><div style="font-size:.74rem;color:var(--text-muted);line-height:1.7">'+html+'</div>'+(extra||'')+'</div>';
  ov.classList.add('open');
  return ov;
}

/* ══ HISTÓRICO NO DRIVE — cópias encriptadas antes de substituir ══
   No máximo 1 cópia a cada 6 h (sempre que há conflito). Mantém: todas das últimas 48 h, 1 por dia até 14 dias,
   1 por mês até 6 meses. As cópias vão para a reciclagem do Drive (recuperáveis 30 dias), nunca apagadas de vez. */
const DRIVE_HIST='Aurora Vault — Histórico';
async function driveHistFolder(interactive){
  const id=dCfg('hist');if(id)return id;
  const q=encodeURIComponent("name='"+DRIVE_HIST+"' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  let r=await dApi('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id)',{},interactive);
  if(r.ok){const j=await r.json();if(j.files&&j.files[0]){dCfg('hist',j.files[0].id);return j.files[0].id;}}
  r=await dApi('https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:DRIVE_HIST,mimeType:'application/vnd.google-apps.folder'})},interactive);
  if(!r.ok)throw new Error('folder '+r.status);
  const j=await r.json();dCfg('hist',j.id);return j.id;
}
async function driveSnapshot(m,interactive,force){
  const fid=dCfg('fid');if(!fid||!m)return false;
  const last=+dCfg('snapAt')||0;
  if(!force&&Date.now()-last<6*3600e3)return false;
  const folder=await driveHistFolder(interactive);
  const d=new Date(m.modifiedTime||Date.now()),z=n=>String(n).padStart(2,'0');
  const name='ciphervault '+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+' '+z(d.getHours())+'h'+z(d.getMinutes())+'.vault';
  const r=await dApi('https://www.googleapis.com/drive/v3/files/'+fid+'/copy?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,parents:[folder],description:'Aurora Vault — cópia automática (encriptada)'})},interactive);
  if(!r.ok)throw new Error('copy '+r.status);
  dCfg('snapAt',String(Date.now()));
  driveHistPrune(interactive).catch(()=>{});
  return true;
}
async function driveHistList(interactive){
  const folder=await driveHistFolder(interactive);
  const q=encodeURIComponent("'"+folder+"' in parents and trashed=false");
  const r=await dApi('https://www.googleapis.com/drive/v3/files?q='+q+'&orderBy=createdTime%20desc&pageSize=200&fields=files(id,name,createdTime,size)',{},interactive);
  if(!r.ok)throw new Error('list '+r.status);
  const j=await r.json();
  return (j.files||[]).sort((a,b)=>new Date(b.createdTime)-new Date(a.createdTime));
}
function driveHistToPrune(files,now){
  now=now||Date.now();const keep=new Set(),seenDay=new Set(),seenMonth=new Set(),H=3600e3;
  files.slice().sort((a,b)=>new Date(b.createdTime)-new Date(a.createdTime)).forEach(f=>{
    const t=new Date(f.createdTime).getTime(),age=now-t,d=new Date(t),day=d.toISOString().slice(0,10),mon=day.slice(0,7);
    if(age<=48*H){keep.add(f.id);return;}
    if(age<=14*24*H){if(!seenDay.has(day)){seenDay.add(day);keep.add(f.id);}return;}
    if(age<=183*24*H){if(!seenMonth.has(mon)){seenMonth.add(mon);keep.add(f.id);}return;}
  });
  return files.filter(f=>!keep.has(f.id));
}
async function driveHistPrune(interactive){
  const files=await driveHistList(interactive);
  for(const f of driveHistToPrune(files)){
    try{await dApi('https://www.googleapis.com/drive/v3/files/'+f.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed:true})},interactive);}catch(e){}
  }
}
async function openSyncHistory(){
  const en=currentLang==='en';
  if(!driveOn()){toast(en?'Drive sync is off.':'A sincronização com o Drive está desligada.');return;}
  if(!navigator.onLine){toast(en?'No Internet connection.':'Sem ligação à Internet.');return;}
  syncModal(en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive',en?'Loading…':'A carregar…');
  try{
    const files=await driveHistList(true);
    const fmtD=s=>new Date(s).toLocaleString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const rows=files.map(f=>'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)"><div><div style="color:var(--text);font-size:.78rem">'+esc(fmtD(f.createdTime))+'</div><div style="font-size:.62rem;opacity:.7">'+Math.max(1,Math.round((+f.size||0)/1024))+' KB</div></div><button class="btn btn-ghost" style="padding:7px 14px;font-size:.7rem" data-act="syncRestoreFrom" data-arg="'+esc(f.id)+'" data-arg2="'+esc(fmtD(f.createdTime))+'">'+(en?'Restore':'Restaurar')+'</button></div>').join('');
    syncModal(en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive',
      (en?'Encrypted copies kept automatically before Drive is overwritten (all from the last 48 h, one per day for 14 days, one per month for 6 months). Restoring loads that version here — then save to confirm.':'Cópias encriptadas guardadas automaticamente antes de o Drive ser substituído (todas das últimas 48 h, uma por dia durante 14 dias, uma por mês durante 6 meses). Restaurar carrega essa versão aqui — depois gravas para confirmar.')
      +'<div style="margin-top:10px">'+(rows||'<div style="padding:14px 0">'+(en?'No copies yet — the first one is made on the next save.':'Ainda não há cópias — a primeira é feita na próxima gravação.')+'</div>')+'</div>');
  }catch(e){syncModal(en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive',(en?'Could not read the history: ':'Não consegui ler o histórico: ')+esc(e.message||''));}
}
async function syncRestoreFrom(id,label){
  const en=currentLang==='en';
  if(!confirm(en?`Replace the current vault with the version from ${label}?\n\nThe current version is kept in the local history.`:`Substituir o cofre atual pela versão de ${label}?\n\nA versão atual fica guardada no histórico local.`))return;
  try{
    const r=await dApi('https://www.googleapis.com/drive/v3/files/'+id+'?alt=media',{},true);
    if(!r.ok)throw new Error('download '+r.status);
    const txt=await r.text();
    let data;
    try{data=await syncDecrypt(txt,masterPwRaw);}
    catch(e){const pw=prompt(en?'This copy uses a different master password. Enter the password used at that time:':'Esta cópia usa outra palavra-passe mestra. Escreve a palavra-passe usada nessa altura:');if(!pw)return;data=await syncDecrypt(txt,pw);}
    try{if(pendingVaultText)await pushSnapshot(JSON.parse(pendingVaultText));}catch(e){}
    const totpDiff=!syncEq(data.totpEnc,totpEnc)||!syncEq(data.totpRecWrap,totpRecWrap);
    syncApplyData(data);
    if(totpDiff&&totpRecWrap){totpKey=null;totpUnlocked=false;totp=[];}
    markUnsaved();renderAll();
    const ov=document.getElementById('sync-modal');if(ov)ov.classList.remove('open');
    toast(en?`Version from ${label} restored — save to confirm.`:`Versão de ${label} restaurada — grava para confirmar.`);
  }catch(e){toast((en?'Could not restore: ':'Não consegui restaurar: ')+(e.message||''));}
}
window.addEventListener('online',()=>{setTimeout(()=>{try{driveFlushPending();}catch(e){}try{driveCheckOnFocus();}catch(e){}},1500);});

// ── sincronizar agora (botão da barra) ──
async function driveSyncNow(){
  const en=currentLang==='en';
  if(!driveOn()){toast(en?'Drive sync is off — turn it on in Settings.':'Sincronização desligada — liga nas Definições.');return;}
  if(!navigator.onLine){toast(en?'No Internet connection.':'Sem ligação à Internet.');return;}
  toast(en?'Checking Drive…':'A verificar o Drive…');
  try{
    const loaded=await driveCheckOnOpen();
    if(!loaded)toast(en?'Already up to date ✓':'Já estava atualizado ✓');
  }catch(e){toast(en?'Sync failed.':'A sincronização falhou.');}
}

// ── indicador na barra de topo ──
function renderDriveChip(state){
  const el=document.getElementById('drive-chip');if(!el)return;
  const sb=document.getElementById('drive-sync-btn');if(sb)sb.style.display=driveOn()?'inline-flex':'none';
  if(!driveOn()){el.style.display='none';return;}
  el.style.display='inline-flex';
  const en=currentLang==='en';
  if(driveBusy){el.textContent='☁️ …';el.title=en?'Syncing':'A sincronizar';el.style.color='var(--text-muted)';return;}
  const map={
    ok:['☁️ ✓',en?'Synced with Drive':'Sincronizado com o Drive','var(--green)'],
    pend:['☁️ !',en?'Changes pending upload':'Alterações por enviar','var(--accent)'],
    old:['☁️ ↓',en?'Newer version on Drive':'Há versão mais recente no Drive','var(--accent)'],
    off:['☁️ ✕',en?'No connection to Drive':'Sem ligação ao Drive','var(--text-muted)']
  };
  const s=map[state]||map.ok;
  el.textContent=s[0];el.title=s[1];el.style.color=s[2];
}

// ── definições ──
function renderDriveSettings(){
  const box=document.getElementById('drive-state');if(!box)return;
  const en=currentLang==='en';
  const cid=dCfg('cid'),fid=dCfg('fid');
  const inp=document.getElementById('drive-cid');if(inp&&!inp.value)inp.value=cid;
  let s;
  if(!cid)s=en?'Not configured — paste your Google credential above.':'Por configurar — cola a tua credencial da Google acima.';
  else if(!fid)s=en?'Credential saved. Now upload the current vault to Drive.':'Credencial guardada. Falta enviar o cofre atual para o Drive.';
  else if(driveOn())s=(en?'Active. File on Drive: ':'Ativo. Ficheiro no Drive: ')+DRIVE_NAME+(dCfg('mtime')?(en?' · last sync ':' · última sync ')+new Date(dCfg('mtime')).toLocaleString(en?'en-GB':'pt-PT'):'');
  else s=en?'Configured but switched off.':'Configurado mas desligado.';
  box.textContent=s;
  const hb=document.getElementById('drive-hist-btn');if(hb){hb.style.display=fid?'':'none';hb.textContent=en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive';}
  const b=document.getElementById('drive-toggle-btn');
  if(b)b.textContent=driveOn()?(en?'Turn off sync':'Desligar sincronização'):(en?'Turn on sync':'Ligar sincronização');
  renderDriveChip();
}
function saveDriveCid(){
  const en=currentLang==='en';
  const v=(document.getElementById('drive-cid').value||'').trim();
  dCfg('cid',v||null);
  toast(v?(en?'Credential saved.':'Credencial guardada.'):(en?'Credential removed.':'Credencial removida.'));
  renderDriveSettings();
}
// ── ligar a um ficheiro já existente no Drive (em vez de criar um novo) ──
async function driveListMatches(){
  const q=encodeURIComponent("name='"+DRIVE_NAME+"' and trashed=false");
  const r=await dApi('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id,name,modifiedTime,size,mimeType,shortcutDetails)&orderBy=modifiedTime desc',{},true);
  if(!r.ok)throw new Error('list '+r.status);
  const j=await r.json();
  const files=j.files||[];
  // Atalhos: usar o ficheiro real a que apontam (id + data reais)
  const out=[];
  for(const f of files){
    if(f.mimeType==='application/vnd.google-apps.shortcut'&&f.shortcutDetails&&f.shortcutDetails.targetId){
      try{
        const r2=await dApi('https://www.googleapis.com/drive/v3/files/'+f.shortcutDetails.targetId+'?fields=id,name,modifiedTime,size',{},false);
        if(r2.ok){out.push(await r2.json());continue;}
      }catch(e){}
    }else if(f.mimeType!=='application/vnd.google-apps.shortcut'){
      out.push(f);
    }
  }
  // remover duplicados (mesmo ficheiro real encontrado por 2 vias) e ordenar por data
  const seen=new Set();
  return out.filter(f=>{if(seen.has(f.id))return false;seen.add(f.id);return true;})
            .sort((a,b)=>new Date(b.modifiedTime)-new Date(a.modifiedTime));
}
async function driveOpenLinkPicker(){
  const en=currentLang==='en';
  if(!masterKey){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  if(!dCfg('cid')){toast(en?'Paste the credential first.':'Cola a credencial primeiro.');return;}
  const box=document.getElementById('drive-link-list');
  if(!box)return;
  box.innerHTML='<div class="fuel-hint">'+(en?'Searching Drive…':'A procurar na Drive…')+'</div>';
  document.getElementById('drive-link-overlay').classList.add('open');
  try{
    const files=await driveListMatches();
    if(!files.length){
      box.innerHTML='<div class="fuel-hint">'+(en?'No ciphervault.vault file found on Drive.':'Não foi encontrado nenhum ficheiro ciphervault.vault na Drive.')+'</div>';
      return;
    }
    box.innerHTML=files.map(f=>{
      const d=new Date(f.modifiedTime);
      const ds=d.toLocaleString(en?'en-GB':'pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
      const isCurrent=f.id===dCfg('fid');
      const kb=f.size?(parseInt(f.size)/1024).toFixed(0)+' KB':'';
      return '<div class="fuel-row" style="flex-direction:column;align-items:flex-start;gap:6px'+(isCurrent?';border-color:var(--accent-dim)':'')+'">'+
        '<span class="fuel-main">'+(isCurrent?'⭐ ':'')+(en?'Modified':'Modificado')+': '+ds+' · '+kb+'</span>'+
        '<div style="display:flex;gap:6px;width:100%">'+
          '<button type="button" class="att-btn" style="flex:1" data-act="driveLinkExisting" data-arg="'+esc(f.id)+'">'+(en?'Load this':'Carregar este')+'</button>'+
          '<button type="button" class="att-btn" style="flex:1" data-act="driveLinkKeepLocal" data-arg="'+esc(f.id)+'">'+(en?'Use, keep my current data':'Usar, manter os meus dados')+'</button>'+
        '</div>'+
      '</div>';
    }).join('')+'<div class="fuel-hint" style="margin-top:8px">'+(en?'"Load this" replaces what is on screen with that version. "Use, keep my current data" points to that file but uploads what you have now on your next save.':'"Carregar este" substitui o que está no ecrã por essa versão. "Usar, manter os meus dados" aponta para esse ficheiro mas envia o que tens agora na próxima gravação.')+'</div>';
  }catch(e){
    box.innerHTML='<div class="fuel-hint">'+(en?'Search failed.':'A procura falhou.')+'</div>';
  }
}
function closeDriveLinkPicker(){document.getElementById('drive-link-overlay').classList.remove('open');}
async function driveLinkExisting(fid){
  const en=currentLang==='en';
  closeDriveLinkPicker();
  if(!confirm(en?'Load this version and use it from now on? Your current screen will be replaced.':'Carregar esta versão e passar a usá-la a partir de agora? O que tens no ecrã é substituído.'))return;
  try{
    dCfg('fid',fid);
    driveBusy=true;renderDriveChip();
    const txt=await driveDownload(true);
    await applyContainerText(txt);
    const m=await driveMeta(false);
    if(m&&m.modifiedTime)dCfg('mtime',m.modifiedTime);
    dCfg('on','1');
    driveBusy=false;renderDriveChip('ok');
    toast(en?'Linked. This is now the file in use.':'Ligado. Este passa a ser o ficheiro em uso.');
    renderDriveSettings();
  }catch(e){
    driveBusy=false;renderDriveChip('off');
    toast((en?'Failed: ':'Falhou: ')+e.message);
  }
}
async function driveLinkKeepLocal(fid){
  const en=currentLang==='en';
  closeDriveLinkPicker();
  if(!confirm(en?'Link to this file WITHOUT loading it — what you have on screen now stays, and will overwrite it on your next save. Continue?':'Ligar a este ficheiro SEM o carregar — o que tens agora no ecrã mantém-se, e vai substituir o conteúdo dele na próxima vez que gravares. Continuar?'))return;
  dCfg('fid',fid);dCfg('on','1');dCfg('mtime',null);
  toast(en?'Linked. Save now (💾) to upload your current data.':'Ligado. Grava agora (💾) para enviar os teus dados atuais.');
  renderDriveSettings();renderDriveChip('pend');
}
async function driveFirstUpload(){
  const en=currentLang==='en';
  if(!masterKey){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  if(!dCfg('cid')){toast(en?'Paste the credential first.':'Cola a credencial primeiro.');return;}
  if(!confirm(en?'Upload the current vault to Drive? A new file will be created there.':'Enviar o cofre atual para o Drive? Vai ser criado lá um ficheiro novo.'))return;
  try{
    driveBusy=true;renderDriveChip();
    if(totpUnlocked)totpEnc=await encryptTotpArray();
    const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
    const json=JSON.stringify(mkContainer(ks,p));
    await driveUpload(json,true);
    await localVaultSave(json,false);
    dCfg('on','1');
    driveBusy=false;
    toast(en?'Vault uploaded to Drive.':'Cofre enviado para o Drive.');
    renderDriveSettings();
  }catch(e){
    driveBusy=false;renderDriveChip('off');
    toast((en?'Failed: ':'Falhou: ')+e.message);
  }
}
function driveToggle(){
  const en=currentLang==='en';
  if(driveOn()){dCfg('on',null);toast(en?'Sync off.':'Sincronização desligada.');}
  else{
    if(!dCfg('cid')||!dCfg('fid')){toast(en?'Configure and upload first.':'Configura e envia o cofre primeiro.');return;}
    dCfg('on','1');toast(en?'Sync on.':'Sincronização ligada.');
  }
  renderDriveSettings();
}
function driveForget(){
  const en=currentLang==='en';
  if(!confirm(en?'Disconnect Drive? The file stays there; the app just stops using it.':'Desligar o Drive? O ficheiro fica lá; a app é que deixa de o usar.'))return;
  ['cid','fid','on','mtime'].forEach(k=>dCfg(k,null));
  driveToken=null;driveTokenExp=0;
  const inp=document.getElementById('drive-cid');if(inp)inp.value='';
  renderDriveSettings();
  toast(en?'Disconnected.':'Desligado.');
}

function vaultPayload(){
  const base={fmt:VAULT_FMT,vault,notes,bankCards,activityLog,documents,trash,customCats,docFolders,vaultFolders,wifiNets,legacyNote,legacyOwner,personalInfo,subscriptions,storeCards,vaultName,assets,savedAt:Date.now()};
  if(totpRecWrap){
    base.totpEnc=totpEnc;
    base.totpRecWrap=totpRecWrap;
  }else{
    base.totp=totp;
  }
  return Object.assign({},payloadExtras,base);
}
async function downloadBackupNow(){
  const en=currentLang==='en';
  if(presentationMode){toast(en?'Demo mode — nothing is saved.':'Modo demonstração — nada é guardado.');return;}
  if(!masterKey){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  if(vaultReadOnly){alert(en?'Blocked: vault from a newer app version.':'Bloqueado: cofre de uma versão mais recente da app.');return;}
  try{
    if(totpUnlocked)totpEnc=await encryptTotpArray();
    const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
    const container=mkContainer(ks,p);
    const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    const stamp=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    downloadVault(container,`ciphervault_backup_${stamp}.vault`);
    toast(en?'Backup downloaded ✓':'Cópia descarregada ✓');
  }catch(e){
    toast(en?'Could not create the backup.':'Não foi possível criar a cópia.');
  }
}
// Uma gravação de cada vez: uma automática e uma manual em paralelo podiam acabar por escrever a versão
// mais antiga por último no ficheiro.
let _saveQ=Promise.resolve();
function saveFile(opts){const run=_saveQ.then(()=>saveFileRun(opts));_saveQ=run.catch(()=>{});return run;}
// Só dá o cofre como gravado se nada mudou entretanto (antes, o que se alterava durante a gravação ficava por gravar sem aviso)
function markSavedAt(seq){
  markSaved();
  if(avSeq!==seq){hasUnsaved=true;const b=document.querySelector('.btn-save-file');if(b)b.classList.add('has-changes');try{avRenderSaveState();avScheduleAutoSave();}catch(e){}}
}
async function saveFileRun(opts){
  const auto=!!(opts&&opts.auto);
  if(presentationMode){if(auto)return;toast(currentLang==='en'?'Demo mode — nothing is saved.':'Modo demonstração — nada é guardado.');return;}
  if(!masterKey)return;
  if(vaultReadOnly){
    if(auto)return;
    alert(currentLang==='en'
      ?'Saving is blocked: this vault comes from a newer version of the app. Update Aurora Vault first.'
      :'Gravação bloqueada: este cofre vem de uma versão mais recente da app. Atualiza o Aurora Vault primeiro.');
    return;
  }
  if(totpUnlocked&&(!totpEnc||syncStable(totp)!==totpSig))totpEnc=await encryptTotpArray();
  const seq=avSeq;
  const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
  const container=mkContainer(ks,p);
  const json=JSON.stringify(container);pendingVaultText=json;
  const dateStr=new Date().toISOString().slice(0,10);
  lastSavedAt=Date.now();
  let snapAt=0;try{snapAt=+localStorage.getItem('av_snap_at')||0;}catch(e){}
  if(!auto||Date.now()-snapAt>10*60e3){pushSnapshot(container);try{localStorage.setItem('av_snap_at',String(Date.now()));}catch(e){}}
  try{await localVaultSave(json,!driveOn());}catch(e){}
  if(!auto){try{driveAfterSave(json);}catch(e){}avLastDriveUp=Date.now();}
  if(auto){ // gravação automática: nunca abre janelas nem descarrega ficheiros
    let wrote=false,synced=false;
    if(vaultFileHandle){try{if((await vaultFileHandle.queryPermission({mode:'readwrite'}))==='granted'){const w=await vaultFileHandle.createWritable();await w.write(json);await w.close();wrote=true;}}catch(e){}}
    else if(!FSA_OK){try{const l=await localVaultGet();wrote=!!l&&l.json===json;}catch(e){}if(wrote){avDevPersist();avMarkChange();}}
    if(driveOn()){
      const since=Date.now()-avLastDriveUp;
      if(wrote&&since<30000){try{await localVaultSave(json,true);}catch(e){}avDriveFlushLater(30000-since);}
      else{try{await driveAfterSave(json);}catch(e){}try{const loc=await localVaultGet();synced=!(loc&&loc.pending);}catch(e){}avLastDriveUp=Date.now();}
    }
    if(wrote||synced)markSavedAt(seq);
    return {wrote,synced};
  }
  // Sem handle mas com API: escolher onde guardar (uma vez)
  if(!vaultFileHandle&&FSA_OK){
    try{
      vaultFileHandle=await window.showSaveFilePicker({suggestedName:'ciphervault.vault',types:[{description:'Aurora Vault',accept:{'application/octet-stream':['.vault']}}]});
      try{await idbSet('vaultHandle',vaultFileHandle);}catch(e){}
    }catch(e){/* cancelou o picker → cai no download */}
  }
  if(vaultFileHandle){
    try{
      let perm=await vaultFileHandle.queryPermission({mode:'readwrite'});
      if(perm!=='granted')perm=await vaultFileHandle.requestPermission({mode:'readwrite'});
      if(perm==='granted'){
        const w=await vaultFileHandle.createWritable();
        await w.write(json);await w.close();
        let bk='';
        try{
          if(localStorage.getItem('cv_lastbk')!==dateStr){
            downloadVault(container,`ciphervault_backup_${dateStr}.vault`);
            localStorage.setItem('cv_lastbk',dateStr);
            bk=currentLang==='en'?' (+ daily backup)':' (+ backup do dia)';
          }
        }catch(e){}
        toast(`💾 ${currentLang==='en'?'Saved to':'Guardado em'} ${vaultFileHandle.name}${bk} ✓`);
        markSavedAt(seq);return;
      }
    }catch(e){/* falhou escrita direta → fallback download */}
  }
  if(!FSA_OK){ // browser sem acesso direto a ficheiros → o cofre vive (encriptado) no armazenamento da app neste dispositivo
    let ok=false;try{const l=await localVaultGet();ok=!!l&&l.json===json;}catch(e){}
    if(ok){avDevPersist();avMarkChange();markSavedAt(seq);toast(currentLang==='en'?'💾 Saved on this device ✓':'💾 Guardado neste dispositivo ✓');setTimeout(()=>{try{avAutoBackupMaybe();}catch(e){}},600);return;}
  }
  downloadVault(container,'ciphervault.vault');
  setTimeout(()=>downloadVault(container,`ciphervault_backup_${dateStr}.vault`),400);
  markSavedAt(seq);
  if(FSA_OK&&vaultFileHandle){
    alert(currentLang==='en'
      ?'⚠️ Could not write to your .vault file directly (permission denied or file moved).\n\nA copy was downloaded to your Downloads folder instead. Your original file was NOT updated — replace it with the downloaded copy, or use "Open Vault" to pick it again.'
      :'⚠️ Não foi possível escrever diretamente no teu ficheiro .vault (permissão negada ou ficheiro movido).\n\nFoi descarregada uma cópia para as Transferências. O teu ficheiro original NÃO foi atualizado — substitui-o pela cópia descarregada, ou usa "Abrir Cofre" para o escolher outra vez.');
  }else toast(t('toastSaved'));
}
window.addEventListener('beforeunload',e=>{if(hasUnsaved&&masterKey&&!presentationMode){e.preventDefault();e.returnValue=currentLang==='en'?'You have unsaved changes. Are you sure you want to leave?':'Tens alterações não guardadas. Tens a certeza que queres sair?';return e.returnValue;}});
// Descarrega e liberta o URL (antes nunca era revogado: cada gravação/exportação deixava uma cópia do ficheiro presa em memória)
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{try{document.body.removeChild(a);}catch(e){}URL.revokeObjectURL(url);},10000);
}
function downloadVault(c,filename='ciphervault.vault'){
  downloadBlob(new Blob([JSON.stringify(c)],{type:'application/octet-stream'}),filename);
}

// ══ CSV IMPORT ══
let pendingImportData=[];
// CSV (RFC 4180): aspas escapadas ("") e campos com vírgulas ou quebras de linha.
// O parser antigo partia por linhas e trocava o estado a cada aspa: «pa""ss» ficava «pass» (password corrompida).
function parseCSV(text){
  const rows=[];let row=[],cur='',inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){if(text[i+1]==='"'){cur+='"';i++;}else inQ=false;}
      else cur+=c;
    }else if(c==='"')inQ=true;
    else if(c===','){row.push(cur);cur='';}
    else if(c==='\n'||c==='\r'){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(cur);cur='';
      if(row.some(v=>v.trim()))rows.push(row);
      row=[];
    }else cur+=c;
  }
  row.push(cur);if(row.some(v=>v.trim()))rows.push(row);
  return rows;
}
// Colunas pelo nome do cabeçalho (Chrome, Edge, Firefox, Bitwarden, 1Password…); sem cabeçalho: ordem do Chrome
function csvColumns(first){
  const H=first.map(h=>h.trim().toLowerCase().replace(/^\uFEFF/,''));
  const find=(...ks)=>H.findIndex(h=>ks.includes(h));
  const c={name:find('name','title','nome','account'),url:find('url','login_uri','website','web site','uri','origin'),
    user:find('username','login_username','user','user name','email','login','utilizador'),
    pw:find('password','login_password','pass','palavra-passe'),note:find('note','notes','extra','comments','nota','notas')};
  if(c.pw>=0&&(c.user>=0||c.url>=0||c.name>=0))return{c,header:true};
  return{c:{name:0,url:1,user:2,pw:3,note:4},header:false};
}
function avUid(){const b=crypto.getRandomValues(new Uint8Array(6));return Date.now().toString(36)+'_'+Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('csv-input-app').addEventListener('change',importCSV);});
function importCSV(e){
  const file=(e.target||document.getElementById('csv-input-app')).files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const rows=parseCSV(String(ev.target.result||''));
    if(!rows.length){toast(currentLang==='en'?'Empty CSV!':'CSV vazio!');return;}
    pendingImportData=[];
    const {c,header}=csvColumns(rows[0]);
    const cell=(r,i)=>i>=0&&i<r.length?r[i]:'';
    rows.slice(header?1:0).forEach(r=>{
      const pw=cell(r,c.pw);   // a password não é aparada: espaços podem fazer parte dela
      if(!pw)return;
      const url=cell(r,c.url).trim(),user=cell(r,c.user).trim();
      pendingImportData.push({name:cell(r,c.name).trim()||url||'Importado',url,user,pw,notes:cell(r,c.note).trim()});
    });
    document.getElementById('csv-input-app').value='';
    if(!pendingImportData.length){toast(currentLang==='en'?'No valid entries found!':'Nenhuma entrada válida!');return;}
    const count=pendingImportData.length;
    document.getElementById('import-preview').innerHTML=`
      <div style="font-size:.62rem;color:var(--text-muted);margin-bottom:14px;line-height:1.8">
        ${currentLang==='en'?`Found <strong style="color:var(--accent-ink)">${count}</strong> entries.<br>⚠️ <strong style="color:var(--red)">Delete the CSV file</strong> after importing!`:`Encontradas <strong style="color:var(--accent-ink)">${count}</strong> entradas.<br>⚠️ <strong style="color:var(--red)">Apaga o ficheiro CSV</strong> após importar!`}
      </div>
      <div style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:5px">
        ${pendingImportData.slice(0,8).map(e=>`<div style="background:var(--bg);border:1px solid var(--border);border-radius:2px;padding:7px 11px;font-size:.62rem"><span style="color:var(--accent-ink)">${esc(e.name)}</span> <span style="color:var(--text-muted)">${esc(e.user)}</span></div>`).join('')}
        ${pendingImportData.length>8?`<div style="font-size:.58rem;color:var(--text-muted);text-align:center;padding:5px">...+${pendingImportData.length-8}</div>`:''}
      </div>`;
    document.getElementById('import-overlay').classList.add('open');
  };
  reader.readAsText(file);
}
function confirmImport(){
  // ids com parte aleatória a sério: no mesmo milissegundo, 3 caracteres aleatórios repetiam-se em importações grandes
  // (ids iguais → apagar/editar uma entrada afetava a outra e a sincronização descartava uma delas)
  const now=Date.now();
  pendingImportData.forEach(e=>{vault.push({id:avUid(),name:e.name,cat:'outro',user:e.user,pw:e.pw,url:e.url,notes:e.notes||'',tags:[],fav:false,archived:false,createdAt:now,order:vault.length,pwUpdated:now});});
  const count=pendingImportData.length;pendingImportData=[];closeImport();
  if(count)logActivity('add',(currentLang==='en'?`CSV import (${count})`:`Importação CSV (${count})`),'📥');
  renderAll();
  if(count)markUnsaved();   // antes não marcava: a importação podia perder-se ao fechar a app (sem aviso nem gravação automática)
  toast(currentLang==='en'?`${count} entries imported! ✓`:`${count} entradas importadas! ✓`);
}
function closeImport(){document.getElementById('import-overlay').classList.remove('open');pendingImportData=[];}

// ══ EXPORT PDF ══
async function exportPDF(){
  if(!await avPlainExportOk('PDF'))return;
  // Ask for user name
  const userName=prompt(currentLang==='en'?'Your name (for the document):':'O teu nome (para o documento):','') || 'Aurora Vault';
  const active=vault.filter(e=>!e.archived);
  const now=new Date();
  const dateStr=now.toLocaleDateString(currentLang==='pt'?'pt-PT':'en-GB',{year:'numeric',month:'long',day:'numeric'});
  const timeStr=now.toLocaleTimeString(currentLang==='pt'?'pt-PT':'en-GB',{hour:'2-digit',minute:'2-digit'});

  // Group by category (built-ins + customs)
  const groups=allEntryCats().map(ci=>({...ci,entries:[]}));
  const gOutro=groups.find(g=>g.key==='outro');
  active.forEach(e=>{(groups.find(g=>g.key===e.cat)||gOutro).entries.push(e);});

  let sectionsHtml='';
  groups.forEach(g=>{
    const entries=g.entries;
    if(!entries.length)return;
    const rows=entries.map((e,i)=>`
      <tr class="${i%2===0?'even':'odd'}">
        <td><strong>${esc(e.name)}</strong></td>
        <td>${esc(e.user||'—')}</td>
        <td style="font-family:'Courier New',monospace;font-size:11px">${esc(e.pw||'—')}</td>
        <td style="font-size:11px;color:#666">${esc(e.url||'—')}</td>
        <td style="font-size:11px;color:#666">${e.pwUpdated?Math.floor((Date.now()-e.pwUpdated)/86400000)+' '+(currentLang==='en'?'days':'dias'):'—'}</td>
      </tr>`).join('');
    sectionsHtml+=`
      <div class="section">
        <h2 style="color:${g.color};border-bottom:2px solid ${g.color};padding-bottom:6px;margin-bottom:12px">
          ${g.icon} ${esc(g.label)} <span style="font-size:13px;color:#999;font-weight:400">(${entries.length})</span>
        </h2>
        <table>
          <thead><tr>
            <th>${currentLang==='en'?'Name':'Nome'}</th>
            <th>${currentLang==='en'?'Username':'Utilizador'}</th>
            <th>Password</th>
            <th>URL</th>
            <th>${currentLang==='en'?'Age':'Idade'}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  });

  const html=`<!DOCTYPE html>
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<title>Aurora Vault — ${esc(userName)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#fff;color:#222;padding:0;}
  .page{max-width:900px;margin:0 auto;padding:40px;}
  .header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #c9a84c;}
  .header-left h1{font-family:'Playfair Display',serif;font-size:32px;color:#8a6520;letter-spacing:3px;margin-bottom:4px;}
  .header-left p{color:#999;font-size:12px;letter-spacing:2px;text-transform:uppercase;}
  .header-right{text-align:right;font-size:12px;color:#999;}
  .header-right strong{color:#222;display:block;font-size:15px;margin-bottom:2px;}
  .warn{background:#fffbf0;border-left:4px solid #c9a84c;padding:12px 16px;margin-bottom:28px;font-size:12px;color:#7a5a10;border-radius:0 4px 4px 0;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
  .stat{background:#f8f5f0;border-radius:6px;padding:14px;text-align:center;}
  .stat-num{font-family:'Playfair Display',serif;font-size:28px;color:#c9a84c;}
  .stat-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-top:3px;}
  .section{margin-bottom:28px;page-break-inside:avoid;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:#f5f0e8;padding:9px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:2px solid #e8e0d0;}
  td{padding:8px 10px;border-bottom:1px solid #f0ece6;}
  tr.even td{background:#fdfcfa;}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e0dcd6;display:flex;justify-content:space-between;font-size:11px;color:#aaa;}
  @media print{.warn{-webkit-print-color-adjust:exact;print-color-adjust:exact;}th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>⬡ AURORA VAULT</h1>
      <p>${currentLang==='en'?'Encrypted Credential Export':'Exportação de Credenciais Encriptadas'}</p>
    </div>
    <div class="header-right">
      <strong>${esc(userName)}</strong>
      ${dateStr} • ${timeStr}
    </div>
  </div>
  <div class="warn">⚠️ ${currentLang==='en'?'This document contains sensitive information. Store it securely, do not share it, and delete it after use.':'Este documento contém informação sensível. Guarda-o em segurança, não o partilhes e apaga-o após uso.'}</div>
  <div class="stats">
    <div class="stat"><div class="stat-num">${active.length}</div><div class="stat-label">${currentLang==='en'?'Total':'Total'}</div></div>
    <div class="stat"><div class="stat-num">${active.filter(e=>e.fav).length}</div><div class="stat-label">${currentLang==='en'?'Favourites':'Favoritos'}</div></div>
    <div class="stat"><div class="stat-num">${groups.filter(g=>g.entries.length>0).length}</div><div class="stat-label">${currentLang==='en'?'Categories':'Categorias'}</div></div>
    <div class="stat"><div class="stat-num">${notes.length}</div><div class="stat-label">${currentLang==='en'?'Notes':'Notas'}</div></div>
  </div>
  ${sectionsHtml}
  <div class="footer">
    <span>Aurora Vault © 2026 — ${currentLang==='en'?'Generated by':'Gerado por'} ${esc(userName)}</span>
    <span>${currentLang==='en'?'All data is encrypted with AES-256-GCM':'Todos os dados encriptados com AES-256-GCM'}</span>
  </div>
</div>
</body></html>`;

  downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),`ciphervault_${userName.replace(/[\s\\/:*?"<>|]+/g,'_')}_${now.toISOString().slice(0,10)}.html`);
  toast(currentLang==='en'?'PDF ready! Open in browser → Print → Save as PDF':'PDF pronto! Abre no browser → Imprimir → Guardar como PDF');
}

// ══ DOCUMENTS ══
let documents=[];let editingDocId=null;let pendingDocFile=null;
let personalInfo=[];let editingInfoId=null;
let subscriptions=[];let editingSubId=null;
let storeCards=[];let editingStoreId=null;
let assets=[];let editingAssetId=null;let currentAssetKind='warranty';
let vaultName='';

const DOC_CATS={
  pessoal:{icon:'👤',label:{pt:'Pessoal',en:'Personal'}},
  trabalho:{icon:'💼',label:{pt:'Trabalho',en:'Work'}},
  banco:{icon:'🏦',label:{pt:'Banco',en:'Bank'}},
  saude:{icon:'🏥',label:{pt:'Saúde',en:'Health'}},
  juridico:{icon:'⚖️',label:{pt:'Jurídico',en:'Legal'}},
  educacao:{icon:'🎓',label:{pt:'Educação',en:'Education'}},
  outro:{icon:'📋',label:{pt:'Outro',en:'Other'}},
};
const FILE_ICONS={
  pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',
  png:'🖼️',jpg:'🖼️',jpeg:'🖼️',gif:'🖼️',webp:'🖼️',
  txt:'📃',csv:'📊',zip:'🗜️',default:'📎'
};
function getFileIcon(name){
  if(!name)return FILE_ICONS.default;
  const ext=name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext]||FILE_ICONS.default;
}
function formatFileSize(bytes){
  if(bytes<1024)return bytes+'B';
  if(bytes<1024*1024)return (bytes/1024).toFixed(1)+'KB';
  return (bytes/(1024*1024)).toFixed(1)+'MB';
}
function populateDocCatSelect(){
  const sel=document.getElementById('doc-cat');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=Object.entries(DOC_CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label[currentLang]||v.label.pt}</option>`).join('');
  if(cur&&[...sel.options].some(o=>o.value===cur))sel.value=cur;
}
function getDocCatLabel(cat){
  return (DOC_CATS[cat]?.label[currentLang]||cat);
}

let currentDocFilter='all';

function openDocModal(id=null){
  editingDocId=id;pendingDocFile=null;
  const isEdit=!!id;
  document.getElementById('doc-modal-title').textContent=isEdit?
    (currentLang==='en'?'📁 Edit Document':'📁 Editar Documento'):
    (currentLang==='en'?'📁 New Document':'📁 Novo Documento');
  if(isEdit){
    const d=documents.find(d=>d.id===id);
    document.getElementById('doc-title-input').value=d.title||'';
    document.getElementById('doc-cat').value=d.cat||'outro';
    document.getElementById('doc-date').value=d.date||'';
    document.getElementById('doc-expiry').value=d.expiry||'';
    document.getElementById('doc-desc').value=d.desc||'';
    populateDocCatSelect();
    document.getElementById('doc-cat').value=d.cat||'outro';
    populateFolderSelect(d.folderId||'');
    if(d.file){pendingDocFile=d.file;showDocFilePreview(d.file.name,d.file.size,d.file.type);}
    else{clearDocFile();}
  }else{
    ['doc-title-input','doc-date','doc-expiry','doc-desc'].forEach(i=>document.getElementById(i).value='');
    populateDocCatSelect();
    document.getElementById('doc-cat').value='pessoal';
    populateFolderSelect(currentFolderId||'');
    clearDocFile();
  }
  document.getElementById('doc-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('doc-title-input').focus(),100);
}
function closeDocModal(){document.getElementById('doc-overlay').classList.remove('open');editingDocId=null;pendingDocFile=null;}

function handleDocFileSelect(e){
  const file=e.target.files[0];if(!file)return;
  readDocFile(file);
  e.target.value='';
}
function handleDocFileDrop(e){
  e.preventDefault();
  document.getElementById('doc-drop-zone').style.borderColor='var(--border)';
  const file=e.dataTransfer?.files[0];if(!file)return;
  readDocFile(file);
}
function readDocFile(file){
  const reader=new FileReader();
  reader.onload=ev=>{
    pendingDocFile={name:file.name,size:file.size,type:file.type,data:ev.target.result};
    showDocFilePreview(file.name,file.size,file.type);
  };
  reader.readAsDataURL(file);
}
function showDocFilePreview(name,size,type){
  document.getElementById('doc-drop-zone').style.display='none';
  const preview=document.getElementById('doc-file-preview');
  preview.style.display='block';
  document.getElementById('doc-file-icon').textContent=getFileIcon(name);
  document.getElementById('doc-file-name').textContent=name;
  document.getElementById('doc-file-size').textContent=formatFileSize(size)+(type?` • ${type}`:'');
}
function clearDocFile(){
  pendingDocFile=null;
  document.getElementById('doc-drop-zone').style.display='block';
  document.getElementById('doc-file-preview').style.display='none';
}

function saveDoc(){
  const title=document.getElementById('doc-title-input').value.trim();
  if(!title){toast(currentLang==='en'?'Title is required!':'Título obrigatório!');return;}
  const prev=editingDocId?documents.find(d=>d.id===editingDocId):null;
  const doc={
    ...(prev||{}),
    id:editingDocId||Date.now().toString(36),
    title,cat:document.getElementById('doc-cat').value,
    date:document.getElementById('doc-date').value,
    expiry:document.getElementById('doc-expiry').value,
    desc:document.getElementById('doc-desc').value.trim(),
    folderId:(document.getElementById('doc-folder')?.value||'')||null,
    file:pendingDocFile?{...pendingDocFile}:null,
    createdAt:prev&&prev.createdAt||Date.now(),
  };
  const wasEditing=!!prev;
  const idx=prev?documents.indexOf(prev):-1;
  if(idx>=0)documents[idx]=doc;else documents.push(doc);
  logActivity(wasEditing?'edit':'add',title,'📁');
  closeDocModal();
  setTimeout(()=>{
    renderDocs();
    toast(wasEditing?(currentLang==='en'?'Document updated!':'Documento atualizado!'):(currentLang==='en'?'Document added!':'Documento adicionado!'));
    markUnsaved();
  },50);
}
function deleteDoc(id){
  if(!confirm(currentLang==='en'?'Move this document to the recycle bin?':'Mover este documento para a reciclagem?'))return;
  const d=documents.find(doc=>doc.id===id);
  if(d){logActivity('delete',d.title,'🗑️');trash.unshift({type:'doc',data:d,deletedAt:Date.now()});}
  documents=documents.filter(doc=>doc.id!==id);
  renderDocs();toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}
let docPreviewId=null;
function previewDoc(id){
  const d=documents.find(doc=>doc.id===id);
  if(!d?.file?.data){toast(currentLang==='en'?'No file attached!':'Sem ficheiro anexado!');return;}
  const en=currentLang==='en';
  docPreviewId=id;
  const name=d.file.name||'';
  const ext=(name.split('.').pop()||'').toLowerCase();
  const type=d.file.type||'';
  document.getElementById('docview-title').textContent=d.title||name;
  document.getElementById('docview-sub').textContent=`${name} · ${formatFileSize(d.file.size)}`;
  document.getElementById('docview-dl-txt').textContent=en?'Download':'Transferir';
  const body=document.getElementById('docview-body');
  const isImg=type.startsWith('image/')||['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext);
  const isPdf=type==='application/pdf'||ext==='pdf';
  const isText=type.startsWith('text/')||['txt','csv','md','json','log'].includes(ext);
  if(isImg){
    body.innerHTML=`<img src="${esc(d.file.data)}" alt="${esc(name)}">`;
  }else if(isPdf){
    body.innerHTML=`<iframe src="${esc(d.file.data)}" title="${esc(name)}"></iframe>`;
  }else if(isText){
    try{
      const b64=d.file.data.split(',')[1]||'';
      const txt=decodeURIComponent(escape(atob(b64)));
      body.innerHTML=`<pre></pre>`;
      body.querySelector('pre').textContent=txt;
    }catch(e){
      body.innerHTML=docNoPreview(ext,en);
    }
  }else{
    body.innerHTML=docNoPreview(ext,en);
  }
  document.getElementById('docview-overlay').classList.add('open');
}
function docNoPreview(ext,en){
  const icon=getFileIcon('x.'+ext);
  return `<div class="docview-noprev">
    <div class="dnp-icon">${icon}</div>
    <div class="dnp-title">${en?'Preview not available':'Pré-visualização indisponível'}</div>
    <div class="dnp-text">${en
      ?`Files of type <b>.${esc(ext)}</b> can't be shown in the browser. Download it to open with the right app.`
      :`Ficheiros do tipo <b>.${esc(ext)}</b> não podem ser mostrados no browser. Transfere-o para abrir na app certa.`}</div>
    <button class="btn btn-gold" data-act="downloadDocFromPreview" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      ${en?'Download':'Transferir'}
    </button>
  </div>`;
}
function closeDocPreview(){
  document.getElementById('docview-overlay').classList.remove('open');
  // Libertar o iframe/imagem para não consumir memória
  setTimeout(()=>{const b=document.getElementById('docview-body');if(b&&!document.getElementById('docview-overlay').classList.contains('open'))b.innerHTML='';},250);
  docPreviewId=null;
}
function downloadDocFromPreview(){if(docPreviewId)downloadDoc(docPreviewId);}
function downloadDoc(id){
  const d=documents.find(doc=>doc.id===id);
  if(!d?.file?.data){toast(currentLang==='en'?'No file attached!':'Sem ficheiro anexado!');return;}
  try{
    const a=document.createElement('a');
    a.href=d.file.data;
    a.download=d.file.name;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>document.body.removeChild(a),200);
    toast(currentLang==='en'?'Downloading...':'A transferir...');
  }catch(err){
    toast(currentLang==='en'?'Download failed. Try again.':'Erro no download. Tenta novamente.');
    console.error('Download error:',err);
  }
}

function cardExpiryToDate(mmYY){
  if(!mmYY||!/^\d{2}\/\d{2}$/.test(mmYY))return null;
  const [mm,yy]=mmYY.split('/').map(Number);
  if(mm<1||mm>12)return null;
  // Cartões expiram no último dia do mês indicado
  return new Date(2000+yy,mm,0);
}
let renewalWindow=90;
function setRenewalWindow(days){renewalWindow=days;renderRenewals();}
function renderRenewals(){
  const wrap=document.getElementById('dash-renewals-wrap');
  if(!wrap)return;
  const en=currentLang==='en';
  const title=document.getElementById('dash-renewals-title');
  if(title)title.textContent=en?'📅 Renewals':'📅 Renovações';
  const items=[];
  documents.forEach(d=>{
    if(!d.expiry)return;
    const st=getExpiryStatus(d.expiry);
    if(!st)return;
    items.push({name:d.title||(en?'Document':'Documento'),icon:d.icon||'📄',
      kind:en?'Document':'Documento',date:new Date(d.expiry),iso:d.expiry,status:st,
      go:()=>{switchTab('docs');}});
  });
  bankCards.forEach(cd=>{
    const dt=cardExpiryToDate(cd.expiry);
    if(!dt)return;
    const iso=dt.toISOString().slice(0,10);
    const st=getExpiryStatus(iso);
    if(!st)return;
    items.push({name:cd.name||(en?'Card':'Cartão'),icon:'💳',
      kind:en?'Bank card':'Cartão bancário',date:dt,iso,status:st,
      go:()=>{switchTab('cards');}});
  });
  // Nada com validade em lado nenhum → esconde a secção por completo
  if(!items.length){wrap.style.display='none';return;}
  wrap.style.display='block';
  // Botões de janela temporal
  const windows=[[90,en?'90 days':'90 dias'],[180,en?'6 months':'6 meses'],[365,en?'1 year':'1 ano'],[0,en?'All':'Tudo']];
  const fb=document.getElementById('renewal-filter');
  if(fb)fb.innerHTML=windows.map(([d,lbl])=>`<button class="renewal-filter-btn ${renewalWindow===d?'active':''}" data-act="setRenewalWindow" data-args='[${d}]'>${lbl}</button>`).join('');
  // Filtra pela janela escolhida (0 = tudo)
  const soon=items.filter(i=>renewalWindow===0||i.status.days<=renewalWindow).sort((a,b)=>a.date-b.date);
  if(!soon.length){
    document.getElementById('dash-renewals').innerHTML=`<div class="renewal-empty">${en?`Nothing expiring within this period. Everything is valid further out.`:`Nada a expirar neste período. Está tudo válido para lá disso.`}</div>`;
    return;
  }
  const fmt=dt=>dt.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short',year:'numeric'});
  const humanDur=n=>{
    // Prazos curtos: dias soltos são mais claros que "1 mês 15 dias"
    if(n<60){const dLbl=en?(n===1?'day':'days'):(n===1?'dia':'dias');return `${n} ${dLbl}`;}
    // n em dias → "2 anos 3 meses", "5 meses"
    const years=Math.floor(n/365);
    const rem=n-years*365;
    const months=Math.floor(rem/30);
    const days=rem-months*30;
    const yLbl=en?(years===1?'year':'years'):(years===1?'ano':'anos');
    const mLbl=en?(months===1?'month':'months'):(months===1?'mês':'meses');
    const dLbl=en?(days===1?'day':'days'):(days===1?'dia':'dias');
    if(years>0)return months>0?`${years} ${yLbl} ${months} ${mLbl}`:`${years} ${yLbl}`;
    if(months>0)return days>0?`${months} ${mLbl} ${days} ${dLbl}`:`${months} ${mLbl}`;
    return `${n} ${dLbl}`;
  };
  const whenLabel=st=>{
    const a=Math.abs(st.days);
    if(st.days===0)return en?'today':'hoje';
    if(st.days<0)return en?`${humanDur(a)} ago`:`há ${humanDur(a)}`;
    return en?`in ${humanDur(a)}`:`em ${humanDur(a)}`;
  };
  document.getElementById('dash-renewals').innerHTML=soon.map((i,idx)=>`
    <div class="renewal-row ${i.status.cls}" data-act="_renewalGo" data-args='[${idx}]'>
      <span class="renewal-icon">${i.icon}</span>
      <div class="renewal-body">
        <div class="renewal-name">${esc(i.name)}</div>
        <div class="renewal-meta">${i.kind}</div>
      </div>
      <div class="renewal-when">
        <div class="${i.status.cls}">${whenLabel(i.status)}</div>
        <div class="renewal-date">${fmt(i.date)}</div>
      </div>
    </div>`).join('');
  window._renewalItems=soon;
}
function _renewalGo(idx){
  const it=(window._renewalItems||[])[idx];
  if(it&&it.go)it.go();
}
function getExpiryStatus(expiry){
  if(!expiry)return null;
  const exp=new Date(expiry);const now=new Date();
  const days=Math.floor((exp-now)/86400000);
  if(days<0)return{cls:'expired',label:currentLang==='en'?'Expired':'Expirado',days};
  if(days<=60)return{cls:'soon',label:currentLang==='en'?`Expires in ${days}d`:`Expira em ${days}d`,days};
  return{cls:'ok',label:currentLang==='en'?`Valid ${days}d`:`Válido ${days}d`,days};
}

function renderDocs(){
  // Filter buttons
  const filterRow=document.getElementById('docs-filter-row');
  const allCats=['all',...Object.keys(DOC_CATS)];
  const scope=documents.filter(d=>!d.archived&&(d.folderId||null)===(currentFolderId||null));
  const catCount={};scope.forEach(d=>{catCount[d.cat]=(catCount[d.cat]||0)+1;});
  filterRow.innerHTML=allCats.map(cat=>{
    const count=cat==='all'?scope.length:(catCount[cat]||0);
    if(cat!=='all'&&count===0)return '';
    const label=cat==='all'?(currentLang==='en'?'All':'Todas'):getDocCatLabel(cat);
    return `<button class="doc-filter-btn${currentDocFilter===cat?' active':''}" data-act="setDocFilter" data-arg="${esc(cat)}">${cat==='all'?'📁 ':''}${label} (${count})</button>`;
  }).join('');

  // Breadcrumb
  const en=currentLang==='en';
  const bc=document.getElementById('docs-breadcrumb');
  if(bc){
    const path=folderPath(currentFolderId);
    let html=`<button class="crumb${currentFolderId?'':' current'}" ${currentFolderId?'data-act="goToFolder" data-null':''}>🏠 ${en?'Documents':'Documentos'}</button>`;
    path.forEach((f,i)=>{
      const isLast=i===path.length-1;
      html+=`<span class="crumb-sep">/</span><button class="crumb${isLast?' current':''}" ${isLast?'':`data-act="goToFolder" data-arg="${esc(f.id)}"`}>${f.icon||'📁'} ${esc(f.name)}</button>`;
    });
    if(currentFolderId){
      const cf=folderById(currentFolderId);
      html+=`<span style="margin-left:auto;display:flex;gap:5px">
        <button class="card-btn" data-act="openFolderModal" data-arg="${esc(currentFolderId)}" title="${en?'Rename':'Renomear'}">✏️</button>
        <button class="card-btn danger" data-act="deleteFolder" data-arg="${esc(currentFolderId)}" title="${en?'Delete folder':'Apagar pasta'}">🗑️</button>
      </span>`;
    }
    bc.innerHTML=html;
  }
  const nfTxt=document.getElementById('docs-newfolder-txt');
  if(nfTxt)nfTxt.textContent=en?'New folder':'Nova pasta';

  const grid=document.getElementById('docs-grid');
  const inFolder=documents.filter(d=>!d.archived&&(d.folderId||null)===(currentFolderId||null));
  const filtered2=currentDocFilter==='all'?inFolder:inFolder.filter(d=>d.cat===currentDocFilter);
  const filtered=filtered2.filter(d=>{
    if(currentDocValidityFilter==='all')return true;
    const status=getExpiryStatus(d.expiry);
    if(currentDocValidityFilter==='expired')return status?.cls==='expired';
    if(currentDocValidityFilter==='expiring')return status?.cls==='soon';
    if(currentDocValidityFilter==='ok')return status?.cls==='ok';
    if(currentDocValidityFilter==='noexpiry')return !d.expiry;
    return true;
  });
  const sortSel=document.getElementById('doc-sort');
  if(sortSel){
    const opts=[
      ['added',currentLang==='en'?'📅 Recent':'📅 Recentes'],
      ['name',currentLang==='en'?'🔤 Name A-Z':'🔤 Nome A-Z'],
      ['date',currentLang==='en'?'📆 Doc date':'📆 Data doc'],
      ['expiry',currentLang==='en'?'⏰ Expiry first':'⏰ Validade']
    ];
    sortSel.innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    sortSel.value=currentDocSort;
  }
  filtered.sort((a,b)=>{
    if(currentDocSort==='name')return (a.title||'').localeCompare(b.title||'');
    if(currentDocSort==='date')return (b.date||'').localeCompare(a.date||'');
    if(currentDocSort==='expiry'){
      if(!a.expiry&&!b.expiry)return 0;
      if(!a.expiry)return 1;
      if(!b.expiry)return -1;
      return a.expiry.localeCompare(b.expiry);
    }
    return (b.createdAt||0)-(a.createdAt||0);
  });

  // Subpastas da pasta atual
  const subFolders=docFolders.filter(f=>(f.parentId||null)===(currentFolderId||null))
    .sort((a,b)=>a.name.localeCompare(b.name));
  const foldersHtml=subFolders.map(f=>{
    const cnt=folderDirectCounts(f.id,docFolders,documents);
    const parts=[];
    if(cnt.folders)parts.push(`${cnt.folders} ${en?(cnt.folders===1?'folder':'folders'):(cnt.folders===1?'pasta':'pastas')}`);
    parts.push(`${cnt.docs} ${en?(cnt.docs===1?'doc':'docs'):(cnt.docs===1?'doc':'docs')}`);
    return `<div class="folder-card" data-act="openFolder" data-arg="${esc(f.id)}" title="${esc(f.name)}">
      <div class="folder-icon">${f.icon||'📁'}</div>
      <div class="folder-info">
        <div class="folder-name">${esc(f.name)}</div>
        <div class="folder-count">${parts.join(' · ')}</div>
      </div>
      <div class="folder-menu">
        <button class="card-btn" data-act="openFolderModal" data-arg="${esc(f.id)}" data-stop title="${en?'Rename':'Renomear'}">✏️</button>
        <button class="card-btn danger" data-act="deleteFolder" data-arg="${esc(f.id)}" data-stop title="${en?'Delete':'Apagar'}">🗑️</button>
      </div>
    </div>`;
  }).join('');

  if(!filtered.length&&!subFolders.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>${currentFolderId
        ?(en?'This folder is empty. Add documents or create a subfolder.':'Esta pasta está vazia. Adiciona documentos ou cria uma subpasta.')
        :(en?'No documents yet.':'Ainda não tens documentos.')}</p>
    </div>`;
    return;
  }

  grid.innerHTML=foldersHtml+filtered.map(doc=>{
    const expStatus=getExpiryStatus(doc.expiry);
    const catInfo=DOC_CATS[doc.cat]||{icon:'📋'};
    const fileIcon=getDocAutoIcon(doc);
    return `<div class="doc-card">
      <div class="doc-card-top">
        <div class="doc-file-icon">${fileIcon}</div>
        <div class="doc-card-info">
          <div class="doc-card-title">${esc(doc.title)}</div>
          <div class="doc-card-cat">${catInfo.icon} ${getDocCatLabel(doc.cat)}</div>
          ${doc.desc?`<div class="doc-card-desc">${esc(doc.desc)}</div>`:''}
        </div>
      </div>
      <div class="doc-card-meta">
        ${doc.date?`<span>📅 ${esc(doc.date)}</span>`:''}
        ${doc.file?`<span>📎 ${esc(doc.file.name)} (${formatFileSize(doc.file.size)})</span>`:`<span style="color:var(--text-muted);font-style:italic">${currentLang==='en'?'No file':'Sem ficheiro'}</span>`}
        ${expStatus?`<span class="doc-expiry-badge ${expStatus.cls}">⏰ ${expStatus.label}</span>`:''}
      </div>
      <div class="card-actions">
        ${doc.file?`<button class="card-btn" data-act="previewDoc" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${currentLang==='en'?'View':'Ver'}
        </button>
        <button class="card-btn" data-act="downloadDoc" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          ${currentLang==='en'?'Download':'Transferir'}
        </button>`:''}
        <button class="card-btn" data-act="openMoveModal" data-arg="${esc(doc.id)}" data-stop>
          📂 ${currentLang==='en'?'Move':'Mover'}
        </button>
        <button class="card-btn" data-act="openDocModal" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          ${t('btnEdit')}
        </button>
        <button class="card-btn" data-act="archiveDoc" data-arg="${esc(doc.id)}" data-stop><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg> ${t('btnArchive')}</button>
        <button class="card-btn danger" data-act="deleteDoc" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          ${t('btnDel')}
        </button>
      </div>
    </div>`;
  }).join('');
}
function setDocFilter(cat){currentDocFilter=cat;renderDocs();}

// ══ CARTÕES DE LOJA ══
const STORE_PRESETS=['Continente','Pingo Doce','Recheio','Auchan','Lidl','Intermarché','Worten','FNAC','Farmácia','El Corte Inglés','IKEA','Decathlon'];
// Code128B — tabela de padrões (cada valor = larguras de barras/espaços)
const C128B_PAT=['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
function code128B(text){
  // Devolve string de larguras. Start B=104, checksum, stop=106.
  let sum=104,codes=[104];
  for(let i=0;i<text.length;i++){
    const v=text.charCodeAt(i)-32;
    if(v<0||v>94)continue;
    codes.push(v);sum+=v*(i+1);
  }
  codes.push(sum%103);
  codes.push(106);
  return codes.map(cd=>C128B_PAT[cd]).join('');
}
function barcodeSVG(text){
  const clean=String(text).replace(/[^\x20-\x7E]/g,'');
  if(!clean)return '';
  const widths=code128B(clean);
  let x=0,rects='',bar=true;
  for(const w of widths){
    const width=parseInt(w,10);
    if(bar)rects+=`<rect x="${x}" y="0" width="${width}" height="100" fill="#000"/>`;
    x+=width;bar=!bar;
  }
  return `<svg viewBox="0 0 ${x} 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${rects}</svg>`;
}
function renderStoreCards(){
  const en=currentLang==='en';
  const box=document.getElementById('store-content');
  if(!box)return;
  // Cabeçalho da aba
  const tt=document.getElementById('store-tab-title');if(tt)tt.textContent=en?'Store Cards':'Cartões de Loja';
  const ta=document.getElementById('store-tab-add-txt');if(ta)ta.textContent=en?'Add card':'Adicionar cartão';
  const ti=document.getElementById('store-tab-intro');if(ti)ti.textContent=en?'Your loyalty cards — show the barcode at checkout without carrying the plastic.':'Os teus cartões de fidelização — mostra o código de barras na caixa sem andar com o plástico.';
  let html='';
  if(!storeCards.length){
    html+=`<div class="av-empty" style="text-align:center;padding:26px 16px;color:var(--text-muted);font-size:.74rem;line-height:1.7">${en?'No store cards yet. Add your Continente, Pingo Doce… and show the barcode at checkout.':'Sem cartões de loja. Adiciona o Continente, Pingo Doce… e mostra o código de barras na caixa.'}</div>`;
    box.innerHTML=html;return;
  }
  html+=`<div class="store-list">`+storeCards.map(sc=>{
    return `<div class="store-card" style="border-color:${sc.color||'var(--accent-dim)'}">
      <div class="store-card-head">
        <span class="store-card-name" style="color:${sc.color||'var(--accent)'}">${esc(sc.name||'')}</span>
        <div class="store-card-actions">
          <button class="card-btn" data-act="showBarcode" data-arg="${esc(sc.id)}" title="${en?'Show barcode':'Mostrar código'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14"/></svg></button>
          <button class="card-btn" data-act="editStoreCard" data-arg="${esc(sc.id)}" title="${en?'Edit':'Editar'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="card-btn danger" data-act="deleteStoreCard" data-arg="${esc(sc.id)}" title="${en?'Delete':'Apagar'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
        </div>
      </div>
      <div class="store-card-num" data-act="showBarcode" data-arg="${esc(sc.id)}">${esc(sc.number||'')}</div>
      <button class="store-show-btn" data-act="showBarcode" data-arg="${esc(sc.id)}">📷 ${en?'Show at checkout':'Mostrar na caixa'}</button>
    </div>`;
  }).join('')+`</div>`;
  box.innerHTML=html;
}
function openStoreModal(){
  editingStoreId=null;
  const en=currentLang==='en';
  document.getElementById('store-modal-title').textContent=en?'Add store card':'Adicionar cartão';
  document.getElementById('sc-name').value='';
  document.getElementById('sc-number').value='';
  selectedStoreColor='#c9a84c';
  renderStorePresets();renderStoreColors();
  document.getElementById('store-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('sc-name').focus(),50);
}
function editStoreCard(id){
  const sc=storeCards.find(x=>x.id===id);if(!sc)return;
  editingStoreId=id;
  const en=currentLang==='en';
  document.getElementById('store-modal-title').textContent=en?'Edit store card':'Editar cartão';
  document.getElementById('sc-name').value=sc.name||'';
  document.getElementById('sc-number').value=sc.number||'';
  selectedStoreColor=sc.color||'#c9a84c';
  renderStorePresets();renderStoreColors();
  document.getElementById('store-overlay').classList.add('open');
}
function renderStorePresets(){
  const box=document.getElementById('sc-presets');
  if(box)box.innerHTML=STORE_PRESETS.map(p=>`<button type="button" class="im-preset" data-act="fillField" data-arg="sc-name" data-arg2="${esc(p)}">${p}</button>`).join('');
}
let selectedStoreColor='#c9a84c';
function renderStoreColors(){
  const cols=['#c9a84c','#e05252','#4caf82','#5b8def','#a970d0','#e0982a','#e0609f','#54c0c0'];
  const box=document.getElementById('sc-colors');
  if(box)box.innerHTML=cols.map(col=>`<button type="button" class="sub-color-pick${col===selectedStoreColor?' on':''}" style="background:${col}" data-act="pickStoreColor" data-arg="${esc(col)}"></button>`).join('');
}
function saveStoreCard(){
  const en=currentLang==='en';
  const name=document.getElementById('sc-name').value.trim();
  const number=document.getElementById('sc-number').value.trim();
  if(!name){toast(en?'Name it!':'Dá-lhe um nome!');return;}
  if(!number){toast(en?'Enter the card number!':'Introduz o número do cartão!');return;}
  const obj={id:editingStoreId||Date.now().toString(36),name,number,color:selectedStoreColor};
  if(editingStoreId){const i=storeCards.findIndex(x=>x.id===editingStoreId);if(i>=0)storeCards[i]=obj;logActivity('edit',name,'🎟️');}
  else{storeCards.push(obj);logActivity('add',name,'🎟️');}
  closeStoreModal();renderStoreCards();updateWalletTiles();markUnsaved();
  toast(en?'Saved!':'Guardado!');
}
function closeStoreModal(){document.getElementById('store-overlay').classList.remove('open');}
function deleteStoreCard(id){
  const en=currentLang==='en';
  const sc=storeCards.find(x=>x.id===id);if(!sc)return;
  if(!confirm(en?`Delete "${sc.name}"?`:`Apagar "${sc.name}"?`))return;
  storeCards=storeCards.filter(x=>x.id!==id);
  logActivity('delete',sc.name,'🗑️');
  renderStoreCards();updateWalletTiles();markUnsaved();
  toast(en?'Deleted':'Apagado');
}
function showBarcode(id){
  const sc=storeCards.find(x=>x.id===id);if(!sc)return;
  const en=currentLang==='en';
  document.getElementById('barcode-name').textContent=sc.name||'';
  document.getElementById('barcode-svg').innerHTML=barcodeSVG(sc.number||'');
  document.getElementById('barcode-number').textContent=sc.number||'';
  document.getElementById('barcode-hint').textContent=en?'Show this to the cashier':'Mostra isto ao operador de caixa';
  document.getElementById('barcode-overlay').classList.add('open');
}
function closeBarcode(){document.getElementById('barcode-overlay').classList.remove('open');}

// ══ ECRÃS CARTEIRA (abrir/fechar) ══
function renderGreeting(){
  const box=document.getElementById('dash-greeting');
  if(!box)return;
  const en=currentLang==='en';
  const h=new Date().getHours();
  let period,ico;
  if(h<6){period=en?'Good night':'Boa noite';ico='🌙';}
  else if(h<12){period=en?'Good morning':'Bom dia';ico='☀️';}
  else if(h<20){period=en?'Good afternoon':'Boa tarde';ico='🌤️';}
  else{period=en?'Good evening':'Boa noite';ico='🌙';}
  const name=(vaultName||'').trim();
  const greet=name?`${period}, ${esc(name)}`:period;
  const active=vault.filter(e=>!e.archived).length;
  const itemsTxt=en?`${active} ${active===1?'entry':'entries'} protected`:`${active} ${active===1?'entrada protegida':'entradas protegidas'}`;
  const now=new Date();
  const dateStr=now.toLocaleDateString(en?'en-GB':'pt-PT',{weekday:'long',day:'numeric',month:'long'});
  const spark='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/></svg>';
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  box.innerHTML=`
    <div class="dash-greet-left">
      <div class="dash-greeting-main">
        <span class="dash-greeting-ico">${ico}</span>
        <span class="dash-greeting-text">${greet}</span>
      </div>
      <div class="dash-greeting-sub">${dateStr.charAt(0).toUpperCase()+dateStr.slice(1)} · ${itemsTxt}</div>
    </div>
    <div class="aur-launch aur-ring" role="button" tabindex="0" title="Aurora AI" data-act="auroraOpen" data-keydown="aurLaunchKey" data-ev>
      <div class="aur-launch-in">
        <span class="aur-launch-ico">${spark}</span>
        <span class="aur-launch-txt"><b>Aurora AI</b> · <span id="aur-launch-ph">${en?'How can I help?':'Em que posso ajudar?'}</span><span class="aur-caret"></span></span>
        <span class="aur-launch-go">${arrow}</span>
      </div>
    </div>`;
}
function renderSubsSection(){
  const en=currentLang==='en';
  const box=document.getElementById('dash-subs-section');
  if(!box)return;
  const totalM=subscriptions.reduce((a,s)=>a+subMonthly(s),0);
  const totalY=totalM*12;
  if(!subscriptions.length){
    box.innerHTML=`
      <div class="subs-sec-head">
        <div class="subs-sec-titlewrap"><span class="subs-sec-ico">💸</span><span class="subs-sec-title">${en?'Subscriptions':'Subscrições'}</span></div>
        <button class="subs-sec-add" data-act="openSubsScreen">＋ ${en?'Add':'Adicionar'}</button>
      </div>
      <div class="subs-sec-empty">${en?'Track what you spend each month on Netflix, gym, insurance…':'Controla o que gastas por mês na Netflix, ginásio, seguros…'}</div>`;
    return;
  }
  // Ordenar por próxima cobrança
  const withNext=subscriptions.map(s=>({s,next:subNextCharge(s)})).sort((a,b)=>{
    if(!a.next)return 1;if(!b.next)return -1;return a.next-b.next;
  });
  const chips=withNext.map(({s,next})=>{
    const m=subMonthly(s);
    const nextTxt=next?next.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short'}):'—';
    const daysLeft=next?Math.ceil((next-new Date().setHours(0,0,0,0))/86400000):null;
    const soon=daysLeft!==null&&daysLeft<=7;
    return `<button class="sub-chip" data-act="openSubsScreen" title="${esc(s.name)} · ${fmtMoney(m)}${en?'/mo':'/mês'}">
      <span class="sub-chip-dot" style="background:${s.color||'var(--accent)'}"></span>
      <span class="sub-chip-name">${esc(s.name||'')}</span>
      <span class="sub-chip-price">${fmtMoney(m)}<span>${en?'/mo':'/mês'}</span></span>
      <span class="sub-chip-next ${soon?'soon':''}">${en?'renews':'renova'} ${nextTxt}</span>
    </button>`;
  }).join('');
  const open=subsSectionOpen();
  const nxt=withNext.find(x=>x.next);
  const nxtDays=nxt?Math.ceil((nxt.next-new Date().setHours(0,0,0,0))/86400000):null;
  const nxtSoon=nxtDays!==null&&nxtDays<=7;
  const nxtRel=nxt?(nxtDays<=0?(en?'today':'hoje'):nxtDays===1?(en?'tomorrow':'amanhã'):(en?'in '+nxtDays+' days':'em '+nxtDays+' dias')):'';
  box.innerHTML=`
    <div class="subs-sec-head">
      <div class="subs-sec-titlewrap"><span class="subs-sec-ico">💸</span><span class="subs-sec-title">${en?'Subscriptions':'Subscrições'}</span></div>
      <button class="subs-sec-add" data-act="openSubsScreen">${en?'Manage':'Gerir'} →</button>
    </div>
    <div class="subs-sec-totals">
      <div class="subs-sec-total"><span class="subs-sec-total-num">${fmtMoney(totalM)}</span><span class="subs-sec-total-lbl">${en?'per month':'por mês'}</span></div>
      <div class="subs-sec-total dim"><span class="subs-sec-total-num">${fmtMoney(totalY)}</span><span class="subs-sec-total-lbl">${en?'per year':'por ano'}</span></div>
      <div class="subs-sec-count">${subscriptions.length} ${en?(subscriptions.length===1?'service':'services'):(subscriptions.length===1?'serviço':'serviços')}</div>
    </div>
    <button class="subs-sec-toggle ${open?'open':''}" data-act="toggleSubsSection" aria-expanded="${open}">
      <span class="subs-sec-toggle-lbl">${en?(open?'Hide subscriptions':'Show subscriptions'):(open?'Esconder subscrições':'Ver subscrições')}</span>
      <span class="subs-sec-next">${nxt?`${en?'Next':'Próxima'}: <b>${esc(nxt.s.name||'')}</b> · <span class="${nxtSoon?'soon':''}">${nxtRel}</span>`:''}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="subs-sec-collapse ${open?'open':''}"><div><div class="subs-sec-chips">${chips}</div></div></div>`;
}

// ══ BARRA COMPACTA NO TELEMÓVEL (v9.62) ══
function tbToggleSearch(){
  const tb=document.querySelector('.topbar');if(!tb)return;
  const on=!tb.classList.contains('m-search');
  if(!on&&typeof closeGlobalSearch==='function')closeGlobalSearch();
  tb.classList.toggle('m-search',on);const b=document.getElementById('tb-search-btn');if(b)b.classList.toggle('on',on);
  if(on){tbCloseMore();setTimeout(()=>{const i=document.getElementById('search-input');if(i)i.focus();},60);}
}
// Opção do menu «⋯»: fecha o menu e só depois faz a ação; o clique não segue (senão outro menu que a ação abra fechava logo)
function tbMenuAttrs(call){
  const m=/^(\w+)\((.*)\)$/.exec(call),args=m[2]?[m[2].replace(/^'|'$/g,'')]:[];
  return 'data-act="tbMenuRun" data-stop data-args=\''+esc(JSON.stringify([m[1],...args]))+'\'';
}
function tbMenuRun(name,...args){tbCloseMore();const fn=avFn(name);if(fn)fn(...args);}
function tbCloseMore(){const m=document.getElementById('tb-more-menu'),b=document.getElementById('tb-more-btn');if(m)m.classList.remove('open');if(b){b.classList.remove('on');b.setAttribute('aria-expanded','false');}}
function tbToggleMore(ev){
  if(ev)ev.stopPropagation();
  const m=document.getElementById('tb-more-menu'),b=document.getElementById('tb-more-btn');if(!m)return;
  if(m.classList.contains('open'))return tbCloseMore();
  const en=currentLang==='en';
  const I=(p)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
  const item=(fn,ico,lbl,sub)=>'<button class="tbm-item" role="menuitem" '+tbMenuAttrs(fn)+'>'+ico+'<span>'+lbl+(sub?'<small>'+sub+'</small>':'')+'</span></button>';
  let driveOnNow=false;try{driveOnNow=typeof driveOn==='function'&&driveOn();}catch(e){}
  const chip=document.getElementById('drive-chip');const chipTxt=chip&&chip.textContent?chip.textContent.trim():'';
  let h=avMoreTop(item,I,en)+item('openCalendar()',I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),en?'Calendar':'Calendário','');
  if(driveOnNow)h+=item('driveSyncNow()',I('<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>'),en?'Sync now':'Sincronizar agora',chipTxt||'Google Drive');
  h+=avMoreMid(item,I,en);
  h+=item('openSettings()',I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),en?'Settings':'Definições','');
  if(typeof auroraOpen==='function')h+=item('auroraOpen()',I('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>'),'Aurora AI',en?'Your offline assistant':'A tua assistente offline');
  h+='<div class="tbm-sep"></div><div class="tbm-lang"><span>'+(en?'Language':'Idioma')+'</span><div class="tbm-seg"><button class="'+(en?'':'on')+'" '+tbMenuAttrs("setLang('pt')")+'>PT</button><button class="'+(en?'on':'')+'" '+tbMenuAttrs("setLang('en')")+'>ENG</button></div></div>';
  m.innerHTML=h;m.classList.add('open');if(b){b.classList.add('on');b.setAttribute('aria-expanded','true');}
}
// fecha ao clicar fora do menu (ou numa das opções); cliques no espaço vazio do menu não o fecham
document.addEventListener('click',e=>{const m=document.getElementById('tb-more-menu');if(m&&m.contains(e.target)&&!(e.target.closest&&e.target.closest('button')))return;tbCloseMore();});
(function(){const m=document.getElementById('tb-more-menu'),tb=document.querySelector('.topbar');if(m&&tb&&m.parentElement!==tb)tb.appendChild(m);})();
document.addEventListener('keydown',e=>{if(e.key==='Escape')tbCloseMore();});
(function(){const si=document.getElementById('search-input');if(!si)return;si.addEventListener('blur',()=>setTimeout(()=>{const tb=document.querySelector('.topbar');if(tb&&tb.classList.contains('m-search')&&!si.value.trim()){tb.classList.remove('m-search');const b=document.getElementById('tb-search-btn');if(b)b.classList.remove('on');}},180));})();
// ══ SUBSCRIÇÕES RECOLHÍVEIS (v9.62) ══
function subsSectionOpen(){try{return localStorage.getItem('av_subs_open')==='1';}catch(e){return false;}}
function toggleSubsSection(){
  const o=!subsSectionOpen();try{localStorage.setItem('av_subs_open',o?'1':'0');}catch(e){}
  const box=document.getElementById('dash-subs-section');if(!box)return;
  const c=box.querySelector('.subs-sec-collapse'),t=box.querySelector('.subs-sec-toggle');
  if(c)c.classList.toggle('open',o);
  if(t){t.classList.toggle('open',o);t.setAttribute('aria-expanded',o?'true':'false');const l=t.querySelector('.subs-sec-toggle-lbl');if(l)l.textContent=currentLang==='en'?(o?'Hide subscriptions':'Show subscriptions'):(o?'Esconder subscrições':'Ver subscrições');}
}
function openSubsScreen(){
  const en=currentLang==='en';
  document.getElementById('subsscreen-title').textContent=en?'💸 Subscriptions':'💸 Subscrições';
  renderSubs();
  document.getElementById('subsscreen-overlay').classList.add('open');
}
function closeSubsScreen(){document.getElementById('subsscreen-overlay').classList.remove('open');}

// ══ SUBSCRIÇÕES ══
const SUB_PRESETS=['Netflix','Spotify','Disney+','HBO Max','Amazon Prime','YouTube Premium','iCloud','Google One','Ginásio','Seguro Auto','Seguro Saúde','PlayStation Plus','Xbox Game Pass'];
function subMonthly(s){
  // Devolve o custo mensal equivalente (anuais divididos por 12)
  const v=parseFloat(s.amount)||0;
  return s.cycle==='yearly'?v/12:v;
}
function fmtMoney(v){
  return '€'+(Math.round(v*100)/100).toFixed(2).replace('.',',');
}
function subNextCharge(s){
  // Calcula a próxima data de cobrança a partir do dia (mensal) ou data (anual)
  const now=new Date();now.setHours(0,0,0,0);
  if(s.cycle==='yearly'){
    if(!s.renewDate)return null;
    let d=new Date(s.renewDate);
    while(d<now)d.setFullYear(d.getFullYear()+1);
    return d;
  }else{
    const day=parseInt(s.renewDay,10);
    if(!day||day<1||day>31)return null;
    let d=new Date(now.getFullYear(),now.getMonth(),Math.min(day,new Date(now.getFullYear(),now.getMonth()+1,0).getDate()));
    if(d<now)d=new Date(now.getFullYear(),now.getMonth()+1,Math.min(day,new Date(now.getFullYear(),now.getMonth()+2,0).getDate()));
    return d;
  }
}
function renderSubs(){
  const en=currentLang==='en';
  const box=document.getElementById('subs-content');
  const badge=document.getElementById('subs-badge');
  if(!box)return;
  const totalM=subscriptions.reduce((a,s)=>a+subMonthly(s),0);
  const totalY=totalM*12;
  if(badge){badge.textContent=subscriptions.length?fmtMoney(totalM)+(en?'/mo':'/mês'):'';badge.className='dcard-badge'+(subscriptions.length?'':' ');}
  let html=`<div class="subs-head">
    <button class="btn btn-gold" data-act="openSubModal" style="display:inline-flex;align-items:center;gap:5px;padding:8px 15px;font-size:.56rem;letter-spacing:2px">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ${en?'Add subscription':'Adicionar subscrição'}
    </button>
  </div>`;
  if(!subscriptions.length){
    html+=`<div style="text-align:center;padding:26px 16px;color:var(--text-muted);font-size:.74rem;line-height:1.7">${en?'No subscriptions yet. Add Netflix, gym, insurance… and see how much you spend per month.':'Sem subscrições. Adiciona a Netflix, ginásio, seguro… e vê quanto gastas por mês.'}</div>`;
    box.innerHTML=html;return;
  }
  html+=`<div class="subs-totals">
    <div class="subs-total-box"><div class="subs-total-num">${fmtMoney(totalM)}</div><div class="subs-total-lbl">${en?'per month':'por mês'}</div></div>
    <div class="subs-total-box"><div class="subs-total-num">${fmtMoney(totalY)}</div><div class="subs-total-lbl">${en?'per year':'por ano'}</div></div>
  </div>`;
  // Ordenar por próxima cobrança
  const withNext=subscriptions.map(s=>({s,next:subNextCharge(s)})).sort((a,b)=>{
    if(!a.next)return 1;if(!b.next)return -1;return a.next-b.next;
  });
  html+=`<div class="subs-list">`+withNext.map(({s,next})=>{
    const m=subMonthly(s);
    const nextTxt=next?next.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short'}):'—';
    const cycleTxt=s.cycle==='yearly'?(en?'yearly':'anual'):(en?'monthly':'mensal');
    const daysLeft=next?Math.ceil((next-new Date().setHours(0,0,0,0))/86400000):null;
    const soon=daysLeft!==null&&daysLeft<=7;
    return `<div class="sub-row">
      <div class="sub-color" style="background:${s.color||'var(--accent)'}"></div>
      <div style="flex:1;min-width:0">
        <div class="sub-name">${esc(s.name||'')}</div>
        <div class="sub-meta">${fmtMoney(parseFloat(s.amount)||0)} · ${cycleTxt} · <span class="${soon?'sub-soon':''}">${en?'next':'próx.'} ${nextTxt}</span></div>
      </div>
      <div class="sub-monthly">${fmtMoney(m)}<span>${en?'/mo':'/mês'}</span></div>
      <div class="sub-actions">
        <button class="card-btn" data-act="editSub" data-arg="${esc(s.id)}" title="${en?'Edit':'Editar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="card-btn danger" data-act="deleteSub" data-arg="${esc(s.id)}" title="${en?'Delete':'Apagar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
      </div>
    </div>`;
  }).join('')+`</div>`;
  box.innerHTML=html;
}
function openSubModal(){
  editingSubId=null;
  const en=currentLang==='en';
  document.getElementById('sub-modal-title').textContent=en?'Add subscription':'Adicionar subscrição';
  document.getElementById('sub-name').value='';
  document.getElementById('sub-amount').value='';
  document.getElementById('sub-cycle').value='monthly';
  document.getElementById('sub-renew-day').value='1';
  document.getElementById('sub-renew-date').value='';
  selectedSubColor='#c9a84c';
  renderSubPresets();renderSubColors();updateSubCycleUI();
  document.getElementById('sub-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('sub-name').focus(),50);
}
function editSub(id){
  const s=subscriptions.find(x=>x.id===id);if(!s)return;
  editingSubId=id;
  const en=currentLang==='en';
  document.getElementById('sub-modal-title').textContent=en?'Edit subscription':'Editar subscrição';
  document.getElementById('sub-name').value=s.name||'';
  document.getElementById('sub-amount').value=s.amount||'';
  document.getElementById('sub-cycle').value=s.cycle||'monthly';
  document.getElementById('sub-renew-day').value=s.renewDay||'1';
  document.getElementById('sub-renew-date').value=s.renewDate||'';
  selectedSubColor=s.color||'#c9a84c';
  renderSubPresets();renderSubColors();updateSubCycleUI();
  document.getElementById('sub-overlay').classList.add('open');
}
function updateSubCycleUI(){
  const cycle=document.getElementById('sub-cycle').value;
  document.getElementById('sub-day-row').style.display=cycle==='monthly'?'block':'none';
  document.getElementById('sub-date-row').style.display=cycle==='yearly'?'block':'none';
}
function renderSubPresets(){
  const box=document.getElementById('sub-presets');
  if(box)box.innerHTML=SUB_PRESETS.map(p=>`<button type="button" class="im-preset" data-act="fillField" data-arg="sub-name" data-arg2="${esc(p)}">${p}</button>`).join('');
}
let selectedSubColor='#c9a84c';
function renderSubColors(){
  const cols=['#c9a84c','#e05252','#4caf82','#5b8def','#a970d0','#e0982a','#e0609f','#54c0c0'];
  const box=document.getElementById('sub-colors');
  if(box)box.innerHTML=cols.map(col=>`<button type="button" class="sub-color-pick${col===selectedSubColor?' on':''}" style="background:${col}" data-act="pickSubColor" data-arg="${esc(col)}"></button>`).join('');
}
function saveSub(){
  const en=currentLang==='en';
  const name=document.getElementById('sub-name').value.trim();
  const amount=parseFloat(document.getElementById('sub-amount').value);
  if(!name){toast(en?'Name it!':'Dá-lhe um nome!');return;}
  if(isNaN(amount)||amount<0){toast(en?'Enter a valid amount!':'Valor inválido!');return;}
  const cycle=document.getElementById('sub-cycle').value;
  const obj={
    id:editingSubId||Date.now().toString(36),
    name,amount,cycle,color:selectedSubColor,
    renewDay:cycle==='monthly'?document.getElementById('sub-renew-day').value:null,
    renewDate:cycle==='yearly'?document.getElementById('sub-renew-date').value:null,
  };
  if(editingSubId){const i=subscriptions.findIndex(x=>x.id===editingSubId);if(i>=0)subscriptions[i]=obj;logActivity('edit',name,'💸');}
  else{subscriptions.push(obj);logActivity('add',name,'💸');}
  closeSubModal();renderSubs();renderSubsSection();renderRenewals();markUnsaved();
  toast(en?'Saved!':'Guardado!');
}
function closeSubModal(){document.getElementById('sub-overlay').classList.remove('open');}
function deleteSub(id){
  const en=currentLang==='en';
  const s=subscriptions.find(x=>x.id===id);if(!s)return;
  if(!confirm(en?`Delete "${s.name}"?`:`Apagar "${s.name}"?`))return;
  subscriptions=subscriptions.filter(x=>x.id!==id);
  logActivity('delete',s.name,'🗑️');
  renderSubs();renderSubsSection();renderRenewals();markUnsaved();
  toast(en?'Deleted':'Apagado');
}

// ══ INFORMAÇÃO PESSOAL RÁPIDA ══
const INFO_PRESETS_PT=['NIF','Cartão de Cidadão','IBAN','NIB','Matrícula','Nº de Utente (SNS)','Nº Segurança Social','Nº de Sócio','Passaporte','Carta de Condução','Validade do CC'];
const INFO_PRESETS_EN=['Tax ID','ID Card','IBAN','Bank Nº','Car Plate','Health Number','Social Security','Member Nº','Passport','Driving Licence'];

// personalInfo agora é uma lista de PESSOAS: {id, name, fields:[{id,label,value,sensitive}]}
// Compatibilidade: se vier do formato antigo (lista de campos soltos), migra para uma pessoa "Geral".
function migrateInfoIfNeeded(){
  if(!Array.isArray(personalInfo))personalInfo=[];
  if(personalInfo.length && personalInfo[0] && personalInfo[0].value!==undefined && personalInfo[0].fields===undefined){
    // formato antigo → agrupar tudo numa pessoa
    const old=personalInfo.slice();
    personalInfo=[{id:Date.now().toString(36),name:currentLang==='en'?'General':'Geral',fields:old.map(f=>({id:f.id,label:f.label,value:f.value,sensitive:f.sensitive}))}];
  }
}

let editingPersonId=null;      // pessoa a que se adiciona/edita campo
let editingInfoFieldId=null;   // campo em edição

function renderInfo(){
  migrateInfoIfNeeded();
  const en=currentLang==='en';
  const intro=document.getElementById('info-intro');
  if(intro)intro.textContent=en
    ?'Everyday details for you and your family, one tap away. Group them by person — each with their own tax ID, ID card, IBAN… Stored encrypted, like everything else.'
    :'Os dados do dia-a-dia teus e da família, a um toque. Organizados por pessoa — cada uma com o seu NIF, cartão de cidadão, IBAN… Guardado encriptado, como tudo o resto.';
  document.getElementById('info-title').textContent=en?'Personal Info':'Informação Pessoal';
  document.getElementById('info-add-txt').textContent=en?'New person':'Nova pessoa';
  const grid=document.getElementById('info-grid');
  if(!personalInfo.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <p>${en?'No one added yet. Tap "New person" to create a profile (you, your family…) and store their details.':'Ninguém ainda. Toca em "Nova pessoa" para criar um perfil (tu, a família…) e guardar os dados.'}</p>
    </div>`;
    return;
  }
  grid.innerHTML=personalInfo.map(person=>{
    const fields=(person.fields||[]).map(f=>{
      const val=esc(f.value||'');
      const masked=f.sensitive?`<span class="info-val masked" id="infoval-${f.id}" data-real="${val}">••••••••</span>`:`<span class="info-val" id="infoval-${f.id}">${val}</span>`;
      return `<div class="info-field">
        <div class="info-field-head">
          <span class="info-label">${esc(f.label||'')}</span>
          <div class="info-field-actions">
            ${f.sensitive?`<button class="card-btn" data-act="toggleInfoMask" data-arg="${esc(f.id)}" title="${en?'Show/Hide':'Mostrar/Ocultar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>`:''}
            <button class="card-btn" data-act="copyInfoField" data-arg="${esc(person.id)}" data-arg2="${esc(f.id)}" title="${en?'Copy':'Copiar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
            <button class="card-btn" data-act="editInfoField" data-arg="${esc(person.id)}" data-arg2="${esc(f.id)}" title="${en?'Edit':'Editar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="card-btn danger" data-act="deleteInfoField" data-arg="${esc(person.id)}" data-arg2="${esc(f.id)}" title="${en?'Delete':'Apagar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
          </div>
        </div>
        ${masked}
      </div>`;
    }).join('');
    return `<div class="info-person">
      <div class="info-person-head">
        <div class="info-person-name">👤 ${esc(person.name||'')}</div>
        <div class="info-person-actions">
          <button class="card-btn" data-act="renamePerson" data-arg="${esc(person.id)}" title="${en?'Rename':'Renomear'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="card-btn danger" data-act="deletePerson" data-arg="${esc(person.id)}" title="${en?'Delete person':'Apagar pessoa'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
        </div>
      </div>
      <div class="info-fields">${fields||`<div style="font-size:.68rem;color:var(--text-muted);padding:6px 0">${en?'No details yet.':'Sem dados ainda.'}</div>`}</div>
      <button class="info-add-field" data-act="openInfoModal" data-arg="${esc(person.id)}">＋ ${en?'Add detail':'Adicionar dado'}</button>
    </div>`;
  }).join('');
}
function toggleInfoMask(id){
  const el=document.getElementById('infoval-'+id);
  if(!el)return;
  if(el.classList.contains('masked')){el.textContent=el.dataset.real;el.classList.remove('masked');}
  else{el.textContent='••••••••';el.classList.add('masked');}
}
function copyInfoField(personId,fieldId){
  const p=personalInfo.find(x=>x.id===personId);if(!p)return;
  const f=(p.fields||[]).find(x=>x.id===fieldId);if(!f)return;
  copyText(f.value,currentLang==='en'?'Copied!':'Copiado!');
}
// ── Pessoas ──
function addPerson(){
  const en=currentLang==='en';
  const name=prompt(en?'Person\'s name (e.g. Carlos, Aurora):':'Nome da pessoa (ex: Carlos, Aurora):');
  if(name===null)return;
  const nm=name.trim();if(!nm)return;
  personalInfo.push({id:Date.now().toString(36),name:nm,fields:[]});
  logActivity('add',nm,'🆔');
  renderInfo();markUnsaved();
}
function renamePerson(id){
  const en=currentLang==='en';
  const p=personalInfo.find(x=>x.id===id);if(!p)return;
  const name=prompt(en?'New name:':'Novo nome:',p.name||'');
  if(name===null)return;
  const nm=name.trim();if(!nm)return;
  p.name=nm;renderInfo();markUnsaved();
}
function deletePerson(id){
  const en=currentLang==='en';
  const p=personalInfo.find(x=>x.id===id);if(!p)return;
  const n=(p.fields||[]).length;
  const msg=en?`Delete "${p.name}" and its ${n} detail(s)?`:`Apagar "${p.name}" e os seus ${n} dado(s)?`;
  if(!confirm(msg))return;
  personalInfo=personalInfo.filter(x=>x.id!==id);
  logActivity('delete',p.name,'🗑️');
  renderInfo();markUnsaved();
  toast(en?'Deleted':'Apagado');
}
// ── Campos de uma pessoa ──
function openInfoModal(personId){
  editingPersonId=personId;editingInfoFieldId=null;
  const en=currentLang==='en';
  document.getElementById('info-modal-title').textContent=en?'Add detail':'Adicionar dado';
  document.getElementById('im-label').value='';
  document.getElementById('im-value').value='';
  document.getElementById('im-sensitive').checked=false;
  renderInfoPresets();
  document.getElementById('info-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('im-label').focus(),50);
}
function editInfoField(personId,fieldId){
  const p=personalInfo.find(x=>x.id===personId);if(!p)return;
  const f=(p.fields||[]).find(x=>x.id===fieldId);if(!f)return;
  editingPersonId=personId;editingInfoFieldId=fieldId;
  const en=currentLang==='en';
  document.getElementById('info-modal-title').textContent=en?'Edit detail':'Editar dado';
  document.getElementById('im-label').value=f.label||'';
  document.getElementById('im-value').value=f.value||'';
  document.getElementById('im-sensitive').checked=!!f.sensitive;
  renderInfoPresets();
  document.getElementById('info-overlay').classList.add('open');
}
function renderInfoPresets(){
  const en=currentLang==='en';
  const presets=en?INFO_PRESETS_EN:INFO_PRESETS_PT;
  const box=document.getElementById('im-presets');
  if(box)box.innerHTML=presets.map(p=>`<button type="button" class="im-preset" data-act="fillField" data-arg="im-label" data-arg2="${esc(p)}">${p}</button>`).join('');
}
function closeInfoModal(){document.getElementById('info-overlay').classList.remove('open');}
function saveInfo(){
  const en=currentLang==='en';
  const label=document.getElementById('im-label').value.trim();
  const value=document.getElementById('im-value').value.trim();
  if(!label){toast(en?'Give it a name!':'Dá-lhe um nome!');return;}
  if(!value){toast(en?'Fill in the value!':'Preenche o valor!');return;}
  const sensitive=document.getElementById('im-sensitive').checked;
  const p=personalInfo.find(x=>x.id===editingPersonId);
  if(!p){closeInfoModal();return;}
  if(!Array.isArray(p.fields))p.fields=[];
  if(editingInfoFieldId){
    const idx=p.fields.findIndex(f=>f.id===editingInfoFieldId);
    if(idx>=0)p.fields[idx]={...p.fields[idx],label,value,sensitive};
    logActivity('edit',label,'🆔');
  }else{
    p.fields.push({id:Date.now().toString(36),label,value,sensitive});
    logActivity('add',label,'🆔');
  }
  closeInfoModal();renderInfo();markUnsaved();
  toast(en?'Saved!':'Guardado!');
}
function deleteInfoField(personId,fieldId){
  const en=currentLang==='en';
  const p=personalInfo.find(x=>x.id===personId);if(!p)return;
  const f=(p.fields||[]).find(x=>x.id===fieldId);if(!f)return;
  if(!confirm(en?`Delete "${f.label}"?`:`Apagar "${f.label}"?`))return;
  p.fields=p.fields.filter(x=>x.id!==fieldId);
  logActivity('delete',f.label,'🗑️');
  renderInfo();markUnsaved();
  toast(en?'Deleted':'Apagado');
}

// ══ 2FA / TOTP (RFC 6238 — validado contra vetores oficiais) ══
function b32decode(s){
  s=String(s).toUpperCase().replace(/[\s=\-]/g,'');
  const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits=0,val=0;const out=[];
  for(const ch of s){
    const idx=A.indexOf(ch);
    if(idx<0)return null;
    val=(val<<5)|idx;bits+=5;
    if(bits>=8){out.push((val>>>(bits-8))&0xFF);bits-=8;}
  }
  return out.length?new Uint8Array(out):null;
}
const OTP_ALGOS={'SHA1':'SHA-1','SHA-1':'SHA-1','SHA256':'SHA-256','SHA-256':'SHA-256','SHA512':'SHA-512','SHA-512':'SHA-512'};
function otpAlgo(a){return OTP_ALGOS[String(a||'SHA1').toUpperCase().replace(/\s/g,'')]||null;}
async function computeTOTP(secret,digits,period,algorithm,fixedCounter){
  digits=digits||6;period=period||30;
  const hash=otpAlgo(algorithm);
  if(!hash)return null;
  const key=b32decode(secret);
  if(!key)return null;
  const counter=(fixedCounter===undefined||fixedCounter===null)
    ?Math.floor(Date.now()/1000/period)
    :Number(fixedCounter);
  const buf=new ArrayBuffer(8);const dv=new DataView(buf);
  dv.setUint32(0,Math.floor(counter/4294967296));
  dv.setUint32(4,counter>>>0);
  const ck=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash},false,['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign('HMAC',ck,buf));
  const off=sig[sig.length-1]&0xf;
  const bin=((sig[off]&0x7f)<<24)|(sig[off+1]<<16)|(sig[off+2]<<8)|sig[off+3];
  return String(bin%(10**digits)).padStart(digits,'0');
}
function parseOtpauth(str){
  try{
    if(!/^otpauth:\/\//i.test(str))return null;
    const u=new URL(str);
    const secret=u.searchParams.get('secret')||'';
    const issuer=u.searchParams.get('issuer')||'';
    const type=(u.host||u.pathname.split('/')[0]||'totp').toLowerCase().includes('hotp')?'hotp':'totp';
    const algorithm=u.searchParams.get('algorithm')||'SHA1';
    const digits=parseInt(u.searchParams.get('digits')||'6',10);
    const period=parseInt(u.searchParams.get('period')||'30',10);
    const counter=u.searchParams.get('counter');
    let label=decodeURIComponent(u.pathname.replace(/^\/+/,''));
    let name=issuer,account='';
    if(label.includes(':')){const parts=label.split(':');name=issuer||parts[0];account=parts.slice(1).join(':');}
    else{account=label;if(!name)name=label;}
    return{name:name.trim(),account:account.trim(),secret:secret.trim(),type,algorithm,digits:(digits>=6&&digits<=10)?digits:6,period:(period>0&&period<=300)?period:30,counter:counter!==null?parseInt(counter,10)||0:null};
  }catch(e){return null;}
}
let editingTotpId=null;
function openTotpModal(id=null){
  setTimeout(()=>{const r=document.getElementById('tf-recovery');if(r){const e=id?totp.find(x=>x.id===id):null;r.value=e&&e.recovery?e.recovery:'';}},0);
  editingTotpId=id;
  const isEdit=!!id;
  document.getElementById('totp-modal-title').textContent=isEdit
    ?(currentLang==='en'?'🔢 Edit 2FA Code':'🔢 Editar Código 2FA')
    :(currentLang==='en'?'🔢 New 2FA Code':'🔢 Novo Código 2FA');
  document.getElementById('tf-name-lbl').textContent=currentLang==='en'?'Service':'Serviço';
  document.getElementById('tf-account-lbl').innerHTML=(currentLang==='en'?'Account':'Conta')+' <span style="font-size:.56rem;color:var(--text-muted)">('+(currentLang==='en'?'optional':'opcional')+')</span>';
  document.getElementById('tf-secret-lbl').textContent=currentLang==='en'?'Secret':'Segredo';
  document.getElementById('tf-secret-hint').textContent=currentLang==='en'
    ?'Paste the secret key the site shows when enabling 2FA (below the QR code), or the full otpauth:// link.'
    :'Cola aqui a chave secreta que o site mostra ao ativar 2FA (por baixo do QR code), ou o link otpauth:// completo.';
  document.getElementById('totp-save-btn').textContent=currentLang==='en'?'Save':'Guardar';
  document.getElementById('totp-cancel-btn').textContent=currentLang==='en'?'Cancel':'Cancelar';
  if(isEdit){
    const t2=totp.find(x=>x.id===id);
    document.getElementById('tf-name').value=t2?.name||'';
    document.getElementById('tf-account').value=t2?.account||'';
    document.getElementById('tf-secret').value=t2?.secret||'';
  }else{
    ['tf-name','tf-account','tf-secret'].forEach(i=>document.getElementById(i).value='');
  }
  const scanBtn=document.getElementById('tf-scan-btn');
  if(scanBtn)scanBtn.style.display='flex';
  const scanTxt=document.getElementById('tf-scan-txt');
  if(scanTxt)scanTxt.textContent=currentLang==='en'?'Scan QR':'Ler QR';
  document.getElementById('totp-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('tf-name').focus(),100);
}
function closeTotpModal(){const o=document.getElementById('totp-overlay');if(o)o.classList.remove('open');editingTotpId=null;}
function saveTotp(){
  let name=document.getElementById('tf-name').value.trim();
  let account=document.getElementById('tf-account').value.trim();
  let secret=document.getElementById('tf-secret').value.trim();
  const parsed=parseOtpauth(secret);
  const prev=editingTotpId?totp.find(x=>x.id===editingTotpId):null;
  let type='totp',algorithm='SHA1',digits=6,period=30,counter=null;
  // A editar sem colar um link otpauth novo: mantém os parâmetros do código (antes voltavam a 6 dígitos/SHA-1/30 s
  // e um código de 8 dígitos, SHA-256 ou HOTP passava a gerar números errados)
  if(!parsed&&prev){type=prev.type||'totp';algorithm=prev.algorithm||'SHA1';digits=prev.digits||6;period=prev.period||30;counter=prev.counter??null;}
  if(parsed){
    secret=parsed.secret;
    if(!name)name=parsed.name;
    if(!account)account=parsed.account;
    type=parsed.type;algorithm=parsed.algorithm;digits=parsed.digits;period=parsed.period;counter=parsed.counter;
    if(!otpAlgo(algorithm)){
      toast(currentLang==='en'
        ?`This service uses ${algorithm}, which this app cannot generate.`
        :`Este serviço usa ${algorithm}, que esta app não consegue gerar.`);
      return;
    }
  }
  if(!name){toast(currentLang==='en'?'Service name is required!':'Nome do serviço obrigatório!');return;}
  if(!secret||!b32decode(secret)){toast(currentLang==='en'?'Invalid secret! Must be Base32.':'Segredo inválido! Tem de ser Base32.');return;}
  const entry={
    ...(prev||{}),
    id:editingTotpId||Date.now().toString(36),
    name,account,secret:secret.toUpperCase().replace(/[\s\-]/g,''),
    type,algorithm,digits,period,counter,
    recovery:(document.getElementById('tf-recovery')?.value||'').trim(),
    createdAt:prev&&prev.createdAt||Date.now(),
  };
  const idx=prev?totp.indexOf(prev):-1;
  if(idx>=0)totp[idx]=entry;else totp.push(entry);
  logActivity(prev?'edit':'add',name,'🔢');
  closeTotpModal();renderTotp();
  toast(prev?(currentLang==='en'?'2FA updated!':'2FA atualizado!'):(currentLang==='en'?'2FA added!':'2FA adicionado!'));
  markUnsaved();
}
function deleteTotp(id){
  if(!confirm(currentLang==='en'?'Move this 2FA code to the recycle bin?':'Mover este código 2FA para a reciclagem?'))return;
  const t2=totp.find(x=>x.id===id);
  if(t2){logActivity('delete',t2.name,'🗑️');trash.unshift({type:'totp',data:t2,deletedAt:Date.now()});}
  totp=totp.filter(x=>x.id!==id);
  renderTotp();
  toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');
  markUnsaved();
}
function fmtTotpCode(code,digits){
  digits=digits||6;
  if(!code)return '•'.repeat(Math.ceil(digits/2))+' '+'•'.repeat(Math.floor(digits/2));
  const h=Math.ceil(code.length/2);
  return code.slice(0,h)+' '+code.slice(h);
}
async function refreshTotpCodes(){
  for(const t2 of totp){
    const code=await computeTOTP(t2.secret,t2.digits,t2.period,t2.algorithm,t2.type==='hotp'?(t2.counter||0):null);
    const el=document.getElementById('totp-code-'+t2.id);
    if(el){el.textContent=fmtTotpCode(code,t2.digits);el.dataset.code=code||'';}
  }
}
function copyTotpCode(id){
  const el=document.getElementById('totp-code-'+id);
  const code=el?.dataset.code;
  if(code)copyText(code,currentLang==='en'?'Code copied! ✓':'Código copiado! ✓');
}
function toggleTotpRecovery(id){
  const el=document.getElementById('totp-rec-'+id);
  if(el)el.style.display=el.style.display==='none'?'block':'none';
}
function renderTotp(){
  const grid=document.getElementById('totp-grid');if(!grid)return;
  render2faGate();
  const title=document.getElementById('totp-title');
  if(title)title.textContent=currentLang==='en'?'2FA Authenticator':'Autenticador 2FA';
  const addBtn=document.getElementById('totp-add-btn');
  if(addBtn)addBtn.textContent=currentLang==='en'?'+ Add 2FA':'+ Adicionar 2FA';
  const info=document.getElementById('totp-info');
  if(info)info.textContent=totp.length
    ?(currentLang==='en'?'Codes refresh every 30 seconds. Tap a code to copy it.':'Os códigos renovam a cada 30 segundos. Toca num código para copiar.')
    :'';
  if(!totp.length){
    if(totpRecWrap&&!totpUnlocked){grid.innerHTML='';return;}
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <p>${currentLang==='en'?'No 2FA codes yet. Add your first authenticator.':'Sem códigos 2FA. Adiciona o teu primeiro autenticador.'}</p>
    </div>`;
    return;
  }
  grid.innerHTML=totp.map(t2=>`
    <div class="totp-card">
      <div class="totp-name">${esc(t2.name)}</div>
      ${t2.account?`<div class="totp-account">${esc(t2.account)}</div>`:''}
      ${t2.recovery?`<div class="totp-recovery"><span class="totp-recovery-toggle" data-act="toggleTotpRecovery" data-arg="${esc(t2.id)}">🔑 ${currentLang==='en'?'Recovery codes':'Códigos de recuperação'} ▾</span><div class="totp-recovery-body" id="totp-rec-${t2.id}" style="display:none"><pre class="totp-recovery-pre">${esc(t2.recovery)}</pre><button class="card-btn" data-act="copyText" data-arg="${esc(t2.recovery)}" data-arg2="${currentLang==='en'?'Copied':'Copiado'}">📋 ${currentLang==='en'?'Copy all':'Copiar tudo'}</button></div></div>`:''}
      <div class="totp-code-row">
        <div class="totp-code" id="totp-code-${t2.id}" data-code="" data-act="copyTotpCode" data-arg="${esc(t2.id)}" title="${currentLang==='en'?'Click to copy':'Clica para copiar'}">${fmtTotpCode(null,t2.digits)}</div>
        <svg class="totp-ring" width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="12" fill="none" stroke="var(--border)" stroke-width="3"/>
          <circle class="totp-ring-fg" id="totp-ring-${t2.id}" cx="15" cy="15" r="12" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="75.4" stroke-dashoffset="0" transform="rotate(-90 15 15)"/>
        </svg>
        <span class="totp-secs" id="totp-secs-${t2.id}">--</span>
      </div>
      <div class="card-actions" style="margin-top:10px">
        <button class="card-btn" data-act="copyTotpCode" data-arg="${esc(t2.id)}">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          ${currentLang==='en'?'Copy':'Copiar'}
        </button>
        <button class="card-btn" data-act="openTotpModal" data-arg="${esc(t2.id)}">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          ${t('btnEdit')}
        </button>
        <button class="card-btn danger" data-act="deleteTotp" data-arg="${esc(t2.id)}">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          ${t('btnDel')}
        </button>
      </div>
    </div>`).join('');
  totpCounters={};
  refreshTotpCodes();
}
setInterval(()=>{
  if((!masterKey&&!presentationMode)||!totp.length||document.hidden)return;
  const grid=document.getElementById('totp-grid');
  if(!grid||!grid.offsetParent)return;
  const now=Math.floor(Date.now()/1000);
  let needRefresh=false;
  for(const t2 of totp){
    const per=t2.period||30;
    const isH=t2.type==='hotp';
    const secs=per-(now%per);
    const s=document.getElementById('totp-secs-'+t2.id);
    if(s)s.textContent=isH?'#'+(t2.counter||0):secs+'s';
    const r=document.getElementById('totp-ring-'+t2.id);
    if(r&&!isH){
      r.style.strokeDashoffset=75.4*((per-secs)/per);
      r.style.stroke=secs<=5?'var(--red)':'var(--accent)';
    }
    if(!isH){
      const cnt=Math.floor(now/per);
      if(totpCounters[t2.id]!==cnt){totpCounters[t2.id]=cnt;needRefresh=true;}
    }
  }
  if(needRefresh)refreshTotpCodes();
},1000);

// ══ EFEITOS: CASCATA + BRILHO DOS BOTÕES ══
function applyStagger(){
  // Numera os cartões visíveis para a animação em cascata (teto de 14 p/ não atrasar demais)
  ['#cards-grid .entry-card','#docs-grid .doc-card','#totp-grid .totp-card','.dash-cards .dcard'].forEach(sel=>{
    const els=document.querySelectorAll(sel);
    for(let i=0;i<els.length&&i<15;i++){const v=String(Math.min(i,14));if(els[i].style.getPropertyValue('--i')!==v)els[i].style.setProperty('--i',v);}
  });
}
// Brilho posicional nos botões (segue o toque/rato)
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.btn');
  if(!b)return;
  const r=b.getBoundingClientRect();
  b.style.setProperty('--rx',((e.clientX-r.left)/r.width*100)+'%');
  b.style.setProperty('--ry',((e.clientY-r.top)/r.height*100)+'%');
},{passive:true});

// ══ MOTOR DE FUNDOS ANIMADOS (vários estilos escolhíveis) ══
const BG_STYLES=['net','aurora','stars','nebula','gradient','matrix','rain','bubbles','none'];
let currentBg='net';
try{currentBg=localStorage.getItem('cv_bg')||'net';}catch(e){}
if(!BG_STYLES.includes(currentBg))currentBg='net';

/* Atividade: as animações de fundo param ao fim de 1 min sem mexer (poupa bateria) e voltam ao primeiro toque */
const AV_IDLE={last:performance.now(),ms:60000,cbs:[]};
function avIdle(){return performance.now()-AV_IDLE.last>AV_IDLE.ms;}
(function(){
  // Animações SVG (escudo do ecrã de entrada): não obedecem ao CSS, param-se à mão (e sempre com «reduzir movimento»)
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Animações SVG só correm se estiverem à vista (as do ecrã de entrada continuavam a correr por trás da app: ~300 recálculos de estilo por segundo)
  // (procura pelas etiquetas <animate>: o seletor :has() em svg custava ~120 ms por chamada com um cofre grande num telemóvel lento)
  const smil=on=>{const l=new Set();document.querySelectorAll('animate,animateTransform').forEach(a=>{const v=a.ownerSVGElement;if(v)l.add(v.ownerSVGElement||v);});
    l.forEach(v=>{try{on&&!reduce&&v.getClientRects().length?v.unpauseAnimations():v.pauseAnimations();}catch(e){}});};
  // Sem atividade: as animações decorativas em ciclo (brilhos, manchas do fundo, ícones a flutuar) param até ao próximo toque
  const still=on=>document.documentElement.classList.toggle('av-still',on);
  window.avSmilSync=()=>smil(!AV_IDLE.asleep);
  if(reduce)document.addEventListener('DOMContentLoaded',()=>smil(false));
  setInterval(()=>{if(!AV_IDLE.asleep&&avIdle()){AV_IDLE.asleep=true;smil(false);still(true);}else if(!AV_IDLE.asleep)smil(true);},5000);
  AV_IDLE.cbs.push(()=>{if(AV_IDLE.asleep){AV_IDLE.asleep=false;smil(true);still(false);}});
  ['lockApp','doUnlock','switchTab'].forEach(n=>{const f=window[n];if(typeof f==='function')window[n]=function(){const r=f.apply(this,arguments);setTimeout(avSmilSync,60);return r;};});
  addEventListener('load',()=>setTimeout(avSmilSync,300));
  const poke=()=>{const n=performance.now(),was=n-AV_IDLE.last>AV_IDLE.ms;AV_IDLE.last=n;if(was)AV_IDLE.cbs.forEach(f=>{try{f();}catch(e){}});};
  ['pointerdown','pointermove','keydown','wheel','touchstart','scroll'].forEach(ev=>addEventListener(ev,poke,{passive:true,capture:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)poke();});
})();
const AuroraBG=(function(){
  const cv=document.getElementById('bg-net');
  if(!cv)return null;
  const ctx=cv.getContext('2d');
  let W=0,H=0,raf=null,running=false,t=0,k=1,dpr=(window.matchMedia&&matchMedia('(max-width:768px)').matches)?1:Math.min(window.devicePixelRatio||1,2);
  let mode='net',pts=[],stars=[],blobs=[],drops=[],bubbles=[];
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  // getComputedStyle a cada frame obrigava a recalcular estilos 60×/s: lê a cor no máximo 1×/s
  let _acc='',_accT=0;
  function accent(){const n=performance.now();if(!_acc||n-_accT>1000){_acc=getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim()||'201,168,76';_accT=n;}return _acc;}
  function isLight(){return document.documentElement.getAttribute('data-theme')==='light';}

  // Manchas suaves (aurora, nebulosa, gradiente) desenhadas a meia resolução: igual à vista e ~4× mais leve
  const SOFT={aurora:1,nebula:1,gradient:1};
  let sc=1;
  function resize(){
    W=cv.clientWidth;H=cv.clientHeight;sc=SOFT[mode]?.5:dpr;
    cv.width=Math.max(1,Math.round(W*sc));cv.height=Math.max(1,Math.round(H*sc));
    ctx.setTransform(sc,0,0,sc,0,0);
    seed();
  }
  let _glow=null;
  function glow(){
    if(_glow)return _glow;
    const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
    const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=r;g.fillRect(0,0,64,64);return _glow=c;
  }
  function seed(){
    // Rede de pontos
    const target=Math.min(70,Math.round(W*H/22000));
    pts=[];for(let i=0;i<target;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*1.6+.6});
    // Estrelas
    const sc=Math.min(160,Math.round(W*H/9000));
    stars=[];for(let i=0;i<sc;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3+.3,ph:Math.random()*6.283,sp:Math.random()*.8+.2});
    // Nebulosa (manchas)
    blobs=[];for(let i=0;i<5;i++)blobs.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*200+180,dx:(Math.random()-.5)*.15,dy:(Math.random()-.5)*.15,h:Math.random()*360});
    // Chuva (matrix e rain)
    const dc=Math.min(90,Math.round(W/14));
    drops=[];for(let i=0;i<dc;i++)drops.push({x:Math.random()*W,y:Math.random()*H,sp:Math.random()*4+2,len:Math.random()*14+6});
    // Bolhas
    const bc=Math.min(40,Math.round(W*H/26000));
    bubbles=[];for(let i=0;i<bc;i++)bubbles.push({x:Math.random()*W,y:H+Math.random()*H,r:Math.random()*26+6,sp:Math.random()*.5+.2,drift:(Math.random()-.5)*.3});
  }

  function drawNet(){
    const col=accent();ctx.clearRect(0,0,W,H);
    for(let i=0;i<pts.length;i++){
      const p=pts[i];p.x+=p.vx*k;p.y+=p.vy*k;
      if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
      for(let j=i+1;j<pts.length;j++){
        const q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
        if(d<15000){const a=(1-d/15000)*.32;ctx.strokeStyle=`rgba(${col},${a})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
      }
    }
    for(const p of pts){ctx.fillStyle=`rgba(${col},.7)`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();}
  }

  function drawAurora(){
    ctx.clearRect(0,0,W,H);
    // Faixas de aurora onduladas — verde/roxo/azul
    const bands=[[46,204,113],[155,89,182],[52,152,219],[26,188,156]];
    for(let b=0;b<bands.length;b++){
      const [r,g,bl]=bands[b];
      const yBase=H*(0.18+b*0.13);
      const amp=H*0.12, speed=t*0.0006*(1+b*0.25), fx=b*1.3;
      ctx.beginPath();
      ctx.moveTo(0,H);
      for(let x=0;x<=W;x+=14){
        const y=yBase+Math.sin(x*0.006+speed+fx)*amp+Math.sin(x*0.013+speed*1.4)*amp*0.4;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H);ctx.closePath();
      const grad=ctx.createLinearGradient(0,yBase-amp,0,H);
      grad.addColorStop(0,`rgba(${r},${g},${bl},${isLight()?0.10:0.16})`);
      grad.addColorStop(0.5,`rgba(${r},${g},${bl},${isLight()?0.04:0.06})`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grad;ctx.fill();
    }
    // brilho de estrelas ténue por cima
    for(const s of stars){const tw=(Math.sin(t*0.002*s.sp+s.ph)+1)*0.5;ctx.fillStyle=`rgba(255,255,255,${tw*0.35})`;ctx.beginPath();ctx.arc(s.x,s.y*0.5,s.r*0.7,0,6.283);ctx.fill();}
  }

  function drawStars(){
    ctx.clearRect(0,0,W,H);
    const col=accent();
    for(const s of stars){
      const tw=(Math.sin(t*0.05*s.sp+s.ph)+1)*0.5;
      s.y+=0.18*s.sp*k; if(s.y>H+2){s.y=-2;s.x=Math.random()*W;}
      const a=0.25+tw*0.75, rr=s.r*(0.7+tw*0.9);
      // brilho (imagem pré-desenhada: criar um gradiente por estrela a cada frame era o mais pesado)
      ctx.globalAlpha=a*0.5;ctx.drawImage(glow(),s.x-rr*4,s.y-rr*4,rr*8,rr*8);ctx.globalAlpha=1;
      ctx.fillStyle=`rgba(255,255,255,${a})`;
      ctx.beginPath();ctx.arc(s.x,s.y,rr,0,6.283);ctx.fill();
    }
    // estrelas douradas com cintilação forte
    for(let i=0;i<stars.length;i+=5){
      const s=stars[i],p=(Math.sin(t*0.06+s.ph)+1)*0.5;
      ctx.fillStyle=`rgba(${col},${0.35+p*0.6})`;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r*(1+p),0,6.283);ctx.fill();
      // cruz de brilho nas mais fortes
      if(p>0.85){ctx.strokeStyle=`rgba(${col},${(p-0.85)*3})`;ctx.lineWidth=1;
        const L=s.r*7;ctx.beginPath();ctx.moveTo(s.x-L,s.y);ctx.lineTo(s.x+L,s.y);ctx.moveTo(s.x,s.y-L);ctx.lineTo(s.x,s.y+L);ctx.stroke();}
    }
    // estrela cadente ocasional
    if(!drawStars.sh&&Math.random()<0.008*k)drawStars.sh={x:Math.random()*W*0.7,y:Math.random()*H*0.4,life:0};
    const sh=drawStars.sh;
    if(sh){
      sh.life+=k;const L=90,prog=sh.life/38;
      const x=sh.x+prog*L*3.2,y=sh.y+prog*L*1.5;
      const gr=ctx.createLinearGradient(x-L,y-L*0.47,x,y);
      gr.addColorStop(0,'rgba(255,255,255,0)');
      gr.addColorStop(1,`rgba(255,255,255,${Math.max(0,1-prog)*0.9})`);
      ctx.strokeStyle=gr;ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(x-L,y-L*0.47);ctx.lineTo(x,y);ctx.stroke();
      if(sh.life>38)drawStars.sh=null;
    }
  }

  function drawNebula(){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<blobs.length;i++){
      const bb=blobs[i];
      bb.x+=bb.dx*4*k;bb.y+=bb.dy*4*k;
      if(bb.x<-bb.r)bb.x=W+bb.r;if(bb.x>W+bb.r)bb.x=-bb.r;
      if(bb.y<-bb.r)bb.y=H+bb.r;if(bb.y>H+bb.r)bb.y=-bb.r;
      // respiração: o tamanho pulsa
      const pulse=1+Math.sin(t*0.012+i*1.7)*0.25;
      const R=bb.r*pulse;
      const hue=(bb.h+t*0.15)%360;
      const al=isLight()?0.16:0.30;
      const g=ctx.createRadialGradient(bb.x,bb.y,0,bb.x,bb.y,R);
      g.addColorStop(0,`hsla(${hue},80%,62%,${al})`);
      g.addColorStop(0.45,`hsla(${(hue+40)%360},75%,55%,${al*0.45})`);
      g.addColorStop(1,'hsla(0,0%,0%,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(bb.x,bb.y,R,0,6.283);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
  }

  function drawGradient(){
    // Malha de cor viva — manchas que se movem e misturam
    ctx.clearRect(0,0,W,H);
    const al=isLight()?0.18:0.30;
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){
      const sp=t*0.006+i*1.6;
      const x=W*(0.5+Math.cos(sp*0.9+i)*0.42);
      const y=H*(0.5+Math.sin(sp*1.15+i*2)*0.42);
      const R=Math.max(W,H)*(0.42+Math.sin(sp*0.7+i)*0.10);
      const hue=(t*0.25+i*90)%360;
      const g=ctx.createRadialGradient(x,y,0,x,y,R);
      g.addColorStop(0,`hsla(${hue},72%,55%,${al})`);
      g.addColorStop(1,'hsla(0,0%,0%,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
  }

  function drawMatrix(){
    // Rasto tipo matrix (com a cor de destaque)
    const col=accent();
    ctx.fillStyle=isLight()?`rgba(255,255,255,${(1-Math.pow(.92,k)).toFixed(3)})`:`rgba(10,14,26,${(1-Math.pow(.9,k)).toFixed(3)})`;
    ctx.fillRect(0,0,W,H);
    ctx.font='12px JetBrains Mono, monospace';
    for(const d of drops){
      d.y+=d.sp*k;if(d.y>H+d.len*12){d.y=-Math.random()*100;d.x=Math.random()*W;}
      for(let k=0;k<d.len;k++){
        const ch=String.fromCharCode(0x30A0+Math.floor(Math.random()*40));
        const a=(1-k/d.len)*0.5;
        ctx.fillStyle=`rgba(${col},${a})`;
        ctx.fillText(ch,d.x,d.y-k*12);
      }
    }
  }

  function drawRain(){
    ctx.clearRect(0,0,W,H);
    const col=accent();
    if(!drawRain.sp)drawRain.sp=[];
    ctx.lineCap='round';
    for(const d of drops){
      const depth=d.sp/6;                 // profundidade: mais rápido = mais perto
      d.y+=d.sp*4.2*k;d.x+=0.9*k;         // cai na diagonal
      if(d.y>H){
        drawRain.sp.push({x:d.x,y:H,r:1,a:1});
        d.y=-d.len;d.x=Math.random()*W;
      }
      if(d.x>W)d.x=0;
      const len=d.len*(1+depth*1.6);
      const g=ctx.createLinearGradient(d.x,d.y,d.x+2,d.y+len);
      g.addColorStop(0,`rgba(${col},0)`);
      g.addColorStop(1,`rgba(${col},${0.25+depth*0.5})`);
      ctx.strokeStyle=g;ctx.lineWidth=0.7+depth*1.3;
      ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+2,d.y+len);ctx.stroke();
    }
    // salpicos ao bater no fundo
    for(let i=drawRain.sp.length-1;i>=0;i--){
      const s=drawRain.sp[i];s.r+=0.9*k;s.a-=0.05*k;
      if(s.a<=0){drawRain.sp.splice(i,1);continue;}
      ctx.strokeStyle=`rgba(${col},${s.a*0.5})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,Math.PI,0);ctx.stroke();
    }
  }

  function drawBubbles(){
    ctx.clearRect(0,0,W,H);
    const col=accent();
    for(let i=0;i<bubbles.length;i++){
      const b=bubbles[i];
      b.y-=b.sp*2.6*k;
      b.x+=(b.drift*2+Math.sin(t*0.03+i)*0.7)*k;   // sobe a serpentear
      if(b.y<-b.r){b.y=H+b.r;b.x=Math.random()*W;}
      const wob=1+Math.sin(t*0.05+i*2)*0.12;    // deforma como bolha real
      ctx.save();ctx.translate(b.x,b.y);ctx.scale(wob,1/wob);
      // corpo
      const g=ctx.createRadialGradient(-b.r*0.3,-b.r*0.3,0,0,0,b.r);
      g.addColorStop(0,`rgba(${col},0.22)`);
      g.addColorStop(0.7,`rgba(${col},0.06)`);
      g.addColorStop(1,`rgba(${col},0.14)`);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,b.r,0,6.283);ctx.fill();
      // contorno
      ctx.strokeStyle=`rgba(${col},0.42)`;ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(0,0,b.r,0,6.283);ctx.stroke();
      // reflexo
      ctx.fillStyle='rgba(255,255,255,0.35)';
      ctx.beginPath();ctx.arc(-b.r*0.35,-b.r*0.35,b.r*0.17,0,6.283);ctx.fill();
      ctx.restore();
    }
  }

  let _last=0,_draws=0,_mchk=0,_modal=false,_mt=0;
  function draw(){
    switch(mode){
      case 'aurora':drawAurora();break;
      case 'stars':drawStars();break;
      case 'nebula':drawNebula();break;
      case 'gradient':drawGradient();break;
      case 'matrix':drawMatrix();break;
      case 'rain':drawRain();break;
      case 'bubbles':drawBubbles();break;
      default:drawNet();
    }
  }
  /* 30 fps chega para tudo o que se move devagar (só a chuva fica a 60); o passo «k» mantém a velocidade.
     Pausa com uma janela aberta por cima, com o separador escondido e ao fim de 1 min sem atividade. */
  function frame(now){
    raf=null;
    if(!running||document.hidden||avIdle())return;
    if(now-_mchk>500){_mchk=now;_modal=!!document.querySelector('.modal-overlay.open');}
    if(_modal){_last=0;_mt=setTimeout(()=>{_mt=0;_mchk=0;kick();},500);return;}
    if(_last&&now-_last<(mode==='rain'?12:28)){raf=requestAnimationFrame(frame);return;}
    k=_last?Math.min(4,(now-_last)/16.667):1;_last=now;_draws++;
    t+=k;
    draw();
    raf=requestAnimationFrame(frame);
  }
  function kick(){if(running&&!raf&&!_mt)raf=requestAnimationFrame(frame);}
  function start(){if(mode==='none'||reduce)return;running=true;kick();}
  function stop(){running=false;_last=0;if(raf){cancelAnimationFrame(raf);raf=null;}if(_mt){clearTimeout(_mt);_mt=0;}}
  function setMode(m){
    const soft=!!SOFT[mode]!==!!SOFT[m];
    mode=m;
    stop();
    if(m==='none'){ctx.clearRect(0,0,W,H);cv.style.display='none';return;}
    cv.style.display='';
    if(soft)resize();
    k=1;t++;draw(); // primeiro frame já, mesmo com «reduzir movimento» (fica estático)
    if(!reduce)start();
  }
  AV_IDLE.cbs.push(()=>{_last=0;kick();});
  document.addEventListener('visibilitychange',()=>{_last=0;if(!document.hidden)kick();});
  let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{resize();if(mode!=='none'&&(!running||reduce)){k=1;draw();}},200);});
  resize();
  return {setMode,resize,start,stop,isRunning:()=>running,draws:()=>_draws};
})();

const BG_META={
  net:{pt:'Rede',en:'Network',ico:'🕸️',grad:'linear-gradient(135deg,#0a0e1a,#1a2035)'},
  aurora:{pt:'Aurora Boreal',en:'Aurora',ico:'🌌',grad:'linear-gradient(135deg,#0a0e1a 40%,#2ecc71 70%,#9b59b6 100%)'},
  stars:{pt:'Estrelas',en:'Stars',ico:'✨',grad:'radial-gradient(circle at 30% 30%,#1a2035,#0a0e1a)'},
  nebula:{pt:'Nebulosa',en:'Nebula',ico:'🌫️',grad:'radial-gradient(circle at 60% 40%,#9b59b6,#2c3e50,#0a0e1a)'},
  gradient:{pt:'Gradiente Vivo',en:'Living Gradient',ico:'🎨',grad:'linear-gradient(135deg,#e74c3c,#9b59b6,#3498db)'},
  matrix:{pt:'Matrix',en:'Matrix',ico:'💻',grad:'linear-gradient(180deg,#0a0e1a,#0d2818)'},
  rain:{pt:'Chuva',en:'Rain',ico:'🌧️',grad:'linear-gradient(180deg,#1a2035,#0a0e1a)'},
  bubbles:{pt:'Bolhas',en:'Bubbles',ico:'🫧',grad:'radial-gradient(circle at 50% 70%,#1a2c3a,#0a0e1a)'},
  none:{pt:'Nenhum',en:'None',ico:'⬛',grad:'#0a0e1a'}
};

// ══ ÍCONES DE MARCAS (SVG offline) — deteta pela marca no nome/URL ══
const BRAND_ICONS=[
  {k:['google','gmail','youtube','gdrive','google drive'],c:'#4285F4',svg:'<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>'},
  {k:['facebook','fb.com','messenger'],c:'#1877F2',svg:'<svg viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z"/></svg>'},
  {k:['instagram','insta'],c:'#E4405F',svg:'<svg viewBox="0 0 24 24"><defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset="0.05" stop-color="#fdf497"/><stop offset="0.45" stop-color="#fd5949"/><stop offset="0.6" stop-color="#d6249f"/><stop offset="0.9" stop-color="#285AEB"/></radialGradient></defs><path fill="url(#ig)" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>'},
  {k:['twitter','x.com',' x '],c:'#000',svg:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z"/></svg>'},
  {k:['microsoft','outlook','hotmail','onedrive','office','xbox','live.com'],c:'#00A4EF',svg:'<svg viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>'},
  {k:['apple','icloud','itunes','appstore'],c:'#000',svg:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 12.04c-.03-2.9 2.37-4.3 2.48-4.36-1.35-1.98-3.46-2.25-4.21-2.28-1.79-.18-3.5 1.05-4.41 1.05-.91 0-2.31-1.03-3.8-1-1.96.03-3.77 1.14-4.78 2.9-2.04 3.54-.52 8.78 1.46 11.66.97 1.41 2.12 2.99 3.63 2.93 1.46-.06 2.01-.94 3.77-.94s2.26.94 3.8.91c1.57-.03 2.56-1.43 3.52-2.85 1.11-1.63 1.57-3.21 1.59-3.29-.03-.02-3.05-1.17-3.08-4.64zM14.13 3.62c.81-.98 1.35-2.34 1.2-3.7-1.16.05-2.57.78-3.4 1.75-.75.86-1.4 2.25-1.23 3.58 1.3.1 2.62-.66 3.43-1.63z"/></svg>'},
  {k:['amazon','aws','prime'],c:'#FF9900',svg:'<svg viewBox="0 0 24 24"><path fill="#FF9900" d="M15.93 17.09c-2.14 1.58-5.25 2.42-7.92 2.42-3.74 0-7.11-1.38-9.66-3.68-.2-.18-.02-.43.22-.29 2.75 1.6 6.15 2.56 9.67 2.56 2.37 0 4.98-.49 7.38-1.51.36-.15.66.24.31.5zm.89-1.02c-.27-.35-1.81-.17-2.5-.08-.21.02-.24-.16-.05-.29 1.22-.86 3.23-.61 3.46-.32.24.29-.06 2.3-1.21 3.26-.18.15-.35.07-.27-.12.26-.63.85-2.03.57-2.35z"/><path fill="currentColor" d="M13.7 8.99c0 1.09.03 2-.52 2.97-.44.79-1.15 1.28-1.93 1.28-1.07 0-1.7-.82-1.7-2.02 0-2.38 2.13-2.81 4.15-2.81v.58zm2.83 6.84c-.19.16-.45.18-.66.07-.93-.77-1.1-1.13-1.61-1.87-1.54 1.57-2.63 2.04-4.62 2.04-2.36 0-4.19-1.46-4.19-4.37 0-2.28 1.23-3.83 2.99-4.58 1.52-.67 3.65-.79 5.28-.97v-.36c0-.67.05-1.45-.34-2.02-.34-.51-.99-.72-1.56-.72-1.06 0-2 .54-2.23 1.66-.05.25-.23.5-.48.51l-2.69-.29c-.23-.05-.48-.23-.41-.57C6.13 1.51 8.71.5 11.03.5c1.19 0 2.74.32 3.68 1.21 1.19 1.11 1.08 2.58 1.08 4.19v3.8c0 1.14.47 1.64.92 2.26.15.22.19.48-.01.64-.5.42-1.38 1.18-1.86 1.61z"/></svg>'},
  {k:['netflix'],c:'#E50914',svg:'<svg viewBox="0 0 24 24"><path fill="#E50914" d="M5.4 2.6h4.2l4.8 13.5V2.6h4.2v18.8h-4.2L9.6 7.9v13.5H5.4z"/></svg>'},
  {k:['spotify'],c:'#1DB954',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1DB954"/><path fill="#fff" d="M17.4 16.5c-.2.35-.66.46-1 .25-2.75-1.68-6.2-2.06-10.27-1.13-.4.09-.8-.16-.88-.56-.09-.4.16-.8.56-.88 4.45-1.02 8.27-.58 11.35 1.3.35.2.46.66.24 1.02zm1.44-3.2c-.27.43-.83.57-1.26.3-3.15-1.94-7.95-2.5-11.67-1.37-.48.14-.99-.13-1.14-.61-.14-.48.13-.99.61-1.14 4.26-1.29 9.55-.67 13.17 1.56.42.26.56.82.29 1.26zm.12-3.32C16.68 7.73 10.6 7.53 7.03 8.61c-.58.18-1.19-.15-1.37-.72-.17-.58.15-1.19.73-1.37 4.1-1.24 10.81-1.01 15.08 1.53.52.31.69.98.38 1.5-.31.52-.99.69-1.5.38z"/></svg>'},
  {k:['paypal'],c:'#00457C',svg:'<svg viewBox="0 0 24 24"><path fill="#003087" d="M7.08 21.34l.52-3.3-1.16-.03H3.9L6.19 3.9c.02-.11.13-.19.24-.19h5.86c1.95 0 3.29.4 4 1.2.33.37.54.76.65 1.19.11.45.11.99 0 1.65v.47l.52.3c.44.23.79.5 1.05.81.44.52.72 1.19.84 1.98.12.82.08 1.79-.12 2.89-.23 1.27-.6 2.37-1.11 3.27-.46.83-1.05 1.51-1.75 2.05-.67.51-1.46.9-2.36 1.14-.87.24-1.86.36-2.95.36h-.7c-.5 0-.99.18-1.37.5-.38.33-.63.78-.71 1.27l-.05.29-.92 5.83-.04.21c-.01.07-.03.1-.06.13-.03.02-.07.04-.11.04z"/><path fill="#0070E0" d="M18.11 7.42c-.02.11-.04.22-.06.34-.79 4.06-3.5 5.46-6.95 5.46H9.34c-.42 0-.78.31-.84.72l-.9 5.72-.26 1.62c-.04.27.17.51.44.51h3.11c.37 0 .68-.27.74-.63l.03-.16.58-3.71.04-.2c.06-.36.37-.63.74-.63h.46c3.02 0 5.38-1.23 6.07-4.77.29-1.48.14-2.72-.62-3.58-.23-.26-.52-.48-.86-.66z"/></svg>'},
  {k:['discord'],c:'#5865F2',svg:'<svg viewBox="0 0 24 24"><path fill="#5865F2" d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.3 18.3 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04c-1.7.3-3.33.8-4.89 1.52a.07.07 0 0 0-.03.03C.53 9.09-.32 13.68.1 18.21c0 .02.02.04.04.06a19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.29 1.23-1.99a.08.08 0 0 0-.04-.11c-.65-.25-1.27-.55-1.87-.88a.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.92 1.79 8.16 1.79 12.03 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.36 1.23 1.99a.08.08 0 0 0 .09.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .04-.06c.5-5.25-.84-9.8-3.55-13.81a.06.06 0 0 0-.03-.03zM8.02 15.45c-1.18 0-2.16-1.09-2.16-2.42s.95-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.22 0 2.18 1.1 2.16 2.42 0 1.33-.94 2.42-2.16 2.42z"/></svg>'},
  {k:['linkedin'],c:'#0A66C2',svg:'<svg viewBox="0 0 24 24"><path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .77 0 1.73v20.53C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.73C24 .77 23.2 0 22.22 0z"/></svg>'},
  {k:['whatsapp'],c:'#25D366',svg:'<svg viewBox="0 0 24 24"><path fill="#25D366" d="M.06 24l1.68-6.16A11.87 11.87 0 0 1 .16 11.9C.16 5.34 5.5 0 12.06 0a11.82 11.82 0 0 1 8.41 3.49 11.82 11.82 0 0 1 3.48 8.42c0 6.56-5.34 11.9-11.9 11.9a11.9 11.9 0 0 1-5.68-1.45L.06 24zm6.6-3.8c1.68.99 3.28 1.59 5.4 1.59 5.45 0 9.89-4.43 9.89-9.88 0-5.46-4.42-9.89-9.88-9.89C6.61 2.02 2.18 6.45 2.18 11.9c0 2.23.65 3.9 1.75 5.65l-1 3.63 3.73-.98zM17.42 14.7c-.07-.12-.27-.2-.56-.34-.29-.15-1.73-.86-2-.95-.27-.1-.46-.15-.65.14-.2.29-.75.95-.91 1.14-.17.2-.34.22-.63.07-.29-.14-1.23-.45-2.35-1.44-.87-.78-1.45-1.73-1.62-2.02-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.2.05-.36-.02-.51-.08-.14-.65-1.57-.89-2.15-.24-.57-.47-.49-.65-.5l-.55-.01c-.19 0-.5.07-.76.36s-1 .98-1 2.4 1.03 2.79 1.17 2.98c.15.2 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.32.19 1.81.12.55-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39z"/></svg>'},
  {k:['github'],c:'#181717',svg:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>'},
  {k:['steam'],c:'#171a21',svg:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.98 0C5.66 0 .48 4.87.02 11.07l6.44 2.66a3.4 3.4 0 0 1 1.92-.6l2.86-4.15v-.06a4.53 4.53 0 1 1 4.53 4.53h-.1l-4.09 2.92c0 .05.01.1.01.16a3.4 3.4 0 0 1-6.75.5L.02 15.5A11.99 11.99 0 1 0 11.98 0zm-4.4 18.2l-1.48-.62a2.56 2.56 0 0 0 4.71-1.03 2.55 2.55 0 0 0-3.44-2.4l1.53.63a1.88 1.88 0 1 1-1.32 3.52zm10.98-6.67a3.02 3.02 0 1 0 0-6.04 3.02 3.02 0 0 0 0 6.04zm0-.94a2.08 2.08 0 1 1 0-4.16 2.08 2.08 0 0 1 0 4.16z"/></svg>'},
  {k:['continente','sonae'],c:'#E30613',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E30613"/><text x="12" y="16" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">C</text></svg>'},
  {k:['pingo doce','pingodoce'],c:'#00953B',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00953B"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">PD</text></svg>'},
  {k:['mbway','mb way'],c:'#C4161C',svg:'<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="3" fill="#C4161C"/><text x="12" y="15" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">MB</text></svg>'},
  {k:['ctt'],c:'#DA020E',svg:'<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" fill="#DA020E"/><text x="12" y="15" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">CTT</text></svg>'},
  {k:['nos'],c:'#8246AF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#8246AF"/><text x="12" y="16" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">NOS</text></svg>'},
  {k:['vodafone'],c:'#E60000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E60000"/><path fill="#fff" d="M12 6c-3 0-5 2.4-5 5.5 0 2.5 1.8 4.5 4 4.5.3 0 .6 0 .6-.3 0-.2-.1-.3-.3-.4-1.3-.5-2.2-1.8-2.2-3.4 0-2.2 1.5-4 3.6-4.5.1 0 .3-.1.3-.3 0-.4-.5-.6-1-.6z"/></svg>'},
  {k:['meo','altice'],c:'#00A9E0',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00A9E0"/><text x="12" y="16" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">meo</text></svg>'},
  {k:['tiktok'],c:'#000',svg:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.83.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>'},
  {k:['reddit'],c:'#FF4500',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path fill="#fff" d="M20 12c0-.97-.79-1.75-1.75-1.75-.47 0-.9.19-1.21.49-1.2-.86-2.85-1.42-4.68-1.49l.8-3.76 2.61.55a1.25 1.25 0 1 0 .14-.83l-2.92-.62a.42.42 0 0 0-.5.32l-.89 4.18c-1.86.06-3.53.62-4.75 1.49a1.75 1.75 0 1 0-1.93 2.87c-.02.16-.03.32-.03.48 0 2.45 2.85 4.43 6.36 4.43s6.36-1.98 6.36-4.43c0-.16-.01-.32-.03-.48A1.75 1.75 0 0 0 20 12zm-11 1.25a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0zm6.98 3.32c-.86.86-2.5.92-2.98.92-.48 0-2.12-.06-2.98-.92a.33.33 0 0 1 .46-.46c.54.54 1.7.73 2.52.73.82 0 1.98-.19 2.52-.73a.33.33 0 0 1 .46.46zm-.23-2.07a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>'},
  {k:['revolut'],c:'#0666EB',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0666EB"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">R</text></svg>'},
  {k:['trade republic','traderepublic'],c:'#000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">TR</text></svg>'},
  {k:['xtb'],c:'#E30613',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E30613"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">XTB</text></svg>'},
  {k:['degiro'],c:'#003D7C',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#003D7C"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">D</text></svg>'},
  {k:['etoro'],c:'#13C636',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#13C636"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">e</text></svg>'},
  {k:['binance'],c:'#F0B90B',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#F0B90B"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial,sans-serif">B</text></svg>'},
  {k:['coinbase'],c:'#0052FF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0052FF"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">C</text></svg>'},
  {k:['wise','transferwise'],c:'#9FE870',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#9FE870"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#163300" text-anchor="middle" font-family="Arial,sans-serif">W</text></svg>'},
  {k:['n26'],c:'#48AC98',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#48AC98"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">N26</text></svg>'},
  {k:['klarna'],c:'#FFB3C7',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFB3C7"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial,sans-serif">K</text></svg>'},
  {k:['moey'],c:'#00C1B5',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00C1B5"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">m</text></svg>'},
  {k:['santander'],c:'#EC0000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#EC0000"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">S</text></svg>'},
  {k:['universo'],c:'#7B2D8E',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#7B2D8E"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">U</text></svg>'},
  {k:['millennium','bcp','millenium'],c:'#D4001A',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#D4001A"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">M</text></svg>'},
  {k:['caixa','cgd','caixa geral'],c:'#009640',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#009640"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">CGD</text></svg>'},
  {k:['novo banco','novobanco'],c:'#00A19A',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00A19A"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">NB</text></svg>'},
  {k:['bpi'],c:'#0033A0',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0033A0"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">BPI</text></svg>'},
  {k:['montepio'],c:'#00954C',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00954C"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">M</text></svg>'},
  {k:['crédito agrícola','credito agricola','creditoagricola'],c:'#6EA204',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#6EA204"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">CA</text></svg>'},
  {k:['activobank','activo bank'],c:'#EE7203',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#EE7203"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">A</text></svg>'},
  {k:['abanca'],c:'#00A0DF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00A0DF"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">A</text></svg>'},
  {k:['eurobic','bic'],c:'#005CA9',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#005CA9"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">BIC</text></svg>'},
  {k:['bankinter'],c:'#FF6600',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FF6600"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">B</text></svg>'},
  {k:['disney','disney+','disneyplus'],c:'#113CCF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#113CCF"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">D+</text></svg>'},
  {k:['hbo','hbo max','max'],c:'#5822B4',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#5822B4"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">HBO</text></svg>'},
  {k:['prime video','primevideo','amazon prime'],c:'#1399FF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00A8E1"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">PV</text></svg>'},
  {k:['twitch'],c:'#9146FF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#9146FF"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">T</text></svg>'},
  {k:['dazn'],c:'#F8F808',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#F8F808"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial,sans-serif">D</text></svg>'},
  {k:['rtp','rtp play'],c:'#00A9A6',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00A9A6"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">RTP</text></svg>'},
  {k:['sic'],c:'#E30613',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E30613"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">SIC</text></svg>'},
  {k:['tvi'],c:'#003DA5',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#003DA5"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">TVI</text></svg>'},
  {k:['worten'],c:'#E30613',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E30613"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">W</text></svg>'},
  {k:['fnac'],c:'#E1A700',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E1A700"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial,sans-serif">F</text></svg>'},
  {k:['ikea'],c:'#0058A3',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0058A3"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#FFDA1A" text-anchor="middle" font-family="Arial,sans-serif">I</text></svg>'},
  {k:['leroy merlin','leroymerlin'],c:'#78BE20',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#78BE20"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">LM</text></svg>'},
  {k:['aliexpress'],c:'#E43225',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E43225"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">Ali</text></svg>'},
  {k:['ebay'],c:'#E53238',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E53238"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">e</text></svg>'},
  {k:['zalando'],c:'#FF6900',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FF6900"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">Z</text></svg>'},
  {k:['glovo'],c:'#FFC244',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFC244"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#00A082" text-anchor="middle" font-family="Arial,sans-serif">G</text></svg>'},
  {k:['uber eats','ubereats'],c:'#06C167',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#06C167"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">UE</text></svg>'},
  {k:['uber'],c:'#000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">U</text></svg>'},
  {k:['bolt'],c:'#34D186',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#34D186"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">B</text></svg>'},
  {k:['booking','booking.com'],c:'#003580',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#003580"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">B</text></svg>'},
  {k:['airbnb'],c:'#FF5A5F',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FF5A5F"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">A</text></svg>'},
  {k:['ryanair'],c:'#073590',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#073590"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#F1C933" text-anchor="middle" font-family="Arial,sans-serif">R</text></svg>'},
  {k:['tap','tap air','tap portugal'],c:'#00A3E0',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00A3E0"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">TAP</text></svg>'},
  {k:['dropbox'],c:'#0061FF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0061FF"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">D</text></svg>'},
  {k:['telegram'],c:'#26A5E4',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#26A5E4"/><path fill="#fff" d="M5.5 11.7l11-4.24c.51-.19.96.12.79.9l-1.87 8.82c-.14.66-.54.82-1.09.51l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.09 5.6-5.06c.24-.21-.05-.33-.38-.12L7.8 13.02l-2.98-.93c-.65-.2-.66-.65.14-.96z"/></svg>'},
  {k:['signal'],c:'#3A76F0',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#3A76F0"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">S</text></svg>'},
  {k:['pinterest'],c:'#BD081C',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#BD081C"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">P</text></svg>'},
  {k:['snapchat'],c:'#FFFC00',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFFC00"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial,sans-serif">S</text></svg>'},
  {k:['twitch'],c:'#9146FF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#9146FF"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">T</text></svg>'},
  {k:['notion'],c:'#000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">N</text></svg>'},
  {k:['slack'],c:'#4A154B',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#4A154B"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">S</text></svg>'},
  {k:['zoom'],c:'#0B5CFF',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0B5CFF"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">Z</text></svg>'},
  {k:['adobe'],c:'#FF0000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FF0000"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">A</text></svg>'},
  {k:['canva'],c:'#00C4CC',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#00C4CC"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">C</text></svg>'},
  {k:['openai','chatgpt','chat gpt'],c:'#000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#10A37F"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">AI</text></svg>'},
  {k:['anthropic','claude'],c:'#D97757',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#D97757"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">C</text></svg>'},
  {k:['epic games','epicgames','epic'],c:'#000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2A2A2A"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">E</text></svg>'},
  {k:['playstation','psn'],c:'#003791',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#003791"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">PS</text></svg>'},
  {k:['nintendo'],c:'#E60012',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E60012"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">N</text></svg>'},
  {k:['riot','riot games','league of legends'],c:'#D13639',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#D13639"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">R</text></svg>'},
  {k:['mercadolibre','mercado livre'],c:'#FFE600',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFE600"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial,sans-serif">ML</text></svg>'},
  {k:['temu'],c:'#FB7701',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FB7701"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">T</text></svg>'},
  {k:['shein'],c:'#000',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">S</text></svg>'},
  {k:['edp'],c:'#32C832',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#32C832"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">EDP</text></svg>'},
  {k:['galp'],c:'#FF5F00',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FF5F00"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">G</text></svg>'},
  {k:['endesa'],c:'#0072CE',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0072CE"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">E</text></svg>'},
  {k:['iberdrola'],c:'#8AC53F',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#8AC53F"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">I</text></svg>'},
  {k:['águas','aguas','epal'],c:'#0093D0',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0093D0"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">A</text></svg>'},
  {k:['via verde','viaverde'],c:'#009B3A',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#009B3A"/><text x="12" y="16" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">VV</text></svg>'},
  {k:['ctt'],c:'#DA020E',svg:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#DA020E"/><text x="12" y="16" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">CTT</text></svg>'}
];
let _brandMatchers=null;
function getBrandIcon(entry){
  if(!entry)return null;
  const hay=((entry.name||'')+' '+(entry.url||'')).toLowerCase();
  // Keys curtas (<=3): exigir limite de palavra para evitar falsos positivos
  if(!_brandMatchers)_brandMatchers=BRAND_ICONS.map(b=>({svg:b.svg,ms:b.k.map(k=>k.trim()).filter(Boolean).map(wordKeyMatcher)}));
  for(const b of _brandMatchers)for(const m of b.ms)if(keyMatches(m,hay))return b.svg;
  return null;
}

const ENTRY_FLAGS=[
  {id:'',pt:'Nenhuma',en:'None',color:''},
  {id:'red',pt:'A rever',en:'Review',color:'#e05252'},
  {id:'green',pt:'Segura',en:'Secure',color:'#4caf82'},
  {id:'blue',pt:'Importante',en:'Important',color:'#5b8def'},
  {id:'orange',pt:'Partilhada',en:'Shared',color:'#e0982a'},
  {id:'purple',pt:'Pessoal',en:'Personal',color:'#a970d0'}
];
let selectedFlag='';
function renderFlagPicker(){
  const box=document.getElementById('f-flag-picker');
  if(!box)return;
  const en=currentLang==='en';
  box.innerHTML=ENTRY_FLAGS.map(f=>{
    const sel=f.id===selectedFlag;
    if(!f.id){
      return `<button type="button" class="flag-opt${sel?' active':''}" data-act="pickFlag" data-arg="" title="${en?f.en:f.pt}"><span class="flag-none">∅</span> ${en?f.en:f.pt}</button>`;
    }
    return `<button type="button" class="flag-opt${sel?' active':''}" data-act="pickFlag" data-arg="${esc(f.id)}" title="${en?f.en:f.pt}"><span class="flag-dot" style="background:${f.color}"></span> ${en?f.en:f.pt}</button>`;
  }).join('');
}
function saveVaultName(){
  const inp=document.getElementById('s-name-input');
  if(!inp)return;
  vaultName=inp.value.trim();
  markUnsaved();
  renderGreeting();
  toast(currentLang==='en'?'Name saved!':'Nome guardado!');
}
function renderBgPicker(){
  const box=document.getElementById('bg-picker');
  if(!box)return;
  const en=currentLang==='en';
  box.innerHTML=BG_STYLES.map(st=>{
    const m=BG_META[st];
    return `<button class="bg-opt${st===currentBg?' active':''}" data-act="setBackground" data-arg="${esc(st)}">
      <span class="bg-opt-preview" style="background:${m.grad}">${st===currentBg?'<span class=\'bg-opt-check\'>✓</span>':''}</span>
      <span class="bg-opt-name">${m.ico} ${en?m.en:m.pt}</span>
    </button>`;
  }).join('');
}
function setBackground(style){
  if(!BG_STYLES.includes(style))style='net';
  currentBg=style;
  try{localStorage.setItem('cv_bg',style);}catch(e){}
  if(AuroraBG)AuroraBG.setMode(style);
  renderBgPicker();
}
if(AuroraBG)AuroraBG.setMode(currentBg);
window._bgNetResize=()=>{if(AuroraBG)AuroraBG.resize();};

// ══ FORÇA DA PALAVRA-PASSE MESTRA ══
function assessMasterPw(pw){
  // Devolve {score:0-4, label, cls, tip, entropyBits}
  const en=currentLang==='en';
  if(!pw)return{score:0,label:'',cls:'',tip:'',bits:0};
  let pool=0;
  if(/[a-z]/.test(pw))pool+=26;
  if(/[A-Z]/.test(pw))pool+=26;
  if(/[0-9]/.test(pw))pool+=10;
  if(/[^a-zA-Z0-9]/.test(pw))pool+=32;
  const bits=pw.length*Math.log2(pool||1);
  const onlyDigits=/^[0-9]+$/.test(pw);
  const onlyLower=/^[a-z]+$/.test(pw);
  // Padrões óbvios
  const seq=/0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv/i.test(pw);
  const repeated=/^(.)\1+$/.test(pw)||/(.)\1{3,}/.test(pw);
  let score,label,cls,tip;
  if(onlyDigits){
    score=pw.length>=16?2:1;
    cls=pw.length>=16?'medium':'weak';
    label=en?'Digits only':'Só números';
    tip=en?'Only numbers — cracks fast even if long. Add letters.':'Só números — quebra-se depressa mesmo sendo longa. Adiciona letras.';
  }else if(bits<40){
    score=1;cls='weak';label=en?'Weak':'Fraca';
    tip=en?'Too short or simple. Make it longer and mix character types.':'Curta ou simples demais. Torna-a mais longa e mistura tipos de caracteres.';
  }else if(bits<60){
    score=2;cls='medium';label=en?'Fair':'Razoável';
    tip=en?'Decent. Adding length or symbols makes it much stronger.':'Aceitável. Mais comprimento ou símbolos torna-a muito mais forte.';
  }else if(bits<78){
    score=3;cls='good';label=en?'Strong':'Forte';
    tip=en?'Good password — hard to crack.':'Boa palavra-passe — difícil de quebrar.';
  }else{
    score=4;cls='great';label=en?'Excellent':'Excelente';
    tip=en?'Excellent — would take centuries to crack.':'Excelente — levaria séculos a quebrar.';
  }
  // Penalizações por padrão óbvio
  if((seq||repeated)&&score>1){
    score=1;cls='weak';label=en?'Predictable':'Previsível';
    tip=en?'Contains an obvious pattern (like 1234 or repeats). Avoid it.':'Tem um padrão óbvio (como 1234 ou repetições). Evita-o.';
  }
  return{score,label,cls,tip,bits:Math.round(bits)};
}
function renderPwStrength(inputId,barId){
  const inp=document.getElementById(inputId);
  const box=document.getElementById(barId);
  if(!inp||!box)return;
  const r=assessMasterPw(inp.value);
  if(!inp.value){box.style.display='none';return;}
  box.style.display='block';
  const segs=[1,2,3,4].map(n=>`<span class="pwbar-seg ${n<=r.score?r.cls:''}"></span>`).join('');
  box.innerHTML=`<div class="pwbar">${segs}</div><div class="pwbar-label ${r.cls}">${r.label}${r.bits?` · ${r.bits} bits`:''}</div><div class="pwbar-tip">${r.tip}</div>`;
}

// ══ DASHBOARD — CARTÕES EXPANSÍVEIS ══
function toggleDashCard(key){
  const card=document.getElementById('dcard-'+key);
  if(!card)return;
  const open=card.classList.toggle('open');
  try{localStorage.setItem('cv_dcard_'+key,open?'1':'0');}catch(e){}
}
function applyDashCardStates(){
  // Todos fechados por omissão (escolha do utilizador)
  ['alerts','report','favs','cats','oldest','activity'].forEach(key=>{
    const card=document.getElementById('dcard-'+key);
    if(!card)return;
    let open=false;
    try{open=localStorage.getItem('cv_dcard_'+key)==='1';}catch(e){}
    card.classList.toggle('open',open);
  });
}

// ══ ROTAÇÃO DE CÓPIAS (instantâneos locais encriptados) ══
const SNAP_KEEP=5;
async function pushSnapshot(container){
  try{
    const meta={entries:vault.filter(e=>!e.archived).length,docs:documents.length,cards:bankCards.length,notes:notes.filter(n=>!n.archived).length,protected2fa:!!totpRecWrap};
    let list=await idbGet('cv_snapshots');
    if(!Array.isArray(list))list=[];
    list.unshift({at:Date.now(),container,meta});
    // Não guardar duplicados exatos seguidos (mesma gravação repetida). Cada gravação tem IV novo, por isso basta
    // comparar IV + dados — o JSON.stringify de dois cofres inteiros (vários MB com documentos) corria em cada gravação.
    const same=(x,y)=>x===y||(Array.isArray(x)&&Array.isArray(y)&&x.length===y.length&&x.every((v,i)=>v===y[i]));
    const p0=list[0].container&&list[0].container.payload,p1=list[1]&&list[1].container&&list[1].container.payload;
    if(p0&&p1&&same(p0.iv,p1.iv)&&same(p0.data,p1.data))list.shift();
    if(list.length>SNAP_KEEP)list=list.slice(0,SNAP_KEEP);
    await idbSet('cv_snapshots',list);
  }catch(e){/* best-effort: nunca bloqueia a gravação */}
}
async function getSnapshots(){
  try{const l=await idbGet('cv_snapshots');return Array.isArray(l)?l:[];}catch(e){return [];}
}
async function clearSnapshots(){try{await idbDel('cv_snapshots');}catch(e){}}
async function openSnapshotModal(){
  const en=currentLang==='en';
  document.getElementById('snap-title').textContent=en?'💾 Backups':'💾 Cópias de Segurança';
  document.getElementById('snap-intro').textContent=en
    ?`The app keeps the last ${SNAP_KEEP} snapshots automatically, each time you save — encrypted, on this device only. If something goes wrong, roll back to any of them.`
    :`A app guarda automaticamente as últimas ${SNAP_KEEP} cópias, sempre que gravas — encriptadas, só neste dispositivo. Se algo correr mal, volta a qualquer uma delas.`;
  document.getElementById('snap-clear-txt').textContent=en?'Delete all snapshots':'Apagar todas as cópias';
  document.getElementById('snap-close-btn').textContent=en?'Close':'Fechar';
  await renderSnapshotList();
  document.getElementById('snap-overlay').classList.add('open');
}
function closeSnapshotModal(){document.getElementById('snap-overlay').classList.remove('open');}
async function renderSnapshotList(){
  const en=currentLang==='en';
  const list=await getSnapshots();
  const el=document.getElementById('snap-list');
  if(!list.length){
    el.innerHTML=`<div style="font-size:.72rem;color:var(--text-muted);text-align:center;padding:16px">${en?'No snapshots yet. They are created each time you save.':'Ainda sem cópias. São criadas sempre que gravas.'}</div>`;
    return;
  }
  el.innerHTML=list.map((s,i)=>{
    const d=new Date(s.at);
    const when=d.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short',year:'numeric'})+' · '+d.toLocaleTimeString(en?'en-GB':'pt-PT',{hour:'2-digit',minute:'2-digit'});
    const m=s.meta||{};
    const bits=[`${m.entries||0} ${en?'accounts':'contas'}`];
    if(m.docs)bits.push(`${m.docs} ${en?'docs':'docs'}`);
    if(m.cards)bits.push(`${m.cards} ${en?'cards':'cartões'}`);
    if(m.notes)bits.push(`${m.notes} ${en?'notes':'notas'}`);
    if(m.protected2fa)bits.push('🛡️ 2FA');
    return `<div class="snap-item ${i===0?'latest':''}">
      <span style="font-size:1.2rem">${i===0?'🟢':'💾'}</span>
      <div class="snap-body">
        <div class="snap-when">${when}${i===0?` · <span style="color:var(--accent-ink);font-size:.66rem">${en?'most recent':'mais recente'}</span>`:''}</div>
        <div class="snap-meta">${bits.join(' · ')}</div>
      </div>
      <button class="snap-restore" data-act="restoreSnapshot" data-args='[${i}]'>${en?'Restore':'Restaurar'}</button>
    </div>`;
  }).join('');
}
async function clearSnapshotsConfirm(){
  const en=currentLang==='en';
  if(!confirm(en?'Delete all saved snapshots? This cannot be undone.':'Apagar todas as cópias guardadas? Isto não pode ser desfeito.'))return;
  await clearSnapshots();
  await renderSnapshotList();
  toast(en?'Snapshots deleted.':'Cópias apagadas.');
}
async function restoreSnapshot(idx){
  const en=currentLang==='en';
  const list=await getSnapshots();
  const snap=list[idx];
  if(!snap){toast(en?'Snapshot not found.':'Cópia não encontrada.');return;}
  if(!masterKey){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  // Decifrar o instantâneo com a chave mestra ATUAL (o salt está no container)
  let data;
  try{
    const salt=new Uint8Array(snap.container.salt);
    const key=await deriveKey(masterPwRaw,salt,containerIter(snap.container));
    data=await decrypt(key,snap.container.payload);
  }catch(e){
    alert(en?'Could not open this snapshot with the current master password. It may be from before a password change.':'Não foi possível abrir esta cópia com a palavra-passe atual. Pode ser de antes de uma mudança de palavra-passe.');
    return;
  }
  const when=new Date(snap.at).toLocaleString(en?'en-GB':'pt-PT');
  if(!confirm(en
    ?`Restore the vault to the snapshot from ${when}?\n\nYour current state will be replaced (but a fresh snapshot is kept, so this is reversible).`
    :`Restaurar o cofre para a cópia de ${when}?\n\nO estado atual será substituído (mas fica guardada uma cópia nova, por isso é reversível).`))return;
  // Guardar primeiro o estado atual, para o restauro ser reversível
  try{
    if(totpUnlocked)totpEnc=await encryptTotpArray();
    const ks=keySnap(),cur=await encrypt(ks.key,vaultPayload());
    await pushSnapshot(mkContainer(ks,cur));
  }catch(e){}
  // Aplicar os dados do instantâneo
  vault=data.vault||[];notes=data.notes||[];bankCards=data.bankCards||[];
  activityLog=data.activityLog||[];documents=data.documents||[];trash=data.trash||[];personalInfo=data.personalInfo||[];subscriptions=data.subscriptions||[];storeCards=data.storeCards||[];assets=data.assets||[];vaultName=data.vaultName||'';
  customCats=data.customCats||[];docFolders=data.docFolders||[];vaultFolders=data.vaultFolders||[];
  wifiNets=data.wifiNets||[];legacyNote=data.legacyNote||'';legacyOwner=data.legacyOwner||'';
  totpRecWrap=data.totpRecWrap||null;totpEnc=data.totpEnc||null;totpKey=null;totpUnlocked=false;
  totp=totpRecWrap?[]:(data.totp||[]);
  payloadExtras={};
  Object.keys(data).forEach(k=>{if(!KNOWN_KEYS.includes(k))payloadExtras[k]=data[k];});
  currentFolderId=null;currentVaultFolderId=null;
  logActivity('restore',en?'Snapshot restored':'Cópia restaurada','⏳');
  markUnsaved();
  closeSnapshotModal();
  renderAll();
  toast(en?'Vault restored ✓ — save to keep it.':'Cofre restaurado ✓ — grava para manter.');
}

// ══ VERIFICAÇÃO DE FUGAS (Have I Been Pwned — k-anonymity) ══
async function sha1Hex(str){
  const buf=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function renderBreachTip(){
  const en=currentLang==='en';
  const tip=document.getElementById('breach-tip');
  if(tip)tip.innerHTML=en
    ? `<b>Is this safe?</b> Yes — your password never leaves your device.<br><br>The app turns it into a one-way fingerprint and sends only the <b>first 5 characters</b>:<br><span style="display:block;font-family:monospace;font-size:.6rem;background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:10px 11px;margin:9px 0;line-height:1.8">Your password:&nbsp;&nbsp;<b style="color:var(--text)">password</b><br>Full hash:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="opacity:.55">5BAA61E4C9B93F…</span><br>What is <b style="color:var(--accent-ink)">SENT</b>:&nbsp;<b style="color:var(--accent-ink)">5BAA6</b> <span style="opacity:.5">← only this</span><br>What <b style="color:var(--green)">STAYS</b>:&nbsp;<span style="opacity:.55">1E4C9B93F…</span> <span style="opacity:.5">← never sent</span></span>Those 5 characters match <b>hundreds</b> of different passwords, so no one can tell which is yours — and a fingerprint can't be turned back into a password. Same method used by 1Password and Firefox.`
    : `<b>Isto é seguro?</b> Sim — a tua password nunca sai do teu dispositivo.<br><br>A app transforma-a numa impressão digital de sentido único e envia só os <b>primeiros 5 caracteres</b>:<br><span style="display:block;font-family:monospace;font-size:.6rem;background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:10px 11px;margin:9px 0;line-height:1.8">A tua password:&nbsp;&nbsp;<b style="color:var(--text)">password</b><br>Hash completo:&nbsp;&nbsp;&nbsp;<span style="opacity:.55">5BAA61E4C9B93F…</span><br>O que <b style="color:var(--accent-ink)">SAI</b>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b style="color:var(--accent-ink)">5BAA6</b> <span style="opacity:.5">← só isto</span><br>O que <b style="color:var(--green)">FICA</b>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="opacity:.55">1E4C9B93F…</span> <span style="opacity:.5">← nunca sai</span></span>Esses 5 caracteres correspondem a <b>centenas</b> de passwords diferentes, por isso ninguém sabe qual é a tua — e uma impressão digital não pode ser revertida para a password. É o mesmo método do 1Password e do Firefox.`;
  const bt=document.getElementById('breach-btn-txt');
  if(bt)bt.textContent=en?'Check for password breaches':'Verificar fugas de passwords';
}
async function checkBreaches(){
  const en=currentLang==='en';
  const btn=document.getElementById('breach-btn');
  const status=document.getElementById('breach-status');
  const out=document.getElementById('breach-results');
  if(!navigator.onLine){
    status.textContent=en?'⚠️ No connection — this check needs the internet.':'⚠️ Sem ligação — esta verificação precisa de internet.';
    return;
  }
  const active=vault.filter(e=>!e.archived&&e.pw);
  if(!active.length){status.textContent=en?'No passwords to check.':'Sem passwords para verificar.';return;}
  btn.disabled=true;
  out.innerHTML='';
  const uniquePws=[...new Set(active.map(e=>e.pw))];
  const pwCount={};
  let done=0,failed=0;
  const breached=[];
  for(const pw of uniquePws){
    status.textContent=(en?'Checking… ':'A verificar… ')+`${done+1}/${uniquePws.length}`;
    try{
      const hash=await sha1Hex(pw);
      const prefix=hash.slice(0,5),suffix=hash.slice(5);
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),8000);
      const resp=await fetch('https://api.pwnedpasswords.com/range/'+prefix,{signal:ctrl.signal});
      clearTimeout(timer);
      if(!resp.ok)throw new Error('http');
      const text=await resp.text();
      const line=text.split('\n').find(l=>l.split(':')[0].trim().toUpperCase()===suffix);
      pwCount[pw]=line?parseInt(line.split(':')[1].trim(),10)||0:0;
    }catch(e){failed++;pwCount[pw]=-1;}
    done++;
  }
  // Reunir por entrada
  active.forEach(e=>{
    const n=pwCount[e.pw];
    if(n>0)breached.push({name:e.name,count:n});
  });
  breached.sort((a,b)=>b.count-a.count);
  const okCount=active.length-breached.length-active.filter(e=>pwCount[e.pw]===-1).length;
  let html='';
  if(breached.length){
    html+=`<div class="breach-summary dirty"><b>⚠️ ${breached.length} ${en?'password(s) found in known breaches':'password(s) encontradas em fugas conhecidas'}</b><br>${en?'Change these as soon as you can — reusing them is risky.':'Muda estas assim que puderes — reutilizá-las é arriscado.'}</div>`;
    html+=breached.map(b=>`<div class="breach-row pwned"><span style="font-size:1.1rem">🚨</span><div class="breach-row-body"><div class="breach-row-name">${esc(b.name)}</div><div class="breach-row-meta">${en?'seen in':'vista em'} ${b.count.toLocaleString(en?'en':'pt')} ${en?'breaches':'fugas'}</div></div></div>`).join('');
  }else if(failed<uniquePws.length){
    html+=`<div class="breach-summary clean"><b>✅ ${en?'No breaches found':'Nenhuma fuga encontrada'}</b><br>${en?`None of your ${active.length} passwords appear in known breaches.`:`Nenhuma das tuas ${active.length} passwords aparece em fugas conhecidas.`}</div>`;
  }
  if(failed>0)html+=`<div style="font-size:.68rem;color:var(--text-muted);margin-top:6px">${failed} ${en?'password(s) could not be checked (connection issue).':'password(s) não puderam ser verificadas (problema de ligação).'}</div>`;
  out.innerHTML=html;
  status.textContent=en?`Done · ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`:`Concluído · ${new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}`;
  btn.disabled=false;
}
function refreshBreachButton(){
  const en=currentLang==='en';
  const btn=document.getElementById('breach-btn');
  const status=document.getElementById('breach-status');
  if(!btn)return;
  renderBreachTip();
  if(!navigator.onLine){
    btn.style.opacity='.5';
    if(status)status.textContent=en?'Offline — needs internet':'Offline — precisa de internet';
  }else{
    btn.style.opacity='1';
    if(status&&status.textContent.includes(en?'Offline':'Offline'))status.textContent='';
  }
}

// ══ CATEGORIAS PERSONALIZADAS ══
function populateCatSelect(){
  const fc=document.getElementById('f-cat');if(!fc)return;
  const cur=fc.value;
  fc.innerHTML=allEntryCats().map(ci=>`<option value="${ci.key}">${ci.icon} ${esc(ci.label)}</option>`).join('');
  if([...fc.options].some(o=>o.value===cur))fc.value=cur;
}
function renderCatManager(){
  const list=document.getElementById('catmgr-list');if(!list)return;
  const icon=document.getElementById('catmgr-icon');
  const nameInp=document.getElementById('catmgr-name');
  if(nameInp)nameInp.placeholder=currentLang==='en'?'Category name':'Nome da categoria';
  if(!customCats.length){
    list.innerHTML=`<div style="font-size:.72rem;color:var(--text-muted);padding:6px 0 2px">${currentLang==='en'?'No custom categories yet.':'Ainda sem categorias personalizadas.'}</div>`;
    return;
  }
  list.innerHTML=customCats.map(cu=>{
    const count=vault.filter(e=>e.cat===cu.key).length;
    return `<div class="catmgr-row">
      <span class="catmgr-dot" style="background:${cu.color}"></span>
      <span style="font-size:1rem">${cu.icon}</span>
      <span style="flex:1;color:var(--text)">${esc(cu.name)}</span>
      <span style="color:var(--text-muted);font-size:.68rem">${count} ${currentLang==='en'?(count===1?'entry':'entries'):(count===1?'entrada':'entradas')}</span>
      <button class="card-btn danger" data-act="deleteCustomCat" data-arg="${esc(cu.key)}" style="padding:5px 9px">✕</button>
    </div>`;
  }).join('');
}
function addCustomCat(){
  const icon=(document.getElementById('catmgr-icon').value||'📁').trim()||'📁';
  const name=document.getElementById('catmgr-name').value.trim();
  const color=document.getElementById('catmgr-color').value||'#4c8caf';
  if(!name){toast(currentLang==='en'?'Category name is required!':'Nome da categoria obrigatório!');return;}
  if(allEntryCats().some(ci=>ci.label.toLowerCase()===name.toLowerCase())){
    toast(currentLang==='en'?'That category already exists!':'Essa categoria já existe!');return;
  }
  customCats.push({key:'c'+Date.now().toString(36),name,icon,color});
  document.getElementById('catmgr-name').value='';
  document.getElementById('catmgr-icon').value='';
  logActivity('add',name,'🎨');
  renderCatManager();populateCatSelect();renderSidebar();renderCards();renderDashboard();
  toast(currentLang==='en'?'Category created! ✓':'Categoria criada! ✓');
  markUnsaved();
}
function deleteCustomCat(key){
  const cu=customCats.find(x=>x.key===key);if(!cu)return;
  const count=vault.filter(e=>e.cat===key).length;
  const msg=count
    ?(currentLang==='en'?`Delete "${cu.name}"? ${count} entries will move to 📁 Other.`:`Apagar "${cu.name}"? ${count} entradas passam para 📁 Outro.`)
    :(currentLang==='en'?`Delete category "${cu.name}"?`:`Apagar a categoria "${cu.name}"?`);
  if(!confirm(msg))return;
  vault.forEach(e=>{if(e.cat===key)e.cat='outro';});
  if(currentCat===key)currentCat='all';
  customCats=customCats.filter(x=>x.key!==key);
  logActivity('delete',cu.name,'🎨');
  renderCatManager();populateCatSelect();renderSidebar();renderCards();renderDashboard();
  toast(currentLang==='en'?'Category deleted.':'Categoria apagada.');
  markUnsaved();
}

// ══ INFO DO COFRE ══
function estimateVaultBytes(){
  try{return new Blob([JSON.stringify(vaultPayload())]).size;}
  catch(e){return 0;}
}
function renderVaultInfo(){
  const grid=document.getElementById('vault-info-grid');if(!grid)return;
  const en=currentLang==='en';
  const activeN=vault.filter(e=>!e.archived).length;
  const archN=vault.filter(e=>e.archived).length;
  const bytes=estimateVaultBytes();
  const fileEst=Math.round(bytes*4/3);
  const rows=[
    [en?'Version':'Versão','v'+APP_VERSION],
    [en?'Entries':'Entradas',`${activeN}${archN?` (+${archN} 📦)`:''}`],
    [en?'Notes':'Notas',String(notes.length)],
    [en?'Bank cards':'Cartões',String(bankCards.length)],
    [en?'Documents':'Documentos',String(documents.length)],
    [en?'Folders':'Pastas',String(docFolders.length+vaultFolders.length)],
    ['WiFi',String(wifiNets.length)],
    ['2FA',String(totp.length)],
    [en?'Recycle bin':'Reciclagem',String(trash.length)],
    [en?'Vault size (est.)':'Tamanho (aprox.)','~'+formatFileSize(fileEst)],
    [en?'Last saved':'Último guardar',lastSavedAt?new Date(lastSavedAt).toLocaleTimeString(en?'en-GB':'pt-PT',{hour:'2-digit',minute:'2-digit'}):'—'],
  ];
  grid.innerHTML=rows.map(([l,v])=>`<div class="vinfo-row"><span class="vinfo-label">${l}</span><span class="vinfo-val">${v}</span></div>`).join('');
  if(hasUnsaved){
    grid.innerHTML+=`<div class="vinfo-row" style="grid-column:1/-1;border-color:var(--accent-dim)"><span class="vinfo-label" style="color:var(--accent-ink)">⚠️ ${en?'Unsaved changes — remember to save the file!':'Alterações por guardar — lembra-te de guardar o ficheiro!'}</span></div>`;
  }
}

// ══ ORDENAR DOCUMENTOS ══
function setDocSort(v){currentDocSort=v;renderDocs();}

// ══ SUB2 CÍCLICO + INSTALAR PWA ══
const SUB2_ITEMS={pt:['Passwords','Documentos','Notas','Cartões','2FA'],en:['Passwords','Documents','Notes','Cards','2FA']};
let sub2Idx=0;
function renderSub2(){
  const el=document.getElementById('l-sub2');if(!el)return;
  const items=SUB2_ITEMS[currentLang]||SUB2_ITEMS.pt;
  el.innerHTML=items.map((w,i)=>`<span class="sub2-word${i===(sub2Idx%items.length)?' active':''}">${w}</span>`).join('<span class="sub2-sep">·</span>');
}
setInterval(()=>{
  if(document.hidden)return;
  const el=document.getElementById('l-sub2');
  if(!el||!el.offsetParent)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  sub2Idx++;renderSub2();
},1900);
let deferredInstall=null;
function isStandaloneMode(){
  return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;
}
function showInstallBtn(){
  const b=document.getElementById('pwa-install-btn');
  if(b&&!isStandaloneMode())b.style.display='inline-flex';
}
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredInstall=e;showInstallBtn();
});
// Fallback: mesmo sem o evento (ex.: cooldown do Chrome após desinstalar), o botão aparece no browser
setTimeout(showInstallBtn,2500);
async function promptInstall(){
  if(deferredInstall){
    deferredInstall.prompt();
    try{await deferredInstall.userChoice;}catch(e){}
    deferredInstall=null;
    const b=document.getElementById('pwa-install-btn');if(b)b.style.display='none';
    return;
  }
  // Sem evento disponível → guiar para o menu do browser
  toast(currentLang==='en'
    ?'Chrome: ⋮ menu → "Cast, save and share" → "Install app". (After uninstalling, Chrome hides the prompt for a while.)'
    :'Chrome: menu ⋮ → "Transmitir, guardar e partilhar" → "Instalar aplicação". (Após desinstalar, o Chrome esconde o pedido por uns tempos.)');
}
window.addEventListener('appinstalled',()=>{
  deferredInstall=null;
  const b=document.getElementById('pwa-install-btn');if(b)b.style.display='none';
  toast(currentLang==='en'?'App installed! 📲':'App instalada! 📲');
});

// (Packs de tema antigos removidos — substituídos pelos Temas Predefinidos)
function renderPackChips(){}

// ══ MODO PRIVACIDADE ══
let privacyOn=false;
try{privacyOn=localStorage.getItem('cv_privacy')==='1';}catch(e){}
function applyPrivacy(){
  document.body.classList.toggle('privacy',privacyOn);
  const b=document.getElementById('privacy-btn');
  if(b){
    // Muda só o ícone, preserva a legenda e a mini-legenda
    const span=b.querySelector('.tb-label');
    const label=span?span.textContent:'';
    const mini=b.querySelector('.tb-mini');
    const miniTxt=mini?mini.textContent:(currentLang==='en'?'Privacy':'Privado');
    const icoOff='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    const icoOn='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    b.classList.toggle('priv-active',privacyOn);
    b.innerHTML=(privacyOn?icoOff:icoOn)+'<span class="tb-label" id="tb-privacy-txt">'+(label||(currentLang==='en'?'Privacy mode':'Modo de privacidade'))+'</span><span class="tb-mini" id="tbm-priv">'+miniTxt+'</span>';
    b.title=privacyOn
      ?(currentLang==='en'?'Privacy mode ON — click to show values':'Modo de privacidade ATIVO — clica para mostrar valores')
      :(currentLang==='en'?'Privacy mode':'Modo de privacidade');
  }
}
function togglePrivacy(){
  privacyOn=!privacyOn;
  try{localStorage.setItem('cv_privacy',privacyOn?'1':'0');}catch(e){}
  applyPrivacy();
  toast(privacyOn?(currentLang==='en'?'🙈 Values hidden — hover to reveal':'🙈 Valores ocultos — passa o rato para revelar')
                 :(currentLang==='en'?'👁 Values visible':'👁 Valores visíveis'));
}

// ══ BLOQUEAR AO MINIMIZAR ══
let lockHideOn=false,lockHideTimer=null;
try{lockHideOn=localStorage.getItem('cv_lockhide')==='1';}catch(e){}
function setLockHide(v){
  lockHideOn=!!v;
  try{localStorage.setItem('cv_lockhide',lockHideOn?'1':'0');}catch(e){}
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    if(masterKey&&!presentationMode)document.body.classList.add('bg-blur');
  }else{document.body.classList.remove('bg-blur');clearTimeout(lockHideTimer);try{driveCheckOnFocus();}catch(e){}}
});
window.addEventListener('blur',()=>{if(masterKey&&!presentationMode)document.body.classList.add('bg-blur');});
window.addEventListener('focus',()=>{document.body.classList.remove('bg-blur');try{driveCheckOnFocus();}catch(e){}});
// verificação periódica do Drive enquanto a app está aberta e à vista (deteta versão nova sem ter de trocar de foco)
setInterval(()=>{if(!document.hidden){try{driveCheckOnFocus();}catch(e){}}},45000);

// ══ CAMPOS PERSONALIZADOS ══
let entryFields=[];
function renderFieldRows(){
  const wrap=document.getElementById('field-rows');if(!wrap)return;
  const en=currentLang==='en';
  wrap.innerHTML=entryFields.map((f,i)=>`<div class="field-row">
    <input class="fr-k" placeholder="${en?'Label':'Nome'}" value="${esc(f.k)}" data-input="setEntryField" data-args='[${i},"k"]' data-value>
    <input class="fr-v" placeholder="${en?'Value':'Valor'}" value="${esc(f.v)}" data-input="setEntryField" data-args='[${i},"v"]' data-value>
    <button type="button" class="card-btn danger" data-act="removeFieldRow" data-args='[${i}]' style="padding:7px 10px">✕</button>
  </div>`).join('');
}
function addFieldRow(){entryFields.push({k:'',v:''});renderFieldRows();
  const rows=document.querySelectorAll('#field-rows .fr-k');
  if(rows.length)rows[rows.length-1].focus();}
function removeFieldRow(i){entryFields.splice(i,1);renderFieldRows();}

// ══ PWA PERSONALIZADA ══
function getPwaPrefs(){
  try{const p=JSON.parse(localStorage.getItem('cv_pwa')||'null');if(p&&p.name)return p;}catch(e){}
  return{name:'Aurora Vault',emoji:''};
}
function buildManifest(){
  const prefs=getPwaPrefs();
  const tc=themeColors[currentTheme]||themeColors.dark;
  const bg=tc.bg||'#0d0f14';
  const encBg=encodeURIComponent(bg);
  const inner=`%3Ctext x='256' y='330' font-size='300' text-anchor='middle'%3E${encodeURIComponent(prefs.emoji||'')}%3C/text%3E`;
  const icon=`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='${encBg}'/%3E${inner}%3C/svg%3E`;
  let base='./';try{if(/^https?:$/.test(location.protocol))base=new URL('./',location.href).href;}catch(e){}
  // Ícone da app = escudo AV (PNG: é o que o Android usa para instalar); com emoji escolhido nas definições, fica o emoji
  const icons=prefs.emoji?[{src:icon,sizes:'512x512',type:'image/svg+xml',purpose:'any maskable'}]:[
    {src:base+'img/av-icon-v1-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:base+'img/av-icon-v1-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
    {src:base+'img/av-icon-v1-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}];
  const mf={name:prefs.name,short_name:prefs.name.slice(0,12),description:'Cofre digital pessoal — passwords, documentos, notas, cartões e 2FA — tudo encriptado',start_url:base,scope:base,display:'standalone',background_color:bg,theme_color:bg,orientation:'any',icons};
  const en_=currentLang==='en';
  const shIc=e=>`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='${encBg}'/%3E%3Ctext x='48' y='68' font-size='52' text-anchor='middle'%3E${encodeURIComponent(e)}%3C/text%3E%3C/svg%3E`;
  mf.shortcuts=[
    {name:en_?'Add':'Adicionar',short_name:en_?'Add':'Adicionar',url:base+'?go=add',icons:[{src:shIc('＋'),sizes:'96x96',type:'image/svg+xml'}]},
    {name:en_?'2FA codes':'Códigos 2FA',short_name:'2FA',url:base+'?go=totp',icons:[{src:shIc('🔢'),sizes:'96x96',type:'image/svg+xml'}]},
    {name:en_?'Store cards':'Cartões de loja',short_name:en_?'Cards':'Lojas',url:base+'?go=store',icons:[{src:shIc('🎟️'),sizes:'96x96',type:'image/svg+xml'}]},
    {name:en_?'Search':'Pesquisar',short_name:en_?'Search':'Pesquisar',url:base+'?go=search',icons:[{src:shIc('🔍'),sizes:'96x96',type:'image/svg+xml'}]}
  ];
  mf.share_target={action:base+'share-target',method:'POST',enctype:'multipart/form-data',params:{title:'title',text:'text',url:'url',files:[{name:'files',accept:['image/*','application/pdf','.pdf']}]}};
  const link=document.getElementById('pwa-manifest');
  if(link){
    // Liberta o manifesto anterior (era criado um blob novo a cada mudança de cor, sem nunca libertar os antigos)
    const old=link.getAttribute('href');
    link.setAttribute('href',URL.createObjectURL(new Blob([JSON.stringify(mf)],{type:'application/json'})));
    if(old&&old.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(old),5000);
  }
}
function savePwaPrefs(){
  const name=(document.getElementById('pwa-name').value.trim()||'Aurora Vault').slice(0,24);
  const emoji=document.getElementById('pwa-emoji').value.trim().slice(0,4);
  try{localStorage.setItem('cv_pwa',JSON.stringify({name,emoji}));}catch(e){}
  buildManifest();
  toast(currentLang==='en'?'Saved! Reinstall the app to update the icon.':'Guardado! Reinstala a app para atualizar o ícone.');
}

// ══ PARTILHA POR QR ENCRIPTADO ══
let shareEntryId=null,pendingSharePayload=null;
async function deriveShareKey(pw,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
function openShareModal(id){
  shareEntryId=id;
  const en=currentLang==='en';
  document.getElementById('share-title').textContent=en?'🔗 Share via QR':'🔗 Partilhar por QR';
  document.getElementById('share-explain').textContent=en
    ?'Set a temporary password. On the other device you will scan this QR and type this password to import the entry.'
    :'Define uma password temporária. No outro dispositivo vais ler o QR e escrever essa password para importar a entrada.';
  document.getElementById('share-pw-lbl').textContent=en?'Temporary password':'Password temporária';
  document.getElementById('share-gen-btn').textContent=en?'Generate QR':'Gerar QR';
  document.getElementById('share-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('share-done-btn').textContent=en?'Done':'Concluído';
  document.getElementById('share-hint').textContent=en
    ?'On the other device: Vault → 📥 QR → point the camera → type the temporary password.'
    :'No outro dispositivo: Cofre → 📥 QR → aponta a câmara → escreve a password temporária.';
  document.getElementById('share-step-pw').style.display='block';
  document.getElementById('share-step-qr').style.display='none';
  document.getElementById('share-pw').value='';
  document.getElementById('share-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('share-pw').focus(),100);
}
function closeShareModal(){document.getElementById('share-overlay').classList.remove('open');shareEntryId=null;}
async function generateShareQR(){
  const en=currentLang==='en';
  const pw=document.getElementById('share-pw').value.trim();
  if(pw.length<4){toast(en?'Password: at least 4 characters.':'Password: mínimo 4 caracteres.');return;}
  const e=vault.find(v=>v.id===shareEntryId);if(!e)return;
  const lite={name:e.name,user:e.user||'',pw:e.pw||'',url:e.url||'',notes:e.notes||'',tags:e.tags||[],icon:e.icon||'',cat:e.cat||'outro',fields:e.fields||[]};
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveShareKey(pw,salt);
  let bytes=new TextEncoder().encode(JSON.stringify(lite));
  const gz=await gzipBytes(bytes);if(gz&&gz.length<bytes.length)bytes=gz;
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));
  const packed=new Uint8Array(16+12+ct.length);
  packed.set(salt,0);packed.set(iv,16);packed.set(ct,28);
  const payload='CVSHARE1:'+await u8ToB64(packed);
  const m=CVQR.matrix(payload);
  if(!m){toast(en?'Entry too large for a QR (long notes?).':'Entrada demasiado grande para QR (notas longas?).');return;}
  const canvas=document.getElementById('share-canvas');
  const scale=4,quiet=4,size=(m.length+quiet*2)*scale;
  canvas.width=size;canvas.height=size;
  canvas.style.width=Math.min(size,260)+'px';canvas.style.height=Math.min(size,260)+'px';
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000';
  for(let r=0;r<m.length;r++)for(let cc2=0;cc2<m.length;cc2++)
    if(m[r][cc2])ctx.fillRect((cc2+quiet)*scale,(r+quiet)*scale,scale,scale);
  document.getElementById('share-entry-name').textContent='🔐 '+e.name;
  document.getElementById('share-step-pw').style.display='none';
  document.getElementById('share-step-qr').style.display='block';
  if(e.attachment)toast(en?'Note: attachments are not included in the QR.':'Nota: anexos não vão no QR.');
}
function openShareImport(raw){
  pendingSharePayload=raw;
  const en=currentLang==='en';
  document.getElementById('shimport-title').textContent=en?'📥 Import entry':'📥 Importar entrada';
  document.getElementById('shimport-explain').textContent=en
    ?'QR read! Type the temporary password set on the other device.'
    :'QR lido! Escreve a password temporária definida no outro dispositivo.';
  document.getElementById('shimport-pw-lbl').textContent=en?'Temporary password':'Password temporária';
  document.getElementById('shimport-ok-btn').textContent=en?'Import':'Importar';
  document.getElementById('shimport-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('shimport-pw').value='';
  document.getElementById('shimport-err').textContent='';
  document.getElementById('shimport-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('shimport-pw').focus(),100);
}
function closeShareImport(){document.getElementById('shimport-overlay').classList.remove('open');pendingSharePayload=null;}
async function confirmShareImport(){
  const en=currentLang==='en';
  const pw=document.getElementById('shimport-pw').value.trim();
  const errEl=document.getElementById('shimport-err');
  if(!pw||!pendingSharePayload)return;
  try{
    const packed=await b64ToU8(pendingSharePayload.slice(9));
    const salt=packed.slice(0,16),iv=packed.slice(16,28),ct=packed.slice(28);
    const key=await deriveShareKey(pw,salt);
    let dec=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct));
    if(dec.length>2&&dec[0]===0x1f&&dec[1]===0x8b)dec=await gunzipBytes(dec);
    const lite=JSON.parse(new TextDecoder().decode(dec));
    const entry={id:Date.now().toString(36),name:lite.name||'...',user:lite.user||'',pw:lite.pw||'',url:lite.url||'',notes:lite.notes||'',tags:lite.tags||[],icon:lite.icon||'',cat:(CATS[lite.cat]||customCats.some(x=>x.key===lite.cat))?lite.cat:'outro',fields:lite.fields||[],createdAt:Date.now(),pwChangedAt:Date.now()};
    vault.push(entry);
    logActivity('add',entry.name,'📥');
    closeShareImport();
    renderAll();markUnsaved();
    toast(en?`Imported: ${entry.name} ✓`:`Importado: ${entry.name} ✓`);
  }catch(e){
    errEl.textContent=en?'Wrong password or corrupted QR.':'Password errada ou QR corrompido.';
  }
}

// ══ LEITOR DE QR (2FA) ══
let qrScanStream=null,qrScanRAF=null,qrDetector=null,qrScanMode='totp';
async function openQrScanner(mode='totp'){
  qrScanMode=mode;
  const en=currentLang==='en';
  document.getElementById('qrscan-title').textContent=qrScanMode==='share'
    ?(en?'📥 Import via QR':'📥 Importar por QR')
    :(en?'📷 Scan QR Code':'📷 Ler QR Code');
  document.getElementById('qrscan-file-btn').textContent=en?'🖼️ Read from an image':'🖼️ Ler de uma imagem';
  document.getElementById('qrscan-cancel-btn').textContent=en?'Cancel':'Cancelar';
  const status=document.getElementById('qrscan-status');
  status.textContent=en?'Starting camera...':'A iniciar câmara...';
  document.getElementById('qrscan-overlay').classList.add('open');
  qrDetector=avMakeQrDetector();
  if(!qrDetector){status.textContent=en?'QR detector unavailable — use the image option.':'Detetor indisponível — usa a opção de imagem.';return;}
  try{
    qrScanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    const video=document.getElementById('qrscan-video');
    video.srcObject=qrScanStream;
    await video.play();
    status.textContent=qrScanMode==='gauth'?(en?'Point at the Google Authenticator QR code':'Aponta ao QR do Google Authenticator'):(en?'Point at the QR code shown by the website':'Aponta ao QR code que o site mostra');
    qrScanLoop();
  }catch(err){
    status.textContent=en
      ?'Camera unavailable (permission denied?). Use the image option below.'
      :'Câmara indisponível (permissão negada?). Usa a opção de imagem em baixo.';
  }
}
async function qrScanLoop(){
  const video=document.getElementById('qrscan-video');
  if(!qrDetector||!video||!video.srcObject){return;}
  try{
    const codes=await qrDetector.detect(video);
    if(codes.length&&handleScannedQr(codes[0].rawValue))return;
  }catch(e){}
  qrScanRAF=setTimeout(qrScanLoop,250);
}
async function scanQrFromFile(ev){
  const file=ev.target.files[0];ev.target.value='';
  if(!file)return;
  const en=currentLang==='en';
  const status=document.getElementById('qrscan-status');
  try{
    if(!qrDetector)qrDetector=avMakeQrDetector();
    const bmp=await createImageBitmap(file);
    const codes=await qrDetector.detect(bmp);
    if(!codes.length){status.textContent=en?'No QR code found in the image.':'Nenhum QR code encontrado na imagem.';return;}
    handleScannedQr(codes[0].rawValue);
  }catch(e){
    status.textContent=en?'Could not read the image.':'Não foi possível ler a imagem.';
  }
}
function handleScannedQr(raw){
  const en=currentLang==='en';
  if(qrScanMode==='share'){
    if(!raw||!raw.startsWith('CVSHARE1:')){
      document.getElementById('qrscan-status').textContent=en
        ?'That QR is not a Aurora Vault share. Keep trying or cancel.'
        :'Esse QR não é uma partilha Aurora Vault. Tenta outro ou cancela.';
      return false;
    }
    closeQrScanner();
    openShareImport(raw);
    return true;
  }
  const parsed=parseOtpauth(raw||'');
  if(!parsed||!parsed.secret||!b32decode(parsed.secret)){
    document.getElementById('qrscan-status').textContent=en
      ?'That QR is not a 2FA code (otpauth). Keep trying or cancel.'
      :'Esse QR não é um código 2FA (otpauth). Tenta outro ou cancela.';
    return false;
  }
  const nameEl=document.getElementById('tf-name');
  const accEl=document.getElementById('tf-account');
  if(nameEl&&!nameEl.value.trim())nameEl.value=parsed.name;
  if(accEl&&!accEl.value.trim())accEl.value=parsed.account;
  document.getElementById('tf-secret').value=parsed.secret;
  closeQrScanner();
  toast(en?'QR read! Fields filled ✓':'QR lido! Campos preenchidos ✓');
  return true;
}
function closeQrScanner(){
  const o=document.getElementById('qrscan-overlay');
  if(o)o.classList.remove('open');
  if(qrScanRAF){clearTimeout(qrScanRAF);qrScanRAF=null;}
  if(qrScanStream){qrScanStream.getTracks().forEach(t2=>t2.stop());qrScanStream=null;}
  const video=document.getElementById('qrscan-video');
  if(video)video.srcObject=null;
}

// ══ RECICLAGEM ══
const TRASH_DAYS=30;
const TRASH_TYPE_META={
  vault:{icon:'🔐',label:{pt:'Entrada',en:'Entry'}},
  note:{icon:'📝',label:{pt:'Nota',en:'Note'}},
  card:{icon:'💳',label:{pt:'Cartão',en:'Card'}},
  doc:{icon:'📁',label:{pt:'Documento',en:'Document'}},
  totp:{icon:'🔢',label:{pt:'Código 2FA',en:'2FA Code'}},
};
function trashItemName(it){
  if(it.type==='vault')return it.data.name||'...';
  if(it.type==='note')return it.data.title||'...';
  if(it.type==='card')return it.data.bank||'...';
  if(it.type==='doc')return it.data.title||'...';
  if(it.type==='totp')return it.data.name||'...';
  return '...';
}
function cleanOldTrash(){
  trash=trash.filter(it=>Date.now()-it.deletedAt<TRASH_DAYS*86400000);
}
function renderTrash(){
  const grid=document.getElementById('trash-grid');if(!grid)return;
  cleanOldTrash();
  const title=document.getElementById('trash-title');
  if(title)title.textContent=currentLang==='en'?'Recycle Bin':'Reciclagem';
  const emptyBtn=document.getElementById('trash-empty-btn');
  if(emptyBtn){
    emptyBtn.style.display=trash.length?'block':'none';
    emptyBtn.textContent=currentLang==='en'?'🗑️ Empty bin':'🗑️ Esvaziar tudo';
  }
  const info=document.getElementById('trash-info');
  if(info)info.textContent=trash.length
    ?(currentLang==='en'?`Items are kept for ${TRASH_DAYS} days, then permanently deleted.`:`Os itens ficam guardados ${TRASH_DAYS} dias e depois são apagados permanentemente.`)
    :'';
  if(!trash.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
      <p>${currentLang==='en'?'Recycle bin is empty.':'A reciclagem está vazia.'}</p>
    </div>`;
    return;
  }
  grid.innerHTML=trash.map((it,idx)=>{
    const meta=TRASH_TYPE_META[it.type]||{icon:'📄',label:{pt:'Item',en:'Item'}};
    const daysLeft=TRASH_DAYS-Math.floor((Date.now()-it.deletedAt)/86400000);
    const urgent=daysLeft<=5;
    return `<div class="trash-card">
      <div class="trash-card-top">
        <div class="trash-type-icon">${meta.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="trash-card-name">${esc(trashItemName(it))}</div>
          <div class="trash-card-type">${meta.label[currentLang]||meta.label.pt} · ${timeAgo(it.deletedAt)}</div>
        </div>
        <span class="trash-days-badge${urgent?' urgent':''}">⏳ ${daysLeft}d</span>
      </div>
      <div class="card-actions" style="margin-top:0">
        <button class="card-btn" data-act="restoreTrashItem" data-args='[${idx}]'>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          ${currentLang==='en'?'Restore':'Restaurar'}
        </button>
        <button class="card-btn danger" data-act="deleteTrashForever" data-args='[${idx}]'>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          ${currentLang==='en'?'Delete forever':'Apagar já'}
        </button>
      </div>
    </div>`;
  }).join('');
}
function restoreTrashItem(idx){
  const it=trash[idx];if(!it)return;
  if(it.type==='vault')vault.push(it.data);
  else if(it.type==='note')notes.push(it.data);
  else if(it.type==='card')bankCards.push(it.data);
  else if(it.type==='doc')documents.push(it.data);
  else if(it.type==='totp')totp.push(it.data);
  logActivity('restore',trashItemName(it),'♻️');
  trash.splice(idx,1);
  renderAll();
  toast(currentLang==='en'?'Restored! ✓':'Restaurado! ✓');
  markUnsaved();
}
function deleteTrashForever(idx){
  const it=trash[idx];if(!it)return;
  if(!confirm(currentLang==='en'
    ?'Permanently delete? This CANNOT be undone!'
    :'Apagar permanentemente? Esta ação NÃO pode ser desfeita!'))return;
  trash.splice(idx,1);
  renderTrash();
  toast(currentLang==='en'?'Permanently deleted.':'Apagado permanentemente.');
  markUnsaved();
}
function emptyTrash(){
  if(!trash.length)return;
  if(!confirm(currentLang==='en'
    ?`Permanently delete all ${trash.length} items? This CANNOT be undone!`
    :`Apagar permanentemente os ${trash.length} itens? Esta ação NÃO pode ser desfeita!`))return;
  trash=[];
  renderTrash();
  toast(currentLang==='en'?'Recycle bin emptied.':'Reciclagem esvaziada.');
  markUnsaved();
}

// ══ PASTAS DE DOCUMENTOS ══
let editingFolderId=null,movingDocId=null,folderScope='doc',movingKind='doc';
function scopeFolderArr(s){return (s||folderScope)==='vault'?vaultFolders:docFolders;}
function scopeItems(s){return (s||folderScope)==='vault'?vault:documents;}
function scopeCurrentFolder(s){return (s||folderScope)==='vault'?currentVaultFolderId:currentFolderId;}
function scopeRootLabel(s){return (s||folderScope)==='vault'?(currentLang==='en'?'Vault':'Cofre'):(currentLang==='en'?'Documents':'Documentos');}
function scopePathLabel(id,s){return folderPathLabel(id,scopeFolderArr(s),scopeRootLabel(s));}
function rerenderScope(s){
  if((s||folderScope)==='vault'){renderSidebar();renderCards();renderDashboard();}
  else renderDocs();
}
function folderById(id,arr){return (arr||docFolders).find(f=>f.id===id)||null;}
function folderPath(id,arr){
  const list=arr||docFolders;
  const path=[];let cur=folderById(id,list),guard=0;
  while(cur&&guard++<50){path.unshift(cur);cur=cur.parentId?folderById(cur.parentId,list):null;}
  return path;
}
function folderPathLabel(id,arr,rootLabel){
  const root=rootLabel||(currentLang==='en'?'Documents':'Documentos');
  if(!id)return root;
  const p=folderPath(id,arr);
  if(!p.length)return root;
  return p.map(f=>`${f.icon||'📁'} ${f.name}`).join(' / ');
}
function isDescendantFolder(candidateId,ancestorId){
  let cur=folderById(candidateId),guard=0;
  while(cur&&guard++<50){if(cur.id===ancestorId)return true;cur=cur.parentId?folderById(cur.parentId):null;}
  return false;
}
function folderDirectCounts(id,arr,items){
  const list=arr||docFolders,its=items||documents;
  return{
    folders:list.filter(f=>(f.parentId||null)===(id||null)).length,
    docs:its.filter(d=>(d.folderId||null)===(id||null)).length
  };
}
function openFolderModal(id=null,scope='doc'){
  folderScope=scope;
  editingFolderId=id;
  const en=currentLang==='en';
  const isEdit=!!id;
  document.getElementById('folder-modal-title').textContent=isEdit
    ?(en?'📁 Rename Folder':'📁 Renomear Pasta')
    :(en?'📁 New Folder':'📁 Nova Pasta');
  document.getElementById('folder-save-btn').textContent=isEdit?(en?'Save':'Guardar'):(en?'Create':'Criar');
  document.getElementById('folder-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('folder-name').placeholder=en?'Folder name':'Nome da pasta';
  const parentLine=document.getElementById('folder-parent-line');
  if(isEdit){
    const f=folderById(id,scopeFolderArr());
    document.getElementById('folder-name').value=f?.name||'';
    document.getElementById('folder-icon').value=f?.icon||'';
    parentLine.textContent=(en?'In: ':'Em: ')+scopePathLabel(f?.parentId||null);
  }else{
    document.getElementById('folder-name').value='';
    document.getElementById('folder-icon').value='';
    parentLine.textContent=(en?'Will be created in: ':'Será criada em: ')+scopePathLabel(scopeCurrentFolder());
  }
  document.getElementById('folder-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('folder-name').focus(),100);
}
function closeFolderModal(){document.getElementById('folder-overlay').classList.remove('open');editingFolderId=null;}
function saveFolder(){
  const en=currentLang==='en';
  const name=document.getElementById('folder-name').value.trim();
  const icon=(document.getElementById('folder-icon').value||'').trim()||'📁';
  if(!name){toast(en?'Folder name is required!':'Nome da pasta obrigatório!');return;}
  const arr=scopeFolderArr();
  const renaming=!!editingFolderId;
  if(editingFolderId){
    const f=folderById(editingFolderId,arr);
    if(f){f.name=name;f.icon=icon;logActivity('edit',name,'📁');}
  }else{
    arr.push({id:'f'+Date.now().toString(36),name,icon,parentId:scopeCurrentFolder()});
    logActivity('add',name,'📁');
  }
  const sc=folderScope;
  closeFolderModal();rerenderScope(sc);
  toast(renaming?(en?'Folder renamed ✓':'Pasta renomeada ✓'):(en?'Folder created ✓':'Pasta criada ✓'));
  markUnsaved();
}
function deleteFolder(id,scope='doc'){
  const en=currentLang==='en';
  const arr=scopeFolderArr(scope),items=scopeItems(scope);
  const f=folderById(id,arr);if(!f)return;
  const c2=folderDirectCounts(id,arr,items);
  const total=c2.docs+c2.folders;
  const parentLabel=scopePathLabel(f.parentId||null,scope);
  const msg=total
    ?(en?`Delete "${f.name}"? Its ${c2.docs} document(s) and ${c2.folders} subfolder(s) move up to ${parentLabel}.`
        :`Apagar "${f.name}"? Os ${c2.docs} documento(s) e ${c2.folders} subpasta(s) passam para ${parentLabel}.`)
    :(en?`Delete folder "${f.name}"?`:`Apagar a pasta "${f.name}"?`);
  if(!confirm(msg))return;
  items.forEach(d=>{if((d.folderId||null)===id)d.folderId=f.parentId||null;});
  arr.forEach(x=>{if(x.parentId===id)x.parentId=f.parentId||null;});
  if(scope==='vault'){vaultFolders=vaultFolders.filter(x=>x.id!==id);if(currentVaultFolderId===id)currentVaultFolderId=f.parentId||null;}
  else{docFolders=docFolders.filter(x=>x.id!==id);if(currentFolderId===id)currentFolderId=f.parentId||null;}
  logActivity('delete',f.name,'📁');
  rerenderScope(scope);toast(en?'Folder deleted.':'Pasta apagada.');markUnsaved();
}
function openFolder(id){currentFolderId=id;renderDocs();}
function goToFolder(id){currentFolderId=id;renderDocs();}
function populateFolderSelect(selectedId){
  const sel=document.getElementById('doc-folder');if(!sel)return;
  const en=currentLang==='en';
  const opts=[`<option value="">${en?'🏠 Documents (root)':'🏠 Documentos (raiz)'}</option>`];
  const walk=(parentId,depth)=>{
    docFolders.filter(f=>(f.parentId||null)===parentId).forEach(f=>{
      opts.push(`<option value="${f.id}">${'　'.repeat(depth)}${f.icon||'📁'} ${esc(f.name)}</option>`);
      walk(f.id,depth+1);
    });
  };
  walk(null,1);
  sel.innerHTML=opts.join('');
  sel.value=selectedId||'';
}
function openMoveModal(id,kind='doc'){
  movingDocId=id;movingKind=kind;
  const en=currentLang==='en';
  const arr=kind==='vault'?vaultFolders:docFolders;
  const item=kind==='vault'?vault.find(x=>x.id===id):documents.find(x=>x.id===id);
  if(!item)return;
  document.getElementById('move-modal-title').textContent=en?'📂 Move to...':'📂 Mover para...';
  document.getElementById('move-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('move-doc-name').textContent=kind==='vault'
    ?`${item.icon&&item.icon!=='⭐'?item.icon:'🔐'} ${item.name}`
    :`${getDocAutoIcon(item)} ${item.title}`;
  const cur=item.folderId||null;
  const rootLbl=kind==='vault'?(en?'🏠 Vault (root)':'🏠 Cofre (raiz)'):(en?'🏠 Documents (root)':'🏠 Documentos (raiz)');
  const list=[{id:null,label:rootLbl,depth:0}];
  const walk=(parentId,depth)=>{
    arr.filter(f=>(f.parentId||null)===parentId).forEach(f=>{
      list.push({id:f.id,label:`${esc(f.icon||'📁')} ${esc(f.name)}`,depth});
      walk(f.id,depth+1);
    });
  };
  walk(null,1);
  document.getElementById('move-list').innerHTML=list.map(o=>{
    const isCur=(o.id||null)===cur;
    return `<button class="move-opt${isCur?' current':''}" ${isCur?'disabled':`data-act="confirmMoveDoc" data-arg="${esc(o.id||'')}"`}>
      <span style="padding-left:${o.depth*14}px">${o.label}</span>
      ${isCur?`<span style="margin-left:auto;font-size:.6rem;color:var(--text-muted)">${en?'current':'atual'}</span>`:''}
    </button>`;
  }).join('');
  document.getElementById('move-overlay').classList.add('open');
}
function closeMoveModal(){document.getElementById('move-overlay').classList.remove('open');movingDocId=null;}
function confirmMoveDoc(folderId){
  const kind=movingKind;
  const item=kind==='vault'?vault.find(x=>x.id===movingDocId):documents.find(x=>x.id===movingDocId);
  if(!item)return;
  item.folderId=folderId||null;
  logActivity('edit',kind==='vault'?item.name:item.title,'📂');
  closeMoveModal();
  rerenderScope(kind);
  toast((currentLang==='en'?'Moved to ':'Movido para ')+scopePathLabel(folderId||null,kind)+' ✓');
  markUnsaved();
}

// ══ MENU DA BARRA DE TOPO (telemóvel) ══
function toggleTopMenu(ev){
  if(ev)ev.stopPropagation();
  const m=document.getElementById('tb-secondary');
  if(m)m.classList.toggle('open');
}
function closeTopMenu(){
  const m=document.getElementById('tb-secondary');
  if(m)m.classList.remove('open');
}
document.addEventListener('click',e=>{
  const m=document.getElementById('tb-secondary');
  if(!m||!m.classList.contains('open'))return;
  if(e.target.closest('#tb-more'))return;
  if(m.contains(e.target)){
    if(e.target.closest('button'))setTimeout(closeTopMenu,60);
    return;
  }
  closeTopMenu();
});

// ══ HERANÇA DIGITAL ══
function qrDataUrl(text,scale,quiet){
  try{
    const m=CVQR.matrix(text);
    if(!m)return null;
    const cv=document.createElement('canvas');
    const size=(m.length+quiet*2)*scale;
    cv.width=size;cv.height=size;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
    ctx.fillStyle='#000';
    for(let r=0;r<m.length;r++)for(let cc=0;cc<m.length;cc++)
      if(m[r][cc])ctx.fillRect((cc+quiet)*scale,(r+quiet)*scale,scale,scale);
    return cv.toDataURL('image/png');
  }catch(e){return null;}
}
let legacyLang='pt';
function setLegacyLang(l){legacyLang=l;renderLegacyLang();}
function renderLegacyLang(){
  ['pt','en'].forEach(l=>{
    const b=document.getElementById('legacy-lang-'+l);
    if(b)b.classList.toggle('active',legacyLang===l);
  });
}
function openLegacyModal(){
  const en=currentLang==='en';
  if(!masterKey&&!presentationMode){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  document.getElementById('legacy-title').textContent=en?'📜 Digital Legacy':'📜 Herança Digital';
  document.getElementById('legacy-intro').textContent=en
    ?'A sheet to print and keep for the people you trust. It explains how to reach everything in your vault — without containing the master password itself.'
    :'Uma folha para imprimires e guardares para quem confias. Explica como chegar a tudo o que está no cofre — sem conter a palavra-passe mestra.';
  document.getElementById('legacy-lang-lbl').textContent=en?'Document language':'Idioma do documento';
  legacyLang=currentLang;renderLegacyLang();
  document.getElementById('legacy-owner-lbl').textContent=en?'Your name (appears on the sheet)':'O teu nome (aparece na folha)';
  document.getElementById('legacy-msg-lbl').textContent=en?'Personal message (optional)':'Mensagem pessoal (opcional)';
  document.getElementById('legacy-msg').placeholder=en
    ?'Anything you want them to read: practical notes, what matters most, or simply a few words.'
    :'O que quiseres que leiam: notas práticas, o que é mais importante, ou apenas algumas palavras.';
  document.getElementById('legacy-pwbox-lbl').textContent=en
    ?'Include a space to write the master password on this sheet'
    :'Incluir espaço para escrever a palavra-passe nesta folha';
  document.getElementById('legacy-pwwarn').textContent=en
    ?'Recommended off: keep the sheet and the password in separate places. Whoever finds the sheet alone can open nothing.'
    :'Recomendado desligado: guarda a folha e a palavra-passe em sítios separados. Quem encontrar só a folha não abre nada.';
  document.getElementById('legacy-gen-btn').textContent=en?'Generate sheet':'Gerar folha';
  document.getElementById('legacy-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('legacy-msg').value=presentationMode?'':(legacyNote||'');
  document.getElementById('legacy-owner').value=presentationMode?'':(legacyOwner||'');
  document.getElementById('legacy-overlay').classList.add('open');
}
function closeLegacyModal(){document.getElementById('legacy-overlay').classList.remove('open');}
function generateLegacyDoc(){
  const en=currentLang==='en';
  const den=legacyLang==='en';
  const msg=document.getElementById('legacy-msg').value.trim();
  const owner=document.getElementById('legacy-owner').value.trim();
  const withPwBox=document.getElementById('legacy-pwbox').checked;
  if(!presentationMode&&(msg!==legacyNote||owner!==legacyOwner)){
    legacyNote=msg;legacyOwner=owner;markUnsaved();
  }
  const url=location.origin+location.pathname;
  const qr=qrDataUrl(url,4,3);
  const now=new Date().toLocaleDateString(den?'en-GB':'pt-PT',{year:'numeric',month:'long',day:'numeric'});
  const nActive=vault.filter(e=>!e.archived).length;
  const inv=[
    [nActive,den?'accounts and passwords':'contas e palavras-passe'],
    [documents.length,den?'documents':'documentos'],
    [bankCards.length,den?'bank cards':'cartões bancários'],
    [totp.length,den?'verification codes (2FA)':'códigos de verificação (2FA)'],
    [notes.length,den?'secure notes':'notas seguras'],
    [wifiNets.length,den?'WiFi networks':'redes WiFi'],
  ].filter(x=>x[0]>0);
  const line=n=>`<div class="wl"></div>`.repeat(n);
  const L=den?{
    title:'DIGITAL LEGACY',
    sub:'How to reach everything kept in the digital vault',
    of:'Vault of',
    intro:'If you are reading this, you need to get into my digital vault. Everything you need is explained below, step by step. Take your time — nothing here expires in a hurry.',
    s1:'1. What this is',
    p1:'All my accounts, passwords, documents, bank cards and verification codes are inside a single encrypted file named <b>ciphervault.vault</b>. The file is protected with AES-256-GCM encryption: without the master password it is unreadable, and no company or server holds a copy. It exists only where I saved it.',
    s2:'2. What you will find inside',
    s3:'3. Where the file is',
    p3:'Every place a copy is kept — drive, external disk, cloud folder:',
    s4:'4. How to open it',
    p4:'On any computer or phone with a web browser:',
    st1:'Open this address (or scan the code with the phone camera):',
    st2:'Tap <b>“Open Vault”</b>.',
    st3:'Choose the <b>.vault</b> file.',
    st4:'Type the master password and confirm.',
    note:'No internet is needed after the page has loaded once, and nothing is ever uploaded anywhere.',
    s5:'5. IMPORTANT — 6-digit codes (two-step verification)',
    p5:'Many accounts ask for a <b>6-digit code</b> after the password. Those codes may be in three different places:<br><br>&bull; <b>Inside this vault</b>, in the <b>2FA</b> tab — copy the number shown next to the account. It changes every 30 seconds, which is normal.<br>&bull; In a <b>phone app</b>, such as Google Authenticator or Microsoft Authenticator.<br>&bull; By <b>SMS</b>, sent to my mobile number.<br><br>If an account asks for a code and it is not in the vault, look in those apps on my phone.<br><br><b>Do not cancel my phone number or SIM card until everything is sorted out</b> — without it you lose access to every account that sends codes by SMS.',
    s6:'6. Suggested order',
    o1:'<b>Banks, insurance and anything financial</b> — the most time-sensitive.',
    o2:'<b>Documents</b> — ID, licences, contracts, all in the Documents tab.',
    o3:'<b>Subscriptions</b> — cancel what keeps charging every month.',
    o4:'<b>Email accounts</b> — these unlock password resets everywhere else.',
    o5:'<b>Social accounts</b> — close or memorialise them last, there is no rush.',
    s7:'7. Master password',
    pwOn:'Write it here by hand:',
    pwOff:'It is <b>not written on this sheet</b>, on purpose. It is kept separately — I told you where, or it is with the person I named. Without it nothing here can be opened.',
    s8:'A message from me',
    s9:'Copies of this sheet',
    p9:'Who has a copy, and where the vault backups are:',
    warn:'⚠️ Without the master password there is no recovery. Nobody — not even the people who built the app — can open this file. Keep the sheet somewhere safe and dry.',
    gen:'Generated on',
    stale:'If the master password was changed after this date, this sheet is out of date — ask for a new one.',
    print:'Print'
  }:{
    title:'HERANÇA DIGITAL',
    sub:'Como chegar a tudo o que está guardado no cofre digital',
    of:'Cofre de',
    intro:'Se estás a ler isto, precisas de entrar no meu cofre digital. Está tudo explicado aqui em baixo, passo a passo. Vai com calma — nada disto tem pressa.',
    s1:'1. O que é isto',
    p1:'Todas as minhas contas, palavras-passe, documentos, cartões bancários e códigos de verificação estão dentro de um único ficheiro encriptado chamado <b>ciphervault.vault</b>. O ficheiro está protegido com encriptação AES-256-GCM: sem a palavra-passe mestra é ilegível, e nenhuma empresa ou servidor tem cópia. Só existe onde eu o guardei.',
    s2:'2. O que vais encontrar lá dentro',
    s3:'3. Onde está o ficheiro',
    p3:'Todos os sítios onde existe uma cópia — pen, disco externo, pasta na nuvem:',
    s4:'4. Como abrir',
    p4:'Em qualquer computador ou telemóvel com browser:',
    st1:'Abrir este endereço (ou apontar a câmara do telemóvel ao código):',
    st2:'Clicar em <b>“Abrir Cofre”</b>.',
    st3:'Escolher o ficheiro <b>.vault</b>.',
    st4:'Escrever a palavra-passe mestra e confirmar.',
    note:'Não é preciso internet depois de a página abrir uma vez, e nada é enviado para lado nenhum.',
    s5:'5. IMPORTANTE — códigos de 6 dígitos (verificação em dois passos)',
    p5:'Muitas contas pedem um <b>código de 6 dígitos</b> depois da palavra-passe. Esses códigos podem estar em três sítios diferentes:<br><br>&bull; <b>Dentro deste cofre</b>, no separador <b>2FA</b> — copia o número que aparece ao lado da conta. Muda a cada 30 segundos, o que é normal.<br>&bull; Numa <b>app do telemóvel</b>, como o Google Authenticator ou o Microsoft Authenticator.<br>&bull; Por <b>SMS</b>, enviado para o meu número de telemóvel.<br><br>Se uma conta pedir código e ele não estiver no cofre, procura nessas apps do meu telemóvel.<br><br><b>Não canceles o meu número de telemóvel nem o cartão SIM antes de teres tudo resolvido</b> — sem ele perdes o acesso a todas as contas que enviam código por SMS.',
    s6:'6. Ordem sugerida',
    o1:'<b>Bancos, seguros e tudo o que envolve dinheiro</b> — o mais urgente.',
    o2:'<b>Documentos</b> — cartão de cidadão, cartas, contratos, no separador Documentos.',
    o3:'<b>Subscrições</b> — cancelar o que continua a cobrar todos os meses.',
    o4:'<b>Contas de email</b> — são elas que permitem recuperar tudo o resto.',
    o5:'<b>Redes sociais</b> — encerrar ou memorizar no fim, sem pressa nenhuma.',
    s7:'7. Palavra-passe mestra',
    pwOn:'Escreve aqui à mão:',
    pwOff:'<b>Não está escrita nesta folha</b>, de propósito. Está guardada à parte — eu disse-te onde, ou está com a pessoa que indiquei. Sem ela, nada disto se abre.',
    s8:'Uma mensagem minha',
    s9:'Cópias desta folha',
    p9:'Quem tem cópia, e onde estão as cópias de segurança do cofre:',
    warn:'⚠️ Sem a palavra-passe mestra não há recuperação possível. Ninguém — nem quem criou a app — consegue abrir este ficheiro. Guarda a folha em sítio seguro e seco.',
    gen:'Gerada a',
    stale:'Se a palavra-passe mestra foi alterada depois desta data, esta folha está desatualizada — pede uma nova.',
    print:'Imprimir'
  };
  const invHtml=inv.length
    ? `<ul class="inv">${inv.map(([n,lbl])=>`<li><b>${n}</b> ${lbl}</li>`).join('')}</ul>`
    : '';
  const html=`<!DOCTYPE html><html lang="${den?'en':'pt'}"><head><meta charset="UTF-8"><title>${L.title} — Aurora Vault</title>
<style>
 @page{size:A4;margin:15mm}
 *{box-sizing:border-box}
 body{font-family:Georgia,'Times New Roman',serif;color:#111;background:#fff;margin:0;padding:24px;line-height:1.55;font-size:12pt}
 .wrap{max-width:760px;margin:0 auto}
 .hd{border-bottom:3px solid #111;padding-bottom:11px;margin-bottom:16px}
 h1{margin:0;font-size:22pt;letter-spacing:1px}
 .sub{font-size:10.5pt;color:#555;margin-top:4px}
 .owner{font-size:11pt;color:#333;margin-top:6px}
 .intro{background:#f3f3f0;border-left:4px solid #111;padding:11px 14px;font-size:11pt;margin-bottom:18px;font-style:italic}
 h2{font-size:12.5pt;margin:18px 0 6px;border-bottom:1px solid #bbb;padding-bottom:3px;page-break-after:avoid}
 p{margin:6px 0}
 ol,ul{margin:6px 0 6px 20px;padding:0}
 li{margin:4px 0}
 ul.inv{list-style:none;margin-left:0;display:flex;flex-wrap:wrap;gap:6px 10px}
 ul.inv li{border:1px solid #ccc;border-radius:14px;padding:4px 12px;font-size:10.5pt;background:#fafaf8}
 .qrbox{display:flex;gap:16px;align-items:center;border:1px solid #ddd;padding:12px;border-radius:6px;background:#fafaf8;margin-top:7px}
 .qrbox img{width:112px;height:112px;display:block}
 .url{font-family:'Courier New',monospace;font-size:11pt;font-weight:bold;word-break:break-all}
 .note{font-size:10pt;color:#555;font-style:italic;margin-top:6px}
 .alert{background:#fffaf0;border:2px solid #b8860b;padding:11px 14px;margin-top:8px;font-size:11pt}
 .wl{border-bottom:1px solid #999;height:25px;margin:8px 0}
 .pwbox{border:2px dashed #111;padding:15px;margin-top:8px;min-height:56px}
 .pwnote{border:1px solid #bbb;padding:11px 14px;margin-top:8px;background:#fafaf8;font-size:11pt}
 .msg{border:1px solid #bbb;border-left:4px solid #666;padding:12px 15px;margin-top:8px;white-space:pre-wrap;font-size:11.5pt;background:#fdfdfb}
 .warn{background:#fff4f4;border:2px solid #c00;padding:11px 14px;margin-top:18px;font-size:10.5pt;font-weight:bold;color:#900}
 .ft{margin-top:20px;border-top:1px solid #bbb;padding-top:8px;font-size:9.5pt;color:#666}
 .pbtn{position:fixed;top:14px;right:14px;padding:11px 20px;font-family:system-ui,sans-serif;font-size:13px;background:#111;color:#fff;border:0;border-radius:5px;cursor:pointer}
 @media print{.pbtn{display:none}body{padding:0}}
</style></head><body>
<button class="pbtn">🖨️ ${L.print}</button>
<div class="wrap">
  <div class="hd">
    <h1>📜 ${L.title}</h1>
    <div class="sub">${L.sub}</div>
    ${owner?`<div class="owner">${L.of} <b>${esc(owner)}</b></div>`:''}
  </div>
  <div class="intro">${L.intro}</div>

  <h2>${L.s1}</h2><p>${L.p1}</p>

  ${invHtml?`<h2>${L.s2}</h2>${invHtml}`:''}

  <h2>${L.s3}</h2><p>${L.p3}</p>${line(3)}

  <h2>${L.s4}</h2><p>${L.p4}</p>
  <ol>
    <li>${L.st1}
      <div class="qrbox">
        ${qr?`<img src="${qr}" alt="QR">`:''}
        <span class="url">${esc(url)}</span>
      </div>
    </li>
    <li>${L.st2}</li><li>${L.st3}</li><li>${L.st4}</li>
  </ol>
  <p class="note">${L.note}</p>

  <h2>${L.s5}</h2><div class="alert">${L.p5}</div>

  <h2>${L.s6}</h2>
  <ol><li>${L.o1}</li><li>${L.o2}</li><li>${L.o3}</li><li>${L.o4}</li><li>${L.o5}</li></ol>

  <h2>${L.s7}</h2>
  ${withPwBox?`<p>${L.pwOn}</p><div class="pwbox"></div>`:`<div class="pwnote">${L.pwOff}</div>`}

  ${msg?`<h2>${L.s8}</h2><div class="msg">${esc(msg)}</div>`:''}

  <h2>${L.s9}</h2><p>${L.p9}</p>${line(3)}

  <div class="warn">${L.warn}</div>
  <div class="ft">${L.gen} ${now} · ${L.stale}</div>
</div></body></html>`;
  const w=window.open('','_blank');
  if(!w){toast(en?'Allow pop-ups to open the sheet.':'Permite pop-ups para abrir a folha.');return;}
  w.document.write(html);w.document.close();{const pb=w.document.querySelector('.pbtn');if(pb)pb.addEventListener('click',()=>w.print());}
  closeLegacyModal();
  toast(en?'Sheet ready — print it 🖨️':'Folha pronta — imprime 🖨️');
}

// ══ ARRASTAR FICHEIROS PARA A JANELA ══
let dragDepth=0;
function dropAllowed(){
  return !!masterKey&&!presentationMode&&!document.querySelector('.modal-overlay.open');
}
function showDropOverlay(){
  const o=document.getElementById('drop-overlay');if(!o)return;
  const en=currentLang==='en';
  document.getElementById('drop-title').textContent=en?'Drop to add document':'Larga para adicionar documento';
  document.getElementById('drop-sub').textContent=(en?'Into: ':'Em: ')+folderPathLabel(currentFolderId,docFolders);
  o.classList.add('show');
}
function hideDropOverlay(){dragDepth=0;const o=document.getElementById('drop-overlay');if(o)o.classList.remove('show');}
window.addEventListener('dragenter',e=>{
  if(!dropAllowed()||!e.dataTransfer||![...e.dataTransfer.types].includes('Files'))return;
  e.preventDefault();dragDepth++;showDropOverlay();
});
window.addEventListener('dragover',e=>{
  if(!dropAllowed()||!e.dataTransfer||![...e.dataTransfer.types].includes('Files'))return;
  e.preventDefault();e.dataTransfer.dropEffect='copy';
});
window.addEventListener('dragleave',e=>{
  if(!document.getElementById('drop-overlay')?.classList.contains('show'))return;
  dragDepth--;if(dragDepth<=0)hideDropOverlay();
});
window.addEventListener('drop',e=>{
  const o=document.getElementById('drop-overlay');
  if(!o||!o.classList.contains('show'))return;
  e.preventDefault();hideDropOverlay();
  const file=e.dataTransfer?.files?.[0];if(!file)return;
  const en=currentLang==='en';
  if(file.size>12*1024*1024){toast(en?'File too large (max ~12 MB).':'Ficheiro demasiado grande (máx. ~12 MB).');return;}
  switchTab('docs');
  openDocModal();
  const base=file.name.replace(/\.[^.]+$/,'');
  const ti=document.getElementById('doc-title-input');if(ti)ti.value=base;
  readDocFile(file);
  if(e.dataTransfer.files.length>1)toast(en?'Only the first file was added.':'Só o primeiro ficheiro foi adicionado.');
});

// ══ PASTAS DO COFRE ══
function openVaultFolder(id){currentVaultFolderId=id;renderCards();}
function goToVaultFolder(id){currentVaultFolderId=id;currentCat='all';currentTag='';
  const ct=document.getElementById('content-title');if(ct)ct.textContent=t('allEntries');
  renderSidebar();renderCards();}
function renderVaultBreadcrumb(filterActive){
  const bc=document.getElementById('vault-breadcrumb');if(!bc)return;
  const en=currentLang==='en';
  const nf=document.getElementById('vault-newfolder-txt');if(nf)nf.textContent=en?'New folder':'Nova pasta';
  if(filterActive){
    bc.innerHTML=`<span style="font-size:.66rem;color:var(--text-muted)">🔎 ${en?'Showing matches from all folders':'A mostrar resultados de todas as pastas'}</span>`;
    return;
  }
  const path=folderPath(currentVaultFolderId,vaultFolders);
  let html=`<button class="crumb${currentVaultFolderId?'':' current'}" ${currentVaultFolderId?'data-act="goToVaultFolder" data-null':''}>🏠 ${en?'Vault':'Cofre'}</button>`;
  path.forEach((f,i)=>{
    const isLast=i===path.length-1;
    html+=`<span class="crumb-sep">/</span><button class="crumb${isLast?' current':''}" ${isLast?'':`data-act="goToVaultFolder" data-arg="${esc(f.id)}"`}>${f.icon||'📁'} ${esc(f.name)}</button>`;
  });
  if(currentVaultFolderId){
    html+=`<span style="margin-left:auto;display:flex;gap:5px">
      <button class="card-btn" data-act="openFolderModal" data-arg="${esc(currentVaultFolderId)}" data-arg2="vault" title="${en?'Rename':'Renomear'}">✏️</button>
      <button class="card-btn danger" data-act="deleteFolder" data-arg="${esc(currentVaultFolderId)}" data-arg2="vault" title="${en?'Delete folder':'Apagar pasta'}">🗑️</button>
    </span>`;
  }
  bc.innerHTML=html;
}
function populateEntryFolderSelect(selectedId){
  const sel=document.getElementById('entry-folder');if(!sel)return;
  const en=currentLang==='en';
  const opts=[`<option value="">${en?'🏠 Vault (root)':'🏠 Cofre (raiz)'}</option>`];
  const walk=(parentId,depth)=>{
    vaultFolders.filter(f=>(f.parentId||null)===parentId).forEach(f=>{
      opts.push(`<option value="${f.id}">${'　'.repeat(depth)}${f.icon||'📁'} ${esc(f.name)}</option>`);
      walk(f.id,depth+1);
    });
  };
  walk(null,1);
  sel.innerHTML=opts.join('');
  sel.value=selectedId||'';
}

// ══ ÍCONES AUTOMÁTICOS DE DOCUMENTOS ══
const DOC_AUTO_ICONS=[
  [/cart[aã]o\s+de\s+cidad|citizen\s+card|\bcc\b/i,'🪪'],
  [/carta\s+de\s+condu|driving\s+licen|licen[cç]a\s+de\s+condu/i,'🚗'],
  [/passaporte|passport/i,'🛂'],
  [/curr[ií]cul|\bcv\b|resume/i,'📋'],
  [/certificad|certid[aã]o|diploma|curso/i,'📜'],
  [/contrato|contract/i,'📝'],
  [/fatura|recibo|invoice|receipt/i,'🧾'],
  [/seguro|insurance|ap[oó]lice/i,'🛡️'],
  [/\biban\b|\bbanco\b|\bbank\b|extrato/i,'🏦'],
  [/vacin|boletim.*sa[uú]de|sns|utente/i,'💉'],
  [/\bnif\b|contribuinte|finan[cç]as|\birs\b|\btax\b/i,'💶'],
  [/escritura|caderneta|im[oó]vel|predial|arrendamento/i,'🏠'],
  [/ve[ií]culo|matr[ií]cula|\bdua\b|inspe[cç][aã]o/i,'🚙'],
];
function getDocAutoIcon(doc){
  const title=doc.title||'';
  for(const [re,ic] of DOC_AUTO_ICONS){if(re.test(title))return ic;}
  return doc.file?getFileIcon(doc.file.name):'📎';
}

// ══ GERADOR QR (ISO 18004, byte mode, EC L, v1-10 — validado bit-a-bit) ══
const CVQR=(function(){
  const EXP=new Array(256),LOG=new Array(256);
  for(let i=0;i<8;i++)EXP[i]=1<<i;
  for(let i=8;i<256;i++)EXP[i]=EXP[i-4]^EXP[i-5]^EXP[i-6]^EXP[i-8];
  for(let i=0;i<255;i++)LOG[EXP[i]]=i;
  const glog=n=>LOG[n];
  const gexp=n=>{while(n<0)n+=255;while(n>=255)n-=255;return EXP[n];};
  function Poly(num,shift){
    let o=0;while(o<num.length&&num[o]===0)o++;
    this.num=new Array(num.length-o+shift).fill(0);
    for(let i=0;i<num.length-o;i++)this.num[i]=num[i+o];
  }
  Poly.prototype.mul=function(e){
    const num=new Array(this.num.length+e.num.length-1).fill(0);
    for(let i=0;i<this.num.length;i++)for(let j=0;j<e.num.length;j++)
      if(this.num[i]!==0&&e.num[j]!==0)num[i+j]^=gexp(glog(this.num[i])+glog(e.num[j]));
    return new Poly(num,0);
  };
  Poly.prototype.mod=function(e){
    if(this.num.length-e.num.length<0)return this;
    const ratio=glog(this.num[0])-glog(e.num[0]);
    const num=this.num.slice();
    for(let i=0;i<e.num.length;i++)if(e.num[i]!==0)num[i]^=gexp(glog(e.num[i])+ratio);
    return new Poly(num,0).mod(e);
  };
  function ecPoly(n){let a=new Poly([1],0);for(let i=0;i<n;i++)a=a.mul(new Poly([1,gexp(i)],0));return a;}
  const RS={1:[1,26,19],2:[1,44,34],3:[1,70,55],4:[1,100,80],5:[1,134,108],6:[2,86,68],7:[2,98,78],8:[2,121,97],9:[2,146,116],10:[2,86,68,2,87,69],11:[4,101,81],12:[2,116,92,2,117,93],13:[4,133,107],14:[3,145,115,1,146,116],15:[5,109,87,1,110,88],16:[5,122,98,1,123,99],17:[1,135,107,5,136,108],18:[5,150,120,1,151,121],19:[3,141,113,4,142,114],20:[3,135,107,5,136,108],21:[4,144,116,4,145,117],22:[2,139,111,7,140,112],23:[4,151,121,5,152,122],24:[6,147,117,4,148,118],25:[8,132,106,4,133,107]};
  const APOS={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50],11:[6,30,54],12:[6,32,58],13:[6,34,62],14:[6,26,46,66],15:[6,26,48,70],16:[6,26,50,74],17:[6,30,54,78],18:[6,30,56,82],19:[6,30,58,86],20:[6,34,62,90],21:[6,28,50,72,94],22:[6,26,50,74,98],23:[6,30,54,78,102],24:[6,28,54,80,106],25:[6,32,58,84,110]};
  const G15b=0b10100110111,G18b=0b1111100100101,G15M=0b101010000010010;
  const bchDigit=d=>{let n=0;while(d!==0){n++;d>>>=1;}return n;};
  function bchInfo(data){let d=data<<10;while(bchDigit(d)-bchDigit(G15b)>=0)d^=G15b<<(bchDigit(d)-bchDigit(G15b));return((data<<10)|d)^G15M;}
  function bchVer(data){let d=data<<12;while(bchDigit(d)-bchDigit(G18b)>=0)d^=G18b<<(bchDigit(d)-bchDigit(G18b));return(data<<12)|d;}
  const maskFn=(p,i,j)=>{switch(p){case 0:return(i+j)%2===0;case 1:return i%2===0;case 2:return j%3===0;case 3:return(i+j)%3===0;case 4:return(Math.floor(i/2)+Math.floor(j/3))%2===0;case 5:return(i*j)%2+(i*j)%3===0;case 6:return((i*j)%2+(i*j)%3)%2===0;default:return((i*j)%3+(i+j)%2)%2===0;}};
  function utf8(text){
    const b=[];
    for(let i=0;i<text.length;i++){
      let ch=text.charCodeAt(i);
      if(ch<0x80)b.push(ch);
      else if(ch<0x800){b.push(0xC0|(ch>>6),0x80|(ch&0x3F));}
      else if(ch>=0xD800&&ch<0xDC00){const c2=text.charCodeAt(++i);const u=0x10000+((ch-0xD800)<<10)+(c2-0xDC00);b.push(0xF0|(u>>18),0x80|((u>>12)&0x3F),0x80|((u>>6)&0x3F),0x80|(u&0x3F));}
      else{b.push(0xE0|(ch>>12),0x80|((ch>>6)&0x3F),0x80|(ch&0x3F));}
    }
    return b;
  }
  function matrix(text){
    const bytes=utf8(text);
    let version=0,blocks=null;
    for(let v=1;v<=25;v++){
      const raw=RS[v],bl=[];
      for(let i=0;i<raw.length;i+=3)for(let j=0;j<raw[i];j++)bl.push({total:raw[i+1],data:raw[i+2]});
      const totalData=bl.reduce((s,b)=>s+b.data,0);
      const lb=v<10?8:16;
      if(Math.ceil((4+lb+bytes.length*8)/8)<=totalData){version=v;blocks=bl;break;}
    }
    if(!version)return null;
    const totalDataCount=blocks.reduce((s,b)=>s+b.data,0);
    const buf=[];let bufLen=0;
    const put=(num,len)=>{for(let i=len-1;i>=0;i--){const bi=bufLen>>3;if(buf.length<=bi)buf.push(0);if((num>>>i)&1)buf[bi]|=0x80>>>(bufLen&7);bufLen++;}};
    put(4,4);put(bytes.length,version<10?8:16);
    for(const b of bytes)put(b,8);
    if(bufLen+4<=totalDataCount*8)put(0,4);
    while(bufLen%8!==0)put(0,1);
    let pad=true;
    while(bufLen<totalDataCount*8){put(pad?0xEC:0x11,8);pad=!pad;}
    const dcd=[],ecd=[];let off=0,maxDc=0,maxEc=0;
    for(const b of blocks){
      const ec=b.total-b.data;maxDc=Math.max(maxDc,b.data);maxEc=Math.max(maxEc,ec);
      const dc=buf.slice(off,off+b.data);off+=b.data;dcd.push(dc);
      const rs=ecPoly(ec);
      const mp=new Poly(dc,rs.num.length-1).mod(rs);
      const e=new Array(ec);
      for(let i=0;i<ec;i++){const mi=i+mp.num.length-ec;e[i]=mi>=0?mp.num[mi]:0;}
      ecd.push(e);
    }
    const data=[];
    for(let i=0;i<maxDc;i++)for(let b=0;b<blocks.length;b++)if(i<dcd[b].length)data.push(dcd[b][i]);
    for(let i=0;i<maxEc;i++)for(let b=0;b<blocks.length;b++)if(i<ecd[b].length)data.push(ecd[b][i]);
    const N=version*4+17;
    function build(mask){
      const m=Array.from({length:N},()=>new Array(N).fill(null));
      const finder=(row,col)=>{
        for(let r=-1;r<=7;r++){if(row+r<0||row+r>=N)continue;
          for(let cc=-1;cc<=7;cc++){if(col+cc<0||col+cc>=N)continue;
            m[row+r][col+cc]=(r>=0&&r<=6&&(cc===0||cc===6))||(cc>=0&&cc<=6&&(r===0||r===6))||(r>=2&&r<=4&&cc>=2&&cc<=4);
          }}
      };
      finder(0,0);finder(N-7,0);finder(0,N-7);
      const pos=APOS[version];
      for(const row of pos)for(const col of pos){
        if(m[row][col]!==null)continue;
        for(let r=-2;r<=2;r++)for(let cc=-2;cc<=2;cc++)m[row+r][col+cc]=(r===-2||r===2||cc===-2||cc===2||(r===0&&cc===0));
      }
      for(let i=8;i<N-8;i++){if(m[i][6]===null)m[i][6]=(i%2===0);if(m[6][i]===null)m[6][i]=(i%2===0);}
      const bits=bchInfo((1<<3)|mask);
      for(let i=0;i<15;i++){
        const mod=((bits>>i)&1)===1;
        if(i<6)m[i][8]=mod;else if(i<8)m[i+1][8]=mod;else m[N-15+i][8]=mod;
        if(i<8)m[8][N-i-1]=mod;else if(i<9)m[8][15-i-1+1]=mod;else m[8][15-i-1]=mod;
      }
      m[N-8][8]=true;
      if(version>=7){
        const vb=bchVer(version);
        for(let i=0;i<18;i++){
          const mod=((vb>>i)&1)===1;
          m[Math.floor(i/3)][i%3+N-8-3]=mod;
          m[i%3+N-8-3][Math.floor(i/3)]=mod;
        }
      }
      let inc=-1,row=N-1,bitIndex=7,byteIndex=0;
      for(let col=N-1;col>0;col-=2){
        if(col===6)col--;
        while(true){
          for(let cc=0;cc<2;cc++){
            if(m[row][col-cc]===null){
              let dark=false;
              if(byteIndex<data.length)dark=((data[byteIndex]>>>bitIndex)&1)===1;
              if(maskFn(mask,row,col-cc))dark=!dark;
              m[row][col-cc]=dark;
              bitIndex--;if(bitIndex===-1){byteIndex++;bitIndex=7;}
            }
          }
          row+=inc;
          if(row<0||N<=row){row-=inc;inc=-inc;break;}
        }
      }
      return m;
    }
    function penalty(m){
      let score=0;
      for(let dir=0;dir<2;dir++)for(let i=0;i<N;i++){
        let run=1;
        for(let j=1;j<N;j++){
          const cur=dir===0?m[i][j]:m[j][i],prev=dir===0?m[i][j-1]:m[j-1][i];
          if(cur===prev)run++;else{if(run>=5)score+=3+(run-5);run=1;}
        }
        if(run>=5)score+=3+(run-5);
      }
      for(let i=0;i<N-1;i++)for(let j=0;j<N-1;j++){
        const v=m[i][j];
        if(m[i][j+1]===v&&m[i+1][j]===v&&m[i+1][j+1]===v)score+=3;
      }
      const p1=[true,false,true,true,true,false,true,false,false,false,false];
      const p2=[false,false,false,false,true,false,true,true,true,false,true];
      for(let dir=0;dir<2;dir++)for(let i=0;i<N;i++)for(let j=0;j<=N-11;j++){
        let ok1=true,ok2=true;
        for(let k=0;k<11;k++){
          const v=dir===0?m[i][j+k]:m[j+k][i];
          if(v!==p1[k])ok1=false;
          if(v!==p2[k])ok2=false;
        }
        if(ok1)score+=40;if(ok2)score+=40;
      }
      let dark=0;
      for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(m[i][j])dark++;
      score+=Math.floor(Math.abs(dark*100/(N*N)-50)/5)*10;
      return score;
    }
    let best=null,bestScore=Infinity;
    for(let p=0;p<8;p++){
      const m=build(p);const s=penalty(m);
      if(s<bestScore){bestScore=s;best=m;}
    }
    return best;
  }
  return {matrix};
})();

// ══ REDES WIFI (guardadas à parte das passwords) ══
function renderWifiBar(){
  const wrap=document.getElementById('tabs-wifi');if(!wrap)return;
  const en=currentLang==='en';
  const chips=wifiNets.slice(0,4).map(n=>`<button class="wifi-chip" data-act="openWifiNetQR" data-arg="${esc(n.id)}" title="${(en?'Share WiFi: ':'Partilhar WiFi: ')+esc(n.ssid)}">📶 ${esc(n.name||n.ssid)}</button>`).join('');
  const manageLbl=wifiNets.length?(en?'Manage':'Gerir'):(en?'Add WiFi':'Add WiFi');
  wrap.innerHTML=chips+`<button class="wifi-chip add" data-act="openWifiManager" title="${en?'Manage WiFi networks':'Gerir redes WiFi'}">${wifiNets.length?'⚙️':'📶＋'} <span>${manageLbl}</span></button>`;
}
function openWifiManager(){
  const en=currentLang==='en';
  document.getElementById('wifimgr-title').textContent=en?'📶 WiFi Networks':'📶 Redes WiFi';
  document.getElementById('wifimgr-intro').textContent=en
    ?'Stored separately from your passwords. Tap a network to generate the QR your guests scan with their camera.'
    :'Guardadas à parte das tuas passwords. Clica numa rede para gerar o QR que as visitas leem com a câmara.';
  document.getElementById('wf-name-lbl').innerHTML=(en?'Label':'Nome')+' <span style="font-size:.56rem;color:var(--text-muted)">('+(en?'e.g. Home, Office':'ex: Casa, Escritório')+')</span>';
  document.getElementById('wf-ssid-lbl').textContent=en?'Network name (SSID)':'Nome da rede (SSID)';
  document.getElementById('wf-pw-lbl').textContent=en?'Network password':'Password da rede';
  document.getElementById('wf-open-lbl').textContent=en?'Open network (no password)':'Rede aberta (sem password)';
  document.getElementById('wifimgr-close-btn').textContent=en?'Close':'Fechar';
  resetWifiForm();
  renderWifiList();
  document.getElementById('wifimgr-overlay').classList.add('open');
}
function closeWifiManager(){document.getElementById('wifimgr-overlay').classList.remove('open');editingWifiId=null;}
function renderWifiList(){
  const list=document.getElementById('wifimgr-list');if(!list)return;
  const en=currentLang==='en';
  if(!wifiNets.length){
    list.innerHTML=`<div style="font-size:.7rem;color:var(--text-muted);text-align:center;padding:10px 0">${en?'No networks saved yet.':'Ainda sem redes guardadas.'}</div>`;
    return;
  }
  list.innerHTML=wifiNets.map(n=>`<div class="wifi-row">
    <span style="font-size:1.1rem">📶</span>
    <div class="wifi-row-name">
      <div class="wifi-row-title">${esc(n.name||n.ssid)}</div>
      <div class="wifi-row-ssid">${esc(n.ssid)}${n.sec==='nopass'?' · '+(en?'open':'aberta'):''}</div>
    </div>
    <button class="card-btn" data-act="openWifiNetQR" data-arg="${esc(n.id)}" title="QR">📷</button>
    <button class="card-btn" data-act="editWifiNet" data-arg="${esc(n.id)}" title="${en?'Edit':'Editar'}">✏️</button>
    <button class="card-btn danger" data-act="deleteWifiNet" data-arg="${esc(n.id)}" title="${en?'Delete':'Apagar'}">🗑️</button>
  </div>`).join('');
}
function resetWifiForm(){
  editingWifiId=null;
  const en=currentLang==='en';
  ['wf-name','wf-ssid','wf-pw'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  const op=document.getElementById('wf-open');if(op)op.checked=false;
  const pw=document.getElementById('wf-pw');if(pw)pw.disabled=false;
  const ft=document.getElementById('wifimgr-form-title');if(ft)ft.textContent=en?'Add network':'Adicionar rede';
  const sb=document.getElementById('wf-save-btn');if(sb)sb.textContent=en?'Save network':'Guardar rede';
}
function editWifiNet(id){
  const n=wifiNets.find(x=>x.id===id);if(!n)return;
  editingWifiId=id;
  const en=currentLang==='en';
  document.getElementById('wf-name').value=n.name||'';
  document.getElementById('wf-ssid').value=n.ssid||'';
  document.getElementById('wf-pw').value=n.pw||'';
  const op=document.getElementById('wf-open');
  op.checked=n.sec==='nopass';
  document.getElementById('wf-pw').disabled=op.checked;
  document.getElementById('wifimgr-form-title').textContent=en?'Edit network':'Editar rede';
  document.getElementById('wf-save-btn').textContent=en?'Save changes':'Guardar alterações';
  document.getElementById('wf-ssid').focus();
}
function saveWifiNet(){
  const en=currentLang==='en';
  const name=document.getElementById('wf-name').value.trim();
  const ssid=document.getElementById('wf-ssid').value.trim();
  const isOpen=document.getElementById('wf-open').checked;
  const pw=isOpen?'':document.getElementById('wf-pw').value;
  if(!ssid){toast(en?'Network name (SSID) is required!':'Nome da rede (SSID) obrigatório!');return;}
  if(!isOpen&&!pw){toast(en?'Enter the password or tick "open network".':'Escreve a password ou marca "rede aberta".');return;}
  if(editingWifiId){
    const n=wifiNets.find(x=>x.id===editingWifiId);
    if(n){n.name=name;n.ssid=ssid;n.pw=pw;n.sec=isOpen?'nopass':'WPA';}
    logActivity('edit',name||ssid,'📶');
  }else{
    wifiNets.push({id:'w'+Date.now().toString(36),name,ssid,pw,sec:isOpen?'nopass':'WPA'});
    logActivity('add',name||ssid,'📶');
  }
  resetWifiForm();renderWifiList();renderWifiBar();
  toast(en?'Network saved ✓':'Rede guardada ✓');
  markUnsaved();
}
function deleteWifiNet(id){
  const n=wifiNets.find(x=>x.id===id);if(!n)return;
  const en=currentLang==='en';
  if(!confirm(en?`Delete "${n.name||n.ssid}"?`:`Apagar "${n.name||n.ssid}"?`))return;
  wifiNets=wifiNets.filter(x=>x.id!==id);
  logActivity('delete',n.name||n.ssid,'📶');
  if(editingWifiId===id)resetWifiForm();
  renderWifiList();renderWifiBar();
  toast(en?'Network deleted.':'Rede apagada.');
  markUnsaved();
}

// ══ WIFI QR ══
function escWifiField(s){return String(s).replace(/([\\;,:"])/g,'\\$1');}
function isWifiEntry(e){if(e.isWifi===true)return true;if(e.isWifi===false)return false;return /wi-?fi|wlan|router|hotspot|\bssid\b|\bmodem\b|\brede\b|\bnetwork\b/i.test(e.name||'')||/wi-?fi|rede/i.test((e.tags||[]).join(' '));}
function openWifiQR(id){
  const e=vault.find(v=>v.id===id);if(!e)return;
  showWifiQR((e.user&&e.user.trim())?e.user.trim():e.name,e.pw||'');
}
function openWifiNetQR(netId){
  const n=wifiNets.find(x=>x.id===netId);if(!n)return;
  showWifiQR(n.ssid,n.sec==='nopass'?'':(n.pw||''),n.name);
}
function showWifiQR(ssid,pass,label){
  const payload=pass
    ?`WIFI:T:WPA;S:${escWifiField(ssid)};P:${escWifiField(pass)};;`
    :`WIFI:T:nopass;S:${escWifiField(ssid)};;`;
  const m=CVQR.matrix(payload);
  if(!m){toast(currentLang==='en'?'Data too long for QR!':'Dados demasiado longos para QR!');return;}
  const canvas=document.getElementById('qr-canvas');
  const scale=6,quiet=4;
  const size=(m.length+quiet*2)*scale;
  canvas.width=size;canvas.height=size;
  canvas.style.width=Math.min(size,240)+'px';
  canvas.style.height=Math.min(size,240)+'px';
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000';
  for(let r=0;r<m.length;r++)for(let cc=0;cc<m.length;cc++)
    if(m[r][cc])ctx.fillRect((cc+quiet)*scale,(r+quiet)*scale,scale,scale);
  document.getElementById('qr-title').innerHTML=avWifiIcon(20)+'&nbsp;'+(currentLang==='en'?'WiFi QR Code':'QR Code do WiFi');
  document.getElementById('qr-ssid').textContent=`📡 ${ssid}`+(label&&label!==ssid?`  ·  ${label}`:'');
  document.getElementById('qr-hint').textContent=currentLang==='en'
    ?'Point the phone camera at the code to connect automatically'
    :'Aponta a câmara do telemóvel para ligar automaticamente';
  document.getElementById('qr-close-btn').textContent=currentLang==='en'?'Close':'Fechar';
  document.getElementById('qr-overlay').classList.add('open');
}
function closeQrModal(){const o=document.getElementById('qr-overlay');if(o)o.classList.remove('open');}

// ══ DOCUMENT VALIDITY FILTER ══
let currentDocValidityFilter='all';
function setDocValidityFilter(filter){
  currentDocValidityFilter=filter;
  document.querySelectorAll('#docs-validity-row .doc-filter-btn').forEach(b=>{
    b.classList.toggle('active',b.id===`vf-${filter}`);
  });
  renderDocs();
}

// ══ PRESENTATION MODE ══
let presentationMode=false;
let realVault=null,realNotes=null,realBankCards=null,realDocuments=null,realTrash=null,realTotp=null,realCustomCats=null,realDocFolders=null,realVaultFolders=null,realWifiNets=null;
const DEMO_DATA={
  vault:[
    {id:'d1',name:'Gmail',cat:'email',user:'exemplo@gmail.com',pw:'Demo#2026!',url:'https://gmail.com',icon:'📧',fav:true,tags:['pessoal'],createdAt:Date.now()-86400000*5,pwUpdated:Date.now()-86400000*5,archived:false,order:0},
    {id:'d2',name:'Netflix',cat:'jogo',user:'exemplo@gmail.com',pw:'Netflix$Pass1',url:'https://netflix.com',icon:'🎬',fav:false,tags:[],createdAt:Date.now()-86400000*30,pwUpdated:Date.now()-86400000*30,archived:false,order:1},
    {id:'d3',name:'Banco CGD',cat:'banco',user:'123456789',pw:'BancoPass#99',url:'https://cgd.pt',icon:'🏦',fav:true,tags:['banco'],createdAt:Date.now()-86400000*60,pwUpdated:Date.now()-86400000*60,archived:false,order:2},
    {id:'d4',name:'LinkedIn',cat:'trabalho',user:'carlos.silva@email.com',pw:'Work$2026Pass',url:'https://linkedin.com',icon:'💼',fav:false,tags:['trabalho'],createdAt:Date.now()-86400000*10,pwUpdated:Date.now()-86400000*10,archived:false,order:3},
    {id:'d5',name:'Instagram',cat:'social',user:'@carlos_silva',pw:'Insta!Pass22',url:'https://instagram.com',icon:'📸',fav:false,tags:[],createdAt:Date.now()-86400000*90,pwUpdated:Date.now()-86400000*90,archived:false,order:4},
  ],
  notes:[
    {id:'n1',title:'IBAN Pessoal',body:'PT50 0000 0000 0000 0000 0000 0\nTitular: Carlos Silva',createdAt:Date.now()-86400000*20},
    {id:'n2',title:'WiFi Casa',body:'Nome: CasaSilva_5G\nPassword: MinhaWifi2026!',createdAt:Date.now()-86400000*100},
  ],
  bankCards:[
    {id:'c1',bank:'Caixa Geral de Depósitos',holder:'CARLOS SILVA',number:'4532 1234 5678 9012',expiry:'12/28',type:'debito',pin:'1234',color:'#1b5e20',notes:'Cartão principal'},
    {id:'c2',bank:'Santander',holder:'CARLOS SILVA',number:'5412 9876 5432 1098',expiry:'06/26',type:'credito',pin:'5678',color:'#b71c1c',notes:'Limite 2000€'},
  ],
  documents:[
    {id:'doc1',title:'Cartão de Cidadão',cat:'pessoal',date:'2020-01-15',expiry:'2030-01-14',desc:'Número: 12345678 9ZZ4',file:null,createdAt:Date.now()-86400000*365},
    {id:'doc2',title:'CV 2026',cat:'trabalho',date:'2026-01-01',expiry:'',desc:'Versão atualizada Janeiro 2026',file:null,createdAt:Date.now()-86400000*60,folderId:'fd1'},
    {id:'doc3',title:'Fatura Cliente A',cat:'trabalho',date:'2026-06-15',expiry:'',desc:'Serviços de junho — pago',file:null,createdAt:Date.now()-86400000*20,folderId:'fd2'},
  ],
  vaultFolders:[
    {id:'vf1',name:'Trabalho',icon:'💼',parentId:null},
  ],
  wifiNets:[
    {id:'w1',name:'Casa',ssid:'CasaSilva_5G',pw:'ExemploDemo2026',sec:'WPA'},
  ],
  docFolders:[
    {id:'fd1',name:'Empresa',icon:'🏢',parentId:null},
    {id:'fd2',name:'Rendimentos',icon:'💶',parentId:'fd1'},
  ],
  totp:[
    {id:'t1',name:'Google',account:'exemplo@gmail.com',secret:'JBSWY3DPEHPK3PXP',createdAt:Date.now()-86400000*10},
    {id:'t2',name:'Discord',account:'carlos#1234',secret:'GEZDGNBVGY3TQOJQ',createdAt:Date.now()-86400000*5},
  ]
};
let demoFromLock=false;
function enterPresentationMode(){
  if(presentationMode)return;
  presentationMode=true;
  demoFromLock=!masterKey;
  realVault=[...vault];realNotes=[...notes];realBankCards=[...bankCards];realDocuments=[...documents];realTrash=[...trash];realTotp=[...totp];realCustomCats=[...customCats];realDocFolders=[...docFolders];realVaultFolders=[...vaultFolders];realWifiNets=[...wifiNets];
  vault=JSON.parse(JSON.stringify(DEMO_DATA.vault));notes=JSON.parse(JSON.stringify(DEMO_DATA.notes));bankCards=JSON.parse(JSON.stringify(DEMO_DATA.bankCards));documents=JSON.parse(JSON.stringify(DEMO_DATA.documents));trash=[];totp=JSON.parse(JSON.stringify(DEMO_DATA.totp));customCats=[];docFolders=JSON.parse(JSON.stringify(DEMO_DATA.docFolders||[]));currentFolderId=null;vaultFolders=JSON.parse(JSON.stringify(DEMO_DATA.vaultFolders||[]));currentVaultFolderId=null;wifiNets=JSON.parse(JSON.stringify(DEMO_DATA.wifiNets||[]));
  document.getElementById('presentation-banner').classList.add('show');
  document.getElementById('pres-label').textContent=currentLang==='en'?'DEMO MODE — sample data, nothing is saved':'MODO DEMONSTRAÇÃO — dados fictícios, nada é guardado';
  document.querySelector('.topbar').style.marginTop='44px';
  renderAll();
  switchTab('dashboard');
  if(demoFromLock){
    const lockScreen=document.getElementById('lock-screen');
    const app=document.getElementById('app');
    lockScreen.style.display='none';
    app.style.display='';
    app.classList.remove('visible');void app.offsetHeight;
    app.classList.add('visible');
    setTimeout(positionTabIndicator,120);
  }
  toast(currentLang==='en'?'Demo mode — explore freely!':'Modo demonstração — explora à vontade!');
}
function exitPresentationMode(){
  if(!presentationMode)return;
  presentationMode=false;
  vault=realVault;notes=realNotes;bankCards=realBankCards;documents=realDocuments;trash=realTrash;totp=realTotp;customCats=realCustomCats;docFolders=realDocFolders||[];currentFolderId=null;vaultFolders=realVaultFolders||[];currentVaultFolderId=null;wifiNets=realWifiNets||[];
  realVault=null;realNotes=null;realBankCards=null;realDocuments=null;realTrash=null;realTotp=null;realCustomCats=null;realDocFolders=null;realVaultFolders=null;realWifiNets=null;
  document.getElementById('presentation-banner').classList.remove('show');
  document.querySelector('.topbar').style.marginTop='';
  if(demoFromLock){
    demoFromLock=false;
    hasUnsaved=false;
    try{closeGlobalSearch();}catch(e){}
    const app=document.getElementById('app');
    app.classList.remove('visible');
    app.style.display='none';
    const lockScreen=document.getElementById('lock-screen');
    lockScreen.style.display='flex';
    lockScreen.style.opacity='1';
    backToInitial();
    return;
  }
  renderAll();switchTab('dashboard');
  toast(currentLang==='en'?'Back to your real data ✓':'De volta aos teus dados reais ✓');
}
let _toastT=0;
function toast(msg){const t2=document.getElementById('toast');t2.textContent=msg;t2.classList.add('show');clearTimeout(_toastT);_toastT=setTimeout(()=>t2.classList.remove('show'),2500);}

// ══ KEYBOARD ══
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeChangePwModal();closePwGen();closeImport();closeSettings();closeCardModal();closeReadMode();closeDocModal();closeQrModal();closeTotpModal();closeQrScanner();closeShareModal();closeShareImport();closeFolderModal();closeMoveModal();closeWifiManager();closePinSetup();closeTopMenu();closeLegacyModal();close2faSetup();close2faManager();closeSnapshotModal();closeDedupeModal();closeSelectiveExport();closeDocPreview();closeInfoModal();closeSubModal();closeSubsScreen();closeStoreModal();closeBarcode();}
  if(!masterKey)return;
  const anyOpen=document.querySelector('.modal-overlay.open');
  if(anyOpen)return;
  if(e.ctrlKey||e.metaKey){
    if(e.key==='n'){e.preventDefault();openModal();}
    if(e.key==='s'){e.preventDefault();saveFile();}
    if(e.key==='f'){e.preventDefault();const si=document.getElementById('search-input');if(si){si.focus();si.select();}}
    if(e.key==='l'){e.preventDefault();lockApp();}
  }
});

// ══ PARTICLES ══
function launchParticles(){
  const canvas=document.getElementById('particles-canvas');
  canvas.style.display='block';
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const ctx=canvas.getContext('2d');
  const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#c9a84c';
  const particles=[];
  const cx=canvas.width/2,cy=canvas.height/2;
  for(let i=0;i<80;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=(Math.random()*4+2);
    particles.push({
      x:cx,y:cy,
      vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-2,
      size:Math.random()*5+2,
      alpha:1,life:Math.random()*40+40,
      color:Math.random()>0.5?accent:'#ffffff',
      shape:Math.random()>0.5?'circle':'star'
    });
  }
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=false;
    particles.forEach(p=>{
      if(p.life<=0)return;
      alive=true;
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;
      p.life--;p.alpha=p.life/80;
      ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;
      if(p.shape==='star'){
        ctx.beginPath();
        for(let s=0;s<5;s++){
          const a=((s*72)-90)*(Math.PI/180);
          const a2=((s*72+36)-90)*(Math.PI/180);
          if(s===0)ctx.moveTo(p.x+p.size*Math.cos(a),p.y+p.size*Math.sin(a));
          else ctx.lineTo(p.x+p.size*Math.cos(a),p.y+p.size*Math.sin(a));
          ctx.lineTo(p.x+(p.size/2)*Math.cos(a2),p.y+(p.size/2)*Math.sin(a2));
        }
        ctx.closePath();ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    });
    frame++;
    if(alive&&frame<120)requestAnimationFrame(draw);
    else{ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.display='none';}
  }
  draw();
}

// ══ WELCOME SCREEN ══
let welcomeStep=0;
function renderWelcome(){
  const steps=(T[currentLang]||T.pt).welcomeSteps||T.pt.welcomeSteps;
  const total=steps.length;
  const step=steps[Math.min(welcomeStep,total-1)];
  const isFirst=welcomeStep===0;
  const isLast=welcomeStep>=total-1;
  const dots=[...Array(total)].map((_,i)=>`<div class="welcome-dot${i===welcomeStep?' active':''}"></div>`).join('');
  const inner=document.getElementById('welcome-inner');
  if(!inner)return;
  inner.innerHTML=`
    <div class="welcome-step active">
      <div class="welcome-icon">${step.icon}</div>
      <div class="welcome-title">${step.title}</div>
      <div class="welcome-text">${step.text}</div>
      <div class="welcome-dots">${dots}</div>
      <div class="welcome-btns">
        ${!isFirst?`<button class="btn btn-ghost" data-act="prevWelcome">${t('wBtnPrev')}</button>`:''}
        ${isLast
          ?`<button class="btn btn-gold" style="min-width:160px" data-act="skipWelcome">${t('wBtnDone')}</button>`
          :`<button class="btn btn-gold" style="min-width:160px" data-act="nextWelcome">${isFirst?t('wBtnStart'):t('wBtnNext')}</button>`
        }
      </div>
      ${!isLast?`<button class="welcome-skip" data-act="skipWelcome">${t('wBtnSkip')}</button>`:''}
    </div>`;
}
function showWelcome(){
  welcomeStep=0;
  try{renderWelcome();}catch(e){console.warn('renderWelcome error:',e);return;}
  setTimeout(()=>{
    const el=document.getElementById('welcome-screen');
    if(el)el.classList.add('show');
  },400);
}
function nextWelcome(){
  try{
    const total=(T[currentLang]||T.pt).welcomeSteps.length;
    if(welcomeStep>=total-1){skipWelcome();return;}
    welcomeStep++;renderWelcome();
  }catch(e){skipWelcome();}
}
function prevWelcome(){
  if(welcomeStep<=0)return;
  try{welcomeStep--;renderWelcome();}catch(e){}
}
function skipWelcome(){
  welcomeStep=0;
  try{
    const el=document.getElementById('welcome-screen');
    if(el)el.classList.remove('show');
  }catch(e){}
  try{localStorage.setItem('cv_welcomed','1');}catch(e){}
}
function checkFirstTime(){
  try{
    const welcomed=localStorage.getItem('cv_welcomed');
    if(!welcomed){showWelcome();}
  }catch(e){}
}

// ══ READ MODE ══
function openReadMode(id){
  const entry=vault.find(v=>v.id===id);if(!entry)return;
  const content=document.getElementById('read-content');
  const catLabel=getCatLabel(entry.cat);
  const userIcon2=entry.icon&&entry.icon!=='⭐'?entry.icon:null;
  const brandSvg=userIcon2?null:getBrandIcon(entry);
  const brandBadge=userIcon2?`<div class="read-brand-emoji">${userIcon2}</div>`:(brandSvg?`<div class="read-brand-logo">${brandSvg}</div>`:`<div class="read-brand-emoji">${getServiceIcon(entry.name)||'🔐'}</div>`);
  let html=`
    <div class="read-brand-head">${brandBadge}</div>
    <span class="read-card-cat">${vaultCatInfo(entry.cat).icon} ${esc(vaultCatInfo(entry.cat).label)}</span>
    <div class="read-card-title">${esc(entry.name)}</div>`;
  if(entry.user)html+=`<div class="read-field"><span class="read-field-label">${t('cardUser')}</span><div class="read-field-value">${esc(entry.user)}</div></div>`;
  if(entry.pw)html+=`<div class="read-field"><span class="read-field-label">${t('cardPw')}</span><div class="read-field-value masked" id="read-pw">••••••••••••</div></div>`;
  if(entry.url)html+=`<div class="read-field"><span class="read-field-label">${t('cardUrl')}</span><div class="read-field-value" style="font-size:.9rem;color:var(--accent-dim)">${esc(entry.url)}</div></div>`;
  if(entry.notes)html+=`<div class="read-field"><span class="read-field-label">${t('cardNotes')}</span><div class="read-field-value" style="font-size:.95rem;font-family:inherit;color:var(--text-muted)">${esc(entry.notes)}</div></div>`;
  if((entry.tags||[]).length)html+=`<div class="read-field"><span class="read-field-label">Tags</span><div style="display:flex;gap:6px;flex-wrap:wrap">${entry.tags.map(tag=>`<span class="card-tag" style="font-size:.68rem;padding:4px 10px">${esc(tag)}</span>`).join('')}</div></div>`;
  (entry.fields||[]).forEach(f=>{html+=`<div class="read-field"><span class="read-field-label">${esc(f.k)}</span><div class="read-field-value">${esc(f.v)}</div></div>`;});
  content.innerHTML=html;
  const actions=document.getElementById('read-actions');
  let actHtml='';
  if(entry.pw)actHtml+=`<button class="btn btn-gold" data-act="avReadTogglePw" data-arg="${esc(entry.id)}">${currentLang==='en'?'Show/Hide Password':'Mostrar/Esconder Password'}</button>`;
  if(entry.pw)actHtml+=`<button class="btn btn-ghost" data-act="avCopyPw" data-arg="${esc(entry.id)}">${currentLang==='en'?'Copy Password':'Copiar Password'}</button>`;
  if(isWifiEntry(entry))actHtml+=`<button class="btn btn-ghost" data-act="openWifiQR" data-arg="${esc(entry.id)}">📶 ${currentLang==='en'?'WiFi QR':'QR WiFi'}</button>`;
  if(entry.url)actHtml+=`<button class="btn btn-ghost" data-act="avGoSite" data-arg="${esc(entry.id)}">${t('btnGoSite')}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readShare" data-arg="${esc(entry.id)}">🔗 ${currentLang==='en'?'Share QR':'Partilhar QR'}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readEdit" data-arg="${esc(entry.id)}">${t('btnEdit')}</button>`;
  actions.innerHTML=actHtml;
  document.getElementById('read-modal').classList.add('open');
}

function openDocPreview(id){
  const doc=documents.find(d=>d.id===id);if(!doc)return;
  const content=document.getElementById('read-content');
  const catInfo=DOC_CATS[doc.cat]||{icon:'📋'};
  const fileIcon=doc.file?getFileIcon(doc.file.name):'📎';
  const autoIcon=getDocAutoIcon(doc);
  const expStatus=getExpiryStatus(doc.expiry);
  let html=`
    <span class="read-card-cat">${catInfo.icon} ${getDocCatLabel(doc.cat)}</span>
    <div class="read-card-title">${autoIcon} ${esc(doc.title)}</div>`;
  html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Location':'Localização'}</span><div class="read-field-value" style="font-size:.85rem">📍 ${esc(folderPathLabel(doc.folderId||null))}</div></div>`;
  if(doc.desc)html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Description':'Descrição'}</span><div class="read-field-value" style="font-size:.95rem;font-family:inherit;color:var(--text-muted);line-height:1.6">${esc(doc.desc)}</div></div>`;
  if(doc.date)html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Date':'Data'}</span><div class="read-field-value">${esc(doc.date)}</div></div>`;
  if(doc.expiry){
    const badge=expStatus?`<span class="doc-expiry-badge ${expStatus.cls}" style="font-size:.72rem;padding:4px 10px;margin-left:10px">⏰ ${expStatus.label}</span>`:'';
    html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Expiry':'Validade'}</span><div class="read-field-value" style="display:flex;align-items:center">${esc(doc.expiry)}${badge}</div></div>`;
  }
  if(doc.file)html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'File':'Ficheiro'}</span><div class="read-field-value" style="font-size:.85rem">${fileIcon} ${esc(doc.file.name)} <span style="color:var(--text-muted);font-size:.75rem">(${formatFileSize(doc.file.size)})</span></div></div>`;
  else html+=`<div class="read-field"><div style="font-size:.78rem;color:var(--text-muted);font-style:italic">${currentLang==='en'?'No file attached':'Sem ficheiro anexado'}</div></div>`;
  content.innerHTML=html;
  const actions=document.getElementById('read-actions');
  let actHtml='';
  if(doc.file)actHtml+=`<button class="btn btn-gold" data-act="downloadDoc" data-arg="${esc(doc.id)}">${currentLang==='en'?'⬇ Download':'⬇ Transferir'}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readOpenDoc" data-arg="${esc(doc.id)}">${t('btnEdit')}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readGoFolder" data-arg="${esc(doc.folderId||'')}">${currentLang==='en'?'Open folder':'Abrir pasta'}</button>`;
  actions.innerHTML=actHtml;
  document.getElementById('read-modal').classList.add('open');
}

function closeReadMode(){document.getElementById('read-modal').classList.remove('open');}

// ══ DRAG & DROP VAULT FILE ══
document.addEventListener('dragover',e=>{
  if(!document.getElementById('lock-screen').style.display||document.getElementById('lock-screen').style.display==='flex'||document.getElementById('lock-screen').style.display===''){
    e.preventDefault();
    document.getElementById('drag-overlay').classList.add('show');
  }
});
document.addEventListener('dragleave',e=>{
  if(!e.relatedTarget||e.relatedTarget===document.body){
    document.getElementById('drag-overlay').classList.remove('show');
  }
});
document.addEventListener('drop',e=>{
  e.preventDefault();
  document.getElementById('drag-overlay').classList.remove('show');
  const file=e.dataTransfer?.files[0];
  if(!file)return;
  const ls=document.getElementById('lock-screen');
  if(!ls||ls.style.display==='none'||lockedOut)return;   // com o cofre aberto, isto não é para aqui
  if(/\.(vault|cofre)$/i.test(file.name)){
    // Antes: backToInitial()/startOpenVault() apagavam o ficheiro largado e abriam o seletor — e a palavra-passe
    // acabava por ser tentada noutro ficheiro (o memorizado). Um ficheiro largado não tem «handle»: gravar pede o destino.
    backToInitial();
    pendingVaultFile=file;vaultFileHandle=null;
    document.getElementById('login-state-initial').style.display='none';
    document.getElementById('login-state-new').style.display='none';
    document.getElementById('login-state-open').style.display='block';
    document.getElementById('open-step-file').style.display='none';
    document.getElementById('open-step-pw').style.display='block';
    document.getElementById('l-file-name').textContent='📁 '+file.name;
    document.getElementById('master-pw').value='';
    showFileMeta(file);lockSubText();
    refreshQuickUnlock(true);
  }
});

try{applyLangStatic();}catch(e){console.warn('applyLangStatic error:',e);}
try{
  // Apply saved theme and colors
  document.documentElement.setAttribute('data-theme',currentTheme);
  document.getElementById('theme-btn') && (document.getElementById('theme-btn').textContent=currentTheme==='dark'?'🌙':'☀️');
  applyThemeColors(currentTheme);
}catch(e){console.warn('applyThemeColors error:',e);}
try{renderHowTo();}catch(e){console.warn('renderHowTo error:',e);}
try{refreshContinueBtn();}catch(e){}

/* ══ ENTRADA DIRETA — cofre memorizado → pede logo o PIN ══
   O PIN desembrulha a chave guardada neste dispositivo e não precisa do ficheiro; o ficheiro só é
   lido no momento de entrar. O Chrome exige um toque para autorizar o acesso ao ficheiro, por isso
   essa autorização é pedida ao tocar no campo ou em «Entrar no Cofre» — nunca sozinha. */
let lockHeldPw=null,lockHeldQk=null,lockEnsureP=null;
function lockOnPwStep(){const o=document.getElementById('login-state-open'),s=document.getElementById('open-step-pw');return !!(o&&s&&o.style.display!=='none'&&s.style.display!=='none');}
function lockSubText(){
  const en=currentLang==='en',sub=document.getElementById('l-panel-sub');if(!sub)return;
  const newOn=document.getElementById('login-state-new')&&document.getElementById('login-state-new').style.display!=='none';
  sub.textContent=lockOnPwStep()?(en?'Access your digital vault':'Acede ao teu cofre digital'):newOn?(en?'Create your vault':'Cria o teu cofre'):(en?'Choose how to begin':'Escolhe como queres começar');
}
function lockLangExtras(){
  const en=currentLang==='en';
  const s=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};
  s('l-enter-txt',en?'Enter the Vault':'Entrar no Cofre');
  s('l-back-mine',en?'← Back to my vault':'← Voltar ao meu cofre');
  s('l-forget-mine',en?'Forget':'Esquecer');
  s('lock-encrypt-short',en?'100% Encrypted · 100% Offline':'100% Encriptado · 100% Offline');
  s('l-master-label',en?'Master password':'Palavra-passe mestra');
  s('lk-start-label',en?'Master password':'Palavra-passe mestra');
  s('lk-start-msg',en?'Create a new vault or load one you already have.':'Cria um cofre novo ou carrega um que já tenhas.');
  lockSwipeText();
  if(lockOnPwStep()&&typeof applyUnlockMode==='function')try{applyUnlockMode(false);}catch(e){}
}
function lockShowPwStep(){
  ['login-state-initial','login-state-new'].forEach(i=>{const e=document.getElementById(i);if(e)e.style.display='none';});
  document.getElementById('login-state-open').style.display='block';
  document.getElementById('open-step-file').style.display='none';
  document.getElementById('open-step-pw').style.display='block';
  document.getElementById('master-pw').value='';
  lockSubText();
}
async function lockDirectInit(){
  if(pendingVaultFile||pendingVaultText||lockedOut)return false;
  if(!FSA_OK)return avDevInit();
  let hd=null;try{hd=await idbGet('vaultHandle');}catch(e){}
  if(!hd&&!pendingVaultFile&&!pendingVaultText&&localStorage.getItem('av_dev_mode')==='1')return avDevInit(true);
  if(!hd||pendingVaultFile||pendingVaultText)return false;
  vaultFileHandle=hd;lockSwipeNeed=true;lockSwipeRetry=false;lockShowPwStep();
  const fn=document.getElementById('l-file-name');if(fn)fn.textContent=hd.name||'';
  const fm=document.getElementById('l-file-meta');if(fm)fm.style.display='none';
  let granted=false;
  try{granted=(await hd.queryPermission({mode:'readwrite'}))==='granted';}catch(e){}
  if(granted){try{const f=await hd.getFile();pendingVaultFile=f;showFileMeta(f);}catch(e){granted=false;}}
  await refreshQuickUnlock(granted);
  return true;
}
function lockEnsureFile(){
  if(pendingVaultFile||pendingVaultText)return Promise.resolve(true);
  if(lockEnsureP)return lockEnsureP;
  lockEnsureP=(async()=>{
    const en=currentLang==='en';
    let hd=vaultFileHandle;if(!hd){try{hd=await idbGet('vaultHandle');}catch(e){}}
    if(!hd){lockOtherVault();return false;}
    try{
      let perm=await hd.queryPermission({mode:'readwrite'});
      if(perm!=='granted')perm=await hd.requestPermission({mode:'readwrite'});
      if(perm!=='granted'){setLockError(en?'Allow access to the vault file to continue.':'Autoriza o acesso ao ficheiro do cofre para continuar.');return false;}
      vaultFileHandle=hd;
      const f=await hd.getFile();pendingVaultFile=f;showFileMeta(f);
      return true;
    }catch(e){
      if(e&&(e.name==='SecurityError'||e.name==='NotAllowedError')){setLockError(en?'Tap “Enter the Vault” to allow access to the file.':'Toca em «Entrar no Cofre» para autorizar o acesso ao ficheiro.');return false;}
      toast(en?'Could not open the file.':'Não foi possível abrir o ficheiro.');
      try{await idbDel('vaultHandle');}catch(_){}
      vaultFileHandle=null;lockOtherVault();return false;
    }
  })();
  lockEnsureP.finally(()=>{lockEnsureP=null;});
  return lockEnsureP;
}
function lockFieldTap(kind){
  const el=document.getElementById(kind==='pin'?'pin-input':'master-pw');
  if(el&&document.activeElement!==el)el.focus();
  if(!pendingVaultFile&&!pendingVaultText)lockEnsureFile();
}
function lockToggleEye(id){
  const el=document.getElementById(id);if(!el)return;
  el.type=el.type==='password'?'text':'password';
  const b=el.parentElement&&el.parentElement.querySelector('.lk-eye');if(b)b.classList.toggle('on',el.type==='text');
  el.focus();
}
async function lockEnter(){
  if(lockedOut)return;
  const en=currentLang==='en';
  if(lockHeldPw){const pw=lockHeldPw,qk=lockHeldQk;if(await lockEnsureFile())submitOpenVault(pw,qk);return;}
  if(unlockMode==='bio')return lockBioStart();
  if(unlockMode==='pin'){
    const el=document.getElementById('pin-input');
    const n=quickAvail.pinLen;
    if(el&&el.value.length>=n)return onPinInput();
    const ok=await lockEnsureFile();
    if(el)el.focus();
    const err=document.getElementById('pin-err');
    if(ok&&err)err.textContent=en?`Enter your ${n}-digit PIN.`:`Introduz o PIN de ${n} dígitos.`;
    return;
  }
  const mp=document.getElementById('master-pw');
  if(mp&&!mp.value){mp.focus();if(!pendingVaultFile&&!pendingVaultText)lockEnsureFile();return;}
  return submitOpenVault();
}
async function lockMineLinks(){
  const box=document.getElementById('l-mine-links');if(!box)return;
  let hd=null;if(FSA_OK){try{hd=await idbGet('vaultHandle');}catch(e){}}
  let dev=false;if(!FSA_OK){try{const l=await localVaultGet();dev=!!(l&&l.json);}catch(e){}}
  const has=!!(pendingVaultFile||pendingVaultText||hd||dev);
  box.style.display=has?'flex':'none';
  avDevHint(!FSA_OK&&!has);
  const fg=document.getElementById('l-forget-mine'),sep=box.querySelector('.link-sep');
  if(fg)fg.style.display=hd?'':'none';if(sep)sep.style.display=hd?'':'none';
}
function lockOtherVault(){
  document.getElementById('login-state-open').style.display='none';
  document.getElementById('login-state-new').style.display='none';
  document.getElementById('login-state-initial').style.display='block';
  document.getElementById('lock-error').textContent='';
  lockSubText();lockMineLinks();
}
function lockBackToMine(){
  if(pendingVaultFile||pendingVaultText){lockShowPwStep();refreshQuickUnlock(false);return;}
  lockDirectInit().then(ok=>{if(!ok)lockMineLinks();});
}
async function lockForgetMine(){
  const en=currentLang==='en';
  if(!confirm(en?'Forget the remembered vault on this device? The file itself is not touched.':'Esquecer o cofre memorizado neste dispositivo? O ficheiro em si não é alterado.'))return;
  try{await idbDel('vaultHandle');}catch(e){}
  vaultFileHandle=null;pendingVaultFile=null;pendingVaultText=null;lockHeldPw=null;
  lockMineLinks();toast(en?'Vault forgotten on this device.':'Cofre esquecido neste dispositivo.');
}

/* ══ ECRÃ DE ENTRADA v10.8 — cofre memorizado: «desliza para cima» → impressão digital (ou PIN, ou palavra-passe);
   primeira vez: palavra-passe mestra logo à vista + «Carregar cofre» / «Criar cofre» ══ */
var lockSwipeNeed=false,lockTypedPw='',lockBioPrompting=false,lockSwipeRetry=false;
// Pede a impressão digital já (tem de ser dentro do gesto: deslizar, tocar ou escolher o ficheiro); se não der, volta o «desliza»
function lockBioStart(){
  lockBioPrompting=true;lockSwipeNeed=false;
  applyUnlockMode(false);
  return Promise.resolve(doBioUnlock(false)).then(r=>{
    lockBioPrompting=false;
    if(r==='ok'||r==='busy'||(typeof masterKey!=='undefined'&&masterKey))return;
    if(r==='gone'){lockSwipeRetry=false;return;}
    lockSwipeNeed=true;lockSwipeRetry=true;applyUnlockMode(false);
  },()=>{lockBioPrompting=false;lockSwipeNeed=true;lockSwipeRetry=true;applyUnlockMode(false);});
}
function lockSwipeText(){
  const en=currentLang==='en',touch=!window.matchMedia||matchMedia('(pointer:coarse)').matches;
  const t=lockSwipeRetry?(touch?(en?'Swipe up to try again':'Desliza para cima para tentar outra vez'):(en?'Click or swipe up to try again':'Clica ou desliza para cima para tentar outra vez'))
    :touch?(en?'Swipe up to unlock':'Desliza para cima para desbloquear'):(en?'Click or swipe up to unlock':'Clica ou desliza para cima para desbloquear');
  const el=document.getElementById('lk-swipe-txt');if(el)el.textContent=t;
  const sw=document.getElementById('lk-swipe');if(sw)sw.setAttribute('aria-label',t);
}
function lockSwipeApply(){
  const sw=document.getElementById('lk-swipe');if(!sw)return;
  const on=lockSwipeNeed&&!lockedOut&&lockOnPwStep();
  sw.style.display=on?'':'none';sw.classList.remove('gone');sw.style.removeProperty('--dy');
  ['quick-unlock','master-entry','l-enter-btn'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.toggle('lk-hide',on);});
  const ln=document.getElementById('unlock-links');if(ln)ln.classList.toggle('lk-hide',on&&!lockSwipeRetry);   // depois de uma falha: «Usar PIN», «Recuperar acesso»…
  if(on)lockSwipeText();
}
function lockSwipeGo(){
  if(!lockSwipeNeed)return;
  lockSwipeNeed=false;
  const sw=document.getElementById('lk-swipe');
  if(sw)sw.classList.add('gone');
  if(unlockMode==='bio'){lockSwipeRetry=false;return lockBioStart();}
  setTimeout(()=>{
    lockSwipeApply();
    if(unlockMode==='bio')doBioUnlock(false);
    else{const el=document.getElementById(unlockMode==='pin'?'pin-input':'master-pw');if(el)el.focus();}
  },sw?180:0);
}
(function(){
  const sw=typeof document!=='undefined'&&document.getElementById('lk-swipe');if(!sw)return;
  let y0=null,dy=0;
  const end=e=>{
    if(y0===null)return;
    const d=dy;y0=null;dy=0;sw.classList.remove('drag');
    if(d<-60||(e.type==='pointerup'&&e.pointerType==='mouse'&&d>-6))return lockSwipeGo();
    sw.style.removeProperty('--dy');
    if(e.type==='pointerup'){sw.classList.remove('nudge');void sw.offsetWidth;sw.classList.add('nudge');}
  };
  sw.addEventListener('pointerdown',e=>{if(!lockSwipeNeed)return;y0=e.clientY;dy=0;sw.classList.add('drag');try{sw.setPointerCapture(e.pointerId);}catch(_){}});
  sw.addEventListener('pointermove',e=>{if(y0===null)return;dy=Math.min(0,e.clientY-y0);sw.style.setProperty('--dy',Math.max(dy,-140)+'px');});
  sw.addEventListener('pointerup',end);sw.addEventListener('pointercancel',end);
  sw.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();lockSwipeGo();}});
})();
function lockStartPw(){const el=document.getElementById('start-pw');return el?el.value:'';}
function lockStartOpen(){
  lockTypedPw=lockStartPw();
  const el=document.getElementById('start-pw');if(el)el.value='';
  startOpenVault();
}
function lockStartNew(){
  const pw=lockStartPw(),en=currentLang==='en';
  if(!pw){setLockError(en?'Type the master password you want to use first.':'Escreve primeiro a palavra-passe mestra que queres usar.');const el=document.getElementById('start-pw');if(el)el.focus();return;}
  if(pw.length<4){setLockError(t('lockMinChars'));return;}
  document.getElementById('start-pw').value='';
  startNewVault();
  const p1=document.getElementById('new-pw1');p1.value=pw;
  try{onNewPw1Input();}catch(e){}
  setTimeout(()=>{const p2=document.getElementById('new-pw2');if(p2)p2.focus();},140);
}
function lockStartEnter(){
  const en=currentLang==='en';
  if(!lockStartPw()){const el=document.getElementById('start-pw');if(el)el.focus();return;}
  setLockError(en?'Now choose: Load vault or Create vault.':'Agora escolhe: Carregar cofre ou Criar cofre.');
}
// Palavra-passe escrita no início + ficheiro escolhido → entra logo
function lockUseTypedPw(){
  const pw=lockTypedPw;lockTypedPw='';if(!pw)return;
  _avUserMode='master';unlockMode='master';applyUnlockMode(false);
  const mp=document.getElementById('master-pw');if(mp)mp.value=pw;
  submitOpenVault();
}

/* ══ AURORA DO ECRÃ DE ENTRADA — fotografia (ampliada a 4K) com a aurora animada na placa gráfica (WebGL) ══
   As imagens nítidas vão embutidas neste ficheiro (funciona em qualquer sítio, até aberto do PC); a miniatura
   aparece logo, desfocada, e dá lugar à nítida assim que esta é descodificada. Só os píxeis da aurora ondulam e pulsam; montanhas, neve e
   rochas ficam quietas; as estrelas cintilam. Desenha à resolução real do ecrã (até 2,5×) e baixa sozinha se o
   aparelho for lento. Sem WebGL ou com «reduzir movimento» fica a fotografia nítida estática. */
const AURORA_IMG={p:{src:'img/aurora-p.webp',ph:'data:image/webp;base64,UklGRloOAABXRUJQVlA4WAoAAAAgAAAAnwAAHQEASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggbAwAANBUAJ0BKqAAHgE+tVCiS6ckoyoq0yuxQBaJY2viqBAiEnZAVIrlqzR9Ahl3R6ZcvxhnxmZINHNiagw0o6lavajQHtrpMgW7S9DKwySKVW3wQcP6bA8GzFlP4YgYgcucc75Mhx7QkgkS3gHoOaOKh+DEOLPIRj9YrN2PwlChW5PLtrDxNWhyTSNa+Yn9LahfKUZsphfLREZYEp0iqS3VvsUOBVLelVEo+pBwWFomvWC5OSa1j0h4drsF8dDY/FQnqskbCszVGr1LdkbASO/ei0luFWFOuX0gP/DUSJGzDhOkHqDY/mkdFCn6fUe3Vnp6a8arvHFw9R4LKDQ40HThHin4xLqUug+GxIp7nCx5opMSoqa18+SAa5vpB8+R5WC1BRq4hWeWZXcSTT7mf44w5PD4omTEEiXZB+JMSOxio/AbQfUO8U8FyPfXAUsUqnXkNuflVmGRP7hYlawy3sj2AEOBNwv9/bg461FdGaIQZaNaQRKCpq3avZaJqIFbWx0DcM+zbCIhgNd91WJ88Ya7JoKk0k9MkfHEdr8Fv+71x3PCtLl25Ak0cDH7nQ+bRLbr5JiF710Vy7y8W0dgvk/s31zAWJDscacI4XX6Kd/0kysOzpqRxqSM3bntuVVDdPvw8zHb5MfeXcNbgo85JL5s4/z9A8i5j/Qdr6hhRAPX8TOkJHhi/RopW7Kc5Bx6q9wqEKhUrJq5XKwbEX2lWHIfYN8aPchOK3WuXJV/cVMRzom+UEY0K5V+aG2zYMc4b4Sg7PfrLr6R/+yj5sRjv5N6q/AlSMMW/6tJBt3jDavOdMJsXj7g8JSrZ9PxRtohQRsNS2lBcmgq83WGZ7BloiE5BleVnAogVcxLDlfCrt8IENmIxKIMRyRtK64QZxQapzj1ps9D+dcKZSZuRp3Wj/dasAD++LxNItHgxBzhMuGrmPG/42LG4PvMm7MrEFu94t0AO5MOeM7oVV9xVqztXw5TEQYS98XOmZ3UHSigDlEhJlpD8+w0RX8ys+2GHXyo+50o6rmCFhP3DAhHlHzQiGaw+pF7k17+cTKKKuH5uGt+Lzmc7uqQ/Jv5pr2GEc6Vk74Bbafw7XTvztW1y3nQSCKGICxHO3Ex/ZehAciGuXdoBcEcZpOiGGmIsULDQamiykiLWrXFKG58RtQFtnoljQrvltRT0B8KFg/LO4hfMzaCHz5S+hXDIYpkAePJwZjJ0r1PB19qBwPWl4YIEmOIMHAcNSF3PmkOtSP0BpBktwXZWiQ5xZN9X41ixGn4vfiVZe0/A/cyBoCW9r4jmympZmT8Df72weK76Ai33Gd64MAP7/hd5zJWGcAlZ8jA/HwihhSaxmCRd7FCu+DE3nQRJph37YIyo5N2dTrr86NQhk0o6Et6BWgGzsGlEi93yzvffhbEotkiZ3W5XOUhYk6U/uK4qWACGuyGXeOEM3saYJvr+UEfiKSppewhVB3PBpGGbd/bs7/jOOQ9s1Pm2ytVWUPGsWKZ2WV3gYp1hMIWcjGUpkIGa4K5czuXLoomnNW/WXZOmyWlq2K6exhMm47UmIf91Bly6kb5jbPXeJGZCltlUWzWTJYE29yrd7ktl68Vs4Uh4i1EhDJBpZYK+2yLhHwmrHuYRR60AsnZVroGamTbA2bnhp67vOqnqoyGpnOI5RQMIvp3GygGc9FFRYXnjeXbhXCZdXb6EZ+K5oTLuW4AVQO0RDc9K/6eaFrnfQraVAf937FvJO94QB05zNhmf19VTjw3MVI2VvNJM5bJFbUBpRV/QC0CpEwnEt4PTPYdC7op8R2tQ4NOnQBki/rOyKz4wfSLh4ZDxVheke0Ubrshqbv6eOrCZIPc2FarOAYVIH5cxz7bTAgL0MPCpgkc0JCMPTx4+rrx+0+uDUuqvimwMr+u8wNgjdCterul29JBg7A8Lbeh0oxJLbpCbOVErgoclXhlxVrvKyKM+JV2nlwmX3xEi0ygw0unDqrsoYQYSVMJnBvxeld6yGI3uxZcKoP3dzTVg1eKDE7kgwNbD19fu4rLBQ2OPvRLo0mf2ZqdP+cZqdGsVHFw0TI0uHajhX5FtXVvGmkBI+ijsi+omwYvSHKZYvzva2nS3xasbXJpO1ihFEeFk2xZnaVw5LSppwvGINAG6nHWWELV1UoJUSF1CKUnIkAEb5Awu+8GCIo+X26LowS4qwV0uBsG+Cr0bxUCJfn9oc/VWNWL6YYIo6bxglP7bgcnbXZh3CABqA3GVTCzIE/ET5txHpy0hITkufAwHSfx7nKCBqsjzvquxRKO2cVRJUyuGu9qIJlXonRkYVsGd2W6PRktvpdl7npwlcR2JSn18mhHuNA82nY6iWfnlLsqQaxheBbkm5PZTIf2v5lDgrD0x5JeR6inEnc5BrI8W8OzsTb63szOrTN8YSyH/S33JkuhVLktZnRNUCNdMRXb9MBy7hdG9LRzboIhxFNJ6a3nOSUnVbu8w9/otPMxXbiPdwtvdO+TrsdP+W06fDN0gfFwmtWy8u87J/TNBxkJVNEt8rkIlVvktLEhUOZeGcqnduR9JFWQDUP40TkggsptwTp80oJbA8C8R8gUBvC8dxeXhJmTnFhZVd10sQqYGAU9o9CDCZEsubPUdAKdtSDhw4BDt1uBBF4jeexmXylCifZrcSRDJeeKGnu85Uk9dkPhU6jTlyaEfhjN2nBOOFqZGQ2vFNLUxg9rk20hf/UZukF/HNlSvpdtO6gsWru/u/iUUWh+0/ISV6bImVJxt9+2rkuXm3943snHNpgubxrbcqkePbHyLmEErPNcL5kXH2p/Op/kRgQ/F5FT/Kkwy4YTWF9Kd5dIjMWD7G0h5yTLtyLCVDAvS0m9odqrlfilv+6D1/sO9aFwtfIGdetXc0rM8MixPlBSDCVOkRR8GhHU/BEHRgGV9/osz8a4JZheU8lHhzBejaR356+JTvlTCvZ8DEQUktJlb9O25wcSO/SJpxA1w1SuS2oJBBSI5wQ6OZX2nKVcSrVCBt9jPLn32py/+pSdC92gzQDVd/XzY/LFGtvngMwDRvYQmGEGlWlXlYDDbzEh0wObJO2p/KBtOYB1h3Yemy7pfK1E/O2yBGht8juSJbVkBzSJV0/Aw/VUWYkziRHvlz3uAtiCqxaBy/q5W3cY1JoVu+bunshTWSJs+SW9FooRgwtPyZwFiA+d7ozcxVhaUj6BKsFxko55Jkl0RKkUkxYzIYGTMxCaGSaYAEnkLZBA7q5ExQzvRjMDctkrmvvJMsUcoDHhhW7jZW65KQ4I8jakbEJdrvrhA68BetO2wmw9imRlS5NfxQFYT5mpIzWKGV6rJJNnkcmCfwJ7z+BKTvif16gz+/CUPfszER872UaMrX0gx3H4YNV3UnxLENS/kTbwJI0yKxAgwLG7GYR0zi1bPmPPOBygkrA/FAlBzTa5WEgwCJ32m43CuOX7y/bpLxoE84G3rqo0JEAu7tIvsMCJzR8/bRTtXnmlLeIGtUvpSl6Fs6rKtQfJv0xU+xvkPy+tIgL2WKOhf8dcujySQ1dPYM/Bkvk6Ficg5gjDVjcPLqHamCDDLgapWAJoxUGd1C+PQ7hNiaIOAQmRKZJseBzK3opG4EImY0TrK4jmySyEKXQF5l4ZbARsjUVbbOQySEYJ6QzkxJm1S5yT+NIJy23m0JAeSypIbfXPo7gB9VCSQIkg/tQaLgrRR7jJ8rzUf4lC43NGubqWAQwc6e5z3UkSMhp6NbMNdl0BhgmU30UMxRe/TkxZN87Df3A44v1COirj7/ROTR3UOFE3rAuasavHBJS0UD1RNUfYd2PrbTpjb+B6FttyxFUO2Uv+iufe9LPg57zaqKQeGUqWddSSM7WBydfDJl9bKUSV6rkX9UhlMWIU64vzpPJPVRuAdCNabQTTgrX2hN52QDkS4nPqQlAIK7YUcoe6zvIw5ra95+YLM2ESylB+aOsuyPTfw976+7dgczzMjLT5RqvwlelJZ37tIg/v05SXxCc2rqOHU8gK3eWs90Pb2C1mVlCUq8M8VvyarhDTTOUFBXw5zv5zDuB7qpZtoSpgCZPHWIjc80ErQvX7Xmek2EttjXCjl1It10A8DGg992buG1iCbNh3KCQbjhpEs1R9pAE5Y7knv7C1Q3j5ZdM5bbdLO2RgrSgkne2Fn73h7CQewTv6ZUfmOi3DyyHK5w1YE3FN6ph+dQ01UblcP9i81ND0aF11E9owc8PxoiiOjxsCmkvj0RIeUcD5J/7CShwAAA=='},l:{src:'img/aurora-l.webp',ph:'data:image/webp;base64,UklGRqAIAABXRUJQVlA4WAoAAAAgAAAAnwAAWAAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggsgYAAPAoAJ0BKqAAWQA+sUabSacjoiI0Vyro4BYJTUtK2DQPx/wfLf+oyWW34aYBSqMXjbfnULu84eGtq1ABwnLum7bx/xB46hNTl/0zxnuovlXMgmE9ASG6q2UZP6CxgSMykSbSMdelIwK/HaNtisuRk4NBun4F5kct0bcJpz35b+bIWsubtwyrsGjTuboxthouSTB0+yY6om5NFXX51ozlcGtYpgatyP/EZ2iqPrlYx6AjuonfrPUN2NtLyF7+H6sH+TX5W83+IpI9YFN4IGu8Z39Xk2LVKN5mWZ160L4FPQ9mnVHVljwvstCSyQIVVtZfzKLaSNS6GU2cmOFg8G9MVE8g/FawDa3ntsZEDvLfe/OUG0y7GiiDkKKAggR370kx7lsMjYHkRuKLiQhJiKB/Q2sY1yS4heiKygFNk+T/D6Uk32Bbgk1ouf+Z4i8RlPiMAAD+92S38s9d/U6o/M8JurNpfna3acJWwByoVeGENv6zjzhK7yYAM/iJkjqL+yfilpRBJXGe5IgXhSU6RQ7bOOd6xGEk3XXX/AvnStzYRiMmrudyphFNL6X2ZlXq7ccGvpna2ugpduUqx34KU9uRh0kEYrRYYca7lgBNHJciGyKgC5RX1S53yVOg6AWAWe4KV/Qt1KL6Iqrm4MMUJ6dJs+G9/GyIZAgifpx8C/d4pV4Iwhawfl/4RWxqRVzXJqZCrBpZMIuLYRAaPLL7K4pJG2EnAqlXcCGPUzzTQ2bERwmx8EPII7rzVzqzgivGpRdR5ln0YUHVqSfY29rCzVwkXqMzNQVKpKjNXpYYCn30XI/dJLKfDBcUkdjY4Zlp5CEfC4k9HzdnuPw0MmZ7VcWtEA3u+sq0K2n7HW0JxfLcXTT6zg1iIJf/hY5SzeU7CAPY4uvXpjVnbngp5jFP8S0LM3tx1KxuUiMBgqcBk1byEsZjJUwzb55Od0KNtMbKvQv4m/0hJSpmB2V5zd50Sesq99LmhD6L68THBAiwz/nNMV/4FHt5qouH97QlUlVSZ5hQk+sTARB6dR8uaCD0z32vRcHGjBct8hcsO87kh/RcYIXfeATDEnb45HUMYsQPZ+8kwWBeojyefQO6CQjTuNMW7f84+J1kYSJRDrMIDpv3HddIVkmF80UVaXyuCMsOFdWSBqQLy6aH6N+28o7f+8lvKZq75Uf2+Tplm/QdCc+g4aOH8AUGOPWZyH5MDYJrv1EiPKi5ayed2ePgzv58ghJNk6J3ByKhtRRyDcp56dAs6xiM/BXPnt2hbIai9Vf7stWO+1KIoyJXqV5dLFH1NImQ1PuCv22WSsnjc+21Ba1kKRbt44yuSc4BAPqQBUCVjxMquf8xGwwIiAp+c+4rRkYZbhHw/cVH9K/IGQ6USlWmyIjCSGbf9asgc6LzXCAKaakmMusw5zM6T2S72fmyuGtCyzG3Tfa2YBAk6zBqGdAktWoKFOeBtzfgQedgkdTXMWMis3zFvVQklvZILXYcDod6duyU5Q/2o7jP1Yz1U3qKPH2cw2nLGgpMFmk3gsu9XwrflgQIi6BKPU/+tdaULAEuiQKZ94DNpgphBB7zu8zvQ6RzNqZlLuxb1OPBCQj4qQkU1DCMjft/HkadPRXVEHWB3hhawnzQ6VBi9vxholJydODnxxW5XWbCovih1jYUucTucrTsj/ATbMg4mH9vamP0XjjFHxXhAY8WYrdLoXX4dxmk7WS9RCfYMow0Rfszv4UyvkgGSwuKFlaW5EbX+Kkmzunz2yd1zPIrSJ8p7nJNh0skPibbzgf52CEtYZuAI2AzO3EAhh0DbC2IuUYgAY0Sa/Lmru4yl/WkFBtBHr2Em9m083QK+POPXdyx/WE90exrI+4SRHca2EMz71VVo72b9Zye+/cugqtgYFyGVUUIAh5b0h1go0omz5Na8lK8rAaGGnpRKXArSYlLaMwRSo4d1SI2hIoqo41gXvh254pJaB733sfCClT8Y3lV6kDkfKfSLPC65qc4cgvAOdFKMcqxsnyU4bcJbG1Gc6M7dXIHI+bniRuvng8VsMBr3XichT+Dkh8jnTSfSOhJDRt5d+mOen1WbcX1ADT0pxy2hA23BEFr3tSOLzvNXd62QRw+ueNHeK4QT94SoThq3B+RwkxdrQy7/WQB2R1wOqtQVRL7ofaesChQWHCTdN6ZN6JESCWjJFHL6U8GXbVYDGo1dpLmd7bLq+SPiE/VcE/7jMdxD5uBqBCgy4f3o9Vipr9WyNndNBxMkfylMpU2BLEsgHouQPNkUaKjXsn+H+mu3ZZIyqPYAAA='}};
const ASKY={run:false,raf:0,last:0,t:8,gl:null,prog:null,loc:null,tex:{},hi:{},levels:null,lv:0,slow:0,cw:0,ch:0,maxTex:4096};
function askyPick(){return window.innerWidth/Math.max(1,window.innerHeight)<1?'p':'l';}
// Ecrãs grandes com densidade 2× passavam de 5 milhões de píxeis por frame: aí começa em 1,5× (a foto fica igual)
function askyScale(){if(!ASKY.levels){let d=Math.min(window.devicePixelRatio||1,2);if(d>1.5&&innerWidth*innerHeight*d*d>3.5e6)d=1.5;ASKY.levels=[...new Set([d,Math.min(d,1.5),1])];}return ASKY.levels[ASKY.lv]||1;}
function askyHi(k){
  if(ASKY.hi[k])return ASKY.hi[k];
  const o={img:new Image(),ok:false};ASKY.hi[k]=o;
  o.img.decoding='async';
  o.img.onload=()=>{o.ok=true;const el=document.getElementById('asky-img');
    if(el&&el.dataset.k===k){el.style.backgroundImage='url('+AURORA_IMG[k].src+')';el.classList.add('sharp');}
    if(ASKY.gl&&!ASKY.run)askyDraw();};
  o.img.src=AURORA_IMG[k].src;
  return o;
}
function askyBg(){
  const el=document.getElementById('asky-img');if(!el)return;const k=askyPick();
  if(el.dataset.k===k)return;el.dataset.k=k;
  const o=askyHi(k);el.classList.toggle('sharp',o.ok);
  el.style.backgroundImage='url('+(o.ok?AURORA_IMG[k].src:AURORA_IMG[k].ph)+')';
}
function askySize(force){
  const sky=document.getElementById('asky'),cv=document.getElementById('aurora-gl');if(!sky||!cv)return;
  const w=window.innerWidth,hh=window.innerHeight;
  if(!force&&w===ASKY.cw&&hh<=ASKY.ch)return;
  ASKY.ch=w===ASKY.cw?Math.max(ASKY.ch,hh):hh;ASKY.cw=w;
  sky.style.height=ASKY.ch+'px';
  const s=askyScale();cv.width=Math.round(w*s);cv.height=Math.round(ASKY.ch*s);
  askyBg();
}
const ASKY_VS='attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
const ASKY_FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_img;uniform vec2 u_res,u_isz;uniform float u_t,u_sky;varying vec2 v;
float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1.,0.)),f.x),mix(h12(i+vec2(0.,1.)),h12(i+vec2(1.,1.)),f.x),f.y);}
float amask(vec3 c){float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));
  float gr=smoothstep(.03,.16,c.g-max(c.r,c.b)),mg=smoothstep(.02,.10,min(c.r,c.b)-c.g);
  return max(gr,mg)*smoothstep(.07,.22,mx)*smoothstep(.05,.14,mx-mn);}
void main(){
  float A=u_res.x/u_res.y,B=u_isz.x/u_isz.y;
  vec2 s=A>B?vec2(1.,B/A):vec2(A/B,1.);
  vec2 uv=(v-.5)*s+.5;
  vec3 base=texture2D(u_img,uv).rgb;float m0=amask(base);float t=u_t;
  float n=vn(uv*vec2(3.,5.)+vec2(t*.06,-t*.04));
  vec2 off=vec2(sin(uv.y*20.+t*.8+n*6.2832)*.0042+(vn(uv*7.+t*.12)-.5)*.005,sin(uv.x*13.-t*.55+n*4.)*.0032);
  vec3 dsp=texture2D(u_img,uv+off).rgb;float m=min(m0,amask(dsp));
  vec3 col=mix(base,dsp,m);
  float ray=vn(vec2(uv.x*80.+n*4.,t*.4));
  float pulse=.5+.5*sin(uv.x*8.+uv.y*5.-t*.7+n*5.);
  col*=1.+m0*(.26*(ray-.5)+.2*(pulse-.5));
  if(uv.y<u_sky){
    vec2 ref=u_isz*(1024./max(u_isz.x,u_isz.y));vec2 px=2./ref;vec3 W=vec3(.3333);
    float lc=dot(base,vec3(.299,.587,.114));
    float ln=(dot(texture2D(u_img,uv+vec2(px.x,0.)).rgb,W)+dot(texture2D(u_img,uv-vec2(px.x,0.)).rgb,W)+dot(texture2D(u_img,uv+vec2(0.,px.y)).rgb,W)+dot(texture2D(u_img,uv-vec2(0.,px.y)).rgb,W))*.25;
    float star=smoothstep(.06,.22,lc-ln)*(1.-m0)*(1.-smoothstep(.10,.18,ln));
    float ph=h12(floor(uv*ref));
    col*=1.+star*(.5+.5*sin(t*(1.2+ph*2.4)+ph*6.2832)-.5)*1.1;
  }
  gl_FragColor=vec4(col,1.);
}`;
function askyGL(){
  try{
    const cv=document.getElementById('aurora-gl');if(!cv)return false;
    const gl=cv.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
    if(!gl)return false;
    const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,ASKY_VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,ASKY_FS));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const ap=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
    ASKY.prog=pr;ASKY.loc={res:gl.getUniformLocation(pr,'u_res'),isz:gl.getUniformLocation(pr,'u_isz'),t:gl.getUniformLocation(pr,'u_t'),sky:gl.getUniformLocation(pr,'u_sky')};
    ASKY.maxTex=Math.min(8192,gl.getParameter(gl.MAX_TEXTURE_SIZE)||4096);
    cv.addEventListener('webglcontextlost',e=>{e.preventDefault();ASKY.run=false;ASKY.gl=false;cv.classList.remove('on');},{once:true});
    return gl;
  }catch(e){console.warn('Aurora WebGL:',e.message);return false;}
}
function askyTex(k){
  const hi=askyHi(k);if(!hi.ok)return null;
  const gl=ASKY.gl,cv=gl.canvas,iw=hi.img.naturalWidth,ih=hi.img.naturalHeight,B=iw/ih,A=cv.width/cv.height;
  const need=Math.ceil((A>B?cv.width:cv.height*B)*1.1);
  let o=ASKY.tex[k];
  if(o&&o.tw>=Math.min(need,iw))return o;
  let tw=Math.min(iw,need,ASKY.maxTex),th=Math.round(tw/B);
  if(th>ASKY.maxTex){th=ASKY.maxTex;tw=Math.round(th*B);}
  let src=hi.img;
  if(tw<iw){
    // Reduzir uma foto 4K bloqueava o ecrã dezenas de ms: createImageBitmap faz isso fora da thread principal
    if(window.createImageBitmap&&!hi.bmpFail){
      if(!(hi.bmp&&hi.bmpTw===tw)){
        if(hi.bmpReq!==tw){hi.bmpReq=tw;createImageBitmap(hi.img,{resizeWidth:tw,resizeHeight:th,resizeQuality:'high'})
          .then(b=>{if(hi.bmp&&hi.bmp.close)hi.bmp.close();hi.bmp=b;hi.bmpTw=tw;if(ASKY.gl&&!ASKY.run)askyDraw();})
          .catch(()=>{hi.bmpFail=true;hi.bmpReq=0;});}
        return o||null; // até estar pronta vê-se a fotografia normal (sem animação)
      }
      src=hi.bmp;
    }else{const c=document.createElement('canvas');c.width=tw;c.height=th;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(hi.img,0,0,tw,th);src=c;}
  }
  try{
    if(!o){o={t:gl.createTexture(),tw:0,th:0};ASKY.tex[k]=o;}
    gl.bindTexture(gl.TEXTURE_2D,o.t);
    [[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR]].forEach(q=>gl.texParameteri(gl.TEXTURE_2D,q[0],q[1]));
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,src);
    o.tw=tw;o.th=th;return o;
  }catch(e){console.warn('Aurora textura:',e.message);ASKY.gl=false;ASKY.run=false;cv.classList.remove('on');return null;}
}
function askyDraw(){
  const gl=ASKY.gl;if(!gl)return false;
  const k=askyPick(),o=askyTex(k);if(!o)return false;
  const cv=gl.canvas,L=ASKY.loc;
  gl.viewport(0,0,cv.width,cv.height);gl.useProgram(ASKY.prog);gl.bindTexture(gl.TEXTURE_2D,o.t);
  gl.uniform2f(L.res,cv.width,cv.height);gl.uniform2f(L.isz,o.tw,o.th);gl.uniform1f(L.t,ASKY.t);gl.uniform1f(L.sky,k==='p'?.5:.3);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  if(!cv.classList.contains('on'))cv.classList.add('on');
  return true;
}
function askyFrame(ts){
  if(!ASKY.run)return;
  const ls=document.getElementById('lock-screen');
  if(!ls||ls.style.display==='none'||document.hidden){ASKY.run=false;if(ls&&ls.style.display==='none'&&ASKY.bgPaused){ASKY.bgPaused=false;try{AuroraBG.start();}catch(e){}}return;}
  if(avIdle()){ASKY.run=false;return;} // fica o último frame; volta ao primeiro toque
  ASKY.raf=requestAnimationFrame(askyFrame);
  if(ASKY.last&&ts-ASKY.last<33)return;
  const dt=ASKY.last?ts-ASKY.last:33;ASKY.last=ts;ASKY.t+=Math.min(.1,dt/1000);
  askyDraw();
  ASKY.slow=dt>75?ASKY.slow+1:Math.max(0,ASKY.slow-1);
  if(ASKY.slow>30){ASKY.slow=0;if(ASKY.lv<ASKY.levels.length-1){ASKY.lv++;askySize(true);}else{ASKY.run=false;}}
}
function auroraSkyStart(){
  if(typeof document==='undefined')return;
  const ls=document.getElementById('lock-screen');if(!ls||ls.style.display==='none')return;
  askySize(false);askyBg();
  if(ASKY.gl===null)ASKY.gl=askyGL();
  try{if(typeof AuroraBG!=='undefined'&&AuroraBG.stop){AuroraBG.stop();ASKY.bgPaused=true;}}catch(e){}
  if(!ASKY.gl)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){askyDraw();return;}
  if(ASKY.run)return;
  ASKY.run=true;ASKY.last=0;ASKY.raf=requestAnimationFrame(askyFrame);
}
window.addEventListener('resize',()=>{askySize(false);if(ASKY.gl&&!ASKY.run)askyDraw();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)auroraSkyStart();});
AV_IDLE.cbs.push(()=>{try{
  const ls=document.getElementById('lock-screen');
  if(ls&&ls.style.display==='none'){if(ASKY.bgPaused){ASKY.bgPaused=false;AuroraBG.start();}return;}
  auroraSkyStart();
}catch(e){}});
try{auroraSkyStart();}catch(e){}
try{lockDirectInit();}catch(e){}
try{lockMineLinks();lockLangExtras();lockSubText();}catch(e){}
try{const lv=document.getElementById('l-version');if(lv)lv.textContent='v'+APP_VERSION;}catch(e){}
try{applyPrivacy();}catch(e){}

// ══ PWA ══
try{buildManifest();}catch(e){console.warn('buildManifest:',e);}
if('serviceWorker' in navigator){
  const hadController=!!navigator.serviceWorker.controller;
  let swReloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController||swReloaded)return;
    swReloaded=true;
    const safe=!masterKey&&!document.querySelector('.modal-overlay.open');
    if(safe){location.reload();}
    else{
      window.__cvUpdateReady=true;
      toast(currentLang==='en'?'✨ Update ready — lock (Ctrl+L) to apply':'✨ Atualização pronta — bloqueia (Ctrl+L) para aplicar');
    }
  });
  // Só depois de a página carregar: na 1.ª visita, a instalação competia pela rede com a app e com a foto do fundo
  const avSwPrecache=reg=>{try{
    const urls=performance.getEntriesByType('resource').map(r=>r.name).filter(u=>u.startsWith(location.origin)&&/\.(webp|woff2)$/.test(new URL(u).pathname));
    const w=reg.active||navigator.serviceWorker.controller;if(urls.length&&w)w.postMessage({type:'av-precache',urls});
  }catch(e){}};
  const avSwRegister=()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
    .then(()=>navigator.serviceWorker.ready).then(avSwPrecache).catch(()=>{});
  if(document.readyState==='complete')setTimeout(avSwRegister,800);
  else addEventListener('load',()=>setTimeout(avSwRegister,800),{once:true});
  const _origLockApp=lockApp;
  lockApp=function(){_origLockApp();if(window.__cvUpdateReady)setTimeout(()=>location.reload(),300);};
}

/* ═══════════════════ AURORA AI v2 — motor semântico local (PT/EN) ═══════════════════ */
/* Normaliza → extrai conceitos, entidades, campos e datas → decide → executa com as funções reais da app.
   Compreende português e inglês e responde na língua em que lhe escrevem. 100% local e offline. */
const AUR={last:null,pending:null,resume:null,acts:[],hist:[],hIdx:-1,lang:'pt'};
const AUR_PASS={pass:true};
const aurA=x=>Array.isArray(x)?x:[];
function aurL(pt,en){return AUR.lang==='en'?en:pt;}
function aurAppLang(){return typeof currentLang!=='undefined'&&currentLang==='en'?'en':'pt';}

/* ── texto ── */
function aurNorm(s){return (s==null?'':String(s)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[º°ª]/g,' ').replace(/\s+/g,' ').trim();}
function aurEsc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function aurCap(s){s=(s||'').trim();return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
function aurLev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;const d=[];for(let i=0;i<=m;i++)d[i]=[i];for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[m][n];}

const AUR_PHR=[
 [/-(me|nos|te|lhe)\b/g,' '],
 [/\b(dame|damos)\b/g,' da '],[/\bmostrame\b/g,' mostra '],[/\bdizme\b/g,' diz '],[/\blembrame\b/g,' lembra '],
 [/\bo que (sabes|consegues|podes) fazer\b|\bo que fazes\b|\bcomo funcionas\b|\bwhat (can|do) you do\b|\bhow do you work\b|\bwhat are your commands\b/g,' ajuda '],
 [/\bbo(m|a) (dia|tarde|noite)\b|\bgood (morning|afternoon|evening|night)\b/g,' ola '],
 [/\b(f2a|fa2|2 fa|2-fa|2af|dois fatores|2 fatores|duplo fator|two factor|two-factor|2 step|2-step|2step|two step|two-step|dois passos|mfa)\b/g,' 2fa '],
 [/\b(autenticacao|verificacao) (de |em )?2fa\b|\b2fa (authentication|verification)\b/g,' 2fa '],
 [/\b(password|palavra[ -]?passe|senha|chave) mestra\b|\bmaster (password|key|pass)\b/g,' passmestra '],
 [/\bpalavras?[ -]?passes?\b|\bpalavras?[ -]chaves?\b|\bpass ?codes?\b/g,' password '],
 [/\b(senhas?|passwords?|pass|pws?|pwd)\b/g,' password '],
 [/\bcartao (de |do )?cidadao\b|\b(citizen|citizenship|identity|id|national id|identification) cards?\b|\bnational id\b/g,' cartao cidadao '],
 [/\bcarta (de )?conducao\b|\b(driving|drivers?|driver s) licen[cs]es?\b/g,' carta conducao '],
 [/\bseguranca social\b|\bsocial security( number)?\b/g,' segsocial '],
 [/\b(numero|n|nr) (de |do )?utente\b|\bhealth (service |user )?(number|card)\b|\b(sns|patient) number\b/g,' utente '],
 [/\bcartao (de |do )?(credito|debito|multibanco|bancario|banco)\b|\b(credit|debit|bank|banking) cards?\b/g,' cartao bancario '],
 [/\bcartao (de |da )?(loja|fidelizacao|fidelidade|cliente|pontos|supermercado)\b|\b(store|loyalty|rewards?|club|shop|supermarket) cards?\b/g,' cartao loja '],
 [/\bponto (de|da) situacao\b|\bcomo esta o cofre\b|\bestado do cofre\b|\bcomo estou\b|\bstatus report\b|\bhow is my vault\b|\bvault status\b|\bhow am i doing\b/g,' resumo '],
 [/\bcopias? de seguranca\b|\bback ?ups?\b/g,' backup '],
 [/\bwi ?-?fi\b/g,' wifi '],
 [/\bcodigos? de barras\b|\bbar ?codes?\b/g,' barras '],
 [/\binformac(ao|oes)\b|\binformation\b/g,' info '],
 [/\bdados pessoais\b|\bpersonal (data|details)\b|\bmy details\b/g,' info pessoal '],
 [/\bmodo (de )?(privado|oculto|privacidade)\b|\b(privacy|private|incognito|hidden) mode\b/g,' privacidade '],
 [/\bheranca digital\b|\bkit de emergencia\b|\bdigital (legacy|inheritance)\b|\bemergency kit\b/g,' heranca '],
 [/\bpor do sol\b/g,' porsol '],[/\bmeia[ -]noite\b/g,' meianoite '],[/\bclassico claro\b|\bclassic light\b/g,' classico '],
 [/\bdatas? importantes?\b|\bimportant dates?\b/g,' datasimportantes '],
 [/\bauto[ -]?bloqueio\b|\bauto[ -]?lock\b/g,' autobloqueio '],[/\bimpressao digital\b|\bfingerprint\b|\bface ?id\b|\bbiometrics?\b/g,' biometria '],
 [/\bdepois de amanha\b|\bday after tomorrow\b/g,' depoisdeamanha '],
 [/\bhow many\b/g,' quantos '],[/\bhow much\b/g,' quanto '],
 [/\b(turn|switch) on\b/g,' ativa '],[/\b(turn|switch) off\b/g,' desativa '],
 [/\b(licen[cs]e|number|registration|car) plates?\b/g,' matricula '],
 [/\bemail address(es)?\b|\be-mail\b/g,' email '],
 [/\b(phone|mobile|cell) numbers?\b/g,' telemovel '],
 [/\bdate of birth\b|\bbirth ?date\b/g,' nascimento '],
 [/\btax (number|id|identification number|no|code)\b|\bvat number\b|\bfiscal number\b|\bnumero fiscal\b/g,' nif '],
 [/\bpass ?phrase\b/g,' frase '],
 [/\bbring back\b|\bget back\b|\bundo delete\b/g,' recupera '],
 [/\bsign ?in\b|\blog ?in\b/g,' login '],
 [/\brecycl(e|ing) bin\b/g,' reciclagem '],
 [/\bgo to\b|\btake me to\b/g,' abre '],
];
function aurCanon(s){let n=' '+aurNorm(s).replace(/[?!,;:()"“”«»\[\]{}’']/g,' ').replace(/\s+/g,' ')+' ';AUR_PHR.forEach(p=>{n=n.replace(p[0],p[1]);});return n.replace(/\s+/g,' ').trim();}

const AUR_STOP=new Set(('o a os as um uma uns umas de do da dos das no na nos nas ao aos e ou que me te se por para pra pro com em meu minha meus minhas teu tua seu sua este esta estes estas isto esse essa isso aquele aquela ai ali aqui la eu tu ele ela voce lhe qual quais quero queria preciso favor pf pff tenho tens ha sao era ola oi ok entao so mais ja ate tambem como onde quando quanto quantos quantas agora sobre pelo pela pelos pelas num numa dum duma sem mim etc tudo todo toda todos todas completo completa inteira cada '
 +'the an of to for in on at my your me i is are was were be been it its this that these those with and or please pls can could would should you do does did have has had get got from by as about any some what whats which s there here now just also want need show tell give mine im up all').split(' '));

/* ── vocabulário: palavra → conceitos (PT + EN) ── */
const AUR_VOCAB={};
function aurV(c,w){w.split(' ').forEach(x=>{if(x)(AUR_VOCAB[x]=AUR_VOCAB[x]||[]).push(c);});}
aurV('OPEN','abre abrir abra abras mostra mostrar mostre ver ve veja vai ir entra entrar leva levar exibe exibir consulta consultar visualiza open opens show view see display go goto visit');
aurV('GET','qual quais diz dizer dizes saber quero queria preciso precisava what which tell give get need want whats');
aurV('ADD','adiciona adicionar adicione acrescenta acrescentar cria criar crie regista registar registe guarda guardar guarde insere inserir mete meter poe coloca colocar novo nova novos novas add adds create make new save keep put insert register record');
aurV('CHANGE','renova muda mudar mude altera alterar altere troca trocar troque atualiza atualizar atualize edita editar edite redefine redefinir modifica modificar corrige corrigir substitui substituir change update edit modify rename replace reset set renew');
aurV('DELETE','apaga apagar apague elimina eliminar elimine remove remover remova exclui excluir tira tirar deleta delete erase discard');
aurV('COPY','copia copiar copie copy');
aurV('ARCHIVE','arquiva arquivar arquive archive');
aurV('RESTORE','recupera recuperar recupere restaura restaurar restaure repoe repor desarquiva desarquivar devolve restore recover undelete unarchive');
aurV('EMPTY','esvazia esvaziar esvazie limpa limpar limpe empty clear purge');
aurV('GEN','gera gerar gere inventa inventar sugere sugerir generate suggest');
aurV('APPLY','aplica aplicar aplique usa usar use apply switch');
aurV('ON','ativa ativar ative liga ligar ligue enable activate');
aurV('OFF','desativa desativar desative desliga desligar desligue disable deactivate');
aurV('SCHEDULE','agenda agendar agende lembra lembrar lembre lembrete lembretes marca marcar marque avisa avisar remind reminder reminders schedule alert notify');
aurV('EXPORT','exporta exportar exporte exportacao export');
aurV('SYNC','sincroniza sincronizar sincronize sincronizacao sync drive nuvem synchronize synchronise cloud');
aurV('SAVE','grava gravar grave salva salvar');
aurV('LOCK','bloqueia bloquear bloqueie tranca trancar lock');
aurV('CLOSE','fecha fechar feche sai sair close exit quit');
aurV('FIND','procura procurar procure pesquisa pesquisar encontra encontrar encontre localiza localizar onde find search look locate where');
aurV('COUNT','quantos quantas');
aurV('LIST','lista listar enumera enumerar list');
aurV('HOWMUCH','quanto');
aurV('WHEN','quando when');
aurV('HELP','ajuda ajudar help comandos instrucoes commands');
aurV('HELLO','ola oi hey hello hi hiya');
aurV('THANKS','obrigado obrigada obg brigado brigada valeu thanks agradecido thank thx cheers ty');
aurV('MOD_STRONG','forte fortes segura seguras robusta aleatoria complexa strong secure random complex robust');
aurV('MOD_MEM','memoravel memoraveis decorar facil faceis frase memorable easy remember simple');
aurV('NUM','numero numeros nr num number numbers');
aurV('ALL','completa completo tudo toda todo todos todas etc inteira inteiro everything full complete entire whole');
aurV('MINE','meu minha meus minhas eu mim my');
aurV('MOD_LIGHT','claro clara claros light bright');aurV('MOD_DARK','escuro escura escuros dark');
aurV('D_PW','password');
aurV('D_VAULT','acesso acessos conta contas login logins entrada entradas credencial credenciais cofre account accounts entry entries credential credentials vault access');
aurV('D_EMAIL','email mail utilizador user username emails usernames');
aurV('D_2FA','2fa otp autenticador authenticator token tokens totp');
aurV('D_2FAW','codigo codigos code codes');
aurV('D_CARD','cartao cartoes card cards');
aurV('D_BANK','bancario bancarios credito debito visa mastercard multibanco banco bancos bank banks banking credit debit');
aurV('D_STORE','loja lojas fidelizacao fidelidade pontos barras supermercado store stores shop shops loyalty rewards points supermarket');
aurV('D_DOC','documento documentos doc docs digitalizacao scan document documents');
aurV('D_NOTE','nota notas apontamento apontamentos note notes memo memos');
aurV('D_INFO','info pessoal pessoais identificacao personal details identity profile');
aurV('D_FIELD','nif contribuinte iban nib utente sns segsocial niss matricula passaporte socio tin passport');
aurV('D_WARRANTY','garantia garantias fatura faturas recibo recibos warranty warranties receipt receipts invoice invoices guarantee');
aurV('D_VEHICLE','veiculo veiculos carro carros mota motas viatura vehicle vehicles car cars motorbike motorcycle');
aurV('D_LICENSE','licenca licencas software license licence licenses licences');
aurV('D_ASSETS','bens assets belongings possessions');
aurV('D_DATES','datasimportantes aniversario aniversarios birthday birthdays anniversary anniversaries');
aurV('D_SUBS','subscricao subscricoes assinatura assinaturas mensalidade mensalidades streaming subscription subscriptions subs membership memberships');
aurV('D_WIFI','wifi rede redes router network networks');
aurV('D_CAL','calendario eventos calendar events agenda');
aurV('D_THEME','tema temas aspeto aparencia cores cor fundo visual theme themes appearance colors colours color colour skin');
aurV('D_SETTINGS','definicoes definicao ajustes configuracoes configuracao settings opcoes preferencias preferences options configuration config');
aurV('D_SEC','seguranca security');
aurV('D_MASTER','passmestra pin biometria autobloqueio');
aurV('D_TRASH','reciclagem lixo lixeira papeleira apagados apagadas eliminados eliminadas trash bin recycle deleted');
aurV('D_ARCHIVE','arquivo arquivados arquivadas archive archived');
aurV('D_DASH','dashboard inicio painel home homepage');
aurV('D_BACKUP','backup backups');
aurV('D_PRIV','privacidade privado oculto ocultar esconder privacy private hide hidden');
aurV('D_HERITAGE','heranca testamento legacy inheritance');
aurV('D_LANG','idioma lingua ingles english portugues language portuguese');
aurV('D_EXPIRY','expirou caducou venceu renova renovam expira expiram expirar expirado expirados expirada expiradas caduca caducam caducar caducado caducados vence vencem vencer vencido vencidos validade validades renovar renovacao renovacoes termina terminam acaba acabam expire expires expiring expired expiry expiration renew renews renewal renewals due validity valid lapse lapses');
aurV('D_AUDIT','fracas fraca repetidas repetida duplicadas reutilizadas antigas vulneraveis auditoria auditar pontuacao score health weak reused repeated duplicate duplicates duplicated old audit vulnerable breached compromised');
aurV('D_SUMMARY','resumo situacao panorama summary overview status');
aurV('D_FUEL','consumo combustivel gasolina gasoleo diesel litros abastecimento abastecimentos abastecer quilometros fuel consumption gas petrol mileage litres liters refuel refuels refueling refuelling mpg');
aurV('D_MONEY','gasto gastos gasta gastas gastar custo custos custa pago pagas pagar despesa despesas dinheiro spend spending spent cost costs pay paying paid expense expenses money');
aurV('D_FILE','ficheiro ficheiros file files');
aurV('D_PDF','pdf');aurV('D_CSV','csv excel spreadsheet');
const AUR_ACTIONS=new Set(['LIST','OPEN','GET','ADD','CHANGE','DELETE','COPY','ARCHIVE','RESTORE','EMPTY','GEN','APPLY','ON','OFF','SCHEDULE','EXPORT','SYNC','SAVE','LOCK','CLOSE','FIND','COUNT','HOWMUCH','WHEN']);
const AUR_VKEYS=Object.keys(AUR_VOCAB).filter(k=>k.length>=5);
const AUR_RISKY=new Set(['LOCK','CLOSE','EMPTY','DELETE','ARCHIVE','SAVE','SYNC','EXPORT']);
function aurAffinity(a,b){let p=0;while(p<a.length&&p<b.length&&a[p]===b[p])p++;let q=0;while(q<a.length-p&&q<b.length-p&&a[a.length-1-q]===b[b.length-1-q])q++;return p+q;}
function aurFuzzyVocab(t){
  let safe=null,sd=99,risky=null,rd=99;const tol=t.length>=8?2:1;
  for(const k of AUR_VKEYS){if(Math.abs(k.length-t.length)>2)continue;const d=aurLev(t,k);if(d>tol)continue;
    const sc=d*10-aurAffinity(t,k);const isR=AUR_VOCAB[k].some(x=>AUR_RISKY.has(x));
    if(isR){if(sc<rd){rd=sc;risky=k;}}else if(sc<sd){sd=sc;safe=k;}}
  return {safe:safe?AUR_VOCAB[safe]:null,risky:(risky&&(!safe||rd<sd))?risky:null};
}

/* ── deteção da língua de cada mensagem ── */
const AUR_EN_W=new Set('what whats which show open my the please give tell how when where is are do does have has add create delete remove change update edit copy find search list expire expires expiring expired expiry renew renews card cards document documents note notes settings theme themes lock save generate strong account accounts spend spending cost month week year today tomorrow next this last number details tax phone address remind reminder schedule calendar help hello hi thanks thank you your can could of to for in with and from it that me i get set turn off on dark light subscriptions subscription warranty car fuel trash archive restore empty rename vault code codes any weak many much new make want need yes yeah yep sure nope cancel'.split(' '));
const AUR_PT_W=new Set('o os as um uma que qual quais meu minha meus minhas abre mostra diz quanto quantos quantas quando onde adiciona cria apaga muda altera copia procura lista expira expiram renova cartao cartoes documento documentos nota notas definicoes tema temas bloqueia grava gera forte conta contas gasto gasta mes semana ano hoje amanha proximo proxima este esta numero morada telemovel lembra lembra-me calendario ajuda ola obrigado obrigada de do da dos das para com no na em e por favor tenho tens codigo codigos subscricoes subscricao garantia carro combustivel reciclagem arquivo recupera esvazia cofre sim nao gera dame mostra-me tudo toda todos qualquer'.split(' '));
function aurDetectLang(raw,skip){
  const t=aurNorm(raw).replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(Boolean);
  let en=0,pt=0;t.forEach(w=>{if(skip&&skip.has(w))return;if(AUR_EN_W.has(w))en++;if(AUR_PT_W.has(w))pt++;});
  if(en>pt)return 'en';if(pt>en)return 'pt';return null;
}

/* ── campos da aba Info (PT/EN) ── */
const AUR_FIELDS=[
 {k:'nif',label:'NIF',labelEn:'Tax number (NIF)',q:/\b(nif|contribuinte|tin)\b/,l:/\bnif\b|contribuinte|fiscal|tax/,rk:/\b(?:nif|n[uú]mero de contribuinte|contribuinte|tax (?:number|id)|tin|vat number)\b/i},
 {k:'valcc',label:'Validade do CC',labelEn:'ID card expiry',q:/validade (do |da )?(cc|cartao cidadao)|(cc|cartao cidadao) (expiry|expiration)|expiry (date )?of (my |the )?(cc|cartao cidadao)/,l:/validade|expiry/,rk:/(?:validade (?:do |da )?(?:cc|cart[aã]o (?:de )?cidad[aã]o)|(?:id card|cc) expiry)/i},
 {k:'cc',label:'Cartão de Cidadão',labelEn:'Citizen card',q:/\b(cc|bi)\b|cartao cidadao|\bidentidade\b/,l:/cartao cidadao|\bcc\b|identidade|id card|citizen|\bbi\b/,rk:/\b(?:cc|bi|cart[aã]o (?:de |do )?cidad[aã]o|citizen card|id card|identity card)\b/i},
 {k:'ss',label:'Nº Segurança Social',labelEn:'Social security no.',q:/\b(segsocial|niss)\b/,l:/segsocial|niss|social security/,rk:/(?:seguran[cç]a social|niss|social security(?: number)?)/i},
 {k:'utente',label:'Nº de Utente (SNS)',labelEn:'Health number (SNS)',q:/\b(utente|sns)\b/,l:/utente|sns|health/,rk:/(?:utente(?: \(sns\))?|\bsns\b|health (?:number|card))/i},
 {k:'carta',label:'Carta de Condução',labelEn:'Driving licence',q:/carta conducao/,l:/carta conducao|driving|driver/,rk:/(?:carta (?:de )?condu[cç][aã]o|driving licen[cs]e|driver'?s licen[cs]e)/i},
 {k:'iban',label:'IBAN',labelEn:'IBAN',q:/\biban\b/,l:/\biban\b/,rk:/\biban\b/i},
 {k:'nib',label:'NIB',labelEn:'NIB',q:/\bnib\b/,l:/\bnib\b|bank n/,rk:/\bnib\b/i},
 {k:'matricula',label:'Matrícula',labelEn:'Licence plate',q:/\bmatricula\b/,l:/matricula|plate/,rk:/(?:matr[ií]cula|(?:licen[cs]e |number |car )?plate)/i},
 {k:'passaporte',label:'Passaporte',labelEn:'Passport',q:/\b(passaporte|passport)\b/,l:/passaporte|passport/,rk:/(?:passaporte|passport)/i},
 {k:'socio',label:'Nº de Sócio',labelEn:'Membership no.',q:/\bsocio\b|member(ship)? number/,l:/socio|member/,rk:/(?:s[oó]cio|member(?:ship)? number)/i},
 {k:'tel',label:'Telemóvel',labelEn:'Phone',q:/\b(telefone|telemovel|contacto|phone|mobile|telephone)\b/,l:/telefone|telemovel|phone|contacto|mobile/,rk:/(?:telem[oó]vel|telefone|contacto|phone(?: number)?|mobile(?: number)?)/i},
 {k:'morada',label:'Morada',labelEn:'Address',q:/\b(morada|endereco|address)\b/,l:/morada|endereco|address/,rk:/(?:morada|endere[cç]o|address)/i},
 {k:'nasc',label:'Data de nascimento',labelEn:'Date of birth',q:/\bnascimento\b|\bdob\b/,l:/nascimento|birth/,rk:/(?:data de nascimento|nascimento|date of birth|birth ?date)/i},
];
const AUR_ALIAS={'cartao cidadao':['cc','bi'],'carta conducao':['carta']};
const AUR_THEME_EN={aurora:['aurora'],meianoite:['midnight'],floresta:['forest'],oceano:['ocean'],porsol:['sunset'],rubi:['ruby'],ametista:['amethyst'],esmeralda:['emerald'],classico:['classic'],papel:['paper'],menta:['mint'],ceu:['sky']};

/* ── rótulos (na língua da conversa) ── */
const AUR_TYPE_MAP={vault:['acesso','account'],doc:['documento','document'],bank:['cartão bancário','bank card'],store:['cartão de loja','store card'],totp:['código 2FA','2FA code'],wifi:['Wi-Fi','Wi-Fi'],note:['nota','note'],asset:['bem','asset'],sub:['subscrição','subscription'],person:['pessoa','person'],theme:['tema','theme']};
function aurTypeLbl(t){const m=AUR_TYPE_MAP[t];return m?aurL(m[0],m[1]):'';}
const AUR_ASSET_MAP={warranty:['garantia','warranty'],license:['licença','licence'],vehicle:['veículo','vehicle'],dates:['data importante','important date']};
function aurAssetLbl(k){const m=AUR_ASSET_MAP[k];return m?aurL(m[0],m[1]):'';}
const AUR_TAB_MAP={dashboard:['o Dashboard','the Dashboard'],vault:['as Passwords','Passwords'],totp:['os códigos 2FA','2FA codes'],cards:['os Cartões bancários','Bank cards'],store:['os Cartões de loja','Store cards'],docs:['os Documentos','Documents'],notes:['as Notas','Notes'],info:['a Informação Pessoal','Personal info'],archive:['o Arquivo','the Archive'],trash:['a Reciclagem','the Trash'],warranty:['as Garantias','Warranties'],license:['as Licenças','Licences'],vehicle:['os Veículos','Vehicles'],dates:['as Datas importantes','Important dates']};
const AUR_TAB_SHORT={dashboard:['Dashboard','Dashboard'],vault:['Passwords','Passwords'],totp:['2FA','2FA'],cards:['Cartões','Cards'],store:['Cartões de loja','Store cards'],docs:['Documentos','Documents'],notes:['Notas','Notes'],info:['Info','Info'],archive:['Arquivo','Archive'],trash:['Reciclagem','Trash'],warranty:['Garantias','Warranties'],license:['Licenças','Licences'],vehicle:['Veículos','Vehicles'],dates:['Datas','Dates']};
function aurTabLbl(t){const m=AUR_TAB_MAP[t];return m?aurL(m[0],m[1]):t;}
function aurTabShort(t){const m=AUR_TAB_SHORT[t];return m?aurL(m[0],m[1]):t;}
const AUR_EV_ICON={renew:'🔁',doc:'📄',card:'💳',warranty:'🧾',license:'🔑',vehicle:'🚗',date:'📅'};

/* ── datas e dinheiro ── */
function aurToday(){const d=new Date();d.setHours(0,0,0,0);return d;}
function aurAddDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function aurAddMonths(d,n){const x=new Date(d);x.setMonth(x.getMonth()+n);return x;}
function aurDate(d){return new Date(d).toLocaleDateString(AUR.lang==='en'?'en-GB':'pt-PT');}
function aurRel(d){const x=new Date(d);x.setHours(0,0,0,0);const n=Math.round((x-aurToday())/864e5);
  if(AUR.lang==='en')return n===0?'today':n===1?'tomorrow':n===-1?'yesterday':n>0?'in '+n+' days':(-n)+' days ago';
  return n===0?'hoje':n===1?'amanhã':n===-1?'ontem':n>0?'em '+n+' dias':'há '+(-n)+' dias';}
function aurMoney(v){v=+v||0;return typeof fmtMoney==='function'?fmtMoney(v):v.toFixed(2)+' €';}
function aurIsDate(d){return Object.prototype.toString.call(d)==='[object Date]'&&!isNaN(d);}
const AUR_NUMW={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,quinze:15,vinte:20,trinta:30,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30};
function aurNumWords(n){return n.replace(/\ba (day|week|month|year)\b/g,'1 $1').replace(/\b(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte|trinta|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)\b(?=\s+(dia|dias|semana|semanas|mes|meses|ano|anos|day|days|week|weeks|month|months|year|years)\b)/g,m=>String(AUR_NUMW[m]));}
function aurPeriod(n0){
  const n=aurNumWords(n0),h=aurToday();let m;
  const mk=(from,to,pt,en,ex,past)=>({from,to,label:aurL(pt,en),explicit:ex!==false,past:!!past});
  if(/\b(expirados|expiradas|caducados|vencidos|passados|expirou|caducou|venceu|expiraram|caducaram|expired|lapsed|overdue)\b|\bja (expir|caduc|venc)|\bpast due\b/.test(n))return mk(aurAddDays(h,-365),aurAddDays(h,-1),'no último ano','in the last year',true,true);
  if(/\b(hoje|today)\b/.test(n))return mk(h,h,'hoje','today');
  if(/\b(amanha|tomorrow)\b/.test(n)){const d=aurAddDays(h,1);return mk(d,d,'amanhã','tomorrow');}
  if(/\b(este|neste|deste) mes\b|\bthis month\b/.test(n))return mk(h,new Date(h.getFullYear(),h.getMonth()+1,0),'este mês','this month');
  if(/\b(proximo mes|mes que vem|next month)\b/.test(n))return mk(new Date(h.getFullYear(),h.getMonth()+1,1),new Date(h.getFullYear(),h.getMonth()+2,0),'no próximo mês','next month');
  if(/\b(esta|nesta) semana\b|\bthis week\b/.test(n)){const d=aurAddDays(h,(7-h.getDay())%7);return mk(h,d,'esta semana','this week');}
  if(/\b(proxima semana|semana que vem|next week)\b/.test(n))return mk(h,aurAddDays(h,14),'nas próximas 2 semanas','in the next 2 weeks');
  if(/\b(este|neste) ano\b|\bthis year\b/.test(n))return mk(h,new Date(h.getFullYear(),11,31),'este ano','this year');
  if((m=n.match(/(\d+)\s*(dia|dias|day|days)\b/)))return mk(h,aurAddDays(h,+m[1]),'nos próximos '+m[1]+' dias','in the next '+m[1]+' days');
  if((m=n.match(/(\d+)\s*(semana|semanas|week|weeks)\b/)))return mk(h,aurAddDays(h,+m[1]*7),'nas próximas '+m[1]+' semanas','in the next '+m[1]+' weeks');
  if((m=n.match(/(\d+)\s*(mes|meses|month|months)\b/)))return mk(h,aurAddMonths(h,+m[1]),+m[1]===1?'no próximo mês':'nos próximos '+m[1]+' meses',+m[1]===1?'in the next month':'in the next '+m[1]+' months');
  if((m=n.match(/(\d+)\s*(ano|anos|year|years)\b/)))return mk(h,aurAddMonths(h,+m[1]*12),+m[1]===1?'no próximo ano':'nos próximos '+m[1]+' anos',+m[1]===1?'in the next year':'in the next '+m[1]+' years');
  if(/\bproximos meses\b|\b(coming|next few|upcoming) months\b/.test(n))return mk(h,aurAddMonths(h,3),'nos próximos 3 meses','in the next 3 months');
  return mk(h,aurAddMonths(h,3),'nos próximos 3 meses','in the next 3 months',false);
}
const AUR_MESES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const AUR_MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
const AUR_MON3=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const AUR_DIAS=['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
const AUR_DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
function aurMonthIdx(w){w=(w||'').replace(/\.$/,'');let i=AUR_MESES.indexOf(w);if(i<0)i=AUR_MONTHS.indexOf(w);if(i<0)i=AUR_MON3.indexOf(w.slice(0,3));if(w==='sept')i=8;return i;}
function aurMkDate(y,mo,d,t,explicitYear){if(mo<0||mo>11||d<1||d>31)return null;let dt=new Date(y,mo,d);if(dt.getMonth()!==mo)return null;if(!explicitYear&&dt<t)dt=new Date(y+1,mo,d);return dt;}
function aurParseDate(n0){
  const n=aurNumWords(n0),t=aurToday();let m;
  const MON='(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)';
  if((m=n.match(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\b/))){let y=m[3]?+m[3]:t.getFullYear();if(y<100)y+=2000;return aurMkDate(y,+m[2]-1,+m[1],t,!!m[3]);}
  if((m=n.match(new RegExp('\\b(?:dia\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:de\\s+|of\\s+)?'+MON+'(?:\\s+(?:de\\s+)?(\\d{4}))?\\b'))))return aurMkDate(m[3]?+m[3]:t.getFullYear(),aurMonthIdx(m[2]),+m[1],t,!!m[3]);
  if((m=n.match(new RegExp('\\b'+MON+'\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b'))))return aurMkDate(m[3]?+m[3]:t.getFullYear(),aurMonthIdx(m[1]),+m[2],t,!!m[3]);
  if(/\bdepoisdeamanha\b/.test(n))return aurAddDays(t,2);
  if(/\b(amanha|tomorrow)\b/.test(n))return aurAddDays(t,1);
  if(/\b(hoje|today)\b/.test(n))return t;
  if((m=n.match(/\b(?:daqui a|dentro de|in|within)\s+(\d+)\s+(dia|dias|semana|semanas|mes|meses|ano|anos|day|days|week|weeks|month|months|year|years)\b/))){const k=+m[1],u=m[2];return /^(dia|day)/.test(u)?aurAddDays(t,k):/^(semana|week)/.test(u)?aurAddDays(t,k*7):/^(mes|month)/.test(u)?aurAddMonths(t,k):aurAddMonths(t,k*12);}
  if((m=n.match(/\b(?:proxima|proximo|na|no|esta|este|next|this|on)?\s*(domingo|segunda|terca|quarta|quinta|sexta|sabado|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/))){let wd=AUR_DIAS.indexOf(m[1]);if(wd<0)wd=AUR_DAYS.indexOf(m[1]);let k=(wd-t.getDay()+7)%7;if(k===0)k=7;return aurAddDays(t,k);}
  if((m=n.match(/\b(?:dia|on the|the)\s+(\d{1,2})(?:st|nd|rd|th)?\b/))){let dt=new Date(t.getFullYear(),t.getMonth(),+m[1]);if(dt<t)dt=new Date(t.getFullYear(),t.getMonth()+1,+m[1]);return dt;}
  return null;
}
function aurReason(raw){
  const MONR='(?:janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)';
  let r=' '+raw+' ';
  r=r.replace(/\b\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?\b/g,' ');
  r=r.replace(new RegExp('\\b(?:(?:no|ao|a|o|on|the|on the)\\s+)?(?:dia\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:de\\s+|of\\s+)?'+MONR+'(?:\\s+(?:de\\s+)?\\d{4})?','gi'),' ');
  r=r.replace(new RegExp('\\b(?:on\\s+)?'+MONR+'\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?','gi'),' ');
  r=r.replace(/\b(depois de amanh[aã]|day after tomorrow|amanh[aã]|tomorrow|hoje|today)\b/gi,' ');
  r=r.replace(/\b(?:daqui a|dentro de|in|within)\s+\S+\s+(?:dias?|semanas?|m[eê]s(?:es)?|anos?|days?|weeks?|months?|years?)\b/gi,' ');
  r=r.replace(/\b(?:na |no |esta |este |pr[oó]xim[ao] |next |this |on )?(?:domingo|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:-feira)?\b/gi,' ');
  r=r.replace(/\b(?:no |ao |on the )?dia\s+\d{1,2}\b|\bon the \d{1,2}(?:st|nd|rd|th)?\b/gi,' ');
  r=r.replace(/\b(todos os anos|anualmente|cada ano|repete|every year|yearly|annually)\b/gi,' ');
  r=r.replace(/\b(?:no|ao|na)\s+calend[aá]rio\b|\b(?:on|to|in)\s+(?:the\s+|my\s+)?calendar\b/gi,' ');
  r=r.replace(/^\s*(?:aurora[,:]?\s+)?(?:por favor\s+|please\s+)?(?:lembra(?:[- ]?me)?|lembrar|avisa(?:[- ]?me)?|agenda(?:r)?|marca(?:r)?|cria(?:r)?\s+(?:um\s+)?lembrete|adiciona(?:r)?|coloca(?:r)?|p[oõ]e|mete|remind(?:\s+me)?|set\s+(?:a\s+)?reminder|schedule|add(?:\s+a)?(?:\s+reminder)?|put|create\s+(?:a\s+)?reminder)\b/i,' ');
  r=r.replace(/\b(?:um|uma)\s+(?:lembrete|evento|data)\b|\b(?:a|an)\s+(?:reminder|event|date)\b/gi,' ');
  r=r.replace(/\s+/g,' ').trim();
  for(let k=0;k<4;k++){r=r.replace(/^(de|da|do|das|dos|que|para|a|o|um|uma|no|na|dia|em|to|about|of|for|the|an|on|at|that|:|-)\s+/i,'').replace(/\s+(a|no|na|dia|em|para|de|do|da|as|às|on|at|for|the|in|by)$/i,'').trim();}
  r=r.replace(/[.,;:!?]+$/,'').trim();
  return aurCap(r);
}

/* ── índice de entidades de TODO o cofre ── */
function aurSig(n){return n.split(' ').map(t=>t.replace(/^[.\-]+|[.\-]+$/g,'')).filter(t=>t&&!AUR_STOP.has(t));}
function aurIndex(){
  const E=[];
  const add=(type,obj,name,extra,more)=>{if(!name)return;const nn=aurCanon(name);const toks=aurSig(nn);if(!toks.length)return;let alias=[];Object.keys(AUR_ALIAS).forEach(k=>{if(nn.indexOf(k)>=0)alias=alias.concat(AUR_ALIAS[k]);});if(more)alias=alias.concat(more);E.push({type,obj,name:String(name).trim(),norm:nn,toks,alias,extra:aurNorm(extra||''),archived:!!(obj&&obj.archived)});};
  try{aurA(typeof vault!=='undefined'?vault:[]).forEach(v=>add('vault',v,v.name,[v.user,v.url].join(' ')));}catch(e){}
  try{aurA(typeof documents!=='undefined'?documents:[]).forEach(d=>add('doc',d,d.title||d.name));}catch(e){}
  try{aurA(typeof bankCards!=='undefined'?bankCards:[]).forEach(c=>add('bank',c,c.name||c.bank||c.title,c.bank));}catch(e){}
  try{aurA(typeof storeCards!=='undefined'?storeCards:[]).forEach(s=>add('store',s,s.name||s.store));}catch(e){}
  try{aurA(typeof totp!=='undefined'?totp:[]).forEach(t=>add('totp',t,t.name||t.issuer||t.label,t.issuer));}catch(e){}
  try{aurA(typeof wifiNets!=='undefined'?wifiNets:[]).forEach(w=>add('wifi',w,w.name||w.ssid,w.ssid));}catch(e){}
  try{aurA(typeof notes!=='undefined'?notes:[]).forEach(n=>add('note',n,n.title));}catch(e){}
  try{aurA(typeof assets!=='undefined'?assets:[]).forEach(a=>add('asset',a,a.name,a.plate));}catch(e){}
  try{aurA(typeof subscriptions!=='undefined'?subscriptions:[]).forEach(s=>add('sub',s,s.name));}catch(e){}
  try{aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>{if(p&&Array.isArray(p.fields))add('person',p,p.name);});}catch(e){}
  try{aurA(typeof THEME_PRESETS!=='undefined'?THEME_PRESETS:[]).forEach(t=>add('theme',t,t.name,'',AUR_THEME_EN[t.id]||[]));}catch(e){}
  return E;
}
function aurMatchEnt(e,Q,Qset){
  if(!e.toks.length)return 0;
  let got=0,total=0,spec=0;
  e.toks.forEach(t=>{
    const w=AUR_VOCAB[t]?0.35:1;total+=w;
    let hit=Qset.has(t);
    if(!hit&&t.length>=4){for(const q of Q){if(q.length>=4&&Math.abs(q.length-t.length)<=2&&aurLev(q,t)<=(t.length>=8?2:1)){hit=true;break;}}}
    if(!hit&&t.length>=5){for(const q of Q){if(q.length>=4&&t.startsWith(q)){hit=true;break;}}}
    if(hit){got+=w;if(w===1)spec++;}
  });
  let s=got/total;
  if(!spec&&s<1)s=0;
  if(s>0&&(' '+Q.join(' ')+' ').indexOf(' '+e.toks.join(' ')+' ')>=0)s+=0.2;
  if(e.alias&&e.alias.some(a=>Qset.has(a)))s=Math.max(s,0.95);
  return s;
}

/* ── frame: compreensão do pedido ── */
function aurFrame(raw){
  const r=(raw||'').trim().replace(/^\s*aurora\s*[,:!\-]?\s+/i,'');
  const n=aurCanon(r);
  const toks=n.split(' ').map(t=>t.replace(/^[.\-]+|[.\-]+$/g,'')).filter(Boolean);
  const E=aurIndex();
  const entTok=new Set();E.forEach(e=>e.toks.forEach(t=>entTok.add(t)));
  const c=new Set(),conceptTok=new Set();let suggest=null;
  toks.forEach((t,i)=>{
    if(t==='da'){if(i===0)c.add('GET');return;}
    let v=AUR_VOCAB[t];
    if(!v&&t.length>=5&&!entTok.has(t)&&!/\d/.test(t)){const fz=aurFuzzyVocab(t);v=fz.safe;if(fz.risky&&!suggest)suggest={from:t,to:fz.risky};}
    if(v){v.forEach(x=>c.add(x));conceptTok.add(t);}
  });
  const saveW=/\b(guarda|guardar|guarde|save|keep)\b/.test(n);
  const fileW=/\b(ficheiro|cofre|alteracoes|tudo|isto|agora|file|vault|changes|everything|now|it|all)\b/.test(n);
  const otherDom=[...c].some(k=>k.indexOf('D_')===0&&k!=='D_FILE'&&k!=='D_VAULT');
  if(c.has('ADD')&&saveW&&!c.has('D_PW')&&!c.has('D_EMAIL')&&(fileW||!otherDom)&&!/@/.test(r)&&!/[A-Z].*\d|\d.*[A-Z]/.test(r.replace(/^\S+/,''))){c.delete('ADD');c.add('SAVE');}
  if(c.has('CLOSE')&&(c.has('D_VAULT')||/\bapp\b/.test(n))){c.delete('CLOSE');c.add('LOCK');}
  let fields=AUR_FIELDS.filter(f=>f.q.test(' '+n+' '));
  if(fields.some(f=>f.k==='valcc'))fields=fields.filter(f=>f.k!=='cc');
  if(fields.some(f=>f.k==='cc'||f.k==='carta'))c.delete('D_CARD');
  if(c.has('D_SEC')&&!c.has('OPEN')&&!c.has('D_SETTINGS')&&!c.has('D_MASTER'))c.add('D_AUDIT');
  const Q=toks.filter(t=>!AUR_STOP.has(t));
  const Qset=new Set(Q);
  const allowTheme=c.has('D_THEME')||c.has('APPLY');
  let cands=E.filter(e=>e.type!=='theme'||allowTheme).map(e=>Object.assign({},e,{score:aurMatchEnt(e,Q,Qset)})).filter(e=>e.score>=0.34);
  cands.forEach(e=>{const d={vault:['D_PW','D_VAULT','D_EMAIL'],doc:['D_DOC'],bank:['D_BANK','D_CARD'],store:['D_STORE','D_CARD'],totp:['D_2FA','D_2FAW'],wifi:['D_WIFI'],note:['D_NOTE'],asset:['D_WARRANTY','D_VEHICLE','D_LICENSE','D_DATES','D_ASSETS'],sub:['D_SUBS','D_MONEY'],person:['D_INFO','D_FIELD'],theme:['D_THEME']}[e.type];if(d&&d.some(x=>c.has(x)))e.score+=0.15;if(e.archived)e.score-=0.05;});
  cands.sort((a,b)=>b.score-a.score);
  const best=cands[0]||null,second=cands[1]||null;
  const confident=!!best&&best.score>=0.5&&(!second||best.score-second.score>=0.15);
  const persons=cands.filter(e=>e.type==='person'&&e.score>=0.5);
  const labelHits=[];
  aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>aurA(p&&p.fields).forEach(f=>{const lt=aurSig(aurCanon(f.label||'')).filter(t=>t.length>=4&&!AUR_VOCAB[t]);if(lt.length&&lt.every(t=>Qset.has(t)))labelHits.push(f);}));
  const terms=Q.filter(t=>!conceptTok.has(t)&&!/^\d{1,2}$/.test(t));
  let stab='';
  if(c.has('D_THEME'))stab='aspeto';else if(c.has('D_SEC')||c.has('D_MASTER'))stab='seguranca';else if(c.has('D_BACKUP')||c.has('EXPORT')||/\b(dados|importar|importacao|data|import)\b/.test(n))stab='dados';else if(c.has('D_HERITAGE'))stab='heranca';else if(/\b(sobre|versao|about|version)\b/.test(n))stab='sobre';
  const hasAction=[...c].some(x=>AUR_ACTIONS.has(x));
  const hasDomain=[...c].some(x=>x.indexOf('D_')===0);
  const yes=/^(sim|s|siga|confirmo|confirma|confirmar|ok|okay|okey|pode|podes|pode ser|avanca|avancar|claro|isso|exato|certo|faz|faz isso|sim por favor|yes|y|yeah|yep|yup|sure|confirm|confirmed|do it|go ahead|go|please do|correct|right|bora|vamos|vai|confirmado)$/.test(n);
  const no=/^(nao|n|cancela|cancelar|esquece|deixa|deixa estar|nao obrigado|para|stop|no|nope|nah|cancel|never mind|nevermind|forget it|dont|nada)$/.test(n);
  return {raw:r,n,toks,Q,Qset,c,fields,cands,best,confident,persons,labelHits,terms,stab,hasAction,hasDomain,yes,no,date:null,suggest};
}

/* ── saída ── */
AUR.out=function(h,cls){if(typeof document==='undefined')return null;const m=document.getElementById('aurora-msgs');if(!m)return null;const pn=document.getElementById('aurora-panel');if(pn&&pn.classList.contains('min')&&/ai/.test(cls))pn.classList.add('has-new');const d=document.createElement('div');d.className='aurora-msg '+cls;d.innerHTML=h;m.appendChild(d);m.scrollTop=m.scrollHeight;return d;};
function aurSay(html,chips,cls){
  const list=(chips||[]).filter(Boolean);let h=html;
  if(list.length){if(AUR.acts.length>3000)AUR.acts=[];h+='<div class="a-chips">'+list.map(ch=>{const i=AUR.acts.push(ch.fn)-1;return '<span class="a-btn'+(ch.danger?' danger':'')+'" data-act="aurAct" data-args="['+i+']">'+aurEsc(ch.label)+'</span>';}).join('')+'</div>';}
  AUR.out(h,cls||'ai');return true;
}
function aurAct(i){const f=AUR.acts[i];if(typeof f==='function'){try{f();}catch(e){aurSay(aurL('Não consegui concluir essa ação (','I couldn’t complete that action (')+aurEsc(e.message)+').');}}}
// Barra da Aurora à vista? Um observador diz quando entra/sai do ecrã (antes media a posição a cada frame do scroll, o que obrigava a recalcular o layout)
let _aurLaunchEl=null,_aurLaunchVis=false,_aurIO=null;
function aurLaunchVisible(){
  const l=document.querySelector('.aur-launch');
  if(l!==_aurLaunchEl){
    if(_aurIO)_aurIO.disconnect();_aurLaunchEl=l;_aurLaunchVis=false;
    if(l&&typeof IntersectionObserver!=='undefined'){_aurIO=new IntersectionObserver(es=>{_aurLaunchVis=es[es.length-1].isIntersecting;aurFab();},{rootMargin:'-40px 0px -40px 0px'});_aurIO.observe(l);}
  }
  return _aurLaunchVis;
}
function aurIsMobile(){return typeof window!=='undefined'&&!!window.matchMedia&&window.matchMedia('(max-width:760px)').matches;}
function aurFab(){if(typeof document==='undefined')return;const f=document.getElementById('aurora-fab'),p=document.getElementById('aurora-panel');if(!f)return;const on=typeof masterKey!=='undefined'&&!!masterKey;const lv=aurLaunchVisible();f.style.display=on&&!(p&&p.classList.contains('open'))&&!lv?'flex':'none';}
function aurClose(force){
  if(typeof document==='undefined')return;const p=document.getElementById('aurora-panel');if(!p)return;
  if(force){p.classList.remove('open','min','has-new');document.body.classList.remove('aur-docked');aurFab();return;}
  if(aurIsMobile()&&p.classList.contains('open'))p.classList.add('min');
}
function aurTab(t){if(typeof switchTab==='function')switchTab(t);}
function aurGoTab(t){aurTab(t);aurClose();return aurSay(aurL('Abri ','Opened ')+aurTabLbl(t)+'.');}
function aurCopy(txt,msg){if(txt==null||txt==='')return false;if(typeof copyText==='function')copyText(String(txt),msg||aurL('Copiado ✓','Copied ✓'));else if(typeof navigator!=='undefined'&&navigator.clipboard)navigator.clipboard.writeText(String(txt));return true;}
function aurDirty(){if(typeof renderAll==='function')renderAll();if(typeof markUnsaved==='function')markUnsaved();}
function aurLog(t,n,i){if(typeof logActivity==='function')logActivity(t,n,i);}
function aurYes(){const p=AUR.pending;AUR.pending=null;if(p&&p.ok)return p.ok();return aurSay(aurL('Não havia nada à espera de confirmação.','There was nothing waiting for confirmation.'));}
function aurNo(){AUR.pending=null;return aurSay(aurL('Ok, cancelado.','Ok, cancelled.'));}
function aurConfirmChips(){return [{label:aurL('Confirmar','Confirm'),fn:aurYes},{label:aurL('Cancelar','Cancel'),fn:aurNo}];}
function aurQuick(t){AUR.out(aurEsc(t),'me');return aurHandle(t);}
function aurQ(pt,en){return aurQuick(aurL(pt,en));}
function aurEntLabel(e){const o=e.obj||{};let sub=aurTypeLbl(e.type);if(e.type==='vault'&&o.user)sub=o.user;if(e.type==='asset')sub=aurAssetLbl(o.kind)||sub;return e.name+(sub?' · '+sub:'')+(e.archived?aurL(' (arquivado)',' (archived)'):'');}
function aurChoose(cs,F,title,fn){return aurSay(title||aurL('Encontrei várias opções — qual é?','I found several matches — which one?'),cs.slice(0,8).map(e=>({label:aurEntLabel(e),fn:()=>fn?fn(e):aurOpenEnt(e,F,F.c.has('OPEN'))})));}
function aurTotpLocked(){try{return typeof totpRecWrap!=='undefined'&&!!totpRecWrap&&typeof totpUnlocked!=='undefined'&&!totpUnlocked;}catch(e){return false;}}
function aurNeed2fa(raw){AUR.resume=raw;aurTab('totp');aurClose();return aurSay(aurL('🔒 O teu cofre 2FA está bloqueado. Abri-o — desbloqueia com o PIN (ou biometria) e eu continuo o pedido sozinha.','🔒 Your 2FA vault is locked. I opened it — unlock it with your PIN (or biometrics) and I’ll carry on with your request.'));}
function aurOwner(){const P=aurA(typeof personalInfo!=='undefined'?personalInfo:[]).filter(p=>p&&Array.isArray(p.fields));if(!P.length)return null;const vn=aurNorm(typeof vaultName!=='undefined'?vaultName:'').split(' ')[0];if(vn){const f=P.find(p=>aurNorm(p.name).split(' ')[0]===vn);if(f)return f;}return P[0];}
function aurEvents(){try{return typeof calCollectEvents==='function'?calCollectEvents().filter(e=>e&&aurIsDate(e.date)):[];}catch(e){return [];}}
const AUR_QUICK=[['O que expira?','o que expira nos proximos 3 meses','What expires?','what expires in the next 3 months'],['Ponto de situação','resumo','Status overview','summary'],['Códigos 2FA','codigos 2fa','2FA codes','2fa codes'],['A minha info','a minha info completa','My info','my full personal info'],['Gerar password','gera uma password forte','Generate password','generate a strong password'],['Segurança','tenho passwords fracas','Security','any weak passwords']];
function aurQuickChips(){return AUR_QUICK.map(q=>({label:aurL(q[0],q[2]),fn:()=>aurQuick(aurL(q[1],q[3]))}));}

/* ═══════════ DECISÃO ═══════════ */
function aurHandle(raw){
  raw=(raw||'').trim();if(!raw)return;
  const F=aurFrame(raw);const c=F.c;
  const skip=new Set();F.cands.filter(e=>e.score>=0.5).forEach(e=>aurNorm(e.name).replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).forEach(w=>{if(w)skip.add(w);}));
  const dl=aurDetectLang(raw,skip);if(dl)AUR.lang=dl;
  F.date=aurParseDate(F.n);
  if(AUR.pending){const p=AUR.pending;
    if(F.yes){AUR.pending=null;return p.ok?p.ok():aurSay('Ok.');}
    if(F.no){AUR.pending=null;return aurSay(aurL('Ok, cancelado.','Ok, cancelled.'));}
    if(p.withText&&(!F.hasAction||p.type==='askDate')){AUR.pending=null;return p.withText(raw,F);}
    AUR.pending=null;
  }
  if((F.yes||F.no)&&!F.confident)return aurSay(aurL('Não havia nada à espera de confirmação.','There was nothing waiting for confirmation.'));
  if(c.has('HELP'))return aurHelp();
  if((c.has('HELLO')||c.has('THANKS'))&&![...c].some(x=>AUR_ACTIONS.has(x)||x.indexOf('D_')===0)&&!F.confident)return aurSmall(F);
  if(c.has('CLOSE')&&!F.hasDomain){aurSay(aurL('Até já! ✨','See you soon! ✨'));aurClose(true);return true;}
  if(c.has('D_MASTER'))return aurSettings('seguranca',aurL('A palavra-passe mestra, o PIN, a biometria e o auto-bloqueio mudam-se em Definições → Segurança — por segurança não os altero pela conversa. Abri-te lá.','The master password, PIN, biometrics and auto-lock are changed in Settings → Security — for safety I don’t change them through chat. I opened it for you.'));
  if(c.has('D_2FA')||c.has('D_2FAW')){const r=aur2fa(F);if(r!==AUR_PASS)return r;}
  if(c.has('D_EXPIRY')&&!(c.has('SCHEDULE')&&F.date)&&!(c.has('D_PW')&&!/expir|caduc|venc|validade|valid/.test(F.n)))return aurExpiry(F);
  if(c.has('D_SUMMARY'))return aurSummary();
  if(c.has('D_AUDIT'))return aurAudit(F);
  if((c.has('GEN')&&(c.has('D_PW')||c.has('MOD_STRONG')||c.has('MOD_MEM')))||(c.has('D_PW')&&(c.has('MOD_STRONG')||c.has('MOD_MEM'))&&!c.has('CHANGE')&&!(F.confident&&F.best.type==='vault')))return aurGenerate(F);
  if(c.has('CHANGE')&&c.has('D_PW'))return aurChangePw(F);
  if(c.has('CHANGE')&&c.has('D_EMAIL')&&!F.fields.length&&F.cands.some(e=>e.type==='vault'))return aurChangeUser(F);
  if(c.has('CHANGE')&&/\b(nome|name|rename|renomeia|renomear)\b/.test(F.n)&&F.cands.some(e=>e.score>=0.5&&e.type==='vault'))return aurRename(F);
  if(c.has('CHANGE')&&F.fields.length)return aurInfoSet(F,true);
  if((c.has('SCHEDULE')&&!(c.has('OPEN')&&!F.date))||(F.date&&(c.has('ADD')||c.has('D_CAL'))&&!c.has('D_EXPIRY')))return aurSchedule(F);
  const other=x=>[...c].some(k=>k.indexOf('D_')===0&&k!==x&&k!=='D_SETTINGS');
  if(c.has('D_THEME')&&!c.has('D_PW')&&!c.has('D_NOTE')&&!c.has('D_DOC'))return aurTheme(F);
  if(c.has('D_PRIV')&&!other('D_PRIV'))return aurPriv(F);
  if(c.has('D_LANG')&&!other('D_LANG'))return aurLang(F);
  if(c.has('EMPTY')&&(c.has('D_TRASH')||!F.hasDomain))return aurEmptyTrash();
  if(c.has('RESTORE'))return aurRestore(F);
  if(c.has('ARCHIVE'))return aurArchive(F);
  if(c.has('DELETE'))return aurDelete(F);
  if(c.has('ADD'))return aurAdd(F);
  if(c.has('COPY'))return aurCopyCmd(F);
  if(F.fields.length||F.labelHits.length||c.has('D_INFO')||(F.best&&F.best.type==='person'&&F.best.score>=0.5)){const r=aurInfo(F);if(r!==AUR_PASS)return r;}
  if(c.has('D_THEME')||(c.has('APPLY')&&F.cands.some(e=>e.type==='theme')))return aurTheme(F);
  if(c.has('D_PRIV'))return aurPriv(F);
  if(c.has('D_LANG'))return aurLang(F);
  if(c.has('LOCK')){aurSay(aurL('🔒 Cofre bloqueado.','🔒 Vault locked.'));if(typeof lockApp==='function'){aurClose();lockApp();}return true;}
  if(c.has('SYNC')){if(typeof driveSyncNow==='function'){driveSyncNow();return aurSay(aurL('☁️ A sincronizar com o Google Drive…','☁️ Syncing with Google Drive…'));}return aurSay(aurL('A sincronização com o Drive não está disponível.','Drive sync isn’t available.'));}
  if(c.has('D_BACKUP')){if(typeof downloadBackupNow==='function'){downloadBackupNow();return aurSay(aurL('💾 Descarreguei uma cópia de segurança do cofre (encriptada).','💾 I downloaded an (encrypted) backup of your vault.'));}return aurSettings('dados');}
  if(c.has('EXPORT'))return aurExport(F);
  if(c.has('SAVE')){if(typeof saveFile==='function'){saveFile();return aurSay(aurL('💾 A gravar o cofre…','💾 Saving your vault…'));}return aurSay(aurL('Não consegui gravar.','I couldn’t save.'));}
  if(c.has('D_HERITAGE'))return aurSettings('heranca');
  if(c.has('D_SETTINGS')||(c.has('D_SEC')&&c.has('OPEN')))return aurSettings(F.stab);
  if(c.has('LIST')){const r=aurList(F);if(r!==AUR_PASS)return r;}
  if(c.has('D_EMAIL')&&!F.confident&&!F.cands.some(e=>e.score>=0.5))return aurEmails();
  if(c.has('D_FUEL'))return aurFuel(F);
  if(c.has('D_SUBS')||c.has('D_MONEY'))return aurSubs(F);
  if(c.has('COUNT'))return aurCount(F);
  if(c.has('D_CAL'))return aurCal(F);
  if(c.has('D_WIFI')&&!(F.best&&F.best.type==='wifi'&&F.confident))return aurWifi(F);
  if(!F.hasDomain&&!F.confident&&/\b(tenho|ha|acontece|marcado|have|there|coming|upcoming|happening|scheduled)\b/.test(F.n)&&aurPeriod(F.n).explicit)return aurCal(Object.assign({},F,{n:F.n+' eventos'}));
  if(F.confident)return aurOpenEnt(F.best,F,c.has('OPEN'));
  if(F.suggest&&!F.confident){const fixed=F.n.split(' ').map(w=>w===F.suggest.from?F.suggest.to:w).join(' ');return aurSay(aurL('Querias dizer «<b>','Did you mean «<b>')+aurEsc(fixed)+'</b>»?',[{label:aurL('Sim, ','Yes, ')+F.suggest.to,fn:()=>aurQuick(fixed)},{label:aurL('Não','No'),fn:()=>aurSay(aurL('Ok — diz-me de outra forma.','Ok — try saying it another way.'))}]);}
  const strong=F.cands.filter(e=>e.score>=0.5);
  if(strong.length>1)return aurChoose(strong,F);
  const tab=aurDomainTab(c);
  if(tab&&!F.terms.length)return aurGoTab(tab);
  return aurFind(F,tab);
}

function aurDomainTab(c){
  const map=[['D_2FA','totp'],['D_BANK','cards'],['D_STORE','store'],['D_CARD','cards'],['D_DOC','docs'],['D_NOTE','notes'],['D_INFO','info'],['D_FIELD','info'],['D_WARRANTY','warranty'],['D_LICENSE','license'],['D_VEHICLE','vehicle'],['D_DATES','dates'],['D_ASSETS','warranty'],['D_TRASH','trash'],['D_ARCHIVE','archive'],['D_DASH','dashboard'],['D_PW','vault'],['D_VAULT','vault']];
  for(const m of map)if(c.has(m[0]))return m[1];return null;
}

/* ── ajuda e cortesia ── */
function aurHelp(){
  if(AUR.lang==='en')return aurSay('✨ <b>What I can do — across your whole vault</b>\n'+
  '🔑 <b>Passwords</b>: "open gmail", "what’s the revolut password", "copy the paypal password", "change the gmail password", "add netflix with user x and password y", "generate a strong / memorable password"\n'+
  '🔐 <b>2FA</b>: "code for trade republic", "add 2fa", "open 2fa" (if it’s locked, I’ll ask for your PIN and carry on)\n'+
  '👤 <b>Info</b>: "what’s my tax number", "my id card number", "carlos’s full info", "add my iban PT50…", "change my phone to…"\n'+
  '📄 <b>Documents & notes</b>: "open the citizen card", "create a note", "add a document"\n'+
  '💳 <b>Cards</b>: "open the continente card", "add a credit card"\n'+
  '⏳ <b>Expiry dates</b>: "what expires this month", "when does my driving licence expire", "what has expired"\n'+
  '📅 <b>Calendar</b>: "remind me about the car service on 15/03/2027", "what do I have this week"\n'+
  '🏠 <b>Assets</b>: "add a warranty", "car fuel consumption", "open vehicles"\n'+
  '🔁 <b>Subscriptions</b>: "how much do I spend per month", "how much is netflix"\n'+
  '🛡️ <b>Security</b>: "any weak passwords", "status overview"\n'+
  '🗑️ <b>Archive/Trash</b>: "archive hotmail", "restore paypal", "empty the trash"\n'+
  '🎨 <b>Appearance</b>: "apply the ocean theme", "light themes", "turn on privacy mode", "switch to portuguese"\n'+
  '⚙️ <b>Actions</b>: "save", "sync", "back up", "export to pdf", "open digital legacy", "lock"',aurQuickChips());
  return aurSay('✨ <b>O que eu sei fazer — em todo o cofre</b>\n'+
  '🔑 <b>Passwords</b>: "abre o gmail", "qual a password da revolut", "copia a password do paypal", "muda a password do gmail", "adiciona a netflix com user x e pass y", "gera uma password forte / fácil de decorar"\n'+
  '🔐 <b>2FA</b>: "código da trade republic", "adicionar 2fa", "abre o 2fa" (se estiver bloqueado, peço-te o PIN e continuo)\n'+
  '👤 <b>Info</b>: "qual o meu nif", "número de cc", "info completa do carlos", "adiciona o meu iban PT50…", "muda o meu telemóvel para…"\n'+
  '📄 <b>Documentos e notas</b>: "abre o cartão de cidadão", "cria uma nota", "adiciona um documento"\n'+
  '💳 <b>Cartões</b>: "abre o cartão do continente", "adiciona um cartão de crédito"\n'+
  '⏳ <b>Validades</b>: "o que expira este mês", "quando expira a carta de condução", "o que já expirou"\n'+
  '📅 <b>Calendário</b>: "lembra-me da revisão do carro a 15/03/2027", "o que tenho esta semana"\n'+
  '🏠 <b>Bens</b>: "adiciona uma garantia", "consumo do carro", "abre os veículos"\n'+
  '🔁 <b>Subscrições</b>: "quanto gasto por mês", "quanto pago da netflix"\n'+
  '🛡️ <b>Segurança</b>: "tenho passwords fracas", "ponto de situação"\n'+
  '🗑️ <b>Arquivo/Reciclagem</b>: "arquiva o hotmail", "recupera o paypal", "esvazia a reciclagem"\n'+
  '🎨 <b>Aspeto</b>: "aplica o tema oceano", "temas claros", "ativa o modo privado", "muda para inglês"\n'+
  '⚙️ <b>Ações</b>: "grava", "sincroniza", "faz backup", "exporta para pdf", "abre a herança digital", "bloqueia"\n'+
  '🌍 Também percebo inglês — respondo na língua em que me escreves.',aurQuickChips());
}
function aurSmall(F){
  if(F.c.has('THANKS'))return aurSay(aurL('De nada! 😊 Estou aqui sempre que precisares.','You’re welcome! 😊 I’m here whenever you need me.'));
  const nm=typeof vaultName!=='undefined'&&vaultName?', '+aurEsc(String(vaultName).split(' ')[0]):'';
  return aurSay(aurL('Olá'+nm+'! Em que te posso ajudar?','Hi'+nm+'! How can I help?'),aurQuickChips());
}

/* ── 2FA ── */
function aur2faList(T){return T.slice(0,12).map(t=>({label:t.name||t.issuer||aurL('Código','Code'),fn:()=>aurShowCode(t)}));}
function aur2fa(F){
  const c=F.c,strong=c.has('D_2FA');
  if(!strong&&(c.has('D_WIFI')||c.has('D_STORE')||c.has('D_CARD')||c.has('D_BANK')))return AUR_PASS;
  if(!strong&&F.confident&&F.best.type!=='totp'&&F.best.type!=='vault')return AUR_PASS;
  if(aurTotpLocked())return aurNeed2fa(F.raw);
  const T=aurA(typeof totp!=='undefined'?totp:[]);
  const tc=F.cands.filter(e=>e.type==='totp'&&e.score>=0.5);
  const ent=(tc.length===1||(tc.length>1&&tc[0].score-tc[1].score>=0.15))?tc[0]:null;
  const addNew=()=>{aurTab('totp');if(typeof openTotpModal==='function'){aurClose();openTotpModal();}};
  if(c.has('ADD')){addNew();return aurSay(aurL('🔐 Abri o formulário de novo código 2FA — cola a chave secreta ou lê o QR do serviço.','🔐 I opened the new 2FA code form — paste the secret key or scan the service’s QR code.'));}
  if(c.has('COUNT'))return aurSay(aurL('Tens <b>'+T.length+'</b> '+(T.length===1?'código':'códigos')+' 2FA.','You have <b>'+T.length+'</b> 2FA '+(T.length===1?'code':'codes')+'.'));
  if(!ent&&tc.length>1)return aurChoose(tc,F,aurL('Qual destes códigos?','Which of these codes?'),e=>aurShowCode(e.obj));
  if(ent&&c.has('CHANGE')){aurTab('totp');if(typeof openTotpModal==='function'){aurClose();openTotpModal(ent.obj.id);}return aurSay(aurL('✏️ Abri o código 2FA de <b>','✏️ I opened the 2FA code for <b>')+aurEsc(ent.name)+aurL('</b> para editares.','</b> so you can edit it.'));}
  if(ent&&c.has('DELETE')){const id=ent.obj.id;if(typeof deleteTotp==='function')deleteTotp(id);const still=aurA(typeof totp!=='undefined'?totp:[]).some(t=>t.id===id);return aurSay(still?aurL('Ficou tudo como estava.','Nothing was changed.'):aurL('🗑️ Código 2FA de <b>','🗑️ 2FA code for <b>')+aurEsc(ent.name)+aurL('</b> apagado.','</b> deleted.'));}
  if(ent)return aurShowCode(ent.obj);
  if(F.confident&&F.best.type==='vault'){const v=F.best;return aurSay(aurL('Não tens um código 2FA guardado para <b>','You don’t have a 2FA code saved for <b>')+aurEsc(v.name)+'</b>.',[{label:aurL('Ver o acesso','View the account'),fn:()=>aurOpenEnt(v,F,false)},{label:aurL('Adicionar código 2FA','Add 2FA code'),fn:addNew}]);}
  if(!T.length)return aurSay(aurL('Ainda não tens códigos 2FA guardados.','You don’t have any 2FA codes saved yet.'),[{label:aurL('Adicionar código 2FA','Add 2FA code'),fn:addNew}]);
  if(c.has('OPEN')&&!F.terms.length)return aurGoTab('totp');
  if(F.terms.length&&!tc.length)return aurSay(aurL('Não encontrei um código 2FA para «','I couldn’t find a 2FA code for «')+aurEsc(F.terms.join(' '))+aurL('». Tens estes — toca para ver o código:','». You have these — tap one to see its code:'),aur2faList(T));
  return aurSay(aurL('🔐 Os teus códigos 2FA (','🔐 Your 2FA codes (')+T.length+aurL(') — toca para ver o código atual:',') — tap one to see the current code:'),aur2faList(T).concat([{label:aurL('Abrir 2FA','Open 2FA'),fn:()=>aurGoTab('totp')}]));
}
async function aurShowCode(t){
  if(aurTotpLocked())return aurNeed2fa(aurL('codigo ','code ')+(t.name||''));
  let code=null;try{code=await computeTOTP(t.secret,t.digits,t.period,t.algorithm,t.type==='hotp'?(t.counter||0):null);}catch(e){}
  const nm=aurEsc(t.name||t.issuer||'2FA');
  if(!code)return aurSay(aurL('Não consegui calcular o código de <b>','I couldn’t calculate the code for <b>')+nm+aurL('</b>. Abre o separador 2FA.','</b>. Open the 2FA tab.'),[{label:aurL('Abrir 2FA','Open 2FA'),fn:()=>aurGoTab('totp')}]);
  const per=+t.period||30,left=per-Math.floor(Date.now()/1000)%per;
  const f=typeof fmtTotpCode==='function'?fmtTotpCode(code,t.digits):code;
  aurCopy(code,aurL('Código copiado ✓','Code copied ✓'));
  return aurSay('🔐 <b>'+nm+'</b>\n<span class="a-code">'+aurEsc(f)+'</span>\n<span class="a-dim">'+aurL('válido mais '+left+'s · copiado para a área de transferência','valid for '+left+'s more · copied to clipboard')+'</span>',[{label:aurL('Novo código','New code'),fn:()=>aurShowCode(t)},{label:aurL('Copiar de novo','Copy again'),fn:()=>aurCopy(code,aurL('Código copiado ✓','Code copied ✓'))}]);
}

/* ── validades ── */
function aurEvLine(e){return '• '+(AUR_EV_ICON[e.type]||'📅')+' <b>'+aurEsc(e.label)+'</b> — '+aurDate(e.date)+' <span class="a-dim">('+aurRel(e.date)+')</span>'+(e.type==='renew'&&e.amount?' · '+aurMoney(e.amount):'');}
function aurExpiry(F){
  if(F.fields.some(f=>f.k==='valcc')){const r=aurInfo(F,true);if(r!==AUR_PASS)return r;}
  const ev=aurEvents(),today=aurToday();
  const ent=F.confident&&['doc','bank','sub','asset'].includes(F.best.type)?F.best:null;
  if(ent){
    const nm=aurNorm(ent.name);
    const mine=ev.filter(e=>aurNorm(e.label).indexOf(nm)===0).sort((a,b)=>a.date-b.date);
    const nx=mine.find(e=>e.date>=today)||mine[mine.length-1];
    if(nx){const past=nx.date<today;const verb=past?aurL('expirou a ','expired on '):(ent.type==='sub'?aurL('renova a ','renews on '):aurL('expira a ','expires on '));return aurSay((past?'⚠️ ':'⏳ ')+'<b>'+aurEsc(ent.name)+'</b> '+verb+aurDate(nx.date)+' ('+aurRel(nx.date)+').',[{label:aurL('Abrir','Open'),fn:()=>aurOpenEnt(ent,F,true)},{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);}
    return aurSay('<b>'+aurEsc(ent.name)+aurL('</b> não tem validade registada.','</b> has no expiry date saved.'),[{label:aurL('Abrir para adicionar','Open to add one'),fn:()=>aurOpenEnt(ent,F,true)}]);
  }
  const P=aurPeriod(F.n);const c=F.c;
  let list=ev.filter(e=>e.date>=P.from&&e.date<=P.to);
  const tf=[];if(c.has('D_DOC'))tf.push('doc');if(c.has('D_BANK')||c.has('D_CARD'))tf.push('card');if(c.has('D_SUBS'))tf.push('renew');if(c.has('D_WARRANTY'))tf.push('warranty');if(c.has('D_LICENSE'))tf.push('license');if(c.has('D_VEHICLE'))tf.push('vehicle');
  if(tf.length)list=list.filter(e=>tf.includes(e.type));
  list.sort((a,b)=>a.date-b.date);
  if(!list.length)return aurSay(P.past?aurL('✅ Nada expirou ','✅ Nothing expired ')+P.label+'.':aurL('✅ Nada a expirar ','✅ Nothing expiring ')+P.label+'.',[P.past?null:{label:aurL('Próximos 12 meses','Next 12 months'),fn:()=>aurQ('o que expira nos proximos 12 meses','what expires in the next 12 months')},{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);
  const lines=list.slice(0,20).map(aurEvLine);
  return aurSay((P.past?aurL('⚠️ Expirados ','⚠️ Expired '):aurL('⏳ A expirar ','⏳ Expiring '))+P.label+' ('+list.length+'):\n'+lines.join('\n')+(list.length>20?aurL('\n…e mais ','\n…and ')+(list.length-20)+aurL('.',' more.'):''),[{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);
}
function aurOpenCal(){if(typeof openCalendar==='function'){aurClose();openCalendar();}return true;}
function aurCal(F){
  const P=aurPeriod(F.n);
  if(P.explicit||/\b(tenho|ha|eventos|have|events|there)\b/.test(F.n)){const ev=aurEvents().filter(e=>e.date>=P.from&&e.date<=P.to).sort((a,b)=>a.date-b.date);
    if(!ev.length)return aurSay(aurL('📅 Nada no calendário ','📅 Nothing on the calendar ')+P.label+'.',[{label:aurL('Abrir calendário','Open calendar'),fn:aurOpenCal}]);
    return aurSay(aurL('📅 No calendário ','📅 On the calendar ')+P.label+':\n'+ev.slice(0,20).map(aurEvLine).join('\n'),[{label:aurL('Abrir calendário','Open calendar'),fn:aurOpenCal}]);}
  aurOpenCal();return aurSay(aurL('📅 Abri o calendário.','📅 I opened the calendar.'));
}

/* ── resumo e auditoria ── */
function aurSummary(){
  const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived);
  const sc=typeof calcSecurityScore==='function'?calcSecurityScore():null;
  let sub=0;aurA(typeof subscriptions!=='undefined'?subscriptions:[]).forEach(s=>{try{sub+=subMonthly(s)||0;}catch(e){}});
  const t=aurToday(),lim=aurAddDays(t,30),soon=aurEvents().filter(e=>e.date>=t&&e.date<=lim).sort((a,b)=>a.date-b.date);
  const T=aurA(typeof totp!=='undefined'?totp:[]);
  const n=x=>aurA(typeof x!=='undefined'?x:[]).length;
  const L=['🔑 <b>'+V.length+'</b> '+aurL('acessos','accounts')+' · 🔐 '+(aurTotpLocked()?aurL('2FA bloqueado','2FA locked'):'<b>'+T.length+'</b> '+aurL('códigos 2FA','2FA codes')),
   '📄 <b>'+n(documents)+'</b> '+aurL('documentos','documents')+' · 💳 <b>'+n(bankCards)+'</b> '+aurL('cartões','cards')+' · 🎟️ <b>'+n(storeCards)+'</b> '+aurL('de loja','store'),
   '📝 <b>'+n(notes)+'</b> '+aurL('notas','notes')+' · 🏠 <b>'+n(assets)+'</b> '+aurL('bens','assets')+' · 👤 <b>'+n(personalInfo)+'</b> '+aurL('pessoas','people'),
   sc!=null?'🛡️ '+aurL('Segurança','Security')+': <b>'+sc+'/100</b>':null,
   '🔁 '+aurL('Subscrições','Subscriptions')+': <b>'+aurMoney(sub)+aurL('/mês','/month')+'</b>',
   soon.length?'⏳ <b>'+soon.length+'</b> '+aurL('a expirar em 30 dias — próximo: ','expiring within 30 days — next: ')+aurEsc(soon[0].label)+' ('+aurRel(soon[0].date)+')':aurL('✅ Nada a expirar nos próximos 30 dias','✅ Nothing expiring in the next 30 days')];
  return aurSay('📊 <b>'+aurL('Ponto de situação','Status overview')+'</b>\n'+L.filter(Boolean).join('\n'),[{label:aurL('O que expira?','What expires?'),fn:()=>aurQ('o que expira nos proximos 3 meses','what expires in the next 3 months')},{label:aurL('Auditoria','Audit'),fn:()=>aurQ('auditoria','audit')},{label:aurL('Subscrições','Subscriptions'),fn:()=>aurQ('quanto gasto em subscricoes','how much do i spend on subscriptions')}]);
}
function aurAudit(F){
  const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived&&v.pw);
  if(!V.length)return aurSay(aurL('Ainda não tens passwords para auditar.','You don’t have any passwords to audit yet.'));
  const weak=V.filter(v=>typeof getPwScore==='function'&&getPwScore(v.pw)<2);
  const map={};V.forEach(v=>{map[v.pw]=(map[v.pw]||0)+1;});
  const dup=V.filter(v=>map[v.pw]>1);
  const old=V.filter(v=>v.pwUpdated&&Date.now()-v.pwUpdated>180*864e5);
  const sc=typeof calcSecurityScore==='function'?calcSecurityScore():null;
  const n=F.n;let focus=null;
  if(/\b(fraca|fracas|weak)\b/.test(n))focus=['weak',weak];else if(/\b(repetida|repetidas|duplicadas|reutilizadas|reused|repeated|duplicate|duplicates|duplicated)\b/.test(n))focus=['dup',dup];else if(/\b(antigas|old)\b/.test(n))focus=['old',old];
  const NAMES={weak:[['fraca','fracas'],['weak','weak']],dup:[['repetida','repetidas'],['reused','reused']],old:[['antiga','antigas'],['old','old']]};
  const openFull={label:aurL('Auditoria completa','Full audit'),fn:()=>{if(typeof openHealthCheck==='function'){aurClose();openHealthCheck();}}};
  const fixChips=L=>L.slice(0,10).map(v=>({label:v.name+(v.user?' · '+v.user:''),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:new Set()})}));
  if(focus){const L=focus[1],nm=NAMES[focus[0]];
    if(!L.length)return aurSay(aurL('✅ Não tens passwords '+nm[0][1]+'.','✅ You have no '+nm[1][1]+' passwords.'),[openFull]);
    return aurSay(aurL('⚠️ Tens <b>'+L.length+'</b> '+(L.length===1?'password '+nm[0][0]:'passwords '+nm[0][1])+' — toca numa para gerar uma nova:','⚠️ You have <b>'+L.length+'</b> '+nm[1][0]+' '+(L.length===1?'password':'passwords')+' — tap one to generate a new one:'),fixChips(L).concat([openFull]));}
  const prob=[...new Set([...weak,...dup,...old])];
  const head='🛡️ '+(sc!=null?aurL('Pontuação','Score')+': <b>'+sc+'/100</b>\n':'')+aurL('• Fracas: <b>','• Weak: <b>')+weak.length+aurL('</b>\n• Repetidas: <b>','</b>\n• Reused: <b>')+dup.length+aurL('</b>\n• Antigas (+6 meses): <b>','</b>\n• Old (6+ months): <b>')+old.length+'</b>';
  if(!prob.length)return aurSay(head+aurL('\n\n✅ Tudo em ordem.','\n\n✅ All good.'),[openFull]);
  return aurSay(head+aurL('\n\nPara corrigir — toca para gerar uma nova:','\n\nTo fix — tap one to generate a new password:'),fixChips(prob.slice(0,8)).concat([openFull]));
}

/* ── passwords ── */
function aurGenPw(len){len=Math.max(8,Math.min(64,len||20));const U='ABCDEFGHJKLMNPQRSTUVWXYZ',L='abcdefghijkmnopqrstuvwxyz',D='23456789',S='!@#$%&*?-_+=';const all=U+L+D+S;const r=new Uint32Array(len),s=new Uint32Array(len);crypto.getRandomValues(r);crypto.getRandomValues(s);const p=[U[r[0]%U.length],L[r[1]%L.length],D[r[2]%D.length],S[r[3]%S.length]];for(let i=4;i<len;i++)p.push(all[r[i]%all.length]);for(let i=p.length-1;i>0;i--){const j=s[i]%(i+1);const x=p[i];p[i]=p[j];p[j]=x;}return p.join('');}
const AUR_WORDS='aurora estrela oceano floresta montanha trovoada cristal veludo girassol relampago cascata labareda nevoeiro tigre falcao castelo muralha bussola ancora farol duna coral jasmim canela ambar safira esmeralda carvalho sereno vulcao pantera cometa orquidea abelha raposa lince baleia glaciar planeta galaxia neblina brisa savana tulipa cedro granito marfim cobalto rubi topazio condor golfinho'.split(' ');
const AUR_WORDS_EN='aurora star ocean forest mountain thunder crystal velvet sunflower lightning waterfall ember mist tiger falcon castle rampart compass anchor lighthouse dune coral jasmine cinnamon amber sapphire emerald oak serene volcano panther comet orchid honeybee fox lynx whale glacier planet galaxy breeze savanna tulip cedar granite ivory cobalt ruby topaz condor dolphin'.split(' ');
function aurMemPw(){const W=AUR.lang==='en'?AUR_WORDS_EN:AUR_WORDS;const r=new Uint32Array(6);crypto.getRandomValues(r);const w=[];for(let i=0;i<4;i++){const x=W[r[i]%W.length];w.push(x.charAt(0).toUpperCase()+x.slice(1));}return w.join('-')+'-'+(10+r[4]%90)+'!?#&'.charAt(r[5]%4);}
function aurPwStrength(pw){if(!pw)return '—';const s=typeof getPwScore==='function'?getPwScore(pw):3;return s<2?aurL('fraca ⚠️','weak ⚠️'):s<4?aurL('razoável','fair'):aurL('forte ✓','strong ✓');}
function aurVaultPick(F){
  const vc=F.cands.filter(e=>e.type==='vault'&&e.score>=0.5);
  if(vc.length===1||(vc.length>1&&vc[0].score-vc[1].score>=0.15))return {one:vc[0]};
  if(vc.length>1)return {many:vc};
  if(AUR.last&&AUR.last.type==='vault'&&/\b(essa|esse|dela|dele|isso|esta|este|it|that|this one)\b/.test(F.n))return {one:AUR.last};
  return {};
}
function aurGenerate(F){
  const mem=F.c.has('MOD_MEM');let len=20;const m=F.n.match(/(\d{1,2})\s*(caracteres|carateres|letras|digitos|chars|simbolos|characters|character|letters|digits)/);if(m)len=+m[1];
  const pw=mem?aurMemPw():aurGenPw(len);
  const pk=aurVaultPick(F);let chips=[{label:aurL('Copiar','Copy'),fn:()=>aurCopy(pw,aurL('Password copiada ✓','Password copied ✓'))},{label:aurL('Gerar outra','Generate another'),fn:()=>aurGenerate(F)}];
  if(pk.one)chips.unshift({label:aurL('Usar em ','Use for ')+pk.one.name,fn:()=>aurSetPw(pk.one.obj,pw)});
  else{const nm=(F.raw.match(/\b(?:para|for)\s+(?:o |a |os |as |the |my )?(.+?)\s*$/i)||[])[1];if(nm&&!/\b(mim|decorar|lembrar|me|remember)\b/i.test(nm))chips.unshift({label:aurL('Criar acesso «','Create account «')+aurCap(nm)+'»',fn:()=>aurConfirmAdd({name:aurCap(nm),user:'',pw})});else chips.push({label:aurL('Guardar num acesso novo','Save as a new account'),fn:()=>aurAskName(pw)});}
  return aurSay(aurL('🔐 Password '+(mem?'memorável':'forte')+' ('+pw.length+' caracteres):','🔐 '+(mem?'Memorable':'Strong')+' password ('+pw.length+' characters):')+'\n<span class="a-code">'+aurEsc(pw)+'</span>',chips);
}
function aurAskName(pw){AUR.pending={type:'askName',withText:(t)=>aurConfirmAdd({name:aurCap(t.trim()),user:'',pw})};return aurSay(aurL('Para que serviço é esta password? (ex.: Netflix)','Which service is this password for? (e.g. Netflix)'));}
function aurSetPw(v,pw){
  if(!v)return aurSay(aurL('Não encontrei essa entrada.','I couldn’t find that entry.'));
  if(v.pw===pw)return aurSay(aurL('Essa já é a password atual.','That’s already the current password.'));
  v.pwHistory=[v.pw,...aurA(v.pwHistory)].filter(x=>typeof x==='string'&&x).slice(0,3);
  v.pw=pw;v.pwUpdated=Date.now();aurLog('edit',v.name,'🔑');aurDirty();
  AUR.last={type:'vault',obj:v,name:v.name};
  return aurSay(aurL('✓ Password de <b>','✓ Password for <b>')+aurEsc(v.name)+aurL('</b> atualizada — a anterior ficou no histórico.\n⚠️ Lembra-te de a mudar também no site/app do serviço, e de gravar.','</b> updated — the old one is kept in the history.\n⚠️ Remember to change it on the service’s site/app too, and to save.'),[{label:aurL('Copiar nova password','Copy new password'),fn:()=>aurCopy(pw,aurL('Password copiada ✓','Password copied ✓'))},{label:aurL('Gravar agora','Save now'),fn:()=>{if(typeof saveFile==='function')saveFile();}}]);
}
function aurChangePw(F){
  const pk=aurVaultPick(F);
  if(pk.many)return aurChoose(pk.many,F,aurL('De qual destas contas?','Which of these accounts?'),e=>aurChangePwOn(e.obj,F));
  if(!pk.one){const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived);return aurSay(aurL('De que conta queres mudar a password?','Which account’s password do you want to change?'),V.slice(0,12).map(v=>({label:v.name+(v.user?' · '+v.user:''),fn:()=>aurChangePwOn(v,F)})));}
  return aurChangePwOn(pk.one.obj,F);
}
function aurChangePwOn(v,F){
  let nova=null;const m=(F.raw||'').match(/\b(?:para|to)\s+(\S+)\s*$/i);
  if(m){const w=aurNorm(m[1]);const isName=aurNorm(v.name).indexOf(w)>=0;if(!isName&&!/^(forte|segura|nova|outra|aleatoria|memoravel|facil|uma|isso|strong|secure|new|another|random|memorable|easy|one|it)$/.test(w)&&m[1].length>=4)nova=m[1];}
  const gen=!nova;if(gen)nova=F.c&&F.c.has('MOD_MEM')?aurMemPw():aurGenPw(20);
  AUR.pending={ok:()=>aurSetPw(v,nova)};
  return aurSay(aurL('Vou mudar a password de <b>','I’ll change the password for <b>')+aurEsc(v.name)+'</b>'+(v.user?' ('+aurEsc(v.user)+')':'')+aurL(' para:',' to:')+'\n<span class="a-code">'+aurEsc(nova)+'</span> <span class="a-dim">('+(gen?aurL('gerada · ','generated · '):'')+aurPwStrength(nova)+')</span>\n'+aurL('Confirmas?','Confirm?'),[{label:aurL('Confirmar','Confirm'),fn:aurYes},{label:aurL('Gerar outra','Generate another'),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:F.c||new Set()})},{label:aurL('Cancelar','Cancel'),fn:aurNo}]);
}
function aurChangeUser(F){
  const pk=aurVaultPick(F);if(!pk.one)return pk.many?aurChoose(pk.many,F,aurL('De qual?','Which one?'),e=>aurChangeUser(Object.assign({},F,{cands:[Object.assign({},e,{score:1})]}))):aurSay(aurL('De que conta?','Which account?'));
  const v=pk.one.obj;const nv=(F.raw.match(/([\w.+-]+@[\w-]+\.[\w.-]+)\s*$/)||F.raw.match(/\b(?:para|to)\s+(\S+)\s*$/i)||[])[1];
  if(!nv)return aurSay(aurL('Qual é o novo utilizador/email para <b>','What’s the new username/email for <b>')+aurEsc(v.name)+aurL('</b>? Ex.: "muda o email do '+aurEsc(v.name)+' para novo@mail.com"','</b>? E.g. "change the '+aurEsc(v.name)+' email to new@mail.com"'));
  AUR.pending={ok:()=>{v.user=nv;aurLog('edit',v.name,'✏️');aurDirty();return aurSay(aurL('✓ Utilizador de <b>','✓ Username for <b>')+aurEsc(v.name)+aurL('</b> atualizado para ','</b> updated to ')+aurEsc(nv)+'.');}};
  return aurSay(aurL('Vou mudar o utilizador de <b>','I’ll change the username for <b>')+aurEsc(v.name)+'</b>: '+aurEsc(v.user||'—')+' → <b>'+aurEsc(nv)+'</b>\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}
function aurRename(F){
  const pk=aurVaultPick(F);if(!pk.one)return pk.many?aurChoose(pk.many,F,aurL('Qual?','Which one?'),e=>aurOpenEnt(e,F)):aurSay(aurL('Que entrada queres renomear?','Which entry do you want to rename?'));
  const v=pk.one.obj;const nv=(F.raw.match(/\b(?:para|to)\s+(.+?)\s*$/i)||[])[1];
  if(!nv)return aurSay(aurL('Para que nome? Ex.: "muda o nome do '+aurEsc(v.name)+' para Gmail Pessoal"','To what name? E.g. "rename '+aurEsc(v.name)+' to Personal Gmail"'));
  AUR.pending={ok:()=>{const old=v.name;v.name=aurCap(nv);aurLog('edit',v.name,'✏️');aurDirty();return aurSay(aurL('✓ «'+aurEsc(old)+'» passou a chamar-se <b>','✓ «'+aurEsc(old)+'» is now called <b>')+aurEsc(v.name)+'</b>.');}};
  return aurSay(aurL('Renomear <b>','Rename <b>')+aurEsc(v.name)+aurL('</b> para <b>','</b> to <b>')+aurEsc(aurCap(nv))+'</b>?',aurConfirmChips());
}
function aurEntryCard(v){
  const upd=v.pwUpdated?aurL(' · alterada ',' · changed ')+aurRel(new Date(v.pwUpdated)):'';
  return aurSay('🔑 <b>'+aurEsc(v.name)+'</b>'+(v.archived?' <span class="a-dim">'+aurL('(arquivado)','(archived)')+'</span>':'')+'\n'+(v.user?aurL('Utilizador: ','Username: ')+aurEsc(v.user)+'\n':'')+'Password: ●●●●●●●● · '+aurPwStrength(v.pw)+upd+(v.url?'\n'+aurL('Site: ','Site: ')+aurEsc(v.url):''),
   [{label:aurL('Copiar password','Copy password'),fn:()=>aurCopy(v.pw,aurL('Password copiada ✓','Password copied ✓'))},v.user?{label:aurL('Copiar utilizador','Copy username'),fn:()=>aurCopy(v.user,aurL('Utilizador copiado ✓','Username copied ✓'))}:null,{label:aurL('Mostrar','Show'),fn:()=>aurSay(aurL('Password de <b>','Password for <b>')+aurEsc(v.name)+'</b>: <span class="a-code">'+aurEsc(v.pw)+'</span>')},{label:aurL('Abrir','Open'),fn:()=>{if(typeof openReadMode==='function'){aurClose();openReadMode(v.id);}}},{label:aurL('Mudar password','Change password'),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:new Set()})}]);
}

/* ── abrir qualquer entidade ── */
function aurOpenEnt(e,F,open){
  const o=e.obj,nm=aurEsc(e.name);F=F||{c:new Set(),raw:''};
  switch(e.type){
    case 'vault':AUR.last=e;if(open&&typeof openReadMode==='function'&&!F.c.has('GET')){aurClose();openReadMode(o.id);return aurSay(aurL('🔑 Abri <b>','🔑 Opened <b>')+nm+'</b>.');}return aurEntryCard(o);
    case 'doc':aurTab('docs');if(typeof openDocPreview==='function'){aurClose();openDocPreview(o.id);}return aurSay(aurL('📄 Abri o documento <b>','📄 Opened the document <b>')+nm+'</b>.'+(o.expiry&&aurIsDate(new Date(o.expiry))?aurL(' Validade: ',' Expiry: ')+aurDate(o.expiry)+' ('+aurRel(o.expiry)+').':''));
    case 'store':if(typeof showBarcode==='function'){aurClose();showBarcode(o.id);}return aurSay(aurL('🎟️ Aqui está o cartão <b>','🎟️ Here’s the <b>')+nm+aurL('</b>.','</b> card.'));
    case 'bank':{if(open){aurTab('cards');aurClose();}return aurSay('💳 <b>'+nm+'</b>'+(o.bank&&o.bank!==e.name?' · '+aurEsc(o.bank):'')+(o.expiry?aurL('\nValidade: ','\nExpiry: ')+aurEsc(o.expiry):''),[{label:aurL('Abrir / editar','Open / edit'),fn:()=>{aurTab('cards');if(typeof openCardModal==='function'){aurClose();openCardModal(o.id);}}}]);}
    case 'totp':return aurTotpLocked()?aurNeed2fa(aurL('codigo ','code ')+e.name):aurShowCode(o);
    case 'wifi':if(typeof openWifiNetQR==='function'){aurClose();openWifiNetQR(o.id);}return aurSay(aurL('📶 QR do Wi-Fi <b>','📶 Wi-Fi QR for <b>')+nm+'</b>.',o.pw?[{label:aurL('Copiar password do Wi-Fi','Copy Wi-Fi password'),fn:()=>aurCopy(o.pw,aurL('Password do Wi-Fi copiada ✓','Wi-Fi password copied ✓'))}]:null);
    case 'note':aurTab('notes');if(typeof selectNote==='function'){aurClose();selectNote(o.id);}return aurSay(aurL('📝 Abri a nota <b>','📝 Opened the note <b>')+nm+'</b>.');
    case 'asset':aurTab(o.kind);if(typeof openAssetModal==='function'){aurClose();openAssetModal(o.kind,o.id);}return aurSay('🏠 '+aurL('Abri '+(o.kind?aurAssetLbl(o.kind):'o bem'),'Opened '+(o.kind?aurAssetLbl(o.kind):'asset'))+' <b>'+nm+'</b>.');
    case 'sub':return aurSubCard(o);
    case 'person':return aurPersonCard([o],null,true);
    case 'theme':return aurApplyTheme(o);
  }
  return aurSay(aurL('Não sei abrir esse tipo de item.','I don’t know how to open that kind of item.'));
}

/* ── Informação Pessoal ── */
function aurFieldRows(persons,F,all){
  const rows=[];const useLH=!F.fields.length;
  persons.forEach(p=>aurA(p&&p.fields).forEach(f=>{
    if(f.value==null||f.value==='')return;const lab=aurCanon(f.label||'');
    const ok=all||F.fields.some(q=>q.l.test(lab)&&!(q.k==='cc'&&/validade|expiry/.test(lab)))||(useLH&&F.labelHits.includes(f));
    if(ok)rows.push({p,f});
  }));return rows;
}
function aurPersonCard(persons,rows,all){
  rows=rows||[];if(!rows.length)persons.forEach(p=>aurA(p.fields).forEach(f=>{if(f.value!=null&&f.value!=='')rows.push({p,f});}));
  if(!rows.length)return aurSay('<b>'+aurEsc(persons.map(p=>p.name).join(', '))+aurL('</b> ainda não tem dados guardados.','</b> has no data saved yet.'),[{label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')}]);
  const multi=new Set(rows.map(r=>r.p)).size>1;let out='',cur=null;
  rows.forEach(r=>{if(r.p!==cur){cur=r.p;out+=(out?'\n':'')+'👤 <b>'+aurEsc(r.p.name)+'</b>\n';}out+='• '+aurEsc(r.f.label)+': <b>'+aurEsc(r.f.value)+'</b>\n';});
  const chips=rows.slice(0,14).map(r=>({label:aurL('Copiar ','Copy ')+r.f.label+(multi?' ('+String(r.p.name).split(' ')[0]+')':''),fn:()=>aurCopy(r.f.value,r.f.label+aurL(' copiado ✓',' copied ✓'))}));
  chips.push({label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')});
  return aurSay(out.trim(),chips);
}
function aurFieldLbl(fd){return aurAppLang()==='en'?fd.labelEn:fd.label;}
function aurInfo(F,quiet){
  const c=F.c;
  const P=aurA(typeof personalInfo!=='undefined'?personalInfo:[]).filter(p=>p&&Array.isArray(p.fields));
  const docEnt=F.cands.find(e=>e.type==='doc'&&e.score>=0.9);
  const docLike=F.fields.some(f=>['cc','carta','passaporte'].includes(f.k));
  if(docEnt&&docLike&&c.has('OPEN')&&!c.has('NUM')&&!c.has('COPY')&&!c.has('D_INFO')&&!c.has('GET'))return AUR_PASS;
  if(!F.fields.length&&!F.labelHits.length&&!c.has('D_INFO')&&!(F.best&&F.best.type==='person'))return AUR_PASS;
  if(!F.fields.length&&!F.labelHits.length&&!c.has('D_INFO')&&F.best&&F.best.type==='person'&&F.confident===false&&F.cands.filter(e=>e.score>=0.5).length>1)return AUR_PASS;
  if(!P.length){if(quiet)return AUR_PASS;return aurSay(aurL('Ainda não tens pessoas na aba Info.','You don’t have anyone in the Info tab yet.'),[{label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')}]);}
  let persons=F.persons.map(e=>e.obj);
  if(!persons.length&&c.has('MINE')){const o=aurOwner();if(o)persons=[o];}
  const all=c.has('ALL')||(!F.fields.length&&!F.labelHits.length);
  if(!persons.length)persons=all?[aurOwner()||P[0]]:P;
  const rows=aurFieldRows(persons,F,all);
  if(!rows.length){
    if(F.fields.some(f=>f.k==='matricula')){const V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle'&&a.plate);if(V.length)return aurSay('🚗 '+aurL('Matrícula','Licence plate')+(V.length>1?'s':'')+':\n'+V.map(v=>'• '+aurEsc(v.name)+': <b>'+aurEsc(v.plate)+'</b>').join('\n'),V.map(v=>({label:aurL('Copiar ','Copy ')+v.name,fn:()=>aurCopy(v.plate,aurL('Matrícula copiada ✓','Plate copied ✓'))})));}
    if(quiet)return AUR_PASS;
    const labels=[...new Set([].concat(...persons.map(p=>aurA(p.fields).map(f=>f.label))).filter(Boolean))];
    const want=F.fields.map(f=>aurL(f.label,f.labelEn)).join(', ')||aurL('esse dado','that detail');
    return aurSay(aurL('Não tenho '+aurEsc(want)+' guardado','I don’t have '+aurEsc(want)+' saved')+(persons.length===1?aurL(' para <b>',' for <b>')+aurEsc(persons[0].name)+'</b>':'')+'.'+(labels.length?aurL('\nDados disponíveis: ','\nAvailable details: ')+labels.map(aurEsc).join(', ')+'.':''),[F.fields.length?{label:aurL('Adicionar ','Add ')+aurL(F.fields[0].label,F.fields[0].labelEn),fn:()=>aurGoTab('info')}:null,{label:aurL('Ver tudo','See everything'),fn:()=>aurPersonCard(persons,null,true)}]);
  }
  if(rows.length===1&&!all){const r=rows[0];aurCopy(r.f.value,r.f.label+aurL(' copiado ✓',' copied ✓'));
    return aurSay(aurEsc(r.f.label)+aurL(' de <b>',' — <b>')+aurEsc(r.p.name)+'</b>:\n<span class="a-code">'+aurEsc(r.f.value)+'</span>\n<span class="a-dim">'+aurL('copiado para a área de transferência','copied to clipboard')+'</span>',[docEnt&&docLike?{label:aurL('Abrir o documento','Open the document'),fn:()=>aurOpenEnt(docEnt,F,true)}:null,{label:aurL('Info completa','Full info'),fn:()=>aurPersonCard([r.p],null,true)}]);}
  return aurPersonCard(persons,rows,all);
}
function aurFieldValue(F,fd){
  const m=F.raw.match(new RegExp(fd.rk.source+'\\s*(?:[:=]|é|e\\s|is\\s)?\\s*(.+)$','i'));if(!m)return '';
  let v=m[m.length-1].trim();const pm=v.match(/\b(?:para|to)\s+(.+)$/i);if(pm)v=pm[1].trim();
  v=v.replace(/^(?:number|numero|número|n[ºo]\.?|is|é)\s+/i,'');
  F.persons.forEach(pe=>{aurSig(aurNorm(pe.name)).forEach(t=>{v=v.replace(new RegExp('\\s+(?:d[aoe]s?|of|for)\\s+'+t+'\\b.*$','i'),'');});});
  v=v.replace(/\s+(por favor|pf|obrigad[oa]|please|thanks)$/i,'').replace(/^(o|a|do|da|de|meu|minha|my|the)\s+/i,'').replace(/[.;!?]+$/,'').trim();
  if(!v||(!/\d/.test(v)&&v.length<3))return '';
  if(aurSig(aurNorm(v)).every(t=>AUR_VOCAB[t]))return '';
  return v;
}
function aurInfoSet(F,change){
  const person=F.persons.length?F.persons[0].obj:aurOwner();
  if(!person){aurTab('info');aurClose();return aurSay(aurL('Abri a aba Info — cria primeiro uma pessoa em "+ Nova pessoa".','I opened the Info tab — first create a person with "+ New person".'));}
  const fd=F.fields[0];const val=fd?aurFieldValue(F,fd):'';
  if(!fd||!val){
    if(fd&&['cc','carta','passaporte'].includes(fd.k)&&!change)return aurSay(aurL('Queres guardar o <b>número</b> na Info, ou adicionar o <b>documento</b> (foto/scan)?','Do you want to save the <b>number</b> in Info, or add the <b>document</b> (photo/scan)?'),[{label:aurL('Número na Info','Number in Info'),fn:()=>aurGoTab('info')},{label:aurL('Documento','Document'),fn:()=>{aurTab('docs');if(typeof openDocModal==='function'){aurClose();openDocModal();}}}]);
    const lbl=fd?aurL(fd.label.toLowerCase(),fd.labelEn.toLowerCase()):aurL('nif','tax number');
    return aurSay(aurL('Diz-me o valor. Ex.: "'+(change?'muda o meu ':'adiciona o meu ')+lbl+(change?' para ':' ')+'123456789".','Tell me the value. E.g. "'+(change?'change my ':'add my ')+lbl+(change?' to ':' ')+'123456789".'),[{label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')}]);
  }
  const ex=aurA(person.fields).find(f=>fd.l.test(aurCanon(f.label||''))&&!(fd.k==='cc'&&/validade|expiry/.test(aurNorm(f.label))));
  const newLbl=aurFieldLbl(fd);
  AUR.pending={ok:()=>{if(ex)ex.value=val;else person.fields.push({id:Date.now().toString(36),label:newLbl,value:val});aurLog(ex?'edit':'add',person.name+' · '+(ex?ex.label:newLbl),'👤');aurDirty();return aurSay(aurL('✓ '+(ex?'Atualizei ':'Guardei '),'✓ '+(ex?'Updated ':'Saved '))+aurEsc(ex?ex.label:newLbl)+aurL(' de <b>',' for <b>')+aurEsc(person.name)+'</b>: '+aurEsc(val));}};
  return aurSay(aurL(ex?'Vou atualizar ':'Vou adicionar ',ex?'I’ll update ':'I’ll add ')+aurEsc(ex?ex.label:newLbl)+aurL(' de <b>',' for <b>')+aurEsc(person.name)+'</b>'+(ex?':\n'+aurEsc(ex.value)+' → <b>'+aurEsc(val)+'</b>':': <b>'+aurEsc(val)+'</b>')+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}
function aurInfoDelete(F){
  const persons=F.persons.length?F.persons.map(e=>e.obj):[aurOwner()].filter(Boolean);
  const rows=aurFieldRows(persons,F,false);
  if(!rows.length)return aurSay(aurL('Não encontrei esse dado na Info.','I couldn’t find that detail in Info.'));
  const r=rows[0];
  AUR.pending={ok:()=>{r.p.fields=aurA(r.p.fields).filter(f=>f!==r.f);aurLog('delete',r.p.name+' · '+r.f.label,'🗑️');aurDirty();return aurSay(aurL('🗑️ Removi ','🗑️ Removed ')+aurEsc(r.f.label)+aurL(' de <b>',' from <b>')+aurEsc(r.p.name)+'</b>.');}};
  return aurSay(aurL('Remover ','Remove ')+aurEsc(r.f.label)+' (<b>'+aurEsc(r.f.value)+'</b>)'+aurL(' de ',' from ')+aurEsc(r.p.name)+'?',[{label:aurL('Remover','Remove'),fn:aurYes,danger:true},{label:aurL('Cancelar','Cancel'),fn:aurNo}]);
}

/* ── adicionar ── */
function aurAdd(F){
  const c=F.c;
  if(F.fields.length&&!c.has('D_DOC'))return aurInfoSet(F,false);
  if(c.has('D_NOTE')){aurTab('notes');if(typeof newNote==='function'){aurClose();newNote();}return aurSay(aurL('📝 Abri uma nota nova — escreve à vontade.','📝 I opened a new note — write away.'));}
  if(c.has('D_DOC')){aurTab('docs');if(typeof openDocModal==='function'){aurClose();openDocModal();}return aurSay(aurL('📄 Abri o formulário de documento novo.','📄 I opened the new document form.'));}
  if(c.has('D_SUBS')){if(typeof openSubModal==='function'){aurClose();openSubModal();}return aurSay(aurL('🔁 Abri o formulário de nova subscrição.','🔁 I opened the new subscription form.'));}
  if(c.has('D_WIFI')){if(typeof openWifiManager==='function'){aurClose();openWifiManager();}return aurSay(aurL('📶 Abri as redes Wi-Fi — adiciona aí a nova rede.','📶 I opened your Wi-Fi networks — add the new one there.'));}
  if(c.has('D_FUEL')){aurTab('vehicle');aurClose();return aurSay(aurL('⛽ Abri os Veículos — regista o abastecimento no veículo.','⛽ I opened Vehicles — log the refuel on the vehicle.'));}
  const ak=c.has('D_WARRANTY')?'warranty':c.has('D_LICENSE')?'license':c.has('D_VEHICLE')?'vehicle':c.has('D_DATES')?'dates':c.has('D_ASSETS')?'warranty':null;
  if(ak==='dates'&&F.date)return aurSchedule(F);
  if(ak){aurTab(ak);if(typeof openAssetModal==='function'){aurClose();openAssetModal(ak);}return aurSay(aurL('🏠 Abri um registo novo de ','🏠 I opened a new ')+aurAssetLbl(ak)+aurL('.',' entry.'));}
  if(c.has('D_CARD')||c.has('D_BANK')||c.has('D_STORE')){
    const store=c.has('D_STORE')||(F.best&&F.best.type==='store');const bank=c.has('D_BANK')||(F.best&&F.best.type==='bank');
    const goS=()=>{aurTab('store');if(typeof openStoreModal==='function'){aurClose();openStoreModal();}return aurSay(aurL('🎟️ Abri o formulário de cartão de loja.','🎟️ I opened the store card form.'));};
    const goB=()=>{aurTab('cards');if(typeof openCardModal==='function'){aurClose();openCardModal();}return aurSay(aurL('💳 Abri o formulário de cartão bancário.','💳 I opened the bank card form.'));};
    if(store&&!bank)return goS();if(bank&&!store)return goB();
    return aurSay(aurL('Que tipo de cartão queres adicionar?','What kind of card do you want to add?'),[{label:aurL('💳 Bancário','💳 Bank card'),fn:goB},{label:aurL('🎟️ De loja','🎟️ Store card'),fn:goS}]);
  }
  if(c.has('D_INFO'))return aurInfoSet(F,false);
  if(c.has('SCHEDULE')||c.has('D_CAL')||F.date)return aurSchedule(F);
  const pk=aurVaultPick(F);
  const hasCreds=/@/.test(F.raw)||/\b(user|utilizador|username|login)\b/i.test(F.raw);
  if(c.has('D_PW')&&pk.one&&!hasCreds&&!/\b(adiciona|adicionar|cria|criar|regista|registar|insere|inserir|add|create|register|insert)\b/.test(F.n))return aurChangePwOn(pk.one.obj,F);
  return aurAddEntry(F);
}
function aurAddEntry(F){
  const raw=F.raw;
  const email=(raw.match(/([\w.+-]+@[\w-]+\.[\w.-]+)/)||[])[1]||'';
  let pm=raw.match(/\b(?:password|palavra[- ]?passe|senha|pass|pw)\s*(?:[:=]|é|e\s|is\s)?\s*([^\s,;]+)/i),pw='';
  if(pm){const w=aurNorm(pm[1]);if(/^(forte|segura|aleatoria|nova|gerada|memoravel|facil|do|da|de|para|com|e|o|a|strong|secure|random|new|generated|memorable|easy|for|with|and|the|to|of)$/.test(w))pm=null;else pw=pm[1];}
  const um=raw.match(/\b(?:utilizador|username|user|login|nome de utilizador)\s*(?:[:=]|é|e\s|is\s)?\s*([^\s,;]+)/i);
  let user=um?um[1]:'';if(!user&&email)user=email;
  let rest=' '+raw+' ';[email,pm?pm[0]:'',um?um[0]:''].forEach(x=>{if(x)rest=rest.split(x).join(' ');});
  const kept=rest.split(/\s+/).filter(w=>{const nw=aurNorm(w).replace(/[^a-z0-9]/g,'');if(!nw)return false;if(AUR_STOP.has(nw))return false;const v=AUR_VOCAB[nw];if(v&&v.some(x=>x==='ADD'||x==='D_VAULT'||x==='D_PW'||x==='D_EMAIL'||x==='MOD_STRONG'||x==='GEN'))return false;if(/^(com|password|palavra|passe|senha|chave|nova|novo|conta|acesso|servico|site|app|with|and|new|account|service)$/.test(nw))return false;return true;});
  let name=kept.join(' ').replace(/^[,.;:\-]+|[,.;:\-]+$/g,'').trim();
  if(!name&&email){const dm=email.split('@')[1].split('.')[0];name=aurCap(dm);}
  if(!name){AUR.pending={type:'askName',withText:(t)=>aurConfirmAdd({name:aurCap(t.trim()),user,pw})};return aurSay(aurL('Para que serviço é este acesso? (ex.: Netflix)','Which service is this account for? (e.g. Netflix)'));}
  name=name===name.toLowerCase()?aurCap(name):name;
  const dup=aurA(typeof vault!=='undefined'?vault:[]).find(v=>aurNorm(v.name)===aurNorm(name)&&(!user||aurNorm(v.user)===aurNorm(user)));
  if(dup)return aurSay(aurL('Já tens <b>','You already have <b>')+aurEsc(dup.name)+'</b>'+(dup.user?' ('+aurEsc(dup.user)+')':'')+aurL('. O que queres fazer?','. What would you like to do?'),[{label:aurL('Mudar a password desse','Change its password'),fn:()=>aurChangePwOn(dup,F)},{label:aurL('Criar outro na mesma','Create another anyway'),fn:()=>aurConfirmAdd({name,user,pw})},{label:aurL('Cancelar','Cancel'),fn:aurNo}]);
  return aurConfirmAdd({name,user,pw});
}
function aurConfirmAdd(d){
  let gen=false;if(!d.pw){d.pw=aurGenPw(20);gen=true;}
  AUR.pending={ok:()=>aurDoAdd(d)};
  return aurSay(aurL('Vou criar este acesso:\n• Serviço: <b>','I’ll create this account:\n• Service: <b>')+aurEsc(d.name)+aurL('</b>\n• Utilizador: ','</b>\n• Username: ')+(d.user?aurEsc(d.user):'—')+'\n• Password: '+(gen?'<span class="a-code">'+aurEsc(d.pw)+'</span> <span class="a-dim">'+aurL('(gerada)','(generated)')+'</span>':'●●●●●●●● <span class="a-dim">('+d.pw.length+aurL(' caracteres · ',' characters · ')+aurPwStrength(d.pw)+')</span>')+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}
function aurDoAdd(d){
  const e={id:Date.now().toString(36),name:d.name,cat:'',user:d.user||'',pw:d.pw,url:d.url||'',notes:'',tags:[],flag:'',fields:[],folderId:null,isWifi:false,attachments:[],fav:false,archived:false,icon:'',createdAt:Date.now(),order:aurA(typeof vault!=='undefined'?vault:[]).length,pwUpdated:Date.now(),pwHistory:[],reviewedAt:null};
  vault.push(e);aurLog('add',e.name,'✨');aurDirty();AUR.last={type:'vault',obj:e,name:e.name};
  return aurSay(aurL('✓ Criei o acesso <b>','✓ Created the account <b>')+aurEsc(e.name)+aurL('</b>. Não te esqueças de gravar.','</b>. Don’t forget to save.'),[{label:aurL('Copiar password','Copy password'),fn:()=>aurCopy(e.pw,aurL('Password copiada ✓','Password copied ✓'))},{label:aurL('Gravar agora','Save now'),fn:()=>{if(typeof saveFile==='function')saveFile();}},{label:aurL('Abrir','Open'),fn:()=>{if(typeof openReadMode==='function'){aurClose();openReadMode(e.id);}}}]);
}

/* ── agendar ── */
function aurSchedule(F){
  const d=F.date||aurParseDate(F.n);
  if(!d){AUR.pending={type:'askDate',withText:(t)=>aurHandle(F.raw+' '+t)};return aurSay(aurL('📅 Para que dia? (ex.: 15/03/2027, "amanhã", "dia 3 de maio", "daqui a 2 semanas")','📅 For which day? (e.g. 15/03/2027, "tomorrow", "3 May", "in 2 weeks")'));}
  const reason=aurReason(F.raw);
  const yearly=/\b(todos os anos|anualmente|cada ano|aniversario|anual|every year|yearly|annually|birthday|anniversary)\b/.test(F.n);
  if(!reason){AUR.pending={type:'askName',withText:(t)=>aurConfirmSchedule(aurCap(t.trim()),d,yearly)};return aurSay('📅 '+aurDate(d)+aurL(' — qual é o motivo do lembrete?',' — what’s the reminder for?'));}
  return aurConfirmSchedule(reason,d,yearly);
}
function aurConfirmSchedule(name,d,yearly){
  AUR.pending={ok:()=>{const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const a={id:Date.now().toString(36),kind:'dates',name,date:iso,yearly:!!yearly,notes:'',attachments:[]};assets.push(a);aurLog('add',name,'🎂');aurDirty();return aurSay(aurL('✓ Agendado: <b>','✓ Scheduled: <b>')+aurEsc(name)+aurL('</b> a ','</b> on ')+aurDate(d)+aurL('. Aparece no calendário e nos avisos.','. It shows up on the calendar and in the alerts.'),[{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);}};
  return aurSay(aurL('📅 Vou agendar:\n• <b>','📅 I’ll schedule:\n• <b>')+aurEsc(name)+'</b>\n• '+aurDate(d)+' ('+aurRel(d)+')'+(yearly?aurL(' · repete todos os anos',' · repeats every year'):'')+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}

/* ── apagar / arquivar / recuperar ── */
function aurPickOne(F,types){
  const cs=F.cands.filter(e=>e.score>=0.5&&(!types||types.includes(e.type)));
  if(cs.length===1||(cs.length>1&&cs[0].score-cs[1].score>=0.15))return {one:cs[0]};
  if(cs.length>1)return {many:cs};
  if(AUR.last&&/\b(essa|esse|isso|dela|dele|esta|este|it|that|this one)\b/.test(F.n))return {one:AUR.last};
  return {};
}
const AUR_DEL={vault:['deleteEntry','vault'],doc:['deleteDoc','documents'],bank:['deleteCard','bankCards'],store:['deleteStoreCard','storeCards'],wifi:['deleteWifiNet','wifiNets'],note:['deleteNoteById','notes'],asset:['deleteAsset','assets'],sub:['deleteSub','subscriptions'],totp:['deleteTotp','totp']};
function aurGlobal(n){switch(n){case 'vault':return typeof vault!=='undefined'?vault:undefined;case 'documents':return typeof documents!=='undefined'?documents:undefined;case 'bankCards':return typeof bankCards!=='undefined'?bankCards:undefined;case 'storeCards':return typeof storeCards!=='undefined'?storeCards:undefined;case 'wifiNets':return typeof wifiNets!=='undefined'?wifiNets:undefined;case 'notes':return typeof notes!=='undefined'?notes:undefined;case 'assets':return typeof assets!=='undefined'?assets:undefined;case 'subscriptions':return typeof subscriptions!=='undefined'?subscriptions:undefined;case 'totp':return typeof totp!=='undefined'?totp:undefined;case 'trash':return typeof trash!=='undefined'?trash:undefined;
  case 'deleteEntry':return typeof deleteEntry==='function'?deleteEntry:undefined;case 'deleteDoc':return typeof deleteDoc==='function'?deleteDoc:undefined;case 'deleteCard':return typeof deleteCard==='function'?deleteCard:undefined;case 'deleteStoreCard':return typeof deleteStoreCard==='function'?deleteStoreCard:undefined;case 'deleteWifiNet':return typeof deleteWifiNet==='function'?deleteWifiNet:undefined;case 'deleteNoteById':return typeof deleteNoteById==='function'?deleteNoteById:undefined;case 'deleteAsset':return typeof deleteAsset==='function'?deleteAsset:undefined;case 'deleteSub':return typeof deleteSub==='function'?deleteSub:undefined;case 'deleteTotp':return typeof deleteTotp==='function'?deleteTotp:undefined;
  case 'archiveEntry':return typeof archiveEntry==='function'?archiveEntry:undefined;case 'restoreEntry':return typeof restoreEntry==='function'?restoreEntry:undefined;case 'archiveDoc':return typeof archiveDoc==='function'?archiveDoc:undefined;case 'restoreDoc':return typeof restoreDoc==='function'?restoreDoc:undefined;case 'archiveCard':return typeof archiveCard==='function'?archiveCard:undefined;case 'restoreCard':return typeof restoreCard==='function'?restoreCard:undefined;case 'archiveNote':return typeof archiveNote==='function'?archiveNote:undefined;case 'restoreNote':return typeof restoreNote==='function'?restoreNote:undefined;}return undefined;}
function aurDelete(F){
  if(F.fields.length&&(F.c.has('D_INFO')||F.persons.length||F.c.has('MINE')))return aurInfoDelete(F);
  const pk=aurPickOne(F,Object.keys(AUR_DEL));
  if(pk.many)return aurChoose(pk.many,F,aurL('Qual queres apagar?','Which one do you want to delete?'),e=>aurDeleteEnt(e));
  if(!pk.one)return aurSay(aurL('O que queres apagar? Diz-me o nome — ex.: "apaga o acesso Netflix".','What do you want to delete? Tell me the name — e.g. "delete the Netflix account".'));
  return aurDeleteEnt(pk.one);
}
function aurDeleteEnt(e){
  if(e.type==='totp'&&aurTotpLocked())return aurNeed2fa(aurL('apaga o 2fa ','delete 2fa ')+e.name);
  const d=AUR_DEL[e.type];if(!d)return aurSay(aurL('Esse tipo de item não se apaga por aqui.','That kind of item can’t be deleted from here.'));
  const fn=aurGlobal(d[0]);if(typeof fn!=='function')return aurSay(aurL('Não consegui apagar.','I couldn’t delete it.'));
  const id=e.obj.id;fn(id);
  const still=aurA(aurGlobal(d[1])).some(x=>x&&x.id===id);
  if(still)return aurSay(aurL('Ficou tudo como estava.','Nothing was changed.'));
  if(AUR.last&&AUR.last.obj===e.obj)AUR.last=null;
  const inTrash=['vault','doc','note','bank'].includes(e.type);
  return aurSay('🗑️ <b>'+aurEsc(e.name)+aurL('</b> apagado','</b> deleted')+(inTrash?aurL(' — está na reciclagem se precisares.',' — it’s in the trash if you need it.'):'.'),[{label:aurL('Desfazer','Undo'),fn:()=>aurQuick(aurL('recupera ','restore ')+e.name)}]);
}
const AUR_ARCH={vault:['archiveEntry','restoreEntry'],doc:['archiveDoc','restoreDoc'],bank:['archiveCard','restoreCard'],note:['archiveNote','restoreNote']};
function aurArchive(F){
  const pk=aurPickOne(F,Object.keys(AUR_ARCH));
  if(pk.many)return aurChoose(pk.many,F,aurL('Qual queres arquivar?','Which one do you want to archive?'),e=>aurArchiveEnt(e));
  if(!pk.one){if(F.c.has('D_ARCHIVE')||!F.terms.length)return aurGoTab('archive');return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(F.terms.join(' '))+aurL('» para arquivar.','» to archive.'));}
  return aurArchiveEnt(pk.one);
}
function aurArchiveEnt(e){const fn=aurGlobal(AUR_ARCH[e.type][0]);if(typeof fn!=='function')return aurSay(aurL('Esse item não se arquiva.','That item can’t be archived.'));if(e.obj.archived)return aurSay('<b>'+aurEsc(e.name)+aurL('</b> já está arquivado.','</b> is already archived.'));fn(e.obj.id);return aurSay('📦 <b>'+aurEsc(e.name)+aurL('</b> foi para o Arquivo.','</b> was moved to the Archive.'),[{label:aurL('Desfazer','Undo'),fn:()=>{aurGlobal(AUR_ARCH[e.type][1])(e.obj.id);aurSay(aurL('↩️ Desarquivado.','↩️ Unarchived.'));}}]);}
function aurRestore(F){
  const TR=aurA(aurGlobal('trash'));
  const hits=[];TR.forEach(it=>{const d=(it&&it.data)||{};const nm=d.name||d.title||'';if(!nm)return;const nn=aurCanon(nm);const s=aurMatchEnt({toks:aurSig(nn),alias:[]},F.Q,F.Qset);if(s>=0.5)hits.push({it,nm,s});});
  hits.sort((a,b)=>b.s-a.s);
  const doR=h=>{const i=aurA(aurGlobal('trash')).indexOf(h.it);if(i<0)return aurSay(aurL('Esse item já não está na reciclagem.','That item is no longer in the trash.'));if(typeof restoreTrashItem==='function')restoreTrashItem(i);return aurSay(aurL('♻️ Recuperei <b>','♻️ Restored <b>')+aurEsc(h.nm)+aurL('</b> da reciclagem.','</b> from the trash.'));};
  if(hits.length===1||(hits.length>1&&hits[0].s-hits[1].s>=0.15))return doR(hits[0]);
  if(hits.length>1)return aurSay(aurL('Qual queres recuperar?','Which one do you want to restore?'),hits.slice(0,8).map(h=>({label:h.nm,fn:()=>doR(h)})));
  const ar=F.cands.filter(e=>e.archived&&e.score>=0.5&&AUR_ARCH[e.type]);
  if(ar.length){const e=ar[0];const fn=aurGlobal(AUR_ARCH[e.type][1]);if(typeof fn==='function'){fn(e.obj.id);return aurSay(aurL('📦↩️ Desarquivei <b>','📦↩️ Unarchived <b>')+aurEsc(e.name)+'</b>.');}}
  if(!TR.length)return aurSay(aurL('A reciclagem está vazia — não há nada para recuperar.','The trash is empty — there’s nothing to restore.'));
  if(!F.terms.length)return aurGoTab('trash');
  return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(F.terms.join(' '))+aurL('» na reciclagem nem no arquivo.','» in the trash or the archive.'),[{label:aurL('Abrir reciclagem','Open trash'),fn:()=>aurGoTab('trash')}]);
}
function aurEmptyTrash(){
  const TR=aurA(aurGlobal('trash'));if(!TR.length)return aurSay(aurL('A reciclagem já está vazia ✓','The trash is already empty ✓'));
  if(typeof emptyTrash==='function')emptyTrash();
  return aurSay(aurA(aurGlobal('trash')).length?aurL('Ficou tudo como estava.','Nothing was changed.'):aurL('🗑️ Reciclagem esvaziada ('+TR.length+' itens apagados definitivamente).','🗑️ Trash emptied ('+TR.length+' items permanently deleted).'));
}

/* ── copiar ── */
function aurCopyCmd(F){
  if(F.fields.length||F.labelHits.length){const r=aurInfo(F);if(r!==AUR_PASS)return r;}
  const pk=aurPickOne(F,['vault','totp','wifi','person','store']);
  if(pk.many)return aurChoose(pk.many,F,aurL('De qual?','Which one?'),e=>aurCopyEnt(e,F));
  if(!pk.one)return aurSay(aurL('O que queres copiar? Ex.: "copia a password do PayPal", "copia o meu NIF".','What do you want to copy? E.g. "copy the PayPal password", "copy my tax number".'));
  return aurCopyEnt(pk.one,F);
}
function aurCopyEnt(e,F){
  const o=e.obj;
  if(e.type==='vault'){const wantUser=F.c.has('D_EMAIL')&&!F.c.has('D_PW');const val=wantUser?o.user:o.pw;if(!val)return aurSay('<b>'+aurEsc(e.name)+aurL('</b> não tem '+(wantUser?'utilizador':'password')+' guardado.','</b> has no '+(wantUser?'username':'password')+' saved.'));aurCopy(val,wantUser?aurL('Utilizador copiado ✓','Username copied ✓'):aurL('Password copiada ✓','Password copied ✓'));AUR.last=e;return aurSay(aurL('📋 Copiei ','📋 Copied ')+(wantUser?aurL('o utilizador (','the username (')+aurEsc(o.user)+')':aurL('a password','the password'))+aurL(' de <b>',' for <b>')+aurEsc(e.name)+'</b>.'+(wantUser?'':' <span class="a-dim">'+aurL('Limpa-se sozinha do clipboard.','It clears itself from the clipboard.')+'</span>'));}
  if(e.type==='totp')return aurShowCode(o);
  if(e.type==='wifi'){if(!o.pw)return aurSay(aurL('Essa rede não tem password.','That network has no password.'));aurCopy(o.pw,aurL('Password do Wi-Fi copiada ✓','Wi-Fi password copied ✓'));return aurSay(aurL('📋 Copiei a password do Wi-Fi <b>','📋 Copied the Wi-Fi password for <b>')+aurEsc(e.name)+'</b>.');}
  if(e.type==='person')return aurPersonCard([o],null,true);
  return aurOpenEnt(e,F);
}

/* ── temas, privacidade, idioma, definições, exportar ── */
function aurApplyTheme(t){if(typeof applyThemePreset==='function'){applyThemePreset(t.id);return aurSay(aurL('🎨 Tema <b>','🎨 <b>')+(t.emoji?t.emoji+' ':'')+aurEsc(t.name)+aurL('</b> aplicado.','</b> theme applied.'));}return aurSay(aurL('Não consegui aplicar o tema.','I couldn’t apply the theme.'));}
function aurTheme(F){
  const TH=aurA(typeof THEME_PRESETS!=='undefined'?THEME_PRESETS:[]);
  const te=F.cands.find(e=>e.type==='theme'&&e.score>=0.5);if(te)return aurApplyTheme(te.obj);
  if(F.c.has('MOD_LIGHT')||F.c.has('MOD_DARK')){const dark=F.c.has('MOD_DARK');return aurSay(aurL('Temas '+(dark?'escuros':'claros')+' — toca para aplicar:',(dark?'Dark':'Light')+' themes — tap to apply:'),TH.filter(t=>!!t.dark===dark).map(t=>({label:(t.emoji||'')+' '+t.name,fn:()=>aurApplyTheme(t)})));}
  if(F.c.has('OPEN')&&!F.terms.length)return aurSettings('aspeto');
  return aurSay(aurL('🎨 Escolhe um tema:','🎨 Pick a theme:'),TH.map(t=>({label:(t.emoji||'')+' '+t.name,fn:()=>aurApplyTheme(t)})).concat([{label:aurL('Personalizar cores','Customise colours'),fn:()=>aurSettings('aspeto')}]));
}
function aurPriv(F){
  if(typeof togglePrivacy!=='function')return aurSay(aurL('O modo de privacidade não está disponível.','Privacy mode isn’t available.'));
  const on=typeof privacyOn!=='undefined'?!!privacyOn:null;
  if(F.c.has('ON')&&on===true)return aurSay(aurL('O modo de privacidade já está ativo 🙈','Privacy mode is already on 🙈'));
  if(F.c.has('OFF')&&on===false)return aurSay(aurL('O modo de privacidade já está desligado 👁️','Privacy mode is already off 👁️'));
  togglePrivacy();const now=typeof privacyOn!=='undefined'?!!privacyOn:!on;
  return aurSay(now?aurL('🙈 Modo de privacidade ativado — os valores ficam ocultos.','🙈 Privacy mode on — values are hidden.'):aurL('👁️ Modo de privacidade desligado.','👁️ Privacy mode off.'));
}
function aurLang(F){
  if(typeof setLang!=='function')return aurSay(aurL('Não consigo mudar o idioma.','I can’t change the language.'));
  const en=/\b(ingles|english|en)\b/.test(F.n);setLang(en?'en':'pt');
  return aurSay(en?aurL('🇬🇧 App agora em inglês. (Continuo a responder na língua em que me escreves.)','🇬🇧 App now in English.'):aurL('🇵🇹 App em português.','🇵🇹 App now in Portuguese. (I’ll keep replying in the language you write in.)'));
}
function aurSettings(tab,msg){
  if(typeof openSettings==='function'){aurClose();openSettings();if(tab&&typeof switchSettingsTab==='function')switchSettingsTab(tab);}
  const L={aspeto:['Aspeto','Appearance'],seguranca:['Segurança','Security'],dados:['Dados','Data'],heranca:['Herança Digital','Digital legacy'],sobre:['Sobre','About']};
  return aurSay(msg||(aurL('⚙️ Abri as Definições','⚙️ Opened Settings')+(tab&&L[tab]?' → '+aurL(L[tab][0],L[tab][1]):'')+'.'));
}
function aurExport(F){
  if(F.c.has('D_PDF')&&typeof exportPDF==='function'){exportPDF();return aurSay(aurL('📄 A exportar para PDF…','📄 Exporting to PDF…'));}
  if(F.c.has('D_CSV')&&typeof exportCSV==='function'){exportCSV();return aurSay(aurL('📊 A exportar para CSV…','📊 Exporting to CSV…'));}
  return aurSay(aurL('Em que formato?','Which format?'),[{label:'PDF',fn:()=>{exportPDF();aurSay(aurL('📄 A exportar para PDF…','📄 Exporting to PDF…'));}},{label:'CSV',fn:()=>{exportCSV();aurSay(aurL('📊 A exportar para CSV…','📊 Exporting to CSV…'));}}]);
}

/* ── dinheiro, combustível, contagens, wifi, listas ── */
function aurPerMonth(){return aurL('/mês','/month');}
function aurSubCard(s){
  let m=0;try{m=subMonthly(s)||0;}catch(e){}
  let nx=null;try{nx=typeof subNextCharge==='function'?subNextCharge(s):null;}catch(e){}
  const cyc=s.cycle==='yearly'?aurL('anual','yearly'):s.cycle==='monthly'?aurL('mensal','monthly'):s.cycle;
  return aurSay('🔁 <b>'+aurEsc(s.name)+'</b>\n'+aurL('Valor: <b>','Price: <b>')+aurMoney(s.amount)+'</b>'+(cyc?' ('+aurEsc(cyc)+')':'')+' · ≈ '+aurMoney(m)+aurPerMonth()+' · '+aurMoney(m*12)+aurL('/ano','/year')+(aurIsDate(nx)?aurL('\nPróxima cobrança: ','\nNext charge: ')+aurDate(nx)+' ('+aurRel(nx)+')':''),[{label:aurL('Gerir subscrições','Manage subscriptions'),fn:()=>{if(typeof openSubsScreen==='function'){aurClose();openSubsScreen();}}}]);
}
function aurSubs(F){
  const S=aurA(typeof subscriptions!=='undefined'?subscriptions:[]);
  if(F.confident&&F.best.type==='sub')return aurSubCard(F.best.obj);
  if(!S.length)return aurSay(aurL('Não tens subscrições registadas.','You don’t have any subscriptions saved.'),[{label:aurL('Adicionar subscrição','Add subscription'),fn:()=>{if(typeof openSubModal==='function'){aurClose();openSubModal();}}}]);
  let tot=0;const rows=S.map(s=>{let m=0;try{m=subMonthly(s)||0;}catch(e){}tot+=m;return {s,m};}).sort((a,b)=>b.m-a.m);
  const manage={label:aurL('Gerir subscrições','Manage subscriptions'),fn:()=>{if(typeof openSubsScreen==='function'){aurClose();openSubsScreen();}}};
  if(F.c.has('OPEN')&&!F.c.has('HOWMUCH')){if(typeof openSubsScreen==='function'){aurClose();openSubsScreen();}return aurSay(aurL('🔁 Abri as tuas subscrições.','🔁 I opened your subscriptions.'));}
  if(F.c.has('HOWMUCH')||F.c.has('D_MONEY'))return aurSay(aurL('🔁 Gastas <b>','🔁 You spend <b>')+aurMoney(tot)+aurPerMonth()+aurL('</b> em subscrições (≈ ','</b> on subscriptions (≈ ')+aurMoney(tot*12)+aurL('/ano) — ','/year) — ')+S.length+aurL(' ativas.\nMais caras: ',' active.\nMost expensive: ')+rows.slice(0,3).map(r=>aurEsc(r.s.name)+' ('+aurMoney(r.m)+aurPerMonth()+')').join(', ')+'.',[{label:aurL('Ver todas','See all'),fn:()=>aurQ('lista as subscricoes','list my subscriptions')},manage]);
  return aurSay('🔁 <b>'+aurL('Subscrições','Subscriptions')+'</b> ('+S.length+') · '+aurMoney(tot)+aurPerMonth()+'\n'+rows.map(r=>'• '+aurEsc(r.s.name)+' — '+aurMoney(r.m)+aurPerMonth()).join('\n'),[manage]);
}
function aurFuel(F){
  let V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle');
  if(F.confident&&F.best.type==='asset'&&F.best.obj.kind==='vehicle')V=[F.best.obj];
  if(!V.length)return aurSay(aurL('Ainda não tens veículos em Bens.','You don’t have any vehicles in Assets yet.'),[{label:aurL('Adicionar veículo','Add vehicle'),fn:()=>{aurTab('vehicle');if(typeof openAssetModal==='function'){aurClose();openAssetModal('vehicle');}}}]);
  const L=V.map(v=>{const f=aurA(v.fuel);if(!f.length)return '🚗 <b>'+aurEsc(v.name)+aurL('</b>: sem abastecimentos registados','</b>: no refuels logged');let s=null;try{s=fuelStats(f);}catch(e){}if(!s)return '🚗 <b>'+aurEsc(v.name)+aurL('</b>: não consegui calcular','</b>: I couldn’t calculate it');
    return '🚗 <b>'+aurEsc(v.name)+'</b>'+(v.plate?' ('+aurEsc(v.plate)+')':'')+aurL('\n   Consumo médio: <b>','\n   Average consumption: <b>')+(s.avg!=null&&isFinite(s.avg)?s.avg.toFixed(1)+' L/100km':aurL('— (precisa de 2 depósitos cheios)','— (needs 2 full tanks)'))+aurL('</b>\n   Custo: ','</b>\n   Cost: ')+(s.eurPer100!=null&&isFinite(s.eurPer100)?aurMoney(s.eurPer100)+'/100 km':'—')+' · '+(s.perMonth!=null&&isFinite(s.perMonth)?aurMoney(s.perMonth)+aurPerMonth():'—')+'\n   Total: '+aurMoney(s.eurTotal||0)+' · '+(+s.litTotal||0).toFixed(0)+' L · '+(+s.kmTotal||0).toFixed(0)+' km';});
  return aurSay(aurL('⛽ <b>Combustível</b>\n','⛽ <b>Fuel</b>\n')+L.join('\n'),[{label:aurL('Abrir veículos','Open vehicles'),fn:()=>aurGoTab('vehicle')}]);
}
function aurCount(F){
  const c=F.c,n=x=>aurA(x).filter(i=>i&&!i.archived).length;
  const V=aurGlobal('vault'),Dc=aurGlobal('documents'),SC=aurGlobal('storeCards'),BC=aurGlobal('bankCards'),N=aurGlobal('notes'),SB=aurGlobal('subscriptions'),W=aurGlobal('wifiNets'),AS=aurGlobal('assets');
  const PI=typeof personalInfo!=='undefined'?personalInfo:[];
  const say=(num,pt,en)=>aurSay(aurL('Tens <b>'+num+'</b> '+pt+'.','You have <b>'+num+'</b> '+en+'.'));
  if(c.has('D_PW')||c.has('D_VAULT')){const arch=aurA(V).length-n(V);return aurSay(aurL('Tens <b>'+n(V)+'</b> acessos guardados','You have <b>'+n(V)+'</b> saved accounts')+(arch>0?aurL(' (+'+arch+' arquivados)',' (+'+arch+' archived)'):'')+'.');}
  if(c.has('D_DOC'))return say(n(Dc),'documentos','documents');
  if(c.has('D_STORE'))return say(n(SC),'cartões de loja','store cards');
  if(c.has('D_BANK')||c.has('D_CARD'))return aurSay(aurL('Cartões bancários: <b>'+n(BC)+'</b> · de loja: <b>'+n(SC)+'</b>.','Bank cards: <b>'+n(BC)+'</b> · store cards: <b>'+n(SC)+'</b>.'));
  if(c.has('D_NOTE'))return say(n(N),'notas','notes');
  if(c.has('D_SUBS'))return say(n(SB),'subscrições','subscriptions');
  if(c.has('D_WIFI'))return say(n(W),'redes Wi-Fi','Wi-Fi networks');
  if(c.has('D_INFO'))return say(n(PI),'pessoas na Info','people in Info');
  if(c.has('D_TRASH'))return aurSay(aurL('A reciclagem tem <b>'+aurA(aurGlobal('trash')).length+'</b> itens.','The trash has <b>'+aurA(aurGlobal('trash')).length+'</b> items.'));
  const kinds={D_WARRANTY:'warranty',D_LICENSE:'license',D_VEHICLE:'vehicle',D_DATES:'dates'};
  for(const k in kinds)if(c.has(k)){const q=aurA(AS).filter(a=>a.kind===kinds[k]).length;const pl={warranty:['garantias','warranties'],license:['licenças','licences'],vehicle:['veículos','vehicles'],dates:['datas importantes','important dates']}[kinds[k]];return say(q,pl[0],pl[1]);}
  return aurSummary();
}
function aurWifi(F){
  const W=aurA(aurGlobal('wifiNets'));
  if(!W.length)return aurSay(aurL('Ainda não tens redes Wi-Fi guardadas.','You don’t have any Wi-Fi networks saved yet.'),[{label:aurL('Adicionar rede','Add network'),fn:()=>{if(typeof openWifiManager==='function'){aurClose();openWifiManager();}}}]);
  if(W.length===1)return aurOpenEnt({type:'wifi',obj:W[0],name:W[0].name||W[0].ssid},F,true);
  return aurSay(aurL('📶 Qual rede?','📶 Which network?'),W.map(w=>({label:w.name||w.ssid,fn:()=>aurOpenEnt({type:'wifi',obj:w,name:w.name||w.ssid},F,true)})).concat([{label:aurL('Gerir redes','Manage networks'),fn:()=>{if(typeof openWifiManager==='function'){aurClose();openWifiManager();}}}]));
}
function aurList(F){
  const c=F.c;let items=[],title='';
  const mk=(type,arr,nm)=>aurA(arr).filter(x=>x&&!x.archived).map(o=>({type,obj:o,name:nm(o)||aurL('(sem nome)','(no name)')}));
  if(c.has('D_PW')||c.has('D_VAULT')){items=mk('vault',aurGlobal('vault'),o=>o.name);title=aurL('🔑 Acessos','🔑 Accounts');}
  else if(c.has('D_DOC')){items=mk('doc',aurGlobal('documents'),o=>o.title||o.name);title=aurL('📄 Documentos','📄 Documents');}
  else if(c.has('D_NOTE')){items=mk('note',aurGlobal('notes'),o=>o.title);title=aurL('📝 Notas','📝 Notes');}
  else if(c.has('D_STORE')){items=mk('store',aurGlobal('storeCards'),o=>o.name);title=aurL('🎟️ Cartões de loja','🎟️ Store cards');}
  else if(c.has('D_BANK')||c.has('D_CARD')){items=mk('bank',aurGlobal('bankCards'),o=>o.name||o.bank);title=aurL('💳 Cartões bancários','💳 Bank cards');}
  else if(c.has('D_WIFI')){items=mk('wifi',aurGlobal('wifiNets'),o=>o.name||o.ssid);title=aurL('📶 Redes Wi-Fi','📶 Wi-Fi networks');}
  else if(c.has('D_INFO')){items=mk('person',typeof personalInfo!=='undefined'?personalInfo:[],o=>o.name);title=aurL('👤 Pessoas','👤 People');}
  else{const kinds={D_WARRANTY:'warranty',D_LICENSE:'license',D_VEHICLE:'vehicle',D_DATES:'dates'};const T={warranty:['🏠 Garantias','🏠 Warranties'],license:['🏠 Licenças','🏠 Licences'],vehicle:['🏠 Veículos','🏠 Vehicles'],dates:['🏠 Datas importantes','🏠 Important dates']};for(const k in kinds)if(c.has(k)){items=aurA(aurGlobal('assets')).filter(a=>a.kind===kinds[k]).map(o=>({type:'asset',obj:o,name:o.name}));title=aurL(T[kinds[k]][0],T[kinds[k]][1]);}}
  if(!title)return AUR_PASS;
  if(!items.length)return aurSay(title+aurL(': ainda não tens nenhum.',': none yet.'));
  return aurSay(title+' ('+items.length+aurL(') — toca para abrir:',') — tap to open:'),items.slice(0,24).map(e=>({label:aurEntLabel(e),fn:()=>aurOpenEnt(e,F,true)})));
}
function aurEmails(){
  const set=[...new Set(aurA(aurGlobal('vault')).map(v=>(v.user||'').trim()).filter(u=>/@/.test(u)))];
  if(!set.length)return aurSay(aurL('Não encontrei emails nos teus acessos.','I didn’t find any emails in your accounts.'));
  return aurSay(aurL('📧 Emails usados nos teus acessos — toca para copiar:','📧 Emails used in your accounts — tap to copy:'),set.slice(0,12).map(u=>({label:u,fn:()=>aurCopy(u,aurL('Email copiado ✓','Email copied ✓'))})));
}

/* ── procura livre (último recurso — nunca fica sem resposta útil) ── */
function aurFind(F,tab){
  const terms=F.terms;
  if(!terms.length)return aurSay(aurL('Diz-me um pouco mais — por exemplo:','Tell me a bit more — for example:'),aurQuickChips().concat([{label:aurL('Tudo o que sei fazer','Everything I can do'),fn:aurHelp}]));
  const q=terms.join(' ');const E=aurIndex();
  let hits=F.cands.filter(e=>e.score>=0.34&&e.type!=='theme');
  const seen=new Set(hits.map(h=>h.obj));
  E.forEach(e=>{if(seen.has(e.obj)||e.type==='theme')return;if(e.extra&&terms.some(t=>t.length>=3&&e.extra.indexOf(t)>=0)){hits.push(Object.assign({},e,{score:0.3}));seen.add(e.obj);}});
  const infoRows=[];aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>aurA(p&&p.fields).forEach(f=>{const hay=aurNorm((f.label||'')+' '+(f.value||''));if(terms.some(t=>t.length>=3&&hay.indexOf(t)>=0))infoRows.push({p,f});}));
  if(hits.length===1&&hits[0].score>=0.5&&!infoRows.length)return aurOpenEnt(hits[0],F,true);
  if(hits.length||infoRows.length){const ch=hits.slice(0,8).map(e=>({label:aurEntLabel(e),fn:()=>aurOpenEnt(e,F,true)}));infoRows.slice(0,4).forEach(r=>ch.push({label:r.f.label+' · '+String(r.p.name).split(' ')[0],fn:()=>aurPersonCard([r.p],[r],false)}));return aurSay(aurL('Encontrei isto sobre «','Here’s what I found for «')+aurEsc(q)+'»:',ch);}
  const near=[];const used=new Set();
  E.forEach(e=>{if(e.type==='theme')return;let bd=99;e.toks.forEach(t=>terms.forEach(x=>{if(x.length>=3&&t.length>=3){const d=aurLev(x,t);if(d<bd)bd=d;}}));const lim=Math.max(2,Math.floor(Math.max(...e.toks.map(t=>t.length))/3));if(bd<=lim&&!used.has(e.obj)){near.push({e,d:bd});used.add(e.obj);}});
  near.sort((a,b)=>a.d-b.d);
  if(near.length)return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(q)+aurL('». Querias dizer:','». Did you mean:'),near.slice(0,6).map(x=>({label:aurEntLabel(x.e),fn:()=>aurOpenEnt(x.e,F,true)})));
  return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(q)+aurL('» em nenhuma parte do cofre (passwords, 2FA, documentos, cartões, notas, Info, bens, subscrições, Wi-Fi).','» anywhere in your vault (passwords, 2FA, documents, cards, notes, Info, assets, subscriptions, Wi-Fi).'),[tab?{label:aurL('Abrir ','Open ')+aurTabShort(tab),fn:()=>aurGoTab(tab)}:null,{label:aurL('Tudo o que sei fazer','Everything I can do'),fn:aurHelp}]);
}
/* ═══════════ INTERFACE ═══════════ */
const AUR_SVG={
 spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
 reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
 chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
};
function aurGreet(){
  AUR.lang=aurAppLang();
  const nm=typeof vaultName!=='undefined'&&vaultName?', '+aurEsc(String(vaultName).split(' ')[0]):'';
  const ex=aurGreetExamples();
  const chips=ex.list.map(x=>({label:x[0],fn:()=>aurQuick(x[1])}));
  const foot=ex.fresh?aurL('Também podes escrever o que precisares — percebo português e inglês.','You can also type what you need — I understand English and Portuguese.'):aurL('O que perguntares, eu procuro no teu cofre — também percebo inglês.','Whatever you ask, I’ll look it up in your vault — I understand Portuguese too.');
  const msg=ex.fresh?aurL('Olá'+nm+'! Sou a <b>Aurora</b> ✨ Vou ajudar-te a começar.\nExperimenta:','Hi'+nm+'! I’m <b>Aurora</b> ✨ I’ll help you get started.\nTry:'):aurL('Olá'+nm+'! Sou a <b>Aurora</b> ✨ Conheço o teu cofre e trabalho 100% offline.\nExperimenta:','Hi'+nm+'! I’m <b>Aurora</b> ✨ I know your vault and work 100% offline.\nTry:');
  aurSay(msg,chips);
  const last=[...document.querySelectorAll('#aurora-msgs .aurora-msg.ai')].pop();
  if(last){const f=document.createElement('div');f.className='a-dim';f.style.marginTop='8px';f.textContent=foot;last.appendChild(f);}
}
/* 3 exemplos tirados do cofre de cada pessoa (nunca sugere o que a pessoa não tem) */
function aurGreetExamples(){
  const L=(pt,en)=>aurL(pt,en),out=[];
  const V=(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived&&v.name);
  const D=typeof documents!=='undefined'?documents:[],C=typeof bankCards!=='undefined'?bankCards:[],N=typeof notes!=='undefined'?notes:[];
  const T=(!aurTotpLocked()&&typeof totp!=='undefined'&&Array.isArray(totp))?totp.filter(Boolean):[];
  const fresh=!V.length&&!D.length&&!C.length&&!N.length&&!T.length;
  if(fresh)return {fresh:true,list:[
    ['🔑 '+L('Guarda a password do email','Save my email password'),L('guarda a password do email','save my email password')],
    ['✨ '+L('Gera uma password forte','Generate a strong password'),L('gera uma password forte','generate a strong password')],
    ['🎓 '+L('Mostra-me como funciona','Show me how it works'),L('mostra-me como funciona','show me around')]]};
  const tn=T.map(x=>x.issuer||x.name||x.label||'').find(s=>s&&String(s).trim());
  if(tn)out.push(['🔢 '+L('Código 2FA · ','2FA code · ')+tn,L('código de '+tn,tn+' code')]);
  try{const now=new Date(),y=now.getFullYear(),m=now.getMonth(),today=now.toISOString().slice(0,10);
    const t0=new Date(now);t0.setHours(0,0,0,0);
    if(aurEvents().some(ev=>{const v=ev.date;let dt=v instanceof Date?new Date(v.getTime()):(/^\d{4}-\d\d-\d\d/.test(String(v))?new Date(String(v).slice(0,10)+'T00:00:00'):new Date(v));if(isNaN(dt))return false;dt.setHours(0,0,0,0);return dt>=t0&&dt.getFullYear()===y&&dt.getMonth()===m;}))out.push(['⏳ '+L('O que expira este mês','What expires this month'),L('o que expira este mês','what expires this month')]);}catch(e){}
  try{const P=typeof personalInfo!=='undefined'?personalInfo:[];if(P.some(p=>(p.fields||[]).some(f=>f&&f.value&&/\b(nif|contribuinte|tax)\b/i.test(aurNorm(f.label||'')))))out.push(['🪪 '+L('Qual o meu NIF','What’s my tax number'),L('qual o meu nif','what is my tax number')]);}catch(e){}
  if(out.length<3&&V.length){const v=V.slice().sort((a,b)=>(b.fav?1:0)-(a.fav?1:0)||((b.pwUpdated||b.updatedAt||b.createdAt||0)-(a.pwUpdated||a.updatedAt||a.createdAt||0)))[0];
    out.push(['🔑 Password · '+v.name,L('password de '+v.name,v.name+' password')]);}
  if(out.length<3)out.push(['✨ '+L('Gera uma password forte','Generate a strong password'),L('gera uma password forte','generate a strong password')]);
  if(out.length<3)out.push(['📊 '+L('Resumo do cofre','Vault summary'),L('resumo do cofre','vault summary')]);
  return {fresh:false,list:out.slice(0,3)};
}

let aurUILangNow='';
function aurUILang(){
  if(typeof document==='undefined')return;const en=aurAppLang()==='en';aurUILangNow=aurAppLang();
  const set=(sel,prop,val)=>{const el=document.querySelector(sel);if(el)el[prop]=val;};
  set('#aurora-panel .a-ttl span','innerHTML','<i></i>'+(en?'100% offline':'100% offline')+'<em class="a-sub2" style="font-style:normal">&nbsp;· '+(en?'your vault':'o teu cofre')+'</em>');
  set('#aurora-input','placeholder',en?'Ask me anything about your vault…':'Pede-me qualquer coisa do cofre…');
  const T=[['.a-hbtn[data-k="reset"]',en?'New conversation':'Nova conversa'],['.a-hbtn[data-k="min"]',en?'Minimise':'Minimizar'],['.a-hbtn[data-k="close"]',en?'Close':'Fechar'],['#aurora-send',en?'Send':'Enviar'],['#aurora-fab',en?'Open Aurora AI':'Abrir a Aurora AI']];
  T.forEach(([sel,t])=>{const el=document.querySelector(sel);if(el){el.title=t;el.setAttribute('aria-label',t);}});
}
function auroraOpen(){
  if(typeof masterKey==='undefined'||!masterKey){if(typeof toast==='function')toast(aurAppLang()==='en'?'Unlock the vault first.':'Desbloqueia o cofre primeiro.');return;}
  aurUILang();
  const p=document.getElementById('aurora-panel');if(!p)return;
  p.classList.add('open');p.classList.remove('min','has-new');document.body.classList.add('aur-docked');aurFab();
  const m=document.getElementById('aurora-msgs');if(m&&!m.dataset.greeted){m.dataset.greeted='1';aurGreet();}
  setTimeout(()=>{const i=document.getElementById('aurora-input');if(i)try{i.focus({preventScroll:true});}catch(e){i.focus();}},260);
}
function auroraClose(){aurClose(true);}
function auroraToggleMin(){const p=document.getElementById('aurora-panel');if(!p)return;if(!p.classList.contains('open'))return auroraOpen();if(p.classList.contains('min'))p.classList.remove('min','has-new');else p.classList.add('min');}
function auroraReset(){const m=document.getElementById('aurora-msgs');if(m){m.innerHTML='';m.dataset.greeted='1';}AUR.pending=null;AUR.last=null;AUR.resume=null;AUR.acts=[];aurGreet();}
function auroraSend(){
  const i=document.getElementById('aurora-input');if(!i)return;const txt=(i.value||'').trim();if(!txt)return;i.value='';
  const p=document.getElementById('aurora-panel');if(p)p.classList.remove('min','has-new');
  AUR.hist.push(txt);if(AUR.hist.length>50)AUR.hist.shift();AUR.hIdx=AUR.hist.length;
  AUR.out(aurEsc(txt),'me');const typing=AUR.out('<span class="a-typing"><i></i><i></i><i></i></span>','ai typing');
  setTimeout(()=>{if(typing&&typing.remove)typing.remove();try{aurHandle(txt);}catch(e){aurSay(aurL('Tive um problema a processar isso (','I had a problem processing that (')+aurEsc(e.message)+aurL('). Tenta de outra forma ou escreve <b>ajuda</b>.','). Try another way or type <b>help</b>.'));}},260);
}
/* ideias que se escrevem sozinhas na caixa do Dashboard (tiradas do próprio cofre) */
function aurLaunchIdeas(){
  const en=aurAppLang()==='en';
  const I=[en?'How can I help?':'Em que posso ajudar?'];
  try{const T=aurA(typeof totp!=='undefined'?totp:[]);if(T[0]&&T[0].name)I.push((en?'Code for ':'Código da ')+T[0].name);}catch(e){}
  I.push(en?'What expires this month?':'O que expira este mês?',en?'What’s my tax number?':'Qual o meu NIF?');
  try{const D=aurA(typeof documents!=='undefined'?documents:[]);if(D[0]&&(D[0].title||D[0].name))I.push((en?'Open ':'Abre o ')+(D[0].title||D[0].name));}catch(e){}
  I.push(en?'How much do I spend on subscriptions?':'Quanto gasto em subscrições?',en?'Generate a strong password':'Gera uma password forte');
  return I;
}
(function aurTypewriter(){
  if(typeof document==='undefined')return;
  const still=typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let k=0,j=0,del=false,ideas=aurLaunchIdeas(),tl=aurAppLang();
  function tick(){
    const el=document.getElementById('aur-launch-ph');let wait=80;
    if(tl!==aurAppLang()){tl=aurAppLang();ideas=aurLaunchIdeas();k=0;j=0;del=false;}
    if(el&&!document.hidden){
      if(still){el.textContent=ideas[0];wait=4000;}
      else{const w=ideas[k%ideas.length];
        if(!del){j++;el.textContent=w.slice(0,j);if(j>=w.length){del=true;wait=k===0?3400:2200;}else wait=55+Math.random()*45;}
        else{j--;el.textContent=w.slice(0,Math.max(0,j));if(j<=0){del=false;k++;if(k%ideas.length===0){ideas=aurLaunchIdeas();k=0;}wait=420;}else wait=28;}}
    }else wait=600;
    setTimeout(tick,wait);
  }
  setTimeout(tick,900);
})();
(function aurInit(){
  if(typeof document==='undefined'||!document.body)return;
  const G='#00e6a8,#1fb6ff,#7b5cff,#ff5fb8,#ffcf5a,#00e6a8';
  const css=':root{--aur-w:400px}'
  +'@keyframes aurFlow{0%{background-position:0% 50%}100%{background-position:300% 50%}}'
  +'@keyframes aurFlowY{0%{background-position:50% 0%}100%{background-position:50% 300%}}'
  +'@keyframes aurBreath{0%,100%{opacity:.34;transform:scale(1)}50%{opacity:.68;transform:scale(1.025)}}'
  +'@keyframes aurDrift{0%,100%{transform:translateX(-18%) skewX(-10deg)}50%{transform:translateX(14%) skewX(-4deg)}}'
  +'@keyframes aurCaret{0%,49%{opacity:1}50%,100%{opacity:0}}'
  +'@keyframes aurSpark{0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(16deg) scale(1.14)}}'
  +'@keyframes aurDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}'
  /* anel aurora (contorno a fluir + brilho a respirar). O contorno avança aos degraus (20/s, igual à vista):
     a fluir contínuo obrigava a redesenhar a página 60×/s; o brilho desfocado só respira (feito pela placa gráfica) */
  +'.aur-ring{position:relative;isolation:isolate;border-radius:16px;padding:1.6px;background:linear-gradient(110deg,'+G+');background-size:300% 100%;animation:aurFlow 9s steps(180) infinite}'
  +'.aur-ring::before{content:"";position:absolute;inset:-7px 3px;border-radius:24px;background:linear-gradient(110deg,'+G+');background-size:300% 100%;animation:aurBreath 5s ease-in-out infinite;filter:blur(18px);z-index:-1;pointer-events:none;will-change:opacity,transform}'
  +'.aur-ring:hover::before,.aur-ring:focus-within::before{opacity:.9}'
  /* caixa do Dashboard */
  +'.dash-greeting{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px 30px}'
  +'.dash-greet-left{min-width:0;flex:0 1 auto}'
  +'.aur-launch{flex:1 1 360px;min-width:0;max-width:560px;box-sizing:border-box;cursor:pointer;outline:none;transition:transform .25s}'
  +'.aur-launch:hover{transform:translateY(-1px)}'
  +'.aur-launch-in{position:relative;overflow:hidden;min-width:0;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-radius:14.5px;background:var(--panel)}'
  +'.aur-launch-in::before{content:"";position:absolute;inset:-60% -20%;background:radial-gradient(38% 55% at 18% 50%,rgba(0,230,168,.24),transparent 70%),radial-gradient(34% 55% at 52% 45%,rgba(123,92,255,.22),transparent 70%),radial-gradient(30% 50% at 84% 58%,rgba(31,182,255,.2),transparent 70%);animation:aurDrift 13s ease-in-out infinite;pointer-events:none}'
  +'.aur-launch-in>*{position:relative}'
  +'.aur-launch-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#5ef2c9;background:linear-gradient(135deg,rgba(0,230,168,.2),rgba(123,92,255,.26));box-shadow:inset 0 0 0 1px rgba(94,242,201,.25)}'
  +'.aur-launch-ico svg{width:19px;height:19px;animation:aurSpark 3.4s ease-in-out infinite}'
  +'.aur-launch-txt{flex:1;min-width:0;font-size:.85rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  +'.aur-launch-txt b{color:var(--text);font-weight:600;letter-spacing:.3px}'
  +'.aur-caret{display:inline-block;width:1.5px;height:1.05em;background:var(--accent);margin-left:2px;vertical-align:-2px;animation:aurCaret 1s step-end infinite}'
  +'.aur-launch-go{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:0 0 auto;background:var(--accent);color:#0a0e1a;transition:transform .25s}'
  +'.aur-launch-go svg{width:17px;height:17px}.aur-launch:hover .aur-launch-go{transform:translateX(3px)}'
  +'@media(max-width:760px){.aur-launch{flex-basis:100%;max-width:none}}'
  /* botão flutuante (fora do Dashboard) */
  +'#aurora-fab{position:fixed;right:18px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:140;width:56px;height:56px;border-radius:50%;border:none;padding:0;cursor:pointer;display:none;align-items:center;justify-content:center;background:linear-gradient(110deg,'+G+');background-size:300% 100%;animation:aurFlow 9s steps(180) infinite;box-shadow:0 8px 26px rgba(0,0,0,.45),0 0 22px rgba(94,242,201,.35);transition:transform .2s}'
  +'#aurora-fab span{position:absolute;inset:2px;border-radius:50%;background:var(--panel);display:flex;align-items:center;justify-content:center;color:#5ef2c9}'
  +'#aurora-fab svg{width:24px;height:24px;animation:aurSpark 3.4s ease-in-out infinite}#aurora-fab:hover{transform:scale(1.07)}'
  /* painel lateral */
  +'#aurora-panel{position:fixed;top:0;right:0;height:100vh;height:100dvh;width:var(--aur-w);max-width:100vw;z-index:150;display:flex;flex-direction:column;background:var(--panel);border-left:1px solid var(--border);box-shadow:-18px 0 50px rgba(0,0,0,.35);transform:translateX(105%);visibility:hidden;transition:transform .38s cubic-bezier(.2,.8,.2,1),visibility 0s linear .38s}'
  +'#aurora-panel.open{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.2,.8,.2,1),visibility 0s}'
  +'#aurora-panel::before{content:"";position:absolute;left:-1px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,'+G+');background-size:100% 300%;animation:aurFlowY 7s steps(140) infinite;box-shadow:0 0 16px rgba(94,242,201,.55);z-index:2}'
  /* painel fechado (fora do ecrã): as animações dele ficavam a correr e obrigavam a redesenhar sempre */
  +'#aurora-panel:not(.open)::before,#aurora-panel:not(.open) *,#aurora-panel:not(.open) .aur-ring::before{animation-play-state:paused!important}'
  +'body.aur-docked #app{transition:margin-right .38s cubic-bezier(.2,.8,.2,1)}'
  +'@media(min-width:1100px){body.aur-docked #app{margin-right:var(--aur-w)}}'
  +'.aurora-grab{display:none}'
  +'@media(min-width:761px){body.aur-docked .toast,body.aur-docked .clipboard-toast{right:calc(var(--aur-w) + 20px)}}'
  +'.aurora-head{display:flex;align-items:center;gap:11px;padding:14px 14px 14px 16px;padding-top:calc(14px + env(safe-area-inset-top,0px));border-bottom:1px solid var(--border)}'
  +'.a-logo{position:relative;width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#5ef2c9;background:linear-gradient(135deg,rgba(0,230,168,.2),rgba(123,92,255,.28));box-shadow:inset 0 0 0 1px rgba(94,242,201,.28),0 0 18px rgba(94,242,201,.18)}'
  +'.a-logo svg{width:21px;height:21px;animation:aurSpark 3.4s ease-in-out infinite}'
  +'.a-ttl{display:flex;flex-direction:column;flex:1;min-width:0;gap:2px}'
  +'.a-ttl b{font-family:"Playfair Display",serif;color:var(--text);font-size:1.12rem;letter-spacing:.4px;font-weight:600}'
  +'.a-ttl span{font-size:.58rem;letter-spacing:1.3px;text-transform:uppercase;color:var(--text-muted);display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden}'
  +'.a-ttl span i{width:6px;height:6px;border-radius:50%;background:#2ee6a6;box-shadow:0 0 8px #2ee6a6}'
  +'.a-hbtn{width:34px;height:34px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:0 0 auto;transition:color .2s,border-color .2s}'
  +'.a-hbtn:hover{color:var(--text);border-color:var(--accent)}.a-hbtn svg{width:16px;height:16px;transition:transform .3s}.a-hbtn.min-only{display:none}'
  +'.aurora-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}'
  +'.aurora-msg{max-width:92%;padding:10px 13px;border-radius:14px;font-size:.84rem;line-height:1.6;white-space:pre-wrap;word-break:break-word;animation:appFadeIn .25s ease}'
  +'.aurora-msg.me{align-self:flex-end;background:var(--accent);color:#0a0e1a;border-bottom-right-radius:5px}'
  +'.aurora-msg.ai{align-self:flex-start;background:rgba(255,255,255,.045);border:1px solid var(--border);color:var(--text);border-bottom-left-radius:5px}'
  +'.aurora-msg.ai b{color:var(--accent-ink)}'
  +'.a-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;white-space:normal}'
  +'.a-btn{display:inline-block;padding:6px 12px;border:1px solid var(--accent);border-radius:20px;color:var(--accent-ink);cursor:pointer;font-size:.75rem;line-height:1.3;transition:background .2s}'
  +'.a-btn:hover{background:rgba(201,168,76,.12)}.a-btn.danger{border-color:#e05270;color:#e05270}'
  +'.a-code{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:1.05rem;letter-spacing:1.5px;color:var(--accent-ink);background:rgba(0,0,0,.25);padding:4px 10px;border-radius:8px;margin:3px 0;word-break:break-all}'
  +'.a-dim{opacity:.6;font-size:.77rem}'
  +'.a-typing{display:inline-flex;gap:4px;padding:3px 2px}.a-typing i{width:6px;height:6px;border-radius:50%;background:#5ef2c9;animation:aurDot 1.1s ease-in-out infinite}.a-typing i:nth-child(2){animation-delay:.15s;background:#1fb6ff}.a-typing i:nth-child(3){animation-delay:.3s;background:#7b5cff}'
  +'.aurora-in{padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border)}'
  +'.aurora-in-box{display:flex;gap:8px;align-items:center;background:var(--panel);border-radius:14.5px;padding:5px 5px 5px 14px}'
  +'.aurora-in input,.aurora-in input:focus{flex:1;min-width:0;width:auto!important;height:auto!important;margin:0!important;background:transparent!important;border:0 solid transparent!important;box-shadow:none!important;outline:none!important;border-radius:0!important;color:var(--text);font:inherit;font-size:.9rem;padding:9px 0!important}'
  +'.aurora-in button{width:38px;height:38px;border-radius:11px;border:none;background:var(--accent);color:#0a0e1a;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}'
  +'.aurora-in button svg{width:17px;height:17px}'
  /* telemóvel: folha que sobe de baixo e encolhe para a barra */
  +'@media(max-width:760px){'
  +'#aurora-panel{top:auto;bottom:0;width:100vw;height:74vh;height:74dvh;border-left:none;border-top:1px solid var(--border);border-radius:20px 20px 0 0;transform:translateY(105%);box-shadow:0 -18px 50px rgba(0,0,0,.5)}'
  +'#aurora-panel.open{transform:none}#aurora-panel.open.min{transform:translateY(calc(100% - 74px))}'
  +'#aurora-panel::before{left:18px;right:18px;top:-1px;bottom:auto;width:auto;height:2px;border-radius:2px;background:linear-gradient(90deg,'+G+');background-size:300% 100%;animation:aurFlow 7s steps(140) infinite}'
  +'.aurora-grab{display:block;width:40px;height:4px;border-radius:2px;background:var(--border);margin:9px auto 0}'
  +'body.aur-docked .toast,body.aur-docked .clipboard-toast{bottom:auto;top:calc(14px + env(safe-area-inset-top,0px));right:14px;left:14px;text-align:center}'
  +'.a-sub2{display:none}'
  +'.aurora-head{padding-top:8px;cursor:pointer}.a-hbtn.min-only{display:flex}'
  +'#aurora-panel.min .a-hbtn.min-only svg{transform:rotate(180deg)}'
  +'#aurora-panel.has-new .a-logo::after{content:"";position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:#ff5fb8;box-shadow:0 0 10px #ff5fb8}'
  +'}'
  +'@media(prefers-reduced-motion:reduce){.aur-ring,.aur-ring::before,.aur-launch-in::before,#aurora-panel::before,#aurora-fab,.aur-launch-ico svg,.a-logo svg,#aurora-fab svg,.aur-caret{animation:none!important}}';
  const st=document.createElement('style');st.id='aurora-css';st.textContent=css;document.head.appendChild(st);
  const fab=document.createElement('button');fab.id='aurora-fab';fab.title='Aurora AI';fab.setAttribute('aria-label','Abrir a Aurora AI');fab.dataset.act='auroraOpen';
  fab.innerHTML='<span>'+AUR_SVG.spark+'</span>';document.body.appendChild(fab);
  const panel=document.createElement('aside');panel.id='aurora-panel';panel.setAttribute('aria-label','Aurora AI');
  panel.innerHTML='<div class="aurora-grab"></div>'
   +'<div class="aurora-head" data-act="auroraHeadTap">'
   +'<div class="a-logo">'+AUR_SVG.spark+'</div>'
   +'<div class="a-ttl"><b>Aurora AI</b><span><i></i>100% offline<em class="a-sub2" style="font-style:normal">&nbsp;· o teu cofre</em></span></div>'
   +'<button class="a-hbtn" data-k="reset" title="Nova conversa" data-act="auroraReset" data-stop>'+AUR_SVG.reset+'</button>'
   +'<button class="a-hbtn min-only" data-k="min" title="Minimizar" data-act="auroraToggleMin" data-stop>'+AUR_SVG.chev+'</button>'
   +'<button class="a-hbtn" data-k="close" title="Fechar" data-act="auroraClose" data-stop>'+AUR_SVG.x+'</button>'
   +'</div>'
   +'<div class="aurora-msgs" id="aurora-msgs"></div>'
   +'<div class="aurora-in"><div class="aur-ring"><div class="aurora-in-box"><input id="aurora-input" placeholder="Pede-me qualquer coisa do cofre…" autocomplete="off" autocapitalize="sentences" enterkeyhint="send"><button id="aurora-send" data-act="auroraSend" title="Enviar">'+AUR_SVG.send+'</button></div></div></div>';
  document.body.appendChild(panel);
  aurUILang();
  const inp=document.getElementById('aurora-input');
  if(inp)inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();auroraSend();}
    else if(e.key==='ArrowUp'&&AUR.hist.length){AUR.hIdx=Math.max(0,AUR.hIdx-1);inp.value=AUR.hist[AUR.hIdx]||'';e.preventDefault();}
    else if(e.key==='ArrowDown'&&AUR.hist.length){AUR.hIdx=Math.min(AUR.hist.length,AUR.hIdx+1);inp.value=AUR.hist[AUR.hIdx]||'';e.preventDefault();}
  });
  setInterval(function(){
    if(document.hidden)return;
    const on=typeof masterKey!=='undefined'&&!!masterKey;
    if(!on){if(document.getElementById('aurora-panel').classList.contains('open'))aurClose(true);AUR.resume=null;AUR.pending=null;aurFab();return;}
    aurFab();
    if(aurUILangNow!==aurAppLang())aurUILang();
    if(AUR.resume&&!aurTotpLocked()){const t=AUR.resume;AUR.resume=null;auroraOpen();aurSay(aurL('🔓 Cofre 2FA desbloqueado — a continuar o teu pedido…','🔓 2FA vault unlocked — carrying on with your request…'));try{aurHandle(t);}catch(e){}}
  },700);
})();


/* ══ AURORA · AVISOS PROATIVOS (resumo no Dashboard; tocar abre a Aurora com o assunto resolvido) ══ */
function aurAlertsDismissed(){try{return JSON.parse(localStorage.getItem('av_alerts_off')||'{}');}catch(e){return {};}}
function aurAlertDismiss(k,ev){if(ev)ev.stopPropagation();const d=aurAlertsDismissed(),day=new Date().toISOString().slice(0,10);Object.keys(d).forEach(x=>{if(d[x]!==day)delete d[x];});d[k]=day;try{localStorage.setItem('av_alerts_off',JSON.stringify(d));}catch(e){}aurAlertsRender();}
function aurAlerts(){
  const keep=AUR.lang;AUR.lang=aurAppLang();const en=AUR.lang==='en',out=[];
  try{
    const t=aurToday(),ev=aurEvents();
    ev.filter(e=>e.date>=t&&e.date<=aurAddDays(t,7)).sort((a,b)=>a.date-b.date).slice(0,2).forEach(e=>{
      out.push({k:'soon:'+e.label+':'+aurDate(e.date),ic:AUR_EV_ICON[e.type]||'⏳',html:'<b>'+aurEsc(e.label)+'</b> '+(e.type==='renew'?aurL('renova ','renews '):aurL('expira ','expires '))+aurRel(e.date)+(e.type==='renew'&&e.amount?' · '+aurMoney(e.amount):''),run:()=>aurQ('o que expira nos proximos 7 dias','what expires in the next 7 days')});});
    const past=ev.filter(e=>e.date<t&&e.date>=aurAddDays(t,-14)&&e.type!=='renew'&&e.type!=='date').sort((a,b)=>b.date-a.date);
    if(past.length)out.push({k:'past:'+past.map(e=>e.label).join('|'),ic:'⚠️',html:past.length===1?'<b>'+aurEsc(past[0].label)+'</b> '+aurL('expirou ','expired ')+aurRel(past[0].date):aurL('<b>'+past.length+'</b> itens expiraram nas últimas 2 semanas','<b>'+past.length+'</b> items expired in the last 2 weeks'),run:()=>aurQ('o que ja expirou','what has expired')});
    const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived&&v.pw);
    const old=V.filter(v=>v.pwUpdated&&Date.now()-v.pwUpdated>365*864e5);
    if(old.length)out.push({k:'old:'+old.length,ic:'🔑',html:aurL('<b>'+old.length+'</b> '+(old.length===1?'password tem':'passwords têm')+' mais de 1 ano','<b>'+old.length+'</b> '+(old.length===1?'password is':'passwords are')+' over a year old'),run:()=>{aurSay(aurL('🔑 Passwords com mais de 1 ano — toca numa para gerar uma nova:','🔑 Passwords over a year old — tap one to generate a new one:'),old.slice(0,10).map(v=>({label:v.name+(v.user?' · '+v.user:''),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:new Set()})})));}});
    const cnt={};V.forEach(v=>{cnt[v.pw]=(cnt[v.pw]||0)+1;});
    const bad=V.filter(v=>(typeof getPwScore==='function'&&getPwScore(v.pw)<2)||cnt[v.pw]>1).length;
    if(bad)out.push({k:'bad:'+bad,ic:'🛡️',html:aurL('<b>'+bad+'</b> '+(bad===1?'password fraca ou repetida':'passwords fracas ou repetidas'),'<b>'+bad+'</b> weak or reused '+(bad===1?'password':'passwords')),run:()=>avCleanupStart()});
  }catch(e){}
  AUR.lang=keep;
  const off=aurAlertsDismissed(),day=new Date().toISOString().slice(0,10);
  out.forEach(a=>{a.k=a.k.replace(/['"\\<>]/g,'');});
  return out.filter(a=>off[a.k]!==day).slice(0,4);
}
let AUR_ALERT_RUN=[];
function aurAlertGo(i){const a=AUR_ALERT_RUN[i];if(!a)return;auroraOpen();setTimeout(()=>{AUR.lang=aurAppLang();try{a.run();}catch(e){}},260);}
function aurAlertsRender(){
  if(typeof document==='undefined')return;
  const launch=document.querySelector('.aur-launch');let box=document.getElementById('aur-alerts');
  if(!launch||typeof masterKey==='undefined'||!masterKey){if(box)box.remove();return;}
  const list=aurAlerts();AUR_ALERT_RUN=list;
  if(!list.length){if(box)box.remove();return;}
  if(!box){box=document.createElement('div');box.id='aur-alerts';box.className='aur-alerts';}
  const side=document.getElementById('av-side');
  if(side&&side.previousElementSibling===launch){if(box.parentElement!==side)side.insertBefore(box,side.firstChild);}
  else if(box.previousElementSibling!==launch)launch.insertAdjacentElement('afterend',box);
  const en=aurAppLang()==='en';
  box.innerHTML='<div class="aur-al-h">✨ Aurora · '+(en?'Heads-up':'Avisos')+'</div>'+list.map((a,i)=>'<div class="aur-al-row" role="button" tabindex="0" data-act="aurAlertGo" data-enter="aurAlertGo" data-args="['+i+']"><span class="aur-al-ic">'+a.ic+'</span><span class="aur-al-tx">'+a.html+'</span><button class="aur-al-x" title="'+(en?'Dismiss until tomorrow':'Dispensar até amanhã')+'" data-act="aurAlertDismiss" data-arg="'+esc(a.k)+'" data-ev-last>✕</button></div>').join('');
}
(function(){if(typeof renderGreeting!=='function')return;const _rg=renderGreeting;renderGreeting=function(){const r=_rg.apply(this,arguments);try{aurAlertsRender();}catch(e){}return r;};})();


/* ══ v9.70 — ＋ ADICIONAR · GRAVAÇÃO AUTOMÁTICA · MODO SIMPLES/COMPLETO · PRIMEIROS PASSOS ══ */
const AV_ADD=[
 {k:'password',ic:'🔑',t:['Password','Password'],d:['Login de um site ou app','Login for a site or app'],n:['Nova password','New password'],tab:'vault',run:()=>openModal()},
 {k:'card',ic:'💳',t:['Cartão bancário','Bank card'],d:['Número, validade e banco','Number, expiry and bank'],n:['Novo cartão','New card'],tab:'cards',run:()=>openCardModal()},
 {k:'store',ic:'🎟️',t:['Cartão de loja','Store card'],d:['Mostra o código de barras na caixa','Shows the barcode at the till'],n:['Novo cartão de loja','New store card'],tab:'store',run:()=>openStoreModal()},
 {k:'doc',ic:'📄',t:['Documento','Document'],d:['Foto ou PDF — CC, seguro, fatura','Photo or PDF — ID, insurance, invoice'],n:['Novo documento','New document'],tab:'docs',run:()=>openDocModal()},
 {k:'note',ic:'📝',t:['Nota','Note'],d:['Texto privado e encriptado','Private, encrypted text'],n:['Nova nota','New note'],tab:'notes',run:()=>newNote()},
 {k:'totp',ic:'🔐',t:['Código 2FA','2FA code'],d:['Os códigos de 6 dígitos','The 6-digit codes'],n:['Novo código 2FA','New 2FA code'],tab:'totp',run:()=>{if(typeof aurTotpLocked==='function'&&aurTotpLocked()){toast(currentLang==='en'?'Unlock the 2FA vault first — then tap “New 2FA code”.':'Desbloqueia primeiro o cofre 2FA — depois toca em «Novo código 2FA».');return;}openTotpModal();}}
];
const AV_ADD_MORE=[
 {k:'warranty',ic:'🧾',t:['Garantia','Warranty'],n:['Nova garantia','New warranty'],tab:'warranty',run:()=>openAssetModal('warranty')},
 {k:'vehicle',ic:'🚗',t:['Veículo','Vehicle'],n:['Novo veículo','New vehicle'],tab:'vehicle',run:()=>openAssetModal('vehicle')},
 {k:'license',ic:'🪪',t:['Licença','Licence'],n:['Nova licença','New licence'],tab:'license',run:()=>openAssetModal('license')},
 {k:'date',ic:'📅',t:['Data importante','Important date'],n:['Nova data','New date'],tab:'dates',run:()=>openAssetModal('dates')},
 {k:'sub',ic:'🔁',t:['Subscrição','Subscription'],tab:null,run:()=>openSubModal()},
 {k:'wifi',ic:'WIFI_ICON',t:['Rede Wi-Fi','Wi-Fi network'],tab:null,simple:true,run:()=>openWifiManager()},
 {k:'person',ic:'🆔',t:['Pessoa (Info)','Person (Info)'],n:['Nova pessoa','New person'],tab:'info',simple:true,run:()=>addPerson()}
];
const AV_TAB_ADD={info:'person',vault:'password',totp:'totp',cards:'card',store:'store',docs:'doc',notes:'note',warranty:'warranty',vehicle:'vehicle',license:'license',dates:'date'};
let avCurTab='dashboard';
const avEn=()=>typeof currentLang!=='undefined'&&currentLang==='en';
const avT=a=>a?(avEn()?a[1]:a[0]):'';
function avIsDesk(){return !(window.matchMedia&&matchMedia('(max-width:768px)').matches);}
function avFind(k){return AV_ADD.concat(AV_ADD_MORE).find(x=>x.k===k);}
function avAddType(k){
  const t=avFind(k);if(!t)return;avAddClose();
  try{if(t.tab&&t.tab!==avCurTab&&typeof switchTab==='function')switchTab(t.tab);}catch(e){}
  setTimeout(()=>{try{t.run();}catch(e){console.warn('Adicionar:',e);}},80);
}
function avAddMain(e){if(e)e.stopPropagation();const k=AV_TAB_ADD[avCurTab];if(k)avAddType(k);else avAddMenu(e);}
function avAddLabel(){
  const el=document.getElementById('tb-add-txt');if(!el)return;
  const k=AV_TAB_ADD[avCurTab],t=k&&avFind(k);
  el.textContent=t?avT(t.n):(avEn()?'Add':'Adicionar');
  const main=document.getElementById('tb-add-main');if(main)main.title=el.textContent;
  const ch=document.getElementById('tb-add-chev');if(ch){const l=avEn()?'Choose what to add':'Escolher o que adicionar';ch.title=l;ch.setAttribute('aria-label',l);}
  const fab=document.getElementById('av-fab-add');if(fab)fab.setAttribute('aria-label',avEn()?'Add':'Adicionar');
}
let _avAddOpenedAt=0;
function avAddCloseSafe(){if(Date.now()-_avAddOpenedAt<400)return;avAddClose();}
function avAddClose(){const p=document.getElementById('av-add-pop'),d=document.getElementById('av-add-dim');if(p)p.classList.remove('open');if(d)d.classList.remove('open');}
function avAddMenu(e){
  if(e)e.stopPropagation();
  let p=document.getElementById('av-add-pop'),d=document.getElementById('av-add-dim');
  if(p&&p.classList.contains('open')){avAddClose();return;}
  if(!p){d=document.createElement('div');d.id='av-add-dim';d.className='av-dim';d.onclick=avAddCloseSafe;document.body.appendChild(d);
    p=document.createElement('div');p.id='av-add-pop';p.className='av-pop';document.body.appendChild(p);}
  const en=avEn(),full=avMode()==='full';
  p.innerHTML='<div class="av-grab"></div><h4>'+(en?'What do you want to store?':'O que queres guardar?')+'</h4><div class="av-list">'
   +AV_ADD.filter(t=>!avTabHidden(t.tab)).map((t,i)=>'<button class="av-it'+(i===0?' hl':'')+'" role="menuitem" data-act="avAddType" data-arg="'+esc(t.k)+'"><span class="ic">'+t.ic+'</span><span><b>'+avT(t.t)+'</b><i>'+avT(t.d)+'</i></span></button>').join('')+'</div>'
   +((full||AV_ADD_MORE.some(t=>t.simple))?'<h4>'+(en?'More':'Mais')+'</h4><div class="av-more">'+AV_ADD_MORE.filter(t=>(full||t.simple)&&!avTabHidden(t.tab)).map(t=>'<button data-act="avAddType" data-arg="'+esc(t.k)+'">'+t.ic+' '+avT(t.t)+'</button>').join('')+'</div>':'')
   +'<button class="av-aur" data-act="avAddAurora">✨ '+(en?'Or tell Aurora: <b>"add Netflix"</b>':'Ou escreve à Aurora: <b>"adiciona a Netflix"</b>')+'</button>';
  if(avIsDesk()){
    p.classList.remove('sheet');d.classList.remove('open');
    const a=document.getElementById('tb-add');const r=a?a.getBoundingClientRect():{bottom:60,right:window.innerWidth-20};
    p.style.top=Math.round(r.bottom+8)+'px';p.style.right=Math.max(10,Math.round(window.innerWidth-r.right))+'px';p.style.left='auto';p.style.bottom='auto';
  }else{p.classList.add('sheet');p.style.top='auto';p.style.right='0';p.style.left='0';d.classList.add('open');}
  p.classList.add('open');_avAddOpenedAt=Date.now();
}
document.addEventListener('click',e=>{const p=document.getElementById('av-add-pop');if(p&&p.classList.contains('open')&&!p.contains(e.target))avAddCloseSafe();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')avAddClose();});

/* ── gravação automática ── */
let avSeq=0,avSaving=false,_avAsT=0,_avAsBusy=false;
function autoSaveOn(){try{return localStorage.getItem('av_autosave')!=='0';}catch(e){return true;}}
function avToggleAutosave(){try{localStorage.setItem('av_autosave',autoSaveOn()?'0':'1');}catch(e){}avRenderSettings();avRenderSaveState();if(autoSaveOn()&&hasUnsaved)avScheduleAutoSave();toast(autoSaveOn()?(avEn()?'Autosave on.':'Gravação automática ligada.'):(avEn()?'Autosave off — use “Save file now” in the ⋯ menu.':'Gravação automática desligada — usa «Guardar ficheiro agora» no menu ⋯.'));}
let avLastInput=0,avLastDriveUp=0,_avFlushT=0;
document.addEventListener('input',()=>{avLastInput=Date.now();},true);
document.addEventListener('keydown',()=>{avLastInput=Date.now();},true);
function avDriveFlushLater(ms){clearTimeout(_avFlushT);_avFlushT=setTimeout(async()=>{_avFlushT=0;if(!driveOn()||!navigator.onLine)return;try{await driveFlushPending(true);avLastDriveUp=Date.now();}catch(e){}},Math.max(1000,ms));}
function avFlushNow(){if(_avFlushT){clearTimeout(_avFlushT);_avFlushT=0;try{driveFlushPending(true);}catch(e){}avLastDriveUp=Date.now();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)avFlushNow();});
function avScheduleAutoSave(){
  if(!autoSaveOn()||presentationMode||!masterKey||(typeof vaultReadOnly!=='undefined'&&vaultReadOnly))return;
  clearTimeout(_avAsT);_avAsT=setTimeout(avAutoSaveRun,2500);
}
async function avAutoSaveRun(){
  if(!hasUnsaved||!masterKey)return;
  if(_avAsBusy||document.querySelector('.modal-overlay.open,.open[id$="-overlay"]')){_avAsT=setTimeout(avAutoSaveRun,2500);return;}
  if(Date.now()-avLastInput<2000){_avAsT=setTimeout(avAutoSaveRun,1500);return;} // ainda a escrever → espera
  _avAsBusy=true;avSaving=true;avRenderSaveState();
  const seq=avSeq;
  try{await saveFile({auto:true});}catch(e){}
  _avAsBusy=false;avSaving=false;
  if(avSeq!==seq){hasUnsaved=true;const b=document.querySelector('.btn-save-file');if(b)b.classList.add('has-changes');avScheduleAutoSave();}
  avRenderSaveState();
}
function avRenderSaveState(){
  const b=document.getElementById('tb-save-state'),tx=document.getElementById('tb-saved-txt');if(!b||!tx)return;
  const en=avEn();let cls='',txt,tip;
  if(avSaving){cls='saving';txt=en?'Saving…':'A gravar…';tip=txt;}
  else if(hasUnsaved){cls='dirty';txt=autoSaveOn()?(en?'Saving soon':'Por gravar'):(en?'Not saved':'Por gravar');tip=en?'Unsaved changes — tap to save now':'Alterações por gravar — toca para gravar já';}
  else{txt=en?'Saved':'Guardado';tip=autoSaveOn()?(en?'Saved automatically — tap to save the file now':'Gravado automaticamente — toca para gravar o ficheiro já'):(en?'Saved':'Gravado');}
  b.className='tb-saved'+(cls?' '+cls:'');tx.textContent=txt;b.title=tip;b.setAttribute('aria-label',tip);
}
function avSaveClick(){clearTimeout(_avAsT);saveFile();}
(function(){
  if(typeof markUnsaved==='function'){const mu=markUnsaved;markUnsaved=function(){const r=mu.apply(this,arguments);if(!presentationMode){avSeq++;avRenderSaveState();avScheduleAutoSave();}return r;};}
  if(typeof markSaved==='function'){const ms=markSaved;markSaved=function(){const r=ms.apply(this,arguments);avRenderSaveState();setTimeout(()=>{try{avOnboardRender();}catch(e){}},50);return r;};}
})();

/* ── modo simples / completo ── */
function avMode(){try{return localStorage.getItem('av_mode')==='simple'?'simple':'full';}catch(e){return 'full';}}
function avApplyMode(){
  const simple=avMode()==='simple';document.body.classList.toggle('av-simple',simple);
  const subs=document.getElementById('dash-subs-section');if(subs)subs.classList.toggle('av-empty',!(typeof subscriptions!=='undefined'&&subscriptions.length));
  if(simple&&typeof groupOfTab==='function'&&['bens','archive'].includes(groupOfTab(avCurTab))&&typeof switchTab==='function')switchTab('dashboard');
}
function avSetMode(m){try{localStorage.setItem('av_mode',m==='simple'?'simple':'full');}catch(e){}avApplyMode();avRenderSettings();try{renderDashboard();}catch(e){}toast(m==='simple'?(avEn()?'Simple mode — only the essentials.':'Modo Simples — só o essencial.'):(avEn()?'Complete mode — every feature visible.':'Modo Completo — todas as funções à vista.'));}
function avRenderSettings(){
  const en=avEn(),s=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};
  s('s-use-title',en?'🧭 Usage':'🧭 Utilização');
  s('s-autosave-lbl',en?'Autosave':'Gravação automática');
  s('s-autosave-desc',en?'Saves by itself after every change — to the file (once it has permission) and to Drive.':'Grava sozinha depois de cada alteração — no ficheiro (se já tiver autorização) e no Drive.');
  s('s-autosave-btn',autoSaveOn()?(en?'On':'Ligada'):(en?'Off':'Desligada'));
  s('s-mode-lbl',en?'App mode':'Modo da app');
  s('s-mode-desc',en?'Simple: just the essentials. Complete: every feature (assets, archive, reports…).':'Simples: só o essencial. Completo: todas as funções (bens, arquivo, relatórios…).');
  s('s-mode-simple',en?'Simple':'Simples');s('s-mode-full',en?'Complete':'Completo');
  s('s-lockhide-lbl',en?'When you leave the app (background), lock:':'Ao sair da app (segundo plano), bloquear:');s('bg-0',en?'Now':'Logo');s('bg--1',en?'∞ Never':'∞ Nunca');
  s('s-bglock-hint',en?'Gives you time to copy a password and paste it in another app. After that it asks for your fingerprint / PIN.':'Dá-te tempo para copiares uma password e colares noutra app. Depois disso, pede a impressão digital / PIN.');
  s('s-idlelock-lbl',en?'Without using the app, lock after:':'Sem mexer na app, bloquear depois de:');
  [0,15,60,300,-1].forEach(v=>{const b=document.getElementById('bg-'+v);if(b)b.classList.toggle('active',avBgLockSecs()===v);});
  s('s-nudge-lbl',en?'Aurora suggestions':'Sugestões da Aurora');s('s-nudge-desc',en?'Small tips after you save (e.g. store the 2FA code, read an expiry date from a photo).':'Pequenas sugestões depois de gravares (ex.: guardar o código 2FA, ler a validade de uma foto).');
  s('s-nudge-on',en?'On':'Ligadas');s('s-nudge-off',en?'Off':'Desligadas');
  {const a=document.getElementById('s-nudge-on'),b=document.getElementById('s-nudge-off');if(a)a.classList.toggle('on',avNudgesOn());if(b)b.classList.toggle('on',!avNudgesOn());}
  s('s-sw-lbl',en?'Tab transitions':'Transições entre abas');s('s-sw-desc',en?'When you swipe sideways, on the phone.':'Ao deslizar o dedo para o lado, no telemóvel.');
  s('s-sw-parallax','Parallax');s('s-sw-stack',en?'Stacked cards':'Cartões em pilha');s('s-sw-reveal',en?'Aurora reveal':'Revelação Aurora');s('s-sw-fade',en?'Soft slide':'Deslize suave');s('s-sw-off',en?'Off':'Desligado');
  ['parallax','stack','reveal','fade','off'].forEach(k=>{const b=document.getElementById('s-sw-'+k);if(b)b.classList.toggle('on',avSwStyle()===k);});
  {const rm=document.getElementById('s-sw-rm'),red=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);if(rm){rm.style.display=red?'block':'none';rm.textContent=en?'⚠ Your phone has «Remove animations» turned on — transitions stay off (Accessibility settings).':'⚠ O teu telemóvel tem «Remover animações» ligado — as transições ficam desligadas (Definições do telemóvel → Acessibilidade).';}}
  s('s-auto-lbl',en?'Automatic theme':'Tema automático');s('s-auto-desc',en?'Follows your phone or computer light/dark mode: your dark theme at night, your light theme by day.':'Segue o modo claro/escuro do telemóvel ou computador: usa o teu tema escuro à noite e o teu tema claro de dia.');
  s('s-auto-on',en?'On':'Ligado');s('s-auto-off',en?'Off':'Desligado');
  {const a=document.getElementById('s-auto-on'),b=document.getElementById('s-auto-off');if(a)a.classList.toggle('on',avThemeAuto());if(b)b.classList.toggle('on',!avThemeAuto());}
  const bkr=document.getElementById('s-bk-row');if(bkr){bkr.style.display=FSA_OK?'none':'';
    s('s-bk-lbl',en?'Automatic copy to Downloads':'Cópia automática para as Transferências');
    s('s-bk-desc',en?'This browser keeps the vault inside the app. For safety, an encrypted copy is saved to Downloads — only when something changed. You can delete older copies; the newest is enough.':'Este browser guarda o cofre na app. Por segurança, é feita uma cópia encriptada nas Transferências — só quando há alterações. Podes apagar as cópias antigas; basta a mais recente.');
    s('s-bk-weekly',en?'Weekly':'Semanal');s('s-bk-daily',en?'Daily':'Diária');s('s-bk-off',en?'Off':'Desligada');
    ['weekly','daily','off'].forEach(k=>{const b=document.getElementById('s-bk-'+k);if(b)b.classList.toggle('on',avBackupFreq()===k);});}
  const a=document.getElementById('s-mode-simple'),b=document.getElementById('s-mode-full');
  if(a)a.classList.toggle('on',avMode()==='simple');if(b)b.classList.toggle('on',avMode()==='full');
}
function avMoreTop(item,I,en){
  if(!avIsDesk())return item('avAddMenu()',I('<path d="M12 5v14M5 12h14"/>'),en?'Add…':'Adicionar…',en?'Choose what to add':'Escolher o que adicionar');
  const on=typeof privacyOn!=='undefined'&&privacyOn;
  return item('togglePrivacy()',I(on?'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>':'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),on?(en?'Privacy mode · on':'Modo privado · ligado'):(en?'Privacy mode':'Modo de privacidade'),'');
}
function avMoreMid(item,I,en){
  let h=item('saveFile()',I('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),FSA_OK?(en?'Save file now':'Guardar ficheiro agora'):(en?'Save now':'Guardar agora'),autoSaveOn()?(en?'Autosave is on':'Gravação automática ligada'):'');
  if(!FSA_OK)h+=item('avExportVault()',I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),en?'Export a copy (.vault)':'Exportar cópia do cofre (.vault)',en?'Keep it somewhere safe':'Guarda-a num sítio seguro');
  if(avMode()==='simple')h+=item("switchGroup('archive')",I('<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>'),en?'Archive & trash':'Arquivo e reciclagem','');
  return h;
}

/* ── primeiros passos (cofres novos) ── */
async function avOnbSteps(){
  let quick=false;
  try{quick=!!(await getPinRec());}catch(e){}
  if(!quick){try{quick=!!(await idbGet('qu_bio'));}catch(e){}}
  let bk=false;try{bk=(typeof driveOn==='function'&&driveOn())||!!localStorage.getItem('cv_lastbk')||localStorage.getItem('av_bk_done')==='1';}catch(e){}
  const V=typeof vault!=='undefined'?vault:[];
  return [
    {k:'create',done:true,t:['Criar o teu cofre','Create your vault']},
    {k:'pw',done:V.length>0,t:['Guardar a primeira password','Store your first password'],d:['Por exemplo, a do teu email. Demora 30 segundos.','For example, your email. Takes 30 seconds.'],b:['Adicionar','Add'],fn:"avAddType('password')"},
    {k:'quick',done:quick,t:['Entrar com PIN ou impressão digital','Unlock with PIN or fingerprint'],d:['Para não teres de escrever a palavra-passe mestra sempre.','So you don’t have to type the master password every time.'],b:['Configurar','Set up'],fn:"openSettingsTab('seguranca')"},
    {k:'bk',done:bk,t:['Guardar uma cópia de segurança','Make a backup copy'],d:['Se perderes o telemóvel, não perdes nada.','If you lose your phone, you lose nothing.'],b:['Fazer cópia','Back up'],fn:'avOnbBackup()'},
    {k:'imp',opt:true,done:localStorage.getItem('av_imp_done')==='1',t:['Trazer as passwords do Chrome','Bring your passwords from Chrome'],d:['Importa tudo de uma vez em vez de escrever.','Import everything at once instead of typing.'],b:['Importar','Import'],fn:"openSettingsTab('dados')"}
  ];
}
function avOnbBackup(){try{downloadBackupNow();localStorage.setItem('av_bk_done','1');}catch(e){}setTimeout(()=>{try{avOnboardRender();}catch(e){}},600);}
function avOnbHide(){try{localStorage.setItem('av_onb_hide','1');}catch(e){}const b=document.getElementById('av-onboard');if(b)b.remove();}
let _avOnbRun=0;
async function avOnboardRender(){
  const run=++_avOnbRun;
  const host=document.getElementById('dash-greeting');
  let box=document.getElementById('av-onboard');
  if(!host||typeof masterKey==='undefined'||!masterKey||presentationMode||localStorage.getItem('av_onb_hide')==='1'){if(box)box.remove();return;}
  const st=await avOnbSteps();if(run!==_avOnbRun)return;
  const req=st.filter(s=>!s.opt),done=req.filter(s=>s.done).length;
  if(done===req.length){if(box)box.remove();return;}
  if(!box){box=document.createElement('div');box.id='av-onboard';box.className='av-onb';}
  if(box.previousElementSibling!==host)host.insertAdjacentElement('afterend',box);
  const en=avEn(),nextK=(st.find(s=>!s.done&&!s.opt)||{}).k;let n=0;
  if(avMode()==='simple')avTourOffer();
  box.innerHTML='<div class="av-onb-h"><h3>'+(en?'First steps':'Primeiros passos')+'</h3><span><button data-act="avTourStart" style="color:var(--accent-ink);margin-right:10px">🎓 '+(en?'Guided tour':'Ver apresentação')+'</button><button data-act="avOnbHide">'+(en?'Hide':'Esconder')+'</button></span></div>'
   +'<p class="av-onb-lead">'+(en?'A few quick steps and your vault is ready to use.':'Uns passos rápidos e o teu cofre fica pronto a usar.')+'</p>'
   +'<div class="av-onb-bar"><i style="width:'+Math.round(done/req.length*100)+'%"></i></div><div class="av-onb-prog">'+done+(en?' of ':' de ')+req.length+(en?' done':' concluídos')+'</div>'
   +st.map(s=>{if(!s.opt)n++;return '<div class="av-step'+(s.done?' done':'')+(s.k===nextK?' next':'')+'"><div class="dot">'+(s.done?'✓':(s.opt?'＋':n))+'</div><div><div class="st">'+avT(s.t)+(s.opt?'<span class="av-opt">'+(en?'optional':'opcional')+'</span>':'')+'</div>'+(s.done||!s.d?'':'<div class="sd">'+avT(s.d)+'</div>')+'</div>'+(s.done||!s.fn?'':'<button class="sb" '+avActAttrs(s.fn)+'>'+avT(s.b)+'</button>')+'</div>';}).join('')
   +'<div class="av-tip" data-act="auroraOpenSafe">💡 '+(en?'Not sure where to start? Tell Aurora, for example: <b>"save my Gmail password"</b> — she does the rest.':'Não sabes por onde começar? Escreve à Aurora, por exemplo: <b>"guarda a password do Gmail"</b> — ela trata do resto.')+'</div>';
}

/* ── ligações à app existente ── */
(function(){
  if(typeof switchTab==='function'){const st=switchTab;switchTab=function(t){const r=st.apply(this,arguments);avCurTab=t;avAddLabel();return r;};}
  if(typeof renderGreeting==='function'){const rg=renderGreeting;renderGreeting=function(){const r=rg.apply(this,arguments);try{avApplyMode();avOnboardRender();}catch(e){}return r;};}
  if(typeof setLang==='function'){const sl=setLang;setLang=function(){const r=sl.apply(this,arguments);try{avAddLabel();avRenderSaveState();avRenderSettings();avOnboardRender();avEnhanceEmpty();}catch(e){}return r;};}
  if(typeof openSettings==='function'){const os=openSettings;openSettings=function(){const r=os.apply(this,arguments);try{avRenderSettings();}catch(e){}return r;};}
  if(typeof importCSV==='function'){const ic=importCSV;importCSV=function(){try{localStorage.setItem('av_imp_done','1');}catch(e){}return ic.apply(this,arguments);};}
  const fab=document.createElement('button');fab.id='av-fab-add';fab.type='button';fab.textContent='＋';fab.setAttribute('aria-label','Adicionar');let _lp=0,_lpDone=false;fab.addEventListener('pointerdown',()=>{_lpDone=false;clearTimeout(_lp);_lp=setTimeout(()=>{_lpDone=true;avAddMenu();try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}},550);});['pointerup','pointerleave','pointercancel'].forEach(ev=>fab.addEventListener(ev,()=>clearTimeout(_lp)));fab.onclick=e=>{if(_lpDone){_lpDone=false;e.stopPropagation();return;}avAddMain(e);};fab.oncontextmenu=e=>e.preventDefault();document.body.appendChild(fab);
  setInterval(()=>{const on=typeof masterKey!=='undefined'&&!!masterKey&&!presentationMode&&document.getElementById('app')&&document.getElementById('app').classList.contains('visible');document.body.classList.toggle('av-app-on',!!on);},800);
  avAddLabel();avRenderSaveState();avApplyMode();avRenderSettings();
})();


/* ══ v9.70 — PARTILHAR → AURORA VAULT · LER CÓDIGO DE BARRAS · LER VALIDADE (OCR) ══ */
async function avSharePurgeOld(){
  try{const c=await caches.open('av-share');const mr=await c.match('./__share/meta');if(!mr)return;
    let at=0;try{at=(await mr.json()).at||0;}catch(e){}
    if(Date.now()-at>3600000)for(const k of await c.keys())await c.delete(k);}catch(e){}
}
if(typeof caches!=='undefined')avSharePurgeOld();
async function avShareImport(){
  const en=avEn();let c;
  try{c=await caches.open('av-share');}catch(e){return;}
  const mr=await c.match('./__share/meta');
  try{history.replaceState(null,'',location.pathname);}catch(e){}
  if(!mr)return;
  let meta=null;try{meta=await mr.json();}catch(e){}
  const files=[];
  if(meta&&Array.isArray(meta.files))for(const f of meta.files){try{const r=await c.match(f.key);if(r){const bl=await r.blob();files.push(new File([bl],f.name||'ficheiro',{type:f.type||bl.type||''}));}}catch(e){}}
  try{for(const k of await c.keys())await c.delete(k);}catch(e){}
  if(files.length){
    const made=[];
    for(const f of files){
      const data=await new Promise(res=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.onerror=()=>res(null);rd.readAsDataURL(f);});if(!data)continue;
      const d={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:(f.name||'').replace(/\.[^.]+$/,'')||(en?'Shared document':'Documento partilhado'),cat:'outro',date:'',expiry:'',desc:((meta&&meta.text)||'').slice(0,500),folderId:null,file:{name:f.name,size:f.size,type:f.type,data},createdAt:Date.now()};
      documents.push(d);made.push(d);
    }
    if(!made.length)return;
    try{logActivity('add',made.map(d=>d.title).join(', '),'📥');}catch(e){}
    markUnsaved();renderAll();switchTab('docs');
    setTimeout(()=>{try{openDocModal(made[0].id);}catch(e){}},300);
    toast(made.length===1?(en?'📥 Shared file saved in Documents — check the name and expiry.':'📥 Ficheiro partilhado guardado em Documentos — confirma o nome e a validade.'):(en?`📥 ${made.length} shared files saved in Documents.`:`📥 ${made.length} ficheiros partilhados guardados em Documentos.`));
  }else if(meta&&(meta.text||meta.url)){
    switchTab('notes');newNote();
    const n=notes.find(x=>x.id===editingNoteId);
    if(n){n.title=(meta.title||(en?'Shared':'Partilhado')).slice(0,80);n.body=[meta.text,meta.url].filter(Boolean).join('\n');try{showNoteEditor(n);renderNotesList();}catch(e){}}
    markUnsaved();toast(en?'📥 Shared text saved as a note.':'📥 Texto partilhado guardado numa nota.');
  }
}

/* ── ④ ler o código de barras do cartão de loja ── */
let _avScan=null;
function avScanClose(){
  const s=_avScan;_avScan=null;
  if(s){s.stop=true;try{s.stream.getTracks().forEach(t=>t.stop());}catch(e){}}
  const o=document.getElementById('av-scan');if(o)o.remove();
}
async function avScanStore(){
  const en=avEn();
  if(!('BarcodeDetector' in window)){toast(en?'This browser can’t read barcodes — type the number.':'Este browser não lê códigos de barras — escreve o número.');return;}
  const want=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar','qr_code','data_matrix','pdf417','aztec'];
  let formats=want;try{const sup=await BarcodeDetector.getSupportedFormats();formats=want.filter(f=>sup.includes(f));}catch(e){}
  let det;try{det=new BarcodeDetector({formats});}catch(e){toast(en?'Barcode reading unavailable.':'Leitura de códigos indisponível.');return;}
  const o=document.createElement('div');o.id='av-scan';
  o.style.cssText='position:fixed;inset:0;z-index:400;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center';
  o.innerHTML='<video playsinline muted style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;left:8%;right:8%;top:38%;height:24%;border:2px solid rgba(201,168,76,.9);border-radius:14px;box-shadow:0 0 0 9999px rgba(0,0,0,.45)"></div><div style="position:absolute;top:calc(env(safe-area-inset-top,0px) + 18px);left:0;right:0;text-align:center;color:#fff;font:600 .9rem system-ui;text-shadow:0 1px 6px #000">'+(en?'Point the camera at the card’s barcode':'Aponta a câmara ao código de barras do cartão')+'</div><button type="button" data-act="avScanClose" style="position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 26px);padding:12px 26px;border-radius:30px;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.55);color:#fff;font:600 .9rem system-ui">'+(en?'Cancel':'Cancelar')+'</button>';
  document.body.appendChild(o);
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});}
  catch(e){avScanClose();toast(en?'Camera not allowed — you can type the number.':'Sem autorização da câmara — podes escrever o número.');return;}
  const v=o.querySelector('video');v.srcObject=stream;try{await v.play();}catch(e){}
  _avScan={stream,stop:false};const me=_avScan;
  const tick=async()=>{
    if(me.stop)return;
    try{const r=await det.detect(v);if(r&&r.length&&r[0].rawValue){avScanFill(r[0].rawValue);return;}}catch(e){}
    setTimeout(tick,180);
  };
  tick();
}
function avScanFill(raw){
  avScanClose();
  const en=avEn(),val=String(raw).trim(),inp=document.getElementById('sc-number');
  if(inp){inp.value=/^[\d\s-]+$/.test(val)?val.replace(/[\s-]/g,''):val;inp.dispatchEvent(new Event('input',{bubbles:true}));}
  try{navigator.vibrate&&navigator.vibrate(60);}catch(e){}
  toast((en?'✓ Code read: ':'✓ Código lido: ')+val);
}
(function(){
  if(typeof openStoreModal!=='function')return;
  const osm=openStoreModal;
  openStoreModal=function(){const r=osm.apply(this,arguments);const b=document.getElementById('sc-scan-btn');if(b){b.style.display=('BarcodeDetector' in window)?'block':'none';b.textContent=avEn()?'📷 Scan with the camera':'📷 Ler com a câmara';}return r;};
})();

/* ── ⑤ ler a validade de uma foto (OCR local, motor descarregado 1× e guardado offline) ──
   Leitor, motor e dicionários (português e inglês) vêm deste site (vendor/), nunca de servidores de terceiros:
   é código que corre com o cofre aberto, por isso tem de ser exatamente a versão testada. */
const AV_OCR_DIR='vendor/tesseract-5.1.1/';
const AV_OCR_URL=AV_OCR_DIR+'tesseract.min.js';
function avWasmSimd(){try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));}catch(e){return false;}}
async function avOcrWorker(logger){
  const T=await avLoadTesseract(),base=new URL(AV_OCR_DIR,location.href).href;
  return T.createWorker(['por','eng'],1,{
    workerPath:base+'worker.min.js',workerBlobURL:false,
    corePath:base+(avWasmSimd()?'tesseract-core-simd-lstm.js':'tesseract-core-lstm.js'),
    langPath:base.replace(/\/$/,''),gzip:true,
    ...(logger?{logger}:{})
  });
}
let _avTess=null;
function avLoadTesseract(){
  if(window.Tesseract)return Promise.resolve(window.Tesseract);
  if(_avTess)return _avTess;
  _avTess=new Promise((res,rej)=>{const s=document.createElement('script');s.src=AV_OCR_URL;s.async=true;s.onload=()=>window.Tesseract?res(window.Tesseract):rej(new Error('load'));s.onerror=()=>{_avTess=null;s.remove();rej(new Error('load'));};document.head.appendChild(s);});
  return _avTess;
}
const AV_MON={jan:1,fev:2,feb:2,mar:3,abr:4,apr:4,mai:5,may:5,jun:6,jul:7,ago:8,aug:8,set:9,sep:9,out:10,oct:10,nov:11,dez:12,dec:12};
function avFindExpiry(text){
  if(!text)return null;
  const t=String(text).replace(/(?<=\d)[oO]|[oO](?=\d)/g,'0').replace(/(?<=\d)[lI|]|[lI|](?=\d)/g,'1');
  const lines=t.split(/\r?\n/),today=new Date();today.setHours(0,0,0,0);
  const KEY=/(v[aá]lid|validade|expir|until|at[eé]\b|date of expiry|expiry|4\s?b\b|caduc)/i,BAD=/(nasc|birth|emiss|issue|emitid|4\s?a\b|\b3\b)/i;
  const out=[];
  const push=(d,m,y,li)=>{y=+y;if(y<100)y+=2000;d=+d;m=+m;if(m<1||m>12||d<1||d>31||y<1990||y>2099)return;const dt=new Date(y,m-1,d);if(dt.getMonth()!==m-1)return;
    const ctx=(lines[li]||'')+' '+(lines[li-1]||'');let s=0;if(KEY.test(ctx))s+=3;if(BAD.test(lines[li]||''))s-=3;if(dt>=today)s+=1;else s-=2;out.push({dt,s});};
  lines.forEach((ln,i)=>{
    let m;const re=/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})(?!\d)/g;
    while((m=re.exec(ln)))push(m[1],m[2],m[3],i);
    const re2=/(?<!\d)(\d{2})\s(\d{2})\s(\d{4})(?!\d)/g;while((m=re2.exec(ln)))push(m[1],m[2],m[3],i);
    const re3=/(\d{1,2})\s*([A-Za-zÀ-ú]{3})[A-Za-zÀ-ú\/]*\s*(\d{4}|\d{2})(?!\d)/g;
    while((m=re3.exec(ln))){const mo=AV_MON[m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')];if(mo)push(m[1],mo,m[3],i);}
  });
  if(!out.length)return null;
  out.sort((a,b)=>b.s-a.s||b.dt-a.dt);
  const d=out[0].dt,z=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
}
async function avOcrDoc(){
  const en=avEn(),btn=document.getElementById('doc-ocr-btn'),st=document.getElementById('doc-ocr-status');
  const f=typeof pendingDocFile!=='undefined'?pendingDocFile:null;
  if(!f||!/^image\//.test(f.type||'')||!f.data){toast(en?'Attach a photo of the document first (JPG/PNG).':'Junta primeiro uma foto do documento (JPG/PNG).');return;}
  const say=m=>{if(st){st.style.display='block';st.textContent=m;}};
  if(btn)btn.disabled=true;
  say(en?'Preparing the reader… (the first time it downloads ~7 MB; after that it works offline)':'A preparar o leitor… (na 1.ª vez descarrega ~7 MB; depois funciona sem internet)');
  let worker=null;
  try{
    worker=await avOcrWorker(m=>{if(m&&m.status==='recognizing text')say((en?'Reading… ':'A ler… ')+Math.round((m.progress||0)*100)+'%');});
    say(en?'Reading the photo…':'A ler a foto…');
    const res=await worker.recognize(f.data);
    const d=avFindExpiry(res&&res.data&&res.data.text);
    if(d){const inp=document.getElementById('doc-expiry');if(inp)inp.value=d;const p=d.split('-');say((en?'✓ Expiry found: ':'✓ Validade encontrada: ')+p[2]+'/'+p[1]+'/'+p[0]+(en?' — check it before saving.':' — confirma antes de gravar.'));}
    else say(en?'I couldn’t find an expiry date in this photo — fill it in by hand.':'Não encontrei uma data de validade nesta foto — preenche à mão.');
  }catch(e){
    say(e&&e.message==='load'?(en?'No Internet: the reader must be downloaded once (about 10 MB).':'Sem internet: o leitor tem de ser descarregado uma vez (cerca de 10 MB).'):(en?'Couldn’t read the photo.':'Não consegui ler a foto.'));
  }finally{if(worker){try{await worker.terminate();}catch(e){}}if(btn)btn.disabled=false;}
}
(function(){
  if(typeof openDocModal!=='function')return;
  const odm=openDocModal;
  openDocModal=function(){const r=odm.apply(this,arguments);const b=document.getElementById('doc-ocr-btn'),s=document.getElementById('doc-ocr-status');if(b)b.textContent=avEn()?'🔍 Read the expiry from the photo':'🔍 Ler a validade da foto';if(s){s.style.display='none';s.textContent='';}return r;};
})();


/* ══ v9.72 — passwords fora do HTML dos botões · lista de passwords desenhada em lotes ══ */
function avEntry(id){return (typeof vault!=='undefined'?vault:[]).find(x=>x.id===id);}
function avCopyPw(id){const e=avEntry(id);if(e&&e.pw)copyText(e.pw,t('pwCopied'));}
function avGoSite(id){const e=avEntry(id);if(e&&e.url)goToSiteEntry(e.url,e.pw);}
function avReadTogglePw(id){const e=avEntry(id),el=document.getElementById('read-pw');if(!e||!el)return;el.textContent=el.classList.contains('masked')?e.pw:'••••••••••••';el.classList.toggle('masked');}
let _avChunk={tok:0,grid:null,arr:null,i:0};
function avChunkRender(grid,head,arr){
  const tok=++_avChunk.tok,FIRST=40,STEP=60;
  _avChunk.grid=grid;_avChunk.arr=arr;_avChunk.i=Math.min(FIRST,arr.length);
  grid.innerHTML=head+arr.slice(0,_avChunk.i).join('');
  const next=()=>{
    if(tok!==_avChunk.tok||_avChunk.i>=arr.length)return;
    grid.insertAdjacentHTML('beforeend',arr.slice(_avChunk.i,_avChunk.i+STEP).join(''));_avChunk.i+=STEP;
    if(_avChunk.i<arr.length)(window.requestIdleCallback?requestIdleCallback(next,{timeout:100}):setTimeout(next,16));
  };
  if(_avChunk.i<arr.length)setTimeout(next,0);
}
function avFlushChunks(){const c=_avChunk;if(c.grid&&c.arr&&c.i<c.arr.length){c.grid.insertAdjacentHTML('beforeend',c.arr.slice(c.i).join(''));c.i=c.arr.length;}}


/* ── abas vazias: botão para começar (só aparece quando a aba não tem nada) ── */
function avEnhanceEmpty(forTab){
  const T=forTab||avCurTab;
  const k=AV_TAB_ADD[T],t=k&&avFind(k);
  const tab=document.getElementById('tab-'+T);if(!tab)return;
  tab.querySelectorAll('.av-empty-cta').forEach(b=>{const br=b.previousElementSibling;if(br&&br.tagName==='BR')br.remove();b.remove();});
  const en=avEn(),desk=avIsDesk();
  // Notas: a mensagem é o espaço «nenhuma nota aberta» — com notas, não precisa de dica nem de botão
  if(T==='notes'){
    const txt=document.getElementById('notes-empty-txt'),has=typeof notes!=='undefined'&&notes.some(n=>!n.archived);
    if(txt)txt.textContent=has?(en?'Select a note':'Seleciona uma nota'):(en?'No notes yet':'Ainda não tens notas');
    const ne=document.getElementById('notes-empty');if(ne){let hint=ne.querySelector('.av-empty-hint');if(has){if(hint)hint.remove();}else{if(!hint){hint=document.createElement('div');hint.className='av-empty-hint';ne.appendChild(hint);}hint.textContent=avHintText(t,en,desk);}}
    return;
  }
  if(!t)return;
  tab.querySelectorAll('.empty-state,.av-empty').forEach(es=>{
    if(/＋/.test(es.textContent.replace((es.querySelector('.av-empty-hint')||{}).textContent||'','')))return; // já aponta para o ＋
    let hint=es.querySelector('.av-empty-hint');
    if(!hint){hint=document.createElement('div');hint.className='av-empty-hint';es.appendChild(hint);}
    hint.textContent=avHintText(t,en,desk);
  });
}
function avHintText(t,en,desk){
  const lbl=t?avT(t.n):(en?'Add':'Adicionar');
  return desk?(en?'↗ Tap “＋ '+lbl+'” at the top to get started.':'↗ Toca em «＋ '+lbl+'», em cima, para começar.'):(en?'↘ Tap the ＋ at the bottom right to get started.':'↘ Toca no ＋ em baixo, à direita, para começar.');
}
(function(){
  if(typeof switchTab==='function'){const st=switchTab;switchTab=function(){const r=st.apply(this,arguments);requestAnimationFrame(()=>{try{avEnhanceEmpty();}catch(e){}});return r;};}
  if(typeof renderAll==='function'){const ra=renderAll;renderAll=function(){const r=ra.apply(this,arguments);requestAnimationFrame(()=>{try{avEnhanceEmpty();}catch(e){}});return r;};}
})();


/* ══ v9.74 — APRESENTAÇÃO ANIMADA DA AURORA (tutorial em 8 passos) ══ */
const AV_TOUR=[
 {k:'hello',t:['Olá! Sou a Aurora ✨','Hi! I’m Aurora ✨'],d:['Este é o teu cofre: tudo o que guardas aqui fica encriptado e só tu o consegues abrir. Vou mostrar-te o essencial em 8 passos — demora 2 minutos.','This is your vault: everything you store here is encrypted and only you can open it. I’ll show you the essentials in 8 steps — it takes 2 minutes.']},
 {k:'search',el:()=>avIsDesk()?document.getElementById('search-input'):document.getElementById('tb-search-btn'),t:['Pesquisa tudo','Search everything'],d:['Passwords, documentos, cartões, notas… escreve e encontras em segundos.','Passwords, documents, cards, notes… type and find it in seconds.']},
 {k:'add',el:()=>avIsDesk()?document.getElementById('tb-add'):document.getElementById('av-fab-add'),t:['Tudo começa aqui: ＋ Adicionar','Everything starts here: ＋ Add'],d:['Passwords, cartões, documentos, notas, códigos 2FA… Em cada aba, este botão já sabe o que queres criar.','Passwords, cards, documents, notes, 2FA codes… In each tab this button already knows what you want to create.'],task:['Toca no ＋ e guarda a tua primeira password. Eu espero ✨','Tap ＋ and save your first password. I’ll wait ✨'],go:()=>avAddType('password'),check:s=>(typeof vault!=='undefined'?vault.length:0)>s.v0},
 {k:'tabs',el:()=>{const g=document.getElementById('grp-btn-dashboard');return g&&g.parentElement;},t:['As tuas áreas','Your areas'],d:['Cofre (passwords e 2FA), Cartões (bancários e de loja), Documentos (e notas)… Toca numa para a abrir.','Vault (passwords and 2FA), Cards (bank and store), Documents (and notes)… Tap one to open it.']},
 {k:'saved',el:()=>document.getElementById('tb-save-state'),t:['Grava sozinho','Saves by itself'],d:['Cada alteração fica gravada automaticamente — e, se ligares o Google Drive, sincronizada com os teus outros dispositivos.','Every change is saved automatically — and, if you connect Google Drive, synced with your other devices.']},
 {k:'aurora',el:()=>{const l=document.querySelector('.aur-launch');return avtVisible(l)?l:document.getElementById('aurora-fab');},t:['Fala comigo','Talk to me'],d:['Pede-me coisas por palavras: «qual o meu NIF?», «o que expira este mês?». E carrega ficheiros com o 📎 — eu arrumo-os onde disseres.','Ask me things in plain words: “what’s my tax number?”, “what expires this month?”. And upload files with the 📎 — I’ll put them where you say.']},
 {k:'more',el:()=>document.getElementById('tb-more-btn'),t:['Mais opções','More options'],d:['Definições, modo de privacidade, calendário e idioma estão aqui.','Settings, privacy mode, calendar and language live here.']},
 {k:'lock',el:()=>document.querySelector('.topbar-actions .tb-lock-btn'),t:['Bloquear','Lock'],d:['Quando terminares, bloqueia. Para entrares mais depressa, ativa o PIN ou a impressão digital em Definições → Segurança.','When you’re done, lock it. To get in faster, turn on PIN or fingerprint in Settings → Security.']}
];
const AVT={on:false,i:0,st:{},typ:0,poll:0,paused:false};
function avtReduce(){return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function avTourStart(){
  if(typeof masterKey==='undefined'||!masterKey)return;
  try{if(typeof aurClose==='function')aurClose(true);}catch(e){}
  try{avAddClose();tbCloseMore&&tbCloseMore();}catch(e){}
  document.querySelectorAll('.modal-overlay.open,[id$="-overlay"].open').forEach(o=>o.classList.remove('open'));
  try{if(avCurTab!=='dashboard')switchTab('dashboard');}catch(e){}
  window.scrollTo({top:0});
  let r=document.getElementById('avt-root');
  if(!r){r=document.createElement('div');r.id='avt-root';r.innerHTML='<div class="avt-block"></div><div class="avt-block"></div><div class="avt-block"></div><div class="avt-block"></div><div id="avt-spot" class="center"><i></i></div><div id="avt-bub" role="dialog" aria-live="polite"></div>';document.body.appendChild(r);}
  AVT.on=true;AVT.i=0;AVT.st={v0:typeof vault!=='undefined'?vault.length:0};AVT.paused=false;r.classList.remove('paused');
  try{localStorage.setItem('av_tour_offered','1');}catch(e){}
  document.addEventListener('keydown',avtKey,true);window.addEventListener('resize',avtPlace);
  clearInterval(AVT.poll);AVT.poll=setInterval(avtTick,450);
  avtRender();
}
function avtKey(e){if(!AVT.on||AVT.paused)return;if(e.key==='Escape'){e.preventDefault();avTourEnd();}else if(e.key==='ArrowRight'||e.key==='Enter'){if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;e.preventDefault();avtNext();}else if(e.key==='ArrowLeft'){e.preventDefault();avtPrev();}}
function avtVisible(el){if(!el)return false;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;}
function avtTarget(){const s=AV_TOUR[AVT.i];if(!s||!s.el)return null;const el=s.el();if(!avtVisible(el))return null;return el.getBoundingClientRect();}
function avtPlace(){
  if(!AVT.on)return;
  const spot=document.getElementById('avt-spot'),bub=document.getElementById('avt-bub'),bl=document.querySelectorAll('#avt-root .avt-block');if(!spot||!bub)return;
  const W=innerWidth,H=innerHeight,r=avtTarget(),p=8;
  let sx,sy,sw,sh;
  if(r){sx=r.left-p;sy=r.top-p;sw=r.width+2*p;sh=r.height+2*p;spot.classList.remove('center');}
  else{sx=W/2;sy=H/2;sw=0;sh=0;spot.classList.add('center');}
  Object.assign(spot.style,{left:sx+'px',top:sy+'px',width:sw+'px',height:sh+'px'});
  // bloqueia cliques fora do foco (o elemento em foco continua clicável)
  const box=[[0,0,W,Math.max(0,sy)],[0,sy+sh,W,Math.max(0,H-sy-sh)],[0,sy,Math.max(0,sx),sh],[sx+sw,sy,Math.max(0,W-sx-sw),sh]];
  bl.forEach((b,i)=>{const q=box[i];Object.assign(b.style,{left:q[0]+'px',top:q[1]+'px',width:q[2]+'px',height:q[3]+'px'});});
  const bw=bub.offsetWidth||370,bh=bub.offsetHeight||200;let bx,by;
  if(!r){bx=(W-bw)/2;by=(H-bh)/2;}
  else{
    bx=Math.min(W-bw-14,Math.max(14,r.left+r.width/2-bw/2));
    if(r.bottom+22+bh<H)by=r.bottom+22;else if(r.top-22-bh>0)by=r.top-22-bh;else{by=Math.max(14,(H-bh)/2);bx=r.left>W/2?Math.max(14,r.left-bw-24):Math.min(W-bw-14,r.right+24);}
  }
  Object.assign(bub.style,{left:Math.round(bx)+'px',top:Math.round(by)+'px'});
}
function avtRender(){
  const s=AV_TOUR[AVT.i],bub=document.getElementById('avt-bub');if(!s||!bub)return;
  const en=avEn(),last=AVT.i===AV_TOUR.length-1,done=s.check&&s.check(AVT.st);
  bub.classList.remove('show');
  bub.innerHTML='<div class="avt-h"><i>✨</i>Aurora · '+(en?'step ':'passo ')+(AVT.i+1)+(en?' of ':' de ')+AV_TOUR.length+'</div><div class="avt-t">'+avT(s.t)+'</div><div class="avt-d" id="avt-d"></div>'
   +(s.task&&!done?'<div class="avt-task">👉 '+avT(s.task)+'</div>':'')
   +'<div class="avt-f"><div class="avt-dots">'+AV_TOUR.map((x,i)=>'<span class="'+(i===AVT.i?'on':(i<AVT.i?'ok':''))+'"></span>').join('')+'</div>'
   +'<button class="avt-b" data-act="avTourEnd">'+(en?'Skip':'Saltar')+'</button>'
   +(s.task&&!done?'<button class="avt-b go" data-act="avtShowMe">'+(en?'Show me':'Mostra-me')+'</button>':'<button class="avt-b go" data-act="avtNext">'+(last?(en?'Finish ✨':'Terminar ✨'):(en?'Next →':'Seguinte →'))+'</button>')+'</div>';
  avtPlace();requestAnimationFrame(()=>{avtPlace();bub.classList.add('show');});
  const d=document.getElementById('avt-d'),txt=avT(s.d);clearInterval(AVT.typ);
  if(avtReduce()){d.textContent=txt;}else{let n=0;AVT.typ=setInterval(()=>{n+=3;d.textContent=txt.slice(0,n);if(n>=txt.length)clearInterval(AVT.typ);},16);}
}
function avtNext(){if(AVT.i<AV_TOUR.length-1){AVT.i++;avtRender();}else avTourFinish();}
function avtPrev(){if(AVT.i>0){AVT.i--;avtRender();}}
function avtShowMe(){const s=AV_TOUR[AVT.i];AVT.paused=true;AVT.pauseAt=Date.now();document.getElementById('avt-root').classList.add('paused');try{s.go();}catch(e){}}
function avtTick(){
  if(!AVT.on)return;
  const s=AV_TOUR[AVT.i],root=document.getElementById('avt-root');if(!root)return;
  const busy=!!document.querySelector('.modal-overlay.open,[id$="-overlay"].open,#av-add-pop.open,#note-editor.open');
  if(s&&s.check&&s.check(AVT.st)&&!busy){AVT.paused=false;root.classList.remove('paused');avtNext();return;}
  if(busy&&!AVT.paused){AVT.paused=true;AVT.pauseAt=Date.now();root.classList.add('paused');return;}
  if(!busy&&AVT.paused&&Date.now()-AVT.pauseAt>600){AVT.paused=false;root.classList.remove('paused');avtRender();return;}
  if(!AVT.paused)avtPlace();
}
function avTourFinish(){
  const en=avEn(),bub=document.getElementById('avt-bub');AVT.i=AV_TOUR.length;
  const spot=document.getElementById('avt-spot');spot.classList.add('center');
  bub.innerHTML='<div class="avt-h"><i>✨</i>Aurora</div><div class="avt-t">'+(en?'You’re ready ✨':'Estás pronto ✨')+'</div><div class="avt-d">'+(en?'That’s it! Whenever you need me, ask — or type «tutorial» to see this again.':'É isto! Sempre que precisares, pergunta-me — ou escreve «tutorial» para veres isto outra vez.')+'</div><div class="avt-f"><div class="avt-dots">'+AV_TOUR.map(()=>'<span class="ok"></span>').join('')+'</div><button class="avt-b" data-act="avTourStart">'+(en?'Again':'Repetir')+'</button><button class="avt-b go" data-act="avTourEnd">'+(en?'Done':'Terminar')+'</button></div>';
  avtPlace();
  try{localStorage.setItem('av_tour_done','1');}catch(e){}
  if(!avtReduce()){const cx=innerWidth/2,cy=innerHeight/2;for(let k=0;k<40;k++){const s=document.createElement('i');s.className='avt-star';const a=Math.random()*Math.PI*2,dist=120+Math.random()*260;s.style.left=cx+'px';s.style.top=cy+'px';s.style.setProperty('--dx',Math.cos(a)*dist+'px');s.style.setProperty('--dy',Math.sin(a)*dist+'px');s.style.animationDelay=(Math.random()*.25)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1800);}}
}
function avTourEnd(){AVT.on=false;clearInterval(AVT.poll);clearInterval(AVT.typ);document.removeEventListener('keydown',avtKey,true);window.removeEventListener('resize',avtPlace);const r=document.getElementById('avt-root');if(r)r.remove();}
function avTourOffer(){
  if(AVT.on||typeof masterKey==='undefined'||!masterKey)return;
  try{if(localStorage.getItem('av_tour_offered')==='1')return;localStorage.setItem('av_tour_offered','1');}catch(e){}
  setTimeout(()=>{try{auroraOpen();AUR.lang=aurAppLang();aurSay(aurL('✨ Olá! Queres que te mostre como funciona o cofre? Demora 2 minutos.','✨ Hi! Would you like me to show you how the vault works? It takes 2 minutes.'),[{label:aurL('Sim, mostra-me','Yes, show me'),fn:()=>avTourStart()},{label:aurL('Agora não','Not now'),fn:()=>aurSay(aurL('Ok! Quando quiseres, escreve «tutorial».','Ok! Whenever you like, type “tutorial”.'))}]);}catch(e){}},900);
}
const AV_TOUR_RX=/\b(tutorial|apresentacao|visita guiada|tour|guia rapido)\b|como funciona (a app|isto|o cofre|a aplicacao)|mostra[- ]?me como (funciona|se usa)|ensina[- ]?me|show me around|how does (this|the app|it) work/;
(function(){
  if(typeof aurHandle==='function'){const ah=aurHandle;aurHandle=function(raw){
    if(typeof avFileHandleText==='function'&&avFileHandleText(raw))return true;
    if(AV_TOUR_RX.test(aurNorm(raw||''))){const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;aurSay(aurL('Vamos a isso! ✨','Let’s go! ✨'));setTimeout(avTourStart,500);return true;}
    return ah.apply(this,arguments);};}
  if(typeof aurHelp==='function'){const hp=aurHelp;aurHelp=function(){const r=hp.apply(this,arguments);aurSay(aurL('🎓 Queres uma apresentação guiada? Escreve «tutorial». 📎 Para guardar ficheiros, usa o clipe ou arrasta-os para aqui.','🎓 Want a guided tour? Type “tutorial”. 📎 To store files, use the paperclip or drag them here.'),[{label:aurL('Ver a apresentação','Start the tour'),fn:()=>avTourStart()}]);return r;};}
})();


/* ══ v9.74 — AURORA RECEBE FICHEIROS: lê, propõe o destino, cria pastas e guarda (sempre com confirmação) ══ */
const AV_PDF_URL='vendor/pdfjs-3.11.174/pdf.min.js'; // alojado aqui (ver o OCR acima)
const AV_PDF_WORKER=new URL('vendor/pdfjs-3.11.174/pdf.worker.min.js',location.href).href;
let _avPdf=null;
function avLoadPdf(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(_avPdf)return _avPdf;
  _avPdf=new Promise((res,rej)=>{const s=document.createElement('script');s.src=AV_PDF_URL;s.async=true;s.onload=()=>{if(!window.pdfjsLib)return rej(new Error('load'));try{if(!pdfjsLib.GlobalWorkerOptions.workerSrc)pdfjsLib.GlobalWorkerOptions.workerSrc=AV_PDF_WORKER;}catch(e){}res(window.pdfjsLib);};s.onerror=()=>{_avPdf=null;s.remove();rej(new Error('load'));};document.head.appendChild(s);});
  return _avPdf;
}
async function avPdfText(dataUrl){
  const lib=await avLoadPdf();
  const buf=new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
  const doc=await lib.getDocument({data:buf,isEvalSupported:false}).promise;let out='';
  for(let p=1;p<=Math.min(3,doc.numPages);p++){const pg=await doc.getPage(p);const tc=await pg.getTextContent();out+=tc.items.map(x=>x.str).join(' ')+'\n';}
  try{doc.destroy();}catch(e){}
  return out.slice(0,8000);
}
async function avOcrText(dataUrl){
  const w=await avOcrWorker();
  try{const r=await w.recognize(dataUrl);return (r&&r.data&&r.data.text)||'';}finally{try{await w.terminate();}catch(e){}}
}
const AVF_KINDS=[
 {k:'identidade',cat:'pessoal',rx:/cartao de cidadao|citizen card|passaporte|passport|carta de conducao|driving licen|bilhete de identidade|titulo de residencia/,t:['documento de identificação','ID document'],f:['identificacao','identidade','pessoal','documentos pessoais']},
 {k:'seguro',cat:'pessoal',rx:/apolice|seguro|seguradora|insurance|policy/,t:['apólice de seguro','insurance policy'],f:['seguros','seguro']},
 {k:'carro',cat:'pessoal',rx:/\b(iuc|inspecao|ipo|dua|livrete|imposto unico de circulacao|oficina|revisao do carro)\b/,t:['documento do carro','car document'],f:['carro','automovel','veiculo','viatura','carros']},
 {k:'fatura',cat:'outro',rx:/fatura|factura|invoice|recibo|receipt|talao|garantia|warranty|nota de credito/,t:['fatura / recibo','invoice / receipt'],f:['faturas','garantias','compras','recibos']},
 {k:'saude',cat:'saude',rx:/receita medica|analises|relatorio medico|consulta|hospital|clinica|vacina|atestado medico/,t:['documento de saúde','health document'],f:['saude','medico','medicos']},
 {k:'banco',cat:'banco',rx:/extrato|credito habitacao|emprestimo|contrato de credito|bank statement|mortgage|\biban\b/,t:['documento bancário','bank document'],f:['banco','bancos','financas']},
 {k:'impostos',cat:'juridico',rx:/\birs\b|autoridade tributaria|\bimi\b|declaracao de rendimentos|nota de liquidacao|tax return/,t:['documento de impostos','tax document'],f:['impostos','irs','financas']},
 {k:'trabalho',cat:'trabalho',rx:/contrato de trabalho|recibo de vencimento|entidade patronal|payslip|employment contract/,t:['documento de trabalho','work document'],f:['trabalho','emprego']},
 {k:'casa',cat:'juridico',rx:/escritura|caderneta predial|licenca de utilizacao|contrato de arrendamento|condominio|projeto de arquitetura/,t:['documento da casa','home document'],f:['casa','habitacao']},
 {k:'escola',cat:'educacao',rx:/certificado de habilitacoes|diploma|matricula escolar|universidade|escola|certificado de formacao/,t:['documento de educação','education document'],f:['educacao','escola','formacao']}
];
const AVF={q:null};
function avFolderPath(id){const out=[];let f=docFolders.find(x=>x.id===id),guard=0;while(f&&guard++<20){out.unshift(f.name);f=docFolders.find(x=>x.id===f.parentId);}return out;}
function avToks(s){return aurNorm(s||'').replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>=3);}
function avFileSuggest(q){
  const nameT=new Set(avToks(q.files.map(f=>f.name).join(' ')+' '+(q.kind?q.kind.f.join(' '):'')));
  const folders=(typeof docFolders!=='undefined'?docFolders:[]).map(f=>{const path=avFolderPath(f.id);let s=0;path.forEach(seg=>avToks(seg).forEach(t=>{if(nameT.has(t))s+=2;if(q.kind&&q.kind.f.includes(t))s+=3;}));return {f,path,s};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||b.path.length-a.path.length).slice(0,2);
  const allT=new Set(avToks(q.files.map(f=>f.name).join(' ')+' '+(q.text||'').slice(0,1500)));
  const assetsM=(typeof assets!=='undefined'?assets:[]).map(a=>({a,s:avToks(a.name).filter(t=>allT.has(t)).length})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,1);
  return {folders,assetsM};
}
function avAssetLabelFull(a){const m={warranty:['Garantia','Warranty'],license:['Licença','Licence'],vehicle:['Veículo','Vehicle'],dates:['Data','Date']}[a.kind]||['Bem','Asset'];return avT(m)+' · '+a.name;}
async function avFilesReceive(list){
  const en=avEn(),files=[...(list||[])].filter(f=>f&&f.size>=0).slice(0,10);if(!files.length)return;
  try{auroraOpen();}catch(e){}AUR.lang=aurAppLang();
  const big=files.filter(f=>f.size>50*1048576);
  if(big.length){aurSay(aurL('⚠️ Ficheiros acima de 50 MB não podem ir para o cofre: ','⚠️ Files over 50 MB can’t go into the vault: ')+big.map(f=>'<b>'+esc(f.name)+'</b>').join(', ')+'.');}
  const ok=files.filter(f=>f.size<=50*1048576);if(!ok.length)return;
  AUR.out(ok.map(f=>'<span class="av-fchip">📎 <b>'+esc(f.name)+'</b> <span class="a-dim">· '+(typeof formatFileSize==='function'?formatFileSize(f.size):Math.round(f.size/1024)+' KB')+'</span></span>').join(''),'me');
  const typing=AUR.out('<span class="a-dim">'+aurL('A ler…','Reading…')+'</span>','ai');
  const read=await Promise.all(ok.map(f=>new Promise(res=>{const r=new FileReader();r.onload=()=>res({name:f.name,type:f.type||'',size:f.size,data:r.result});r.onerror=()=>res(null);r.readAsDataURL(f);})));
  const fl=read.filter(Boolean);
  let text='';
  for(const f of fl){if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){try{text+=await Promise.race([avPdfText(f.data),new Promise((_,rj)=>setTimeout(()=>rj(new Error('t')),12000))]);}catch(e){}}}
  if(typing&&typing.remove)typing.remove();
  const nt=aurNorm(fl.map(f=>f.name.replace(/[_\-.]+/g,' ')).join(' ')+' '+text);
  const kind=AVF_KINDS.find(k=>k.rx.test(nt))||null;
  let expiry='';try{const d=text&&avFindExpiry(text);if(d)expiry=d;}catch(e){}
  AVF.q={files:fl,kind,text,expiry,plan:null,awaiting:true};
  avFileAsk();
}
function avFileAsk(){
  const q=AVF.q;if(!q)return;const en=avEn(),n=q.files.length;
  const sug=avFileSuggest(q),chips=[];
  sug.assetsM.forEach(x=>chips.push({label:'🏠 '+aurL('Anexar a ','Attach to ')+avAssetLabelFull(x.a),fn:()=>avFilePlan({dest:{type:'asset',id:x.a.id}})}));
  sug.folders.forEach(x=>chips.push({label:'📁 '+aurL('Documentos','Documents')+' › '+x.path.join(' › '),fn:()=>avFilePlan({dest:{type:'doc',path:x.path}})}));
  chips.push({label:'📁 '+aurL('Documentos (sem pasta)','Documents (no folder)'),fn:()=>avFilePlan({dest:{type:'doc',path:[]}})});
  chips.push({label:'➕ '+aurL('Nova pasta…','New folder…'),fn:()=>{AVF.q.ask='folder';aurSay(aurL('Como se chama a pasta? Podes pôr subpastas: «Casa/Seguros».','What’s the folder called? You can nest: “Home/Insurance”.'));}});
  if(typeof assets!=='undefined'&&assets.length)chips.push({label:'🏠 '+aurL('Anexar a um bem…','Attach to an asset…'),fn:()=>aurSay(aurL('A qual?','Which one?'),assets.slice(0,10).map(a=>({label:avAssetLabelFull(a),fn:()=>avFilePlan({dest:{type:'asset',id:a.id}})})))});
  if(!q.expiry&&q.files.length===1&&/^image\//.test(q.files[0].type))chips.push({label:'🔍 '+aurL('Ler validade da foto','Read expiry from photo'),fn:()=>avFileOcr()});
  chips.push({label:aurL('Cancelar','Cancel'),fn:()=>{AVF.q=null;aurSay(aurL('Ok, não guardei nada.','Ok, nothing was saved.'));}});
  const what=q.kind?aurL(' Parece '+(n>1?'ser ':'uma ')+'<b>'+q.kind.t[0]+'</b>.',' Looks like '+(n>1?'':'a ')+'<b>'+q.kind.t[1]+'</b>.'):'';
  const exp=q.expiry?aurL('\n⏳ Encontrei a validade <b>','\n⏳ I found the expiry <b>')+aurDate(q.expiry)+'</b>.':'';
  const heavy=q.files.reduce((s,f)=>s+f.size,0)>15*1048576?aurL('\n⚠️ São ficheiros grandes — o cofre fica mais pesado de gravar e sincronizar.','\n⚠️ These are large files — the vault gets heavier to save and sync.'):'';
  aurSay('📄 '+aurL(n>1?'Recebi <b>'+n+' ficheiros</b>.':'Recebi <b>'+esc(q.files[0].name)+'</b>.',n>1?'I got <b>'+n+' files</b>.':'I got <b>'+esc(q.files[0].name)+'</b>.')+what+exp+heavy+aurL('\nOnde queres guardar?','\nWhere should I store it?')+'<div class="a-dim" style="margin-top:6px">'+aurL('Ou diz-me por palavras: <i>«cria a pasta Casa/Seguros e guarda lá, chama-lhe Apólice Casa»</i>','Or tell me: <i>“create the folder Home/Insurance and put it there, call it Home Policy”</i>')+'</div>',chips);
}
async function avFileOcr(){
  const q=AVF.q;if(!q)return;aurSay(aurL('🔍 A ler a foto… (na 1.ª vez descarrega o leitor)','🔍 Reading the photo… (the first time it downloads the reader)'));
  try{const t=await avOcrText(q.files[0].data);q.text=(q.text||'')+'\n'+t;const d=avFindExpiry(t);if(d){q.expiry=d;}const nt=aurNorm(t);if(!q.kind)q.kind=AVF_KINDS.find(k=>k.rx.test(nt))||null;}
  catch(e){aurSay(aurL('Não consegui ler a foto (sem internet na 1.ª vez?).','Couldn’t read the photo (no Internet the first time?).'));}
  avFileAsk();
}
function avFileParse(raw){
  const r=' '+raw.trim()+' ',n=aurNorm(raw),out={};
  const STOP='(?=\\s+(?:e|and)\\s+(?:guarda|guardar|guarde|p[õo]e|mete|coloca|save|put|store)|\\s*[,;.]|\\s+(?:chama|call|name|com\\s+(?:a\\s+)?validade|validade|v[aá]lid|expir)|\\s*$)';
  if(/^(cancela|cancelar|nao|não|esquece|cancel|no|stop)$/i.test(raw.trim()))return {cancel:true};
  let m;
  if((m=r.match(new RegExp('(?:cria|criar|crie|faz|faca|faça|nova|novo|create|make|new)\\s+(?:uma\\s+|a\\s+|the\\s+|a new\\s+)?(?:nova\\s+)?(?:pasta|folder)\\s+(?:chamada\\s+|called\\s+|com o nome\\s+|named\\s+)?[«"]?([^»",;]+?)[»"]?'+STOP,'i'))))out.dest={type:'doc',path:m[1].split(/\s*[\/›>]\s*/).filter(Boolean),create:true};
  else if((m=r.match(new RegExp('(?:documentos|documents)\\s*[›>\\/]\\s*([^,;]+?)'+STOP,'i'))))out.dest={type:'doc',path:m[1].split(/\s*[\/›>]\s*/).filter(Boolean)};
  else if((m=r.match(new RegExp('(?:na|numa|para a|em|dentro da|in|into|to)\\s+(?:the\\s+)?(?:pasta|folder)\\s+[«"]?([^»",;]+?)[»"]?'+STOP,'i'))))out.dest={type:'doc',path:m[1].split(/\s*[\/›>]\s*/).filter(Boolean)};
  else if((m=r.match(new RegExp('(?:garantia|ve[íi]culo|carro|mota|licen[cç]a|\\bbem\\b|\\bbens\\b|warranty|vehicle|\\bcar\\b|licen[cs]e|asset)s?\\s*(?:d[oa]s?|of|to|for)?\\s+([^,;]+?)'+STOP,'i')))&&/\b(anexa|anexar|junta|juntar|poe|mete|coloca|guarda|attach|add|put)\b/.test(n)){
    const w=aurNorm(m[1]);const kw=/garantia|warranty/.test(n)?'warranty':/veiculo|carro|mota|vehicle|\bcar\b/.test(n)?'vehicle':/licen/.test(n)?'license':null;
    let best=null,bs=0;(assets||[]).forEach(a=>{const s=avToks(a.name).filter(t=>w.includes(t)).length+(kw&&a.kind===kw?.5:0);if(s>bs){bs=s;best=a;}});
    if(!best&&kw){const k=(assets||[]).filter(a=>a.kind===kw);if(k.length===1)best=k[0];}
    out.dest=best?{type:'asset',id:best.id}:{type:'unknown',what:m[1]};
  }
  else if((m=r.match(new RegExp('(?:password|acesso|conta|entrada|account|entry)\\s*(?:d[oa]|of|to|for)?\\s+([^,;]+?)'+STOP,'i')))&&/\b(anexa|anexar|junta|juntar|attach)\b/.test(n)){
    const w=aurNorm(m[1]);let best=null,bs=0;(vault||[]).forEach(v=>{const s=avToks(v.name).filter(t=>w.includes(t)).length;if(s>bs){bs=s;best=v;}});
    out.dest=best?{type:'entry',id:best.id}:{type:'unknown',what:m[1]};
  }
  else if(/\b(sem pasta|na raiz|raiz|so nos documentos|nos documentos|no folder|root)\b/.test(n))out.dest={type:'doc',path:[]};
  if((m=r.match(/(?:chama[- ]?lhe|chama-se|com o nome|d[aá]-lhe o nome|t[íi]tulo|call it|name it|named|title)\s+[«"]?([^»",;]+?)[»"]?(?=\s*[,;.]|\s+(?:com|e|and|validade|v[aá]lid|expir|na|em|in|into)\b|\s*$)/i)))out.name=m[1].trim();
  if((m=n.match(/(?:validade|valido ate|valida ate|expira(?:\s+a|\s+em)?|expiry|expires|valid until)\s*:?\s*(.{4,40})/))){const d=aurParseDate(m[1]);if(d){const z=x=>String(x).padStart(2,'0');out.expiry=d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());}}
  return out;
}
function avFileHandleText(raw){
  const q=AVF.q;if(!q||!q.awaiting||!raw)return false;
  const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;
  if(q.ask==='folder'){q.ask=null;const path=raw.split(/\s*[\/›>]\s*/).map(s=>s.trim()).filter(Boolean);if(path.length){avFilePlan({dest:{type:'doc',path,create:true}});return true;}}
  const p=avFileParse(raw);
  if(p.cancel){AVF.q=null;aurSay(aurL('Ok, não guardei nada.','Ok, nothing was saved.'));return true;}
  if(!p.dest&&!p.name&&!p.expiry)return false;
  if(p.dest&&p.dest.type==='unknown'){aurSay(aurL('Não encontrei «','I couldn’t find “')+esc(p.dest.what)+aurL('». Escolhe um destino:','”. Pick a destination:'));avFileAsk();return true;}
  avFilePlan(p);return true;
}
function avFilePlan(p){
  const q=AVF.q;if(!q)return;const plan=q.plan||{};
  if(p.dest)plan.dest=p.dest;if(p.name)plan.name=p.name;if(p.expiry)plan.expiry=p.expiry;
  if(!plan.dest)plan.dest={type:'doc',path:[]};if(!plan.expiry&&q.expiry)plan.expiry=q.expiry;
  q.plan=plan;
  const en=avEn(),n=q.files.length;let where='';
  if(plan.dest.type==='doc'){
    let parent=null,exists=true;for(const seg of plan.dest.path){const f=docFolders.find(x=>(x.parentId||null)===parent&&aurNorm(x.name)===aurNorm(seg));if(!f){exists=false;break;}parent=f.id;}
    where='<b>'+aurL('Documentos','Documents')+(plan.dest.path.length?' › '+plan.dest.path.map(esc).join(' › '):'')+'</b>'+(exists?'':' <span class="a-dim">('+aurL('pasta nova','new folder')+')</span>');
  }else if(plan.dest.type==='asset'){const a=assets.find(x=>x.id===plan.dest.id);where='<b>'+esc(a?avAssetLabelFull(a):'?')+'</b> <span class="a-dim">('+aurL('anexo','attachment')+')</span>';}
  else if(plan.dest.type==='entry'){const v=vault.find(x=>x.id===plan.dest.id);where='<b>'+esc(v?v.name:'?')+'</b> <span class="a-dim">('+aurL('anexo da password','password attachment')+')</span>';}
  const nm=plan.dest.type==='doc'?(n===1?'• <b>'+esc(plan.name||q.files[0].name.replace(/\.[^.]+$/,''))+'</b> ('+esc(q.files[0].name)+')\n':'• <b>'+n+aurL(' ficheiros',' files')+'</b>\n'):'• '+q.files.map(f=>esc(f.name)).join(', ')+'\n';
  const ex=plan.expiry&&plan.dest.type!=='entry'?'• '+aurL('validade ','expiry ')+'<b>'+aurDate(plan.expiry)+'</b> — '+aurL('aviso-te antes de expirar','I’ll remind you before it expires')+'\n':'';
  aurSay(aurL('Vou guardar:\n','I’ll store:\n')+nm+'• '+aurL('em ','in ')+where+'\n'+ex+aurL('Confirmas?','Confirm?'),[{label:aurL('Confirmar','Confirm'),fn:()=>avFileSave()},{label:aurL('Mudar destino','Change destination'),fn:()=>{q.plan.dest=null;avFileAsk();}},{label:aurL('Cancelar','Cancel'),fn:()=>{AVF.q=null;aurSay(aurL('Ok, não guardei nada.','Ok, nothing was saved.'));}}]);
}
function avFileSave(){
  const q=AVF.q;if(!q||!q.plan)return;const plan=q.plan,en=avEn(),n=q.files.length;const nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  let openFn=null,where='';
  if(plan.dest.type==='doc'){
    let parent=null;
    for(const seg of plan.dest.path){let f=docFolders.find(x=>(x.parentId||null)===parent&&aurNorm(x.name)===aurNorm(seg));if(!f){f={id:'f'+nid(),name:seg,icon:'📁',parentId:parent};docFolders.push(f);}parent=f.id;}
    const made=q.files.map(f=>{const d={id:nid(),title:(n===1&&plan.name)?plan.name:(f.name.replace(/\.[^.]+$/,'')||f.name),cat:(q.kind&&q.kind.cat)||'outro',date:'',expiry:n===1?(plan.expiry||''):'',desc:'',folderId:parent,file:{name:f.name,size:f.size,type:f.type,data:f.data},createdAt:Date.now()};documents.push(d);return d;});
    where=aurL('Documentos','Documents')+(plan.dest.path.length?' › '+plan.dest.path.join(' › '):'');
    openFn=()=>{switchTab('docs');currentFolderId=parent;try{renderDocs();}catch(e){}setTimeout(()=>{try{openDocModal(made[0].id);}catch(e){}},200);};
  }else if(plan.dest.type==='asset'){
    const a=assets.find(x=>x.id===plan.dest.id);if(!a){aurSay(aurL('Esse bem já não existe.','That asset no longer exists.'));return;}
    a.attachments=(Array.isArray(a.attachments)?a.attachments:[]).concat(q.files.map(f=>({id:nid(),name:f.name,type:f.type,size:f.size,data:f.data})));
    if(plan.expiry&&'expiry' in a&&!a.expiry)a.expiry=plan.expiry;
    where=avAssetLabelFull(a);openFn=()=>{switchTab(a.kind);setTimeout(()=>{try{openAssetModal(a.kind,a.id);}catch(e){}},200);};
  }else if(plan.dest.type==='entry'){
    const v=vault.find(x=>x.id===plan.dest.id);if(!v){aurSay(aurL('Essa password já não existe.','That password no longer exists.'));return;}
    v.attachments=(Array.isArray(v.attachments)?v.attachments:[]).concat(q.files.map(f=>({id:nid(),name:f.name,type:f.type,size:f.size,data:f.data})));
    where=v.name;openFn=()=>{try{openReadMode(v.id);}catch(e){}};
  }
  AVF.q=null;
  try{logActivity('add',q.files.map(f=>f.name).join(', '),'📎');}catch(e){}
  markUnsaved();try{renderAll();}catch(e){}
  aurSay('✓ '+aurL(n>1?'Guardei '+n+' ficheiros em <b>':'Guardado em <b>',n>1?'Stored '+n+' files in <b>':'Stored in <b>')+esc(where)+'</b>.',[{label:aurL('Abrir','Open'),fn:()=>{aurClose();openFn&&openFn();}}]);
}
(function(){
  function wire(){
    const panel=document.getElementById('aurora-panel'),send=document.getElementById('aurora-send');
    if(send&&!document.getElementById('aurora-clip')){
      const b=document.createElement('button');b.id='aurora-clip';b.type='button';b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
      const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.id='aurora-file';inp.style.display='none';inp.onchange=()=>{const f=inp.files;avFilesReceive(f);inp.value='';};
      b.onclick=()=>inp.click();send.parentNode.insertBefore(b,send);send.parentNode.appendChild(inp);
    }
    const c=document.getElementById('aurora-clip');if(c){const l=avEn()?'Upload files':'Carregar ficheiros';c.title=l;c.setAttribute('aria-label',l);}
    if(panel&&!panel.dataset.avDrop){
      panel.dataset.avDrop='1';let dc=0;
      panel.addEventListener('dragenter',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){dc++;panel.dataset.drop=avEn()?'Drop here to store in the vault':'Larga aqui para guardar no cofre';panel.classList.add('av-drop');}});
      panel.addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault();});
      panel.addEventListener('dragleave',()=>{dc=Math.max(0,dc-1);if(!dc)panel.classList.remove('av-drop');});
      panel.addEventListener('drop',e=>{if(!e.dataTransfer||!e.dataTransfer.files.length)return;e.preventDefault();dc=0;panel.classList.remove('av-drop');avFilesReceive(e.dataTransfer.files);});
    }
  }
  if(typeof auroraOpen==='function'){const ao=auroraOpen;auroraOpen=function(){const r=ao.apply(this,arguments);try{wire();}catch(e){}return r;};}
  setInterval(()=>{try{if(document.getElementById('aurora-panel'))wire();}catch(e){}},1500);
})();


/* ══ v9.75 — COFRE GUARDADO NA APP (browsers sem acesso direto a ficheiros) + DIAGNÓSTICO ══
   Sem acesso direto a ficheiros (Chrome Android < 132, Samsung Internet, Firefox, iPhone…), o cofre encriptado
   vive no armazenamento da app neste dispositivo: abre direto no PIN/impressão digital e grava sem downloads.
   Cópias em ficheiro passam a ser pedidas (⋯ → Exportar) e há um lembrete se o Drive estiver desligado. */
async function avDevInit(migr){
  let loc=null;try{loc=await localVaultGet();}catch(e){}
  if(!loc||!loc.json||pendingVaultFile||pendingVaultText)return false;
  pendingVaultText=loc.json;lockSwipeNeed=true;lockSwipeRetry=false;lockShowPwStep();AV_MIGR=!!migr;
  if(!FSA_OK){try{localStorage.setItem('av_dev_mode','1');}catch(e){}}
  const fn=document.getElementById('l-file-name');if(fn)fn.textContent=migr?(currentLang==='en'?'📱 Copy on this device (most recent)':'📱 Cópia deste dispositivo (a mais recente)'):(currentLang==='en'?'📱 Vault stored on this device':'📱 Cofre guardado neste dispositivo');
  const fm=document.getElementById('l-file-meta');if(fm)fm.style.display='none';
  await refreshQuickUnlock(true);
  return true;
}
function avDevPersist(){
  try{if(localStorage.getItem('av_persist_asked')==='1')return;localStorage.setItem('av_persist_asked','1');}catch(e){}
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});}catch(e){}
}
async function avExportVault(){
  const en=avEn();
  try{if(hasUnsaved)await saveFile({auto:true});}catch(e){}
  let l=null;try{l=await localVaultGet();}catch(e){}
  if(!l||!l.json){toast(en?'Nothing to export yet — save first.':'Ainda não há nada para exportar — grava primeiro.');return;}
  const d=new Date(),z=n=>String(n).padStart(2,'0');
  downloadVault(JSON.parse(l.json),'ciphervault_'+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'.vault');
  try{localStorage.setItem('av_last_export',String(Date.now()));}catch(e){}
  toast(en?'📤 Copy exported (encrypted) — keep it somewhere safe.':'📤 Cópia exportada (encriptada) — guarda-a num sítio seguro.');
  try{aurAlertsRender();}catch(e){}
}
function avBrowser(){
  const ua=navigator.userAgent||'';let m;
  if(/; wv\)/.test(ua))return {n:'WebView (browser dentro de outra app)',v:0};
  if((m=ua.match(/SamsungBrowser\/(\d+)/)))return {n:'Samsung Internet',v:+m[1]};
  if((m=ua.match(/EdgA?\/(\d+)/)))return {n:'Edge',v:+m[1]};
  if((m=ua.match(/OPR\/(\d+)/)))return {n:'Opera',v:+m[1]};
  if((m=ua.match(/(?:Firefox|FxiOS)\/(\d+)/)))return {n:'Firefox',v:+m[1]};
  if((m=ua.match(/CriOS\/(\d+)/)))return {n:'Chrome (iPhone)',v:+m[1]};
  if((m=ua.match(/Chrome\/(\d+)/)))return {n:'Chrome',v:+m[1]};
  if(/Safari/.test(ua)&&(m=ua.match(/Version\/(\d+)/)))return {n:'Safari',v:+m[1]};
  return {n:'?',v:0};
}
async function avRenderDiag(){
  const el=document.getElementById('av-diag');if(!el)return;const en=avEn();
  const ttl=document.getElementById('s-diag-title');if(ttl)ttl.textContent=en?'🩺 Diagnostics':'🩺 Diagnóstico';
  const ua=navigator.userAgent||'',br=avBrowser();
  const os=/Android/.test(ua)?'Android':/iPhone|iPad|iPod/.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Mac OS/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'?';
  let persisted=null;try{if(navigator.storage&&navigator.storage.persisted)persisted=await navigator.storage.persisted();}catch(e){}
  const inst=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  const Y=en?'yes':'sim',N=en?'no':'não';
  const where=FSA_OK?(vaultFileHandle?(en?'file «':'ficheiro «')+esc(vaultFileHandle.name)+'»':(en?'file (chosen when opening)':'ficheiro (escolhido ao abrir)')):(en?'app storage on this device':'armazenamento da app neste dispositivo');
  const rows=[
    [en?'Browser':'Browser',esc(br.n)+(br.v?' '+br.v:'')+' · '+os+(inst?(en?' · installed app':' · app instalada'):'')],
    [en?'Direct file access':'Acesso direto a ficheiros',FSA_OK?'✅ '+Y:'❌ '+N],
    [en?'Where the vault lives':'Onde está o cofre',where],
    [en?'Persistent storage':'Armazenamento persistente',persisted===null?'—':(persisted?'✅ '+Y:'⚠️ '+N)],
    ['Google Drive',(typeof driveOn==='function'&&driveOn())?(en?'✅ connected':'✅ ligado'):(en?'off':'desligado')],
    [en?'App version':'Versão da app','v'+(typeof APP_VERSION!=='undefined'?APP_VERSION:'?')]
  ];
  let tip='';
  if(!FSA_OK){
    if(br.n==='Chrome'&&br.v&&br.v<132&&os==='Android')tip=en?'💡 Update Chrome to version 132 or later so the app can use the vault file directly.':'💡 Atualiza o Chrome para a versão 132 ou mais recente para a app poder usar o ficheiro do cofre diretamente.';
    else tip=en?'💡 This browser can’t open files directly, so the vault is kept (encrypted) in the app on this device. Connect Google Drive or export a copy regularly (⋯ → Export).':'💡 Este browser não abre ficheiros diretamente, por isso o cofre fica guardado (encriptado) na app, neste dispositivo. Liga o Google Drive ou exporta uma cópia de vez em quando (⋯ → Exportar).';
  }
  el.innerHTML=rows.map(r=>'<div style="display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--border);padding:3px 0"><span>'+r[0]+'</span><b style="color:var(--text);font-weight:500;text-align:right">'+r[1]+'</b></div>').join('')+(tip?'<div style="margin-top:8px;line-height:1.6">'+tip+'</div>':'');
}
(function(){
  if(typeof switchSettingsTab==='function'){const sst=switchSettingsTab;switchSettingsTab=function(t){const r=sst.apply(this,arguments);if(t==='sobre')avRenderDiag();return r;};}
  if(typeof openSettings==='function'){const os=openSettings;openSettings=function(){const r=os.apply(this,arguments);try{avRenderDiag();}catch(e){}return r;};}
  // lembrete de cópia quando o cofre só vive neste dispositivo e o Drive está desligado
  if(typeof aurAlerts==='function'){const aa=aurAlerts;aurAlerts=function(){const out=aa.apply(this,arguments);try{
    if(!FSA_OK&&!(typeof driveOn==='function'&&driveOn())&&Date.now()-(+localStorage.getItem('av_last_export')||0)>14*864e5){
      const k='devbk:'+new Date().toISOString().slice(0,10);const off=aurAlertsDismissed(),day=new Date().toISOString().slice(0,10);
      if(off[k]!==day)out.unshift({k,ic:'💾',html:avEn()?'Your vault only lives <b>on this device</b> — export a copy or connect Google Drive':'O teu cofre só está <b>neste dispositivo</b> — exporta uma cópia ou liga o Google Drive',run:()=>avExportVault()});
    }}catch(e){}return out.slice(0,4);};}
})();


/* ══ v9.76 — CÓPIA AUTOMÁTICA PARA AS TRANSFERÊNCIAS (browsers sem acesso direto a ficheiros) ══
   O cofre continua encriptado (é o mesmo ficheiro .vault). Só quando houve alterações, no máximo 1× por
   semana (ou dia), e só em momentos com gesto do utilizador (gravar, entrar, bloquear). Desligada com o Drive ligado. */
let AV_MIGR=false;
function avBackupFreq(){try{const v=localStorage.getItem('av_bk_freq');return v==='daily'||v==='off'?v:'weekly';}catch(e){return 'weekly';}}
function avSetBkFreq(v){try{localStorage.setItem('av_bk_freq',v);}catch(e){}avRenderSettings();const en=avEn();
  toast(v==='off'?(en?'Automatic copy off — remember to export a copy (⋯ → Export).':'Cópia automática desligada — lembra-te de exportar (⋯ → Exportar).'):(v==='daily'?(en?'Automatic copy: daily (when something changed).':'Cópia automática: diária (quando há alterações).'):(en?'Automatic copy: weekly (when something changed).':'Cópia automática: semanal (quando há alterações).')));}
function avMarkChange(){try{localStorage.setItem('av_last_change',String(Date.now()));}catch(e){}}
async function avAutoBackupMaybe(){
  if(FSA_OK||presentationMode)return false;
  if(typeof driveOn==='function'&&driveOn())return false;
  const f=avBackupFreq();if(f==='off')return false;
  const period=f==='daily'?864e5:7*864e5,last=+localStorage.getItem('av_wk_last')||0,ch=+localStorage.getItem('av_last_change')||0;
  if(last&&ch<=last)return false;
  if(last&&Date.now()-last<period)return false;
  let l=null;try{l=await localVaultGet();}catch(e){}
  if(!l||!l.json)return false;
  const d=new Date(),z=n=>String(n).padStart(2,'0');
  downloadVault(JSON.parse(l.json),'ciphervault_backup_'+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'.vault');
  try{localStorage.setItem('av_wk_last',String(Date.now()));localStorage.setItem('av_last_export',String(Date.now()));}catch(e){}
  const en=avEn();
  toast(en?'📦 Backup copy saved to Downloads (encrypted). You can delete older copies.':'📦 Cópia de segurança guardada nas Transferências (encriptada). Podes apagar as antigas.');
  return true;
}
function avDevHint(show){
  let el=document.getElementById('l-dev-hint');
  if(!show){if(el)el.style.display='none';return;}
  if(!el){const init=document.getElementById('login-state-initial');if(!init)return;el=document.createElement('div');el.id='l-dev-hint';el.style.cssText='margin-top:14px;padding:10px 12px;border-radius:10px;border:1px dashed rgba(var(--accent-rgb),.45);font-size:.66rem;line-height:1.6;color:var(--text-muted);text-align:left';init.appendChild(el);}
  const en=avEn();el.style.display='block';
  el.innerHTML=en?'💡 In this browser the vault is kept inside the app. <b>Lost access?</b> Tap <b>Load vault</b> and choose the most recent copy in Downloads (<i>ciphervault_backup_YYYY-MM-DD.vault</i>).':'💡 Neste browser o cofre fica guardado na app. <b>Perdeste o acesso?</b> Toca em <b>Carregar cofre</b> e escolhe a cópia mais recente nas Transferências (<i>ciphervault_backup_AAAA-MM-DD.vault</i>).';
}
(function(){
  if(typeof doUnlock==='function'){const du=doUnlock;doUnlock=function(){const r=du.apply(this,arguments);
    setTimeout(()=>{try{avAutoBackupMaybe();}catch(e){}
      if(AV_MIGR&&FSA_OK){AV_MIGR=false;try{toast(avEn()?'Your browser can now save to a file — tap “Not saved” / Save to choose where to create the vault file.':'O teu browser já consegue guardar num ficheiro — toca em «Por gravar» / Guardar para escolheres onde criar o ficheiro do cofre.');hasUnsaved=true;avRenderSaveState();}catch(e){}}
    },2500);return r;};}
  if(typeof lockApp==='function'){const la=lockApp;lockApp=function(){try{avAutoBackupMaybe();}catch(e){}return la.apply(this,arguments);};}
  if(typeof markSaved==='function'){const ms=markSaved;markSaved=function(){const r=ms.apply(this,arguments);try{if(vaultFileHandle&&FSA_OK)localStorage.removeItem('av_dev_mode');}catch(e){}return r;};}
})();


/* ══ v9.77 — WI-FI NO DASHBOARD (com o símbolo de Wi-Fi a sério) ══ */
function avWifiIcon(sz){sz=sz||16;return '<svg class="av-wico" width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8.8a15 15 0 0 1 20 0"/><path d="M5.2 12.6a10.3 10.3 0 0 1 13.6 0"/><path d="M8.6 16.3a5.2 5.2 0 0 1 6.8 0"/><circle cx="12" cy="19.9" r="1.35" fill="currentColor" stroke="none"/></svg>';}
(function(){const w=AV_ADD_MORE.find(x=>x.k==='wifi');if(w)w.ic=avWifiIcon(14);})();
function avWifiCard(){
  const launch=document.querySelector('.aur-launch');let card=document.getElementById('av-wifi-card');
  const nets=(typeof wifiNets!=='undefined'?wifiNets:[]);
  if(!launch||!nets.length||presentationMode){if(card)card.remove();return;}
  if(!card){card=document.createElement('div');card.id='av-wifi-card';card.className='av-wifi';}
  let side=document.getElementById('av-side');
  if(!side){side=document.createElement('div');side.id='av-side';}
  if(side.previousElementSibling!==launch)launch.insertAdjacentElement('afterend',side);
  const al=document.getElementById('aur-alerts');if(al&&al.parentElement!==side)side.insertBefore(al,side.firstChild);
  if(card.parentElement!==side)side.appendChild(card);
  const en=avEn();
  card.innerHTML='<div class="av-wifi-h"><span>'+avWifiIcon(13)+' Wi-Fi</span><button data-act="openWifiManager" title="'+(en?'Manage Wi-Fi networks':'Gerir redes Wi-Fi')+'">⚙ '+(en?'Manage':'Gerir')+'</button></div>'
   +nets.slice(0,4).map(n=>'<button class="av-wifi-n" data-act="openWifiNetQR" data-arg="'+esc(n.id)+'" title="'+(en?'Show QR code and password':'Mostrar QR code e password')+'">'+avWifiIcon(17)+'<b>'+esc(n.name||n.ssid)+'</b><i>'+(en?'Show QR ›':'Mostrar QR ›')+'</i></button>').join('')
   +(nets.length>4?'<button class="av-wifi-n" data-act="openWifiManager"><b style="font-weight:500;color:var(--text-muted)">+'+(nets.length-4)+(en?' more':' mais')+'</b></button>':'');
}
(function(){
  if(typeof renderGreeting==='function'){const rg=renderGreeting;renderGreeting=function(){const r=rg.apply(this,arguments);try{avWifiCard();}catch(e){}return r;};}
  if(typeof renderWifiBar==='function'){const rw=renderWifiBar;renderWifiBar=function(){const r=rw.apply(this,arguments);try{avWifiCard();}catch(e){}return r;};}
  if(typeof aurAlertsRender==='function'){const ar=aurAlertsRender;aurAlertsRender=function(){const r=ar.apply(this,arguments);try{avWifiCard();}catch(e){}return r;};}
})();


/* ══ v9.81 — ASPETO (iniciais · OLED · automático) · CALENDÁRIO DO TELEMÓVEL · AURORA (alcunhas · sugestões · resumo semanal · limpeza guiada) ══ */
function avHash(s){let h=5381;s=String(s||'');for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
function avMono(name){
  const w=String(name||'?').replace(/[^\p{L}\p{N} ]/gu,' ').trim().split(/\s+/).filter(Boolean);
  const ini=(w.length>1?(w[0][0]+w[1][0]):(w[0]||'?').slice(0,2)).toUpperCase();
  let h=0;const n=String(name||'');for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))%360;
  return '<span class="service-icon av-mono" style="background:linear-gradient(135deg,hsl('+h+',52%,46%),hsl('+((h+28)%360)+',58%,34%))" aria-hidden="true">'+esc(ini)+'</span>';
}
/* tema OLED: preto puro (poupa bateria nos ecrãs AMOLED), com o dourado da Aurora */
(function(){try{if(!THEME_PRESETS.some(t=>t.id==='oled')){const i=THEME_PRESETS.findIndex(t=>!t.dark);THEME_PRESETS.splice(i<0?THEME_PRESETS.length:i,0,{id:'oled',name:'OLED',emoji:'🖤',dark:true,bg:'#000000',accent:'#c9a84c',text:'#ece8dc'});}}catch(e){}})();
/* tema automático: alterna entre o teu tema escuro e o teu tema claro conforme o sistema */
function avThemeAuto(){try{return localStorage.getItem('av_theme_auto')==='1';}catch(e){return false;}}
function avApplyAutoTheme(){if(!avThemeAuto()||!window.matchMedia||typeof setTheme!=='function')return;const want=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(typeof currentTheme==='undefined'||currentTheme!==want)setTheme(want);}
function avSetThemeAuto(on){try{localStorage.setItem('av_theme_auto',on?'1':'0');}catch(e){}if(on)avApplyAutoTheme();avRenderSettings();toast(on?(avEn()?'Automatic theme on — follows your device.':'Tema automático ligado — segue o teu dispositivo.'):(avEn()?'Automatic theme off.':'Tema automático desligado.'));}
(function(){
  try{if(window.matchMedia){const mq=matchMedia('(prefers-color-scheme: dark)');(mq.addEventListener?mq.addEventListener('change',avApplyAutoTheme):mq.addListener(avApplyAutoTheme));}}catch(e){}
  if(typeof toggleTheme==='function'){const tt=toggleTheme;toggleTheme=function(){if(avThemeAuto()){try{localStorage.setItem('av_theme_auto','0');}catch(e){}toast(avEn()?'Automatic theme turned off (you chose manually).':'Tema automático desligado (escolheste à mão).');}return tt.apply(this,arguments);};}
  setTimeout(avApplyAutoTheme,50);
})();

/* ── calendário do telemóvel (.ics): só nomes e datas, nunca passwords ── */
function avIcsEsc(s){return String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
function avIcsFold(l){if(l.length<=73)return l;let o='',r=l;while(r.length>73){o+=r.slice(0,73)+'\r\n ';r=r.slice(73);}return o+r;}
function avCalEvents(onlyLabel){
  let ev=[];try{ev=calCollectEvents();}catch(e){}
  const t0=new Date();t0.setHours(0,0,0,0);const lim=new Date(t0);lim.setFullYear(lim.getFullYear()+2);
  return ev.map(e=>{const v=e.date;const d=v instanceof Date?new Date(v.getTime()):new Date(String(v).slice(0,10)+'T00:00:00');d.setHours(0,0,0,0);return Object.assign({},e,{d});})
    .filter(e=>!isNaN(e.d)&&e.d>=t0&&e.d<=lim&&(!onlyLabel||e.label===onlyLabel));
}
function avBuildIcs(ev){
  const en=avEn(),z=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+z(d.getMonth()+1)+z(d.getDate());
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const K={renew:['Renova','Renews'],doc:['Validade','Expires'],card:['Cartão expira','Card expires']};
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aurora Vault//PT','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Aurora Vault'];
  ev.forEach(e=>{const nx=new Date(e.d);nx.setDate(nx.getDate()+1);const k=K[e.type];
    const title=(k?avT(k)+': ':'⏳ ')+e.label+(e.type==='renew'&&e.amount?' ('+e.amount+' €)':'');
    L.push('BEGIN:VEVENT','UID:av-'+e.type+'-'+avHash(e.label+'|'+ymd(e.d))+'@aurora-vault','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+ymd(e.d),'DTEND;VALUE=DATE:'+ymd(nx),'SUMMARY:'+avIcsEsc(title),'DESCRIPTION:'+avIcsEsc(en?'Reminder from Aurora Vault':'Lembrete do Aurora Vault'),'TRANSP:TRANSPARENT',
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+avIcsEsc(title),'TRIGGER:-P7D','END:VALARM','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+avIcsEsc(title),'TRIGGER:-P1D','END:VALARM','END:VEVENT');});
  L.push('END:VCALENDAR');return L.map(avIcsFold).join('\r\n');
}
async function avExportICS(onlyLabel){
  const en=avEn(),ev=avCalEvents(onlyLabel);
  if(!ev.length){toast(en?'No upcoming renewals or expiry dates to export.':'Não há renovações nem validades futuras para exportar.');return 0;}
  const file=new File([avBuildIcs(ev)],onlyLabel?'aurora-vault-'+avHash(onlyLabel)+'.ics':'aurora-vault-renovacoes.ics',{type:'text/calendar'});
  if(!avIsDesk()&&navigator.canShare&&navigator.share){try{if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Aurora Vault'});toast(en?'📲 Choose your calendar app to add the dates.':'📲 Escolhe a app de calendário para juntar as datas.');return ev.length;}}catch(e){if(e&&e.name==='AbortError')return 0;}}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
  toast(en?'📲 '+ev.length+' dates exported (names and dates only) — open the file to add them to your calendar.':'📲 '+ev.length+(ev.length===1?' data exportada':' datas exportadas')+' (só nomes e datas) — abre o ficheiro para as juntar ao calendário.');
  return ev.length;
}
(function(){
  if(typeof openCalendar!=='function')return;const oc=openCalendar;
  openCalendar=function(){const r=oc.apply(this,arguments);setTimeout(()=>{try{
    const ov=[...document.querySelectorAll('[id$="-overlay"].open,.modal-overlay.open')].find(o=>/cal/i.test(o.id))||[...document.querySelectorAll('[id$="-overlay"].open')].pop();
    const t=ov&&ov.querySelector('.modal-title');if(!t)return;let b=t.querySelector('.av-cal-exp');
    if(!b){b=document.createElement('button');b.className='av-cal-exp';b.type='button';b.onclick=e=>{e.stopPropagation();avExportICS();};t.style.display='flex';t.style.alignItems='center';t.style.gap='10px';t.appendChild(b);}
    b.textContent=avEn()?'📲 Send to phone calendar':'📲 Enviar para o calendário do telemóvel';
  }catch(e){}},60);return r;};
})();

/* ── sugestões discretas da Aurora (depois de gravar) ── */
function avNudgesOn(){try{return localStorage.getItem('av_nudges')!=='0';}catch(e){return true;}}
function avSetNudges(on){try{localStorage.setItem('av_nudges',on?'1':'0');}catch(e){}avRenderSettings();}
function avNudgeClose(){const _n=document.getElementById('av-nudge');if(_n)_n._closed=true;const n=document.getElementById('av-nudge');if(n){n.classList.remove('show');clearTimeout(n._t);}}
function avNudge(html,actions,ms){
  if(typeof AVT!=='undefined'&&AVT.on)return;
  let n=document.getElementById('av-nudge');if(!n){n=document.createElement('div');n.id='av-nudge';n.setAttribute('role','status');document.body.appendChild(n);}
  clearTimeout(n._t);
  n.innerHTML='<span class="av-nudge-ic">✨</span><div class="av-nudge-tx">'+html+'</div>'+(actions||[]).map((a,i)=>'<button class="av-nudge-b'+(i===0?' go':'')+'" data-i="'+i+'">'+a.label+'</button>').join('')+'<button class="av-nudge-x" aria-label="'+(avEn()?'Close':'Fechar')+'">✕</button>';
  n.querySelectorAll('.av-nudge-b').forEach(b=>b.onclick=()=>{avNudgeClose();try{actions[+b.dataset.i].fn();}catch(e){}});
  n.querySelector('.av-nudge-x').onclick=avNudgeClose;
  n._closed=false;requestAnimationFrame(()=>{if(!n._closed)n.classList.add('show');});n._t=setTimeout(avNudgeClose,ms||12000);
}
function avTotpHas(name){try{if(typeof aurTotpLocked==='function'&&aurTotpLocked())return true;const k=aurNorm(name||'');return (typeof totp!=='undefined'?totp:[]).some(t=>{const x=aurNorm(t.issuer||t.name||'');return x&&(x.includes(k)||k.includes(x));});}catch(e){return true;}}
function avSuggestEntry(e){
  if(!avNudgesOn()||!e||e.isWifi)return;const en=avEn(),nm='<b>'+esc(e.name)+'</b>';
  if(typeof getPwScore==='function'&&e.pw&&getPwScore(e.pw)<2){avNudge(en?'The password for '+nm+' is weak.':'A password do '+nm+' é fraca.',[{label:en?'Make a strong one':'Gerar uma forte',fn:()=>{editEntry(e.id);setTimeout(()=>{try{openPwGen();}catch(x){}},350);}}]);return;}
  if(!avTotpHas(e.name))avNudge(en?'Saved '+nm+'. Does this account use 2FA? Keep the code here too.':'Guardaste '+nm+'. Esta conta tem 2FA? Guarda cá também o código.',[{label:en?'Add 2FA code':'Adicionar código 2FA',fn:()=>avAddType('totp')}]);
}
function avSuggestDoc(d){
  if(!avNudgesOn()||!d)return;const en=avEn(),nm='<b>'+esc(d.title||d.name||'')+'</b>';
  if(d.expiry)avNudge(en?'I’ll remind you before '+nm+' expires. Add it to your phone calendar too?':'Aviso-te antes de '+nm+' expirar. Juntar também ao calendário do telemóvel?',[{label:en?'📲 Add to calendar':'📲 Juntar ao calendário',fn:()=>avExportICS(d.title||d.name)}]);
  else if(d.file&&/^image\//.test(d.file.type||''))avNudge(en?'Want me to read the expiry date of '+nm+' from the photo?':'Queres que eu leia a validade de '+nm+' da foto?',[{label:en?'🔍 Read expiry':'🔍 Ler validade',fn:()=>{openDocModal(d.id);setTimeout(()=>{try{avOcrDoc();}catch(x){}},450);}}]);
}
(function(){
  if(typeof saveEntry==='function'){const se=saveEntry;saveEntry=function(){const ids=new Set((vault||[]).map(v=>v.id));const r=se.apply(this,arguments);setTimeout(()=>{try{const nw=vault.find(v=>!ids.has(v.id));if(nw)avSuggestEntry(nw);}catch(e){}},450);return r;};}
  if(typeof saveDoc==='function'){const sd=saveDoc;saveDoc=function(){const ids=new Set((documents||[]).map(v=>v.id));const r=sd.apply(this,arguments);setTimeout(()=>{try{const nw=documents.find(v=>!ids.has(v.id));if(nw)avSuggestDoc(nw);}catch(e){}},450);return r;};}
})();

/* ── alcunhas: «quando eu disser banco, é o Millennium» ── */
function avAliases(){try{return JSON.parse(localStorage.getItem('av_aliases')||'{}')||{};}catch(e){return {};}}
function avAliasSaveAll(o){try{localStorage.setItem('av_aliases',JSON.stringify(o));}catch(e){}}
function avAliasItems(){const out=[];const add=(a,f)=>(a||[]).forEach(x=>{const n=x&&f(x);if(n)out.push(String(n));});
  try{add(vault,x=>!x.archived&&x.name);add(bankCards,x=>x.name||x.bank);add(storeCards,x=>x.name);add(documents,x=>x.title||x.name);add(assets,x=>x.name);add(personalInfo,x=>x.name);add(typeof subscriptions!=='undefined'?subscriptions:[],x=>x.name);}catch(e){}return out;}
function avAliasResolve(t){const k=aurNorm(t).trim();if(!k)return null;const items=avAliasItems();return items.find(n=>aurNorm(n)===k)||items.find(n=>aurNorm(n).includes(k))||items.find(n=>k.includes(aurNorm(n))&&aurNorm(n).length>=3)||null;}
function avAliasCmd(raw){
  const n=aurNorm(raw).replace(/[«»"“”]/g,'').replace(/[?!.]+$/,'').trim();let m;
  if(/^(que |quais )?(as )?(minhas )?(alcunhas|apelidos)( tenho)?$|^(my )?aliases$/.test(n))return {list:true};
  if((m=n.match(/^(?:esquece|apaga|remove|tira|forget|delete)(?: a| the)? (?:alcunha|apelido|alias) (.+)$/)))return {del:m[1].trim()};
  if((m=n.match(/^(?:alcunha|apelido|alias)\s*:?\s*(.+?)\s*(?:=|->|e|é|means|is)\s*(?:o |a |the )?(.+)$/)))return {set:[m[1],m[2]],explicit:true};
  if((m=n.match(/^quando (?:eu )?(?:disser|escrever|digo)\s+(.+?)\s*,?\s*(?:e|é|quero dizer|refiro-me a|refiro me a|significa)\s+(?:o |a )?(.+)$/)))return {set:[m[1],m[2]],explicit:true};
  if((m=n.match(/^when i (?:say|type) (.+?),? i mean (?:the |my )?(.+)$/)))return {set:[m[1],m[2]],explicit:true};
  if((m=n.match(/^(?:o|a) (?:meu |minha )?([a-z0-9 ]{2,24}?) (?:e|é) (?:o|a) (.+)$/))&&!/^(que|qual|quanto|onde|como)\b/.test(m[1])&&avAliasResolve(m[2]))return {set:[m[1],m[2]]};
  return null;
}
function avAliasHandle(raw){
  const c=avAliasCmd(raw);if(!c)return false;const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;const A=avAliases();
  if(c.list){const ks=Object.keys(A);aurSay(ks.length?aurL('🏷️ As tuas alcunhas:\n','🏷️ Your aliases:\n')+ks.map(k=>'• <b>'+aurEsc(k)+'</b> → '+aurEsc(A[k])).join('\n'):aurL('Ainda não tens alcunhas. Experimenta: «quando eu disser banco, é o Millennium».','No aliases yet. Try: “when I say bank, I mean Millennium”.'));return true;}
  if(c.del){const k=aurNorm(c.del).trim();if(A[k]){delete A[k];avAliasSaveAll(A);aurSay(aurL('🏷️ Esqueci a alcunha «','🏷️ Forgot the alias “')+aurEsc(k)+aurL('».','”.'));}else aurSay(aurL('Não tenho nenhuma alcunha «','I don’t have an alias “')+aurEsc(k)+aurL('».','”.'));return true;}
  const alias=aurNorm(c.set[0]).trim(),target=avAliasResolve(c.set[1])||c.set[1].trim();
  if(!alias||alias.length>30){return false;}
  A[alias]=target;avAliasSaveAll(A);
  const found=!!avAliasResolve(c.set[1]);
  aurSay(aurL('🏷️ Combinado: quando disseres <b>«'+aurEsc(alias)+'»</b>, percebo <b>'+aurEsc(target)+'</b>.','🏷️ Got it: when you say <b>“'+aurEsc(alias)+'”</b>, I’ll understand <b>'+aurEsc(target)+'</b>.')+(found?'':aurL('\n<span class="a-dim">(Ainda não encontrei nada com esse nome no cofre.)</span>','\n<span class="a-dim">(I couldn’t find anything with that name in the vault yet.)</span>')),[{label:aurL('Experimentar: password do '+alias,'Try: '+alias+' password'),fn:()=>aurQuick(aurL('password do '+alias,alias+' password'))}]);
  return true;
}
function avApplyAliases(raw){
  const A=avAliases(),ks=Object.keys(A).sort((a,b)=>b.length-a.length);if(!ks.length)return raw;
  let n=' '+aurNorm(raw)+' ',hit=false;
  ks.forEach(k=>{const re=new RegExp('([\\s,.;:!?«»"“”(])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=[\\s,.;:!?«»"“”)])','g');if(re.test(n)){hit=true;n=n.replace(re,'$1'+aurNorm(A[k]));}});
  return hit?n.trim():raw;
}

/* ── resumo semanal (aviso discreto ao entrar numa semana nova; não é mais uma caixa no Dashboard) ── */
function avWeekId(d){const t=new Date(d||Date.now());t.setHours(0,0,0,0);t.setDate(t.getDate()-((t.getDay()+6)%7));return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}
function avWeakList(){const V=(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived&&v.pw);const cnt={};V.forEach(v=>{cnt[v.pw]=(cnt[v.pw]||0)+1;});return V.filter(v=>(typeof getPwScore==='function'&&getPwScore(v.pw)<2)||cnt[v.pw]>1);}
function avWeekSummary(){
  AUR.lang=aurAppLang();const en=avEn();
  const t0=new Date();t0.setHours(0,0,0,0);const t7=new Date(t0);t7.setDate(t7.getDate()+7);
  const ev=avCalEvents().filter(e=>e.d<t7).sort((a,b)=>a.d-b.d);
  const subs=ev.filter(e=>e.type==='renew'),other=ev.filter(e=>e.type!=='renew');
  const tot=subs.reduce((s,e)=>s+(parseFloat(String(e.amount||0).replace(',','.'))||0),0);
  const weak=avWeakList().length,old=(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived&&v.pw&&v.pwUpdated&&Date.now()-v.pwUpdated>365*864e5).length;
  const dd=d=>d.toLocaleDateString(en?'en-GB':'pt-PT',{weekday:'short',day:'2-digit',month:'2-digit'});
  let h=aurL('🗓️ <b>A tua semana</b>\n','🗓️ <b>Your week</b>\n');
  h+=other.length?other.slice(0,5).map(e=>'• ⏳ '+aurEsc(e.label)+' — '+dd(e.d)).join('\n')+'\n':aurL('• Nada expira esta semana ✓\n','• Nothing expires this week ✓\n');
  if(subs.length)h+='• 🔁 '+subs.length+aurL(subs.length===1?' subscrição renova':' subscrições renovam',subs.length===1?' subscription renews':' subscriptions renew')+(tot?' · '+tot.toFixed(2).replace('.',en?'.':',')+' €':'')+'\n';
  h+=weak?'• 🛡️ '+weak+aurL(weak===1?' password fraca ou repetida':' passwords fracas ou repetidas',weak===1?' weak or reused password':' weak or reused passwords')+'\n':aurL('• 🛡️ Passwords em ordem ✓\n','• 🛡️ Passwords look good ✓\n');
  if(old)h+='• 🔑 '+old+aurL(old===1?' password com mais de 1 ano':' passwords com mais de 1 ano',old===1?' password older than a year':' passwords older than a year');
  const ch=[];if(weak)ch.push({label:aurL('🛡️ Rever passwords fracas','🛡️ Fix weak passwords'),fn:()=>avCleanupStart()});if(ev.length)ch.push({label:aurL('📲 Enviar para o calendário','📲 Send to calendar'),fn:()=>avExportICS()});
  aurSay(h.replace(/\n$/,''),ch);
}
(function(){
  if(typeof doUnlock!=='function')return;const du=doUnlock;
  doUnlock=function(){const r=du.apply(this,arguments);setTimeout(()=>{try{
    if(!masterKey||presentationMode)return;const wk=avWeekId();if(localStorage.getItem('av_week_seen')===wk)return;
    if(!(typeof vault!=='undefined'&&vault.length))return;
    localStorage.setItem('av_week_seen',wk);
    avNudge(avEn()?'Your <b>weekly summary</b> is ready.':'O teu <b>resumo da semana</b> está pronto.',[{label:avEn()?'See':'Ver',fn:()=>{auroraOpen();avWeekSummary();}}],15000);
  }catch(e){}},5000);return r;};
})();

/* ── limpeza guiada das passwords fracas ou repetidas (uma a uma) ── */
const AVC={q:[],i:0,newPw:null,done:0,undo:null};
function avCleanupStart(){
  try{auroraOpen();}catch(e){}AUR.lang=aurAppLang();
  AVC.q=avWeakList().map(v=>v.id);AVC.i=0;AVC.done=0;AVC.newPw=null;AVC.undo=null;
  if(!AVC.q.length){aurSay(aurL('🛡️ Não tens passwords fracas nem repetidas. Excelente!','🛡️ You have no weak or reused passwords. Excellent!'));return;}
  aurSay(aurL('🛡️ Vamos rever <b>'+AVC.q.length+'</b> '+(AVC.q.length===1?'password':'passwords')+', uma de cada vez. Para cada uma: eu gero uma nova, tu mudas no site e eu guardo aqui.','🛡️ Let’s review <b>'+AVC.q.length+'</b> '+(AVC.q.length===1?'password':'passwords')+', one at a time. For each: I make a new one, you change it on the site, and I save it here.'));
  avCleanupStep();
}
function avCleanupCur(){return vault.find(v=>v.id===AVC.q[AVC.i]);}
function avCleanupStep(){
  while(AVC.i<AVC.q.length&&!avWeakList().some(v=>v.id===AVC.q[AVC.i]))AVC.i++;
  if(AVC.i>=AVC.q.length){aurSay(aurL('✅ Terminado! Atualizaste <b>'+AVC.done+'</b> '+(AVC.done===1?'password':'passwords')+'.','✅ Done! You updated <b>'+AVC.done+'</b> '+(AVC.done===1?'password':'passwords')+'.'));return;}
  const v=avCleanupCur(),V=avWeakList(),reused=(vault||[]).filter(x=>x.id!==v.id&&!x.archived&&x.pw===v.pw).map(x=>x.name);
  const why=reused.length?aurL('repetida também em: '+reused.slice(0,3).map(aurEsc).join(', '),'also used in: '+reused.slice(0,3).map(aurEsc).join(', ')):aurL('password fraca','weak password');
  aurSay('🛡️ <b>'+(AVC.i+1)+aurL(' de ',' of ')+AVC.q.length+'</b> · <b>'+aurEsc(v.name)+'</b>'+(v.user?' <span class="a-dim">('+aurEsc(v.user)+')</span>':'')+'\n'+why,
    [{label:aurL('🔑 Gerar nova e copiar','🔑 Make a new one & copy'),fn:()=>avCleanupGen()},{label:aurL('↩ Saltar','↩ Skip'),fn:()=>{AVC.i++;avCleanupStep();}},{label:aurL('⏹ Parar','⏹ Stop'),fn:()=>aurSay(aurL('Ok, parei. Continuas quando quiseres: «rever passwords fracas».','Ok, stopped. Continue anytime: “fix weak passwords”.'))}]);
}
function avCleanupGen(){
  const v=avCleanupCur();if(!v)return avCleanupStep();
  AVC.newPw=aurGenPw(20);try{copyText(AVC.newPw,aurL('Password nova copiada','New password copied'));}catch(e){}
  const ch=[];
  if(v.url)ch.push({label:aurL('🌐 Abrir o site','🌐 Open the site'),fn:()=>{let u=String(v.url).trim();if(!/^https?:\/\//i.test(u))u='https://'+u;try{window.open(u,'_blank','noopener');}catch(e){}}});
  ch.push({label:aurL('✓ Já mudei — guardar','✓ Changed it — save'),fn:()=>avCleanupSave()},{label:aurL('↩ Saltar','↩ Skip'),fn:()=>{AVC.newPw=null;AVC.i++;avCleanupStep();}});
  aurSay(aurL('📋 Copiei uma password nova (20 caracteres).\n1) Abre o site e muda lá a password — cola esta.\n2) Volta aqui e toca em «Já mudei — guardar».','📋 I copied a new password (20 characters).\n1) Open the site and change the password there — paste this one.\n2) Come back and tap “Changed it — save”.'),ch);
}
function avCleanupSave(){
  const v=avCleanupCur();if(!v||!AVC.newPw)return avCleanupStep();
  AVC.undo={id:v.id,pw:v.pw,at:v.pwUpdated};v.pw=AVC.newPw;v.pwUpdated=Date.now();AVC.newPw=null;AVC.done++;
  try{logActivity('edit',v.name,'🛡️');}catch(e){}markUnsaved();try{renderAll();}catch(e){}
  aurSay(aurL('✓ Guardado: <b>'+aurEsc(v.name)+'</b> tem agora uma password forte.','✓ Saved: <b>'+aurEsc(v.name)+'</b> now has a strong password.'),[{label:aurL('Próxima →','Next →'),fn:()=>{AVC.i++;avCleanupStep();}},{label:aurL('↶ Desfazer','↶ Undo'),fn:()=>{const u=AVC.undo,x=u&&vault.find(y=>y.id===u.id);if(x){x.pw=u.pw;x.pwUpdated=u.at;AVC.done=Math.max(0,AVC.done-1);markUnsaved();try{renderAll();}catch(e){}aurSay(aurL('↶ Voltei a pôr a password anterior do <b>'+aurEsc(x.name)+'</b>.','↶ Restored the previous password for <b>'+aurEsc(x.name)+'</b>.'),[{label:aurL('Continuar','Continue'),fn:()=>avCleanupStep()}]);}}}]);
}

/* ── ligação à Aurora: alcunhas, resumo semanal, limpeza, calendário ── */
(function(){
  if(typeof aurHandle!=='function')return;const ah=aurHandle;
  aurHandle=function(raw){
    if(typeof AVF!=='undefined'&&AVF.q&&AVF.q.awaiting)return ah.call(this,raw); // ficheiro à espera de destino: nomes de pastas ficam tal e qual
    if(raw&&avAliasHandle(raw))return true;
    const n=aurNorm(raw||'').replace(/[?!.]+$/,'').trim();
    const setL=()=>{const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;};
    if(/^(resumo (da|desta) semana|a minha semana|como (esta|vai) a minha semana|weekly summary|my week|week summary)$/.test(n)){setL();avWeekSummary();return true;}
    if(/^(limpeza( das passwords)?|limpa(r)? (as )?passwords( fracas)?|rev(er|e) (as )?passwords( fracas)?|melhora(r)? (as )?(minhas )?passwords|passwords fracas|fix (my )?weak passwords|clean ?up (my )?passwords|weak passwords)$/.test(n)){setL();avCleanupStart();return true;}
    if(/\b(envia|enviar|exporta|exportar|mete|meter|poe|por|junta|juntar|adiciona|adicionar)\b.*\b(renovacoes|datas|validades|lembretes|avisos)\b.*\bcalendario\b|\b(export|send|add)\b.*\b(renewals|dates|reminders)\b.*\bcalendar\b/.test(n)){setL();aurSay(aurL('📲 A preparar as datas para o teu calendário…','📲 Preparing the dates for your calendar…'));avExportICS();return true;}
    return ah.call(this,avApplyAliases(raw));
  };
})();


/* ══ v9.82 — CARTÕES ESTILO REVOLUT ══
   Na frente só os últimos 4 dígitos. Os dados (número, validade, CVV, PIN) só entram na página depois de confirmares
   a identidade (impressão digital / PIN / palavra-passe mestra — a mesma verificação do ecrã de entrada) e saem outra vez ao esconder. */
const AV_CC={open:null,timer:0,left:0,authAt:0};
const AV_EYE='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const AV_EYE_OFF='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
const AV_COPY='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
function avCardNet(num){const d=String(num||'').replace(/\D/g,'');if(/^4/.test(d))return 'visa';if(/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d))return 'mc';if(/^3[47]/.test(d))return 'amex';if(/^(6011|65|64[4-9])/.test(d))return 'discover';return '';}
function avCardNetHTML(num,small){const n=avCardNet(num);const st=small?' style="position:static;font-size:1rem"':'';
  if(n==='visa')return '<span class="av-cc-net"'+st+'>VISA</span>';if(n==='mc')return '<span class="av-cc-net mc"'+st+'><i></i><i></i></span>';if(n==='amex')return '<span class="av-cc-net"'+st+'>AMEX</span>';if(n==='discover')return '<span class="av-cc-net"'+st+'>DISCOVER</span>';return '';}
function avCardGroup(num){const d=String(num||'').replace(/\D/g,'');if(!d)return '—';if(avCardNet(d)==='amex')return [d.slice(0,4),d.slice(4,10),d.slice(10)].filter(Boolean).join(' ');return d.replace(/(.{4})/g,'$1 ').trim();}
renderBankCards=function(){
  const grid=document.getElementById('cards-grid-area');if(!grid)return;
  avCardHideAll(true);
  const en=avEn(),activeCards=bankCards.filter(cd=>!cd.archived);
  if(!activeCards.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><p>'+t('cardEmpty')+'</p></div>';try{avEnhanceEmpty();}catch(e){}return;}
  const TL=t('cardTypeLabels')||{};
  const btn=(fn,svg,lbl,cls)=>'<button class="card-btn'+(cls?' '+cls:'')+'" '+avActAttrs(fn)+'>'+svg+' '+lbl+'</button>';
  grid.innerHTML=activeCards.map(card=>{
    const d=String(card.number||'').replace(/\D/g,''),last4=d.slice(-4)||'••••',col=card.color||'#1a3a6b';
    return '<div class="bank-card-wrap av-cc" id="cc-'+card.id+'">'
     +'<div class="av-cc-scene" data-act="avCardSceneTap" data-arg="'+esc(card.id)+'"><div class="av-cc-card">'
     +'<div class="av-cc-face av-cc-front" style="background:linear-gradient(135deg,'+col+','+col+'cc)">'
     +'<div class="av-cc-top"><span class="av-cc-bank">'+esc(card.bank||'')+'</span>'+(card.type&&TL[card.type]?'<span class="av-cc-badge">'+esc(TL[card.type])+'</span>':'')+'</div>'
     +'<div class="av-cc-chip"></div><svg class="av-cc-nfc" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17"/></svg>'
     +'<div class="av-cc-num">•••• •••• •••• '+esc(last4)+'</div><div class="av-cc-holder">'+esc(card.holder||'')+'</div>'+avCardNetHTML(d)
     +'</div><div class="av-cc-face av-cc-back" id="cc-back-'+card.id+'" style="background:linear-gradient(135deg,'+col+','+col+'cc)"></div>'
     +'</div></div>'
     +'<button class="av-cc-reveal" id="cc-btn-'+card.id+'" data-act="avCardReveal" data-arg="'+esc(card.id)+'">'+AV_EYE+'<span>'+(en?'Show details':'Mostrar dados')+'</span></button>'
     +'<div class="av-cc-timer" id="cc-timer-'+card.id+'"></div>'
     +'<div class="bank-card-actions">'
     +btn("openCardModal('"+card.id+"')",'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',en?'Edit':'Editar')
     +btn("archiveCard('"+card.id+"')",'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg>',en?'Archive':'Arquivar')
     +btn("deleteCard('"+card.id+"')",'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',en?'Delete':'Apagar','danger')
     +'</div>'+(card.notes?'<div style="font-size:.62rem;color:var(--text-muted);padding:4px 2px;line-height:1.5">'+esc(card.notes)+'</div>':'')+'</div>';
  }).join('');
};
function avCardBackHTML(c){
  const en=avEn(),d=String(c.number||'').replace(/\D/g,'');
  return '<div class="av-cc-stripe"></div>'
   +'<div class="av-cc-top"><span class="av-cc-bank">'+esc(c.bank||'')+'</span>'+avCardNetHTML(d,true)+'</div>'
   +'<div class="av-cc-row"><div><small>'+(en?'Card number':'Número do cartão')+'</small><div class="av-cc-big">'+esc(avCardGroup(d))+'</div></div>'+(d?'<button class="av-cc-cp" title="'+(en?'Copy number':'Copiar número')+'" data-act="avCardCopy" data-arg="'+esc(c.id)+'" data-arg2="number" data-stop>'+AV_COPY+'</button>':'')+'</div>'
   +'<div class="av-cc-row"><div><small>'+(en?'Expiry':'Validade')+'</small><div class="av-cc-mid">'+esc(c.expiry||'—')+'</div></div>'
   +'<div><small>CVV</small><div class="av-cc-mid">'+esc(c.cvv||'—')+'</div></div>'
   +(c.pin?'<div><small>PIN</small><div class="av-cc-mid av-cc-pin" data-act="avCardPinTap" data-arg="'+esc(c.id)+'" data-this data-stop>••••</div></div>':'')
   +'<div style="flex:1;text-align:right"><small>'+(en?'Holder':'Titular')+'</small><div class="av-cc-mid" style="font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.holder||'—')+'</div></div>'
   +(c.cvv?'<button class="av-cc-cp" title="'+(en?'Copy CVV':'Copiar CVV')+'" data-act="avCardCopy" data-arg="'+esc(c.id)+'" data-arg2="cvv" data-stop>'+AV_COPY+'</button>':'')+'</div>';
}
function avCardPin(el,id){const c=bankCards.find(x=>x.id===id);if(!c||AV_CC.open!==id)return;el.textContent=el.textContent==='••••'?c.pin:'••••';}
function avCardCopy(id,f){const c=bankCards.find(x=>x.id===id);if(!c||AV_CC.open!==id)return;const v=f==='number'?String(c.number||'').replace(/\D/g,''):String(c[f]||'');if(v)copyText(v,f==='number'?(avEn()?'Card number copied':'Número do cartão copiado'):(avEn()?'CVV copied':'CVV copiado'));}
function avCardSceneTap(id){if(AV_CC.open===id)avCardHide(id);}
async function avCardReveal(id){
  if(AV_CC.open===id){avCardHide(id);return;}
  const c=bankCards.find(x=>x.id===id);if(!c)return;
  const ok=await avAuth(avEn()?'To show the card details':'Para mostrar os dados do cartão');if(!ok)return;
  avCardHideAll(true);
  const wrap=document.getElementById('cc-'+id),back=document.getElementById('cc-back-'+id);if(!wrap||!back)return;
  back.innerHTML=avCardBackHTML(c);wrap.classList.add('flipped');AV_CC.open=id;
  const b=document.getElementById('cc-btn-'+id);if(b)b.innerHTML=AV_EYE_OFF+'<span>'+(avEn()?'Hide details':'Esconder dados')+'</span>';
  AV_CC.left=30;avCardTick();clearInterval(AV_CC.timer);AV_CC.timer=setInterval(avCardTick,1000);
}
function avCardTick(){const id=AV_CC.open;if(!id){clearInterval(AV_CC.timer);return;}const el=document.getElementById('cc-timer-'+id);
  if(AV_CC.left<=0){avCardHide(id);return;}if(el)el.textContent=(avEn()?'Hides automatically in ':'Esconde-se sozinho em ')+AV_CC.left+' s';AV_CC.left--;}
function avCardHide(id,instant){
  const wrap=document.getElementById('cc-'+id);if(wrap)wrap.classList.remove('flipped');
  if(AV_CC.open===id){AV_CC.open=null;clearInterval(AV_CC.timer);}
  const t=document.getElementById('cc-timer-'+id);if(t)t.textContent='';
  const b=document.getElementById('cc-btn-'+id);if(b)b.innerHTML=AV_EYE+'<span>'+(avEn()?'Show details':'Mostrar dados')+'</span>';
  const clear=()=>{const bk=document.getElementById('cc-back-'+id);if(bk&&AV_CC.open!==id)bk.innerHTML='';};
  if(instant)clear();else setTimeout(clear,850);
}
function avCardHideAll(instant){if(AV_CC.open)avCardHide(AV_CC.open,instant);}
/* confirmação de identidade (mesma verificação do ecrã de entrada) */
function avAuth(sub){
  if(Date.now()-AV_CC.authAt<60000)return Promise.resolve(true);
  return new Promise(async resolve=>{
    const en=avEn();let hasPin=false,hasBio=false;
    try{hasPin=!!(await getPinRec());}catch(e){}try{hasBio=!!(await idbGet('qu_bio'));}catch(e){}
    let ov=document.getElementById('av-auth');if(!ov){ov=document.createElement('div');ov.id='av-auth';document.body.appendChild(ov);}
    let done=false;const finish=ok=>{if(done)return;done=true;ov.classList.remove('open');ov.innerHTML='';if(ok)AV_CC.authAt=Date.now();resolve(ok);};
    const same=pw=>!masterPwRaw||pw===masterPwRaw;
    const FP='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 11c0 3.5-1 6.5-3 9M8.5 7.5A5 5 0 0 1 17 11c0 2-.3 4-1 6M5.5 9.5A8 8 0 0 1 12 4a8 8 0 0 1 8 8c0 1.5-.2 3-.5 4.3M12 15c-.3 2-1 4-2 5.5M15 13.5c0 2.5-.5 5-1.5 7"/></svg>';
    const show=mode=>{
      const alt=[];if(mode!=='bio'&&hasBio)alt.push(['bio',en?'Use fingerprint':'Usar impressão digital']);if(mode!=='pin'&&hasPin)alt.push(['pin',en?'Use PIN':'Usar PIN']);if(mode!=='master')alt.push(['master',en?'Use master password':'Usar palavra-passe mestra']);
      let body='';
      if(mode==='bio')body='<button class="av-auth-fp" id="av-auth-fp" aria-label="'+(en?'Use fingerprint':'Usar impressão digital')+'">'+FP+'</button><h4>'+(en?'Confirm it’s you':'Confirma que és tu')+'</h4><p>'+esc(sub)+'</p>';
      else body='<h4 style="margin-top:6px">'+(en?'Confirm it’s you':'Confirma que és tu')+'</h4><p>'+esc(sub)+'</p><input class="av-auth-in" id="av-auth-in" '+(mode==='pin'?'type="password" inputmode="numeric" autocomplete="off" placeholder="PIN"':'type="password" autocomplete="current-password" placeholder="'+(en?'Master password':'Palavra-passe mestra')+'" style="letter-spacing:1px;font-weight:500"')+'><button class="av-auth-go" id="av-auth-go">'+(en?'Confirm':'Confirmar')+'</button>';
      ov.innerHTML='<div class="av-auth-box" role="dialog" aria-modal="true"><button class="av-auth-x" aria-label="'+(en?'Cancel':'Cancelar')+'">✕</button>'+body+'<div class="av-auth-err" id="av-auth-err"></div><div class="av-auth-alt">'+alt.map(a=>'<button data-m="'+a[0]+'">'+a[1]+'</button>').join('')+'</div></div>';
      ov.classList.add('open');
      ov.querySelector('.av-auth-x').onclick=()=>finish(false);
      ov.onclick=e=>{if(e.target===ov)finish(false);};
      ov.querySelectorAll('.av-auth-alt button').forEach(b=>b.onclick=()=>show(b.dataset.m));
      const err=m=>{const e=document.getElementById('av-auth-err');if(e)e.textContent=m;};
      if(mode==='bio'){const go=async()=>{err('');const r=await tryBio();if(r&&r.pw&&same(r.pw))finish(true);else if(r&&r.gone){hasBio=false;show(hasPin?'pin':'master');}else if(r&&r.err==='cancelled')err(en?'Cancelled — tap the fingerprint to try again.':'Cancelado — toca na impressão digital para tentar outra vez.');else err(en?'Couldn’t confirm — try again or use another method.':'Não foi possível confirmar — tenta outra vez ou usa outro método.');};
        document.getElementById('av-auth-fp').onclick=go;go();}
      else{const inp=document.getElementById('av-auth-in'),gob=document.getElementById('av-auth-go');setTimeout(()=>inp.focus(),60);
        const go=async()=>{const v=inp.value;if(!v)return;gob.disabled=true;err('');
          if(mode==='pin'){const r=await tryPin(v);gob.disabled=false;
            if(r&&r.pw&&same(r.pw))return finish(true);
            if(r&&r.blocked){hasPin=false;err(en?'PIN blocked after too many tries — use the master password.':'PIN bloqueado por tentativas a mais — usa a palavra-passe mestra.');setTimeout(()=>show('master'),1400);return;}
            if(r&&r.gone){hasPin=false;show('master');return;}
            inp.value='';err((en?'Wrong PIN':'PIN errado')+(r&&r.left!=null?(en?' — '+r.left+' tries left':' — faltam '+r.left+' tentativas'):''));}
          else{gob.disabled=false;if(masterPwRaw&&v===masterPwRaw)return finish(true);inp.value='';err(en?'Wrong password':'Palavra-passe errada');}};
        gob.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go();if(e.key==='Escape')finish(false);};}
    };
    show(hasBio?'bio':(hasPin?'pin':'master'));
  });
}
(function(){
  if(typeof switchTab==='function'){const st=switchTab;switchTab=function(){avCardHideAll(true);return st.apply(this,arguments);};}
  if(typeof lockApp==='function'){const la=lockApp;lockApp=function(){avCardHideAll(true);AV_CC.authAt=0;return la.apply(this,arguments);};}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){avCardHideAll(true);AV_CC.authAt=0;}});
  if(typeof openCardModal==='function'){const oc=openCardModal;openCardModal=function(){const r=oc.apply(this,arguments);try{const l=document.getElementById('card-cvv-lbl');if(l)l.innerHTML='CVV <span style="font-size:.5rem;color:var(--text-muted);letter-spacing:1px">'+(avEn()?'(optional · encrypted)':'(opcional · encriptado)')+'</span>';}catch(e){}return r;};}
})();


/* ══ v9.83 — BLOQUEAR EM SEGUNDO PLANO (com margem para copiar/colar) · BOTÃO «VOLTAR» DENTRO DA APP ══ */
function avBgLockSecs(){try{const v=localStorage.getItem('av_bg_lock');if(v===null||v==='')return 15;const n=parseInt(v,10);return [0,15,60,300,-1].includes(n)?n:15;}catch(e){return 15;}}
function avSetBgLock(v){try{localStorage.setItem('av_bg_lock',String(v));}catch(e){}avRenderSettings();const en=avEn();
  toast(v<0?(en?'The app won’t lock when you leave it.':'A app não bloqueia ao sair.'):v===0?(en?'Locks as soon as you leave the app.':'Bloqueia logo que saíres da app.'):(en?'Locks '+(v<60?v+' s':(v/60)+' min')+' after you leave the app.':'Bloqueia '+(v<60?v+' s':(v/60)+' min')+' depois de saíres da app.'));}
let _avHiddenAt=0,_avBgT=0,_avExtUntil=0,_avFlushP=null;
function avExtBusy(){return Date.now()<_avExtUntil;}
function avMarkExternal(ms){_avExtUntil=Date.now()+(ms||10*60e3);}
document.addEventListener('click',e=>{const t=e.target;if(t&&t.tagName==='INPUT'&&t.type==='file')avMarkExternal();},true);
(function(){
  try{if(navigator.share){const sh=navigator.share.bind(navigator);navigator.share=function(){avMarkExternal();return sh.apply(null,arguments);};}}catch(e){}
  ['showOpenFilePicker','showSaveFilePicker'].forEach(k=>{try{if(window[k]){const f=window[k].bind(window);window[k]=function(){avMarkExternal();return f.apply(null,arguments);};}}catch(e){}});
})();
async function avBgLockNow(){
  if(typeof masterKey==='undefined'||!masterKey||presentationMode)return;
  try{if(_avFlushP)await Promise.race([_avFlushP,new Promise(r=>setTimeout(r,4000))]);}catch(e){}
  try{if(hasUnsaved)await Promise.race([saveFile({auto:true}),new Promise(r=>setTimeout(r,4000))]);}catch(e){}   // grava primeiro…
  try{avCardHideAll(true);}catch(e){}
  if(masterKey)lockApp();                                                                                       // …bloqueia depois
}
document.addEventListener('visibilitychange',()=>{
  const secs=avBgLockSecs();
  if(document.hidden){
    if(typeof masterKey==='undefined'||!masterKey||presentationMode||secs<0)return;
    _avHiddenAt=Date.now();
    _avFlushP=hasUnsaved?Promise.resolve().then(()=>saveFile({auto:true})).catch(()=>{}):null;   // grava já ao sair
    clearTimeout(_avBgT);
    if(avExtBusy())return;                                   // a escolher ficheiro / partilhar: não bloquear
    if(secs===0){avBgLockNow();return;}
    _avBgT=setTimeout(()=>{if(document.hidden&&!avExtBusy())avBgLockNow();},secs*1000);
  }else{
    clearTimeout(_avBgT);
    const away=_avHiddenAt?Date.now()-_avHiddenAt:0;_avHiddenAt=0;
    if(avExtBusy()){_avExtUntil=0;return;}
    // o Android pode ter «congelado» a app: ao voltar confirma o tempo fora e bloqueia antes de mostrar o conteúdo
    if(typeof masterKey!=='undefined'&&masterKey&&secs>=0&&away>=secs*1000)avBgLockNow();
  }
});

/* ── botão «voltar» (Android/navegador): fecha o que está aberto em vez de sair da app ── */
let _avBackAt=0,_avTabBack=false;const _avTabStack=[];
function avAppOpen(){const a=document.getElementById('app');return typeof masterKey!=='undefined'&&!!masterKey&&!!a&&a.classList.contains('visible');}
function avGuard(){try{if(!history.state||!history.state.av)history.pushState({av:1},'');}catch(e){}}
function avTopOverlay(){
  const ovs=[...document.querySelectorAll('.modal-overlay.open,[id$="-overlay"].open')].filter(o=>getComputedStyle(o).display!=='none');
  if(!ovs.length)return null;
  return ovs.map((o,i)=>({o,i,z:parseInt(getComputedStyle(o).zIndex,10)||0})).sort((a,b)=>b.z-a.z||b.i-a.i)[0].o;
}
function avCloseOverlay(o){
  const b=[...o.querySelectorAll('button,[data-act]')].find(x=>/close|fechar|cancel/i.test((x.dataset.act||'')+' '+(x.className||'')+' '+(x.getAttribute('aria-label')||'')));
  if(b){b.click();if(!o.classList.contains('open'))return;}
  o.classList.remove('open');
}
function avBackHandle(){
  const q=s=>document.querySelector(s);
  if(q('#av-tabs-pop.open')){avTabsClose();return true;}
  const auth=q('#av-auth.open');if(auth){const x=auth.querySelector('.av-auth-x');if(x)x.click();else auth.classList.remove('open');return true;}
  if(typeof AVT!=='undefined'&&AVT.on){avTourEnd();return true;}
  if(q('#av-scan')){avScanClose();return true;}
  if(q('#av-add-pop.open')){avAddClose();return true;}
  if(q('#tb-more-menu.open')){tbCloseMore();return true;}
  const ov=avTopOverlay();if(ov){avCloseOverlay(ov);return true;}
  const ap=q('#aurora-panel.open');if(ap&&!ap.classList.contains('min')){aurClose(true);return true;}
  if(q('.topbar.m-search')){tbToggleSearch();return true;}
  const si=document.getElementById('search-input');if(si&&si.value){closeGlobalSearch();return true;}
  if(typeof AV_CC!=='undefined'&&AV_CC.open){avCardHideAll();return true;}
  if(_avTabStack.length){const t=_avTabStack.pop();_avTabBack=true;try{switchTab(t);}finally{_avTabBack=false;}return true;}
  if(avCurTab!=='dashboard'){_avTabBack=true;try{switchTab('dashboard');}finally{_avTabBack=false;}return true;}
  return false;
}
window.addEventListener('popstate',()=>{
  if(!avAppOpen())return;
  /* um «voltar» gerado pelo próprio deslize (o browser/Android toma o deslize para a direita como «voltar») não conta */
  if((typeof AV_S!=='undefined'&&AV_S.on)||(typeof AV_G!=='undefined'&&(AV_G.busy||Date.now()-(AV_G.lastSwipe||0)<600))){avGuard();return;}                                  // bloqueada: o «voltar» comporta-se normalmente
  if(avBackHandle()){avGuard();return;}
  if(Date.now()-_avBackAt<2200){_avBackAt=0;try{history.back();}catch(e){}return;}   // 2.º toque no Dashboard → sair
  _avBackAt=Date.now();toast(avEn()?'Press back again to exit':'Toca outra vez em «voltar» para sair');avGuard();
});
(function(){
  if(typeof switchTab==='function'){const st=switchTab;switchTab=function(t){const prev=typeof avCurTab!=='undefined'?avCurTab:null;const r=st.apply(this,arguments);
    if(!_avTabBack&&prev&&prev!==t){_avTabStack.push(prev);if(_avTabStack.length>20)_avTabStack.shift();}return r;};}
  if(typeof doUnlock==='function'){const du=doUnlock;doUnlock=function(){const r=du.apply(this,arguments);_avTabStack.length=0;setTimeout(avGuard,300);return r;};}
  if(typeof lockApp==='function'){const la=lockApp;lockApp=function(){_avTabStack.length=0;return la.apply(this,arguments);};}
})();


/* ══ v9.84 — ⚙ MOSTRAR / ESCONDER ABAS (esconder ≠ apagar · a Aurora vê tudo) ══ */
const AV_GROUPS=[['dashboard','📊',['Dashboard','Dashboard'],['sempre visível','always visible']],['cofre','🔐',['Cofre','Vault'],['passwords e 2FA','passwords and 2FA']],['cards','💳',['Cartões','Cards'],['bancários e de loja','bank and store']],['docs','📁',['Documentos','Documents'],['documentos, notas, info','documents, notes, info']],['bens','🏠',['Bens','Assets'],['garantias, veículos, datas','warranties, vehicles, dates']],['archive','📦',['Arquivo','Archive'],['arquivo e reciclagem','archive and trash']]];
function avHiddenTabs(){try{const a=JSON.parse(localStorage.getItem('av_hidden_tabs')||'[]');return Array.isArray(a)?a.filter(g=>g!=='dashboard'&&TAB_GROUPS[g]):[];}catch(e){return [];}}
function avHideLock(){try{return localStorage.getItem('av_hide_lock')!=='0';}catch(e){return true;}}
function avTabHidden(tab){if(!tab)return false;try{return avHiddenTabs().includes(groupOfTab(tab));}catch(e){return false;}}
function avApplyHidden(){
  const hid=avHiddenTabs();
  Object.keys(TAB_GROUPS).forEach(g=>{const b=document.getElementById('grp-btn-'+g);if(b)b.classList.toggle('av-hid',hid.includes(g));});
  try{if(hid.includes(currentGroup)&&typeof masterKey!=='undefined'&&masterKey)switchGroup('dashboard');}catch(e){}
}
function avTabsClose(){const p=document.getElementById('av-tabs-pop'),d=document.getElementById('av-tabs-dim');if(p)p.classList.remove('open');if(d)d.classList.remove('open');const g=document.getElementById('grp-gear');if(g)g.classList.remove('on');}
function avTabsPanel(e){
  if(e)e.stopPropagation();
  let p=document.getElementById('av-tabs-pop'),d=document.getElementById('av-tabs-dim');
  if(p&&p.classList.contains('open')){avTabsClose();return;}
  if(!p){d=document.createElement('div');d.id='av-tabs-dim';d.className='av-dim';d.onclick=avTabsClose;document.body.appendChild(d);
    p=document.createElement('div');p.id='av-tabs-pop';p.className='av-pop';document.body.appendChild(p);}
  avTabsRender();
  if(avIsDesk()){p.classList.remove('sheet');d.classList.remove('open');const g=document.getElementById('grp-gear').getBoundingClientRect();
    p.style.top=Math.round(g.bottom+8)+'px';p.style.left=Math.max(10,Math.min(innerWidth-390,Math.round(g.left-160)))+'px';p.style.right='auto';p.style.bottom='auto';}
  else{p.classList.add('sheet');p.style.top='auto';p.style.left='0';p.style.right='0';d.classList.add('open');}
  p.classList.add('open');document.getElementById('grp-gear').classList.add('on');
}
function avTabsRender(){
  const p=document.getElementById('av-tabs-pop');if(!p)return;const en=avEn(),hid=avHiddenTabs(),simple=avMode()==='simple';
  p.innerHTML='<div class="av-grab"></div><h4>'+(en?'Visible tabs':'Abas visíveis')+'</h4>'
   +AV_GROUPS.map(([g,ic,n,sub])=>{const dash=g==='dashboard',byMode=simple&&(g==='bens'||g==='archive'),on=dash||!hid.includes(g);
     const s=dash?avT(sub):(byMode?(en?'hidden by Simple mode':'escondida pelo Modo Simples'):(on?avT(sub):(en?'hidden — nothing was deleted':'escondida — nada foi apagado')));
     return '<div class="av-tr'+(on?'':' off')+'" '+(dash?'':'data-act="avTabToggle" data-arg="'+esc(g)+'"')+' role="switch" aria-checked="'+on+'"><span class="ic">'+ic+'</span><span class="av-tr-t"><b>'+avT(n)+'</b><i>'+s+'</i></span><span class="av-sw'+(on?' on':'')+(dash?' lock':'')+'"></span></div>';}).join('')
   +'<div class="av-tr" data-act="avHideLockToggle" style="border-top:1px solid var(--border);margin-top:4px"><span class="ic">🔒</span><span class="av-tr-t"><b>'+(en?'Ask for fingerprint / PIN':'Pedir impressão digital / PIN')+'</b><i>'+(en?'to show a hidden tab again':'para voltar a mostrar uma aba escondida')+'</i></span><span class="av-sw'+(avHideLock()?' on':'')+'"></span></div>'
   +'<div class="av-tp-note">✨ '+(en?'<b>Aurora</b> still sees everything, even in hidden tabs.':'A <b>Aurora</b> continua a ver tudo, mesmo nas abas escondidas.')+'</div>';
}
async function avTabToggle(g){
  if(g==='dashboard')return;const hid=avHiddenTabs(),isHid=hid.includes(g),en=avEn();
  if(isHid&&avHideLock()){const ok=await avAuth(en?'To show a hidden tab':'Para voltar a mostrar uma aba escondida');if(!ok)return;}
  const nx=isHid?hid.filter(x=>x!==g):hid.concat([g]);
  try{localStorage.setItem('av_hidden_tabs',JSON.stringify(nx));}catch(e){}
  avApplyHidden();avTabsRender();try{avAddLabel();}catch(e){}
  const nm=avT((AV_GROUPS.find(x=>x[0]===g)||[])[2]);
  toast(isHid?(en?'«'+nm+'» is visible again.':'«'+nm+'» voltou a aparecer.'):(en?'«'+nm+'» hidden — nothing was deleted.':'«'+nm+'» escondida — nada foi apagado.'));
}
async function avHideLockToggle(){const on=avHideLock(),en=avEn();
  if(on){const ok=await avAuth(en?'To turn off this protection':'Para desligar esta proteção');if(!ok)return;}
  try{localStorage.setItem('av_hide_lock',on?'0':'1');}catch(e){}avTabsRender();}
document.addEventListener('click',e=>{const p=document.getElementById('av-tabs-pop');if(p&&p.classList.contains('open')&&!p.contains(e.target)&&!(e.target.closest&&e.target.closest('#grp-gear')))avTabsClose();});
(function(){
  if(typeof renderTabNav==='function'){const rt=renderTabNav;renderTabNav=function(){const r=rt.apply(this,arguments);try{const hid=avHiddenTabs();Object.keys(TAB_GROUPS).forEach(g=>{const b=document.getElementById('grp-btn-'+g);if(b)b.classList.toggle('av-hid',hid.includes(g));});}catch(e){}return r;};}
  if(typeof setLang==='function'){const sl=setLang;setLang=function(){const r=sl.apply(this,arguments);try{const g=document.getElementById('grp-gear');if(g){const l=avEn()?'Show / hide tabs':'Mostrar / esconder abas';g.title=l;g.setAttribute('aria-label',l);}avTabsRender();}catch(e){}return r;};}
  setTimeout(avApplyHidden,0);
})();

/* ══ v9.84 — DESLIZAR ENTRE ABAS (telemóvel): Parallax · Cartões em pilha · Revelação Aurora · Deslize suave ══ */
function avSwStyle(){try{const v=localStorage.getItem('av_swipe_style');return ['parallax','stack','reveal','fade','off'].includes(v)?v:'stack';}catch(e){return 'stack';}}
function avSetSwStyle(v){try{localStorage.setItem('av_swipe_style',v);}catch(e){}avRenderSettings();}
const AV_SW={cand:false,on:false,lock:null,sx:0,sy:0,t0:0,dir:0,p:0,out:null,inn:null,tg:null,fx:0,fy:0,top:0,reduce:false,anim:0};
const AV_SW_PROPS=['position','left','right','top','bottom','zIndex','overflow','background','animation','willChange','transform','filter','opacity','borderRadius','boxShadow','clipPath','transformOrigin','transition'];
function avSwGroups(){return Object.keys(TAB_GROUPS).filter(g=>{const b=document.getElementById('grp-btn-'+g);return b&&getComputedStyle(b).display!=='none';});}
function avSwBlocked(t){
  if(!avAppOpen()||presentationMode||avIsDesk())return true;
  if(document.querySelector('.modal-overlay.open,[id$="-overlay"].open,#av-add-pop.open,#av-tabs-pop.open,#av-auth.open,#tb-more-menu.open,#avt-root,#av-scan'))return true;
  const ap=document.getElementById('aurora-panel');if(ap&&ap.classList.contains('open')&&!ap.classList.contains('min'))return true;
  for(let el=t;el&&el!==document.body;el=el.parentElement){
    // campos de texto e barras deslizantes: o arrasto horizontal tem outro significado (mover o cursor, mudar o valor)
    if(el.tagName==='TEXTAREA'||el.isContentEditable)return true;
    if(el.tagName==='INPUT'&&!/^(checkbox|radio|button|submit|reset|color|file)$/i.test(el.type||''))return true;
    if(el.classList&&(el.classList.contains('tabs')||el.classList.contains('topbar')||el.id==='subtabs'))return true;
    const cs=getComputedStyle(el);if((cs.overflowX==='auto'||cs.overflowX==='scroll')&&el.scrollWidth>el.clientWidth+4)return true;
  }
  return false;
}
function avSwTopY(){const tb=document.getElementById('grp-btn-dashboard').parentElement,sb=document.getElementById('subtabs');let y=tb.getBoundingClientRect().bottom;if(sb&&getComputedStyle(sb).display!=='none')y=Math.max(y,sb.getBoundingClientRect().bottom);return Math.max(0,Math.round(y));}
function avSwStart(dir){
  const gs=avSwGroups(),i=gs.indexOf(currentGroup),j=i+dir;if(i<0||j<0||j>=gs.length)return false;
  const tg=gs[j],leaf=lastLeafOf[tg]||TAB_GROUPS[tg][0];
  const out=document.getElementById('tab-'+avCurTab),inn=document.getElementById('tab-'+leaf);if(!out||!inn||out===inn)return false;
  try{if(leaf==='trash')renderTrash();if(leaf==='totp')renderTotp();if(leaf==='info')renderInfo();if(leaf==='store')renderStoreCards();if(['warranty','license','vehicle','dates'].includes(leaf))renderAssets(leaf);}catch(e){}
  const sy=window.scrollY||0,tb=document.getElementById('grp-btn-dashboard').parentElement,tbR=tb.getBoundingClientRect(),tbTop0=tbR.top+sy,tbBot0=tbR.bottom+sy;
  const tpB=Math.max(0,Math.round((document.querySelector('.topbar')||tb).getBoundingClientRect().bottom)),scrolled=sy>1;
  const topMain=scrolled?tpB:Math.max(0,Math.round(tbR.bottom));
  Object.assign(AV_SW,{on:true,dir,tg,leaf,out,inn,top:topMain,reduce:!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),outEls:[out],inEls:[inn],clones:[],raf:0});
  if(AV_SW.reduce)return true;
  // a aurora animada pausa durante o gesto (liberta o telemóvel para a animação)
  try{AV_SW.bgRun=typeof AuroraBG!=='undefined'&&AuroraBG.isRunning&&AuroraBG.isRunning();if(AV_SW.bgRun)AuroraBG.stop();}catch(e){AV_SW.bgRun=false;}
  const mk=(node,top,left,width,z)=>{const c=node.cloneNode?node:node;c.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));c.removeAttribute('id');
    Object.assign(c.style,{position:'fixed',top:Math.round(top)+'px',left:Math.round(left)+'px',width:Math.round(width)+'px',margin:'0',zIndex:String(z),boxSizing:'border-box',pointerEvents:'none',willChange:'transform,opacity,clip-path'});
    document.body.appendChild(c);AV_SW.clones.push(c);AV_SW.inEls.push(c);return c;};
  // 1) MEDIR A PÁGINA NOVA NO SÍTIO VERDADEIRO — troca por instantes e repõe, tudo antes de o ecrã ser pintado (não se vê)
  out.classList.add('av-sw-still');inn.classList.add('av-sw-still');
  const curTab=avCurTab,sb=document.getElementById('subtabs'),ft=document.querySelector('.app-footer');
  try{avEnhanceEmpty(leaf);}catch(e){}
  out.classList.remove('active');inn.classList.add('active');try{renderTabNav(leaf);}catch(e){}
  const sy2=window.scrollY||0,iR=inn.getBoundingClientRect(),fut={l:iR.left,t:iR.top+sy2,w:iR.width};
  let sbF=null,sbNode=null;if(sb&&getComputedStyle(sb).display!=='none'){const r=sb.getBoundingClientRect();sbF={l:r.left,t:r.top+sy2,w:r.width};sbNode=sb.cloneNode(true);}
  let ftF=null,ftNode=null;if(ft&&getComputedStyle(ft).display!=='none'){const r=ft.getBoundingClientRect();ftF={l:r.left,t:r.top+sy2,w:r.width};ftNode=ft.cloneNode(true);}
  inn.classList.remove('active');out.classList.add('active');try{renderTabNav(curTab);}catch(e){}
  if(Math.abs((window.scrollY||0)-sy)>0.5)window.scrollTo(0,sy);
  // 2) o presente: o que sai
  if(sb&&getComputedStyle(sb).display!=='none')AV_SW.outEls.push(sb);
  if(ft&&getComputedStyle(ft).display!=='none')AV_SW.outEls.push(ft);
  if(scrolled){  // a barra das abas saiu do ecrã com o scroll: a da página nova entra já no sítio, com o sublinhado na aba certa
    AV_SW.outEls.push(tb);
    const tc=mk(tb.cloneNode(true),tbTop0,tbR.left,tbR.width,61);
    const tBtn=[...tb.querySelectorAll('.tab-btn')].findIndex(b=>b.id==='grp-btn-'+tg);
    tc.querySelectorAll('.tab-btn').forEach((b,k)=>b.classList.toggle('active',k===tBtn));
    const ind=tc.querySelector('.tab-indicator'),nb=tc.querySelectorAll('.tab-btn')[tBtn];
    if(ind&&nb){ind.style.transition='none';ind.style.width=nb.offsetWidth+'px';ind.style.transform='translateX('+nb.offsetLeft+'px)';ind.style.left='0';}
  }
  // 3) o que entra, exatamente onde vai ficar
  if(sbNode)mk(sbNode,sbF.t,sbF.l,sbF.w,61);
  AV_SW.inTop=fut.t;
  inn.classList.add('active');
  Object.assign(inn.style,{position:'fixed',left:Math.round(fut.l)+'px',width:Math.round(fut.w)+'px',top:Math.round(fut.t)+'px',bottom:'0',zIndex:'60',overflow:'hidden',animation:'none',boxSizing:'border-box',margin:'0',willChange:'transform,opacity,clip-path'});
  if(ftNode&&ftF.t<innerHeight+40){const fc=mk(ftNode,ftF.t,ftF.l,ftF.w,60);fc.id='av-sw-foot';}
  AV_SW.geo=new Map();
  AV_SW.outEls.forEach(el=>{const r=el.getBoundingClientRect();AV_SW.geo.set(el,{l:r.left,t:r.top,w:r.width,h:r.height,it:el===out?Math.max(0,topMain-r.top):0,ib:el===out?Math.max(0,r.bottom-innerHeight):0});
    el.style.animation='none';el.style.willChange='transform,opacity,clip-path';el.style.transformOrigin='50% '+Math.round(innerHeight/2-r.top)+'px';});
  // sombra e cantos desenhados uma só vez (mexer-lhes a cada fotograma obrigava a redesenhar)
  const st=avSwStyle();
  if(st==='parallax'||st==='stack'){const sh=(dir>0?'-18px':'18px')+' 0 30px -8px rgba(0,0,0,.6)';AV_SW.inEls.forEach(el=>el.style.boxShadow=sh);if(st==='stack')inn.style.borderRadius='18px';}
  let dim=document.getElementById('av-sw-dim');if(!dim){dim=document.createElement('div');dim.id='av-sw-dim';document.body.appendChild(dim);}
  Object.assign(dim.style,{position:'fixed',left:'0',right:'0',top:topMain+'px',bottom:'0',background:'#000',opacity:'0',zIndex:'59',pointerEvents:'none',willChange:'opacity',display:'block'});
  if(st==='reveal'){let ring=document.getElementById('av-sw-ring');if(!ring){ring=document.createElement('div');ring.id='av-sw-ring';ring.className='av-sw-ring';document.body.appendChild(ring);}}
  return true;
}
function avSwRender(){
  if(AV_SW.reduce)return;const P=AV_SW.p,st=avSwStyle(),s=AV_SW.dir,edge=P>0&&P<1,W=innerWidth;
  const OUT=AV_SW.outEls,IN=AV_SW.inEls,set=(els,k,v)=>els.forEach(el=>el.style[k]=v);
  const dim=document.getElementById('av-sw-dim');
  if(dim){dim.style.opacity=st==='fade'?0:String((st==='stack'?0.5:st==='reveal'?0.35:0.45)*P);}
  if(st==='parallax'||st==='stack'){
    const k=st==='parallax'?0.30:0.06,sc=st==='stack'?1-0.1*P:1;
    set(OUT,'transform',st==='parallax'?'translateX('+(-s*30*P)+'%)':'translateX('+(-s*6*P)+'%) scale('+sc+')');
    set(IN,'transform','translateX('+(s*100*(1-P))+'vw)');
    const X=s>0?W*(1-P):W*P;
    OUT.forEach(el=>{const g=AV_SW.geo.get(el);if(!g)return;const tx=-s*k*g.w*P,ox=g.l+g.w/2,xl=(X-ox-tx)/sc+ox-g.l;
      const r=st==='stack'&&el===AV_SW.out?' round 18px':'';
      el.style.clipPath=s>0?'inset('+g.it+'px '+Math.max(0,g.w-xl)+'px '+g.ib+'px 0'+r+')':'inset('+g.it+'px 0 '+g.ib+'px '+Math.max(0,xl)+'px'+r+')';});
    if(dim)dim.style.clipPath=s>0?'inset(0 '+Math.max(0,W-X)+'px 0 0)':'inset(0 0 0 '+Math.max(0,X)+'px)';
  }
  else if(st==='reveal'){
    const top=AV_SW.top,hh=innerHeight-top,cx=AV_SW.fx,R=Math.hypot(Math.max(cx,W-cx),Math.max(AV_SW.fy-top,hh-(AV_SW.fy-top)))*1.02*P;
    IN.forEach(el=>{const r0=parseFloat(el.style.top)||top,l0=parseFloat(el.style.left)||0;el.style.clipPath='circle('+R+'px at '+(cx-l0)+'px '+(AV_SW.fy-r0)+'px)';});
    const hole=(w,hgt,x,y)=>"path(evenodd,'M0 0H"+Math.ceil(w)+"V"+Math.ceil(hgt)+"H0Z M"+(x-R)+" "+y+" a"+R+" "+R+" 0 1 0 "+(2*R)+" 0 a"+R+" "+R+" 0 1 0 "+(-2*R)+" 0Z')";
    if(R>0.5){OUT.forEach(el=>{const g=AV_SW.geo.get(el);if(g)el.style.clipPath=hole(g.w,g.h,cx-g.l,AV_SW.fy-g.t);});if(dim)dim.style.clipPath=hole(W,hh,cx,AV_SW.fy-top);}
    const ring=document.getElementById('av-sw-ring');if(ring){ring.style.opacity=edge&&P<0.985?Math.min(1,P*4)*(1-Math.max(0,(P-0.8)/0.2)):0;ring.style.width=ring.style.height=(2*R)+'px';ring.style.left=(AV_SW.fx-R)+'px';ring.style.top=(AV_SW.fy-R)+'px';}
  }
  else{set(OUT,'opacity',String(1-P));set(OUT,'transform','translateX('+(-s*46*P)+'px)');set(IN,'opacity',String(P));set(IN,'transform','translateX('+(s*46*(1-P))+'px)');}
}
function avSwCleanup(done){
  const {out,inn}=AV_SW;
  (AV_SW.outEls||[]).concat([inn]).forEach(el=>{if(el)AV_SW_PROPS.concat(['width','margin','boxSizing']).forEach(k=>{if(k==='animation'&&(el===out||el===inn))return;el.style[k]='';});});
  if(inn&&!done){inn.classList.remove('av-sw-still');if(inn!==out)inn.classList.remove('active');}
  (AV_SW.clones||[]).forEach(c=>c.remove());AV_SW.clones=[];
  const ring=document.getElementById('av-sw-ring');if(ring)ring.style.opacity=0;const dim=document.getElementById('av-sw-dim');if(dim)dim.style.display='none';
  try{if(AV_SW.bgRun){AV_SW.bgRun=false;AuroraBG.start();}}catch(e){}
}
function avSwEnd(done){
  const tg=AV_SW.tg,inn=AV_SW.inn;cancelAnimationFrame(AV_SW.raf);AV_SW.raf=0;AV_SW.on=false;
  if(done&&tg){
    switchGroup(tg);                     // troca POR BAIXO da imagem que já está no ecrã…
    try{window.scrollTo(0,0);}catch(e){}
    avSwCleanup(true);                   // …e retira a sobreposição no mesmo fotograma
    if(inn){inn.classList.add('active','av-sw-still');inn.style.animation='none';}
  }else avSwCleanup(false);
}
function avSwAnimate(to){
  cancelAnimationFrame(AV_SW.anim);if(AV_SW.reduce){avSwEnd(to===1);return;}
  const from=AV_SW.p,t0=performance.now(),dur=Math.max(120,300*Math.abs(to-from));
  const step=t=>{let k=Math.min(1,(t-t0)/dur);k=1-Math.pow(1-k,3);AV_SW.p=from+(to-from)*k;avSwRender();if(k<1)AV_SW.anim=requestAnimationFrame(step);else avSwEnd(to===1);};
  AV_SW.anim=requestAnimationFrame(step);
}
/* ── deslizar (v9.89): a página acompanha um pouco o dedo; ao largar, o browser anima fotografias exatas das duas páginas ── */
const AV_G={cand:false,lock:null,sx:0,sy:0,t0:0,dx:0,dir:0,el:null,raf:0,busy:false};
function avGestTarget(dir){const gs=avSwGroups(),i=gs.indexOf(currentGroup),j=i+dir;return (i<0||j<0||j>=gs.length)?null:gs[j];}
function avGestPeek(){AV_G.raf=0;if(!AV_G.els||!AV_G.els.length)return;const W=innerWidth,d=AV_G.dx,has=!!avGestTarget(d<0?1:-1);let x;
  if(has){const lim=W*0.42;x=d*0.6;if(Math.abs(x)>lim)x=Math.sign(x)*(lim+(Math.abs(x)-lim)*0.15);}else x=Math.sign(d)*Math.min(48,Math.abs(d)*0.12);
  AV_G.els.forEach(el=>el.style.transform='translateX('+x.toFixed(1)+'px)');}
// Scroll: o fundo animado para enquanto a página se mexe (é o que mais pesa num telemóvel lento) e retoma logo a seguir
{let held=false,t=0;
  addEventListener('scroll',()=>{
    if(!held&&typeof AuroraBG!=='undefined'&&AuroraBG.isRunning()&&!AV_G.bgHeld){AuroraBG.stop();held=true;}
    clearTimeout(t);t=setTimeout(()=>{if(held){held=false;if(!AV_G.bgHeld&&!document.hidden)AuroraBG.start();}},180);
  },{passive:true,capture:true});}
function avBgHold(on){try{if(typeof AuroraBG==='undefined')return;if(on){if(!AV_G.bgHeld&&AuroraBG.isRunning()){AuroraBG.stop();AV_G.bgHeld=true;}}else if(AV_G.bgHeld){AV_G.bgHeld=false;AuroraBG.start();}}catch(e){}}
function avGestReset(anim){if(anim)setTimeout(()=>{if(!AV_G.busy)avBgHold(false);},230);const els=AV_G.els||[];els.forEach(el=>{if(anim){el.style.transition='transform .2s cubic-bezier(.2,.8,.2,1)';el.style.transform='';setTimeout(()=>{el.style.transition='';el.style.willChange='';},220);}else{el.style.transition='';el.style.transform='';el.style.willChange='';}});AV_G.els=[];AV_G.el=null;}
function avVTok(){return !!document.startViewTransition&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&avSwStyle()!=='off';}
function avVTRun(run,dir,kind,fx,fy){
  const root=document.documentElement,st=kind==='tap'?'tap':avSwStyle();
  if(!avVTok()){run();avBgHold(false);return;}
  const tok=(AV_G.tok=(AV_G.tok||0)+1);AV_G.busy=true;avBgHold(true);
  root.style.setProperty('--avd',String(dir));
  fx=fx||innerWidth*(dir>0?0.8:0.2);fy=fy||innerHeight*0.6;
  root.style.setProperty('--avx',Math.round(fx)+'px');root.style.setProperty('--avy',Math.round(fy)+'px');
  root.style.setProperty('--avr',Math.ceil(Math.hypot(Math.max(fx,innerWidth-fx),Math.max(fy,innerHeight-fy))*1.05)+'px');
  root.classList.remove('av-vt-parallax','av-vt-stack','av-vt-reveal','av-vt-fade','av-vt-tap');root.classList.add('av-vt','av-vt-'+st);
  let ring=null;
  const vt=document.startViewTransition(()=>{run();
    try{window.__aurFabRaw&&window.__aurFabRaw();}catch(e){}
    {const nt=document.getElementById('tab-'+avCurTab);if(nt)nt.style.animation='none';}  /* sem animação de entrada nesta troca — limpa-se sozinha na troca seguinte */
    if(st==='reveal'){const R=parseFloat(root.style.getPropertyValue('--avr'))||600;ring=document.createElement('div');ring.className='av-vt-ring';Object.assign(ring.style,{left:(fx-R)+'px',top:(fy-R)+'px',width:(2*R)+'px',height:(2*R)+'px'});document.body.appendChild(ring);}});
  AV_G.vt=vt;
  const done=()=>{if(ring)ring.remove();if(AV_G.tok!==tok)return;root.classList.remove('av-vt','av-vt-parallax','av-vt-stack','av-vt-reveal','av-vt-fade','av-vt-tap');AV_G.busy=false;AV_G.vt=null;AV_G.lock=null;avBgHold(false);try{aurFab();}catch(e){}};
  vt.finished.then(done,done);
}
function avGestGo(dir){
  const tg=avGestTarget(dir);if(!tg){avGestReset(true);return;}
  avVTRun(()=>{avGestReset(false);switchGroup(tg);try{window.scrollTo(0,0);}catch(e){}},dir,'swipe',AV_G.fx,AV_G.fy);
}
/* toques nas abas e sub-abas (telemóvel): o mesmo sem piscar, com um deslize curto na direção certa */
document.addEventListener('click',e=>{
  const b=e.target&&e.target.closest&&e.target.closest('#app>.tabs .tab-btn[id^="grp-btn-"],#subtabs .subtab-btn');
  if(!b||!avVTok()||!avAppOpen()||avIsDesk())return;
  let run,dir;
  if(b.id.indexOf('grp-btn-')===0){const g=b.id.slice(8);if(g===currentGroup)return;const gs=Object.keys(TAB_GROUPS);dir=gs.indexOf(g)>gs.indexOf(currentGroup)?1:-1;run=()=>switchGroup(g);}
  else{const leaf=b.id.slice(8);if(leaf===avCurTab||!TAB_GROUPS[currentGroup])return;const lv=TAB_GROUPS[currentGroup];dir=lv.indexOf(leaf)>lv.indexOf(avCurTab)?1:-1;run=()=>switchTab(leaf);}
  e.preventDefault();e.stopImmediatePropagation();avVTRun(run,dir,'tap');
},true);
/* ── v9.93: O DEDO CONTROLA A TRANSIÇÃO — a aba nova entra/revela-se ao ritmo do dedo (fotografias exatas: nada estica nem pisca);
      ao largar completa-se ou volta atrás. Na Revelação Aurora o círculo nasce onde tocaste. ── */
const AV_S={on:false,vt:null,anims:null,ring:null,p:0,want:null,intent:null,from:null,sy:0,tg:null,dir:0,tok:0,tw:0};
const AV_SCR_W=0.85;   // fração da largura do ecrã que corresponde à transição completa
function avScrubSet(p){AV_S.p=Math.max(0,Math.min(1,p));if(!AV_S.anims)return;
  AV_S.anims.forEach(a=>{try{const tm=a.effect.getTiming();a.currentTime=(tm.delay||0)+AV_S.p*(tm.duration||0);}catch(e){}});}
function avScrubStart(dir){
  const tg=avGestTarget(dir);if(!tg||!avVTok())return false;
  const st=avSwStyle(),root=document.documentElement,fx=AV_G.sx,fy=AV_G.sy;
  const tok=++AV_S.tok;Object.assign(AV_S,{on:true,vt:null,anims:null,ring:null,p:0,want:null,intent:null,from:{g:currentGroup,t:avCurTab},sy:window.scrollY||0,tg,dir});
  AV_G.busy=true;avBgHold(true);
  root.style.setProperty('--avd',String(dir));root.style.setProperty('--avx',Math.round(fx)+'px');root.style.setProperty('--avy',Math.round(fy)+'px');
  root.style.setProperty('--avr',Math.ceil(Math.hypot(Math.max(fx,innerWidth-fx),Math.max(fy,innerHeight-fy))*1.05)+'px');
  root.classList.remove('av-vt-parallax','av-vt-stack','av-vt-reveal','av-vt-fade','av-vt-tap');root.classList.add('av-vt','av-vt-'+st,'av-vt-scrub');
  const vt=document.startViewTransition(()=>{
    switchGroup(tg);const nt=document.getElementById('tab-'+avCurTab);if(nt)nt.style.animation='none';try{window.scrollTo(0,0);}catch(e){}
    try{window.__aurFabRaw&&window.__aurFabRaw();}catch(e){}
    if(st==='reveal'){const R=parseFloat(root.style.getPropertyValue('--avr'))||600;const ring=document.createElement('div');ring.className='av-vt-ring';Object.assign(ring.style,{left:(fx-R)+'px',top:(fy-R)+'px',width:(2*R)+'px',height:(2*R)+'px'});document.body.appendChild(ring);AV_S.ring=ring;}});
  AV_S.vt=vt;
  vt.ready.then(()=>{if(AV_S.tok!==tok)return;
    AV_S.anims=document.getAnimations().filter(a=>a.effect&&/::view-transition/.test(a.effect.pseudoElement||''));
    AV_S.anims.forEach(a=>a.pause());avScrubSet(AV_S.p);if(AV_S.want!==null)avScrubRelease(AV_S.want);}).catch(()=>{});
  const done=()=>{if(AV_S.ring&&AV_S.tok===tok){AV_S.ring.remove();AV_S.ring=null;}if(AV_S.tok!==tok)return;
    root.classList.remove('av-vt','av-vt-parallax','av-vt-stack','av-vt-reveal','av-vt-fade','av-vt-tap','av-vt-scrub');
    AV_S.on=false;AV_S.vt=null;AV_S.anims=null;AV_G.busy=false;AV_G.lock=null;avBgHold(false);try{aurFab();}catch(e){}};
  vt.finished.then(done,done);
  return true;
}
function avScrubRelease(commit){
  if(!AV_S.on)return;AV_S.intent=commit;
  if(!AV_S.anims){AV_S.want=commit;return;}          // ainda a preparar as fotografias: decide assim que estiverem prontas
  AV_S.want=null;cancelAnimationFrame(AV_S.tw);
  const from=AV_S.p,to=commit?1:0,t0=performance.now(),dur=Math.max(110,300*Math.abs(to-from)),tok=AV_S.tok;
  const step=t=>{if(AV_S.tok!==tok)return;let k=Math.min(1,(t-t0)/dur);k=1-Math.pow(1-k,3);avScrubSet(from+(to-from)*k);if(k<1)AV_S.tw=requestAnimationFrame(step);else avScrubFinish(commit);};
  AV_S.tw=requestAnimationFrame(step);
}
function avScrubFinish(commit){
  if(!AV_S.on||!AV_S.vt)return;cancelAnimationFrame(AV_S.tw);
  if(!commit){  // voltar atrás: repõe a aba, o scroll e o histórico do «voltar» no mesmo instante em que a transição acaba (sem piscar)
    const f=AV_S.from,ind=document.getElementById('tab-indicator');if(ind)ind.style.transition='none';
    try{switchTab(f.t);}catch(e){}
    const ot=document.getElementById('tab-'+avCurTab);if(ot)ot.style.animation='none';
    try{window.scrollTo(0,AV_S.sy);}catch(e){}
    try{_avTabStack.pop();_avTabStack.pop();}catch(e){}
    if(ind)requestAnimationFrame(()=>requestAnimationFrame(()=>{ind.style.transition='';}));
  }
  try{AV_S.vt.skipTransition();}catch(e){}
}
document.addEventListener('touchstart',e=>{if(e.touches.length!==1||avSwStyle()==='off'){AV_G.cand=false;return;}
  if(AV_S.on){const c=AV_S.intent!=null?AV_S.intent:AV_S.p>=0.5;avScrubSet(c?1:0);avScrubFinish(c);}      // gesto novo a meio: termina o anterior já
  else if(AV_G.busy&&AV_G.vt){try{AV_G.vt.skipTransition();}catch(err){}AV_G.busy=false;}
  const t=e.touches[0];AV_G.cand=!avSwBlocked(e.target);AV_G.lock=null;AV_G.mode=null;AV_G.sx=t.clientX;AV_G.sy=t.clientY;AV_G.t0=performance.now();AV_G.dx=0;AV_G.p=0;AV_G.fx=t.clientX;AV_G.fy=t.clientY;
},{passive:true});
document.addEventListener('touchmove',e=>{
  if(!AV_G.cand)return;const t=e.touches[0],dx=t.clientX-AV_G.sx,dy=t.clientY-AV_G.sy;
  if(AV_G.lock===null){if(Math.abs(dx)<16&&Math.abs(dy)<16)return;AV_G.lock=Math.abs(dx)>Math.abs(dy)*2;if(!AV_G.lock){AV_G.cand=false;return;}
    const dir=dx<0?1:-1;
    if(avScrubStart(dir)){AV_G.mode='scrub';AV_G.dir=dir;}
    else{AV_G.mode='peek';avBgHold(true);AV_G.el=document.getElementById('tab-'+avCurTab);const sbx=document.getElementById('subtabs');AV_G.els=[AV_G.el,sbx&&getComputedStyle(sbx).display!=='none'?sbx:null].filter(Boolean);AV_G.els.forEach(x=>x.style.willChange='transform');}
  }
  AV_G.dx=dx;AV_G.fx=t.clientX;AV_G.fy=t.clientY;
  if(AV_G.mode==='scrub'){AV_G.p=Math.max(0,Math.min(1,(AV_G.dir>0?-dx:dx)/(innerWidth*AV_SCR_W)));if(!AV_G.raf)AV_G.raf=requestAnimationFrame(()=>{AV_G.raf=0;if(AV_S.on&&AV_S.intent==null)avScrubSet(AV_G.p);});}
  else if(!AV_G.raf)AV_G.raf=requestAnimationFrame(avGestPeek);
},{passive:true});
document.addEventListener('touchend',()=>{
  if(!AV_G.cand)return;AV_G.cand=false;if(!AV_G.lock)return;
  AV_G.lastSwipe=Date.now();cancelAnimationFrame(AV_G.raf);AV_G.raf=0;
  const w=innerWidth,dx=AV_G.dx,dt=performance.now()-AV_G.t0,v=Math.abs(dx)/Math.max(1,dt);
  if(AV_G.mode==='scrub'){const ps=(AV_G.dir>0?-dx:dx)/w;avScrubSet(Math.max(0,Math.min(1,ps/AV_SCR_W)));avScrubRelease(ps>0.3||(v>0.6&&ps>0.12));}
  else{const p=Math.abs(dx)/w;if(p>0.3||(v>0.6&&p>0.12))avGestGo(dx<0?1:-1);else avGestReset(true);}
},{passive:true});
document.addEventListener('touchcancel',()=>{if(!AV_G.cand)return;AV_G.cand=false;if(AV_G.mode==='scrub')avScrubRelease(false);else avGestReset(true);},{passive:true});


/* ══ v9.85 — ENVIOS PARA O DRIVE EM FILA (um de cada vez) · SEMPRE A VERSÃO MAIS RECENTE ══
   Dois envios ao mesmo tempo (ex.: ao sair da app) podiam fazer uma versão antiga chegar por último ao Drive e
   à cópia local (que, nos browsers sem acesso a ficheiros, é o próprio cofre). */
let _avDQ=Promise.resolve();
(function(){
  if(typeof driveSafeUpload!=='function')return;const inner=driveSafeUpload;
  driveSafeUpload=function(json,interactive){
    const run=async()=>{let j=json;
      try{const l=await localVaultGet();if(l&&l.json&&l.json!==j){if(!l.pending&&typeof l.at==='number')return null;/* já enviada uma mais recente */ j=l.json;}}catch(e){}
      return inner(j,interactive);};
    const p=_avDQ.then(run,run);_avDQ=p.catch(()=>{});return p;
  };
})();
/* limpa o animation:none deixado por um gesto cancelado, para a animação de entrada normal das abas funcionar */
(function(){if(typeof switchTab!=='function')return;const st=switchTab;switchTab=function(){try{if(!(typeof AV_SW!=='undefined'&&AV_SW.on))document.querySelectorAll('.av-sw-still').forEach(el=>el.classList.remove('av-sw-still'));document.querySelectorAll('[id^="tab-"]').forEach(el=>{if(el.style.animationName==='none'&&!(typeof AV_SW!=='undefined'&&AV_SW.on))el.style.animation='';});}catch(e){}return st.apply(this,arguments);};})();


/* ══ v9.89 — abas: só redesenhar se algo mudou (dados, idioma, pasta, filtros, modo privado) ══ */
let avDataVer=0;const AV_ONCE={};
function avTabKey(k){const el=document.getElementById('tab-'+k);let ui='';if(el)el.querySelectorAll('input,select').forEach(i=>{if(i.type!=='file'&&i.type!=='password')ui+=(i.id||i.name||'')+'='+(i.type==='checkbox'?i.checked:i.value)+';';});
  return avDataVer+'|'+currentLang+'|'+(typeof currentFolderId!=='undefined'?currentFolderId:'')+'|'+(typeof currentVaultFolderId!=='undefined'?currentVaultFolderId:'')+'|'+(typeof privacyOn!=='undefined'?privacyOn:'')+'|'+avMode()+'|'+JSON.stringify(avHiddenTabs())+'|'+ui+'|'+(k==='dashboard'?new Date().toDateString()+' '+new Date().getHours():'');}
function avOnce(k,fn,arg){const key=avTabKey(k);if(AV_ONCE[k]===key)return;AV_ONCE[k]=key;fn(arg);}
(function(){if(typeof markUnsaved==='function'){const mu=markUnsaved;markUnsaved=function(){avDataVer++;return mu.apply(this,arguments);};}
  if(typeof renderAll==='function'){const ra=renderAll;renderAll=function(){avDataVer++;const r=ra.apply(this,arguments);try{['dashboard','archive','notes','cards','docs','trash'].forEach(t=>{AV_ONCE[t]=avTabKey(t);});}catch(e){}  /* só as que o renderAll desenha de facto */return r;};}})();


/* ══ v9.92 — AVISO DE NOVA VERSÃO ══
   Pergunta ao servidor só se o ficheiro da app mudou (pedido HEAD, minúsculo — o sw.js deixa-o passar direto).
   Só quando muda descarrega a página uma vez, para ler o número da versão. Compara com a versão que está a correr. */
const AV_UPD={last:0,snooze:0,ver:null,busy:false};
function avVerCmp(a,b){const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1;}return 0;}
async function avUpdSig(){try{const r=await fetch('./index.html',{method:'HEAD',cache:'no-store'});if(!r.ok)return null;return (r.headers.get('ETag')||'')+'|'+(r.headers.get('Last-Modified')||'')+'|'+(r.headers.get('Content-Length')||'');}catch(e){return null;}}
async function avUpdCheck(force){
  if(AV_UPD.busy||!navigator.onLine||location.protocol==='file:')return;
  if(!force&&Date.now()-AV_UPD.last<30*60e3)return;
  AV_UPD.busy=true;AV_UPD.last=Date.now();
  try{
    const sig=await avUpdSig();if(!sig)return;
    let st=null;try{st=JSON.parse(localStorage.getItem('av_upd')||'null');}catch(e){}
    if(!st||st.sig!==sig){
      const txt=await (await fetch('./index.html',{cache:'no-store'})).text();
      const m=txt.match(/name="app-version" content="([\d.]+)"/)||txt.match(/const APP_VERSION='([\d.]+)'/);st={sig,ver:m?m[1]:null};
      try{localStorage.setItem('av_upd',JSON.stringify(st));}catch(e){}
    }
    AV_UPD.ver=(st.ver&&avVerCmp(st.ver,APP_VERSION)>0)?st.ver:null;
    if(AV_UPD.ver&&Date.now()>AV_UPD.snooze&&typeof masterKey!=='undefined'&&masterKey)avUpdShowWhenFree(0);
  }catch(e){}finally{AV_UPD.busy=false;}
}
function avUpdShow(){const en=avEn(),v=AV_UPD.ver;if(!v)return;
  avNudge(en?'There’s a <b>new version</b> of the app: <b>v'+v+'</b> (you have v'+APP_VERSION+').':'Há uma <b>versão nova</b> da app: <b>v'+v+'</b> (tens a v'+APP_VERSION+').',
    [{label:en?'Update':'Atualizar',fn:avUpdApply},{label:en?'Later':'Mais tarde',fn:()=>{AV_UPD.snooze=Date.now()+6*3600e3;}}],60000);
  const n=document.getElementById('av-nudge');if(n)n.dataset.kind='upd';}
function avUpdShowWhenFree(tries){  // não atropela outro aviso (ex.: resumo da semana): espera que feche
  const n=document.getElementById('av-nudge');
  if(n&&n.classList.contains('show')&&n.dataset.kind!=='upd'&&tries<30){setTimeout(()=>avUpdShowWhenFree(tries+1),2000);return;}
  if(typeof AVT!=='undefined'&&AVT.on){setTimeout(()=>avUpdShowWhenFree(tries+1),4000);return;}
  if(!(typeof masterKey!=='undefined'&&masterKey))return;avUpdShow();}
async function avUpdApply(){
  toast(avEn()?'Updating…':'A atualizar…');
  try{if(hasUnsaved)await Promise.race([saveFile({auto:true}),new Promise(r=>setTimeout(r,4000))]);}catch(e){}   // grava primeiro
  try{avFlushNow();}catch(e){}
  try{sessionStorage.setItem('av_upd_to',AV_UPD.ver);}catch(e){}
  setTimeout(()=>location.reload(),350);
}
function avUpdAfter(){  // depois de recarregar: confirma se a versão nova chegou mesmo
  let to=null;try{to=sessionStorage.getItem('av_upd_to');sessionStorage.removeItem('av_upd_to');}catch(e){}
  if(!to)return;const en=avEn();
  if(avVerCmp(APP_VERSION,to)>=0)toast(en?'✓ Updated to v'+APP_VERSION:'✓ Atualizada para a v'+APP_VERSION);
  else toast(en?'The new version hasn’t reached the server yet — try again in a few minutes.':'A versão nova ainda não chegou ao servidor — tenta daqui a uns minutos.');
}
(function(){
  if(typeof doUnlock==='function'){const du=doUnlock;doUnlock=function(){const r=du.apply(this,arguments);AV_UPD.snooze=0;setTimeout(avUpdAfter,1200);setTimeout(()=>avUpdCheck(true),6000);return r;};}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&typeof masterKey!=='undefined'&&masterKey)avUpdCheck(false);});
  window.addEventListener('online',()=>{if(typeof masterKey!=='undefined'&&masterKey)avUpdCheck(false);});
})();


/* v9.92 — a escolha do modo de entrada vale só para este ecrã de entrada */
(function(){
  if(typeof doUnlock==='function'){const du=doUnlock;doUnlock=function(){_avUserMode=null;return du.apply(this,arguments);};}
  if(typeof lockApp==='function'){const la=lockApp;lockApp=function(){_avUserMode=null;return la.apply(this,arguments);};}
})();


/* ══ v9.93 — durante uma transição, os elementos que ficam parados (botões flutuantes) não mudam de visibilidade:
   o browser cancelava a transição se um deles desaparecesse a meio (ex.: botão da Aurora ao chegar ao Dashboard) ══ */
(function(){if(typeof aurFab!=='function')return;const raw=aurFab;window.__aurFabRaw=function(){return raw.apply(this,arguments);};
  aurFab=function(){if(document.documentElement.classList.contains('av-vt'))return;return raw.apply(this,arguments);};})();


/* ══ v9.94 — LIGAR A GOOGLE DRIVE NUM TOQUE (credencial do Aurora Vault) · GUIA PARA CREDENCIAL PRÓPRIA ══
   A credencial (Client ID) não é secreta: identifica a app junto da Google. Cada pessoa entra com a SUA conta e o cofre
   (encriptado) vai para a SUA Drive; o acesso é só ao ficheiro que a app cria (drive.file). Só funciona neste endereço. */
const AV_BUILTIN_CID='303044981135-58639c5nk2rrpv1njjoq4o5ht4vojde4.apps.googleusercontent.com';
const AV_BUILTIN_ORIGIN='https://ciphervault-pt.github.io';
function avBuiltinOk(){return location.origin===AV_BUILTIN_ORIGIN;}
function avDriveQuickRender(){
  const box=document.getElementById('drive-quick');if(!box)return;
  const en=avEn(),cid=(dCfg('cid')||'').trim(),fid=dCfg('fid'),official=avBuiltinOk(),tail=s=>'…'+s.replace('.apps.googleusercontent.com','').slice(-6);
  let o='';
  if(official&&!fid&&(!cid||cid===AV_BUILTIN_CID)){
    o+='<div class="dq-box"><b class="t">'+(en?'No Google Drive copy yet':'Ainda sem cópia na Google Drive')+'</b>'
      +'<p>'+(en?'One tap: sign in with <b>your</b> Google account and the vault (already encrypted) gets a copy in <b>your</b> Drive. Nobody else can access it.':'Um toque: entras com a <b>tua</b> conta Google e o cofre (já encriptado) passa a ter cópia na <b>tua</b> Drive. Mais ninguém lhe tem acesso.')+'</p>'
      +'<button class="dq-go" id="dq-go" data-act="avDriveQuick">☁️ '+(en?'Connect my Google Drive':'Ligar a minha Google Drive')+'</button>'
      +'<div class="dq-hint">'+(en?'Already have this vault in Drive on another device? Use «Use an existing Drive file» below instead.':'Já tens este cofre na Drive noutro dispositivo? Usa antes «Usar um ficheiro já existente na Drive», mais abaixo.')+'</div></div>';
  }
  if(official&&cid){
    if(cid===AV_BUILTIN_CID)o+='<div class="dq-ok">✓ '+(en?'Your credential matches the one the app offers to new users on this address.':'A tua credencial é a mesma que a app oferece a quem liga a Drive neste endereço.')+'</div>';
    else o+='<div class="dq-warn">⚠ '+(en?'The credential the app offers to new users (ends in '+tail(AV_BUILTIN_CID)+') differs from yours (ends in '+tail(cid)+'). If yours is the right one, send it to Claude as text.':'A credencial que a app oferece a quem liga a Drive pela primeira vez (termina em '+tail(AV_BUILTIN_CID)+') é diferente da tua (termina em '+tail(cid)+'). Se a tua é a correta, envia-a ao Claude em texto.')+'</div>';
  }
  const org=esc(location.origin);
  o+='<details class="dq-guide"'+(official?'':' open')+'><summary>'+(en?'Use my own credential (advanced)':'Usar uma credencial própria (avançado)')+'</summary><ol>'
    +(en?'<li>Create a project in Google Cloud and enable the <b>Google Drive API</b>.</li><li>In <b>OAuth consent screen</b>: type External, fill in the name and email, then <b>Publish app</b> (otherwise access expires every 7 days).</li><li>In <b>Credentials → Create credentials → OAuth client ID</b>: type <b>Web application</b>.</li><li>Under <b>Authorized JavaScript origins</b>, add: <code>'+org+'</code></li><li>Copy the <b>Client ID</b>, paste it in the field below → Save credential.</li>'
        :'<li>Cria um projeto na Google Cloud e ativa a <b>Google Drive API</b>.</li><li>Em <b>Ecrã de consentimento OAuth</b>: tipo Externo, preenche o nome e o email, e depois <b>Publicar app</b> (senão o acesso expira de 7 em 7 dias).</li><li>Em <b>Credenciais → Criar credenciais → ID de cliente OAuth</b>: tipo <b>Aplicação Web</b>.</li><li>Em <b>Origens JavaScript autorizadas</b>, junta: <code>'+org+'</code></li><li>Copia o <b>ID de cliente</b> e cola-o no campo abaixo → Guardar credencial.</li>')
    +'</ol><button class="dq-open" data-act="avDriveConsole">'+(en?'Open Google Cloud Console ↗':'Abrir a Google Cloud Console ↗')+'</button></details>';
  box.innerHTML=o;
  const st=document.getElementById('drive-state');
  if(st&&!cid&&official)st.textContent=en?'Not configured — tap «Connect my Google Drive».':'Por configurar — toca em «Ligar a minha Google Drive».';
}
async function avDriveQuick(){
  const inp=document.getElementById('drive-cid');if(inp)inp.value=AV_BUILTIN_CID;
  saveDriveCid();                 // o mesmo que colar a credencial e carregar em «Guardar credencial»…
  await driveFirstUpload();       // …e depois em «Enviar o cofre atual para o Drive» (pede confirmação e trata do envio)
  try{renderDriveSettings();}catch(e){}
}
function avDriveConsole(){window.open('https://console.cloud.google.com/apis/credentials','_blank','noopener');}
(function(){if(typeof renderDriveSettings!=='function')return;const r=renderDriveSettings;renderDriveSettings=function(){const x=r.apply(this,arguments);try{avDriveQuickRender();}catch(e){}return x;};})();

/* ══ v9.95 — LEITOR DE QR HÍBRIDO: o do browser quando existe; a jsQR (incluída, funciona sem internet) nos outros (Chrome no Windows, iPhone…) ══ */
function avQrCanvasDetect(src){
  if(typeof jsQR!=='function')return [];
  const w0=src.videoWidth||src.width||0,h0=src.videoHeight||src.height||0;if(!w0||!h0)return [];
  const sc=Math.min(1,1000/Math.max(w0,h0)),w=Math.round(w0*sc),hh=Math.round(h0*sc);
  const c=avQrCanvasDetect._c||(avQrCanvasDetect._c=document.createElement('canvas'));c.width=w;c.height=hh;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0,w,hh);
  const r=jsQR(ctx.getImageData(0,0,w,hh).data,w,hh,{inversionAttempts:'attemptBoth'});
  return r&&r.data?[{rawValue:r.data}]:[];
}
// A biblioteca jsQR (130 KB) só é carregada quando o browser não tem leitor de QR próprio e é mesmo precisa
let _avJsQRP=null;
function avLoadJsQR(){
  if(typeof jsQR==='function')return Promise.resolve();
  if(_avJsQRP)return _avJsQRP;
  _avJsQRP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='vendor/jsqr.js?v=1.4.0';s.async=true;
    s.onload=()=>res();s.onerror=()=>{_avJsQRP=null;s.remove();rej(new Error('jsqr'));};document.head.appendChild(s);});
  return _avJsQRP;
}
function avMakeQrDetector(){
  let nat=null,n=0;try{if('BarcodeDetector' in window)nat=new BarcodeDetector({formats:['qr_code']});}catch(e){nat=null;}
  if(!nat)avLoadJsQR().catch(()=>{});
  return {async detect(src){
    if(nat){try{const r=await nat.detect(src);if(r&&r.length)return r;if(++n%3)return [];}catch(e){nat=null;}}
    try{await avLoadJsQR();}catch(e){return [];}
    return avQrCanvasDetect(src);
  }};
}
/* ══ v9.95 — IMPORTAR DO GOOGLE AUTHENTICATOR (QR «Transferir contas» → otpauth-migration) ══ */
const AV_GA={id:null,size:1,got:new Set(),accs:[]};
function avB32enc(bytes){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits=0,val=0,out='';for(const b of bytes){val=(val<<8)|b;bits+=8;while(bits>=5){out+=A[(val>>>(bits-5))&31];bits-=5;}val&=(1<<bits)-1;}if(bits>0)out+=A[(val<<(5-bits))&31];return out;}
function avPbRead(buf){let i=0;const out=[];const vi=()=>{let x=0,m=1,b;do{b=buf[i++];x+=(b&127)*m;m*=128;}while(b&128&&i<buf.length);return x;};
  while(i<buf.length){const key=vi(),f=Math.floor(key/8),t=key%8;
    if(t===0)out.push({f,v:vi()});else if(t===2){const len=vi();out.push({f,b:buf.subarray(i,i+len)});i+=len;}else if(t===1)i+=8;else if(t===5)i+=4;else break;}
  return out;}
function avGaParse(raw){
  const m=/^otpauth-migration:\/\/offline\?(?:.*&)?data=([^&]+)/i.exec(String(raw||'').trim());if(!m)return null;
  try{let b64=decodeURIComponent(m[1]).replace(/ /g,'+').replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
    const bin=atob(b64),buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);
    const td=new TextDecoder(),r={accs:[],size:1,index:0,id:0};
    for(const t of avPbRead(buf)){
      if(t.f===1&&t.b){const a={secret:'',name:'',issuer:'',algorithm:'SHA1',digits:6,type:'totp',counter:0};
        for(const q of avPbRead(t.b)){if(q.f===1&&q.b)a.secret=avB32enc(q.b);else if(q.f===2&&q.b)a.name=td.decode(q.b);else if(q.f===3&&q.b)a.issuer=td.decode(q.b);
          else if(q.f===4)a.algorithm=({1:'SHA1',2:'SHA256',3:'SHA512',4:'MD5'})[q.v]||'SHA1';else if(q.f===5)a.digits=q.v===2?8:6;else if(q.f===6)a.type=q.v===1?'hotp':'totp';else if(q.f===7)a.counter=q.v;}
        if(a.secret)r.accs.push(a);}
      else if(t.f===3)r.size=t.v||1;else if(t.f===4)r.index=t.v||0;else if(t.f===5)r.id=t.v||0;}
    return r.accs.length?r:null;
  }catch(e){return null;}
}
function avGaNorm(s){return String(s||'').toUpperCase().replace(/[\s=\-]/g,'');}
function avGaSplit(a){let svc=a.issuer||'',acc=a.name||'';if(acc.includes(':')){const p=acc.split(':');if(!svc)svc=p[0].trim();acc=p.slice(1).join(':').trim();}if(!svc){svc=acc||'Conta';acc='';}return {svc,acc};}
function avGaAdd(r){
  if(AV_GA.id!==r.id){AV_GA.id=r.id;AV_GA.size=r.size;AV_GA.got=new Set();AV_GA.accs=[];}
  AV_GA.got.add(r.index);const have=new Set(AV_GA.accs.map(a=>avGaNorm(a.secret)));
  r.accs.forEach(a=>{if(!have.has(avGaNorm(a.secret))){have.add(avGaNorm(a.secret));AV_GA.accs.push(a);}});
}
function avGaHandleRaw(raw){const r=avGaParse(raw);if(!r)return false;avGaAdd(r);avGaResults();return true;}
function avGaOv(){let o=document.getElementById('av-ga');if(!o){o=document.createElement('div');o.id='av-ga';o.onclick=e=>{if(e.target===o)avGaClose();};document.body.appendChild(o);}return o;}
function avGaClose(){const o=document.getElementById('av-ga');if(o){o.classList.remove('open');o.innerHTML='';}}
function avGaOpen(){
  const en=avEn();
  if(typeof totpRecWrap!=='undefined'&&totpRecWrap&&!totpUnlocked){toast(en?'Unlock the 2FA tab first.':'Desbloqueia primeiro a aba 2FA.');try{switchTab('totp');}catch(e){}return;}
  const o=avGaOv();
  o.innerHTML='<div class="av-ga-box"><button class="av-ga-x" data-act="avGaClose" aria-label="'+(en?'Close':'Fechar')+'">✕</button><h4>📲 '+(en?'Import from Google Authenticator':'Importar do Google Authenticator')+'</h4>'
   +'<div class="av-ga-sub">'+(en?'Brings all your 2FA codes at once. They keep working in Google Authenticator too.':'Traz todos os teus códigos 2FA de uma vez. Continuam a funcionar também no Google Authenticator.')+'</div>'
   +'<ol>'+(en?'<li>In <b>Google Authenticator</b>: menu <b>☰ → Transfer accounts → Export accounts</b>.</li><li>Pick the accounts → <b>Next</b>. A QR code appears (with many accounts, several).</li><li>Read each QR here.</li>':'<li>No <b>Google Authenticator</b>: menu <b>☰ → Transferir contas → Exportar contas</b>.</li><li>Escolhe as contas → <b>Seguinte</b>. Aparece um QR (com muitas contas, aparecem vários).</li><li>Lê cada QR aqui.</li>')+'</ol>'
   +'<div class="av-ga-warn">⚠ '+(en?'Is Authenticator on <b>this</b> phone? You can’t scan your own screen: open Aurora Vault on your <b>PC or another device</b> to read the QR.':'O Authenticator está <b>neste</b> telemóvel? Não consegues ler o teu próprio ecrã: abre o Aurora Vault no <b>PC ou noutro aparelho</b> para ler o QR.')+'</div>'
   +'<div class="av-ga-warn">🔐 '+(en?'<b>A photo of this QR holds ALL your 2FA codes.</b> Never send it by WhatsApp or email — move it by cable or directly between your devices, and <b>delete the photo</b> right after importing.':'<b>Uma foto deste QR contém TODOS os teus códigos 2FA.</b> Nunca a envies por WhatsApp nem por email — passa-a por cabo ou diretamente entre os teus aparelhos, e <b>apaga a foto</b> logo a seguir a importar.')+'</div>'
   +'<button class="av-ga-go" data-act="avGaScan">📷 '+(en?'Scan QR with the camera':'Ler QR com a câmara')+'</button>'
   +'<button class="av-ga-alt" data-click="av-ga-file">🖼️ '+(en?'Load a photo of the QR':'Carregar foto do QR')+'</button></div>';
  o.classList.add('open');
}
async function avGaFile(ev){
  const f=ev.target.files&&ev.target.files[0];ev.target.value='';if(!f)return;const en=avEn();
  try{const bmp=await createImageBitmap(f);const r=await avMakeQrDetector().detect(bmp);
    if(!r.length){toast(en?'No QR code found in that photo.':'Não encontrei nenhum QR nessa foto.');return;}
    if(!avGaHandleRaw(r[0].rawValue))toast(en?'That QR is not a Google Authenticator export.':'Esse QR não é uma exportação do Google Authenticator.');
  }catch(e){toast(en?'Could not read the photo.':'Não foi possível ler a foto.');}
}
function avGaResults(){
  const en=avEn(),o=avGaOv(),have=new Set((totp||[]).map(x=>avGaNorm(x.secret)));
  const cols=['#4a7bd8','#b3124d','#0a66c2','#2e9e47','#e2231a','#7b4ae2','#e07b1a','#127b7b'];
  const rows=AV_GA.accs.map((a,i)=>{const {svc,acc}=avGaSplit(a),dup=have.has(avGaNorm(a.secret)),bad=!otpAlgo(a.algorithm);
    const ini=svc.replace(/[^A-Za-zÀ-ÿ0-9 ]/g,'').split(/\s+/).filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
    const col=cols[[...svc].reduce((s,c)=>s+c.charCodeAt(0),0)%cols.length];
    return '<label class="av-ga-row'+(dup||bad?' off':'')+'"><input type="checkbox" data-i="'+i+'"'+(dup||bad?' disabled':' checked')+' data-change="avGaCount"><span class="av-ga-ini" style="background:'+col+'">'+esc(ini)+'</span><span class="av-ga-tx"><b>'+esc(svc)+'</b><i>'+esc(acc||'—')+'</i></span>'
      +(dup?'<span class="av-ga-tag">'+(en?'already there':'já existe')+'</span>':bad?'<span class="av-ga-tag">'+(en?'not supported':'não suportado')+'</span>':'')+'</label>';}).join('');
  const more=AV_GA.got.size<AV_GA.size;
  o.innerHTML='<div class="av-ga-box"><button class="av-ga-x" data-act="avGaClose" aria-label="'+(en?'Close':'Fechar')+'">✕</button><h4>'+(en?'Found '+AV_GA.accs.length+' account'+(AV_GA.accs.length===1?'':'s'):'Encontrei '+AV_GA.accs.length+' conta'+(AV_GA.accs.length===1?'':'s'))+'</h4>'
   +'<div class="av-ga-ok">✓ '+(AV_GA.size>1?(en?'QR '+AV_GA.got.size+' of '+AV_GA.size+' read':'QR '+AV_GA.got.size+' de '+AV_GA.size+' lido'+(AV_GA.got.size>1?'s':''))+(more?(en?' — read the next one to bring the rest':' — lê o próximo para trazer o resto'):''):(en?'QR read':'QR lido'))+'</div>'
   +rows+'<div class="av-ga-sub" style="margin-top:10px">'+(en?'Accounts you already have stay out, so nothing is duplicated.':'As que já tens no cofre ficam de fora, para não duplicar.')+'</div>'
   +(more?'<button class="av-ga-alt" data-act="avGaScan">📷 '+(en?'Read the next QR':'Ler o próximo QR')+'</button>':'')
   +'<button class="av-ga-go" id="av-ga-imp" data-act="avGaImport"></button></div>';
  o.classList.add('open');avGaCount();
}
function avGaCount(){const b=document.getElementById('av-ga-imp');if(!b)return;const n=[...document.querySelectorAll('#av-ga input[type=checkbox]:checked')].length,en=avEn();
  b.disabled=!n;b.textContent=n?(en?'Import '+n+' account'+(n===1?'':'s'):'Importar '+n+' conta'+(n===1?'':'s')):(en?'Nothing to import':'Nada para importar');}
function avGaImport(){
  const en=avEn(),sel=[...document.querySelectorAll('#av-ga input[type=checkbox]:checked')].map(x=>AV_GA.accs[+x.dataset.i]).filter(Boolean);if(!sel.length)return;
  const have=new Set((totp||[]).map(x=>avGaNorm(x.secret)));let n=0;
  sel.forEach((a,k)=>{const s=avGaNorm(a.secret);if(have.has(s)||!otpAlgo(a.algorithm))return;have.add(s);const {svc,acc}=avGaSplit(a);
    totp.push({id:(Date.now()+k).toString(36)+Math.random().toString(36).slice(2,5),name:svc,account:acc,secret:s,type:a.type,algorithm:a.algorithm,digits:a.digits,period:30,counter:a.type==='hotp'?a.counter:null,recovery:'',createdAt:Date.now()});n++;});
  if(n){try{logActivity('add',(en?n+' 2FA codes (Google Authenticator)':n+' códigos 2FA (Google Authenticator)'),'🔢');}catch(e){}markUnsaved();try{renderTotp();}catch(e){}}
  AV_GA.id=null;AV_GA.accs=[];AV_GA.got=new Set();avGaClose();
  toast(n?(en?'✓ '+n+' account'+(n===1?'':'s')+' imported':'✓ '+n+' conta'+(n===1?'':'s')+' importada'+(n===1?'':'s')):(en?'Nothing new to import.':'Nada de novo para importar.'));
}
(function(){
  if(typeof handleScannedQr==='function'){const h0=handleScannedQr;handleScannedQr=function(raw){
    if(qrScanMode!=='gauth')return h0.apply(this,arguments);
    const r=avGaParse(raw||'');
    if(!r){const st=document.getElementById('qrscan-status');if(st)st.textContent=avEn()?'That QR is not a Google Authenticator export. Keep trying or cancel.':'Esse QR não é uma exportação do Google Authenticator. Tenta outro ou cancela.';return false;}
    closeQrScanner();avGaAdd(r);avGaResults();return true;};}
  if(typeof renderTotp==='function'){const rt=renderTotp;renderTotp=function(){const x=rt.apply(this,arguments);try{const en=avEn(),b=document.getElementById('totp-ga-btn'),locked=typeof totpRecWrap!=='undefined'&&totpRecWrap&&!totpUnlocked;
    if(b)b.style.display=(locked||presentationMode)?'none':'';const t1=document.getElementById('totp-ga-txt');if(t1)t1.textContent=en?'Import from Google':'Importar do Google';
    const t2=document.getElementById('tf-ga-txt');if(t2)t2.textContent=en?'Import everything from Google Authenticator':'Importar tudo do Google Authenticator';}catch(e){}return x;};}
})();

/* ══ v9.95 — CARTÕES DE LOJA TIPO CARTEIRA ══ */
const AV_WAL={open:null,lock:null};
function avWalHex(c){if(/^#[0-9a-f]{6}$/i.test(c||''))return c;try{const a=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();if(/^#[0-9a-f]{6}$/i.test(a))return a;}catch(e){}return '#8a6e2f';}
function avWalInk(hex){const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;return 0.2126*r+0.7152*g+0.0722*b>0.62?'#111':'#fff';}
function avWalBg(sc){const c=avWalHex(sc.color);let d=c;try{d=darkenHex(c,0.72);}catch(e){}return {bg:'linear-gradient(135deg,'+c+','+d+')',ink:avWalInk(c)};}
function avWalRender(){
  const box=document.getElementById('store-content');if(!box||!storeCards.length)return;
  const en=avEn(),open=storeCards.find(s=>s.id===AV_WAL.open)||null,rest=storeCards.filter(s=>s!==open);
  let o='<div class="av-wal"><div class="av-wal-hint">'+(open?(en?'Tap the card to close it':'Toca no cartão para o fechar'):(en?'Tap a card to show its barcode':'Toca num cartão para mostrar o código de barras'))+'</div>';
  if(open){const st=avWalBg(open),num=String(open.number||''),bars=num?barcodeSVG(num):'';
    o+='<div class="av-wc open" style="background:'+st.bg+';color:'+st.ink+'" data-act="avWalClose"><div class="av-wc-top"><b>'+esc(open.name||'')+'</b><span>'+(en?'STORE CARD':'CARTÃO DE LOJA')+'</span></div>'
      +'<div class="av-wc-code" data-act="" data-stop>'+(bars?'<div class="av-wc-bars">'+bars+'</div><div class="av-wc-num">'+esc(num)+'</div>':'<div class="av-wc-none">'+(en?'No number saved':'Sem número guardado')+'</div>')+'</div>'
      +'<div class="av-wc-foot"><button data-act="showBarcode" data-arg="'+esc(open.id)+'" data-stop>⛶ '+(en?'Full screen':'Ecrã inteiro')+'</button><button data-act="avWalEdit" data-arg="'+esc(open.id)+'" data-stop>✎ '+(en?'Edit':'Editar')+'</button><button data-act="avWalDelete" data-arg="'+esc(open.id)+'" data-stop>🗑</button><span>'+(en?'Tap to close':'Toca para fechar')+'</span></div></div>';}
  o+=rest.map((sc,i)=>{const st=avWalBg(sc),num=String(sc.number||'').replace(/\s/g,'');
    return '<div class="av-wc stk" style="background:'+st.bg+';color:'+st.ink+';z-index:'+(i+1)+'" data-act="avWalOpen" data-arg="'+esc(sc.id)+'"><div class="av-wc-top"><b>'+esc(sc.name||'')+'</b><span>'+(num?'•••• '+esc(num.slice(-4)):'')+'</span></div></div>';}).join('');
  box.innerHTML=o+'</div>';
}
async function avWalOpen(id){AV_WAL.open=id;avWalRender();try{window.scrollTo({top:Math.max(0,(document.getElementById('store-content').getBoundingClientRect().top+scrollY)-120),behavior:'smooth'});}catch(e){}
  try{if('wakeLock' in navigator&&!AV_WAL.lock)AV_WAL.lock=await navigator.wakeLock.request('screen');}catch(e){AV_WAL.lock=null;}}
function avWalRelease(){try{if(AV_WAL.lock){AV_WAL.lock.release();}}catch(e){}AV_WAL.lock=null;}
function avWalClose(noRender){AV_WAL.open=null;avWalRelease();if(!noRender)avWalRender();}
(function(){
  if(typeof renderStoreCards==='function'){const r=renderStoreCards;renderStoreCards=function(){const x=r.apply(this,arguments);try{if(AV_WAL.open&&!storeCards.find(s=>s.id===AV_WAL.open))avWalClose(true);avWalRender();}catch(e){}return x;};}
  if(typeof switchTab==='function'){const s=switchTab;switchTab=function(t){if(t!=='store'&&AV_WAL.open){AV_WAL.open=null;avWalRelease();}return s.apply(this,arguments);};}
  if(typeof lockApp==='function'){const l=lockApp;lockApp=function(){AV_WAL.open=null;avWalRelease();return l.apply(this,arguments);};}
})();

/* ══ v9.95 — UM SÓ CARTÃO DE AVISOS (junta «Aurora · Avisos» e «Alertas & Relatório», por urgência, sem repetições) ══ */
let AV_AL_RUN=[],AV_AL_ALL=false;
function avRelDays(n,en){if(n===0)return en?'today':'hoje';if(n===1)return en?'tomorrow':'amanhã';if(n>1)return en?'in '+n+' days':'em '+n+' dias';const m=-n;return en?(m===1?'yesterday':m+' days ago'):(m===1?'ontem':'há '+m+' dias');}
function avDayN(d){try{return calDaysUntil(d instanceof Date?d:new Date(String(d).length<=10?d+'T00:00:00':d));}catch(e){return null;}}
function avAlertsModel(){
  const en=avEn(),out=[],names=a=>a.slice(0,3).map(e=>e.name).join(', ')+(a.length>3?' +'+(a.length-3):'');
  try{(subscriptions||[]).forEach(s=>{const d=subNextCharge(s);if(!d)return;const n=avDayN(d);if(n===null||n<0||n>14)return;
    out.push({k:'sub:'+s.id+':'+n,sev:n<=3?3:2,n,ic:'🔁',t:'<b>'+esc(s.name||'')+'</b> '+(en?'renews ':'renova ')+avRelDays(n,en)+(s.amount?' · '+fmtMoney(parseFloat(s.amount)):''),s:en?'Subscription':'Subscrição',go:()=>openSubsScreen()});});}catch(e){}
  try{(documents||[]).forEach(d=>{if(!d.expiry)return;const n=avDayN(d.expiry);if(n===null||n>30||n<-90)return;
    out.push({k:'doc:'+d.id+':'+n,sev:n<0||n<=7?3:2,n,ic:'📄',t:'<b>'+esc(d.title||'')+'</b> '+(n<0?(en?'expired ':'expirou ')+avRelDays(n,en):(en?'expires ':'expira ')+avRelDays(n,en)),s:en?'Document':'Documento',go:()=>switchGroup('docs')});});}catch(e){}
  try{(bankCards||[]).forEach(c=>{if(c.archived||!c.expiry||c.expiry.length<5)return;const [mm,yy]=c.expiry.split('/');if(!mm||!yy)return;const n=avDayN(new Date(2000+parseInt(yy,10),parseInt(mm,10),0));if(n===null||n>60||n<-90)return;
    out.push({k:'card:'+c.id+':'+n,sev:n<0||n<=14?3:2,n,ic:'💳',t:'<b>'+esc(c.bank||'')+'</b> '+(n<0?(en?'card expired':'cartão expirou'):(en?'card expires ':'cartão expira ')+avRelDays(n,en)),s:en?'Bank card':'Cartão bancário',go:()=>switchTab('cards')});});}catch(e){}
  try{(assets||[]).forEach(as=>{const ic={warranty:'🧾',license:'🔑',vehicle:'🚗',dates:'📅'}[as.kind]||'📌';assetDates(as).forEach(ev=>{const n=avDayN(ev.date);if(n===null||n>30||n<-90)return;
    out.push({k:'as:'+as.id+':'+(ev.sub||'')+':'+n,sev:n<0||n<=7?3:2,n,ic,t:'<b>'+esc(as.name||'')+(ev.sub?' ('+esc(ev.sub)+')':'')+'</b> '+(n<0?(en?'expired ':'expirou ')+avRelDays(n,en):avRelDays(n,en)),s:{warranty:en?'Warranty':'Garantia',license:en?'License':'Licença',vehicle:en?'Vehicle':'Veículo',dates:en?'Date':'Data'}[as.kind]||'',go:()=>switchTab(as.kind||'warranty')});});});}catch(e){}
  try{const A=vault.filter(e=>!e.archived&&e.pw),weak=A.filter(e=>getPwScore(e.pw)<2),common=A.filter(e=>isCommonPassword(e.pw)),map={};A.forEach(e=>{map[e.pw]=(map[e.pw]||0)+1;});const dups=A.filter(e=>map[e.pw]>1);
    const all=new Map();[...weak,...common,...dups].forEach(e=>all.set(e.id,e));
    if(all.size){const chips=[];if(weak.length)chips.push(weak.length+(en?' weak':(weak.length===1?' fraca':' fracas')));if(common.length)chips.push(common.length+(en?' very common':(common.length===1?' muito comum':' muito comuns')));if(dups.length)chips.push(dups.length+(en?' reused':(dups.length===1?' repetida':' repetidas')));
      out.push({k:'rev:'+all.size,sev:2,n:99,ic:'🛡️',t:'<b>'+all.size+'</b> '+(en?(all.size===1?'password to review':'passwords to review'):(all.size===1?'password a rever':'passwords a rever')),s:names([...all.values()]),chips,go:()=>avCleanupStart()});}
    const old=A.filter(e=>e.pwUpdated&&Date.now()-e.pwUpdated>365*864e5);
    if(old.length)out.push({k:'old:'+old.length,sev:1,n:99,ic:'⏳',t:'<b>'+old.length+'</b> '+(en?(old.length===1?'password over 1 year old':'passwords over 1 year old'):(old.length===1?'password com mais de 1 ano':'passwords com mais de 1 ano')),s:names(old),go:()=>openHealthCheck()});}catch(e){}
  try{const de=findDuplicateEntries();if(de.length)out.push({k:'dupe:'+de.length,sev:1,n:99,ic:'👥',t:'<b>'+de.length+'</b> '+(en?(de.length===1?'duplicated entry':'duplicated entries'):(de.length===1?'entrada duplicada':'entradas duplicadas')),s:de.map(g=>g.name).slice(0,3).join(', '),go:()=>openDedupeModal()});}catch(e){}
  const off=aurAlertsDismissed(),day=new Date().toISOString().slice(0,10);
  out.forEach(a=>{a.k=a.k.replace(/['"\\<>]/g,'');});
  return out.filter(a=>off[a.k]!==day).sort((a,b)=>b.sev-a.sev||a.n-b.n);
}
function avAlGo(i){const a=AV_AL_RUN[i];if(a&&a.go)try{a.go();}catch(e){}}
function avAlX(i,ev){if(ev)ev.stopPropagation();const a=AV_AL_RUN[i];if(!a)return;try{aurAlertDismiss(a.k);}catch(e){}aurAlertsRender();}
aurAlertsRender=function(){
  if(typeof document==='undefined')return;
  const launch=document.querySelector('.aur-launch');let box=document.getElementById('aur-alerts');
  if(!launch||typeof masterKey==='undefined'||!masterKey){if(box)box.remove();return;}
  const list=avAlertsModel();AV_AL_RUN=list;
  if(!box){box=document.createElement('div');box.id='aur-alerts';}
  box.className='aur-alerts avw';
  const side=document.getElementById('av-side');
  if(side&&side.previousElementSibling===launch){if(box.parentElement!==side)side.insertBefore(box,side.firstChild);}
  else if(box.previousElementSibling!==launch)launch.insertAdjacentElement('afterend',box);
  const en=avEn(),shown=AV_AL_ALL?list:list.slice(0,4);
  box.innerHTML='<div class="avw-h"><span>✨ '+(en?'Heads-up':'Avisos')+'</span>'+(list.length?'<b>'+list.length+'</b>':'')+'</div>'
   +(list.length?shown.map((a,i)=>'<div class="avw-row s'+a.sev+'" tabindex="0" data-act="avAlGo" data-enter="avAlGo" data-args="['+(i)+']"><span class="avw-ic">'+a.ic+'</span><span class="avw-tx"><b>'+a.t+'</b>'+(a.s?'<i>'+esc(a.s)+'</i>':'')+(a.chips&&a.chips.length?'<span class="avw-chips">'+a.chips.map(c=>'<span>'+esc(c)+'</span>').join('')+'</span>':'')+'</span><button class="avw-x" data-act="avAlX" data-args="['+i+']" data-ev-last aria-label="'+(en?'Dismiss':'Dispensar')+'">✕</button></div>').join('')
     +(list.length>4?'<button class="avw-more" data-act="avAlToggleAll">'+(AV_AL_ALL?(en?'Show less ▴':'Mostrar menos ▴'):(en?'See all ('+list.length+') ▾':'Ver todos ('+list.length+') ▾'))+'</button>':'')
    :'<div class="avw-ok">✓ '+(en?'All good — no alerts':'Tudo em ordem — nenhum aviso')+'</div>');
};

