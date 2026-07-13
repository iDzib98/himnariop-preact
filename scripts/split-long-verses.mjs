import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const himnosPath = join(__dirname, '..', 'public', 'himnos.json');
const himnos = JSON.parse(readFileSync(himnosPath, 'utf8'));

// Manual splits for verses WITHOUT blank lines
// Key: "hymnNumber|verseName" -> array of 0-indexed line numbers AFTER which to split
const MANUAL_SPLITS = {
  // #34 De Jehová cantaré
  '34|1': [5],
  '34|2': [5],

  // #38 Cuanto soy y cuanto encierro
  '38|3': [3],

  // #41 Oh Señor, tú has hecho los cielos
  '41|': [5],

  // #42 Castillo fuerte
  '42|1': [3],
  '42|2': [3],
  '42|3': [3],
  '42|4': [3],

  // #44 Te loamos, te glorificamos
  '44|1': [3],

  // #51 Porque tú eres bueno
  '51|': [5],

  // #55 Tu reino es vida
  '55|': [5],

  // #58 ¡Dios es amor!
  '58|1': [5],

  // #66 ¡Hosanna!
  '66|': [4],

  // #69 Los designios de nuestro Dios
  '69|1': [5],
  '69|2': [5],
  '69|3': [5],
  '69|4': [5],

  // #71 Sé exaltado
  '71|': [4],

  // #72 Yahvé asombroso es
  '72|': [3],

  // #95 Compadécete de nosotros
  '95|1': [3],
  '95|2': [6],

  // #108 Es la voz del que clama
  '108|2': [4],

  // #134 Sueños de Navidad
  '134|': [5],

  // #139 Santa la noche
  '139|1': [3],
  '139|2': [3],
  '139|3': [3],

  // #186 La tumba le encerró
  '186|Coro': [5],

  // #211 Glorioso aquel día
  '211|1': [7],
  '211|2': [7],
  '211|3': [7],

  // #213 Pronto viene el Rey
  '213|3': [5],

  // #217 ¡Despertad, la voz nos llama!
  '217|1': [5],
  '217|2': [5],
  '217|3': [5],

  // #218 Yo sólo espero ese día
  '218|1': [5],
  '218|2': [5],
  '218|3': [5],

  // #220 Cantaré a Jesús
  '220|Coro': [5],

  // #223 Eleven hoy al Salvador
  '223|1': [6],
  '223|2': [6],
  '223|3': [6],

  // #224 Jesús es el Señor
  '224|': [5],

  // #226 Tuyo es el reino
  '226|': [5],

  // #232 Maravilloso es
  '232|': [3],

  // #233 Gloria por siempre al Cordero
  '233|': [6],

  // #237 Maravillosa gracia
  '237|Coro': [7],

  // #247 Hay un Pastor que a los suyos amó
  '247|1': [5],
  '247|2': [5],
  '247|3': [5],

  // #261 Himno al Espíritu Santo
  '261|4': [3],

  // #263 Espíritu de Dios, llena mi vida
  '263|': [7],

  // #274 Recibiréis poder
  '274|': [4],

  // #277 Hay una senda
  '277|1': [7],
  '277|2': [7],
  '277|3': [7],

  // #290 Ven, de todo bien la fuente
  '290|1': [5],
  '290|2': [5],
  '290|3': [4],

  // #291 Hay un nombre nuevo en la gloria
  '291|Coro': [5],

  // #292 Dios descendió
  '292|1': [5],
  '292|2': [5],
  '292|3': [5],

  // #322 Eres mi protector
  '322|': [4],

  // #333 Cerca, más cerca
  '333|1': [5],
  '333|2': [5],
  '333|3': [5],

  // #334 Cautívame, Señor
  '334|4': [3],

  // #369 ¡Maestro, se encrespan las aguas!
  '369|Coro': [5],

  // #372 Solo no estoy
  '372|': [6],

  // #384 Si no fuera por ti
  '384|1': [5],
  '384|2': [5],
  '384|3': [5],

  // #392 ¿Cómo podré estar triste?
  '392|1': [4],

  // #393 No sé por qué
  '393|1': [5],

  // #403 Somos uno en Cristo
  '403|': [3],

  // #410 Con mis labios y mi vida
  '410|': [4],

  // #413 Háblame hoy
  '413|': [5],

  // #428 Mirad cuán bueno y delicioso
  '428|1': [5],

  // #435 A la divina Trinidad
  '435|1': [4],

  // #440 Mi ofrenda
  '440|1': [3],

  // #466 Renuévame
  '466|': [4],

  // #469 Oh, Cristo, tu obra terminar queremos
  '469|1': [6],
  '469|2': [6],
  '469|3': [7],

  // #471 Lléname, Señor
  '471|': [4],

  // #477 ¡Abrid las puertas del templo!
  '477|1': [7],
  '477|2': [7],

  // #480 De Jesús la iglesia en marcha
  '480|Coro': [5],

  // #427 Unid los cantos (Coro has leading blank line, stripped before processing)
  '427|Coro': [4],

  // #481 Invicta iglesia
  '481|2': [4],

  // #487 Acuérdate de tu Creador
  '487|': [7],

  // #490 Y la paz de Dios
  '490|': [5],

  // #610 ¿Qué es lo que quiere el Señor de mí?
  '610|1': [4],
  '610|2': [4],

  // #615 Ven al encuentro con Dios
  '615|1': [5],
  '615|2': [5],

  // #618 Siempre venciendo
  '618|1': [4],
  '618|2': [5],
  '618|': [5],

  // #621 Un raudal de bendiciones
  '621|4': [5],

  // #622 Nuestra patria
  '622|': [6],

  // #626 Hoy te alabamos Dios de bondad
  '626|1': [4],
  '626|2': [3],
  '626|3': [3],

  // #630 La nueva canción
  '630|1': [4],

  // #631 Con alegría
  '631|1': [7],
  '631|2': [7],
  '631|3': [7],

  // #633 Somos aliados
  '633|1': [6],
  '633|Coro': [4],
  '633|2': [4],
  '633|3': [6],

  // #666 Salmo 24
  '666|1': [4],
  '666|2': [5],
  '666|3': [4],

  // #676 Salmo 62
  '676|4': [4],

  // #696 Salmo 121
  '696|1': [5],
  '696|2': [5],
};

let totalSplits = 0;

for (const himno of himnos) {
  if (!himno) continue;

  const newVersos = [];
  let versesAdded = 0;

  for (const verso of himno.versos) {
    if (verso.lineas.length <= 8) {
      newVersos.push(verso);
      continue;
    }

    // Strip leading and trailing blank lines
    let lines = [...verso.lineas];
    while (lines.length > 0 && lines[0].trim() === '') lines.shift();
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

    if (lines.length <= 8) {
      newVersos.push({ nombre: verso.nombre, lineas: lines });
      continue;
    }

    // Find blank lines in the stripped content
    const blankIndices = lines
      .map((l, i) => l.trim() === '' ? i : -1)
      .filter(i => i >= 0);

    if (blankIndices.length > 0) {
      // Auto-split at blank lines
      // Group consecutive blank lines
      const splitPoints = [];
      for (const bi of blankIndices) {
        if (splitPoints.length === 0 || bi > splitPoints[splitPoints.length - 1] + 1) {
          splitPoints.push(bi);
        }
      }

      // Build parts
      let start = 0;
      for (const sp of splitPoints) {
        const partLines = lines.slice(start, sp);
        if (partLines.length > 0) {
          newVersos.push({
            nombre: versesAdded === 0 ? verso.nombre : '',
            lineas: partLines,
          });
          versesAdded++;
          totalSplits++;
        }
        // Skip blank lines
        start = sp + 1;
        while (start < lines.length && lines[start].trim() === '') {
          start++;
        }
      }
      // Remaining lines
      if (start < lines.length) {
        const partLines = lines.slice(start);
        if (partLines.length > 0) {
          newVersos.push({
            nombre: versesAdded === 0 ? verso.nombre : '',
            lineas: partLines,
          });
          versesAdded++;
          totalSplits++;
        }
      }
    } else {
      // Manual split
      const key = `${himno.numero}|${verso.nombre}`;
      const splitAfter = MANUAL_SPLITS[key];

      if (splitAfter && splitAfter.length > 0) {
        // Build parts from split points
        let start = 0;
        for (let si = 0; si < splitAfter.length; si++) {
          const end = splitAfter[si] + 1;
          const partLines = lines.slice(start, end);
          if (partLines.length > 0) {
            newVersos.push({
              nombre: versesAdded === 0 ? verso.nombre : '',
              lineas: partLines,
            });
            versesAdded++;
            totalSplits++;
          }
          start = end;
        }
        // Remaining lines
        if (start < lines.length) {
          const partLines = lines.slice(start);
          if (partLines.length > 0) {
            newVersos.push({
              nombre: versesAdded === 0 ? verso.nombre : '',
              lineas: partLines,
            });
            versesAdded++;
            totalSplits++;
          }
        }
      } else {
        console.log(`WARNING: No split defined for hymn #${himno.numero} verse "${verso.nombre}" (${verso.lineas.length} lines)`);
        newVersos.push(verso);
      }
    }
  }

  himno.versos = newVersos;
}

// Special fixes
// #618: Remove "3. " prefix from the verse that had it
for (const himno of himnos) {
  if (!himno || himno.numero !== 618) continue;
  for (const verso of himno.versos) {
    if (verso.lineas[0] && verso.lineas[0].startsWith('3. Siempre venciendo,')) {
      verso.lineas[0] = 'Siempre venciendo,';
    }
  }
}

// Verify no verse has more than 8 lines
let violations = 0;
for (const himno of himnos) {
  if (!himno) continue;
  for (const verso of himno.versos) {
    if (verso.lineas.length > 8) {
      console.log(`VIOLATION: hymn #${himno.numero} verse "${verso.nombre}" has ${verso.lineas.length} lines`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.log(`\n${violations} violations found! Not writing file.`);
  process.exit(1);
}

writeFileSync(himnosPath, JSON.stringify(himnos, null, 2) + '\n');
console.log(`\nDone! Applied ${totalSplits} splits. No violations found.`);
