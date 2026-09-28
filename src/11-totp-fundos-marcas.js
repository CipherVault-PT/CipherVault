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

