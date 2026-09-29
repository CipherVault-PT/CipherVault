
/* ═══════════ AURORA · MEMÓRIA ═══════════
   A Aurora aprende contigo: escolhes duas vezes a mesma conta para «banco» → passa a assumi-la;
   alcunhas («chama trabalho ao Intranet Empresa»); correções («não, eu queria a Revolut»).
   Guarda-se dentro do cofre (encriptado, vai com ele para o Drive/outros dispositivos). */
function aurMem(){
  if(typeof payloadExtras==='undefined')return {alias:{},picks:{}};
  const m=payloadExtras.aurMem=payloadExtras.aurMem||{};
  m.alias=m.alias||{};m.picks=m.picks||{};
  return m;
}
function aurMemSave(){if(typeof markUnsaved==='function')markUnsaved();}
const AUR_MEM_SKIP=new Set([...AUR_ACTIONS,'D_PW','MINE','ALL','NUM','MOD_STRONG','MOD_MEM','HELLO','THANKS','YES','NO']);
// palavras do pedido que identificam «qual» (ex.: «password do banco» → «banco»)
function aurMemKey(F){
  const T=F.Q.filter(t=>t.length>=2&&!/^\d+$/.test(t)&&!AUR_STOP.has(t)&&!(AUR_VOCAB[t]&&AUR_VOCAB[t].every(c=>AUR_MEM_SKIP.has(c)))&&!/^(qual|quais|user|utilizador|username|login|email|pin|cvv|codigo|numero|mostra|abre|copia|diz|da|dame|conta|acesso|entrada|nao|queria|era|eu)$/.test(t));
  return [...new Set(T)].sort().join(' ');
}
function aurMemEnt(a){if(!a)return null;return aurIndex().find(e=>e.type===a.type&&e.obj&&e.obj.id===a.id)||null;}
function aurMemSet(key,e,how){
  if(!key||!e||!e.obj||!e.obj.id)return false;
  const m=aurMem();m.alias[key]={type:e.type,id:e.obj.id,name:e.name,how,at:Date.now()};delete m.picks[key];aurMemSave();
  return true;
}
function aurMemForget(key){const m=aurMem();const had=!!m.alias[key]||!!(m.words&&m.words[key]);delete m.alias[key];delete m.picks[key];if(m.words)delete m.words[key];if(had)aurMemSave();return had;}
function aurMemNote(key,e){return '<span class="a-dim">💡 '+aurL('Aprendi: quando disseres «'+aurEsc(key)+'» uso <b>'+aurEsc(e.name)+'</b>. (Diz «esquece '+aurEsc(key)+'» para desfazer.)','Learned: when you say “'+aurEsc(key)+'” I’ll use <b>'+aurEsc(e.name)+'</b>. (Say “forget '+aurEsc(key)+'” to undo.)')+'</span>';}

// escolher numa lista: à segunda vez igual, aprende
function aurMemPick(F,e){
  if(!F||!F.c||['DELETE','ARCHIVE','RESTORE','EMPTY'].some(x=>F.c.has(x))||!e||!e.obj||!e.obj.id)return;
  const key=aurMemKey(F);if(!key||key.split(' ').length>3)return;
  const m=aurMem(),p=m.picks[key];
  if(p&&p.type===e.type&&p.id===e.obj.id){if(aurMemSet(key,e,'pick'))setTimeout(()=>aurSay(aurMemNote(key,e)),0);}
  else{m.picks[key]={type:e.type,id:e.obj.id};aurMemSave();}
}

(function(){
  // aplicar o que aprendeu: a entidade da alcunha passa a ser a escolha certa
  AUR_FRAME_HOOKS.push(F=>{
    let A;try{A=aurMem().alias;}catch(e){return;}
    const keys=Object.keys(A).sort((a,b)=>b.split(' ').length-a.split(' ').length);
    for(const k of keys){
      const kt=k.split(' ');if(!kt.every(t=>F.Qset.has(t)))continue;
      // um nome escrito no pedido ganha sempre à alcunha («banco santander» → Santander)
      if(F.cands.some(e=>e.score>=0.5&&e.toks.some(t=>F.Qset.has(t)&&!kt.includes(t))))continue;
      const e=aurMemEnt(A[k]);if(!e)continue;
      const c=Object.assign({},e,{score:1.5,mem:k});
      F.cands=[c,...F.cands.filter(x=>x.obj!==e.obj)];F.best=c;F.confident=true;
      F.terms=F.terms.filter(t=>!kt.includes(t));
      if(e.type==='person')F.persons=[c];
      break;
    }
  });
  // escolhas feitas nas listas da Aurora
  const choose=aurChoose;
  aurChoose=function(cs,F,title,fn){
    return choose(cs,F,title,e=>{const r=fn?fn(e):aurOpenEnt(e,F,F.c.has('OPEN'));aurMemPick(F,e);return r;});
  };
})();

aurPre('memoria',400,F=>{
  const n=F.n;
  // «o que aprendeste?», «esquece banco», «esquece tudo o que aprendeste»
  if(!/^(esquece|esquecer|forget)\b/.test(n)&&/\b(o que (aprendeste|sabes de mim|memorizaste)|que alcunhas|as minhas alcunhas|what have you learn(ed|t)|what did you learn)\b/.test(n)){
    const A=Object.assign({},aurMem().alias),W=typeof avAliases==='function'?avAliases():{};
    Object.keys(W).forEach(k=>{if(!A[k])A[k]={name:W[k],word:true};});
    const K=Object.keys(A).sort();
    if(!K.length)return aurSay(aurL('Ainda não aprendi nada. Quando escolheres a mesma opção duas vezes, ou disseres «chama X a Y», eu lembro-me.','I haven’t learned anything yet. When you pick the same option twice, or say “call Y X”, I’ll remember.'));
    return aurSay('🧠 '+aurL('O que aprendi contigo:','What I learned from you:')+'\n'+K.map(k=>'• «'+aurEsc(k)+'» → <b>'+aurEsc(((!A[k].word&&aurMemEnt(A[k]))||A[k]).name)+'</b>').join('\n'),K.slice(0,6).map(k=>({label:aurL('Esquecer «','Forget “')+k+aurL('»','”'),fn:()=>{aurMemForget(k);return aurSay(aurL('Ok, esqueci «'+aurEsc(k)+'».','Ok, forgot “'+aurEsc(k)+'”.'));}})));
  }
  const fg=n.match(/^(?:esquece|esquecer|forget|apaga a alcunha|remove a alcunha)\s+(?:o que aprendeste sobre |a alcunha |about |the nickname )?["«]?(.+?)["»]?$/);
  if(fg){
    if(/^(tudo|tudo o que aprendeste|everything|all)$/.test(fg[1])){const m=aurMem();m.alias={};m.picks={};m.words={};aurMemSave();return aurSay(aurL('🧹 Esqueci tudo o que tinha aprendido.','🧹 I forgot everything I had learned.'));}
    const key=aurMemKey(aurFrame(fg[1]))||fg[1];
    if(aurMemForget(key))return aurSay(aurL('Ok, esqueci «'+aurEsc(key)+'».','Ok, forgot “'+aurEsc(key)+'”.'));
    if(aurMem().alias[fg[1]]||(aurMem().words||{})[fg[1]]){aurMemForget(fg[1]);return aurSay(aurL('Ok, esqueci «'+aurEsc(fg[1])+'».','Ok, forgot “'+aurEsc(fg[1])+'”.'));}
    return AUR_PASS;
  }
  // alcunhas: «chama trabalho ao intranet empresa», «quando digo banco quero dizer a revolut», «when i say bank i mean revolut»
  const nk=n.match(/^(?:chama|chamar|da o nome|podes chamar)\s+["«]?(.+?)["»]?\s+(?:ao|a|à|as|aos|para o|para a)\s+(.+)$/)
    ||n.match(/^quando (?:eu )?(?:digo|disser|escrevo|escrever|falo em|falo de|peco)\s+["«]?(.+?)["»]?\s+(?:quero dizer|e|refiro me a|estou a falar d[oa]|e sempre|significa)\s+(?:o |a |os |as |do |da )?(.+)$/)
    ||n.match(/^when i say\s+["“]?(.+?)["”]?\s+i mean\s+(?:the |my )?(.+)$/);
  if(nk){
    const T=aurFrame(nk[2]),e=T.confident?T.best:null;
    if(!e)return aurSay(aurL('Não encontrei «'+aurEsc(nk[2])+'» no cofre para lhe dar essa alcunha.','I couldn’t find “'+aurEsc(nk[2])+'” in your vault to nickname.'));
    const key=aurMemKey(aurFrame(nk[1]))||aurNorm(nk[1]);
    aurMemSet(key,e,'nick');
    return aurSay(aurL('👍 Combinado: «<b>'+aurEsc(key)+'</b>» passa a ser <b>'+aurEsc(e.name)+'</b>. Experimenta «password do '+aurEsc(key)+'».','👍 Deal: “<b>'+aurEsc(key)+'</b>” now means <b>'+aurEsc(e.name)+'</b>.'));
  }
  // correções: «não, eu queria a revolut», «não, era o netflix», «no, i meant revolut»
  const cm=n.match(/^(?:nao|nope|no|errado|wrong|enganaste te)\s+(?:(?:eu\s+)?(?:queria|quis|quero|referia me a|refiro me a|pedi|disse|era|e|i meant|i wanted|meant)\s+)?(?:o |a |os |as |do |da |the )?(.+)$/);
  if(cm&&typeof AURC!=='undefined'&&AURC.ctx&&Date.now()-AURC.ctx.at<AURC_TTL){
    const T=aurFrame(cm[1]),e=T.confident?T.best:null;if(!e)return AUR_PASS;
    const ctx=AURC.ctx,key=aurMemKey(ctx.F);
    const was=ctx.ent,named=was&&key&&key.split(' ').every(t=>(was.toks||aurSig(aurCanon(was.name||''))).includes(t));
    const learn=key&&!named&&key.split(' ').length<=3&&!key.split(' ').some(t=>e.toks.includes(t));
    if(learn)aurMemSet(key,e,'fix');
    const q=learn?ctx.q:ctx.q+' '+e.name;
    if(!learn&&ctx.F.best&&ctx.F.best.score>=0.5)return aurOpenEnt(e,ctx.F,ctx.F.c.has('OPEN'));
    aurHandle(q);
    if(learn)aurSay(aurMemNote(key,e));
    return true;
  }
  return AUR_PASS;
});

/* ── frases que a Aurora não percebeu: guardadas (encriptadas, com dados sensíveis tapados) para ela melhorar ── */
const AURM={depth:0,lastQ:'',prevQ:''};
const AUR_MISS=new Set(['vague','find:none','find:near','suggest']);
function aurMaskSecrets(t){
  return String(t||'').replace(/\bPT\s?\d{2}(?:\s?\d){19,23}\b/gi,'«IBAN»').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,'«email»')
    .replace(/\b(password|passwords|pass|senha|senhas|pin|cvv|codigo|código|chave|key|palavra-passe)\b([^:=]*?)(?:\s(?:para|pra|é|to|is)\s+|\s*[:=]\s*)(\S+)/gi,(m,a,b,c)=>m.slice(0,m.length-c.length)+'«…»')
    .replace(/\b\d{5,}\b/g,'«nº»').replace(/(?=\S*\d)(?=\S*[A-Za-z])[^\s«»]{6,}/g,'«…»').replace(/(?=\S*[!#$%&*+=?@^_~|\\])[^\s«»]{5,}/g,'«…»').slice(0,160);
}
function aurMissLog(q,why){
  q=aurMaskSecrets(q).trim();if(!q)return;
  const m=aurMem();m.missed=aurA(m.missed).filter(x=>aurNorm(x.q)!==aurNorm(q));
  m.missed.unshift({q,why,at:Date.now()});if(m.missed.length>60)m.missed.length=60;aurMemSave();
}
aurStage('aprender',5,(raw,next)=>{
  if(AURM.depth)return next(raw);
  const pend=!!AUR.pending;AURM.depth++;let r;
  try{r=next(raw);}finally{AURM.depth--;}
  try{if(!pend&&AUR_MISS.has(AUR.trace))aurMissLog(raw,AUR.trace);}catch(e){}
  AURM.prevQ=AURM.lastQ;AURM.lastQ=String(raw||'');
  return r;
});
aurPre('aprender',395,F=>{
  const n=F.n;
  // «não era isso» → a resposta anterior estava errada
  if(/^(nao era (isso|isto|nada disso)|nao e (isso|isto)( que eu queria)?|nao era o que eu queria|percebeste mal|nao percebeste|resposta errada|enganaste te|that s wrong|wrong answer|not what i meant|you misunderstood)$/.test(n)){
    if(!AURM.lastQ)return aurSay(aurL('Diz-me por outras palavras o que querias.','Tell me in other words what you wanted.'));
    aurMissLog(AURM.lastQ,'user');
    return aurSay(aurL('Obrigada — anotei «'+aurEsc(aurMaskSecrets(AURM.lastQ))+'» como algo que percebi mal. Diz-me por outras palavras o que querias?','Thanks — I noted “'+aurEsc(aurMaskSecrets(AURM.lastQ))+'” as something I got wrong. Could you say it another way?'));
  }
  if(/\b(o que nao (percebeste|entendeste|conseguiste)|frases que nao (percebeste|entendeste)|o que falhou|o que nao sabes|what didn t you understand|what you didn t understand|missed (phrases|requests))\b/.test(n)){
    const L=aurA(aurMem().missed);
    if(!L.length)return aurSay(aurL('✅ Não tenho frases por perceber. Se eu errar, diz «não era isso» e eu anoto.','✅ Nothing I missed so far. If I get something wrong, say “that’s wrong” and I’ll note it.'));
    const txt=L.map(x=>'• '+x.q).join('\n');
    return aurSay(aurL('🧩 Frases que não percebi ('+L.length+') — os dados sensíveis ficam tapados:','🧩 Phrases I didn’t get ('+L.length+') — sensitive data is hidden:')+'\n'+aurEsc(L.slice(0,15).map(x=>'• '+x.q).join('\n'))+(L.length>15?'\n…':'')+aurL('\n<span class="a-dim">Copia a lista e envia-a a quem mantém a app, para eu aprender estas frases.</span>','\n<span class="a-dim">Copy the list and send it to whoever maintains the app so I can learn them.</span>'),
      [{label:aurL('📋 Copiar lista','📋 Copy list'),fn:()=>{aurCopy(txt,aurL('Lista copiada','List copied'));return true;}},{label:aurL('Limpar lista','Clear list'),fn:()=>{aurMem().missed=[];aurMemSave();return aurSay(aurL('🧹 Lista limpa.','🧹 List cleared.'));}}]);
  }
  return AUR_PASS;
});
