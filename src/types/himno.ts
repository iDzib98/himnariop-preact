export interface Verso {
  nombre: string;
  lineas: string[];
}

export interface Himno {
  numero: number;
  titulo: string;
  intro: string;
  referencias: string[];
  autores: string[];
  versos: Verso[];
}

export interface Categoria {
  titulo: string;
  grupos: Grupo[];
}

export interface Grupo {
  titulo: string;
  inicio: number;
  fin: number;
}

export interface UserSong {
  id: string;
  titulo: string;
  intro: string;
  referencias: string[];
  autores: string[];
  versos: Verso[];
  ownerId: string;
  ownerName: string;
  createdAt: number;
  updatedAt: number;
  pdfUrl?: string;
  audioUrl?: string;
  isPublic: boolean;
  approvedChurches: string[];
  pendingChurches: string[];
}

export type ColorOption =
  | 'black'
  | 'red'
  | 'pink'
  | 'purple'
  | 'deep-purple'
  | 'indigo'
  | 'blue'
  | 'light-blue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'light-green'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'deep-orange'
  | 'brown'
  | 'grey'
  | 'blue-grey';

export type FontSize = 'small' | 'medium' | 'large' | 'x-large' | 'xx-large';

export type FontFamily = 'serif' | 'sans-serif' | 'monospace';

export type Theme = 'light' | 'dark' | 'sepia' | 'oled';

export interface Settings {
  color: ColorOption;
  fontSize: FontSize;
  fontSizeValue: number;
  fontFamily: FontFamily;
  theme: Theme;
  bibleVersion: string;
}

export interface CacheEntry {
  url: string;
  cachedAt: number;
  size: number;
  type: 'audio' | 'pdf';
}
