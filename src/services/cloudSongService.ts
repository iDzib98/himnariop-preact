import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { UserSong } from '../types/himno';

function toFirestoreSong(song: UserSong, uid: string) {
  return {
    titulo: song.titulo,
    intro: song.intro,
    referencias: song.referencias,
    autores: song.autores,
    versos: song.versos,
    ownerId: uid,
    ownerName: song.ownerName,
    pdfUrl: song.pdfUrl || null,
    audioUrl: song.audioUrl || null,
    isPublic: !!song.isPublic,
    approvedChurches: song.approvedChurches || [],
    pendingChurches: song.pendingChurches || [],
    createdAt: song.createdAt ? Timestamp.fromMillis(song.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

function fromFirestoreDoc(id: string, data: any): UserSong {
  return {
    id,
    titulo: data.titulo || '',
    intro: data.intro || '',
    referencias: data.referencias || [],
    autores: data.autores || [],
    versos: data.versos || [],
    ownerId: data.ownerId || '',
    ownerName: data.ownerName || '',
    pdfUrl: data.pdfUrl || undefined,
    audioUrl: data.audioUrl || undefined,
    isPublic: !!data.isPublic,
    approvedChurches: data.approvedChurches || [],
    pendingChurches: data.pendingChurches || [],
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
  };
}

export async function saveSongToCloud(song: UserSong, uid: string): Promise<string> {
  const db = getFirebaseDb();
  const songRef = doc(db, 'canciones', song.id);
  await setDoc(songRef, toFirestoreSong(song, uid));
  return song.id;
}

export async function getCloudSong(id: string): Promise<UserSong | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'canciones', id));
  if (!snap.exists()) return null;
  return fromFirestoreDoc(snap.id, snap.data());
}

export async function getMyCloudSongs(uid: string): Promise<UserSong[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'canciones'),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(200)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestoreDoc(d.id, d.data()));
}

export async function getChurchApprovedSongs(churchId: string): Promise<UserSong[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'canciones'),
    where('approvedChurches', 'array-contains', churchId),
    orderBy('updatedAt', 'desc'),
    limit(200)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestoreDoc(d.id, d.data()));
}

export async function deleteCloudSong(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'canciones', id));
}

export async function shareSongToChurch(
  songId: string,
  churchId: string,
  churchName: string,
  authorName: string,
  songTitle: string,
  uid?: string
): Promise<void> {
  const db = getFirebaseDb();

  const songRef = doc(db, 'canciones', songId);
  const snap = await getDoc(songRef);
  if (!snap.exists()) throw new Error('Canción no encontrada');

  const data = snap.data();

  const churchRef = doc(db, 'iglesias', churchId);
  const churchSnap = await getDoc(churchRef);
  const isAdmin = churchSnap.exists() && uid && isUserChurchAdmin(churchSnap.data() as { ownerId: string; adminIds: string[] }, uid);

  const pendingChurches = data.pendingChurches || [];
  const approvedChurches = data.approvedChurches || [];

  if (pendingChurches.includes(churchId) || approvedChurches.includes(churchId)) return;

  if (isAdmin) {
    await setDoc(songRef, {
      ...data,
      approvedChurches: [...approvedChurches, churchId],
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } else {
    await setDoc(songRef, {
      ...data,
      pendingChurches: [...pendingChurches, churchId],
      updatedAt: Timestamp.now(),
    }, { merge: true });

    const pendingRef = doc(collection(db, 'iglesias', churchId, 'pendingSongs'));
    await setDoc(pendingRef, {
      songId,
      churchId,
      churchName,
      authorName,
      titulo: songTitle,
      submittedAt: Timestamp.now(),
    });
  }
}

export async function unshareSongFromChurch(
  songId: string,
  churchId: string
): Promise<void> {
  const db = getFirebaseDb();

  const songRef = doc(db, 'canciones', songId);
  const snap = await getDoc(songRef);
  if (!snap.exists()) throw new Error('Canción no encontrada');

  const data = snap.data();

  const pendingChurches = (data.pendingChurches || []).filter((c: string) => c !== churchId);
  const approvedChurches = (data.approvedChurches || []).filter((c: string) => c !== churchId);

  await setDoc(songRef, {
    ...data,
    pendingChurches,
    approvedChurches,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

export async function approveSongInChurch(
  songId: string,
  churchId: string
): Promise<void> {
  const db = getFirebaseDb();

  const songRef = doc(db, 'canciones', songId);
  const snap = await getDoc(songRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const pendingChurches = (data.pendingChurches || []).filter((c: string) => c !== churchId);
  const approvedChurches = data.approvedChurches || [];
  if (!approvedChurches.includes(churchId)) {
    approvedChurches.push(churchId);
  }

  await setDoc(songRef, {
    ...data,
    pendingChurches,
    approvedChurches,
    updatedAt: Timestamp.now(),
  }, { merge: true });

  const pendingSnapshot = await getDocs(
    query(
      collection(db, 'iglesias', churchId, 'pendingSongs'),
      where('songId', '==', songId)
    )
  );
  for (const d of pendingSnapshot.docs) {
    await deleteDoc(doc(db, 'iglesias', churchId, 'pendingSongs', d.id));
  }
}

export async function rejectSongInChurch(
  songId: string,
  churchId: string
): Promise<void> {
  const db = getFirebaseDb();

  const songRef = doc(db, 'canciones', songId);
  const snap = await getDoc(songRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const pendingChurches = (data.pendingChurches || []).filter((c: string) => c !== churchId);

  await setDoc(songRef, {
    ...data,
    pendingChurches,
    updatedAt: Timestamp.now(),
  }, { merge: true });

  const pendingSnapshot = await getDocs(
    query(
      collection(db, 'iglesias', churchId, 'pendingSongs'),
      where('songId', '==', songId)
    )
  );
  for (const d of pendingSnapshot.docs) {
    await deleteDoc(doc(db, 'iglesias', churchId, 'pendingSongs', d.id));
  }
}

export async function getPendingSongsForChurch(
  churchId: string
): Promise<{ songId: string; titulo: string; authorName: string; submittedAt: number }[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, 'iglesias', churchId, 'pendingSongs'),
      orderBy('submittedAt', 'desc')
    )
  );
  return snap.docs.map(d => {
    const data = d.data();
    return {
      songId: data.songId,
      titulo: data.titulo || '',
      authorName: data.authorName || '',
      submittedAt: data.submittedAt?.toMillis?.() || Date.now(),
    };
  });
}

export function isUserChurchAdmin(
  church: { ownerId: string; adminIds: string[] },
  uid: string
): boolean {
  return church.ownerId === uid || church.adminIds.includes(uid);
}

export async function duplicateSongToMySongs(
  song: UserSong,
  uid: string,
  displayName: string
): Promise<string> {
  const newSong: UserSong = {
    ...song,
    id: crypto.randomUUID(),
    ownerId: uid,
    ownerName: displayName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublic: false,
    approvedChurches: [],
    pendingChurches: [],
  };
  const localSongs = JSON.parse(localStorage.getItem('mis_cantos') || '[]');
  localSongs.push(newSong);
  localStorage.setItem('mis_cantos', JSON.stringify(localSongs));
  return newSong.id;
}

export async function searchCloudSongs(queryText: string): Promise<UserSong[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, 'canciones'),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(50)
    )
  );
  const allPublic = snap.docs.map(d => fromFirestoreDoc(d.id, d.data()));
  const q = queryText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return allPublic.filter(s =>
    s.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
  );
}
