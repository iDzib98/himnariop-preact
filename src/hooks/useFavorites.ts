import { useState, useEffect, useCallback } from 'preact/hooks';
import { storage } from '../services/storage';
import { syncFavoritesAfterChange } from '../services/cloudFavoritesService';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => storage.favoritos);

  useEffect(() => {
    return storage.subscribeFavorites(setFavorites);
  }, []);

  const toggleFavorite = useCallback((numero: number) => {
    const current = storage.favoritos;
    const isFavorite = current.includes(numero);
    const newFavorites = isFavorite
      ? current.filter(n => n !== numero)
      : [...current, numero].sort((a, b) => a - b);
    storage.favoritos = newFavorites;
    syncFavoritesAfterChange();
  }, []);

  const isFavorite = useCallback((numero: number): boolean => {
    return favorites.includes(numero);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    storage.favoritos = [];
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites
  };
}
