import { useState, useEffect, useCallback } from 'preact/hooks';
import { storage } from '../services/storage';
import type { ColorOption, FontSize, FontFamily, Theme } from '../types/himno';

export function useSettings() {
  const [settings, setSettings] = useState(() => storage.getSettings());

  useEffect(() => {
    return storage.subscribeSettings(setSettings);
  }, []);

  const updateColor = useCallback((color: ColorOption) => {
    storage.color = color;
  }, []);

  const updateFontSize = useCallback((fontSize: FontSize, fontSizeValue: number) => {
    storage.fontSize = fontSize;
    storage.fontSizeValue = fontSizeValue;
  }, []);

  const updateFontFamily = useCallback((fontFamily: FontFamily) => {
    storage.fontFamily = fontFamily;
  }, []);

  const updateTheme = useCallback((theme: Theme) => {
    storage.theme = theme;
  }, []);

  const updateBibleVersion = useCallback((version: string) => {
    storage.bibleVersion = version;
  }, []);

  return {
    ...settings,
    updateColor,
    updateFontSize,
    updateFontFamily,
    updateTheme,
    updateBibleVersion
  };
}
