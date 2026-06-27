import { useState } from 'preact/hooks';
import { BOOKS, type BibleBook } from '../../data/books';
import { BIBLE_VERSIONS } from '../../data/bibleVersions';
import { isChapterCached } from '../../services/bibleApi';
import { SearchIcon, CloseIcon, ChevronDownIcon, DownloadIcon } from '../ui/Icons';
import { useSettings } from '../../hooks/useSettings';
import styles from './BibleHome.module.css';

interface BibleHomeProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNavigate: (path: string) => void;
}

function BookGroup({ book, color, expandedBook, onToggle, onChapterClick, showDownloadIcons }: {
  book: BibleBook;
  color: string;
  expandedBook: string | null;
  onToggle: (id: string) => void;
  onChapterClick: (id: string, ch: number) => void;
  showDownloadIcons: boolean;
}) {
  return (
    <div class={styles.bookGroup}>
      <button
        class={`${styles.bookHeader} ${styles[color]}`}
        onClick={() => onToggle(book.id)}
      >
        <span class={styles.bookName}>{book.nombre}</span>
        <span class={styles.bookMeta}>
          <span class={styles.bookChapters}>{book.chapters} cap.</span>
        </span>
        <ChevronDownIcon
          size={20}
          className={`${styles.chevron} ${expandedBook === book.id ? styles.expanded : ''}`}
        />
      </button>

      {expandedBook === book.id && (
        <div class={styles.chapterList}>
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
            <button
              key={ch}
              class={`${styles.chapterBtn} ${styles[color]}`}
              onClick={() => onChapterClick(book.id, ch)}
            >
              {ch}
              {showDownloadIcons && !isChapterCached(book.id, ch) && (
                <DownloadIcon size={10} className={styles.chapterDownloadIcon} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BibleHome({ searchQuery, onSearchChange, onNavigate }: BibleHomeProps) {
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const { color, theme, bibleVersion } = useSettings();
  const currentVersion = BIBLE_VERSIONS.find(v => v.id === bibleVersion);

  const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredBooks = searchQuery.length > 0
    ? BOOKS.filter(b =>
        b.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
      )
    : [];

  const toggleBook = (bookId: string) => {
    setExpandedBook(prev => prev === bookId ? null : bookId);
  };

  const handleChapterClick = (bookId: string, chapter: number) => {
    onNavigate(`biblia/${encodeURIComponent(bookId)}/${chapter}`);
    onSearchChange('');
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles.mobileSearchHeader} ${styles[color]}`}>
        <form class={styles.searchForm} onSubmit={(e) => { e.preventDefault(); }}>
          <div class={styles.searchWrapper}>
            <SearchIcon size={24} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar libro..."
              value={searchQuery}
              onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
              class={styles.searchInput}
            />
            {searchQuery && (
              <button type="button" class={styles.clearBtn} onClick={() => onSearchChange('')}>
                <CloseIcon size={20} />
              </button>
            )}
          </div>
        </form>
      </header>

      <main class={styles.main}>
        <div class={styles.titleSection}>
          <h1 class={styles.mainTitle}>La Biblia</h1>
          <h2 class={styles.subtitle}>{currentVersion?.name || 'Versión Biblia Libre (VBL)'}</h2>
        </div>

        {searchQuery.length > 0 && filteredBooks.length > 0 ? (
          <div class={styles.testaments}>
            <div class={styles.testament}>
              {filteredBooks.map(book => (
                <BookGroup
                  key={book.id}
                  book={book}
                  color={color}
                  expandedBook={expandedBook}
                  onToggle={toggleBook}
                  onChapterClick={handleChapterClick}
                  showDownloadIcons={bibleVersion !== 'es-rvr1960'}
                />
              ))}
            </div>
          </div>
        ) : searchQuery.length > 0 ? (
          <div class={styles.noResults}>
            <p>No se encontraron libros para "<strong>{searchQuery}</strong>"</p>
          </div>
        ) : (
          <div class={styles.testaments}>
            {[
              { id: 'antiguo', label: 'Antiguo Testamento', books: BOOKS.filter(b => b.testament === 'antiguo') },
              { id: 'nuevo', label: 'Nuevo Testamento', books: BOOKS.filter(b => b.testament === 'nuevo') },
            ].map(testament => (
              <div key={testament.id} class={styles.testament}>
                <h2 class={styles.categoryTitle}>{testament.label}</h2>
                {testament.books.map(book => (
                  <BookGroup
                    key={book.id}
                    book={book}
                    color={color}
                    expandedBook={expandedBook}
                    onToggle={toggleBook}
                    onChapterClick={handleChapterClick}
                    showDownloadIcons={bibleVersion !== 'es-rvr1960'}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
