export interface ParsedReference {
  bookId: string;
  chapter: number;
  verses: number[];
  label: string;
}

// Map abbreviation patterns to book IDs
// Keys are lowercase, matched against the book part of the reference
const ABBREV_MAP: Record<string, string> = {
  // Old Testament
  'gn': 'génesis', 'gen': 'génesis', 'génesis': 'génesis',
  'ex': 'éxodo', 'éxodo': 'éxodo',
  'lv': 'levítico', 'lev': 'levítico', 'levítico': 'levítico',
  'nm': 'números', 'núm': 'números', 'números': 'números',
  'dt': 'deuteronomio', 'deut': 'deuteronomio', 'deuteronomio': 'deuteronomio',
  'jos': 'josué', 'josué': 'josué',
  'jue': 'jueces', 'jueces': 'jueces',
  'rut': 'rut',
  '1s': '1samuel', '1 s': '1samuel', '1samuel': '1samuel', '1 samuel': '1samuel',
  '2s': '2samuel', '2 s': '2samuel', '2samuel': '2samuel', '2 samuel': '2samuel',
  '1r': '1reyes', '1 r': '1reyes', '1reyes': '1reyes', '1 reyes': '1reyes',
  '2r': '2reyes', '2 r': '2reyes', '2reyes': '2reyes', '2 reyes': '2reyes',
  '1cr': '1crónicas', '1 cr': '1crónicas', '1crónicas': '1crónicas', '1 crónicas': '1crónicas',
  '1 cro': '1crónicas', '1cra': '1crónicas',
  '2cr': '2crónicas', '2 cr': '2crónicas', '2crónicas': '2crónicas', '2 crónicas': '2crónicas',
  '2 cro': '2crónicas', '2cra': '2crónicas',
  'esd': 'esdras', 'esdras': 'esdras',
  'neh': 'nehemías', 'nehemías': 'nehemías',
  'est': 'ester', 'ester': 'ester',
  'job': 'job',
  'sal': 'salmos', 'salmos': 'salmos', 'sl': 'salmos', 'ps': 'salmos',
  'pr': 'proverbios', 'prov': 'proverbios', 'proverbios': 'proverbios',
  'ec': 'eclesiastés', 'eccl': 'eclesiastés', 'eclesiastés': 'eclesiastés', 'qoh': 'eclesiastés',
  'cnt': 'cantardeloscantares', 'cantar': 'cantardeloscantares', 'cantardeloscantares': 'cantardeloscantares',
  'cntc': 'cantardeloscantares', 'cantares': 'cantardeloscantares',
  'is': 'isaías', 'isaías': 'isaías', 'isaias': 'isaías',
  'jer': 'jeremías', 'jeremías': 'jeremías', 'jeremias': 'jeremías',
  'lam': 'lamentaciones', 'lamentaciones': 'lamentaciones',
  'ez': 'ezequiel', 'ezeq': 'ezequiel', 'ezequiel': 'ezequiel',
  'dn': 'daniel', 'daniel': 'daniel',
  'os': 'oseas', 'oseas': 'oseas', 'osea': 'oseas',
  'jl': 'joel', 'joel': 'joel',
  'am': 'amós', 'amós': 'amós', 'amos': 'amós',
  'abd': 'abdías', 'abdías': 'abdías', 'abdias': 'abdías',
  'jon': 'jonás', 'jonás': 'jonás', 'jonas': 'jonás',
  'mi': 'miqueas', 'miq': 'miqueas',
  'miqueas': 'miqueas',
  'nah': 'nahúm', 'nahúm': 'nahúm', 'nahum': 'nahúm',
  'hab': 'habacuc', 'habacuc': 'habacuc',
  'sof': 'sofonías', 'sofonías': 'sofonías', 'sofonias': 'sofonías',
  'hag': 'ageo', 'ageo': 'ageo',
  'zac': 'zacarías', 'zacarías': 'zacarías', 'zacarias': 'zacarías',
  'mal': 'malaquías', 'malaquías': 'malaquías', 'malaquias': 'malaquías',

  // New Testament
  'mt': 'mateo', 'mateo': 'mateo',
  'mr': 'marcos', 'mc': 'marcos', 'marcos': 'marcos',
  'lc': 'lucas', 'lucas': 'lucas',
  'jn': 'juan', 'ju': 'juan', 'juan': 'juan',
  'hch': 'hechos', 'hechos': 'hechos', 'act': 'hechos',
  'ro': 'romanos', 'rom': 'romanos', 'romanos': 'romanos',
  '1co': '1corintios', '1 co': '1corintios', '1cor': '1corintios', '1corintios': '1corintios', '1 corintios': '1corintios',
  '2co': '2corintios', '2 co': '2corintios', '2cor': '2corintios', '2corintios': '2corintios', '2 corintios': '2corintios',
  'gá': 'gálatas', 'gal': 'gálatas', 'gálatas': 'gálatas', 'galatias': 'gálatas',
  'ef': 'efesios', 'efes': 'efesios', 'efesios': 'efesios',
  'flp': 'filipenses', 'fil': 'filipenses', 'filipenses': 'filipenses',
  'col': 'colosenses', 'colos': 'colosenses', 'colosenses': 'colosenses',
  '1ts': '1tesalonicenses', '1 ts': '1tesalonicenses', '1tes': '1tesalonicenses', '1tesalonicenses': '1tesalonicenses', '1 tesalonicenses': '1tesalonicenses',
  '2ts': '2tesalonicenses', '2 ts': '2tesalonicenses', '2tes': '2tesalonicenses', '2tesalonicenses': '2tesalonicenses', '2 tesalonicenses': '2tesalonicenses',
  '1ti': '1timoteo', '1 ti': '1timoteo', '1tim': '1timoteo', '1timoteo': '1timoteo', '1 timoteo': '1timoteo', '1 tit': '1timoteo',
  '2ti': '2timoteo', '2 ti': '2timoteo', '2tim': '2timoteo', '2timoteo': '2timoteo', '2 timoteo': '2timoteo',
  'tit': 'tito', 'tito': 'tito',
  'flm': 'filemón', 'filemón': 'filemón', 'filemon': 'filemón',
  'heb': 'hebreos', 'hebreos': 'hebreos',
  'stg': 'santiago', 'sant': 'santiago', 'santiago': 'santiago', 'snt': 'santiago',
  '1p': '1pedro', '1 p': '1pedro', '1ped': '1pedro', '1pedro': '1pedro', '1 pedro': '1pedro',
  '2p': '2pedro', '2 p': '2pedro', '2ped': '2pedro', '2pedro': '2pedro', '2 pedro': '2pedro',
  '1jn': '1juan', '1 jn': '1juan', '1juan': '1juan', '1 juan': '1juan',
  '2jn': '2juan', '2 jn': '2juan', '2juan': '2juan', '2 juan': '2juan',
  '3jn': '3juan', '3 jn': '3juan', '3juan': '3juan', '3 juan': '3juan',
  'jds': 'judas', 'jud': 'judas', 'judas': 'judas',
  'ap': 'apocalipsis', 'apoc': 'apocalipsis', 'apocalipsis': 'apocalipsis', 'rev': 'apocalipsis',
};

export function parseReference(ref: string): ParsedReference | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  // Remove leading number prefix: "1- Ef. 1:3" → "Ef. 1:3"
  // Patterns: "1- ", "C- ", "1-", "C-", "1. ", "C. ", etc.
  let rest = trimmed.replace(/^\d+\s*[-.]\s*/, '').replace(/^C\s*[-.]\s*/, '');

  // Normalize spaces around colon: "Ap. 1: 8" → "Ap. 1:8"
  rest = rest.replace(/(\d)\s*:\s*/g, '$1:');

  // Find the book name: everything before the first number that starts chapter:verse
  // Book names can be: "Ef.", "1 Co.", "Sal.", "1 Cr.", etc.
  let bookPart = '';
  let versePart = '';

  // Try to find where the verse reference starts (chapter number)
  // Pattern: book. chapter:verse or book chapter:verse
  const match = rest.match(/^(.+?)\s+(\d+[.:]\S.*)$/);
  if (match) {
    bookPart = match[1].trim();
    versePart = match[2].trim();
  } else {
    // Try: just a book name with no verse reference (e.g., "Ro. 14")
    const match2 = rest.match(/^(.+?)\s+(\d+)$/);
    if (match2) {
      bookPart = match2[1].trim();
      versePart = match2[2].trim();
    } else {
      // Try: book with period followed by number (e.g., "Ef.1:3" no space)
      const match3 = rest.match(/^([A-Za-záéíóúñ.]+)\s*(\d+.*)$/);
      if (match3) {
        bookPart = match3[1].trim();
        versePart = match3[2].trim();
      } else {
        // Try: full book name without abbreviation (e.g., "Salmos 119:105")
        const match4 = rest.match(/^(.+?)\s+(\d+[.:]\d+.*)$/);
        if (match4) {
          bookPart = match4[1].trim();
          versePart = match4[2].trim();
        } else {
          // Try: "Salmos 119" (chapter only)
          const match5 = rest.match(/^(.+?)\s+(\d+)$/);
          if (match5) {
            bookPart = match5[1].trim();
            versePart = match5[2].trim();
          }
        }
      }
    }
  }

  if (!bookPart) return null;

  // Remove trailing period from book part for matching
  const cleanBook = bookPart.replace(/\.$/, '').trim().toLowerCase()
    .replace(/^(\d+)\.\s*/, '$1 ');

  // Look up book ID
  const bookId = ABBREV_MAP[cleanBook];
  if (!bookId) return null;

  // Parse chapter and verses
  let chapter = 0;
  let verses: number[] = [];

  // Chapter:verse pattern: "1:3", "1:3-5", "1:3,5", "1:3,5-7"
  const cvMatch = versePart.match(/^(\d+)[.:](.+)$/);
  if (cvMatch) {
    chapter = parseInt(cvMatch[1], 10);
    verses = parseVerseRange(cvMatch[2]);
  } else {
    // Chapter only: "14"
    const cMatch = versePart.match(/^(\d+)$/);
    if (cMatch) {
      chapter = parseInt(cMatch[1], 10);
      verses = [];
    }
  }

  if (chapter === 0) return null;

  return { bookId, chapter, verses, label: trimmed };
}

function parseVerseRange(verseStr: string): number[] {
  // Handle: "3", "3-5", "3,5", "3,5-7", "3,5,8-10"
  const parts = verseStr.split(',').map(s => s.trim());
  const verses: number[] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (!verses.includes(i)) verses.push(i);
        }
      }
    } else {
      const v = parseInt(part, 10);
      if (!isNaN(v) && !verses.includes(v)) {
        verses.push(v);
      }
    }
  }

  return verses.sort((a, b) => a - b);
}
