import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const curr = JSON.parse(readFileSync(join(__dirname, '..', 'public', 'himnos.json'), 'utf8'));

const h = curr.find(x => x && x.numero === 42);
console.log('=== HIMNO 42 ACTUAL ===');
h.versos.forEach((v, i) => {
  console.log(i, JSON.stringify(v.nombre), v.lineas.length + 'L');
  v.lineas.forEach(l => console.log('  ', l));
});

// Original from git
import { execSync } from 'child_process';
const origStr = execSync('git show HEAD:public/himnos.json', { cwd: join(__dirname, '..'), encoding: 'utf8' });
const orig = JSON.parse(origStr);
const ho = orig.find(x => x && x.numero === 42);
console.log('\n=== HIMNO 42 ORIGINAL ===');
ho.versos.forEach((v, i) => {
  console.log(i, JSON.stringify(v.nombre), v.lineas.length + 'L');
  v.lineas.forEach(l => console.log('  ', l));
});
