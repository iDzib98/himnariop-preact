import { getBookById, BOOKS } from '../data/books';
import { storage } from './storage';
import { fetchRvr1960Chapter } from './rvr1960Api';

export interface BibleVerse {
  book: string;
  chapter: string;
  verse: string;
  text: string;
  annotations?: string[];
}

interface ChapterResponse {
  data: BibleVerse[];
}

const CACHE_PREFIX = 'bible_chapter_v3_';

function isRvr1960(): boolean {
  return storage.bibleVersion === 'es-rvr1960';
}

function isRv09(): boolean {
  return storage.bibleVersion === 'es-rv09';
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

function extractAnnotations(v: BibleVerse): { text: string; annotations: string[] } {
  const re = new RegExp(`${v.chapter}:${v.verse}\\.?.*?\\.([ \\t\\n\\r]*)(?=[a-záéíóú¡¿]|$)`, 'g');
  const annotations: string[] = [];
  const text = v.text.replace(re, (match) => {
    annotations.push(match.trim());
    return '* ';
  }).replace(/\s+/g, ' ').replace(/\* \*/g, '*').trim();
  return { text, annotations };
}

function findRv09AnnotationEnd(
  text: string,
  startPos: number,
  selfRef: string
): { annotation: string; endPos: number } | null {
  if (!text.startsWith(selfRef, startPos)) return null;

  let pos = startPos + selfRef.length;

  while (pos < text.length) {
    const ch = text[pos];

    if (ch === '.') {
      const next = text[pos + 1];

      if (!next) {
        return { annotation: text.substring(startPos, pos + 1).trim(), endPos: pos + 1 };
      }

      if (next >= '0' && next <= '9') {
        pos++;
        continue;
      }

      if (next !== ' ' && next !== '\t' && next !== '\n') {
        return { annotation: text.substring(startPos, pos + 1).trim(), endPos: pos + 1 };
      }

      let j = pos + 1;
      while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++;
      const afterSpace = text[j];

      if (!afterSpace) {
        return { annotation: text.substring(startPos, pos + 1).trim(), endPos: pos + 1 };
      }

      if (afterSpace >= '0' && afterSpace <= '9') {
        pos = j;
        continue;
      }

      if (afterSpace >= 'A' && afterSpace <= 'Z') {
        let wordEnd = j;
        while (wordEnd < text.length && text[wordEnd] !== '.' && text[wordEnd] !== ' ' && text[wordEnd] !== '\n') {
          wordEnd++;
        }
        if (wordEnd < text.length && text[wordEnd] === '.') {
          pos = wordEnd + 1;
          continue;
        }
        return { annotation: text.substring(startPos, pos + 1).trim(), endPos: pos + 1 };
      }

      if (afterSpace >= 'a' && afterSpace <= 'z') {
        if (afterSpace === 'y' && j + 1 < text.length && text[j + 1] === ' ') {
          let k = j + 2;
          while (k < text.length && text[k] === ' ') k++;
          if (k < text.length && text[k] >= '0' && text[k] <= '9') {
            pos = k;
            continue;
          }
        }
        return { annotation: text.substring(startPos, pos + 1).trim(), endPos: pos + 1 };
      }

      return { annotation: text.substring(startPos, pos + 1).trim(), endPos: pos + 1 };
    }

    pos++;
  }

  return null;
}

function extractRv09Annotations(v: BibleVerse): { text: string; annotations: string[] } {
  const selfRef = `${v.chapter}.${v.verse}`;
  const annotations: string[] = [];
  let text = v.text;

  let searchFrom = 0;
  while (searchFrom < text.length) {
    const idx = text.indexOf(selfRef, searchFrom);
    if (idx === -1) break;

    const result = findRv09AnnotationEnd(text, idx, selfRef);
    if (result) {
      annotations.push(result.annotation);
      text = text.substring(0, idx) + '* ' + text.substring(result.endPos);
      searchFrom = idx + 2;
    } else {
      searchFrom = idx + selfRef.length;
    }
  }

  text = text.replace(/\s+/g, ' ').trim();
  return { text, annotations };
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
  const extractFn = isRv09() ? extractRv09Annotations : extractAnnotations;
  const verses = json.data.map(v => {
    const { text, annotations } = extractFn(v);
    return { ...v, text, annotations: annotations.length > 0 ? annotations : undefined };
  });

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
