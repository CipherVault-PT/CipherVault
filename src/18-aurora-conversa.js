
/* ═══════════ AURORA · CONVERSA ═══════════
   Seguimentos («e do netflix?», «e em julho?»), pronomes («copia-a»), pedidos compostos
   («mostra o gmail e depois copia a password»), escolhas por ordem («o segundo») e «repete». */
const AURC={ctx:null,depth:0,chips:null};
const AURC_TTL=15*60e3;
const AURC_PER=/\b(?:(?:em|no mes de|in|de|para|for) )?(?:janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december)(?: (?:de )?\d{4})?\b|\b(?:(?:em|no|na|neste|nesta|para o|para a|in|for) )?(?:este|esta|esse|essa|proximo|proxima|ultimo|ultima|this|next|last) (?:mes|ano|semana|month|year|week)\b|\b(?:(?:no|na) )?(?:mes|ano) passado\b|\b(?:na )?semana passada\b|\b(?:(?:nos|nas|in the|for the|within the) )?(?:proximos|proximas|ultimos|ultimas|next|last|past) \d+ (?:dias|semanas|meses|anos|days|weeks|months|years)\b|\b(?:daqui a|dentro de|in) \d+ (?:dias|semanas|meses|anos|days|weeks|months|years)\b|\b(?:por|per|a|ao|every) (?:dia|semana|mes|ano|day|week|month|year)\b|\b(?:mensal|anual|mensalmente|anualmente|monthly|yearly|annually)\b|\b(?:hoje|amanha|today|tomorrow)\b|\b(?:em|in) \d{4}\b/g;
const AURC_ORD={primeiro:0,primeira:0,first:0,segundo:1,segunda:1,second:1,terceiro:2,terceira:2,third:2,quarto:3,quarta:3,fourth:3,quinto:4,quinta:4,fifth:4,sexto:5,sexta:5,sixth:5};
function aurcNorm(s){return aurNumWords(aurCanon(s));}
function aurcRest(n,re){return n.replace(re,' ').split(' ').filter(t=>t&&!AUR_STOP.has(t));}

// fala o que aconteceu por último: guarda o pedido e a entidade de que se falou
function aurcOne(q,base){
  const before=AUR.last;let r;
  AURC.depth++;try{r=base(q);}finally{AURC.depth--;}
  const F=aurFrame(q);
  if(!F.yes&&!F.no&&!/^(repete|outra vez|de novo|again|repeat)$/.test(F.n)&&(F.hasAction||F.hasDomain||F.confident||F.fields.length||F.terms.length)){
    const ent=AUR.last&&AUR.last!==before?AUR.last:F.confident?F.best:null;
    AURC.ctx={q,n:aurcNorm(q),F,ent,at:Date.now()};
  }
  return r;
}
function aurcCtx(){const c=AURC.ctx;return c&&Date.now()-c.at<AURC_TTL?c:null;}
function aurcEnt(){const c=aurcCtx();return (c&&c.ent)||null;}

// «copia-a», «a password dele», «apaga isso» → junta o nome daquilo de que se falou
function aurcPronoun(raw){
  const ent=aurcEnt();if(!ent||!ent.name)return raw;
  const clit=/([a-zà-ú])-(o|a|os|as|lo|la|los|las)\b/i;
  const n=aurCanon(raw);
  if(/^(nao|no|nope|errado|wrong)\b/.test(n))return raw;   // «não era isso» é uma correção, não um pronome
  if(!clit.test(raw)&&!/\b(dele|dela|deles|delas|desse|dessa|deste|desta|nele|nela|nesse|nessa|isso|essa|esse|it|its|that one|this one)\b/.test(n))return raw;
  const F=aurFrame(raw.replace(clit,'$1'));
  if(F.yes||F.no||F.confident)return raw;
  return raw.replace(clit,'$1')+' '+ent.name;
}

// «e do netflix?», «e em julho?», «e o cvv?», «and for netflix?»
function aurcFollow(raw){
  const c=aurcCtx();if(!c)return null;
  const n=aurcNorm(raw);
  const m=n.match(/^(?:e entao|entao e|e quanto a|e sobre|e para|and what about|what about|how about|and|e)\s+(.+)$/);if(!m)return null;
  let rest=m[1].trim();
  if(!rest||rest.split(' ').length>7)return null;
  const R=aurFrame(rest);
  if(R.hasAction&&![...R.c].every(x=>!AUR_ACTIONS.has(x)||/^(GET|WHEN|HOWMUCH|COUNT)$/.test(x)))return null;
  // 1) outro período: troca o período do pedido anterior
  const per=rest.match(AURC_PER);
  if(per&&!aurcRest(rest,AURC_PER).some(t=>!/^(e|and)$/.test(t)))return (c.n.replace(AURC_PER,' ')+' '+per.join(' ')).replace(/\s+/g,' ').trim();
  rest=rest.replace(/^(o|a|os|as|do|da|dos|das|de|no|na|nos|nas|ao|the|for|of|to|with)\s+/,'');
  const lead=(c.n.match(/^(quanto \S+|quantos|quantas|qual e|qual|quais sao|quais|quando e|quando|onde|how much|how many|what is|what s|whats|what|when is|when|where is|where)\b/)||[])[0]||aurL('qual','what is');
  const ent=c.ent;
  // 2) outra entidade (conta, cartão, documento…) com o mesmo pedido
  if(R.best&&R.best.score>=0.5&&(!ent||R.best.obj!==ent.obj)){
    const drop=new Set([...(c.F.best&&c.F.best.score>=0.5?c.F.best.toks:[]),...c.F.terms]);
    if(drop.size)return c.n.split(' ').filter(t=>!drop.has(t)).join(' ')+' '+rest;
    return c.n+' '+rest;
  }
  // 3) outro dado da mesma coisa: «e o utilizador?», «e o cvv?», «e o seguro?»
  if(ent&&ent.name&&!R.fields.length&&aurcRest(rest,/$^/).length<=3)
    return lead+' '+rest+' '+aurNorm(ent.name);
  // 4) outro assunto com a mesma pergunta: «quanto gasto em subscrições» → «e em combustível?»
  if(R.hasDomain||R.fields.length)return lead+' '+m[1];
  // 5) outra palavra-chave (ex.: outra empresa nas faturas)
  if(c.F.terms.length){const drop=new Set(c.F.terms);return c.n.split(' ').filter(t=>!drop.has(t)).join(' ')+' '+rest;}
  return null;
}

// «gera uma password forte e guarda-a no netflix» → muda (ou cria) a conta com uma password nova
function aurcGenSave(raw){
  const n=aurcNorm(raw.replace(/([a-zà-ú])-(o|a|la|lo)\b/gi,'$1'));
  const m=n.match(/^(?:gera|gerar|cria|criar|faz|inventa|generate|create|make)\b(.*\bpassword\b.*?)\b(?:e|and)\s+(?:guarda|guardar|poe|por|mete|meter|usa|usar|aplica|aplicar|coloca|colocar|save|put|use|set)\b(?:\s+(?:ela|essa|isso|it))?\s+(?:no|na|nos|nas|em|para o|para a|para|in|on|for|to)\s+(.+)$/);
  if(!m)return null;
  const len=+((m[1].match(/\b(\d{1,2})\b/)||[])[1]||0)||20;
  const target=m[2].replace(/\b(conta|acesso|account)\b/g,'').trim();if(!target)return null;
  const F=aurFrame(target);
  const V=F.cands.filter(e=>e.type==='vault'&&e.score>=0.5);
  const pw=aurGenPw(len);
  if(V.length===1||(V.length&&F.confident&&F.best.type==='vault')){
    const v=V[0].obj;
    AUR.pending={ok:()=>aurSetPw(v,pw)};
    return aurSay(aurL('🔐 Gerei uma password forte com '+len+' caracteres para <b>','🔐 I generated a strong '+len+'-character password for <b>')+aurEsc(v.name)+aurL('</b>. Substituo a atual? (a antiga fica no histórico)','</b>. Replace the current one? (the old one stays in the history)'),aurConfirmChips());
  }
  if(V.length>1)return aurChoose(V,F,aurL('Em que conta guardo a password nova?','Which account should get the new password?'),e=>{AUR.pending={ok:()=>aurSetPw(e.obj,pw)};return aurSay(aurL('Substituo a password de <b>','Replace the password for <b>')+aurEsc(e.name)+'</b>?',aurConfirmChips());});
  return aurConfirmAdd({name:aurCap(raw.replace(/^[\s\S]*\s(?:no|na|em|para|in|on|for|to)\s+/i,'').replace(/[?.!]+$/,'').trim()),user:'',pw});
}

// nos passos seguintes de um pedido composto, «copia a password» refere-se ao que acabou de ser aberto
function aurcInherit(s){
  const p=aurcPronoun(s);if(p!==s)return p;
  const ent=aurcEnt();if(!ent||!ent.name)return s;
  const F=aurFrame(s);
  return F.confident||F.cands.some(e=>e.score>=0.5)||F.fields.length?s:s+' '+ent.name;
}
// divide «faz X e depois Y» / «faz X e faz Y» em passos
function aurcSplit(raw){
  const parts=raw.split(/\s*(?:;|,?\s+(?:e depois|e a seguir|e em seguida|depois disso|and then|after that)\s+)\s*/i).filter(s=>s.trim());
  const out=[];
  parts.forEach(p=>{
    // « e », «depois», «then» só separam quando a parte seguinte começa por um verbo de ação
    const bits=p.split(/(,?\s+(?:e|and|depois|then)\s+)/i);let cur=bits[0];
    for(let i=2;i<bits.length;i+=2){
      const w=aurNorm(bits[i].split(/\s+/)[0]).replace(/-(o|a|os|as|lo|la|los|las|me|lhe)$/,'');
      const act=(AUR_VOCAB[w]||[]).some(x=>AUR_ACTIONS.has(x)&&x!=='GET'&&x!=='WHEN'&&x!=='HOWMUCH');
      if(act&&aurFrame(cur).hasAction){out.push(cur);cur=bits[i];}else cur+=bits[i-1]+bits[i];
    }
    out.push(cur);
  });
  return out.map(s=>s.trim()).filter(Boolean);
}
function aurcRun(steps,base,first=true){
  while(steps.length){
    const s=steps.shift();
    aurcOne(first?aurcPronoun(s):aurcInherit(s),base);first=false;
    if(AUR.pending&&steps.length){
      const p=AUR.pending,rest=steps.slice();
      if(p.ok){const ok=p.ok;p.ok=()=>{const r=ok();aurcRun(rest,base,false);return r;};}
      if(p.withText){const wt=p.withText;p.withText=(t,F)=>{const r=wt(t,F);if(!AUR.pending)aurcRun(rest,base,false);return r;};}
      aurSay('<span class="a-dim">'+aurL('Depois disto: ','After this: ')+rest.map(x=>'«'+aurEsc(x)+'»').join(', ')+'</span>');
      return true;
    }
  }
  return true;
}

(function(){
  const say=aurSay,open=aurOpenEnt;
  aurSay=function(html,chips,cls){if(!cls||cls==='ai'){const l=(chips||[]).filter(Boolean);AURC.chips=l.length?l:null;}return say(html,chips,cls);};
  aurOpenEnt=function(e,F,o){if(e&&e.obj)AUR.last=e;return open(e,F,o);};
  aurStage('conversa',30,(raw,base)=>{
    raw=(raw||'').trim();if(!raw)return;
    if(AURC.depth)return base(raw);
    if(AUR.pending){AURC.depth++;try{return base(raw);}finally{AURC.depth--;}}
    const n=aurcNorm(raw);
    // «o segundo», «a 2», «o último» → escolhe da última lista de botões
    const om=n.match(/^(?:(?:o|a|e|and|the|numero|n|opcao|option)\s+)*(primeiro|primeira|segundo|segunda|terceiro|terceira|quarto|quarta|quinto|quinta|sexto|sexta|ultimo|ultima|first|second|third|fourth|fifth|sixth|last|[1-8])(?:\s+(?:opcao|option|one|conta|documento|da lista))?$/);
    if(om&&AURC.chips){const L=AURC.chips,i=/^\d$/.test(om[1])?+om[1]-1:/^(ultimo|ultima|last)$/.test(om[1])?L.length-1:AURC_ORD[om[1]];if(L[i]){AURC.chips=null;L[i].fn();return true;}}
    if(/^(repete|repetir|outra vez|de novo|mais uma vez|again|repeat|repeat that|once more)$/.test(n)){const c=aurcCtx();if(c)return aurcOne(c.q,base);}
    const gs=aurcGenSave(raw);if(gs)return gs;
    const f=aurcFollow(raw);if(f)return aurcOne(f,base);
    const steps=aurcSplit(raw);
    if(steps.length>1)return aurcRun(steps,base);
    return aurcOne(aurcPronoun(raw),base);
  });
})();
