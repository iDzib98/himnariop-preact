import type { Settings, ColorOption, FontSize, FontFamily, Theme } from '../types/himno';

const KEYS = {
  COLOR: 'color',
  FONT_SIZE: 'fontSize',
  FONT_SIZE_VALUE: 'fontSizeValue',
  FONT_FAMILY: 'fontFamily',
  THEME: 'theme',
  FAVORITOS: 'favoritos',
  HIMNO_ACTUAL: 'himnoActual',
  CACHE_META: 'cache_meta'
} as const;

const DEFAULTS: Settings = {
  color: 'indigo',
  fontSize: 'large',
  fontSizeValue: 2,
  fontFamily: 'sans-serif',
  theme: 'dark'
};

type SettingsListener = (settings: Settings) => void;
type FavoritesListener = (favorites: number[]) => void;

class StorageService {
  private settingsListeners: Set<SettingsListener> = new Set();
  private favoritesListeners: Set<FavoritesListener> = new Set();

  private getItem<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return stored as unknown as T;
    }
  }

  private setItem(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private notifySettings(): void {
    const settings = this.getSettings();
    this.settingsListeners.forEach(listener => listener(settings));
  }

  private notifyFavorites(): void {
    this.favoritesListeners.forEach(listener => listener(this.favoritos));
  }

  get color(): ColorOption {
    return this.getItem(KEYS.COLOR, DEFAULTS.color);
  }
  set color(value: ColorOption) {
    this.setItem(KEYS.COLOR, value);
    this.notifySettings();
  }

  get fontSize(): FontSize {
    return this.getItem(KEYS.FONT_SIZE, DEFAULTS.fontSize);
  }
  set fontSize(value: FontSize) {
    this.setItem(KEYS.FONT_SIZE, value);
    this.notifySettings();
  }

  get fontSizeValue(): number {
    return this.getItem(KEYS.FONT_SIZE_VALUE, DEFAULTS.fontSizeValue);
  }
  set fontSizeValue(value: number) {
    this.setItem(KEYS.FONT_SIZE_VALUE, value);
    this.notifySettings();
  }

  get fontFamily(): FontFamily {
    return this.getItem(KEYS.FONT_FAMILY, DEFAULTS.fontFamily);
  }
  set fontFamily(value: FontFamily) {
    this.setItem(KEYS.FONT_FAMILY, value);
    this.notifySettings();
  }

  get theme(): Theme {
    return this.getItem(KEYS.THEME, DEFAULTS.theme);
  }
  set theme(value: Theme) {
    this.setItem(KEYS.THEME, value);
    this.notifySettings();
  }

  get favoritos(): number[] {
    const stored = localStorage.getItem(KEYS.FAVORITOS);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  set favoritos(value: number[]) {
    this.setItem(KEYS.FAVORITOS, value);
    this.notifyFavorites();
  }

  get himnoActual(): number | null {
    const stored = localStorage.getItem(KEYS.HIMNO_ACTUAL);
    return stored ? parseInt(stored, 10) : null;
  }
  set himnoActual(value: number | null) {
    if (value === null) {
      localStorage.removeItem(KEYS.HIMNO_ACTUAL);
    } else {
      this.setItem(KEYS.HIMNO_ACTUAL, value.toString());
    }
  }

  getSettings(): Settings {
    return {
      color: this.color,
      fontSize: this.fontSize,
      fontSizeValue: this.fontSizeValue,
      fontFamily: this.fontFamily,
      theme: this.theme
    };
  }

  initializeDefaults(): void {
    if (!localStorage.getItem(KEYS.COLOR)) this.color = DEFAULTS.color;
    if (!localStorage.getItem(KEYS.FONT_SIZE)) this.fontSize = DEFAULTS.fontSize;
    if (!localStorage.getItem(KEYS.FONT_SIZE_VALUE)) this.fontSizeValue = DEFAULTS.fontSizeValue;
    if (!localStorage.getItem(KEYS.FONT_FAMILY)) this.fontFamily = DEFAULTS.fontFamily;
    if (!localStorage.getItem(KEYS.THEME)) this.theme = DEFAULTS.theme;
  }

  subscribeSettings(listener: SettingsListener): () => void {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }

  subscribeFavorites(listener: FavoritesListener): () => void {
    this.favoritesListeners.add(listener);
    return () => this.favoritesListeners.delete(listener);
  }
}

export const storage = new StorageService();
