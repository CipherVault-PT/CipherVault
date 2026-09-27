import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Uma versão nova só chega aos telemóveis se todos estes sítios mudarem juntos (ver README → «Publicar uma versão»).
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('o número da versão é o mesmo em todo o lado', () => {
  const html = read('index.html'), app = read('app.js');
  const meta = html.match(/name="app-version" content="([\d.]+)"/)[1];
  const js = app.match(/const APP_VERSION='([\d.]+)'/)[1];
  const queries = [...html.matchAll(/(?:styles\.css|app\.js)\?v=([\d.]+)/g)].map(m => m[1]);
  const footers = [...html.matchAll(/·\s*v(\d+\.\d+)</g)].map(m => m[1]);
  const legacy = html.match(/const APP_VERSION='([\d.]+)'/)[1]; // o que as versões antigas procuram para avisar
  expect(js).toBe(meta);
  expect(legacy).toBe(meta);
  expect(queries.length).toBe(2);
  for (const v of [...queries, ...footers]) expect(v).toBe(meta);
});

test('o service worker guarda os ficheiros de que a app precisa', () => {
  const sw = read('sw.js');
  for (const f of ['./index.html', './styles.css', './app.js', './vendor/jsqr.js', './img/aurora-l.webp', './img/aurora-p.webp']) {
    expect(sw).toContain(`'${f}'`);
  }
});
