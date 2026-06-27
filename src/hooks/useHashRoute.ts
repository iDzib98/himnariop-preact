import { useState, useEffect, useCallback } from 'preact/hooks';

export function useHashRoute() {
  const [route, setRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setRoute(hash || 'home');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  const isHome = route === 'home' || route === '';
  const hymnNumber = isHome ? null : parseInt(route, 10);

  if (!isHome && (isNaN(hymnNumber!) || hymnNumber! < 1 || hymnNumber! > 706)) {
    return {
      route,
      navigate,
      isHome: true,
      hymnNumber: null
    };
  }

  return {
    route,
    navigate,
    isHome,
    hymnNumber
  };
}
