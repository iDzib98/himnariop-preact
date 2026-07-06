import { useState, useEffect, useRef } from 'preact/hooks';
import type { UserSong } from '../../types/himno';
import { getUserSong, deleteUserSong } from '../../services/userSongStorage';
import { getCloudSong, deleteCloudSong } from '../../services/cloudSongService';
import { getCurrentUser } from '../../services/authService';
import { isFavorite, toggleFavorite } from '../../services/favoritesService';
import { useSettings } from '../../hooks/useSettings';
import {
  HomeIcon,
  TvIcon,
  QueueMusicIcon,
  PrintIcon,
  ShareIcon,
  EditIcon,
  DeleteIcon,
  StarIcon,
  StarFilledIcon,
  MoreIcon,
} from '../ui/Icons';
import { ShareSongDialog } from './ShareSongDialog';
import { UserSongPdfViewer } from './UserSongPdfViewer';
import { UserSongAudioPlayer } from './UserSongAudioPlayer';
import styles from './UserSongView.module.css';

interface UserSongViewProps {
  songId: string;
  onNavigate: (path: string) => void;
}

export function UserSongView({ songId, onNavigate }: UserSongViewProps) {
  const [song, setSong] = useState<UserSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { color, theme } = useSettings();
  const user = getCurrentUser();

  useEffect(() => {
    loadSong();
    setIsFav(isFavorite(songId));
  }, [songId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadSong() {
    setLoading(true);
    setError(null);

    const local = getUserSong(songId);
    if (local) {
      setSong(local);
      setLoading(false);
      return;
    }

    try {
      const cloud = await getCloudSong(songId);
      if (cloud) {
        setSong(cloud);
      } else {
        setError('Canto no encontrado');
      }
    } catch (err) {
      console.error('Error loading song:', err);
      setError('Error al cargar el canto');
    }
    setLoading(false);
  }

  const isOwner = song && (song.ownerId === '' || song.ownerId === user?.uid);

  if (loading) {
    return (
      <div class={styles.container} data-theme={theme}>
        <div class={styles.loading}>Cargando...</div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div class={styles.container} data-theme={theme}>
        <header class={`${styles.header} ${styles[color]}`}>
          <button class={styles.iconBtn} onClick={() => onNavigate('home')}>
            <HomeIcon size={24} />
          </button>
        </header>
        <div class={styles.error}>{error || 'Canto no encontrado'}</div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!song) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este canto? Esta acción no se puede deshacer.')) return;
    try {
      deleteUserSong(song.id);
      if (user) {
        try {
          await deleteCloudSong(song.id);
        } catch {
          console.error('Cloud delete failed');
        }
      }
      onNavigate('home');
    } catch (err) {
      alert('Error al eliminar');
    }
    setShowMenu(false);
  };

  const handleToggleFavorite = () => {
    const newState = toggleFavorite(songId);
    setIsFav(newState);
  };

  return (
    <div class={styles.container} data-theme={theme}>
      {showShare && song && (
        <ShareSongDialog song={song} onClose={() => setShowShare(false)} isOwner={!!isOwner} />
      )}
      {showPdf && song && song.pdfUrl && (
        <UserSongPdfViewer pdfUrl={song.pdfUrl} onClose={() => setShowPdf(false)} color={color} />
      )}
      <header class={`${styles.header} ${styles[color]}`}>
        <div class={styles.headerLeft}>
          <button class={styles.iconBtn} onClick={() => onNavigate('home')} title="Inicio">
            <HomeIcon size={24} />
          </button>
        </div>
        <div class={styles.headerRight}>
          <button
            class={`${styles.iconBtn} ${isFav ? styles.favorite : ''}`}
            onClick={handleToggleFavorite}
            title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            {isFav ? <StarFilledIcon size={24} /> : <StarIcon size={24} />}
          </button>
          {isOwner && (
            <div class={styles.menuContainer} ref={menuRef}>
              <button
                class={styles.iconBtn}
                onClick={() => setShowMenu(!showMenu)}
                title="Más opciones"
              >
                <MoreIcon size={24} />
              </button>
              {showMenu && (
                <div class={styles.menuDropdown}>
                  <button class={styles.menuItem} onClick={() => { onNavigate(`canto/${song.id}/editar`); setShowMenu(false); }}>
                    <EditIcon size={18} />
                    <span>Editar</span>
                  </button>
                  <button class={`${styles.menuItem} ${styles.deleteMenuItem}`} onClick={handleDelete}>
                    <DeleteIcon size={18} />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main class={styles.main}>
        <h1 class={styles.title}>{song.titulo}</h1>

        <div class={styles.actionButtons} data-print-hide>
          <button
            class={`${styles.actionBtn} ${styles.deepOrange}`}
            onClick={() => onNavigate(`canto/${song.id}/tv`)}
            title="Modo TV"
          >
            <TvIcon size={24} />
          </button>
          {song.pdfUrl && (
            <button
              class={`${styles.actionBtn} ${styles.green}`}
              onClick={() => setShowPdf(true)}
              title="Partitura"
            >
              <QueueMusicIcon size={24} />
            </button>
          )}
          <button class={`${styles.actionBtn} ${styles.blue}`} onClick={() => window.print()} title="Imprimir">
            <PrintIcon size={24} />
          </button>
          <button class={`${styles.actionBtn} ${styles.indigo}`} onClick={() => setShowShare(true)} title="Compartir">
            <ShareIcon size={24} />
          </button>
        </div>

        {song.intro && <p class={styles.intro}>{song.intro}</p>}

        {song.referencias.length > 0 && (
          <ul class={styles.references}>
            {song.referencias.map((ref, i) => (
              <li key={i} class={`${styles.reference} ${styles[`${color}-text`]}`}>{ref}</li>
            ))}
          </ul>
        )}

        <div class={styles.verses}>
          {song.versos.map((verso, i) => (
            <div key={i} class={styles.verse}>
              <h3 class={`${styles.verseName} ${styles[`${color}-text`]}`}>{verso.nombre}</h3>
              <ul class={styles.lines}>
                {verso.lineas.map((linea, j) => (
                  <li key={j} class={styles.line}>{linea}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {song.autores.length > 0 && (
          <ul class={styles.authors}>
            {song.autores.map((autor, i) => (
              <li key={i} class={styles.author}>{autor}</li>
            ))}
          </ul>
        )}

        <div class={styles.spacer} />
      </main>

      {song.audioUrl && (
        <UserSongAudioPlayer audioUrl={song.audioUrl} color={color} />
      )}
    </div>
  );
}
