import { useState, useEffect } from 'preact/hooks';
import { getHimno } from '../../services/api';
import { storage } from '../../services/storage';
import { cacheService } from '../../services/cache';
import type { Himno } from '../../types/himno';
import { useSettings } from '../../hooks/useSettings';
import { useFavorites } from '../../hooks/useFavorites';
import { AudioPlayer } from './AudioPlayer';
import { PdfViewer } from './PdfViewer';
import { TvMode } from './TvMode';
import {
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  StarFilledIcon,
  TvIcon,
  QueueMusicIcon,
  PrintIcon,
  ShareIcon,
  CloseIcon
} from '../ui/Icons';
import styles from './HymnView.module.css';

interface HymnViewProps {
  numero: number;
  onNavigateHome: () => void;
  returnTo?: string;
}

export function HymnView({ numero, onNavigateHome, returnTo }: HymnViewProps) {
  const [himno, setHimno] = useState<Himno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [showTv, setShowTv] = useState(false);
  const { color, theme } = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    storage.himnoActual = numero;

    getHimno(numero)
      .then(h => {
        if (h) {
          setHimno(h);
          cacheService.cacheHimnoMedia(numero).catch(() => {});
        } else {
          setError(`Himno ${numero} no encontrado`);
        }
      })
      .catch((err) => {
        console.error('[HymnView] Error loading:', err);
        setError('Error al cargar el himno');
      })
      .finally(() => setLoading(false));
  }, [numero]);

  if (loading) {
    return (
      <div class={styles.container} data-theme={theme}>
        <div class={styles.loading}>Cargando...</div>
      </div>
    );
  }

  if (error || !himno) {
    return (
      <div class={styles.container} data-theme={theme}>
        <header class={`${styles.header} ${styles[color]}`}>
          <button class={styles.iconBtn} onClick={() => returnTo ? (window.location.hash = returnTo) : onNavigateHome()} title={returnTo ? 'Cerrar' : 'Inicio'}>
            {returnTo ? <CloseIcon size={24} /> : <HomeIcon size={24} />}
          </button>
        </header>
        <div class={styles.error}>{error || 'Himno no encontrado'}</div>
      </div>
    );
  }

  if (showTv) {
    return <TvMode himno={himno} onClose={() => setShowTv(false)} color={color} theme={theme} />;
  }

  if (showPdf) {
    return <PdfViewer numero={himno.numero} onClose={() => setShowPdf(false)} color={color} theme={theme} />;
  }

  const favorite = isFavorite(himno.numero);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Himno ${himno.numero}. ${himno.titulo}`,
          text: `Himno ${himno.numero}. ${himno.titulo}`,
          url: window.location.href
        });
      } catch (e) {
        // User cancelled or share failed
      }
    }
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles[color]}`}>
        <div class={styles.headerLeft}>
          <button class={styles.iconBtn} onClick={() => returnTo ? (window.location.hash = returnTo) : onNavigateHome()} title={returnTo ? 'Cerrar' : 'Inicio'}>
            {returnTo ? <CloseIcon size={24} /> : <HomeIcon size={24} />}
          </button>
        </div>
        <div class={styles.headerCenter}>
          <button
            class={styles.navBtn}
            disabled={himno.numero <= 1 || !!returnTo}
            onClick={() => window.location.hash = String(himno.numero - 1)}
          >
            <ChevronLeftIcon size={28} />
          </button>
          <span class={styles.hymnNumber}>{himno.numero}</span>
          <button
            class={styles.navBtn}
            disabled={himno.numero >= 706 || !!returnTo}
            onClick={() => window.location.hash = String(himno.numero + 1)}
          >
            <ChevronRightIcon size={28} />
          </button>
        </div>
        <div class={styles.headerRight}>
          <button
            class={`${styles.iconBtn} ${favorite ? styles.favorite : ''}`}
            onClick={() => toggleFavorite(himno.numero)}
            title={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            {favorite ? <StarFilledIcon size={24} /> : <StarIcon size={24} />}
          </button>
        </div>
      </header>

      <main class={styles.main}>
        <h1 class={styles.title}>Himno {himno.numero}. {himno.titulo}</h1>

        <div class={styles.actionButtons} data-print-hide>
          <button class={`${styles.actionBtn} ${styles.deepOrange}`} onClick={() => setShowTv(true)} title="Modo TV">
            <TvIcon size={24} />
          </button>
          <button class={`${styles.actionBtn} ${styles.green}`} onClick={() => setShowPdf(true)} title="Partitura">
            <QueueMusicIcon size={24} />
          </button>
          <button class={`${styles.actionBtn} ${styles.blue}`} onClick={() => window.print()} title="Imprimir">
            <PrintIcon size={24} />
          </button>
          <button class={`${styles.actionBtn} ${styles.indigo}`} onClick={handleShare} title="Compartir">
            <ShareIcon size={24} />
          </button>
        </div>

        <p class={styles.intro}>{himno.intro}</p>

        {himno.referencias.length > 0 && (
          <ul class={styles.references}>
            {himno.referencias.map((ref, i) => (
              <li key={i} class={`${styles.reference} ${styles[color]}-text`}>{ref}</li>
            ))}
          </ul>
        )}

        <div class={styles.verses}>
          {himno.versos.map((verso, i) => (
            <div key={i} class={styles.verse}>
              <h3 class={`${styles.verseName} ${styles[color]}-text`}>{verso.nombre}</h3>
              <ul class={styles.lines}>
                {verso.lineas.map((linea, j) => (
                  <li key={j} class={styles.line}>{linea}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {himno.autores.length > 0 && (
          <ul class={styles.authors}>
            {himno.autores.map((autor, i) => (
              <li key={i} class={styles.author}>{autor}</li>
            ))}
          </ul>
        )}

        <div class={styles.spacer} />
      </main>

      <AudioPlayer key={himno.numero} himnoNumero={himno.numero} color={color} theme={theme} />
    </div>
  );
}
