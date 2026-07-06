const FAVORITES_KEY = 'user_favorites';

export function getFavorites(): string[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addFavorite(songId: string): void {
  const favorites = getFavorites();
  if (!favorites.includes(songId)) {
    favorites.push(songId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(songId: string): void {
  const favorites = getFavorites().filter(id => id !== songId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(songId: string): boolean {
  return getFavorites().includes(songId);
}

export function toggleFavorite(songId: string): boolean {
  if (isFavorite(songId)) {
    removeFavorite(songId);
    return false;
  } else {
    addFavorite(songId);
    return true;
  }
}
