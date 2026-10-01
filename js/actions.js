/* Aurora Vault — ações da interface sem código dentro do HTML.
   Em vez de onclick="…", os elementos dizem o que fazem com atributos data-*, e um só ouvinte trata-os.

   Quando:
     data-act="nome"          clique
     data-change="nome"       ao mudar (listas, caixas, ficheiros)     data-input="nome"   ao escrever
     data-enter="nome"        tecla Enter                              data-esc="nome"     tecla Escape (e sai do campo)
     data-keydown="nome"      qualquer tecla → nome(evento)             data-hover="nome"   passar o rato / focar → nome(elemento)
     data-drop="nome"         largar ficheiros → nome(evento) (realça o contorno enquanto se arrasta)
     data-dnd="vault"         arrastar e largar para reordenar (com data-arg = id)
   Argumentos (os mesmos para qualquer um dos acima):
     data-arg / data-arg2 / data-arg3   texto (sempre texto: um id «123» continua a ser texto)     data-null → 1.º argumento null
     data-args='["a",1,true]'           lista em JSON (para números, true/false, null)
     data-value → junta o valor do campo     data-this → junta o próprio elemento     data-ev → o evento vai à frente (data-ev-last → no fim)
   Outros:
     data-self       só conta o clique no próprio elemento (fundo escuro de uma janela)
     data-stop       o clique não chega a mais ninguém (como o antigo event.stopPropagation())
     data-click="id" / data-focus="id"   clica / põe o cursor noutro elemento
     data-enter-focus="id"               Enter passa para outro campo
     data-disables="id" / data-enables="id"   caixa de escolha que (des)ativa outro elemento

   Só as funções da lista AV_ACTS podem ser chamadas assim: um HTML injetado não consegue chamar outra coisa.
   Os valores vão em atributos escapados, nunca dentro de código. Quando todo o HTML deixar de ter onclick,
   a política de segurança (CSP) pode proibir código dentro do HTML. */
const AV_ACTS=new Set(`
addCustomCat avxMore openCatManager closeCatManager pickCatIcon avSetAutosave addFieldRow addFuel addPerson applyColor archiveCurrentNote archiveEntry avAddMain avAddMenu
avCopyHistPw avCopyPw avGaFile avGaOpen avGoSite avOcrDoc avSaveClick avScanStore avSetBgLock avSetBkFreq avSetMode
avSetNudges avSetSwStyle avSetThemeAuto avTabsPanel avToggleAutosave backToFileStep backToInitial calShiftMonth
changeMasterPw checkBreaches checkNewPwMatch clearDocFile clearSnapshotsConfirm close2faManager close2faSetup
closeAssetModal closeBarcode closeCalendar closeCardModal closeChangePwModal closeDedupeModal closeDocModal
closeDocPreview closeDriveLinkPicker closeFolderModal closeFuelModal closeGlobalSearch closeHealthCheck closeImport
closeInfoModal closeLegacyModal closeLoginModal closeModal closeMoveModal closePinSetup closePwGen closeQrModal
closeQrScanner closeReadMode closeRecoveryModal closeSelectiveExport closeSettings closeShareImport closeShareModal
closeSnapshotModal closeStoreModal closeSubModal closeSubsScreen closeTotpModal closeWifiManager confirm2faSetup
confirmImport confirmPinSetup confirmShareImport continueLastVault copyRecoveryCode copyText deleteCurrentNote
deleteEntry deleteFolder do2faBioUnlock do2faRecoveryUnlock doBioSetup doBioUnlock doSelectiveExport
downloadDocFromPreview driveFirstUpload driveForget driveOpenLinkPicker driveSyncNow driveToggle editEntry emptyTrash
enterPresentationMode exitPresentationMode exportCSV exportCalendarIcs exportPDF exportSelectAll forgetLastVault
formatCardNumber formatExpiry generateLegacyDoc generatePw generateShareQR generateUsername goToSite goToVaultFolder
handleAttachment handleDocFileDrop handleDocFileSelect handleTagKey livePreviewColor lockApp lockBackToMine lockEnter
lockFieldTap lockForgetMine lockOtherVault lockToggleEye newNote on2faPinInput on2faRecInput onEntryPwInput
onFileSelected onNewPw1Input onPinInput onSearchInput open2faManager open2faSetup openAssetModal openAttachmentBy
openCalendar openCardModal openChangePwModal openDocModal openFolderModal openHealthCheck openLegacyModal
openLoginModal openModal openMoveModal openPinSetup openPwGen openQrScanner openReadMode openSelectiveExport
openSettings openSnapshotModal openStoreModal openSyncHistory openTotpModal openVaultFolder openWifiQR pickVaultFile
positionBreachTip printRecoveryCode promptInstall renderCards renderPwStrength resetColors resetWifiForm saveAsset
saveCard saveDoc saveDriveCid saveEntry saveFile saveFolder saveInfo saveNote saveStoreCard saveSub
saveTotp saveVaultName saveWifiNet scanQrFromFile selectCardColor selectCat selectTag setDocSort setDocValidityFilter
setLang setLegacyLang setPinDuration setPwGenMode setTimeout2 setUnlockMode setView startNewVault startOpenVault
submitNewVault submitOpenVault switchGroup switchSettingsTab switchTab tbToggleMore tbToggleSearch toggleDashCard
toggleEmojiPicker toggleFav toggleField toggleHistPw toggleHistory toggleNotifs togglePrivacy togglePw toggleReviewed
totpOpenGaImport updateNoteCharCount updatePwGen updateSubCycleUI usePwGen
`.trim().split(/\s+/));
AV_ACTS.add('tbMenuRun');['avAddMenu','togglePrivacy','saveFile','avExportVault','switchGroup','auroraOpen','driveSyncNow','openCalendar','openSettings','setLang'].forEach(n=>AV_ACTS.add(n));
['applyThemePreset','pickPresetColor','hcGoEntry','toggleExportEntry','handleAttachment','fillField','pickStoreColor','pickSubColor','openSubModal','editSub','deleteSub','pickFlag','setBackground','openWifiNetQR','editWifiNet','deleteWifiNet','avReadTogglePw','readShare','readEdit','avAddType','avAddAurora','avDriveConsole','avCopyPw','avGoSite'].forEach(n=>AV_ACTS.add(n));
['_renewalGo','archiveCard','archiveDoc','auroraOpen','avAlGo','avCardCopy','avCardReveal','avCardSceneTap','avDriveQuick','avGaClose','avGaImport','avHideLockToggle','avOnbHide','avScanClose','avTabToggle','avTourEnd','avTourStart','avWalClose','avWalOpen','avtNext','avtShowMe','calShowDay','confirmMoveDoc','copyAssetKey','copyInfoField','copyTotpCode','deleteAsset','deleteCard','deleteCustomCat','deleteDoc','deleteEntry','deleteFolder','deleteFuel','deleteInfoField','deleteNoteById','deletePerson','deleteStoreCard','deleteTotp','deleteTrashForever','downloadDoc','downloadDocFromPreview','driveLinkExisting','driveLinkKeepLocal','editInfoField','editStoreCard','goToEntry','goToFolder','nextWelcome','openAssetModal','openAttachment','openCardModal','openDedupeModal','openDocModal','openDocPreview','openFolder','openFolderModal','openFuelModal','openInfoModal','openMoveModal','openReadMode','openSubsScreen','openTotpModal','openWifiManager','openWifiQR','prevWelcome','previewDoc','removeAttachment','removeDuplicate','removeFieldRow','renamePerson','restoreCard','restoreDoc','restoreEntry','restoreNote','restoreSnapshot','restoreTrashItem','selectEntryEmoji','selectProfileEmoji','set2faMode','setDocFilter','setRenewalWindow','showBarcode','skipWelcome','syncRestoreFrom','toggleAssetKey','toggleInfoMask','togglePin','toggleSubsSection','toggleTotpRecovery'].forEach(n=>AV_ACTS.add(n));
['t2mgrSetup','change2faPin','disable2faProtection','regen2faRecovery','toggle2faBio','openSettingsTab','avOnbBackup','auroraOpenSafe','gsOpenEntry','gsOpenNote','gsOpenCards','removeTag','closeSyncModal','setEntryField','readOpenDoc','readGoFolder','aurAct','auroraHeadTap','auroraReset','auroraToggleMin','auroraClose','auroraSend','aurAlertGo','aurAlertDismiss','aurLaunchKey','avGaScan','avGaCount','avWalEdit','avWalDelete','avAlGo','avAlX','avAlToggleAll','avCardPinTap','avAddType','archiveCard','deleteCard','openCardModal'].forEach(n=>AV_ACTS.add(n));
['lockStartOpen','lockStartNew','lockStartEnter','lockSwipeGo'].forEach(n=>AV_ACTS.add(n));
/* Mais funções são acrescentadas por quem as usa (ver avAllow), para esta lista não ter de saber tudo. */
function avAllow(...names){names.flat().forEach(n=>AV_ACTS.add(n));}
const AV_DND={vault:{start:'dragStart',over:'dragOver',drop:'dragDrop',end:'dragEnd'}};
function avFn(name){return name&&AV_ACTS.has(name)&&typeof window[name]==='function'?window[name]:null;}
function avArgs(el,ev){
  let args;
  const j=el.getAttribute('data-args');
  if(j!==null){try{args=JSON.parse(j);}catch(e){args=[];}if(!Array.isArray(args))args=[args];}
  else{
    const a=el.getAttribute('data-arg'),a2=el.getAttribute('data-arg2'),a3=el.getAttribute('data-arg3');
    args=[];
    if(el.hasAttribute('data-null'))args.push(null);else if(a!==null)args.push(a);
    if(a2!==null){if(!args.length)args.push(null);args.push(a2);}
    if(a3!==null)args.push(a3);
  }
  if(el.hasAttribute('data-value'))args.push(el.value);
  if(el.hasAttribute('data-this'))args.push(el);
  if(el.hasAttribute('data-ev'))args.unshift(ev);
  if(el.hasAttribute('data-ev-last'))args.push(ev);
  return args;
}
function avCall(name,el,ev){
  const fn=avFn(name);if(!fn)return;
  const r=fn(...avArgs(el,ev));
  // a função pediu para o clique não seguir (menus que fecham ao clicar fora): também não segue para os
  // outros ouvintes da página, como acontecia com o código dentro do HTML
  if(ev&&ev.cancelBubble&&ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  return r;
}
document.addEventListener('click',e=>{
  const t=e.target.closest?e.target:null;if(!t)return;
  const el=t.closest('[data-act],[data-click],[data-focus]');if(!el)return;
  if(el.hasAttribute('data-self')&&e.target!==el)return;
  if(el.hasAttribute('data-stop'))e.stopImmediatePropagation();
  if(el.dataset.click){const n=document.getElementById(el.dataset.click);if(n)n.click();return;}
  if(el.dataset.focus){const n=document.getElementById(el.dataset.focus);if(n)n.focus();return;}
  avCall(el.dataset.act,el,e);
});
document.addEventListener('keydown',e=>{
  const el=e.target;if(!el||!el.dataset||e.isComposing)return;
  if(el.dataset.keydown)avCall(el.dataset.keydown,el,e);
  if(e.key==='Enter'){
    if(el.dataset.enterFocus){const n=document.getElementById(el.dataset.enterFocus);if(n)n.focus();return;}
    if(el.dataset.enter)avCall(el.dataset.enter,el,e);
  }else if(e.key==='Escape'&&el.dataset.esc){avCall(el.dataset.esc,el,e);el.blur();}
});
document.addEventListener('input',e=>{const el=e.target;if(el&&el.dataset&&el.dataset.input)avCall(el.dataset.input,el,e);});
document.addEventListener('change',e=>{
  const el=e.target;if(!el||!el.dataset)return;
  if(el.dataset.disables){const n=document.getElementById(el.dataset.disables);if(n)n.disabled=el.checked;}
  if(el.dataset.enables){const n=document.getElementById(el.dataset.enables);if(n)n.disabled=!el.checked;}
  if(el.dataset.change)avCall(el.dataset.change,el,e);
});
const avHover=e=>{const el=e.target.closest&&e.target.closest('[data-hover]'),fn=el&&avFn(el.dataset.hover);if(fn)fn(el);};
document.addEventListener('mouseover',avHover);
document.addEventListener('focusin',avHover);
// zonas onde se largam ficheiros
document.addEventListener('dragover',e=>{const z=e.target.closest&&e.target.closest('[data-drop]');if(!z)return;e.preventDefault();z.style.borderColor='var(--accent)';});
document.addEventListener('dragleave',e=>{const z=e.target.closest&&e.target.closest('[data-drop]');if(z&&!z.contains(e.relatedTarget))z.style.borderColor='';});
document.addEventListener('drop',e=>{const z=e.target.closest&&e.target.closest('[data-drop]');if(!z)return;z.style.borderColor='';const fn=avFn(z.dataset.drop);if(fn)fn(e);});
// arrastar e largar para reordenar: dragstart/dragover/drop/dragend no elemento com data-dnd
['dragstart','dragover','drop','dragend'].forEach(type=>document.addEventListener(type,e=>{
  const el=e.target.closest&&e.target.closest('[data-dnd]'),kind=el&&AV_DND[el.dataset.dnd];if(!kind)return;
  const id=el.getAttribute('data-arg'),f=name=>typeof window[name]==='function'?window[name]:null;
  if(type==='dragstart'){const fn=f(kind.start);if(fn)fn(e,id);}
  else if(type==='dragover'){const fn=f(kind.over);if(fn)fn(e,id);}
  else if(type==='drop'){const fn=f(kind.drop);if(fn)fn(id);}
  else{const fn=f(kind.end);if(fn)fn();}
}));

/* ── acessibilidade: leitores de ecrã ──
   Liga cada <label> ao campo logo a seguir (sem «for», o leitor de ecrã não sabia de que campo era a etiqueta)
   e dá nome aos botões só com ícone. Corre ao abrir e sempre que aparece HTML novo (janelas, listas). */
const AV_A11Y_NAMES={lockApp:['Bloquear','Lock'],toggleField:['Mostrar ou esconder','Show or hide'],togglePw:['Mostrar ou esconder a password','Show or hide the password'],
  avCopyPw:['Copiar password','Copy password'],copyText:['Copiar','Copy'],pickStoreColor:['Cor','Colour'],pickSubColor:['Cor','Colour']};
let avA11yN=0;
function avA11yFix(root){
  if(!root||!root.querySelectorAll)return;
  const en=document.documentElement.lang==='en';
  const all=sel=>{const l=[...root.querySelectorAll(sel)];if(root.matches&&root.matches(sel))l.unshift(root);return l;};   // o próprio elemento acrescentado também conta
  all('label:not([for])').forEach(l=>{
    if(l.querySelector('input,select,textarea'))return;
    const n=l.nextElementSibling;if(!n)return;
    const c=n.matches('input,select,textarea')?n:n.querySelector('input,select,textarea');
    if(!c||c.type==='hidden'||c.hasAttribute('aria-label')||c.labels&&c.labels.length)return;
    if(!c.id)c.id='avf-'+(++avA11yN);
    l.htmlFor=c.id;
  });
  all('button:not([aria-label]):not([title])').forEach(b=>{
    if(b.textContent.trim()||!AV_A11Y_NAMES[b.dataset.act])return;
    b.dataset.a11yAuto='1';avA11yName(b,en);
  });
}
function avA11yName(b,en){const nm=AV_A11Y_NAMES[b.dataset.act];if(nm)b.setAttribute('aria-label',nm[en?1:0]+(/Color$/.test(b.dataset.act)&&b.dataset.arg?' '+b.dataset.arg:''));}
// ao mudar de idioma, os nomes dados automaticamente acompanham
function avA11yRelabel(){const en=document.documentElement.lang==='en';document.querySelectorAll('[data-a11y-auto]').forEach(b=>avA11yName(b,en));}
{const q=new Set();let t=0;
  const flush=()=>{t=0;const l=[...q];q.clear();l.forEach(n=>{if(n.isConnected)avA11yFix(n);});};
  const later=()=>{if(!t)t=(window.requestIdleCallback||setTimeout)(flush,{timeout:600});};
  const start=()=>{avA11yFix(document);new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)q.add(n);if(q.size)later();}).observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();}
