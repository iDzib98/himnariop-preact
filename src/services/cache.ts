import type { CacheEntry } from '../types/himno';
import { getAudioUrl, getPdfUrl } from './api';

const CACHE_NAME = 'himnario-audio-pdf-v1';
const SW_CACHE_NAMES: Record<string, string> = {
  audio: 'audio-cache',
  pdf: 'pdf-cache'
};

export const cacheService = {
  async cacheHimnoMedia(numero: number): Promise<void> {
    const audioUrl = getAudioUrl(numero);
    const pdfUrl = getPdfUrl(numero);

    await Promise.all([
      this.cacheUrl(audioUrl, 'audio'),
      this.cacheUrl(pdfUrl, 'pdf')
    ]);
  },

  async cacheUrl(url: string, type: 'audio' | 'pdf'): Promise<void> {
    try {
      const fetchOptions: RequestInit = type === 'audio' ? { mode: 'no-cors' } : {};
      const response = await fetch(url, fetchOptions);
      if (response.ok || response.type === 'opaque') {
        const cacheNames = [CACHE_NAME, SW_CACHE_NAMES[type]].filter(Boolean);
        await Promise.all(cacheNames.map(name =>
          caches.open(name).then(cache => cache.put(url, response.clone()))
        ));
      }
    } catch (error) {
      console.warn(`Failed to cache ${url}:`, error);
    }
  },

  async getCached(url: string): Promise<Response | null> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      return response || null;
    } catch {
      return null;
    }
  },

  async isCached(url: string): Promise<boolean> {
    const cached = await this.getCached(url);
    return cached !== null;
  },

  async getCacheEntries(): Promise<CacheEntry[]> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const entries: CacheEntry[] = [];

      for (const request of keys) {
        const url = request.url;
        const cached = await cache.match(url);
        if (cached) {
          const blob = await cached.blob();
          entries.push({
            url,
            cachedAt: cached.headers.get('date') ? new Date(cached.headers.get('date')!).getTime() : Date.now(),
            size: blob.size,
            type: url.includes('.mp3') ? 'audio' : 'pdf'
          });
        }
      }

      return entries;
    } catch {
      return [];
    }
  },

  async getTotalCacheSize(): Promise<number> {
    const entries = await this.getCacheEntries();
    return entries.reduce((total, entry) => total + entry.size, 0);
  },

  async clearCache(type?: 'audio' | 'pdf'): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    for (const request of keys) {
      const url = request.url;
      if (type === 'audio' && !url.includes('.mp3')) continue;
      if (type === 'pdf' && !url.includes('.pdf')) continue;
      await cache.delete(request);
    }
  },

  async clearAllCache(): Promise<void> {
    const allNames = [CACHE_NAME, ...Object.values(SW_CACHE_NAMES)];
    await Promise.all(allNames.map(name => caches.delete(name)));
  }
};
