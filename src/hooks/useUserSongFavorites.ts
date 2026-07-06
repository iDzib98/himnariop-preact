import { useState, useEffect, useCallback } from 'preact/hooks';
import { getFavorites, removeFavorite, isFavorite as checkFavorite, toggleFavorite as toggle } from '../services/favoritesService';
import { getUserSong } from '../services/userSongStorage';
import { getCloudSong } from '../services/cloudSongService';
import type { UserSong } from '../types/himno';

export function useUserSongFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());

  const toggleFavorite = useCallback((songId: string) => {
    const newState = toggle(songId);
    setFavorites(getFavorites());
    return newState;
  }, []);

  const isFavorite = useCallback((songId: string): boolean => {
    return checkFavorite(songId);
  }, []);

  const clearFavorites = useCallback(() => {
    getFavorites().forEach(id => removeFavorite(id));
    setFavorites([]);
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites
  };
}

export function useFavoriteUserSongs() {
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [songs, setSongs] = useState<UserSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);

    async function loadSongs() {
      const loadedSongs: UserSong[] = [];
      for (const id of favs) {
        const local = getUserSong(id);
        if (local) {
          loadedSongs.push(local);
        } else {
          try {
            const cloud = await getCloudSong(id);
            if (cloud) loadedSongs.push(cloud);
          } catch {
            console.error('Error loading favorite song:', id);
          }
        }
      }
      setSongs(loadedSongs);
      setLoading(false);
    }

    loadSongs();
  }, []);

  return { songs, loading, favorites };
}
