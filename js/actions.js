/* Aurora Vault — ações da interface sem código dentro do HTML.
   Em vez de onclick="…", os elementos dizem o que fazem com atributos data-*, e um só ouvinte trata-os:
     data-act="nome"             clique → nome()
       data-arg="x"              → nome('x')          data-arg2 / data-arg3 → mais argumentos (números passam a número)
       data-null                 → o 1.º argumento é null (ex.: pasta raiz)
       data-ev                   → nome(evento)
     data-self                   só conta o clique no próprio elemento (ex.: fundo escuro de uma janela)
     data-enter="nome"           tecla Enter num campo → nome()      data-enter-focus="id" → passa para o campo id
     data-input="nome"           ao escrever → nome()                data-change="nome" → nome(evento)
     data-hover="nome"           ao passar o rato ou focar → nome(elemento)
     data-dnd="vault" data-arg   arrastar e largar para reordenar (cartões do cofre)
   Só as funções desta lista podem ser chamadas assim: um HTML injetado não consegue chamar outra coisa.
   Os valores vão em atributos escapados, nunca dentro de código — uma aspa num nome já não parte nada.
   Quando todo o HTML deixar de ter onclick, a política de segurança (CSP) pode proibir código dentro do HTML. */
const AV_ACTS=new Set([
  // ecrã de entrada
  'setLang','promptInstall','pickVaultFile','openLoginModal','closeLoginModal','lockForgetMine','lockFieldTap','lockEnter',
  'lockBackToMine','forgetLastVault','lockToggleEye','enterPresentationMode','doBioUnlock','continueLastVault','backToFileStep',
  'backToInitial','startOpenVault','startNewVault','submitOpenVault','submitNewVault','toggleField','onFileSelected','onPinInput',
  'checkNewPwMatch','onNewPw1Input','setUnlockMode','lockOtherVault',
  // cofre de passwords
  'toggleFav','togglePw','avCopyPw','openReadMode','editEntry','toggleReviewed','openMoveModal','archiveEntry','deleteEntry',
  'copyText','toggleHistory','toggleHistPw','avCopyHistPw','avGoSite','openWifiQR','selectCat','selectTag','openHealthCheck',
  'checkBreaches','positionBreachTip','openModal','openFolderModal','openQrScanner','renderCards','setView','openVaultFolder',
  'deleteFolder','goToVaultFolder','openAttachmentBy'
]);
const AV_DND={vault:{start:'dragStart',over:'dragOver',drop:'dragDrop',end:'dragEnd'}};
const avNum=v=>/^-?\d+$/.test(v)?Number(v):v;
function avFn(name){return AV_ACTS.has(name)&&typeof window[name]==='function'?window[name]:null;}
function avCall(name,el,ev){
  const fn=avFn(name);if(!fn)return;
  if(el.hasAttribute('data-ev'))return fn(ev);
  const a=el.getAttribute('data-arg'),a2=el.getAttribute('data-arg2'),a3=el.getAttribute('data-arg3');
  const args=[];
  if(el.hasAttribute('data-null'))args.push(null);else if(a!==null)args.push(a);
  if(a2!==null){if(!args.length)args.push(null);args.push(avNum(a2));}
  if(a3!==null)args.push(avNum(a3));
  return fn(...args);
}
document.addEventListener('click',e=>{
  const el=e.target.closest&&e.target.closest('[data-act]');if(!el)return;
  if(el.hasAttribute('data-self')&&e.target!==el)return;
  avCall(el.dataset.act,el,e);
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.isComposing)return;
  const el=e.target;if(!el||!el.dataset)return;
  if(el.dataset.enterFocus){const n=document.getElementById(el.dataset.enterFocus);if(n)n.focus();return;}
  if(el.dataset.enter)avCall(el.dataset.enter,el,e);
});
document.addEventListener('input',e=>{const el=e.target;if(el&&el.dataset&&el.dataset.input)avCall(el.dataset.input,el,e);});
document.addEventListener('change',e=>{
  const el=e.target,fn=el&&el.dataset&&el.dataset.change&&avFn(el.dataset.change);
  if(fn)fn(e);
});
const avHover=e=>{const el=e.target.closest&&e.target.closest('[data-hover]'),fn=el&&avFn(el.dataset.hover);if(fn)fn(el);};
document.addEventListener('mouseover',avHover);
document.addEventListener('focusin',avHover);
// arrastar e largar: dragstart/dragover/drop/dragend no elemento com data-dnd
['dragstart','dragover','drop','dragend'].forEach(type=>document.addEventListener(type,e=>{
  const el=e.target.closest&&e.target.closest('[data-dnd]'),kind=el&&AV_DND[el.dataset.dnd];if(!kind)return;
  const id=el.getAttribute('data-arg'),f=name=>typeof window[name]==='function'?window[name]:null;
  if(type==='dragstart'){const fn=f(kind.start);if(fn)fn(e,id);}
  else if(type==='dragover'){const fn=f(kind.over);if(fn)fn(e,id);}
  else if(type==='drop'){const fn=f(kind.drop);if(fn)fn(id);}
  else{const fn=f(kind.end);if(fn)fn();}
}));
