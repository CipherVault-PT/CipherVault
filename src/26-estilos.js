
/* ══ ESTILOS (v11, v12) — Safira & Platina, Ónix & Ouro, Nórdico e Clássico ══
   O estilo, o ecrã de entrada e o movimento ficam neste browser (js/skin-boot.js aplica-os antes de a página se desenhar).
   Estilos novos: sem fotografia nem céu WebGL no ecrã de entrada e sem fundo animado na app — muito mais leves.
   Ecrãs de entrada: Joia (uma pedra lapidada só deste cofre, que apanha a luz), Lanterna (gravura que se acende onde
   passa o dedo), Constelação (a assinatura do cofre em estrelas) e Voz da Aurora. Tocar no selo pede a impressão digital. */
const SK_SKINS=['safira','onix','nordico','classico'],SK_ENTRIES=['joia','lanterna','constelacao','aurora'],SK_MOTIONS=['completo','suave','desligado'];
function skGet(k,d){try{return localStorage.getItem(k)||d;}catch(e){return d;}}
function skSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function skEn(){return typeof currentLang!=='undefined'&&currentLang==='en';}
function skNew(){return avSkin()!=='classico';}
function skEntryDef(){return avSkin()==='safira'?'joia':'lanterna';}
function skEntry(){const e=document.documentElement.getAttribute('data-entry');return SK_ENTRIES.includes(e)?e:skEntryDef();}
function skMotion(){const m=document.documentElement.getAttribute('data-motion');return SK_MOTIONS.includes(m)?m:'suave';}
function skStill(){return skMotion()==='desligado'||!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function skDashLabel(){return skNew()?(skEn()?'Home':'Início'):t('tabDash').replace(/^📊\s*/,'');}
function skEntryFor(choice){
  if(choice!=='surpresa')return SK_ENTRIES.includes(choice)?choice:skEntryDef();
  const n=new Date(),day=Math.floor((n-new Date(n.getFullYear(),0,0))/864e5);return SK_ENTRIES[day%SK_ENTRIES.length];
}

/* ── Escolhas (Definições → Aspeto) ── */
function setSkin(s){
  if(!SK_SKINS.includes(s)||s===avSkin())return skRenderSettings();
  skSet('av_skin',s);
  document.documentElement.setAttribute('data-skin',s);
  document.documentElement.classList.toggle('sk-new',s!=='classico');
  document.documentElement.setAttribute('data-entry',skEntryFor(skGet('av_entry',skEntryDef())));
  try{applyThemeColors(currentTheme);buildManifest();}catch(e){}
  try{if(s==='classico'){if(!skStill()&&AuroraBG)AuroraBG.setMode(currentBg);}else if(AuroraBG)AuroraBG.stop();}catch(e){}
  try{renderThemeGrid();refreshColorPickers();}catch(e){}
  skDecorate();skArtBuild();skRenderSettings();
  try{positionTabIndicator();}catch(e){}
  const n={safira:skEn()?'Sapphire & Platinum':'Safira & Platina',onix:'Ónix & Ouro',nordico:skEn()?'Nordic':'Nórdico',classico:skEn()?'Classic':'Clássico'}[s];
  toast((skEn()?'Style: ':'Estilo: ')+n);
}
function setEntryStyle(c){
  if(c!=='surpresa'&&!SK_ENTRIES.includes(c))return;
  skSet('av_entry',c);
  document.documentElement.setAttribute('data-entry',skEntryFor(c));
  skArtBuild();skRenderSettings();
}
function setMotion(m){
  if(!SK_MOTIONS.includes(m))return;
  skSet('av_motion',m);
  document.documentElement.setAttribute('data-motion',m);
  try{if(m==='desligado'){if(AuroraBG)AuroraBG.stop();if(typeof ASKY!=='undefined')ASKY.run=false;}else if(!skNew()&&AuroraBG&&!AuroraBG.isRunning())AuroraBG.setMode(currentBg);}catch(e){}
  skArtBuild();skRenderSettings();
}
// escolher à mão desliga o «Tema automático» (como no botão do tema)
function setSkinMode(mode){if(mode!=='dark'&&mode!=='light')return;try{if(typeof avThemeAuto==='function'&&avThemeAuto()){localStorage.setItem('av_theme_auto','0');if(typeof avRenderSettings==='function')avRenderSettings();}}catch(e){}setTheme(mode);try{buildManifest();}catch(e){}skRenderSettings();}
avAllow('setSkin','setEntryStyle','setMotion','setSkinMode','skSealTap','skMoreOpen','skMoreClose','skMoreGo');

function skRenderSettings(){
  const box=document.getElementById('sk-settings');if(!box)return;
  const en=skEn(),s=avSkin(),c=skGet('av_entry',skEntryDef()),m=skMotion(),dark=currentTheme!=='light';
  const opt=(act,arg,on,cls,name,sub)=>`<button type="button" class="sk-opt${on?' on':''}" data-act="${act}" data-arg="${arg}" aria-pressed="${on}"><span class="sk-thumb ${cls}" aria-hidden="true"></span><b>${name}</b><small>${sub}</small></button>`;
  const seg=(act,items,cur)=>`<div class="sk-seg" role="group">${items.map(([v,l])=>`<button type="button" data-act="${act}" data-arg="${v}" aria-pressed="${v===cur}" class="${v===cur?'on':''}">${l}</button>`).join('')}</div>`;
  box.innerHTML=`<div class="settings-title">✨ ${en?'Style':'Estilo'}</div>
  <div class="sk-opts sk-4">
    ${opt('setSkin','safira',s==='safira','sk-th-safira',en?'Sapphire &amp; Platinum':'Safira &amp; Platina',en?'Deep blue and platinum, Art Deco':'Azul profundo e platina, Art Déco')}
    ${opt('setSkin','onix',s==='onix','sk-th-onix','Ónix &amp; Ouro',en?'Black and gold, elegant':'Preto e dourado, elegante')}
    ${opt('setSkin','nordico',s==='nordico','sk-th-nordico',en?'Nordic':'Nórdico',en?'Pine green and amber, cosy':'Verde-pinho e âmbar, acolhedor')}
    ${opt('setSkin','classico',s==='classico','sk-th-classico',en?'Classic':'Clássico',en?'The original look, animated aurora':'O aspeto de sempre, com a aurora animada')}
  </div>
  ${s!=='classico'?`<div class="sk-lbl">${en?'Entry screen':'Ecrã de entrada'}</div>
  <div class="sk-opts sk-5">
    ${opt('setEntryStyle','joia',c==='joia','sk-th-joia',en?'Jewel':'Joia',en?'Your vault’s own gem':'A pedra só do teu cofre')}
    ${opt('setEntryStyle','lanterna',c==='lanterna','sk-th-lanterna',en?'Lantern':'Lanterna',en?'An engraving that lights up':'Gravura que se acende')}
    ${opt('setEntryStyle','constelacao',c==='constelacao','sk-th-constelacao',en?'Constellation':'Constelação',en?'Your vault’s signature':'A assinatura do cofre')}
    ${opt('setEntryStyle','aurora',c==='aurora','sk-th-aurora',en?'Aurora’s voice':'Voz da Aurora',en?'Aurora greets you':'A Aurora recebe-te')}
    ${opt('setEntryStyle','surpresa',c==='surpresa','sk-th-surpresa',en?'Surprise me':'Surpreende-me',en?'A different one each day':'Um diferente cada dia')}
  </div>
  <div class="sk-lbl">${en?'Mode':'Modo'}</div>
  ${seg('setSkinMode',[['dark',en?'Dark':'Escuro'],['light',en?'Light':'Claro']],dark?'dark':'light')}`:''}
  <div class="sk-lbl">${en?'Motion':'Movimento'}</div>
  ${seg('setMotion',[['completo',en?'Full':'Completo'],['suave',en?'Gentle':'Suave'],['desligado',en?'Off':'Desligado']],m)}
  <small class="sk-note">${m==='desligado'?(en?'No animations — the lightest on the battery.':'Sem animações — o mais leve para a bateria.')
    :s==='classico'?(en?'The Classic keeps its animated aurora and background; «Off» stops everything.':'O Clássico mantém a aurora e o fundo animados; «Desligado» para tudo.')
    :m==='completo'?(en?'Gentle ambient movement, even when you are not touching.':'Movimento ambiente suave, mesmo sem tocares.'):(en?'Discreet: it reacts when you touch or type.':'Discreto: reage quando tocas ou escreves.')}</small>
  ${s!=='classico'?`<small class="sk-note">${en?'Custom colours and animated backgrounds belong to the Classic style.':'As cores personalizadas e os fundos animados são do estilo Clássico.'}</small>`:''}`;
}
if(typeof openSettings==='function'){const _skOs=openSettings;openSettings=function(){const r=_skOs.apply(this,arguments);try{skRenderSettings();}catch(e){}return r;};}

/* ── Assinatura do cofre (Constelação): vem do salt do cofre aberto (público, está no ficheiro) e fica neste browser.
   Uma página falsa noutro endereço não consegue ler isto — por isso não sabe desenhar as tuas estrelas. ── */
async function skSaveSig(){
  try{
    if(typeof presentationMode!=='undefined'&&presentationMode)return;
    const s=window._salt;if(!s||!s.length)return;
    const h=new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(s)));
    const hex=[...h.slice(0,16)].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(skGet('av_sig','')!==hex){skSet('av_sig',hex);if(skEntry()==='constelacao')skArtBuild();}
  }catch(e){}
}
// 4 formas-base (como constelações a sério), escolhidas, espelhadas e ligeiramente deslocadas pela assinatura do cofre
const SK_SHAPES=[
  {p:[[40,210],[92,150],[150,176],[182,96],[236,128],[270,60],[300,170],[214,236]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[4,6],[6,7],[7,2]]},
  {p:[[36,96],[96,196],[156,118],[214,206],[282,92],[312,180],[250,262],[120,262]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[3,6],[1,7]]},
  {p:[[36,78],[96,104],[150,136],[200,170],[210,244],[300,252],[312,180],[110,232]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3],[2,7]]},
  {p:[[170,40],[170,140],[170,262],[78,152],[264,126],[112,90],[236,214],[304,62]],e:[[0,1],[1,2],[3,1],[1,4],[5,0],[2,6],[4,7]]}
];
function skSigStars(){
  const hex=skGet('av_sig','');
  if(!/^[0-9a-f]{32}$/.test(hex)){const s=SK_SHAPES[0];return{known:false,pts:s.p,edges:s.e};}
  const b=hex.match(/../g).map(x=>parseInt(x,16)),s=SK_SHAPES[b[0]%SK_SHAPES.length],flip=b[1]&1;
  const pts=s.p.map(([x,y],i)=>[Math.round((flip?340-x:x)+(b[2+i]%25)-12),Math.round(y+(b[(10+i)%16]%25)-12)]);
  return{known:true,pts,edges:s.e};
}

/* ── Joia (v12): uma pedra lapidada, desenhada em vetor. O corte (número de faces, proporções, rotação e a cor do «fogo»)
   vem da assinatura do cofre: cada cofre tem a sua. A luz segue o rato, o dedo ou a inclinação do telemóvel; só se
   redesenha quando a luz muda (parada não gasta nada). ── */
const SK_GEM_PAL=[[0,230,168],[31,182,255],[123,92,255],[255,95,184],[255,207,90]];
const SK_GEM_TONE={safira:{d:[[7,11,26],[30,58,160]],l:[[238,242,251],[120,150,235]]},onix:{d:[[12,11,10],[126,90,26]],l:[[247,243,234],[212,176,98]]},nordico:{d:[[10,22,19],[14,100,76]],l:[[244,243,236],[100,186,154]]}};
const SKG={lx:-.35,ly:-.45,px:0,py:0,ptr:false,raf:0,amb:0,hand:0,tl:0,tilt:false,open:false,
  can:!!(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission!=='function'&&window.isSecureContext)};
function skGemHue(t){t=((t%1)+1)%1;const n=SK_GEM_PAL.length,x=t*n,i=Math.floor(x),f=x-i,a=SK_GEM_PAL[i%n],b=SK_GEM_PAL[(i+1)%n];return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];}
function skGemSpec(sig){
  const b=/^[0-9a-f]{32}$/.test(sig||'')?sig.match(/../g).map(x=>parseInt(x,16)):null;
  if(!b)return{n:8,rt:.5,rs:.7,rot:Math.PI/8,hue:.02};
  const n=[8,8,10,12,6,8,10,8][b[0]%8];
  return{n,rt:.44+(b[1]/255)*.12,rs:.64+(b[2]/255)*.1,rot:(b[3]/255)*(Math.PI*2/n),hue:b[4]/255};
}
function skGemBuild(sig){
  const S=skGemSpec(sig),n=S.n,R=150,C=200,TAU=Math.PI*2,f=v=>v.toFixed(1);
  const P=(a,r)=>[C+Math.cos(a)*r,C+Math.sin(a)*r];
  const T=[],M=[],G=[],Q=[],cu=[],F=[]; // mesa, estrelas, cintura, pavilhão, culaça; faces = [pontos, anel, inclinação]
  for(let k=0;k<n;k++){const a=S.rot+k*TAU/n;T.push(P(a,R*S.rt));M.push(P(a+Math.PI/n,R*S.rs));cu.push(P(a+Math.PI/n,R*S.rt*.2));}
  for(let j=0;j<2*n;j++){const a=S.rot+j*Math.PI/n;G.push(P(a,R));Q.push(P(a,R*S.rt*(j%2?.62:.94)));}
  for(let j=0;j<2*n;j++)F.push([[cu[Math.floor(j/2)%n],Q[j],Q[(j+1)%(2*n)]],0,-.42+(j%2?.16:-.1)]);
  for(let j=0;j<2*n;j++)F.push([[Q[j],Q[(j+1)%(2*n)],T[Math.floor((j+1)/2)%n]],1,-.2+(j%2?-.12:.12)]);
  for(let k=0;k<n;k++)F.push([[T[k],T[(k+1)%n],M[k]],2,.3]);
  for(let k=0;k<n;k++)F.push([[T[k],M[k],G[2*k],M[(k+n-1)%n]],3,.5]);
  for(let k=0;k<n;k++){F.push([[M[k],G[2*k],G[2*k+1]],4,.74]);F.push([[M[k],G[2*k+1],G[(2*k+2)%(2*n)]],4,.74]);}
  let h=`<svg class="sk-gem" viewBox="0 0 400 400" data-hue="${S.hue.toFixed(3)}" data-n="${F.length}" aria-hidden="true"><g class="sk-gem-f">`;
  F.forEach(([pts,ring,tilt])=>{
    const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length-C,cy=pts.reduce((s,p)=>s+p[1],0)/pts.length-C,th=Math.atan2(cy,cx),d=Math.hypot(cx,cy)/R;
    h+=`<polygon points="${pts.map(p=>f(p[0])+','+f(p[1])).join(' ')}" data-a="${th.toFixed(3)}" data-t="${tilt}" data-r="${ring}" style="--r:${ring};--dx:${f(Math.cos(th)*(40+d*120))}px;--dy:${f(Math.sin(th)*(40+d*120))}px"/>`;
  });
  return h+`</g><polygon class="sk-gem-cu" points="${cu.map(p=>f(p[0])+','+f(p[1])).join(' ')}"/><circle class="sk-gem-rim" cx="200" cy="200" r="${R+4}"/><circle class="sk-gem-rim2" cx="200" cy="200" r="${R+11}"/></svg>`;
}
// Luz: cada face tem uma direção; a cor mistura o corpo da pedra com o «fogo» da aurora onde a luz bate
function skGemLight(svg,lx,ly,lit){
  const F=svg._f||(svg._f=[...svg.querySelectorAll('.sk-gem-f polygon')].map(p=>{const a=+p.dataset.a,t=+p.dataset.t,s=Math.sin(t);return{p,a,inn:+p.dataset.r<2,n:[Math.cos(a)*s,Math.sin(a)*s,Math.cos(t)],c:''};}));
  const light=document.documentElement.getAttribute('data-theme')==='light',tn=(SK_GEM_TONE[avSkin()]||SK_GEM_TONE.safira)[light?'l':'d'],base=tn[0],body=tn[1];
  const hue=+svg.dataset.hue||0,m=Math.hypot(lx,ly,.85),L=[lx/m,ly/m,.85/m],hm=Math.hypot(L[0],L[1],L[2]+1),H=[L[0]/hm,L[1]/hm,(L[2]+1)/hm];
  for(let i=0;i<F.length;i++){
    const fc=F[i],N=fc.n,inn=fc.inn,on=lit>i?1:0;
    const d=Math.max(0,N[0]*L[0]+N[1]*L[1]+N[2]*L[2]),sp=Math.pow(Math.max(0,N[0]*H[0]+N[1]*H[1]+N[2]*H[2]),60);
    const fire=Math.min(1,Math.pow(inn?d*1.25:d,inn?1.2:2.2)*(inn?1.15:1.5)+on*.55),hc=skGemHue(fc.a/(Math.PI*2)+hue+(inn?.45:0)+.16*(L[0]-L[1]));
    const b=Math.min(1,(inn?.1:.2)+d*(inn?.8:.55)+on*.2),mix=light?.34+b*.66:b,w=Math.min(.92,sp*1.3);
    let c='rgb(';
    for(let k=0;k<3;k++){const col=body[k]+(hc[k]-body[k])*fire,v=base[k]+(col-base[k])*mix;c+=Math.round(v+(255-v)*w)+(k<2?',':')');}
    if(c!==fc.c){fc.c=c;fc.p.setAttribute('fill',c);}
  }
}
function skGemPaint(){
  const svg=document.querySelector('#sk-art .sk-gem');if(!svg)return;
  if(SKG.ptr){SKG.ptr=false;const r=svg.getBoundingClientRect(),k=r.width*.75||1,cl=v=>Math.max(-1.3,Math.min(1.3,v));SKG.lx=cl((SKG.px-r.left-r.width/2)/k);SKG.ly=cl((SKG.py-r.top-r.height/2)/k);}
  const n=+svg.dataset.n||0;
  skGemLight(svg,SKG.lx,SKG.ly,SKG.open?n:Math.round(Math.min(1,skTyped/8)*n));
}
function skGemQueue(){if(!SKG.raf)SKG.raf=requestAnimationFrame(()=>{SKG.raf=0;skGemPaint();});}
function skGemLive(){const art=document.getElementById('sk-art'),ls=document.getElementById('lock-screen');return !!art&&art.dataset.kind==='joia'&&!SKG.open&&!!ls&&ls.style.display!=='none'&&skMotion()!=='desligado';}
document.addEventListener('pointermove',e=>{if(!skGemLive())return;SKG.px=e.clientX;SKG.py=e.clientY;SKG.ptr=true;SKG.hand=performance.now()+4000;skGemQueue();},{passive:true});
function skGemTilt(e){
  if(e.gamma==null||e.beta==null||!skGemLive())return;
  const now=performance.now();if(now<SKG.hand)return;
  const lx=Math.max(-1,Math.min(1,e.gamma/28)),ly=Math.max(-1,Math.min(1,(e.beta-48)/28));
  if(Math.abs(lx-SKG.lx)+Math.abs(ly-SKG.ly)<.03)return;
  SKG.lx+=(lx-SKG.lx)*.4;SKG.ly+=(ly-SKG.ly)*.4;SKG.tl=now;skGemQueue();
}
// o sensor de inclinação só fica ligado enquanto a joia está no ecrã (não gasta bateria com o cofre aberto)
function skGemSensors(on){
  const ok=!!on&&SKG.can&&!skStill()&&!!window.matchMedia&&matchMedia('(pointer:coarse)').matches;
  if(ok===SKG.tilt)return;SKG.tilt=ok;
  window[ok?'addEventListener':'removeEventListener']('deviceorientation',skGemTilt);
}
// «Completo»: a luz passeia devagar pela pedra quando ninguém lhe mexe (~24 fps, só com a joia à vista)
function skGemAmbient(){
  cancelAnimationFrame(SKG.amb);SKG.amb=0;
  if(skMotion()!=='completo'||skStill())return;
  let last=0;
  const tick=ts=>{
    SKG.amb=0;if(!skGemLive()&&!SKG.open)return;
    SKG.amb=requestAnimationFrame(tick);
    if(SKG.open||document.hidden||ts-last<42||ts<SKG.hand||ts<SKG.tl+3000)return;last=ts;
    const a=ts/2600;SKG.lx=.62*Math.cos(a);SKG.ly=.5*Math.sin(a*1.3)-.12;skGemPaint();
  };
  SKG.amb=requestAnimationFrame(tick);
}
// ao abrir: a pedra acende-se toda e as faces soltam-se (o resto é CSS: #lock-screen.sk-opening)
function skGemOpen(){
  const svg=document.querySelector('#sk-art .sk-gem');
  if(svg&&!skStill()){SKG.lx=0;SKG.ly=-.1;SKG.ptr=false;SKG.open=true;skGemPaint();}
  setTimeout(()=>{SKG.open=false;skGemSensors(false);},900);
}

/* ── Arte do ecrã de entrada ── */
let skTyped=0;
function skRosette(id,stroke,extra){
  let e='';for(let i=0;i<24;i++)e+=`<ellipse cx="200" cy="200" rx="150" ry="58" transform="rotate(${i*7.5} 200 200)"/>`;
  return `<svg class="sk-ros ${extra||''}" viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bdf5e2"/><stop offset=".25" stop-color="#bfe3ff"/><stop offset=".5" stop-color="#d9ccff"/><stop offset=".75" stop-color="#ffd3e8"/><stop offset="1" stop-color="#f3dfa2"/></linearGradient></defs><g fill="none" stroke="${stroke==='opal'?`url(#${id}g)`:'currentColor'}">${e}<circle cx="200" cy="200" r="160"/><circle cx="200" cy="200" r="166"/><circle cx="200" cy="200" r="172"/></g></svg>`;
}
function skSealHtml(){return `<button type="button" class="sk-seal" id="sk-seal" data-act="skSealTap"><span aria-hidden="true">AV</span></button>`;}
function skArtBuild(){
  const host=document.querySelector('#lock-screen .lc-left');if(!host)return;
  let art=document.getElementById('sk-art');
  if(!skNew()){if(art)art.remove();return;}
  const en=skEn(),kind=skEntry(),touch=!window.matchMedia||matchMedia('(pointer:coarse)').matches;
  if(!art){art=document.createElement('div');art.id='sk-art';art.className='sk-art';host.prepend(art);}
  art.dataset.kind=kind;
  let h='';
  if(kind==='lanterna'){
    h=`<div class="sk-stage sk-lan">${skRosette('skr1','gold','sk-ros-base')}<div class="sk-lit">${skRosette('skr2','opal')}</div><div class="sk-full">${skRosette('skr3','opal')}</div>${skSealHtml()}</div>
      <div class="sk-txt"><div class="sk-brand"><i aria-hidden="true"></i><span>AURORA VAULT</span><i aria-hidden="true"></i></div><p class="sk-hint" id="sk-hint">${touch?(en?'Run your finger over the engraving.':'Passa o dedo pela gravura.'):(en?'Move the mouse over the engraving.':'Passa o rato pela gravura.')}</p></div>`;
  }else if(kind==='constelacao'){
    const st=skSigStars(),P=st.pts,L=st.edges;
    const lines=L.map(([a,b],k)=>`<line class="sk-ln" data-a="${a}" data-b="${b}" style="--i:${Math.max(a,b)}" x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}"/>`).join('');
    const stars=P.map((p,i)=>`<circle class="sk-halo" style="--i:${i}" cx="${p[0]}" cy="${p[1]}" r="14"/><circle class="sk-st" style="--i:${i}" cx="${p[0]}" cy="${p[1]}" r="2.6"/>`).join('');
    h=`<div class="sk-stage sk-con"><div class="sk-cap">${en?'VAULT SIGNATURE':'ASSINATURA DO COFRE'}</div><svg class="sk-sky" viewBox="0 0 340 300" role="img" aria-label="${en?'Vault signature: a golden constellation of eight stars':'Assinatura do cofre: constelação dourada de oito estrelas'}">${lines}${stars}</svg>${skSealHtml()}</div>
      <div class="sk-txt"><div class="sk-brand"><i aria-hidden="true"></i><span>AURORA VAULT</span><i aria-hidden="true"></i></div><p class="sk-hint" id="sk-hint">${st.known?(en?'These are your vault’s stars.<br>If you don’t recognise them, don’t type anything.':'Estas são as estrelas do teu cofre.<br>Se não as reconheceres, não escrevas nada.'):(en?'The stars light up as you type.':'As estrelas acendem-se enquanto escreves.')}</p></div>`;
  }else if(kind==='joia'){
    const sig=skGet('av_sig',''),known=/^[0-9a-f]{32}$/.test(sig);
    h=`<div class="sk-stage sk-joia"><button type="button" class="sk-gem-btn" id="sk-seal" data-act="skSealTap">${skGemBuild(sig)}</button></div>
      <div class="sk-txt"><div class="sk-brand"><i aria-hidden="true"></i><span>AURORA VAULT</span><i aria-hidden="true"></i></div>${known?`<div class="sk-serial">${en?'CUT':'LAPIDAÇÃO'} Nº ${sig.slice(0,4).toUpperCase()}</div>`:''}<p class="sk-hint" id="sk-hint"></p></div>`;
  }else{
    const m=avSkin()==='safira'?['#5f6c8c','#97a4c4','#e3e9f8']:['#8a6e2f','#c9a84c','#f3dfa2'];
    let bars='';for(let i=0;i<28;i++)bars+=`<i style="--h:${Math.round(4+3*Math.sin(Math.PI*(i+.5)/28))}px;--c:${[m[0],m[1],m[2],'#d9ccff','#bfe3ff','#bdf5e2','#d9ccff',m[2],m[1],m[0]][Math.floor(i/28*10)]}"></i>`;
    const known=!!(skGet('av_sig',''));
    h=`<div class="sk-stage sk-aur"><button type="button" class="sk-orb" id="sk-seal" data-act="skSealTap"><span class="sk-orb-glow" aria-hidden="true"></span><span class="sk-orb-core" aria-hidden="true"><span class="sk-orb-flow"></span><span class="sk-orb-shine"></span></span></button></div>
      <div class="sk-txt"><div class="sk-hello">${known?(en?'Hello again.':'Olá de novo.'):(en?'Hello.':'Olá.')}</div><p class="sk-hint" id="sk-hint">${en?'I’m Aurora. Tell me the password<br>and I’ll open your vault.':'Sou a Aurora. Diz-me a palavra-passe<br>e eu abro o teu cofre.'}</p><div class="sk-bars" id="sk-bars" aria-hidden="true">${bars}</div></div>`;
  }
  art.innerHTML=h;
  skTyped=0;skSealState();skTypeFx();
  const ls=document.getElementById('lock-screen'),live=kind==='joia'&&ls&&ls.style.display!=='none';
  skGemSensors(live);if(live)skGemAmbient();
}
function skHint(kind,bio){
  const en=skEn(),touch=!window.matchMedia||matchMedia('(pointer:coarse)').matches;
  if(kind==='lanterna')return bio?(en?'Tap the seal to unlock.':'Toca no selo para entrar.'):touch?(en?'Run your finger over the engraving.':'Passa o dedo pela gravura.'):(en?'Move the mouse over the engraving.':'Passa o rato pela gravura.');
  if(/^[0-9a-f]{32}$/.test(skGet('av_sig','')))return bio?(en?'This is your vault’s jewel.<br>Tap it to unlock.':'Esta é a joia do teu cofre.<br>Toca-lhe para entrar.'):(en?'This is your vault’s jewel.<br>If you don’t recognise it, don’t type anything.':'Esta é a joia do teu cofre.<br>Se não a reconheceres, não escrevas nada.');
  return bio?(en?'Tap the jewel to unlock.':'Toca na joia para entrar.'):touch&&SKG.can?(en?'Tilt your phone: the jewel catches the light.':'Inclina o telemóvel: a joia apanha a luz.'):touch?(en?'The jewel lights up as you type.':'A joia ganha luz enquanto escreves.'):(en?'Move the mouse: the jewel catches the light.':'Mexe o rato: a joia apanha a luz.');
}
// O selo: com impressão digital disponível pede-a já (é o toque que o browser exige); senão leva ao campo certo
function skSealState(){
  const b=document.getElementById('sk-seal');if(!b)return;
  const en=skEn(),bio=typeof lockOnPwStep==='function'&&lockOnPwStep()&&typeof unlockMode!=='undefined'&&unlockMode==='bio'&&!lockedOut;
  b.setAttribute('aria-label',bio?(en?'Unlock with fingerprint':'Entrar com a impressão digital'):(en?'Type the master password':'Escrever a palavra-passe mestra'));
  b.classList.toggle('bio',!!bio);
  const ls=document.getElementById('lock-screen');if(ls)ls.classList.toggle('sk-bio',!!bio);
  const h=document.getElementById('sk-hint'),art=document.getElementById('sk-art');
  if(h&&art&&(art.dataset.kind==='lanterna'||art.dataset.kind==='joia'))h.innerHTML=skHint(art.dataset.kind,bio);
}
function skSealTap(){
  if(typeof lockedOut!=='undefined'&&lockedOut)return;
  if(lockOnPwStep()){
    if(unlockMode==='bio'){if(lockSwipeNeed)return lockSwipeGo();return lockBioStart();}
    const el=document.getElementById(unlockMode==='pin'?'pin-input':'master-pw');if(el)el.focus();return;
  }
  const nw=document.getElementById('login-state-new');
  const el=document.getElementById(nw&&nw.style.display!=='none'?'new-pw1':'start-pw');if(el)el.focus();
}
// Reage ao que se escreve (só o número de caracteres — nunca o conteúdo)
function skTypeFx(){
  const art=document.getElementById('sk-art');if(!art)return;
  const n=skTyped;
  if(art.dataset.kind==='constelacao'){
    art.querySelectorAll('.sk-st').forEach((c,i)=>c.classList.toggle('lit',n>i));
    art.querySelectorAll('.sk-halo').forEach((c,i)=>c.classList.toggle('lit',n>i));
    art.querySelectorAll('.sk-ln').forEach(l=>l.classList.toggle('lit',n>+l.dataset.a&&n>+l.dataset.b));
  }else if(art.dataset.kind==='aurora'){
    art.classList.toggle('typing',n>0);
    const bars=art.querySelectorAll('.sk-bars i'),N=bars.length,seed=(n*7919)%97;
    bars.forEach((b,i)=>{const env=Math.sin(Math.PI*(i+.5)/N);b.style.setProperty('--h',Math.round(n?6+env*(12+((seed*(i+7)+n*13)%34)):4+3*env)+'px');});
  }else if(art.dataset.kind==='joia')skGemPaint();
}
document.addEventListener('input',e=>{
  const id=e.target&&e.target.id;
  if(!skNew()||!['start-pw','master-pw','pin-input','new-pw1'].includes(id))return;
  skTyped=Math.min(40,(e.target.value||'').length);skTypeFx();
},true);
// Lanterna: a luz segue o dedo / o rato (no máximo 1× por fotograma)
(function(){
  let raf=0,px=0,py=0;
  const move=e=>{
    const art=document.getElementById('sk-art');if(!art||art.dataset.kind!=='lanterna'||skMotion()==='desligado')return;
    const st=art.querySelector('.sk-lan');if(!st)return;
    const r=st.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;
    if(raf)return;raf=requestAnimationFrame(()=>{raf=0;st.style.setProperty('--mx',px+'px');st.style.setProperty('--my',py+'px');st.classList.add('hand');});
  };
  document.addEventListener('pointermove',e=>{const ls=document.getElementById('lock-screen');if(ls&&ls.style.display!=='none'&&skNew())move(e);},{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')move(e);},{passive:true});
})();
// Atualiza o selo quando o modo de desbloqueio muda
if(typeof applyUnlockMode==='function'){const _skAum=applyUnlockMode;applyUnlockMode=function(){const r=_skAum.apply(this,arguments);try{skTyped=0;skTypeFx();skSealState();}catch(e){}return r;};}
if(typeof lockShowPwStep==='function'){const _skSps=lockShowPwStep;lockShowPwStep=function(){const r=_skSps.apply(this,arguments);try{skTyped=0;skTypeFx();skSealState();}catch(e){}return r;};}
if(typeof lockApp==='function'){const _skLa=lockApp;lockApp=function(){const r=_skLa.apply(this,arguments);try{if(typeof avNudgeClose==='function')avNudgeClose();skTyped=0;skArtBuild();}catch(e){}return r;};} // a sugestão aberta não fica por cima do ecrã de entrada
// Uma vez por dispositivo, depois da atualização: onde se escolhe o aspeto (o Clássico continua lá)
function skIntro(){
  if(skGet('av_skin_intro','')==='2'||(typeof presentationMode!=='undefined'&&presentationMode))return;
  const en=skEn(),mine=avSkin()==='safira';
  // quem já tinha escolhido outro estilo fica com ele: só recebe o convite para experimentar
  if(!mine&&typeof avNudge==='function'&&avNudgesOn()){if(!SKG.inv){SKG.inv=true;setTimeout(()=>skInvite(0),6500);}return;}
  skSet('av_skin_intro','2');
  setTimeout(()=>{try{
    const t2=document.getElementById('toast');if(!t2)return;
    t2.textContent=mine?(en?'✨ New look: Sapphire & Platinum. The other styles are still in Settings → Appearance.':'✨ Aspeto novo: Safira & Platina. Os outros estilos continuam em Definições → Aspeto.')
      :(en?'✨ New style, Sapphire & Platinum, in Settings → Appearance.':'✨ Estilo novo, Safira & Platina, em Definições → Aspeto.');
    t2.classList.add('show');clearTimeout(_toastT);_toastT=setTimeout(()=>t2.classList.remove('show'),7000);}catch(e){}},1800);
}
// o convite espera a vez: não atropela outro aviso (o resumo da semana aparece aos 5 s) nem a apresentação
function skInvite(tries){
  try{
    SKG.inv=false;
    if(!masterKey||avSkin()==='safira'||skGet('av_skin_intro','')==='2')return;
    const n=document.getElementById('av-nudge');
    if(((n&&n.classList.contains('show'))||(typeof AVT!=='undefined'&&AVT.on))&&tries<30){SKG.inv=true;setTimeout(()=>skInvite(tries+1),2500);return;}
    skSet('av_skin_intro','2');
    const en=skEn();
    avNudge(en?'New style: <b>Sapphire &amp; Platinum</b>, with a jewel that belongs to your vault alone.':'Estilo novo: <b>Safira &amp; Platina</b>, com uma joia que é só do teu cofre.',
      [{label:en?'Try it':'Experimentar',fn:()=>{setEntryStyle('joia');setSkin('safira');}}],16000);
  }catch(e){}
}
if(typeof doUnlock==='function'){const _skDu=doUnlock;doUnlock=function(){try{skSaveSig();skIntro();skGemOpen();}catch(e){}return _skDu.apply(this,arguments);};}

/* ── Interior: menu lateral no PC, barra de baixo no telemóvel (com a Aurora ao centro) ── */
function skDecorate(){
  const d=document.getElementById('grp-dash-txt');if(d)d.textContent=skDashLabel();
  const lg=document.querySelector('.topbar-logo');if(lg)lg.textContent=skNew()?'AURORA VAULT':'⬡ AURORA VAULT';
  skNavBuild();skNavSync();
}
const SK_NAV=[['dashboard','home'],['cofre','vault'],['aurora','aur'],['totp','totp'],['more','more']];
const SK_ICO={
  home:'<path d="M4 11l8-7 8 7v9H4z"/>',
  vault:'<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  totp:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/>',
  more:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  aur:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>'
};
function skNavBuild(){
  let nav=document.getElementById('sk-bnav');
  if(!skNew()){if(nav)nav.remove();return;}
  if(nav)return skNavLabels();
  const app=document.getElementById('app');if(!app)return;
  nav=document.createElement('nav');nav.id='sk-bnav';nav.className='sk-bnav';
  nav.innerHTML=SK_NAV.map(([k,ic])=>k==='aurora'
    ?`<button type="button" class="sk-bn-aur" data-act="auroraOpen" data-k="aurora"><span><svg viewBox="0 0 24 24" aria-hidden="true">${SK_ICO.aur}</svg></span></button>`
    :`<button type="button" class="sk-bn" data-k="${k}" data-act="${k==='more'?'skMoreOpen':k==='totp'?'switchTab':'switchGroup'}" data-arg="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${SK_ICO[ic]}</svg><span></span></button>`).join('');
  app.appendChild(nav);skNavLabels();
}
function skNavLabels(){
  const nav=document.getElementById('sk-bnav');if(!nav)return;const en=skEn();
  const L={dashboard:en?'Home':'Início',cofre:en?'Vault':'Cofre',totp:'2FA',more:en?'More':'Mais'};
  nav.setAttribute('aria-label',en?'Main navigation':'Navegação principal');
  nav.querySelectorAll('.sk-bn').forEach(b=>{b.querySelector('span').textContent=L[b.dataset.k];});
  const a=nav.querySelector('.sk-bn-aur');if(a)a.setAttribute('aria-label',en?'Open Aurora AI':'Abrir a Aurora AI');
}
function skNavSync(cur){
  const nav=document.getElementById('sk-bnav');if(!nav)return;
  const tab=cur||(typeof avCurTab!=='undefined'?avCurTab:'dashboard'),g=typeof groupOfTab==='function'?groupOfTab(tab):'dashboard';
  const k=tab==='totp'?'totp':g==='dashboard'?'dashboard':g==='cofre'?'cofre':'more';
  nav.querySelectorAll('.sk-bn').forEach(b=>{const on=b.dataset.k===k;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
}
if(typeof renderTabNav==='function'){const _skRtn=renderTabNav;renderTabNav=function(tab){const r=_skRtn.apply(this,arguments);try{skNavSync(tab);}catch(e){}return r;};}
if(typeof setLang==='function'){const _skSl=setLang;setLang=function(){const r=_skSl.apply(this,arguments);try{skDecorate();skArtBuild();skRenderSettings();}catch(e){}return r;};}

// «Mais»: as outras áreas e atalhos, numa folha que sobe de baixo
function skMoreOpen(){
  let ov=document.getElementById('sk-more-overlay');
  if(!ov){ov=document.createElement('div');ov.id='sk-more-overlay';ov.className='modal-overlay sk-more';ov.dataset.act='skMoreClose';ov.setAttribute('data-self','');document.body.appendChild(ov);}
  const en=skEn(),hid=typeof avHiddenTabs==='function'?avHiddenTabs():[];
  const g=[['cards','💳',en?'Cards':'Cartões'],['docs','📁',en?'Documents':'Documentos'],['bens','🏠',en?'Assets & dates':'Bens e datas'],['archive','📦',en?'Archive':'Arquivo']].filter(x=>!hid.includes(x[0])&&document.getElementById('grp-btn-'+x[0]));
  const it=(act,arg,ic,l)=>`<button type="button" class="sk-more-it" data-act="skMoreGo" data-arg="${act}" data-arg2="${arg}"><span aria-hidden="true">${ic}</span>${l}</button>`;
  ov.innerHTML=`<div class="modal sk-more-sheet" role="dialog" aria-modal="true" aria-label="${en?'More':'Mais'}"><div class="sk-more-h">${en?'More':'Mais'}</div>
    <div class="sk-more-grid">${g.map(x=>it('switchGroup',x[0],x[1],x[2])).join('')}</div>
    <div class="sk-more-grid sk-more-2">${it('openCalendar','','📅',en?'Calendar':'Calendário')}${it('openSettings','','⚙️',en?'Settings':'Definições')}${it('togglePrivacy','','👁️',en?'Privacy':'Privacidade')}${it('lockApp','','🔒',en?'Lock':'Trancar')}</div>
    <button type="button" class="btn btn-ghost sk-more-x" data-act="skMoreClose">${en?'Close':'Fechar'}</button></div>`;
  ov.classList.add('open');
  setTimeout(()=>{const f=ov.querySelector('.sk-more-it');if(f)f.focus({preventScroll:true});},40);
}
function skMoreClose(){const ov=document.getElementById('sk-more-overlay');if(ov&&ov.classList.contains('open')){ov.classList.remove('open');const b=document.querySelector('#sk-bnav [data-k="more"]');if(b&&document.activeElement&&ov.contains(document.activeElement))b.focus({preventScroll:true});}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')skMoreClose();});
function skMoreGo(fn,arg){skMoreClose();const f=avFn(fn);if(f)setTimeout(()=>arg?f(arg):f(),30);}

try{skDecorate();skArtBuild();}catch(e){console.warn('Estilos:',e);}
