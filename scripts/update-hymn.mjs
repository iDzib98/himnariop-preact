import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HIMNOS_PATH = resolve(__dirname, "../public/himnos.json");

function loadHimnos() {
  const raw = readFileSync(HIMNOS_PATH, "utf-8");
  return JSON.parse(raw);
}

function saveHimnos(himnos) {
  const formatted = JSON.stringify(himnos, null, 2) + "\n";
  writeFileSync(HIMNOS_PATH, formatted, "utf-8");
}

function validateHimno(himno) {
  const errors = [];
  if (typeof himno.numero !== "number") errors.push("numero debe ser un número");
  if (typeof himno.titulo !== "string") errors.push("titulo debe ser un string");
  if (typeof himno.intro !== "string") errors.push("intro debe ser un string");
  if (!Array.isArray(himno.referencias)) errors.push("referencias debe ser un array");
  if (!Array.isArray(himno.autores)) errors.push("autores debe ser un array");
  if (!Array.isArray(himno.versos)) errors.push("versos debe ser un array");

  for (let i = 0; i < himno.versos.length; i++) {
    const verso = himno.versos[i];
    if (typeof verso.nombre !== "string") errors.push(`verso[${i}].nombre debe ser un string`);
    if (!Array.isArray(verso.lineas)) errors.push(`verso[${i}].lineas debe ser un array`);
    for (let j = 0; j < verso.lineas.length; j++) {
      if (typeof verso.lineas[j] !== "string") errors.push(`verso[${i}].lineas[${j}] debe ser un string`);
    }
  }

  return errors;
}

function mergeHimno(original, updates) {
  const merged = { ...original };

  if (updates.titulo !== undefined) merged.titulo = updates.titulo;
  if (updates.intro !== undefined) merged.intro = updates.intro;
  if (updates.referencias !== undefined) merged.referencias = [...updates.referencias];
  if (updates.autores !== undefined) merged.autores = [...updates.autores];
  if (updates.versos !== undefined) {
    merged.versos = updates.versos.map((v) => ({
      nombre: v.nombre,
      lineas: [...v.lineas],
    }));
  }

  return merged;
}

function showDiff(original, updated) {
  const changes = [];

  if (original.titulo !== updated.titulo) {
    changes.push(`  titulo:`);
    changes.push(`    - "${original.titulo}"`);
    changes.push(`    + "${updated.titulo}"`);
  }

  if (original.intro !== updated.intro) {
    changes.push(`  intro:`);
    changes.push(`    - "${original.intro}"`);
    changes.push(`    + "${updated.intro}"`);
  }

  if (JSON.stringify(original.referencias) !== JSON.stringify(updated.referencias)) {
    changes.push(`  referencias:`);
    original.referencias.forEach((r) => changes.push(`    - "${r}"`));
    updated.referencias.forEach((r) => changes.push(`    + "${r}"`));
  }

  if (JSON.stringify(original.autores) !== JSON.stringify(updated.autores)) {
    changes.push(`  autores:`);
    original.autores.forEach((a) => changes.push(`    - "${a}"`));
    updated.autores.forEach((a) => changes.push(`    + "${a}"`));
  }

  if (JSON.stringify(original.versos) !== JSON.stringify(updated.versos)) {
    for (let i = 0; i < Math.max(original.versos.length, updated.versos.length); i++) {
      const orig = original.versos[i];
      const upd = updated.versos[i];

      if (!orig) {
        changes.push(`  verso "${upd.nombre}" (nuevo):`);
        upd.lineas.forEach((l) => changes.push(`    + "${l}"`));
        continue;
      }
      if (!upd) {
        changes.push(`  verso "${orig.nombre}" (eliminado):`);
        orig.lineas.forEach((l) => changes.push(`    - "${l}"`));
        continue;
      }

      if (JSON.stringify(orig) !== JSON.stringify(upd)) {
        if (orig.nombre !== upd.nombre) {
          changes.push(`  verso nombre: "${orig.nombre}" → "${upd.nombre}"`);
        }
        if (JSON.stringify(orig.lineas) !== JSON.stringify(upd.lineas)) {
          changes.push(`  verso "${upd.nombre}":`);
          orig.lineas.forEach((l) => changes.push(`    - "${l}"`));
          upd.lineas.forEach((l) => changes.push(`    + "${l}"`));
        }
      }
    }
  }

  return changes;
}

function askConfirmation(message) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "s" || answer.trim().toLowerCase() === "si");
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Uso: node scripts/update-hymn.mjs <numero-himno> <archivo-correcciones.json>");
    console.log("");
    console.log("Ejemplo:");
    console.log('  node scripts/update-hymn.mjs 42 corrections-42.json');
    console.log("");
    console.log("Formato del archivo de correcciones (campos opcionales):");
    console.log(JSON.stringify(
      {
        titulo: "Título corregido",
        intro: "Versículo introductorio corregido",
        referencias: ["1-Lc. 7:42-43", "C-Ro. 11:36"],
        autores: ["LETRA: Autor", "MÚSICA: Compositor"],
        versos: [
          { nombre: "1", lineas: ["Línea 1", "Línea 2"] },
          { nombre: "Coro", lineas: ["Línea del coro"] },
        ],
      },
      null,
      2
    ));
    process.exit(1);
  }

  const hymnNumber = parseInt(args[0], 10);
  if (isNaN(hymnNumber) || hymnNumber < 1) {
    console.error(`Error: "${args[0]}" no es un número de himno válido.`);
    process.exit(1);
  }

  const correctionsPath = resolve(process.cwd(), args[1]);
  let corrections;
  try {
    const raw = readFileSync(correctionsPath, "utf-8");
    corrections = JSON.parse(raw);
  } catch (err) {
    console.error(`Error al leer archivo de correcciones: ${err.message}`);
    process.exit(1);
  }

  const himnos = loadHimnos();
  const himno = himnos[hymnNumber];

  if (!himno) {
    console.error(`Error: El himno #${hymnNumber} no existe.`);
    console.log(`Himnos disponibles: 1 - ${himnos.length - 1}`);
    process.exit(1);
  }

  const updated = mergeHimno(himno, corrections);
  updated.numero = hymnNumber;

  const errors = validateHimno(updated);
  if (errors.length > 0) {
    console.error("Error de validación:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const diff = showDiff(himno, updated);
  if (diff.length === 0) {
    console.log("No hay cambios que aplicar.");
    process.exit(0);
  }

  console.log(`\nCambios para el himno #${hymnNumber} - "${himno.titulo}":\n`);
  diff.forEach((line) => console.log(line));

  const confirmed = await askConfirmation("\n¿Aplicar cambios? (s/n): ");
  if (!confirmed) {
    console.log("Operación cancelada.");
    process.exit(0);
  }

  himnos[hymnNumber] = updated;
  saveHimnos(himnos);
  console.log(`\nHimno #${hymnNumber} actualizado correctamente.`);
}

main();
