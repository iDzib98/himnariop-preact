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
}

export interface CacheEntry {
  url: string;
  cachedAt: number;
  size: number;
  type: 'audio' | 'pdf';
}
