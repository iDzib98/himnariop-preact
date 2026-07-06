import { useState, useEffect } from 'preact/hooks';
import type { Church } from '../../types/orden';
import { getCurrentUser } from '../../services/authService';
import { getPendingSongsForChurch, approveSongInChurch, rejectSongInChurch, isUserChurchAdmin } from '../../services/cloudSongService';
import { getChurch } from '../../services/churchService';
import { ChevronLeftIcon } from '../ui/Icons';
import styles from './PendingSongsView.module.css';

interface Props {
  churchId: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

export function PendingSongsView({ churchId, onNavigate: _onNavigate, onClose }: Props) {
  const [pending, setPending] = useState<{ songId: string; titulo: string; authorName: string; submittedAt: number }[]>([]);
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    loadData();
  }, [churchId]);

  async function loadData() {
    setLoading(true);
    try {
      const c = await getChurch(churchId);
      setChurch(c);
      if (c && user && isUserChurchAdmin(c, user.uid)) {
        const list = await getPendingSongsForChurch(churchId);
        setPending(list);
      }
    } catch {}
    setLoading(false);
  }

  const handleApprove = async (songId: string) => {
    try {
      await approveSongInChurch(songId, churchId);
      setPending(prev => prev.filter(p => p.songId !== songId));
    } catch (err) {
      alert('Error al aprobar');
    }
  };

  const handleReject = async (songId: string) => {
    try {
      await rejectSongInChurch(songId, churchId);
      setPending(prev => prev.filter(p => p.songId !== songId));
    } catch (err) {
      alert('Error al rechazar');
    }
  };

  const isAdmin = church && user && isUserChurchAdmin(church, user.uid);

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <button class={styles.backBtn} onClick={onClose}>
          <ChevronLeftIcon size={24} />
        </button>
        <h2 class={styles.title}>Aprobaciones pendientes</h2>
        {church && <span class={styles.churchName}>{church.name}</span>}
      </div>

      <div class={styles.body}>
        {loading && <p class={styles.empty}>Cargando...</p>}

        {!loading && !isAdmin && (
          <p class={styles.empty}>No tienes permisos de administrador en esta iglesia.</p>
        )}

        {!loading && isAdmin && pending.length === 0 && (
          <p class={styles.empty}>No hay cantos pendientes de aprobación.</p>
        )}

        {!loading && isAdmin && pending.length > 0 && (
          <div class={styles.list}>
            {pending.map(item => (
              <div key={item.songId} class={styles.card}>
                <div class={styles.cardInfo}>
                  <strong class={styles.cardTitle}>{item.titulo}</strong>
                  <span class={styles.cardAuthor}>por {item.authorName}</span>
                  <span class={styles.cardDate}>{new Date(item.submittedAt).toLocaleDateString('es-MX')}</span>
                </div>
                <div class={styles.cardActions}>
                  <button class={styles.approveBtn} onClick={() => handleApprove(item.songId)}>
                    Aprobar
                  </button>
                  <button class={styles.rejectBtn} onClick={() => handleReject(item.songId)}>
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
