
/* ══ v12 — FLUIDEZ ══
   · Só se desenha a aba à vista (renderAll em 06-abas-idioma.js); as outras desenham-se ao abrir.
   · Ao bloquear, as abas ficam vazias: antes, os cartões do cofre continuavam na página (escondidos) até ao desbloqueio
     seguinte — agora, com o cofre fechado, a página não guarda nada dele. */
function avTabsClear(){
  if(typeof masterKey!=='undefined'&&masterKey)return;
  avDataVer++;
  [...Object.keys(AV_TAB_RENDER),'totp',...AV_ASSET_TABS].forEach(t=>{try{avTabDraw(t);}catch(e){}});
  for(const k in AV_ONCE)delete AV_ONCE[k];
}
if(typeof lockApp==='function'){const _fl=lockApp;lockApp=function(){const demo=typeof presentationMode!=='undefined'&&presentationMode;const r=_fl.apply(this,arguments);if(!demo)try{avTabsClear();}catch(e){}return r;};}
