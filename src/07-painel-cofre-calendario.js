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

