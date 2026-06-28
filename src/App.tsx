import { useState, useEffect } from 'preact/hooks';
import { storage } from './services/storage';
import { useHashRoute } from './hooks/useHashRoute';
import { useSettings } from './hooks/useSettings';
import { initAuth } from './services/authService';
import { Home } from './components/home/Home';
import { HymnView } from './components/hymn/HymnView';
import { BibleHome } from './components/bible/BibleHome';
import { BibleChapter } from './components/bible/BibleChapter';
import { TabBar } from './components/ui/TabBar';
import { FavoritesView } from './components/settings/FavoritesView';
import { SettingsView } from './components/settings/SettingsView';
import { InfoView } from './components/settings/InfoView';
import { WorshipOrderHome } from './components/orden/WorshipOrderHome';
import { WorshipOrderView } from './components/orden/WorshipOrderView';
import { WorshipOrderEditor } from './components/orden/WorshipOrderEditor';
import { ChurchManagerView } from './components/orden/ChurchManagerView';
import { getReturnTo, setReturnTo } from './services/ordenStorage';
import './styles/reset.css';
import './styles/variables.css';

export function App() {
  const { navigate, section, hymnNumber, bibleBook, bibleChapter, bibleStartVerse, bibleEndVerse, ordenId, ordenEditing, showIglesias, joinChurchCode } = useHashRoute();
  const { theme, fontFamily, fontSize, color } = useSettings();

  const [himnarioSearch, setHimnarioSearch] = useState('');
  const [bibliaSearch, setBibliaSearch] = useState('');
  const [cultosSearch, setCultosSearch] = useState('');
  const [favoritosSearch, setFavoritosSearch] = useState('');

  useEffect(() => {
    storage.initializeDefaults();
    initAuth();
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
    setReturnTo(null);
    navigate(path);
  };

  const handleNavigateNumber = (numero: number) => {
    setReturnTo(null);
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
    if (section === 'orden' && !ordenId && !ordenEditing && !showIglesias) {
      return {
        searchValue: cultosSearch,
        onSearchChange: setCultosSearch,
        searchPlaceholder: 'Buscar culto...',
        showSearch: true,
      };
    }
    if (section === 'favoritos') {
      return {
        searchValue: favoritosSearch,
        onSearchChange: setFavoritosSearch,
        searchPlaceholder: 'Buscar favorito...',
        showSearch: true,
      };
    }
    return { showSearch: false };
  };

  const returnTo = getReturnTo();

  const renderContent = () => {
    switch (section) {
      case 'biblia':
        if (bibleBook && bibleChapter) {
          return (
            <BibleChapter
              bookId={bibleBook}
              chapter={bibleChapter}
              onNavigate={handleNavigate}
              returnTo={returnTo || undefined}
              startVerse={bibleStartVerse}
              endVerse={bibleEndVerse}
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

      case 'orden':
        if (showIglesias) {
          return <ChurchManagerView onNavigate={handleNavigate} initialJoinCode={joinChurchCode} />;
        }
        if (ordenEditing && ordenId) {
          return <WorshipOrderEditor orderId={ordenId} onNavigate={handleNavigate} />;
        }
        if (ordenId) {
          return <WorshipOrderView orderId={ordenId} onNavigate={handleNavigate} />;
        }
        return <WorshipOrderHome onNavigate={handleNavigate} searchQuery={cultosSearch} onSearchChange={setCultosSearch} />;

      case 'favoritos':
        return <FavoritesView onNavigate={handleNavigate} searchQuery={favoritosSearch} onSearchChange={setFavoritosSearch} />;

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
              returnTo={returnTo || undefined}
            />
          );
        }
        return (
          <Home
            searchQuery={himnarioSearch}
            onSearchChange={setHimnarioSearch}
            onNavigate={handleNavigateNumber}
          />
        );
    }
  };

  const hideNav = (section === 'himnario' && hymnNumber !== null) || (section === 'biblia' && bibleBook && bibleChapter) || (section === 'orden' && !!ordenId);

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
