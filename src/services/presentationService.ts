import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

const MAX_DIMENSION = 1280;

export async function compressImage(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No 2d context')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('Canvas toBlob failed')); },
        'image/webp',
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export async function uploadPresentationSlide(
  orderId: string,
  slideId: string,
  blob: Blob,
  index: number
): Promise<string> {
  const app = getFirebaseApp();
  const storage = getStorage(app);
  const path = `presentaciones/${orderId}/${slideId}/${index}.png`;
  const storageRef = ref(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob);
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

export async function deletePresentationImages(orderId: string, slideId: string): Promise<void> {
  const app = getFirebaseApp();
  const storage = getStorage(app);
  const path = `presentaciones/${orderId}/${slideId}/`;
  const listRef = ref(storage, path);
  try {
    const result = await listAll(listRef);
    await Promise.all(result.items.map((item) => deleteObject(item)));
  } catch {
    // Path may not exist
  }
}

export function generateSlideId(): string {
  return `pres-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface ExtractedImage {
  id: string;
  dataUrl: string;
  blob: Blob;
  name: string;
  index: number;
}

export async function extractZipImages(file: File): Promise<ExtractedImage[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const entries: { name: string; blob: Blob; index: number }[] = [];
  const imgRegex = /-(\d+)\.(png|jpe?g|webp)$/i;
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const match = name.match(imgRegex);
    if (!match) continue;
    const blob = await entry.async('blob');
    const index = parseInt(match[1], 10);
    entries.push({ name, blob, index });
  }
  entries.sort((a, b) => a.index - b.index);
  return entries.map((e) => ({
    id: `pres-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    dataUrl: URL.createObjectURL(e.blob),
    blob: e.blob,
    name: e.name,
    index: e.index,
  }));
}
