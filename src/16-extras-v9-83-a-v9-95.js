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

