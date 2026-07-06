import { useState, useEffect, useRef } from 'preact/hooks';
import { fetchHimnos } from '../../services/api';
import { CATEGORIAS } from '../../data/categorias';
import type { Himno, UserSong } from '../../types/himno';
import type { Church } from '../../types/orden';
import { SearchIcon, CloseIcon, ChevronDownIcon, StarIcon, PlusIcon, MusicNoteIcon } from '../ui/Icons';
import { useSettings } from '../../hooks/useSettings';
import { useFavorites } from '../../hooks/useFavorites';
import { getUserSongs } from '../../services/userSongStorage';
import { getCurrentUser } from '../../services/authService';
import { getMyCloudSongs, getChurchApprovedSongs } from '../../services/cloudSongService';
import { getUserChurches, getLocalChurchIds, getChurch } from '../../services/churchService';

import styles from './Home.module.css';

interface HomeProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNavigate: (hymnNumber: number) => void;
  navigate: (path: string) => void;
}

export function Home({ searchQuery, onSearchChange, onNavigate, navigate }: HomeProps) {
  const [himnos, setHimnos] = useState<Himno[] | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mySongs, setMySongs] = useState<UserSong[]>(() => getUserSongs());
  const [churchSongsById, setChurchSongsById] = useState<Map<string, { name: string; songs: UserSong[] }>>(new Map());
  const [expandedMySongs, setExpandedMySongs] = useState(false);
  const [expandedChurchIds, setExpandedChurchIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const { color, theme } = useSettings();
  const { favorites } = useFavorites();
  const user = getCurrentUser();

  useEffect(() => {
    fetchHimnos().then(setHimnos).catch((err) => {
      console.error('Error loading himnos:', err);
      setHimnos([]);
    });
  }, []);

  useEffect(() => {
    const loadChurchSongs = async (uid?: string) => {
      try {
        const localIds = getLocalChurchIds();
        let churches: Church[] = [];
        if (uid) {
          churches = await getUserChurches(uid);
        }
        const churchMap = new Map<string, { name: string; songs: UserSong[] }>();

        for (const church of churches) {
          churchMap.set(church.id, { name: church.name, songs: [] });
        }

        const localChurchDetails: Church[] = [];
        for (const localId of localIds) {
          if (!churches.find(c => c.id === localId)) {
            const church = await getChurch(localId);
            if (church) {
              localChurchDetails.push(church);
            }
          }
        }

        for (const church of localChurchDetails) {
          churchMap.set(church.id, { name: church.name, songs: [] });
        }

        const allIds = [...new Set([...churches.map(c => c.id), ...localIds])];
        console.log('[ChurchSongs] User churches:', churches.map(c => c.id), 'Local ids:', localIds, 'All ids:', allIds);

        for (const churchId of allIds) {
          try {
            const songs = await getChurchApprovedSongs(churchId);
            console.log('[ChurchSongs] Songs for church', churchId, ':', songs.length);

            let churchName = 'Iglesia';
            const churchFromList = churches.find(c => c.id === churchId);
            if (churchFromList) {
              churchName = churchFromList.name;
            } else {
              const localChurch = localChurchDetails.find(c => c.id === churchId);
              if (localChurch) {
                churchName = localChurch.name;
              }
            }

            if (!churchMap.has(churchId)) {
              churchMap.set(churchId, { name: churchName, songs: [] });
            } else {
              churchMap.get(churchId)!.name = churchName;
            }
            churchMap.get(churchId)!.songs = songs;
          } catch (e) {
            console.error('[ChurchSongs] Error loading songs for church', churchId, e);
          }
        }
        console.log('[ChurchSongs] Churches with songs:', churchMap.size);
        setChurchSongsById(churchMap);
      } catch (e) {
        console.error('[ChurchSongs] Error loading church songs:', e);
        setChurchSongsById(new Map());
      }
    };

    if (!user) {
      const localSongs = getUserSongs();
      setMySongs(localSongs);
      loadChurchSongs();
      return;
    }

    getMyCloudSongs(user.uid).then(cloudSongs => {
      const localSongs = getUserSongs();
      const merged = [...localSongs];
      for (const cs of cloudSongs) {
        if (!merged.find(s => s.id === cs.id)) {
          merged.push(cs);
        }
      }
      setMySongs(merged);
    }).catch(() => {
      setMySongs(getUserSongs());
    });

    loadChurchSongs(user.uid);
  }, [user]);

  const searchNum = parseInt(searchQuery, 10);
  const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const findMatchingVerse = (himno: Himno) => {
    for (const verso of himno.versos) {
      for (const linea of verso.lineas) {
        if (linea.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)) {
          return linea;
        }
      }
    }
    return null;
  };

  const highlightMatch = (text: string) => {
    const index = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(normalizedQuery);
    if (index === -1) return text;
    const before = text.slice(0, index);
    const match = text.slice(index, index + searchQuery.length);
    const after = text.slice(index + searchQuery.length);
    return <>{before}<u>{match}</u>{after}</>;
  };

  const songMatch = (song: UserSong) => {
    if (!normalizedQuery) return false;
    const titleMatch = song.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery);
    const lyricMatch = song.versos.some(v => v.lineas.some(l =>
      l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    ));
    return titleMatch || lyricMatch;
  };

  const filteredHimnos = himnos && searchQuery.length > 0
    ? himnos
        .filter(h => {
          if (!h) return false;
          const titleMatch = h.titulo?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .includes(normalizedQuery);
          const numMatch = !isNaN(searchNum) && h.numero === searchNum;
          const lyricMatch = h.versos.some(v => v.lineas.some(l =>
            l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
          ));
          return titleMatch || numMatch || lyricMatch;
        })
        .map(h => ({
          himno: h,
          isTitleMatch: h.titulo?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery) || (!isNaN(searchNum) && h.numero === searchNum)
        }))
        .sort((a, b) => (b.isTitleMatch ? 1 : 0) - (a.isTitleMatch ? 1 : 0))
    : [];

  const filteredMySongs = searchQuery.length > 0 ? mySongs.filter(songMatch) : [];
  const allChurchSongs = Array.from(churchSongsById.values()).flatMap(c => c.songs);
  const filteredChurchSongs = searchQuery.length > 0
    ? allChurchSongs.filter(songMatch).filter(song => !mySongs.some(m => m.id === song.id))
    : [];

  const hasSearchResults = searchQuery.length > 0 && (filteredHimnos.length > 0 || filteredMySongs.length > 0 || filteredChurchSongs.length > 0);

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSearchFocus = () => {
    setShowSearchResults(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchResults(false), 200);
  };

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    const num = parseInt(searchQuery, 10);
    if (filteredHimnos.length > 0) {
      onNavigate(filteredHimnos[0].himno.numero);
      onSearchChange('');
      setShowSearchResults(false);
    } else if (num > 0 && num <= 706) {
      onNavigate(num);
      onSearchChange('');
    }
  };

  const handleResultClick = (numero: number) => {
    onNavigate(numero);
    onSearchChange('');
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles.mobileSearchHeader} ${styles[color]}`}>
        <form class={styles.searchForm} onSubmit={handleSearchSubmit}>
          <div class={styles.searchWrapper}>
            <SearchIcon size={24} className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar himno o por número..."
              value={searchQuery}
              onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
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

      {showSearchResults && hasSearchResults && (
        <div class={styles.searchResults}>
          {filteredHimnos.slice(0, 10).map(({ himno, isTitleMatch }) => (
            <button
              key={`h-${himno.numero}`}
              class={styles.searchResult}
              onClick={() => handleResultClick(himno.numero)}
            >
              <span class={styles.resultNumber}>{himno.numero}.</span>
              <span class={styles.resultContent}>
                <span class={styles.resultTitle}>{highlightMatch(himno.titulo)}</span>
                {!isTitleMatch && findMatchingVerse(himno) && (
                  <span class={styles.resultVerse}>"{highlightMatch(findMatchingVerse(himno)!)}"</span>
                )}
              </span>
            </button>
          ))}
          {filteredMySongs.slice(0, 5).map(song => (
            <button
              key={`m-${song.id}`}
              class={styles.searchResult}
              onClick={() => { navigate(`canto/${song.id}`); onSearchChange(''); }}
            >
              <span class={styles.resultBadge}>Mi canto</span>
              <span class={styles.resultContent}>
                <span class={styles.resultTitle}>{highlightMatch(song.titulo)}</span>
              </span>
            </button>
          ))}
          {filteredChurchSongs.slice(0, 5).map(song => (
            <button
              key={`c-${song.id}`}
              class={styles.searchResult}
              onClick={() => { navigate(`canto/${song.id}`); onSearchChange(''); }}
            >
              <span class={styles.resultBadge}>Iglesia</span>
              <span class={styles.resultContent}>
                <span class={styles.resultTitle}>{highlightMatch(song.titulo)}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <main class={styles.main}>
        <div class={styles.titleSection}>
          <h1 class={styles.mainTitle}>Solo a Dios la Gloria</h1>
          <h2 class={styles.subtitle}>Himnario Evangélico Presbiteriano</h2>
        </div>

        {searchQuery.length > 0 && (filteredHimnos.length > 0 || filteredMySongs.length > 0 || filteredChurchSongs.length > 0) ? (
          <div class={styles.inlineResults}>
            {filteredHimnos.map(({ himno }) => (
              <button
                key={himno.numero}
                class={`${styles.hymnCard} ${styles[color]}`}
                onClick={() => handleResultClick(himno.numero)}
              >
                <span class={styles.hymnNumber}>{himno.numero}</span>
                <span class={styles.hymnTitle}>{highlightMatch(himno.titulo)}</span>
                {favorites.includes(himno.numero) && <StarIcon size={16} className={styles.favStar} />}
              </button>
            ))}
            {filteredMySongs.map(song => (
              <button
                key={`m-${song.id}`}
                class={`${styles.hymnCard} ${styles.songCard} ${styles[color]}`}
                onClick={() => { navigate(`canto/${song.id}`); onSearchChange(''); }}
              >
                <MusicNoteIcon size={16} className={styles.songIcon} />
                <span class={styles.hymnTitle}>{highlightMatch(song.titulo)}</span>
                <span class={styles.sourceBadge}>Mi canto</span>
              </button>
            ))}
            {filteredChurchSongs.map(song => (
              <button
                key={`c-${song.id}`}
                class={`${styles.hymnCard} ${styles.songCard} ${styles[color]}`}
                onClick={() => { navigate(`canto/${song.id}`); onSearchChange(''); }}
              >
                <MusicNoteIcon size={16} className={styles.songIcon} />
                <span class={styles.hymnTitle}>{highlightMatch(song.titulo)}</span>
                <span class={styles.sourceBadge}>Iglesia</span>
              </button>
            ))}
          </div>
        ) : searchQuery.length > 0 ? (
          <div class={styles.noResults}>
            <p>No se encontraron himnos para "<strong>{searchQuery}</strong>"</p>
          </div>
        ) : (
          <div class={styles.categories}>
            {/* Cantos section */}
            <div class={styles.category}>
              <div class={styles.userSectionHeader}>
                <MusicNoteIcon size={20} className={styles.userSectionIcon} />
                <h2 class={styles.categoryTitle}>Cantos</h2>
                <button class={styles.addSongBtn} onClick={() => navigate('canto/nuevo')} title="Agregar canto">
                  <PlusIcon size={20} />
                </button>
              </div>

              {mySongs.length === 0 && churchSongsById.size === 0 && (
                <p class={styles.helperText}>Aquí verás los cantos de tu iglesia. Puedes crear cantos y compartirlos con el botón +.</p>
              )}

              {/* Mis cantos */}
              {mySongs.length > 0 && (
                <div class={styles.group}>
                  <button
                    class={`${styles.groupHeader} ${styles[color]}`}
                    onClick={() => setExpandedMySongs(!expandedMySongs)}
                  >
                    <span class={styles.groupTitle}>Mis cantos</span>
                    <span class={styles.countBadge}>{mySongs.length}</span>
                    <ChevronDownIcon
                      size={20}
                      className={`${styles.chevron} ${expandedMySongs ? styles.expanded : ''}`}
                    />
                  </button>
                  {expandedMySongs && (
                    <div class={styles.hymnList}>
                      {mySongs.map(song => (
                        <button
                          key={song.id}
                          class={`${styles.hymnCard} ${styles[color]}`}
                          onClick={() => navigate(`canto/${song.id}`)}
                        >
                          <MusicNoteIcon size={16} className={styles.songIcon} />
                          <span class={styles.hymnTitle}>{song.titulo}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Church songs collapsibles */}
              {Array.from(churchSongsById.entries())
                .filter(([, { songs }]) => songs.length > 0)
                .map(([churchId, { name, songs }]) => (
                <div key={churchId} class={styles.group}>
                  <button
                    class={`${styles.groupHeader} ${styles[color]}`}
                    onClick={() => {
                      setExpandedChurchIds(prev => {
                        const next = new Set(prev);
                        if (next.has(churchId)) {
                          next.delete(churchId);
                        } else {
                          next.add(churchId);
                        }
                        return next;
                      });
                    }}
                  >
                    <span class={styles.groupTitle}>Cantos de {name}</span>
                    <span class={styles.countBadge}>{songs.length}</span>
                    <ChevronDownIcon
                      size={20}
                      className={`${styles.chevron} ${expandedChurchIds.has(churchId) ? styles.expanded : ''}`}
                    />
                  </button>
                  {expandedChurchIds.has(churchId) && (
                    <div class={styles.hymnList}>
                      {songs.map(song => (
                        <button
                          key={song.id}
                          class={`${styles.hymnCard} ${styles[color]}`}
                          onClick={() => navigate(`canto/${song.id}`)}
                        >
                          <MusicNoteIcon size={16} className={styles.songIcon} />
                          <span class={styles.hymnTitle}>{song.titulo}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Existing hymn categories */}
            {CATEGORIAS.map((categoria, catIndex) => (
              <div key={catIndex} class={styles.category}>
                <h2 class={styles.categoryTitle}>{categoria.titulo}</h2>

                {categoria.grupos.map((grupo, groupIndex) => (
                  <div key={groupIndex} class={styles.group}>
                    <button
                      class={`${styles.groupHeader} ${styles[color]}`}
                      onClick={() => toggleCategory(catIndex * 100 + groupIndex)}
                    >
                      <span class={styles.groupTitle}>{grupo.titulo}</span>
                      <span class={styles.groupRange}>{grupo.inicio} - {grupo.fin}</span>
                      <ChevronDownIcon
                        size={20}
                        className={`${styles.chevron} ${expandedCategories.has(catIndex * 100 + groupIndex) ? styles.expanded : ''}`}
                      />
                    </button>

                    {expandedCategories.has(catIndex * 100 + groupIndex) && himnos && (
                      <div class={styles.hymnList}>
                        {Array.from({ length: grupo.fin - grupo.inicio + 1 }, (_, i) => grupo.inicio + i)
                          .map(num => {
                            const himno = himnos.find(h => h && h.numero === num);
                            if (!himno) return null;
                            const isFavorite = favorites.includes(num);
                            return (
                              <button
                                key={num}
                                class={`${styles.hymnCard} ${styles[color]}`}
                                onClick={() => onNavigate(num)}
                              >
                                <span class={styles.hymnNumber}>{himno.numero}</span>
                                <span class={styles.hymnTitle}>{himno.titulo}</span>
                                {isFavorite && <StarIcon size={16} className={styles.favStar} />}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {himnos === null && (
          <div class={styles.loading}>
            <p>Cargando himnario...</p>
          </div>
        )}
      </main>
    </div>
  );
}
