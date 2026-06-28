import { HomeIcon, BibleIcon, StarIcon, InfoIcon, SettingsIcon, SearchIcon, CloseIcon, ChevronLeftIcon, OrderIcon } from './Icons';
import type { Section } from '../../hooks/useHashRoute';
import styles from './TabBar.module.css';

interface TabBarProps {
  section: Section;
  color?: string;
  onNavigate: (path: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

interface TabItem {
  id: Section;
  label: string;
  icon: preact.ComponentChildren;
  path: string;
}

const TABS: TabItem[] = [
  { id: 'himnario', label: 'Himnario', icon: <HomeIcon size={20} />, path: 'home' },
  { id: 'biblia', label: 'Biblia', icon: <BibleIcon size={20} />, path: 'biblia' },
  { id: 'orden', label: 'Órdenes', icon: <OrderIcon size={20} />, path: 'orden' },
  { id: 'favoritos', label: 'Favoritos', icon: <StarIcon size={20} />, path: 'favoritos' },
  { id: 'info', label: 'Info', icon: <InfoIcon size={20} />, path: 'info' },
  { id: 'configuracion', label: 'Configuración', icon: <SettingsIcon size={20} />, path: 'configuracion' },
];

const PAGE_TITLES: Record<string, string> = {
  orden: 'Órdenes de Culto',
  favoritos: 'Favoritos',
  info: 'Información',
  configuracion: 'Configuración',
};

export function TabBar({
  section,
  color = 'indigo',
  onNavigate,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  showSearch = false,
}: TabBarProps) {
  return (
    <>
      {/* Mobile: bottom bar */}
      <nav class={`${styles.bar} ${styles.bottom} ${styles[color]}`}>
        <div class={styles.tabsRow}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              class={`${styles.tab} ${section === tab.id ? styles.active : ''}`}
              onClick={() => onNavigate(tab.path)}
              title={tab.label}
            >
              <span class={styles.tabIconWrap}>
                {tab.icon}
              </span>
              <span class={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop: top bar */}
      <nav class={`${styles.bar} ${styles.top} ${styles[color]}`}>
        <div class={styles.topInner}>
          <div class={styles.left}>
            {showSearch && onSearchChange ? (
              <div class={styles.desktopSearch}>
                <SearchIcon size={22} className={styles.searchIcon} />
                <input
                  type="text"
                  class={styles.searchInput}
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
                />
                {searchValue && (
                  <button class={styles.clearBtn} onClick={() => onSearchChange('')}>
                    <CloseIcon size={18} />
                  </button>
                )}
              </div>
            ) : PAGE_TITLES[section] ? (
              <div class={styles.pageHeaderLeft}>
                <button class={styles.backBtn} onClick={() => onNavigate('home')}>
                  <ChevronLeftIcon size={24} />
                </button>
                <h1 class={styles.pageTitle}>{PAGE_TITLES[section]}</h1>
              </div>
            ) : null}
          </div>
          <div class={styles.right}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                class={`${styles.tab} ${styles.topTab} ${section === tab.id ? styles.active : ''}`}
                onClick={() => onNavigate(tab.path)}
                title={tab.label}
              >
                <span class={styles.tabIconWrap}>
                  {tab.icon}
                </span>
                <span class={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
