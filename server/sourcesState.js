// Runtime kaynak listesi — `sources.json`'dan başlar, client PUT ile override eder.
// Sayfa kapanınca renderer localStorage'dan tekrar push'lar (in-memory state, persist yok).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDefault() {
  return JSON.parse(readFileSync(join(__dirname, 'sources.json'), 'utf8'));
}

let current = loadDefault();
const listeners = [];

export function getSources() {
  return current;
}

export function setSources(arr) {
  if (!Array.isArray(arr)) throw new Error('sources must be array');
  current = arr;
  listeners.forEach((fn) => fn());
}

export function resetSources() {
  current = loadDefault();
  listeners.forEach((fn) => fn());
}

export function onChange(fn) {
  listeners.push(fn);
}
