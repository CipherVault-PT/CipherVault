/* Aurora Vault — ações da interface sem código dentro do HTML.
   Em vez de onclick="…", os elementos dizem o que fazem com atributos data-*, e um só ouvinte trata-os:
     data-act="nome"           clique → chama a função nome()  (com data-arg="x" → nome('x'); com data-ev → nome(evento))
     data-self                 só conta o clique no próprio elemento (ex.: fundo escuro de uma janela)
     data-enter="nome"         tecla Enter num campo → nome()      data-enter-focus="id" → passa para o campo id
     data-input="nome"         ao escrever → nome()                data-change="nome" → nome(evento)
   Só as funções desta lista podem ser chamadas assim: um HTML injetado não consegue chamar outra coisa.
   Quando todo o HTML deixar de ter onclick, a política de segurança (CSP) pode proibir código dentro do HTML. */
const AV_ACTS=new Set([
  // ecrã de entrada
  'setLang','promptInstall','pickVaultFile','openLoginModal','closeLoginModal','lockForgetMine','lockFieldTap','lockEnter',
  'lockBackToMine','forgetLastVault','lockToggleEye','enterPresentationMode','doBioUnlock','continueLastVault','backToFileStep',
  'backToInitial','startOpenVault','startNewVault','submitOpenVault','submitNewVault','toggleField','onFileSelected','onPinInput',
  'checkNewPwMatch','onNewPw1Input','setUnlockMode','lockOtherVault'
]);
function avCall(name,el,ev){
  if(!AV_ACTS.has(name))return;
  const fn=window[name];if(typeof fn!=='function')return;
  if(el.hasAttribute('data-ev'))return fn(ev);
  const arg=el.getAttribute('data-arg');
  return arg===null?fn():fn(arg);
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
  const el=e.target,n=el&&el.dataset&&el.dataset.change;
  if(n&&AV_ACTS.has(n)&&typeof window[n]==='function')window[n](e);
});
