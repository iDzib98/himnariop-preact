import { useState, useEffect } from 'preact/hooks';
import type { UserSong } from '../../types/himno';
import type { Church } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { getCurrentUser, signInWithGoogle, onAuthChange } from '../../services/authService';
import { getUserChurches, getChurch } from '../../services/churchService';
import { shareSongToChurch, unshareSongFromChurch, saveSongToCloud, getCloudSong, duplicateSongToMySongs } from '../../services/cloudSongService';
import { saveUserSong, getUserSong } from '../../services/userSongStorage';
import { CloseIcon, GoogleIcon, ShareIcon } from '../ui/Icons';
import styles from './ShareSongDialog.module.css';

function QRBox({ url, title, color }: { url: string; title: string; color: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div class={styles.qrContainer}>
        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
          alt="QR" class={styles.qrImage} />
      </div>
      <div class={styles.linkBox}>
        <input class={styles.linkInput} value={url} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
      </div>
      <div class={styles.linkActions}>
        <button class={`${styles.linkActionBtn} ${styles[color]}`} onClick={() => {
          if (navigator.share) {
            navigator.share({ title, url }).catch(() => {});
          }
        }}>
          <ShareIcon size={16} /> Compartir
        </button>
        <button class={`${styles.linkActionBtn} ${styles[color]}`} onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}>
          <CopyIcon size={16} /> {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </>
  );
}

function CopyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

interface Props {
  song: UserSong;
  onClose: () => void;
  isOwner: boolean;
}

export function ShareSongDialog({ song, onClose, isOwner }: Props) {
  const [user, setUser] = useState(getCurrentUser());
  const [userChurches, setUserChurches] = useState<Church[]>([]);
  const [sharedChurches, setSharedChurches] = useState<Set<string>>(
    new Set([...(song.approvedChurches || []), ...(song.pendingChurches || [])])
  );
  const [isPublic, setIsPublic] = useState(song.isPublic);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const alreadyShared = song.isPublic || (song.approvedChurches && song.approvedChurches.length > 0);
  const [step, setStep] = useState<'login' | 'share'>(
    getCurrentUser() || alreadyShared ? 'share' : 'login'
  );
  const [churchName, setChurchName] = useState<string>('');
  const [isInMySongs, setIsInMySongs] = useState(!!getUserSong(song.id));
  const { color } = useSettings();

  const handleSaveToMySongs = async () => {
    if (!user || !song) return;
    setSaving(true);
    try {
      await duplicateSongToMySongs(song, user.uid, user.displayName || user.email || '');
      setIsInMySongs(true);
      alert('Canto guardado en Mis cantos.');
    } catch (err) {
      alert('Error al guardar');
    }
    setSaving(false);
  };

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      if (u && step === 'login' && !alreadyShared) setStep('share');
    });
  }, [step, alreadyShared]);

  useEffect(() => {
    getCloudSong(song.id).then(cloudSong => {
      if (cloudSong) {
        setSharedChurches(new Set([
          ...(cloudSong.approvedChurches || []),
          ...(cloudSong.pendingChurches || [])
        ]));
      }
    });
  }, [song.id]);

  useEffect(() => {
    if (user) {
      getUserChurches(user.uid).then(setUserChurches);
    }
  }, [user]);

  useEffect(() => {
    if (!song.isPublic && song.approvedChurches && song.approvedChurches.length > 0) {
      getChurch(song.approvedChurches[0]).then(church => {
        if (church) setChurchName(church.name);
      });
    }
  }, [song.isPublic, song.approvedChurches]);

  const handleToggleChurch = async (churchId: string, church: Church) => {
    if (!user || toggling) return;
    setToggling(churchId);
    try {
      if (sharedChurches.has(churchId)) {
        await unshareSongFromChurch(song.id, churchId);
        setSharedChurches(prev => {
          const next = new Set(prev);
          next.delete(churchId);
          return next;
        });
      } else {
        await shareSongToChurch(
          song.id,
          churchId,
          church.name || churchId,
          user.displayName || user.email || '',
          song.titulo,
          user.uid
        );
        setSharedChurches(prev => new Set([...prev, churchId]));
      }
    } catch (err: any) {
      alert('Error: ' + (err.message || 'desconocido'));
    }
    setToggling(null);
  };

  const togglePublic = async () => {
    if (!user || !isOwner) return;
    setSaving(true);
    try {
      const updated = { ...song, isPublic: !isPublic, updatedAt: Date.now() };
      await saveSongToCloud(updated, user.uid);
      saveUserSong(updated);
      setIsPublic(!isPublic);
    } catch (err: any) {
      alert('Error al actualizar: ' + (err.message || 'desconocido'));
    }
    setSaving(false);
  };

  const publicUrl = `${window.location.origin}/#canto/${song.id}`;
  const churchUrl = song.approvedChurches && song.approvedChurches.length > 0
    ? `${window.location.origin}/#iglesia/${song.approvedChurches[0]}`
    : '';

  return (
    <div class={styles.overlay} onClick={onClose}>
      <div class={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div class={styles.header}>
          <h2 class={styles.title}>Compartir canto</h2>
          <button class={styles.closeBtn} onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div class={styles.body}>
          {step === 'login' ? (
            <div class={styles.loginStep}>
              <ShareIcon size={48} />
              <p>Inicia sesión para compartir este canto</p>
              <button class={`${styles.googleBtn}`} onClick={() => signInWithGoogle()}>
                <GoogleIcon size={20} /> Iniciar sesión con Google
              </button>
            </div>
          ) : (
            <>
              <p class={styles.songName}>{song.titulo}</p>

              {!isOwner && !isInMySongs && (
                <div class={styles.section}>
                  {user ? (
                    <button class={styles.shareBtn} onClick={handleSaveToMySongs} disabled={saving}>
                      <span style={{ fontSize: 16, fontWeight: 'bold' }}>+</span> Guardar en Mis cantos
                    </button>
                  ) : (
                    <div class={styles.loginPrompt}>
                      <span>Inicia sesión para guardar en Mis cantos</span>
                      <button class={styles.googleBtn} onClick={() => signInWithGoogle()}>
                        <GoogleIcon size={16} /> Iniciar sesión
                      </button>
                    </div>
                  )}
                </div>
              )}

              {song.isPublic && (
                <div class={styles.section}>
                  <label class={styles.sectionTitle}>Enlace público</label>
                  <div class={styles.publicSection}>
                    <QRBox url={publicUrl} title={song.titulo} color={color} />
                  </div>
                </div>
              )}

              {!song.isPublic && song.approvedChurches && song.approvedChurches.length > 0 && (
                <div class={styles.section}>
                  <label class={styles.sectionTitle}>Compartido en iglesia</label>
                  <div class={styles.publicSection}>
                    <QRBox url={churchUrl} title={churchName || 'Iglesia'} color={color} />
                  </div>
                </div>
              )}

              {isOwner && user && (
                <div class={styles.section}>
                  <label class={styles.sectionTitle}>Configuración</label>
                  <label class={styles.toggleRow}>
                    <input type="checkbox" checked={isPublic} onChange={togglePublic} disabled={saving} />
                    <span>Compartir como público</span>
                  </label>
                </div>
              )}

              {isOwner && user && userChurches.length > 0 && (
                <div class={styles.section}>
                  <label class={styles.sectionTitle}>Compartir en iglesia</label>
                  {userChurches.map(c => (
                    <label key={c.id} class={styles.toggleRow}>
                      <input
                        type="checkbox"
                        checked={sharedChurches.has(c.id)}
                        onChange={() => handleToggleChurch(c.id, c)}
                        disabled={toggling !== null}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
