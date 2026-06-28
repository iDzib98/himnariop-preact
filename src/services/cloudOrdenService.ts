import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { WorshipOrder, WorshipSlide } from '../types/orden';

function toFirestoreOrder(order: WorshipOrder, uid: string) {
  return {
    title: order.title,
    slides: order.slides,
    authorId: uid,
    authorName: order.authorName || '',
    isPublic: !!order.isPublic,
    churchId: order.churchId || null,
    date: order.date || null,
    startTime: order.startTime || null,
    endTime: order.endTime || null,
    description: order.description || null,
    createdAt: order.createdAt ? Timestamp.fromMillis(order.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

function fromFirestoreDoc(id: string, data: any): WorshipOrder {
  const fallback = data.sharing || 'private';
  return {
    id: data.id || id,
    title: data.title || '',
    slides: (data.slides || []) as WorshipSlide[],
    authorId: data.authorId || '',
    authorName: data.authorName || '',
    isPublic: data.isPublic === true || fallback === 'public',
    churchId: data.churchId || (fallback === 'church' ? data.churchId : undefined) || undefined,
    date: data.date || undefined,
    startTime: data.startTime || undefined,
    endTime: data.endTime || undefined,
    description: data.description || undefined,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
    cloudId: id,
  };
}

export async function saveOrderToCloud(order: WorshipOrder, uid: string): Promise<string> {
  const db = getFirebaseDb();
  const ordersRef = collection(db, 'ordenes');
  const docId = order.cloudId || doc(ordersRef).id;
  const docRef = doc(db, 'ordenes', docId);
  await setDoc(docRef, toFirestoreOrder({ ...order, cloudId: docId }, uid));
  return docId;
}

export async function getMyCloudOrders(uid: string): Promise<WorshipOrder[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'ordenes'),
    where('authorId', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestoreDoc(d.id, d.data()));
}

export async function getChurchOrders(churchId: string): Promise<WorshipOrder[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'ordenes'),
    where('churchId', '==', churchId),
    orderBy('updatedAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestoreDoc(d.id, d.data()));
}

export function listenToOrderChanges(
  orderIds: string[],
  callback: (orders: WorshipOrder[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const unsubs = orderIds.map(id =>
    onSnapshot(doc(db, 'ordenes', id), (snap) => {
      if (snap.exists()) {
        callback([fromFirestoreDoc(snap.id, snap.data())]);
      }
    })
  );
  return () => unsubs.forEach(u => u());
}

export async function deleteCloudOrder(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'ordenes', id));
}
