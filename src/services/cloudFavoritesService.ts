import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { getCurrentUser } from './authService';
import { storage } from './storage';

export interface CloudFavorites {
  himnos: number[];
  biblia: string[];
  cantos: string[];
}

function getLocalSongFavorites(): string[] {
  try {
    const data = localStorage.getItem('user_favorites');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getLocalFavorites(): CloudFavorites {
  return {
    himnos: storage.favoritos,
    biblia: storage.getBibleFavorites(),
    cantos: getLocalSongFavorites(),
  };
}

export function setLocalFavorites(data: CloudFavorites): void {
  storage.favoritos = data.himnos;
  storage.setBibleFavorites(data.biblia);
  localStorage.setItem('user_favorites', JSON.stringify(data.cantos));
}

export async function getCloudFavorites(uid: string): Promise<CloudFavorites | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'usuarios', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    himnos: d.himnos || [],
    biblia: d.biblia || [],
    cantos: d.cantos || [],
  };
}

export async function setCloudFavorites(uid: string, data: CloudFavorites): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(doc(db, 'usuarios', uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function syncFavoritesAfterChange(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const user = getCurrentUser();
    if (!user) return;
    const local = getLocalFavorites();
    await setCloudFavorites(user.uid, local);
  }, 500);
}

export type SyncResult =
  | { status: 'synced' }
  | { status: 'conflict'; local: CloudFavorites; cloud: CloudFavorites };

export async function syncOnLogin(uid: string): Promise<SyncResult> {
  const local = getLocalFavorites();
  const cloud = await getCloudFavorites(uid);

  if (!cloud) {
    await setCloudFavorites(uid, local);
    return { status: 'synced' };
  }

  const hasLocal = local.himnos.length > 0 || local.biblia.length > 0 || local.cantos.length > 0;
  if (!hasLocal) {
    setLocalFavorites(cloud);
    return { status: 'synced' };
  }

  const equal =
    JSON.stringify(local.himnos) === JSON.stringify(cloud.himnos) &&
    JSON.stringify(local.biblia) === JSON.stringify(cloud.biblia) &&
    JSON.stringify(local.cantos) === JSON.stringify(cloud.cantos);

  if (equal) return { status: 'synced' };

  return { status: 'conflict', local, cloud };
}

export async function resolveConflict(
  uid: string,
  choice: 'local' | 'cloud' | 'merge',
  local: CloudFavorites,
  cloud: CloudFavorites
): Promise<void> {
  if (choice === 'local') {
    await setCloudFavorites(uid, local);
  } else if (choice === 'cloud') {
    setLocalFavorites(cloud);
  } else {
    const merged: CloudFavorites = {
      himnos: [...new Set([...local.himnos, ...cloud.himnos])].sort((a, b) => a - b),
      biblia: [...new Set([...local.biblia, ...cloud.biblia])].sort(),
      cantos: [...new Set([...local.cantos, ...cloud.cantos])].sort(),
    };
    setLocalFavorites(merged);
    await setCloudFavorites(uid, merged);
  }
}
