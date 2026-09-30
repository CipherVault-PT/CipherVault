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
  let text,salt,iter,key,data,fromFile=false;
  try{
    fromFile=!((quick||!pendingVaultFile)&&pendingVaultText);
    text=fromFile?await pendingVaultFile.text():pendingVaultText;
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
    if(fromFile)vaultLinkOpenedFile(text).catch(()=>{});
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
  if(typeof avFailRecord==='function')avFailRecord('pw');
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

