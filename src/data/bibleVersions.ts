export interface BibleVersion {
  id: string;
  name: string;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: 'es-rvr1960', name: 'Reina Valera 1960 (RVR1960)' },
  { id: 'es-vbl', name: 'Versión Biblia Libre (VBL)' },
  { id: 'es-rv09', name: 'Reina Valera 1909' },
  { id: 'es-bes', name: 'Biblia en Español Sencillo' },
  { id: 'es-pddpt', name: 'Palabra de Dios para ti' },
];

export const DEFAULT_BIBLE_VERSION = 'es-rvr1960';
