import { RVR1960_BOOK_REVERSE, RVR1960_BOOK_MAP } from '../data/rvr1960Mapping';
import { getBookById } from '../data/books';
import type { BibleVerse } from './bibleApi';

const RVR1960_URL = 'https://raw.githubusercontent.com/dscottpi/bibles/refs/heads/master/RVR1960-Spanish.json';
const RVR1960_CACHE_KEY = 'rvr1960_books';

type Rvr1960Data = Record<string, Record<string, Record<string, string>>>;

async function loadFullJson(): Promise<Rvr1960Data> {
  const cached = localStorage.getItem(RVR1960_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const response = await fetch(RVR1960_URL);
  if (!response.ok) throw new Error(`Failed to fetch RVR1960: ${response.statusText}`);

  const data: Rvr1960Data = await response.json();

  // Cache each book separately to avoid hitting localStorage size limits
  for (const [bookName, chapters] of Object.entries(data)) {
    try {
      localStorage.setItem(`${RVR1960_CACHE_KEY}_${bookName}`, JSON.stringify(chapters));
    } catch {
      // Book too large for a single entry, skip caching
    }
  }

  // Store the list of book names
  try {
    localStorage.setItem(RVR1960_CACHE_KEY, JSON.stringify(Object.keys(data)));
  } catch {
    // Could not cache the book list
  }

  return data;
}

function getCachedBookNames(): string[] | null {
  try {
    const cached = localStorage.getItem(RVR1960_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function getCachedBook(bookName: string): Record<string, Record<string, string>> | null {
  try {
    const cached = localStorage.getItem(`${RVR1960_CACHE_KEY}_${bookName}`);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

export async function fetchRvr1960Chapter(bookId: string, chapter: number): Promise<BibleVerse[]> {
  const book = getBookById(bookId);
  if (!book) throw new Error(`Book not found: ${bookId}`);

  const rvr1960Name = RVR1960_BOOK_REVERSE[bookId];
  if (!rvr1960Name) throw new Error(`No RVR1960 mapping for book: ${bookId}`);

  // Try to get the book from cache
  let bookData = getCachedBook(rvr1960Name);

  // If not cached, try to get full JSON
  if (!bookData) {
    const fullData = await loadFullJson();
    bookData = fullData[rvr1960Name];
    if (!bookData) throw new Error(`Book not found in RVR1960: ${rvr1960Name}`);
  }

  const chapterKey = String(chapter);
  const chapterData = bookData[chapterKey];
  if (!chapterData) throw new Error(`Chapter ${chapter} not found in ${book.nombre}`);

  const verses: BibleVerse[] = [];
  for (const [verseNum, text] of Object.entries(chapterData)) {
    verses.push({
      book: rvr1960Name,
      chapter: chapterKey,
      verse: verseNum,
      text,
    });
  }

  return verses;
}

export function fixVerseBreaks(text: string, join: '\n' | ' '): string {
  return text
    .replace(/([;:,.!])([A-Z])/gu, `$1${join}$2`)
    .replace(/(\p{Ll})(\p{Lu})/gu, `$1${join}$2`)
    .replace(/\s+$/, '');
}

export function isRvr1960Cached(): boolean {
  return getCachedBookNames() !== null;
}

export function getRvr1960Progress(): { cachedBooks: number; totalChapters: number; cachedChapters: number } {
  const bookNames = getCachedBookNames();
  if (!bookNames) return { cachedBooks: 0, totalChapters: 0, cachedChapters: 0 };

  let cachedChapters = 0;

  for (const bookName of bookNames) {
    const cached = getCachedBook(bookName);
    if (cached) {
      cachedChapters += Object.keys(cached).length;
    }
  }

  const totalChapters = bookNames.reduce((sum, name) => {
    const bookId = RVR1960_BOOK_MAP[name];
    const book = bookId ? getBookById(bookId) : undefined;
    return sum + (book?.chapters || 0);
  }, 0);

  return { cachedBooks: bookNames.length, totalChapters, cachedChapters };
}
