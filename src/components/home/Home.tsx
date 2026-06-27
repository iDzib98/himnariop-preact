import { useState, useEffect, useRef } from 'preact/hooks';
import { fetchHimnos } from '../../services/api';
import { CATEGORIAS } from '../../data/categorias';
import type { Himno } from '../../types/himno';
import { SearchIcon, CloseIcon, ChevronDownIcon, StarIcon, InfoIcon, SettingsIcon } from '../ui/Icons';
import { useSettings } from '../../hooks/useSettings';
import { useFavorites } from '../../hooks/useFavorites';
import styles from './Home.module.css';

interface HomeProps {
  onNavigate: (hymnNumber: number) => void;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
  onOpenInfo: () => void;
}

export function Home({ onNavigate, onOpenSettings, onOpenFavorites, onOpenInfo }: HomeProps) {
  const [himnos, setHimnos] = useState<Himno[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]));
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { color, theme } = useSettings();
  const { favorites } = useFavorites();

  useEffect(() => {
    fetchHimnos().then(setHimnos).catch((err) => {
      console.error('Error loading himnos:', err);
      setHimnos([]);
    });
  }, []);

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
      setSearchQuery('');
      setShowSearchResults(false);
    } else if (num > 0 && num <= 706) {
      onNavigate(num);
      setSearchQuery('');
    }
  };

  const handleResultClick = (numero: number) => {
    onNavigate(numero);
    setSearchQuery('');
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles[color]}`}>
        <form class={styles.searchForm} onSubmit={handleSearchSubmit}>
          <div class={styles.searchWrapper}>
            <SearchIcon size={24} className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar himno o por número..."
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              class={styles.searchInput}
            />
            {searchQuery && (
              <button type="button" class={styles.clearBtn} onClick={() => setSearchQuery('')}>
                <CloseIcon size={20} />
              </button>
            )}
          </div>
        </form>

        <nav class={styles.nav}>
          <button class={styles.navBtn} onClick={onOpenInfo} title="Información">
            <InfoIcon size={24} />
          </button>
          <button class={styles.navBtn} onClick={onOpenSettings} title="Ajustes">
            <SettingsIcon size={24} />
          </button>
        </nav>
      </header>

      {showSearchResults && filteredHimnos.length > 0 && (
        <div class={styles.searchResults}>
          {filteredHimnos.slice(0, 20).map(({ himno, isTitleMatch }) => (
            <button
              key={himno.numero}
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
        </div>
      )}

      <main class={styles.main}>
        <div class={styles.titleSection}>
          <h1 class={styles.mainTitle}>Solo a Dios la Gloria</h1>
          <h2 class={styles.subtitle}>Himnario Evangélico Presbiteriano</h2>
        </div>

        <div class={styles.categories}>
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

        {himnos === null && (
          <div class={styles.loading}>
            <p>Cargando himnario...</p>
          </div>
        )}
      </main>

      <button
        class={`${styles.fab} ${styles[color]}`}
        onClick={onOpenFavorites}
        title="Ver favoritos"
      >
        <StarIcon size={28} />
        {favorites.length > 0 && <span class={styles.fabBadge}>{favorites.length}</span>}
      </button>
    </div>
  );
}
