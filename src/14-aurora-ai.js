/* ═══════════════════ AURORA AI v2 — motor semântico local (PT/EN) ═══════════════════ */
/* Normaliza → extrai conceitos, entidades, campos e datas → decide → executa com as funções reais da app.
   Compreende português e inglês e responde na língua em que lhe escrevem. 100% local e offline. */
const AUR={last:null,pending:null,resume:null,acts:[],hist:[],hIdx:-1,lang:'pt'};
const AUR_PASS={pass:true};
const aurA=x=>Array.isArray(x)?x:[];
function aurL(pt,en){return AUR.lang==='en'?en:pt;}
function aurAppLang(){return typeof currentLang!=='undefined'&&currentLang==='en'?'en':'pt';}

/* ── texto ── */
function aurNorm(s){return (s==null?'':String(s)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[º°ª]/g,' ').replace(/\s+/g,' ').trim();}
function aurEsc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function aurCap(s){s=(s||'').trim();return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
function aurLev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;const d=[];for(let i=0;i<=m;i++)d[i]=[i];for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[m][n];}

const AUR_PHR=[
 [/-(me|nos|te|lhe)\b/g,' '],
 [/\b(dame|damos)\b/g,' da '],[/\bmostrame\b/g,' mostra '],[/\bdizme\b/g,' diz '],[/\blembrame\b/g,' lembra '],
 [/\bo que (sabes|consegues|podes) fazer\b|\bo que fazes\b|\bcomo funcionas\b|\bwhat (can|do) you do\b|\bhow do you work\b|\bwhat are your commands\b/g,' ajuda '],
 [/\bbo(m|a) (dia|tarde|noite)\b|\bgood (morning|afternoon|evening|night)\b/g,' ola '],
 [/\b(f2a|fa2|2 fa|2-fa|2af|dois fatores|2 fatores|duplo fator|two factor|two-factor|2 step|2-step|2step|two step|two-step|dois passos|mfa)\b/g,' 2fa '],
 [/\b(autenticacao|verificacao) (de |em )?2fa\b|\b2fa (authentication|verification)\b/g,' 2fa '],
 [/\b(password|palavra[ -]?passe|senha|chave) mestra\b|\bmaster (password|key|pass)\b/g,' passmestra '],
 [/\bpalavras?[ -]?passes?\b|\bpalavras?[ -]chaves?\b|\bpass ?codes?\b/g,' password '],
 [/\b(senhas?|passwords?|pass|pws?|pwd)\b/g,' password '],
 [/\bcartao (de |do )?cidadao\b|\b(citizen|citizenship|identity|id|national id|identification) cards?\b|\bnational id\b/g,' cartao cidadao '],
 [/\bcarta (de )?conducao\b|\b(driving|drivers?|driver s) licen[cs]es?\b/g,' carta conducao '],
 [/\bseguranca social\b|\bsocial security( number)?\b/g,' segsocial '],
 [/\b(numero|n|nr) (de |do )?utente\b|\bhealth (service |user )?(number|card)\b|\b(sns|patient) number\b/g,' utente '],
 [/\bcartao (de |do )?(credito|debito|multibanco|bancario|banco)\b|\b(credit|debit|bank|banking) cards?\b/g,' cartao bancario '],
 [/\bcartao (de |da )?(loja|fidelizacao|fidelidade|cliente|pontos|supermercado)\b|\b(store|loyalty|rewards?|club|shop|supermarket) cards?\b/g,' cartao loja '],
 [/\bponto (de|da) situacao\b|\bcomo esta o cofre\b|\bestado do cofre\b|\bcomo estou\b|\bstatus report\b|\bhow is my vault\b|\bvault status\b|\bhow am i doing\b/g,' resumo '],
 [/\bcopias? de seguranca\b|\bback ?ups?\b/g,' backup '],
 [/\bwi ?-?fi\b/g,' wifi '],
 [/\bcodigos? de barras\b|\bbar ?codes?\b/g,' barras '],
 [/\binformac(ao|oes)\b|\binformation\b/g,' info '],
 [/\bdados pessoais\b|\bpersonal (data|details)\b|\bmy details\b/g,' info pessoal '],
 [/\bmodo (de )?(privado|oculto|privacidade)\b|\b(privacy|private|incognito|hidden) mode\b/g,' privacidade '],
 [/\bheranca digital\b|\bkit de emergencia\b|\bdigital (legacy|inheritance)\b|\bemergency kit\b/g,' heranca '],
 [/\bpor do sol\b/g,' porsol '],[/\bmeia[ -]noite\b/g,' meianoite '],[/\bclassico claro\b|\bclassic light\b/g,' classico '],
 [/\bdatas? importantes?\b|\bimportant dates?\b/g,' datasimportantes '],
 [/\bauto[ -]?bloqueio\b|\bauto[ -]?lock\b/g,' autobloqueio '],[/\bimpressao digital\b|\bfingerprint\b|\bface ?id\b|\bbiometrics?\b/g,' biometria '],
 [/\bdepois de amanha\b|\bday after tomorrow\b/g,' depoisdeamanha '],
 [/\bhow many\b/g,' quantos '],[/\bhow much\b/g,' quanto '],
 [/\b(turn|switch) on\b/g,' ativa '],[/\b(turn|switch) off\b/g,' desativa '],
 [/\b(licen[cs]e|number|registration|car) plates?\b/g,' matricula '],
 [/\bemail address(es)?\b|\be-mail\b/g,' email '],
 [/\b(phone|mobile|cell) numbers?\b/g,' telemovel '],
 [/\bdate of birth\b|\bbirth ?date\b/g,' nascimento '],
 [/\btax (number|id|identification number|no|code)\b|\bvat number\b|\bfiscal number\b|\bnumero fiscal\b/g,' nif '],
 [/\bpass ?phrase\b/g,' frase '],
 [/\bbring back\b|\bget back\b|\bundo delete\b/g,' recupera '],
 [/\bsign ?in\b|\blog ?in\b/g,' login '],
 [/\brecycl(e|ing) bin\b/g,' reciclagem '],
 [/\bgo to\b|\btake me to\b/g,' abre '],
];
function aurCanon(s){let n=' '+aurNorm(s).replace(/[?!,;:()"“”«»\[\]{}’']/g,' ').replace(/\s+/g,' ')+' ';AUR_PHR.forEach(p=>{n=n.replace(p[0],p[1]);});return n.replace(/\s+/g,' ').trim();}

const AUR_STOP=new Set(('o a os as um uma uns umas de do da dos das no na nos nas ao aos e ou que me te se por para pra pro com em meu minha meus minhas teu tua seu sua este esta estes estas isto esse essa isso aquele aquela ai ali aqui la eu tu ele ela voce lhe qual quais quero queria preciso favor pf pff tenho tens ha sao era ola oi ok entao so mais ja ate tambem como onde quando quanto quantos quantas agora sobre pelo pela pelos pelas num numa dum duma sem mim etc tudo todo toda todos todas completo completa inteira cada '
 +'the an of to for in on at my your me i is are was were be been it its this that these those with and or please pls can could would should you do does did have has had get got from by as about any some what whats which s there here now just also want need show tell give mine im up all').split(' '));

/* ── vocabulário: palavra → conceitos (PT + EN) ── */
const AUR_VOCAB={};
function aurV(c,w){w.split(' ').forEach(x=>{if(x)(AUR_VOCAB[x]=AUR_VOCAB[x]||[]).push(c);});}
aurV('OPEN','abre abrir abra abras mostra mostrar mostre ver ve veja vai ir entra entrar leva levar exibe exibir consulta consultar visualiza open opens show view see display go goto visit');
aurV('GET','qual quais diz dizer dizes saber quero queria preciso precisava what which tell give get need want whats');
aurV('ADD','adiciona adicionar adicione acrescenta acrescentar cria criar crie regista registar registe guarda guardar guarde insere inserir mete meter poe coloca colocar novo nova novos novas add adds create make new save keep put insert register record');
aurV('CHANGE','renova muda mudar mude altera alterar altere troca trocar troque atualiza atualizar atualize edita editar edite redefine redefinir modifica modificar corrige corrigir substitui substituir change update edit modify rename replace reset set renew');
aurV('DELETE','apaga apagar apague elimina eliminar elimine remove remover remova exclui excluir tira tirar deleta delete erase discard');
aurV('COPY','copia copiar copie copy');
aurV('ARCHIVE','arquiva arquivar arquive archive');
aurV('RESTORE','recupera recuperar recupere restaura restaurar restaure repoe repor desarquiva desarquivar devolve restore recover undelete unarchive');
aurV('EMPTY','esvazia esvaziar esvazie limpa limpar limpe empty clear purge');
aurV('GEN','gera gerar gere inventa inventar sugere sugerir generate suggest');
aurV('APPLY','aplica aplicar aplique usa usar use apply switch');
aurV('ON','ativa ativar ative liga ligar ligue enable activate');
aurV('OFF','desativa desativar desative desliga desligar desligue disable deactivate');
aurV('SCHEDULE','agenda agendar agende lembra lembrar lembre lembrete lembretes marca marcar marque avisa avisar remind reminder reminders schedule alert notify');
aurV('EXPORT','exporta exportar exporte exportacao export');
aurV('SYNC','sincroniza sincronizar sincronize sincronizacao sync drive nuvem synchronize synchronise cloud');
aurV('SAVE','grava gravar grave salva salvar');
aurV('LOCK','bloqueia bloquear bloqueie tranca trancar lock');
aurV('CLOSE','fecha fechar feche sai sair close exit quit');
aurV('FIND','procura procurar procure pesquisa pesquisar encontra encontrar encontre localiza localizar onde find search look locate where');
aurV('COUNT','quantos quantas');
aurV('LIST','lista listar enumera enumerar list');
aurV('HOWMUCH','quanto');
aurV('WHEN','quando when');
aurV('HELP','ajuda ajudar help comandos instrucoes commands');
aurV('HELLO','ola oi hey hello hi hiya');
aurV('THANKS','obrigado obrigada obg brigado brigada valeu thanks agradecido thank thx cheers ty');
aurV('MOD_STRONG','forte fortes segura seguras robusta aleatoria complexa strong secure random complex robust');
aurV('MOD_MEM','memoravel memoraveis decorar facil faceis frase memorable easy remember simple');
aurV('NUM','numero numeros nr num number numbers');
aurV('ALL','completa completo tudo toda todo todos todas etc inteira inteiro everything full complete entire whole');
aurV('MINE','meu minha meus minhas eu mim my');
aurV('MOD_LIGHT','claro clara claros light bright');aurV('MOD_DARK','escuro escura escuros dark');
aurV('D_PW','password');
aurV('D_VAULT','acesso acessos conta contas login logins entrada entradas credencial credenciais cofre account accounts entry entries credential credentials vault access');
aurV('D_EMAIL','email mail utilizador user username emails usernames');
aurV('D_2FA','2fa otp autenticador authenticator token tokens totp');
aurV('D_2FAW','codigo codigos code codes');
aurV('D_CARD','cartao cartoes card cards');
aurV('D_BANK','bancario bancarios credito debito visa mastercard multibanco banco bancos bank banks banking credit debit');
aurV('D_STORE','loja lojas fidelizacao fidelidade pontos barras supermercado store stores shop shops loyalty rewards points supermarket');
aurV('D_DOC','documento documentos doc docs digitalizacao scan document documents');
aurV('D_NOTE','nota notas apontamento apontamentos note notes memo memos');
aurV('D_INFO','info pessoal pessoais identificacao personal details identity profile');
aurV('D_FIELD','nif contribuinte iban nib utente sns segsocial niss matricula passaporte socio tin passport');
aurV('D_WARRANTY','garantia garantias fatura faturas recibo recibos warranty warranties receipt receipts invoice invoices guarantee');
aurV('D_VEHICLE','veiculo veiculos carro carros mota motas viatura vehicle vehicles car cars motorbike motorcycle');
aurV('D_LICENSE','licenca licencas software license licence licenses licences');
aurV('D_ASSETS','bens assets belongings possessions');
aurV('D_DATES','datasimportantes aniversario aniversarios birthday birthdays anniversary anniversaries');
aurV('D_SUBS','subscricao subscricoes assinatura assinaturas mensalidade mensalidades streaming subscription subscriptions subs membership memberships');
aurV('D_WIFI','wifi rede redes router network networks');
aurV('D_CAL','calendario eventos calendar events agenda');
aurV('D_THEME','tema temas aspeto aparencia cores cor fundo visual theme themes appearance colors colours color colour skin');
aurV('D_SETTINGS','definicoes definicao ajustes configuracoes configuracao settings opcoes preferencias preferences options configuration config');
aurV('D_SEC','seguranca security');
aurV('D_MASTER','passmestra pin biometria autobloqueio');
aurV('D_TRASH','reciclagem lixo lixeira papeleira apagados apagadas eliminados eliminadas trash bin recycle deleted');
aurV('D_ARCHIVE','arquivo arquivados arquivadas archive archived');
aurV('D_DASH','dashboard inicio painel home homepage');
aurV('D_BACKUP','backup backups');
aurV('D_PRIV','privacidade privado oculto ocultar esconder privacy private hide hidden');
aurV('D_HERITAGE','heranca testamento legacy inheritance');
aurV('D_LANG','idioma lingua ingles english portugues language portuguese');
aurV('D_EXPIRY','expirou caducou venceu renova renovam expira expiram expirar expirado expirados expirada expiradas caduca caducam caducar caducado caducados vence vencem vencer vencido vencidos validade validades renovar renovacao renovacoes termina terminam acaba acabam expire expires expiring expired expiry expiration renew renews renewal renewals due validity valid lapse lapses');
aurV('D_AUDIT','fracas fraca repetidas repetida duplicadas reutilizadas antigas vulneraveis auditoria auditar pontuacao score health weak reused repeated duplicate duplicates duplicated old audit vulnerable breached compromised');
aurV('D_SUMMARY','resumo situacao panorama summary overview status');
aurV('D_FUEL','consumo combustivel gasolina gasoleo diesel litros abastecimento abastecimentos abastecer quilometros fuel consumption gas petrol mileage litres liters refuel refuels refueling refuelling mpg');
aurV('D_MONEY','gasto gastos gasta gastas gastar custo custos custa pago pagas pagar despesa despesas dinheiro spend spending spent cost costs pay paying paid expense expenses money');
aurV('D_FILE','ficheiro ficheiros file files');
aurV('D_PDF','pdf');aurV('D_CSV','csv excel spreadsheet');
const AUR_ACTIONS=new Set(['LIST','OPEN','GET','ADD','CHANGE','DELETE','COPY','ARCHIVE','RESTORE','EMPTY','GEN','APPLY','ON','OFF','SCHEDULE','EXPORT','SYNC','SAVE','LOCK','CLOSE','FIND','COUNT','HOWMUCH','WHEN']);
const AUR_VKEYS=Object.keys(AUR_VOCAB).filter(k=>k.length>=5);
const AUR_RISKY=new Set(['LOCK','CLOSE','EMPTY','DELETE','ARCHIVE','SAVE','SYNC','EXPORT']);
function aurAffinity(a,b){let p=0;while(p<a.length&&p<b.length&&a[p]===b[p])p++;let q=0;while(q<a.length-p&&q<b.length-p&&a[a.length-1-q]===b[b.length-1-q])q++;return p+q;}
function aurFuzzyVocab(t){
  let safe=null,sd=99,risky=null,rd=99;const tol=t.length>=8?2:1;
  for(const k of AUR_VKEYS){if(Math.abs(k.length-t.length)>2)continue;const d=aurLev(t,k);if(d>tol)continue;
    const sc=d*10-aurAffinity(t,k);const isR=AUR_VOCAB[k].some(x=>AUR_RISKY.has(x));
    if(isR){if(sc<rd){rd=sc;risky=k;}}else if(sc<sd){sd=sc;safe=k;}}
  return {safe:safe?AUR_VOCAB[safe]:null,risky:(risky&&(!safe||rd<sd))?risky:null};
}

/* ── deteção da língua de cada mensagem ── */
const AUR_EN_W=new Set('what whats which show open my the please give tell how when where is are do does have has add create delete remove change update edit copy find search list expire expires expiring expired expiry renew renews card cards document documents note notes settings theme themes lock save generate strong account accounts spend spending cost month week year today tomorrow next this last number details tax phone address remind reminder schedule calendar help hello hi thanks thank you your can could of to for in with and from it that me i get set turn off on dark light subscriptions subscription warranty car fuel trash archive restore empty rename vault code codes any weak many much new make want need yes yeah yep sure nope cancel'.split(' '));
const AUR_PT_W=new Set('o os as um uma que qual quais meu minha meus minhas abre mostra diz quanto quantos quantas quando onde adiciona cria apaga muda altera copia procura lista expira expiram renova cartao cartoes documento documentos nota notas definicoes tema temas bloqueia grava gera forte conta contas gasto gasta mes semana ano hoje amanha proximo proxima este esta numero morada telemovel lembra lembra-me calendario ajuda ola obrigado obrigada de do da dos das para com no na em e por favor tenho tens codigo codigos subscricoes subscricao garantia carro combustivel reciclagem arquivo recupera esvazia cofre sim nao gera dame mostra-me tudo toda todos qualquer'.split(' '));
function aurDetectLang(raw,skip){
  const t=aurNorm(raw).replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(Boolean);
  let en=0,pt=0;t.forEach(w=>{if(skip&&skip.has(w))return;if(AUR_EN_W.has(w))en++;if(AUR_PT_W.has(w))pt++;});
  if(en>pt)return 'en';if(pt>en)return 'pt';return null;
}

/* ── campos da aba Info (PT/EN) ── */
const AUR_FIELDS=[
 {k:'nif',label:'NIF',labelEn:'Tax number (NIF)',q:/\b(nif|contribuinte|tin)\b/,l:/\bnif\b|contribuinte|fiscal|tax/,rk:/\b(?:nif|n[uú]mero de contribuinte|contribuinte|tax (?:number|id)|tin|vat number)\b/i},
 {k:'valcc',label:'Validade do CC',labelEn:'ID card expiry',q:/validade (do |da )?(cc|cartao cidadao)|(cc|cartao cidadao) (expiry|expiration)|expiry (date )?of (my |the )?(cc|cartao cidadao)/,l:/validade|expiry/,rk:/(?:validade (?:do |da )?(?:cc|cart[aã]o (?:de )?cidad[aã]o)|(?:id card|cc) expiry)/i},
 {k:'cc',label:'Cartão de Cidadão',labelEn:'Citizen card',q:/\b(cc|bi)\b|cartao cidadao|\bidentidade\b/,l:/cartao cidadao|\bcc\b|identidade|id card|citizen|\bbi\b/,rk:/\b(?:cc|bi|cart[aã]o (?:de |do )?cidad[aã]o|citizen card|id card|identity card)\b/i},
 {k:'ss',label:'Nº Segurança Social',labelEn:'Social security no.',q:/\b(segsocial|niss)\b/,l:/segsocial|niss|social security/,rk:/(?:seguran[cç]a social|niss|social security(?: number)?)/i},
 {k:'utente',label:'Nº de Utente (SNS)',labelEn:'Health number (SNS)',q:/\b(utente|sns)\b/,l:/utente|sns|health/,rk:/(?:utente(?: \(sns\))?|\bsns\b|health (?:number|card))/i},
 {k:'carta',label:'Carta de Condução',labelEn:'Driving licence',q:/carta conducao/,l:/carta conducao|driving|driver/,rk:/(?:carta (?:de )?condu[cç][aã]o|driving licen[cs]e|driver'?s licen[cs]e)/i},
 {k:'iban',label:'IBAN',labelEn:'IBAN',q:/\biban\b/,l:/\biban\b/,rk:/\biban\b/i},
 {k:'nib',label:'NIB',labelEn:'NIB',q:/\bnib\b/,l:/\bnib\b|bank n/,rk:/\bnib\b/i},
 {k:'matricula',label:'Matrícula',labelEn:'Licence plate',q:/\bmatricula\b/,l:/matricula|plate/,rk:/(?:matr[ií]cula|(?:licen[cs]e |number |car )?plate)/i},
 {k:'passaporte',label:'Passaporte',labelEn:'Passport',q:/\b(passaporte|passport)\b/,l:/passaporte|passport/,rk:/(?:passaporte|passport)/i},
 {k:'socio',label:'Nº de Sócio',labelEn:'Membership no.',q:/\bsocio\b|member(ship)? number/,l:/socio|member/,rk:/(?:s[oó]cio|member(?:ship)? number)/i},
 {k:'tel',label:'Telemóvel',labelEn:'Phone',q:/\b(telefone|telemovel|contacto|phone|mobile|telephone)\b/,l:/telefone|telemovel|phone|contacto|mobile/,rk:/(?:telem[oó]vel|telefone|contacto|phone(?: number)?|mobile(?: number)?)/i},
 {k:'morada',label:'Morada',labelEn:'Address',q:/\b(morada|endereco|address)\b/,l:/morada|endereco|address/,rk:/(?:morada|endere[cç]o|address)/i},
 {k:'nasc',label:'Data de nascimento',labelEn:'Date of birth',q:/\bnascimento\b|\bdob\b/,l:/nascimento|birth/,rk:/(?:data de nascimento|nascimento|date of birth|birth ?date)/i},
];
const AUR_ALIAS={'cartao cidadao':['cc','bi'],'carta conducao':['carta']};
const AUR_THEME_EN={aurora:['aurora'],meianoite:['midnight'],floresta:['forest'],oceano:['ocean'],porsol:['sunset'],rubi:['ruby'],ametista:['amethyst'],esmeralda:['emerald'],classico:['classic'],papel:['paper'],menta:['mint'],ceu:['sky']};

/* ── rótulos (na língua da conversa) ── */
const AUR_TYPE_MAP={vault:['acesso','account'],doc:['documento','document'],bank:['cartão bancário','bank card'],store:['cartão de loja','store card'],totp:['código 2FA','2FA code'],wifi:['Wi-Fi','Wi-Fi'],note:['nota','note'],asset:['bem','asset'],sub:['subscrição','subscription'],person:['pessoa','person'],theme:['tema','theme']};
function aurTypeLbl(t){const m=AUR_TYPE_MAP[t];return m?aurL(m[0],m[1]):'';}
const AUR_ASSET_MAP={warranty:['garantia','warranty'],license:['licença','licence'],vehicle:['veículo','vehicle'],dates:['data importante','important date']};
function aurAssetLbl(k){const m=AUR_ASSET_MAP[k];return m?aurL(m[0],m[1]):'';}
const AUR_TAB_MAP={dashboard:['o Dashboard','the Dashboard'],vault:['as Passwords','Passwords'],totp:['os códigos 2FA','2FA codes'],cards:['os Cartões bancários','Bank cards'],store:['os Cartões de loja','Store cards'],docs:['os Documentos','Documents'],notes:['as Notas','Notes'],info:['a Informação Pessoal','Personal info'],archive:['o Arquivo','the Archive'],trash:['a Reciclagem','the Trash'],warranty:['as Garantias','Warranties'],license:['as Licenças','Licences'],vehicle:['os Veículos','Vehicles'],dates:['as Datas importantes','Important dates']};
const AUR_TAB_SHORT={dashboard:['Dashboard','Dashboard'],vault:['Passwords','Passwords'],totp:['2FA','2FA'],cards:['Cartões','Cards'],store:['Cartões de loja','Store cards'],docs:['Documentos','Documents'],notes:['Notas','Notes'],info:['Info','Info'],archive:['Arquivo','Archive'],trash:['Reciclagem','Trash'],warranty:['Garantias','Warranties'],license:['Licenças','Licences'],vehicle:['Veículos','Vehicles'],dates:['Datas','Dates']};
function aurTabLbl(t){const m=AUR_TAB_MAP[t];return m?aurL(m[0],m[1]):t;}
function aurTabShort(t){const m=AUR_TAB_SHORT[t];return m?aurL(m[0],m[1]):t;}
const AUR_EV_ICON={renew:'🔁',doc:'📄',card:'💳',warranty:'🧾',license:'🔑',vehicle:'🚗',date:'📅'};

/* ── datas e dinheiro ── */
function aurToday(){const d=new Date();d.setHours(0,0,0,0);return d;}
function aurAddDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function aurAddMonths(d,n){const x=new Date(d);x.setMonth(x.getMonth()+n);return x;}
function aurDate(d){return new Date(d).toLocaleDateString(AUR.lang==='en'?'en-GB':'pt-PT');}
function aurRel(d){const x=new Date(d);x.setHours(0,0,0,0);const n=Math.round((x-aurToday())/864e5);
  if(AUR.lang==='en')return n===0?'today':n===1?'tomorrow':n===-1?'yesterday':n>0?'in '+n+' days':(-n)+' days ago';
  return n===0?'hoje':n===1?'amanhã':n===-1?'ontem':n>0?'em '+n+' dias':'há '+(-n)+' dias';}
function aurMoney(v){v=+v||0;return typeof fmtMoney==='function'?fmtMoney(v):v.toFixed(2)+' €';}
function aurIsDate(d){return Object.prototype.toString.call(d)==='[object Date]'&&!isNaN(d);}
const AUR_NUMW={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,quinze:15,vinte:20,trinta:30,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30};
function aurNumWords(n){return n.replace(/\ba (day|week|month|year)\b/g,'1 $1').replace(/\b(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte|trinta|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)\b(?=\s+(dia|dias|semana|semanas|mes|meses|ano|anos|day|days|week|weeks|month|months|year|years)\b)/g,m=>String(AUR_NUMW[m]));}
function aurPeriod(n0){
  const n=aurNumWords(n0),h=aurToday();let m;
  const mk=(from,to,pt,en,ex,past)=>({from,to,label:aurL(pt,en),explicit:ex!==false,past:!!past});
  if(/\b(expirados|expiradas|caducados|vencidos|passados|expirou|caducou|venceu|expiraram|caducaram|expired|lapsed|overdue)\b|\bja (expir|caduc|venc)|\bpast due\b/.test(n))return mk(aurAddDays(h,-365),aurAddDays(h,-1),'no último ano','in the last year',true,true);
  if(/\b(hoje|today)\b/.test(n))return mk(h,h,'hoje','today');
  if(/\b(amanha|tomorrow)\b/.test(n)){const d=aurAddDays(h,1);return mk(d,d,'amanhã','tomorrow');}
  if(/\b(este|neste|deste) mes\b|\bthis month\b/.test(n))return mk(h,new Date(h.getFullYear(),h.getMonth()+1,0),'este mês','this month');
  if(/\b(proximo mes|mes que vem|next month)\b/.test(n))return mk(new Date(h.getFullYear(),h.getMonth()+1,1),new Date(h.getFullYear(),h.getMonth()+2,0),'no próximo mês','next month');
  if(/\b(esta|nesta) semana\b|\bthis week\b/.test(n)){const d=aurAddDays(h,(7-h.getDay())%7);return mk(h,d,'esta semana','this week');}
  if(/\b(proxima semana|semana que vem|next week)\b/.test(n))return mk(h,aurAddDays(h,14),'nas próximas 2 semanas','in the next 2 weeks');
  if(/\b(este|neste) ano\b|\bthis year\b/.test(n))return mk(h,new Date(h.getFullYear(),11,31),'este ano','this year');
  if((m=n.match(/(\d+)\s*(dia|dias|day|days)\b/)))return mk(h,aurAddDays(h,+m[1]),'nos próximos '+m[1]+' dias','in the next '+m[1]+' days');
  if((m=n.match(/(\d+)\s*(semana|semanas|week|weeks)\b/)))return mk(h,aurAddDays(h,+m[1]*7),'nas próximas '+m[1]+' semanas','in the next '+m[1]+' weeks');
  if((m=n.match(/(\d+)\s*(mes|meses|month|months)\b/)))return mk(h,aurAddMonths(h,+m[1]),+m[1]===1?'no próximo mês':'nos próximos '+m[1]+' meses',+m[1]===1?'in the next month':'in the next '+m[1]+' months');
  if((m=n.match(/(\d+)\s*(ano|anos|year|years)\b/)))return mk(h,aurAddMonths(h,+m[1]*12),+m[1]===1?'no próximo ano':'nos próximos '+m[1]+' anos',+m[1]===1?'in the next year':'in the next '+m[1]+' years');
  if(/\bproximos meses\b|\b(coming|next few|upcoming) months\b/.test(n))return mk(h,aurAddMonths(h,3),'nos próximos 3 meses','in the next 3 months');
  return mk(h,aurAddMonths(h,3),'nos próximos 3 meses','in the next 3 months',false);
}
const AUR_MESES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const AUR_MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
const AUR_MON3=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const AUR_DIAS=['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
const AUR_DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
function aurMonthIdx(w){w=(w||'').replace(/\.$/,'');let i=AUR_MESES.indexOf(w);if(i<0)i=AUR_MONTHS.indexOf(w);if(i<0)i=AUR_MON3.indexOf(w.slice(0,3));if(w==='sept')i=8;return i;}
function aurMkDate(y,mo,d,t,explicitYear){if(mo<0||mo>11||d<1||d>31)return null;let dt=new Date(y,mo,d);if(dt.getMonth()!==mo)return null;if(!explicitYear&&dt<t)dt=new Date(y+1,mo,d);return dt;}
function aurParseDate(n0){
  const n=aurNumWords(n0),t=aurToday();let m;
  const MON='(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)';
  if((m=n.match(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\b/))){let y=m[3]?+m[3]:t.getFullYear();if(y<100)y+=2000;return aurMkDate(y,+m[2]-1,+m[1],t,!!m[3]);}
  if((m=n.match(new RegExp('\\b(?:dia\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:de\\s+|of\\s+)?'+MON+'(?:\\s+(?:de\\s+)?(\\d{4}))?\\b'))))return aurMkDate(m[3]?+m[3]:t.getFullYear(),aurMonthIdx(m[2]),+m[1],t,!!m[3]);
  if((m=n.match(new RegExp('\\b'+MON+'\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b'))))return aurMkDate(m[3]?+m[3]:t.getFullYear(),aurMonthIdx(m[1]),+m[2],t,!!m[3]);
  if(/\bdepoisdeamanha\b/.test(n))return aurAddDays(t,2);
  if(/\b(amanha|tomorrow)\b/.test(n))return aurAddDays(t,1);
  if(/\b(hoje|today)\b/.test(n))return t;
  if((m=n.match(/\b(?:daqui a|dentro de|in|within)\s+(\d+)\s+(dia|dias|semana|semanas|mes|meses|ano|anos|day|days|week|weeks|month|months|year|years)\b/))){const k=+m[1],u=m[2];return /^(dia|day)/.test(u)?aurAddDays(t,k):/^(semana|week)/.test(u)?aurAddDays(t,k*7):/^(mes|month)/.test(u)?aurAddMonths(t,k):aurAddMonths(t,k*12);}
  if((m=n.match(/\b(?:proxima|proximo|na|no|esta|este|next|this|on)?\s*(domingo|segunda|terca|quarta|quinta|sexta|sabado|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/))){let wd=AUR_DIAS.indexOf(m[1]);if(wd<0)wd=AUR_DAYS.indexOf(m[1]);let k=(wd-t.getDay()+7)%7;if(k===0)k=7;return aurAddDays(t,k);}
  if((m=n.match(/\b(?:dia|on the|the)\s+(\d{1,2})(?:st|nd|rd|th)?\b/))){let dt=new Date(t.getFullYear(),t.getMonth(),+m[1]);if(dt<t)dt=new Date(t.getFullYear(),t.getMonth()+1,+m[1]);return dt;}
  return null;
}
function aurReason(raw){
  const MONR='(?:janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)';
  let r=' '+raw+' ';
  r=r.replace(/\b\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?\b/g,' ');
  r=r.replace(new RegExp('\\b(?:(?:no|ao|a|o|on|the|on the)\\s+)?(?:dia\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:de\\s+|of\\s+)?'+MONR+'(?:\\s+(?:de\\s+)?\\d{4})?','gi'),' ');
  r=r.replace(new RegExp('\\b(?:on\\s+)?'+MONR+'\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?','gi'),' ');
  r=r.replace(/\b(depois de amanh[aã]|day after tomorrow|amanh[aã]|tomorrow|hoje|today)\b/gi,' ');
  r=r.replace(/\b(?:daqui a|dentro de|in|within)\s+\S+\s+(?:dias?|semanas?|m[eê]s(?:es)?|anos?|days?|weeks?|months?|years?)\b/gi,' ');
  r=r.replace(/\b(?:na |no |esta |este |pr[oó]xim[ao] |next |this |on )?(?:domingo|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:-feira)?\b/gi,' ');
  r=r.replace(/\b(?:no |ao |on the )?dia\s+\d{1,2}\b|\bon the \d{1,2}(?:st|nd|rd|th)?\b/gi,' ');
  r=r.replace(/\b(todos os anos|anualmente|cada ano|repete|every year|yearly|annually)\b/gi,' ');
  r=r.replace(/\b(?:no|ao|na)\s+calend[aá]rio\b|\b(?:on|to|in)\s+(?:the\s+|my\s+)?calendar\b/gi,' ');
  r=r.replace(/^\s*(?:aurora[,:]?\s+)?(?:por favor\s+|please\s+)?(?:lembra(?:[- ]?me)?|lembrar|avisa(?:[- ]?me)?|agenda(?:r)?|marca(?:r)?|cria(?:r)?\s+(?:um\s+)?lembrete|adiciona(?:r)?|coloca(?:r)?|p[oõ]e|mete|remind(?:\s+me)?|set\s+(?:a\s+)?reminder|schedule|add(?:\s+a)?(?:\s+reminder)?|put|create\s+(?:a\s+)?reminder)\b/i,' ');
  r=r.replace(/\b(?:um|uma)\s+(?:lembrete|evento|data)\b|\b(?:a|an)\s+(?:reminder|event|date)\b/gi,' ');
  r=r.replace(/\s+/g,' ').trim();
  for(let k=0;k<4;k++){r=r.replace(/^(de|da|do|das|dos|que|para|a|o|um|uma|no|na|dia|em|to|about|of|for|the|an|on|at|that|:|-)\s+/i,'').replace(/\s+(a|no|na|dia|em|para|de|do|da|as|às|on|at|for|the|in|by)$/i,'').trim();}
  r=r.replace(/[.,;:!?]+$/,'').trim();
  return aurCap(r);
}

/* ── índice de entidades de TODO o cofre ── */
function aurSig(n){return n.split(' ').map(t=>t.replace(/^[.\-]+|[.\-]+$/g,'')).filter(t=>t&&!AUR_STOP.has(t));}
function aurIndex(){
  const E=[];
  const add=(type,obj,name,extra,more)=>{if(!name)return;const nn=aurCanon(name);const toks=aurSig(nn);if(!toks.length)return;let alias=[];Object.keys(AUR_ALIAS).forEach(k=>{if(nn.indexOf(k)>=0)alias=alias.concat(AUR_ALIAS[k]);});if(more)alias=alias.concat(more);E.push({type,obj,name:String(name).trim(),norm:nn,toks,alias,extra:aurNorm(extra||''),archived:!!(obj&&obj.archived)});};
  try{aurA(typeof vault!=='undefined'?vault:[]).forEach(v=>add('vault',v,v.name,[v.user,v.url].join(' ')));}catch(e){}
  try{aurA(typeof documents!=='undefined'?documents:[]).forEach(d=>add('doc',d,d.title||d.name));}catch(e){}
  try{aurA(typeof bankCards!=='undefined'?bankCards:[]).forEach(c=>add('bank',c,c.name||c.bank||c.title,c.bank));}catch(e){}
  try{aurA(typeof storeCards!=='undefined'?storeCards:[]).forEach(s=>add('store',s,s.name||s.store));}catch(e){}
  try{aurA(typeof totp!=='undefined'?totp:[]).forEach(t=>add('totp',t,t.name||t.issuer||t.label,t.issuer));}catch(e){}
  try{aurA(typeof wifiNets!=='undefined'?wifiNets:[]).forEach(w=>add('wifi',w,w.name||w.ssid,w.ssid));}catch(e){}
  try{aurA(typeof notes!=='undefined'?notes:[]).forEach(n=>add('note',n,n.title));}catch(e){}
  try{aurA(typeof assets!=='undefined'?assets:[]).forEach(a=>add('asset',a,a.name,a.plate));}catch(e){}
  try{aurA(typeof subscriptions!=='undefined'?subscriptions:[]).forEach(s=>add('sub',s,s.name));}catch(e){}
  try{aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>{if(p&&Array.isArray(p.fields))add('person',p,p.name);});}catch(e){}
  try{aurA(typeof THEME_PRESETS!=='undefined'?THEME_PRESETS:[]).forEach(t=>add('theme',t,t.name,'',AUR_THEME_EN[t.id]||[]));}catch(e){}
  return E;
}
function aurMatchEnt(e,Q,Qset){
  if(!e.toks.length)return 0;
  let got=0,total=0,spec=0;
  e.toks.forEach(t=>{
    const w=AUR_VOCAB[t]?0.35:1;total+=w;
    let hit=Qset.has(t);
    if(!hit&&t.length>=4){for(const q of Q){if(q.length>=4&&!AUR_VOCAB[q]&&Math.abs(q.length-t.length)<=2&&aurLev(q,t)<=(t.length>=8?2:1)){hit=true;break;}}}
    if(!hit&&t.length>=5){for(const q of Q){if(q.length>=4&&!AUR_VOCAB[q]&&t.startsWith(q)){hit=true;break;}}}
    if(hit){got+=w;if(w===1)spec++;}
  });
  let s=got/total;
  if(!spec&&s<1)s=0;
  if(s>0&&(' '+Q.join(' ')+' ').indexOf(' '+e.toks.join(' ')+' ')>=0)s+=0.2;
  if(e.alias&&e.alias.some(a=>Qset.has(a)))s=Math.max(s,0.95);
  return s;
}

/* ── frame: compreensão do pedido ── */
function aurFrame(raw){
  const r=(raw||'').trim().replace(/^\s*aurora\s*[,:!\-]?\s+/i,'');
  const n=aurCanon(r);
  const toks=n.split(' ').map(t=>t.replace(/^[.\-]+|[.\-]+$/g,'')).filter(Boolean);
  const E=aurIndex();
  const entTok=new Set();E.forEach(e=>e.toks.forEach(t=>entTok.add(t)));
  const c=new Set(),conceptTok=new Set();let suggest=null;
  toks.forEach((t,i)=>{
    if(t==='da'){if(i===0)c.add('GET');return;}
    let v=AUR_VOCAB[t];
    if(!v&&t.length>=5&&!entTok.has(t)&&!/\d/.test(t)){const fz=aurFuzzyVocab(t);v=fz.safe;if(fz.risky&&!suggest)suggest={from:t,to:fz.risky};}
    if(v){v.forEach(x=>c.add(x));conceptTok.add(t);}
  });
  const saveW=/\b(guarda|guardar|guarde|save|keep)\b/.test(n);
  const fileW=/\b(ficheiro|cofre|alteracoes|tudo|isto|agora|file|vault|changes|everything|now|it|all)\b/.test(n);
  const otherDom=[...c].some(k=>k.indexOf('D_')===0&&k!=='D_FILE'&&k!=='D_VAULT');
  if(c.has('ADD')&&saveW&&!c.has('D_PW')&&!c.has('D_EMAIL')&&(fileW||!otherDom)&&!/@/.test(r)&&!/[A-Z].*\d|\d.*[A-Z]/.test(r.replace(/^\S+/,''))){c.delete('ADD');c.add('SAVE');}
  if(c.has('CLOSE')&&(c.has('D_VAULT')||/\bapp\b/.test(n))){c.delete('CLOSE');c.add('LOCK');}
  let fields=AUR_FIELDS.filter(f=>f.q.test(' '+n+' '));
  if(fields.some(f=>f.k==='valcc'))fields=fields.filter(f=>f.k!=='cc');
  if(fields.some(f=>f.k==='cc'||f.k==='carta'))c.delete('D_CARD');
  if(c.has('D_SEC')&&!c.has('OPEN')&&!c.has('D_SETTINGS')&&!c.has('D_MASTER'))c.add('D_AUDIT');
  const Q=toks.filter(t=>!AUR_STOP.has(t));
  const Qset=new Set(Q);
  const allowTheme=c.has('D_THEME')||c.has('APPLY');
  let cands=E.filter(e=>e.type!=='theme'||allowTheme).map(e=>Object.assign({},e,{score:aurMatchEnt(e,Q,Qset)})).filter(e=>e.score>=0.34);
  cands.forEach(e=>{const d={vault:['D_PW','D_VAULT','D_EMAIL'],doc:['D_DOC'],bank:['D_BANK','D_CARD'],store:['D_STORE','D_CARD'],totp:['D_2FA','D_2FAW'],wifi:['D_WIFI'],note:['D_NOTE'],asset:['D_WARRANTY','D_VEHICLE','D_LICENSE','D_DATES','D_ASSETS'],sub:['D_SUBS','D_MONEY'],person:['D_INFO','D_FIELD'],theme:['D_THEME']}[e.type];if(d&&d.some(x=>c.has(x)))e.score+=0.15;if(e.archived)e.score-=0.05;});
  if(c.has('D_PW')||c.has('D_EMAIL'))cands.forEach(e=>{if(e.type==='vault')e.score+=0.2;});
  cands.sort((a,b)=>b.score-a.score);
  const best=cands[0]||null,second=cands[1]||null;
  const confident=!!best&&best.score>=0.5&&(!second||best.score-second.score>=0.15);
  const persons=cands.filter(e=>e.type==='person'&&e.score>=0.5);
  const labelHits=[];
  aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>aurA(p&&p.fields).forEach(f=>{const lt=aurSig(aurCanon(f.label||'')).filter(t=>t.length>=4&&!AUR_VOCAB[t]);if(lt.length&&lt.every(t=>Qset.has(t)))labelHits.push(f);}));
  const terms=Q.filter(t=>!conceptTok.has(t)&&!/^\d{1,2}$/.test(t));
  let stab='';
  if(c.has('D_THEME'))stab='aspeto';else if(c.has('D_SEC')||c.has('D_MASTER'))stab='seguranca';else if(c.has('D_BACKUP')||c.has('EXPORT')||/\b(dados|importar|importacao|data|import)\b/.test(n))stab='dados';else if(c.has('D_HERITAGE'))stab='heranca';else if(/\b(sobre|versao|about|version)\b/.test(n))stab='sobre';
  const hasAction=[...c].some(x=>AUR_ACTIONS.has(x));
  const hasDomain=[...c].some(x=>x.indexOf('D_')===0);
  const yes=/^(sim|s|siga|confirmo|confirma|confirmar|ok|okay|okey|pode|podes|pode ser|avanca|avancar|claro|isso|exato|certo|faz|faz isso|sim por favor|yes|y|yeah|yep|yup|sure|confirm|confirmed|do it|go ahead|go|please do|correct|right|bora|vamos|vai|confirmado)$/.test(n);
  const no=/^(nao|n|cancela|cancelar|esquece|deixa|deixa estar|nao obrigado|para|stop|no|nope|nah|cancel|never mind|nevermind|forget it|dont|nada)$/.test(n);
  return {raw:r,n,toks,Q,Qset,c,fields,cands,best,confident,persons,labelHits,terms,stab,hasAction,hasDomain,yes,no,date:null,suggest};
}

/* ── saída ── */
AUR.out=function(h,cls){if(typeof document==='undefined')return null;const m=document.getElementById('aurora-msgs');if(!m)return null;const pn=document.getElementById('aurora-panel');if(pn&&pn.classList.contains('min')&&/ai/.test(cls))pn.classList.add('has-new');const d=document.createElement('div');d.className='aurora-msg '+cls;d.innerHTML=h;m.appendChild(d);m.scrollTop=m.scrollHeight;return d;};
function aurSay(html,chips,cls){
  const list=(chips||[]).filter(Boolean);let h=html;
  if(list.length){if(AUR.acts.length>3000)AUR.acts=[];h+='<div class="a-chips">'+list.map(ch=>{const i=AUR.acts.push(ch.fn)-1;return '<span class="a-btn'+(ch.danger?' danger':'')+'" data-act="aurAct" data-args="['+i+']">'+aurEsc(ch.label)+'</span>';}).join('')+'</div>';}
  AUR.out(h,cls||'ai');return true;
}
function aurAct(i){const f=AUR.acts[i];if(typeof f==='function'){try{f();}catch(e){aurSay(aurL('Não consegui concluir essa ação (','I couldn’t complete that action (')+aurEsc(e.message)+').');}}}
// Barra da Aurora à vista? Um observador diz quando entra/sai do ecrã (antes media a posição a cada frame do scroll, o que obrigava a recalcular o layout)
let _aurLaunchEl=null,_aurLaunchVis=false,_aurIO=null;
function aurLaunchVisible(){
  const l=document.querySelector('.aur-launch');
  if(l!==_aurLaunchEl){
    if(_aurIO)_aurIO.disconnect();_aurLaunchEl=l;_aurLaunchVis=false;
    if(l&&typeof IntersectionObserver!=='undefined'){_aurIO=new IntersectionObserver(es=>{_aurLaunchVis=es[es.length-1].isIntersecting;aurFab();},{rootMargin:'-40px 0px -40px 0px'});_aurIO.observe(l);}
  }
  return _aurLaunchVis;
}
function aurIsMobile(){return typeof window!=='undefined'&&!!window.matchMedia&&window.matchMedia('(max-width:760px)').matches;}
function aurFab(){if(typeof document==='undefined')return;const f=document.getElementById('aurora-fab'),p=document.getElementById('aurora-panel');if(!f)return;const on=typeof masterKey!=='undefined'&&!!masterKey;const lv=aurLaunchVisible();f.style.display=on&&!(p&&p.classList.contains('open'))&&!lv?'flex':'none';}
function aurClose(force){
  if(typeof document==='undefined')return;const p=document.getElementById('aurora-panel');if(!p)return;
  if(force){p.classList.remove('open','min','has-new');document.body.classList.remove('aur-docked');aurFab();return;}
  if(aurIsMobile()&&p.classList.contains('open'))p.classList.add('min');
}
function aurTab(t){if(typeof switchTab==='function')switchTab(t);}
function aurGoTab(t){aurTab(t);aurClose();return aurSay(aurL('Abri ','Opened ')+aurTabLbl(t)+'.');}
function aurCopy(txt,msg){if(txt==null||txt==='')return false;if(typeof copyText==='function')copyText(String(txt),msg||aurL('Copiado ✓','Copied ✓'));else if(typeof navigator!=='undefined'&&navigator.clipboard)navigator.clipboard.writeText(String(txt));return true;}
function aurDirty(){if(typeof renderAll==='function')renderAll();if(typeof markUnsaved==='function')markUnsaved();}
function aurLog(t,n,i){if(typeof logActivity==='function')logActivity(t,n,i);}
function aurYes(){const p=AUR.pending;AUR.pending=null;if(p&&p.ok)return p.ok();return aurSay(aurL('Não havia nada à espera de confirmação.','There was nothing waiting for confirmation.'));}
function aurNo(){AUR.pending=null;return aurSay(aurL('Ok, cancelado.','Ok, cancelled.'));}
function aurConfirmChips(){return [{label:aurL('Confirmar','Confirm'),fn:aurYes},{label:aurL('Cancelar','Cancel'),fn:aurNo}];}
function aurQuick(t){AUR.out(aurEsc(t),'me');return aurHandle(t);}
function aurQ(pt,en){return aurQuick(aurL(pt,en));}
function aurEntLabel(e){const o=e.obj||{};let sub=aurTypeLbl(e.type);if(e.type==='vault'&&o.user)sub=o.user;if(e.type==='asset')sub=aurAssetLbl(o.kind)||sub;return e.name+(sub?' · '+sub:'')+(e.archived?aurL(' (arquivado)',' (archived)'):'');}
function aurChoose(cs,F,title,fn){return aurSay(title||aurL('Encontrei várias opções — qual é?','I found several matches — which one?'),cs.slice(0,8).map(e=>({label:aurEntLabel(e),fn:()=>fn?fn(e):aurOpenEnt(e,F,F.c.has('OPEN'))})));}
function aurTotpLocked(){try{return typeof totpRecWrap!=='undefined'&&!!totpRecWrap&&typeof totpUnlocked!=='undefined'&&!totpUnlocked;}catch(e){return false;}}
function aurNeed2fa(raw){AUR.resume=raw;aurTab('totp');aurClose();return aurSay(aurL('🔒 O teu cofre 2FA está bloqueado. Abri-o — desbloqueia com o PIN (ou biometria) e eu continuo o pedido sozinha.','🔒 Your 2FA vault is locked. I opened it — unlock it with your PIN (or biometrics) and I’ll carry on with your request.'));}
function aurOwner(){const P=aurA(typeof personalInfo!=='undefined'?personalInfo:[]).filter(p=>p&&Array.isArray(p.fields));if(!P.length)return null;const vn=aurNorm(typeof vaultName!=='undefined'?vaultName:'').split(' ')[0];if(vn){const f=P.find(p=>aurNorm(p.name).split(' ')[0]===vn);if(f)return f;}return P[0];}
function aurEvents(){try{return typeof calCollectEvents==='function'?calCollectEvents().filter(e=>e&&aurIsDate(e.date)):[];}catch(e){return [];}}
const AUR_QUICK=[['O que expira?','o que expira nos proximos 3 meses','What expires?','what expires in the next 3 months'],['Ponto de situação','resumo','Status overview','summary'],['Códigos 2FA','codigos 2fa','2FA codes','2fa codes'],['A minha info','a minha info completa','My info','my full personal info'],['Gerar password','gera uma password forte','Generate password','generate a strong password'],['Segurança','tenho passwords fracas','Security','any weak passwords']];
function aurQuickChips(){return AUR_QUICK.map(q=>({label:aurL(q[0],q[2]),fn:()=>aurQuick(aurL(q[1],q[3]))}));}

/* ═══════════ DECISÃO ═══════════ */
function aurHandle(raw){
  raw=(raw||'').trim();if(!raw)return;
  const F=aurFrame(raw);const c=F.c;
  const skip=new Set();F.cands.filter(e=>e.score>=0.5).forEach(e=>aurNorm(e.name).replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).forEach(w=>{if(w)skip.add(w);}));
  const dl=aurDetectLang(raw,skip);if(dl)AUR.lang=dl;
  F.date=aurParseDate(F.n);
  if(AUR.pending){const p=AUR.pending;
    if(F.yes){AUR.pending=null;return p.ok?p.ok():aurSay('Ok.');}
    if(F.no){AUR.pending=null;return aurSay(aurL('Ok, cancelado.','Ok, cancelled.'));}
    if(p.withText&&(!F.hasAction||p.type==='askDate')){AUR.pending=null;return p.withText(raw,F);}
    AUR.pending=null;
  }
  if((F.yes||F.no)&&!F.confident)return aurSay(aurL('Não havia nada à espera de confirmação.','There was nothing waiting for confirmation.'));
  if(c.has('HELP'))return aurHelp();
  if((c.has('HELLO')||c.has('THANKS'))&&![...c].some(x=>AUR_ACTIONS.has(x)||x.indexOf('D_')===0)&&!F.confident)return aurSmall(F);
  if(c.has('CLOSE')&&!F.hasDomain){aurSay(aurL('Até já! ✨','See you soon! ✨'));aurClose(true);return true;}
  for(const h of [aurDocReadAll,aurDocSearch,aurDocFacts,aurCardSecret,aurBreach,aurSamePw,aurOld,aurVehicleDate,aurCatAccount,aurDocsAbout]){const r=h(F);if(r!==AUR_PASS)return r;}
  if(c.has('D_MASTER'))return aurSettings('seguranca',aurL('A palavra-passe mestra, o PIN, a biometria e o auto-bloqueio mudam-se em Definições → Segurança — por segurança não os altero pela conversa. Abri-te lá.','The master password, PIN, biometrics and auto-lock are changed in Settings → Security — for safety I don’t change them through chat. I opened it for you.'));
  if(c.has('D_2FA')||c.has('D_2FAW')){const r=aur2fa(F);if(r!==AUR_PASS)return r;}
  if(c.has('D_EXPIRY')&&!(c.has('SCHEDULE')&&F.date)&&!(c.has('D_PW')&&!/expir|caduc|venc|validade|valid/.test(F.n)))return aurExpiry(F);
  if(c.has('D_SUMMARY'))return aurSummary();
  if(c.has('D_AUDIT'))return aurAudit(F);
  if((c.has('GEN')&&(c.has('D_PW')||c.has('MOD_STRONG')||c.has('MOD_MEM')))||(c.has('D_PW')&&(c.has('MOD_STRONG')||c.has('MOD_MEM'))&&!c.has('CHANGE')&&!(F.confident&&F.best.type==='vault')))return aurGenerate(F);
  if(c.has('CHANGE')&&c.has('D_PW'))return aurChangePw(F);
  if(c.has('CHANGE')&&c.has('D_EMAIL')&&!F.fields.length&&F.cands.some(e=>e.type==='vault'))return aurChangeUser(F);
  if(c.has('CHANGE')&&/\b(nome|name|rename|renomeia|renomear)\b/.test(F.n)&&F.cands.some(e=>e.score>=0.5&&e.type==='vault'))return aurRename(F);
  if(c.has('CHANGE')&&F.fields.length)return aurInfoSet(F,true);
  if((c.has('SCHEDULE')&&!(c.has('OPEN')&&!F.date))||(F.date&&(c.has('ADD')||c.has('D_CAL'))&&!c.has('D_EXPIRY')))return aurSchedule(F);
  const other=x=>[...c].some(k=>k.indexOf('D_')===0&&k!==x&&k!=='D_SETTINGS');
  if(c.has('D_THEME')&&!c.has('D_PW')&&!c.has('D_NOTE')&&!c.has('D_DOC'))return aurTheme(F);
  if(c.has('D_PRIV')&&!other('D_PRIV'))return aurPriv(F);
  if(c.has('D_LANG')&&!other('D_LANG'))return aurLang(F);
  if(c.has('EMPTY')&&(c.has('D_TRASH')||!F.hasDomain))return aurEmptyTrash();
  if(c.has('RESTORE'))return aurRestore(F);
  if(c.has('ARCHIVE'))return aurArchive(F);
  if(c.has('DELETE'))return aurDelete(F);
  if(c.has('ADD'))return aurAdd(F);
  if(c.has('COPY'))return aurCopyCmd(F);
  if(F.fields.length||F.labelHits.length||c.has('D_INFO')||(F.best&&F.best.type==='person'&&F.best.score>=0.5)){const r=aurInfo(F);if(r!==AUR_PASS)return r;}
  if(c.has('D_THEME')||(c.has('APPLY')&&F.cands.some(e=>e.type==='theme')))return aurTheme(F);
  if(c.has('D_PRIV'))return aurPriv(F);
  if(c.has('D_LANG'))return aurLang(F);
  if(c.has('LOCK')){aurSay(aurL('🔒 Cofre bloqueado.','🔒 Vault locked.'));if(typeof lockApp==='function'){aurClose();lockApp();}return true;}
  if(c.has('SYNC')){if(typeof driveSyncNow==='function'){driveSyncNow();return aurSay(aurL('☁️ A sincronizar com o Google Drive…','☁️ Syncing with Google Drive…'));}return aurSay(aurL('A sincronização com o Drive não está disponível.','Drive sync isn’t available.'));}
  if(c.has('D_BACKUP')){if(typeof downloadBackupNow==='function'){downloadBackupNow();return aurSay(aurL('💾 Descarreguei uma cópia de segurança do cofre (encriptada).','💾 I downloaded an (encrypted) backup of your vault.'));}return aurSettings('dados');}
  if(c.has('EXPORT'))return aurExport(F);
  if(c.has('SAVE')){if(typeof saveFile==='function'){saveFile();return aurSay(aurL('💾 A gravar o cofre…','💾 Saving your vault…'));}return aurSay(aurL('Não consegui gravar.','I couldn’t save.'));}
  if(c.has('D_HERITAGE'))return aurSettings('heranca');
  if(c.has('D_SETTINGS')||(c.has('D_SEC')&&c.has('OPEN')))return aurSettings(F.stab);
  if(c.has('LIST')){const r=aurList(F);if(r!==AUR_PASS)return r;}
  if(c.has('D_EMAIL')&&!F.confident&&!F.cands.some(e=>e.score>=0.5))return aurEmails();
  if(c.has('D_FUEL'))return aurFuel(F);
  if(c.has('D_SUBS')||c.has('D_MONEY'))return aurSubs(F);
  if(c.has('COUNT'))return aurCount(F);
  if(c.has('D_CAL'))return aurCal(F);
  if(c.has('D_WIFI')&&!(F.best&&F.best.type==='wifi'&&F.confident))return aurWifi(F);
  if(!F.hasDomain&&!F.confident&&/\b(tenho|ha|acontece|marcado|have|there|coming|upcoming|happening|scheduled)\b/.test(F.n)&&aurPeriod(F.n).explicit)return aurCal(Object.assign({},F,{n:F.n+' eventos'}));
  if(F.confident)return aurOpenEnt(F.best,F,c.has('OPEN'));
  if(F.suggest&&!F.confident){const fixed=F.n.split(' ').map(w=>w===F.suggest.from?F.suggest.to:w).join(' ');return aurSay(aurL('Querias dizer «<b>','Did you mean «<b>')+aurEsc(fixed)+'</b>»?',[{label:aurL('Sim, ','Yes, ')+F.suggest.to,fn:()=>aurQuick(fixed)},{label:aurL('Não','No'),fn:()=>aurSay(aurL('Ok — diz-me de outra forma.','Ok — try saying it another way.'))}]);}
  const strong=F.cands.filter(e=>e.score>=0.5);
  if(strong.length>1)return aurChoose(strong,F);
  const tab=aurDomainTab(c);
  if(tab&&!F.terms.length)return aurGoTab(tab);
  return aurFind(F,tab);
}

function aurDomainTab(c){
  const map=[['D_2FA','totp'],['D_BANK','cards'],['D_STORE','store'],['D_CARD','cards'],['D_DOC','docs'],['D_NOTE','notes'],['D_INFO','info'],['D_FIELD','info'],['D_WARRANTY','warranty'],['D_LICENSE','license'],['D_VEHICLE','vehicle'],['D_DATES','dates'],['D_ASSETS','warranty'],['D_TRASH','trash'],['D_ARCHIVE','archive'],['D_DASH','dashboard'],['D_PW','vault'],['D_VAULT','vault']];
  for(const m of map)if(c.has(m[0]))return m[1];return null;
}

/* ── ajuda e cortesia ── */
function aurHelp(){
  if(AUR.lang==='en')return aurSay('✨ <b>What I can do — across your whole vault</b>\n'+
  '🔑 <b>Passwords</b>: "open gmail", "what’s the revolut password", "copy the paypal password", "change the gmail password", "add netflix with user x and password y", "generate a strong / memorable password"\n'+
  '🔐 <b>2FA</b>: "code for trade republic", "add 2fa", "open 2fa" (if it’s locked, I’ll ask for your PIN and carry on)\n'+
  '👤 <b>Info</b>: "what’s my tax number", "my id card number", "carlos’s full info", "add my iban PT50…", "change my phone to…"\n'+
  '📄 <b>Documents & notes</b>: "open the citizen card", "create a note", "add a document"\n'+
  '💳 <b>Cards</b>: "open the continente card", "add a credit card"\n'+
  '⏳ <b>Expiry dates</b>: "what expires this month", "when does my driving licence expire", "what has expired"\n'+
  '📅 <b>Calendar</b>: "remind me about the car service on 15/03/2027", "what do I have this week"\n'+
  '🏠 <b>Assets</b>: "add a warranty", "car fuel consumption", "open vehicles"\n'+
  '🔁 <b>Subscriptions</b>: "how much do I spend per month", "how much is netflix"\n'+
  '🛡️ <b>Security</b>: "any weak passwords", "status overview"\n'+
  '🗑️ <b>Archive/Trash</b>: "archive hotmail", "restore paypal", "empty the trash"\n'+
  '🎨 <b>Appearance</b>: "apply the ocean theme", "light themes", "turn on privacy mode", "switch to portuguese"\n'+
  '⚙️ <b>Actions</b>: "save", "sync", "back up", "export to pdf", "open digital legacy", "lock"\n'+
  '📑 <b>Your documents</b>: "how much was the last edp bill", "search «clause» in documents", "read my documents"\n'+
  '💬 <b>Conversation</b>: "and for netflix?", "and in july?", "copy it", "show gmail and then copy the password", "the second one", "again"',aurQuickChips());
  return aurSay('✨ <b>O que eu sei fazer — em todo o cofre</b>\n'+
  '🔑 <b>Passwords</b>: "abre o gmail", "qual a password da revolut", "copia a password do paypal", "muda a password do gmail", "adiciona a netflix com user x e pass y", "gera uma password forte / fácil de decorar"\n'+
  '🔐 <b>2FA</b>: "código da trade republic", "adicionar 2fa", "abre o 2fa" (se estiver bloqueado, peço-te o PIN e continuo)\n'+
  '👤 <b>Info</b>: "qual o meu nif", "número de cc", "info completa do carlos", "adiciona o meu iban PT50…", "muda o meu telemóvel para…"\n'+
  '📄 <b>Documentos e notas</b>: "abre o cartão de cidadão", "cria uma nota", "adiciona um documento"\n'+
  '💳 <b>Cartões</b>: "abre o cartão do continente", "adiciona um cartão de crédito"\n'+
  '⏳ <b>Validades</b>: "o que expira este mês", "quando expira a carta de condução", "o que já expirou"\n'+
  '📅 <b>Calendário</b>: "lembra-me da revisão do carro a 15/03/2027", "o que tenho esta semana"\n'+
  '🏠 <b>Bens</b>: "adiciona uma garantia", "consumo do carro", "abre os veículos"\n'+
  '🔁 <b>Subscrições</b>: "quanto gasto por mês", "quanto pago da netflix"\n'+
  '🛡️ <b>Segurança</b>: "tenho passwords fracas", "ponto de situação"\n'+
  '🗑️ <b>Arquivo/Reciclagem</b>: "arquiva o hotmail", "recupera o paypal", "esvazia a reciclagem"\n'+
  '🎨 <b>Aspeto</b>: "aplica o tema oceano", "temas claros", "ativa o modo privado", "muda para inglês"\n'+
  '⚙️ <b>Ações</b>: "grava", "sincroniza", "faz backup", "exporta para pdf", "abre a herança digital", "bloqueia"\n'+
  '📑 <b>Os teus documentos</b>: "quanto paguei na última fatura da edp", "procura «cláusula» nos documentos", "lê os meus documentos"\n'+
  '💬 <b>Conversa</b>: "e do netflix?", "e em julho?", "copia-a", "mostra o gmail e depois copia a password", "o segundo", "repete"\n'+
  '🌍 Também percebo inglês — respondo na língua em que me escreves.',aurQuickChips());
}
function aurSmall(F){
  if(F.c.has('THANKS'))return aurSay(aurL('De nada! 😊 Estou aqui sempre que precisares.','You’re welcome! 😊 I’m here whenever you need me.'));
  const nm=typeof vaultName!=='undefined'&&vaultName?', '+aurEsc(String(vaultName).split(' ')[0]):'';
  return aurSay(aurL('Olá'+nm+'! Em que te posso ajudar?','Hi'+nm+'! How can I help?'),aurQuickChips());
}

/* ── 2FA ── */
function aur2faList(T){return T.slice(0,12).map(t=>({label:t.name||t.issuer||aurL('Código','Code'),fn:()=>aurShowCode(t)}));}
function aur2fa(F){
  const c=F.c,strong=c.has('D_2FA');
  if(!strong&&(c.has('D_WIFI')||c.has('D_STORE')||c.has('D_CARD')||c.has('D_BANK')))return AUR_PASS;
  if(!strong&&F.confident&&F.best.type!=='totp'&&F.best.type!=='vault')return AUR_PASS;
  if(aurTotpLocked())return aurNeed2fa(F.raw);
  const T=aurA(typeof totp!=='undefined'?totp:[]);
  const tc=F.cands.filter(e=>e.type==='totp'&&e.score>=0.5);
  const ent=(tc.length===1||(tc.length>1&&tc[0].score-tc[1].score>=0.15))?tc[0]:null;
  const addNew=()=>{aurTab('totp');if(typeof openTotpModal==='function'){aurClose();openTotpModal();}};
  if(c.has('ADD')){addNew();return aurSay(aurL('🔐 Abri o formulário de novo código 2FA — cola a chave secreta ou lê o QR do serviço.','🔐 I opened the new 2FA code form — paste the secret key or scan the service’s QR code.'));}
  if(c.has('COUNT'))return aurSay(aurL('Tens <b>'+T.length+'</b> '+(T.length===1?'código':'códigos')+' 2FA.','You have <b>'+T.length+'</b> 2FA '+(T.length===1?'code':'codes')+'.'));
  if(!ent&&tc.length>1)return aurChoose(tc,F,aurL('Qual destes códigos?','Which of these codes?'),e=>aurShowCode(e.obj));
  if(ent&&c.has('CHANGE')){aurTab('totp');if(typeof openTotpModal==='function'){aurClose();openTotpModal(ent.obj.id);}return aurSay(aurL('✏️ Abri o código 2FA de <b>','✏️ I opened the 2FA code for <b>')+aurEsc(ent.name)+aurL('</b> para editares.','</b> so you can edit it.'));}
  if(ent&&c.has('DELETE')){const id=ent.obj.id;if(typeof deleteTotp==='function')deleteTotp(id);const still=aurA(typeof totp!=='undefined'?totp:[]).some(t=>t.id===id);return aurSay(still?aurL('Ficou tudo como estava.','Nothing was changed.'):aurL('🗑️ Código 2FA de <b>','🗑️ 2FA code for <b>')+aurEsc(ent.name)+aurL('</b> apagado.','</b> deleted.'));}
  if(ent)return aurShowCode(ent.obj);
  if(F.confident&&F.best.type==='vault'){const v=F.best;return aurSay(aurL('Não tens um código 2FA guardado para <b>','You don’t have a 2FA code saved for <b>')+aurEsc(v.name)+'</b>.',[{label:aurL('Ver o acesso','View the account'),fn:()=>aurOpenEnt(v,F,false)},{label:aurL('Adicionar código 2FA','Add 2FA code'),fn:addNew}]);}
  if(!T.length)return aurSay(aurL('Ainda não tens códigos 2FA guardados.','You don’t have any 2FA codes saved yet.'),[{label:aurL('Adicionar código 2FA','Add 2FA code'),fn:addNew}]);
  if(c.has('OPEN')&&!F.terms.length)return aurGoTab('totp');
  if(F.terms.length&&!tc.length)return aurSay(aurL('Não encontrei um código 2FA para «','I couldn’t find a 2FA code for «')+aurEsc(F.terms.join(' '))+aurL('». Tens estes — toca para ver o código:','». You have these — tap one to see its code:'),aur2faList(T));
  return aurSay(aurL('🔐 Os teus códigos 2FA (','🔐 Your 2FA codes (')+T.length+aurL(') — toca para ver o código atual:',') — tap one to see the current code:'),aur2faList(T).concat([{label:aurL('Abrir 2FA','Open 2FA'),fn:()=>aurGoTab('totp')}]));
}
async function aurShowCode(t){
  if(aurTotpLocked())return aurNeed2fa(aurL('codigo ','code ')+(t.name||''));
  let code=null;try{code=await computeTOTP(t.secret,t.digits,t.period,t.algorithm,t.type==='hotp'?(t.counter||0):null);}catch(e){}
  const nm=aurEsc(t.name||t.issuer||'2FA');
  if(!code)return aurSay(aurL('Não consegui calcular o código de <b>','I couldn’t calculate the code for <b>')+nm+aurL('</b>. Abre o separador 2FA.','</b>. Open the 2FA tab.'),[{label:aurL('Abrir 2FA','Open 2FA'),fn:()=>aurGoTab('totp')}]);
  const per=+t.period||30,left=per-Math.floor(Date.now()/1000)%per;
  const f=typeof fmtTotpCode==='function'?fmtTotpCode(code,t.digits):code;
  aurCopy(code,aurL('Código copiado ✓','Code copied ✓'));
  return aurSay('🔐 <b>'+nm+'</b>\n<span class="a-code">'+aurEsc(f)+'</span>\n<span class="a-dim">'+aurL('válido mais '+left+'s · copiado para a área de transferência','valid for '+left+'s more · copied to clipboard')+'</span>',[{label:aurL('Novo código','New code'),fn:()=>aurShowCode(t)},{label:aurL('Copiar de novo','Copy again'),fn:()=>aurCopy(code,aurL('Código copiado ✓','Code copied ✓'))}]);
}

/* ── validades ── */
function aurEvLine(e){return '• '+(AUR_EV_ICON[e.type]||'📅')+' <b>'+aurEsc(e.label)+'</b> — '+aurDate(e.date)+' <span class="a-dim">('+aurRel(e.date)+')</span>'+(e.type==='renew'&&e.amount?' · '+aurMoney(e.amount):'');}
function aurExpiry(F){
  if(F.fields.some(f=>f.k==='valcc')){const r=aurInfo(F,true);if(r!==AUR_PASS)return r;}
  const ev=aurEvents(),today=aurToday();
  const ent=F.confident&&['doc','bank','sub','asset'].includes(F.best.type)?F.best:null;
  if(ent){
    const nm=aurNorm(ent.name);
    const mine=ev.filter(e=>aurNorm(e.label).indexOf(nm)===0).sort((a,b)=>a.date-b.date);
    const nx=mine.find(e=>e.date>=today)||mine[mine.length-1];
    if(nx){const past=nx.date<today;const verb=past?aurL('expirou a ','expired on '):(ent.type==='sub'?aurL('renova a ','renews on '):aurL('expira a ','expires on '));return aurSay((past?'⚠️ ':'⏳ ')+'<b>'+aurEsc(ent.name)+'</b> '+verb+aurDate(nx.date)+' ('+aurRel(nx.date)+').',[{label:aurL('Abrir','Open'),fn:()=>aurOpenEnt(ent,F,true)},{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);}
    return aurSay('<b>'+aurEsc(ent.name)+aurL('</b> não tem validade registada.','</b> has no expiry date saved.'),[{label:aurL('Abrir para adicionar','Open to add one'),fn:()=>aurOpenEnt(ent,F,true)}]);
  }
  const P=aurPeriod(F.n);const c=F.c;
  let list=ev.filter(e=>e.date>=P.from&&e.date<=P.to);
  const tf=[];if(c.has('D_DOC'))tf.push('doc');if(c.has('D_BANK')||c.has('D_CARD'))tf.push('card');if(c.has('D_SUBS'))tf.push('renew');if(c.has('D_WARRANTY'))tf.push('warranty');if(c.has('D_LICENSE'))tf.push('license');if(c.has('D_VEHICLE'))tf.push('vehicle');
  if(tf.length)list=list.filter(e=>tf.includes(e.type));
  list.sort((a,b)=>a.date-b.date);
  if(!list.length)return aurSay(P.past?aurL('✅ Nada expirou ','✅ Nothing expired ')+P.label+'.':aurL('✅ Nada a expirar ','✅ Nothing expiring ')+P.label+'.',[P.past?null:{label:aurL('Próximos 12 meses','Next 12 months'),fn:()=>aurQ('o que expira nos proximos 12 meses','what expires in the next 12 months')},{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);
  const lines=list.slice(0,20).map(aurEvLine);
  return aurSay((P.past?aurL('⚠️ Expirados ','⚠️ Expired '):aurL('⏳ A expirar ','⏳ Expiring '))+P.label+' ('+list.length+'):\n'+lines.join('\n')+(list.length>20?aurL('\n…e mais ','\n…and ')+(list.length-20)+aurL('.',' more.'):''),[{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);
}
function aurOpenCal(){if(typeof openCalendar==='function'){aurClose();openCalendar();}return true;}
function aurCal(F){
  const P=aurPeriod(F.n);
  if(P.explicit||/\b(tenho|ha|eventos|have|events|there)\b/.test(F.n)){const ev=aurEvents().filter(e=>e.date>=P.from&&e.date<=P.to).sort((a,b)=>a.date-b.date);
    if(!ev.length)return aurSay(aurL('📅 Nada no calendário ','📅 Nothing on the calendar ')+P.label+'.',[{label:aurL('Abrir calendário','Open calendar'),fn:aurOpenCal}]);
    return aurSay(aurL('📅 No calendário ','📅 On the calendar ')+P.label+':\n'+ev.slice(0,20).map(aurEvLine).join('\n'),[{label:aurL('Abrir calendário','Open calendar'),fn:aurOpenCal}]);}
  aurOpenCal();return aurSay(aurL('📅 Abri o calendário.','📅 I opened the calendar.'));
}

/* ── resumo e auditoria ── */
function aurSummary(){
  const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived);
  const sc=typeof calcSecurityScore==='function'?calcSecurityScore():null;
  let sub=0;aurA(typeof subscriptions!=='undefined'?subscriptions:[]).forEach(s=>{try{sub+=subMonthly(s)||0;}catch(e){}});
  const t=aurToday(),lim=aurAddDays(t,30),soon=aurEvents().filter(e=>e.date>=t&&e.date<=lim).sort((a,b)=>a.date-b.date);
  const T=aurA(typeof totp!=='undefined'?totp:[]);
  const n=x=>aurA(typeof x!=='undefined'?x:[]).length;
  const L=['🔑 <b>'+V.length+'</b> '+aurL('acessos','accounts')+' · 🔐 '+(aurTotpLocked()?aurL('2FA bloqueado','2FA locked'):'<b>'+T.length+'</b> '+aurL('códigos 2FA','2FA codes')),
   '📄 <b>'+n(documents)+'</b> '+aurL('documentos','documents')+' · 💳 <b>'+n(bankCards)+'</b> '+aurL('cartões','cards')+' · 🎟️ <b>'+n(storeCards)+'</b> '+aurL('de loja','store'),
   '📝 <b>'+n(notes)+'</b> '+aurL('notas','notes')+' · 🏠 <b>'+n(assets)+'</b> '+aurL('bens','assets')+' · 👤 <b>'+n(personalInfo)+'</b> '+aurL('pessoas','people'),
   sc!=null?'🛡️ '+aurL('Segurança','Security')+': <b>'+sc+'/100</b>':null,
   '🔁 '+aurL('Subscrições','Subscriptions')+': <b>'+aurMoney(sub)+aurL('/mês','/month')+'</b>',
   soon.length?'⏳ <b>'+soon.length+'</b> '+aurL('a expirar em 30 dias — próximo: ','expiring within 30 days — next: ')+aurEsc(soon[0].label)+' ('+aurRel(soon[0].date)+')':aurL('✅ Nada a expirar nos próximos 30 dias','✅ Nothing expiring in the next 30 days')];
  return aurSay('📊 <b>'+aurL('Ponto de situação','Status overview')+'</b>\n'+L.filter(Boolean).join('\n'),[{label:aurL('O que expira?','What expires?'),fn:()=>aurQ('o que expira nos proximos 3 meses','what expires in the next 3 months')},{label:aurL('Auditoria','Audit'),fn:()=>aurQ('auditoria','audit')},{label:aurL('Subscrições','Subscriptions'),fn:()=>aurQ('quanto gasto em subscricoes','how much do i spend on subscriptions')}]);
}
function aurAudit(F){
  const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived&&v.pw);
  if(!V.length)return aurSay(aurL('Ainda não tens passwords para auditar.','You don’t have any passwords to audit yet.'));
  const weak=V.filter(v=>typeof getPwScore==='function'&&getPwScore(v.pw)<2);
  const map={};V.forEach(v=>{map[v.pw]=(map[v.pw]||0)+1;});
  const dup=V.filter(v=>map[v.pw]>1);
  const old=V.filter(v=>v.pwUpdated&&Date.now()-v.pwUpdated>180*864e5);
  const sc=typeof calcSecurityScore==='function'?calcSecurityScore():null;
  const n=F.n;let focus=null;
  if(/\b(fraca|fracas|weak)\b/.test(n))focus=['weak',weak];else if(/\b(repetida|repetidas|duplicadas|reutilizadas|reused|repeated|duplicate|duplicates|duplicated)\b/.test(n))focus=['dup',dup];else if(/\b(antigas|old)\b/.test(n))focus=['old',old];
  const NAMES={weak:[['fraca','fracas'],['weak','weak']],dup:[['repetida','repetidas'],['reused','reused']],old:[['antiga','antigas'],['old','old']]};
  const openFull={label:aurL('Auditoria completa','Full audit'),fn:()=>{if(typeof openHealthCheck==='function'){aurClose();openHealthCheck();}}};
  const fixChips=L=>L.slice(0,10).map(v=>({label:v.name+(v.user?' · '+v.user:''),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:new Set()})}));
  if(focus){const L=focus[1],nm=NAMES[focus[0]];
    if(!L.length)return aurSay(aurL('✅ Não tens passwords '+nm[0][1]+'.','✅ You have no '+nm[1][1]+' passwords.'),[openFull]);
    return aurSay(aurL('⚠️ Tens <b>'+L.length+'</b> '+(L.length===1?'password '+nm[0][0]:'passwords '+nm[0][1])+' — toca numa para gerar uma nova:','⚠️ You have <b>'+L.length+'</b> '+nm[1][0]+' '+(L.length===1?'password':'passwords')+' — tap one to generate a new one:'),fixChips(L).concat([openFull]));}
  const prob=[...new Set([...weak,...dup,...old])];
  const head='🛡️ '+(sc!=null?aurL('Pontuação','Score')+': <b>'+sc+'/100</b>\n':'')+aurL('• Fracas: <b>','• Weak: <b>')+weak.length+aurL('</b>\n• Repetidas: <b>','</b>\n• Reused: <b>')+dup.length+aurL('</b>\n• Antigas (+6 meses): <b>','</b>\n• Old (6+ months): <b>')+old.length+'</b>';
  if(!prob.length)return aurSay(head+aurL('\n\n✅ Tudo em ordem.','\n\n✅ All good.'),[openFull]);
  return aurSay(head+aurL('\n\nPara corrigir — toca para gerar uma nova:','\n\nTo fix — tap one to generate a new password:'),fixChips(prob.slice(0,8)).concat([openFull]));
}

/* ── passwords ── */
function aurGenPw(len){len=Math.max(8,Math.min(64,len||20));const U='ABCDEFGHJKLMNPQRSTUVWXYZ',L='abcdefghijkmnopqrstuvwxyz',D='23456789',S='!@#$%&*?-_+=';const all=U+L+D+S;const r=new Uint32Array(len),s=new Uint32Array(len);crypto.getRandomValues(r);crypto.getRandomValues(s);const p=[U[r[0]%U.length],L[r[1]%L.length],D[r[2]%D.length],S[r[3]%S.length]];for(let i=4;i<len;i++)p.push(all[r[i]%all.length]);for(let i=p.length-1;i>0;i--){const j=s[i]%(i+1);const x=p[i];p[i]=p[j];p[j]=x;}return p.join('');}
const AUR_WORDS='aurora estrela oceano floresta montanha trovoada cristal veludo girassol relampago cascata labareda nevoeiro tigre falcao castelo muralha bussola ancora farol duna coral jasmim canela ambar safira esmeralda carvalho sereno vulcao pantera cometa orquidea abelha raposa lince baleia glaciar planeta galaxia neblina brisa savana tulipa cedro granito marfim cobalto rubi topazio condor golfinho'.split(' ');
const AUR_WORDS_EN='aurora star ocean forest mountain thunder crystal velvet sunflower lightning waterfall ember mist tiger falcon castle rampart compass anchor lighthouse dune coral jasmine cinnamon amber sapphire emerald oak serene volcano panther comet orchid honeybee fox lynx whale glacier planet galaxy breeze savanna tulip cedar granite ivory cobalt ruby topaz condor dolphin'.split(' ');
function aurMemPw(){const W=AUR.lang==='en'?AUR_WORDS_EN:AUR_WORDS;const r=new Uint32Array(6);crypto.getRandomValues(r);const w=[];for(let i=0;i<4;i++){const x=W[r[i]%W.length];w.push(x.charAt(0).toUpperCase()+x.slice(1));}return w.join('-')+'-'+(10+r[4]%90)+'!?#&'.charAt(r[5]%4);}
function aurPwStrength(pw){if(!pw)return '—';const s=typeof getPwScore==='function'?getPwScore(pw):3;return s<2?aurL('fraca ⚠️','weak ⚠️'):s<4?aurL('razoável','fair'):aurL('forte ✓','strong ✓');}
function aurVaultPick(F){
  const vc=F.cands.filter(e=>e.type==='vault'&&e.score>=0.5);
  if(vc.length===1||(vc.length>1&&vc[0].score-vc[1].score>=0.15))return {one:vc[0]};
  if(vc.length>1)return {many:vc};
  if(AUR.last&&AUR.last.type==='vault'&&/\b(essa|esse|dela|dele|isso|esta|este|it|that|this one)\b/.test(F.n))return {one:AUR.last};
  return {};
}
function aurGenerate(F){
  const mem=F.c.has('MOD_MEM');let len=20;const m=F.n.match(/(\d{1,2})\s*(caracteres|carateres|letras|digitos|chars|simbolos|characters|character|letters|digits)/);if(m)len=+m[1];
  const pw=mem?aurMemPw():aurGenPw(len);
  const pk=aurVaultPick(F);let chips=[{label:aurL('Copiar','Copy'),fn:()=>aurCopy(pw,aurL('Password copiada ✓','Password copied ✓'))},{label:aurL('Gerar outra','Generate another'),fn:()=>aurGenerate(F)}];
  if(pk.one)chips.unshift({label:aurL('Usar em ','Use for ')+pk.one.name,fn:()=>aurSetPw(pk.one.obj,pw)});
  else{const nm=(F.raw.match(/\b(?:para|for)\s+(?:o |a |os |as |the |my )?(.+?)\s*$/i)||[])[1];if(nm&&!/\b(mim|decorar|lembrar|me|remember)\b/i.test(nm))chips.unshift({label:aurL('Criar acesso «','Create account «')+aurCap(nm)+'»',fn:()=>aurConfirmAdd({name:aurCap(nm),user:'',pw})});else chips.push({label:aurL('Guardar num acesso novo','Save as a new account'),fn:()=>aurAskName(pw)});}
  return aurSay(aurL('🔐 Password '+(mem?'memorável':'forte')+' ('+pw.length+' caracteres):','🔐 '+(mem?'Memorable':'Strong')+' password ('+pw.length+' characters):')+'\n<span class="a-code">'+aurEsc(pw)+'</span>',chips);
}
function aurAskName(pw){AUR.pending={type:'askName',withText:(t)=>aurConfirmAdd({name:aurCap(t.trim()),user:'',pw})};return aurSay(aurL('Para que serviço é esta password? (ex.: Netflix)','Which service is this password for? (e.g. Netflix)'));}
function aurSetPw(v,pw){
  if(!v)return aurSay(aurL('Não encontrei essa entrada.','I couldn’t find that entry.'));
  if(v.pw===pw)return aurSay(aurL('Essa já é a password atual.','That’s already the current password.'));
  v.pwHistory=[v.pw,...aurA(v.pwHistory)].filter(x=>typeof x==='string'&&x).slice(0,3);
  v.pw=pw;v.pwUpdated=Date.now();aurLog('edit',v.name,'🔑');aurDirty();
  AUR.last={type:'vault',obj:v,name:v.name};
  return aurSay(aurL('✓ Password de <b>','✓ Password for <b>')+aurEsc(v.name)+aurL('</b> atualizada — a anterior ficou no histórico.\n⚠️ Lembra-te de a mudar também no site/app do serviço, e de gravar.','</b> updated — the old one is kept in the history.\n⚠️ Remember to change it on the service’s site/app too, and to save.'),[{label:aurL('Copiar nova password','Copy new password'),fn:()=>aurCopy(pw,aurL('Password copiada ✓','Password copied ✓'))},{label:aurL('Gravar agora','Save now'),fn:()=>{if(typeof saveFile==='function')saveFile();}}]);
}
function aurChangePw(F){
  const pk=aurVaultPick(F);
  if(pk.many)return aurChoose(pk.many,F,aurL('De qual destas contas?','Which of these accounts?'),e=>aurChangePwOn(e.obj,F));
  if(!pk.one){const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived);return aurSay(aurL('De que conta queres mudar a password?','Which account’s password do you want to change?'),V.slice(0,12).map(v=>({label:v.name+(v.user?' · '+v.user:''),fn:()=>aurChangePwOn(v,F)})));}
  return aurChangePwOn(pk.one.obj,F);
}
function aurChangePwOn(v,F){
  let nova=null;const m=(F.raw||'').match(/\b(?:para|to)\s+(\S+)\s*$/i);
  if(m){const w=aurNorm(m[1]);const isName=aurNorm(v.name).indexOf(w)>=0;if(!isName&&!/^(forte|segura|nova|outra|aleatoria|memoravel|facil|uma|isso|strong|secure|new|another|random|memorable|easy|one|it)$/.test(w)&&m[1].length>=4)nova=m[1];}
  const gen=!nova;if(gen)nova=F.c&&F.c.has('MOD_MEM')?aurMemPw():aurGenPw(20);
  AUR.pending={ok:()=>aurSetPw(v,nova)};
  return aurSay(aurL('Vou mudar a password de <b>','I’ll change the password for <b>')+aurEsc(v.name)+'</b>'+(v.user?' ('+aurEsc(v.user)+')':'')+aurL(' para:',' to:')+'\n<span class="a-code">'+aurEsc(nova)+'</span> <span class="a-dim">('+(gen?aurL('gerada · ','generated · '):'')+aurPwStrength(nova)+')</span>\n'+aurL('Confirmas?','Confirm?'),[{label:aurL('Confirmar','Confirm'),fn:aurYes},{label:aurL('Gerar outra','Generate another'),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:F.c||new Set()})},{label:aurL('Cancelar','Cancel'),fn:aurNo}]);
}
function aurChangeUser(F){
  const pk=aurVaultPick(F);if(!pk.one)return pk.many?aurChoose(pk.many,F,aurL('De qual?','Which one?'),e=>aurChangeUser(Object.assign({},F,{cands:[Object.assign({},e,{score:1})]}))):aurSay(aurL('De que conta?','Which account?'));
  const v=pk.one.obj;const nv=(F.raw.match(/([\w.+-]+@[\w-]+\.[\w.-]+)\s*$/)||F.raw.match(/\b(?:para|to)\s+(\S+)\s*$/i)||[])[1];
  if(!nv)return aurSay(aurL('Qual é o novo utilizador/email para <b>','What’s the new username/email for <b>')+aurEsc(v.name)+aurL('</b>? Ex.: "muda o email do '+aurEsc(v.name)+' para novo@mail.com"','</b>? E.g. "change the '+aurEsc(v.name)+' email to new@mail.com"'));
  AUR.pending={ok:()=>{v.user=nv;aurLog('edit',v.name,'✏️');aurDirty();return aurSay(aurL('✓ Utilizador de <b>','✓ Username for <b>')+aurEsc(v.name)+aurL('</b> atualizado para ','</b> updated to ')+aurEsc(nv)+'.');}};
  return aurSay(aurL('Vou mudar o utilizador de <b>','I’ll change the username for <b>')+aurEsc(v.name)+'</b>: '+aurEsc(v.user||'—')+' → <b>'+aurEsc(nv)+'</b>\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}
function aurRename(F){
  const pk=aurVaultPick(F);if(!pk.one)return pk.many?aurChoose(pk.many,F,aurL('Qual?','Which one?'),e=>aurOpenEnt(e,F)):aurSay(aurL('Que entrada queres renomear?','Which entry do you want to rename?'));
  const v=pk.one.obj;const nv=(F.raw.match(/\b(?:para|to)\s+(.+?)\s*$/i)||[])[1];
  if(!nv)return aurSay(aurL('Para que nome? Ex.: "muda o nome do '+aurEsc(v.name)+' para Gmail Pessoal"','To what name? E.g. "rename '+aurEsc(v.name)+' to Personal Gmail"'));
  AUR.pending={ok:()=>{const old=v.name;v.name=aurCap(nv);aurLog('edit',v.name,'✏️');aurDirty();return aurSay(aurL('✓ «'+aurEsc(old)+'» passou a chamar-se <b>','✓ «'+aurEsc(old)+'» is now called <b>')+aurEsc(v.name)+'</b>.');}};
  return aurSay(aurL('Renomear <b>','Rename <b>')+aurEsc(v.name)+aurL('</b> para <b>','</b> to <b>')+aurEsc(aurCap(nv))+'</b>?',aurConfirmChips());
}
function aurEntryCard(v){
  const upd=v.pwUpdated?aurL(' · alterada ',' · changed ')+aurRel(new Date(v.pwUpdated)):'';
  return aurSay('🔑 <b>'+aurEsc(v.name)+'</b>'+(v.archived?' <span class="a-dim">'+aurL('(arquivado)','(archived)')+'</span>':'')+'\n'+(v.user?aurL('Utilizador: ','Username: ')+aurEsc(v.user)+'\n':'')+'Password: ●●●●●●●● · '+aurPwStrength(v.pw)+upd+(v.url?'\n'+aurL('Site: ','Site: ')+aurEsc(v.url):''),
   [{label:aurL('Copiar password','Copy password'),fn:()=>aurCopy(v.pw,aurL('Password copiada ✓','Password copied ✓'))},v.user?{label:aurL('Copiar utilizador','Copy username'),fn:()=>aurCopy(v.user,aurL('Utilizador copiado ✓','Username copied ✓'))}:null,{label:aurL('Mostrar','Show'),fn:()=>aurSay(aurL('Password de <b>','Password for <b>')+aurEsc(v.name)+'</b>: <span class="a-code">'+aurEsc(v.pw)+'</span>')},{label:aurL('Abrir','Open'),fn:()=>{if(typeof openReadMode==='function'){aurClose();openReadMode(v.id);}}},{label:aurL('Mudar password','Change password'),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:new Set()})}]);
}

/* ── abrir qualquer entidade ── */
function aurOpenEnt(e,F,open){
  const o=e.obj,nm=aurEsc(e.name);F=F||{c:new Set(),raw:''};
  switch(e.type){
    case 'vault':AUR.last=e;if(open&&typeof openReadMode==='function'&&!F.c.has('GET')){aurClose();openReadMode(o.id);return aurSay(aurL('🔑 Abri <b>','🔑 Opened <b>')+nm+'</b>.');}return aurEntryCard(o);
    case 'doc':aurTab('docs');if(typeof openDocPreview==='function'){aurClose();openDocPreview(o.id);}return aurSay(aurL('📄 Abri o documento <b>','📄 Opened the document <b>')+nm+'</b>.'+(o.expiry&&aurIsDate(new Date(o.expiry))?aurL(' Validade: ',' Expiry: ')+aurDate(o.expiry)+' ('+aurRel(o.expiry)+').':''));
    case 'store':if(typeof showBarcode==='function'){aurClose();showBarcode(o.id);}return aurSay(aurL('🎟️ Aqui está o cartão <b>','🎟️ Here’s the <b>')+nm+aurL('</b>.','</b> card.'));
    case 'bank':{if(open){aurTab('cards');aurClose();}return aurSay('💳 <b>'+nm+'</b>'+(o.bank&&o.bank!==e.name?' · '+aurEsc(o.bank):'')+(o.expiry?aurL('\nValidade: ','\nExpiry: ')+aurEsc(o.expiry):''),[{label:aurL('Abrir / editar','Open / edit'),fn:()=>{aurTab('cards');if(typeof openCardModal==='function'){aurClose();openCardModal(o.id);}}}]);}
    case 'totp':return aurTotpLocked()?aurNeed2fa(aurL('codigo ','code ')+e.name):aurShowCode(o);
    case 'wifi':if(typeof openWifiNetQR==='function'){aurClose();openWifiNetQR(o.id);}return aurSay(aurL('📶 QR do Wi-Fi <b>','📶 Wi-Fi QR for <b>')+nm+'</b>.',o.pw?[{label:aurL('Copiar password do Wi-Fi','Copy Wi-Fi password'),fn:()=>aurCopy(o.pw,aurL('Password do Wi-Fi copiada ✓','Wi-Fi password copied ✓'))}]:null);
    case 'note':aurTab('notes');if(typeof selectNote==='function'){aurClose();selectNote(o.id);}return aurSay(aurL('📝 Abri a nota <b>','📝 Opened the note <b>')+nm+'</b>.');
    case 'asset':aurTab(o.kind);if(typeof openAssetModal==='function'){aurClose();openAssetModal(o.kind,o.id);}return aurSay('🏠 '+aurL('Abri '+(o.kind?aurAssetLbl(o.kind):'o bem'),'Opened '+(o.kind?aurAssetLbl(o.kind):'asset'))+' <b>'+nm+'</b>.');
    case 'sub':return aurSubCard(o);
    case 'person':return aurPersonCard([o],null,true);
    case 'theme':return aurApplyTheme(o);
  }
  return aurSay(aurL('Não sei abrir esse tipo de item.','I don’t know how to open that kind of item.'));
}

/* ── Informação Pessoal ── */
function aurFieldRows(persons,F,all){
  const rows=[];const useLH=!F.fields.length;
  persons.forEach(p=>aurA(p&&p.fields).forEach(f=>{
    if(f.value==null||f.value==='')return;const lab=aurCanon(f.label||'');
    const ok=all||F.fields.some(q=>q.l.test(lab)&&!(q.k==='cc'&&/validade|expiry/.test(lab)))||(useLH&&F.labelHits.includes(f));
    if(ok)rows.push({p,f});
  }));return rows;
}
function aurPersonCard(persons,rows,all){
  rows=rows||[];if(!rows.length)persons.forEach(p=>aurA(p.fields).forEach(f=>{if(f.value!=null&&f.value!=='')rows.push({p,f});}));
  if(!rows.length)return aurSay('<b>'+aurEsc(persons.map(p=>p.name).join(', '))+aurL('</b> ainda não tem dados guardados.','</b> has no data saved yet.'),[{label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')}]);
  const multi=new Set(rows.map(r=>r.p)).size>1;let out='',cur=null;
  rows.forEach(r=>{if(r.p!==cur){cur=r.p;out+=(out?'\n':'')+'👤 <b>'+aurEsc(r.p.name)+'</b>\n';}out+='• '+aurEsc(r.f.label)+': <b>'+aurEsc(r.f.value)+'</b>\n';});
  const chips=rows.slice(0,14).map(r=>({label:aurL('Copiar ','Copy ')+r.f.label+(multi?' ('+String(r.p.name).split(' ')[0]+')':''),fn:()=>aurCopy(r.f.value,r.f.label+aurL(' copiado ✓',' copied ✓'))}));
  chips.push({label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')});
  return aurSay(out.trim(),chips);
}
function aurFieldLbl(fd){return aurAppLang()==='en'?fd.labelEn:fd.label;}
function aurInfo(F,quiet){
  const c=F.c;
  const P=aurA(typeof personalInfo!=='undefined'?personalInfo:[]).filter(p=>p&&Array.isArray(p.fields));
  const docEnt=F.cands.find(e=>e.type==='doc'&&e.score>=0.9);
  const docLike=F.fields.some(f=>['cc','carta','passaporte'].includes(f.k));
  if(docEnt&&docLike&&c.has('OPEN')&&!c.has('NUM')&&!c.has('COPY')&&!c.has('D_INFO')&&!c.has('GET'))return AUR_PASS;
  if(!F.fields.length&&!F.labelHits.length&&!c.has('D_INFO')&&!(F.best&&F.best.type==='person'))return AUR_PASS;
  if(!F.fields.length&&!F.labelHits.length&&!c.has('D_INFO')&&F.best&&F.best.type==='person'&&F.confident===false&&F.cands.filter(e=>e.score>=0.5).length>1)return AUR_PASS;
  if(!P.length){if(quiet)return AUR_PASS;return aurSay(aurL('Ainda não tens pessoas na aba Info.','You don’t have anyone in the Info tab yet.'),[{label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')}]);}
  let persons=F.persons.map(e=>e.obj);
  if(!persons.length&&c.has('MINE')){const o=aurOwner();if(o)persons=[o];}
  const all=c.has('ALL')||(!F.fields.length&&!F.labelHits.length);
  if(!persons.length)persons=all?[aurOwner()||P[0]]:P;
  const rows=aurFieldRows(persons,F,all);
  if(!rows.length){
    if(F.fields.some(f=>f.k==='matricula')){const V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle'&&a.plate);if(V.length)return aurSay('🚗 '+aurL('Matrícula','Licence plate')+(V.length>1?'s':'')+':\n'+V.map(v=>'• '+aurEsc(v.name)+': <b>'+aurEsc(v.plate)+'</b>').join('\n'),V.map(v=>({label:aurL('Copiar ','Copy ')+v.name,fn:()=>aurCopy(v.plate,aurL('Matrícula copiada ✓','Plate copied ✓'))})));}
    if(quiet)return AUR_PASS;
    const labels=[...new Set([].concat(...persons.map(p=>aurA(p.fields).map(f=>f.label))).filter(Boolean))];
    const want=F.fields.map(f=>aurL(f.label,f.labelEn)).join(', ')||aurL('esse dado','that detail');
    return aurSay(aurL('Não tenho '+aurEsc(want)+' guardado','I don’t have '+aurEsc(want)+' saved')+(persons.length===1?aurL(' para <b>',' for <b>')+aurEsc(persons[0].name)+'</b>':'')+'.'+(labels.length?aurL('\nDados disponíveis: ','\nAvailable details: ')+labels.map(aurEsc).join(', ')+'.':''),[F.fields.length?{label:aurL('Adicionar ','Add ')+aurL(F.fields[0].label,F.fields[0].labelEn),fn:()=>aurGoTab('info')}:null,{label:aurL('Ver tudo','See everything'),fn:()=>aurPersonCard(persons,null,true)}]);
  }
  if(rows.length===1&&!all){const r=rows[0];aurCopy(r.f.value,r.f.label+aurL(' copiado ✓',' copied ✓'));
    return aurSay(aurEsc(r.f.label)+aurL(' de <b>',' — <b>')+aurEsc(r.p.name)+'</b>:\n<span class="a-code">'+aurEsc(r.f.value)+'</span>\n<span class="a-dim">'+aurL('copiado para a área de transferência','copied to clipboard')+'</span>',[docEnt&&docLike?{label:aurL('Abrir o documento','Open the document'),fn:()=>aurOpenEnt(docEnt,F,true)}:null,{label:aurL('Info completa','Full info'),fn:()=>aurPersonCard([r.p],null,true)}]);}
  return aurPersonCard(persons,rows,all);
}
function aurFieldValue(F,fd){
  const m=F.raw.match(new RegExp(fd.rk.source+'\\s*(?:[:=]|é|e\\s|is\\s)?\\s*(.+)$','i'));if(!m)return '';
  let v=m[m.length-1].trim();const pm=v.match(/\b(?:para|to)\s+(.+)$/i);if(pm)v=pm[1].trim();
  v=v.replace(/^(?:number|numero|número|n[ºo]\.?|is|é)\s+/i,'');
  F.persons.forEach(pe=>{aurSig(aurNorm(pe.name)).forEach(t=>{v=v.replace(new RegExp('\\s+(?:d[aoe]s?|of|for)\\s+'+t+'\\b.*$','i'),'');});});
  v=v.replace(/\s+(por favor|pf|obrigad[oa]|please|thanks)$/i,'').replace(/^(o|a|do|da|de|meu|minha|my|the)\s+/i,'').replace(/[.;!?]+$/,'').trim();
  if(!v||(!/\d/.test(v)&&v.length<3))return '';
  if(aurSig(aurNorm(v)).every(t=>AUR_VOCAB[t]))return '';
  return v;
}
function aurInfoSet(F,change){
  const person=F.persons.length?F.persons[0].obj:aurOwner();
  if(!person){aurTab('info');aurClose();return aurSay(aurL('Abri a aba Info — cria primeiro uma pessoa em "+ Nova pessoa".','I opened the Info tab — first create a person with "+ New person".'));}
  const fd=F.fields[0];const val=fd?aurFieldValue(F,fd):'';
  if(!fd||!val){
    if(fd&&['cc','carta','passaporte'].includes(fd.k)&&!change)return aurSay(aurL('Queres guardar o <b>número</b> na Info, ou adicionar o <b>documento</b> (foto/scan)?','Do you want to save the <b>number</b> in Info, or add the <b>document</b> (photo/scan)?'),[{label:aurL('Número na Info','Number in Info'),fn:()=>aurGoTab('info')},{label:aurL('Documento','Document'),fn:()=>{aurTab('docs');if(typeof openDocModal==='function'){aurClose();openDocModal();}}}]);
    const lbl=fd?aurL(fd.label.toLowerCase(),fd.labelEn.toLowerCase()):aurL('nif','tax number');
    return aurSay(aurL('Diz-me o valor. Ex.: "'+(change?'muda o meu ':'adiciona o meu ')+lbl+(change?' para ':' ')+'123456789".','Tell me the value. E.g. "'+(change?'change my ':'add my ')+lbl+(change?' to ':' ')+'123456789".'),[{label:aurL('Abrir Info','Open Info'),fn:()=>aurGoTab('info')}]);
  }
  const ex=aurA(person.fields).find(f=>fd.l.test(aurCanon(f.label||''))&&!(fd.k==='cc'&&/validade|expiry/.test(aurNorm(f.label))));
  const newLbl=aurFieldLbl(fd);
  AUR.pending={ok:()=>{if(ex)ex.value=val;else person.fields.push({id:Date.now().toString(36),label:newLbl,value:val});aurLog(ex?'edit':'add',person.name+' · '+(ex?ex.label:newLbl),'👤');aurDirty();return aurSay(aurL('✓ '+(ex?'Atualizei ':'Guardei '),'✓ '+(ex?'Updated ':'Saved '))+aurEsc(ex?ex.label:newLbl)+aurL(' de <b>',' for <b>')+aurEsc(person.name)+'</b>: '+aurEsc(val));}};
  return aurSay(aurL(ex?'Vou atualizar ':'Vou adicionar ',ex?'I’ll update ':'I’ll add ')+aurEsc(ex?ex.label:newLbl)+aurL(' de <b>',' for <b>')+aurEsc(person.name)+'</b>'+(ex?':\n'+aurEsc(ex.value)+' → <b>'+aurEsc(val)+'</b>':': <b>'+aurEsc(val)+'</b>')+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}
function aurInfoDelete(F){
  const persons=F.persons.length?F.persons.map(e=>e.obj):[aurOwner()].filter(Boolean);
  const rows=aurFieldRows(persons,F,false);
  if(!rows.length)return aurSay(aurL('Não encontrei esse dado na Info.','I couldn’t find that detail in Info.'));
  const r=rows[0];
  AUR.pending={ok:()=>{r.p.fields=aurA(r.p.fields).filter(f=>f!==r.f);aurLog('delete',r.p.name+' · '+r.f.label,'🗑️');aurDirty();return aurSay(aurL('🗑️ Removi ','🗑️ Removed ')+aurEsc(r.f.label)+aurL(' de <b>',' from <b>')+aurEsc(r.p.name)+'</b>.');}};
  return aurSay(aurL('Remover ','Remove ')+aurEsc(r.f.label)+' (<b>'+aurEsc(r.f.value)+'</b>)'+aurL(' de ',' from ')+aurEsc(r.p.name)+'?',[{label:aurL('Remover','Remove'),fn:aurYes,danger:true},{label:aurL('Cancelar','Cancel'),fn:aurNo}]);
}

/* ── adicionar ── */
function aurAdd(F){
  const c=F.c;
  if(F.fields.length&&!c.has('D_DOC'))return aurInfoSet(F,false);
  if(c.has('D_NOTE')){aurTab('notes');if(typeof newNote==='function'){aurClose();newNote();}return aurSay(aurL('📝 Abri uma nota nova — escreve à vontade.','📝 I opened a new note — write away.'));}
  if(c.has('D_DOC')){aurTab('docs');if(typeof openDocModal==='function'){aurClose();openDocModal();}return aurSay(aurL('📄 Abri o formulário de documento novo.','📄 I opened the new document form.'));}
  if(c.has('D_SUBS')){if(typeof openSubModal==='function'){aurClose();openSubModal();}return aurSay(aurL('🔁 Abri o formulário de nova subscrição.','🔁 I opened the new subscription form.'));}
  if(c.has('D_WIFI')){if(typeof openWifiManager==='function'){aurClose();openWifiManager();}return aurSay(aurL('📶 Abri as redes Wi-Fi — adiciona aí a nova rede.','📶 I opened your Wi-Fi networks — add the new one there.'));}
  if(c.has('D_FUEL')){aurTab('vehicle');aurClose();return aurSay(aurL('⛽ Abri os Veículos — regista o abastecimento no veículo.','⛽ I opened Vehicles — log the refuel on the vehicle.'));}
  const ak=c.has('D_WARRANTY')?'warranty':c.has('D_LICENSE')?'license':c.has('D_VEHICLE')?'vehicle':c.has('D_DATES')?'dates':c.has('D_ASSETS')?'warranty':null;
  if(ak==='dates'&&F.date)return aurSchedule(F);
  if(ak){aurTab(ak);if(typeof openAssetModal==='function'){aurClose();openAssetModal(ak);}return aurSay(aurL('🏠 Abri um registo novo de ','🏠 I opened a new ')+aurAssetLbl(ak)+aurL('.',' entry.'));}
  if(c.has('D_CARD')||c.has('D_BANK')||c.has('D_STORE')){
    const store=c.has('D_STORE')||(F.best&&F.best.type==='store');const bank=c.has('D_BANK')||(F.best&&F.best.type==='bank');
    const goS=()=>{aurTab('store');if(typeof openStoreModal==='function'){aurClose();openStoreModal();}return aurSay(aurL('🎟️ Abri o formulário de cartão de loja.','🎟️ I opened the store card form.'));};
    const goB=()=>{aurTab('cards');if(typeof openCardModal==='function'){aurClose();openCardModal();}return aurSay(aurL('💳 Abri o formulário de cartão bancário.','💳 I opened the bank card form.'));};
    if(store&&!bank)return goS();if(bank&&!store)return goB();
    return aurSay(aurL('Que tipo de cartão queres adicionar?','What kind of card do you want to add?'),[{label:aurL('💳 Bancário','💳 Bank card'),fn:goB},{label:aurL('🎟️ De loja','🎟️ Store card'),fn:goS}]);
  }
  if(c.has('D_INFO'))return aurInfoSet(F,false);
  if(c.has('SCHEDULE')||c.has('D_CAL')||F.date)return aurSchedule(F);
  const pk=aurVaultPick(F);
  const hasCreds=/@/.test(F.raw)||/\b(user|utilizador|username|login)\b/i.test(F.raw);
  if(c.has('D_PW')&&pk.one&&!hasCreds&&!/\b(adiciona|adicionar|cria|criar|regista|registar|insere|inserir|add|create|register|insert)\b/.test(F.n))return aurChangePwOn(pk.one.obj,F);
  return aurAddEntry(F);
}
function aurAddEntry(F){
  const raw=F.raw;
  const email=(raw.match(/([\w.+-]+@[\w-]+\.[\w.-]+)/)||[])[1]||'';
  let pm=raw.match(/\b(?:password|palavra[- ]?passe|senha|pass|pw)\s*(?:[:=]|é|e\s|is\s)?\s*([^\s,;]+)/i),pw='';
  if(pm){const w=aurNorm(pm[1]);if(/^(forte|segura|aleatoria|nova|gerada|memoravel|facil|do|da|de|para|com|e|o|a|strong|secure|random|new|generated|memorable|easy|for|with|and|the|to|of)$/.test(w))pm=null;else pw=pm[1];}
  const um=raw.match(/\b(?:utilizador|username|user|login|nome de utilizador)\s*(?:[:=]|é|e\s|is\s)?\s*([^\s,;]+)/i);
  let user=um?um[1]:'';if(!user&&email)user=email;
  let rest=' '+raw+' ';[email,pm?pm[0]:'',um?um[0]:''].forEach(x=>{if(x)rest=rest.split(x).join(' ');});
  const kept=rest.split(/\s+/).filter(w=>{const nw=aurNorm(w).replace(/[^a-z0-9]/g,'');if(!nw)return false;if(AUR_STOP.has(nw))return false;const v=AUR_VOCAB[nw];if(v&&v.some(x=>x==='ADD'||x==='D_VAULT'||x==='D_PW'||x==='D_EMAIL'||x==='MOD_STRONG'||x==='GEN'))return false;if(/^(com|password|palavra|passe|senha|chave|nova|novo|conta|acesso|servico|site|app|with|and|new|account|service)$/.test(nw))return false;return true;});
  let name=kept.join(' ').replace(/^[,.;:\-]+|[,.;:\-]+$/g,'').trim();
  if(!name&&email){const dm=email.split('@')[1].split('.')[0];name=aurCap(dm);}
  if(!name){AUR.pending={type:'askName',withText:(t)=>aurConfirmAdd({name:aurCap(t.trim()),user,pw})};return aurSay(aurL('Para que serviço é este acesso? (ex.: Netflix)','Which service is this account for? (e.g. Netflix)'));}
  name=name===name.toLowerCase()?aurCap(name):name;
  const dup=aurA(typeof vault!=='undefined'?vault:[]).find(v=>aurNorm(v.name)===aurNorm(name)&&(!user||aurNorm(v.user)===aurNorm(user)));
  if(dup)return aurSay(aurL('Já tens <b>','You already have <b>')+aurEsc(dup.name)+'</b>'+(dup.user?' ('+aurEsc(dup.user)+')':'')+aurL('. O que queres fazer?','. What would you like to do?'),[{label:aurL('Mudar a password desse','Change its password'),fn:()=>aurChangePwOn(dup,F)},{label:aurL('Criar outro na mesma','Create another anyway'),fn:()=>aurConfirmAdd({name,user,pw})},{label:aurL('Cancelar','Cancel'),fn:aurNo}]);
  return aurConfirmAdd({name,user,pw});
}
function aurConfirmAdd(d){
  let gen=false;if(!d.pw){d.pw=aurGenPw(20);gen=true;}
  AUR.pending={ok:()=>aurDoAdd(d)};
  return aurSay(aurL('Vou criar este acesso:\n• Serviço: <b>','I’ll create this account:\n• Service: <b>')+aurEsc(d.name)+aurL('</b>\n• Utilizador: ','</b>\n• Username: ')+(d.user?aurEsc(d.user):'—')+'\n• Password: '+(gen?'<span class="a-code">'+aurEsc(d.pw)+'</span> <span class="a-dim">'+aurL('(gerada)','(generated)')+'</span>':'●●●●●●●● <span class="a-dim">('+d.pw.length+aurL(' caracteres · ',' characters · ')+aurPwStrength(d.pw)+')</span>')+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}
function aurDoAdd(d){
  const e={id:Date.now().toString(36),name:d.name,cat:'',user:d.user||'',pw:d.pw,url:d.url||'',notes:'',tags:[],flag:'',fields:[],folderId:null,isWifi:false,attachments:[],fav:false,archived:false,icon:'',createdAt:Date.now(),order:aurA(typeof vault!=='undefined'?vault:[]).length,pwUpdated:Date.now(),pwHistory:[],reviewedAt:null};
  vault.push(e);aurLog('add',e.name,'✨');aurDirty();AUR.last={type:'vault',obj:e,name:e.name};
  return aurSay(aurL('✓ Criei o acesso <b>','✓ Created the account <b>')+aurEsc(e.name)+aurL('</b>. Não te esqueças de gravar.','</b>. Don’t forget to save.'),[{label:aurL('Copiar password','Copy password'),fn:()=>aurCopy(e.pw,aurL('Password copiada ✓','Password copied ✓'))},{label:aurL('Gravar agora','Save now'),fn:()=>{if(typeof saveFile==='function')saveFile();}},{label:aurL('Abrir','Open'),fn:()=>{if(typeof openReadMode==='function'){aurClose();openReadMode(e.id);}}}]);
}

/* ── agendar ── */
function aurSchedule(F){
  const d=F.date||aurParseDate(F.n);
  if(!d){AUR.pending={type:'askDate',withText:(t)=>aurHandle(F.raw+' '+t)};return aurSay(aurL('📅 Para que dia? (ex.: 15/03/2027, "amanhã", "dia 3 de maio", "daqui a 2 semanas")','📅 For which day? (e.g. 15/03/2027, "tomorrow", "3 May", "in 2 weeks")'));}
  const reason=aurReason(F.raw);
  const yearly=/\b(todos os anos|anualmente|cada ano|aniversario|anual|every year|yearly|annually|birthday|anniversary)\b/.test(F.n);
  if(!reason){AUR.pending={type:'askName',withText:(t)=>aurConfirmSchedule(aurCap(t.trim()),d,yearly)};return aurSay('📅 '+aurDate(d)+aurL(' — qual é o motivo do lembrete?',' — what’s the reminder for?'));}
  return aurConfirmSchedule(reason,d,yearly);
}
function aurConfirmSchedule(name,d,yearly){
  AUR.pending={ok:()=>{const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const a={id:Date.now().toString(36),kind:'dates',name,date:iso,yearly:!!yearly,notes:'',attachments:[]};assets.push(a);aurLog('add',name,'🎂');aurDirty();return aurSay(aurL('✓ Agendado: <b>','✓ Scheduled: <b>')+aurEsc(name)+aurL('</b> a ','</b> on ')+aurDate(d)+aurL('. Aparece no calendário e nos avisos.','. It shows up on the calendar and in the alerts.'),[{label:aurL('Ver calendário','View calendar'),fn:aurOpenCal}]);}};
  return aurSay(aurL('📅 Vou agendar:\n• <b>','📅 I’ll schedule:\n• <b>')+aurEsc(name)+'</b>\n• '+aurDate(d)+' ('+aurRel(d)+')'+(yearly?aurL(' · repete todos os anos',' · repeats every year'):'')+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}

/* ── apagar / arquivar / recuperar ── */
function aurPickOne(F,types){
  const cs=F.cands.filter(e=>e.score>=0.5&&(!types||types.includes(e.type)));
  if(cs.length===1||(cs.length>1&&cs[0].score-cs[1].score>=0.15))return {one:cs[0]};
  if(cs.length>1)return {many:cs};
  if(AUR.last&&/\b(essa|esse|isso|dela|dele|esta|este|it|that|this one)\b/.test(F.n))return {one:AUR.last};
  return {};
}
const AUR_DEL={vault:['deleteEntry','vault'],doc:['deleteDoc','documents'],bank:['deleteCard','bankCards'],store:['deleteStoreCard','storeCards'],wifi:['deleteWifiNet','wifiNets'],note:['deleteNoteById','notes'],asset:['deleteAsset','assets'],sub:['deleteSub','subscriptions'],totp:['deleteTotp','totp']};
function aurGlobal(n){switch(n){case 'vault':return typeof vault!=='undefined'?vault:undefined;case 'documents':return typeof documents!=='undefined'?documents:undefined;case 'bankCards':return typeof bankCards!=='undefined'?bankCards:undefined;case 'storeCards':return typeof storeCards!=='undefined'?storeCards:undefined;case 'wifiNets':return typeof wifiNets!=='undefined'?wifiNets:undefined;case 'notes':return typeof notes!=='undefined'?notes:undefined;case 'assets':return typeof assets!=='undefined'?assets:undefined;case 'subscriptions':return typeof subscriptions!=='undefined'?subscriptions:undefined;case 'totp':return typeof totp!=='undefined'?totp:undefined;case 'trash':return typeof trash!=='undefined'?trash:undefined;
  case 'deleteEntry':return typeof deleteEntry==='function'?deleteEntry:undefined;case 'deleteDoc':return typeof deleteDoc==='function'?deleteDoc:undefined;case 'deleteCard':return typeof deleteCard==='function'?deleteCard:undefined;case 'deleteStoreCard':return typeof deleteStoreCard==='function'?deleteStoreCard:undefined;case 'deleteWifiNet':return typeof deleteWifiNet==='function'?deleteWifiNet:undefined;case 'deleteNoteById':return typeof deleteNoteById==='function'?deleteNoteById:undefined;case 'deleteAsset':return typeof deleteAsset==='function'?deleteAsset:undefined;case 'deleteSub':return typeof deleteSub==='function'?deleteSub:undefined;case 'deleteTotp':return typeof deleteTotp==='function'?deleteTotp:undefined;
  case 'archiveEntry':return typeof archiveEntry==='function'?archiveEntry:undefined;case 'restoreEntry':return typeof restoreEntry==='function'?restoreEntry:undefined;case 'archiveDoc':return typeof archiveDoc==='function'?archiveDoc:undefined;case 'restoreDoc':return typeof restoreDoc==='function'?restoreDoc:undefined;case 'archiveCard':return typeof archiveCard==='function'?archiveCard:undefined;case 'restoreCard':return typeof restoreCard==='function'?restoreCard:undefined;case 'archiveNote':return typeof archiveNote==='function'?archiveNote:undefined;case 'restoreNote':return typeof restoreNote==='function'?restoreNote:undefined;}return undefined;}
function aurDelete(F){
  if(F.fields.length&&(F.c.has('D_INFO')||F.persons.length||F.c.has('MINE')))return aurInfoDelete(F);
  const pk=aurPickOne(F,Object.keys(AUR_DEL));
  if(pk.many)return aurChoose(pk.many,F,aurL('Qual queres apagar?','Which one do you want to delete?'),e=>aurDeleteEnt(e));
  if(!pk.one)return aurSay(aurL('O que queres apagar? Diz-me o nome — ex.: "apaga o acesso Netflix".','What do you want to delete? Tell me the name — e.g. "delete the Netflix account".'));
  return aurDeleteEnt(pk.one);
}
function aurDeleteEnt(e){
  if(e.type==='totp'&&aurTotpLocked())return aurNeed2fa(aurL('apaga o 2fa ','delete 2fa ')+e.name);
  const d=AUR_DEL[e.type];if(!d)return aurSay(aurL('Esse tipo de item não se apaga por aqui.','That kind of item can’t be deleted from here.'));
  const fn=aurGlobal(d[0]);if(typeof fn!=='function')return aurSay(aurL('Não consegui apagar.','I couldn’t delete it.'));
  const id=e.obj.id;fn(id);
  const still=aurA(aurGlobal(d[1])).some(x=>x&&x.id===id);
  if(still)return aurSay(aurL('Ficou tudo como estava.','Nothing was changed.'));
  if(AUR.last&&AUR.last.obj===e.obj)AUR.last=null;
  const inTrash=['vault','doc','note','bank'].includes(e.type);
  return aurSay('🗑️ <b>'+aurEsc(e.name)+aurL('</b> apagado','</b> deleted')+(inTrash?aurL(' — está na reciclagem se precisares.',' — it’s in the trash if you need it.'):'.'),[{label:aurL('Desfazer','Undo'),fn:()=>aurQuick(aurL('recupera ','restore ')+e.name)}]);
}
const AUR_ARCH={vault:['archiveEntry','restoreEntry'],doc:['archiveDoc','restoreDoc'],bank:['archiveCard','restoreCard'],note:['archiveNote','restoreNote']};
function aurArchive(F){
  const pk=aurPickOne(F,Object.keys(AUR_ARCH));
  if(pk.many)return aurChoose(pk.many,F,aurL('Qual queres arquivar?','Which one do you want to archive?'),e=>aurArchiveEnt(e));
  if(!pk.one){if(F.c.has('D_ARCHIVE')||!F.terms.length)return aurGoTab('archive');return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(F.terms.join(' '))+aurL('» para arquivar.','» to archive.'));}
  return aurArchiveEnt(pk.one);
}
function aurArchiveEnt(e){const fn=aurGlobal(AUR_ARCH[e.type][0]);if(typeof fn!=='function')return aurSay(aurL('Esse item não se arquiva.','That item can’t be archived.'));if(e.obj.archived)return aurSay('<b>'+aurEsc(e.name)+aurL('</b> já está arquivado.','</b> is already archived.'));fn(e.obj.id);return aurSay('📦 <b>'+aurEsc(e.name)+aurL('</b> foi para o Arquivo.','</b> was moved to the Archive.'),[{label:aurL('Desfazer','Undo'),fn:()=>{aurGlobal(AUR_ARCH[e.type][1])(e.obj.id);aurSay(aurL('↩️ Desarquivado.','↩️ Unarchived.'));}}]);}
function aurRestore(F){
  const TR=aurA(aurGlobal('trash'));
  const hits=[];TR.forEach(it=>{const d=(it&&it.data)||{};const nm=d.name||d.title||'';if(!nm)return;const nn=aurCanon(nm);const s=aurMatchEnt({toks:aurSig(nn),alias:[]},F.Q,F.Qset);if(s>=0.5)hits.push({it,nm,s});});
  hits.sort((a,b)=>b.s-a.s);
  const doR=h=>{const i=aurA(aurGlobal('trash')).indexOf(h.it);if(i<0)return aurSay(aurL('Esse item já não está na reciclagem.','That item is no longer in the trash.'));if(typeof restoreTrashItem==='function')restoreTrashItem(i);return aurSay(aurL('♻️ Recuperei <b>','♻️ Restored <b>')+aurEsc(h.nm)+aurL('</b> da reciclagem.','</b> from the trash.'));};
  if(hits.length===1||(hits.length>1&&hits[0].s-hits[1].s>=0.15))return doR(hits[0]);
  if(hits.length>1)return aurSay(aurL('Qual queres recuperar?','Which one do you want to restore?'),hits.slice(0,8).map(h=>({label:h.nm,fn:()=>doR(h)})));
  const ar=F.cands.filter(e=>e.archived&&e.score>=0.5&&AUR_ARCH[e.type]);
  if(ar.length){const e=ar[0];const fn=aurGlobal(AUR_ARCH[e.type][1]);if(typeof fn==='function'){fn(e.obj.id);return aurSay(aurL('📦↩️ Desarquivei <b>','📦↩️ Unarchived <b>')+aurEsc(e.name)+'</b>.');}}
  if(!TR.length)return aurSay(aurL('A reciclagem está vazia — não há nada para recuperar.','The trash is empty — there’s nothing to restore.'));
  if(!F.terms.length)return aurGoTab('trash');
  return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(F.terms.join(' '))+aurL('» na reciclagem nem no arquivo.','» in the trash or the archive.'),[{label:aurL('Abrir reciclagem','Open trash'),fn:()=>aurGoTab('trash')}]);
}
function aurEmptyTrash(){
  const TR=aurA(aurGlobal('trash'));if(!TR.length)return aurSay(aurL('A reciclagem já está vazia ✓','The trash is already empty ✓'));
  if(typeof emptyTrash==='function')emptyTrash();
  return aurSay(aurA(aurGlobal('trash')).length?aurL('Ficou tudo como estava.','Nothing was changed.'):aurL('🗑️ Reciclagem esvaziada ('+TR.length+' itens apagados definitivamente).','🗑️ Trash emptied ('+TR.length+' items permanently deleted).'));
}

/* ── copiar ── */
function aurCopyCmd(F){
  if(F.fields.length||F.labelHits.length){const r=aurInfo(F);if(r!==AUR_PASS)return r;}
  const pk=aurPickOne(F,['vault','totp','wifi','person','store']);
  if(pk.many)return aurChoose(pk.many,F,aurL('De qual?','Which one?'),e=>aurCopyEnt(e,F));
  if(!pk.one)return aurSay(aurL('O que queres copiar? Ex.: "copia a password do PayPal", "copia o meu NIF".','What do you want to copy? E.g. "copy the PayPal password", "copy my tax number".'));
  return aurCopyEnt(pk.one,F);
}
function aurCopyEnt(e,F){
  const o=e.obj;
  if(e.type==='vault'){const wantUser=F.c.has('D_EMAIL')&&!F.c.has('D_PW');const val=wantUser?o.user:o.pw;if(!val)return aurSay('<b>'+aurEsc(e.name)+aurL('</b> não tem '+(wantUser?'utilizador':'password')+' guardado.','</b> has no '+(wantUser?'username':'password')+' saved.'));aurCopy(val,wantUser?aurL('Utilizador copiado ✓','Username copied ✓'):aurL('Password copiada ✓','Password copied ✓'));AUR.last=e;return aurSay(aurL('📋 Copiei ','📋 Copied ')+(wantUser?aurL('o utilizador (','the username (')+aurEsc(o.user)+')':aurL('a password','the password'))+aurL(' de <b>',' for <b>')+aurEsc(e.name)+'</b>.'+(wantUser?'':' <span class="a-dim">'+aurL('Limpa-se sozinha do clipboard.','It clears itself from the clipboard.')+'</span>'));}
  if(e.type==='totp')return aurShowCode(o);
  if(e.type==='wifi'){if(!o.pw)return aurSay(aurL('Essa rede não tem password.','That network has no password.'));aurCopy(o.pw,aurL('Password do Wi-Fi copiada ✓','Wi-Fi password copied ✓'));return aurSay(aurL('📋 Copiei a password do Wi-Fi <b>','📋 Copied the Wi-Fi password for <b>')+aurEsc(e.name)+'</b>.');}
  if(e.type==='person')return aurPersonCard([o],null,true);
  return aurOpenEnt(e,F);
}

/* ── temas, privacidade, idioma, definições, exportar ── */
function aurApplyTheme(t){if(typeof applyThemePreset==='function'){applyThemePreset(t.id);return aurSay(aurL('🎨 Tema <b>','🎨 <b>')+(t.emoji?t.emoji+' ':'')+aurEsc(t.name)+aurL('</b> aplicado.','</b> theme applied.'));}return aurSay(aurL('Não consegui aplicar o tema.','I couldn’t apply the theme.'));}
function aurTheme(F){
  const TH=aurA(typeof THEME_PRESETS!=='undefined'?THEME_PRESETS:[]);
  const te=F.cands.find(e=>e.type==='theme'&&e.score>=0.5);if(te)return aurApplyTheme(te.obj);
  if(F.c.has('MOD_LIGHT')||F.c.has('MOD_DARK')){const dark=F.c.has('MOD_DARK');return aurSay(aurL('Temas '+(dark?'escuros':'claros')+' — toca para aplicar:',(dark?'Dark':'Light')+' themes — tap to apply:'),TH.filter(t=>!!t.dark===dark).map(t=>({label:(t.emoji||'')+' '+t.name,fn:()=>aurApplyTheme(t)})));}
  if(F.c.has('OPEN')&&!F.terms.length)return aurSettings('aspeto');
  return aurSay(aurL('🎨 Escolhe um tema:','🎨 Pick a theme:'),TH.map(t=>({label:(t.emoji||'')+' '+t.name,fn:()=>aurApplyTheme(t)})).concat([{label:aurL('Personalizar cores','Customise colours'),fn:()=>aurSettings('aspeto')}]));
}
function aurPriv(F){
  if(typeof togglePrivacy!=='function')return aurSay(aurL('O modo de privacidade não está disponível.','Privacy mode isn’t available.'));
  const on=typeof privacyOn!=='undefined'?!!privacyOn:null;
  if(F.c.has('ON')&&on===true)return aurSay(aurL('O modo de privacidade já está ativo 🙈','Privacy mode is already on 🙈'));
  if(F.c.has('OFF')&&on===false)return aurSay(aurL('O modo de privacidade já está desligado 👁️','Privacy mode is already off 👁️'));
  togglePrivacy();const now=typeof privacyOn!=='undefined'?!!privacyOn:!on;
  return aurSay(now?aurL('🙈 Modo de privacidade ativado — os valores ficam ocultos.','🙈 Privacy mode on — values are hidden.'):aurL('👁️ Modo de privacidade desligado.','👁️ Privacy mode off.'));
}
function aurLang(F){
  if(typeof setLang!=='function')return aurSay(aurL('Não consigo mudar o idioma.','I can’t change the language.'));
  const en=/\b(ingles|english|en)\b/.test(F.n);setLang(en?'en':'pt');
  return aurSay(en?aurL('🇬🇧 App agora em inglês. (Continuo a responder na língua em que me escreves.)','🇬🇧 App now in English.'):aurL('🇵🇹 App em português.','🇵🇹 App now in Portuguese. (I’ll keep replying in the language you write in.)'));
}
function aurSettings(tab,msg){
  if(typeof openSettings==='function'){aurClose();openSettings();if(tab&&typeof switchSettingsTab==='function')switchSettingsTab(tab);}
  const L={aspeto:['Aspeto','Appearance'],seguranca:['Segurança','Security'],dados:['Dados','Data'],heranca:['Herança Digital','Digital legacy'],sobre:['Sobre','About']};
  return aurSay(msg||(aurL('⚙️ Abri as Definições','⚙️ Opened Settings')+(tab&&L[tab]?' → '+aurL(L[tab][0],L[tab][1]):'')+'.'));
}
function aurExport(F){
  if(F.c.has('D_PDF')&&typeof exportPDF==='function'){exportPDF();return aurSay(aurL('📄 A exportar para PDF…','📄 Exporting to PDF…'));}
  if(F.c.has('D_CSV')&&typeof exportCSV==='function'){exportCSV();return aurSay(aurL('📊 A exportar para CSV…','📊 Exporting to CSV…'));}
  return aurSay(aurL('Em que formato?','Which format?'),[{label:'PDF',fn:()=>{exportPDF();aurSay(aurL('📄 A exportar para PDF…','📄 Exporting to PDF…'));}},{label:'CSV',fn:()=>{exportCSV();aurSay(aurL('📊 A exportar para CSV…','📊 Exporting to CSV…'));}}]);
}

/* ── dinheiro, combustível, contagens, wifi, listas ── */
function aurPerMonth(){return aurL('/mês','/month');}
function aurSubCard(s){
  let m=0;try{m=subMonthly(s)||0;}catch(e){}
  let nx=null;try{nx=typeof subNextCharge==='function'?subNextCharge(s):null;}catch(e){}
  const cyc=s.cycle==='yearly'?aurL('anual','yearly'):s.cycle==='monthly'?aurL('mensal','monthly'):s.cycle;
  return aurSay('🔁 <b>'+aurEsc(s.name)+'</b>\n'+aurL('Valor: <b>','Price: <b>')+aurMoney(s.amount)+'</b>'+(cyc?' ('+aurEsc(cyc)+')':'')+' · ≈ '+aurMoney(m)+aurPerMonth()+' · '+aurMoney(m*12)+aurL('/ano','/year')+(aurIsDate(nx)?aurL('\nPróxima cobrança: ','\nNext charge: ')+aurDate(nx)+' ('+aurRel(nx)+')':''),[{label:aurL('Gerir subscrições','Manage subscriptions'),fn:()=>{if(typeof openSubsScreen==='function'){aurClose();openSubsScreen();}}}]);
}
function aurSubs(F){
  const S=aurA(typeof subscriptions!=='undefined'?subscriptions:[]);
  if(F.confident&&F.best.type==='sub')return aurSubCard(F.best.obj);
  if(!S.length)return aurSay(aurL('Não tens subscrições registadas.','You don’t have any subscriptions saved.'),[{label:aurL('Adicionar subscrição','Add subscription'),fn:()=>{if(typeof openSubModal==='function'){aurClose();openSubModal();}}}]);
  let tot=0;const rows=S.map(s=>{let m=0;try{m=subMonthly(s)||0;}catch(e){}tot+=m;return {s,m};}).sort((a,b)=>b.m-a.m);
  const manage={label:aurL('Gerir subscrições','Manage subscriptions'),fn:()=>{if(typeof openSubsScreen==='function'){aurClose();openSubsScreen();}}};
  if(F.c.has('OPEN')&&!F.c.has('HOWMUCH')){if(typeof openSubsScreen==='function'){aurClose();openSubsScreen();}return aurSay(aurL('🔁 Abri as tuas subscrições.','🔁 I opened your subscriptions.'));}
  if(F.c.has('HOWMUCH')||F.c.has('D_MONEY'))return aurSay(aurL('🔁 Gastas <b>','🔁 You spend <b>')+aurMoney(tot)+aurPerMonth()+aurL('</b> em subscrições (≈ ','</b> on subscriptions (≈ ')+aurMoney(tot*12)+aurL('/ano) — ','/year) — ')+S.length+aurL(' ativas.\nMais caras: ',' active.\nMost expensive: ')+rows.slice(0,3).map(r=>aurEsc(r.s.name)+' ('+aurMoney(r.m)+aurPerMonth()+')').join(', ')+'.',[{label:aurL('Ver todas','See all'),fn:()=>aurQ('lista as subscricoes','list my subscriptions')},manage]);
  return aurSay('🔁 <b>'+aurL('Subscrições','Subscriptions')+'</b> ('+S.length+') · '+aurMoney(tot)+aurPerMonth()+'\n'+rows.map(r=>'• '+aurEsc(r.s.name)+' — '+aurMoney(r.m)+aurPerMonth()).join('\n'),[manage]);
}
function aurFuel(F){
  let V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle');
  if(F.confident&&F.best.type==='asset'&&F.best.obj.kind==='vehicle')V=[F.best.obj];
  if(!V.length)return aurSay(aurL('Ainda não tens veículos em Bens.','You don’t have any vehicles in Assets yet.'),[{label:aurL('Adicionar veículo','Add vehicle'),fn:()=>{aurTab('vehicle');if(typeof openAssetModal==='function'){aurClose();openAssetModal('vehicle');}}}]);
  const L=V.map(v=>{const f=aurA(v.fuel);if(!f.length)return '🚗 <b>'+aurEsc(v.name)+aurL('</b>: sem abastecimentos registados','</b>: no refuels logged');let s=null;try{s=fuelStats(f);}catch(e){}if(!s)return '🚗 <b>'+aurEsc(v.name)+aurL('</b>: não consegui calcular','</b>: I couldn’t calculate it');
    return '🚗 <b>'+aurEsc(v.name)+'</b>'+(v.plate?' ('+aurEsc(v.plate)+')':'')+aurL('\n   Consumo médio: <b>','\n   Average consumption: <b>')+(s.avg!=null&&isFinite(s.avg)?s.avg.toFixed(1)+' L/100km':aurL('— (precisa de 2 depósitos cheios)','— (needs 2 full tanks)'))+aurL('</b>\n   Custo: ','</b>\n   Cost: ')+(s.eurPer100!=null&&isFinite(s.eurPer100)?aurMoney(s.eurPer100)+'/100 km':'—')+' · '+(s.perMonth!=null&&isFinite(s.perMonth)?aurMoney(s.perMonth)+aurPerMonth():'—')+'\n   Total: '+aurMoney(s.eurTotal||0)+' · '+(+s.litTotal||0).toFixed(0)+' L · '+(+s.kmTotal||0).toFixed(0)+' km';});
  return aurSay(aurL('⛽ <b>Combustível</b>\n','⛽ <b>Fuel</b>\n')+L.join('\n'),[{label:aurL('Abrir veículos','Open vehicles'),fn:()=>aurGoTab('vehicle')}]);
}
function aurCount(F){
  const c=F.c,n=x=>aurA(x).filter(i=>i&&!i.archived).length;
  const V=aurGlobal('vault'),Dc=aurGlobal('documents'),SC=aurGlobal('storeCards'),BC=aurGlobal('bankCards'),N=aurGlobal('notes'),SB=aurGlobal('subscriptions'),W=aurGlobal('wifiNets'),AS=aurGlobal('assets');
  const PI=typeof personalInfo!=='undefined'?personalInfo:[];
  const say=(num,pt,en)=>aurSay(aurL('Tens <b>'+num+'</b> '+pt+'.','You have <b>'+num+'</b> '+en+'.'));
  if(c.has('D_PW')||c.has('D_VAULT')){const arch=aurA(V).length-n(V);return aurSay(aurL('Tens <b>'+n(V)+'</b> acessos guardados','You have <b>'+n(V)+'</b> saved accounts')+(arch>0?aurL(' (+'+arch+' arquivados)',' (+'+arch+' archived)'):'')+'.');}
  if(c.has('D_DOC'))return say(n(Dc),'documentos','documents');
  if(c.has('D_STORE'))return say(n(SC),'cartões de loja','store cards');
  if(c.has('D_BANK')||c.has('D_CARD'))return aurSay(aurL('Cartões bancários: <b>'+n(BC)+'</b> · de loja: <b>'+n(SC)+'</b>.','Bank cards: <b>'+n(BC)+'</b> · store cards: <b>'+n(SC)+'</b>.'));
  if(c.has('D_NOTE'))return say(n(N),'notas','notes');
  if(c.has('D_SUBS'))return say(n(SB),'subscrições','subscriptions');
  if(c.has('D_WIFI'))return say(n(W),'redes Wi-Fi','Wi-Fi networks');
  if(c.has('D_INFO'))return say(n(PI),'pessoas na Info','people in Info');
  if(c.has('D_TRASH'))return aurSay(aurL('A reciclagem tem <b>'+aurA(aurGlobal('trash')).length+'</b> itens.','The trash has <b>'+aurA(aurGlobal('trash')).length+'</b> items.'));
  const kinds={D_WARRANTY:'warranty',D_LICENSE:'license',D_VEHICLE:'vehicle',D_DATES:'dates'};
  for(const k in kinds)if(c.has(k)){const q=aurA(AS).filter(a=>a.kind===kinds[k]).length;const pl={warranty:['garantias','warranties'],license:['licenças','licences'],vehicle:['veículos','vehicles'],dates:['datas importantes','important dates']}[kinds[k]];return say(q,pl[0],pl[1]);}
  return aurSummary();
}
function aurWifi(F){
  const W=aurA(aurGlobal('wifiNets'));
  if(!W.length)return aurSay(aurL('Ainda não tens redes Wi-Fi guardadas.','You don’t have any Wi-Fi networks saved yet.'),[{label:aurL('Adicionar rede','Add network'),fn:()=>{if(typeof openWifiManager==='function'){aurClose();openWifiManager();}}}]);
  if(W.length===1)return aurOpenEnt({type:'wifi',obj:W[0],name:W[0].name||W[0].ssid},F,true);
  return aurSay(aurL('📶 Qual rede?','📶 Which network?'),W.map(w=>({label:w.name||w.ssid,fn:()=>aurOpenEnt({type:'wifi',obj:w,name:w.name||w.ssid},F,true)})).concat([{label:aurL('Gerir redes','Manage networks'),fn:()=>{if(typeof openWifiManager==='function'){aurClose();openWifiManager();}}}]));
}
function aurList(F){
  const c=F.c;let items=[],title='';
  const mk=(type,arr,nm)=>aurA(arr).filter(x=>x&&!x.archived).map(o=>({type,obj:o,name:nm(o)||aurL('(sem nome)','(no name)')}));
  if(c.has('D_PW')||c.has('D_VAULT')){items=mk('vault',aurGlobal('vault'),o=>o.name);title=aurL('🔑 Acessos','🔑 Accounts');}
  else if(c.has('D_DOC')){items=mk('doc',aurGlobal('documents'),o=>o.title||o.name);title=aurL('📄 Documentos','📄 Documents');}
  else if(c.has('D_NOTE')){items=mk('note',aurGlobal('notes'),o=>o.title);title=aurL('📝 Notas','📝 Notes');}
  else if(c.has('D_STORE')){items=mk('store',aurGlobal('storeCards'),o=>o.name);title=aurL('🎟️ Cartões de loja','🎟️ Store cards');}
  else if(c.has('D_BANK')||c.has('D_CARD')){items=mk('bank',aurGlobal('bankCards'),o=>o.name||o.bank);title=aurL('💳 Cartões bancários','💳 Bank cards');}
  else if(c.has('D_WIFI')){items=mk('wifi',aurGlobal('wifiNets'),o=>o.name||o.ssid);title=aurL('📶 Redes Wi-Fi','📶 Wi-Fi networks');}
  else if(c.has('D_INFO')){items=mk('person',typeof personalInfo!=='undefined'?personalInfo:[],o=>o.name);title=aurL('👤 Pessoas','👤 People');}
  else{const kinds={D_WARRANTY:'warranty',D_LICENSE:'license',D_VEHICLE:'vehicle',D_DATES:'dates'};const T={warranty:['🏠 Garantias','🏠 Warranties'],license:['🏠 Licenças','🏠 Licences'],vehicle:['🏠 Veículos','🏠 Vehicles'],dates:['🏠 Datas importantes','🏠 Important dates']};for(const k in kinds)if(c.has(k)){items=aurA(aurGlobal('assets')).filter(a=>a.kind===kinds[k]).map(o=>({type:'asset',obj:o,name:o.name}));title=aurL(T[kinds[k]][0],T[kinds[k]][1]);}}
  if(!title)return AUR_PASS;
  if(!items.length)return aurSay(title+aurL(': ainda não tens nenhum.',': none yet.'));
  return aurSay(title+' ('+items.length+aurL(') — toca para abrir:',') — tap to open:'),items.slice(0,24).map(e=>({label:aurEntLabel(e),fn:()=>aurOpenEnt(e,F,true)})));
}
function aurEmails(){
  const set=[...new Set(aurA(aurGlobal('vault')).map(v=>(v.user||'').trim()).filter(u=>/@/.test(u)))];
  if(!set.length)return aurSay(aurL('Não encontrei emails nos teus acessos.','I didn’t find any emails in your accounts.'));
  return aurSay(aurL('📧 Emails usados nos teus acessos — toca para copiar:','📧 Emails used in your accounts — tap to copy:'),set.slice(0,12).map(u=>({label:u,fn:()=>aurCopy(u,aurL('Email copiado ✓','Email copied ✓'))})));
}

/* ── procura livre (último recurso — nunca fica sem resposta útil) ── */
function aurFind(F,tab){
  const terms=F.terms;
  if(!terms.length)return aurSay(aurL('Diz-me um pouco mais — por exemplo:','Tell me a bit more — for example:'),aurQuickChips().concat([{label:aurL('Tudo o que sei fazer','Everything I can do'),fn:aurHelp}]));
  const q=terms.join(' ');const E=aurIndex();
  let hits=F.cands.filter(e=>e.score>=0.34&&e.type!=='theme');
  const seen=new Set(hits.map(h=>h.obj));
  E.forEach(e=>{if(seen.has(e.obj)||e.type==='theme')return;if(e.extra&&terms.some(t=>t.length>=3&&e.extra.indexOf(t)>=0)){hits.push(Object.assign({},e,{score:0.3}));seen.add(e.obj);}});
  const infoRows=[];aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>aurA(p&&p.fields).forEach(f=>{const hay=aurNorm((f.label||'')+' '+(f.value||''));if(terms.some(t=>t.length>=3&&hay.indexOf(t)>=0))infoRows.push({p,f});}));
  if(hits.length===1&&hits[0].score>=0.5&&!infoRows.length)return aurOpenEnt(hits[0],F,true);
  if(hits.length||infoRows.length){const ch=hits.slice(0,8).map(e=>({label:aurEntLabel(e),fn:()=>aurOpenEnt(e,F,true)}));infoRows.slice(0,4).forEach(r=>ch.push({label:r.f.label+' · '+String(r.p.name).split(' ')[0],fn:()=>aurPersonCard([r.p],[r],false)}));return aurSay(aurL('Encontrei isto sobre «','Here’s what I found for «')+aurEsc(q)+'»:',ch);}
  const near=[];const used=new Set();
  E.forEach(e=>{if(e.type==='theme')return;let bd=99;e.toks.forEach(t=>terms.forEach(x=>{if(x.length>=3&&t.length>=3){const d=aurLev(x,t);if(d<bd)bd=d;}}));const lim=Math.max(2,Math.floor(Math.max(...e.toks.map(t=>t.length))/3));if(bd<=lim&&!used.has(e.obj)){near.push({e,d:bd});used.add(e.obj);}});
  near.sort((a,b)=>a.d-b.d);
  if(near.length)return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(q)+aurL('». Querias dizer:','». Did you mean:'),near.slice(0,6).map(x=>({label:aurEntLabel(x.e),fn:()=>aurOpenEnt(x.e,F,true)})));
  return aurSay(aurL('Não encontrei «','I couldn’t find «')+aurEsc(q)+aurL('» em nenhuma parte do cofre (passwords, 2FA, documentos, cartões, notas, Info, bens, subscrições, Wi-Fi).','» anywhere in your vault (passwords, 2FA, documents, cards, notes, Info, assets, subscriptions, Wi-Fi).'),[tab?{label:aurL('Abrir ','Open ')+aurTabShort(tab),fn:()=>aurGoTab(tab)}:null,{label:aurL('Tudo o que sei fazer','Everything I can do'),fn:aurHelp}]);
}
/* ═══════════ INTERFACE ═══════════ */
const AUR_SVG={
 spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
 reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
 chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
};
function aurGreet(){
  AUR.lang=aurAppLang();
  const nm=typeof vaultName!=='undefined'&&vaultName?', '+aurEsc(String(vaultName).split(' ')[0]):'';
  const ex=aurGreetExamples();
  const chips=ex.list.map(x=>({label:x[0],fn:()=>aurQuick(x[1])}));
  const foot=ex.fresh?aurL('Também podes escrever o que precisares — percebo português e inglês.','You can also type what you need — I understand English and Portuguese.'):aurL('O que perguntares, eu procuro no teu cofre — também percebo inglês.','Whatever you ask, I’ll look it up in your vault — I understand Portuguese too.');
  const msg=ex.fresh?aurL('Olá'+nm+'! Sou a <b>Aurora</b> ✨ Vou ajudar-te a começar.\nExperimenta:','Hi'+nm+'! I’m <b>Aurora</b> ✨ I’ll help you get started.\nTry:'):aurL('Olá'+nm+'! Sou a <b>Aurora</b> ✨ Conheço o teu cofre e trabalho 100% offline.\nExperimenta:','Hi'+nm+'! I’m <b>Aurora</b> ✨ I know your vault and work 100% offline.\nTry:');
  aurSay(msg,chips);
  const last=[...document.querySelectorAll('#aurora-msgs .aurora-msg.ai')].pop();
  if(last){const f=document.createElement('div');f.className='a-dim';f.style.marginTop='8px';f.textContent=foot;last.appendChild(f);}
}
/* 3 exemplos tirados do cofre de cada pessoa (nunca sugere o que a pessoa não tem) */
function aurGreetExamples(){
  const L=(pt,en)=>aurL(pt,en),out=[];
  const V=(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived&&v.name);
  const D=typeof documents!=='undefined'?documents:[],C=typeof bankCards!=='undefined'?bankCards:[],N=typeof notes!=='undefined'?notes:[];
  const T=(!aurTotpLocked()&&typeof totp!=='undefined'&&Array.isArray(totp))?totp.filter(Boolean):[];
  const fresh=!V.length&&!D.length&&!C.length&&!N.length&&!T.length;
  if(fresh)return {fresh:true,list:[
    ['🔑 '+L('Guarda a password do email','Save my email password'),L('guarda a password do email','save my email password')],
    ['✨ '+L('Gera uma password forte','Generate a strong password'),L('gera uma password forte','generate a strong password')],
    ['🎓 '+L('Mostra-me como funciona','Show me how it works'),L('mostra-me como funciona','show me around')]]};
  const tn=T.map(x=>x.issuer||x.name||x.label||'').find(s=>s&&String(s).trim());
  if(tn)out.push(['🔢 '+L('Código 2FA · ','2FA code · ')+tn,L('código de '+tn,tn+' code')]);
  try{const now=new Date(),y=now.getFullYear(),m=now.getMonth(),today=now.toISOString().slice(0,10);
    const t0=new Date(now);t0.setHours(0,0,0,0);
    if(aurEvents().some(ev=>{const v=ev.date;let dt=v instanceof Date?new Date(v.getTime()):(/^\d{4}-\d\d-\d\d/.test(String(v))?new Date(String(v).slice(0,10)+'T00:00:00'):new Date(v));if(isNaN(dt))return false;dt.setHours(0,0,0,0);return dt>=t0&&dt.getFullYear()===y&&dt.getMonth()===m;}))out.push(['⏳ '+L('O que expira este mês','What expires this month'),L('o que expira este mês','what expires this month')]);}catch(e){}
  try{const P=typeof personalInfo!=='undefined'?personalInfo:[];if(P.some(p=>(p.fields||[]).some(f=>f&&f.value&&/\b(nif|contribuinte|tax)\b/i.test(aurNorm(f.label||'')))))out.push(['🪪 '+L('Qual o meu NIF','What’s my tax number'),L('qual o meu nif','what is my tax number')]);}catch(e){}
  if(out.length<3&&V.length){const v=V.slice().sort((a,b)=>(b.fav?1:0)-(a.fav?1:0)||((b.pwUpdated||b.updatedAt||b.createdAt||0)-(a.pwUpdated||a.updatedAt||a.createdAt||0)))[0];
    out.push(['🔑 Password · '+v.name,L('password de '+v.name,v.name+' password')]);}
  if(out.length<3)out.push(['✨ '+L('Gera uma password forte','Generate a strong password'),L('gera uma password forte','generate a strong password')]);
  if(out.length<3)out.push(['📊 '+L('Resumo do cofre','Vault summary'),L('resumo do cofre','vault summary')]);
  return {fresh:false,list:out.slice(0,3)};
}

let aurUILangNow='';
function aurUILang(){
  if(typeof document==='undefined')return;const en=aurAppLang()==='en';aurUILangNow=aurAppLang();
  const set=(sel,prop,val)=>{const el=document.querySelector(sel);if(el)el[prop]=val;};
  set('#aurora-panel .a-ttl span','innerHTML','<i></i>'+(en?'100% offline':'100% offline')+'<em class="a-sub2" style="font-style:normal">&nbsp;· '+(en?'your vault':'o teu cofre')+'</em>');
  set('#aurora-input','placeholder',en?'Ask me anything about your vault…':'Pede-me qualquer coisa do cofre…');
  const T=[['.a-hbtn[data-k="reset"]',en?'New conversation':'Nova conversa'],['.a-hbtn[data-k="min"]',en?'Minimise':'Minimizar'],['.a-hbtn[data-k="close"]',en?'Close':'Fechar'],['#aurora-send',en?'Send':'Enviar'],['#aurora-fab',en?'Open Aurora AI':'Abrir a Aurora AI']];
  T.forEach(([sel,t])=>{const el=document.querySelector(sel);if(el){el.title=t;el.setAttribute('aria-label',t);}});
}
function auroraOpen(){
  if(typeof masterKey==='undefined'||!masterKey){if(typeof toast==='function')toast(aurAppLang()==='en'?'Unlock the vault first.':'Desbloqueia o cofre primeiro.');return;}
  aurUILang();
  const p=document.getElementById('aurora-panel');if(!p)return;
  p.classList.add('open');p.classList.remove('min','has-new');document.body.classList.add('aur-docked');aurFab();
  const m=document.getElementById('aurora-msgs');if(m&&!m.dataset.greeted){m.dataset.greeted='1';aurGreet();}
  setTimeout(()=>{const i=document.getElementById('aurora-input');if(i)try{i.focus({preventScroll:true});}catch(e){i.focus();}},260);
}
function auroraClose(){aurClose(true);}
function auroraToggleMin(){const p=document.getElementById('aurora-panel');if(!p)return;if(!p.classList.contains('open'))return auroraOpen();if(p.classList.contains('min'))p.classList.remove('min','has-new');else p.classList.add('min');}
function auroraReset(){const m=document.getElementById('aurora-msgs');if(m){m.innerHTML='';m.dataset.greeted='1';}AUR.pending=null;AUR.last=null;AUR.resume=null;AUR.acts=[];aurGreet();}
function auroraSend(){
  const i=document.getElementById('aurora-input');if(!i)return;const txt=(i.value||'').trim();if(!txt)return;i.value='';
  const p=document.getElementById('aurora-panel');if(p)p.classList.remove('min','has-new');
  AUR.hist.push(txt);if(AUR.hist.length>50)AUR.hist.shift();AUR.hIdx=AUR.hist.length;
  AUR.out(aurEsc(txt),'me');const typing=AUR.out('<span class="a-typing"><i></i><i></i><i></i></span>','ai typing');
  setTimeout(()=>{if(typing&&typing.remove)typing.remove();try{aurHandle(txt);}catch(e){aurSay(aurL('Tive um problema a processar isso (','I had a problem processing that (')+aurEsc(e.message)+aurL('). Tenta de outra forma ou escreve <b>ajuda</b>.','). Try another way or type <b>help</b>.'));}},260);
}
/* ideias que se escrevem sozinhas na caixa do Dashboard (tiradas do próprio cofre) */
function aurLaunchIdeas(){
  const en=aurAppLang()==='en';
  const I=[en?'How can I help?':'Em que posso ajudar?'];
  try{const T=aurA(typeof totp!=='undefined'?totp:[]);if(T[0]&&T[0].name)I.push((en?'Code for ':'Código da ')+T[0].name);}catch(e){}
  I.push(en?'What expires this month?':'O que expira este mês?',en?'What’s my tax number?':'Qual o meu NIF?');
  try{const D=aurA(typeof documents!=='undefined'?documents:[]);if(D[0]&&(D[0].title||D[0].name))I.push((en?'Open ':'Abre o ')+(D[0].title||D[0].name));}catch(e){}
  I.push(en?'How much do I spend on subscriptions?':'Quanto gasto em subscrições?',en?'Generate a strong password':'Gera uma password forte');
  return I;
}
(function aurTypewriter(){
  if(typeof document==='undefined')return;
  const still=typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let k=0,j=0,del=false,ideas=aurLaunchIdeas(),tl=aurAppLang();
  function tick(){
    const el=document.getElementById('aur-launch-ph');let wait=80;
    if(tl!==aurAppLang()){tl=aurAppLang();ideas=aurLaunchIdeas();k=0;j=0;del=false;}
    if(el&&!document.hidden){
      if(still){el.textContent=ideas[0];wait=4000;}
      else{const w=ideas[k%ideas.length];
        if(!del){j++;el.textContent=w.slice(0,j);if(j>=w.length){del=true;wait=k===0?3400:2200;}else wait=55+Math.random()*45;}
        else{j--;el.textContent=w.slice(0,Math.max(0,j));if(j<=0){del=false;k++;if(k%ideas.length===0){ideas=aurLaunchIdeas();k=0;}wait=420;}else wait=28;}}
    }else wait=600;
    setTimeout(tick,wait);
  }
  setTimeout(tick,900);
})();
(function aurInit(){
  if(typeof document==='undefined'||!document.body)return;
  const G='#00e6a8,#1fb6ff,#7b5cff,#ff5fb8,#ffcf5a,#00e6a8';
  const css=':root{--aur-w:400px}'
  +'@keyframes aurFlow{0%{background-position:0% 50%}100%{background-position:300% 50%}}'
  +'@keyframes aurFlowY{0%{background-position:50% 0%}100%{background-position:50% 300%}}'
  +'@keyframes aurBreath{0%,100%{opacity:.34;transform:scale(1)}50%{opacity:.68;transform:scale(1.025)}}'
  +'@keyframes aurDrift{0%,100%{transform:translateX(-18%) skewX(-10deg)}50%{transform:translateX(14%) skewX(-4deg)}}'
  +'@keyframes aurCaret{0%,49%{opacity:1}50%,100%{opacity:0}}'
  +'@keyframes aurSpark{0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(16deg) scale(1.14)}}'
  +'@keyframes aurDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}'
  /* anel aurora (contorno a fluir + brilho a respirar). O contorno avança aos degraus (20/s, igual à vista):
     a fluir contínuo obrigava a redesenhar a página 60×/s; o brilho desfocado só respira (feito pela placa gráfica) */
  +'.aur-ring{position:relative;isolation:isolate;border-radius:16px;padding:1.6px;background:linear-gradient(110deg,'+G+');background-size:300% 100%;animation:aurFlow 9s steps(180) infinite}'
  +'.aur-ring::before{content:"";position:absolute;inset:-7px 3px;border-radius:24px;background:linear-gradient(110deg,'+G+');background-size:300% 100%;animation:aurBreath 5s ease-in-out infinite;filter:blur(18px);z-index:-1;pointer-events:none;will-change:opacity,transform}'
  +'.aur-ring:hover::before,.aur-ring:focus-within::before{opacity:.9}'
  /* caixa do Dashboard */
  +'.dash-greeting{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px 30px}'
  +'.dash-greet-left{min-width:0;flex:0 1 auto}'
  +'.aur-launch{flex:1 1 360px;min-width:0;max-width:560px;box-sizing:border-box;cursor:pointer;outline:none;transition:transform .25s}'
  +'.aur-launch:hover{transform:translateY(-1px)}'
  +'.aur-launch-in{position:relative;overflow:hidden;min-width:0;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-radius:14.5px;background:var(--panel)}'
  +'.aur-launch-in::before{content:"";position:absolute;inset:-60% -20%;background:radial-gradient(38% 55% at 18% 50%,rgba(0,230,168,.24),transparent 70%),radial-gradient(34% 55% at 52% 45%,rgba(123,92,255,.22),transparent 70%),radial-gradient(30% 50% at 84% 58%,rgba(31,182,255,.2),transparent 70%);animation:aurDrift 13s ease-in-out infinite;pointer-events:none}'
  +'.aur-launch-in>*{position:relative}'
  +'.aur-launch-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#5ef2c9;background:linear-gradient(135deg,rgba(0,230,168,.2),rgba(123,92,255,.26));box-shadow:inset 0 0 0 1px rgba(94,242,201,.25)}'
  +'.aur-launch-ico svg{width:19px;height:19px;animation:aurSpark 3.4s ease-in-out infinite}'
  +'.aur-launch-txt{flex:1;min-width:0;font-size:.85rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  +'.aur-launch-txt b{color:var(--text);font-weight:600;letter-spacing:.3px}'
  +'.aur-caret{display:inline-block;width:1.5px;height:1.05em;background:var(--accent);margin-left:2px;vertical-align:-2px;animation:aurCaret 1s step-end infinite}'
  +'.aur-launch-go{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:0 0 auto;background:var(--accent);color:#0a0e1a;transition:transform .25s}'
  +'.aur-launch-go svg{width:17px;height:17px}.aur-launch:hover .aur-launch-go{transform:translateX(3px)}'
  +'@media(max-width:760px){.aur-launch{flex-basis:100%;max-width:none}}'
  /* botão flutuante (fora do Dashboard) */
  +'#aurora-fab{position:fixed;right:18px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:140;width:56px;height:56px;border-radius:50%;border:none;padding:0;cursor:pointer;display:none;align-items:center;justify-content:center;background:linear-gradient(110deg,'+G+');background-size:300% 100%;animation:aurFlow 9s steps(180) infinite;box-shadow:0 8px 26px rgba(0,0,0,.45),0 0 22px rgba(94,242,201,.35);transition:transform .2s}'
  +'#aurora-fab span{position:absolute;inset:2px;border-radius:50%;background:var(--panel);display:flex;align-items:center;justify-content:center;color:#5ef2c9}'
  +'#aurora-fab svg{width:24px;height:24px;animation:aurSpark 3.4s ease-in-out infinite}#aurora-fab:hover{transform:scale(1.07)}'
  /* painel lateral */
  +'#aurora-panel{position:fixed;top:0;right:0;height:100vh;height:100dvh;width:var(--aur-w);max-width:100vw;z-index:150;display:flex;flex-direction:column;background:var(--panel);border-left:1px solid var(--border);box-shadow:-18px 0 50px rgba(0,0,0,.35);transform:translateX(105%);visibility:hidden;transition:transform .38s cubic-bezier(.2,.8,.2,1),visibility 0s linear .38s}'
  +'#aurora-panel.open{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.2,.8,.2,1),visibility 0s}'
  +'#aurora-panel::before{content:"";position:absolute;left:-1px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,'+G+');background-size:100% 300%;animation:aurFlowY 7s steps(140) infinite;box-shadow:0 0 16px rgba(94,242,201,.55);z-index:2}'
  /* painel fechado (fora do ecrã): as animações dele ficavam a correr e obrigavam a redesenhar sempre */
  +'#aurora-panel:not(.open)::before,#aurora-panel:not(.open) *,#aurora-panel:not(.open) .aur-ring::before{animation-play-state:paused!important}'
  +'body.aur-docked #app{transition:margin-right .38s cubic-bezier(.2,.8,.2,1)}'
  +'@media(min-width:1100px){body.aur-docked #app{margin-right:var(--aur-w)}}'
  +'.aurora-grab{display:none}'
  +'@media(min-width:761px){body.aur-docked .toast,body.aur-docked .clipboard-toast{right:calc(var(--aur-w) + 20px)}}'
  +'.aurora-head{display:flex;align-items:center;gap:11px;padding:14px 14px 14px 16px;padding-top:calc(14px + env(safe-area-inset-top,0px));border-bottom:1px solid var(--border)}'
  +'.a-logo{position:relative;width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#5ef2c9;background:linear-gradient(135deg,rgba(0,230,168,.2),rgba(123,92,255,.28));box-shadow:inset 0 0 0 1px rgba(94,242,201,.28),0 0 18px rgba(94,242,201,.18)}'
  +'.a-logo svg{width:21px;height:21px;animation:aurSpark 3.4s ease-in-out infinite}'
  +'.a-ttl{display:flex;flex-direction:column;flex:1;min-width:0;gap:2px}'
  +'.a-ttl b{font-family:"Playfair Display",serif;color:var(--text);font-size:1.12rem;letter-spacing:.4px;font-weight:600}'
  +'.a-ttl span{font-size:.58rem;letter-spacing:1.3px;text-transform:uppercase;color:var(--text-muted);display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden}'
  +'.a-ttl span i{width:6px;height:6px;border-radius:50%;background:#2ee6a6;box-shadow:0 0 8px #2ee6a6}'
  +'.a-hbtn{width:34px;height:34px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:0 0 auto;transition:color .2s,border-color .2s}'
  +'.a-hbtn:hover{color:var(--text);border-color:var(--accent)}.a-hbtn svg{width:16px;height:16px;transition:transform .3s}.a-hbtn.min-only{display:none}'
  +'.aurora-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}'
  +'.aurora-msg{max-width:92%;padding:10px 13px;border-radius:14px;font-size:.84rem;line-height:1.6;white-space:pre-wrap;word-break:break-word;animation:appFadeIn .25s ease}'
  +'.aurora-msg.me{align-self:flex-end;background:var(--accent);color:#0a0e1a;border-bottom-right-radius:5px}'
  +'.aurora-msg.ai{align-self:flex-start;background:rgba(255,255,255,.045);border:1px solid var(--border);color:var(--text);border-bottom-left-radius:5px}'
  +'.aurora-msg.ai b{color:var(--accent-ink)}'
  +'.a-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;white-space:normal}'
  +'.a-btn{display:inline-block;padding:6px 12px;border:1px solid var(--accent);border-radius:20px;color:var(--accent-ink);cursor:pointer;font-size:.75rem;line-height:1.3;transition:background .2s}'
  +'.a-btn:hover{background:rgba(201,168,76,.12)}.a-btn.danger{border-color:#e05270;color:#e05270}'
  +'.a-code{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:1.05rem;letter-spacing:1.5px;color:var(--accent-ink);background:rgba(0,0,0,.25);padding:4px 10px;border-radius:8px;margin:3px 0;word-break:break-all}'
  +'.a-dim{opacity:.6;font-size:.77rem}'
  +'.a-typing{display:inline-flex;gap:4px;padding:3px 2px}.a-typing i{width:6px;height:6px;border-radius:50%;background:#5ef2c9;animation:aurDot 1.1s ease-in-out infinite}.a-typing i:nth-child(2){animation-delay:.15s;background:#1fb6ff}.a-typing i:nth-child(3){animation-delay:.3s;background:#7b5cff}'
  +'.aurora-in{padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border)}'
  +'.aurora-in-box{display:flex;gap:8px;align-items:center;background:var(--panel);border-radius:14.5px;padding:5px 5px 5px 14px}'
  +'.aurora-in input,.aurora-in input:focus{flex:1;min-width:0;width:auto!important;height:auto!important;margin:0!important;background:transparent!important;border:0 solid transparent!important;box-shadow:none!important;outline:none!important;border-radius:0!important;color:var(--text);font:inherit;font-size:.9rem;padding:9px 0!important}'
  +'.aurora-in button{width:38px;height:38px;border-radius:11px;border:none;background:var(--accent);color:#0a0e1a;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}'
  +'.aurora-in button svg{width:17px;height:17px}'
  /* telemóvel: folha que sobe de baixo e encolhe para a barra */
  +'@media(max-width:760px){'
  +'#aurora-panel{top:auto;bottom:0;width:100vw;height:74vh;height:74dvh;border-left:none;border-top:1px solid var(--border);border-radius:20px 20px 0 0;transform:translateY(105%);box-shadow:0 -18px 50px rgba(0,0,0,.5)}'
  +'#aurora-panel.open{transform:none}#aurora-panel.open.min{transform:translateY(calc(100% - 74px))}'
  +'#aurora-panel::before{left:18px;right:18px;top:-1px;bottom:auto;width:auto;height:2px;border-radius:2px;background:linear-gradient(90deg,'+G+');background-size:300% 100%;animation:aurFlow 7s steps(140) infinite}'
  +'.aurora-grab{display:block;width:40px;height:4px;border-radius:2px;background:var(--border);margin:9px auto 0}'
  +'body.aur-docked .toast,body.aur-docked .clipboard-toast{bottom:auto;top:calc(14px + env(safe-area-inset-top,0px));right:14px;left:14px;text-align:center}'
  +'.a-sub2{display:none}'
  +'.aurora-head{padding-top:8px;cursor:pointer}.a-hbtn.min-only{display:flex}'
  +'#aurora-panel.min .a-hbtn.min-only svg{transform:rotate(180deg)}'
  +'#aurora-panel.has-new .a-logo::after{content:"";position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:#ff5fb8;box-shadow:0 0 10px #ff5fb8}'
  +'}'
  +'@media(prefers-reduced-motion:reduce){.aur-ring,.aur-ring::before,.aur-launch-in::before,#aurora-panel::before,#aurora-fab,.aur-launch-ico svg,.a-logo svg,#aurora-fab svg,.aur-caret{animation:none!important}}';
  const st=document.createElement('style');st.id='aurora-css';st.textContent=css;document.head.appendChild(st);
  const fab=document.createElement('button');fab.id='aurora-fab';fab.title='Aurora AI';fab.setAttribute('aria-label','Abrir a Aurora AI');fab.dataset.act='auroraOpen';
  fab.innerHTML='<span>'+AUR_SVG.spark+'</span>';document.body.appendChild(fab);
  const panel=document.createElement('aside');panel.id='aurora-panel';panel.setAttribute('aria-label','Aurora AI');
  panel.innerHTML='<div class="aurora-grab"></div>'
   +'<div class="aurora-head" data-act="auroraHeadTap">'
   +'<div class="a-logo">'+AUR_SVG.spark+'</div>'
   +'<div class="a-ttl"><b>Aurora AI</b><span><i></i>100% offline<em class="a-sub2" style="font-style:normal">&nbsp;· o teu cofre</em></span></div>'
   +'<button class="a-hbtn" data-k="reset" title="Nova conversa" data-act="auroraReset" data-stop>'+AUR_SVG.reset+'</button>'
   +'<button class="a-hbtn min-only" data-k="min" title="Minimizar" data-act="auroraToggleMin" data-stop>'+AUR_SVG.chev+'</button>'
   +'<button class="a-hbtn" data-k="close" title="Fechar" data-act="auroraClose" data-stop>'+AUR_SVG.x+'</button>'
   +'</div>'
   +'<div class="aurora-msgs" id="aurora-msgs"></div>'
   +'<div class="aurora-in"><div class="aur-ring"><div class="aurora-in-box"><input id="aurora-input" placeholder="Pede-me qualquer coisa do cofre…" autocomplete="off" autocapitalize="sentences" enterkeyhint="send"><button id="aurora-send" data-act="auroraSend" title="Enviar">'+AUR_SVG.send+'</button></div></div></div>';
  document.body.appendChild(panel);
  aurUILang();
  const inp=document.getElementById('aurora-input');
  if(inp)inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();auroraSend();}
    else if(e.key==='ArrowUp'&&AUR.hist.length){AUR.hIdx=Math.max(0,AUR.hIdx-1);inp.value=AUR.hist[AUR.hIdx]||'';e.preventDefault();}
    else if(e.key==='ArrowDown'&&AUR.hist.length){AUR.hIdx=Math.min(AUR.hist.length,AUR.hIdx+1);inp.value=AUR.hist[AUR.hIdx]||'';e.preventDefault();}
  });
  setInterval(function(){
    if(document.hidden)return;
    const on=typeof masterKey!=='undefined'&&!!masterKey;
    if(!on){if(document.getElementById('aurora-panel').classList.contains('open'))aurClose(true);AUR.resume=null;AUR.pending=null;aurFab();return;}
    aurFab();
    if(aurUILangNow!==aurAppLang())aurUILang();
    if(AUR.resume&&!aurTotpLocked()){const t=AUR.resume;AUR.resume=null;auroraOpen();aurSay(aurL('🔓 Cofre 2FA desbloqueado — a continuar o teu pedido…','🔓 2FA vault unlocked — carrying on with your request…'));try{aurHandle(t);}catch(e){}}
  },700);
})();


/* ══ AURORA · AVISOS PROATIVOS (resumo no Dashboard; tocar abre a Aurora com o assunto resolvido) ══ */
function aurAlertsDismissed(){try{return JSON.parse(localStorage.getItem('av_alerts_off')||'{}');}catch(e){return {};}}
function aurAlertDismiss(k,ev){if(ev)ev.stopPropagation();const d=aurAlertsDismissed(),day=new Date().toISOString().slice(0,10);Object.keys(d).forEach(x=>{if(d[x]!==day)delete d[x];});d[k]=day;try{localStorage.setItem('av_alerts_off',JSON.stringify(d));}catch(e){}aurAlertsRender();}
function aurAlerts(){
  const keep=AUR.lang;AUR.lang=aurAppLang();const en=AUR.lang==='en',out=[];
  try{
    const t=aurToday(),ev=aurEvents();
    ev.filter(e=>e.date>=t&&e.date<=aurAddDays(t,7)).sort((a,b)=>a.date-b.date).slice(0,2).forEach(e=>{
      out.push({k:'soon:'+e.label+':'+aurDate(e.date),ic:AUR_EV_ICON[e.type]||'⏳',html:'<b>'+aurEsc(e.label)+'</b> '+(e.type==='renew'?aurL('renova ','renews '):aurL('expira ','expires '))+aurRel(e.date)+(e.type==='renew'&&e.amount?' · '+aurMoney(e.amount):''),run:()=>aurQ('o que expira nos proximos 7 dias','what expires in the next 7 days')});});
    const past=ev.filter(e=>e.date<t&&e.date>=aurAddDays(t,-14)&&e.type!=='renew'&&e.type!=='date').sort((a,b)=>b.date-a.date);
    if(past.length)out.push({k:'past:'+past.map(e=>e.label).join('|'),ic:'⚠️',html:past.length===1?'<b>'+aurEsc(past[0].label)+'</b> '+aurL('expirou ','expired ')+aurRel(past[0].date):aurL('<b>'+past.length+'</b> itens expiraram nas últimas 2 semanas','<b>'+past.length+'</b> items expired in the last 2 weeks'),run:()=>aurQ('o que ja expirou','what has expired')});
    const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived&&v.pw);
    const old=V.filter(v=>v.pwUpdated&&Date.now()-v.pwUpdated>365*864e5);
    if(old.length)out.push({k:'old:'+old.length,ic:'🔑',html:aurL('<b>'+old.length+'</b> '+(old.length===1?'password tem':'passwords têm')+' mais de 1 ano','<b>'+old.length+'</b> '+(old.length===1?'password is':'passwords are')+' over a year old'),run:()=>{aurSay(aurL('🔑 Passwords com mais de 1 ano — toca numa para gerar uma nova:','🔑 Passwords over a year old — tap one to generate a new one:'),old.slice(0,10).map(v=>({label:v.name+(v.user?' · '+v.user:''),fn:()=>aurChangePwOn(v,{raw:'',n:'',c:new Set()})})));}});
    const cnt={};V.forEach(v=>{cnt[v.pw]=(cnt[v.pw]||0)+1;});
    const bad=V.filter(v=>(typeof getPwScore==='function'&&getPwScore(v.pw)<2)||cnt[v.pw]>1).length;
    if(bad)out.push({k:'bad:'+bad,ic:'🛡️',html:aurL('<b>'+bad+'</b> '+(bad===1?'password fraca ou repetida':'passwords fracas ou repetidas'),'<b>'+bad+'</b> weak or reused '+(bad===1?'password':'passwords')),run:()=>avCleanupStart()});
  }catch(e){}
  AUR.lang=keep;
  const off=aurAlertsDismissed(),day=new Date().toISOString().slice(0,10);
  out.forEach(a=>{a.k=a.k.replace(/['"\\<>]/g,'');});
  return out.filter(a=>off[a.k]!==day).slice(0,4);
}
let AUR_ALERT_RUN=[];
function aurAlertGo(i){const a=AUR_ALERT_RUN[i];if(!a)return;auroraOpen();setTimeout(()=>{AUR.lang=aurAppLang();try{a.run();}catch(e){}},260);}
function aurAlertsRender(){
  if(typeof document==='undefined')return;
  const launch=document.querySelector('.aur-launch');let box=document.getElementById('aur-alerts');
  if(!launch||typeof masterKey==='undefined'||!masterKey){if(box)box.remove();return;}
  const list=aurAlerts();AUR_ALERT_RUN=list;
  if(!list.length){if(box)box.remove();return;}
  if(!box){box=document.createElement('div');box.id='aur-alerts';box.className='aur-alerts';}
  const side=document.getElementById('av-side');
  if(side&&side.previousElementSibling===launch){if(box.parentElement!==side)side.insertBefore(box,side.firstChild);}
  else if(box.previousElementSibling!==launch)launch.insertAdjacentElement('afterend',box);
  const en=aurAppLang()==='en';
  box.innerHTML='<div class="aur-al-h">✨ Aurora · '+(en?'Heads-up':'Avisos')+'</div>'+list.map((a,i)=>'<div class="aur-al-row" role="button" tabindex="0" data-act="aurAlertGo" data-enter="aurAlertGo" data-args="['+i+']"><span class="aur-al-ic">'+a.ic+'</span><span class="aur-al-tx">'+a.html+'</span><button class="aur-al-x" title="'+(en?'Dismiss until tomorrow':'Dispensar até amanhã')+'" data-act="aurAlertDismiss" data-arg="'+esc(a.k)+'" data-ev-last>✕</button></div>').join('');
}
(function(){if(typeof renderGreeting!=='function')return;const _rg=renderGreeting;renderGreeting=function(){const r=_rg.apply(this,arguments);try{aurAlertsRender();}catch(e){}return r;};})();




/* ═══════════ v10.12 — compreende mais pedidos (tudo local, nada sai do dispositivo) ═══════════ */
function aurVault(){return aurA(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived);}
function aurVEnt(v){return {type:'vault',obj:v,name:v.name,score:1};}
function aurNamesChips(L,fn){return L.slice(0,8).map(v=>({label:v.name,fn:()=>fn(v)}));}

// «a conta do banco», «o email do trabalho» → acessos dessa categoria
const AUR_CAT_EXTRA={banco:'banco bancos bancaria bank banking',trabalho:'trabalho emprego empresa work job office',jogo:'jogo jogos gaming game games',
  social:'social sociais facebook instagram redes',compras:'compras shopping loja lojas online',email:'correio mailbox webmail'};
function aurCatOf(n){
  const cats=typeof allEntryCats==='function'?allEntryCats():[];const words=' '+n+' ';
  const hit=k=>{const extra=(AUR_CAT_EXTRA[k.key]||'').split(' ');const lbl=aurSig(aurCanon(k.label||''));return [k.key,...extra,...lbl].some(w=>w&&w.length>=3&&words.includes(' '+w+' '));};
  const nonEmail=cats.find(k=>k.key!=='email'&&k.key!=='outro'&&hit(k));if(nonEmail)return nonEmail.key;
  if(/\b(conta|contas) (de |do )?(email|correio)\b|\bemail account\b|\bcorreio eletronico\b/.test(n))return 'email';
  return null;
}
function aurCatAccount(F){
  const c=F.c;if(!(c.has('D_PW')||c.has('D_EMAIL')||c.has('D_VAULT')))return AUR_PASS;
  if(c.has('ADD')||c.has('DELETE')||c.has('CHANGE')||c.has('ARCHIVE')||c.has('GEN')||c.has('SCHEDULE'))return AUR_PASS;
  if(F.cands.some(e=>e.type==='vault'&&e.score>=0.8))return AUR_PASS;
  const key=aurCatOf(F.n);if(!key)return AUR_PASS;
  const L=aurVault().filter(v=>v.cat===key);if(!L.length)return AUR_PASS;
  if(L.length===1)return aurOpenEnt(aurVEnt(L[0]),F,false);
  return aurChoose(L.map(aurVEnt),F,aurL('Tens '+L.length+' contas nesta categoria — qual é?','You have '+L.length+' accounts in this category — which one?'));
}

// «que documentos tenho da casa» → procura nos documentos (título, categoria, pasta, descrição, ficheiro)
function aurDocsAbout(F){
  const c=F.c;if(!c.has('D_DOC')||['ADD','DELETE','CHANGE','ARCHIVE','RESTORE','SCHEDULE','COUNT','D_EXPIRY','EXPORT','OPEN'].some(k=>c.has(k)))return AUR_PASS;
  if(F.confident&&F.best.type==='doc')return AUR_PASS;
  // assunto = palavras do pedido que não são ações nem «documento» (sem corrector: «barco» não pode virar «banco»)
  const skipC=x=>AUR_ACTIONS.has(x)||/^(D_DOC|MINE|ALL|D_FILE|D_PDF|D_CSV|D_EXPIRY|D_AUDIT|D_SUMMARY|D_MONEY|D_CAL|NUM)$/.test(x);
  const terms=F.Q.filter(t=>t.length>=3&&!(AUR_VOCAB[t]||[]).some(skipC)&&!/^(tenho|sobre|about|have|any)$/.test(t));if(!terms.length)return AUR_PASS;
  const folders=aurA(typeof docFolders!=='undefined'?docFolders:[]);
  const hay=d=>' '+aurCanon([d.title,d.desc,d.cat,typeof getDocCatLabel==='function'?getDocCatLabel(d.cat):'',(folders.find(f=>f.id===d.folderId)||{}).name,d.file&&d.file.name,d.facts&&d.facts.entity,d.text].filter(Boolean).join(' '))+' ';
  const D=aurA(typeof documents!=='undefined'?documents:[]).filter(d=>d&&!d.archived);
  const hit=D.filter(d=>{const h=hay(d);return terms.some(t=>h.includes(' '+t)||h.includes(t+' '));});
  const q=aurEsc(terms.join(' '));
  if(!hit.length)return aurSay(aurL('Não encontrei documentos sobre «'+q+'».','I found no documents about «'+q+'».'),[{label:aurL('Ver documentos','See documents'),fn:()=>aurGoTab('docs')}]);
  const ents=hit.map(d=>({type:'doc',obj:d,name:d.title||d.name||'',score:1}));
  if(ents.length===1&&!(hit[0].text&&!aurNorm(hit[0].title||'').includes(terms[0])))return aurOpenEnt(ents[0],F,true);
  // com o texto lido: mostra onde aparece
  return aurSay(aurL('📄 '+(ents.length===1?'1 documento':ents.length+' documentos')+' sobre «'+q+'»:','📄 '+ents.length+(ents.length===1?' document':' documents')+' about «'+q+'»:')+'\n'+hit.slice(0,6).map(d=>{const sn=d.text&&typeof avSnippet==='function'?avSnippet(d.text,terms):'';return '• <b>'+aurEsc(d.title||'')+'</b>'+(sn?' — <span class="a-dim">'+sn+'</span>':'');}).join('\n'),
    ents.slice(0,6).map(e=>({label:e.name,fn:()=>aurOpenEnt(e,F,true)})));
}

// «quando é a inspeção do golf», «quando acaba o seguro do carro»
const AUR_VEH_K=[['inspection',/\b(inspecao|inspecoes|ipo|inspection|inspections|mot)\b/,'inspeção','inspection',true],
  ['insurance',/\b(seguro|seguros|insurance)\b/,'seguro','insurance',false],['service',/\b(revisao|revisoes|manutencao|service|servicing)\b/,'revisão','service',false]];
function aurVehicleDate(F){
  if(F.c.has('SCHEDULE')||F.c.has('ADD')||F.c.has('CHANGE')||(F.date&&!F.c.has('WHEN')))return AUR_PASS;   // «lembra-me do seguro a 15 de março» é um lembrete
  const k=AUR_VEH_K.find(x=>x[1].test(F.n));if(!k)return AUR_PASS;
  const V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a&&a.kind==='vehicle');if(!V.length)return AUR_PASS;
  const named=F.cands.filter(e=>e.type==='asset'&&e.obj.kind==='vehicle'&&e.score>=0.5).map(e=>e.obj);
  if(!k[4]&&!named.length&&!F.c.has('D_VEHICLE'))return AUR_PASS;   // «seguro»/«revisão» só com um veículo à vista (não confundir com «é seguro?»)
  const pick=named.length?named:V;
  const lines=pick.map(v=>{const d=v[k[0]]?new Date(v[k[0]]):null;return '• 🚗 <b>'+aurEsc(v.name)+'</b> — '+(d&&!isNaN(d)?aurDate(d)+' ('+aurRel(d)+')':aurL('sem data registada','no date saved'));});
  return aurSay('<b>'+aurCap(aurL(k[2],k[3]))+'</b>\n'+lines.join('\n'),[{label:aurL('Abrir veículos','Open vehicles'),fn:()=>aurGoTab('vehicle')}]);
}

// «qual o PIN do cartão da CGD» → confirma que és tu e mostra por 20 s
function aurCardSecret(F){
  const m=/\b(pin|cvv|cvc)\b|\bcodigo de seguranca\b|\bsecurity code\b/.exec(F.n);if(!m)return AUR_PASS;
  const C=aurA(typeof bankCards!=='undefined'?bankCards:[]).filter(c=>c&&!c.archived);
  const named=F.cands.filter(e=>e.type==='bank'&&e.score>=0.5);
  if(!(F.c.has('D_CARD')||F.c.has('D_BANK')||named.length)||!C.length)return AUR_PASS;
  const field=m[1]==='pin'?'pin':'cvv',lbl=field==='pin'?'PIN':'CVV';
  const show=card=>{
    const val=card[field];const nm=aurEsc(card.bank||card.name||'');
    if(!val)return aurSay(aurL('O cartão <b>'+nm+'</b> não tem '+lbl+' guardado.','The <b>'+nm+'</b> card has no '+lbl+' saved.'));
    aurSay(aurL('🔒 Confirma que és tu para ver o '+lbl+' do cartão <b>'+nm+'</b>.','🔒 Confirm it’s you to see the '+lbl+' of the <b>'+nm+'</b> card.'));
    const ask=typeof avAuth==='function'?avAuth(aurL('Mostrar o '+lbl+' do cartão '+(card.bank||''),'Show the '+lbl+' of the '+(card.bank||'')+' card')):Promise.resolve(true);
    Promise.resolve(ask).then(ok=>{
      if(!ok)return aurSay(aurL('Ok, não mostrei.','Ok, I didn’t show it.'));
      const id='aurs'+Date.now().toString(36);
      aurSay('💳 '+lbl+aurL(' do cartão <b>',' of the <b>')+nm+'</b>'+aurL(': ',' card: ')+'<b id="'+id+'" style="letter-spacing:3px">'+aurEsc(val)+'</b>'+aurL(' · esconde-se em 20 s',' · hides in 20 s'),[{label:aurL('Copiar','Copy'),fn:()=>aurCopy(val,aurL(lbl+' copiado','Copied'))}]);
      setTimeout(()=>{const el=document.getElementById(id);if(el)el.textContent='••••';},20000);
    });
    return true;
  };
  const pick=named.length?named.map(e=>e.obj):C.length===1?C:null;
  if(pick&&pick.length===1)return show(pick[0]);
  return aurSay(aurL('De que cartão?','Which card?'),(pick||C).slice(0,8).map(c=>({label:c.bank||c.name||'•••• '+String(c.number||'').slice(-4),fn:()=>show(c)})));
}

// «quais sites usam a mesma password que o gmail»
function aurSamePw(F){
  if(!/\b(mesma|mesmas|igual|iguais|repetida|repetidas|reutiliz\w*|same|reused?)\b/.test(F.n))return AUR_PASS;
  const tgt=F.cands.find(e=>e.type==='vault'&&e.score>=0.5);if(!tgt)return AUR_PASS;
  const v=tgt.obj,nm=aurEsc(v.name);if(!v.pw)return aurSay(aurL('<b>'+nm+'</b> não tem password guardada.','<b>'+nm+'</b> has no password saved.'));
  const same=aurVault().filter(x=>x!==v&&x.pw===v.pw);
  if(!same.length)return aurSay(aurL('✅ Nenhuma outra conta usa a mesma password que <b>'+nm+'</b>.','✅ No other account uses the same password as <b>'+nm+'</b>.'));
  return aurSay(aurL('⚠️ <b>'+same.length+'</b> '+(same.length===1?'conta usa':'contas usam')+' a mesma password que <b>'+nm+'</b>: ','⚠️ <b>'+same.length+'</b> '+(same.length===1?'account uses':'accounts use')+' the same password as <b>'+nm+'</b>: ')+same.map(x=>'<b>'+aurEsc(x.name)+'</b>').join(', ')+aurL('.\nSe uma for roubada, as outras ficam expostas — toca para mudar:','.\nIf one leaks, the others are exposed — tap to change:'),
    aurNamesChips([v,...same],x=>aurChangePwOn(x,F)));
}

// «roubaram-me a password do email, o que faço?» → plano de ação
const AUR_BREACH=/\b(roubad\w*|roubaram|roubou|pirat\w*|hack\w*|comprometid\w*|vazad\w*|vazou|fuga|fugas|leak\w*|stolen|breach\w*|compromised|invadid\w*|invadiram|entraram|intrus\w*)\b/;
function aurBreach(F){
  if(!AUR_BREACH.test(F.n))return AUR_PASS;
  let tgt=F.cands.find(e=>e.type==='vault'&&e.score>=0.5);
  if(!tgt){
    const key=aurCatOf(F.n)||((F.c.has('D_EMAIL')||/\b(email|correio|mail)\b/.test(F.n))?'email':null);
    const L=key?aurVault().filter(v=>v.cat===key):[];
    if(L.length===1)tgt=aurVEnt(L[0]);
    else if(L.length>1)return aurChoose(L.map(aurVEnt),F,aurL('Qual das contas foi afetada?','Which account was affected?'),e=>aurBreachOn(e.obj,F));
  }
  if(!tgt&&/\b(verifica|verificar|analisa|analisar|procura|procurar|testa|testar|check|scan|test|estao|estou|aparecem|is|are|am)\b/.test(F.n)&&/\b(fuga|fugas|vazad\w*|leak\w*|breach\w*|pwned|comprometid\w*|compromised)\b/.test(F.n)){
    aurClose();if(typeof openHealthCheck==='function')openHealthCheck();
    return aurSay(aurL('🔎 Abri a verificação de fugas: cada password é comparada com as bases de dados de fugas conhecidas sem sair do dispositivo — só vão os primeiros 5 caracteres de um resumo (hash) da password, nunca a password.','🔎 I opened the leak check: each password is compared with known breach databases without leaving your device — only the first 5 characters of a hash are sent, never the password.'));
  }
  if(!tgt){
    if(!/\b(o que faco|que faco|que devo|ajuda|what (do|should) i do|help)\b/.test(F.n)&&(F.c.has('D_AUDIT')||F.c.has('D_PW')))return AUR_PASS;
    return aurSay(aurL('🛡️ Se achas que uma conta foi comprometida:\n1. Muda já a password dessa conta (diz-me qual e eu gero uma nova).\n2. Muda também em todas as contas onde usas a mesma password.\n3. Ativa a verificação em 2 passos (2FA).\n4. No site, termina a sessão em todos os dispositivos.\nDe que conta se trata?',
      '🛡️ If you think an account was compromised:\n1. Change its password now (tell me which and I’ll generate one).\n2. Change it everywhere you reuse that password.\n3. Turn on 2-step verification (2FA).\n4. On the site, sign out of all devices.\nWhich account is it?'),
      [{label:aurL('Verificar fugas de todas','Check all for leaks'),fn:()=>{aurClose();if(typeof openHealthCheck==='function')openHealthCheck();}}]);
  }
  return aurBreachOn(tgt.obj,F);
}
function aurBreachOn(v,F){
  const nm=aurEsc(v.name),base=aurNorm(v.name).split(' ')[0];
  const same=aurVault().filter(x=>x!==v&&x.pw&&x.pw===v.pw);
  const has2fa=aurA(typeof totp!=='undefined'?totp:[]).some(t=>{const n=aurNorm((t.name||'')+' '+(t.issuer||''));return base&&n.includes(base);});
  const isMail=v.cat==='email'||/\b(gmail|outlook|hotmail|yahoo|sapo|icloud|proton|mail)\b/.test(aurNorm(v.name+' '+(v.url||'')));
  const addr=isMail&&v.user&&/@/.test(v.user)?v.user:(isMail?aurNorm(v.name):'');
  const viaMail=isMail?aurVault().filter(x=>x!==v&&x.user&&v.user&&x.user.toLowerCase()===v.user.toLowerCase()):[];
  const steps=[aurL('1. <b>Muda já a password de '+nm+'</b> — gero uma forte e fica aqui guardada.','1. <b>Change the '+nm+' password now</b> — I’ll generate a strong one and keep it here.')];
  let k=2;
  if(same.length)steps.push(k+++'. '+aurL('<b>Usas a mesma password em '+same.length+' '+(same.length===1?'conta':'contas')+'</b> ('+same.map(x=>aurEsc(x.name)).join(', ')+') — muda-as também.','<b>You reuse this password in '+same.length+' '+(same.length===1?'account':'accounts')+'</b> ('+same.map(x=>aurEsc(x.name)).join(', ')+') — change them too.'));
  if(!has2fa)steps.push(k+++'. '+aurL('<b>Ativa a verificação em 2 passos</b> em '+nm+' e guarda o código em 2FA.','<b>Turn on 2-step verification</b> for '+nm+' and save the code in 2FA.'));
  if(viaMail.length)steps.push(k+++'. '+aurL('Este email recupera <b>'+viaMail.length+'</b> '+(viaMail.length===1?'conta':'contas')+' ('+viaMail.slice(0,5).map(x=>aurEsc(x.name)).join(', ')+(viaMail.length>5?'…':'')+') — vê se houve pedidos de recuperação de password.','This email recovers <b>'+viaMail.length+'</b> '+(viaMail.length===1?'account':'accounts')+' ('+viaMail.slice(0,5).map(x=>aurEsc(x.name)).join(', ')+(viaMail.length>5?'…':'')+') — check for password-reset requests.'));
  steps.push(k+++'. '+aurL('No site, <b>termina a sessão em todos os dispositivos</b>.','On the site, <b>sign out of all devices</b>.'));
  const chips=[{label:aurL('Mudar a password de ','Change password of ')+v.name,fn:()=>aurChangePwOn(v,F)}];
  same.slice(0,4).forEach(x=>chips.push({label:aurL('Mudar ','Change ')+x.name,fn:()=>aurChangePwOn(x,F)}));
  if(!has2fa)chips.push({label:aurL('Adicionar 2FA','Add 2FA'),fn:()=>{aurTab('totp');aurClose();if(typeof openTotpModal==='function')openTotpModal();}});
  chips.push({label:aurL('Verificar fugas','Check for leaks'),fn:()=>{aurClose();if(typeof openHealthCheck==='function')openHealthCheck();}});
  return aurSay(aurL('🛡️ Vamos proteger <b>'+nm+'</b>:\n','🛡️ Let’s secure <b>'+nm+'</b>:\n')+steps.join('\n'),chips);
}

// «contas mais antigas», «passwords que não mudo há mais de 2 anos»
function aurOld(F){
  if(!/\b(antig\w*|velh\w*|nao (uso|usei|mexo|mexi|mudo|mudei|altero|alterei|troco|troquei)|sem (mudar|alterar|trocar)|ha mais de|oldest|older|unused|not used|havent|stale|aged)\b/.test(F.n))return AUR_PASS;
  if(!(F.c.has('D_VAULT')||F.c.has('D_PW')))return AUR_PASS;
  const n=aurNumWords(F.n);const m=n.match(/(\d+)\s*(anos?|years?|mes|meses|months?)\b/);
  const days=m?(+m[1])*(/^(ano|anos|year|years)$/.test(m[2])?365:30):(/\b(ano|year)\b/.test(n)?365:180);
  const now=Date.now(),age=v=>{const t=v.pwUpdated||v.createdAt;return t?now-t:null;};
  const L=aurVault().filter(v=>{const a=age(v);return a!=null&&a>=days*864e5;}).sort((a,b)=>age(b)-age(a));
  const since=d=>{const y=Math.floor(d/365);return y>=1?aurL('há '+y+(y===1?' ano':' anos'),y+(y===1?' year':' years')+' ago'):aurL('há '+Math.floor(d/30)+' meses',Math.floor(d/30)+' months ago');};
  const note=aurL('\n<i>(conta desde a última mudança da password — a app não regista quando usas cada conta)</i>','\n<i>(counted from the last password change — the app doesn’t track when you use each account)</i>');
  if(!L.length)return aurSay(aurL('✅ Nenhuma password com mais de '+(days>=365?Math.round(days/365)+(days>=730?' anos':' ano'):Math.round(days/30)+' meses')+'.','✅ No password older than '+(days>=365?Math.round(days/365)+(days>=730?' years':' year'):Math.round(days/30)+' months')+'.')+note);
  return aurSay(aurL('🕰️ <b>'+L.length+'</b> '+(L.length===1?'conta tem':'contas têm')+' a password sem mudar há muito tempo:\n','🕰️ <b>'+L.length+'</b> '+(L.length===1?'account has':'accounts have')+' an old password:\n')+L.slice(0,10).map(v=>'• <b>'+aurEsc(v.name)+'</b> — '+since(Math.floor(age(v)/864e5))).join('\n')+(L.length>10?'\n…':'')+note,
    aurNamesChips(L,v=>aurChangePwOn(v,F)));
}
