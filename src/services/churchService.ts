import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  Timestamp,
  limit,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { Church } from '../types/orden';

const CHURCHES_KEY = 'iglesias_guardadas';

function toChurch(id: string, data: any): Church {
  return {
    id,
    name: data.name || '',
    description: data.description || '',
    ownerId: data.ownerId || '',
    adminIds: data.adminIds || [],
    memberIds: data.memberIds || [],
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
  };
}

async function generateUniqueCode(custom?: string): Promise<string> {
  const db = getFirebaseDb();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = custom ? custom.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

  if (code) {
    const existing = await getDoc(doc(db, 'iglesias', code));
    if (existing.exists()) {
      throw new Error('El código ya está en uso');
    }
    return code;
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await getDoc(doc(db, 'iglesias', code));
    if (!existing.exists()) return code;
  }
  throw new Error('No se pudo generar un código único');
}

export async function createChurch(
  name: string,
  ownerId: string,
  customCode?: string,
  description?: string
): Promise<Church> {
  const db = getFirebaseDb();
  const code = await generateUniqueCode(customCode);
  const data = {
    name,
    description: description || '',
    ownerId,
    adminIds: [ownerId],
    memberIds: [ownerId],
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(db, 'iglesias', code), data);
  return toChurch(code, data);
}

export async function getChurch(code: string): Promise<Church | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'iglesias', code));
  if (!snap.exists()) return null;
  return toChurch(snap.id, snap.data());
}

export async function joinChurch(code: string, uid: string): Promise<Church | null> {
  const db = getFirebaseDb();
  const ref = doc(db, 'iglesias', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  await updateDoc(ref, { memberIds: arrayUnion(uid) });
  const updated = await getDoc(ref);
  return toChurch(updated.id, updated.data());
}

export async function leaveChurch(code: string, uid: string): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, 'iglesias', code);
  await updateDoc(ref, { memberIds: arrayRemove(uid), adminIds: arrayRemove(uid) });
}

export async function transferOwnership(code: string, newOwnerId: string): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, 'iglesias', code);
  await updateDoc(ref, { ownerId: newOwnerId, adminIds: arrayUnion(newOwnerId) });
}

export async function addAdmin(code: string, adminId: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'iglesias', code), { adminIds: arrayUnion(adminId), memberIds: arrayUnion(adminId) });
}

export async function updateChurch(code: string, data: { name?: string; description?: string }): Promise<void> {
  const db = getFirebaseDb();
  const updateData: Record<string, string> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (Object.keys(updateData).length === 0) return;
  await updateDoc(doc(db, 'iglesias', code), updateData);
}

export async function removeAdmin(code: string, adminId: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'iglesias', code), { adminIds: arrayRemove(adminId) });
}

export async function getUserChurches(uid: string): Promise<Church[]> {
  const db = getFirebaseDb();

  const memberQuery = query(
    collection(db, 'iglesias'),
    where('memberIds', 'array-contains', uid),
    limit(50)
  );
  const memberSnap = await getDocs(memberQuery);

  const adminQuery = query(
    collection(db, 'iglesias'),
    where('adminIds', 'array-contains', uid),
    limit(50)
  );
  const adminSnap = await getDocs(adminQuery);

  const allDocs = [...memberSnap.docs, ...adminSnap.docs];
  const unique = allDocs.reduce((acc, doc) => {
    if (!acc.find(d => d.id === doc.id)) {
      acc.push(doc);
    }
    return acc;
  }, [] as QueryDocumentSnapshot[]);

  return unique.map(d => toChurch(d.id, d.data()));
}

export function getLocalChurchIds(): string[] {
  try {
    const stored = localStorage.getItem(CHURCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveLocalChurchIds(ids: string[]): void {
  localStorage.setItem(CHURCHES_KEY, JSON.stringify(ids));
}

export function addLocalChurchId(id: string): void {
  const ids = getLocalChurchIds();
  if (!ids.includes(id)) {
    ids.push(id);
    saveLocalChurchIds(ids);
  }
}
