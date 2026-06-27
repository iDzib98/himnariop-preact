import { useState, useEffect, useCallback } from 'preact/hooks';

export type Section = 'himnario' | 'biblia' | 'favoritos' | 'info' | 'configuracion';

export function useHashRoute() {
  const [route, setRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setRoute(hash || 'home');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    window.scrollTo(0, 0);
  }, []);

  const parts = route.split('/');
  const baseRoute = parts[0];

  const hymnNumber = (() => {
    if (baseRoute === 'home' || baseRoute === 'biblia' || baseRoute === 'favoritos' || baseRoute === 'info' || baseRoute === 'configuracion') return null;
    const num = parseInt(baseRoute, 10);
    if (!isNaN(num) && num >= 1 && num <= 706) return num;
    return null;
  })();

  const isHome = baseRoute === 'home' || baseRoute === '' || (hymnNumber === null && baseRoute !== 'biblia' && baseRoute !== 'favoritos' && baseRoute !== 'info' && baseRoute !== 'configuracion');

  const section: Section = (() => {
    if (baseRoute === 'biblia') return 'biblia';
    if (baseRoute === 'favoritos') return 'favoritos';
    if (baseRoute === 'info') return 'info';
    if (baseRoute === 'configuracion') return 'configuracion';
    return 'himnario';
  })();

  const bibleBook = section === 'biblia' && parts.length >= 2 ? decodeURIComponent(parts[1]) : undefined;
  const bibleChapter = section === 'biblia' && parts.length >= 3 ? parseInt(parts[2], 10) : undefined;

  return {
    route,
    navigate,
    isHome,
    hymnNumber,
    section,
    bibleBook,
    bibleChapter,
  };
}
