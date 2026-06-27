import { useState, useEffect } from 'preact/hooks';
import { storage } from './services/storage';
import { useHashRoute } from './hooks/useHashRoute';
import { useSettings } from './hooks/useSettings';
import { Home } from './components/home/Home';
import { HymnView } from './components/hymn/HymnView';
import { SettingsModal } from './components/settings/SettingsModal';
import { FavoritesModal } from './components/settings/FavoritesModal';
import { InfoModal } from './components/settings/InfoModal';
import { CacheManagerModal } from './components/settings/CacheManagerModal';
import './styles/reset.css';
import './styles/variables.css';

export function App() {
  const { navigate, isHome, hymnNumber } = useHashRoute();
  const { theme, fontFamily, fontSize } = useSettings();

  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showCache, setShowCache] = useState(false);

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

  const handleNavigate = (numero: number) => {
    navigate(String(numero));
  };

  const handleNavigateHome = () => {
    navigate('home');
  };

  return (
    <>
      {isHome ? (
        <Home
          onNavigate={handleNavigate}
          onOpenSettings={() => setShowSettings(true)}
          onOpenFavorites={() => setShowFavorites(true)}
          onOpenInfo={() => setShowInfo(true)}
        />
      ) : hymnNumber !== null ? (
        <HymnView
          numero={hymnNumber}
          onNavigateHome={handleNavigateHome}
        />
      ) : (
        <Home
          onNavigate={handleNavigate}
          onOpenSettings={() => setShowSettings(true)}
          onOpenFavorites={() => setShowFavorites(true)}
          onOpenInfo={() => setShowInfo(true)}
        />
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <FavoritesModal isOpen={showFavorites} onClose={() => setShowFavorites(false)} onNavigate={handleNavigate} />
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      <CacheManagerModal isOpen={showCache} onClose={() => setShowCache(false)} />
    </>
  );
}
