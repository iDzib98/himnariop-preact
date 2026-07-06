import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getMetadata } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_USER_STORAGE = 100 * 1024 * 1024;

export async function uploadSongFile(
  userId: string,
  songId: string,
  file: File,
  type: 'audio' | 'pdf'
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el límite de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const app = getFirebaseApp();
  const storage = getStorage(app);
  const ext = file.name.split('.').pop() || (type === 'audio' ? 'mp3' : 'pdf');
  const path = `canciones/${userId}/${songId}/${type}.${ext}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      'state_changed',
      () => {},
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteSongFile(
  userId: string,
  songId: string,
  type: 'audio' | 'pdf'
): Promise<void> {
  const app = getFirebaseApp();
  const storage = getStorage(app);
  const path = `canciones/${userId}/${songId}/${type}`;
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch {
    // File may not exist
  }
}

export async function getUsage(userId: string): Promise<number> {
  const app = getFirebaseApp();
  const storage = getStorage(app);
  const prefix = `canciones/${userId}/`;
  const listRef = ref(storage, prefix);

  try {
    const result = await listAll(listRef);
    let total = 0;
    for (const item of result.items) {
      const meta = await getMetadata(item);
      total += meta.size || 0;
    }
    return total;
  } catch {
    return 0;
  }
}

export function getStorageLimits() {
  return {
    maxFileSize: MAX_FILE_SIZE,
    maxUserStorage: MAX_USER_STORAGE,
  };
}
