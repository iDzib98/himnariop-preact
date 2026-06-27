import { useState, useEffect } from 'preact/hooks';
import { storage } from './services/storage';
import { useHashRoute } from './hooks/useHashRoute';
import { useSettings } from './hooks/useSettings';
import { Home } from './components/home/Home';
import { HymnView } from './components/hymn/HymnView';
import { BibleHome } from './components/bible/BibleHome';
import { BibleChapter } from './components/bible/BibleChapter';
import { TabBar } from './components/ui/TabBar';
import { FavoritesView } from './components/settings/FavoritesView';
import { SettingsView } from './components/settings/SettingsView';
import { InfoView } from './components/settings/InfoView';
import './styles/reset.css';
import './styles/variables.css';

export function App() {
  const { navigate, section, hymnNumber, bibleBook, bibleChapter } = useHashRoute();
  const { theme, fontFamily, fontSize, color } = useSettings();

  const [himnarioSearch, setHimnarioSearch] = useState('');
  const [bibliaSearch, setBibliaSearch] = useState('');

  useEffect(() => {
    storage.initializeDefaults();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    const fontFamilyMap: Record<string, string> = {
      'serif': 'var(--font-family-serif)',
      'sans-serif': 'var(--font-family-sans)',
      'monospace': 'var(--font-family-mono)'
    };
    document.documentElement.style.setProperty('--font-family', fontFamilyMap[fontFamily] || fontFamilyMap['sans-serif']);
    document.body.className = fontSize;

    const fontSizeMap: Record<string, string> = {
      'small': '12px',
      'medium': '16px',
      'large': '18px',
      'x-large': '24px',
      'xx-large': '32px'
    };
    document.documentElement.style.fontSize = fontSizeMap[fontSize] || '16px';
  }, [theme, fontFamily, fontSize]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleNavigateNumber = (numero: number) => {
    navigate(String(numero));
  };

  const getSearchProps = () => {
    if (section === 'himnario' && hymnNumber === null) {
      return {
        searchValue: himnarioSearch,
        onSearchChange: setHimnarioSearch,
        searchPlaceholder: 'Buscar himno o por número...',
        showSearch: true,
      };
    }
    if (section === 'biblia' && !bibleChapter) {
      return {
        searchValue: bibliaSearch,
        onSearchChange: setBibliaSearch,
        searchPlaceholder: 'Buscar libro...',
        showSearch: true,
      };
    }
    return { showSearch: false };
  };

  const renderContent = () => {
    switch (section) {
      case 'biblia':
        if (bibleBook && bibleChapter) {
          return (
            <BibleChapter
              bookId={bibleBook}
              chapter={bibleChapter}
              onNavigate={handleNavigate}
            />
          );
        }
        return (
          <BibleHome
            searchQuery={bibliaSearch}
            onSearchChange={setBibliaSearch}
            onNavigate={handleNavigate}
          />
        );

      case 'favoritos':
        return <FavoritesView onNavigate={handleNavigate} />;

      case 'info':
        return <InfoView onNavigate={handleNavigate} />;

      case 'configuracion':
        return <SettingsView onNavigate={handleNavigate} />;

      case 'himnario':
      default:
        if (hymnNumber !== null) {
          return (
            <HymnView
              numero={hymnNumber}
              onNavigateHome={() => handleNavigate('home')}
            />
          );
        }
        return (
          <Home
            searchQuery={himnarioSearch}
            onSearchChange={setHimnarioSearch}
            onNavigate={handleNavigateNumber}
            onOpenFavorites={() => handleNavigate('favoritos')}
          />
        );
    }
  };

  const hideNav = (section === 'himnario' && hymnNumber !== null) || (section === 'biblia' && bibleBook && bibleChapter);

  return (
    <>
      {!hideNav && (
        <TabBar
          section={section}
          color={color}
          onNavigate={handleNavigate}
          {...getSearchProps()}
        />
      )}
      {renderContent()}
    </>
  );
}
