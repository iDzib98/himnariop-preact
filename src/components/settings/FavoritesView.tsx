import { useState, useEffect, useMemo } from 'preact/hooks';
import { useFavorites } from '../../hooks/useFavorites';
import { useSettings } from '../../hooks/useSettings';
import { fetchHimnos } from '../../services/api';
import { storage } from '../../services/storage';
import { getBookById } from '../../data/books';
import type { Himno } from '../../types/himno';
import { StarFilledIcon, DeleteIcon, BibleIcon, SearchIcon, CloseIcon } from '../ui/Icons';
import styles from './FavoritesView.module.css';

type Filter = 'himnos' | 'biblia' | 'todos';

interface FavoritesViewProps {
  onNavigate: (path: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function FavoritesView({ onNavigate, searchQuery, onSearchChange }: FavoritesViewProps) {
  const { favorites, clearFavorites } = useFavorites();
  const { color, theme } = useSettings();
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');

  const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const bibleFavs = useMemo(() => storage.getBibleFavorites(), []);

  useEffect(() => {
    fetchHimnos().then(setHimnos).catch(console.error);
  }, []);

  const favoriteHimnos = favorites
    .map(num => himnos.find(h => h && h.numero === num))
    .filter((h): h is Himno => h != null);

  const parsedBibleFavs = useMemo(() => {
    return bibleFavs.map(key => {
      const parts = key.replace('biblia-', '').split('-');
      const chapter = parseInt(parts.pop() || '0', 10);
      const bookId = parts.join('-');
      const book = getBookById(bookId);
      return { key, book, bookId, chapter };
    }).filter(item => item.book != null);
  }, [bibleFavs]);

  const showHimnos = filter === 'himnos' || filter === 'todos';
  const showBiblia = filter === 'biblia' || filter === 'todos';

  const filteredFavoriteHimnos = searchQuery
    ? favoriteHimnos.filter(h =>
        h.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
      )
    : favoriteHimnos;

  const filteredParsedBibleFavs = searchQuery
    ? parsedBibleFavs.filter(item =>
        item.book!.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
      )
    : parsedBibleFavs;

  const hasHimnos = filteredFavoriteHimnos.length > 0;
  const hasBiblia = filteredParsedBibleFavs.length > 0;
  const isEmpty = !(showHimnos && hasHimnos) && !(showBiblia && hasBiblia);

  const handleClear = () => {
    if (filter === 'biblia') {
      storage.setBibleFavorites([]);
    } else if (filter === 'himnos') {
      clearFavorites();
    } else {
      clearFavorites();
      storage.setBibleFavorites([]);
    }
  };

  const handleFavNavigate = (path: string) => {
    onSearchChange('');
    onNavigate(path);
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.mobileSearchHeader} ${styles[color]}`}>
        <form class={styles.searchForm} onSubmit={(e) => { e.preventDefault(); }}>
          <div class={styles.searchWrapper}>
            <SearchIcon size={24} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar favorito..."
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
        <div class={styles.filterBar}>
          <button
            class={`${styles.filterBtn} ${filter === 'todos' ? styles.filterActive : ''}`}
            onClick={() => setFilter('todos')}
          >
            Todos
          </button>
          <button
            class={`${styles.filterBtn} ${filter === 'himnos' ? styles.filterActive : ''}`}
            onClick={() => setFilter('himnos')}
          >
            Himnos
          </button>
          <button
            class={`${styles.filterBtn} ${filter === 'biblia' ? styles.filterActive : ''}`}
            onClick={() => setFilter('biblia')}
          >
            Biblia
          </button>
        </div>

        {searchQuery && !hasHimnos && !hasBiblia ? (
          <div class={styles.empty}>
            <p>No se encontraron favoritos para "<strong>{searchQuery}</strong>"</p>
          </div>
        ) : isEmpty ? (
          <div class={styles.empty}>
            <StarFilledIcon size={48} className={styles.emptyIcon} />
            {filter === 'himnos' && <p>No tienes himnos favoritos aún.</p>}
            {filter === 'biblia' && <p>No tienes capítulos favoritos aún.</p>}
            {filter === 'todos' && <p>No tienes favoritos aún.</p>}
            <p class={styles.hint}>
              {filter === 'biblia'
                ? 'Toca el icono de estrella en un capítulo de la biblia para añadirlo a favoritos.'
                : filter === 'himnos'
                  ? 'Toca el icono de estrella en un himno para añadirlo a favoritos.'
                  : 'Toca el icono de estrella en un himno o capítulo para añadirlo a favoritos.'}
            </p>
          </div>
        ) : (
          <>
            {showHimnos && hasHimnos && (
              <section>
                {showBiblia && <h2 class={styles.sectionTitle}>Himnos</h2>}
                <ul class={styles.list}>
                  {filteredFavoriteHimnos.map(himno => (
                    <li key={himno.numero} class={styles.item}>
                      <button
                        class={`${styles.itemBtn} ${styles[color]}`}
                        onClick={() => handleFavNavigate(String(himno.numero))}
                      >
                        <span class={styles.number}>{himno.numero}</span>
                        <span class={styles.itemTitle}>{himno.titulo}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {showBiblia && hasBiblia && (
              <section>
                {showHimnos && <h2 class={styles.sectionTitle}>Biblia</h2>}
                <ul class={styles.list}>
                  {filteredParsedBibleFavs.map(({ key, book, bookId, chapter }) => (
                    <li key={key} class={styles.item}>
                      <button
                        class={`${styles.itemBtn} ${styles[color]}`}
                        onClick={() => handleFavNavigate(`biblia/${encodeURIComponent(bookId)}/${chapter}`)}
                      >
                        <BibleIcon size={20} className={styles.bibleIcon} />
                        <span class={styles.itemTitle}>{book!.nombre} {chapter}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(filter === 'todos' || (filter === 'himnos' && hasHimnos) || (filter === 'biblia' && hasBiblia)) && (
              <div class={styles.footer}>
                <button class={styles.clearBtn} onClick={handleClear}>
                  <DeleteIcon size={18} />
                  {filter === 'himnos' ? 'Limpiar himnos' : filter === 'biblia' ? 'Limpiar biblia' : 'Limpiar todos'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
