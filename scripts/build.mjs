// Junta src/*.js (por ordem do nome) em app.js — o ficheiro que o browser carrega.
// Editar sempre em src/ e correr «npm run build». «npm run check» falha se app.js não corresponder a src/.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = new URL('..', import.meta.url);
const files = readdirSync(new URL('src/', root)).filter(f => f.endsWith('.js')).sort();
const out = files.map(f => readFileSync(new URL('src/' + f, root), 'utf8')).join('');
const target = new URL('app.js', root);
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== out) { console.error('app.js não corresponde a src/ — corre «npm run build».'); process.exit(1); }
  console.log(`app.js corresponde a src/ (${files.length} ficheiros).`);
} else {
  writeFileSync(target, out);
  console.log(`app.js gerado a partir de ${files.length} ficheiros em src/.`);
}
