/* Aspeto: aplica o estilo (Ónix & Ouro, Nórdico ou Clássico), o ecrã de entrada e o movimento antes de a página
   se desenhar — assim não pisca o aspeto antigo. As escolhas ficam neste browser (Definições → Aspeto). */
(function () {
  var d = document.documentElement;
  var get = function (k, v) { try { return localStorage.getItem(k) || v; } catch (e) { return v; } };
  var skin = get('av_skin', 'onix');
  if (!/^(onix|nordico|classico)$/.test(skin)) skin = 'onix';
  var motion = get('av_motion', 'suave');
  if (!/^(completo|suave|desligado)$/.test(motion)) motion = 'suave';
  var E = ['lanterna', 'constelacao', 'aurora'], entry = get('av_entry', 'lanterna');
  if (entry === 'surpresa') {
    var n = new Date(), day = Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 864e5);
    entry = E[day % 3];
  }
  if (E.indexOf(entry) < 0) entry = 'lanterna';
  var mode = get('cv_theme_mode', 'dark');
  if (get('av_theme_auto', '0') === '1' && window.matchMedia) mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  d.setAttribute('data-skin', skin);
  if (skin !== 'classico') d.classList.add('sk-new');
  d.setAttribute('data-motion', motion);
  d.setAttribute('data-entry', entry);
  d.setAttribute('data-theme', mode === 'light' ? 'light' : 'dark');
  var fonts = skin === 'classico'
    ? ['jetbrains-mono-latin-400-normal', 'playfair-display-latin-400-normal']
    : skin === 'onix' ? ['inter-latin-400-normal', 'bodoni-moda-latin-500-normal'] : ['manrope-latin-400-normal', 'fraunces-latin-400-normal'];
  if (location.protocol !== 'file:') fonts.forEach(function (f) { // no kit da pen as fontes já vão dentro do ficheiro
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = 'anonymous';
    l.href = 'vendor/fonts/' + f + '.woff2';
    document.head.appendChild(l);
  });
})();
