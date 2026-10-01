
/* ══ v10.23 — ações dos cartões numa só linha: a principal com texto, as outras só com ícone e as menos usadas no menu «⋯» ══ */
const AVX={menu:null,btn:null,home:null,raf:0};
const AVX_EXTRA=/^(toggleReviewed$|openMoveModal$|archive|delete|remove|move)/i;
const AVX_SVG={toggleReviewed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',openMoveModal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v5m-2.5-2.5L12 16l2.5-2.5"/></svg>'};
const AVX_EMOJI=/^\s*([\p{Extended_Pictographic}️‍⃣]+)/u;
const AVX_DOTS='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
function avxPrep(b){
  const svg=b.querySelector('svg'),txt=b.textContent||'',em=txt.match(AVX_EMOJI);
  const lbl=txt.replace(AVX_EMOJI,'').trim();
  if(!lbl)return false;
  const ic=document.createElement('span');ic.className='cbx-i';
  if(svg){svg.removeAttribute('width');svg.removeAttribute('height');ic.appendChild(svg);}else if(AVX_SVG[b.dataset.act])ic.innerHTML=AVX_SVG[b.dataset.act];else if(em)ic.textContent=em[1];
  const l=document.createElement('span');l.className='cbx-l';l.textContent=lbl;
  b.textContent='';if(ic.childNodes.length)b.appendChild(ic);b.appendChild(l);
  if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',lbl);
  if(/delete|remove/i.test(b.dataset.act||''))b.classList.add('danger');
  return !!ic.childNodes.length;
}
function avxEnhance(box){
  box.dataset.avx='1';
  const bs=[...box.children].filter(e=>e.matches('button.card-btn')&&e.style.display!=='none');
  if(bs.length<2)return;
  const icon=new Map(bs.map(b=>[b,avxPrep(b)]));
  const main=bs.find(b=>!AVX_EXTRA.test(b.dataset.act||''))||bs[0];
  const rest=bs.filter(b=>b!==main);
  const extra=bs.length>4?rest.filter(b=>AVX_EXTRA.test(b.dataset.act||'')):[];
  box.classList.add('cbx');box.prepend(main);main.classList.add('cbx-main');
  rest.filter(b=>!extra.includes(b)).forEach(b=>{if(icon.get(b)){b.classList.add('cbx-ico');if(!b.title)b.title=b.getAttribute('aria-label');}box.appendChild(b);});
  if(extra.length<2){extra.forEach(b=>{if(icon.get(b)){b.classList.add('cbx-ico');if(!b.title)b.title=b.getAttribute('aria-label');}box.appendChild(b);});return;}
  const en=currentLang==='en',more=document.createElement('button'),menu=document.createElement('div');
  more.type='button';more.className='card-btn cbx-ico cbx-more';more.dataset.act='avxMore';more.setAttribute('data-this','');
  more.setAttribute('aria-label',en?'More actions':'Mais ações');more.title=more.getAttribute('aria-label');
  more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-expanded','false');more.innerHTML='<span class="cbx-i">'+AVX_DOTS+'</span>';
  menu.className='cbx-menu';menu.hidden=true;menu.setAttribute('role','menu');
  extra.forEach(b=>{b.setAttribute('role','menuitem');menu.appendChild(b);});
  box.append(more,menu);
}
function avxScan(){AVX.raf=0;document.querySelectorAll('.card-actions:not([data-avx])').forEach(avxEnhance);if(AVX.btn&&!AVX.btn.isConnected)avxClose();}
function avxMore(btn){
  const was=AVX.btn;if(AVX.menu)avxClose();if(was===btn)return;
  const menu=btn.nextElementSibling;if(!menu||!menu.classList.contains('cbx-menu'))return;
  AVX.menu=menu;AVX.btn=btn;AVX.home=btn.parentElement;
  document.body.appendChild(menu);menu.hidden=false;btn.setAttribute('aria-expanded','true');
  avxPlace();
  const f=menu.querySelector('button');if(f)f.focus({preventScroll:true});
}
// acompanha o botão quando a página se mexe; só fecha se o botão sair do ecrã
function avxPlace(){
  const m=AVX.menu,b=AVX.btn;if(!m||!b)return;
  const r=b.getBoundingClientRect(),mw=m.offsetWidth,mh=m.offsetHeight,vw=document.documentElement.clientWidth,vh=window.innerHeight;
  if(r.bottom<0||r.top>vh){avxClose();return;}
  let top=r.bottom+6;if(top+mh>vh-8)top=Math.max(8,r.top-mh-6);
  m.style.left=Math.max(8,Math.min(vw-mw-8,r.right-mw))+'px';m.style.top=top+'px';
}
function avxClose(focus){
  const m=AVX.menu,b=AVX.btn;if(!m)return;
  m.hidden=true;if(AVX.home&&AVX.home.isConnected)AVX.home.appendChild(m);else m.remove();
  if(b){b.setAttribute('aria-expanded','false');if(focus&&b.isConnected)b.focus({preventScroll:true});}
  AVX.menu=AVX.btn=AVX.home=null;
}
(function(){
  if(typeof document==='undefined')return;
  const go=()=>{if(!AVX.raf)AVX.raf=requestAnimationFrame(avxScan);};
  new MutationObserver(go).observe(document.documentElement,{childList:true,subtree:true});go();
  document.addEventListener('click',e=>{if(AVX.menu&&!(AVX.btn&&AVX.btn.contains(e.target)))avxClose();});
  document.addEventListener('keydown',e=>{
    if(!AVX.menu)return;
    if(e.key==='Escape'){e.stopPropagation();avxClose(true);return;}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      const it=[...AVX.menu.querySelectorAll('button')],i=it.indexOf(document.activeElement);
      it[(i+(e.key==='ArrowDown'?1:-1)+it.length)%it.length].focus();e.preventDefault();
    }
  },true);
  window.addEventListener('scroll',()=>avxPlace(),true);
  window.addEventListener('resize',()=>avxClose());
})();

/* ══ v10.27 — categorias do cofre: geridas a partir do próprio Cofre, com ícone escolhido num toque ══ */
function openCatManager(){
  const en=avEn(),s=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};
  s('s-cats-title',en?'🗂️ Categories':'🗂️ Categorias');
  s('cats-intro',en?'Create your own categories to organise the vault. Pick an icon, a name and a colour.':'Cria as tuas categorias para organizar o cofre. Escolhe um ícone, um nome e uma cor.');
  s('cats-close-btn',en?'Close':'Fechar');
  pickCatIcon(document.getElementById('catmgr-icon')?.value||'📁');
  renderCatManager();
  document.getElementById('cats-overlay').classList.add('open');
  setTimeout(()=>{const n=document.getElementById('catmgr-name');if(n&&!('ontouchstart' in window))n.focus();},80);
}
function closeCatManager(){document.getElementById('cats-overlay').classList.remove('open');}
function pickCatIcon(icon){
  const inp=document.getElementById('catmgr-icon');if(inp)inp.value=icon||'📁';
  document.querySelectorAll('#catmgr-icons .catmgr-ic').forEach(b=>{const on=b.dataset.arg===inp.value;b.classList.toggle('on',on);b.setAttribute('aria-checked',on?'true':'false');});
}

/* ══ v10.27 — definições mais simples ══ */
function avSetAutosave(on){if(autoSaveOn()!==!!on)avToggleAutosave();else avRenderSettings();}
// Google Drive: só aparecem os botões que fazem sentido no estado atual
function avDriveTidy(){
  const cid=(dCfg('cid')||'').trim(),fid=dCfg('fid'),official=typeof avBuiltinOk==='function'&&avBuiltinOk();
  const show=(id,on)=>{const e=document.getElementById(id);if(e)e.style.display=on?'':'none';};
  const guide=document.querySelector('#drive-quick .dq-guide');
  const adv=!official||!!(guide&&guide.open)||(!!cid&&cid!==(typeof AV_BUILTIN_CID!=='undefined'?AV_BUILTIN_CID:''));
  ['s-drive-cid-lbl','drive-cid','drive-save-cid-btn'].forEach(id=>show(id,adv));
  show('drive-upload-btn',!fid&&!!cid&&!(official&&cid===AV_BUILTIN_CID&&document.getElementById('dq-go')));
  show('drive-link-btn',!fid);
  show('drive-toggle-btn',!!fid);
  show('drive-hist-btn',!!fid);
  show('drive-forget-btn',!!(cid||fid));
  if(guide&&!guide._avx){guide._avx=1;guide.addEventListener('toggle',avDriveTidy);}
}
(function(){
  if(typeof avDriveQuickRender==='function'){const r=avDriveQuickRender;avDriveQuickRender=function(){const x=r.apply(this,arguments);try{avDriveTidy();}catch(e){}return x;};}
  if(typeof renderDriveSettings==='function'){const r=renderDriveSettings;renderDriveSettings=function(){const x=r.apply(this,arguments);try{avDriveTidy();}catch(e){}return x;};}
  if(typeof avRenderSettings==='function'){const r=avRenderSettings;avRenderSettings=function(){const x=r.apply(this,arguments);
    try{const en=avEn(),on=autoSaveOn(),a=document.getElementById('s-autosave-on'),b=document.getElementById('s-autosave-off');
      if(a){a.textContent=en?'On':'Ligada';a.classList.toggle('on',on);}if(b){b.textContent=en?'Off':'Desligada';b.classList.toggle('on',!on);}}catch(e){}
    return x;};}
})();
