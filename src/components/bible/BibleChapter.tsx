import { useState, useEffect, useCallback } from 'preact/hooks';
import { fetchChapter } from '../../services/bibleApi';
import { getBookById } from '../../data/books';
import type { BibleVerse } from '../../services/bibleApi';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CloseIcon, BibleIcon, StarIcon, StarFilledIcon, TvIcon, PrintIcon, ShareIcon } from '../ui/Icons';
import { useSettings } from '../../hooks/useSettings';
import { storage } from '../../services/storage';
import { syncFavoritesAfterChange } from '../../services/cloudFavoritesService';
import { BibleTvMode } from './BibleTvMode';
import styles from './BibleChapter.module.css';

interface BibleChapterProps {
  bookId: string;
  chapter: number;
  onNavigate: (path: string) => void;
  returnTo?: string;
  startVerse?: number;
  endVerse?: number;
}

export function BibleChapter({ bookId, chapter, onNavigate, returnTo, startVerse, endVerse }: BibleChapterProps) {
  const [verses, setVerses] = useState<BibleVerse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [bibleFavorites, setBibleFavorites] = useState<string[]>(() => storage.getBibleFavorites());
  const [showTv, setShowTv] = useState(false);
  const { color, theme } = useSettings();

  const chapterKey = `biblia-${bookId}-${chapter}`;
  const isFav = bibleFavorites.includes(chapterKey);

  const toggleFavorite = useCallback(() => {
    const current = storage.getBibleFavorites();
    const updated = current.includes(chapterKey)
      ? current.filter(k => k !== chapterKey)
      : [...current, chapterKey];
    storage.setBibleFavorites(updated);
    setBibleFavorites(updated);
    syncFavoritesAfterChange();
  }, [chapterKey]);

  const book = getBookById(bookId);

  useEffect(() => {
    if (!book) {
      setError(`Libro no encontrado: ${bookId}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setVerses(null);

    fetchChapter(bookId, chapter)
      .then(data => {
        const seen = new Set<string>();
        const unique = data.filter(v => {
          const key = `${v.verse}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        let result = unique;
        if (startVerse !== undefined) result = result.filter(v => parseInt(v.verse, 10) >= startVerse);
        if (endVerse !== undefined) result = result.filter(v => parseInt(v.verse, 10) <= endVerse);
        setVerses(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error al cargar el capítulo');
        setLoading(false);
      });
  }, [bookId, chapter, startVerse, endVerse]);

  const handleShare = async () => {
    if (!verses || !book) return;
    const text = `${book.nombre} ${chapter}\n\n` + verses.map(v => `${v.verse}. ${v.text}`).join('\n');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${book.nombre} ${chapter}`,
          text,
          url: window.location.href
        });
      } catch (e) {
        // User cancelled or share failed
      }
    }
  };

  if (!book) {
    return (
      <div class={styles.container} data-theme={theme}>
        <div class={styles.error}>
          <p>Libro no encontrado</p>
          <button class={`${styles.navBtn} ${styles[color]}`} onClick={() => returnTo ? (window.location.hash = returnTo) : onNavigate('biblia')}>
            Volver a la Biblia
          </button>
        </div>
      </div>
    );
  }

  const isReading = startVerse !== undefined || endVerse !== undefined;

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  const handleChapterSelect = (ch: number) => {
    onNavigate(`biblia/${encodeURIComponent(bookId)}/${ch}`);
    setShowChapterPicker(false);
  };

  if (showTv && verses) {
    return <BibleTvMode verses={verses} bookName={book.nombre} chapter={chapter} onClose={() => setShowTv(false)} theme={theme} />;
  }

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles[color]}`}>
        <div class={styles.headerLeft}>
          <button class={styles.iconBtn} onClick={() => returnTo ? (window.location.hash = returnTo) : onNavigate('biblia')} title={returnTo ? 'Cerrar' : 'Biblia'}>
            {returnTo ? <CloseIcon size={24} /> : <BibleIcon size={24} />}
          </button>
        </div>
        <div class={styles.headerCenter}>
          <button
            class={styles.navBtn}
            disabled={!prevChapter || isReading}
            onClick={() => onNavigate(`biblia/${encodeURIComponent(bookId)}/${prevChapter}`)}
          >
            <ChevronLeftIcon size={28} />
          </button>
          <div class={styles.chapterSelector}>
            <button class={styles.chapterBtn} disabled={isReading} onClick={() => setShowChapterPicker(!showChapterPicker)}>
              <span>{chapter}</span>
              <ChevronDownIcon size={16} className={styles.chapterChevron} />
            </button>
            {showChapterPicker && (
              <div class={styles.chapterPicker}>
                {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    class={`${styles.chapterOption} ${ch === chapter ? styles.selected : ''}`}
                    onClick={() => handleChapterSelect(ch)}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            class={styles.navBtn}
            disabled={!nextChapter || isReading}
            onClick={() => onNavigate(`biblia/${encodeURIComponent(bookId)}/${nextChapter}`)}
          >
            <ChevronRightIcon size={28} />
          </button>
        </div>
        <div class={styles.headerRight}>
          <button
            class={`${styles.iconBtn} ${isFav ? styles.favorite : ''}`}
            onClick={toggleFavorite}
            title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            {isFav ? <StarFilledIcon size={24} /> : <StarIcon size={24} />}
          </button>
        </div>
      </header>

      <main class={styles.main}>
        {loading && (
          <div class={styles.loading}>
            <p>Cargando capítulo...</p>
          </div>
        )}

        {error && (
          <div class={styles.error}>
            <p>{error}</p>
            <button class={`${styles.retryBtn} ${styles[color]}`} onClick={() => onNavigate(`biblia/${encodeURIComponent(bookId)}/${chapter}`)}>
              Reintentar
            </button>
          </div>
        )}

        {verses && (
          <div class={styles.verses}>
            <h1 class={styles.chapterHeading}>
              {book.nombre} {chapter}{isReading ? `:${startVerse || 1}${endVerse && endVerse !== startVerse ? `-${endVerse}` : ''}` : ''}
            </h1>

            <div class={styles.actionButtons} data-print-hide>
              <button class={`${styles.actionBtn} ${styles.deepOrange}`} onClick={() => setShowTv(true)} title="Modo TV">
                <TvIcon size={24} />
              </button>
              <button class={`${styles.actionBtn} ${styles.blue}`} onClick={() => window.print()} title="Imprimir">
                <PrintIcon size={24} />
              </button>
              <button class={`${styles.actionBtn} ${styles.indigo}`} onClick={handleShare} title="Compartir">
                <ShareIcon size={24} />
              </button>
            </div>

            {verses.map(v => (
              <div key={v.verse} class={styles.verse}>
                <span class={styles.verseNumber}>{v.verse}</span>
                <p class={styles.verseText}>{v.text}</p>
              </div>
            ))}
          </div>
        )}

        {verses && !isReading && (
          <div class={`${styles.chapterFooter} ${styles[color]}`}>
            {prevChapter && (
              <button class={styles.footerBtn} onClick={() => onNavigate(`biblia/${encodeURIComponent(bookId)}/${prevChapter}`)}>
                <ChevronLeftIcon size={20} />
                <span>{book.nombre} {prevChapter}</span>
              </button>
            )}
            {nextChapter && (
              <button class={styles.footerBtn} onClick={() => onNavigate(`biblia/${encodeURIComponent(bookId)}/${nextChapter}`)}>
                <span>{book.nombre} {nextChapter}</span>
                <ChevronRightIcon size={20} />
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
