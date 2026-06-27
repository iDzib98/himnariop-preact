import { getBookById, BOOKS } from '../data/books';
import { storage } from './storage';
import { fetchRvr1960Chapter } from './rvr1960Api';

export interface BibleVerse {
  book: string;
  chapter: string;
  verse: string;
  text: string;
}

interface ChapterResponse {
  data: BibleVerse[];
}

const CACHE_PREFIX = 'bible_chapter_';

function isRvr1960(): boolean {
  return storage.bibleVersion === 'es-rvr1960';
}

function getBaseUrl(): string {
  const version = storage.bibleVersion;
  return `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${version}/books`;
}

function getCacheKey(bookId: string, chapter: number): string {
  return `${CACHE_PREFIX}${storage.bibleVersion}_${bookId}_${chapter}`;
}

function getCachedChapter(bookId: string, chapter: number): BibleVerse[] | null {
  try {
    const cached = localStorage.getItem(getCacheKey(bookId, chapter));
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
}

function setCachedChapter(bookId: string, chapter: number, data: BibleVerse[]): void {
  try {
    localStorage.setItem(getCacheKey(bookId, chapter), JSON.stringify(data));
  } catch {}
}

export async function fetchChapter(bookId: string, chapter: number): Promise<BibleVerse[]> {
  if (isRvr1960()) {
    return fetchRvr1960Chapter(bookId, chapter);
  }

  const cached = getCachedChapter(bookId, chapter);
  if (cached) return cached;

  const book = getBookById(bookId);
  if (!book) throw new Error(`Book not found: ${bookId}`);

  if (chapter < 1 || chapter > book.chapters) {
    throw new Error(`Invalid chapter ${chapter} for ${book.nombre}. Must be 1-${book.chapters}`);
  }

  const url = `${getBaseUrl()}/${bookId}/chapters/${chapter}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch chapter: ${response.statusText}`);

  const json: ChapterResponse = await response.json();
  const verses = json.data;

  setCachedChapter(bookId, chapter, verses);
  return verses;
}

export function getCachedBooks(): string[] {
  if (isRvr1960()) return [];

  const books: string[] = [];
  const prefix = `${CACHE_PREFIX}${storage.bibleVersion}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const bookId = key.replace(prefix, '').replace(/_\d+$/, '');
      if (!books.includes(bookId)) books.push(bookId);
    }
  }
  return books;
}

export function getCachedChapters(bookId: string): number[] {
  if (isRvr1960()) return [];

  const chapters: number[] = [];
  const prefix = `${CACHE_PREFIX}${storage.bibleVersion}_${bookId}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const chapter = parseInt(key.replace(prefix, ''), 10);
      if (!isNaN(chapter)) chapters.push(chapter);
    }
  }
  return chapters.sort((a, b) => a - b);
}

export function isChapterCached(bookId: string, chapter: number): boolean {
  if (isRvr1960()) return false;
  return getCachedChapter(bookId, chapter) !== null;
}

export function getOfflineProgress(): { cachedBooks: number; totalChapters: number; cachedChapters: number } {
  if (isRvr1960()) {
    return { cachedBooks: 0, totalChapters: 0, cachedChapters: 0 };
  }

  let cachedChapters = 0;
  const prefix = `${CACHE_PREFIX}${storage.bibleVersion}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) cachedChapters++;
  }
  const totalChapters = BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const cachedBooks = getCachedBooks().length;
  return { cachedBooks, totalChapters, cachedChapters };
}

export function downloadAllBibles(): void {
  if (isRvr1960()) return;

  const books = BOOKS;

  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (!isChapterCached(book.id, ch)) {
        fetchChapter(book.id, ch).catch(() => {});
      }
    }
  }
}
