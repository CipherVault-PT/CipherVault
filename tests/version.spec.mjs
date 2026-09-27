import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Uma versão nova só chega aos telemóveis se todos estes sítios mudarem juntos (ver README → «Publicar uma versão»).
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('o número da versão é o mesmo em todo o lado', () => {
  const html = read('index.html'), app = read('app.js');
  const meta = html.match(/name="app-version" content="([\d.]+)"/)[1];
  const js = app.match(/const APP_VERSION='([\d.]+)'/)[1];
  const queries = [...html.matchAll(/(?:href|src)="(?!vendor\/)[\w/.-]+\.(?:css|js)\?v=([\d.]+)"/g)].map(m => m[1]);
  const footers = [...html.matchAll(/·\s*v(\d+\.\d+)</g)].map(m => m[1]);
  const legacy = html.match(/const APP_VERSION='([\d.]+)'/)[1]; // o que as versões antigas procuram para avisar
  expect(js).toBe(meta);
  expect(legacy).toBe(meta);
  expect(queries.length).toBeGreaterThanOrEqual(4); // styles.css, js/actions.js, js/crypto.js, app.js
  for (const v of [...queries, ...footers]) expect(v).toBe(meta);
});

test('o service worker guarda os ficheiros de que a app precisa', () => {
  const sw = read('sw.js');
  for (const f of ['./index.html', './vendor/jsqr.js?v=1.4.0']) expect(sw).toContain(`'${f}'`);
  expect(sw).toContain('(?:css|js)\\?v='); // lê do index.html os endereços com versão
});
