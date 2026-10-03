// ══ THEME / ACCENT ══
// ══ THEME & COLOR SYSTEM ══
// Each theme stores its own bg, accent, text colors
const DEFAULT_COLORS = {
  dark:  { bg:'#0a0e1a', accent:'#c9a84c', text:'#e8e4d8' },
  light: { bg:'#f0ede8', accent:'#c9a84c', text:'#1e1c1a' }
};
let themeColors = {
  dark:  {...DEFAULT_COLORS.dark},
  light: {...DEFAULT_COLORS.light}
};
// Load saved colors from localStorage
try{
  const saved=localStorage.getItem('cv_theme_colors');
  if(saved){const parsed=JSON.parse(saved);if(parsed.dark&&parsed.light)themeColors=parsed;}
  const savedTheme=localStorage.getItem('cv_theme_mode');
  if(savedTheme)currentTheme=savedTheme;
}catch(e){}
let settingsActiveTheme = 'dark'; // which theme tab is showing in settings

// Preset palette for pickers
const BG_PRESETS_DARK  = ['#0a0e1a','#080808','#0d0f14','#0a1410','#160a0e','#0e1118','#1a1510','#1a0e0a'];
const BG_PRESETS_LIGHT = ['#f0ede8','#ffffff','#f5f0e8','#e8f0e8','#f0e8e8','#e8eaf0','#fafafa','#f8f4e8'];
const ACCENT_PRESETS   = ['#c9a84c','#4c8caf','#4caf82','#e05252','#9b6ec7','#e08840','#e0c850','#50c8c8'];
const TEXT_PRESETS_DARK  = ['#e8e4d8','#ffffff','#d4d0c8','#c8d4e0','#d0e0c8','#e0c8c8','#c8c8e0','#b0b0b0'];
const TEXT_PRESETS_LIGHT = ['#1e1c1a','#000000','#2a2824','#1a2030','#1a3020','#301a1a','#1a1a30','#3a3630'];

function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16);
  const g=parseInt(hex.slice(3,5),16);
  const b=parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
function darkenHex(hex, factor=0.6){
  const r=Math.round(parseInt(hex.slice(1,3),16)*factor);
  const g=Math.round(parseInt(hex.slice(3,5),16)*factor);
  const b=Math.round(parseInt(hex.slice(5,7),16)*factor);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function lightenHex(hex, factor=1.3){
  const r=Math.min(255,Math.round(parseInt(hex.slice(1,3),16)*factor));
  const g=Math.min(255,Math.round(parseInt(hex.slice(3,5),16)*factor));
  const b=Math.min(255,Math.round(parseInt(hex.slice(5,7),16)*factor));
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function saveThemeColors(){
  try{localStorage.setItem('cv_theme_colors',JSON.stringify(themeColors));}catch(e){}
}
// Texto na cor de destaque com contraste legível (WCAG AA, 4,5:1) sobre fundo, painéis e cartões:
// o dourado por omissão sobre o tema claro ficava a ~2:1. No tema escuro fica praticamente sempre igual à cor escolhida.
function relLum(rgb){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(rgb[0])+.7152*f(rgb[1])+.0722*f(rgb[2]);}
function contrastRatio(a,b){const x=relLum(a),y=relLum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function accentInk(accent,bgs){
  const[h,s,l]=hexToHslArr(accent),dark=relLum(bgs[0])<.4;
  for(let i=0;i<=34;i++){
    const rgb=hslToRgbArr(h,s,dark?Math.min(1,l+i*.02):Math.max(0,l-i*.02));
    if(bgs.every(b=>contrastRatio(rgb,b)>=4.5))return`rgb(${rgb.join(',')})`;
  }
  return dark?'#ffffff':'#000000';
}
function hexToHslArr(hex){const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0;const l=(max+min)/2;if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h/=6;}return[h*360,s,l];}
function hslToRgbArr(h,s,l){h=(((h%360)+360)%360)/360;const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};let r,g,b;if(s===0){r=g=b=l;}else{const q=l<0.5?l*(1+s):l+s-l*s;const p=2*l-q;r=f(p,q,h+1/3);g=f(p,q,h);b=f(p,q,h-1/3);}return[Math.round(r*255),Math.round(g*255),Math.round(b*255)];}
function applyThemeColors(theme){
  const c=themeColors[theme];
  const root=document.documentElement;
  // Apply bg variants
  const bgR=parseInt(c.bg.slice(1,3),16);
  const bgG=parseInt(c.bg.slice(3,5),16);
  const bgB=parseInt(c.bg.slice(5,7),16);
  const isDark=theme==='dark';
  const panelFactor=isDark?1.3:0.95;
  const borderFactor=isDark?1.8:0.92;
  const cardFactor=isDark?1.15:0.97;
  const panelR=Math.min(255,Math.round(bgR*panelFactor));
  const panelG=Math.min(255,Math.round(bgG*panelFactor));
  const panelB=Math.min(255,Math.round(bgB*panelFactor));
  const borderR=Math.min(255,Math.round(bgR*borderFactor));
  const borderG=Math.min(255,Math.round(bgG*borderFactor));
  const borderB=Math.min(255,Math.round(bgB*borderFactor));
  const cardR=Math.min(255,Math.round(bgR*cardFactor));
  const cardG=Math.min(255,Math.round(bgG*cardFactor));
  const cardB=Math.min(255,Math.round(bgB*cardFactor));
  root.style.setProperty('--bg',c.bg);
  root.style.setProperty('--panel',`rgb(${panelR},${panelG},${panelB})`);
  root.style.setProperty('--border',`rgb(${borderR},${borderG},${borderB})`);
  root.style.setProperty('--card',`rgb(${cardR},${cardG},${cardB})`);
  root.style.setProperty('--panel-glass',`rgba(${panelR},${panelG},${panelB},.9)`);
  root.style.setProperty('--card-glass',`rgba(${cardR},${cardG},${cardB},.85)`);
  root.style.setProperty('--text',c.text);
  // text-muted = 60% do caminho entre o fundo e o texto (a 50% ficava abaixo do contraste mínimo legível, 4,5:1)
  const textR=parseInt(c.text.slice(1,3),16);
  const textG=parseInt(c.text.slice(3,5),16);
  const textB=parseInt(c.text.slice(5,7),16);
  const mix=(t,b)=>Math.round(b+(t-b)*0.6);
  const mutedR=mix(textR,bgR),mutedG=mix(textG,bgG),mutedB=mix(textB,bgB);
  root.style.setProperty('--text-muted',`rgb(${mutedR},${mutedG},${mutedB})`);
  // Accent
  root.style.setProperty('--accent',c.accent);
  root.style.setProperty('--accent-dim',darkenHex(c.accent,0.65));
  root.style.setProperty('--accent-rgb',hexToRgb(c.accent));
  try{const[h2,s2,l2]=hexToHslArr(c.accent);const[r2,g2,b2]=hslToRgbArr(h2+42,s2,l2);root.style.setProperty('--accent2-rgb',`${r2},${g2},${b2}`);}catch(e){}
  try{root.style.setProperty('--accent-ink',accentInk(c.accent,[[bgR,bgG,bgB],[cardR,cardG,cardB],[panelR,panelG,panelB]]));}catch(e){}
  // Fixed vars
  const isDarkTheme=theme==='dark';
  root.style.setProperty('--red',isDarkTheme?'#e05252':'#b03020');
  root.style.setProperty('--green',isDarkTheme?'#4caf82':'#2a8a50');
  root.style.setProperty('--shadow',isDarkTheme?'rgba(0,0,0,.5)':'rgba(0,0,0,.15)');
}

function toggleTheme(){setTheme(currentTheme==='dark'?'light':'dark');}
function setTheme(t2){
  currentTheme=t2;
  document.documentElement.setAttribute('data-theme',t2);
  {const tb=document.getElementById('theme-btn');if(tb)tb.textContent=t2==='dark'?'🌙':'☀️';}
  applyThemeColors(t2);
  try{localStorage.setItem('cv_theme_mode',t2);}catch(e){}
  // Update settings tab if open
  const tabD=document.getElementById('s-tab-dark');
  const tabL=document.getElementById('s-tab-light');
  if(tabD)tabD.classList.toggle('active',t2==='dark');
  if(tabL)tabL.classList.toggle('active',t2==='light');
  settingsActiveTheme=t2;
}

// ══ SETTINGS COLOR PICKER ══
function switchSettingsTheme(theme){
  settingsActiveTheme=theme;
  setTheme(theme);
  refreshColorPickers();
  document.getElementById('s-tab-dark')?.classList.toggle('active',theme==='dark');
  document.getElementById('s-tab-light')?.classList.toggle('active',theme==='light');
}

function livePreviewColor(type, value){
  // Just update the preview bar live
  updatePreviewBar();
}

function applyColor(type, value){
  themeColors[settingsActiveTheme][type]=value;
  applyThemeColors(settingsActiveTheme);
  updatePreviewBar();
  renderPresetHighlights();
  saveThemeColors();
  buildManifest();
}

function updatePreviewBar(){
  const bar=document.getElementById('color-preview-bar');
  if(!bar)return;
  const c=themeColors[settingsActiveTheme];
  bar.style.background=c.bg;
  bar.style.borderColor=c.accent;
  bar.querySelector('span').style.color=c.accent;
}

const THEME_PRESETS=[
  {id:'aurora',name:'Aurora',emoji:'🌠',dark:true,bg:'#0a0e1a',accent:'#c9a84c',text:'#e8e4d8'},
  {id:'meianoite',name:'Meia-noite',emoji:'🌙',dark:true,bg:'#080810',accent:'#4c8caf',text:'#c8d4e0'},
  {id:'floresta',name:'Floresta',emoji:'🌲',dark:true,bg:'#0a1410',accent:'#4caf82',text:'#d0e0c8'},
  {id:'oceano',name:'Oceano',emoji:'🌊',dark:true,bg:'#0a1018',accent:'#3a9bc7',text:'#c8dae0'},
  {id:'porsol',name:'Pôr do sol',emoji:'🌅',dark:true,bg:'#160a0e',accent:'#e08840',text:'#e0d0c8'},
  {id:'rubi',name:'Rubi',emoji:'💎',dark:true,bg:'#140a0e',accent:'#e05270',text:'#e0c8d0'},
  {id:'ametista',name:'Ametista',emoji:'🔮',dark:true,bg:'#100a16',accent:'#9b6ec7',text:'#d4c8e0'},
  {id:'esmeralda',name:'Esmeralda',emoji:'✨',dark:true,bg:'#081410',accent:'#2ec98a',text:'#c8e0d4'},
  {id:'classico',name:'Clássico Claro',emoji:'☀️',dark:false,bg:'#f0ede8',accent:'#c9a84c',text:'#1e1c1a'},
  {id:'papel',name:'Papel',emoji:'📄',dark:false,bg:'#faf8f2',accent:'#a0864c',text:'#2a2824'},
  {id:'menta',name:'Menta',emoji:'🍃',dark:false,bg:'#eef5f0',accent:'#3a9b6e',text:'#1a3020'},
  {id:'ceu',name:'Céu',emoji:'☁️',dark:false,bg:'#eef2f8',accent:'#4c7caf',text:'#1a2030'},
];
function applyThemePreset(id){
  const th=THEME_PRESETS.find(t=>t.id===id);
  if(!th)return;
  const mode=th.dark?'dark':'light';
  // Guardar as cores no modo do tema
  themeColors[mode]={bg:th.bg,accent:th.accent,text:th.text};
  // Trocar para esse modo e aplicar
  currentTheme=mode;
  settingsActiveTheme=mode;
  document.documentElement.setAttribute('data-theme',mode);
  const tb=document.getElementById('theme-btn');if(tb)tb.textContent=mode==='dark'?'🌙':'☀️';
  try{localStorage.setItem('cv_theme_mode',mode);}catch(e){}
  applyThemeColors(mode);
  saveThemeColors();
  refreshColorPickers();
  buildManifest();
  renderThemeGrid();
  toast((currentLang==='en'?'Theme applied: ':'Tema aplicado: ')+th.emoji+' '+th.name);
}
function renderThemeGrid(){
  const grid=document.getElementById('theme-grid');
  if(!grid)return;
  const curBg=(getComputedStyle(document.documentElement).getPropertyValue('--bg')||'').trim().toLowerCase();
  grid.innerHTML=THEME_PRESETS.map(th=>{
    const active=curBg===th.bg.toLowerCase();
    return `<button class="theme-chip${active?' active':''}" data-act="applyThemePreset" data-arg="${esc(th.id)}" style="--tc-bg:${th.bg};--tc-accent:${th.accent}">
      <span class="theme-chip-preview"><span class="theme-chip-dot" style="background:${th.accent}"></span></span>
      <span class="theme-chip-name">${th.emoji} ${th.name}</span>
    </button>`;
  }).join('');
}
function buildPresets(containerId, presets, type){
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=presets.map(color=>`
    <div class="color-preset" style="background:${color}" title="${color}"
      data-act="pickPresetColor" data-arg="${esc(type)}" data-arg2="${esc(color)}">
    </div>`).join('');
}

function renderPresetHighlights(){
  const c=themeColors[settingsActiveTheme];
  ['bg','accent','text'].forEach(type=>{
    const val=c[type];
    document.querySelectorAll(`#presets-${type} .color-preset`).forEach(el=>{
      el.classList.toggle('active',el.style.background===val||el.getAttribute('title')===val);
    });
  });
}

function refreshColorPickers(){
  const c=themeColors[settingsActiveTheme];
  const pb=document.getElementById('picker-bg');if(pb)pb.value=c.bg;
  const pa=document.getElementById('picker-accent');if(pa)pa.value=c.accent;
  const pt=document.getElementById('picker-text');if(pt)pt.value=c.text;
  // Rebuild presets for active theme
  const isDark=settingsActiveTheme==='dark';
  buildPresets('presets-bg', isDark?BG_PRESETS_DARK:BG_PRESETS_LIGHT, 'bg');
  buildPresets('presets-accent', ACCENT_PRESETS, 'accent');
  buildPresets('presets-text', isDark?TEXT_PRESETS_DARK:TEXT_PRESETS_LIGHT, 'text');
  renderThemeGrid();
  renderPresetHighlights();
  updatePreviewBar();
}

function resetColors(){
  themeColors[settingsActiveTheme]={...DEFAULT_COLORS[settingsActiveTheme]};
  applyThemeColors(settingsActiveTheme);
  refreshColorPickers();
  saveThemeColors();
}

// Keep old setAccent as no-op for compatibility
function setAccent(){}
function setBg(){}
function setAccentOld(name,color,dim,rgb){
  const r=document.documentElement;
  r.style.setProperty('--accent',color);r.style.setProperty('--accent-dim',dim);r.style.setProperty('--accent-rgb',rgb);
}

// ══ PROFILE EMOJI ══
let profileEmoji='😊';
const PROFILE_EMOJIS=['😊','😎','🤠','🧙','🦊','🐺','🦁','🐯','🦅','🐉','👾','🤖','👨‍💻','👩‍💻','🧑‍🚀','🥷','🦸','🧛','🎭','🔐','⚡','🌟','💎','🔥','🌊','🍀','🎯','🚀','🏆','💫'];
function openProfilePicker(){
  const grid=document.getElementById('profile-emoji-grid');
  grid.innerHTML=PROFILE_EMOJIS.map(e=>`<div class="emoji-opt${e===profileEmoji?' selected':''}" data-act="selectProfileEmoji" data-arg="${esc(e)}">${e}</div>`).join('');
  document.getElementById('profile-overlay').classList.add('open');
}
function selectProfileEmoji(e){
  profileEmoji=e;

  document.querySelectorAll('#profile-emoji-grid .emoji-opt').forEach(el=>el.classList.toggle('selected',el.textContent===e));
}
function closeProfilePicker(){document.getElementById('profile-overlay').classList.remove('open');}

// ══ ENTRY EMOJI ══
let entryEmoji='⭐';
const ENTRY_EMOJIS=['⭐','🔐','🏦','📧','💬','🎮','💼','🛒','✈️','🏠','🚗','💊','📚','🎵','📺','☁️','🔑','💳','🌐','📱','💡','🎨','🏋️','🍕','🎁','🔒','📝','💰','🛡️','⚙️'];
function toggleEmojiPicker(){
  const wrap=document.getElementById('emoji-picker-wrap');
  const isOpen=wrap.style.display!=='none';
  if(!isOpen){
    const picker=document.getElementById('emoji-picker');
    picker.innerHTML=ENTRY_EMOJIS.map(e=>`<div class="emoji-opt${e===entryEmoji?' selected':''}" data-act="selectEntryEmoji" data-arg="${esc(e)}">${e}</div>`).join('');
  }
  wrap.style.display=isOpen?'none':'block';
}
function selectEntryEmoji(e){
  entryEmoji=e;
  document.getElementById('f-icon-preview').textContent=e;
  document.querySelectorAll('#emoji-picker .emoji-opt').forEach(el=>el.classList.toggle('selected',el.textContent===e));
}

// ══ NOTE CHAR COUNTER ══
function updateNoteCharCount(){
  const body=document.getElementById('ne-body');
  const counter=document.getElementById('note-char-count');
  if(!body||!counter)return;
  const len=body.value.length;
  counter.textContent=`${len} ${currentLang==='en'?'characters':'caracteres'}`;
}

// ══ EXPORT CSV ══
async function exportCSV(){
  if(!await avPlainExportOk('CSV'))return;
  const active=vault.filter(e=>!e.archived);
  const headers=['Name','Category','Username','Password','URL','Notes','Tags'];
  const rows=active.map(e=>[
    e.name||'',getCatLabel(e.cat)||'',e.user||'',e.pw||'',e.url||'',
    (e.notes||'').replace(/\n/g,' '),(e.tags||[]).join(';')
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv=[headers.join(','),...rows].join('\n');
  downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'ciphervault_export.csv');
  toast(currentLang==='en'?'CSV exported! ✓':'CSV exportado! ✓');
}
// ══ SETTINGS ══
let currentSettingsTab='aspeto';
function switchSettingsTab(tab){
  const alias={heranca:'seguranca'};const want=tab;tab=alias[tab]||tab;
  currentSettingsTab=tab;
  document.querySelectorAll('.settings-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.stab===tab));
  document.querySelectorAll('.settings-pane').forEach(p=>p.classList.toggle('active',p.dataset.spane===tab));
  // Scroll para o topo do modal ao trocar de aba
  const modal=document.querySelector('#settings-overlay .modal');
  if(modal)modal.scrollTop=0;
  if(want==='heranca'){const h=document.getElementById('s-heranca-title');if(h&&modal)setTimeout(()=>h.scrollIntoView({block:'start'}),60);}
}
function openSettings(){
  try{setTimeout(()=>renderDriveSettings(),60);}catch(e){}
  applySettingsLang();
  switchSettingsTab('geral');
  renderBgPicker();
  const ni=document.getElementById('s-name-input');if(ni)ni.value=vaultName||'';
  settingsActiveTheme=currentTheme;
  document.getElementById('s-tab-dark')?.classList.toggle('active',currentTheme==='dark');
  document.getElementById('s-tab-light')?.classList.toggle('active',currentTheme==='light');
  refreshColorPickers();
  renderQuickSettings();
  renderSnapshotSettings();
  renderExportSettings();
  renderVaultInfo();
  renderCatManager();
  const lh=document.getElementById('s-lockhide');if(lh)lh.checked=lockHideOn;
  document.getElementById('settings-overlay').classList.add('open');
}
function closeSettings(){document.getElementById('settings-overlay').classList.remove('open');}
function applySettingsLang(){
  const s=(id,txt)=>{const el=document.getElementById(id);if(el)el.textContent=txt;};
  s('settings-title',t('settingsTitle'));
  s('s-colors-title',currentLang==='en'?'🖌️ Custom colours':'🖌️ Cores personalizadas');
  s('s-bg-label',currentLang==='en'?'Background':'Cor de Fundo');
  s('s-accent-label',currentLang==='en'?'Highlight Color':'Cor de Destaque');
  s('s-text-label',currentLang==='en'?'Text Color':'Cor do Texto');
  s('s-dark-label',currentLang==='en'?'Dark':'Escuro');
  s('s-light-label',currentLang==='en'?'Light':'Claro');
  s('s-reset-btn',currentLang==='en'?'↺ Reset to defaults':'↺ Repor cores padrão');
  s('s-vaultinfo-title',currentLang==='en'?'📊 Vault Info':'📊 Info do Cofre');
  s('s-lockhide-lbl',currentLang==='en'?'Lock when minimised / switching apps':'Bloquear ao minimizar / mudar de app');
  const en_s=currentLang==='en';
  // Nav das abas
  s('snav-geral',en_s?'General':'Geral');s('snav-aspeto',en_s?'Appearance':'Aspeto');
  s('snav-seguranca',en_s?'Security':'Segurança');
  s('snav-dados',en_s?'Data':'Dados');
  s('snav-sobre',en_s?'About':'Sobre');
  // Aba Dados
  s('s-csv-title',en_s?'📄 Import / Export':'📄 Importar / Exportar');
  const cd=document.getElementById('s-csv-desc');if(cd)cd.textContent=en_s?'Import or export your entries as CSV, or generate a PDF of the vault.':'Importa ou exporta as tuas entradas em CSV, ou gera um PDF do cofre.';
  s('s-csv-import-txt',en_s?'⬆️ Import CSV':'⬆️ Importar CSV');
  s('s-csv-export-txt',en_s?'⬇️ Export CSV':'⬇️ Exportar CSV');
  s('s-pdf-export-txt',en_s?'📄 Export PDF':'📄 Exportar PDF');
  s('s-timeout-title',en_s?'⏱️ Automatic lock':'⏱️ Bloqueio automático');
  // Aba Segurança
  s('s-changepw-title',en_s?'🔑 Master password':'🔑 Palavra-passe mestra');
  const cpd=document.getElementById('s-changepw-desc');if(cpd)cpd.textContent=en_s?'Change the password that protects the whole vault.':'Muda a palavra-passe que protege todo o cofre.';
  s('s-changepw-btn-txt',en_s?'🔑 Change password':'🔑 Alterar palavra-passe');
  // Aba Herança
  s('s-heranca-title',en_s?'📜 Digital Legacy':'📜 Herança Digital');
  const hd=document.getElementById('s-heranca-desc');if(hd)hd.textContent=en_s?'A document for your family to access your accounts and what matters, should something happen to you. Fill in the details and generate a PDF to keep safe.':'Um documento para a tua família aceder às tuas contas e ao que é importante, caso te aconteça alguma coisa. Preenche os dados e gera um PDF para guardar em segurança.';
  s('s-heranca-btn-txt',en_s?'📜 Open Digital Legacy':'📜 Abrir Herança Digital');
  s('s-pen-btn-txt',en_s?'Download the app for a USB stick':'Descarregar a app para uma pen');
  s('s-pen-desc',en_s?'To keep with the papers: a folder with the app and an encrypted copy of the vault, which opens on a computer with no internet.':'Para guardar com os papéis: uma pasta com a app e uma cópia encriptada do cofre, que abre num computador sem internet.');
  s('s-bg-title',en_s?'🌌 Animated Background':'🌌 Fundo Animado');
  const bgd=document.getElementById('s-bg-desc');if(bgd)bgd.textContent=en_s?"Choose your app's visual ambiance. Each one is lightweight and adapts to your colours.":'Escolhe o ambiente visual da tua app. Cada um é leve e adapta-se às tuas cores.';
  const pgd=document.getElementById('pgm-desc');if(pgd)pgd.textContent=en_s?'Easy-to-remember words, separated with a number. Strong and memorable.':'Palavras fáceis de decorar, separadas e com número. Fortes e memoráveis.';
  s('pgm-random-lbl',en_s?'Random':'Aleatória');
  s('pgm-memorable-lbl',en_s?'Memorable':'Memorável');
  s('pgm-cap-lbl',en_s?'Capitals':'Maiúsculas');
  s('pgm-num-lbl',en_s?'Number':'Número');
  s('f-flag-lbl',en_s?'Label':'Etiqueta');
  s('hc-btn-txt',en_s?'Health check':'Auditoria');
  s('s-name-title',en_s?'👤 Your name':'👤 O teu nome');
  const nmd=document.getElementById('s-name-desc');if(nmd)nmd.textContent=en_s?'Used to greet you on the home screen. Stored only in your vault.':'Usado para te saudar no ecrã inicial. Guardado só no teu cofre.';
  renderBgPicker();
  // ── Documentos: cabeçalho, filtros, modal ──
  const en2=currentLang==='en';
  const setTxt=(id,txt)=>{const el=document.getElementById(id);if(el)el.textContent=txt;};
  setTxt('docs-title',en2?'Documents':'Documentos');
  setTxt('docs-add-txt',en2?'Add document':'Adicionar documento');
  setTxt('docs-newfolder-txt',en2?'New folder':'Nova pasta');
  setTxt('vf-all-txt',en2?'All':'Todos');
  setTxt('vf-expiring-txt',en2?'Expiring':'A expirar');
  setTxt('vf-expired-txt',en2?'Expired':'Expirados');
  setTxt('vf-ok-txt',en2?'Valid':'Válidos');
  setTxt('vf-noexpiry-txt',en2?'No expiry':'Sem validade');
  setTxt('doc-title-lbl',en2?'Title':'Título');
  setTxt('doc-cat-lbl',en2?'Category':'Categoria');
  setTxt('doc-date-lbl',en2?'Document date':'Data do documento');
  setTxt('doc-desc-lbl',en2?'Description':'Descrição');
  setTxt('doc-file-lbl',en2?'File':'Ficheiro');
  setTxt('im-label-lbl',en2?'Name':'Nome');
  setTxt('im-value-lbl',en2?'Value':'Valor');
  setTxt('im-sensitive-lbl',en2?'Hide by default (show on tap)':'Ocultar por omissão (mostrar só ao tocar)');
  setTxt('im-save',en2?'Save':'Guardar');
  setTxt('im-cancel',en2?'Cancel':'Cancelar');
  setTxt('tab-info-txt',en2?'Info':'Info');
  setTxt('info-add-txt',en2?'New person':'Nova pessoa');
  setTxt('sub-name-lbl',en2?'Name':'Nome');
  setTxt('sub-amount-lbl',en2?'Amount (€)':'Valor (€)');
  setTxt('sub-cycle-lbl',en2?'Billing':'Periodicidade');
  setTxt('sub-day-lbl',en2?'Billing day (1-31)':'Dia de cobrança (1-31)');
  setTxt('sub-date-lbl',en2?'Renewal date':'Data de renovação');
  setTxt('sub-color-lbl',en2?'Colour':'Cor');
  setTxt('sub-save',en2?'Save':'Guardar');
  setTxt('sub-cancel',en2?'Cancel':'Cancelar');
  setTxt('sc-name-lbl',en2?'Store':'Loja');
  setTxt('sc-number-lbl',en2?'Card number':'Número do cartão');
  setTxt('sc-number-hint',en2?'Type the digits shown on your card (under the barcode).':'Escreve os dígitos que aparecem no teu cartão (por baixo do código de barras).');
  setTxt('sc-color-lbl',en2?'Colour':'Cor');
  setTxt('sc-save',en2?'Save':'Guardar');
  setTxt('sc-cancel',en2?'Cancel':'Cancelar');
  setTxt('barcode-close',en2?'Close':'Fechar');
  setTxt('tb-privacy-txt',en2?'Privacy mode':'Modo de privacidade');
  setTxt('tab-store-txt',en2?'Store Cards':'Cartões Loja');
  setTxt('store-tab-add-txt',en2?'Add card':'Adicionar cartão');
  const scOpts=document.getElementById('sub-cycle');
  if(scOpts&&scOpts.options.length===2){scOpts.options[0].textContent=en2?'Monthly':'Mensal';scOpts.options[1].textContent=en2?'Yearly':'Anual';}
  setTxt('doc-drop-text',en2?'Click or drag the file here':'Clica ou arrasta o ficheiro aqui');
  setTxt('doc-save-btn',en2?'Save document':'Guardar documento');
  setTxt('doc-cancel-btn',en2?'Cancel':'Cancelar');
  const del2=document.getElementById('doc-expiry-lbl');
  if(del2)del2.innerHTML=(en2?'Expiry':'Validade')+' <span style="font-size:.56rem;color:var(--text-muted)">('+(en2?'optional':'opcional')+')</span>';
  populateDocCatSelect();
  // ── Dashboard / gerador / demo ──
  setTxt('dash-alerts-title',en2?'Alerts & Report':'Alertas & Relatório');
  setTxt('pwgen-len-lbl',en2?'Length:':'Comprimento:');
  setTxt('pres-exit-btn',en2?'✕ Exit':'✕ Sair');
  const dfl=document.getElementById('doc-folder-lbl');if(dfl)dfl.textContent=en2?'Folder':'Pasta';
  setTxt('f-folder-lbl',en2?'Folder':'Pasta');
  setTxt('f-wifi-lbl',en2?'📶 This is a WiFi network (generates a shareable QR)':'📶 É uma rede WiFi (gera QR para partilhar)');
  setTxt('vault-newfolder-txt',en2?'New folder':'Nova pasta');
  setTxt('tb-kit-txt',en2?'Digital Legacy':'Herança Digital');
  const scb=document.getElementById('search-clear');if(scb)scb.title=en2?'Clear':'Limpar';
  setTxt('tb-backup-txt',en2?'Download backup':'Descarregar cópia');
  setTxt('tb-settings-txt',en2?'Settings':'Definições');
  setTxt('tb-sync-txt',en2?'Sync':'Sincronizar');setTxt('tbm-sync',en2?'Sync':'Sinc.');
  const sib=document.getElementById('drive-sync-btn');if(sib)sib.title=en2?'Sync now':'Sincronizar agora';
  setTxt('tb-cal-txt',en2?'Calendar':'Calendário');
  setTxt('tb-privacy-txt',en2?'Privacy mode':'Modo de privacidade');
  setTxt('tb-theme-txt',en2?'Light / dark theme':'Tema claro/escuro');
  const tbm=document.getElementById('tb-more');if(tbm)tbm.title=en2?'More options':'Mais opções';
  renderWifiBar();
  try{renderQuickSettings();}catch(e){}
  const trl=document.getElementById('tf-recovery-lbl');if(trl)trl.innerHTML='🔑 '+(currentLang==='en'?'Recovery codes':'Códigos de recuperação')+' <span style="font-size:.5rem;color:var(--text-muted)">('+(currentLang==='en'?'optional':'opcional')+')</span>';
  const trh=document.getElementById('tf-recovery-hint');if(trh)trh.textContent=currentLang==='en'?'Many services give backup codes in case you lose your phone. Store them here, inside the protected 2FA vault.':'Muitos serviços dão códigos de emergência para o caso de perderes o telemóvel. Guarda-os aqui, dentro do cofre 2FA protegido.';
  const ffl=document.getElementById('f-fields-lbl');if(ffl)ffl.innerHTML=(currentLang==='en'?'Extra fields':'Campos extra')+' <span style="font-size:.5rem;color:var(--text-muted)">('+(currentLang==='en'?'optional':'opcional')+')</span>';
  const ffa=document.getElementById('f-fields-add');if(ffa)ffa.textContent=(currentLang==='en'?'＋ Add field':'＋ Adicionar campo');
  s('s-cats-title',currentLang==='en'?'🗂️ Categories':'🗂️ Categorias');
  s('s-close-btn',t('sClose'));
  s('to-0',t('toNever'));
}

// ══ INDICADOR DE TABS ══
function positionTabIndicator(){
  const ind=document.getElementById('tab-indicator');if(!ind)return;
  const act=document.querySelector('.tab-btn.active');
  if(!act||!act.offsetWidth){ind.style.opacity='0';return;}
  ind.style.opacity='1';
  ind.style.width=act.offsetWidth+'px';
  ind.style.transform=`translateX(${act.offsetLeft}px)`;
}
window.addEventListener('resize',positionTabIndicator);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(positionTabIndicator);

// ══ SPOTLIGHT ══
if(window.matchMedia&&matchMedia('(hover:hover)').matches){
  let spotEvt=null,spotPending=false;
  document.addEventListener('pointermove',e=>{
    spotEvt=e;
    if(spotPending)return;
    spotPending=true;
    requestAnimationFrame(()=>{
      spotPending=false;
      const ev=spotEvt;if(!ev)return;
      const card=ev.target.closest?.('.entry-card,.doc-card,.totp-card,.dash-card,.trash-card,.fav-quick,.lock-how-card');
      if(!card)return;
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',(ev.clientX-r.left)+'px');
      card.style.setProperty('--my',(ev.clientY-r.top)+'px');
    });
  },{passive:true});
}

// ══ CONTAGEM ANIMADA DOS NÚMEROS ══
function animateDashNums(){
  document.querySelectorAll('#dash-stats .dash-card-num').forEach(el=>{
    const target=parseInt(el.textContent,10);
    if(isNaN(target)||target<=0)return;
    const dur=450,start=performance.now();
    function step(now){
      const p=Math.min((now-start)/dur,1);
      el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

