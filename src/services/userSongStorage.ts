import type { UserSong } from '../types/himno';

const SONGS_KEY = 'mis_cantos';

export function getUserSongs(): UserSong[] {
  try {
    const stored = localStorage.getItem(SONGS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUserSong(id: string): UserSong | undefined {
  return getUserSongs().find(s => s.id === id);
}

export function saveUserSong(song: UserSong): void {
  const songs = getUserSongs();
  const idx = songs.findIndex(s => s.id === song.id);
  if (idx >= 0) {
    songs[idx] = song;
  } else {
    songs.push(song);
  }
  localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
}

export function deleteUserSong(id: string): void {
  const songs = getUserSongs().filter(s => s.id !== id);
  localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
}

export function generateSongId(): string {
  return crypto.randomUUID();
}
