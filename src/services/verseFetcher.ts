import { fetchChapter } from './bibleApi';
import { getBookById } from '../data/books';

export interface VerseText {
  verse: number;
  text: string;
}

export interface FetchedVerses {
  bookName: string;
  chapter: number;
  verses: VerseText[];
}

export async function fetchVerses(bookId: string, chapter: number, verses: number[]): Promise<FetchedVerses | null> {
  try {
    const allVerses = await fetchChapter(bookId, chapter);
    const book = getBookById(bookId);

    if (!allVerses || allVerses.length === 0) return null;

    const bookName = book?.nombre || bookId;

    if (verses.length === 0) {
      // No specific verses requested, return all
      return {
        bookName,
        chapter,
        verses: allVerses.map(v => ({
          verse: parseInt(v.verse, 10),
          text: v.text,
        })),
      };
    }

    // Filter to requested verses
    const filtered = allVerses
      .filter(v => verses.includes(parseInt(v.verse, 10)))
      .map(v => ({
        verse: parseInt(v.verse, 10),
        text: v.text,
      }));

    return { bookName, chapter, verses: filtered };
  } catch {
    return null;
  }
}
