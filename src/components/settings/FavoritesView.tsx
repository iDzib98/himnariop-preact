import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { useFavorites } from '../../hooks/useFavorites';
import { useUserSongFavorites } from '../../hooks/useUserSongFavorites';
import { useSettings } from '../../hooks/useSettings';
import { fetchHimnos } from '../../services/api';
import { storage } from '../../services/storage';
import { getBookById } from '../../data/books';
import { onAuthChange, signInWithGoogle } from '../../services/authService';
import { syncOnLogin, resolveConflict, syncFavoritesAfterChange } from '../../services/cloudFavoritesService';
import type { CloudFavorites } from '../../services/cloudFavoritesService';
import { getUserSong } from '../../services/userSongStorage';
import { getCloudSong } from '../../services/cloudSongService';
import { SyncConflictModal } from './SyncConflictModal';
import { Modal } from '../ui/Modal';
import type { Himno, UserSong } from '../../types/himno';
import type { User } from 'firebase/auth';
import { StarFilledIcon, DeleteIcon, BibleIcon, SearchIcon, CloseIcon, MusicNoteIcon, GoogleIcon } from '../ui/Icons';
import styles from './FavoritesView.module.css';

type Filter = 'himnos' | 'biblia' | 'cantos' | 'todos';

interface FavoritesViewProps {
  onNavigate: (path: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function FavoritesView({ onNavigate, searchQuery, onSearchChange }: FavoritesViewProps) {
  const { favorites: hymnFavorites, clearFavorites: clearHymnFavorites } = useFavorites();
  const { clearFavorites: clearSongFavorites } = useUserSongFavorites();
  const { color, theme } = useSettings();
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [user, setUser] = useState<User | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [syncVersion, setSyncVersion] = useState(0);
  const [conflictData, setConflictData] = useState<{ local: CloudFavorites; cloud: CloudFavorites } | null>(null);
  const [bibleFavs, setBibleFavs] = useState<string[]>(() => storage.getBibleFavorites());
  const [favoriteSongs, setFavoriteSongs] = useState<UserSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [confirmClear, setConfirmClear] = useState<Filter | null>(null);

  useEffect(() => {
    return onAuthChange(u => {
      setUser(u);
      if (u) {
        setSyncState('syncing');
        syncOnLogin(u.uid).then(result => {
          if (result.status === 'conflict') {
            setConflictData({ local: result.local, cloud: result.cloud });
          } else {
            setBibleFavs(storage.getBibleFavorites());
            setSyncVersion(v => v + 1);
          }
          setSyncState('idle');
        }).catch(() => {
          setSyncState('error');
        });
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingSongs(true);
      let ids: string[] = [];
      try {
        const data = localStorage.getItem('user_favorites');
        ids = data ? JSON.parse(data) : [];
      } catch {}
      const loaded: UserSong[] = [];
      for (const id of ids) {
        if (cancelled) return;
        const local = getUserSong(id);
        if (local) {
          loaded.push(local);
        } else {
          try {
            const cloud = await getCloudSong(id);
            if (cloud) loaded.push(cloud);
          } catch {}
        }
      }
      if (!cancelled) {
        setFavoriteSongs(loaded);
        setLoadingSongs(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [syncVersion]);

  useEffect(() => {
    fetchHimnos().then(setHimnos).catch(console.error);
  }, []);

  const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const handleConflictResolve = useCallback(async (choice: 'local' | 'cloud' | 'merge') => {
    if (!user || !conflictData) return;
    setSyncState('syncing');
    try {
      await resolveConflict(user.uid, choice, conflictData.local, conflictData.cloud);
      setBibleFavs(storage.getBibleFavorites());
      setSyncVersion(v => v + 1);
    } catch {
      setSyncState('error');
    }
    setConflictData(null);
    setSyncState('idle');
  }, [user, conflictData]);

  const executeClear = useCallback((target: Filter) => {
    if (target === 'biblia') {
      storage.setBibleFavorites([]);
      setBibleFavs([]);
    } else if (target === 'himnos') {
      clearHymnFavorites();
    } else if (target === 'cantos') {
      clearSongFavorites();
      setFavoriteSongs([]);
    } else {
      clearHymnFavorites();
      clearSongFavorites();
      storage.setBibleFavorites([]);
      setBibleFavs([]);
      setFavoriteSongs([]);
    }
    syncFavoritesAfterChange();
    setConfirmClear(null);
  }, [clearHymnFavorites, clearSongFavorites]);

  const favoriteHimnos = hymnFavorites
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
  const showCantos = filter === 'cantos' || filter === 'todos';

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

  const filteredFavoriteSongs = searchQuery
    ? favoriteSongs.filter(s =>
        s.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
      )
    : favoriteSongs;

  const hasHimnos = filteredFavoriteHimnos.length > 0;
  const hasBiblia = filteredParsedBibleFavs.length > 0;
  const hasCantos = filteredFavoriteSongs.length > 0;
  const isEmpty = !(showHimnos && hasHimnos) && !(showBiblia && hasBiblia) && !(showCantos && hasCantos);

  const handleFavNavigate = (path: string) => {
    onSearchChange('');
    onNavigate(path);
  };

  const clearLabel = confirmClear === 'himnos' ? 'himnos'
    : confirmClear === 'biblia' ? 'capítulos'
    : confirmClear === 'cantos' ? 'cantos'
    : 'todos';

  return (
    <div class={styles.container} data-theme={theme}>
      <SyncConflictModal
        isOpen={conflictData != null}
        local={conflictData?.local ?? { himnos: [], biblia: [], cantos: [] }}
        cloud={conflictData?.cloud ?? { himnos: [], biblia: [], cantos: [] }}
        onResolve={handleConflictResolve}
        onClose={() => setConflictData(null)}
      />

      <Modal
        isOpen={confirmClear != null}
        onClose={() => setConfirmClear(null)}
        title="Limpiar favoritos"
      >
        <p style={{ textAlign: 'center', color: 'var(--color-grey)', marginBottom: 20 }}>
          ¿Estás seguro de que deseas eliminar todos los favoritos de {clearLabel}?
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: '0.9rem',
              color: 'var(--on-background)', background: 'rgba(255,255,255,0.08)'
            }}
            onClick={() => setConfirmClear(null)}
          >
            Cancelar
          </button>
          <button
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: '0.9rem',
              color: 'white', background: 'var(--color-red)', fontWeight: 600
            }}
            onClick={() => confirmClear && executeClear(confirmClear)}
          >
            Limpiar
          </button>
        </div>
      </Modal>

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
          <button
            class={`${styles.filterBtn} ${filter === 'cantos' ? styles.filterActive : ''}`}
            onClick={() => setFilter('cantos')}
          >
            Cantos
          </button>
        </div>

        {!user && (
          <div class={styles.syncBanner}>
            <StarFilledIcon size={20} className={styles.syncBannerIcon} />
            <span class={styles.syncBannerText}>
              Inicia sesión para sincronizar tus favoritos entre dispositivos
            </span>
            <button class={styles.syncBtn} onClick={signInWithGoogle}>
              <GoogleIcon size={18} />
              Iniciar sesión
            </button>
          </div>
        )}

        {syncState === 'error' && (
          <div class={styles.syncError}>
            Error al sincronizar favoritos. Intenta de nuevo más tarde.
          </div>
        )}

        {searchQuery && !hasHimnos && !hasBiblia && !hasCantos ? (
          <div class={styles.empty}>
            <p>No se encontraron favoritos para "<strong>{searchQuery}</strong>"</p>
          </div>
        ) : isEmpty ? (
          <div class={styles.empty}>
            <StarFilledIcon size={48} className={styles.emptyIcon} />
            {filter === 'himnos' && <p>No tienes himnos favoritos aún.</p>}
            {filter === 'biblia' && <p>No tienes capítulos favoritos aún.</p>}
            {filter === 'cantos' && <p>No tienes cantos favoritos aún.</p>}
            {filter === 'todos' && <p>No tienes favoritos aún.</p>}
            <p class={styles.hint}>
              {filter === 'biblia'
                ? 'Toca el icono de estrella en un capítulo de la biblia para añadirlo a favoritos.'
                : filter === 'himnos'
                  ? 'Toca el icono de estrella en un himno para añadirlo a favoritos.'
                  : filter === 'cantos'
                    ? 'Toca el icono de estrella en un canto para añadirlo a favoritos.'
                    : 'Toca el icono de estrella en un himno, capítulo o canto para añadirlo a favoritos.'}
            </p>
          </div>
        ) : (
          <>
            {showHimnos && hasHimnos && (
              <section>
                <h2 class={styles.sectionTitle}>Himnos</h2>
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
                <h2 class={styles.sectionTitle}>Biblia</h2>
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

            {showCantos && hasCantos && !loadingSongs && (
              <section>
                <h2 class={styles.sectionTitle}>Mis cantos</h2>
                <ul class={styles.list}>
                  {filteredFavoriteSongs.map(song => (
                    <li key={song.id} class={styles.item}>
                      <button
                        class={`${styles.itemBtn} ${styles[color]}`}
                        onClick={() => handleFavNavigate(`canto/${song.id}`)}
                      >
                        <MusicNoteIcon size={20} className={styles.musicIcon} />
                        <span class={styles.itemTitle}>{song.titulo}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(filter === 'todos' || (filter === 'himnos' && hasHimnos) || (filter === 'biblia' && hasBiblia) || (filter === 'cantos' && hasCantos)) && (
              <div class={styles.footer}>
                <button class={styles.clearBtn} onClick={() => setConfirmClear(filter)}>
                  <DeleteIcon size={18} />
                  {filter === 'himnos' ? 'Limpiar himnos' : filter === 'biblia' ? 'Limpiar biblia' : filter === 'cantos' ? 'Limpiar cantos' : 'Limpiar todos'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
